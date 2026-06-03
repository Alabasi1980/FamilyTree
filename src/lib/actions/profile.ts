"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  fullName: z.string().min(2, "الاسم قصير جداً").max(100, "الاسم طويل جداً"),
});

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfile(data: {
  fullName: string;
}): Promise<ProfileActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { fullName: parsed.data.fullName.trim() },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
