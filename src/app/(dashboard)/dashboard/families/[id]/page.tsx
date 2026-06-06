import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Globe, Lock, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFamilyHomeland } from "@/lib/family-homeland";
import { FamilyDetailTabs } from "@/components/families/family-detail-tabs";

interface Props {
  params: Promise<{ id: string }>;
}

type FamilyPerson = {
  id: string;
  fullName: string;
  birthYear: number | null;
  birthDate: Date | null;
};

type FamilyRelation = {
  parentPersonId: string;
  childPersonId: string;
};

function buildGenerationMap(
  persons: FamilyPerson[],
  relations: FamilyRelation[],
  marriages: { personAId: string; personBId: string }[],
) {
  const ids = new Set(persons.map((p) => p.id));
  const childrenByParent = new Map<string, string[]>();
  const parentCount = new Map<string, number>();

  for (const person of persons) parentCount.set(person.id, 0);
  for (const relation of relations) {
    if (!ids.has(relation.parentPersonId) || !ids.has(relation.childPersonId)) continue;
    childrenByParent.set(relation.parentPersonId, [
      ...(childrenByParent.get(relation.parentPersonId) ?? []),
      relation.childPersonId,
    ]);
    parentCount.set(relation.childPersonId, (parentCount.get(relation.childPersonId) ?? 0) + 1);
  }

  const roots = persons
    .filter((person) => (parentCount.get(person.id) ?? 0) === 0)
    .sort(comparePersonBasic);
  const generation = new Map<string, number>();
  const queue = roots.map((person) => ({ id: person.id, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const previous = generation.get(current.id);
    if (previous !== undefined && previous <= current.depth) continue;
    generation.set(current.id, current.depth);
    for (const childId of childrenByParent.get(current.id) ?? []) {
      queue.push({ id: childId, depth: current.depth + 1 });
    }
  }

  const fallbackDepth = Math.max(0, ...Array.from(generation.values())) + 1;
  for (const person of persons) {
    if (!generation.has(person.id)) generation.set(person.id, fallbackDepth);
  }

  // Fix: spouses with no parents in this family should appear at same level as their spouse,
  // not at generation 0 (which is reserved for the family founders).
  for (const m of marriages) {
    if (!ids.has(m.personAId) || !ids.has(m.personBId)) continue;
    const pcA = parentCount.get(m.personAId) ?? 0;
    const pcB = parentCount.get(m.personBId) ?? 0;
    const genA = generation.get(m.personAId)!;
    const genB = generation.get(m.personBId)!;
    if (pcA === 0 && pcB > 0) generation.set(m.personAId, genB);
    else if (pcB === 0 && pcA > 0) generation.set(m.personBId, genA);
  }

  return generation;
}

function comparePersonBasic(a: FamilyPerson, b: FamilyPerson) {
  const ay = a.birthYear ?? a.birthDate?.getFullYear() ?? 9999;
  const by = b.birthYear ?? b.birthDate?.getFullYear() ?? 9999;
  if (ay !== by) return ay - by;
  return a.fullName.localeCompare(b.fullName, "ar");
}

function generationLabel(index: number) {
  return index === 0 ? "الجيل الأول" : `الجيل ${index + 1}`;
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
        orderBy: [{ birthYear: "asc" }, { birthDate: "asc" }, { fullName: "asc" }],
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
          biography: true,
          notes: true,
          photoUrl: true,
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

  const [familyRelations, rawMarriages, linkedPersons] = await Promise.all([
    personIds.length
      ? db.parentChildRelation.findMany({
          where: { parentPersonId: { in: personIds }, childPersonId: { in: personIds } },
          select: { parentPersonId: true, childPersonId: true },
        })
      : Promise.resolve([]),
    db.marriageRelation.findMany({
      where: {
        deletedAt: null,
        OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }],
      },
      select: { id: true, personAId: true, personBId: true, marriageDate: true, status: true, divorceDate: true },
    }),
    inLawFamilyIds.length > 0
      ? db.person.findMany({
          where: { familyId: { in: inLawFamilyIds }, deletedAt: null },
          select: { id: true, fullName: true, familyId: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Build generation map now that marriages are available (fixes spouse generation level)
  const generationMap = buildGenerationMap(family.persons, familyRelations, rawMarriages);
  const orderedPersons = [...family.persons]
    .sort((a, b) => {
      const ag = generationMap.get(a.id) ?? 999;
      const bg = generationMap.get(b.id) ?? 999;
      if (ag !== bg) return ag - bg;
      return comparePersonBasic(a, b);
    })
    .map((person) => {
      const generationIndex = generationMap.get(person.id) ?? 0;
      return {
        ...person,
        generationIndex,
        generationLabel: generationLabel(generationIndex),
      };
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

  // Pending JOIN_FAMILY_ADMINS requests for this family
  const pendingJoinRequests = await db.adminRequest.findMany({
    where: { targetFamilyId: id, requestType: "JOIN_FAMILY_ADMINS", status: "PENDING" },
    select: {
      id: true,
      submittedByUserId: true,
      applicantRelationship: true,
      applicantMessage: true,
      applicantContactEmail: true,
      applicantContactPhone: true,
      submittedBy: { select: { fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });

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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/families/${id}/add-person`}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة فرد
            </Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link href={`/dashboard/families/${id}/build`}>
              <Sparkles className="h-4 w-4 ml-1" />
              البناء السريع
            </Link>
          </Button>
        </div>
      </div>

      <FamilyDetailTabs
        familyId={id}
        isFamilyAdmin={isFamilyAdmin}
        isSystemAdmin={isSystemAdmin}
        totalPersonCount={family._count.persons}
        orderedPersons={orderedPersons}
        familySettings={{
          name: family.name,
          originSummary: family.originSummary ?? "",
          isPublic: family.isPublic,
          hideFemaleMembersFromPublic: family.hideFemaleMembersFromPublic,
          homelandCountry: family.homelandCountry ?? "",
          homelandRegion: family.homelandRegion ?? "",
          homelandCity: family.homelandCity ?? "",
          homelandNote: family.homelandNote ?? "",
          homelandConfidence: family.homelandConfidence,
          homelandPlaceId: family.homelandPlaceId,
        }}
        shareLinks={shareLinks.map((l) => ({
          id: l.id,
          token: l.token,
          hasPassword: !!l.passwordHash,
          expiresAt: l.expiresAt,
          createdAt: l.createdAt,
        }))}
        familyLinks={familyLinks}
        otherFamilies={otherFamilies}
        branchTargetFamilies={branchTargetFamilies}
        marriages={marriages}
        linkedPersons={linkedPersonsForManager}
        admins={family.adminAssignments.map((a) => ({
          id: a.id,
          userId: a.user.id,
          displayName: a.user.fullName ?? a.user.email ?? "مستخدم",
          email: a.user.email,
          isCurrentUser: a.user.id === user.id,
        }))}
        pendingJoinRequests={pendingJoinRequests.map((r) => ({
          id: r.id,
          submittedByUserId: r.submittedByUserId,
          submitterName: r.submittedBy.fullName ?? r.submittedBy.email ?? "مستخدم",
          relationship: r.applicantRelationship,
          message: r.applicantMessage,
          contactEmail: r.applicantContactEmail ?? r.submittedBy.email,
          contactPhone: r.applicantContactPhone ?? r.submittedBy.phone,
        }))}
        userId={user.id}
      />
    </div>
  );
}
