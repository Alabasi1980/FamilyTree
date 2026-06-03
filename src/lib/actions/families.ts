"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const familySchema = z.object({
  name: z.string().min(2, "اسم العائلة قصير").max(100),
  originSummary: z.string().max(500).optional(),
  historicalNotes: z.string().max(2000).optional(),
  isPublic: z.boolean().default(false),
});

function toSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w؀-ۿ-]/g, "")
    .slice(0, 60);
}

export type FamilyActionResult =
  | { success: true; familyId: string }
  | { success: false; error: string };

export async function createFamilyRequest(data: {
  name: string;
  originSummary?: string;
  historicalNotes?: string;
}): Promise<FamilyActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const parsed = familySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  // System admin creates directly, others submit request
  if (session.user.accountType === "SYSTEM_ADMIN") {
    const baseSlug = toSlug(parsed.data.name);
    let slug = baseSlug;
    let suffix = 1;
    while (await db.family.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const family = await db.family.create({
      data: {
        name: parsed.data.name,
        slug,
        originSummary: parsed.data.originSummary ?? null,
        historicalNotes: parsed.data.historicalNotes ?? null,
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

  // Member — submit admin request
  await db.adminRequest.create({
    data: {
      requestType: "CREATE_FAMILY_AND_ADMINISTER",
      proposedFamilyName: parsed.data.name,
      submittedByUserId: session.user.id,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/requests");
  return { success: true, familyId: "" };
}

export async function updateFamily(
  familyId: string,
  data: { name?: string; originSummary?: string; historicalNotes?: string; isPublic?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غير مصرح" };

  const isAdmin = session.user.accountType === "SYSTEM_ADMIN";
  const isFamilyAdmin = await db.familyAdminAssignment.findFirst({
    where: { familyId, userId: session.user.id, isActive: true },
  });

  if (!isAdmin && !isFamilyAdmin) return { success: false, error: "لا تملك صلاحية التعديل" };

  await db.family.update({
    where: { id: familyId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.originSummary !== undefined && { originSummary: data.originSummary }),
      ...(data.historicalNotes !== undefined && { historicalNotes: data.historicalNotes }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });

  revalidatePath(`/dashboard/families/${familyId}`);
  revalidatePath("/dashboard/families");
  return { success: true };
}

export async function deleteFamily(familyId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.accountType !== "SYSTEM_ADMIN") {
    return { success: false, error: "فقط مدير النظام يمكنه حذف العائلة" };
  }

  await db.family.update({
    where: { id: familyId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin/families");
  revalidatePath("/dashboard/families");
  return { success: true };
}
