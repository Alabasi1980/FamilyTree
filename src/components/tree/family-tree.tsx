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
import { UserPlus, Loader2, Network } from "lucide-react";
import Link from "next/link";
import { PersonNode } from "./person-node";
import { PersonSidebar, type PersonData, type Relation, type Marriage } from "./person-sidebar";
import { LinkedFamiliesPanel, type LinkedFamilyInfo } from "./linked-families-panel";
import { createPerson } from "@/lib/actions/persons";
import { buildLayout } from "./layout";

type FlowPersonData = PersonData & Record<string, unknown>;
type FamilyTreeNode = Node<FlowPersonData, "person">;
type LinkedFamilyBadge = {
  familyId: string;
  name: string;
  slug: string;
  linkType: "KINSHIP" | "IN_LAW";
  spouseName: string;
};

export type { PersonData, Relation, Marriage, LinkedFamilyInfo };

interface Props {
  persons: PersonData[];
  relations: Relation[];
  marriages?: Marriage[];
  canManage?: boolean;
  familyId?: string;
  familySlug?: string;
  linkedPersons?: PersonData[];
  linkedFamilies?: LinkedFamilyInfo[];
  hasLinkedFamilies?: boolean;
}

const nodeTypes = { person: PersonNode };
const closePersonDetailsLabel = "إغلاق تفاصيل الشخص";

// ─── Add-person quick form ────────────────────────────────────────────────────

