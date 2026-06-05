"use client";

import { useCallback, useMemo, useState, useEffect, useRef, useTransition } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { PersonNode } from "./person-node";
import { PersonSidebar, type PersonData, type Relation, type Marriage } from "./person-sidebar";
import { LinkedFamiliesPanel, type LinkedFamilyInfo } from "./linked-families-panel";
import { createPerson } from "@/lib/actions/persons";

type FlowPersonData = PersonData & Record<string, unknown>;
type FamilyTreeNode = Node<FlowPersonData, "person">;
type LinkedFamilyBadge = {
  familyId: string;
  name: string;
  slug: string;
  linkType: "KINSHIP" | "IN_LAW";
  spouseName: string;
};

// ─── Re-export types for convenience ────────────────────────────────────────────────
export type { PersonData, Relation, Marriage, LinkedFamilyInfo };

interface Props {
  persons: PersonData[];
  relations: Relation[];
  marriages?: Marriage[];
  canManage?: boolean;
  familyId?: string;
  /** Persons from linked IN_LAW families (for cross-family marriage) */
  linkedPersons?: PersonData[];
  /** All linked families to show in the canvas panel */
  linkedFamilies?: LinkedFamilyInfo[];
}

const nodeTypes = { person: PersonNode };
const closePersonDetailsLabel =
  "\u0625\u063a\u0644\u0627\u0642 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0634\u062e\u0635";

// ─── Generation-aware layout ──────────────────────────────────────────────────

function buildLayout(persons: PersonData[], relations: Relation[]) {
  if (persons.length === 0) return new Map<string, { x: number; y: number }>();

  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  persons.forEach((p) => {
    childrenMap.set(p.id, []);
    parentMap.set(p.id, []);
  });
  relations.forEach(({ parentId, childId }) => {
    childrenMap.get(parentId)?.push(childId);
    parentMap.get(childId)?.push(parentId);
  });

  // BFS to assign generation depth from roots
  const depth = new Map<string, number>();
  const queue: Array<{ id: string; d: number }> = persons
    .filter((p) => (parentMap.get(p.id)?.length ?? 0) === 0)
    .map((p) => ({ id: p.id, d: 0 }));

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (depth.has(item.id)) continue;
    depth.set(item.id, item.d);
    childrenMap.get(item.id)?.forEach((c) => queue.push({ id: c, d: item.d + 1 }));
  }
  // Assign depth 0 to disconnected nodes
  persons.forEach((p) => { if (!depth.has(p.id)) depth.set(p.id, 0); });

  const NODE_W = 180;
  const GAP_X = 56;
  const GAP_Y = 160;

  const positions = new Map<string, { x: number; y: number }>();
  let leafCounter = 0;

  function place(id: string): number {
    if (positions.has(id)) return positions.get(id)!.x;
    const d = depth.get(id) ?? 0;
    const children = childrenMap.get(id) ?? [];

    if (children.length === 0) {
      const x = leafCounter * (NODE_W + GAP_X);
      leafCounter++;
      positions.set(id, { x, y: d * GAP_Y });
      return x;
    }

    // Recurse children first, then center parent above them
    const xs = children.map((c) => place(c));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    positions.set(id, { x, y: d * GAP_Y });
    return x;
  }

  // Place all roots
  persons
    .filter((p) => (parentMap.get(p.id)?.length ?? 0) === 0)
    .forEach((r) => place(r.id));

  // Fallback for any remaining unpositioned nodes
  persons.forEach((p) => {
    if (!positions.has(p.id)) {
      positions.set(p.id, { x: leafCounter * (NODE_W + GAP_X), y: 0 });
      leafCounter++;
    }
  });

  return positions;
}

// ─── Add-person quick form (floating panel) ───────────────────────────────────

