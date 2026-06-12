"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateMarriageEligibility } from "@/lib/domain/family-rules/marriage-eligibility";

export type CrossFamilyResult = { success: true } | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

// ─── Submit a cross-family marriage request ──────────────────────────────────
// Called by the admin of either family when personA and personB belong to different families.
// The workflow:
//   1. Submitter's family side is auto-approved (they initiated the request).
//   2. The other family gets a PENDING notification awaiting their approval.
//   3. When both sides approve, status becomes APPROVED.
//   4. A separate `applyCrossMarriageRequest` call (or auto-trigger) creates the actual MarriageRelation.
export async function submitCrossMarriageRequest(
  personAId: string,
  personBId: string,
  options?: { marriageDate?: string; notes?: string }
): Promise<CrossFamilyResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (personAId === personBId) return { success: false, error: "لا يمكن ربط الشخص بنفسه" };

  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: personAId } }),
    db.person.findUnique({ where: { id: personBId } }),
  ]);

  if (!personA || personA.deletedAt || !personB || personB.deletedAt) {
    return { success: false, error: "الشخص غير موجود" };
  }

  if (personA.familyId === personB.familyId) {
    return {
      success: false,
      error: "كلا الشخصين من نفس العائلة — استخدم إضافة الزواج المباشرة",
    };
  }

  if (personA.gender === personB.gender) {
    return { success: false, error: "يجب أن يكون الزواج بين ذكر وأنثى" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, personA.familyId, isAdmin),
    canManageFamily(session.user.id, personB.familyId, isAdmin),
  ]);

  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية التعديل في أي من العائلتين" };
  }

  const validation = await validateMarriageEligibility(personAId, personBId, {
    allowCrossFamily: true,
    marriageDate: options?.marriageDate ?? null,
  });
  if (!validation.success) return validation;

  // Prevent duplicate PENDING/APPROVED requests for the same pair
  const existing = await db.crossFamilyMarriageRequest.findFirst({
    where: {
      OR: [
        { personAId, personBId },
        { personAId: personBId, personBId: personAId },
      ],
      status: { in: ["PENDING_FAMILY_A", "PENDING_FAMILY_B", "APPROVED"] },
    },
  });
  if (existing) {
    return { success: false, error: "يوجد طلب زواج معلّق لهذين الشخصين بالفعل" };
  }

  const now = new Date();
  const requestPersonA = canManageA ? personA : personB;
  const requestPersonB = canManageA ? personB : personA;

  // familyA/personA is the submitting side. This keeps the request sides aligned.
  const familyAId = requestPersonA.familyId;
  const familyBId = requestPersonB.familyId;

  await db.crossFamilyMarriageRequest.create({
    data: {
      familyAId,
      familyBId,
      personAId: requestPersonA.id,
      personBId: requestPersonB.id,
      status: "PENDING_FAMILY_B",
      marriageDate: options?.marriageDate ? new Date(options.marriageDate) : null,
      notes: options?.notes ?? null,
      submittedByUserId: session.user.id,
      familyAApprovedAt: now,
      familyAApprovedByUserId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/families/${familyAId}`);
  revalidatePath(`/dashboard/families/${familyBId}`);
  return { success: true };
}

// ─── Review (approve or reject) a cross-family marriage request ───────────────
export async function reviewCrossMarriageRequest(
  requestId: string,
  approve: boolean,
  reason?: string
): Promise<CrossFamilyResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const request = await db.crossFamilyMarriageRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return { success: false, error: "الطلب غير موجود" };
  if (request.status !== "PENDING_FAMILY_A" && request.status !== "PENDING_FAMILY_B") {
    return { success: false, error: "الطلب لم يعد معلقاً" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, request.familyAId, isAdmin),
    canManageFamily(session.user.id, request.familyBId, isAdmin),
  ]);

  // Determine which family side is pending and whether this user can act on it
  const pendingFamilyIsA = request.status === "PENDING_FAMILY_A";
  const pendingFamilyIsB = request.status === "PENDING_FAMILY_B";
  const canActOnPending = (pendingFamilyIsA && canManageA) || (pendingFamilyIsB && canManageB);

  if (!canActOnPending) {
    return { success: false, error: "لا تملك صلاحية مراجعة هذا الطلب" };
  }

  const now = new Date();

  if (!approve) {
    await db.crossFamilyMarriageRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectedAt: now,
        rejectedByUserId: session.user.id,
        rejectionReason: reason ?? null,
      },
    });
    revalidatePath(`/dashboard/families/${request.familyAId}`);
    revalidatePath(`/dashboard/families/${request.familyBId}`);
    return { success: true };
  }

  // Approve: mark the pending side, then if both approved → auto-apply
  const updateData = pendingFamilyIsA
    ? { familyAApprovedAt: now, familyAApprovedByUserId: session.user.id }
    : { familyBApprovedAt: now, familyBApprovedByUserId: session.user.id };

  const updated = await db.crossFamilyMarriageRequest.update({
    where: { id: requestId },
    data: { ...updateData, status: "APPROVED" },
  });

  revalidatePath(`/dashboard/families/${request.familyAId}`);
  revalidatePath(`/dashboard/families/${request.familyBId}`);

  // Auto-apply once approved
  const applyResult = await applyCrossMarriageRequest(updated.id);
  if (!applyResult.success) {
    return { success: false, error: `تمت الموافقة لكن فشل التطبيق: ${applyResult.error}` };
  }

  return { success: true };
}

// ─── Apply an approved cross-family marriage request ─────────────────────────
// Creates the actual MarriageRelation and marks the request as APPLIED.
// This is called automatically after both sides approve, but can also be called
// manually by a system admin if the auto-apply failed.
export async function applyCrossMarriageRequest(
  requestId: string
): Promise<CrossFamilyResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const request = await db.crossFamilyMarriageRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return { success: false, error: "الطلب غير موجود" };
  if (request.status !== "APPROVED") {
    return { success: false, error: "لا يمكن تطبيق طلب غير موافق عليه" };
  }
  if (request.appliedMarriageId) {
    return { success: false, error: "تم تطبيق هذا الطلب مسبقاً" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, request.familyAId, isAdmin),
    canManageFamily(session.user.id, request.familyBId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية تطبيق هذا الطلب" };
  }

  // Verify persons still exist
  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: request.personAId } }),
    db.person.findUnique({ where: { id: request.personBId } }),
  ]);
  if (!personA || personA.deletedAt || !personB || personB.deletedAt) {
    return { success: false, error: "أحد الأشخاص لم يعد موجوداً" };
  }

  if (personA.familyId !== request.familyAId || personB.familyId !== request.familyBId) {
    return { success: false, error: "بيانات الطلب غير متطابقة مع عائلات الأشخاص" };
  }

  const validation = await validateMarriageEligibility(request.personAId, request.personBId, {
    allowCrossFamily: true,
    marriageDate: request.marriageDate,
  });
  if (!validation.success) return validation;

  const now = new Date();
  await db.$transaction(async (tx) => {
    const created = await tx.marriageRelation.create({
      data: {
        personAId: validation.normalizedA,
        personBId: validation.normalizedB,
        marriageDate: request.marriageDate,
        notes: request.notes,
        status: validation.initialStatus,
        crossFamilyRequestId: requestId,
      },
    });
    await tx.crossFamilyMarriageRequest.update({
      where: { id: requestId },
      data: {
        status: "APPLIED",
        appliedAt: now,
        appliedMarriageId: created.id,
      },
    });
    // Add MARRIED_IN memberships: each spouse becomes visible in the other family's tree
    await tx.personFamilyMembership.createMany({
      data: [
        { personId: request.personAId, familyId: request.familyBId, role: "MARRIED_IN" },
        { personId: request.personBId, familyId: request.familyAId, role: "MARRIED_IN" },
      ],
      skipDuplicates: true,
    });
  });

  revalidatePath(`/dashboard/families/${request.familyAId}`);
  revalidatePath(`/dashboard/families/${request.familyBId}`);
  revalidatePath(`/family/${request.familyAId}`);
  revalidatePath(`/family/${request.familyBId}`);

  return { success: true };
}

// ─── Cancel a pending cross-family marriage request ───────────────────────────
export async function cancelCrossMarriageRequest(
  requestId: string
): Promise<CrossFamilyResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const request = await db.crossFamilyMarriageRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return { success: false, error: "الطلب غير موجود" };
  if (!["PENDING_FAMILY_A", "PENDING_FAMILY_B", "APPROVED"].includes(request.status)) {
    return { success: false, error: "لا يمكن إلغاء هذا الطلب في وضعه الحالي" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, request.familyAId, isAdmin),
    canManageFamily(session.user.id, request.familyBId, isAdmin),
  ]);
  // Only the submitting family admin or a system admin can cancel
  const isSubmitter = request.submittedByUserId === session.user.id;
  if (!isSubmitter && !canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية إلغاء هذا الطلب" };
  }

  await db.crossFamilyMarriageRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/dashboard/families/${request.familyAId}`);
  revalidatePath(`/dashboard/families/${request.familyBId}`);
  return { success: true };
}
