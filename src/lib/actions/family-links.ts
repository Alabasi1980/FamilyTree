"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createNotifications, getActiveFamilyAdminUserIds, getSystemAdminUserIds } from "@/lib/notifications";

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

  // Normalize order so (A,B) and (B,A) map to the same record
  const [normA, normB] = [familyAId, familyBId].sort();

  // Verify both families exist
  const [famA, famB] = await Promise.all([
    db.family.findUnique({ where: { id: familyAId, deletedAt: null }, select: { id: true, name: true } }),
    db.family.findUnique({ where: { id: familyBId, deletedAt: null }, select: { id: true, name: true } }),
  ]);
  if (!famA || !famB) return { success: false, error: "إحدى العائلتين غير موجودة" };

  // Check for any existing link (including soft-deleted) using normalized IDs
  const existing = await db.familyLink.findFirst({
    where: {
      OR: [
        { familyAId: normA, familyBId: normB },
        { familyAId: normB, familyBId: normA },
      ],
    },
  });

  if (existing && !existing.deletedAt) {
    return { success: false, error: "يوجد ربط مسبق بين هاتين العائلتين" };
  }

  // System admin creates directly as APPROVED; family admin proposes as PENDING
  const status = isSystemAdmin ? "APPROVED" : "PENDING";

  let linkId = existing?.id;
  if (existing && existing.deletedAt) {
    // Restore the previously-deleted link instead of creating a duplicate
    const restored = await db.familyLink.update({
      where: { id: existing.id },
      data: { deletedAt: null, status, linkType, description: description?.trim() ?? null },
      select: { id: true },
    });
    linkId = restored.id;
  } else {
    const created = await db.familyLink.create({
      data: { familyAId: normA, familyBId: normB, linkType, description: description?.trim() ?? null, status },
      select: { id: true },
    });
    linkId = created.id;
  }

  if (!isSystemAdmin && linkId) {
    const systemAdmins = await getSystemAdminUserIds();
    await createNotifications(systemAdmins.filter((userId) => userId !== session.user.id), {
      type: "REQUEST_SUBMITTED",
      title: "طلب ربط عائلتين جديد",
      body: `طلب ربط بين ${famA.name} و${famB.name} ينتظر مراجعة مدير النظام.`,
      href: "/admin/families",
      metadata: { linkId, familyAId: normA, familyBId: normB, linkType },
    });
  }

  revalidatePath(`/dashboard/families/${familyAId}`);
  revalidatePath(`/dashboard/families/${familyBId}`);
  if (isSystemAdmin) revalidatePath("/admin/families");
  revalidatePath("/dashboard/notifications");
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
    include: {
      familyA: { select: { name: true } },
      familyB: { select: { name: true } },
    },
  });
  if (!link || link.status !== "PENDING") {
    return { success: false, error: "الطلب غير موجود أو ليس معلقاً" };
  }

  await db.familyLink.update({ where: { id: linkId }, data: { status: "APPROVED" } });

  const [adminsA, adminsB] = await Promise.all([
    getActiveFamilyAdminUserIds(link.familyAId),
    getActiveFamilyAdminUserIds(link.familyBId),
  ]);
  await createNotifications([...adminsA, ...adminsB].filter((userId) => userId !== session.user.id), {
    type: "REQUEST_APPROVED",
    title: "تم قبول ربط عائلتين",
    body: `تم قبول الربط بين ${link.familyA.name} و${link.familyB.name}.`,
    href: `/dashboard/families/${link.familyAId}`,
    metadata: { linkId, familyAId: link.familyAId, familyBId: link.familyBId },
  });

  revalidatePath(`/dashboard/families/${link.familyAId}`);
  revalidatePath(`/dashboard/families/${link.familyBId}`);
  revalidatePath("/admin/families");
  revalidatePath("/dashboard/notifications");
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
    include: {
      familyA: { select: { name: true } },
      familyB: { select: { name: true } },
    },
  });
  if (!link || link.status !== "PENDING") {
    return { success: false, error: "الطلب غير موجود أو ليس معلقاً" };
  }

  await db.familyLink.update({
    where: { id: linkId },
    data: { status: "REJECTED", deletedAt: new Date() },
  });

  const [adminsA, adminsB] = await Promise.all([
    getActiveFamilyAdminUserIds(link.familyAId),
    getActiveFamilyAdminUserIds(link.familyBId),
  ]);
  await createNotifications([...adminsA, ...adminsB].filter((userId) => userId !== session.user.id), {
    type: "REQUEST_REJECTED",
    title: "تم رفض ربط عائلتين",
    body: `تم رفض الربط بين ${link.familyA.name} و${link.familyB.name}.`,
    href: `/dashboard/families/${link.familyAId}`,
    metadata: { linkId, familyAId: link.familyAId, familyBId: link.familyBId },
  });

  revalidatePath(`/dashboard/families/${link.familyAId}`);
  revalidatePath(`/dashboard/families/${link.familyBId}`);
  revalidatePath("/admin/families");
  revalidatePath("/dashboard/notifications");
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

