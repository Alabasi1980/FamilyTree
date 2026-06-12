"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { AccountType } from "@/generated/prisma/client";
import { createNotifications } from "@/lib/notifications";

// ── Users ──────────────────────────────────────────────────────────────────

export async function changeUserRole(
  userId: string,
  newRole: AccountType
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "غير مصرح" };
  }
  if (userId === session.user.id) {
    return { success: false, error: "لا يمكنك تغيير دورك الخاص" };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { accountType: true },
  });
  if (!target) return { success: false, error: "المستخدم غير موجود" };

  if (target.accountType === "SYSTEM_ADMIN" && newRole !== "SYSTEM_ADMIN") {
    const systemAdmins = await db.user.count({
      where: { accountType: "SYSTEM_ADMIN", deletedAt: null },
    });
    if (systemAdmins <= 1) return { success: false, error: "لا يمكن إزالة آخر مدير نظام" };
  }

  // This changes the global account role only. FamilyAdminAssignment remains intact.
  await db.user.update({ where: { id: userId }, data: { accountType: newRole } });
  revalidatePath("/admin/users");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ── Families ───────────────────────────────────────────────────────────────

async function assertSystemAdmin() {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    throw new Error("غير مصرح");
  }
  return session.user;
}

export async function toggleFamilyPublic(
  familyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSystemAdmin();
    const family = await db.family.findUnique({ where: { id: familyId }, select: { isPublic: true } });
    if (!family) return { success: false, error: "العائلة غير موجودة" };
    await db.family.update({ where: { id: familyId }, data: { isPublic: !family.isPublic } });
    revalidatePath("/admin/families");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function removeFamilyAdmin(
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSystemAdmin();
    await db.familyAdminAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });
    revalidatePath("/admin/families");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function deleteFamily(
  familyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSystemAdmin();
    await db.family.update({ where: { id: familyId }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/families");
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

export async function restoreFamily(
  familyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSystemAdmin();
    await db.family.update({ where: { id: familyId }, data: { deletedAt: null } });
    revalidatePath("/admin/families");
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "غير مصرح" };
  }
}

// ── Co-admin management (family admin or system admin) ─────────────────────

async function assertCanManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const a = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  if (!a) throw new Error("لا تملك صلاحية إدارة هذه العائلة");
  return true;
}

export async function assignCoAdmin(
  familyId: string,
  emailOrPhone: string
): Promise<{ success: boolean; error?: string; userName?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  try {
    await assertCanManageFamily(session.user.id, familyId, isSystemAdmin);
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  const family = await db.family.findUnique({ where: { id: familyId }, select: { name: true } });
  if (!family) return { success: false, error: "العائلة غير موجودة" };

  // Find target user
  const target = await db.user.findFirst({
    where: {
      OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      deletedAt: null,
    },
    select: { id: true, fullName: true, name: true },
  });
  if (!target) return { success: false, error: "لم يُعثر على مستخدم بهذا البريد أو الهاتف" };
  if (target.id === session.user.id) return { success: false, error: "لا يمكنك تعيين نفسك" };

  // Check not already active admin
  const existing = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId: target.id, isActive: true },
  });
  if (existing) return { success: false, error: "هذا المستخدم مسؤول على العائلة مسبقاً" };

  await db.familyAdminAssignment.create({
    data: { familyId, userId: target.id, assignedByUserId: session.user.id },
  });

  // Notify the assigned user
  await createNotifications([target.id], {
    type: "REQUEST_APPROVED",
    title: "تم تعيينك مسؤولاً على عائلة",
    body: `تم تعيينك كمسؤول على عائلة ${family.name}.`,
    href: `/dashboard/families`,
    metadata: { familyId },
  });

  const name = target.fullName ?? target.name ?? emailOrPhone;
  revalidatePath(`/dashboard/families/${familyId}`);
  revalidatePath(`/admin/families`);
  return { success: true, userName: name };
}

export async function removeCoAdmin(
  assignmentId: string,
  familyId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  try {
    await assertCanManageFamily(session.user.id, familyId, isSystemAdmin);
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }

  const assignment = await db.familyAdminAssignment.findUnique({
    where: { id: assignmentId },
    select: { userId: true, familyId: true, isActive: true },
  });
  if (!assignment || !assignment.isActive) return { success: false, error: "التعيين غير موجود" };
  if (assignment.familyId !== familyId) {
    return { success: false, error: "التعيين لا يتبع هذه العائلة" };
  }
  if (assignment.userId === session.user.id) {
    // Check if last admin
    const count = await db.familyAdminAssignment.count({
      where: { familyId: assignment.familyId, isActive: true },
    });
    if (count <= 1) return { success: false, error: "لا يمكنك إزالة نفسك وأنت المسؤول الوحيد" };
  }

  await db.familyAdminAssignment.update({ where: { id: assignmentId }, data: { isActive: false } });
  revalidatePath(`/dashboard/families/${familyId}`);
  return { success: true };
}
