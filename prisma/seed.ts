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
