"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addParentChildRelation, removeParentChildRelation } from "@/lib/actions/persons";
import { applyUserPersonLink } from "@/lib/actions/linking";
import {
  createNotifications,
  getActiveFamilyAdminUserIds,
  getSystemAdminUserIds,
  requestFocusHref,
} from "@/lib/notifications";
import { getHomelandPlacePathFields } from "@/lib/actions/homelands";
import type { ParentChildRelationType, RelationConfidence } from "@/generated/prisma/client";

// ── helpers ─────────────────────────────────────────────────────────────────

async function isActiveFamilyAdmin(userId: string, familyId: string) {
  const a = await db.familyAdminAssignment.findFirst({
    where: { userId, familyId, isActive: true },
  });
  return !!a;
}

function makeSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60);
}

type PersonEditPayload = {
  fullName: string;
  kunya?: string | null;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthYear?: number | null;
  birthDate?: string;
  birthPlace?: string | null;
  deathYear?: number | null;
  deathDate?: string;
  bloodType?: string | null;
  residenceCity?: string | null;
  address?: string | null;
  profession?: string | null;
  biography?: string;
  notes?: string;
  photoUrl?: string | null;
  visibilityLevel: "PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK";
};

function defaultVisibilityForGender(gender: "MALE" | "FEMALE") {
  return gender === "FEMALE" ? "ADMIN" : "PUBLIC";
}

function personLivingState(payload: PersonEditPayload) {
  return payload.deathYear || payload.deathDate ? false : payload.isLiving ?? true;
}

type RelationPayload = {
  parentId?: string;
  childId?: string;
  operation?: "ADD_PARENT_CHILD" | "REMOVE_PARENT_CHILD";
  relationType?: ParentChildRelationType;
  confidence?: RelationConfidence;
};

type FamilyInfoPayload = {
  name?: string;
  originSummary?: string;
  historicalNotes?: string;
  homelandCountry?: string;
  homelandRegion?: string;
  homelandCity?: string;
  homelandNote?: string;
  homelandConfidence?: "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";
  homelandPlaceId?: string | null;
  isPublic?: boolean;
};

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
const requestPersonSchema = z.object({
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
  visibilityLevel: z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]).optional(),
});

function normalizeRequestPersonPayload(data: z.infer<typeof requestPersonSchema>): PersonEditPayload {
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

async function parseAndValidatePersonPayload(payloadJson: unknown) {
  const parsed = requestPersonSchema.safeParse(payloadJson);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "بيانات طلب الفرد غير صحيحة");
  }

  const payload = normalizeRequestPersonPayload(parsed.data);
  const { validatePersonChronology } = await import("@/lib/domain/family-rules/chronology-validators");
  const chronoResult = validatePersonChronology(payload);
  if (chronoResult.status === "PROHIBITED") {
    throw new Error(chronoResult.message);
  }
  return payload;
}

const joinFamilyAdminRequestSchema = z.object({
  applicantRelationship: z.string().trim().min(2, "اكتب صلتك بالعائلة").max(120),
  applicantMessage: z.string().trim().min(20, "اكتب سبب الطلب بتفصيل كاف").max(1000),
  applicantContactEmail: z.string().trim().max(120).optional(),
  applicantContactPhone: z.string().trim().max(40).optional(),
});

const notificationLabels = {
  adminSubmitted: "طلب إدارة عائلة جديد",
  approved: "تمت الموافقة على طلبك",
  rejected: "تم رفض طلبك",
};

type EditRequestDb = Pick<typeof db, "person" | "personAncestry" | "family">;

