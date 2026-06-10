"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type FosterResult = { success: true } | { success: false; error: string };

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId, isActive: true },
  });
  return !!assignment;
}

// ─── Add a foster (nursing) relation ────────────────────────────────────────
// Records that `childPersonId` was nursed by `nursingMotherPersonId`.
// The nursing father (nursingFatherId) is optional — the husband of the nursing
// mother at the time of nursing; he becomes the foster father (أب من الرضاعة).
//
// Confidence levels:
//   DOCUMENTED  — supported by written or witnessed evidence (default)
//   LIKELY      — family oral tradition, likely but not documented
//   UNDOCUMENTED — suspected, unclear; triggers INSUFFICIENT_DATA in marriage checks
export async function addFosterRelation(input: {
  childPersonId: string;
  nursingMotherPersonId: string;
  nursingFatherId?: string;
  confidence?: "DOCUMENTED" | "LIKELY" | "UNDOCUMENTED";
  notes?: string;
}): Promise<FosterResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const { childPersonId, nursingMotherPersonId, nursingFatherId, confidence = "DOCUMENTED", notes } = input;

  if (childPersonId === nursingMotherPersonId) {
    return { success: false, error: "لا يمكن أن يكون الشخص أمه الرضاعة بنفسه" };
  }
  if (nursingFatherId && nursingFatherId === childPersonId) {
    return { success: false, error: "لا يمكن أن يكون الشخص أبا رضاعته بنفسه" };
  }

  const [child, nursingMother] = await Promise.all([
    db.person.findUnique({ where: { id: childPersonId }, select: { id: true, familyId: true, deletedAt: true } }),
    db.person.findUnique({ where: { id: nursingMotherPersonId }, select: { id: true, gender: true, deletedAt: true } }),
  ]);

  if (!child || child.deletedAt) return { success: false, error: "الشخص المُرضَع غير موجود" };
  if (!nursingMother || nursingMother.deletedAt) return { success: false, error: "الأم المرضعة غير موجودة" };
  if (nursingMother.gender !== "FEMALE") return { success: false, error: "الأم المرضعة يجب أن تكون أنثى" };

  if (nursingFatherId) {
    const nursingFather = await db.person.findUnique({
      where: { id: nursingFatherId },
      select: { id: true, gender: true, deletedAt: true },
    });
    if (!nursingFather || nursingFather.deletedAt) return { success: false, error: "أب الرضاعة غير موجود" };
    if (nursingFather.gender !== "MALE") return { success: false, error: "أب الرضاعة يجب أن يكون ذكراً" };
  }

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الإضافة لهذه العائلة" };
  }

  // Prevent duplicate
  const existing = await db.fosterRelation.findFirst({
    where: { childPersonId, nursingMotherPersonId, deletedAt: null },
  });
  if (existing) {
    return { success: false, error: "علاقة الرضاعة هذه مسجلة بالفعل" };
  }

  await db.fosterRelation.create({
    data: {
      childPersonId,
      nursingMotherPersonId,
      nursingFatherId: nursingFatherId ?? null,
      confidence,
      notes: notes?.trim() || null,
      createdByUserId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/families/${child.familyId}`);
  revalidatePath(`/family/${child.familyId}`);
  return { success: true };
}

// ─── Remove (soft-delete) a foster relation ───────────────────────────────────
export async function removeFosterRelation(fosterRelationId: string): Promise<FosterResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const relation = await db.fosterRelation.findUnique({
    where: { id: fosterRelationId },
    select: { id: true, childPersonId: true, deletedAt: true },
  });
  if (!relation || relation.deletedAt) return { success: false, error: "علاقة الرضاعة غير موجودة" };

  const child = await db.person.findUnique({
    where: { id: relation.childPersonId },
    select: { familyId: true },
  });
  if (!child) return { success: false, error: "الشخص المُرضَع غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية الحذف" };
  }

  await db.fosterRelation.update({
    where: { id: fosterRelationId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/dashboard/families/${child.familyId}`);
  revalidatePath(`/family/${child.familyId}`);
  return { success: true };
}

// ─── Update confidence level of an existing foster relation ──────────────────
export async function updateFosterRelationConfidence(
  fosterRelationId: string,
  confidence: "DOCUMENTED" | "LIKELY" | "UNDOCUMENTED",
  notes?: string
): Promise<FosterResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const relation = await db.fosterRelation.findUnique({
    where: { id: fosterRelationId },
    select: { id: true, childPersonId: true, deletedAt: true },
  });
  if (!relation || relation.deletedAt) return { success: false, error: "علاقة الرضاعة غير موجودة" };

  const child = await db.person.findUnique({
    where: { id: relation.childPersonId },
    select: { familyId: true },
  });
  if (!child) return { success: false, error: "الشخص المُرضَع غير موجود" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, child.familyId, isAdmin))) {
    return { success: false, error: "لا تملك صلاحية التعديل" };
  }

  await db.fosterRelation.update({
    where: { id: fosterRelationId },
    data: {
      confidence,
      notes: notes !== undefined ? (notes.trim() || null) : undefined,
    },
  });

  revalidatePath(`/dashboard/families/${child.familyId}`);
  return { success: true };
}

// ─── List foster relations for a person (as child or as nursing mother) ───────
export async function getFosterRelationsForPerson(personId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "غير مصرح" };

  const [asChild, asMother] = await Promise.all([
    db.fosterRelation.findMany({
      where: { childPersonId: personId, deletedAt: null },
      select: {
        id: true,
        nursingMotherPersonId: true,
        nursingFatherId: true,
        confidence: true,
        notes: true,
        createdAt: true,
      },
    }),
    db.fosterRelation.findMany({
      where: { nursingMotherPersonId: personId, deletedAt: null },
      select: {
        id: true,
        childPersonId: true,
        nursingFatherId: true,
        confidence: true,
        notes: true,
        createdAt: true,
      },
    }),
  ]);

  return { success: true as const, asChild, asMother };
}
