import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as bcrypt from "bcryptjs";
import { placesData } from "./places-seed-data";
import { placesData2 } from "./places-seed-data-2";
import { placesData3 } from "./places-seed-data-3";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// --- Arab text helpers ---

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؐ-ًؚ-ٰٟ]/g, "")
    .trim();
}

function toSlug(text: string): string {
  const map: Record<string, string> = {
    ا: "a", أ: "a", إ: "a", آ: "aa",
    ب: "b", ت: "t", ث: "th",
    ج: "j", ح: "h", خ: "kh",
    د: "d", ذ: "dh", ر: "r",
    ز: "z", س: "s", ش: "sh",
    ص: "s", ض: "d", ط: "t",
    ظ: "dh", ع: "a", غ: "gh",
    ف: "f", ق: "q", ك: "k",
    ل: "l", م: "m", ن: "n",
    ه: "h", و: "w", ي: "y",
    ة: "h", ى: "a", ء: "",
    ئ: "y", ؤ: "w", " ": "-", ـ: "",
  };
  let result = "";
  for (const char of text) {
    result += map[char] !== undefined ? map[char] : char;
  }
  return result
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

// --- Homeland places seeder ---

async function seedHomelandPlaces() {
  const existingCount = await db.homelandPlace.count();
  if (existingCount > 0) {
    console.log(`ℹ️  HomelandPlaces already seeded (${existingCount} records)`);
    return;
  }

  const allPlaces = [...placesData, ...placesData2, ...placesData3];
  const nameToId = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const type of ["COUNTRY", "REGION", "CITY"] as const) {
    const entries = allPlaces.filter((p) => p.type === type);
    for (const place of entries) {
      const parentId = place.parent ? nameToId.get(place.parent) : undefined;
      const normalizedName = normalizeArabic(place.name);
      const slugBase = place.parent
        ? `${toSlug(place.parent)}-${toSlug(place.name)}`
        : toSlug(place.name);

      try {
        const rec = await db.homelandPlace.create({
          data: {
            name: place.name,
            normalizedName,
            slug: slugBase,
            type: place.type,
            parentId: parentId ?? null,
            aliases: place.aliases ?? [],
            sortOrder: place.sortOrder ?? 0,
          },
        });
        nameToId.set(place.name, rec.id);
        created++;
      } catch (e: any) {
        if (e.code === "P2002") {
          skipped++;
        } else {
          throw e;
        }
      }
    }
  }

  console.log(`✅ Created ${created} HomelandPlace records (${skipped} skipped as duplicates)`);
}

// --- Main ---

async function main() {
  console.log("🌱 Starting seed...");

  // System admin
  const adminEmail = "admin@families-tree.local";
  const existingAdmin = await db.user.findFirst({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@1234", 12);
    await db.user.create({
      data: {
        fullName: "مدير النظام",
        email: adminEmail,
        passwordHash,
        accountType: "SYSTEM_ADMIN",
      },
    });
    console.log("✅ Created system admin: admin@families-tree.local / Admin@1234");
  } else {
    console.log("ℹ️  System admin already exists");
  }

  // Test family
  const existingFamily = await db.family.findFirst({ where: { slug: "al-rashidi" } });
  if (!existingFamily) {
    const admin = await db.user.findFirst({ where: { email: adminEmail } });

    const family = await db.family.create({
      data: {
        name: "الراشدي",
        slug: "al-rashidi",
        originSummary: "عائلة عريقة من منطقة نجد، تمتد جذورها إلى القرن الثامن عشر",
        isPublic: true,
        adminAssignments: {
          create: {
            userId: admin!.id,
            assignedByUserId: admin!.id,
          },
        },
      },
    });

    const grandfather = await db.person.create({
      data: {
        familyId: family.id,
        fullName: "راشد بن محمد الراشدي",
        gender: "MALE",
        isLiving: false,
        birthDate: new Date("1920-01-01"),
        deathDate: new Date("1995-01-01"),
        visibilityLevel: "PUBLIC",
      },
    });

    const father = await db.person.create({
      data: {
        familyId: family.id,
        fullName: "محمد بن راشد الراشدي",
        gender: "MALE",
        isLiving: true,
        birthDate: new Date("1955-06-15"),
        visibilityLevel: "PUBLIC",
      },
    });

    const son1 = await db.person.create({
      data: {
        familyId: family.id,
        fullName: "عبدالله بن محمد الراشدي",
        gender: "MALE",
        isLiving: true,
        birthDate: new Date("1980-03-20"),
        visibilityLevel: "PUBLIC",
      },
    });

    const son2 = await db.person.create({
      data: {
        familyId: family.id,
        fullName: "سارة بنت محمد الراشدي",
        gender: "FEMALE",
        isLiving: true,
        birthDate: new Date("1983-09-10"),
        visibilityLevel: "PUBLIC",
      },
    });

    await db.parentChildRelation.createMany({
      data: [
        { parentPersonId: grandfather.id, childPersonId: father.id },
        { parentPersonId: father.id, childPersonId: son1.id },
        { parentPersonId: father.id, childPersonId: son2.id },
      ],
    });

    await db.personAncestry.createMany({
      data: [
        { ancestorId: grandfather.id, descendantId: grandfather.id, depth: 0 },
        { ancestorId: father.id, descendantId: father.id, depth: 0 },
        { ancestorId: son1.id, descendantId: son1.id, depth: 0 },
        { ancestorId: son2.id, descendantId: son2.id, depth: 0 },
        { ancestorId: grandfather.id, descendantId: father.id, depth: 1 },
        { ancestorId: grandfather.id, descendantId: son1.id, depth: 2 },
        { ancestorId: grandfather.id, descendantId: son2.id, depth: 2 },
        { ancestorId: father.id, descendantId: son1.id, depth: 1 },
        { ancestorId: father.id, descendantId: son2.id, depth: 1 },
      ],
    });

    console.log("✅ Created test family: عائلة الراشدي (4 persons)");
  } else {
    console.log("ℹ️  Test family already exists");
  }

  // Homeland places
  await seedHomelandPlaces();

  console.log("🌳 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
