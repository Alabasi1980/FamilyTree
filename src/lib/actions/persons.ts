"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createNotifications, getActiveFamilyAdminUserIds, getSystemAdminUserIds, requestFocusHref } from "@/lib/notifications";
import type { ParentChildRelationType, RelationConfidence } from "@/generated/prisma/client";

const currentYear = new Date().getFullYear();

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional()
  );

const optionalYear = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  },
  z.number().int().min(1).max(currentYear + 1).optional()
);

const optionalDateText = optionalText(20);
const visibilitySchema = z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]);
const defaultVisibilityForGender = (gender: "MALE" | "FEMALE") => (gender === "FEMALE" ? "ADMIN" : "PUBLIC");

const personSchema = z.object({
  familyId: z.string().cuid(),
  fullName: z.string().min(2).max(200),
  kunya: optionalText(80),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthYear: optionalYear,
  birthDate: optionalDateText,
  birthPlace: optionalText(160),
  deathYear: optionalYear,
  deathDate: optionalDateText,
  bloodType: optionalText(12),
  residenceCity: optionalText(120),
  address: optionalText(240),
  profession: optionalText(120),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  photoUrl: optionalText(500),
  visibilityLevel: visibilitySchema.optional(),
});

export type PersonActionResult =
  | { success: true; personId: string; warnings?: string[] }
  | { success: false; error: string };

type ParsedPersonInput = z.infer<typeof personSchema>;

function normalizePersonInput(data: ParsedPersonInput) {
  const birthYear = data.birthYear ?? (data.birthDate ? new Date(data.birthDate).getFullYear() : null);
  const deathYear = data.deathYear ?? (data.deathDate ? new Date(data.deathDate).getFullYear() : null);
  return {
    ...data,
    birthYear,
    deathYear,
    isLiving: deathYear || data.deathDate ? false : data.isLiving,
    visibilityLevel: data.visibilityLevel ?? defaultVisibilityForGender(data.gender),
  };
}

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

export async function recomputeFamilyAncestry(familyId: string) {
  // Include primary members + secondary members via PersonFamilyMembership.
  // This ensures mahram detection works correctly across family boundaries.
  const [primaryPersons, secondaryMemberships] = await Promise.all([
    db.person.findMany({
      where: { familyId, deletedAt: null },
      select: { id: true },
    }),
    db.personFamilyMembership.findMany({
      where: { familyId },
      select: { personId: true },
    }),
  ]);

  const personIds = [
    ...new Set([
      ...primaryPersons.map((p) => p.id),
      ...secondaryMemberships.map((m) => m.personId),
    ]),
  ];
  if (personIds.length === 0) return;

  const relations = await db.parentChildRelation.findMany({
    where: {
      parentPersonId: { in: personIds },
      childPersonId: { in: personIds },
      relationType: "BIOLOGICAL",
    },
    select: { parentPersonId: true, childPersonId: true },
  });

  const parentsOf = new Map<string, string[]>();
  for (const id of personIds) parentsOf.set(id, []);
  for (const relation of relations) {
    parentsOf.get(relation.childPersonId)?.push(relation.parentPersonId);
  }

  const ancestryRows: Array<{ ancestorId: string; descendantId: string; depth: number }> = [];
  for (const descendantId of personIds) {
    ancestryRows.push({ ancestorId: descendantId, descendantId, depth: 0 });

    const queue = (parentsOf.get(descendantId) ?? []).map((id) => ({ id, depth: 1 }));
    const bestDepth = new Map<string, number>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      const previousDepth = bestDepth.get(current.id);
      if (previousDepth !== undefined && previousDepth <= current.depth) continue;

      bestDepth.set(current.id, current.depth);
      for (const parentId of parentsOf.get(current.id) ?? []) {
        queue.push({ id: parentId, depth: current.depth + 1 });
      }
    }

    for (const [ancestorId, depth] of bestDepth) {
      ancestryRows.push({ ancestorId, descendantId, depth });
    }
  }

  await db.$transaction([
    db.personAncestry.deleteMany({
      where: {
        OR: [
          { ancestorId: { in: personIds } },
          { descendantId: { in: personIds } },
        ],
      },
    }),
    db.personAncestry.createMany({ data: ancestryRows, skipDuplicates: true }),
  ]);
}

