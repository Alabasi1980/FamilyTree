CREATE TYPE "HomelandPlaceType" AS ENUM ('COUNTRY', 'REGION', 'CITY');
CREATE TYPE "HomelandPlaceStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "HomelandPlaceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "HomelandPlace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "HomelandPlaceType" NOT NULL,
  "status" "HomelandPlaceStatus" NOT NULL DEFAULT 'ACTIVE',
  "parentId" TEXT,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomelandPlace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomelandPlaceRequest" (
  "id" TEXT NOT NULL,
  "countryName" TEXT NOT NULL,
  "regionName" TEXT,
  "cityName" TEXT,
  "note" TEXT,
  "status" "HomelandPlaceRequestStatus" NOT NULL DEFAULT 'PENDING',
  "submittedByUserId" TEXT NOT NULL,
  "reviewedByUserId" TEXT,
  "approvedPlaceId" TEXT,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomelandPlaceRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Family" ADD COLUMN "homelandPlaceId" TEXT;
ALTER TABLE "AdminRequest" ADD COLUMN "proposedHomelandPlaceId" TEXT;

CREATE UNIQUE INDEX "HomelandPlace_parentId_normalizedName_type_key"
  ON "HomelandPlace"("parentId", "normalizedName", "type");
CREATE INDEX "HomelandPlace_parentId_type_status_sortOrder_idx"
  ON "HomelandPlace"("parentId", "type", "status", "sortOrder");
CREATE INDEX "HomelandPlace_type_status_idx"
  ON "HomelandPlace"("type", "status");

CREATE INDEX "HomelandPlaceRequest_status_createdAt_idx"
  ON "HomelandPlaceRequest"("status", "createdAt");
CREATE INDEX "HomelandPlaceRequest_submittedByUserId_idx"
  ON "HomelandPlaceRequest"("submittedByUserId");
CREATE INDEX "HomelandPlaceRequest_approvedPlaceId_idx"
  ON "HomelandPlaceRequest"("approvedPlaceId");

CREATE INDEX "Family_homelandPlaceId_idx" ON "Family"("homelandPlaceId");
CREATE INDEX "AdminRequest_proposedHomelandPlaceId_idx" ON "AdminRequest"("proposedHomelandPlaceId");

ALTER TABLE "HomelandPlace"
  ADD CONSTRAINT "HomelandPlace_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "HomelandPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest"
  ADD CONSTRAINT "HomelandPlaceRequest_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest"
  ADD CONSTRAINT "HomelandPlaceRequest_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest"
  ADD CONSTRAINT "HomelandPlaceRequest_approvedPlaceId_fkey"
  FOREIGN KEY ("approvedPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Family"
  ADD CONSTRAINT "Family_homelandPlaceId_fkey"
  FOREIGN KEY ("homelandPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRequest"
  ADD CONSTRAINT "AdminRequest_proposedHomelandPlaceId_fkey"
  FOREIGN KEY ("proposedHomelandPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
