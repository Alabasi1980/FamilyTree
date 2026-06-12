"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
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
  type ReactFlowInstance,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Network } from "lucide-react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { PersonNode } from "./person-node";
import { PersonSidebar, type PersonData, type Relation, type Marriage } from "./person-sidebar";
import { type LinkedFamilyInfo } from "./linked-families-panel";
import { TreeToolbar, type TreeFilters } from "./tree-toolbar";
import { LinkedFamiliesBar } from "./linked-families-bar";
import { createPerson } from "@/lib/actions/persons";
import { buildLayout, NODE_W, NODE_H } from "./layout";

type FlowPersonData = PersonData & Record<string, unknown>;
type FamilyTreeNode = Node<FlowPersonData, "person">;
type LinkedFamilyBadge = {
  familyId: string; name: string; slug: string;
  linkType: "KINSHIP" | "IN_LAW"; spouseName: string;
};

export type { PersonData, Relation, Marriage, LinkedFamilyInfo };

const BG_MODES: Array<BackgroundVariant | null> = [
  BackgroundVariant.Dots, BackgroundVariant.Lines,
  BackgroundVariant.Cross, null,
];

interface Props {
  persons: PersonData[];
  relations: Relation[];
  marriages?: Marriage[];
  canManage?: boolean;
  isSystemAdmin?: boolean;
  isLoggedIn?: boolean;
  userLinkedPersonId?: string | null;
  familyId?: string;
  familySlug?: string;
  linkedPersons?: PersonData[];
  linkedFamilies?: LinkedFamilyInfo[];
  hasLinkedFamilies?: boolean;
  defaultSelectedPersonId?: string;
}

const nodeTypes = { person: PersonNode };
const closePersonDetailsLabel = "إغلاق تفاصيل الشخص";

