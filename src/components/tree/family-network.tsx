"use client";

import {
  useCallback, useMemo, useState, useEffect, useRef,
} from "react";
import {
  ReactFlow, Background, Controls, MiniMap, Panel,
  useNodesState, useEdgesState,
  type Node, type Edge, BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { PersonNode } from "./person-node";
import { PersonSidebar, type PersonData } from "./person-sidebar";
import {
  ZoneBackgroundNode, FamilyHeaderNode,
  type ZoneBackgroundData, type FamilyHeaderData,
} from "./zone-nodes";
import { NetworkControls, type EdgeFilterState } from "./network-controls";
import { buildNetworkLayout, ZONE_BORDER_COLORS, ZONE_COLORS } from "./network-layout";
import type {
  FamilyNetworkResult, NetworkMarriage, NetworkPerson,
} from "@/lib/network/get-family-network";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowPersonData  = PersonData & Record<string, unknown>;
type PersonFlowNode  = Node<FlowPersonData,       "person">;
type ZoneBgNode      = Node<ZoneBackgroundData,   "zoneBackground">;
type HeaderNode      = Node<FamilyHeaderData,     "familyHeader">;
type AnyNode         = PersonFlowNode | ZoneBgNode | HeaderNode;

const nodeTypes = {
  person:         PersonNode,
  zoneBackground: ZoneBackgroundNode,
  familyHeader:   FamilyHeaderNode,
} as const;

// ─── Edge style helpers ───────────────────────────────────────────────────────

const EDGE_PARENT_CHILD = {
  type: "smoothstep",
  style: { stroke: "hsl(145 40% 38%)", strokeWidth: 2.5, opacity: 0.8, filter: "drop-shadow(0 0 3px hsl(145 40% 28% / 0.4))" },
} as const;

const EDGE_MARRIAGE_INTRA = {
  type: "straight",
  style: { stroke: "hsl(338 65% 62%)", strokeWidth: 1.5, strokeDasharray: "6 3", opacity: 0.85, filter: "drop-shadow(0 0 3px hsl(338 65% 40% / 0.3))" },
  label: "♥",
  labelStyle: { fill: "hsl(338 65% 65%)", fontSize: 11, fontWeight: "bold" } as React.CSSProperties,
  labelBgStyle: { fill: "transparent" } as React.CSSProperties,
} as const;

const EDGE_MARRIAGE_CROSS = {
  type: "straight",
  style: { stroke: "hsl(45 90% 55%)", strokeWidth: 2.5, strokeDasharray: "8 3 2 3", opacity: 0.9, filter: "drop-shadow(0 0 5px hsl(45 90% 45% / 0.5))" },
  label: "مصاهرة",
  labelStyle: { fill: "hsl(45 90% 60%)", fontSize: 9, fontWeight: "bold" } as React.CSSProperties,
  labelBgStyle: { fill: "hsl(0 0% 0% / 0.6)", padding: 2, borderRadius: 3 } as React.CSSProperties,
} as const;

const EDGE_KINSHIP_LINK = {
  type: "smoothstep",
  style: { stroke: "hsl(210 70% 55%)", strokeWidth: 2, strokeDasharray: "10 4", opacity: 0.7 },
  label: "نسب",
  labelStyle: { fill: "hsl(210 70% 65%)", fontSize: 9 } as React.CSSProperties,
  labelBgStyle: { fill: "hsl(0 0% 0% / 0.5)", padding: 2, borderRadius: 3 } as React.CSSProperties,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function personToFlowData(p: NetworkPerson): FlowPersonData {
  return { ...p, linkedFamilyBadges: [], isHighlighted: false, isDimmed: false } as FlowPersonData;
}

// Determine which side handle to use for a cross-family marriage edge.
// The person with a lower x position uses the right handle; the other uses left.
function bridgeHandles(posA: { x: number } | undefined, posB: { x: number } | undefined): { sourceHandle: string; targetHandle: string } {
  if (!posA || !posB) return { sourceHandle: "r", targetHandle: "l" };
  return posA.x <= posB.x
    ? { sourceHandle: "r", targetHandle: "l" }
    : { sourceHandle: "l", targetHandle: "r" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface FamilyNetworkProps extends FamilyNetworkResult {
  canManage: boolean;
  familySlug: string;
  initialExpandIds?: string[];
  onExpandFamily: (famId: string) => void;
}

export function FamilyNetwork({
  rootFamilyId, truncated, families, persons, parentChildRelations,
  marriages, familyLinks, canManage, familySlug, onExpandFamily,
}: FamilyNetworkProps) {
  const router = useRouter();
  const [hiddenFamilyIds, setHiddenFamilyIds] = useState<Set<string>>(new Set());
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<EdgeFilterState>({
    parentChild: true, marriageIntra: true, marriageCross: true, kinshipLink: true,
  });

  // ── Derived: visible sets ──────────────────────────────────────────────────

  const visibleFamilyIds = useMemo(() => {
    if (focusPersonId) {
      // In focus mode: show only families connected through this person
      const personFam = persons.find((p) => p.id === focusPersonId)?.familyId;
      if (!personFam) return new Set<string>();
      const connected = new Set<string>([personFam]);
      marriages.forEach((m) => {
        if (m.personAId === focusPersonId || m.personBId === focusPersonId) {
          connected.add(m.familyAId);
          connected.add(m.familyBId);
        }
      });
      parentChildRelations.forEach((r) => {
        if (r.parentId === focusPersonId || r.childId === focusPersonId) connected.add(r.familyId);
      });
      return connected;
    }
    return new Set(families.map((f) => f.id).filter((id) => !hiddenFamilyIds.has(id)));
  }, [focusPersonId, hiddenFamilyIds, families, persons, marriages, parentChildRelations]);

  const visiblePersonIds = useMemo(() => new Set(persons.filter((p) => visibleFamilyIds.has(p.familyId)).map((p) => p.id)), [persons, visibleFamilyIds]);

  // ── Layout ─────────────────────────────────────────────────────────────────

  const visibleFamilies = useMemo(() => families.filter((f) => visibleFamilyIds.has(f.id)), [families, visibleFamilyIds]);

  const personsByFamily = useMemo(() => {
    const m = new Map<string, NetworkPerson[]>();
    for (const p of persons) {
      if (!visibleFamilyIds.has(p.familyId)) continue;
      (m.get(p.familyId) ?? m.set(p.familyId, []).get(p.familyId)!).push(p);
    }
    return m;
  }, [persons, visibleFamilyIds]);

  const relationsByFamily = useMemo(() => {
    const m = new Map<string, typeof parentChildRelations>();
    for (const r of parentChildRelations) {
      if (!visiblePersonIds.has(r.parentId) || !visiblePersonIds.has(r.childId)) continue;
      (m.get(r.familyId) ?? m.set(r.familyId, []).get(r.familyId)!).push(r);
    }
    return m;
  }, [parentChildRelations, visiblePersonIds]);

  const crossMarriagesVisible = useMemo<NetworkMarriage[]>(() =>
    marriages.filter((m) => m.kind === "CROSS" && visiblePersonIds.has(m.personAId) && visiblePersonIds.has(m.personBId)),
    [marriages, visiblePersonIds]
  );

  const { positions, zones } = useMemo(() =>
    buildNetworkLayout(visibleFamilies, personsByFamily, relationsByFamily, crossMarriagesVisible),
    [visibleFamilies, personsByFamily, relationsByFamily, crossMarriagesVisible]
  );

  // ── Build nodes ────────────────────────────────────────────────────────────

  const buildNodes = useCallback((): AnyNode[] => {
    const out: AnyNode[] = [];

    zones.forEach((zone, zi) => {
      const fam = families.find((f) => f.id === zone.familyId);
      if (!fam) return;
      const colorIdx = zone.colorIndex;

      // Zone background (z=0)
      out.push({
        id: `zone-bg-${zone.familyId}`,
        type: "zoneBackground",
        position: { x: zone.x, y: zone.y },
        data: {
          familyId: fam.id, familyName: fam.name,
          colorIndex: colorIdx, isRoot: fam.id === rootFamilyId,
          width: zone.width, height: zone.height,
        } as ZoneBackgroundData,
        selectable: false, draggable: false, focusable: false,
        zIndex: 0,
      } as ZoneBgNode);

      // Family header (z=1) — anchors KINSHIP link edges
      out.push({
        id: `header-${zone.familyId}`,
        type: "familyHeader",
        position: { x: zone.x + 16, y: zone.y + 10 },
        data: {
          familyId: fam.id, familyName: fam.name, familySlug: fam.slug,
          personCount: fam.personCount, colorIndex: colorIdx,
          isRoot: fam.id === rootFamilyId, zoneWidth: zone.width,
        } as FamilyHeaderData,
        selectable: false, draggable: false, focusable: false,
        zIndex: 1,
      } as HeaderNode);
    });

    // Person nodes (z=10)
    persons.forEach((p) => {
      if (!visiblePersonIds.has(p.id)) return;
      const pos  = positions.get(p.id);
      if (!pos) return;
      const isDimmed = focusPersonId !== null && focusPersonId !== p.id;
      out.push({
        id: p.id, type: "person",
        position: pos,
        data: personToFlowData({ ...p, isDimmed } as NetworkPerson & { isDimmed: boolean }),
        zIndex: 10,
      } as PersonFlowNode);
    });

    return out;
  }, [zones, families, persons, visiblePersonIds, positions, focusPersonId, rootFamilyId]);

  // ── Build edges ────────────────────────────────────────────────────────────

  const buildEdges = useCallback((): Edge[] => {
    const out: Edge[] = [];

    // Parent-child
    if (edgeFilter.parentChild) {
      parentChildRelations.forEach(({ parentId, childId }, i) => {
        if (!visiblePersonIds.has(parentId) || !visiblePersonIds.has(childId)) return;
        out.push({ id: `pc-${i}`, source: parentId, target: childId, ...EDGE_PARENT_CHILD });
      });
    }

    // Marriage intra-family
    if (edgeFilter.marriageIntra) {
      marriages.filter((m) => m.kind === "INTRA" && visiblePersonIds.has(m.personAId) && visiblePersonIds.has(m.personBId))
        .forEach((m) => { out.push({ id: `mi-${m.id}`, source: m.personAId, target: m.personBId, ...EDGE_MARRIAGE_INTRA }); });
    }

    // Marriage cross-family (gold bridge)
    if (edgeFilter.marriageCross) {
      crossMarriagesVisible.forEach((m) => {
        const posA = positions.get(m.personAId);
        const posB = positions.get(m.personBId);
        const { sourceHandle, targetHandle } = bridgeHandles(posA, posB);
        out.push({ id: `mc-${m.id}`, source: m.personAId, target: m.personBId, ...EDGE_MARRIAGE_CROSS, sourceHandle, targetHandle });
      });
    }

    // Family KINSHIP links (between header nodes)
    if (edgeFilter.kinshipLink) {
      familyLinks.filter((l) => l.linkType === "KINSHIP" && visibleFamilyIds.has(l.familyAId) && visibleFamilyIds.has(l.familyBId))
        .forEach((l) => {
          out.push({ id: `kl-${l.id}`, source: `header-${l.familyAId}`, target: `header-${l.familyBId}`, ...EDGE_KINSHIP_LINK });
        });
    }

    return out;
  }, [edgeFilter, parentChildRelations, marriages, crossMarriagesVisible, familyLinks, visiblePersonIds, visibleFamilyIds, positions]);

  // ── State sync ─────────────────────────────────────────────────────────────

  const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  const dataKey = useMemo(() =>
    [...visibleFamilyIds].sort().join(",") + "|" + focusPersonId + "|" + JSON.stringify(edgeFilter),
    [visibleFamilyIds, focusPersonId, edgeFilter]
  );
  const prevKeyRef = useRef(dataKey);
  useEffect(() => {
    if (dataKey !== prevKeyRef.current) {
      prevKeyRef.current = dataKey;
      setNodes(buildNodes());
      setEdges(buildEdges());
    }
  }, [dataKey, buildNodes, buildEdges, setNodes, setEdges]);

  // ── Person selection ───────────────────────────────────────────────────────

  const onNodeClick = useCallback((_: React.MouseEvent, node: AnyNode) => {
    if (node.type !== "person") return;
    const p = persons.find((x) => x.id === node.id);
    if (p) setSelectedPerson({ ...p, biography: p.biography ?? null, notes: p.notes ?? null });
  }, [persons]);

  const onPaneClick = useCallback(() => setSelectedPerson(null), []);

  // ── Expandable families (connected to visible, not yet shown) ──────────────

  const expandableFamilyIds = useMemo(() => {
    const visible = visibleFamilyIds;
    const potential = new Set<string>();
    familyLinks.forEach((l) => {
      if (visible.has(l.familyAId) && !visible.has(l.familyBId)) potential.add(l.familyBId);
      if (visible.has(l.familyBId) && !visible.has(l.familyAId)) potential.add(l.familyAId);
    });
    return Array.from(potential).slice(0, 6);
  }, [visibleFamilyIds, familyLinks]);

  const visiblePersonList = useMemo(() =>
    persons.filter((p) => visiblePersonIds.has(p.id)).map((p) => ({ ...p, biography: p.biography ?? null, notes: p.notes ?? null })),
    [persons, visiblePersonIds]
  );

  const visibleRelations = useMemo(() =>
    parentChildRelations.filter((r) => visiblePersonIds.has(r.parentId) && visiblePersonIds.has(r.childId))
      .map((r) => ({ parentId: r.parentId, childId: r.childId })),
    [parentChildRelations, visiblePersonIds]
  );

  const visibleMarriages = useMemo(() =>
    marriages.filter((m) => visiblePersonIds.has(m.personAId) && visiblePersonIds.has(m.personBId))
      .map((m) => ({ id: m.id, personAId: m.personAId, personBId: m.personBId })),
    [marriages, visiblePersonIds]
  );

  // ── MiniMap node colors ────────────────────────────────────────────────────

  const personFamilyMap = useMemo(() => new Map(persons.map((p) => [p.id, p.familyId])), [persons]);
  const familyColorMap  = useMemo(() => {
    const m = new Map<string, string>();
    zones.forEach((z) => { m.set(z.familyId, ZONE_BORDER_COLORS[z.colorIndex % ZONE_BORDER_COLORS.length]); });
    return m;
  }, [zones]);

  return (
    <div className="w-full h-full flex">
      {selectedPerson && (
        <button type="button" aria-label="إغلاق" className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setSelectedPerson(null)} />
      )}

      {selectedPerson && (
        <PersonSidebar
          key={selectedPerson.id}
          person={selectedPerson}
          allPersons={visiblePersonList}
          linkedPersons={[]}
          relations={visibleRelations}
          marriages={visibleMarriages}
          canManage={canManage}
          familyId={persons.find((p) => p.id === selectedPerson.id)?.familyId ?? ""}
          onClose={() => setSelectedPerson(null)}
          onPersonSelect={(id) => {
            const p = visiblePersonList.find((x) => x.id === id);
            if (p) setSelectedPerson(p);
          }}
        />
      )}

      <div className="flex-1 min-w-0 relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          fitView fitViewOptions={{ padding: 0.15 }}
          minZoom={0.08} maxZoom={2}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={32} size={1.2} color="hsl(150 12% 18%)" style={{ opacity: 0.4 }} />
          <Controls className="!hidden md:!flex !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !backdrop-blur-sm" showInteractive={false} />
          <MiniMap
            className="!hidden md:!block !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !overflow-hidden"
            nodeColor={(n) => {
              if (n.type !== "person") return "transparent";
              const famId = personFamilyMap.get(n.id) ?? "";
              return familyColorMap.get(famId) ?? "hsl(145 35% 30%)";
            }}
            nodeBorderRadius={6}
            maskColor="hsl(160 20% 5% / 0.7)"
          />

          {/* لوحة التحكم */}
          <NetworkControls
            families={visibleFamilies}
            rootFamilyId={rootFamilyId}
            hiddenFamilyIds={hiddenFamilyIds}
            edgeFilter={edgeFilter}
            focusPersonId={focusPersonId}
            truncated={truncated}
            expandableFamilyIds={expandableFamilyIds}
            onToggleFamily={(id) => setHiddenFamilyIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
            onEdgeFilterChange={(k, v) => setEdgeFilter((prev) => ({ ...prev, [k]: v }))}
            onClearFocus={() => setFocusPersonId(null)}
            onExpandFamily={onExpandFamily}
          />

          {/* زر تركيز الشخص */}
          {selectedPerson && !focusPersonId && (
            <Panel position="top-left">
              <button type="button" dir="rtl"
                onClick={() => { setFocusPersonId(selectedPerson.id); setSelectedPerson(null); }}
                className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-accent/10 border border-accent/30 hover:border-accent/60 text-accent/80 hover:text-accent px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm transition-all">
                ★ تتبع شبكة {selectedPerson.fullName}
              </button>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
