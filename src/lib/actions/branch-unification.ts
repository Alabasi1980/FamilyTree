"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeFamilyAncestry } from "@/lib/actions/persons";
import { createNotifications, getActiveFamilyAdminUserIds, getSystemAdminUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type Relationship = "FULL_SIBLINGS" | "PATERNAL_SIBLINGS" | "MATERNAL_SIBLINGS";

const optionalText = (max: number) =>
  z.preprocess((value) => (value === null ? undefined : value), z.string().max(max).optional());

const messages = {
  unauthorized: "\u063a\u064a\u0631 \u0645\u0635\u0631\u062d",
  invalidData:
    "\u0628\u064a\u0627\u0646\u0627\u062a \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629",
  noPermission:
    "\u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0625\u062f\u0627\u0631\u0629 \u0647\u0630\u0647 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  notFound:
    "\u0627\u0644\u0637\u0644\u0628 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f",
  alreadyReviewed:
    "\u062a\u0645\u062a \u0645\u0631\u0627\u062c\u0639\u0629 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0645\u0633\u0628\u0642\u0627",
  sameFamily:
    "\u0627\u0644\u0641\u0631\u0639\u0627\u0646 \u062f\u0627\u062e\u0644 \u0646\u0641\u0633 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0644\u0627 \u064a\u062d\u062a\u0627\u062c\u0627\u0646 \u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f",
  personMismatch:
    "\u0623\u062d\u062f \u0627\u0644\u0623\u0634\u062e\u0627\u0635 \u0644\u0627 \u064a\u0646\u062a\u0645\u064a \u0644\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629",
  pendingExists:
    "\u064a\u0648\u062c\u062f \u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0645\u0639\u0644\u0642 \u0628\u064a\u0646 \u0647\u0630\u064a\u0646 \u0627\u0644\u0634\u062e\u0635\u064a\u0646",
  parentSlotConflict:
    "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062a\u0648\u062d\u064a\u062f \u0644\u0623\u0646 \u0623\u062d\u062f \u0627\u0644\u0634\u062e\u0635\u064a\u0646 \u0644\u062f\u064a\u0647 \u0648\u0627\u0644\u062f/\u0648\u0627\u0644\u062f\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u062c\u0646\u0633",
  commonFather:
    "\u0648\u0627\u0644\u062f \u0645\u0634\u062a\u0631\u0643",
  commonMother:
    "\u0648\u0627\u0644\u062f\u0629 \u0645\u0634\u062a\u0631\u0643\u0629",
  approved:
    "\u062a\u0645\u062a \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629",
  rejected:
    "\u062a\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0627\u0644\u0641\u0631\u0639\u064a\u0646",
  submittedTitle:
    "\u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0641\u0631\u0639\u064a\u0646 \u062c\u062f\u064a\u062f",
  submittedBody:
    "\u064a\u0646\u062a\u0638\u0631 \u0627\u0644\u0637\u0644\u0628 \u0645\u0631\u0627\u062c\u0639\u0629 \u0645\u0633\u0624\u0648\u0644\u064a \u0627\u0644\u0639\u0627\u0626\u0644\u0629.",
  approvedTitle:
    "\u062a\u0645\u062a \u0645\u0631\u0627\u062c\u0639\u0629 \u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0641\u0631\u0639\u064a\u0646",
  appliedTitle:
    "\u062a\u0645 \u062a\u0637\u0628\u064a\u0642 \u062a\u0648\u062d\u064a\u062f \u0627\u0644\u0641\u0631\u0639\u064a\u0646",
};

const submitSchema = z.object({
  sourceFamilyId: z.string().cuid(),
  targetFamilyId: z.string().cuid(),
  sourcePersonId: z.string().cuid(),
  targetPersonId: z.string().cuid(),
  relationship: z.enum(["FULL_SIBLINGS", "PATERNAL_SIBLINGS", "MATERNAL_SIBLINGS"]),
  sharedFatherName: optionalText(200),
  sharedMotherName: optionalText(200),
  notes: optionalText(1000),
});

function emptyToNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function canManageFamily(userId: string, familyId: string, isSystemAdmin: boolean) {
  if (isSystemAdmin) return true;
  const assignment = await db.familyAdminAssignment.findFirst({
    where: { userId, familyId, isActive: true },
    select: { id: true },
  });
  return !!assignment;
}

async function collectDescendantIds(rootPersonId: string, originalFamilyId: string) {
  const descendants = new Set<string>([rootPersonId]);
  const queue = [rootPersonId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = await db.parentChildRelation.findMany({
      where: {
        parentPersonId: current,
        child: { familyId: originalFamilyId, deletedAt: null },
      },
      select: { childPersonId: true },
    });

    for (const child of children) {
      if (!descendants.has(child.childPersonId)) {
        descendants.add(child.childPersonId);
        queue.push(child.childPersonId);
      }
    }
  }

  return Array.from(descendants);
}

async function hasParentOfGender(childId: string, gender: "MALE" | "FEMALE") {
  const existing = await db.parentChildRelation.findFirst({
    where: {
      childPersonId: childId,
      parent: { gender, deletedAt: null },
    },
    select: { id: true },
  });
  return !!existing;
}

function requiredParentGenders(relationship: Relationship) {
  if (relationship === "FULL_SIBLINGS") return ["MALE", "FEMALE"] as const;
  if (relationship === "PATERNAL_SIBLINGS") return ["MALE"] as const;
  return ["FEMALE"] as const;
}

async function assertParentSlotsAvailable(sourcePersonId: string, targetPersonId: string, relationship: Relationship) {
  for (const gender of requiredParentGenders(relationship)) {
    if ((await hasParentOfGender(sourcePersonId, gender)) || (await hasParentOfGender(targetPersonId, gender))) {
      throw new Error(messages.parentSlotConflict);
    }
  }
}

async function applyBranchUnification(requestId: string) {
  const req = await db.branchUnificationRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== "PENDING" || req.appliedAt) return;
  if (!req.sourceApprovedAt || !req.targetApprovedAt) return;

  const [sourcePerson, targetPerson] = await Promise.all([
    db.person.findFirst({
      where: { id: req.sourcePersonId, familyId: req.sourceFamilyId, deletedAt: null },
      select: { id: true, familyId: true },
    }),
    db.person.findFirst({
      where: { id: req.targetPersonId, familyId: req.targetFamilyId, deletedAt: null },
      select: { id: true, familyId: true },
    }),
  ]);

  if (!sourcePerson || !targetPerson) throw new Error(messages.personMismatch);

  await assertParentSlotsAvailable(sourcePerson.id, targetPerson.id, req.relationship);
  const movingIds = await collectDescendantIds(targetPerson.id, req.targetFamilyId);

  await db.person.updateMany({
    where: { id: { in: movingIds } },
    data: { familyId: req.sourceFamilyId },
  });

  const parentCreates: Array<{ fullName: string; gender: "MALE" | "FEMALE" }> = [];
  if (req.relationship === "FULL_SIBLINGS" || req.relationship === "PATERNAL_SIBLINGS") {
    parentCreates.push({
      fullName: emptyToNull(req.sharedFatherName) ?? messages.commonFather,
      gender: "MALE",
    });
  }
  if (req.relationship === "FULL_SIBLINGS" || req.relationship === "MATERNAL_SIBLINGS") {
    parentCreates.push({
      fullName: emptyToNull(req.sharedMotherName) ?? messages.commonMother,
      gender: "FEMALE",
    });
  }

  for (const parentData of parentCreates) {
    const parent = await db.person.create({
      data: {
        familyId: req.sourceFamilyId,
        fullName: parentData.fullName,
        gender: parentData.gender,
        isLiving: false,
        visibilityLevel: "PUBLIC",
      },
      select: { id: true },
    });

    await db.parentChildRelation.createMany({
      data: [
        { parentPersonId: parent.id, childPersonId: sourcePerson.id },
        { parentPersonId: parent.id, childPersonId: targetPerson.id },
      ],
      skipDuplicates: true,
    });
  }

  await Promise.all([
    recomputeFamilyAncestry(req.sourceFamilyId),
    recomputeFamilyAncestry(req.targetFamilyId),
  ]);

  await db.branchUnificationRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", appliedAt: new Date(), reviewNotes: messages.approved },
  });

  const [sourceAdmins, targetAdmins] = await Promise.all([
    getActiveFamilyAdminUserIds(req.sourceFamilyId),
    getActiveFamilyAdminUserIds(req.targetFamilyId),
  ]);
  await createNotifications([...sourceAdmins, ...targetAdmins, req.submittedByUserId], {
    type: "REQUEST_APPLIED",
    title: messages.appliedTitle,
    body: messages.approved,
    href: "/dashboard/requests",
    metadata: { requestId, sourceFamilyId: req.sourceFamilyId, targetFamilyId: req.targetFamilyId },
  });
}