async function wouldCreateCycle(parentId: string, childId: string, familyIds: string[]) {
  if (parentId === childId) return true;

  const [familyPersons, secondaryMemberships] = await Promise.all([
    db.person.findMany({
      where: { familyId: { in: familyIds }, deletedAt: null },
      select: { id: true },
    }),
    db.personFamilyMembership.findMany({
      where: { familyId: { in: familyIds } },
      select: { personId: true },
    }),
  ]);
  const familyPersonIds = [
    ...new Set([
      parentId,
      childId,
      ...familyPersons.map((p) => p.id),
      ...secondaryMemberships.map((m) => m.personId),
    ]),
  ];

  const relations = await db.parentChildRelation.findMany({
    where: {
      parentPersonId: { in: familyPersonIds },
      childPersonId: { in: familyPersonIds },
    },
    select: { parentPersonId: true, childPersonId: true },
  });

  const childrenOf = new Map<string, string[]>();
  for (const id of familyPersonIds) childrenOf.set(id, []);
  for (const relation of relations) {
    childrenOf.get(relation.parentPersonId)?.push(relation.childPersonId);
  }

  const queue = [childId];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === parentId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of childrenOf.get(current) ?? []) queue.push(next);
  }

  return false;
}

async function validateParentSlot(parentId: string, childId: string) {
  const parent = await db.person.findUnique({
    where: { id: parentId },
    select: { gender: true },
  });
  if (!parent) return "الوالد غير موجود";

  const existingParents = await db.parentChildRelation.findMany({
    where: {
      childPersonId: childId,
      parentPersonId: { not: parentId },
      parent: { deletedAt: null },
    },
    include: {
      parent: { select: { gender: true } },
    },
  });

  if (existingParents.length >= 2) return "لا يمكن تسجيل أكثر من والدين في النموذج الحالي";
  if (existingParents.some((row) => row.parent.gender === parent.gender)) {
    return "يوجد والد/والدة من نفس الجنس مسجل لهذا الشخص";
  }

  return null;
}

async function notifyEditRequestSubmitted({
  requestId,
  familyId,
  submittedByUserId,
  title,
}: {
  requestId: string;
  familyId: string;
  submittedByUserId: string;
  title: string;
}) {
  const [family, familyAdmins, systemAdmins] = await Promise.all([
    db.family.findUnique({ where: { id: familyId }, select: { name: true } }),
    getActiveFamilyAdminUserIds(familyId),
    getSystemAdminUserIds(),
  ]);

  await createNotifications([...familyAdmins, ...systemAdmins].filter((userId) => userId !== submittedByUserId), {
    type: "REQUEST_SUBMITTED",
    title,
    body: `طلب متعلق بعائلة ${family?.name ?? "غير محددة"} ينتظر المراجعة.`,
    href: requestFocusHref(requestId),
    metadata: { requestId, familyId },
  });
}

async function validateNewParentSlot(childId: string, gender: "MALE" | "FEMALE") {
  const existingParents = await db.parentChildRelation.findMany({
    where: { childPersonId: childId, parent: { deletedAt: null } },
    include: {
      parent: { select: { gender: true } },
    },
  });

  if (existingParents.length >= 2) return "لا يمكن تسجيل أكثر من والدين في النموذج الحالي";
  if (existingParents.some((row) => row.parent.gender === gender)) {
    return "يوجد والد/والدة من نفس الجنس مسجل لهذا الشخص";
  }

  return null;
}

