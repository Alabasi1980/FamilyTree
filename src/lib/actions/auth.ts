"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم قصير جداً").max(100),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().min(9, "رقم الهاتف قصير").optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type RegisterResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerUser(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "بيانات غير صحيحة",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v ?? []])
      ),
    };
  }

  const { fullName, email, phone, password } = parsed.data;

  if (!email && !phone) {
    return { success: false, error: "يجب تقديم بريد إلكتروني أو رقم هاتف" };
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined,
      ].filter(Boolean) as { email?: string; phone?: string }[],
    },
  });

  if (existing) {
    return { success: false, error: "هذا البريد أو الهاتف مسجّل مسبقاً" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      fullName,
      email: email || null,
      phone: phone || null,
      passwordHash,
      accountType: "MEMBER",
    },
  });

  return { success: true };
}

export type LoginDiagnosis = "no_account" | "google_only" | "has_password";

export async function checkLoginReason(emailOrPhone: string): Promise<LoginDiagnosis> {
  const user = await db.user.findFirst({
    where: {
      OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      deletedAt: null,
    },
    select: { passwordHash: true },
  });
  if (!user) return "no_account";
  if (!user.passwordHash) return "google_only";
  return "has_password";
}
