"use client";

import { useState } from "react";
import { Panel } from "@xyflow/react";
import { ExternalLink, Link2, TreePine, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LinkedFamilyInfo {
  id: string;
  familyId: string;
  name: string;
  slug: string;
  linkType: "KINSHIP" | "IN_LAW";
}

interface LinkedFamiliesPanelProps {
  linkedFamilies: LinkedFamilyInfo[];
  activeFamilyId: string | null;
  connectionCounts: Record<string, number>;
  onFamilyToggle: (familyId: string | null) => void;
}

const labels = {
  title:
    "\u0639\u0627\u0626\u0644\u0627\u062a \u0645\u0631\u062a\u0628\u0637\u0629",
  kinship: "\u0646\u0633\u0628",
  inLaw: "\u0645\u0635\u0627\u0647\u0631\u0629",
  showAll:
    "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
  collapse:
    "\u0637\u064a \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  clear:
    "\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u0638\u0644\u064a\u0644",
  connectedPersons:
    "\u0634\u062e\u0635 \u0645\u0631\u062a\u0628\u0637",
  openFamily:
    "\u0641\u062a\u062d \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  moreFamily:
    "\u0639\u0627\u0626\u0644\u0629 \u0623\u062e\u0631\u0649",
};

const linkLabels: Record<LinkedFamilyInfo["linkType"], string> = {
  KINSHIP: labels.kinship,
  IN_LAW: labels.inLaw,
};

const linkColors: Record<LinkedFamilyInfo["linkType"], string> = {
  KINSHIP: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  IN_LAW: "text-amber-400 bg-amber-400/10 border-amber-400/30",
};

const collapsedCount = 3;

export function LinkedFamiliesPanel({
  linkedFamilies,
  activeFamilyId,
  connectionCounts,
  onFamilyToggle,
}: LinkedFamiliesPanelProps) {
  const [expanded, setExpanded] = useState(linkedFamilies.length <= collapsedCount);

  if (linkedFamilies.length === 0) return null;

  const visible = expanded ? linkedFamilies : linkedFamilies.slice(0, collapsedCount);
  const remaining = linkedFamilies.length - collapsedCount;

  return (
    <Panel position="bottom-left">
      <div
        className="w-64 rounded-lg border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-sm"
        dir="rtl"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Link2 className="h-3 w-3" />
            {labels.title}
          </span>
          <div className="flex items-center gap-1">
            {activeFamilyId && (
              <button
                type="button"
                onClick={() => onFamilyToggle(null)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label={labels.clear}
                title={labels.clear}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {linkedFamilies.length > collapsedCount && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label={expanded ? labels.collapse : labels.showAll}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          {visible.map((family) => {
            const count = connectionCounts[family.familyId] ?? 0;
            const isActive = activeFamilyId === family.familyId;
            return (
              <div
                key={family.id}
                className={cn(
                  "flex items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 transition-colors",
                  isActive ? "border-accent/40 bg-accent/10" : "hover:bg-secondary/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onFamilyToggle(isActive ? null : family.familyId)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-right"
                >
                  <TreePine className="h-3.5 w-3.5 shrink-0 text-accent/70" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-foreground/90">{family.name}</span>
                    {count > 0 && (
                      <span className="block text-[10px] text-muted-foreground">
                        {count} {labels.connectedPersons}
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${linkColors[family.linkType]}`}>
                    {linkLabels[family.linkType]}
                  </span>
                </button>
                <Link
                  href={`/family/${encodeURIComponent(family.slug)}`}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-accent"
                  title={labels.openFamily}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}

          {!expanded && remaining > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full rounded py-1 text-center text-[10px] text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
            >
              +{remaining} {labels.moreFamily}
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
