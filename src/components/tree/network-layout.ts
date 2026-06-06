// ─── Multi-family network layout ─────────────────────────────────────────────
// Places each family's internal tree in its own "zone" (coloured region),
// then arranges zones on a 2D canvas so marriage-connected families sit
// adjacent (short bridge edges) and all zones are non-overlapping.

import { buildLayout, layoutBounds, NODE_W, NODE_H } from "./layout";
import type { NetworkPerson, NetworkRelation, NetworkMarriage } from "@/lib/network/get-family-network";

// ─── Zone geometry ────────────────────────────────────────────────────────────

export const ZONE_GAP_X  = 240;
export const ZONE_GAP_Y  = 200;
export const HEADER_H    = 60;
export const ZONE_PAD    = 56;
export const ROW_MAX_W   = 6000;

export interface ZoneRect {
  familyId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorIndex: number;
}

export interface NetworkLayoutResult {
  positions: Map<string, { x: number; y: number }>;
  zones: ZoneRect[];
}

// 8 distinct hues in our dark theme (low-saturation fills)
export const ZONE_COLORS: string[] = [
  "hsl(145 30% 18%)",   // forest green  — root
  "hsl(210 30% 18%)",   // blue
  "hsl(42  35% 16%)",   // amber
  "hsl(270 28% 18%)",   // violet
  "hsl(338 28% 16%)",   // rose
  "hsl(175 28% 16%)",   // teal
  "hsl(30  35% 16%)",   // orange
  "hsl(240 28% 18%)",   // indigo
];

export const ZONE_BORDER_COLORS: string[] = [
  "hsl(145 40% 30%)",
  "hsl(210 50% 35%)",
  "hsl(42  55% 35%)",
  "hsl(270 45% 35%)",
  "hsl(338 45% 30%)",
  "hsl(175 45% 28%)",
  "hsl(30  50% 32%)",
  "hsl(240 45% 35%)",
];

// ─── Main layout function ─────────────────────────────────────────────────────

export function buildNetworkLayout(
  families: { id: string; name: string; isRoot: boolean }[],
  personsByFamily: Map<string, NetworkPerson[]>,
  relationsByFamily: Map<string, NetworkRelation[]>,
  crossMarriages: NetworkMarriage[]
): NetworkLayoutResult {
  if (families.length === 0) return { positions: new Map(), zones: [] };

  // 1. Per-family internal layout + bounding box
  interface ZoneInfo {
    familyId: string;
    localPositions: Map<string, { x: number; y: number }>;
    w: number;  // zone total width  (tree width + 2*ZONE_PAD)
    h: number;  // zone total height (HEADER_H + tree height + 2*ZONE_PAD)
    normMinX: number;
    normMinY: number;
    originX: number;
    originY: number;
    colorIndex: number;
    isRoot: boolean;
  }

  const zoneInfos: ZoneInfo[] = families.map((fam, idx) => {
    const persons   = personsByFamily.get(fam.id) ?? [];
    const relations = relationsByFamily.get(fam.id) ?? [];
    const local     = buildLayout(persons, relations);
    const bounds    = layoutBounds(local);

    const treeW = Math.max(bounds.width,  NODE_W);
    const treeH = Math.max(bounds.height, NODE_H);

    return {
      familyId: fam.id,
      localPositions: local,
      w: treeW + 2 * ZONE_PAD,
      h: treeH + HEADER_H + 2 * ZONE_PAD,
      normMinX: bounds.minX,
      normMinY: bounds.minY,
      originX: 0,
      originY: 0,
      colorIndex: idx % ZONE_COLORS.length,
      isRoot: fam.isRoot,
    };
  });

  // 2. Order: root first, then by marriage-affinity (greedy nearest-neighbour)
  const marriageWeight = new Map<string, Map<string, number>>();
  for (const m of crossMarriages) {
    if (m.familyAId === m.familyBId) continue;
    const [a, b] = [m.familyAId, m.familyBId];
    if (!marriageWeight.has(a)) marriageWeight.set(a, new Map());
    if (!marriageWeight.has(b)) marriageWeight.set(b, new Map());
    marriageWeight.get(a)!.set(b, (marriageWeight.get(a)!.get(b) ?? 0) + 1);
    marriageWeight.get(b)!.set(a, (marriageWeight.get(b)!.get(a) ?? 0) + 1);
  }

  const ordered: ZoneInfo[] = [];
  const placed  = new Set<string>();

  // Seed with root family
  const rootZone = zoneInfos.find((z) => z.isRoot) ?? zoneInfos[0];
  ordered.push(rootZone);
  placed.add(rootZone.familyId);

  while (ordered.length < zoneInfos.length) {
    // find unplaced zone with highest marriage affinity to already-placed set
    let bestZone: ZoneInfo | null = null;
    let bestScore = -1;

    for (const z of zoneInfos) {
      if (placed.has(z.familyId)) continue;
      let score = 0;
      for (const p of placed) {
        score += marriageWeight.get(z.familyId)?.get(p) ?? 0;
      }
      if (score > bestScore || bestZone === null) { bestScore = score; bestZone = z; }
    }

    if (bestZone) { ordered.push(bestZone); placed.add(bestZone.familyId); }
  }

  // 3. Shelf/row packing — left-to-right, wrap when exceeding ROW_MAX_W
  let cursorX = 0;
  let rowY    = 0;
  let rowH    = 0;

  for (const z of ordered) {
    if (cursorX > 0 && cursorX + z.w > ROW_MAX_W) {
      cursorX = 0;
      rowY   += rowH + ZONE_GAP_Y;
      rowH    = 0;
    }
    z.originX = cursorX;
    z.originY = rowY;
    cursorX  += z.w + ZONE_GAP_X;
    rowH      = Math.max(rowH, z.h);
  }

  // 4. Compute absolute node positions
  const positions = new Map<string, { x: number; y: number }>();

  for (const z of ordered) {
    const dx = z.originX + ZONE_PAD - z.normMinX;
    const dy = z.originY + HEADER_H + ZONE_PAD - z.normMinY;
    z.localPositions.forEach(({ x, y }, personId) => {
      positions.set(personId, { x: x + dx, y: y + dy });
    });
  }

  // 5. Build zone rects
  const zones: ZoneRect[] = ordered.map((z) => ({
    familyId: z.familyId,
    x: z.originX,
    y: z.originY,
    width:  z.w,
    height: z.h,
    colorIndex: z.colorIndex,
  }));

  return { positions, zones };
}
