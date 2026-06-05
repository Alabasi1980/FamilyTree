import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Users, Globe, Lock, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FamilySettingsForm } from "@/components/families/family-settings-form";
import { PersonsList } from "@/components/persons/persons-list";
import ShareLinkManager from "@/components/families/share-link-manager";
import FamilyLinkManager from "@/components/families/family-link-manager";
import BranchUnificationManager from "@/components/families/branch-unification-manager";
import MarriageManager from "@/components/persons/marriage-manager";
import { formatFamilyHomeland } from "@/lib/family-homeland";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FamilyDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const family = await db.family.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { persons: true } },
      adminAssignments: {
        where: { isActive: true },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
      persons: {
        where: { deletedAt: null },
        orderBy: [{ isLiving: "desc" }, { fullName: "asc" }],
        take: 50,
        select: {
          id: true,
          fullName: true,
          gender: true,
          isLiving: true,
          birthDate: true,
          deathDate: true,
          visibilityLevel: true,
        },
      },
    },
  });

  if (!family) notFound();

  const isFamilyAdmin = isSystemAdmin || family.adminAssignments.some((a) => a.user.id === user.id);
  if (!isFamilyAdmin) notFound();
  const homeland = formatFamilyHomeland(family);

  const shareLinks = await db.shareLink.findMany({
    where: { familyId: id, isActive: true },
    select: { id: true, token: true, passwordHash: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // FamilyLinks — both directions (A or B)
  const rawLinks = await db.familyLink.findMany({
    where: {
      deletedAt: null,
      status: { in: ["APPROVED", "PENDING"] },
      OR: [{ familyAId: id }, { familyBId: id }],
    },
    include: {
      familyA: { select: { id: true, name: true } },
      familyB: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const familyLinks = rawLinks.map((l) => ({
    linkId: l.id,
    familyId: l.familyAId === id ? l.familyBId : l.familyAId,
    familyName: l.familyAId === id ? l.familyB.name : l.familyA.name,
    linkType: l.linkType as "KINSHIP" | "IN_LAW",
    description: l.description,
    status: l.status as "PENDING" | "APPROVED" | "REJECTED",
  }));

  // All other families for the proposal dropdown
  const otherFamilies = await db.family.findMany({
    where: { deletedAt: null, id: { not: id } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const branchTargetFamilies = await db.family.findMany({
    where: { deletedAt: null, id: { not: id } },
    select: {
      id: true,
      name: true,
      persons: {
        where: { deletedAt: null },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
        take: 100,
      },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  const personIds = family.persons.map((p) => p.id);

  // IN_LAW linked families → fetch their persons so they can be added as spouses
  const inLawLinks = familyLinks.filter((l) => l.linkType === "IN_LAW" && l.status === "APPROVED");
  const inLawFamilyIds = inLawLinks.map((l) => l.familyId);

  const linkedPersons = inLawFamilyIds.length > 0
    ? await db.person.findMany({
        where: { familyId: { in: inLawFamilyIds }, deletedAt: null },
        select: { id: true, fullName: true, familyId: true },
        orderBy: { fullName: "asc" },
      })
    : [];

  // Marriages: any marriage where at least one person is from this family
  const rawMarriages = await db.marriageRelation.findMany({
    where: {
      deletedAt: null,
      OR: [
        { personAId: { in: personIds } },
        { personBId: { in: personIds } },
      ],
    },
    select: {
      id: true,
      personAId: true,
      personBId: true,
      marriageDate: true,
      status: true,
      divorceDate: true,
    },
  });

  // Combined name map: current family + linked persons
  const personMap = new Map<string, string>([
    ...family.persons.map((p) => [p.id, p.fullName] as [string, string]),
    ...linkedPersons.map((p) => [p.id, p.fullName] as [string, string]),
  ]);
  const marriages = rawMarriages.map((m) => ({
    id: m.id,
    personAId: m.personAId,
    personBId: m.personBId,
    personAName: personMap.get(m.personAId) ?? "؟",
    personBName: personMap.get(m.personBId) ?? "؟",
    marriageDate: m.marriageDate,
    status: m.status,
    divorceDate: m.divorceDate,
  }));

  // Build linkedPersonsForMarriage with family name for the dropdown
  const linkedPersonsForManager = linkedPersons.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    familyName: inLawLinks.find((l) => l.familyId === p.familyId)?.familyName ?? "",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/families" className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">عائلة {family.name}</h1>
              <Badge variant={family.isPublic ? "public" : "private"}>
                {family.isPublic ? <><Globe className="h-3 w-3 ml-1" />عامة</> : <><Lock className="h-3 w-3 ml-1" />خاصة</>}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {family._count.persons} فرد مسجّل
            </p>
            {homeland && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-accent/70" />
                {homeland}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/family/${family.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
              العرض العام
            </Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link href={`/dashboard/families/${id}/add-person`}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة فرد
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Persons list */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                أفراد العائلة ({family._count.persons})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PersonsList persons={family.persons} familyId={id} canManage={isFamilyAdmin} />
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إعدادات العائلة</CardTitle>
            </CardHeader>
            <CardContent>
              <FamilySettingsForm
                familyId={id}
                initialData={{
                  name: family.name,
                  originSummary: family.originSummary ?? "",
                  isPublic: family.isPublic,
                  homelandCountry: family.homelandCountry ?? "",
                  homelandRegion: family.homelandRegion ?? "",
                  homelandCity: family.homelandCity ?? "",
                  homelandNote: family.homelandNote ?? "",
                  homelandConfidence: family.homelandConfidence,
                }}
              />
            </CardContent>
          </Card>

          {/* Share Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">روابط المشاركة</CardTitle>
            </CardHeader>
            <CardContent>
              <ShareLinkManager
                familyId={id}
                links={shareLinks.map((l) => ({
                  id: l.id,
                  token: l.token,
                  hasPassword: !!l.passwordHash,
                  expiresAt: l.expiresAt,
                  createdAt: l.createdAt,
                }))}
              />
            </CardContent>
          </Card>

          {/* Family Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ربط العائلات</CardTitle>
            </CardHeader>
            <CardContent>
              <FamilyLinkManager
                currentFamilyId={id}
                isSystemAdmin={isSystemAdmin}
                links={familyLinks}
                otherFamilies={otherFamilies}
              />
            </CardContent>
          </Card>

          {/* Branch Unification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">توحيد فرعين</CardTitle>
            </CardHeader>
            <CardContent>
              <BranchUnificationManager
                currentFamilyId={id}
                currentPersons={family.persons.map((p) => ({ id: p.id, fullName: p.fullName }))}
                targetFamilies={branchTargetFamilies}
              />
            </CardContent>
          </Card>

          {/* Marriages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">الزيجات</CardTitle>
            </CardHeader>
            <CardContent>
              <MarriageManager
                familyId={id}
                persons={family.persons.map((p) => ({ id: p.id, fullName: p.fullName }))}
                linkedPersons={linkedPersonsForManager}
                marriages={marriages}
              />
            </CardContent>
          </Card>

          {/* Admins */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المسؤولون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {family.adminAssignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-accent">
                    {(a.user.fullName ?? a.user.email ?? "?")[0]}
                  </div>
                  <span className="text-foreground">{a.user.fullName ?? a.user.email ?? "مستخدم"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
