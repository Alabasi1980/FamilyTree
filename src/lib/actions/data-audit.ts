"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditIssue = {
  code: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  description: string;
  affectedIds: string[];
  details?: string;
};

export type FamilyAuditReport = {
  familyId: string;
  familyName: string;
  generatedAt: Date;
  issues: AuditIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    total: number;
  };
};

// ─── Permission guard ─────────────────────────────────────────────────────────
async function canAuditFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

// ─── Main audit function ──────────────────────────────────────────────────────
export async function auditFamilyData(familyId: string): Promise<
  { success: true; report: FamilyAuditReport } | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canAuditFamily(session.user.id, familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية تدقيق هذه العائلة" };
  }

  const family = await db.family.findUnique({ where: { id: familyId }, select: { name: true } });
  if (!family) return { success: false, error: "العائلة غير موجودة" };

  const issues: AuditIssue[] = [];

  // Fetch all active persons in this family
  const persons = await db.person.findMany({
    where: { familyId, deletedAt: null },
    select: {
      id: true, fullName: true, gender: true,
      birthYear: true, birthDate: true,
      deathYear: true, deathDate: true,
      isLiving: true,
    },
  });
  const personIds = persons.map((p) => p.id);
  const personMap = new Map(persons.map((p) => [p.id, p]));

  if (personIds.length === 0) {
    return {
      success: true,
      report: {
        familyId, familyName: family.name, generatedAt: new Date(),
        issues: [],
        summary: { critical: 0, high: 0, medium: 0, total: 0 },
      },
    };
  }

  // ── 1. Women with multiple ACTIVE husbands ───────────────────────────────
  const femaleIds = persons.filter((p) => p.gender === "FEMALE").map((p) => p.id);
  for (const femaleId of femaleIds) {
    const activeMarriages = await db.marriageRelation.findMany({
      where: {
        deletedAt: null, status: "ACTIVE",
        OR: [{ personAId: femaleId }, { personBId: femaleId }],
      },
      select: { id: true },
    });
    if (activeMarriages.length > 1) {
      issues.push({
        code: "FEMALE_MULTIPLE_ACTIVE_HUSBANDS",
        severity: "CRITICAL",
        description: `امرأة لها أكثر من زوج نشط (${activeMarriages.length})`,
        affectedIds: [femaleId],
        details: `الشخص: ${personMap.get(femaleId)?.fullName}`,
      });
    }
  }

  // ── 2. Men with more than 4 ACTIVE wives ────────────────────────────────
  const maleIds = persons.filter((p) => p.gender === "MALE").map((p) => p.id);
  for (const maleId of maleIds) {
    const activeWives = await db.marriageRelation.count({
      where: {
        deletedAt: null, status: "ACTIVE",
        OR: [{ personAId: maleId }, { personBId: maleId }],
      },
    });
    if (activeWives > 4) {
      issues.push({
        code: "MALE_EXCEEDS_WIFE_LIMIT",
        severity: "CRITICAL",
        description: `رجل له أكثر من 4 زوجات نشطات (${activeWives})`,
        affectedIds: [maleId],
        details: `الشخص: ${personMap.get(maleId)?.fullName}`,
      });
    }
  }

  // ── 3. Person with more than 2 biological parents ────────────────────────
  for (const personId of personIds) {
    const bioParents = await db.parentChildRelation.findMany({
      where: { childPersonId: personId, relationType: "BIOLOGICAL", parent: { deletedAt: null } },
      select: { parentPersonId: true },
    });
    if (bioParents.length > 2) {
      issues.push({
        code: "TOO_MANY_BIOLOGICAL_PARENTS",
        severity: "CRITICAL",
        description: `شخص له أكثر من والدَيْن بيولوجيَّيْن (${bioParents.length})`,
        affectedIds: [personId],
        details: `الشخص: ${personMap.get(personId)?.fullName}`,
      });
    }
  }

  // ── 4. Two biological parents of the same gender ─────────────────────────
  for (const personId of personIds) {
    const bioParents = await db.parentChildRelation.findMany({
      where: { childPersonId: personId, relationType: "BIOLOGICAL", parent: { deletedAt: null } },
      include: { parent: { select: { gender: true, fullName: true } } },
    });
    const genders = bioParents.map((r) => r.parent.gender);
    if (genders.length === 2 && genders[0] === genders[1]) {
      issues.push({
        code: "SAME_GENDER_BIOLOGICAL_PARENTS",
        severity: "CRITICAL",
        description: "شخص له والدان بيولوجيان من نفس الجنس",
        affectedIds: [personId],
        details: `الشخص: ${personMap.get(personId)?.fullName}`,
      });
    }
  }

  // ── 5. Person marked isLiving=true but has deathDate/deathYear ───────────
  for (const person of persons) {
    if (person.isLiving && (person.deathDate || person.deathYear)) {
      issues.push({
        code: "ALIVE_WITH_DEATH_DATE",
        severity: "MEDIUM",
        description: "شخص مسجل كحي لكن لديه تاريخ/سنة وفاة",
        affectedIds: [person.id],
        details: `الشخص: ${person.fullName}`,
      });
    }
  }

  // ── 6. Death before birth ────────────────────────────────────────────────
  for (const person of persons) {
    const bYear = person.birthDate ? new Date(person.birthDate).getFullYear() : person.birthYear;
    const dYear = person.deathDate ? new Date(person.deathDate).getFullYear() : person.deathYear;
    if (bYear && dYear && dYear < bYear) {
      issues.push({
        code: "DEATH_BEFORE_BIRTH",
        severity: "HIGH",
        description: `سنة/تاريخ الوفاة يسبق الميلاد`,
        affectedIds: [person.id],
        details: `الشخص: ${person.fullName} — ميلاد: ${bYear}، وفاة: ${dYear}`,
      });
    }
  }

  // ── 7. Parent younger than child (birth year comparison) ─────────────────
  const allRelations = await db.parentChildRelation.findMany({
    where: {
      parentPersonId: { in: personIds },
      childPersonId: { in: personIds },
      relationType: "BIOLOGICAL",
      parent: { deletedAt: null },
      child: { deletedAt: null },
    },
    select: { parentPersonId: true, childPersonId: true },
  });

  for (const rel of allRelations) {
    const parent = personMap.get(rel.parentPersonId);
    const child = personMap.get(rel.childPersonId);
    if (!parent || !child) continue;
    const pBYear = parent.birthDate ? new Date(parent.birthDate).getFullYear() : parent.birthYear;
    const cBYear = child.birthDate ? new Date(child.birthDate).getFullYear() : child.birthYear;
    if (pBYear && cBYear && pBYear > cBYear) {
      issues.push({
        code: "PARENT_YOUNGER_THAN_CHILD",
        severity: "HIGH",
        description: "والد أصغر من ابنه بسنة الميلاد",
        affectedIds: [rel.parentPersonId, rel.childPersonId],
        details: `والد: ${parent.fullName} (${pBYear}) — طفل: ${child.fullName} (${cBYear})`,
      });
    }
    // Parent died before child was born
    const pDYear = parent.deathDate ? new Date(parent.deathDate).getFullYear() : parent.deathYear;
    if (pDYear && cBYear && pDYear < cBYear) {
      issues.push({
        code: "PARENT_DIED_BEFORE_CHILD_BORN",
        severity: "HIGH",
        description: "والد توفي قبل ميلاد ابنه",
        affectedIds: [rel.parentPersonId, rel.childPersonId],
        details: `والد: ${parent.fullName} (وفاة: ${pDYear}) — طفل: ${child.fullName} (ميلاد: ${cBYear})`,
      });
    }
  }

  // ── 8. ACTIVE marriage between two deceased persons ──────────────────────
  const activeMarriagesInFamily = await db.marriageRelation.findMany({
    where: {
      deletedAt: null, status: "ACTIVE",
      OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }],
    },
    select: { id: true, personAId: true, personBId: true },
  });

  for (const marriage of activeMarriagesInFamily) {
    const pA = personMap.get(marriage.personAId);
    const pB = personMap.get(marriage.personBId);
    if (pA && pB && !pA.isLiving && !pB.isLiving) {
      issues.push({
        code: "ACTIVE_MARRIAGE_BOTH_DECEASED",
        severity: "MEDIUM",
        description: "زواج نشط (ACTIVE) بين شخصين متوفيَّيْن — يجب تصنيفه HISTORICAL",
        affectedIds: [marriage.id],
        details: `${pA.fullName} × ${pB.fullName}`,
      });
    }
  }

  // ── 9. Marriage date incompatible with persons' birth/death dates ────────
  // Catches cases where birth dates were added retroactively after the marriage was recorded
  const marriagesForChronology = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      marriageDate: { not: null },
      OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }],
    },
    select: {
      id: true, marriageDate: true,
      personAId: true, personBId: true,
      personA: { select: { fullName: true, birthYear: true, birthDate: true, deathYear: true, deathDate: true } },
      personB: { select: { fullName: true, birthYear: true, birthDate: true, deathYear: true, deathDate: true } },
    },
  });

  for (const m of marriagesForChronology) {
    const mYear = new Date(m.marriageDate!).getFullYear();
    for (const [person, label] of [[m.personA, "الشخص الأول"] as const, [m.personB, "الشخص الثاني"] as const]) {
      const bYear = person.birthDate ? new Date(person.birthDate).getFullYear() : person.birthYear;
      const dYear = person.deathDate ? new Date(person.deathDate).getFullYear() : person.deathYear;
      if (bYear && mYear < bYear) {
        issues.push({
          code: "MARRIAGE_BEFORE_BIRTH",
          severity: "HIGH",
          description: `تاريخ الزواج (${mYear}) يسبق ميلاد ${label} (${bYear}) — تعارض رجعي في التواريخ`,
          affectedIds: [m.id],
          details: `${m.personA.fullName} × ${m.personB.fullName}`,
        });
      }
      if (dYear && mYear > dYear) {
        issues.push({
          code: "MARRIAGE_AFTER_DEATH",
          severity: "HIGH",
          description: `تاريخ الزواج (${mYear}) يأتي بعد وفاة ${label} (${dYear}) — تعارض رجعي في التواريخ`,
          affectedIds: [m.id],
          details: `${m.personA.fullName} × ${m.personB.fullName}`,
        });
      }
    }
  }

  // ── 10. Marriage where divorce date precedes marriage date ────────────────
  const marriagesWithDates = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      divorceDate: { not: null },
      marriageDate: { not: null },
      OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }],
    },
    select: { id: true, marriageDate: true, divorceDate: true, personAId: true, personBId: true },
  });

  for (const m of marriagesWithDates) {
    if (m.divorceDate! < m.marriageDate!) {
      const pA = personMap.get(m.personAId);
      const pB = personMap.get(m.personBId);
      issues.push({
        code: "DIVORCE_BEFORE_MARRIAGE",
        severity: "HIGH",
        description: "تاريخ الطلاق يسبق تاريخ الزواج",
        affectedIds: [m.id],
        details: `${pA?.fullName ?? m.personAId} × ${pB?.fullName ?? m.personBId}`,
      });
    }
  }

  // ── 10. Duplicate active marriage (same pair, both active) ───────────────
  const pairCount = new Map<string, number>();
  for (const m of activeMarriagesInFamily) {
    const key = [m.personAId, m.personBId].sort().join("|");
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  for (const [pair, count] of pairCount) {
    if (count > 1) {
      const [idA, idB] = pair.split("|");
      issues.push({
        code: "DUPLICATE_ACTIVE_MARRIAGE",
        severity: "CRITICAL",
        description: `زواجان نشطان (ACTIVE) لنفس الزوجين (${count} سجلات)`,
        affectedIds: [idA, idB],
        details: `${personMap.get(idA)?.fullName ?? idA} × ${personMap.get(idB)?.fullName ?? idB}`,
      });
    }
  }

  // ── 11. Ancestry cycle detection ─────────────────────────────────────────
  const ancestrySelfCycles = await db.personAncestry.findMany({
    where: { ancestorId: { in: personIds }, descendantId: { in: personIds } },
    select: { ancestorId: true, descendantId: true, depth: true },
  });
  // A cycle exists if A is ancestor of B AND B is ancestor of A (both with depth > 0)
  const ancestorOf = new Set(ancestrySelfCycles.filter((r) => r.depth > 0).map((r) => `${r.ancestorId}|${r.descendantId}`));
  for (const row of ancestrySelfCycles) {
    if (row.depth > 0) {
      const reverse = `${row.descendantId}|${row.ancestorId}`;
      if (ancestorOf.has(reverse)) {
        issues.push({
          code: "ANCESTRY_CYCLE",
          severity: "CRITICAL",
          description: "دورة في النسب — شخص يظهر كأصل لنفسه",
          affectedIds: [row.ancestorId, row.descendantId],
          details: `${personMap.get(row.ancestorId)?.fullName ?? row.ancestorId} ↔ ${personMap.get(row.descendantId)?.fullName ?? row.descendantId}`,
        });
      }
    }
  }

  // ── 12. Persons with no ancestry self-record (data integrity) ────────────
  const selfAncestry = await db.personAncestry.findMany({
    where: { ancestorId: { in: personIds }, descendantId: { in: personIds }, depth: 0 },
    select: { ancestorId: true },
  });
  const selfSet = new Set(selfAncestry.map((r) => r.ancestorId));
  const missingAncestry = personIds.filter((id) => !selfSet.has(id));
  if (missingAncestry.length > 0) {
    issues.push({
      code: "MISSING_ANCESTRY_SELF_RECORD",
      severity: "MEDIUM",
      description: `${missingAncestry.length} شخص/أشخاص بدون سجل PersonAncestry ذاتي — يؤثر على استعلامات النسب`,
      affectedIds: missingAncestry,
      details: missingAncestry.map((id) => personMap.get(id)?.fullName ?? id).join("، "),
    });
  }

  const summary = {
    critical: issues.filter((i) => i.severity === "CRITICAL").length,
    high: issues.filter((i) => i.severity === "HIGH").length,
    medium: issues.filter((i) => i.severity === "MEDIUM").length,
    total: issues.length,
  };

  return {
    success: true,
    report: { familyId, familyName: family.name, generatedAt: new Date(), issues, summary },
  };
}

// ─── System-wide audit (SYSTEM_ADMIN only) ────────────────────────────────────
export async function auditAllFamilies(): Promise<
  { success: true; reports: FamilyAuditReport[] } | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };
  if (session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "هذه العملية متاحة لمسؤول النظام فقط" };
  }

  const families = await db.family.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const reports: FamilyAuditReport[] = [];
  for (const family of families) {
    const result = await auditFamilyData(family.id);
    if (result.success && result.report.issues.length > 0) {
      reports.push(result.report);
    }
  }

  // Sort: most critical issues first
  reports.sort((a, b) => b.summary.critical - a.summary.critical || b.summary.total - a.summary.total);

  return { success: true, reports };
}
