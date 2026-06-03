"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type MarriageResult = { success: true } | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

export async function addMarriage(
  personAId: string,
  personBId: string,
  options?: { marriageDate?: string; notes?: string }
): Promise<MarriageResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (personAId === personBId) return { success: false, error: "لا يمكن ربط الشخص بنفسه" };

  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: personAId } }),
    db.person.findUnique({ where: { id: personBId } }),
  ]);

  if (!personA || personA.deletedAt || !personB || personB.deletedAt) {
    return { success: false, error: "الشخص غير موجود" };
  }
  if (personA.familyId !== personB.familyId) {
    return { success: false, error: "الشخصان من عائلتين مختلفتين" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, personA.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  const existing = await db.marriageRelation.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { personAId, personBId },
        { personAId: personBId, personBId: personAId },
      ],
    },
  });
  if (existing) return { success: false, error: "علاقة الزواج موجودة بالفعل" };

  await db.marriageRelation.create({
    data: {
      personAId,
      personBId,
      marriageDate: options?.marriageDate ? new Date(options.marriageDate) : null,
      notes: options?.notes ?? null,
    },
  });

  revalidatePath(`/dashboard/families/${personA.familyId}`);
  revalidatePath(`/family/${personA.familyId}`);
  return { success: true };
}

export async function removeMarriage(marriageId: string): Promise<MarriageResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const marriage = await db.marriageRelation.findUnique({
    where: { id: marriageId },
    include: { personA: { select: { familyId: true } } },
  });
  if (!marriage || marriage.deletedAt) return { success: false, error: "العلاقة غير موجودة" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, marriage.personA.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.marriageRelation.update({
    where: { id: marriageId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/families/${marriage.personA.familyId}`);
  revalidatePath(`/family/${marriage.personA.familyId}`);
  return { success: true };
}
