import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

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

    // Add some test persons
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

    // Parent-child relations
    await db.parentChildRelation.createMany({
      data: [
        { parentPersonId: grandfather.id, childPersonId: father.id },
        { parentPersonId: father.id, childPersonId: son1.id },
        { parentPersonId: father.id, childPersonId: son2.id },
      ],
    });

    // PersonAncestry (Closure Table)
    await db.personAncestry.createMany({
      data: [
        // Self references
        { ancestorId: grandfather.id, descendantId: grandfather.id, depth: 0 },
        { ancestorId: father.id, descendantId: father.id, depth: 0 },
        { ancestorId: son1.id, descendantId: son1.id, depth: 0 },
        { ancestorId: son2.id, descendantId: son2.id, depth: 0 },
        // grandfather -> father
        { ancestorId: grandfather.id, descendantId: father.id, depth: 1 },
        // grandfather -> son1, son2
        { ancestorId: grandfather.id, descendantId: son1.id, depth: 2 },
        { ancestorId: grandfather.id, descendantId: son2.id, depth: 2 },
        // father -> son1, son2
        { ancestorId: father.id, descendantId: son1.id, depth: 1 },
        { ancestorId: father.id, descendantId: son2.id, depth: 1 },
      ],
    });

    console.log("✅ Created test family: عائلة الراشدي (4 persons)");
  } else {
    console.log("ℹ️  Test family already exists");
  }

  console.log("🌳 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