async function applyEditRequest(req: {
  familyId: string;
  requestType: string;
  targetId: string | null;
  payloadJson: unknown;
}, client: EditRequestDb = db) {
  if (req.requestType === "ADD_PERSON") {
    const payload = await parseAndValidatePersonPayload(req.payloadJson);
    const person = await client.person.create({
      data: {
        familyId: req.familyId,
        fullName: payload.fullName,
        kunya: payload.kunya ?? null,
        gender: payload.gender,
        isLiving: personLivingState(payload),
        birthYear: payload.birthYear ?? (payload.birthDate ? new Date(payload.birthDate).getFullYear() : null),
        birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
        birthPlace: payload.birthPlace ?? null,
        deathYear: payload.deathYear ?? (payload.deathDate ? new Date(payload.deathDate).getFullYear() : null),
        deathDate: payload.deathDate ? new Date(payload.deathDate) : null,
        bloodType: payload.bloodType ?? null,
        residenceCity: payload.residenceCity ?? null,
        address: payload.address ?? null,
        profession: payload.profession ?? null,
        biography: payload.biography ?? null,
        notes: payload.notes ?? null,
        photoUrl: payload.photoUrl ?? null,
        visibilityLevel: payload.visibilityLevel ?? defaultVisibilityForGender(payload.gender),
      },
    });
    await client.personAncestry.create({
      data: { ancestorId: person.id, descendantId: person.id, depth: 0 },
    });
    return;
  }

  if (req.requestType === "EDIT_PERSON") {
    if (!req.targetId) throw new Error("طلب تعديل الفرد لا يحتوي على هدف");
    const payload = await parseAndValidatePersonPayload(req.payloadJson);
    const currentPerson = await db.person.findFirst({
      where: { id: req.targetId, familyId: req.familyId, deletedAt: null },
      select: {
        gender: true,
        birthYear: true,
        birthDate: true,
        deathYear: true,
        deathDate: true,
      },
    });
    if (!currentPerson) throw new Error("الشخص غير موجود");

    if (payload.gender !== currentPerson.gender) {
      const { validateGenderChange } = await import("@/lib/domain/family-rules/gender-validators");
      const genderResult = await validateGenderChange(req.targetId, payload.gender, db);
      if (genderResult.status === "PROHIBITED") {
        throw new Error(genderResult.message);
      }
    }

    const datesChanged =
      payload.birthYear !== currentPerson.birthYear ||
      payload.deathYear !== currentPerson.deathYear ||
      (payload.birthDate ? new Date(payload.birthDate).toISOString() : null) !==
        (currentPerson.birthDate?.toISOString() ?? null) ||
      (payload.deathDate ? new Date(payload.deathDate).toISOString() : null) !==
        (currentPerson.deathDate?.toISOString() ?? null);

    if (datesChanged) {
      const { checkRetroactiveDateConflicts } = await import("@/lib/domain/family-rules/chronology-validators");
      const conflicts = await checkRetroactiveDateConflicts(req.targetId, payload, db);
      if (conflicts.length > 0) {
        throw new Error(conflicts[0]?.message ?? "تعديل التواريخ يتعارض مع علاقات قائمة");
      }
    }

    await client.person.update({
      where: { id: req.targetId, familyId: req.familyId, deletedAt: null },
      data: {
        fullName: payload.fullName,
        kunya: payload.kunya ?? null,
        gender: payload.gender,
        isLiving: personLivingState(payload),
        birthYear: payload.birthYear ?? (payload.birthDate ? new Date(payload.birthDate).getFullYear() : null),
        birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
        birthPlace: payload.birthPlace ?? null,
        deathYear: payload.deathYear ?? (payload.deathDate ? new Date(payload.deathDate).getFullYear() : null),
        deathDate: payload.deathDate ? new Date(payload.deathDate) : null,
        bloodType: payload.bloodType ?? null,
        residenceCity: payload.residenceCity ?? null,
        address: payload.address ?? null,
        profession: payload.profession ?? null,
        biography: payload.biography ?? null,
        notes: payload.notes ?? null,
        photoUrl: payload.photoUrl ?? null,
        visibilityLevel: payload.visibilityLevel ?? defaultVisibilityForGender(payload.gender),
      },
    });
    return;
  }

  if (req.requestType === "ADD_RELATION") {
    const payload = req.payloadJson as RelationPayload;
    if (!payload.parentId || !payload.childId) throw new Error("طلب العلاقة لا يحتوي على طرفي العلاقة");
    const result = await addParentChildRelation(payload.parentId, payload.childId, {
      relationType: payload.relationType,
      confidence: payload.confidence,
    });
    if (!result.success) throw new Error(result.error ?? "تعذر تطبيق طلب العلاقة");
    return;
  }

  if (req.requestType === "EDIT_RELATION") {
    const payload = req.payloadJson as RelationPayload;
    if (payload.operation !== "REMOVE_PARENT_CHILD" || !payload.parentId || !payload.childId) {
      throw new Error("نوع تعديل العلاقة غير مدعوم بعد");
    }
    const result = await removeParentChildRelation(payload.parentId, payload.childId);
    if (!result.success) throw new Error(result.error ?? "تعذر تطبيق تعديل العلاقة");
    return;
  }

  if (req.requestType === "ADD_FAMILY_INFO" || req.requestType === "EDIT_FAMILY_INFO") {
    const payload = req.payloadJson as FamilyInfoPayload;
    const selectedHomeland =
      payload.homelandPlaceId !== undefined && payload.homelandPlaceId
        ? await getHomelandPlacePathFields(payload.homelandPlaceId)
        : null;
    await client.family.update({
      where: { id: req.familyId },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.originSummary !== undefined ? { originSummary: payload.originSummary } : {}),
        ...(payload.historicalNotes !== undefined ? { historicalNotes: payload.historicalNotes } : {}),
        ...(payload.homelandPlaceId !== undefined
          ? {
              homelandPlaceId: selectedHomeland?.homelandPlaceId ?? null,
              homelandCountry: selectedHomeland?.homelandCountry ?? payload.homelandCountry ?? null,
              homelandRegion: selectedHomeland?.homelandRegion ?? payload.homelandRegion ?? null,
              homelandCity: selectedHomeland?.homelandCity ?? payload.homelandCity ?? null,
            }
          : {
              ...(payload.homelandCountry !== undefined ? { homelandCountry: payload.homelandCountry } : {}),
              ...(payload.homelandRegion !== undefined ? { homelandRegion: payload.homelandRegion } : {}),
              ...(payload.homelandCity !== undefined ? { homelandCity: payload.homelandCity } : {}),
            }),
        ...(payload.homelandNote !== undefined ? { homelandNote: payload.homelandNote } : {}),
        ...(payload.homelandConfidence !== undefined ? { homelandConfidence: payload.homelandConfidence } : {}),
        ...(payload.isPublic !== undefined ? { isPublic: payload.isPublic } : {}),
      },
    });
    return;
  }

  throw new Error("نوع الطلب غير مدعوم");
}

