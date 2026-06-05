"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import {
  ChevronDown, ChevronUp, X, ExternalLink, Network,
  TreePine, Users, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ZONE_BORDER_COLORS } from "./network-layout";
import type { NetworkFamily } from "@/lib/network/get-family-network";

export interface EdgeFilterState {
  parentChild: boolean;
  marriageIntra: boolean;
  marriageCross: boolean;
  kinshipLink: boolean;
}

interface Props {
  families: NetworkFamily[];
  rootFamilyId: string;
  hiddenFamilyIds: Set<string>;
  edgeFilter: EdgeFilterState;
  focusPersonId: string | null;
  truncated: boolean;
  expandableFamilyIds: string[];
  onToggleFamily: (famId: string) => void;
  onEdgeFilterChange: (key: keyof EdgeFilterState, val: boolean) => void;
  onClearFocus: () => void;
  onExpandFamily: (famId: string) => void;
}

const EDGE_TYPES: { key: keyof EdgeFilterState; label: string; color: string; dash?: string }[] = [
  { key: "parentChild",    label: "نسب (أب/ابن)",      color: "hsl(145 40% 38%)" },
  { key: "marriageIntra",  label: "زواج داخلي",         color: "hsl(338 65% 62%)", dash: "6 3" },
  { key: "marriageCross",  label: "مصاهرة (بين عائلتين)", color: "hsl(45 90% 55%)", dash: "8 3 2 3" },
  { key: "kinshipLink",    label: "نسب عائلي (رابط)",   color: "hsl(210 70% 55%)" },
];

export function NetworkControls({
  families, rootFamilyId, hiddenFamilyIds, edgeFilter, focusPersonId, truncated,
  expandableFamilyIds, onToggleFamily, onEdgeFilterChange, onClearFocus, onExpandFamily,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Panel position="top-right">
      <div
        className="w-64 rounded-xl border border-border/60 bg-card/92 shadow-xl backdrop-blur-sm overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Network className="h-3.5 w-3.5 text-accent" />
            شبكة العائلات
          </span>
          <div className="flex items-center gap-1">
            {focusPersonId && (
              <button type="button" onClick={onClearFocus} title="إلغاء التركيز"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="button" onClick={() => setExpanded((v) => !v)}
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-2.5 space-y-3">

            {/* Focus indicator */}
            {focusPersonId && (
              <div className="rounded-lg bg-accent/10 border border-accent/25 px-2.5 py-1.5 text-[10px] text-accent flex items-center justify-between gap-2">
                <span>وضع التركيز: شبكة شخص</span>
                <button type="button" onClick={onClearFocus} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* Families list */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-1.5">العائلات</p>
              <div className="space-y-0.5">
                {families.map((fam, idx) => {
                  const isHidden = hiddenFamilyIds.has(fam.id);
                  const isRoot   = fam.id === rootFamilyId;
                  const borderColor = ZONE_BORDER_COLORS[idx % ZONE_BORDER_COLORS.length];
                  const canExpand = expandableFamilyIds.includes(fam.id);
                  return (
                    <div key={fam.id} className={cn(
                      "flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors",
                      isHidden ? "opacity-40" : "hover:bg-muted/30"
                    )}>
                      {/* Color swatch + toggle */}
                      <button type="button" onClick={() => !isRoot && onToggleFamily(fam.id)}
                        className={cn("flex-1 flex items-center gap-1.5 text-right min-w-0", isRoot ? "cursor-default" : "cursor-pointer")}>
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: borderColor }} />
                        <TreePine className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-foreground truncate min-w-0">
                          {isRoot && <span className="text-accent ml-1 text-[9px]">★</span>}
                          {fam.name}
                        </span>
                      </button>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />{fam.personCount}
                      </span>
                      <Link href={`/family/${encodeURIComponent(fam.slug)}`} target="_blank"
                        className="text-muted-foreground hover:text-accent transition-colors shrink-0" title="فتح شجرة العائلة">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {canExpand && (
                        <button type="button" onClick={() => onExpandFamily(fam.id)} title="توسيع العائلات المرتبطة"
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {truncated && (
                <p className="text-[10px] text-amber-400/70 px-1.5 mt-1.5 leading-snug">
                  تم الوصول للحد الأقصى (١٢ عائلة). استخدم أزرار التوسيع.
                </p>
              )}
            </div>

            {/* Edge type filters */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-1.5">أنواع العلاقات</p>
              <div className="space-y-1">
                {EDGE_TYPES.map((et) => (
                  <label key={et.key} className="flex items-center gap-2 px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={edgeFilter[et.key]}
                      onChange={(e) => onEdgeFilterChange(et.key, e.target.checked)}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="inline-flex items-center gap-0.5 shrink-0">
                        {et.dash ? (
                          <svg width="20" height="4" aria-hidden="true">
                            <line x1="0" y1="2" x2="20" y2="2" stroke={et.color} strokeWidth="2" strokeDasharray={et.dash} />
                          </svg>
                        ) : (
                          <span className="inline-block w-5 h-0.5 rounded" style={{ background: et.color }} />
                        )}
                      </span>
                      <span className="text-[11px] text-foreground/80 truncate">{et.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </Panel>
  );
}
