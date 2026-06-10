import type { PrismaClient } from "@/generated/prisma/client";
import { allowed, prohibited, ValidationResult } from "./index";

type DbClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function validateGenderChange(
  personId: string,
  newGender: "MALE" | "FEMALE",
  db: DbClient
): Promise<ValidationResult> {
  const person = await db.person.findUnique({
    where: { id: personId },
    select: { gender: true },
  });

  if (!person) return prohibited("PERSON_NOT_FOUND", "الشخص غير موجود");
  if (person.gender === newGender) return allowed();

  // Check if this person is recorded as a parent — changing gender could create two fathers/mothers
  const parentRelations = await db.parentChildRelation.findMany({
    where: { parentPersonId: personId },
    select: { childPersonId: true },
  });

  if (parentRelations.length > 0) {
    // For each child, check if there's already a parent of the new gender
    const childIds = parentRelations.map((r) => r.childPersonId);
    const conflictingParent = await db.parentChildRelation.findFirst({
      where: {
        childPersonId: { in: childIds },
        NOT: { parentPersonId: personId },
        parent: { gender: newGender, deletedAt: null },
      },
    });
    if (conflictingParent) {
      return prohibited(
        "GENDER_CHANGE_BREAKS_PARENT_ROLE",
        "لا يمكن تغيير الجنس — سيؤدي ذلك إلى وجود والدين من نفس الجنس لأحد الأبناء"
      );
    }
  }

  // Check active marriages — changing gender would create same-gender marriage
  const activeMarriages = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [{ personAId: personId }, { personBId: personId }],
    },
    select: { personAId: true, personBId: true },
  });

  if (activeMarriages.length > 0) {
    const spouseIds = activeMarriages.map((m) =>
      m.personAId === personId ? m.personBId : m.personAId
    );
    const sameGenderSpouse = await db.person.findFirst({
      where: { id: { in: spouseIds }, gender: newGender, deletedAt: null },
    });
    if (sameGenderSpouse) {
      return prohibited(
        "GENDER_CHANGE_BREAKS_MARRIAGE",
        "لا يمكن تغيير الجنس — سيؤدي ذلك إلى زواج بين نفس الجنس"
      );
    }
  }

  return allowed();
}
