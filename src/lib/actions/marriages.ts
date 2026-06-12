"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateMarriageEligibility } from "@/lib/domain/family-rules/marriage-eligibility";

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

  const validation = await validateMarriageEligibility(personAId, personBId, {
    marriageDate: options?.marriageDate ?? null,
  });
  if (!validation.success) return validation;

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, validation.personA.familyId, isAdmin),
    canManageFamily(session.user.id, validation.personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  await db.marriageRelation.create({
    data: {
      personAId: validation.normalizedA,
      personBId: validation.normalizedB,
      marriageDate: options?.marriageDate ? new Date(options.marriageDate) : null,
      notes: options?.notes ?? null,
      status: validation.initialStatus,
    },
  });

  revalidatePath(`/dashboard/families/${validation.personA.familyId}`);
  revalidatePath(`/family/${validation.personA.familyId}`);
  if (validation.personB.familyId !== validation.personA.familyId) {
    revalidatePath(`/dashboard/families/${validation.personB.familyId}`);
    revalidatePath(`/family/${validation.personB.familyId}`);
  }
  return { success: true };
}

export async function removeMarriage(marriageId: string): Promise<MarriageResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const marriage = await db.marriageRelation.findUnique({
    where: { id: marriageId },
    include: {
      personA: { select: { familyId: true } },
      personB: { select: { familyId: true } },
    },
  });
  if (!marriage || marriage.deletedAt) return { success: false, error: "العلاقة غير موجودة" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, marriage.personA.familyId, isAdmin),
    canManageFamily(session.user.id, marriage.personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.marriageRelation.update({
    where: { id: marriageId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/families/${marriage.personA.familyId}`);
  revalidatePath(`/family/${marriage.personA.familyId}`);
  if (marriage.personB.familyId !== marriage.personA.familyId) {
    revalidatePath(`/dashboard/families/${marriage.personB.familyId}`);
    revalidatePath(`/family/${marriage.personB.familyId}`);
  }
  return { success: true };
}

export async function divorceMarriage(
  marriageId: string,
  divorceDate?: string,
  endReason?: "DIVORCE" | "DEATH_OF_SPOUSE" | "ANNULMENT" | "UNKNOWN"
): Promise<MarriageResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const marriage = await db.marriageRelation.findUnique({
    where: { id: marriageId },
    include: {
      personA: { select: { familyId: true } },
      personB: { select: { familyId: true } },
    },
  });
  if (!marriage || marriage.deletedAt) return { success: false, error: "العلاقة غير موجودة" };
  if (marriage.status === "ENDED") return { success: false, error: "الزواج منتهي بالفعل" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, marriage.personA.familyId, isAdmin),
    canManageFamily(session.user.id, marriage.personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية تسجيل الطلاق" };
  }

  if (divorceDate) {
    const { validateDivorceChronology } = await import("@/lib/domain/family-rules/chronology-validators");
    const divorceChronoResult = await validateDivorceChronology(marriageId, divorceDate, db);
    if (divorceChronoResult.status === "PROHIBITED") {
      return { success: false, error: divorceChronoResult.message };
    }
  }

  await db.marriageRelation.update({
    where: { id: marriageId },
    data: {
      status: "ENDED",
      divorceDate: divorceDate ? new Date(divorceDate) : null,
      endReason: endReason ?? "DIVORCE",
    },
  });

  revalidatePath(`/dashboard/families/${marriage.personA.familyId}`);
  revalidatePath(`/family/${marriage.personA.familyId}`);
  if (marriage.personB.familyId !== marriage.personA.familyId) {
    revalidatePath(`/dashboard/families/${marriage.personB.familyId}`);
    revalidatePath(`/family/${marriage.personB.familyId}`);
  }
  return { success: true };
}
