"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const personSchema = z.object({
  familyId: z.string().cuid(),
  fullName: z.string().min(2).max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  visibilityLevel: z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]).default("PUBLIC"),
});

export type PersonActionResult =
  | { success: true; personId: string }
  | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

export async function recomputeFamilyAncestry(familyId: string) {
  const persons = await db.person.findMany({
    where: { familyId, deletedAt: null },
    select: { id: true },
  });
  const personIds = persons.map((p) => p.id);
  if (personIds.length === 0) return;

  const relations = await db.parentChildRelation.findMany({
    where: {
      parentPersonId: { in: personIds },
      childPersonId: { in: personIds },
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

async function wouldCreateCycle(parentId: string, childId: string, familyId: string) {
  if (parentId === childId) return true;

  const familyPersons = await db.person.findMany({
    where: { familyId, deletedAt: null },
    select: { id: true },
  });
  const familyPersonIds = familyPersons.map((p) => p.id);

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

async function validateNewParentSlot(childId: string, gender: "MALE" | "FEMALE") {
  const existingParents = await db.parentChildRelation.findMany({
    where: { childPersonId: childId },
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

  const data = parsed.data;

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (!(await canManageFamily(session.user.id, data.familyId, isAdmin))) {
    // Non-admin: create edit request instead
    await db.editRequest.create({
      data: {
        requestType: "ADD_PERSON",
        targetType: "PERSON",
        familyId: data.familyId,
        submittedByUserId: session.user.id,
        payloadJson: data,
      },
    });
    revalidatePath("/dashboard/requests");
    return { success: true, personId: "" };
  }

  const person = await db.person.create({
    data: {
      familyId: data.familyId,
      fullName: data.fullName,
      gender: data.gender,
      isLiving: data.isLiving,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
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
  if (parent.familyId !== child.familyId) {
    return { success: false, error: "لا يمكن تسجيل علاقة والد/ابن بين عائلتين مختلفتين" };
  }

  const parentSlotError = await validateParentSlot(parentId, childId);
  if (parentSlotError) return { success: false, error: parentSlotError };

  if (await wouldCreateCycle(parentId, childId, child.familyId)) {
    return { success: false, error: "هذه العلاقة ستنشئ دورة غير صحيحة في النسب" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  // Create parent-child relation
  await db.parentChildRelation.upsert({
    where: { parentPersonId_childPersonId: { parentPersonId: parentId, childPersonId: childId } },
    create: { parentPersonId: parentId, childPersonId: childId },
    update: {},
  });

  await recomputeFamilyAncestry(child.familyId);

  revalidatePath(`/family/${child.familyId}`);
  return { success: true };
}

const updatePersonSchema = z.object({
  fullName: z.string().min(2).max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  visibilityLevel: z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]).default("PUBLIC"),
});

export async function updatePerson(personId: string, rawData: unknown): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person || person.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const parsed = updatePersonSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = parsed.data;
  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    await db.editRequest.create({
      data: {
        requestType: "EDIT_PERSON",
        targetType: "PERSON",
        targetId: personId,
        familyId: person.familyId,
        submittedByUserId: session.user.id,
        payloadJson: data,
      },
    });
    revalidatePath("/dashboard/requests");
    return { success: true, personId };
  }

  await db.person.update({
    where: { id: personId },
    data: {
      fullName: data.fullName,
      gender: data.gender,
      isLiving: data.isLiving,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
      visibilityLevel: data.visibilityLevel,
    },
  });

  revalidatePath(`/dashboard/families/${person.familyId}`);
  revalidatePath(`/family/${person.familyId}`);
  return { success: true, personId };
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
  newPersonData: { fullName: string; gender: "MALE" | "FEMALE" }
): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (!newPersonData.fullName?.trim()) return { success: false, error: "الاسم مطلوب" };

  const parent = await db.person.findUnique({ where: { id: parentPersonId } });
  if (!parent || parent.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, parent.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة" };
  }

  const child = await db.person.create({
    data: {
      familyId: parent.familyId,
      fullName: newPersonData.fullName.trim(),
      gender: newPersonData.gender,
      isLiving: true,
      visibilityLevel: "PUBLIC",
    },
  });

  await db.parentChildRelation.create({
    data: { parentPersonId, childPersonId: child.id },
  });

  await recomputeFamilyAncestry(parent.familyId);

  revalidatePath(`/dashboard/families/${parent.familyId}`);
  revalidatePath(`/family/${parent.familyId}`);
  return { success: true, personId: child.id };
}

export async function createPersonAsParentOf(
  childPersonId: string,
  newPersonData: { fullName: string; gender: "MALE" | "FEMALE" }
): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (!newPersonData.fullName?.trim()) return { success: false, error: "الاسم مطلوب" };

  const child = await db.person.findUnique({ where: { id: childPersonId } });
  if (!child || child.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة" };
  }

  const parentSlotError = await validateNewParentSlot(childPersonId, newPersonData.gender);
  if (parentSlotError) return { success: false, error: parentSlotError };

  const parent = await db.person.create({
    data: {
      familyId: child.familyId,
      fullName: newPersonData.fullName.trim(),
      gender: newPersonData.gender,
      isLiving: false,
      visibilityLevel: "PUBLIC",
    },
  });

  await db.parentChildRelation.create({
    data: { parentPersonId: parent.id, childPersonId },
  });

  await recomputeFamilyAncestry(child.familyId);

  revalidatePath(`/dashboard/families/${child.familyId}`);
  revalidatePath(`/family/${child.familyId}`);
  return { success: true, personId: parent.id };
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
  if (parent.familyId !== child.familyId) {
    return { success: false, error: "لا يمكن تعديل علاقة والد/ابن بين عائلتين مختلفتين" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  await db.parentChildRelation.deleteMany({
    where: { parentPersonId: parentId, childPersonId: childId },
  });

  await recomputeFamilyAncestry(child.familyId);

  revalidatePath(`/dashboard/families/${child.familyId}`);
  revalidatePath(`/family/${child.familyId}`);
  return { success: true };
}
