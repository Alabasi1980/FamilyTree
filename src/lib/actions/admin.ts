"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { AccountType } from "@/generated/prisma/client";

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

  await db.user.update({ where: { id: userId }, data: { accountType: newRole } });
  revalidatePath("/admin/users");
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
