import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { FamilyTree } from "@/components/tree/family-tree";
import { FamilyLinksSection } from "@/components/families/family-links-section";
import { JoinAdminRequestButton } from "@/components/families/join-admin-request-button";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, Globe, Lock, Settings, MapPin } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { formatFamilyHomeland } from "@/lib/family-homeland";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ person?: string }>;
}

export default async function FamilyPublicPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const { person: defaultPersonId } = await searchParams;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isSystemAdmin = session?.user?.accountType === "SYSTEM_ADMIN";
  const isLoggedIn = !!userId;
  const viewer = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: { linkedPersonId: true, email: true, phone: true },
      })
    : null;
  const userLinkedPersonId = viewer?.linkedPersonId ?? null;

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
      hideFemaleMembersFromPublic: true,
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

  // Check for a pending "join admin" request from this viewer
  const hasPendingJoinRequest =
    isLoggedIn && !isFamilyAdmin
      ? !!(await db.adminRequest.findFirst({
          where: {
            submittedByUserId: userId!,
            targetFamilyId: family.id,
            requestType: "JOIN_FAMILY_ADMINS",
            status: "PENDING",
          },
        }))
      : false;

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
  // hideFemaleMembersFromPublic: hide female persons from non-admin/non-member visitors
  const hideFemale = family.hideFemaleMembersFromPublic && !isFamilyAdmin;
  const persons = await db.person.findMany({
    where: {
      familyId: family.id,
      deletedAt: null,
      visibilityLevel: { in: allowedVisibilities as ("PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK")[] },
      ...(hideFemale ? { NOT: { gender: "FEMALE" } } : {}),
    },
    select: {
      id: true,
      fullName: true,
      kunya: true,
      gender: true,
      isLiving: true,
      birthYear: true,
      birthDate: true,
      birthPlace: true,
      deathYear: true,
      deathDate: true,
      bloodType: true,
      residenceCity: true,
      address: true,
      profession: true,
      photoUrl: true,
      biography: true,
      notes: true,
    },
    orderBy: { fullName: "asc" },
  });

  if (!family.isPublic && !isFamilyAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-card/60">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              عائلة <span className="text-accent">{family.name}</span> — خاصة
            </h1>
            <p className="text-sm text-muted-foreground">
              هذه العائلة خاصة. لا تملك صلاحية الوصول إليها بصفتك الحالية.
            </p>
          </div>
          {isLoggedIn && (
            <JoinAdminRequestButton
              familyId={family.id}
              hasPendingRequest={hasPendingJoinRequest}
              initialContactEmail={viewer?.email}
              initialContactPhone={viewer?.phone}
            />
          )}
          {!isLoggedIn && (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(withBasePath(`/family/${encodeURIComponent(slug)}`))}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              تسجيل الدخول
            </Link>
          )}
        </main>
      </div>
    );
  }
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
            visibilityLevel: { in: allowedVisibilities as ("PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK")[] },
          },
          select: {
            id: true,
            fullName: true,
            kunya: true,
            gender: true,
            isLiving: true,
            birthYear: true,
            birthDate: true,
            birthPlace: true,
            deathYear: true,
            deathDate: true,
            bloodType: true,
            residenceCity: true,
            address: true,
            profession: true,
            photoUrl: true,
            familyId: true,
          },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([] as Array<{
          id: string;
          fullName: string;
          kunya: string | null;
          gender: "MALE" | "FEMALE";
          isLiving: boolean;
          birthYear: number | null;
          birthDate: Date | null;
          birthPlace: string | null;
          deathYear: number | null;
          deathDate: Date | null;
          bloodType: string | null;
          residenceCity: string | null;
          address: string | null;
          profession: string | null;
          photoUrl: string | null;
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
    kunya: p.kunya ?? null,
    gender: p.gender,
    isLiving: p.isLiving,
    birthYear: p.birthYear ?? null,
    birthDate: p.birthDate?.toISOString() ?? null,
    birthPlace: p.birthPlace ?? null,
    deathYear: p.deathYear ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
    bloodType: p.bloodType ?? null,
    residenceCity: p.residenceCity ?? null,
    address: p.address ?? null,
    profession: p.profession ?? null,
    photoUrl: p.photoUrl ?? null,
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
      kunya: p.kunya ?? null,
      gender: p.gender,
      isLiving: p.isLiving,
      birthYear: p.birthYear ?? null,
      birthDate: p.birthDate?.toISOString() ?? null,
      birthPlace: p.birthPlace ?? null,
      deathYear: p.deathYear ?? null,
      deathDate: p.deathDate?.toISOString() ?? null,
      bloodType: p.bloodType ?? null,
      residenceCity: p.residenceCity ?? null,
      address: p.address ?? null,
      profession: p.profession ?? null,
      photoUrl: p.photoUrl ?? null,
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
        {/* ── Family Header — premium bar ── */}
        <div className="relative border-b border-border/30 bg-background/95 backdrop-blur-sm">
          {/* خط مضيء علوي */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          {/* هالة خلفية خفيفة */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(145_35%_22%/0.15),transparent)]" />

          <div className="container relative mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* اسم العائلة + موطن */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-accent/10 blur-sm" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-base font-bold text-accent">
                    {family.name[0]}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-foreground">
                      عائلة <span className="text-accent">{family.name}</span>
                    </h1>
                    <Badge variant={family.isPublic ? "public" : "private"} className="text-[10px] h-4 px-1.5">
                      {family.isPublic ? <><Globe className="h-2.5 w-2.5 ml-0.5" />عامة</> : <><Lock className="h-2.5 w-2.5 ml-0.5" />خاصة</>}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    {homeland && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-accent/60" />
                        {homeland}
                      </span>
                    )}
                    {family.originSummary && (
                      <span className="hidden md:block text-xs text-muted-foreground/60 truncate max-w-xs">
                        {family.originSummary}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions + stats */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-accent/70" />
                  <span className="font-semibold text-foreground">{family._count.persons}</span> فرد
                </div>
                {isFamilyAdmin && (
                  <Link
                    href={`/dashboard/families/${family.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 transition-all"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">إدارة</span>
                  </Link>
                )}
                {/* زر طلب إدارة العائلة للمستخدمين المسجّلين غير المسؤولين */}
                {isLoggedIn && !isFamilyAdmin && (
                  <JoinAdminRequestButton
                    familyId={family.id}
                    hasPendingRequest={hasPendingJoinRequest}
                    initialContactEmail={viewer?.email}
                    initialContactPhone={viewer?.phone}
                  />
                )}
              </div>
            </div>

            {/* روابط العائلات */}
            {(familyLinks.length > 0 || (isFamilyAdmin && allFamilies.length > 0)) && (
              <div className="mt-2 pt-2 border-t border-border/20">
                <FamilyLinksSection
                  currentFamilyId={family.id}
                  familyLinks={familyLinks}
                  allFamilies={allFamilies}
                  canManage={isFamilyAdmin}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Tree Canvas ── */}
        <div className="relative tree-viewport">
          {personsForTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground gap-4">
              <div className="flex items-end gap-1 opacity-20">
                <TreePine className="h-8 w-8" />
                <TreePine className="h-14 w-14" />
                <TreePine className="h-8 w-8" />
              </div>
              <p className="text-base">لا يوجد أفراد مرئيون في هذه العائلة</p>
              {isFamilyAdmin && (
                <Link
                  href={`/dashboard/families/${family.id}/add-person`}
                  className="text-sm text-accent hover:underline"
                >
                  ابدأ بإضافة أول فرد
                </Link>
              )}
            </div>
          ) : (
            <FamilyTree
              persons={personsForTree}
              relations={relationsForTree}
              marriages={marriagesForTree}
              canManage={isFamilyAdmin}
              isSystemAdmin={isSystemAdmin}
              isLoggedIn={isLoggedIn}
              userLinkedPersonId={userLinkedPersonId}
              familyId={family.id}
              familySlug={family.slug}
              linkedPersons={linkedPersonsForTree}
              linkedFamilies={linkedFamiliesForPanel}
              hasLinkedFamilies={familyLinks.length > 0}
              defaultSelectedPersonId={defaultPersonId}
            />
          )}
        </div>
      </main>
    </div>
  );
}
