import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewerContext {
  userId: string | null;
  isSystemAdmin: boolean;
  adminFamilyIds: Set<string>;
}

export interface NetworkFamily {
  id: string;
  name: string;
  slug: string;
  personCount: number;
  isRoot: boolean;
}

export interface NetworkPerson {
  id: string;
  familyId: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  notes: string | null;
}

export interface NetworkRelation {
  parentId: string;
  childId: string;
  familyId: string;
}

export interface NetworkMarriage {
  id: string;
  personAId: string;
  personBId: string;
  familyAId: string;
  familyBId: string;
  kind: "INTRA" | "CROSS";
}

export interface NetworkFamilyLink {
  id: string;
  familyAId: string;
  familyBId: string;
  linkType: "KINSHIP" | "IN_LAW";
}

export interface FamilyNetworkResult {
  rootFamilyId: string;
  truncated: boolean;
  families: NetworkFamily[];
  persons: NetworkPerson[];
  parentChildRelations: NetworkRelation[];
  marriages: NetworkMarriage[];
  familyLinks: NetworkFamilyLink[];
}

// ─── Limits ───────────────────────────────────────────────────────────────────

const MAX_FAMILIES = 12;
const MAX_PERSONS  = 800;

// ─── Visibility ───────────────────────────────────────────────────────────────

function allowedVisibilitiesFor(
  famId: string,
  ctx: ViewerContext
): ("PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK")[] {
  if (ctx.isSystemAdmin || ctx.adminFamilyIds.has(famId))
    return ["PUBLIC", "MEMBER", "ADMIN", "SHARED_LINK"];
  if (ctx.userId) return ["PUBLIC", "MEMBER"];
  return ["PUBLIC"];
}

// ─── Graph traversal: discover connected family IDs ──────────────────────────

