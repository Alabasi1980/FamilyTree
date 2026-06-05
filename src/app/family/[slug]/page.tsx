import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { FamilyTree } from "@/components/tree/family-tree";
import { FamilyLinksSection } from "@/components/families/family-links-section";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, Globe, Lock, Settings, MapPin } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { formatFamilyHomeland } from "@/lib/family-homeland";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FamilyPublicPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isSystemAdmin = session?.user?.accountType === "SYSTEM_ADMIN";
  const isLoggedIn = !!userId;

  // 1. Fetch family (no persons yet — need to determine viewer role first)
  const family = await db.family.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublic: true,
      originSummary: true,
      homelandCountry: true,
      homelandRegion: true,
      homelandCity: true,
      homelandConfidence: true,
      _count: { select: { persons: true } },
    },
  });

  if (!family) notFound();
  if (!family.isPublic && !isLoggedIn) {
    const familyPath = withBasePath(`/family/${encodeURIComponent(slug)}`);
    redirect(withBasePath(`/login?callbackUrl=${encodeURIComponent(familyPath)}`));
  }

  // 2. Determine viewer's access level for this specific family
  const isFamilyAdmin =
    isSystemAdmin ||
    (isLoggedIn &&
      !!(await db.familyAdminAssignment.findFirst({
        where: { familyId: family.id, userId: userId!, isActive: true },
      })));

  // 3. Build visibility filter based on access level
  //    PUBLIC      → everyone
  //    MEMBER      → logged-in users (any role)
  //    ADMIN       → family admin or system admin
  //    SHARED_LINK → only via share link; treat as ADMIN for direct URL access
  const allowedVisibilities = isFamilyAdmin
    ? ["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]
    : isLoggedIn
    ? ["PUBLIC", "MEMBER"]
    : ["PUBLIC"];


  // 4. Fetch persons with correct filter
  const persons = await db.person.findMany({
    where: {
      familyId: family.id,
      deletedAt: null,
      visibilityLevel: { in: allowedVisibilities as ("PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK")[] },
    },
    select: {
      id: true,
      fullName: true,
      gender: true,
      isLiving: true,
      birthDate: true,
      deathDate: true,
      biography: true,
      notes: true,
    },
    orderBy: { fullName: "asc" },
  });

  if (!family.isPublic && !isFamilyAdmin) notFound();
  const homeland = formatFamilyHomeland(family);

  // 5. First parallel batch: family links (needed to find linked persons)
  const personIds = persons.map((p) => p.id);

  const [rawRelations, rawFamilyLinks] = await Promise.all([
    db.parentChildRelation.findMany({
      where: {
        parentPersonId: { in: personIds },
        childPersonId: { in: personIds },
      },
      select: { parentPersonId: true, childPersonId: true },
    }),
    db.familyLink.findMany({
      where: {
        deletedAt: null,
        status: "APPROVED",
        OR: [{ familyAId: family.id }, { familyBId: family.id }],
      },
      include: {
        familyA: { select: { id: true, name: true, slug: true } },
        familyB: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  // Derive linked family info before second batch
  const familyLinks = rawFamilyLinks.map((l) => ({
    id: l.id,
    otherFamily: l.familyAId === family.id ? l.familyB : l.familyA,
    linkType: l.linkType as "KINSHIP" | "IN_LAW",
    description: l.description ?? null,
  }));

  const inLawFamilyIds = familyLinks
    .filter((l) => l.linkType === "IN_LAW")
    .map((l) => l.otherFamily.id);

  // 6. Second parallel batch: linked persons, cross-family marriages, admin families list
  const [rawLinkedPersons, rawMarriages, allFamilies] = await Promise.all([
    inLawFamilyIds.length > 0
      ? db.person.findMany({
          where: {
            familyId: { in: inLawFamilyIds },
            deletedAt: null,
            visibilityLevel: { in: ["PUBLIC", "MEMBER"] },
          },
          select: {
            id: true,
            fullName: true,
            gender: true,
            isLiving: true,
            birthDate: true,
            deathDate: true,
            familyId: true,
          },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([] as Array<{
          id: string;
          fullName: string;
          gender: "MALE" | "FEMALE";
          isLiving: boolean;
          birthDate: Date | null;
          deathDate: Date | null;
          familyId: string;
        }>),
    db.marriageRelation.findMany({
      where: {
        deletedAt: null,
        OR: [
          { personAId: { in: personIds } },
          { personBId: { in: personIds } },
        ],
      },
      select: { id: true, personAId: true, personBId: true },
    }),
    isFamilyAdmin
      ? db.family.findMany({
          where: { deletedAt: null, NOT: { id: family.id } },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([] as Array<{ id: string; name: string; slug: string }>),
  ]);

  // 7. Map data for components
  const personsForTree = persons.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    gender: p.gender,
    isLiving: p.isLiving,
    birthDate: p.birthDate?.toISOString() ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
    biography: p.biography ?? null,
    notes: p.notes ?? null,
  }));

  const relationsForTree = rawRelations.map((r) => ({
    parentId: r.parentPersonId,
    childId: r.childPersonId,
  }));

  // Keep only marriages where at least one person is known (current or linked family)
  const linkedPersonIds = new Set(rawLinkedPersons.map((p) => p.id));
  const allKnownIds = new Set([...personIds, ...linkedPersonIds]);
  const marriagesForTree = rawMarriages
    .filter((m) => allKnownIds.has(m.personAId) && allKnownIds.has(m.personBId))
    .map((m) => ({ id: m.id, personAId: m.personAId, personBId: m.personBId }));

  const linkedPersonsForTree = rawLinkedPersons.map((p) => {
    const link = familyLinks.find((l) => l.otherFamily.id === p.familyId);
    return {
      id: p.id,
      fullName: p.fullName,
      gender: p.gender,
      isLiving: p.isLiving,
      birthDate: p.birthDate?.toISOString() ?? null,
      deathDate: p.deathDate?.toISOString() ?? null,
      biography: null as string | null,
      notes: null as string | null,
      sourceFamilyId: p.familyId,
      sourceFamilyName: link?.otherFamily.name ?? "",
      sourceFamilySlug: link?.otherFamily.slug ?? "",
    };
  });

  const linkedFamiliesForPanel = familyLinks.map((l) => ({
    id: l.id,
    familyId: l.otherFamily.id,
    name: l.otherFamily.name,
    slug: l.otherFamily.slug,
    linkType: l.linkType,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Family header */}
        <div className="border-b border-border/40 bg-card/30 px-4 py-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2.5">
                <TreePine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">عائلة {family.name}</h1>
                {family.originSummary && (
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-md line-clamp-1">
                    {family.originSummary}
                  </p>
                )}
                {homeland && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-accent/70" />
                    {homeland}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {family._count.persons} فرد
              </span>
              <Badge variant={family.isPublic ? "public" : "private"}>
                {family.isPublic ? <><Globe className="h-3 w-3 ml-1" />عامة</> : <><Lock className="h-3 w-3 ml-1" />خاصة</>}
              </Badge>
              {isFamilyAdmin && (
                <Link
                  href={`/dashboard/families/${family.id}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  إدارة
                </Link>
              )}
            </div>
          </div>
          {(familyLinks.length > 0 || (isFamilyAdmin && allFamilies.length > 0)) && (
            <div className="container mx-auto max-w-6xl mt-2">
              <FamilyLinksSection
                currentFamilyId={family.id}
                familyLinks={familyLinks}
                allFamilies={allFamilies}
                canManage={isFamilyAdmin}
              />
            </div>
          )}
        </div>

        {/* Tree */}
        <div className="relative tree-viewport">
          {personsForTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground gap-3">
              <TreePine className="h-16 w-16 opacity-30" />
              <p>لا يوجد أفراد مرئيون في هذه العائلة</p>
              {isFamilyAdmin && (
                <Link
                  href={`/dashboard/families/${family.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  إدارة العائلة وإضافة أفراد
                </Link>
              )}
            </div>
          ) : (
            <FamilyTree
              persons={personsForTree}
              relations={relationsForTree}
              marriages={marriagesForTree}
              canManage={isFamilyAdmin}
              familyId={family.id}
              linkedPersons={linkedPersonsForTree}
              linkedFamilies={linkedFamiliesForPanel}
            />
          )}
        </div>
      </main>
    </div>
  );
}
