"use server";

import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import {
  createNotifications,
  getActiveFamilyAdminUserIds,
  getSystemAdminUserIds,
  requestFocusHref,
} from "@/lib/notifications";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional()
  );

const optionalYear = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  },
  z.number().int().min(1).max(new Date().getFullYear() + 1).optional()
);

// ── Add-person suggestion payload ─────────────────────────────────────────────

const addPersonPayloadSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean().default(true),
  birthYear: optionalYear,
  birthPlace: optionalText(160),
  deathYear: optionalYear,
  profession: optionalText(120),
  notes: optionalText(500),
  relatedPersonId: z.string().cuid().optional(),
  relatedPersonRole: z.enum(["parent", "child", "spouse"]).optional(),
});

// ── Edit-person suggestion payload ────────────────────────────────────────────

const editPersonPayloadSchema = z.object({
  targetPersonId: z.string().cuid(),
  fullName: z.string().min(2).max(200),
  gender: z.enum(["MALE", "FEMALE"]),
  isLiving: z.boolean(),
  birthYear: optionalYear,
  birthPlace: optionalText(160),
  deathYear: optionalYear,
  profession: optionalText(120),
  notes: optionalText(500),
});

// ── Outer request schema ──────────────────────────────────────────────────────

const guestSuggestionSchema = z.object({
  shareToken: z.string().min(1),
  guestName: z.string().trim().max(120).optional(),
  guestContact: z.string().trim().max(200).optional(),
  requestType: z.enum(["ADD_PERSON", "EDIT_PERSON"]),
  payload: z.unknown(),
});

export type GuestSuggestionResult =
  | { success: true }
  | { success: false; error: string };

// ── main action ───────────────────────────────────────────────────────────────

export async function submitGuestSuggestion(
  rawData: unknown
): Promise<GuestSuggestionResult> {
  const outer = guestSuggestionSchema.safeParse(rawData);
  if (!outer.success) {
    return { success: false, error: outer.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { shareToken, guestName, guestContact, requestType, payload } = outer.data;

  // 1. Validate share link
  const link = await db.shareLink.findUnique({
    where: { token: shareToken },
    select: { isActive: true, expiresAt: true, targetType: true, familyId: true },
  });

  if (!link || !link.isActive || link.targetType !== "FAMILY" || !link.familyId) {
    return { success: false, error: "رابط المشاركة غير صالح" };
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { success: false, error: "انتهت صلاحية رابط المشاركة" };
  }

  const familyId = link.familyId;

  // 2. Validate payload based on request type
  let validatedPayload: object;

  if (requestType === "ADD_PERSON") {
    const parsed = addPersonPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات الشخص غير صحيحة" };
    }
    // Verify relatedPerson belongs to this family if provided
    if (parsed.data.relatedPersonId) {
      const related = await db.person.findFirst({
        where: { id: parsed.data.relatedPersonId, familyId, deletedAt: null },
        select: { id: true },
      });
      if (!related) return { success: false, error: "الشخص المرتبط غير موجود في هذه العائلة" };
    }
    validatedPayload = parsed.data;
  } else {
    const parsed = editPersonPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات التعديل غير صحيحة" };
    }
    // Verify target person belongs to this family
    const target = await db.person.findFirst({
      where: { id: parsed.data.targetPersonId, familyId, deletedAt: null },
      select: { id: true },
    });
    if (!target) return { success: false, error: "الشخص المستهدف غير موجود في هذه العائلة" };
    validatedPayload = parsed.data;
  }

  // 3. Create EditRequest
  const targetId = requestType === "EDIT_PERSON"
    ? (validatedPayload as { targetPersonId: string }).targetPersonId
    : null;

  // Use $queryRaw to bypass Prisma 7 checked-mode validation that incorrectly
  // requires optional relations (submittedBy) when using relation objects.
  const requestId = "c" + randomBytes(11).toString("base64url").substring(0, 24);
  await db.$executeRaw`
    INSERT INTO "EditRequest" (
      id, "requestType", "targetType", "targetId", "familyId",
      source, "guestName", "guestContact", "payloadJson", status,
      "createdAt", "updatedAt"
    ) VALUES (
      ${requestId},
      ${requestType}::"EditRequestType",
      'PERSON'::"TargetType",
      ${targetId},
      ${familyId},
      'SHARE_LINK_GUEST'::"EditRequestSource",
      ${guestName || null},
      ${guestContact || null},
      ${JSON.stringify(validatedPayload)}::jsonb,
      'PENDING'::"EditRequestStatus",
      NOW(),
      NOW()
    )
  `;
  const request = { id: requestId };

  // 4. Notify family admins
  const family = await db.family.findUnique({
    where: { id: familyId },
    select: { name: true },
  });

  const [familyAdmins, systemAdmins] = await Promise.all([
    getActiveFamilyAdminUserIds(familyId),
    getSystemAdminUserIds(),
  ]);

  const suggesterLabel = guestName ? guestName : "زائر";
  const actionLabel = requestType === "ADD_PERSON" ? "إضافة فرد جديد" : "تعديل بيانات فرد";

  await createNotifications([...familyAdmins, ...systemAdmins], {
    type: "REQUEST_SUBMITTED",
    title: `اقتراح من زائر — ${actionLabel}`,
    body: `${suggesterLabel} اقترح ${actionLabel} في عائلة ${family?.name ?? ""} عبر رابط مشاركة.`,
    href: requestFocusHref(request.id),
    metadata: { requestId: request.id, requestType, familyId },
  });

  return { success: true };
}
