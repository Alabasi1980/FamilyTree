import type { PrismaClient } from "@/generated/prisma/client";
import { allowed, prohibited, ValidationResult } from "./index";

type DbClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Minimum reasonable age gap between parent birth and child birth (years)
// Not enforced as PROHIBITED — only warned — due to historical/cultural variability
const MIN_PARENT_AGE_AT_BIRTH_WARNING = 12;

type PersonDates = {
  birthYear?: number | null;
  birthDate?: Date | string | null;
  deathYear?: number | null;
  deathDate?: Date | string | null;
};

function toYear(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  return new Date(date).getFullYear();
}

function effectiveBirthYear(p: PersonDates): number | null {
  if (p.birthDate) return toYear(p.birthDate);
  return p.birthYear ?? null;
}

function effectiveDeathYear(p: PersonDates): number | null {
  if (p.deathDate) return toYear(p.deathDate);
  return p.deathYear ?? null;
}

function toMs(date: Date | string): number {
  return new Date(date).getTime();
}

// ─── 1. Validate a single person's own dates ─────────────────────────────────
export function validatePersonChronology(data: PersonDates): ValidationResult {
  const warnings: string[] = [];

  const bYear = effectiveBirthYear(data);
  const dYear = effectiveDeathYear(data);

  // Exact dates take priority for PROHIBITED checks
  if (data.birthDate && data.deathDate) {
    if (toMs(data.deathDate) < toMs(data.birthDate)) {
      return prohibited("DEATH_BEFORE_BIRTH", "تاريخ الوفاة لا يمكن أن يسبق تاريخ الميلاد");
    }
  } else if (bYear && dYear && dYear < bYear) {
    return prohibited("DEATH_YEAR_BEFORE_BIRTH_YEAR", "سنة الوفاة لا يمكن أن تسبق سنة الميلاد");
  }

  // Cross-field inconsistency: birthDate year vs birthYear
  if (data.birthDate && data.birthYear) {
    const dateYear = toYear(data.birthDate)!;
    if (Math.abs(dateYear - data.birthYear) > 1) {
      warnings.push(`سنة الميلاد (${data.birthYear}) لا تتوافق مع تاريخ الميلاد (${dateYear})`);
    }
  }
  if (data.deathDate && data.deathYear) {
    const dateYear = toYear(data.deathDate)!;
    if (Math.abs(dateYear - data.deathYear) > 1) {
      warnings.push(`سنة الوفاة (${data.deathYear}) لا تتوافق مع تاريخ الوفاة (${dateYear})`);
    }
  }

  return allowed(warnings.length > 0 ? warnings : undefined);
}

// ─── 2. Validate parent-child chronology ─────────────────────────────────────
export async function validateParentChildChronology(
  parentId: string,
  childId: string,
  db: DbClient
): Promise<ValidationResult> {
  const [parent, child] = await Promise.all([
    db.person.findUnique({
      where: { id: parentId },
      select: { birthYear: true, birthDate: true, deathYear: true, deathDate: true, fullName: true },
    }),
    db.person.findUnique({
      where: { id: childId },
      select: { birthYear: true, birthDate: true, fullName: true },
    }),
  ]);

  if (!parent || !child) return allowed();

  const parentBirthYear = effectiveBirthYear(parent);
  const childBirthYear = effectiveBirthYear(child);
  const parentDeathYear = effectiveDeathYear(parent);

  const warnings: string[] = [];

  if (parentBirthYear && childBirthYear) {
    // Parent cannot be born after the child
    if (parentBirthYear > childBirthYear) {
      return prohibited(
        "PARENT_YOUNGER_THAN_CHILD",
        `الوالد (${parentBirthYear}) أصغر من الطفل (${childBirthYear}) — هذا مستحيل`
      );
    }

    // Parent cannot die before the child was born (impossible biology)
    if (parentDeathYear && parentDeathYear < childBirthYear) {
      return prohibited(
        "PARENT_DIED_BEFORE_CHILD_BORN",
        `الوالد توفي (${parentDeathYear}) قبل ميلاد الطفل (${childBirthYear})`
      );
    }

    const ageDiff = childBirthYear - parentBirthYear;
    if (ageDiff < MIN_PARENT_AGE_AT_BIRTH_WARNING) {
      warnings.push(
        `فارق العمر بين الوالد والطفل (${ageDiff} سنة) صغير جداً — يرجى التحقق`
      );
    }
  }

  return allowed(warnings.length > 0 ? warnings : undefined);
}

