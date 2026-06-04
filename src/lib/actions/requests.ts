"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { addParentChildRelation, removeParentChildRelation } from "@/lib/actions/persons";

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
    .replace(/[^\w؀-ۿ-]/g, "")
    .slice(0, 60);
}

type PersonEditPayload = {
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate?: string;
  deathDate?: string;
  biography?: string;
  notes?: string;
  visibilityLevel: "PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK";
};

type RelationPayload = {
  parentId?: string;
  childId?: string;
  operation?: "ADD_PARENT_CHILD" | "REMOVE_PARENT_CHILD";
};

type FamilyInfoPayload = {
  name?: string;
  originSummary?: string;
  historicalNotes?: string;
  isPublic?: boolean;
};

async function applyEditRequest(req: {
  familyId: string;
  requestType: string;
  targetId: string | null;
  payloadJson: unknown;
}) {
  if (req.requestType === "ADD_PERSON") {
    const payload = req.payloadJson as PersonEditPayload & { familyId?: string };
    const person = await db.person.create({
      data: {
        familyId: req.familyId,
        fullName: payload.fullName,
        gender: payload.gender,
        isLiving: payload.isLiving ?? true,
        birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
        deathDate: payload.deathDate ? new Date(payload.deathDate) : null,
        biography: payload.biography ?? null,
        notes: payload.notes ?? null,
        visibilityLevel: payload.visibilityLevel ?? "PUBLIC",
      },
    });
    await db.personAncestry.create({
      data: { ancestorId: person.id, descendantId: person.id, depth: 0 },
    });
    return;
  }

  if (req.requestType === "EDIT_PERSON") {
    if (!req.targetId) throw new Error("طلب تعديل الفرد لا يحتوي على هدف");
    const payload = req.payloadJson as PersonEditPayload;
    await db.person.update({
      where: { id: req.targetId, familyId: req.familyId, deletedAt: null },
      data: {
        fullName: payload.fullName,
        gender: payload.gender,
        isLiving: payload.isLiving ?? true,
        birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
        deathDate: payload.deathDate ? new Date(payload.deathDate) : null,
        biography: payload.biography ?? null,
        notes: payload.notes ?? null,
        visibilityLevel: payload.visibilityLevel ?? "PUBLIC",
      },
    });
    return;
  }

  if (req.requestType === "ADD_RELATION") {
    const payload = req.payloadJson as RelationPayload;
    if (!payload.parentId || !payload.childId) throw new Error("طلب العلاقة لا يحتوي على طرفي العلاقة");
    const result = await addParentChildRelation(payload.parentId, payload.childId);
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
    await db.family.update({
      where: { id: req.familyId },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.originSummary !== undefined ? { originSummary: payload.originSummary } : {}),
        ...(payload.historicalNotes !== undefined ? { historicalNotes: payload.historicalNotes } : {}),
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
      select: { familyId: true, requestType: true, targetId: true, payloadJson: true, status: true },
    });
    if (!req) return { success: false, error: "الطلب غير موجود" };
    if (req.status !== "PENDING") return { success: false, error: "تمت مراجعة هذا الطلب مسبقاً" };

    if (!isSystemAdmin && !(await isActiveFamilyAdmin(userId, req.familyId))) {
      return { success: false, error: "غير مصرح لك بمراجعة هذا الطلب" };
    }

    if (approve) {
      try {
        await applyEditRequest(req);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "تعذر تطبيق الطلب",
        };
      }
    }

    await db.editRequest.update({
      where: { id: requestId },
      data: { status, reviewedByUserId: userId, reviewNotes },
    });
  } else {
    const req = await db.adminRequest.findUnique({
      where: { id: requestId },
      select: {
        requestType: true,
        status: true,
        targetFamilyId: true,
        submittedByUserId: true,
        proposedFamilyName: true,
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
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/families");
  revalidatePath("/admin");
  return { success: true };
}

// ── submitJoinFamilyAdminRequest ─────────────────────────────────────────────

export async function submitJoinFamilyAdminRequest(
  familyId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const userId = session.user.id;

  const family = await db.family.findFirst({ where: { id: familyId, deletedAt: null }, select: { id: true } });
  if (!family) return { success: false, error: "العائلة غير موجودة" };

  if (await isActiveFamilyAdmin(userId, familyId))
    return { success: false, error: "أنت مسؤول على هذه العائلة مسبقاً" };

  const existing = await db.adminRequest.findFirst({
    where: { submittedByUserId: userId, targetFamilyId: familyId, requestType: "JOIN_FAMILY_ADMINS", status: "PENDING" },
  });
  if (existing) return { success: false, error: "لديك طلب انضمام معلق لهذه العائلة" };

  await db.adminRequest.create({
    data: {
      requestType: "JOIN_FAMILY_ADMINS",
      targetFamilyId: familyId,
      submittedByUserId: userId,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/families");
  return { success: true };
}