export async function createPerson(rawData: unknown): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const parsed = personSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = normalizePersonInput(parsed.data);

  // Validate internal date consistency before writing
  const { validatePersonChronology } = await import("@/lib/domain/family-rules/chronology-validators");
  const chronoResult = validatePersonChronology(data);
  if (chronoResult.status === "PROHIBITED") {
    return { success: false, error: chronoResult.message };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (!(await canManageFamily(session.user.id, data.familyId, isAdmin))) {
    // Non-admin: create edit request instead
    const request = await db.editRequest.create({
      data: {
        requestType: "ADD_PERSON",
        targetType: "PERSON",
        familyId: data.familyId,
        submittedByUserId: session.user.id,
        payloadJson: toJsonPayload(data),
      },
    });
    await notifyEditRequestSubmitted({
      requestId: request.id,
      familyId: data.familyId,
      submittedByUserId: session.user.id,
      title: "طلب إضافة فرد جديد",
    });
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/notifications");
    return { success: true, personId: "" };
  }

  const person = await db.person.create({
    data: {
      familyId: data.familyId,
      fullName: data.fullName,
      kunya: data.kunya ?? null,
      gender: data.gender,
      isLiving: data.isLiving,
      birthYear: data.birthYear,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      birthPlace: data.birthPlace ?? null,
      deathYear: data.deathYear,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      bloodType: data.bloodType ?? null,
      residenceCity: data.residenceCity ?? null,
      address: data.address ?? null,
      profession: data.profession ?? null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
      visibilityLevel: data.visibilityLevel,
    },
  });

  // Update PersonAncestry: self-reference (depth 0)
  await db.personAncestry.create({
    data: { ancestorId: person.id, descendantId: person.id, depth: 0 },
  });

  revalidatePath(`/dashboard/families/${data.familyId}`);
  revalidatePath(`/family/${data.familyId}`);
  return { success: true, personId: person.id };
}

