"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface PersonData {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate: string | null;
  deathDate: string | null;
  [key: string]: unknown;
}

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const p = data as PersonData;
  const isMale = p.gender === "MALE";

  const birthYear = p.birthDate ? new Date(p.birthDate).getFullYear() : null;
  const deathYear = p.deathDate ? new Date(p.deathDate).getFullYear() : null;
  const age =
    birthYear && deathYear
      ? deathYear - birthYear
      : birthYear && p.isLiving
      ? new Date().getFullYear() - birthYear
      : null;

  const initials = p.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={`
        w-44 rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-150
        ${selected
          ? "shadow-lg shadow-accent/25 ring-2 ring-accent/60 scale-[1.04]"
          : "shadow-md shadow-black/20 hover:shadow-lg hover:scale-[1.02]"
        }
        ${!p.isLiving ? "opacity-80" : ""}
        bg-card border border-border/40
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary/70 !border-primary/50 !w-2 !h-2"
        style={{ top: -4 }}
      />

      {/* Gender colour bar */}
      <div
        className={`h-[3px] ${isMale ? "bg-blue-400/70" : "bg-rose-400/70"}`}
      />

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Avatar circle */}
        <div
          className={`
            w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
            ${isMale ? "bg-blue-500/15 text-blue-400" : "bg-rose-400/15 text-rose-400"}
            ${!p.isLiving ? "grayscale opacity-70" : ""}
          `}
        >
          {initials || "؟"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
            {p.fullName}
          </p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {birthYear ? (
              <span className="text-[10px] text-muted-foreground">
                {birthYear}
                {deathYear
                  ? ` — ${deathYear}`
                  : !p.isLiving
                  ? " — ?"
                  : ""}
              </span>
            ) : null}
            {age !== null && (
              <span className="text-[10px] text-muted-foreground/60">
                ({age})
              </span>
            )}
          </div>
          {!p.isLiving && (
            <span className="text-[9px] text-muted-foreground/50 italic">متوفى</span>
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