// ── reviewRequest ────────────────────────────────────────────────────────────

export async function reviewRequest(
  requestId: string,
  type: "admin" | "edit",
  approve: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const userId = session.user.id;
  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const status = approve ? "APPROVED" : "REJECTED";
  const reviewNotes = approve ? "تمت الموافقة وتطبيق الطلب." : "تم رفض الطلب.";

  if (type === "edit") {
    const req = await db.editRequest.findUnique({
      where: { id: requestId },
      select: {
        familyId: true,
        requestType: true,
        targetId: true,
        payloadJson: true,
        status: true,
        submittedByUserId: true,
      },
    });
    if (!req) return { success: false, error: "الطلب غير موجود" };
    if (req.status !== "PENDING") return { success: false, error: "تمت مراجعة هذا الطلب مسبقاً" };

    if (!isSystemAdmin && !(await isActiveFamilyAdmin(userId, req.familyId))) {
      return { success: false, error: "غير مصرح لك بمراجعة هذا الطلب" };
    }

    try {
      if (approve && (req.requestType === "ADD_PERSON" || req.requestType === "EDIT_PERSON" || req.requestType === "ADD_FAMILY_INFO" || req.requestType === "EDIT_FAMILY_INFO")) {
        await db.$transaction(async (tx) => {
          await applyEditRequest(req, tx);
          await tx.editRequest.update({
            where: { id: requestId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { status, reviewedByUserId: userId, reviewNotes, reviewedAt: new Date() } as any,
          });
        });
      } else {
        if (approve) {
          await applyEditRequest(req);
        }
        await db.editRequest.update({
          where: { id: requestId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { status, reviewedByUserId: userId, reviewNotes, reviewedAt: new Date() } as any,
        });
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "تعذر تطبيق الطلب",
      };
    }

    // Only notify logged-in members (guest submissions have no userId to notify)
    if (req.submittedByUserId && req.submittedByUserId !== userId) {
      await createNotifications([req.submittedByUserId], {
        type: approve ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
        title: approve ? notificationLabels.approved : notificationLabels.rejected,
        body: reviewNotes,
        href: requestFocusHref(requestId),
        metadata: { requestId, requestType: req.requestType, familyId: req.familyId },
      });
    }
  } else {
    const req = await db.adminRequest.findUnique({
      where: { id: requestId },
      select: {
        requestType: true,
        status: true,
        targetFamilyId: true,
        targetPersonId: true,
        submittedByUserId: true,
        proposedFamilyName: true,
        proposedHomelandCountry: true,
        proposedHomelandRegion: true,
        proposedHomelandCity: true,
        proposedHomelandNote: true,
        proposedHomelandConfidence: true,
        proposedHomelandPlaceId: true,
      },
    });
    if (!req) return { success: false, error: "الطلب غير موجود" };
    if (req.status !== "PENDING") return { success: false, error: "تمت مراجعة هذا الطلب مسبقاً" };

    // Authorization per request type
    if (req.requestType === "CREATE_FAMILY_AND_ADMINISTER") {
      if (!isSystemAdmin)
        return { success: false, error: "فقط مدير النظام يمكنه مراجعة طلبات إنشاء العائلات" };
    } else if (req.requestType === "JOIN_FAMILY_ADMINS") {
      if (!isSystemAdmin) {
        if (!req.targetFamilyId) return { success: false, error: "لا توجد عائلة محددة في الطلب" };
        if (!(await isActiveFamilyAdmin(userId, req.targetFamilyId)))
          return { success: false, error: "غير مصرح لك بمراجعة هذا الطلب" };
      }
    } else if (req.requestType === "LINK_USER_TO_PERSON") {
      if (!isSystemAdmin) {
        if (!req.targetFamilyId) return { success: false, error: "لا توجد عائلة محددة في الطلب" };
        if (!(await isActiveFamilyAdmin(userId, req.targetFamilyId)))
          return { success: false, error: "غير مصرح لك بمراجعة هذا الطلب" };
      }
    } else if (!isSystemAdmin) {
      return { success: false, error: "غير مصرح" };
    }

    const updated = await db.adminRequest.update({
      where: { id: requestId },
      data: {
        status,
        currentReviewerUserId: userId,
        notes: reviewNotes,
        decisionType: approve
          ? req.requestType === "CREATE_FAMILY_AND_ADMINISTER"
            ? "APPROVE_NEW_FAMILY_ADMIN"
            : req.requestType === "LINK_USER_TO_PERSON"
            ? "APPROVE_JOIN_EXISTING_ADMINS"
            : "APPROVE_JOIN_EXISTING_ADMINS"
          : "REJECT",
      },
    });

    if (approve) {
      if (updated.requestType === "CREATE_FAMILY_AND_ADMINISTER" && updated.proposedFamilyName) {
        let slug = makeSlug(updated.proposedFamilyName);
        let suffix = 1;
        while (await db.family.findUnique({ where: { slug } })) {
          slug = `${makeSlug(updated.proposedFamilyName)}-${suffix++}`;
        }
        const family = await db.family.create({
          data: {
            name: updated.proposedFamilyName,
            slug,
            homelandCountry: updated.proposedHomelandCountry,
            homelandRegion: updated.proposedHomelandRegion,
            homelandCity: updated.proposedHomelandCity,
            homelandNote: updated.proposedHomelandNote,
            homelandConfidence: updated.proposedHomelandConfidence ?? "UNSPECIFIED",
            homelandPlaceId: updated.proposedHomelandPlaceId,
            adminAssignments: {
              create: { userId: updated.submittedByUserId, assignedByUserId: userId },
            },
          },
        });
        await db.adminRequest.update({ where: { id: requestId }, data: { targetFamilyId: family.id } });
      }

      if (updated.requestType === "JOIN_FAMILY_ADMINS" && updated.targetFamilyId) {
        const exists = await db.familyAdminAssignment.findFirst({
          where: { familyId: updated.targetFamilyId, userId: updated.submittedByUserId, isActive: true },
        });
        if (!exists) {
          await db.familyAdminAssignment.create({
            data: {
              familyId: updated.targetFamilyId,
              userId: updated.submittedByUserId,
              assignedByUserId: userId,
            },
          });
        }
      }

      if (updated.requestType === "LINK_USER_TO_PERSON" && updated.targetPersonId) {
        await applyUserPersonLink(updated.submittedByUserId, updated.targetPersonId);
      }
    }

    await createNotifications([updated.submittedByUserId].filter((id) => id !== userId), {
      type: approve ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      title: approve ? notificationLabels.approved : notificationLabels.rejected,
      body: reviewNotes,
      href: requestFocusHref(requestId),
      metadata: {
        requestId,
        requestType: updated.requestType,
        targetFamilyId: updated.targetFamilyId,
      },
    });
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/families");
  revalidatePath("/admin");
  return { success: true };
}

// ── submitJoinFamilyAdminRequest ─────────────────────────────────────────────

export async function submitJoinFamilyAdminRequest(
  familyId: string,
  data: {
    applicantRelationship: string;
    applicantMessage: string;
    applicantContactEmail?: string;
    applicantContactPhone?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const userId = session.user.id;
  const parsed = joinFamilyAdminRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات الطلب غير صحيحة" };
  }

  const [family, user] = await Promise.all([
    db.family.findFirst({ where: { id: familyId, deletedAt: null }, select: { id: true, name: true } }),
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, fullName: true, name: true },
    }),
  ]);
  if (!family) return { success: false, error: "العائلة غير موجودة" };

  if (await isActiveFamilyAdmin(userId, familyId))
    return { success: false, error: "أنت مسؤول على هذه العائلة مسبقاً" };

  const applicantContactEmail = parsed.data.applicantContactEmail || user?.email || null;
  const applicantContactPhone = parsed.data.applicantContactPhone || user?.phone || null;
  if (!applicantContactEmail && !applicantContactPhone) {
    return { success: false, error: "أضف بريدًا أو رقم هاتف حتى يتمكن المسؤول من التواصل معك" };
  }

  const existing = await db.adminRequest.findFirst({
    where: { submittedByUserId: userId, targetFamilyId: familyId, requestType: "JOIN_FAMILY_ADMINS", status: "PENDING" },
  });
  if (existing) return { success: false, error: "لديك طلب انضمام معلق لهذه العائلة" };

  const request = await db.adminRequest.create({
    data: {
      requestType: "JOIN_FAMILY_ADMINS",
      targetFamilyId: familyId,
      applicantRelationship: parsed.data.applicantRelationship,
      applicantMessage: parsed.data.applicantMessage,
      applicantContactEmail,
      applicantContactPhone,
      submittedByUserId: userId,
      status: "PENDING",
    },
  });

  const [familyAdmins, systemAdmins] = await Promise.all([
    getActiveFamilyAdminUserIds(familyId),
    getSystemAdminUserIds(),
  ]);
  await createNotifications([...familyAdmins, ...systemAdmins].filter((id) => id !== userId), {
    type: "REQUEST_SUBMITTED",
    title: notificationLabels.adminSubmitted,
    body: `طلب انضمام لإدارة عائلة ${family.name} من ${user?.fullName ?? user?.name ?? "مستخدم"} ينتظر المراجعة.`,
    href: requestFocusHref(request.id),
    metadata: { requestId: request.id, requestType: "JOIN_FAMILY_ADMINS", targetFamilyId: familyId },
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/families");
  return { success: true };
}
