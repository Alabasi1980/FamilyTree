-- CreateEnum
CREATE TYPE "MarriageEndReason" AS ENUM ('DIVORCE', 'DEATH_OF_SPOUSE', 'ANNULMENT', 'UNKNOWN');

-- DropIndex: remove the global unique constraint that blocked remarriage after divorce
DROP INDEX "MarriageRelation_personAId_personBId_key";

-- AlterTable
ALTER TABLE "MarriageRelation" ADD COLUMN "endReason" "MarriageEndReason";

-- CreateIndex
CREATE INDEX "MarriageRelation_status_idx" ON "MarriageRelation"("status");

-- CreateIndex: partial unique index on active marriages only, order-normalized via LEAST/GREATEST
-- Prevents two ACTIVE marriages between the same pair regardless of which is personA/personB
CREATE UNIQUE INDEX "MarriageRelation_active_pair_unique"
  ON "MarriageRelation" (LEAST("personAId", "personBId"), GREATEST("personAId", "personBId"))
  WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';
