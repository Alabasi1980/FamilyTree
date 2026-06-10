"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Expand, Map as MapIcon,
  Palette, Tags, Search, GitBranch, Download, ImageIcon,
  Printer, Eye, Sparkles, X, Check,
  SlidersHorizontal, Loader2,
} from "lucide-react";

export interface TreeFilters {
  showDeceased: boolean;
  showFemales: boolean;
  showMarriageEdges: boolean;
}

export interface SearchPerson {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
}

export interface TreeToolbarProps {
  // stats
  personCount: number;
  generationCount: number;
  // view
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetLayout: () => void;
  onToggleFullscreen: () => void;
  onToggleMinimap: () => void;
  onToggleLegend: () => void;
  onCycleBackground: () => void;
  showMinimap: boolean;
  showLegend: boolean;
  isFullscreen: boolean;
  // search
  persons: SearchPerson[];
  onSearchSelect: (id: string) => void;
  // filters
  filters: TreeFilters;
  onFilterChange: (key: keyof TreeFilters, val: boolean) => void;
  // ancestry
  ancestryMode: boolean;
  onToggleAncestryMode: () => void;
  // export
  onExportPng: () => Promise<void>;
  onPrint: () => Promise<void>;
  exportingPng: boolean;
  printing: boolean;
}

export function TreeToolbar(props: TreeToolbarProps) {
  const {
    personCount, generationCount,
    onFitView, onZoomIn, onZoomOut, onResetLayout, onToggleFullscreen,
    onToggleMinimap, onToggleLegend, onCycleBackground,
    showMinimap, showLegend, isFullscreen,
    persons, onSearchSelect,
    filters, onFilterChange,
    ancestryMode, onToggleAncestryMode,
    onExportPng, onPrint, exportingPng, printing,
  } = props;

  const activeFilterCount = [
    !filters.showDeceased, !filters.showFemales, !filters.showMarriageEdges,
  ].filter(Boolean).length;

  return (
    <div
      dir="rtl"
      className="flex items-center gap-1 overflow-x-auto border-b border-border/40 bg-card/60 px-2 py-1.5 backdrop-blur-sm"
    >
      {/* Stats */}
      <div className="flex shrink-0 items-center gap-2 rounded-lg bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground">
        <Eye className="h-3 w-3 text-accent/70" />
        <span>{personCount} فرد</span>
        <span className="text-border/60">·</span>
        <span>{generationCount} جيل</span>
      </div>

      <Divider />

      {/* View controls */}
      <Group>
        <Btn icon={<Maximize2 className="h-4 w-4" />} label="ملاءمة العرض" onClick={onFitView} />
        <Btn icon={<ZoomIn className="h-4 w-4" />} label="تكبير" onClick={onZoomIn} />
        <Btn icon={<ZoomOut className="h-4 w-4" />} label="تصغير" onClick={onZoomOut} />
        <Btn icon={<RotateCcw className="h-4 w-4" />} label="إعادة الترتيب التلقائي" onClick={onResetLayout} />
        <Btn
          icon={<Expand className="h-4 w-4" />}
          label={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
          onClick={onToggleFullscreen}
          active={isFullscreen}
        />
      </Group>

      <Divider />

      {/* Display toggles */}
      <Group>
        <Btn icon={<MapIcon className="h-4 w-4" />} label="الخريطة المصغّرة" onClick={onToggleMinimap} active={showMinimap} />
        <Btn icon={<Tags className="h-4 w-4" />} label="مفتاح الألوان" onClick={onToggleLegend} active={showLegend} />
        <Btn icon={<Palette className="h-4 w-4" />} label="نمط الخلفية (دورة)" onClick={onCycleBackground} />
      </Group>

      <Divider />

      {/* Search */}
      <SearchBox persons={persons} onSelect={onSearchSelect} />

      <Divider />

      {/* Ancestry mode */}
      <Btn
        icon={<GitBranch className="h-4 w-4" />}
        label={ancestryMode ? "إلغاء تمييز سلسلة النسب" : "تمييز سلسلة النسب — انقر شخصاً"}
        onClick={onToggleAncestryMode}
        active={ancestryMode}
        accent={ancestryMode}
      />

      <Divider />

      {/* Filters */}
      <FiltersMenu filters={filters} onChange={onFilterChange} count={activeFilterCount} />

      <Divider />


      {/* Export */}
      <ExportMenu
        onExportPng={onExportPng}
        onPrint={onPrint}
        exportingPng={exportingPng}
        printing={printing}
      />
    </div>
  );
}

// ── Search component ──────────────────────────────────────────────────────────

// ── Portal helpers (fixes overflow-x:auto clipping) ──────────────────────────

/**
 * Fixed-positioned portal dropdown.
 * `elRef` must be the same ref passed to usePortalDropdown so the
 * outside-click handler knows not to close when clicking inside the portal.
 */
function PortalDropdown({ top, left, children, minWidth = 180, elRef }: {
  top: number; left: number; children: React.ReactNode;
  minWidth?: number; elRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    if (!elRef.current) return;
    elRef.current.style.top = `${top}px`;
    elRef.current.style.left = `${left}px`;
    elRef.current.style.minWidth = `${minWidth}px`;
  }, [top, left, minWidth, elRef]);
  return typeof window !== "undefined"
    ? createPortal(
        <div ref={elRef} dir="rtl" className="fixed z-[9999]">{children}</div>,
        document.body
      )
    : null;
}

