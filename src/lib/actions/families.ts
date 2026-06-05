"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const messages = {
  shortName:
    "\u0627\u0633\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0642\u0635\u064a\u0631",
  unauthorized: "\u063a\u064a\u0631 \u0645\u0635\u0631\u062d",
  invalidData:
    "\u0628\u064a\u0627\u0646\u0627\u062a \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629",
  cannotEdit:
    "\u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u062a\u0639\u062f\u064a\u0644",
  systemAdminDeleteOnly:
    "\u0641\u0642\u0637 \u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u064a\u0645\u0643\u0646\u0647 \u062d\u0630\u0641 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
};

const homelandConfidenceSchema = z
  .enum(["VERIFIED", "LIKELY", "UNDOCUMENTED", "UNSPECIFIED"])
  .default("UNSPECIFIED");

const familySchema = z.object({
  name: z.string().min(2, messages.shortName).max(100),
  originSummary: z.string().max(500).optional(),
  historicalNotes: z.string().max(2000).optional(),
  homelandCountry: z.string().max(100).optional(),
  homelandRegion: z.string().max(100).optional(),
  homelandCity: z.string().max(100).optional(),
  homelandNote: z.string().max(500).optional(),
  homelandConfidence: homelandConfidenceSchema,
  isPublic: z.boolean().default(false),
});

function emptyToNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60);
}

export type FamilyActionResult =
  | { success: true; familyId: string }
  | { success: false; error: string };

export async function createFamilyRequest(data: {
  name: string;
  originSummary?: string;
  historicalNotes?: string;
  homelandCountry?: string;
  homelandRegion?: string;
  homelandCity?: string;
  homelandNote?: string;
  homelandConfidence?: "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";
}): Promise<FamilyActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: messages.unauthorized };

  const parsed = familySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };
  }

  const familyData = {
    name: parsed.data.name.trim(),
    originSummary: emptyToNull(parsed.data.originSummary),
    historicalNotes: emptyToNull(parsed.data.historicalNotes),
    homelandCountry: emptyToNull(parsed.data.homelandCountry),
    homelandRegion: emptyToNull(parsed.data.homelandRegion),
    homelandCity: emptyToNull(parsed.data.homelandCity),
    homelandNote: emptyToNull(parsed.data.homelandNote),
    homelandConfidence: parsed.data.homelandConfidence,
  };

  if (session.user.accountType === "SYSTEM_ADMIN") {
    const baseSlug = toSlug(familyData.name);
    let slug = baseSlug;
    let suffix = 1;
    while (await db.family.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const family = await db.family.create({
      data: {
        ...familyData,
        slug,
        isPublic: false,
        adminAssignments: {
          create: { userId: session.user.id, assignedByUserId: session.user.id },
        },
      },
    });
    revalidatePath("/dashboard/families");
    revalidatePath("/admin/families");
    return { success: true, familyId: family.id };
  }

  await db.adminRequest.create({
    data: {
      requestType: "CREATE_FAMILY_AND_ADMINISTER",
      proposedFamilyName: familyData.name,
      proposedHomelandCountry: familyData.homelandCountry,
      proposedHomelandRegion: familyData.homelandRegion,
      proposedHomelandCity: familyData.homelandCity,
      proposedHomelandNote: familyData.homelandNote,
      proposedHomelandConfidence: familyData.homelandConfidence,
      submittedByUserId: session.user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/requests");
  return { success: true, familyId: "" };
}

export async function updateFamily(
  familyId: string,
  data: {
    name?: string;
    originSummary?: string;
    historicalNotes?: string;
    homelandCountry?: string;
    homelandRegion?: string;
    homelandCity?: string;
    homelandNote?: string;
    homelandConfidence?: "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";
    isPublic?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: messages.unauthorized };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId: session.user.id, isActive: true },
  });

  if (!isAdmin && !isFamilyAdmin) return { success: false, error: messages.cannotEdit };

  const parsed = familySchema.partial().safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };
  }

  await db.family.update({
    where: { id: familyId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.originSummary !== undefined && {
        originSummary: emptyToNull(parsed.data.originSummary),
      }),
      ...(parsed.data.historicalNotes !== undefined && {
        historicalNotes: emptyToNull(parsed.data.historicalNotes),
      }),
      ...(parsed.data.homelandCountry !== undefined && {
        homelandCountry: emptyToNull(parsed.data.homelandCountry),
      }),
      ...(parsed.data.homelandRegion !== undefined && {
        homelandRegion: emptyToNull(parsed.data.homelandRegion),
      }),
      ...(parsed.data.homelandCity !== undefined && {
        homelandCity: emptyToNull(parsed.data.homelandCity),
      }),
      ...(parsed.data.homelandNote !== undefined && {
        homelandNote: emptyToNull(parsed.data.homelandNote),
      }),
      ...(parsed.data.homelandConfidence !== undefined && {
        homelandConfidence: parsed.data.homelandConfidence,
      }),
      ...(parsed.data.isPublic !== undefined && { isPublic: parsed.data.isPublic }),
    },
  });

  revalidatePath(`/dashboard/families/${familyId}`);
  revalidatePath("/dashboard/families");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFamily(familyId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: messages.systemAdminDeleteOnly };
  }

  await db.family.update({
    where: { id: familyId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin/families");
  revalidatePath("/dashboard/families");
  return { success: true };
}
