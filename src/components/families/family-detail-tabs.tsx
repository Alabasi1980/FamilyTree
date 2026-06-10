"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PersonsList } from "@/components/persons/persons-list";
import { FamilySettingsForm } from "@/components/families/family-settings-form";
import ShareLinkManager from "@/components/families/share-link-manager";
import FamilyLinkManager from "@/components/families/family-link-manager";
import BranchUnificationManager from "@/components/families/branch-unification-manager";
import MarriageManager from "@/components/persons/marriage-manager";
import { CoAdminManager } from "@/components/families/co-admin-manager";
import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Gender, HomelandConfidence, PersonMembershipRole, VisibilityLevel } from "@/generated/prisma/client";

interface PersonItem {
  id: string;
  fullName: string;
  kunya?: string | null;
  gender: Gender;
  isLiving: boolean;
  birthYear?: number | null;
  birthDate: Date | null;
  deathYear?: number | null;
  deathDate: Date | null;
  profession?: string | null;
  photoUrl?: string | null;
  visibilityLevel: VisibilityLevel;
  generationIndex: number;
  generationLabel: string;
}

interface FamilySettings {
  name: string;
  originSummary: string;
  isPublic: boolean;
  hideFemaleMembersFromPublic: boolean;
  homelandCountry: string;
  homelandRegion: string;
  homelandCity: string;
  homelandNote: string;
  homelandConfidence: HomelandConfidence;
  homelandPlaceId: string | null | undefined;
}

interface ShareLinkItem {
  id: string;
  token: string;
  hasPassword: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface FamilyLinkItem {
  linkId: string;
  familyId: string;
  familyName: string;
  linkType: "KINSHIP" | "IN_LAW";
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface MarriageItem {
  id: string;
  personAId: string;
  personBId: string;
  personAName: string;
  personBName: string;
  marriageDate: Date | null;
  status: string;
  divorceDate: Date | null;
}

interface LinkedPersonItem {
  id: string;
  fullName: string;
  familyName: string;
}

interface AdminItem {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  isCurrentUser: boolean;
}

interface JoinRequestItem {
  id: string;
  submittedByUserId: string;
  submitterName: string;
  relationship: string | null;
  message: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface BranchTargetFamily {
  id: string;
  name: string;
  persons: { id: string; fullName: string }[];
}

interface CrossFamilyMemberItem {
  id: string;
  role: PersonMembershipRole;
  addedAt: Date;
  person: {
    id: string;
    fullName: string;
    gender: Gender;
    primaryFamilyName: string;
  };
}

interface Props {
  familyId: string;
  isFamilyAdmin: boolean;
  isSystemAdmin: boolean;
  totalPersonCount: number;
  orderedPersons: PersonItem[];
  familySettings: FamilySettings;
  shareLinks: ShareLinkItem[];
  familyLinks: FamilyLinkItem[];
  otherFamilies: { id: string; name: string }[];
  branchTargetFamilies: BranchTargetFamily[];
  marriages: MarriageItem[];
  linkedPersons: LinkedPersonItem[];
  admins: AdminItem[];
  pendingJoinRequests: JoinRequestItem[];
  crossFamilyMembers: CrossFamilyMemberItem[];
  userId: string;
}

const membershipRoleLabels: Record<PersonMembershipRole, { label: string; variant: "member" | "gold" | "public" | "secondary" }> = {
  MARRIED_IN:   { label: "متزوج/ة في العائلة", variant: "member" },
  BRANCH_MEMBER:{ label: "فرع موحَّد",         variant: "gold" },
  CROSS_PARENT: { label: "والد/والدة خارجي",   variant: "public" },
  DESCENDANT:   { label: "فرع منتسب",           variant: "secondary" },
};

export function FamilyDetailTabs({
  familyId,
  isFamilyAdmin,
  isSystemAdmin,
  totalPersonCount,
  orderedPersons,
  familySettings,
  shareLinks,
  familyLinks,
  otherFamilies,
  branchTargetFamilies,
  marriages,
  linkedPersons,
  admins,
  pendingJoinRequests,
  crossFamilyMembers,
  userId,
}: Props) {
  const personOptions = orderedPersons.map((p) => ({ id: p.id, fullName: p.fullName }));

  return (
    <Tabs defaultValue="members" className="space-y-4">
      <TabsList className="h-10 bg-muted/50">
        <TabsTrigger value="members" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          الأفراد
          <span className="rounded-full bg-primary/20 px-1.5 py-0 text-xs font-medium text-foreground/70">
            {totalPersonCount}
          </span>
        </TabsTrigger>
        <TabsTrigger value="settings">الإعدادات والإدارة</TabsTrigger>
      </TabsList>

      {/* ── Persons tab ──────────────────────────────────────────── */}
      <TabsContent value="members" className="mt-0">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              أفراد العائلة ({totalPersonCount})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              مرتبون حسب الأجيال المحسوبة من علاقات الأبناء، ثم حسب سنة الميلاد والاسم.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <PersonsList persons={orderedPersons} familyId={familyId} canManage={isFamilyAdmin} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Settings tab ─────────────────────────────────────────── */}
      <TabsContent value="settings" className="mt-0 space-y-4">
        {/* Family settings */}
        <Card className="overflow-hidden border-border/60 bg-card/70">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base">إعدادات العائلة</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <FamilySettingsForm familyId={familyId} initialData={familySettings} />
          </CardContent>
        </Card>

        {/* Share links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">روابط المشاركة</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareLinkManager familyId={familyId} links={shareLinks} />
          </CardContent>
        </Card>

        {/* Family links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ربط العائلات</CardTitle>
          </CardHeader>
          <CardContent>
            <FamilyLinkManager
              currentFamilyId={familyId}
              isSystemAdmin={isSystemAdmin}
              links={familyLinks}
              otherFamilies={otherFamilies}
            />
          </CardContent>
        </Card>

        {/* Branch unification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">توحيد فرعين</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchUnificationManager
              currentFamilyId={familyId}
              currentPersons={personOptions}
              targetFamilies={branchTargetFamilies}
            />
          </CardContent>
        </Card>

        {/* Cross-family members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-muted-foreground" />
              أعضاء من عائلات أخرى
              {crossFamilyMembers.length > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0 text-xs font-medium text-foreground/70">
                  {crossFamilyMembers.length}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              أشخاص من عائلات أخرى يظهرون في شجرة هذه العائلة بسبب زواج أو توحيد فرعين أو رابط أبوي.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {crossFamilyMembers.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                لا يوجد أعضاء من عائلات أخرى حتى الآن.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {crossFamilyMembers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.person.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        عائلته الأصلية: {m.person.primaryFamilyName}
                      </p>
                    </div>
                    <Badge variant={membershipRoleLabels[m.role].variant} className="shrink-0">
                      {membershipRoleLabels[m.role].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Marriages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الزيجات</CardTitle>
          </CardHeader>
          <CardContent>
            <MarriageManager
              familyId={familyId}
              persons={personOptions}
              linkedPersons={linkedPersons}
              marriages={marriages}
            />
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">المسؤولون</CardTitle>
          </CardHeader>
          <CardContent>
            <CoAdminManager
              familyId={familyId}
              admins={admins}
              pendingJoinRequests={pendingJoinRequests}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
