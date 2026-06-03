import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { FamilyTree } from "@/components/tree/family-tree";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, Globe, Lock } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FamilyPublicPage({ params }: Props) {
  const { slug } = await params;
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
      _count: { select: { persons: true } },
    },
  });

  if (!family || (!family.isPublic && !isLoggedIn)) notFound();

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
    },
    orderBy: { fullName: "asc" },
  });

  if (!family.isPublic && !isFamilyAdmin) notFound();

  // Get parent-child relations for visible persons
  const personIds = persons.map((p) => p.id);
  const relations = await db.parentChildRelation.findMany({
    where: {
      parentPersonId: { in: personIds },
      childPersonId: { in: personIds },
    },
    select: { parentPersonId: true, childPersonId: true },
  });

  const personsForTree = persons.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    gender: p.gender,
    isLiving: p.isLiving,
    birthDate: p.birthDate?.toISOString() ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
  }));

  const relationsForTree = relations.map((r) => ({
    parentId: r.parentPersonId,
    childId: r.childPersonId,
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
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 relative min-h-[calc(100vh-200px)]">
          {personsForTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground">
              <TreePine className="h-16 w-16 opacity-30 mb-4" />
              <p>لا يوجد أفراد مرئيون في هذه العائلة</p>
            </div>
          ) : (
            <FamilyTree persons={personsForTree} relations={relationsForTree} />
          )}
        </div>
      </main>
    </div>
  );
}