// ─────────────────────────────────────────────────────────────────────────────
// Add a family link with APPROVED status immediately (family admin or system admin)
// Used from the public family page by family admins
// ─────────────────────────────────────────────────────────────────────────────

export async function addFamilyLink(
  familyAId: string,
  familyBId: string,
  linkType: "KINSHIP" | "IN_LAW",
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (familyAId === familyBId) return { success: false, error: "لا يمكن ربط العائلة بنفسها" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = await db.familyAdminAssignment.findFirst({
    where: { familyId: familyAId, userId: session.user.id, isActive: true },
  });
  if (!isSystemAdmin && !isFamilyAdmin) {
    return { success: false, error: "لا تملك صلاحية إضافة رابط لهذه العائلة" };
  }

  const [famA, famB] = await Promise.all([
    db.family.findUnique({ where: { id: familyAId, deletedAt: null }, select: { id: true, slug: true } }),
    db.family.findUnique({ where: { id: familyBId, deletedAt: null }, select: { id: true, slug: true } }),
  ]);
  if (!famA || !famB) return { success: false, error: "إحدى العائلتين غير موجودة" };

  // Normalize order so (A,B) and (B,A) map to the same record
  const [normA, normB] = [familyAId, familyBId].sort();

  // Check for any existing link (including soft-deleted) to avoid unique constraint violation
  const existing = await db.familyLink.findFirst({
    where: {
      OR: [
        { familyAId: normA, familyBId: normB },
        { familyAId: normB, familyBId: normA },
      ],
    },
  });

  if (existing && !existing.deletedAt) {
    return { success: false, error: "يوجد ربط مسبق بين هاتين العائلتين" };
  }

  if (existing && existing.deletedAt) {
    // Restore the soft-deleted link
    await db.familyLink.update({
      where: { id: existing.id },
      data: { deletedAt: null, status: "APPROVED", linkType, description: description?.trim() ?? null },
    });
  } else {
    await db.familyLink.create({
      data: { familyAId: normA, familyBId: normB, linkType, description: description?.trim() ?? null, status: "APPROVED" },
    });
  }

  revalidatePath(`/family/${famA.slug}`);
  revalidatePath(`/family/${famB.slug}`);
  revalidatePath(`/dashboard/families/${familyAId}`);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Remove an approved family link  (family admin of either side or system admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function removeFamilyLink(linkId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const link = await db.familyLink.findUnique({
    where: { id: linkId },
    include: {
      familyA: { select: { slug: true } },
      familyB: { select: { slug: true } },
    },
  });
  if (!link || link.deletedAt) return { success: false, error: "الرابط غير موجود" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [adminA, adminB] = await Promise.all([
    db.familyAdminAssignment.findFirst({ where: { familyId: link.familyAId, userId: session.user.id, isActive: true } }),
    db.familyAdminAssignment.findFirst({ where: { familyId: link.familyBId, userId: session.user.id, isActive: true } }),
  ]);
  if (!isSystemAdmin && !adminA && !adminB) {
    return { success: false, error: "لا تملك صلاحية حذف هذا الرابط" };
  }

  await db.familyLink.update({ where: { id: linkId }, data: { deletedAt: new Date() } });

  revalidatePath(`/family/${link.familyA.slug}`);
  revalidatePath(`/family/${link.familyB.slug}`);
  return { success: true };
}

// ── List families available for linking (not yet linked) ──────────────────────

export async function listFamiliesForLinking(
  currentFamilyId: string
): Promise<Array<{ id: string; name: string; slug: string }>> {
  const session = await auth();
  if (!session?.user) return [];

  const existingLinks = await db.familyLink.findMany({
    where: {
      deletedAt: null,
      status: { in: ["APPROVED", "PENDING"] },
      OR: [{ familyAId: currentFamilyId }, { familyBId: currentFamilyId }],
    },
    select: { familyAId: true, familyBId: true },
  });

  const alreadyLinkedIds = new Set<string>([currentFamilyId]);
  existingLinks.forEach((l) => {
    alreadyLinkedIds.add(l.familyAId);
    alreadyLinkedIds.add(l.familyBId);
  });

  return db.family.findMany({
    where: { deletedAt: null, id: { notIn: [...alreadyLinkedIds] } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}
