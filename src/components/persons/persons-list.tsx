"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, User, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deletePerson } from "@/lib/actions/persons";
import type { Gender, VisibilityLevel } from "@/generated/prisma/client";

interface PersonItem {
  id: string;
  fullName: string;
  gender: Gender;
  isLiving: boolean;
  birthDate: Date | null;
  deathDate: Date | null;
  visibilityLevel: VisibilityLevel;
}

interface Props {
  persons: PersonItem[];
  familyId: string;
  canManage: boolean;
}

const visibilityLabels: Record<VisibilityLevel, { label: string; variant: "public" | "member" | "admin" | "private" }> = {
  PUBLIC: { label: "عام", variant: "public" },
  MEMBER: { label: "أعضاء", variant: "member" },
  ADMIN: { label: "مسؤول", variant: "admin" },
  SHARED_LINK: { label: "رابط", variant: "private" },
};

export function PersonsList({ persons, familyId, canManage }: Props) {
  const [list, setList] = useState(persons);
  const [isPending, startTransition] = useTransition();

  function handleDelete(personId: string) {
    if (!confirm("هل تريد حذف هذا الشخص؟")) return;
    startTransition(async () => {
      const result = await deletePerson(personId);
      if (result.success) {
        setList((prev) => prev.filter((p) => p.id !== personId));
      }
    });
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        لا يوجد أفراد مسجّلون بعد
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/40">
      {list.map((person) => (
        <li key={person.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${person.isLiving ? "bg-primary/20" : "bg-muted/40"}`}>
              {person.isLiving ? (
                <User className="h-3.5 w-3.5 text-accent" />
              ) : (
                <UserX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{person.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {person.gender === "MALE" ? "ذكر" : "أنثى"}
                </span>
                {!person.isLiving && <span className="text-xs text-muted-foreground">• متوفى</span>}
                {person.birthDate && (
                  <span className="text-xs text-muted-foreground">
                    • {new Date(person.birthDate).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={visibilityLabels[person.visibilityLevel].variant} className="hidden sm:inline-flex text-xs px-1.5 py-0">
              {visibilityLabels[person.visibilityLevel].label}
            </Badge>
            {canManage && (
              <button
                onClick={() => handleDelete(person.id)}
                disabled={isPending}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                title="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
