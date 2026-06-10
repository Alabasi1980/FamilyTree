import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function hasCurrentPrismaDelegates(client: PrismaClient | undefined) {
  if (!client) return false;
  const maybeClient = client as PrismaClient & {
    homelandPlace?: { findMany?: unknown };
    homelandPlaceRequest?: { findMany?: unknown };
    personFamilyMembership?: { findMany?: unknown };
    crossFamilyMarriageRequest?: { findMany?: unknown };
    branchUnificationRequest?: { findMany?: unknown };
    _runtimeDataModel?: {
      models?: {
        AdminRequest?: {
          fields?: { name: string }[];
        };
        Person?: {
          fields?: { name: string }[];
        };
      };
    };
  };
  const adminRequestFields = maybeClient._runtimeDataModel?.models?.AdminRequest?.fields ?? [];
  const personFields = maybeClient._runtimeDataModel?.models?.Person?.fields ?? [];
  return (
    typeof maybeClient.homelandPlace?.findMany === "function" &&
    typeof maybeClient.homelandPlaceRequest?.findMany === "function" &&
    typeof maybeClient.personFamilyMembership?.findMany === "function" &&
    typeof maybeClient.crossFamilyMarriageRequest?.findMany === "function" &&
    typeof maybeClient.branchUnificationRequest?.findMany === "function" &&
    adminRequestFields.some((field) => field.name === "applicantRelationship") &&
    adminRequestFields.some((field) => field.name === "applicantMessage") &&
    adminRequestFields.some((field) => field.name === "applicantContactEmail") &&
    adminRequestFields.some((field) => field.name === "applicantContactPhone") &&
    personFields.some((field) => field.name === "kunya") &&
    personFields.some((field) => field.name === "birthYear") &&
    personFields.some((field) => field.name === "birthPlace") &&
    personFields.some((field) => field.name === "deathYear") &&
    personFields.some((field) => field.name === "bloodType") &&
    personFields.some((field) => field.name === "residenceCity") &&
    personFields.some((field) => field.name === "address") &&
    personFields.some((field) => field.name === "profession")
  );
}

export const db = hasCurrentPrismaDelegates(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