// ─── 3. Validate marriage and divorce chronology ──────────────────────────────
export async function validateMarriageChronology(
  personAId: string,
  personBId: string,
  marriageDate: string | Date | null | undefined,
  divorceDate: string | Date | null | undefined,
  db: DbClient
): Promise<ValidationResult> {
  const [personA, personB] = await Promise.all([
    db.person.findUnique({
      where: { id: personAId },
      select: { birthYear: true, birthDate: true, deathYear: true, deathDate: true, fullName: true },
    }),
    db.person.findUnique({
      where: { id: personBId },
      select: { birthYear: true, birthDate: true, deathYear: true, deathDate: true, fullName: true },
    }),
  ]);

  if (!personA || !personB) return allowed();

  const warnings: string[] = [];

  // divorce must come after marriage if both provided
  if (marriageDate && divorceDate) {
    if (toMs(divorceDate) < toMs(marriageDate)) {
      return prohibited("DIVORCE_BEFORE_MARRIAGE", "تاريخ الطلاق لا يمكن أن يسبق تاريخ الزواج");
    }
  }

  if (marriageDate) {
    const mDate = new Date(marriageDate);
    const mYear = mDate.getFullYear();

    for (const [person, label] of [[personA, "الشخص الأول"] as const, [personB, "الشخص الثاني"] as const]) {
      const bYear = effectiveBirthYear(person);
      const dYear = effectiveDeathYear(person);

      // Marriage cannot be before birth
      if (person.birthDate) {
        if (mDate < new Date(person.birthDate)) {
          return prohibited(
            "MARRIAGE_BEFORE_BIRTH",
            `تاريخ الزواج يسبق ميلاد ${label} — هذا مستحيل`
          );
        }
      } else if (bYear && mYear < bYear) {
        return prohibited(
          "MARRIAGE_YEAR_BEFORE_BIRTH",
          `سنة الزواج (${mYear}) تسبق ميلاد ${label} (${bYear})`
        );
      }

      // Marriage after death is impossible
      if (person.deathDate) {
        if (mDate > new Date(person.deathDate)) {
          return prohibited(
            "MARRIAGE_AFTER_DEATH",
            `تاريخ الزواج يأتي بعد وفاة ${label} — هذا مستحيل`
          );
        }
      } else if (dYear && mYear > dYear) {
        return prohibited(
          "MARRIAGE_YEAR_AFTER_DEATH",
          `سنة الزواج (${mYear}) تأتي بعد وفاة ${label} (${dYear})`
        );
      }

      // Warning: very young marriage (under 12 in historical context)
      if (bYear && mYear - bYear < 12) {
        warnings.push(`${label} كان عمره أقل من 12 سنة عند الزواج — يرجى التحقق`);
      }
    }
  }

  return allowed(warnings.length > 0 ? warnings : undefined);
}

// ─── 4. Validate divorce date against existing marriage record ────────────────
export async function validateDivorceChronology(
  marriageId: string,
  divorceDate: string | Date | null | undefined,
  db: DbClient
): Promise<ValidationResult> {
  if (!divorceDate) return allowed();

  const marriage = await db.marriageRelation.findUnique({
    where: { id: marriageId },
    select: {
      marriageDate: true,
      personA: { select: { deathDate: true, deathYear: true, fullName: true } },
      personB: { select: { deathDate: true, deathYear: true, fullName: true } },
    },
  });

  if (!marriage) return allowed();

  const dDate = new Date(divorceDate);

  if (marriage.marriageDate && dDate < marriage.marriageDate) {
    return prohibited(
      "DIVORCE_BEFORE_MARRIAGE",
      `تاريخ انتهاء الزواج (${dDate.getFullYear()}) يسبق تاريخ الزواج (${marriage.marriageDate.getFullYear()})`
    );
  }

  return allowed();
}