function AddPersonPanel({ familyId, onDone, onCancel }: { familyId: string; onDone: () => void; onCancel: () => void }) {
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
    <form onSubmit={handleSubmit} className="bg-card border border-border/60 rounded-xl shadow-xl p-4 w-64 space-y-3" dir="rtl">
      <h4 className="text-sm font-semibold text-foreground">إضافة شخص</h4>
      <input
        ref={inputRef} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
        placeholder="الاسم الكامل"
        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-secondary/30 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
      />
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={gender === "MALE"} onChange={() => setGender("MALE")} className="w-3 h-3" />ذكر</label>
        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={gender === "FEMALE"} onChange={() => setGender("FEMALE")} className="w-3 h-3" />أنثى</label>
      </div>
      {err && <p className="text-[10px] text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="flex-1 text-xs py-1.5 rounded-lg bg-primary/25 hover:bg-primary/35 transition-colors disabled:opacity-50 font-medium">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "إضافة"}
        </button>
        <button type="button" onClick={onCancel} disabled={isPending} className="text-xs py-1.5 px-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors">إلغاء</button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FamilyTree({
  persons, relations, marriages = [], canManage = false,
  familyId = "", familySlug = "", linkedPersons = [], linkedFamilies = [],
  hasLinkedFamilies = false,
}: Props) {
  const positions = useMemo(() => buildLayout(persons, relations), [persons, relations]);
  const [activeLinkedFamilyId, setActiveLinkedFamilyId] = useState<string | null>(null);

  const personIdsSet = useMemo(() => new Set(persons.map((p) => p.id)), [persons]);
  const linkedPersonById = useMemo(() => new Map(linkedPersons.map((p) => [p.id, p] as [string, PersonData])), [linkedPersons]);
  const linkedFamilyByFamilyId = useMemo(() => new Map(linkedFamilies.map((f) => [f.familyId, f] as [string, LinkedFamilyInfo])), [linkedFamilies]);

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
      map.set(currentPersonId, [...(map.get(currentPersonId) ?? []), {
        familyId: linkedSpouse.sourceFamilyId,
        name: familyInfo?.name ?? linkedSpouse.sourceFamilyName ?? "",
        slug: familyInfo?.slug ?? linkedSpouse.sourceFamilySlug ?? "",
        linkType: familyInfo?.linkType ?? "IN_LAW",
        spouseName: linkedSpouse.fullName,
      }]);
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
    return Object.fromEntries(Array.from(familyToPersons.entries()).map(([fId, people]) => [fId, people.size]));
  }, [linkedBadgesByPerson]);

  const buildNodes = useCallback((): FamilyTreeNode[] =>
    persons.map((p) => {
      const badges = linkedBadgesByPerson.get(p.id) ?? [];
      const isHighlighted = !!activeLinkedFamilyId && badges.some((b) => b.familyId === activeLinkedFamilyId);
      const isDimmed = !!activeLinkedFamilyId && !isHighlighted;
      return { id: p.id, type: "person", position: positions.get(p.id) ?? { x: 0, y: 0 }, data: { ...p, linkedFamilyBadges: badges, isHighlighted, isDimmed } as FlowPersonData };
    }),
    [activeLinkedFamilyId, linkedBadgesByPerson, persons, positions]
  );

  const buildEdges = useCallback((): Edge[] => {
    const pcEdges: Edge[] = relations.map(({ parentId, childId }, i) => ({
      id: `e-pc-${i}`, source: parentId, target: childId, type: "smoothstep",
      style: { stroke: "hsl(145 40% 38%)", strokeWidth: 2, opacity: 0.75, filter: "drop-shadow(0 0 3px hsl(145 40% 28% / 0.4))" },
    }));
    const mEdges: Edge[] = marriages
      .filter((m) => personIdsSet.has(m.personAId) && personIdsSet.has(m.personBId))
      .map((m) => ({
        id: `e-m-${m.id}`, source: m.personAId, target: m.personBId, type: "straight",
        style: { stroke: "hsl(338 65% 62%)", strokeWidth: 1.5, strokeDasharray: "6 3", opacity: 0.85, filter: "drop-shadow(0 0 4px hsl(338 65% 42% / 0.3))" },
        label: "♥", labelStyle: { fill: "hsl(338 65% 65%)", fontSize: 11, fontWeight: "bold" }, labelBgStyle: { fill: "transparent" },
      }));
    return [...pcEdges, ...mEdges];
  }, [relations, marriages, personIdsSet]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeNode>(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  const dataKey = useMemo(() =>
    persons.map((p) => p.id).sort().join(",") + "|" + relations.length + "|" + marriages.length + "|" + (activeLinkedFamilyId ?? ""),
    [activeLinkedFamilyId, persons, relations, marriages]
  );
  const prevKeyRef = useRef(dataKey);
  useEffect(() => {
    if (dataKey !== prevKeyRef.current) { prevKeyRef.current = dataKey; setNodes(buildNodes()); setEdges(buildEdges()); }
  }, [dataKey, buildNodes, buildEdges, setNodes, setEdges]);

  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const onNodeClick = useCallback((_: React.MouseEvent, node: FamilyTreeNode) => { setSelectedPerson(node.data); setShowAddPanel(false); }, []);
  const onPaneClick = useCallback(() => { setSelectedPerson(null); }, []);

  return (
    <div className="w-full h-full flex">
      {selectedPerson && (
        <button type="button" aria-label={closePersonDetailsLabel} className="fixed inset-0 z-40 bg-black/45 md:hidden" onClick={() => setSelectedPerson(null)} />
      )}

      {selectedPerson && (
        <PersonSidebar
          key={selectedPerson.id} person={selectedPerson} allPersons={persons}
          linkedPersons={linkedPersons} relations={relations} marriages={marriages}
          canManage={canManage} familyId={familyId}
          onClose={() => setSelectedPerson(null)}
          onPersonSelect={(id) => { const p = persons.find((p) => p.id === id); if (p) setSelectedPerson(p); }}
        />
      )}

      <div className="flex-1 min-w-0 relative">
        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.15} maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color="hsl(150 15% 20%)" style={{ opacity: 0.5 }} />
          <Controls className="!hidden md:!flex !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !backdrop-blur-sm" showInteractive={false} />
          <MiniMap
            className="!hidden md:!block !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !overflow-hidden"
            nodeColor={(n) => { const d = n.data as unknown as PersonData; if (!d) return "hsl(145 35% 30%)"; return d.gender === "MALE" ? "hsl(210 55% 42%)" : "hsl(338 55% 48%)"; }}
            nodeBorderRadius={6} maskColor="hsl(160 20% 6% / 0.65)"
          />

          {linkedFamilies.length > 0 && (
            <LinkedFamiliesPanel linkedFamilies={linkedFamilies} activeFamilyId={activeLinkedFamilyId} connectionCounts={linkedConnectionCounts} onFamilyToggle={setActiveLinkedFamilyId} />
          )}

          {canManage && (
            <Panel position="top-right">
              <div dir="rtl" className="flex flex-col gap-2 items-end">
                {showAddPanel ? (
                  <AddPersonPanel familyId={familyId} onDone={() => setShowAddPanel(false)} onCancel={() => setShowAddPanel(false)} />
                ) : (
                  <button type="button" onClick={() => { setShowAddPanel(true); setSelectedPerson(null); }}
                    className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-card/95 border border-accent/25 hover:border-accent/50 text-accent/80 hover:text-accent px-3 py-2 rounded-xl shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-150">
                    <UserPlus className="h-3.5 w-3.5" />إضافة شخص
                  </button>
                )}
                {/* زر خريطة الشبكة */}
                {hasLinkedFamilies && familySlug && (
                  <Link href={`/family/${encodeURIComponent(familySlug)}/network`}
                    className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-card/95 border border-primary/30 hover:border-primary/60 text-primary/80 hover:text-primary px-3 py-2 rounded-xl shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-150">
                    <Network className="h-3.5 w-3.5" />خريطة الشبكة
                  </Link>
                )}
              </div>
            </Panel>
          )}

          {/* مفتاح الألوان */}
          <Panel position="bottom-left">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 bg-background/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border/20" dir="rtl">
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-primary/60 rounded" />نسب</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-t border-dashed border-rose-500/60" />زواج</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
