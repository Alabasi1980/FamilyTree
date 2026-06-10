-- CreateEnum
CREATE TYPE "ParentChildRelationType" AS ENUM ('BIOLOGICAL', 'STEP', 'GUARDIANSHIP', 'ADOPTIVE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "ParentChildRelation" ADD COLUMN     "relationType" "ParentChildRelationType" NOT NULL DEFAULT 'BIOLOGICAL';

-- CreateIndex
CREATE INDEX "ParentChildRelation_relationType_idx" ON "ParentChildRelation"("relationType");
