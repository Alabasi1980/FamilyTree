// ─── Shared tree layout utilities ────────────────────────────────────────────
// Used by both the single-family tree (family-tree.tsx) and the multi-family
// network canvas (family-network.tsx). Kept free of React / component imports.

export const NODE_W = 180;
export const NODE_H = 96;
export const GAP_X  = 56;
export const GAP_Y  = 160;

// Minimal structural types so this module stays import-free of components
export interface LayoutPerson  { id: string }
export interface LayoutRelation { parentId: string; childId: string }
export interface LayoutMarriage { personAId: string; personBId: string }

export interface LayoutOptions {
  /** Marriages used to seat a married-in spouse beside their partner on the same generation row. */
  marriages?: LayoutMarriage[];
}

export interface LayoutBounds {
  minX: number; minY: number;
  maxX: number; maxY: number;
  width: number; height: number;
}

// Generation-aware top-down tree layout.
// Identical to the original private function in family-tree.tsx.
export function buildLayout(
  persons: LayoutPerson[],
  relations: LayoutRelation[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  if (persons.length === 0) return new Map();

  const childrenMap = new Map<string, string[]>();
  const parentMap   = new Map<string, string[]>();

  persons.forEach((p) => { childrenMap.set(p.id, []); parentMap.set(p.id, []); });
  relations.forEach(({ parentId, childId }) => {
    childrenMap.get(parentId)?.push(childId);
    parentMap.get(childId)?.push(parentId);
  });

  // Partner map (each person → spouses), restricted to persons present in this layout.
  const presentIds = new Set(persons.map((p) => p.id));
  const partnerMap = new Map<string, string[]>();
  (options.marriages ?? []).forEach(({ personAId, personBId }) => {
    if (!presentIds.has(personAId) || !presentIds.has(personBId)) return;
    partnerMap.set(personAId, [...(partnerMap.get(personAId) ?? []), personBId]);
    partnerMap.set(personBId, [...(partnerMap.get(personBId) ?? []), personAId]);
  });

  // "Married-in" = no parents AND no children, but married to someone in the tree.
  // These are seated beside their partner instead of consuming a top-row column.
  const marriedIn = new Set<string>();
  persons.forEach((p) => {
    const hasParents  = (parentMap.get(p.id)?.length ?? 0) > 0;
    const hasChildren = (childrenMap.get(p.id)?.length ?? 0) > 0;
    const hasPartner  = (partnerMap.get(p.id)?.length ?? 0) > 0;
    if (!hasParents && !hasChildren && hasPartner) marriedIn.add(p.id);
  });

  // BFS — assign generation depth from roots (excluding married-in spouses)
  const depth = new Map<string, number>();
  const queue: Array<{ id: string; d: number }> = persons
    .filter((p) => !marriedIn.has(p.id) && (parentMap.get(p.id)?.length ?? 0) === 0)
    .map((p) => ({ id: p.id, d: 0 }));

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (depth.has(item.id)) continue;
    depth.set(item.id, item.d);
    childrenMap.get(item.id)?.forEach((c) => queue.push({ id: c, d: item.d + 1 }));
  }

  const positions = new Map<string, { x: number; y: number }>();
  let leafCounter = 0;

  function place(id: string): number {
    if (positions.has(id)) return positions.get(id)!.x;
    const d        = depth.get(id) ?? 0;
    const children = (childrenMap.get(id) ?? []).filter((c) => !marriedIn.has(c));

    if (children.length === 0) {
      const x = leafCounter * (NODE_W + GAP_X);
      leafCounter++;
      positions.set(id, { x, y: d * GAP_Y });
      return x;
    }

    const xs = children.map((c) => place(c));
    const x  = (xs[0] + xs[xs.length - 1]) / 2;
    positions.set(id, { x, y: d * GAP_Y });
    return x;
  }

  persons
    .filter((p) => !marriedIn.has(p.id) && (parentMap.get(p.id)?.length ?? 0) === 0)
    .forEach((r) => place(r.id));

  // Seat married-in spouses next to their (already placed) partner on the same row.
  const spouseOffsetCount = new Map<string, number>();
  marriedIn.forEach((id) => {
    const partnerId = (partnerMap.get(id) ?? []).find((pid) => positions.has(pid));
    if (!partnerId) return;
    const base = positions.get(partnerId)!;
    const n = (spouseOffsetCount.get(partnerId) ?? 0) + 1;
    spouseOffsetCount.set(partnerId, n);
    positions.set(id, { x: base.x + n * (NODE_W + GAP_X), y: base.y });
    depth.set(id, (depth.get(partnerId) ?? 0));
  });

  // Fallback for anything still unplaced (isolated persons, orphan spouses).
  persons.forEach((p) => {
    if (!positions.has(p.id)) {
      positions.set(p.id, { x: leafCounter * (NODE_W + GAP_X), y: 0 });
      leafCounter++;
    }
  });

  return positions;
}

// Bounding box of a layout result (accounts for node footprint).
export function layoutBounds(positions: Map<string, { x: number; y: number }>): LayoutBounds {
  if (positions.size === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positions.forEach(({ x, y }) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + NODE_W > maxX) maxX = x + NODE_W;
    if (y + NODE_H > maxY) maxY = y + NODE_H;
  });

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
