-- Initial migration — full schema baseline
-- Replaces all incremental migrations; created after prisma db push on fresh database.

-- ── Enums ────────────────────────────────────────────────────────────────

CREATE TYPE "AccountType" AS ENUM ('SYSTEM_ADMIN', 'MEMBER', 'VISITOR');
CREATE TYPE "VisibilityLevel" AS ENUM ('PUBLIC', 'MEMBER', 'ADMIN', 'SHARED_LINK');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "MarriageStatus" AS ENUM ('ACTIVE', 'ENDED', 'HISTORICAL', 'UNDOCUMENTED');
CREATE TYPE "ParentChildRelationType" AS ENUM ('BIOLOGICAL', 'STEP', 'GUARDIANSHIP', 'ADOPTIVE', 'UNKNOWN');
CREATE TYPE "MarriageEndReason" AS ENUM ('DIVORCE', 'DEATH_OF_SPOUSE', 'ANNULMENT', 'UNKNOWN');
CREATE TYPE "RelationConfidence" AS ENUM ('VERIFIED', 'LIKELY', 'UNVERIFIED', 'DISPUTED');
CREATE TYPE "CrossFamilyMarriageStatus" AS ENUM ('PENDING_FAMILY_A', 'PENDING_FAMILY_B', 'APPROVED', 'REJECTED', 'CANCELLED', 'APPLIED');
CREATE TYPE "FosterRelationConfidence" AS ENUM ('DOCUMENTED', 'LIKELY', 'UNDOCUMENTED');
CREATE TYPE "FamilyLinkType" AS ENUM ('KINSHIP', 'IN_LAW');
CREATE TYPE "FamilyLinkStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EditRequestSource" AS ENUM ('MEMBER', 'SHARE_LINK_GUEST');
CREATE TYPE "EditRequestType" AS ENUM ('ADD_PERSON', 'EDIT_PERSON', 'ADD_RELATION', 'EDIT_RELATION', 'ADD_FAMILY_INFO', 'EDIT_FAMILY_INFO');
CREATE TYPE "TargetType" AS ENUM ('PERSON', 'FAMILY', 'RELATION');
CREATE TYPE "AdminRequestType" AS ENUM ('CREATE_FAMILY_AND_ADMINISTER', 'BECOME_FAMILY_ADMIN', 'JOIN_FAMILY_ADMINS', 'LINK_USER_TO_PERSON');
CREATE TYPE "AdminRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AdminDecisionType" AS ENUM ('APPROVE_NEW_FAMILY_ADMIN', 'APPROVE_JOIN_EXISTING_ADMINS', 'TRANSFER_FAMILY_OWNERSHIP', 'REJECT');
CREATE TYPE "ShareLinkTargetType" AS ENUM ('FAMILY', 'WORKSPACE');
CREATE TYPE "HomelandConfidence" AS ENUM ('VERIFIED', 'LIKELY', 'UNDOCUMENTED', 'UNSPECIFIED');
CREATE TYPE "HomelandPlaceType" AS ENUM ('COUNTRY', 'REGION', 'CITY');
CREATE TYPE "HomelandPlaceStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "HomelandPlaceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BranchUnificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BranchUnificationRelationship" AS ENUM ('FULL_SIBLINGS', 'PATERNAL_SIBLINGS', 'MATERNAL_SIBLINGS');
CREATE TYPE "PersonMembershipRole" AS ENUM ('MARRIED_IN', 'BRANCH_MEMBER', 'CROSS_PARENT', 'DESCENDANT');
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_APPLIED', 'COMPLAINT_SUBMITTED', 'COMPLAINT_UPDATED');
CREATE TYPE "ComplaintType" AS ENUM ('ACCOUNT_ACCESS', 'FAMILY_ADMINISTRATION', 'DATA_CORRECTION', 'PRIVACY_SAFETY', 'FAMILY_LINKING', 'TECHNICAL_ISSUE', 'OTHER');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- ── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE "HomelandPlace" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "type"           "HomelandPlaceType" NOT NULL,
    "status"         "HomelandPlaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "parentId"       TEXT,
    "aliases"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sortOrder"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomelandPlace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Family" (
    "id"                         TEXT NOT NULL,
    "name"                       TEXT NOT NULL,
    "slug"                       TEXT NOT NULL,
    "originSummary"              TEXT,
    "historicalNotes"            TEXT,
    "homelandCountry"            TEXT,
    "homelandRegion"             TEXT,
    "homelandCity"               TEXT,
    "homelandNote"               TEXT,
    "homelandConfidence"         "HomelandConfidence" NOT NULL DEFAULT 'UNSPECIFIED',
    "homelandPlaceId"            TEXT,
    "isPublic"                   BOOLEAN NOT NULL DEFAULT false,
    "hideFemaleMembersFromPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                  TIMESTAMP(3) NOT NULL,
    "deletedAt"                  TIMESTAMP(3),
    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Person" (
    "id"              TEXT NOT NULL,
    "familyId"        TEXT NOT NULL,
    "fullName"        TEXT NOT NULL,
    "kunya"           TEXT,
    "gender"          "Gender" NOT NULL,
    "birthYear"       INTEGER,
    "birthDate"       TIMESTAMP(3),
    "birthPlace"      TEXT,
    "deathYear"       INTEGER,
    "deathDate"       TIMESTAMP(3),
    "isLiving"        BOOLEAN NOT NULL DEFAULT true,
    "bloodType"       TEXT,
    "residenceCity"   TEXT,
    "address"         TEXT,
    "profession"      TEXT,
    "biography"       TEXT,
    "photoUrl"        TEXT,
    "visibilityLevel" "VisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id"             TEXT NOT NULL,
    "name"           TEXT,
    "fullName"       TEXT,
    "email"          TEXT,
    "emailVerified"  TIMESTAMP(3),
    "phone"          TEXT,
    "image"          TEXT,
    "accountType"    "AccountType" NOT NULL DEFAULT 'VISITOR',
    "passwordHash"   TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "deletedAt"      TIMESTAMP(3),
    "linkedPersonId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "type"              TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id"           TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL
);