export async function addParentChildRelation(
  parentId: string,
  childId: string,
  options?: {
    relationType?: ParentChildRelationType;
    confidence?: RelationConfidence;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const child = await db.person.findUnique({ where: { id: childId } });
  const parent = await db.person.findUnique({ where: { id: parentId } });
  if (!child) return { success: false, error: "الشخص غير موجود" };

  if (!parent || parent.deletedAt || child.deletedAt) {
    return { success: false, error: "الشخص غير موجود" };
  }

  const isCrossFamily = parent.familyId !== child.familyId;
  const relationType = options?.relationType ?? "BIOLOGICAL";
  const confidence = options?.confidence ?? "VERIFIED";

  if (relationType === "BIOLOGICAL") {
    const parentSlotError = await validateParentSlot(parentId, childId);
    if (parentSlotError) return { success: false, error: parentSlotError };

    // Chronology: biological parent must not be younger than child.
    const { validateParentChildChronology } = await import("@/lib/domain/family-rules/chronology-validators");
    const parentChronoResult = await validateParentChildChronology(parentId, childId, db);
    if (parentChronoResult.status === "PROHIBITED") {
      return { success: false, error: parentChronoResult.message };
    }

    if (await wouldCreateCycle(parentId, childId, [...new Set([parent.familyId, child.familyId])])) {
      return { success: false, error: "هذه العلاقة ستنشئ دورة غير صحيحة في النسب" };
    }
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (isCrossFamily) {
    // Cross-family links require managing BOTH families
    const [canManageParentFamily, canManageChildFamily] = await Promise.all([
      canManageFamily(session.user.id, parent.familyId, isAdmin),
      canManageFamily(session.user.id, child.familyId, isAdmin),
    ]);
    if (!canManageParentFamily || !canManageChildFamily) {
      return {
        success: false,
        error: "ربط الوالد من عائلة مختلفة يتطلب صلاحية إدارة كلتا العائلتين",
      };
    }
  } else {
    if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
      return { success: false, error: "لا تملك صلاحية التعديل" };
    }
  }

  // Create parent-child relation
  await db.parentChildRelation.upsert({
    where: { parentPersonId_childPersonId: { parentPersonId: parentId, childPersonId: childId } },
    create: { parentPersonId: parentId, childPersonId: childId, relationType, confidence },
    update: { relationType, confidence },
  });

  // For cross-family links: add secondary memberships so both persons
  // appear in each other's family tree and ancestry is computed correctly.
  if (isCrossFamily) {
    await db.personFamilyMembership.createMany({
      data: [
        { id: `${parentId}-${child.familyId}`, personId: parentId, familyId: child.familyId, role: "CROSS_PARENT" },
        { id: `${childId}-${parent.familyId}`, personId: childId, familyId: parent.familyId, role: "DESCENDANT" },
      ],
      skipDuplicates: true,
    });
    await Promise.all([
      recomputeFamilyAncestry(parent.familyId),
      recomputeFamilyAncestry(child.familyId),
    ]);
    revalidatePath(`/family/${parent.familyId}`);
    revalidatePath(`/family/${child.familyId}`);
  } else {
    await recomputeFamilyAncestry(child.familyId);
    revalidatePath(`/family/${child.familyId}`);
  }

  return { success: true };
}

const updatePersonSchema = z.object({
  fullName: z.string().min(2).max(200),
  kunya: optionalText(80),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthYear: optionalYear,
  birthDate: optionalDateText,
  birthPlace: optionalText(160),
  deathYear: optionalYear,
  deathDate: optionalDateText,
  bloodType: optionalText(12),
  residenceCity: optionalText(120),
  address: optionalText(240),
  profession: optionalText(120),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  photoUrl: optionalText(500),
  visibilityLevel: visibilitySchema.optional(),
});

type ParsedUpdatePersonInput = z.infer<typeof updatePersonSchema>;

function normalizeUpdatePersonInput(data: ParsedUpdatePersonInput) {
  const birthYear = data.birthYear ?? (data.birthDate ? new Date(data.birthDate).getFullYear() : null);
  const deathYear = data.deathYear ?? (data.deathDate ? new Date(data.deathDate).getFullYear() : null);
  return {
    ...data,
    birthYear,
    deathYear,
    isLiving: deathYear || data.deathDate ? false : data.isLiving,
    visibilityLevel: data.visibilityLevel ?? defaultVisibilityForGender(data.gender),
  };
}

function toJsonPayload<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function updatePerson(personId: string, rawData: unknown): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person || person.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const parsed = updatePersonSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = normalizeUpdatePersonInput(parsed.data);

  // Validate internal date consistency
  const { validatePersonChronology } = await import("@/lib/domain/family-rules/chronology-validators");
  const chronoResult = validatePersonChronology(data);
  if (chronoResult.status === "PROHIBITED") {
    return { success: false, error: chronoResult.message };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  // Guard against gender changes that break existing relationships
  if (data.gender && data.gender !== person.gender) {
    const { validateGenderChange } = await import("@/lib/domain/family-rules/gender-validators");
    const genderResult = await validateGenderChange(personId, data.gender, db);
    if (genderResult.status === "PROHIBITED") {
      return { success: false, error: genderResult.message };
    }
  }

  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    const request = await db.editRequest.create({
      data: {
        requestType: "EDIT_PERSON",
        targetType: "PERSON",
        targetId: personId,
        familyId: person.familyId,
        submittedByUserId: session.user.id,
        payloadJson: toJsonPayload(data),
      },
    });
    await notifyEditRequestSubmitted({
      requestId: request.id,
      familyId: person.familyId,
      submittedByUserId: session.user.id,
      title: "طلب تعديل فرد",
    });
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/notifications");
    return { success: true, personId };
  }

  await db.person.update({
    where: { id: personId },
    data: {
      fullName: data.fullName,
      kunya: data.kunya ?? null,
      gender: data.gender,
      isLiving: data.isLiving,
      birthYear: data.birthYear,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      birthPlace: data.birthPlace ?? null,
      deathYear: data.deathYear,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      bloodType: data.bloodType ?? null,
      residenceCity: data.residenceCity ?? null,
      address: data.address ?? null,
      profession: data.profession ?? null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
      visibilityLevel: data.visibilityLevel,
    },
  });

  // Retroactive date conflict check — dates were just saved; check if they
  // conflict with existing marriages or parent-child relations.
  // We do NOT block (data is saved), but we return warnings so the UI can
  // surface them to the admin for manual resolution.
  const datesChanged =
    data.birthYear !== person.birthYear ||
    data.deathYear !== person.deathYear ||
    (data.birthDate ? new Date(data.birthDate).toISOString() : null) !== (person.birthDate?.toISOString() ?? null) ||
    (data.deathDate ? new Date(data.deathDate).toISOString() : null) !== (person.deathDate?.toISOString() ?? null);

  let warnings: string[] | undefined;
  if (datesChanged && (data.birthYear || data.birthDate || data.deathYear || data.deathDate)) {
    const { checkRetroactiveDateConflicts } = await import("@/lib/domain/family-rules/chronology-validators");
    const conflicts = await checkRetroactiveDateConflicts(personId, data, db);
    if (conflicts.length > 0) {
      warnings = conflicts.map((c) => c.message);
    }
  }

  revalidatePath(`/dashboard/families/${person.familyId}`);
  revalidatePath(`/family/${person.familyId}`);
  return { success: true, personId, ...(warnings ? { warnings } : {}) };
}

