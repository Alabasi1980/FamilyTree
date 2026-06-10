-- CreateEnum
CREATE TYPE "RelationConfidence" AS ENUM ('VERIFIED', 'LIKELY', 'UNVERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CrossFamilyMarriageStatus" AS ENUM ('PENDING_FAMILY_A', 'PENDING_FAMILY_B', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED');

-- AlterTable: add confidence + revocation fields + cross-family link to MarriageRelation
ALTER TABLE "MarriageRelation"
  ADD COLUMN "confidence"           "RelationConfidence" NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN "crossFamilyRequestId" TEXT,
  ADD COLUMN "revocationReason"     TEXT,
  ADD COLUMN "revokedAt"            TIMESTAMP(3),
  ADD COLUMN "revokedByUserId"      TEXT,
  ADD COLUMN "supersededById"       TEXT;

-- AlterTable: add confidence to ParentChildRelation
ALTER TABLE "ParentChildRelation"
  ADD COLUMN "confidence" "RelationConfidence" NOT NULL DEFAULT 'VERIFIED';

-- CreateTable
CREATE TABLE "CrossFamilyMarriageRequest" (
    "id"                      TEXT NOT NULL,
    "familyAId"               TEXT NOT NULL,
    "familyBId"               TEXT NOT NULL,
    "personAId"               TEXT NOT NULL,
    "personBId"               TEXT NOT NULL,
    "status"                  "CrossFamilyMarriageStatus" NOT NULL DEFAULT 'PENDING_FAMILY_B',
    "marriageDate"            TIMESTAMP(3),
    "notes"                   TEXT,
    "submittedByUserId"       TEXT NOT NULL,
    "familyAApprovedAt"       TIMESTAMP(3),
    "familyAApprovedByUserId" TEXT,
    "familyBApprovedAt"       TIMESTAMP(3),
    "familyBApprovedByUserId" TEXT,
    "rejectedAt"              TIMESTAMP(3),
    "rejectedByUserId"        TEXT,
    "rejectionReason"         TEXT,
    "appliedAt"               TIMESTAMP(3),
    "appliedMarriageId"       TEXT,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrossFamilyMarriageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrossFamilyMarriageRequest_familyAId_status_idx" ON "CrossFamilyMarriageRequest"("familyAId", "status");
CREATE INDEX "CrossFamilyMarriageRequest_familyBId_status_idx" ON "CrossFamilyMarriageRequest"("familyBId", "status");
CREATE INDEX "CrossFamilyMarriageRequest_submittedByUserId_idx"  ON "CrossFamilyMarriageRequest"("submittedByUserId");
CREATE INDEX "CrossFamilyMarriageRequest_personAId_idx"          ON "CrossFamilyMarriageRequest"("personAId");
CREATE INDEX "CrossFamilyMarriageRequest_personBId_idx"          ON "CrossFamilyMarriageRequest"("personBId");

-- CreateIndex on MarriageRelation
CREATE INDEX "MarriageRelation_confidence_idx"           ON "MarriageRelation"("confidence");
CREATE INDEX "MarriageRelation_crossFamilyRequestId_idx" ON "MarriageRelation"("crossFamilyRequestId");

-- CreateIndex on ParentChildRelation
CREATE INDEX "ParentChildRelation_confidence_idx" ON "ParentChildRelation"("confidence");

-- AddForeignKey: self-referential supersededBy on MarriageRelation
ALTER TABLE "MarriageRelation"
  ADD CONSTRAINT "MarriageRelation_supersededById_fkey"
  FOREIGN KEY ("supersededById") REFERENCES "MarriageRelation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
