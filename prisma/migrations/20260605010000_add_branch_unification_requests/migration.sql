CREATE TYPE "BranchUnificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BranchUnificationRelationship" AS ENUM ('FULL_SIBLINGS', 'PATERNAL_SIBLINGS', 'MATERNAL_SIBLINGS');

CREATE TABLE "BranchUnificationRequest" (
  "id" TEXT NOT NULL,
  "sourceFamilyId" TEXT NOT NULL,
  "targetFamilyId" TEXT NOT NULL,
  "sourcePersonId" TEXT NOT NULL,
  "targetPersonId" TEXT NOT NULL,
  "relationship" "BranchUnificationRelationship" NOT NULL,
  "sharedFatherName" TEXT,
  "sharedMotherName" TEXT,
  "notes" TEXT,
  "status" "BranchUnificationStatus" NOT NULL DEFAULT 'PENDING',
  "submittedByUserId" TEXT NOT NULL,
  "sourceApprovedByUserId" TEXT,
  "sourceApprovedAt" TIMESTAMP(3),
  "targetApprovedByUserId" TEXT,
  "targetApprovedAt" TIMESTAMP(3),
  "rejectedByUserId" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "appliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BranchUnificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BranchUnificationRequest_sourceFamilyId_status_idx"
  ON "BranchUnificationRequest"("sourceFamilyId", "status");

CREATE INDEX "BranchUnificationRequest_targetFamilyId_status_idx"
  ON "BranchUnificationRequest"("targetFamilyId", "status");

CREATE INDEX "BranchUnificationRequest_submittedByUserId_idx"
  ON "BranchUnificationRequest"("submittedByUserId");
