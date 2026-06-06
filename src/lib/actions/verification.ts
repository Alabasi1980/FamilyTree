"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAndStoreOtp, verifyAndConsumeOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function sendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user?.email) return { success: false, error: "لا يوجد بريد إلكتروني في حسابك" };
  if (user.emailVerified) return { success: false, error: "بريدك الإلكتروني مؤكد بالفعل" };

  const otp = await generateAndStoreOtp(user.email);
  const result = await sendOtpEmail(user.email, otp);

  if (!result.success) return { success: false, error: result.error };
  return { success: true };
}

export async function verifyEmailOtp(code: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user?.email) return { success: false, error: "لا يوجد بريد إلكتروني" };
  if (user.emailVerified) return { success: false, error: "بريدك الإلكتروني مؤكد بالفعل" };

  const result = await verifyAndConsumeOtp(user.email, code);

  if (result === "expired") return { success: false, error: "انتهت صلاحية الرمز — أرسل رمزاً جديداً" };
  if (result === "invalid") return { success: false, error: "الرمز غير صحيح" };

  await db.user.update({
    where: { id: session.user.id },
    data: { emailVerified: new Date() },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updatePhone(phone: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const cleaned = phone.trim();
  if (cleaned && cleaned.length < 9) return { success: false, error: "رقم الهاتف قصير جداً" };

  // التحقق من عدم التكرار
  if (cleaned) {
    const existing = await db.user.findFirst({
      where: { phone: cleaned, id: { not: session.user.id } },
    });
    if (existing) return { success: false, error: "رقم الهاتف مسجّل بحساب آخر" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { phone: cleaned || null },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
