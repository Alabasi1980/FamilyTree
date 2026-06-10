-- PersonFamilyMembership: allows a person to appear in multiple family trees
-- without changing their primary familyId.
-- Populated automatically by:
--   • applyCrossMarriageRequest  → MARRIED_IN
--   • applyBranchUnification     → BRANCH_MEMBER (replaces the old updateMany familyId)
--   • addParentChildRelation (cross-family) → CROSS_PARENT + DESCENDANT

CREATE TYPE "PersonMembershipRole" AS ENUM (
  'MARRIED_IN',
  'BRANCH_MEMBER',
  'CROSS_PARENT',
  'DESCENDANT'
);

CREATE TABLE "PersonFamilyMembership" (
    "id"       TEXT                   NOT NULL,
    "personId" TEXT                   NOT NULL,
    "familyId" TEXT                   NOT NULL,
    "role"     "PersonMembershipRole" NOT NULL,
    "addedAt"  TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonFamilyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonFamilyMembership_personId_familyId_key"
    ON "PersonFamilyMembership"("personId", "familyId");

CREATE INDEX "PersonFamilyMembership_familyId_idx"
    ON "PersonFamilyMembership"("familyId");

CREATE INDEX "PersonFamilyMembership_personId_idx"
    ON "PersonFamilyMembership"("personId");

ALTER TABLE "PersonFamilyMembership"
    ADD CONSTRAINT "PersonFamilyMembership_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonFamilyMembership"
    ADD CONSTRAINT "PersonFamilyMembership_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