export async function deletePerson(personId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.person.update({ where: { id: personId }, data: { deletedAt: new Date() } });
  await recomputeFamilyAncestry(person.familyId);
  revalidatePath(`/dashboard/families/${person.familyId}`);
  revalidatePath(`/family/${person.familyId}`);
  return { success: true };
}

export async function createPersonAsChildOf(
  parentPersonId: string,
  newPersonData: {
    fullName: string;
    gender: "MALE" | "FEMALE";
    isLiving?: boolean;
    relationType?: ParentChildRelationType;
    confidence?: RelationConfidence;
  }
): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  const trimmedName = newPersonData.fullName?.trim() ?? "";
  if (trimmedName.length < 2) return { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" };

  const parent = await db.person.findUnique({ where: { id: parentPersonId } });
  if (!parent || parent.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, parent.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة" };
  }

  const relationType = newPersonData.relationType ?? "BIOLOGICAL";
  const confidence = newPersonData.confidence ?? "VERIFIED";
  const childIsLiving = newPersonData.isLiving ?? true;

  let childId: string;
  try {
    childId = await db.$transaction(async (tx) => {
      const child = await tx.person.create({
        data: {
          familyId: parent.familyId,
          fullName: trimmedName,
          gender: newPersonData.gender,
          isLiving: childIsLiving,
          visibilityLevel: defaultVisibilityForGender(newPersonData.gender),
        },
      });
      await tx.parentChildRelation.create({
        data: { parentPersonId, childPersonId: child.id, relationType, confidence },
      });
      return child.id;
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "خطأ في إنشاء الفرد" };
  }

  await recomputeFamilyAncestry(parent.familyId);

  revalidatePath(`/dashboard/families/${parent.familyId}`);
  revalidatePath(`/family/${parent.familyId}`);
  return { success: true, personId: childId };
}

export async function createPersonAsParentOf(
  childPersonId: string,
  newPersonData: {
    fullName: string;
    gender: "MALE" | "FEMALE";
    isLiving?: boolean;
    relationType?: ParentChildRelationType;
    confidence?: RelationConfidence;
  }
): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  const trimmedName = newPersonData.fullName?.trim() ?? "";
  if (trimmedName.length < 2) return { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" };

  const child = await db.person.findUnique({ where: { id: childPersonId } });
  if (!child || child.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة" };
  }

  const relationType = newPersonData.relationType ?? "BIOLOGICAL";
  const confidence = newPersonData.confidence ?? "VERIFIED";
  if (relationType === "BIOLOGICAL") {
    const parentSlotError = await validateNewParentSlot(childPersonId, newPersonData.gender);
    if (parentSlotError) return { success: false, error: parentSlotError };
  }

  // Parents added in quick-add are typically historical figures — default to deceased
  const parentIsLiving = newPersonData.isLiving ?? false;

  let parentId: string;
  try {
    parentId = await db.$transaction(async (tx) => {
      const parent = await tx.person.create({
        data: {
          familyId: child.familyId,
          fullName: trimmedName,
          gender: newPersonData.gender,
          isLiving: parentIsLiving,
          visibilityLevel: defaultVisibilityForGender(newPersonData.gender),
        },
      });
      await tx.parentChildRelation.create({
        data: { parentPersonId: parent.id, childPersonId, relationType, confidence },
      });
      return parent.id;
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "خطأ في إنشاء الفرد" };
  }

  await recomputeFamilyAncestry(child.familyId);

  revalidatePath(`/dashboard/families/${child.familyId}`);
  revalidatePath(`/family/${child.familyId}`);
  return { success: true, personId: parentId };
}

export async function createPersonAsSpouseOf(
  personId: string,
  newPersonData: { fullName: string; isLiving?: boolean }
): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  const trimmedName = newPersonData.fullName?.trim() ?? "";
  if (trimmedName.length < 2) return { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person || person.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة" };
  }

  // Validate active marriage limits before creating the new person
  if (person.gender === "MALE") {
    const activeWifeCount = await db.marriageRelation.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        OR: [{ personAId: personId }, { personBId: personId }],
      },
    });
    if (activeWifeCount >= 4) {
      return { success: false, error: "وصل الرجل الحد الأقصى من الزوجات النشطات (4)" };
    }
  } else {
    const activeHusband = await db.marriageRelation.findFirst({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        OR: [{ personAId: personId }, { personBId: personId }],
      },
    });
    if (activeHusband) {
      return { success: false, error: "المرأة لها زوج نشط بالفعل" };
    }
  }

  const spouseGender = person.gender === "MALE" ? "FEMALE" : "MALE";
  const spouseIsLiving = newPersonData.isLiving ?? true;

  let spouseId: string;
  try {
    spouseId = await db.$transaction(async (tx) => {
      const spouse = await tx.person.create({
        data: {
          familyId: person.familyId,
          fullName: trimmedName,
          gender: spouseGender,
          isLiving: spouseIsLiving,
          visibilityLevel: defaultVisibilityForGender(spouseGender),
        },
      });

      await tx.personAncestry.create({
        data: { ancestorId: spouse.id, descendantId: spouse.id, depth: 0 },
      });

      const [normalizedA, normalizedB] = [person.id, spouse.id].sort();
      await tx.marriageRelation.create({
        data: { personAId: normalizedA, personBId: normalizedB },
      });

      return spouse.id;
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "خطأ في إنشاء الزواج" };
  }

  revalidatePath(`/dashboard/families/${person.familyId}`);
  revalidatePath(`/family/${person.familyId}`);
  return { success: true, personId: spouseId };
}