function AddPersonPanel({
  familyId,
  onDone,
  onCancel,
}: {
  familyId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setErr("الاسم مطلوب"); return; }
    setErr("");
    startTransition(async () => {
      const r = await createPerson({ familyId, fullName: fullName.trim(), gender, isLiving: true, visibilityLevel: "PUBLIC" });
      if (r.success) { onDone(); router.refresh(); }
      else setErr(r.error ?? "حدث خطأ");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border/60 rounded-xl shadow-xl p-4 w-64 space-y-3"
      dir="rtl"
    >
      <h4 className="text-sm font-semibold text-foreground">إضافة شخص</h4>
      <input
        ref={inputRef}
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="الاسم الكامل"
        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-secondary/30 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
      />
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="radio" checked={gender === "MALE"} onChange={() => setGender("MALE")} className="w-3 h-3" />
          ذكر
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="radio" checked={gender === "FEMALE"} onChange={() => setGender("FEMALE")} className="w-3 h-3" />
          أنثى
        </label>
      </div>
      {err && <p className="text-[10px] text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 text-xs py-1.5 rounded-lg bg-primary/25 hover:bg-primary/35 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "إضافة"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-xs py-1.5 px-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FamilyTree({
  persons,
  relations,
  marriages = [],
  canManage = false,
  familyId = "",
  linkedPersons = [],
  linkedFamilies = [],
}: Props) {
  const positions = useMemo(() => buildLayout(persons, relations), [persons, relations]);
  const [activeLinkedFamilyId, setActiveLinkedFamilyId] = useState<string | null>(null);

  const personIdsSet = useMemo(() => new Set(persons.map((person) => person.id)), [persons]);
  const linkedPersonById = useMemo(
    () => new Map(linkedPersons.map((person) => [person.id, person] as [string, PersonData])),
    [linkedPersons]
  );
  const linkedFamilyByFamilyId = useMemo(
    () => new Map(linkedFamilies.map((family) => [family.familyId, family] as [string, LinkedFamilyInfo])),
    [linkedFamilies]
  );
  const linkedBadgesByPerson = useMemo(() => {
    const map = new Map<string, LinkedFamilyBadge[]>();
    const seen = new Set<string>();

    marriages.forEach((marriage) => {
      const linkedA = linkedPersonById.get(marriage.personAId);
      const linkedB = linkedPersonById.get(marriage.personBId);
      const currentPersonId = linkedA ? marriage.personBId : linkedB ? marriage.personAId : null;
      const linkedSpouse = linkedA ?? linkedB;

      if (!currentPersonId || !linkedSpouse?.sourceFamilyId || !personIdsSet.has(currentPersonId)) return;

      const familyInfo = linkedFamilyByFamilyId.get(linkedSpouse.sourceFamilyId);
      const key = `${currentPersonId}:${linkedSpouse.sourceFamilyId}:${linkedSpouse.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const badge: LinkedFamilyBadge = {
        familyId: linkedSpouse.sourceFamilyId,
        name: familyInfo?.name ?? linkedSpouse.sourceFamilyName ?? "",
        slug: familyInfo?.slug ?? linkedSpouse.sourceFamilySlug ?? "",
        linkType: familyInfo?.linkType ?? "IN_LAW",
        spouseName: linkedSpouse.fullName,
      };

      map.set(currentPersonId, [...(map.get(currentPersonId) ?? []), badge]);
    });

    return map;
  }, [linkedFamilyByFamilyId, linkedPersonById, marriages, personIdsSet]);

  const linkedConnectionCounts = useMemo(() => {
    const familyToPersons = new Map<string, Set<string>>();

    linkedBadgesByPerson.forEach((badges, personId) => {
      badges.forEach((badge) => {
        const people = familyToPersons.get(badge.familyId) ?? new Set<string>();
        people.add(personId);
        familyToPersons.set(badge.familyId, people);
      });
    });

    return Object.fromEntries(
      Array.from(familyToPersons.entries()).map(([familyId, people]) => [familyId, people.size])
    );
  }, [linkedBadgesByPerson]);

  const buildNodes = useCallback(
    (): FamilyTreeNode[] =>
      persons.map((p) => {
        const badges = linkedBadgesByPerson.get(p.id) ?? [];
        const isHighlighted = !!activeLinkedFamilyId && badges.some((badge) => badge.familyId === activeLinkedFamilyId);
        const isDimmed = !!activeLinkedFamilyId && !isHighlighted;

        return {
          id: p.id,
          type: "person",
          position: positions.get(p.id) ?? { x: 0, y: 0 },
          data: {
            ...p,
            linkedFamilyBadges: badges,
            isHighlighted,
            isDimmed,
          } as FlowPersonData,
        };
      }),
    [activeLinkedFamilyId, linkedBadgesByPerson, persons, positions]
  );

  const buildEdges = useCallback((): Edge[] => {
    const pcEdges: Edge[] = relations.map(({ parentId, childId }, i) => ({
      id: `e-pc-${i}`,
      source: parentId,
      target: childId,
      type: "smoothstep",
      style: { stroke: "hsl(145 35% 32%)", strokeWidth: 1.5, opacity: 0.7 },
    }));
    const mEdges: Edge[] = marriages
      .filter((m) => personIdsSet.has(m.personAId) && personIdsSet.has(m.personBId))
      .map((m) => ({
        id: `e-m-${m.id}`,
        source: m.personAId,
        target: m.personBId,
        type: "straight",
        style: { stroke: "hsl(350 70% 60%)", strokeWidth: 1.5, strokeDasharray: "5 4", opacity: 0.8 },
        label: "♥",
        labelStyle: { fill: "hsl(350 70% 60%)", fontSize: 10 },
        labelBgStyle: { fill: "transparent" },
      }));
    return [...pcEdges, ...mEdges];
  }, [relations, marriages, personIdsSet]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeNode>(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // Sync when server re-renders with new data
  const dataKey = useMemo(
    () =>
      persons.map((p) => p.id).sort().join(",") +
      "|" +
      relations.length +
      "|" +
      marriages.length +
      "|" +
      (activeLinkedFamilyId ?? ""),
    [activeLinkedFamilyId, persons, relations, marriages]
  );
  const prevKeyRef = useRef(dataKey);
  useEffect(() => {
    if (dataKey !== prevKeyRef.current) {
      prevKeyRef.current = dataKey;
      setNodes(buildNodes());
      setEdges(buildEdges());
    }
  }, [dataKey, buildNodes, buildEdges, setNodes, setEdges]);

  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FamilyTreeNode) => {
      setSelectedPerson(node.data);
      setShowAddPanel(false);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedPerson(null);
  }, []);

  return (
    <div className="w-full h-full flex">
      {selectedPerson && (
        <button
          type="button"
          aria-label={closePersonDetailsLabel}
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setSelectedPerson(null)}
        />
      )}

      {/* ── Sidebar ── */}
      {selectedPerson && (
        <PersonSidebar
          key={selectedPerson.id}
          person={selectedPerson}
          allPersons={persons}
          linkedPersons={linkedPersons}
          relations={relations}
          marriages={marriages}
          canManage={canManage}
          familyId={familyId}
          onClose={() => setSelectedPerson(null)}
          onPersonSelect={(id) => {
            const p = persons.find((p) => p.id === id);
            if (p) setSelectedPerson(p);
          }}
        />
      )}

      {/* ── Tree canvas ── */}
      <div className="flex-1 min-w-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(150 12% 22%)"
          />
          <Controls
            className="!hidden md:!block !bg-card/80 !border-border/60 !rounded-lg"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-card/80 !border-border/60 !rounded-lg"
            nodeColor={(n) => {
              const d = n.data as unknown as PersonData;
              return d?.gender === "MALE" ? "hsl(210 60% 40%)" : "hsl(350 55% 48%)";
            }}
            maskColor="hsl(160 20% 8% / 0.6)"
          />

          {/* Linked families panel */}
          {linkedFamilies.length > 0 && (
            <LinkedFamiliesPanel
              linkedFamilies={linkedFamilies}
              activeFamilyId={activeLinkedFamilyId}
              connectionCounts={linkedConnectionCounts}
              onFamilyToggle={setActiveLinkedFamilyId}
            />
          )}

          {/* Floating "Add Person" button */}
          {canManage && (
            <Panel position="top-right">
              {showAddPanel ? (
                <AddPersonPanel
                  familyId={familyId}
                  onDone={() => setShowAddPanel(false)}
                  onCancel={() => setShowAddPanel(false)}
                />
              ) : (
                <button
                  onClick={() => { setShowAddPanel(true); setSelectedPerson(null); }}
                  className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-card border border-border/60 hover:border-border px-3 py-2 rounded-lg shadow-md transition-all"
                  dir="rtl"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  إضافة شخص
                </button>
              )}
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
