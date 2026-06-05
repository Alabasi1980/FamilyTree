"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import Link from "next/link";
import { ExternalLink, TreePine } from "lucide-react";
import { ZONE_COLORS, ZONE_BORDER_COLORS } from "./network-layout";

// ─── ZoneBackground ───────────────────────────────────────────────────────────
// A non-interactive translucent coloured rect rendered behind person nodes.

export interface ZoneBackgroundData extends Record<string, unknown> {
  familyId: string;
  familyName: string;
  colorIndex: number;
  isRoot: boolean;
  width: number;
  height: number;
}

export const ZoneBackgroundNode = memo(({ data }: NodeProps) => {
  const d = data as ZoneBackgroundData;
  const bg     = ZONE_COLORS[d.colorIndex % ZONE_COLORS.length];
  const border = ZONE_BORDER_COLORS[d.colorIndex % ZONE_BORDER_COLORS.length];

  return (
    <div
      className="rounded-2xl pointer-events-none"
      style={{
        width:  d.width,
        height: d.height,
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: d.isRoot
          ? `0 0 0 2px ${border}, inset 0 0 60px hsl(145 35% 8% / 0.4)`
          : "inset 0 0 40px hsl(0 0% 0% / 0.25)",
      }}
    />
  );
});
ZoneBackgroundNode.displayName = "ZoneBackgroundNode";

// ─── FamilyHeader ─────────────────────────────────────────────────────────────
// Shown at the top of each zone — also serves as the anchor node for
// KINSHIP family-link edges.

export interface FamilyHeaderData extends Record<string, unknown> {
  familyId: string;
  familyName: string;
  familySlug: string;
  personCount: number;
  colorIndex: number;
  isRoot: boolean;
  zoneWidth: number;
}

export const FamilyHeaderNode = memo(({ data }: NodeProps) => {
  const d      = data as FamilyHeaderData;
  const border = ZONE_BORDER_COLORS[d.colorIndex % ZONE_BORDER_COLORS.length];

  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
      style={{
        width: Math.max(d.zoneWidth - 32, 160),
        background: "hsl(0 0% 0% / 0.35)",
        border: `1px solid ${border}`,
        backdropFilter: "blur(4px)",
      }}
      dir="rtl"
    >
      <div className="flex items-center gap-2 min-w-0">
        <TreePine className="h-3.5 w-3.5 shrink-0" style={{ color: border }} />
        <span className="text-xs font-bold text-foreground truncate">
          {d.isRoot && <span className="text-accent ml-1">★</span>}
          عائلة {d.familyName}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground">{d.personCount} فرد</span>
        <Link
          href={`/family/${encodeURIComponent(d.familySlug)}`}
          target="_blank"
          className="text-muted-foreground hover:text-accent transition-colors"
          title="فتح شجرة العائلة"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
});
FamilyHeaderNode.displayName = "FamilyHeaderNode";
