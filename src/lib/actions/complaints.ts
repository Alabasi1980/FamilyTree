"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotifications, getSystemAdminUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ComplaintStatus, ComplaintType } from "@/generated/prisma/client";

const complaintSchema = z.object({
  type: z.enum([
    "ACCOUNT_ACCESS",
    "FAMILY_ADMINISTRATION",
    "DATA_CORRECTION",
    "PRIVACY_SAFETY",
    "FAMILY_LINKING",
    "TECHNICAL_ISSUE",
    "OTHER",
  ]),
  familyId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().min(3, "عنوان الشكوى قصير").max(160),
  body: z.string().min(10, "تفاصيل الشكوى قصيرة").max(3000),
});

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "WAITING_USER", "RESOLVED", "CLOSED"]),
  adminResponse: z.string().max(3000).optional(),
});

const statusLabels: Record<ComplaintStatus, string> = {
  OPEN: "مفتوحة",
  IN_REVIEW: "قيد المراجعة",
  WAITING_USER: "بانتظار المستخدم",
  RESOLVED: "محلولة",
  CLOSED: "مغلقة",
};

const typeLabels: Record<ComplaintType, string> = {
  ACCOUNT_ACCESS: "مشكلة وصول أو حساب",
  FAMILY_ADMINISTRATION: "إدارة أو صلاحيات عائلة",
  DATA_CORRECTION: "تصحيح بيانات",
  PRIVACY_SAFETY: "خصوصية أو سلامة",
  FAMILY_LINKING: "ربط عائلات أو توحيد فروع",
  TECHNICAL_ISSUE: "مشكلة تقنية",
  OTHER: "أخرى",
};

export async function submitComplaint(rawData: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const parsed = complaintSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = parsed.data;
  const complaint = await db.complaint.create({
    data: {
      submittedByUserId: session.user.id,
      type: data.type,
      familyId: data.familyId || null,
      title: data.title.trim(),
      body: data.body.trim(),
    },
    select: { id: true, title: true, type: true },
  });

  const systemAdmins = await getSystemAdminUserIds();
  await createNotifications(systemAdmins.filter((id) => id !== session.user.id), {
    type: "COMPLAINT_SUBMITTED",
    title: "شكوى جديدة",
    body: `${typeLabels[complaint.type]}: ${complaint.title}`,
    href: `/admin/complaints#complaint-${complaint.id}`,
    metadata: { complaintId: complaint.id, complaintType: complaint.type },
  });

  revalidatePath("/dashboard/complaints");
  revalidatePath("/admin/complaints");
  revalidatePath("/dashboard/notifications");
  return { success: true, complaintId: complaint.id };
}

export async function updateComplaintStatus(complaintId: string, rawData: unknown) {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "غير مصرح" };
  }

  const parsed = updateSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existing = await db.complaint.findUnique({
    where: { id: complaintId },
    select: { submittedByUserId: true, title: true },
  });
  if (!existing) return { success: false, error: "الشكوى غير موجودة" };

  const data = parsed.data;
  await db.complaint.update({
    where: { id: complaintId },
    data: {
      status: data.status,
      adminResponse: data.adminResponse?.trim() || null,
      handledByUserId: session.user.id,
      resolvedAt: data.status === "RESOLVED" || data.status === "CLOSED" ? new Date() : null,
    },
  });

  await createNotifications([existing.submittedByUserId].filter((id) => id !== session.user.id), {
    type: "COMPLAINT_UPDATED",
    title: "تحديث على شكواك",
    body: `تم تحديث حالة الشكوى "${existing.title}" إلى ${statusLabels[data.status]}.`,
    href: `/dashboard/complaints#complaint-${complaintId}`,
    metadata: { complaintId, complaintStatus: data.status },
  });

  revalidatePath("/admin/complaints");
  revalidatePath("/dashboard/complaints");
  revalidatePath("/dashboard/notifications");
  return { success: true };
}