function usePortalDropdown() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  // ref forwarded to the portal element — lets us detect inside-portal clicks
  const dropRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((v) => !v);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      // Close only when click is outside BOTH the trigger button AND the portal
      if (!btnRef.current?.contains(t) && !dropRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return { open, setOpen, toggle, pos, btnRef, dropRef };
}

// ── Search box ────────────────────────────────────────────────────────────────

function SearchBox({
  persons, onSelect,
}: { persons: SearchPerson[]; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length >= 1
    ? persons.filter((p) => p.fullName.includes(query.trim())).slice(0, 6)
    : [];

  useEffect(() => {
    if (!open || !showInput || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left });
  }, [open, showInput, query]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleSelect(id: string) {
    onSelect(id);
    setQuery("");
    setOpen(false);
    setShowInput(false);
  }

  if (!showInput) {
    return (
      <button
        type="button"
        onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        title="بحث في الشجرة"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">بحث</span>
      </button>
    );
  }

  const showDropdown = open && (results.length > 0 || query.trim().length > 0);

  return (
    <div ref={wrapRef} className="relative flex shrink-0 items-center gap-1">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="ابحث باسم..."
        className="h-7 w-36 rounded-lg border border-input bg-background/70 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        onKeyDown={(e) => {
          if (e.key === "Escape") { setShowInput(false); setQuery(""); setOpen(false); }
          if (e.key === "Enter" && results[0]) handleSelect(results[0].id);
        }}
      />
      <button
        type="button"
        onClick={() => { setShowInput(false); setQuery(""); setOpen(false); }}
        className="text-muted-foreground hover:text-foreground"
        aria-label="إغلاق البحث"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {showDropdown && (
        <PortalDropdown top={dropPos.top} left={dropPos.left} minWidth={176} elRef={dropRef}>
          <div className="rounded-lg border border-border/50 bg-card p-1 shadow-2xl">
          {results.length > 0
            ? results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-right text-xs hover:bg-muted/40
                    ${p.gender === "FEMALE" ? "text-rose-300" : "text-sky-300"}`}
                >
                  <span className="h-4 w-4 shrink-0 rounded-full border text-[9px] flex items-center justify-center border-current bg-current/10">
                    {p.fullName[0]}
                  </span>
                  {p.fullName}
                </button>
              ))
            : <p className="px-2.5 py-2 text-xs text-muted-foreground">لا توجد نتائج</p>
          }
          </div>
        </PortalDropdown>
      )}
    </div>
  );
}

// ── Filters dropdown ──────────────────────────────────────────────────────────

function FiltersMenu({
  filters, onChange, count,
}: { filters: TreeFilters; onChange: (k: keyof TreeFilters, v: boolean) => void; count: number }) {
  const { open, toggle, pos, btnRef, dropRef } = usePortalDropdown();

  const items: Array<{ key: keyof TreeFilters; label: string; desc: string }> = [
    { key: "showDeceased", label: "المتوفّون", desc: "عرض أفراد العائلة المتوفّين" },
    { key: "showFemales", label: "الإناث", desc: "عرض الأعضاء الإناث" },
    { key: "showMarriageEdges", label: "خطوط الزواج", desc: "عرض الروابط الزوجية" },
  ];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="خيارات الفلترة"
        className={`relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors
          ${count > 0 ? "bg-amber-900/20 text-amber-400" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">عرض</span>
        {count > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
            {count}
          </span>
        )}
      </button>

      {open && (
        <PortalDropdown top={pos.top} left={pos.left} minWidth={208} elRef={dropRef}>
          <div className="rounded-lg border border-border/50 bg-card p-2 shadow-2xl">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            خيارات العرض
          </p>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key, !filters[item.key])}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-right text-xs transition-colors hover:bg-muted/30"
            >
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-muted-foreground/60">{item.desc}</p>
              </div>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors
                ${filters[item.key] ? "border-accent bg-accent text-background" : "border-border/50"}`}>
                {filters[item.key] && <Check className="h-3 w-3" />}
              </div>
            </button>
          ))}
          </div>
        </PortalDropdown>
      )}
    </>
  );
}

// ── Export dropdown ───────────────────────────────────────────────────────────

function ExportMenu({
  onExportPng, onPrint, exportingPng, printing,
}: {
  onExportPng: () => Promise<void>;
  onPrint: () => Promise<void>;
  exportingPng: boolean;
  printing: boolean;
}) {
  const { open, toggle, pos, btnRef, dropRef } = usePortalDropdown();
  const busy = exportingPng || printing;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="تصدير وطباعة"
        disabled={busy}
        className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-40"
      >
        {busy
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Download className="h-4 w-4" />
        }
        <span className="hidden sm:inline">تصدير</span>
      </button>

      {open && (
        <PortalDropdown top={pos.top} left={pos.left} minWidth={176} elRef={dropRef}>
          <div className="rounded-lg border border-border/50 bg-card p-1.5 shadow-2xl space-y-0.5">
            <button
              type="button"
              onClick={() => { toggle(); onExportPng(); }}
              disabled={exportingPng}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-right transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              {exportingPng
                ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                : <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              }
              <div>
                <p className="font-medium text-foreground">تصدير PNG</p>
                <p className="text-muted-foreground/60">صورة بجودة عالية</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { toggle(); onPrint(); }}
              disabled={printing}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-right transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              {printing
                ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                : <Printer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              }
              <div>
                <p className="font-medium text-foreground">طباعة</p>
                <p className="text-muted-foreground/60">إرسال للطابعة</p>
              </div>
            </button>
            <button
              type="button"
              disabled
              title="قريباً"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-right opacity-40 cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">تصدير GEDCOM</p>
                <p className="text-amber-400/70">قريباً</p>
              </div>
            </button>
          </div>
        </PortalDropdown>
      )}
    </>
  );
}

// ── shared primitives ─────────────────────────────────────────────────────────

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border/40" />;
}

function Btn({
  icon, label, onClick, active, accent, disabled, soon,
}: {
  icon: React.ReactNode; label: string;
  onClick?: () => void | Promise<void>;
  active?: boolean; accent?: boolean; disabled?: boolean; soon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={soon || disabled ? undefined : onClick}
      disabled={disabled || soon}
      title={soon ? `${label} — قريباً` : label}
      aria-label={label}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors
        ${soon || disabled
          ? "cursor-not-allowed text-muted-foreground/25"
          : accent
            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
            : active
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
    >
      {icon}
      {soon && (
        <span className="absolute -left-0.5 -top-0.5">
          <Sparkles className="h-2.5 w-2.5 text-amber-400/70" />
        </span>
      )}
    </button>
  );
}
