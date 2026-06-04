"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { Link2, TreePine, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export interface LinkedFamilyInfo {
  /** FamilyLink record id */
  id: string;
  name: string;
  slug: string;
  linkType: "KINSHIP" | "IN_LAW";
}

const LINK_LABELS: Record<LinkedFamilyInfo["linkType"], string> = {
  KINSHIP: "نسب",
  IN_LAW: "مصاهرة",
};

const LINK_COLORS: Record<LinkedFamilyInfo["linkType"], string> = {
  KINSHIP: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  IN_LAW: "text-amber-400 bg-amber-400/10 border-amber-400/30",
};

const COLLAPSED_COUNT = 2;

export function LinkedFamiliesPanel({
  linkedFamilies,
}: {
  linkedFamilies: LinkedFamilyInfo[];
}) {
  const [expanded, setExpanded] = useState(linkedFamilies.length <= COLLAPSED_COUNT);

  if (linkedFamilies.length === 0) return null;

  const visible = expanded ? linkedFamilies : linkedFamilies.slice(0, COLLAPSED_COUNT);
  const remaining = linkedFamilies.length - COLLAPSED_COUNT;

  return (
    <Panel position="bottom-left">
      <div
        className="bg-card/90 border border-border/60 rounded-xl shadow-lg p-3 w-56 backdrop-blur-sm"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            عائلات مرتبطة
          </span>
          {linkedFamilies.length > COLLAPSED_COUNT && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={expanded ? "طي القائمة" : "عرض الكل"}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Family cards */}
        <div className="space-y-1">
          {visible.map((family) => (
            <Link
              key={family.id}
              href={`/family/${encodeURIComponent(family.slug)}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors group"
            >
              <TreePine className="h-3.5 w-3.5 text-accent/60 shrink-0" />
              <span className="flex-1 text-xs text-foreground/80 truncate group-hover:text-foreground transition-colors">
                {family.name}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${LINK_COLORS[family.linkType]}`}
              >
                {LINK_LABELS[family.linkType]}
              </span>
            </Link>
          ))}

          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center py-1 rounded hover:bg-secondary/40"
            >
              +{remaining} عائلة أخرى
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