export async function submitBranchUnificationRequest(rawData: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: messages.unauthorized };

  const parsed = submitSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };

  const data = parsed.data;
  if (data.sourceFamilyId === data.targetFamilyId) return { success: false, error: messages.sameFamily };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  if (!(await canManageFamily(session.user.id, data.sourceFamilyId, isSystemAdmin))) {
    return { success: false, error: messages.noPermission };
  }

  const [sourcePerson, targetPerson] = await Promise.all([
    db.person.findFirst({ where: { id: data.sourcePersonId, familyId: data.sourceFamilyId, deletedAt: null }, select: { id: true } }),
    db.person.findFirst({ where: { id: data.targetPersonId, familyId: data.targetFamilyId, deletedAt: null }, select: { id: true } }),
  ]);
  if (!sourcePerson || !targetPerson) return { success: false, error: messages.personMismatch };

  const existing = await db.branchUnificationRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { sourcePersonId: data.sourcePersonId, targetPersonId: data.targetPersonId },
        { sourcePersonId: data.targetPersonId, targetPersonId: data.sourcePersonId },
      ],
    },
    select: { id: true },
  });
  if (existing) return { success: false, error: messages.pendingExists };

  const request = await db.branchUnificationRequest.create({
    data: {
      sourceFamilyId: data.sourceFamilyId,
      targetFamilyId: data.targetFamilyId,
      sourcePersonId: data.sourcePersonId,
      targetPersonId: data.targetPersonId,
      relationship: data.relationship,
      sharedFatherName: emptyToNull(data.sharedFatherName),
      sharedMotherName: emptyToNull(data.sharedMotherName),
      notes: emptyToNull(data.notes),
      submittedByUserId: session.user.id,
      sourceApprovedByUserId: session.user.id,
      sourceApprovedAt: new Date(),
      ...(isSystemAdmin ? { targetApprovedByUserId: session.user.id, targetApprovedAt: new Date() } : {}),
    },
  });

  const [targetAdmins, systemAdmins] = await Promise.all([
    getActiveFamilyAdminUserIds(data.targetFamilyId),
    getSystemAdminUserIds(),
  ]);
  await createNotifications([...targetAdmins, ...systemAdmins].filter((userId) => userId !== session.user.id), {
    type: "REQUEST_SUBMITTED",
    title: messages.submittedTitle,
    body: messages.submittedBody,
    href: "/dashboard/requests",
    metadata: {
      requestId: request.id,
      sourceFamilyId: data.sourceFamilyId,
      targetFamilyId: data.targetFamilyId,
    },
  });

  if (isSystemAdmin) {
    try {
      await applyBranchUnification(request.id);
    } catch {
      // Keep the request visible for manual review if automatic application is blocked.
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/dashboard/families/${data.sourceFamilyId}`);
  revalidatePath(`/dashboard/families/${data.targetFamilyId}`);
  return { success: true };
}

export async function reviewBranchUnificationRequest(requestId: string, approve: boolean) {
  const session = await auth();
  if (!session?.user) return { success: false, error: messages.unauthorized };

  const req = await db.branchUnificationRequest.findUnique({ where: { id: requestId } });
  if (!req) return { success: false, error: messages.notFound };
  if (req.status !== "PENDING") return { success: false, error: messages.alreadyReviewed };

  const isSystemAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const canManageSource = await canManageFamily(session.user.id, req.sourceFamilyId, isSystemAdmin);
  const canManageTarget = await canManageFamily(session.user.id, req.targetFamilyId, isSystemAdmin);
  if (!canManageSource && !canManageTarget) return { success: false, error: messages.noPermission };

  if (!approve) {
    await db.branchUnificationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectedByUserId: session.user.id,
        rejectedAt: new Date(),
        reviewNotes: messages.rejected,
      },
    });
    const [sourceAdmins, targetAdmins] = await Promise.all([
      getActiveFamilyAdminUserIds(req.sourceFamilyId),
      getActiveFamilyAdminUserIds(req.targetFamilyId),
    ]);
    await createNotifications([...sourceAdmins, ...targetAdmins, req.submittedByUserId].filter((userId) => userId !== session.user.id), {
      type: "REQUEST_REJECTED",
      title: messages.rejected,
      href: "/dashboard/requests",
      metadata: { requestId, sourceFamilyId: req.sourceFamilyId, targetFamilyId: req.targetFamilyId },
    });
  } else {
    await db.branchUnificationRequest.update({
      where: { id: requestId },
      data: {
        ...(canManageSource ? { sourceApprovedByUserId: session.user.id, sourceApprovedAt: new Date() } : {}),
        ...(canManageTarget ? { targetApprovedByUserId: session.user.id, targetApprovedAt: new Date() } : {}),
      },
    });

    try {
      await applyBranchUnification(requestId);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : messages.invalidData };
    }

    await createNotifications([req.submittedByUserId].filter((userId) => userId !== session.user.id), {
      type: "REQUEST_APPROVED",
      title: messages.approvedTitle,
      body: messages.approved,
      href: "/dashboard/requests",
      metadata: { requestId, sourceFamilyId: req.sourceFamilyId, targetFamilyId: req.targetFamilyId },
    });
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/notifications");
  revalidatePath(`/dashboard/families/${req.sourceFamilyId}`);
  revalidatePath(`/dashboard/families/${req.targetFamilyId}`);
  revalidatePath("/dashboard/families");
  return { success: true };
}
