import type { PrismaClient } from "@/generated/prisma/client";
import { allowed, prohibited, ValidationResult } from "./index";

type DbClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Returns all spouse IDs (past or present, not deleted) for a given person
async function getSpouseIds(personId: string, db: DbClient): Promise<string[]> {
  const marriages = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      OR: [{ personAId: personId }, { personBId: personId }],
    },
    select: { personAId: true, personBId: true },
  });
  return marriages.map((m) => (m.personAId === personId ? m.personBId : m.personAId));
}

// Returns all biological parent IDs for a given person (by gender if specified)
async function getBiologicalParentIds(
  personId: string,
  db: DbClient,
  gender?: "MALE" | "FEMALE"
): Promise<string[]> {
  const rows = await db.parentChildRelation.findMany({
    where: {
      childPersonId: personId,
      relationType: "BIOLOGICAL",
      ...(gender ? { parent: { gender } } : {}),
    },
    select: { parentPersonId: true },
  });
  return rows.map((r) => r.parentPersonId);
}

// Returns all biological children IDs for a given person
async function getBiologicalChildIds(personId: string, db: DbClient): Promise<string[]> {
  const rows = await db.parentChildRelation.findMany({
    where: { parentPersonId: personId, relationType: "BIOLOGICAL" },
    select: { childPersonId: true },
  });
  return rows.map((r) => r.childPersonId);
}

// ─── Main affinity mahram validator ───────────────────────────────────────────
// Checks all four permanent prohibitions by affinity (المحرمات بالمصاهرة الدائمة)
// These remain prohibited even after the first marriage ends (ENDED/deleted status).
//
// Rules (النساء 4:22-23):
//   1. زوجة الأب  — father's wife (past or present)
//   2. زوجة الابن — son's wife (past or present)
//   3. أم الزوجة  — wife's mother (prohibited from the contract, regardless of consummation)
//   4. ربيبة      — wife's daughter (conservative: blocked regardless of consummation proof)
export async function validateAffinityMahram(
  personAId: string,
  personBId: string,
  db: DbClient
): Promise<ValidationResult> {
  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: personAId }, select: { gender: true } }),
    db.person.findUnique({ where: { id: personBId }, select: { gender: true } }),
  ]);

  if (!personA || !personB) return allowed();
  if (personA.gender === personB.gender) return allowed(); // already caught by gender check

  const maleId = personA.gender === "MALE" ? personAId : personBId;
  const femaleId = personA.gender === "MALE" ? personBId : personAId;

  // ── Rule 1: زوجة الأب (stepmother) ────────────────────────────────────────
  // Female must NOT be a wife (past or present) of any biological father of the male
  const fatherIds = await getBiologicalParentIds(maleId, db, "MALE");
  if (fatherIds.length > 0) {
    const fatherSpouseIds = new Set(
      (await Promise.all(fatherIds.map((fId) => getSpouseIds(fId, db)))).flat()
    );
    if (fatherSpouseIds.has(femaleId)) {
      return prohibited(
        "AFFINITY_STEPMOTHER",
        "لا يجوز الزواج من زوجة الأب — محرمة بالمصاهرة"
      );
    }
  }

  // ── Rule 2: زوجة الابن (daughter-in-law) ──────────────────────────────────
  // Female must NOT be a wife (past or present) of any biological son of the male
  const sonIds = (await getBiologicalChildIds(maleId, db)).filter(async (_) => true); // all children
  // Filter to male children only
  if (sonIds.length > 0) {
    const children = await db.person.findMany({
      where: { id: { in: sonIds }, gender: "MALE" },
      select: { id: true },
    });
    const maleSonIds = children.map((c) => c.id);
    if (maleSonIds.length > 0) {
      const sonSpouseIds = new Set(
        (await Promise.all(maleSonIds.map((sId) => getSpouseIds(sId, db)))).flat()
      );
      if (sonSpouseIds.has(femaleId)) {
        return prohibited(
          "AFFINITY_DAUGHTER_IN_LAW",
          "لا يجوز الزواج من زوجة الابن — محرمة بالمصاهرة"
        );
      }
    }
  }

  // ── Rule 3: أم الزوجة (mother-in-law) ─────────────────────────────────────
  // Female must NOT be a biological mother of any of the male's wives (past or present)
  const maleSpouseIds = await getSpouseIds(maleId, db);
  if (maleSpouseIds.length > 0) {
    const allWifeMothers = new Set(
      (await Promise.all(maleSpouseIds.map((wId) => getBiologicalParentIds(wId, db, "FEMALE")))).flat()
    );
    if (allWifeMothers.has(femaleId)) {
      return prohibited(
        "AFFINITY_MOTHER_IN_LAW",
        "لا يجوز الزواج من أم الزوجة — محرمة بالمصاهرة من مجرد العقد"
      );
    }
  }

  // ── Rule 4: الربيبة (stepdaughter) ────────────────────────────────────────
  // Female must NOT be a biological daughter of any of the male's wives (past or present).
  // Conservative ruling: blocked regardless of consummation, as consummation data is not tracked.
  if (maleSpouseIds.length > 0) {
    const allWifeDaughters = new Set(
      (
        await Promise.all(
          maleSpouseIds.map(async (wId) => {
            const childIds = await getBiologicalChildIds(wId, db);
            if (childIds.length === 0) return [];
            const daughters = await db.person.findMany({
              where: { id: { in: childIds }, gender: "FEMALE" },
              select: { id: true },
            });
            return daughters.map((d) => d.id);
          })
        )
      ).flat()
    );
    if (allWifeDaughters.has(femaleId)) {
      return prohibited(
        "AFFINITY_STEPDAUGHTER",
        "لا يجوز الزواج من بنت الزوجة (الربيبة) — محرمة بالمصاهرة"
      );
    }
  }

  return allowed();
}
