/**
 * Client-safe utility: computes all person IDs that are mahram (forbidden for marriage)
 * to the given person, based on blood-relation rules of Islamic jurisprudence.
 *
 * Forbidden categories:
 *   1. All ancestors (parents, grandparents, ...) — any depth
 *   2. All descendants (children, grandchildren, ...) — any depth
 *   3. Siblings (share ≥ 1 parent)
 *   4. Aunts & Uncles (siblings of parents)
 *   5. Nieces & Nephews (descendants of siblings, any depth)
 *
 * First cousins and further are NOT included (permitted in Islamic law).
 * The result does NOT include personId itself — callers should add it if needed.
 */
export function computeMahramIds(
  personId: string,
  relations: Array<{ parentId: string; childId: string }>
): Set<string> {
  // Build adjacency maps
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();

  for (const { parentId, childId } of relations) {
    if (!parentsOf.has(childId)) parentsOf.set(childId, []);
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    parentsOf.get(childId)!.push(parentId);
    childrenOf.get(parentId)!.push(childId);
  }

  const mahrams = new Set<string>();

  // BFS helper — walks up the parentsOf graph
  function bfsUp(startId: string, collect: Set<string>) {
    const queue = [...(parentsOf.get(startId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (collect.has(id)) continue;
      collect.add(id);
      (parentsOf.get(id) ?? []).forEach((p) => queue.push(p));
    }
  }

  // BFS helper — walks down the childrenOf graph
  function bfsDown(startId: string, collect: Set<string>) {
    const queue = [...(childrenOf.get(startId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (collect.has(id)) continue;
      collect.add(id);
      (childrenOf.get(id) ?? []).forEach((c) => queue.push(c));
    }
  }

  // 1. All ancestors
  const ancestors = new Set<string>();
  bfsUp(personId, ancestors);
  ancestors.forEach((id) => mahrams.add(id));

  // 2. All descendants
  const descendants = new Set<string>();
  bfsDown(personId, descendants);
  descendants.forEach((id) => mahrams.add(id));

  // 3. Siblings (children of person's parents, excluding self)
  const siblings = new Set<string>();
  for (const parentId of parentsOf.get(personId) ?? []) {
    for (const sibId of childrenOf.get(parentId) ?? []) {
      if (sibId !== personId) {
        siblings.add(sibId);
        mahrams.add(sibId);
      }
    }
  }

  // 4. Aunts & Uncles (siblings of each parent)
  for (const parentId of parentsOf.get(personId) ?? []) {
    for (const gpId of parentsOf.get(parentId) ?? []) {
      for (const id of childrenOf.get(gpId) ?? []) {
        if (id !== parentId) mahrams.add(id);
      }
    }
  }

  // 5. Nieces & Nephews (all descendants of siblings, any depth)
  for (const sibId of siblings) {
    const nephews = new Set<string>();
    bfsDown(sibId, nephews);
    nephews.forEach((id) => mahrams.add(id));
  }

  return mahrams;
}
