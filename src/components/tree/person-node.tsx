"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { User, UserX } from "lucide-react";

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
  const person = data as PersonData;

  return (
    <div
      className={`
        w-36 rounded-xl border px-3 py-2.5 shadow-sm cursor-pointer transition-all select-none
        ${selected ? "border-accent shadow-accent/20 shadow-md" : "border-border/60"}
        ${person.isLiving
          ? "bg-card/90"
          : "bg-card/50 opacity-80"
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary/80 !border-primary !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            person.gender === "MALE" ? "bg-primary/30" : "bg-accent/20"
          }`}
        >
          {person.isLiving ? (
            <User className={`h-3.5 w-3.5 ${person.gender === "MALE" ? "text-primary" : "text-accent"}`} />
          ) : (
            <UserX className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
            {person.fullName}
          </p>
          {person.birthDate && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(person.birthDate).getFullYear()}
              {person.deathDate && ` — ${new Date(person.deathDate).getFullYear()}`}
            </p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary/80 !border-primary !w-2 !h-2" />
    </div>
  );
});

PersonNode.displayName = "PersonNode";
