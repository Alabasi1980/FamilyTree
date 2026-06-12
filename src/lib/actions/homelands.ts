"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotifications, getSystemAdminUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCountryFlag } from "@/lib/country-flags";
import { getFamilyHomelandKey } from "@/lib/family-homeland";

type HomelandPlaceType = "COUNTRY" | "REGION" | "CITY";

const messages = {
  unauthorized: "غير مصرح",
  systemAdminOnly: "فقط مدير النظام يمكنه إدارة المواطن",
  invalidData: "بيانات الموطن غير صحيحة",
  invalidParent: "الموطن الأب غير مناسب لهذا المستوى",
  duplicate: "هذا الموطن موجود مسبقاً",
  notFound: "الموطن غير موجود",
  requestNotFound: "طلب الموطن غير موجود",
  reviewed: "تمت مراجعة هذا الطلب مسبقاً",
};

const placeSchema = z.object({
  name: z.string().min(2, "اسم الموطن قصير").max(100),
  type: z.enum(["COUNTRY", "REGION", "CITY"]),
  parentId: z.string().optional().nullable(),
  aliases: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

const requestSchema = z.object({
  countryName: z.string().min(2, "اسم الدولة مطلوب").max(100),
  regionName: z.string().max(100).optional(),
  cityName: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

function normalizeName(value: string) {
  return value
    .trim()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function makeSlug(value: string) {
  return normalizeName(value)
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 70);
}

function parseAliases(value?: string | null) {
  return (value ?? "")
    .split(/[,\n،]/)
    .map((alias) => alias.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function expectedParentType(type: HomelandPlaceType) {
  if (type === "REGION") return "COUNTRY";
  if (type === "CITY") return "REGION";
  return null;
}

async function assertSystemAdmin() {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: messages.unauthorized };
  if (session.user.accountType !== "SYSTEM_ADMIN") {
    return { ok: false as const, error: messages.systemAdminOnly };
  }
  return { ok: true as const, userId: session.user.id };
}

export async function listActiveHomelandPlaces() {
  return db.homelandPlace.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      type: true,
      parentId: true,
      aliases: true,
      sortOrder: true,
      _count: { select: { families: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createHomelandPlace(data: {
  name: string;
  type: HomelandPlaceType;
  parentId?: string | null;
  aliases?: string;
  sortOrder?: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const admin = await assertSystemAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const parsed = placeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };
  }

  const type = parsed.data.type;
  const parentId = parsed.data.parentId || null;
  const requiredParentType = expectedParentType(type);

  if (!requiredParentType && parentId) return { success: false, error: messages.invalidParent };
  if (requiredParentType) {
    if (!parentId) return { success: false, error: messages.invalidParent };
    const parent = await db.homelandPlace.findFirst({
      where: { id: parentId, type: requiredParentType, status: "ACTIVE" },
      select: { id: true },
    });
    if (!parent) return { success: false, error: messages.invalidParent };
  }

  const normalizedName = normalizeName(parsed.data.name);
  const duplicate = await db.homelandPlace.findFirst({
    where: { parentId, normalizedName, type },
    select: { id: true },
  });
  if (duplicate) return { success: false, error: messages.duplicate, id: duplicate.id };

  const place = await db.homelandPlace.create({
    data: {
      name: parsed.data.name.trim(),
      normalizedName,
      slug: makeSlug(parsed.data.name),
      type,
      parentId,
      aliases: parseAliases(parsed.data.aliases),
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/homelands");
  revalidatePath("/dashboard/families/new");
  return { success: true, id: place.id };
}

async function findOrCreatePlace(name: string, type: HomelandPlaceType, parentId: string | null) {
  const normalizedName = normalizeName(name);
  const existing = await db.homelandPlace.findFirst({
    where: { parentId, normalizedName, type },
    select: { id: true },
  });
  if (existing) return existing.id;

  const place = await db.homelandPlace.create({
    data: {
      name: name.trim(),
      normalizedName,
      slug: makeSlug(name),
      type,
      parentId,
    },
  });
  return place.id;
}

export async function submitHomelandPlaceRequest(data: {
  countryName: string;
  regionName?: string;
  cityName?: string;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: messages.unauthorized };

  const parsed = requestSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };
  }

  const countryName = parsed.data.countryName.trim();
  const regionName = parsed.data.regionName?.trim() || null;
  const cityName = parsed.data.cityName?.trim() || null;

  const existingPending = await db.homelandPlaceRequest.findFirst({
    where: {
      status: "PENDING",
      countryName,
      regionName,
      cityName,
      submittedByUserId: session.user.id,
    },
    select: { id: true },
  });
  if (existingPending) return { success: true };

  const request = await db.homelandPlaceRequest.create({
    data: {
      countryName,
      regionName,
      cityName,
      note: parsed.data.note?.trim() || null,
      submittedByUserId: session.user.id,
    },
  });

  const systemAdmins = await getSystemAdminUserIds();
  await createNotifications(systemAdmins.filter((id) => id !== session.user.id), {
    type: "REQUEST_SUBMITTED",
    title: "طلب إضافة موطن جديد",
    body: `طلب إضافة موطن: ${[countryName, regionName, cityName].filter(Boolean).join(" - ")}`,
    href: "/admin/homelands",
    metadata: { homelandPlaceRequestId: request.id },
  });

  revalidatePath("/admin/homelands");
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function reviewHomelandPlaceRequest(
  requestId: string,
  approve: boolean,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await assertSystemAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const request = await db.homelandPlaceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      countryName: true,
      regionName: true,
      cityName: true,
      status: true,
      submittedByUserId: true,
    },
  });
  if (!request) return { success: false, error: messages.requestNotFound };
  if (request.status !== "PENDING") return { success: false, error: messages.reviewed };

  let approvedPlaceId: string | null = null;
  if (approve) {
    const countryId = await findOrCreatePlace(request.countryName, "COUNTRY", null);
    approvedPlaceId = countryId;
    if (request.regionName) {
      const regionId = await findOrCreatePlace(request.regionName, "REGION", countryId);
      approvedPlaceId = regionId;
      if (request.cityName) {
        approvedPlaceId = await findOrCreatePlace(request.cityName, "CITY", regionId);
      }
    }
  }

  await db.homelandPlaceRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      reviewedByUserId: admin.userId,
      approvedPlaceId,
      reviewNotes: reviewNotes?.trim() || null,
    },
  });

  await createNotifications([request.submittedByUserId].filter((id) => id !== admin.userId), {
    type: approve ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
    title: approve ? "تمت الموافقة على موطن مقترح" : "تم رفض موطن مقترح",
    body: approve ? "تم اعتماد الموطن المقترح وأصبح متاحاً للاختيار." : "تم رفض طلب إضافة الموطن.",
    href: "/dashboard/notifications",
    metadata: { homelandPlaceRequestId: request.id, approvedPlaceId },
  });

  revalidatePath("/");
  revalidatePath("/admin/homelands");
  revalidatePath("/dashboard/families/new");
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function updateHomelandPlace(
  id: string,
  data: { name: string; aliases?: string; sortOrder?: number }
): Promise<{ success: boolean; error?: string }> {
  const admin = await assertSystemAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const parsed = placeSchema.partial().safeParse({ ...data, type: "COUNTRY" });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? messages.invalidData };
  }

  const place = await db.homelandPlace.findUnique({ where: { id }, select: { id: true, parentId: true, type: true } });
  if (!place) return { success: false, error: messages.notFound };

  const normalizedName = normalizeName(data.name);
  const duplicate = await db.homelandPlace.findFirst({
    where: { parentId: place.parentId, normalizedName, type: place.type, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) return { success: false, error: messages.duplicate };

  await db.homelandPlace.update({
    where: { id },
    data: {
      name: data.name.trim(),
      normalizedName,
      slug: makeSlug(data.name),
      ...(data.aliases !== undefined && { aliases: parseAliases(data.aliases) }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/homelands");
  revalidatePath("/dashboard/families/new");
  return { success: true };
}

export async function deleteHomelandPlace(id: string): Promise<{ success: boolean; error?: string }> {
  const admin = await assertSystemAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const place = await db.homelandPlace.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { families: true, children: true } },
    },
  });
  if (!place) return { success: false, error: messages.notFound };
  if (place._count.families > 0) return { success: false, error: "لا يمكن حذف موطن مرتبط بعائلات" };
  if (place._count.children > 0) return { success: false, error: "احذف المواطن الفرعية أولاً" };

  await db.homelandPlace.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin/homelands");
  revalidatePath("/dashboard/families/new");
  return { success: true };
}

export async function getHomelandPlacePathFields(placeId?: string | null) {
  if (!placeId) return null;
  const place = await db.homelandPlace.findFirst({
    where: { id: placeId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      type: true,
      parent: {
        select: {
          id: true,
          name: true,
          type: true,
          parent: { select: { id: true, name: true, type: true } },
        },
      },
    },
  });
  if (!place) return null;

  if (place.type === "COUNTRY") {
    return { homelandPlaceId: place.id, homelandCountry: place.name, homelandRegion: null, homelandCity: null };
  }
  if (place.type === "REGION") {
    return {
      homelandPlaceId: place.id,
      homelandCountry: place.parent?.name ?? null,
      homelandRegion: place.name,
      homelandCity: null,
    };
  }
  return {
    homelandPlaceId: place.id,
    homelandCountry: place.parent?.parent?.name ?? null,
    homelandRegion: place.parent?.name ?? null,
    homelandCity: place.name,
  };
}

// ── Explorer Data ─────────────────────────────────────────────────────────────

export interface ExplorerCity {
  id: string;
  name: string;
  familyCount: number;
  personCount: number;
  homelandKey: string;
}

export interface ExplorerRegion {
  id: string;
  name: string;
  cityCount: number;
  totalFamilyCount: number;
  totalPersonCount: number;
  cities: ExplorerCity[];
}

export interface ExplorerCountry {
  id: string;
  name: string;
  flag: string;
  regionCount: number;
  totalFamilyCount: number;
  totalPersonCount: number;
  regions: ExplorerRegion[];
}

export async function getHomelandExplorerData(): Promise<ExplorerCountry[]> {
  const [places, families] = await Promise.all([
    db.homelandPlace.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, type: true, parentId: true, sortOrder: true },
    }),
    db.family.findMany({
      where: { isPublic: true, deletedAt: null },
      select: {
        homelandCountry: true,
        homelandRegion: true,
        homelandCity: true,
        _count: { select: { persons: true } },
      },
    }),
  ]);

  // Build lookup maps
  const countriesByNorm = new Map<string, (typeof places)[0]>();
  const regionsByKey = new Map<string, (typeof places)[0]>();
  const citiesByKey = new Map<string, (typeof places)[0]>();
  const regionsByCountry = new Map<string, (typeof places)[0][]>();
  const citiesByRegion = new Map<string, (typeof places)[0][]>();

  for (const place of places) {
    const norm = normalizeName(place.name);
    if (place.type === "COUNTRY") {
      countriesByNorm.set(norm, place);
    } else if (place.type === "REGION" && place.parentId) {
      regionsByKey.set(`${place.parentId}__${norm}`, place);
      const list = regionsByCountry.get(place.parentId) ?? [];
      list.push(place);
      regionsByCountry.set(place.parentId, list);
    } else if (place.type === "CITY" && place.parentId) {
      citiesByKey.set(`${place.parentId}__${norm}`, place);
      const list = citiesByRegion.get(place.parentId) ?? [];
      list.push(place);
      citiesByRegion.set(place.parentId, list);
    }
  }

  // Aggregate family + person counts per place
  type Stats = { familyCount: number; personCount: number };
  const cityStats = new Map<string, Stats>();
  const regionStats = new Map<string, Stats>();
  const countryStats = new Map<string, Stats>();

  function addStats(map: Map<string, Stats>, id: string, persons: number) {
    const s = map.get(id) ?? { familyCount: 0, personCount: 0 };
    map.set(id, { familyCount: s.familyCount + 1, personCount: s.personCount + persons });
  }

  for (const family of families) {
    const cName = family.homelandCountry?.trim();
    const rName = family.homelandRegion?.trim();
    const ctName = family.homelandCity?.trim();
    const persons = family._count.persons;

    if (!cName) continue;
    const country = countriesByNorm.get(normalizeName(cName));
    if (!country) continue;
    addStats(countryStats, country.id, persons);

    if (!rName) continue;
    const region = regionsByKey.get(`${country.id}__${normalizeName(rName)}`);
    if (!region) continue;
    addStats(regionStats, region.id, persons);

    if (!ctName) continue;
    const city = citiesByKey.get(`${region.id}__${normalizeName(ctName)}`);
    if (!city) continue;
    addStats(cityStats, city.id, persons);
  }

  // Build sorted tree
  const sortPlaces = (arr: (typeof places)[0][]) =>
    arr.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"));

  const countriesRaw = sortPlaces(places.filter((p) => p.type === "COUNTRY"));

  return countriesRaw.map((country) => {
    const cStats = countryStats.get(country.id) ?? { familyCount: 0, personCount: 0 };
    const regions = sortPlaces(regionsByCountry.get(country.id) ?? []).map((region) => {
      const rStats = regionStats.get(region.id) ?? { familyCount: 0, personCount: 0 };
      const cities = sortPlaces(citiesByRegion.get(region.id) ?? []).map((city) => {
        const ctStats = cityStats.get(city.id) ?? { familyCount: 0, personCount: 0 };
        return {
          id: city.id,
          name: city.name,
          familyCount: ctStats.familyCount,
          personCount: ctStats.personCount,
          homelandKey: getFamilyHomelandKey({
            homelandCountry: country.name,
            homelandRegion: region.name,
            homelandCity: city.name,
          }),
        };
      });
      return {
        id: region.id,
        name: region.name,
        cityCount: cities.length,
        totalFamilyCount: rStats.familyCount,
        totalPersonCount: rStats.personCount,
        cities,
      };
    });
    return {
      id: country.id,
      name: country.name,
      flag: getCountryFlag(country.name),
      regionCount: regions.length,
      totalFamilyCount: cStats.familyCount,
      totalPersonCount: cStats.personCount,
      regions,
    };
  });
}