// ─── 5. Retroactive date conflict check ──────────────────────────────────────
// Called inside updatePerson AFTER saving new birth/death dates.
// Finds existing marriages and parent-child relations that are now inconsistent
// with the newly-added dates. Returns warnings — never blocks (the data was already
// accepted; the admin must decide how to resolve the inconsistency).
export type RetroactiveConflict = {
  type: "MARRIAGE" | "PARENT_CHILD";
  relationId: string;
  message: string;
};

export async function checkRetroactiveDateConflicts(
  personId: string,
  newDates: PersonDates,
  db: DbClient
): Promise<RetroactiveConflict[]> {
  const conflicts: RetroactiveConflict[] = [];

  const newBirthYear = effectiveBirthYear(newDates);
  const newDeathYear = effectiveDeathYear(newDates);

  if (!newBirthYear && !newDeathYear) return conflicts; // nothing to check

  // ── Check existing marriages ──────────────────────────────────────────────
  const marriages = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      OR: [{ personAId: personId }, { personBId: personId }],
    },
    select: {
      id: true, marriageDate: true, divorceDate: true,
      personAId: true, personBId: true,
      personA: { select: { fullName: true } },
      personB: { select: { fullName: true } },
    },
  });

  for (const m of marriages) {
    const mYear = m.marriageDate ? new Date(m.marriageDate).getFullYear() : null;
    const spouseName = m.personAId === personId ? m.personB.fullName : m.personA.fullName;

    if (mYear && newBirthYear && mYear < newBirthYear) {
      conflicts.push({
        type: "MARRIAGE",
        relationId: m.id,
        message: `تاريخ الزواج مع ${spouseName} (${mYear}) يسبق تاريخ الميلاد المُدخَل (${newBirthYear})`,
      });
    }
    if (mYear && newDeathYear && mYear > newDeathYear) {
      conflicts.push({
        type: "MARRIAGE",
        relationId: m.id,
        message: `تاريخ الزواج مع ${spouseName} (${mYear}) يأتي بعد تاريخ الوفاة المُدخَل (${newDeathYear})`,
      });
    }
  }

  // ── Check parent-child relations ──────────────────────────────────────────
  // As parent: child should not be born before parent
  const asParent = await db.parentChildRelation.findMany({
    where: { parentPersonId: personId, relationType: "BIOLOGICAL", child: { deletedAt: null } },
    select: {
      id: true,
      child: { select: { fullName: true, birthYear: true, birthDate: true } },
    },
  });

  for (const rel of asParent) {
    const childBirthYear = effectiveBirthYear(rel.child);
    if (newBirthYear && childBirthYear && newBirthYear > childBirthYear) {
      conflicts.push({
        type: "PARENT_CHILD",
        relationId: rel.id,
        message: `الوالد (ميلاد ${newBirthYear}) أصغر من ابنه ${rel.child.fullName} (ميلاد ${childBirthYear})`,
      });
    }
    if (newDeathYear && childBirthYear && newDeathYear < childBirthYear) {
      conflicts.push({
        type: "PARENT_CHILD",
        relationId: rel.id,
        message: `الوالد توفي (${newDeathYear}) قبل ميلاد ابنه ${rel.child.fullName} (${childBirthYear})`,
      });
    }
  }

  // As child: parent should not be born after child
  const asChild = await db.parentChildRelation.findMany({
    where: { childPersonId: personId, relationType: "BIOLOGICAL", parent: { deletedAt: null } },
    select: {
      id: true,
      parent: { select: { fullName: true, birthYear: true, birthDate: true } },
    },
  });

  for (const rel of asChild) {
    const parentBirthYear = effectiveBirthYear(rel.parent);
    if (newBirthYear && parentBirthYear && parentBirthYear > newBirthYear) {
      conflicts.push({
        type: "PARENT_CHILD",
        relationId: rel.id,
        message: `الوالد ${rel.parent.fullName} (ميلاد ${parentBirthYear}) أصغر من هذا الشخص (ميلاد ${newBirthYear})`,
      });
    }
  }

  return conflicts;
}
