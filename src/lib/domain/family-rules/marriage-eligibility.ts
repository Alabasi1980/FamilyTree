import { db } from "@/lib/db";
import type { Gender } from "@/generated/prisma/client";
import {
  validateActiveMarriageLimits,
  validateConcurrentMarriageCombination,
  validateRemarriage,
} from "@/lib/domain/family-rules/marriage-validators";

type BloodMahramResult = "MAHRAM" | "UNCERTAIN" | "NOT_MAHRAM";

type MarriageEligibilityOptions = {
  allowCrossFamily?: boolean;
  marriageDate?: string | Date | null;
};

export type MarriageEligibilityResult =
  | {
      success: true;
      personA: { id: string; familyId: string; gender: Gender; isLiving: boolean };
      personB: { id: string; familyId: string; gender: Gender; isLiving: boolean };
      normalizedA: string;
      normalizedB: string;
      initialStatus: "ACTIVE" | "HISTORICAL";
    }
  | { success: false; error: string };

async function areBloodMahram(personAId: string, personBId: string): Promise<BloodMahramResult> {
  const unreliable = (confidence: string) => confidence === "UNVERIFIED" || confidence === "DISPUTED";
  let hasUncertainRelations = false;

  const ancestry = await db.personAncestry.findFirst({
    where: {
      OR: [
        { ancestorId: personAId, descendantId: personBId, depth: { gt: 0 } },
        { ancestorId: personBId, descendantId: personAId, depth: { gt: 0 } },
      ],
    },
  });
  if (ancestry) return "MAHRAM";

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

  const reliableParentSetA = new Set(
    parentsA.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId)
  );
  const reliableParentSetB = new Set(
    parentsB.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId)
  );
  const allParentSetA = new Set(parentsA.map((p) => p.parentPersonId));
  const allParentSetB = new Set(parentsB.map((p) => p.parentPersonId));

  for (const parentId of reliableParentSetA) {
    if (reliableParentSetB.has(parentId)) return "MAHRAM";
  }

  if (reliableParentSetA.size > 0) {
    const gpRowsA = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetA] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsA.some((row) => unreliable(row.confidence))) hasUncertainRelations = true;
    const reliableGpIdsA = [...new Set(gpRowsA.filter((row) => !unreliable(row.confidence)).map((row) => row.parentPersonId))];
    if (reliableGpIdsA.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: reliableGpIdsA },
          childPersonId: personBId,
          NOT: { childPersonId: { in: [...allParentSetA] } },
        },
      });
      if (auntUncle) return "MAHRAM";
    }
  }

  if (reliableParentSetB.size > 0) {
    const gpRowsB = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetB] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsB.some((row) => unreliable(row.confidence))) hasUncertainRelations = true;
    const reliableGpIdsB = [...new Set(gpRowsB.filter((row) => !unreliable(row.confidence)).map((row) => row.parentPersonId))];
    if (reliableGpIdsB.length > 0) {
      const auntUncle = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: reliableGpIdsB },
          childPersonId: personAId,
          NOT: { childPersonId: { in: [...allParentSetB] } },
        },
      });
      if (auntUncle) return "MAHRAM";
    }
  }

  if (reliableParentSetA.size > 0) {
    const siblingsA = await db.parentChildRelation.findMany({
      where: {
        parentPersonId: { in: [...reliableParentSetA] },
        relationType: "BIOLOGICAL",
        NOT: { childPersonId: personAId },
      },
      select: { childPersonId: true },
    });
    const siblingIdsA = siblingsA.map((sibling) => sibling.childPersonId);
    if (siblingIdsA.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: siblingIdsA }, descendantId: personBId, depth: { gt: 0 } },
      });
      if (niece) return "MAHRAM";
    }
  }

  if (reliableParentSetB.size > 0) {
    const siblingsB = await db.parentChildRelation.findMany({
      where: {
        parentPersonId: { in: [...reliableParentSetB] },
        relationType: "BIOLOGICAL",
        NOT: { childPersonId: personBId },
      },
      select: { childPersonId: true },
    });
    const siblingIdsB = siblingsB.map((sibling) => sibling.childPersonId);
    if (siblingIdsB.length > 0) {
      const niece = await db.personAncestry.findFirst({
        where: { ancestorId: { in: siblingIdsB }, descendantId: personAId, depth: { gt: 0 } },
      });
      if (niece) return "MAHRAM";
    }
  }

  return hasUncertainRelations ? "UNCERTAIN" : "NOT_MAHRAM";
}

