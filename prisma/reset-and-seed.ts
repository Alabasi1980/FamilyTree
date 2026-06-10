/**
 * reset-and-seed.ts
 * 1. يحذف جميع العائلات والمستخدمين
 * 2. يُضيف بيانات المواطن للأردن وفلسطين والسعودية
 *
 * تشغيل: npx tsx prisma/reset-and-seed.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ── دوال توليد الاسم المُعياري والـ slug ──────────────────────────────────────

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
    .replace(/[^\w؀-ۿ-]/g, "")
    .slice(0, 70);
}

// ── بيانات المواطن ─────────────────────────────────────────────────────────────

type CityEntry = { name: string; aliases?: string[] };
type RegionEntry = { name: string; aliases?: string[]; cities: CityEntry[] };
type CountryEntry = { name: string; aliases?: string[]; sortOrder: number; regions: RegionEntry[] };

const HOMELANDS: CountryEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. الأردن
  // ═══════════════════════════════════════════════════════════════
  {
    name: "الأردن",
    aliases: ["المملكة الأردنية الهاشمية", "Jordan"],
    sortOrder: 10,
    regions: [
      {
        name: "محافظة عمّان",
        aliases: ["عمان", "العاصمة"],
        cities: [
          { name: "عمّان", aliases: ["Amman", "العاصمة"] },
          { name: "وادي السير" },
          { name: "سحاب" },
          { name: "الجويدة" },
          { name: "ماركا" },
          { name: "أبو نصير" },
          { name: "النزهة" },
          { name: "طبربور" },
          { name: "المقابلين" },
        ],
      },
      {
        name: "محافظة إربد",
        aliases: ["إربد"],
        cities: [
          { name: "إربد", aliases: ["Irbid"] },
          { name: "الرمثا" },
          { name: "الحصن" },
          { name: "الكورة" },
          { name: "بني كنانة" },
          { name: "الأغوار الشمالية" },
          { name: "الطيبة" },
        ],
      },
      {
        name: "محافظة الزرقاء",
        aliases: ["الزرقاء"],
        cities: [
          { name: "الزرقاء", aliases: ["Zarqa"] },
          { name: "الرصيفة" },
          { name: "الهاشمية" },
          { name: "الأزرق" },
          { name: "بلعما" },
        ],
      },
      {
        name: "محافظة البلقاء",
        aliases: ["البلقاء"],
        cities: [
          { name: "السلط", aliases: ["Salt"] },
          { name: "عين الباشا" },
          { name: "ماحص" },
          { name: "دير علا" },
          { name: "الأغوار الجنوبية" },
          { name: "شونة الجنوبية" },
        ],
      },
      {
        name: "محافظة الكرك",
        aliases: ["الكرك"],
        cities: [
          { name: "الكرك", aliases: ["Karak"] },
          { name: "المزار الجنوبي" },
          { name: "الغور" },
          { name: "عي" },
          { name: "فقوع" },
        ],
      },
      {
        name: "محافظة المفرق",
        aliases: ["المفرق"],
        cities: [
          { name: "المفرق", aliases: ["Mafraq"] },
          { name: "الرويشد" },
          { name: "الأزرق" },
          { name: "صافوت" },
          { name: "خو" },
        ],
      },
      {
        name: "محافظة الطفيلة",
        aliases: ["الطفيلة"],
        cities: [
          { name: "الطفيلة", aliases: ["Tafilah"] },
          { name: "بصيرا" },
          { name: "العين" },
          { name: "الحسا" },
        ],
      },
      {
        name: "محافظة معان",
        aliases: ["معان"],
        cities: [
          { name: "معان", aliases: ["Maan"] },
          { name: "وادي موسى", aliases: ["البتراء", "Petra"] },
          { name: "الحميدية" },
          { name: "الجفر" },
          { name: "الشوبك" },
        ],
      },
      {
        name: "محافظة العقبة",
        aliases: ["العقبة"],
        cities: [
          { name: "العقبة", aliases: ["Aqaba"] },
          { name: "القويرة" },
          { name: "رم", aliases: ["وادي رم"] },
        ],
      },
      {
        name: "محافظة مادبا",
        aliases: ["مادبا"],
        cities: [
          { name: "مادبا", aliases: ["Madaba"] },
          { name: "ذيبان" },
          { name: "المجيب" },
        ],
      },
      {
        name: "محافظة جرش",
        aliases: ["جرش"],
        cities: [
          { name: "جرش", aliases: ["Jerash"] },
          { name: "برما" },
          { name: "صخرة" },
          { name: "كفرخل" },
        ],
      },
      {
        name: "محافظة عجلون",
        aliases: ["عجلون"],
        cities: [
          { name: "عجلون", aliases: ["Ajloun"] },
          { name: "كفرنجة" },
          { name: "عنجرة" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. فلسطين
  // ═══════════════════════════════════════════════════════════════
  {
    name: "فلسطين",
    aliases: ["Palestine", "دولة فلسطين"],
    sortOrder: 20,
    regions: [
      {
        name: "محافظة القدس",
        aliases: ["القدس"],
        cities: [
          { name: "القدس", aliases: ["Jerusalem", "بيت المقدس", "Al-Quds"] },
          { name: "أبو ديس" },
          { name: "العيزرية" },
          { name: "بيت حنينا" },
          { name: "الرام" },
          { name: "شعفاط" },
        ],
      },
      {
        name: "محافظة رام الله والبيرة",
        aliases: ["رام الله", "البيرة"],
        cities: [
          { name: "رام الله", aliases: ["Ramallah"] },
          { name: "البيرة", aliases: ["Al-Bireh"] },
          { name: "بيتونيا" },
          { name: "دورا الشنار" },
          { name: "قبية" },
          { name: "بيت عور الفوقا" },
        ],
      },
      {
        name: "محافظة الخليل",
        aliases: ["الخليل", "حبرون"],
        cities: [
          { name: "الخليل", aliases: ["Hebron"] },
          { name: "يطا" },
          { name: "دورا" },
          { name: "الظاهرية" },
          { name: "سعير" },
          { name: "حلحول" },
          { name: "بيت كاحل" },
        ],
      },
      {
        name: "محافظة نابلس",
        aliases: ["نابلس"],
        cities: [
          { name: "نابلس", aliases: ["Nablus"] },
          { name: "بيتا" },
          { name: "قباطية" },
          { name: "بيت فوريك" },
          { name: "حوارة" },
          { name: "عصيرة الشمالية" },
        ],
      },
      {
        name: "محافظة جنين",
        aliases: ["جنين"],
        cities: [
          { name: "جنين", aliases: ["Jenin"] },
          { name: "يعبد" },
          { name: "عرابة" },
          { name: "قباطية" },
          { name: "كفر راعي" },
          { name: "ميثلون" },
        ],
      },
      {
        name: "محافظة طولكرم",
        aliases: ["طولكرم"],
        cities: [
          { name: "طولكرم", aliases: ["Tulkarm"] },
          { name: "عنبتا" },
          { name: "باقة الشرقية" },
          { name: "إيلار" },
        ],
      },
      {
        name: "محافظة قلقيلية",
        aliases: ["قلقيلية"],
        cities: [
          { name: "قلقيلية", aliases: ["Qalqilya"] },
          { name: "حبلة" },
          { name: "عزون" },
          { name: "كفر ثلث" },
        ],
      },
      {
        name: "محافظة طوباس",
        aliases: ["طوباس"],
        cities: [
          { name: "طوباس", aliases: ["Tubas"] },
          { name: "تياسير" },
          { name: "الأغوار الشمالية" },
          { name: "وادي الفارعة" },
        ],
      },
      {
        name: "محافظة أريحا والأغوار",
        aliases: ["أريحا", "الأغوار"],
        cities: [
          { name: "أريحا", aliases: ["Jericho"] },
          { name: "الأغوار الجنوبية" },
          { name: "عين دوق" },
          { name: "نعيمة" },
        ],
      },
      {
        name: "محافظة سلفيت",
        aliases: ["سلفيت"],
        cities: [
          { name: "سلفيت", aliases: ["Salfit"] },
          { name: "بديا" },
          { name: "مردا" },
          { name: "كفل حارس" },
        ],
      },
      {
        name: "محافظة بيت لحم",
        aliases: ["بيت لحم"],
        cities: [
          { name: "بيت لحم", aliases: ["Bethlehem"] },
          { name: "بيت جالا" },
          { name: "بيت ساحور" },
          { name: "العبيدية" },
          { name: "الدهيشة" },
          { name: "تقوع" },
          { name: "الخضر" },
        ],
      },
      {
        name: "محافظة غزة",
        aliases: ["قطاع غزة", "غزة"],
        cities: [
          { name: "غزة", aliases: ["Gaza"] },
          { name: "خان يونس" },
          { name: "رفح" },
          { name: "دير البلح" },
          { name: "جباليا" },
          { name: "بيت لاهيا" },
          { name: "بيت حانون" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. المملكة العربية السعودية
  // ═══════════════════════════════════════════════════════════════
  {
    name: "المملكة العربية السعودية",
    aliases: ["السعودية", "Saudi Arabia", "KSA"],
    sortOrder: 30,
    regions: [
      {
        name: "منطقة الرياض",
        aliases: ["الرياض", "الوسطى"],
        cities: [
          { name: "الرياض", aliases: ["Riyadh", "العاصمة"] },
          { name: "الخرج" },
          { name: "الدوادمي" },
          { name: "المجمعة" },
          { name: "الزلفي" },
          { name: "حوطة بني تميم" },
          { name: "القويعية" },
          { name: "وادي الدواسر" },
          { name: "الأفلاج" },
          { name: "شقراء" },
          { name: "ضرما" },
          { name: "عفيف" },
        ],
      },
      {
        name: "منطقة مكة المكرمة",
        aliases: ["مكة", "الحجاز", "المنطقة الغربية"],
        cities: [
          { name: "مكة المكرمة", aliases: ["Makkah", "Mecca"] },
          { name: "جدة", aliases: ["Jeddah", "Jiddah"] },
          { name: "الطائف" },
          { name: "رابغ" },
          { name: "الليث" },
          { name: "القنفذة" },
          { name: "أملج" },
        ],
      },
      {
        name: "منطقة المدينة المنورة",
        aliases: ["المدينة المنورة", "المدينة"],
        cities: [
          { name: "المدينة المنورة", aliases: ["Madinah", "Medina"] },
          { name: "ينبع" },
          { name: "العلا" },
          { name: "بدر" },
          { name: "المهد" },
          { name: "الحناكية" },
        ],
      },
      {
        name: "منطقة القصيم",
        aliases: ["القصيم"],
        cities: [
          { name: "بريدة", aliases: ["Buraidah"] },
          { name: "عنيزة" },
          { name: "الرس" },
          { name: "المذنب" },
          { name: "البكيرية" },
          { name: "عيون الجواء" },
        ],
      },
      {
        name: "المنطقة الشرقية",
        aliases: ["الشرقية", "الأحساء", "الدمام"],
        cities: [
          { name: "الدمام", aliases: ["Dammam"] },
          { name: "الخبر", aliases: ["Khobar"] },
          { name: "الأحساء", aliases: ["Al-Ahsa", "الهفوف"] },
          { name: "الجبيل" },
          { name: "حفر الباطن" },
          { name: "القطيف" },
          { name: "الظهران" },
          { name: "راس تنورة" },
        ],
      },
      {
        name: "منطقة عسير",
        aliases: ["عسير", "أبها"],
        cities: [
          { name: "أبها", aliases: ["Abha"] },
          { name: "خميس مشيط" },
          { name: "بيشة" },
          { name: "النماص" },
          { name: "محايل عسير" },
          { name: "سراة عبيدة" },
          { name: "أحد رفيدة" },
        ],
      },
      {
        name: "منطقة تبوك",
        aliases: ["تبوك"],
        cities: [
          { name: "تبوك", aliases: ["Tabuk"] },
          { name: "ضبا" },
          { name: "الوجه" },
          { name: "تيماء" },
          { name: "حقل" },
        ],
      },
      {
        name: "منطقة حائل",
        aliases: ["حائل"],
        cities: [
          { name: "حائل", aliases: ["Hail"] },
          { name: "بقعاء" },
          { name: "الشنان" },
          { name: "الغزالة" },
        ],
      },
      {
        name: "منطقة الحدود الشمالية",
        aliases: ["الحدود الشمالية", "عرعر"],
        cities: [
          { name: "عرعر", aliases: ["Arar"] },
          { name: "رفحاء" },
          { name: "طريف" },
        ],
      },
      {
        name: "منطقة جازان",
        aliases: ["جازان", "جيزان"],
        cities: [
          { name: "جازان", aliases: ["Jizan", "Jazan"] },
          { name: "صبيا" },
          { name: "أبو عريش" },
          { name: "فيفاء" },
          { name: "بيش" },
          { name: "الحرث" },
        ],
      },
      {
        name: "منطقة نجران",
        aliases: ["نجران"],
        cities: [
          { name: "نجران", aliases: ["Najran"] },
          { name: "شرورة" },
          { name: "بدر الجنوب" },
          { name: "يدمة" },
        ],
      },
      {
        name: "منطقة الباحة",
        aliases: ["الباحة"],
        cities: [
          { name: "الباحة", aliases: ["Al-Baha"] },
          { name: "بلجرشي" },
          { name: "المخواة" },
          { name: "قلوة" },
          { name: "العقيق" },
        ],
      },
      {
        name: "منطقة الجوف",
        aliases: ["الجوف"],
        cities: [
          { name: "سكاكا", aliases: ["Sakaka"] },
          { name: "دومة الجندل" },
          { name: "القريات" },
          { name: "طبرجل" },
        ],
      },
    ],
  },
];

// ── دالة إنشاء مكان واحد ────────────────────────────────────────────────────

async function upsertPlace(
  name: string,
  type: "COUNTRY" | "REGION" | "CITY",
  parentId: string | null,
  sortOrder: number,
  aliases: string[] = [],
): Promise<string> {
  const normalizedName = normalizeName(name);
  const slug = makeSlug(name);

  const existing = await db.homelandPlace.findFirst({
    where: { parentId: parentId ?? undefined, normalizedName, type },
  });

  if (existing) {
    await db.homelandPlace.update({
      where: { id: existing.id },
      data: { name, slug, sortOrder, aliases, status: "ACTIVE" },
    });
    return existing.id;
  }

  const place = await db.homelandPlace.create({
    data: { name, normalizedName, slug, type, parentId, sortOrder, aliases, status: "ACTIVE" },
  });
  return place.id;
}

// ── الحذف الشامل ─────────────────────────────────────────────────────────────

async function clearAllData() {
  console.log("🗑️  حذف البيانات الحالية...");

  // حذف بالترتيب الصحيح (Foreign Keys)
  await db.crossFamilyMarriageRequest.deleteMany({});
  console.log("   ✓ CrossFamilyMarriageRequests");

  await db.branchUnificationRequest.deleteMany({});
  console.log("   ✓ BranchUnificationRequests");

  await db.homelandPlaceRequest.deleteMany({});
  console.log("   ✓ HomelandPlaceRequests");

  await db.personFamilyMembership.deleteMany({});
  console.log("   ✓ PersonFamilyMemberships");

  await db.personAncestry.deleteMany({});
  console.log("   ✓ PersonAncestries");

  await db.parentChildRelation.deleteMany({});
  console.log("   ✓ ParentChildRelations");

  await db.marriageRelation.deleteMany({});
  console.log("   ✓ MarriageRelations");

  await db.person.deleteMany({});
  console.log("   ✓ Persons");

  await db.editRequest.deleteMany({});
  console.log("   ✓ EditRequests");

  await db.adminRequest.deleteMany({});
  console.log("   ✓ AdminRequests");

  await db.familyAdminAssignment.deleteMany({});
  console.log("   ✓ FamilyAdminAssignments");

  await db.familyLink.deleteMany({});
  console.log("   ✓ FamilyLinks");

  await db.complaint.deleteMany({});
  console.log("   ✓ Complaints");

  await db.notification.deleteMany({});
  console.log("   ✓ Notifications");

  await db.family.deleteMany({});
  console.log("   ✓ Families");

  // حذف المستخدمين (Account + Session + ShareLink أولاً بسبب FK)
  await db.shareLink.deleteMany({});
  await db.session.deleteMany({});
  await db.account.deleteMany({});
  await db.verificationToken.deleteMany({});
  await db.user.deleteMany({});
  console.log("   ✓ Users / Sessions / Accounts");

  console.log("✅ تم حذف جميع البيانات\n");
}

// ── بذر المواطن ──────────────────────────────────────────────────────────────

async function seedHomelands() {
  console.log("🌍 إضافة بيانات المواطن...\n");

  let totalRegions = 0;
  let totalCities = 0;

  for (const country of HOMELANDS) {
    console.log(`🏳️  ${country.name} (ترتيب: ${country.sortOrder})`);
    const countryId = await upsertPlace(country.name, "COUNTRY", null, country.sortOrder, country.aliases ?? []);

    for (let ri = 0; ri < country.regions.length; ri++) {
      const region = country.regions[ri];
      const regionId = await upsertPlace(region.name, "REGION", countryId, (ri + 1) * 10, region.aliases ?? []);
      totalRegions++;

      for (let ci = 0; ci < region.cities.length; ci++) {
        const city = region.cities[ci];
        await upsertPlace(city.name, "CITY", regionId, (ci + 1) * 10, city.aliases ?? []);
        totalCities++;
      }

      console.log(`   📍 ${region.name} → ${region.cities.length} مدينة`);
    }
    console.log(`   المجموع: ${country.regions.length} منطقة\n`);
  }

  console.log(`✅ تم إضافة ${HOMELANDS.length} دول، ${totalRegions} منطقة، ${totalCities} مدينة\n`);
}

// ── التنفيذ ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  بستان الأصول — إعادة تهيئة قاعدة البيانات  ");
  console.log("═══════════════════════════════════════════════\n");

  await clearAllData();
  await seedHomelands();

  console.log("═══════════════════════════════════════════════");
  console.log("  ✅ اكتملت العملية — التطبيق جاهز للبدء من الصفر  ");
  console.log("═══════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