// ─── Quick-add panel ──────────────────────────────────────────────────────────
function AddPersonPanel({ familyId, onDone, onCancel }: { familyId: string; onDone: () => void; onCancel: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [isPending, setIsPending] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setErr("الاسم مطلوب"); return; }
    setErr(""); setIsPending(true);
    const r = await createPerson({ familyId, fullName: fullName.trim(), gender, isLiving: true });
    setIsPending(false);
    if (r.success) { onDone(); router.refresh(); }
    else setErr(r.error ?? "حدث خطأ");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/60 rounded-xl shadow-xl p-4 w-64 space-y-3" dir="rtl">
      <h4 className="text-sm font-semibold text-foreground">إضافة شخص</h4>
      <input ref={inputRef} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
        placeholder="الاسم الكامل"
        className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-secondary/30 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60" />
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
  persons, relations, marriages = [], canManage = false, isSystemAdmin = false,
  isLoggedIn = false, userLinkedPersonId = null,
  familyId = "", familySlug = "", linkedPersons = [], linkedFamilies = [],
  hasLinkedFamilies = false, defaultSelectedPersonId,
}: Props) {

  // ── layout (passes marriages for spouse-row fix) ─────────────────────────
  const [resetVersion, setResetVersion] = useState(0);
  const positions = useMemo(
    () => buildLayout(persons, relations, { marriages }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persons, relations, marriages, resetVersion]
  );
  const generationCount = useMemo(() => {
    const ys = new Set<number>();
    positions.forEach((p) => ys.add(Math.round(p.y / 10)));
    return ys.size;
  }, [positions]);

  // ── toolbar state ────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const rfRef = useRef<ReactFlowInstance<FamilyTreeNode, Edge> | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [bgIndex, setBgIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState<TreeFilters>({
    showDeceased: true, showFemales: true, showMarriageEdges: true,
  });
  const [ancestryMode, setAncestryMode] = useState(false);
  const [ancestryHighlightId, setAncestryHighlightId] = useState<string | null>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    function onFs() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ── ancestry computation ─────────────────────────────────────────────────
  const ancestorIds = useMemo(() => {
    if (!ancestryHighlightId) return null;
    const result = new Set<string>([ancestryHighlightId]);
    const queue = [ancestryHighlightId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      relations.filter((r) => r.childId === id).forEach((r) => {
        if (!result.has(r.parentId)) { result.add(r.parentId); queue.push(r.parentId); }
      });
    }
    return result;
  }, [ancestryHighlightId, relations]);

  // ── visible persons/edges (filters) ─────────────────────────────────────
  const visiblePersonIds = useMemo(() => new Set(
    persons.filter((p) => {
      if (!filters.showDeceased && !p.isLiving) return false;
      if (!filters.showFemales && p.gender === "FEMALE") return false;
      return true;
    }).map((p) => p.id)
  ), [persons, filters]);

  // ── linked family badges ─────────────────────────────────────────────────
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
    return Object.fromEntries(Array.from(familyToPersons.entries()).map(([fId, p]) => [fId, p.size]));
  }, [linkedBadgesByPerson]);

  // ── build nodes ──────────────────────────────────────────────────────────
  const buildNodes = useCallback((): FamilyTreeNode[] =>
    persons.map((p) => {
      const badges = linkedBadgesByPerson.get(p.id) ?? [];
      const isHighlighted = ancestorIds
        ? ancestorIds.has(p.id)
        : !!activeLinkedFamilyId && badges.some((b) => b.familyId === activeLinkedFamilyId);
      const isDimmed = ancestorIds
        ? !ancestorIds.has(p.id)
        : !!activeLinkedFamilyId && !isHighlighted;
      const hidden = !visiblePersonIds.has(p.id);
      return {
        id: p.id, type: "person",
        position: positions.get(p.id) ?? { x: 0, y: 0 },
        hidden,
        data: { ...p, linkedFamilyBadges: badges, isHighlighted, isDimmed } as FlowPersonData,
      };
    }),
    [activeLinkedFamilyId, ancestorIds, linkedBadgesByPerson, persons, positions, visiblePersonIds]
  );

  const buildEdges = useCallback((): Edge[] => {
    const pcEdges: Edge[] = relations
      .filter((r) => visiblePersonIds.has(r.parentId) && visiblePersonIds.has(r.childId))
      .map(({ parentId, childId }, i) => {
        const inAncestry = ancestorIds
          ? ancestorIds.has(parentId) && ancestorIds.has(childId)
          : null;
        return {
          id: `e-pc-${i}`, source: parentId, target: childId, type: "smoothstep",
          style: {
            stroke: inAncestry
              ? "hsl(45 90% 55%)"
              : "hsl(145 40% 38%)",
            strokeWidth: inAncestry ? 3 : 2,
            opacity: ancestorIds && !inAncestry ? 0.15 : 0.75,
            filter: `drop-shadow(0 0 3px ${inAncestry ? "hsl(45 90% 40% / 0.5)" : "hsl(145 40% 28% / 0.4)"})`,
          },
        };
      });

    const mEdges: Edge[] = !filters.showMarriageEdges ? [] :
      marriages
        .filter((m) => personIdsSet.has(m.personAId) && personIdsSet.has(m.personBId)
          && visiblePersonIds.has(m.personAId) && visiblePersonIds.has(m.personBId))
        .map((m) => ({
          id: `e-m-${m.id}`, source: m.personAId, target: m.personBId, type: "straight",
          style: {
            stroke: "hsl(338 65% 62%)", strokeWidth: 1.5,
            strokeDasharray: "6 3",
            opacity: ancestorIds ? 0.2 : 0.85,
            filter: "drop-shadow(0 0 4px hsl(338 65% 42% / 0.3))",
          },
          label: "♥", labelStyle: { fill: "hsl(338 65% 65%)", fontSize: 11, fontWeight: "bold" },
          labelBgStyle: { fill: "transparent" },
        }));
    return [...pcEdges, ...mEdges];
  }, [relations, marriages, personIdsSet, visiblePersonIds, ancestorIds, filters.showMarriageEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeNode>(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // Rebuild when data or UI state changes
  const dataKey = useMemo(() =>
    persons.map((p) => p.id).sort().join(",") + "|" +
    relations.length + "|" + marriages.length + "|" +
    (activeLinkedFamilyId ?? "") + "|" +
    (ancestryHighlightId ?? "") + "|" +
    `${filters.showDeceased}${filters.showFemales}${filters.showMarriageEdges}` + "|" +
    resetVersion,
    [activeLinkedFamilyId, ancestryHighlightId, filters, persons, relations, marriages, resetVersion]
  );
  const prevKeyRef = useRef(dataKey);
  useEffect(() => {
    if (dataKey !== prevKeyRef.current) {
      prevKeyRef.current = dataKey;
      setNodes(buildNodes());
      setEdges(buildEdges());
    }
  }, [dataKey, buildNodes, buildEdges, setNodes, setEdges]);

  // ── toolbar handlers ─────────────────────────────────────────────────────
  const handleFitView = useCallback(() =>
    rfRef.current?.fitView({ padding: 0.2, duration: 400 }), []);
  const handleZoomIn = useCallback(() =>
    rfRef.current?.zoomIn({ duration: 200 }), []);
  const handleZoomOut = useCallback(() =>
    rfRef.current?.zoomOut({ duration: 200 }), []);
  const handleResetLayout = useCallback(() => {
    setResetVersion((v) => v + 1);
    setAncestryHighlightId(null);
    setTimeout(() => rfRef.current?.fitView({ padding: 0.2, duration: 400 }), 80);
  }, []);
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);
  const handleCycleBackground = useCallback(() =>
    setBgIndex((i) => (i + 1) % BG_MODES.length), []);

  const handleFilterChange = useCallback((key: keyof TreeFilters, val: boolean) => {
    setFilters((f) => ({ ...f, [key]: val }));
  }, []);

  const handleToggleAncestryMode = useCallback(() => {
    setAncestryMode((v) => {
      if (v) setAncestryHighlightId(null);
      return !v;
    });
  }, []);

  // ── node selection ───────────────────────────────────────────────────────
  const initialSelectedPerson = useMemo(
    () =>
      defaultSelectedPersonId
        ? [...persons, ...linkedPersons].find((p) => p.id === defaultSelectedPersonId) ?? null
        : null,
    [defaultSelectedPersonId, persons, linkedPersons]
  );
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(initialSelectedPerson);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const handleSearchSelect = useCallback((personId: string) => {
    const pos = positions.get(personId);
    if (!pos || !rfRef.current) return;
    rfRef.current.setCenter(pos.x + NODE_W / 2, pos.y + NODE_H / 2, { zoom: 1.4, duration: 500 });
    const p = persons.find((p) => p.id === personId);
    if (p) setSelectedPerson(p);
  }, [positions, persons, setSelectedPerson]);

  const handleExportPng = useCallback(async () => {
    setExportingPng(true);
    try {
      await rfRef.current?.fitView({ padding: 0.1, duration: 0 });
      await new Promise((r) => setTimeout(r, 300));
      const el = containerRef.current?.querySelector(".react-flow") as HTMLElement | null;
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: "hsl(160 25% 5%)",
        pixelRatio: 2,
        filter: (node) => !node.classList?.contains("react-flow__minimap") &&
          !node.classList?.contains("react-flow__controls"),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `family-tree.png`;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExportingPng(false);
    }
  }, []);

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    try {
      await rfRef.current?.fitView({ padding: 0.1, duration: 0 });
      await new Promise((r) => setTimeout(r, 300));
      const el = containerRef.current?.querySelector(".react-flow") as HTMLElement | null;
      if (!el) { window.print(); return; }
      const dataUrl = await toPng(el, {
        backgroundColor: "hsl(160 25% 5%)",
        pixelRatio: 2,
        filter: (node) => !node.classList?.contains("react-flow__minimap") &&
          !node.classList?.contains("react-flow__controls"),
      });
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>شجرة العائلة</title>
        <style>body{margin:0;background:#000}img{max-width:100%;height:auto}
        @media print{@page{size:landscape}}</style></head>
        <body><img src="${dataUrl}" onload="window.print();window.close()"/></body></html>`);
      win.document.close();
    } catch (e) {
      console.error("Print failed", e);
      window.print();
    } finally {
      setPrinting(false);
    }
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: FamilyTreeNode) => {
    if (ancestryMode) {
      setAncestryHighlightId((prev) => prev === node.id ? null : node.id);
      return;
    }
    setSelectedPerson(node.data);
    setShowAddPanel(false);
  }, [ancestryMode, setSelectedPerson, setShowAddPanel]);

  const onPaneClick = useCallback(() => {
    if (ancestryMode) { setAncestryHighlightId(null); return; }
    setSelectedPerson(null);
  }, [ancestryMode, setSelectedPerson]);

  const bgVariant = BG_MODES[bgIndex];

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-background">
      <TreeToolbar
        personCount={persons.length}
        generationCount={generationCount}
        onFitView={handleFitView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetLayout={handleResetLayout}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleMinimap={() => setShowMinimap((v) => !v)}
        onToggleLegend={() => setShowLegend((v) => !v)}
        onCycleBackground={handleCycleBackground}
        showMinimap={showMinimap}
        showLegend={showLegend}
        isFullscreen={isFullscreen}
        persons={persons.map((p) => ({ id: p.id, fullName: p.fullName, gender: p.gender }))}
        onSearchSelect={handleSearchSelect}
        filters={filters}
        onFilterChange={handleFilterChange}
        ancestryMode={ancestryMode}
        onToggleAncestryMode={handleToggleAncestryMode}
        onExportPng={handleExportPng}
        onPrint={handlePrint}
        exportingPng={exportingPng}
        printing={printing}
      />

      <LinkedFamiliesBar
        linkedFamilies={linkedFamilies}
        activeFamilyId={activeLinkedFamilyId}
        connectionCounts={linkedConnectionCounts}
        onFamilyToggle={setActiveLinkedFamilyId}
        canManage={canManage}
        familyId={familyId}
        familySlug={familySlug}
        isSystemAdmin={isSystemAdmin}
      />

      <div className="flex flex-1 min-h-0">
        {/* Ancestry mode hint */}
        {ancestryMode && (
          <div className="pointer-events-none absolute inset-x-0 top-[42px] z-30 flex justify-center pt-3">
            <div className="rounded-full border border-amber-500/40 bg-amber-900/80 px-4 py-1.5 text-xs text-amber-300 backdrop-blur-sm shadow-lg">
              وضع النسب — انقر أي شخص لتمييز سلسلة أجداده
            </div>
          </div>
        )}

        {selectedPerson && (
          <button type="button" aria-label={closePersonDetailsLabel}
            className="fixed inset-0 z-40 bg-black/45 md:hidden"
            onClick={() => setSelectedPerson(null)} />
        )}
        {selectedPerson && (
          <PersonSidebar
            key={selectedPerson.id} person={selectedPerson} allPersons={persons}
            linkedPersons={linkedPersons} relations={relations} marriages={marriages}
            canManage={canManage} isLoggedIn={isLoggedIn}
            userLinkedPersonId={userLinkedPersonId} familyId={familyId}
            onClose={() => setSelectedPerson(null)}
            onPersonSelect={(id) => { const p = persons.find((p) => p.id === id); if (p) setSelectedPerson(p); }}
          />
        )}

        <div className="flex-1 min-w-0 relative">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            onInit={(instance) => { rfRef.current = instance; }}
            fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.1} maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            {bgVariant && (
              <Background variant={bgVariant} gap={28} size={1.2}
                color="hsl(150 15% 20%)" style={{ opacity: 0.5 }} />
            )}
            <Controls
              className="!hidden md:!flex !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !backdrop-blur-sm"
              showInteractive={false} />
            {showMinimap && (
              <MiniMap
                className="!hidden md:!block !bg-card/85 !border-border/50 !rounded-xl !shadow-lg !shadow-black/20 !overflow-hidden"
                nodeColor={(n) => {
                  const d = n.data as unknown as PersonData;
                  if (!d) return "hsl(145 35% 30%)";
                  return d.gender === "MALE" ? "hsl(210 55% 42%)" : "hsl(338 55% 48%)";
                }}
                nodeBorderRadius={6} maskColor="hsl(160 20% 6% / 0.65)"
              />
            )}

            {canManage && (
              <Panel position="top-right">
                <div dir="rtl" className="flex flex-col gap-2 items-end">
                  {showAddPanel ? (
                    <AddPersonPanel familyId={familyId}
                      onDone={() => setShowAddPanel(false)}
                      onCancel={() => setShowAddPanel(false)} />
                  ) : (
                    <button type="button"
                      onClick={() => { setShowAddPanel(true); setSelectedPerson(null); }}
                      className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-card/95 border border-accent/25 hover:border-accent/50 text-accent/80 hover:text-accent px-3 py-2 rounded-xl shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-150">
                      <UserPlus className="h-3.5 w-3.5" />إضافة شخص
                    </button>
                  )}
                  {hasLinkedFamilies && familySlug && (
                    <Link href={`/family/${encodeURIComponent(familySlug)}/network`}
                      className="flex items-center gap-1.5 text-xs bg-card/90 hover:bg-card/95 border border-primary/30 hover:border-primary/60 text-primary/80 hover:text-primary px-3 py-2 rounded-xl shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-150">
                      <Network className="h-3.5 w-3.5" />خريطة الشبكة
                    </Link>
                  )}
                </div>
              </Panel>
            )}

            {showLegend && (
              <Panel position="bottom-left">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 bg-background/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border/20" dir="rtl">
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-primary/60 rounded" />نسب</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-t border-dashed border-rose-500/60" />زواج</span>
                  {ancestryMode && (
                    <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-amber-400/80 rounded" />سلسلة النسب</span>
                  )}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