export async function validateMarriageEligibility(
  personAId: string,
  personBId: string,
  options: MarriageEligibilityOptions = {}
): Promise<MarriageEligibilityResult> {
  if (personAId === personBId) return { success: false, error: "لا يمكن ربط الشخص بنفسه" };

  const [personA, personB] = await Promise.all([
    db.person.findUnique({
      where: { id: personAId },
      select: { id: true, familyId: true, gender: true, isLiving: true, deletedAt: true },
    }),
    db.person.findUnique({
      where: { id: personBId },
      select: { id: true, familyId: true, gender: true, isLiving: true, deletedAt: true },
    }),
  ]);

  if (!personA || personA.deletedAt || !personB || personB.deletedAt) {
    return { success: false, error: "الشخص غير موجود" };
  }

  if (personA.gender === personB.gender) {
    return { success: false, error: "يجب أن يكون الزواج بين ذكر وأنثى" };
  }

  if (!options.allowCrossFamily && personA.familyId !== personB.familyId) {
    return {
      success: false,
      error: "الشخصان من عائلتين مختلفتين — يجب استخدام مسار طلب الزواج العابر للعائلتين للحصول على موافقة الطرفين",
    };
  }

  const bloodResult = await areBloodMahram(personAId, personBId);
  if (bloodResult === "MAHRAM") {
    return { success: false, error: "لا يجوز الزواج — المحرمات من النسب" };
  }
  if (bloodResult === "UNCERTAIN") {
    return {
      success: false,
      error: "تعذر التحقق من سلامة الزواج — بعض علاقات النسب غير موثوقة. يرجى توثيق علاقات النسب أولاً",
    };
  }

  const { validateAffinityMahram } = await import("@/lib/domain/family-rules/affinity-validators");
  const affinityResult = await validateAffinityMahram(personAId, personBId, db);
  if (affinityResult.status === "PROHIBITED") {
    return { success: false, error: affinityResult.message };
  }

  const { validateNursingMahram } = await import("@/lib/domain/family-rules/nursing-validators");
  const nursingResult = await validateNursingMahram(personAId, personBId, db);
  if (nursingResult.status === "PROHIBITED" || nursingResult.status === "INSUFFICIENT_DATA") {
    return { success: false, error: nursingResult.message };
  }

  const remarriageResult = await validateRemarriage(personAId, personBId, db);
  if (remarriageResult.status === "PROHIBITED") {
    return { success: false, error: remarriageResult.message };
  }

  const limitsResult = await validateActiveMarriageLimits(personAId, personBId, db);
  if (limitsResult.status === "PROHIBITED") {
    return { success: false, error: limitsResult.message };
  }

  const maleId = personA.gender === "MALE" ? personAId : personBId;
  const femaleId = personA.gender === "MALE" ? personBId : personAId;
  const combinationResult = await validateConcurrentMarriageCombination(maleId, femaleId, db);
  if (combinationResult.status === "PROHIBITED" || combinationResult.status === "INSUFFICIENT_DATA") {
    return { success: false, error: combinationResult.message };
  }

  const { validateMarriageChronology } = await import("@/lib/domain/family-rules/chronology-validators");
  const chronologyResult = await validateMarriageChronology(
    personAId,
    personBId,
    options.marriageDate ?? null,
    null,
    db
  );
  if (chronologyResult.status === "PROHIBITED") {
    return { success: false, error: chronologyResult.message };
  }

  const [normalizedA, normalizedB] = [personAId, personBId].sort();
  return {
    success: true,
    personA,
    personB,
    normalizedA,
    normalizedB,
    initialStatus: !personA.isLiving && !personB.isLiving ? "HISTORICAL" : "ACTIVE",
  };
}
