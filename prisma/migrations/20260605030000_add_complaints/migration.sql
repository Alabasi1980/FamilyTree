ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMPLAINT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMPLAINT_UPDATED';

CREATE TYPE "ComplaintType" AS ENUM (
  'ACCOUNT_ACCESS',
  'FAMILY_ADMINISTRATION',
  'DATA_CORRECTION',
  'PRIVACY_SAFETY',
  'FAMILY_LINKING',
  'TECHNICAL_ISSUE',
  'OTHER'
);

CREATE TYPE "ComplaintStatus" AS ENUM (
  'OPEN',
  'IN_REVIEW',
  'WAITING_USER',
  'RESOLVED',
  'CLOSED'
);

CREATE TABLE "Complaint" (
  "id" TEXT NOT NULL,
  "submittedByUserId" TEXT NOT NULL,
  "familyId" TEXT,
  "type" "ComplaintType" NOT NULL,
  "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "adminResponse" TEXT,
  "handledByUserId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Complaint"
  ADD CONSTRAINT "Complaint_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Complaint"
  ADD CONSTRAINT "Complaint_handledByUserId_fkey"
  FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
  ADD CONSTRAINT "Complaint_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");
CREATE INDEX "Complaint_submittedByUserId_createdAt_idx" ON "Complaint"("submittedByUserId", "createdAt");
CREATE INDEX "Complaint_familyId_idx" ON "Complaint"("familyId");