CREATE TABLE "WorkspaceFamily" (
    "id"          TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "familyId"    TEXT NOT NULL,
    "addedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceFamily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyAdminAssignment" (
    "id"               TEXT NOT NULL,
    "familyId"         TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "assignedByUserId" TEXT,
    "assignedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt"          TIMESTAMP(3),
    "notes"            TEXT,
    CONSTRAINT "FamilyAdminAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyLink" (
    "id"          TEXT NOT NULL,
    "familyAId"   TEXT NOT NULL,
    "familyBId"   TEXT NOT NULL,
    "linkType"    "FamilyLinkType" NOT NULL,
    "description" TEXT,
    "status"      "FamilyLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "FamilyLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParentChildRelation" (
    "id"             TEXT NOT NULL,
    "parentPersonId" TEXT NOT NULL,
    "childPersonId"  TEXT NOT NULL,
    "relationType"   "ParentChildRelationType" NOT NULL DEFAULT 'BIOLOGICAL',
    "confidence"     "RelationConfidence" NOT NULL DEFAULT 'VERIFIED',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParentChildRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarriageRelation" (
    "id"                   TEXT NOT NULL,
    "personAId"            TEXT NOT NULL,
    "personBId"            TEXT NOT NULL,
    "marriageDate"         TIMESTAMP(3),
    "divorceDate"          TIMESTAMP(3),
    "status"               "MarriageStatus" NOT NULL DEFAULT 'ACTIVE',
    "endReason"            "MarriageEndReason",
    "confidence"           "RelationConfidence" NOT NULL DEFAULT 'VERIFIED',
    "notes"                TEXT,
    "crossFamilyRequestId" TEXT,
    "revokedAt"            TIMESTAMP(3),
    "revokedByUserId"      TEXT,
    "revocationReason"     TEXT,
    "supersededById"       TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,
    "deletedAt"            TIMESTAMP(3),
    CONSTRAINT "MarriageRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonAncestry" (
    "id"           TEXT NOT NULL,
    "ancestorId"   TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth"        INTEGER NOT NULL,
    CONSTRAINT "PersonAncestry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonFamilyMembership" (
    "id"       TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role"     "PersonMembershipRole" NOT NULL,
    "addedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonFamilyMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EditRequest" (
    "id"                TEXT NOT NULL,
    "requestType"       "EditRequestType" NOT NULL,
    "targetType"        "TargetType" NOT NULL,
    "targetId"          TEXT,
    "familyId"          TEXT NOT NULL,
    "submittedByUserId" TEXT,
    "source"            "EditRequestSource" NOT NULL DEFAULT 'MEMBER',
    "guestName"         TEXT,
    "guestContact"      TEXT,
    "payloadJson"       JSONB NOT NULL,
    "status"            "EditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes"       TEXT,
    "reviewedByUserId"  TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EditRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequest" (
    "id"                         TEXT NOT NULL,
    "requestType"                "AdminRequestType" NOT NULL,
    "targetFamilyId"             TEXT,
    "targetPersonId"             TEXT,
    "proposedFamilyName"         TEXT,
    "proposedHomelandCountry"    TEXT,
    "proposedHomelandRegion"     TEXT,
    "proposedHomelandCity"       TEXT,
    "proposedHomelandNote"       TEXT,
    "proposedHomelandConfidence" "HomelandConfidence",
    "proposedHomelandPlaceId"    TEXT,
    "applicantRelationship"      TEXT,
    "applicantMessage"           TEXT,
    "applicantContactEmail"      TEXT,
    "applicantContactPhone"      TEXT,
    "submittedByUserId"          TEXT NOT NULL,
    "currentReviewerUserId"      TEXT,
    "status"                     "AdminRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decisionType"               "AdminDecisionType",
    "notes"                      TEXT,
    "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomelandPlaceRequest" (
    "id"                TEXT NOT NULL,
    "countryName"       TEXT NOT NULL,
    "regionName"        TEXT,
    "cityName"          TEXT,
    "note"              TEXT,
    "status"            "HomelandPlaceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByUserId" TEXT NOT NULL,
    "reviewedByUserId"  TEXT,
    "approvedPlaceId"   TEXT,
    "reviewNotes"       TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomelandPlaceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BranchUnificationRequest" (
    "id"                     TEXT NOT NULL,
    "sourceFamilyId"         TEXT NOT NULL,
    "targetFamilyId"         TEXT NOT NULL,
    "sourcePersonId"         TEXT NOT NULL,
    "targetPersonId"         TEXT NOT NULL,
    "relationship"           "BranchUnificationRelationship" NOT NULL,
    "sharedFatherName"       TEXT,
    "sharedMotherName"       TEXT,
    "notes"                  TEXT,
    "status"                 "BranchUnificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByUserId"      TEXT NOT NULL,
    "sourceApprovedByUserId" TEXT,
    "sourceApprovedAt"       TIMESTAMP(3),
    "targetApprovedByUserId" TEXT,
    "targetApprovedAt"       TIMESTAMP(3),
    "rejectedByUserId"       TEXT,
    "rejectedAt"             TIMESTAMP(3),
    "reviewNotes"            TEXT,
    "appliedAt"              TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BranchUnificationRequest_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      "NotificationType" NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT,
    "href"      TEXT,
    "metadata"  JSONB,
    "readAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Complaint" (
    "id"                TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "familyId"          TEXT,
    "type"              "ComplaintType" NOT NULL,
    "status"            "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "title"             TEXT NOT NULL,
    "body"              TEXT NOT NULL,
    "adminResponse"     TEXT,
    "handledByUserId"   TEXT,
    "resolvedAt"        TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShareLink" (
    "id"              TEXT NOT NULL,
    "targetType"      "ShareLinkTargetType" NOT NULL,
    "familyId"        TEXT,
    "workspaceId"     TEXT,
    "token"           TEXT NOT NULL,
    "passwordHash"    TEXT,
    "expiresAt"       TIMESTAMP(3),
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ───────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE UNIQUE INDEX "Family_slug_key" ON "Family"("slug");
CREATE INDEX "Family_slug_idx" ON "Family"("slug");
CREATE INDEX "Family_homelandCountry_homelandRegion_homelandCity_idx" ON "Family"("homelandCountry", "homelandRegion", "homelandCity");
CREATE INDEX "Family_homelandPlaceId_idx" ON "Family"("homelandPlaceId");

CREATE UNIQUE INDEX "HomelandPlace_parentId_normalizedName_type_key" ON "HomelandPlace"("parentId", "normalizedName", "type");
CREATE INDEX "HomelandPlace_parentId_type_status_sortOrder_idx" ON "HomelandPlace"("parentId", "type", "status", "sortOrder");
CREATE INDEX "HomelandPlace_type_status_idx" ON "HomelandPlace"("type", "status");

CREATE UNIQUE INDEX "WorkspaceFamily_workspaceId_familyId_key" ON "WorkspaceFamily"("workspaceId", "familyId");

CREATE INDEX "FamilyAdminAssignment_familyId_isActive_idx" ON "FamilyAdminAssignment"("familyId", "isActive");
CREATE INDEX "FamilyAdminAssignment_userId_idx" ON "FamilyAdminAssignment"("userId");

CREATE UNIQUE INDEX "FamilyLink_familyAId_familyBId_key" ON "FamilyLink"("familyAId", "familyBId");
CREATE INDEX "FamilyLink_familyAId_idx" ON "FamilyLink"("familyAId");
CREATE INDEX "FamilyLink_familyBId_idx" ON "FamilyLink"("familyBId");

CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");
CREATE INDEX "Person_fullName_idx" ON "Person"("fullName");

CREATE UNIQUE INDEX "ParentChildRelation_parentPersonId_childPersonId_key" ON "ParentChildRelation"("parentPersonId", "childPersonId");
CREATE INDEX "ParentChildRelation_parentPersonId_idx" ON "ParentChildRelation"("parentPersonId");
CREATE INDEX "ParentChildRelation_childPersonId_idx" ON "ParentChildRelation"("childPersonId");
CREATE INDEX "ParentChildRelation_relationType_idx" ON "ParentChildRelation"("relationType");
CREATE INDEX "ParentChildRelation_confidence_idx" ON "ParentChildRelation"("confidence");

CREATE INDEX "MarriageRelation_personAId_idx" ON "MarriageRelation"("personAId");
CREATE INDEX "MarriageRelation_personBId_idx" ON "MarriageRelation"("personBId");
CREATE INDEX "MarriageRelation_status_idx" ON "MarriageRelation"("status");
CREATE INDEX "MarriageRelation_confidence_idx" ON "MarriageRelation"("confidence");
CREATE INDEX "MarriageRelation_crossFamilyRequestId_idx" ON "MarriageRelation"("crossFamilyRequestId");
CREATE UNIQUE INDEX "MarriageRelation_active_pair_unique"
    ON "MarriageRelation" (LEAST("personAId", "personBId"), GREATEST("personAId", "personBId"))
    WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "PersonAncestry_ancestorId_descendantId_key" ON "PersonAncestry"("ancestorId", "descendantId");
CREATE INDEX "PersonAncestry_ancestorId_idx" ON "PersonAncestry"("ancestorId");
CREATE INDEX "PersonAncestry_descendantId_idx" ON "PersonAncestry"("descendantId");

CREATE UNIQUE INDEX "PersonFamilyMembership_personId_familyId_key" ON "PersonFamilyMembership"("personId", "familyId");
CREATE INDEX "PersonFamilyMembership_familyId_idx" ON "PersonFamilyMembership"("familyId");
CREATE INDEX "PersonFamilyMembership_personId_idx" ON "PersonFamilyMembership"("personId");

CREATE INDEX "EditRequest_familyId_status_idx" ON "EditRequest"("familyId", "status");
CREATE INDEX "EditRequest_submittedByUserId_idx" ON "EditRequest"("submittedByUserId");
CREATE INDEX "EditRequest_familyId_source_status_idx" ON "EditRequest"("familyId", "source", "status");

CREATE INDEX "AdminRequest_status_idx" ON "AdminRequest"("status");
CREATE INDEX "AdminRequest_submittedByUserId_idx" ON "AdminRequest"("submittedByUserId");
CREATE INDEX "AdminRequest_targetFamilyId_idx" ON "AdminRequest"("targetFamilyId");
CREATE INDEX "AdminRequest_proposedHomelandPlaceId_idx" ON "AdminRequest"("proposedHomelandPlaceId");

CREATE INDEX "HomelandPlaceRequest_status_createdAt_idx" ON "HomelandPlaceRequest"("status", "createdAt");
CREATE INDEX "HomelandPlaceRequest_submittedByUserId_idx" ON "HomelandPlaceRequest"("submittedByUserId");
CREATE INDEX "HomelandPlaceRequest_approvedPlaceId_idx" ON "HomelandPlaceRequest"("approvedPlaceId");

CREATE INDEX "BranchUnificationRequest_sourceFamilyId_status_idx" ON "BranchUnificationRequest"("sourceFamilyId", "status");
CREATE INDEX "BranchUnificationRequest_targetFamilyId_status_idx" ON "BranchUnificationRequest"("targetFamilyId", "status");
CREATE INDEX "BranchUnificationRequest_submittedByUserId_idx" ON "BranchUnificationRequest"("submittedByUserId");

CREATE UNIQUE INDEX "FosterRelation_childPersonId_nursingMotherPersonId_key" ON "FosterRelation"("childPersonId", "nursingMotherPersonId");
CREATE INDEX "FosterRelation_childPersonId_idx" ON "FosterRelation"("childPersonId");
CREATE INDEX "FosterRelation_nursingMotherPersonId_idx" ON "FosterRelation"("nursingMotherPersonId");
CREATE INDEX "FosterRelation_nursingFatherId_idx" ON "FosterRelation"("nursingFatherId");

CREATE INDEX "CrossFamilyMarriageRequest_familyAId_status_idx" ON "CrossFamilyMarriageRequest"("familyAId", "status");
CREATE INDEX "CrossFamilyMarriageRequest_familyBId_status_idx" ON "CrossFamilyMarriageRequest"("familyBId", "status");
CREATE INDEX "CrossFamilyMarriageRequest_submittedByUserId_idx" ON "CrossFamilyMarriageRequest"("submittedByUserId");
CREATE INDEX "CrossFamilyMarriageRequest_personAId_idx" ON "CrossFamilyMarriageRequest"("personAId");
CREATE INDEX "CrossFamilyMarriageRequest_personBId_idx" ON "CrossFamilyMarriageRequest"("personBId");

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");
CREATE INDEX "Complaint_submittedByUserId_createdAt_idx" ON "Complaint"("submittedByUserId", "createdAt");
CREATE INDEX "Complaint_familyId_idx" ON "Complaint"("familyId");

CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");
CREATE INDEX "ShareLink_token_idx" ON "ShareLink"("token");
CREATE INDEX "ShareLink_familyId_idx" ON "ShareLink"("familyId");
CREATE INDEX "ShareLink_workspaceId_idx" ON "ShareLink"("workspaceId");

-- ── Foreign Keys ─────────────────────────────────────────────────────────

ALTER TABLE "HomelandPlace" ADD CONSTRAINT "HomelandPlace_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "HomelandPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Family" ADD CONSTRAINT "Family_homelandPlaceId_fkey"
    FOREIGN KEY ("homelandPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Person" ADD CONSTRAINT "Person_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_linkedPersonId_fkey"
    FOREIGN KEY ("linkedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceFamily" ADD CONSTRAINT "WorkspaceFamily_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceFamily" ADD CONSTRAINT "WorkspaceFamily_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAdminAssignment" ADD CONSTRAINT "FamilyAdminAssignment_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAdminAssignment" ADD CONSTRAINT "FamilyAdminAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_familyAId_fkey"
    FOREIGN KEY ("familyAId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_familyBId_fkey"
    FOREIGN KEY ("familyBId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ParentChildRelation" ADD CONSTRAINT "ParentChildRelation_parentPersonId_fkey"
    FOREIGN KEY ("parentPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentChildRelation" ADD CONSTRAINT "ParentChildRelation_childPersonId_fkey"
    FOREIGN KEY ("childPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarriageRelation" ADD CONSTRAINT "MarriageRelation_personAId_fkey"
    FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarriageRelation" ADD CONSTRAINT "MarriageRelation_personBId_fkey"
    FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarriageRelation" ADD CONSTRAINT "MarriageRelation_supersededById_fkey"
    FOREIGN KEY ("supersededById") REFERENCES "MarriageRelation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonAncestry" ADD CONSTRAINT "PersonAncestry_ancestorId_fkey"
    FOREIGN KEY ("ancestorId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonAncestry" ADD CONSTRAINT "PersonAncestry_descendantId_fkey"
    FOREIGN KEY ("descendantId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonFamilyMembership" ADD CONSTRAINT "PersonFamilyMembership_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonFamilyMembership" ADD CONSTRAINT "PersonFamilyMembership_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EditRequest" ADD CONSTRAINT "EditRequest_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EditRequest" ADD CONSTRAINT "EditRequest_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EditRequest" ADD CONSTRAINT "EditRequest_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_targetFamilyId_fkey"
    FOREIGN KEY ("targetFamilyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_targetPersonId_fkey"
    FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_proposedHomelandPlaceId_fkey"
    FOREIGN KEY ("proposedHomelandPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_currentReviewerUserId_fkey"
    FOREIGN KEY ("currentReviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest" ADD CONSTRAINT "HomelandPlaceRequest_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest" ADD CONSTRAINT "HomelandPlaceRequest_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HomelandPlaceRequest" ADD CONSTRAINT "HomelandPlaceRequest_approvedPlaceId_fkey"
    FOREIGN KEY ("approvedPlaceId") REFERENCES "HomelandPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_handledByUserId_fkey"
    FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
