import type { PrismaClient } from "@/generated/prisma/client";
import { allowed, insufficientData, prohibited, ValidationResult } from "./index";

type DbClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// "MAHRAM" = confirmed via VERIFIED/LIKELY relations
// "NOT_MAHRAM" = no mahram path found
// "UNCERTAIN" = no confirmed mahram path, but UNVERIFIED/DISPUTED relations exist that could conceal one
type MahramResult = "MAHRAM" | "NOT_MAHRAM" | "UNCERTAIN";

export async function validateActiveMarriageLimits(
  personAId: string,
  personBId: string,
  db: DbClient
): Promise<ValidationResult> {
  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: personAId }, select: { gender: true } }),
    db.person.findUnique({ where: { id: personBId }, select: { gender: true } }),
  ]);

  if (!personA || !personB) {
    return insufficientData("PERSONS_NOT_FOUND", "أحد الطرفين غير موجود");
  }

  const maleId = personA.gender === "MALE" ? personAId : personBId;
  const femaleId = personA.gender === "FEMALE" ? personAId : personBId;

  const activeWifeCount = await db.marriageRelation.count({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ personAId: maleId }, { personBId: maleId }],
    },
  });
  if (activeWifeCount >= 4) {
    return prohibited("MALE_MARRIAGE_LIMIT", "وصل الرجل الحد الأقصى من الزوجات النشطات (4)");
  }

  const activeHusband = await db.marriageRelation.findFirst({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ personAId: femaleId }, { personBId: femaleId }],
    },
  });
  if (activeHusband) {
    return prohibited("FEMALE_ACTIVE_MARRIAGE", "المرأة لها زوج نشط بالفعل");
  }

  return allowed();
}

export async function validateRemarriage(
  personAId: string,
  personBId: string,
  db: DbClient
): Promise<ValidationResult> {
  const existing = await db.marriageRelation.findFirst({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { personAId, personBId },
        { personAId: personBId, personBId: personAId },
      ],
    },
  });
  if (existing) {
    return prohibited("DUPLICATE_ACTIVE_MARRIAGE", "يوجد زواج نشط بين هذين الشخصين بالفعل");
  }
  return allowed();
}

export async function validateConcurrentMarriageCombination(
  maleId: string,
  newFemaleId: string,
  db: DbClient
): Promise<ValidationResult> {
  const activeMarriages = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ personAId: maleId }, { personBId: maleId }],
    },
    select: { personAId: true, personBId: true },
  });

  const currentWifeIds = activeMarriages.map((m) =>
    m.personAId === maleId ? m.personBId : m.personAId
  );

  if (currentWifeIds.length === 0) return allowed();

  for (const wifeId of currentWifeIds) {
    const result = await areBloodMahram(wifeId, newFemaleId, db);
    if (result === "MAHRAM") {
      return prohibited(
        "CONCURRENT_COMBINATION_FORBIDDEN",
        "لا يجوز الجمع بين هذه المرأة وإحدى زوجاته الحاليات — محارم بالنسب"
      );
    }
    if (result === "UNCERTAIN") {
      return insufficientData(
        "CONCURRENT_COMBINATION_UNCERTAIN",
        "لا يمكن التحقق من جواز الجمع — بعض علاقات النسب غير موثقة بين الزوجة الحالية والجديدة"
      );
    }
  }

  return allowed();
}

// ─── Internal mahram checker with confidence awareness ────────────────────────
// Returns:
//   MAHRAM     — confirmed mahram path exists via VERIFIED or LIKELY relations
//   NOT_MAHRAM — no mahram path found and all checked relations are reliable
//   UNCERTAIN  — no confirmed mahram path, but UNVERIFIED/DISPUTED relations
//                exist that could conceal one (conservative safety signal)
async function areBloodMahram(personAId: string, personBId: string, db: DbClient): Promise<MahramResult> {
  let hasUncertainRelations = false;

  // 1. Direct ancestor or descendant (PersonAncestry is derived only from BIOLOGICAL relations
  //    so its confidence reflects the underlying parentChildRelation rows)
  const ancestry = await db.personAncestry.findFirst({
    where: {
      OR: [
        { ancestorId: personAId, descendantId: personBId, depth: { gt: 0 } },
        { ancestorId: personBId, descendantId: personAId, depth: { gt: 0 } },
      ],
    },
  });
  if (ancestry) return "MAHRAM";

  // 2. Siblings — fetch BIOLOGICAL parentChildRelations and track confidence
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

  const unreliable = (c: string) => c === "UNVERIFIED" || c === "DISPUTED";

  if (parentsA.some((p) => unreliable(p.confidence)) || parentsB.some((p) => unreliable(p.confidence))) {
    hasUncertainRelations = true;
  }

  // Use only reliable parents for positive mahram detection
  const reliableParentSetA = new Set(
    parentsA.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId)
  );
  const reliableParentSetB = new Set(
    parentsB.filter((p) => !unreliable(p.confidence)).map((p) => p.parentPersonId)
  );

  for (const pid of reliableParentSetA) {
    if (reliableParentSetB.has(pid)) return "MAHRAM";
  }

  // Full parent sets (for grandparent lookups)
  const allParentSetA = new Set(parentsA.map((p) => p.parentPersonId));
  const allParentSetB = new Set(parentsB.map((p) => p.parentPersonId));

  // 3. Aunt/Uncle via reliable grandparents
  if (reliableParentSetB.size > 0) {
    const gpRowsB = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetB] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsB.some((r) => unreliable(r.confidence))) hasUncertainRelations = true;
    const reliableGpIdsB = [...new Set(gpRowsB.filter((r) => !unreliable(r.confidence)).map((r) => r.parentPersonId))];
    if (reliableGpIdsB.length > 0) {
      const isAunt = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: reliableGpIdsB },
          childPersonId: personAId,
          NOT: { childPersonId: { in: [...allParentSetB] } },
        },
      });
      if (isAunt) return "MAHRAM";
    }
  }
  if (reliableParentSetA.size > 0) {
    const gpRowsA = await db.parentChildRelation.findMany({
      where: { childPersonId: { in: [...reliableParentSetA] }, relationType: "BIOLOGICAL" },
      select: { parentPersonId: true, confidence: true },
    });
    if (gpRowsA.some((r) => unreliable(r.confidence))) hasUncertainRelations = true;
    const reliableGpIdsA = [...new Set(gpRowsA.filter((r) => !unreliable(r.confidence)).map((r) => r.parentPersonId))];
    if (reliableGpIdsA.length > 0) {
      const isAunt = await db.parentChildRelation.findFirst({
        where: {
          parentPersonId: { in: reliableGpIdsA },
          childPersonId: personBId,
          NOT: { childPersonId: { in: [...allParentSetA] } },
        },
      });
      if (isAunt) return "MAHRAM";
    }
  }

  // 4. Nieces & Nephews (descendants of siblings via reliable chain)
  if (reliableParentSetA.size > 0) {
    const siblingsA = await db.parentChildRelation.findMany({
      where: {
        parentPersonId: { in: [...reliableParentSetA] },
        relationType: "BIOLOGICAL",
        NOT: { childPersonId: personAId },
      },
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
      where: {
        parentPersonId: { in: [...reliableParentSetB] },
        relationType: "BIOLOGICAL",
        NOT: { childPersonId: personBId },
      },
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
