"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  validateActiveMarriageLimits,
  validateConcurrentMarriageCombination,
  validateRemarriage,
} from "@/lib/domain/family-rules/marriage-validators";

export type MarriageResult = { success: true } | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

// ─── Server-side blood-mahram check (confidence-aware) ────────────────────────
// Returns:
//   "MAHRAM"     — confirmed via VERIFIED or LIKELY relations
//   "UNCERTAIN"  — no confirmed path but UNVERIFIED/DISPUTED relations may conceal one
//   "NOT_MAHRAM" — no mahram path and all checked relations are reliable
type BloodMahramResult = "MAHRAM" | "UNCERTAIN" | "NOT_MAHRAM";

async function isMahram(personAId: string, personBId: string): Promise<BloodMahramResult> {
  const unreliable = (c: string) => c === "UNVERIFIED" || c === "DISPUTED";
  let hasUncertainRelations = false;

  // 1. Direct ancestor or descendant (PersonAncestry is built from BIOLOGICAL only)
  const ancestry = await db.personAncestry.findFirst({
    where: {
      OR: [
        { ancestorId: personAId, descendantId: personBId, depth: { gt: 0 } },
        { ancestorId: personBId, descendantId: personAId, depth: { gt: 0 } },
      ],
    },
  });
  if (ancestry) return "MAHRAM";

  // 2. Siblings (share at least one common biological parent)
  const [parentsA, parentsB] = await Promise.all([
    db.parentChildRelation.findMany({
      where: { childPersonId: personAId, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    }),
    db.parentChildRelation.findMany({
      where: { childPersonId: personBId, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    }),
  ]);

  if (parentsA.some((p) => unreliable(p.confidence)) || parentsB.some((p) => unreliable(p.confidence))) {
    hasUncertainRelations = true;
  }

  const reliableParentSetA = new Set(parentsA.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId));
  const reliableParentSetB = new Set(parentsB.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId));
  const allParentSetA = new Set(parentsA.map((p) => p.parentPersonId));
  const allParentSetB = new Set(parentsB.map((p) => p.parentPersonId));

  for (const pid of reliableParentSetA) {
    if (reliableParentSetB.has(pid)) return "MAHRAM";
  }

  // 3. Aunts & Uncles
  if (reliableParentSetA.size > 0) {
    const gpRowsA = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetA] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsA.some((r) => unreliable(r.confidence))) hasUncertainRelations = true;
    const reliableGpIdsA = [...new Set(gpRowsA.filter((r) => !unreliable(r.confidence)).map((r) => r.parentPersonId))];
    if (reliableGpIdsA.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: { parentPersonId: { in: reliableGpIdsA }, childPersonId: personBId, NOT: { childPersonId: { in: [...allParentSetA] } } },
      });
      if (auntUncle) return "MAHRAM";
    }
  }
  if (reliableParentSetB.size > 0) {
    const gpRowsB = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetB] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsB.some((r) => unreliable(r.confidence))) hasUncertainRelations = true;
    const reliableGpIdsB = [...new Set(gpRowsB.filter((r) => !unreliable(r.confidence)).map((r) => r.parentPersonId))];
    if (reliableGpIdsB.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: { parentPersonId: { in: reliableGpIdsB }, childPersonId: personAId, NOT: { childPersonId: { in: [...allParentSetB] } } },
      });
      if (auntUncle) return "MAHRAM";
    }
  }

  // 4. Nieces & Nephews
  if (reliableParentSetA.size > 0) {
    const siblingsA = await db.parentChildRelation.findMany({
      where: { parentPersonId: { in: [...reliableParentSetA] }, relationType: "BIOLOGICAL", NOT: { childPersonId: personAId } },
      select: { childPersonId: true },
    });
    const sibIdsA = siblingsA.map((s) => s.childPersonId);
    if (sibIdsA.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: sibIdsA }, descendantId: personBId, depth: { gt: 0 } },
      });
      if (niece) return "MAHRAM";
    }
  }
  if (reliableParentSetB.size > 0) {
    const siblingsB = await db.parentChildRelation.findMany({
      where: { parentPersonId: { in: [...reliableParentSetB] }, relationType: "BIOLOGICAL", NOT: { childPersonId: personBId } },
      select: { childPersonId: true },
    });
    const sibIdsB = siblingsB.map((s) => s.childPersonId);
    if (sibIdsB.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: sibIdsB }, descendantId: personAId, depth: { gt: 0 } },
      });
      if (niece) return "MAHRAM";
    }
  }

  return hasUncertainRelations ? "UNCERTAIN" : "NOT_MAHRAM";
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

  // Cross-family marriages require a formal approval workflow
  if (personA.familyId !== personB.familyId) {
    return {
      success: false,
      error:
        "الشخصان من عائلتين مختلفتين — يجب استخدام مسار طلب الزواج العابر للعائلتين للحصول على موافقة الطرفين",
    };
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

  // Mahram check (blood-relation prohibition, confidence-aware)
  const mahramResult = await isMahram(personAId, personBId);
  if (mahramResult === "MAHRAM") {
    return { success: false, error: "لا يجوز الزواج — المحرمات من النسب" };
  }
  if (mahramResult === "UNCERTAIN") {
    return { success: false, error: "تعذر التحقق من سلامة الزواج — بعض علاقات النسب غير موثوقة. يرجى توثيق علاقات النسب أولاً" };
  }

  // Affinity mahram check (زوجة الأب، زوجة الابن، أم الزوجة، الربيبة)
  const { validateAffinityMahram } = await import("@/lib/domain/family-rules/affinity-validators");
  const affinityResult = await validateAffinityMahram(personAId, personBId, db);
  if (affinityResult.status === "PROHIBITED") {
    return { success: false, error: affinityResult.message };
  }

  // Nursing mahram check (محرمات الرضاعة — يحرم من الرضاع ما يحرم من النسب)
  const { validateNursingMahram } = await import("@/lib/domain/family-rules/nursing-validators");
  const nursingResult = await validateNursingMahram(personAId, personBId, db);
  if (nursingResult.status === "PROHIBITED" || nursingResult.status === "INSUFFICIENT_DATA") {
    return { success: false, error: nursingResult.message };
  }

  // Duplicate active marriage check (allows remarriage after ENDED)
  const remarriageResult = await validateRemarriage(personAId, personBId, db);
  if (remarriageResult.status === "PROHIBITED") {
    return { success: false, error: remarriageResult.message };
  }

  // Active marriage limits: max 4 wives for male, max 1 husband for female
  const limitsResult = await validateActiveMarriageLimits(personAId, personBId, db);
  if (limitsResult.status === "PROHIBITED") {
    return { success: false, error: limitsResult.message };
  }

  // Concurrent combination prohibition (Jama' between blood mahrams)
  const maleId = personA.gender === "MALE" ? personAId : personBId;
  const femaleId = personA.gender === "MALE" ? personBId : personAId;
  const combinationResult = await validateConcurrentMarriageCombination(maleId, femaleId, db);
  if (combinationResult.status === "PROHIBITED") {
    return { success: false, error: combinationResult.message };
  }

  // Validate marriage date against birth/death dates of both parties
  const { validateMarriageChronology } = await import("@/lib/domain/family-rules/chronology-validators");
  const marriageChronoResult = await validateMarriageChronology(
    personAId,
    personBId,
    options?.marriageDate ?? null,
    null,
    db
  );
  if (marriageChronoResult.status === "PROHIBITED") {
    return { success: false, error: marriageChronoResult.message };
  }

  // Auto-determine status: if both persons are deceased, record as HISTORICAL rather than ACTIVE
  const bothDeceased = !personA.isLiving && !personB.isLiving;
  const initialStatus = bothDeceased ? "HISTORICAL" : "ACTIVE";

  // Normalize order so the partial unique index (LEAST/GREATEST) works consistently
  const [normalizedA, normalizedB] = [personAId, personBId].sort();
  await db.marriageRelation.create({
    data: {
      personAId: normalizedA,
      personBId: normalizedB,
      marriageDate: options?.marriageDate ? new Date(options.marriageDate) : null,
      notes: options?.notes ?? null,
      status: initialStatus,
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
  if (marriage.status === "ENDED") return { success: false, error: "الزواج منتهٍ بالفعل" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const [canManageA, canManageB] = await Promise.all([
    canManageFamily(session.user.id, marriage.personA.familyId, isAdmin),
    canManageFamily(session.user.id, marriage.personB.familyId, isAdmin),
  ]);
  if (!canManageA && !canManageB) {
    return { success: false, error: "لا تملك صلاحية تسجيل الطلاق" };
  }

  // Validate divorce date is after marriage date
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
