import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { FamilyTree } from "@/components/tree/family-tree";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, Globe, Lock, AlertTriangle } from "lucide-react";
import SharePasswordForm from "./password-form";
import { getShareAccessCookieName, verifyShareAccessToken } from "@/lib/share-access";
import SuggestionPanel from "./suggestion-panel";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ShareLinkPage({ params }: Props) {
  const { token } = await params;

  // 1. Validate the share link
  const link = await db.shareLink.findUnique({
    where: { token },
    select: {
      id: true,
      isActive: true,
      expiresAt: true,
      passwordHash: true,
      targetType: true,
      familyId: true,
    },
  });

  if (!link || !link.isActive) notFound();

  // Check expiry
  if (link.expiresAt && link.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar minimal />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <p className="text-lg font-medium">انتهت صلاحية هذا الرابط</p>
        </div>
      </div>
    );
  }

  // 2. Password check
  if (link.passwordHash) {
    const jar = await cookies();
    const accessCookie = jar.get(getShareAccessCookieName(token));
    if (!verifyShareAccessToken(token, accessCookie?.value)) {
      return <SharePasswordForm token={token} />;
    }
  }

  // 3. Only FAMILY target type is implemented for now
  if (link.targetType !== "FAMILY" || !link.familyId) notFound();

  // 4. Fetch family
  const family = await db.family.findUnique({
    where: { id: link.familyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      isPublic: true,
      originSummary: true,
      _count: { select: { persons: true } },
    },
  });

  if (!family) notFound();

  // 5. Determine viewer's session — share link grants SHARED_LINK access
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isSystemAdmin = session?.user?.accountType === "SYSTEM_ADMIN";
  const isLoggedIn = !!userId;

  const isFamilyAdmin =
    isSystemAdmin ||
    (isLoggedIn &&
      !!(await db.familyAdminAssignment.findFirst({
        where: { familyId: family.id, userId: userId!, isActive: true },
      })));

  // Share link grants access to PUBLIC + SHARED_LINK; logged-in members also get MEMBER
  const allowedVisibilities: string[] = isFamilyAdmin
    ? ["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"]
    : isLoggedIn
    ? ["PUBLIC", "MEMBER", "SHARED_LINK"]
    : ["PUBLIC", "SHARED_LINK"];

  // 6. Fetch visible persons
  const persons = await db.person.findMany({
    where: {
      familyId: family.id,
      deletedAt: null,
      visibilityLevel: {
        in: allowedVisibilities as ("PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK")[],
      },
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
    },
    orderBy: { fullName: "asc" },
  });

  const personIds = persons.map((p) => p.id);
  const [relations, rawMarriages] = await Promise.all([
    db.parentChildRelation.findMany({
      where: {
        parentPersonId: { in: personIds },
        childPersonId: { in: personIds },
      },
      select: { parentPersonId: true, childPersonId: true },
    }),
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
  ]);

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
  }));

  const relationsForTree = relations.map((r) => ({
    parentId: r.parentPersonId,
    childId: r.childPersonId,
  }));

  const marriagesForTree = rawMarriages
    .filter((m) => personIds.includes(m.personAId) && personIds.includes(m.personBId))
    .map((m) => ({ id: m.id, personAId: m.personAId, personBId: m.personBId }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar minimal />

      <main className="flex-1 flex flex-col">
        {/* Family header */}
        <div className="border-b border-border/40 bg-card/30 px-4 py-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2.5">
                <TreePine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  عائلة {family.name}
                </h1>
                {family.originSummary && (
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-md line-clamp-1">
                    {family.originSummary}
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
                {family.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 ml-1" />
                    عامة
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 ml-1" />
                    خاصة
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="h-3 w-3" />
                رابط مشاركة
              </Badge>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="relative tree-viewport">
          {personsForTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground">
              <TreePine className="h-16 w-16 opacity-30 mb-4" />
              <p>لا يوجد أفراد مرئيون في هذه العائلة</p>
            </div>
          ) : (
            <FamilyTree
              persons={personsForTree}
              relations={relationsForTree}
              marriages={marriagesForTree}
              isLoggedIn={isLoggedIn}
              canManage={false}
              familyId={family.id}
            />
          )}
        </div>

        {/* Suggestion panel — always visible for share-link viewers */}
        <SuggestionPanel
          shareToken={token}
          familyName={family.name}
          persons={persons.map((p) => ({ id: p.id, fullName: p.fullName, gender: p.gender }))}
        />
      </main>
    </div>
  );
}
