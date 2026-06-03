"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Propose a link between two families  (PENDING until system admin approves)
// ─────────────────────────────────────────────────────────────────────────────

export async function proposeFamilyLink(
  familyAId: string,
  familyBId: string,
  linkType: "KINSHIP" | "IN_LAW",
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  if (familyAId === familyBId) {
    return { success: false, error: "لا يمكن ربط عائلة بنفسها" };
  }

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = await db.familyAdminAssignment.findFirst({
    where: { familyId: familyAId, userId: session.user.id, isActive: true },
  });

  if (!isSystemAdmin && !isFamilyAdmin) {
    return { success: false, error: "لا تملك صلاحية اقتراح ربط لهذه العائلة" };
  }

  // Normalize order to prevent duplicates regardless of which family is A/B
  const [normA, normB] = [familyAId, familyBId].sort();

  // Check if link already exists
  const existing = await db.familyLink.findFirst({
    where: {
      OR: [
        { familyAId: normA, familyBId: normB },
        { familyAId: normB, familyBId: normA },
      ],
      deletedAt: null,
    },
  });
  if (existing) {
    return { success: false, error: "يوجد ربط مسبق بين هاتين العائلتين" };
  }

  // Verify both families exist
  const [famA, famB] = await Promise.all([
    db.family.findUnique({ where: { id: familyAId, deletedAt: null }, select: { id: true } }),
    db.family.findUnique({ where: { id: familyBId, deletedAt: null }, select: { id: true } }),
  ]);
  if (!famA || !famB) return { success: false, error: "إحدى العائلتين غير موجودة" };

  // System admin creates directly as APPROVED; family admin proposes as PENDING
  const status = isSystemAdmin ? "APPROVED" : "PENDING";

  await db.familyLink.create({
    data: { familyAId, familyBId, linkType, description, status },
  });

  revalidatePath(`/dashboard/families/${familyAId}`);
  revalidatePath(`/dashboard/families/${familyBId}`);
  if (isSystemAdmin) revalidatePath("/admin/families");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve a pending family link  (SYSTEM_ADMIN only)
// ─────────────────────────────────────────────────────────────────────────────

export async function approveFamilyLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "مسموح لمسؤولي النظام فقط" };
  }

  const link = await db.familyLink.findUnique({
    where: { id: linkId },
    select: { familyAId: true, familyBId: true, status: true },
  });
  if (!link || link.status !== "PENDING") {
    return { success: false, error: "الطلب غير موجود أو ليس معلقاً" };
  }

  await db.familyLink.update({ where: { id: linkId }, data: { status: "APPROVED" } });

  revalidatePath(`/dashboard/families/${link.familyAId}`);
  revalidatePath(`/dashboard/families/${link.familyBId}`);
  revalidatePath("/admin/families");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject a pending family link  (SYSTEM_ADMIN only)
// ─────────────────────────────────────────────────────────────────────────────

export async function rejectFamilyLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "مسموح لمسؤولي النظام فقط" };
  }

  const link = await db.familyLink.findUnique({
    where: { id: linkId },
    select: { familyAId: true, familyBId: true, status: true },
  });
  if (!link || link.status !== "PENDING") {
    return { success: false, error: "الطلب غير موجود أو ليس معلقاً" };
  }

  await db.familyLink.update({
    where: { id: linkId },
    data: { status: "REJECTED", deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/families/${link.familyAId}`);
  revalidatePath(`/dashboard/families/${link.familyBId}`);
  revalidatePath("/admin/families");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete / cancel a family link  (family admin can cancel PENDING they proposed;
// SYSTEM_ADMIN can delete any APPROVED or PENDING link)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteFamilyLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const link = await db.familyLink.findUnique({
    where: { id: linkId },
    select: { familyAId: true, familyBId: true, status: true },
  });
  if (!link) return { success: false, error: "الرابط غير موجود" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdminA = await db.familyAdminAssignment.findFirst({
    where: { familyId: link.familyAId, userId: session.user.id, isActive: true },
  });
  const isFamilyAdminB = await db.familyAdminAssignment.findFirst({
    where: { familyId: link.familyBId, userId: session.user.id, isActive: true },
  });

  // Family admin can only cancel PENDING links for their own family
  const canDelete =
    isSystemAdmin ||
    ((isFamilyAdminA || isFamilyAdminB) && link.status === "PENDING");

  if (!canDelete) {
    return { success: false, error: "لا تملك صلاحية حذف هذا الرابط" };
  }

  await db.familyLink.update({
    where: { id: linkId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/families/${link.familyAId}`);
  revalidatePath(`/dashboard/families/${link.familyBId}`);
  revalidatePath("/admin/families");
  return { success: true };
}
