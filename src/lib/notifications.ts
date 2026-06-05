import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";

interface NotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function getActiveFamilyAdminUserIds(familyId: string) {
  const rows = await db.familyAdminAssignment.findMany({
    where: { familyId, isActive: true },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

export async function getSystemAdminUserIds() {
  const rows = await db.user.findMany({
    where: { accountType: "SYSTEM_ADMIN", deletedAt: null },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function createNotifications(userIds: string[], input: NotificationInput) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return;

  await db.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      metadata: input.metadata ?? undefined,
    })),
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({
    where: { userId, readAt: null },
  });
}