export async function removeParentChildRelation(
  parentId: string,
  childId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const child = await db.person.findUnique({ where: { id: childId } });
  const parent = await db.person.findUnique({ where: { id: parentId } });
  if (!child) return { success: false, error: "الشخص غير موجود" };

  if (!parent || parent.deletedAt || child.deletedAt) {
    return { success: false, error: "الشخص غير موجود" };
  }
  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isCrossFamily = parent.familyId !== child.familyId;
  if (isCrossFamily) {
    const [canManageParentFamily, canManageChildFamily] = await Promise.all([
      canManageFamily(session.user.id, parent.familyId, isAdmin),
      canManageFamily(session.user.id, child.familyId, isAdmin),
    ]);
    if (!canManageParentFamily || !canManageChildFamily) {
      return {
        success: false,
        error: "حذف علاقة والد/ابن بين عائلتين يتطلب صلاحية إدارة كلتا العائلتين",
      };
    }
  } else if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  await db.parentChildRelation.deleteMany({
    where: { parentPersonId: parentId, childPersonId: childId },
  });

  const affectedFamilyIds = [...new Set([parent.familyId, child.familyId])];
  await Promise.all(affectedFamilyIds.map((familyId) => recomputeFamilyAncestry(familyId)));

  for (const familyId of affectedFamilyIds) {
    revalidatePath(`/dashboard/families/${familyId}`);
    revalidatePath(`/family/${familyId}`);
  }
  return { success: true };
}
