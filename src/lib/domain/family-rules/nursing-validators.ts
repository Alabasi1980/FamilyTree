import type { PrismaClient } from "@/generated/prisma/client";
import { allowed, insufficientData, prohibited, ValidationResult } from "./index";

type DbClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Returns all foster IDs that are mahram to personId by nursing (الرضاعة)
// Based on the principle: "يحرم من الرضاع ما يحرم من النسب"
// Nursing makes the following mahram:
//   - الأم من الرضاعة (nursing mother) and all her ascendants
//   - الأب من الرضاعة (nursing father) and all his ascendants
//   - إخوة/أخوات الرضاعة (other children nursed by the same mother)
//   - أبناء/بنات أم الرضاعة (sons/daughters of the nursing mother) = brothers/sisters by milk
//   NOTE: The prohibition only applies to the nursed person themselves,
//         not to their children or descendants (unlike blood lineage).

export async function validateNursingMahram(
  personAId: string,
  personBId: string,
  db: DbClient
): Promise<ValidationResult> {
  const [personA, personB] = await Promise.all([
    db.person.findUnique({ where: { id: personAId }, select: { gender: true } }),
    db.person.findUnique({ where: { id: personBId }, select: { gender: true } }),
  ]);

  if (!personA || !personB) return allowed();

  // Check both directions (A is nursed by B's family, or B is nursed by A's family)
  for (const [nursedId, otherId] of [
    [personAId, personBId],
    [personBId, personAId],
  ] as [string, string][]) {
    const result = await checkNursingMahram(nursedId, otherId, db);
    if (result.status !== "ALLOWED") return result;
  }

  return allowed();
}

async function checkNursingMahram(
  nursedPersonId: string,
  candidateId: string,
  db: DbClient
): Promise<ValidationResult> {
  // Get all foster relations for the nursed person (not deleted)
  const fosterRelations = await db.fosterRelation.findMany({
    where: { childPersonId: nursedPersonId, deletedAt: null },
    select: { nursingMotherPersonId: true, nursingFatherId: true, confidence: true },
  });

  if (fosterRelations.length === 0) return allowed();

  for (const foster of fosterRelations) {
    const isUncertain = foster.confidence === "UNDOCUMENTED";

    // ── Check 1: Is candidate the nursing mother or nursing father? ─────────
    if (candidateId === foster.nursingMotherPersonId || candidateId === foster.nursingFatherId) {
      if (isUncertain) {
        return insufficientData(
          "NURSING_MAHRAM_UNCERTAIN",
          "علاقة رضاعة غير موثقة قد تجعل هذا الزواج محرماً — يرجى توثيق علاقة الرضاعة أولاً"
        );
      }
      return prohibited("NURSING_PARENT_MAHRAM", "لا يجوز الزواج من الوالد/الوالدة من الرضاعة");
    }

    // ── Check 2: Is candidate a sibling by nursing? ──────────────────────────
    // (another child nursed by the same nursing mother, or a biological child of the nursing mother)
    const nursingMotherId = foster.nursingMotherPersonId;

    // Other foster children of the same mother
    const fosterSiblings = await db.fosterRelation.findMany({
      where: {
        nursingMotherPersonId: nursingMotherId,
        childPersonId: { not: nursedPersonId },
        deletedAt: null,
      },
      select: { childPersonId: true, confidence: true },
    });
    for (const sib of fosterSiblings) {
      if (sib.childPersonId === candidateId) {
        if (isUncertain || sib.confidence === "UNDOCUMENTED") {
          return insufficientData(
            "NURSING_SIBLING_UNCERTAIN",
            "علاقة رضاعة غير موثقة قد تجعل هذا الزواج محرماً — الأخوة من الرضاعة"
          );
        }
        return prohibited("NURSING_SIBLING_MAHRAM", "لا يجوز الزواج من الأخ/الأخت من الرضاعة");
      }
    }

    // Biological children of the nursing mother = إخوة بالرضاعة
    const motherBioChildren = await db.parentChildRelation.findMany({
      where: { parentPersonId: nursingMotherId, relationType: "BIOLOGICAL" },
      select: { childPersonId: true },
    });
    for (const child of motherBioChildren) {
      if (child.childPersonId === candidateId) {
        if (isUncertain) {
          return insufficientData(
            "NURSING_SIBLING_UNCERTAIN",
            "علاقة رضاعة غير موثقة قد تجعل هذا الزواج محرماً — أبناء أم الرضاعة"
          );
        }
        return prohibited("NURSING_SIBLING_MAHRAM", "لا يجوز الزواج من الأخ/الأخت من الرضاعة");
      }
    }

    // ── Check 3: Is candidate an ascendant of the nursing mother or father? ─
    // (الجد والجدة من الرضاعة)
    if (foster.nursingFatherId) {
      const fatherAncestry = await db.personAncestry.findFirst({
        where: {
          ancestorId: candidateId,
          descendantId: foster.nursingFatherId,
          depth: { gt: 0 },
        },
      });
      if (fatherAncestry) {
        if (isUncertain) {
          return insufficientData(
            "NURSING_ANCESTOR_UNCERTAIN",
            "علاقة رضاعة غير موثقة قد تجعل هذا الزواج محرماً — أصول الأب من الرضاعة"
          );
        }
        return prohibited("NURSING_ANCESTOR_MAHRAM", "لا يجوز الزواج من أصول الأب من الرضاعة");
      }
    }

    const motherAncestry = await db.personAncestry.findFirst({
      where: {
        ancestorId: candidateId,
        descendantId: nursingMotherId,
        depth: { gt: 0 },
      },
    });
    if (motherAncestry) {
      if (isUncertain) {
        return insufficientData(
          "NURSING_ANCESTOR_UNCERTAIN",
          "علاقة رضاعة غير موثقة قد تجعل هذا الزواج محرماً — أصول الأم من الرضاعة"
        );
      }
      return prohibited("NURSING_ANCESTOR_MAHRAM", "لا يجوز الزواج من أصول الأم من الرضاعة");
    }
  }

  return allowed();
}
