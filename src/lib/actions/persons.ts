"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const personSchema = z.object({
  familyId: z.string().cuid(),
  fullName: z.string().min(2).max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  visibilityLevel: z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]).default("PUBLIC"),
});

export type PersonActionResult =
  | { success: true; personId: string }
  | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

export async function createPerson(rawData: unknown): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const parsed = personSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = parsed.data;
  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (!(await canManageFamily(session.user.id, data.familyId, isAdmin))) {
    // Non-admin: create edit request instead
    await db.editRequest.create({
      data: {
        requestType: "ADD_PERSON",
        targetType: "PERSON",
        familyId: data.familyId,
        submittedByUserId: session.user.id,
        payloadJson: data,
      },
    });
    revalidatePath("/dashboard/requests");
    return { success: true, personId: "" };
  }

  const person = await db.person.create({
    data: {
      familyId: data.familyId,
      fullName: data.fullName,
      gender: data.gender,
      isLiving: data.isLiving,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
      visibilityLevel: data.visibilityLevel,
    },
  });

  // Update PersonAncestry: self-reference (depth 0)
  await db.personAncestry.create({
    data: { ancestorId: person.id, descendantId: person.id, depth: 0 },
  });

  revalidatePath(`/dashboard/families/${data.familyId}`);
  revalidatePath(`/family/${data.familyId}`);
  return { success: true, personId: person.id };
}

export async function addParentChildRelation(
  parentId: string,
  childId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const child = await db.person.findUnique({ where: { id: childId } });
  if (!child) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  // Create parent-child relation
  await db.parentChildRelation.upsert({
    where: { parentPersonId_childPersonId: { parentPersonId: parentId, childPersonId: childId } },
    create: { parentPersonId: parentId, childPersonId: childId },
    update: {},
  });

  // Update PersonAncestry (Closure Table)
  // All ancestors of parent become ancestors of child
  const parentAncestors = await db.personAncestry.findMany({
    where: { descendantId: parentId },
  });
  const childDescendants = await db.personAncestry.findMany({
    where: { ancestorId: childId },
  });

  const newEntries = parentAncestors.flatMap((pa) =>
    childDescendants.map((cd) => ({
      ancestorId: pa.ancestorId,
      descendantId: cd.descendantId,
      depth: pa.depth + cd.depth + 1,
    }))
  );

  if (newEntries.length > 0) {
    await db.personAncestry.createMany({ data: newEntries, skipDuplicates: true });
  }

  revalidatePath(`/family/${child.familyId}`);
  return { success: true };
}

const updatePersonSchema = z.object({
  fullName: z.string().min(2).max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  biography: z.string().max(2000).optional(),
  notes: z.string().max(500).optional(),
  visibilityLevel: z.enum(["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]).default("PUBLIC"),
});

export async function updatePerson(personId: string, rawData: unknown): Promise<PersonActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person || person.deletedAt) return { success: false, error: "الشخص غير موجود" };

  const parsed = updatePersonSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const data = parsed.data;
  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";

  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    await db.editRequest.create({
      data: {
        requestType: "EDIT_PERSON",
        targetType: "PERSON",
        targetId: personId,
        familyId: person.familyId,
        submittedByUserId: session.user.id,
        payloadJson: data,
      },
    });
    revalidatePath("/dashboard/requests");
    return { success: true, personId };
  }

  await db.person.update({
    where: { id: personId },
    data: {
      fullName: data.fullName,
      gender: data.gender,
      isLiving: data.isLiving,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      biography: data.biography ?? null,
      notes: data.notes ?? null,
      visibilityLevel: data.visibilityLevel,
    },
  });

  revalidatePath(`/dashboard/families/${person.familyId}`);
  revalidatePath(`/family/${person.familyId}`);
  return { success: true, personId };
}

export async function deletePerson(personId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const person = await db.person.findUnique({ where: { id: personId } });
  if (!person) return { success: false, error: "الشخص غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, person.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.person.update({ where: { id: personId }, data: { deletedAt: new Date() } });
  revalidatePath(`/dashboard/families/${person.familyId}`);
  return { success: true };
}
