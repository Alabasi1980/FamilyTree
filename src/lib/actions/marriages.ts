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

// ─── Server-side mahram check ──────────────────────────────────────────────────
async function isMahram(personAId: string, personBId: string): Promise<boolean> {
  // 1. Direct ancestor or descendant (any depth)
  const ancestry = await db.personAncestry.findFirst({
    where: {
      OR: [
        { ancestorId: personAId, descendantId: personBId, depth: { gt: 0 } },
        { ancestorId: personBId, descendantId: personAId, depth: { gt: 0 } },
      ],
    },
  });
  if (ancestry) return true;

  // 2. Siblings (share at least one common parent)
  const [parentsA, parentsB] = await Promise.all([
    db.parentChildRelation.findMany({ where: { childPersonId: personAId }, select: { parentPersonId: true } }),
    db.parentChildRelation.findMany({ where: { childPersonId: personBId }, select: { parentPersonId: true } }),
  ]);
  const parentSetA = new Set(parentsA.map((p) => p.parentPersonId));
  const parentSetB = new Set(parentsB.map((p) => p.parentPersonId));
  for (const pid of parentSetA) {
    if (parentSetB.has(pid)) return true;
  }

  // 3. Aunts & Uncles — personB is a child of personA's grandparents (but not personA's parent)
  if (parentSetA.size > 0) {
    const gpRowsA = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...parentSetA] } },
      select: { parentPersonId: true },
    });
    const gpIdsA = [...new Set(gpRowsA.map((r) => r.parentPersonId))];
    if (gpIdsA.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: gpIdsA },
          childPersonId: personBId,
          NOT: { childPersonId: { in: [...parentSetA] } },
        },
      });
      if (auntUncle) return true;
    }
  }
  // Reverse: personA is uncle/aunt of personB
  if (parentSetB.size > 0) {
    const gpRowsB = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...parentSetB] } },
      select: { parentPersonId: true },
    });
    const gpIdsB = [...new Set(gpRowsB.map((r) => r.parentPersonId))];
    if (gpIdsB.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: gpIdsB },
          childPersonId: personAId,
          NOT: { childPersonId: { in: [...parentSetB] } },
        },
      });
      if (auntUncle) return true;
    }
  }

  // 4. Nieces & Nephews — personB is a descendant of personA's sibling (and vice versa)
  if (parentSetA.size > 0) {
    const siblingsA = await db.parentChildRelation.findMany({
      where: { parentPersonId: { in: [...parentSetA] }, NOT: { childPersonId: personAId } },
      select: { childPersonId: true },
    });
    const sibIdsA = siblingsA.map((s) => s.childPersonId);
    if (sibIdsA.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: sibIdsA }, descendantId: personBId, depth: { gt: 0 } },
      });
      if (niece) return true;
    }
  }
  if (parentSetB.size > 0) {
    const siblingsB = await db.parentChildRelation.findMany({
      where: { parentPersonId: { in: [...parentSetB] }, NOT: { childPersonId: personBId } },
      select: { childPersonId: true },
    });
    const sibIdsB = siblingsB.map((s) => s.childPersonId);
    if (sibIdsB.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: sibIdsB }, descendantId: personAId, depth: { gt: 0 } },
      });
      if (niece) return true;
    }
  }

  return false;
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

  // Must be opposite genders
  if (personA.gender === personB.gender) {
    return { success: false, error: "يجب أن يكون الزواج بين ذكر وأنثى" };
  }

  // User must be able to manage at least one of the two families
  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, personA.familyId, isAdmin),
    canManageFamily(session.user.id, personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  // Mahram check (blood-relation prohibition)
  const mahramRelated = await isMahram(personAId, personBId);
  if (mahramRelated) {
    return { success: false, error: "لا يجوز الزواج — المحرمات من النسب" };
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
  if (personB.familyId !== personA.familyId) {
    revalidatePath(`/dashboard/families/${personB.familyId}`);
    revalidatePath(`/family/${personB.familyId}`);
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
  divorceDate?: string
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
  if (marriage.status === "ENDED") return { success: false, error: "الزواج منتهٍ بالفعل" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, marriage.personA.familyId, isAdmin),
    canManageFamily(session.user.id, marriage.personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية تسجيل الطلاق" };
  }

  await db.marriageRelation.update({
    where: { id: marriageId },
    data: {
      status: "ENDED",
      divorceDate: divorceDate ? new Date(divorceDate) : null,
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
