"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createNotifications, getActiveFamilyAdminUserIds } from "@/lib/notifications";

export async function requestUserPersonLink(
  personId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const userId = session.user.id;

  // التحقق من أن المستخدم غير مرتبط بالفعل
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { linkedPersonId: true },
  });
  if (user?.linkedPersonId) return { success: false, error: "أنت مرتبط بورقة بالفعل" };

  const person = await db.person.findUnique({
    where: { id: personId, deletedAt: null },
    select: { id: true, fullName: true, familyId: true },
  });
  if (!person) return { success: false, error: "الشخص غير موجود" };

  // لا يجوز تقديم طلب لنفس الشخص مرتين
  const existing = await db.adminRequest.findFirst({
    where: {
      submittedByUserId: userId,
      targetPersonId: personId,
      requestType: "LINK_USER_TO_PERSON",
      status: "PENDING",
    },
  });
  if (existing) return { success: false, error: "قدّمت طلباً لهذا الشخص بالفعل" };

  await db.adminRequest.create({
    data: {
      requestType: "LINK_USER_TO_PERSON",
      submittedByUserId: userId,
      targetPersonId: personId,
      targetFamilyId: person.familyId,
    },
  });

  const adminIds = await getActiveFamilyAdminUserIds(person.familyId);
  await createNotifications(adminIds.filter((id) => id !== userId), {
    type: "REQUEST_SUBMITTED",
    title: "طلب ربط مستخدم بشخص",
    body: `طلب مستخدم ربط نفسه بـ "${person.fullName}"`,
  });

  revalidatePath("/dashboard/requests");
  return { success: true };
}

export async function applyUserPersonLink(
  submittedByUserId: string,
  targetPersonId: string
): Promise<void> {
  await db.user.update({
    where: { id: submittedByUserId },
    data: { linkedPersonId: targetPersonId },
  });
  revalidatePath("/dashboard/settings");
}
