"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Link2 } from "lucide-react";

interface LinkedFamilyBadge {
  familyId: string;
  name: string;
  slug: string;
  linkType: "KINSHIP" | "IN_LAW";
  spouseName: string;
}

interface PersonData {
  id: string;
  fullName: string;
  kunya?: string | null;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthYear?: number | null;
  birthDate: string | null;
  deathYear?: number | null;
  deathDate: string | null;
  profession?: string | null;
  photoUrl?: string | null;
  linkedFamilyBadges?: LinkedFamilyBadge[];
  isHighlighted?: boolean;
  isDimmed?: boolean;
  [key: string]: unknown;
}

const labels = {
  unknown: "\u061f",
  deceased: "\u0645\u062a\u0648\u0641\u0649",
  inLaw: "\u0645\u0635\u0627\u0647\u0631\u0629",
  kinship: "\u0646\u0633\u0628",
  linkedWith:
    "\u0645\u0631\u062a\u0628\u0637 \u0645\u0639",
  through:
    "\u0639\u0628\u0631",
};

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const p = data as PersonData;
  const isMale = p.gender === "MALE";

  const birthYear = p.birthYear ?? (p.birthDate ? new Date(p.birthDate).getFullYear() : null);
  const deathYear = p.deathYear ?? (p.deathDate ? new Date(p.deathDate).getFullYear() : null);
  const age =
    birthYear && deathYear
      ? deathYear - birthYear
      : birthYear && p.isLiving
      ? new Date().getFullYear() - birthYear
      : null;

  const initials = p.fullName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const linkedBadges = p.linkedFamilyBadges ?? [];
  const firstBadge = linkedBadges[0];

  return (
    <div
      className={`
        w-44 rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-150
        ${
          selected || p.isHighlighted
            ? "shadow-lg shadow-accent/25 ring-2 ring-accent/60 scale-[1.04]"
            : "shadow-md shadow-black/20 hover:shadow-lg hover:scale-[1.02]"
        }
        ${!p.isLiving ? "opacity-80" : ""}
        ${p.isDimmed ? "opacity-35 grayscale" : ""}
        bg-card border border-border/40
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/70 !border-primary/50 !w-2 !h-2" style={{ top: -4 }} />
      {/* Left/right handles for cross-family marriage bridge edges */}
      <Handle id="l" type="source" position={Position.Left}  className="!bg-amber-500/60 !border-amber-400/40 !w-1.5 !h-1.5" style={{ left: -3 }} />
      <Handle id="r" type="source" position={Position.Right} className="!bg-amber-500/60 !border-amber-400/40 !w-1.5 !h-1.5" style={{ right: -3 }} />

      <div className={`h-[3px] ${isMale ? "bg-blue-400/70" : "bg-rose-400/70"}`} />

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={`
            w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-sm font-bold
            ${isMale ? "bg-blue-500/15 text-blue-400" : "bg-rose-400/15 text-rose-400"}
            ${!p.isLiving ? "grayscale opacity-70" : ""}
          `}
        >
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials || labels.unknown
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
            {p.fullName}
          </p>
          {(p.kunya || p.profession) && (
            <p className="mt-0.5 truncate text-[9px] text-muted-foreground/70">
              {[p.kunya, p.profession].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {birthYear ? (
              <span className="text-[10px] text-muted-foreground">
                {birthYear}
                {deathYear ? ` - ${deathYear}` : !p.isLiving ? ` - ${labels.unknown}` : ""}
              </span>
            ) : null}
            {age !== null && (
              <span className="text-[10px] text-muted-foreground/60">({age})</span>
            )}
          </div>
          {!p.isLiving && (
            <span className="text-[9px] text-muted-foreground/50 italic">{labels.deceased}</span>
          )}
          {firstBadge && (
            <div
              className="mt-1 flex max-w-full items-center gap-1 rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-300"
              title={`${labels.linkedWith} ${firstBadge.name} ${labels.through} ${firstBadge.spouseName}`}
            >
              <Link2 className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                {firstBadge.linkType === "IN_LAW" ? labels.inLaw : labels.kinship}: {firstBadge.name}
              </span>
              {linkedBadges.length > 1 && (
                <span className="shrink-0 text-amber-200/70">+{linkedBadges.length - 1}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary/70 !border-primary/50 !w-2 !h-2"
        style={{ bottom: -4 }}
      />
    </div>
  );
});

PersonNode.displayName = "PersonNode";