async function discoverFamilies(
  rootFamilyId: string,
  maxDepth: number
): Promise<Set<string>> {
  const discovered = new Set<string>([rootFamilyId]);
  const depth = new Map<string, number>([[rootFamilyId, 0]]);
  const frontier = [rootFamilyId];

  while (frontier.length > 0 && discovered.size < MAX_FAMILIES) {
    const current = frontier.shift()!;
    const curDepth = depth.get(current) ?? 0;
    if (curDepth >= maxDepth) continue;

    // 1. FamilyLink neighbours
    const links = await db.familyLink.findMany({
      where: { deletedAt: null, status: "APPROVED", OR: [{ familyAId: current }, { familyBId: current }] },
      select: { familyAId: true, familyBId: true },
    });
    for (const l of links) {
      const nb = l.familyAId === current ? l.familyBId : l.familyAId;
      if (!discovered.has(nb) && discovered.size < MAX_FAMILIES) {
        discovered.add(nb); depth.set(nb, curDepth + 1); frontier.push(nb);
      }
    }

    // 2. Cross-family marriage neighbours (persons in this family married to other families)
    const crossMarriages = await db.marriageRelation.findMany({
      where: {
        deletedAt: null,
        OR: [
          { personA: { familyId: current } },
          { personB: { familyId: current } },
        ],
      },
      select: {
        personA: { select: { familyId: true } },
        personB: { select: { familyId: true } },
      },
    });
    for (const m of crossMarriages) {
      const nbA = m.personA.familyId;
      const nbB = m.personB.familyId;
      for (const nb of [nbA, nbB]) {
        if (nb !== current && !discovered.has(nb) && discovered.size < MAX_FAMILIES) {
          discovered.add(nb); depth.set(nb, curDepth + 1); frontier.push(nb);
        }
      }
    }
  }

  return discovered;
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getFamilyNetwork(
  rootFamilyId: string,
  opts: { selectedFamilyIds?: string[]; expandFamilyIds?: string[] },
  viewer: ViewerContext
): Promise<FamilyNetworkResult> {

  // 1. Determine which families to load
  let familyIds: Set<string>;

  if (opts.selectedFamilyIds && opts.selectedFamilyIds.length > 0) {
    // User-selected subset — always include root
    familyIds = new Set([rootFamilyId, ...opts.selectedFamilyIds]);
  } else {
    // Default: direct connections (depth 1). expandFamilyIds gets one extra hop each.
    familyIds = await discoverFamilies(rootFamilyId, 1);

    // Extra expansion hops for families the user explicitly expanded
    if (opts.expandFamilyIds && opts.expandFamilyIds.length > 0) {
      for (const expId of opts.expandFamilyIds) {
        if (familyIds.size >= MAX_FAMILIES) break;
        const extra = await discoverFamilies(expId, 1);
        for (const id of extra) {
          if (familyIds.size < MAX_FAMILIES) familyIds.add(id);
        }
      }
    }
  }

  const familyIdArr = Array.from(familyIds);
  const truncated = familyIds.size >= MAX_FAMILIES;

  // 2. Build admin set for viewer
  let adminFamilyIds = viewer.adminFamilyIds;
  if (!viewer.isSystemAdmin && viewer.userId) {
    const assignments = await db.familyAdminAssignment.findMany({
      where: { userId: viewer.userId, isActive: true, familyId: { in: familyIdArr } },
      select: { familyId: true },
    });
    adminFamilyIds = new Set([...adminFamilyIds, ...assignments.map((a) => a.familyId)]);
  }
  const ctx: ViewerContext = { ...viewer, adminFamilyIds };

  // 3. Fetch families metadata
  const familyRecords = await db.family.findMany({
    where: { id: { in: familyIdArr }, deletedAt: null },
    select: { id: true, name: true, slug: true, _count: { select: { persons: true } } },
  });

  // 4. Fetch persons per family (respecting visibility)
  const allPersons: NetworkPerson[] = [];
  let personCount = 0;

  for (const fam of familyRecords) {
    if (personCount >= MAX_PERSONS) break;
    const vis = allowedVisibilitiesFor(fam.id, ctx);
    const persons = await db.person.findMany({
      where: { familyId: fam.id, deletedAt: null, visibilityLevel: { in: vis } },
      select: { id: true, fullName: true, gender: true, isLiving: true, birthDate: true, deathDate: true, biography: true, notes: true },
      orderBy: { fullName: "asc" },
    });
    for (const p of persons) {
      if (personCount >= MAX_PERSONS) break;
      allPersons.push({
        id: p.id, familyId: fam.id,
        fullName: p.fullName, gender: p.gender,
        isLiving: p.isLiving,
        birthDate: p.birthDate?.toISOString() ?? null,
        deathDate: p.deathDate?.toISOString() ?? null,
        biography: p.biography ?? null,
        notes: p.notes ?? null,
      });
      personCount++;
    }
  }

  const personIds = allPersons.map((p) => p.id);
  const personFamilyMap = new Map(allPersons.map((p) => [p.id, p.familyId]));
  const personIdSet = new Set(personIds);

  // 5. Parent-child relations (always intra-family)
  const rawRelations = await db.parentChildRelation.findMany({
    where: { parentPersonId: { in: personIds }, childPersonId: { in: personIds } },
    select: { parentPersonId: true, childPersonId: true },
  });
  const parentChildRelations: NetworkRelation[] = rawRelations.map((r) => ({
    parentId: r.parentPersonId,
    childId: r.childPersonId,
    familyId: personFamilyMap.get(r.parentPersonId) ?? "",
  }));

  // 6. Marriages — both persons must be visible (critical privacy guard)
  const rawMarriages = await db.marriageRelation.findMany({
    where: { deletedAt: null, OR: [{ personAId: { in: personIds } }, { personBId: { in: personIds } }] },
    select: { id: true, personAId: true, personBId: true },
  });
  const marriages: NetworkMarriage[] = rawMarriages
    .filter((m) => personIdSet.has(m.personAId) && personIdSet.has(m.personBId))
    .map((m) => {
      const famA = personFamilyMap.get(m.personAId) ?? "";
      const famB = personFamilyMap.get(m.personBId) ?? "";
      return { id: m.id, personAId: m.personAId, personBId: m.personBId, familyAId: famA, familyBId: famB, kind: famA === famB ? "INTRA" : "CROSS" };
    });

  // 7. Family links between the discovered families
  const familyLinks = await db.familyLink.findMany({
    where: { deletedAt: null, status: "APPROVED", familyAId: { in: familyIdArr }, familyBId: { in: familyIdArr } },
    select: { id: true, familyAId: true, familyBId: true, linkType: true },
  });

  return {
    rootFamilyId,
    truncated,
    families: familyRecords.map((f) => ({ id: f.id, name: f.name, slug: f.slug, personCount: f._count.persons, isRoot: f.id === rootFamilyId })),
    persons: allPersons,
    parentChildRelations,
    marriages,
    familyLinks: familyLinks.map((l) => ({ id: l.id, familyAId: l.familyAId, familyBId: l.familyBId, linkType: l.linkType as "KINSHIP" | "IN_LAW" })),
  };
}
