"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { withBasePath } from "@/lib/base-path";
import { randomBytes } from "crypto";
import { getShareAccessCookieName, signShareAccessToken } from "@/lib/share-access";

// ─────────────────────────────────────────────────────────────────────────────
// Create a share link for a family
// ─────────────────────────────────────────────────────────────────────────────

export type ShareLinkResult =
  | { success: true; id: string; token: string }
  | { success: false; error: string };

export async function createShareLink(
  familyId: string,
  opts: { password?: string; expiresInDays?: number }
): Promise<ShareLinkResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId: session.user.id, isActive: true },
  });

  if (!isSystemAdmin && !isFamilyAdmin) {
    return { success: false, error: "لا تملك صلاحية إنشاء رابط مشاركة لهذه العائلة" };
  }

  const family = await db.family.findUnique({ where: { id: familyId, deletedAt: null } });
  if (!family) return { success: false, error: "العائلة غير موجودة" };

  const passwordHash = opts.password
    ? await bcrypt.hash(opts.password, 10)
    : null;

  const expiresAt = opts.expiresInDays
    ? new Date(Date.now() + opts.expiresInDays * 86_400_000)
    : null;

  const link = await db.shareLink.create({
    data: {
      targetType: "FAMILY",
      familyId,
      token: randomBytes(32).toString("base64url"),
      passwordHash,
      expiresAt,
      createdByUserId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/families/${familyId}`);
  return { success: true, id: link.id, token: link.token };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deactivate a share link
// ─────────────────────────────────────────────────────────────────────────────

export async function deactivateShareLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const link = await db.shareLink.findUnique({
    where: { id: linkId },
    select: { createdByUserId: true, familyId: true },
  });
  if (!link) return { success: false, error: "الرابط غير موجود" };

  const isOwner = link.createdByUserId === session.user.id;
  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = link.familyId
    ? !!(await db.familyAdminAssignment.findFirst({
        where: { familyId: link.familyId, userId: session.user.id, isActive: true },
      }))
    : false;

  if (!isOwner && !isSystemAdmin && !isFamilyAdmin) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.shareLink.update({ where: { id: linkId }, data: { isActive: false } });
  if (link.familyId) revalidatePath(`/dashboard/families/${link.familyId}`);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify password for a password-protected share link (sets httpOnly cookie)
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyShareLinkPassword(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const link = await db.shareLink.findUnique({
    where: { token },
    select: { passwordHash: true, isActive: true, expiresAt: true },
  });

  if (!link || !link.isActive) return { success: false, error: "الرابط غير صالح" };
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { success: false, error: "انتهت صلاحية الرابط" };
  }
  if (!link.passwordHash) return { success: true }; // no password needed

  const valid = await bcrypt.compare(password, link.passwordHash);
  if (!valid) return { success: false, error: "كلمة المرور غير صحيحة" };

  // Set a short-lived access cookie (1 day)
  const jar = await cookies();
  jar.set(getShareAccessCookieName(token), signShareAccessToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: withBasePath(`/share/${token}`),
    maxAge: 86_400, // 24 hours
  });

  redirect(withBasePath(`/share/${token}`));
}
