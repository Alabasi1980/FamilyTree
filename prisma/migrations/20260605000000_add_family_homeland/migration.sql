CREATE TYPE "HomelandConfidence" AS ENUM ('VERIFIED', 'LIKELY', 'UNDOCUMENTED', 'UNSPECIFIED');

ALTER TABLE "Family"
  ADD COLUMN "homelandCountry" TEXT,
  ADD COLUMN "homelandRegion" TEXT,
  ADD COLUMN "homelandCity" TEXT,
  ADD COLUMN "homelandNote" TEXT,
  ADD COLUMN "homelandConfidence" "HomelandConfidence" NOT NULL DEFAULT 'UNSPECIFIED';

CREATE INDEX "Family_homelandCountry_homelandRegion_homelandCity_idx"
  ON "Family"("homelandCountry", "homelandRegion", "homelandCity");

ALTER TABLE "AdminRequest"
  ADD COLUMN "proposedHomelandCountry" TEXT,
  ADD COLUMN "proposedHomelandRegion" TEXT,
  ADD COLUMN "proposedHomelandCity" TEXT,
  ADD COLUMN "proposedHomelandNote" TEXT,
  ADD COLUMN "proposedHomelandConfidence" "HomelandConfidence";
