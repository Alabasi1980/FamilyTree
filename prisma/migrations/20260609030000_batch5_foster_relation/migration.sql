-- CreateEnum
CREATE TYPE "FosterRelationConfidence" AS ENUM ('DOCUMENTED', 'LIKELY', 'UNDOCUMENTED');

-- CreateTable: nursing (رضاعة) relationships for mahram calculations
CREATE TABLE "FosterRelation" (
    "id"                    TEXT NOT NULL,
    "childPersonId"         TEXT NOT NULL,
    "nursingMotherPersonId" TEXT NOT NULL,
    "nursingFatherId"       TEXT,
    "confidence"            "FosterRelationConfidence" NOT NULL DEFAULT 'DOCUMENTED',
    "notes"                 TEXT,
    "createdByUserId"       TEXT NOT NULL,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,
    "deletedAt"             TIMESTAMP(3),

    CONSTRAINT "FosterRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FosterRelation_childPersonId_idx"           ON "FosterRelation"("childPersonId");
CREATE INDEX "FosterRelation_nursingMotherPersonId_idx"   ON "FosterRelation"("nursingMotherPersonId");
CREATE INDEX "FosterRelation_nursingFatherId_idx"         ON "FosterRelation"("nursingFatherId");
CREATE UNIQUE INDEX "FosterRelation_childPersonId_nursingMotherPersonId_key"
  ON "FosterRelation"("childPersonId", "nursingMotherPersonId");
