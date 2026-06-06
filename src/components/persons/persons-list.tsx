"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Pencil, Sparkles, Trash2, User, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deletePerson } from "@/lib/actions/persons";
import type { Gender, VisibilityLevel } from "@/generated/prisma/client";

interface PersonItem {
  id: string;
  fullName: string;
  kunya?: string | null;
  gender: Gender;
  isLiving: boolean;
  birthYear?: number | null;
  birthDate: Date | null;
  deathYear?: number | null;
  deathDate: Date | null;
  profession?: string | null;
  photoUrl?: string | null;
  visibilityLevel: VisibilityLevel;
  generationIndex?: number;
  generationLabel?: string;
}

interface Props {
  persons: PersonItem[];
  familyId: string;
  canManage: boolean;
}

const visibilityLabels: Record<VisibilityLevel, { label: string; variant: "public" | "member" | "admin" | "private" }> = {
  PUBLIC: { label: "عام", variant: "public" },
  MEMBER: { label: "أعضاء", variant: "member" },
  ADMIN: { label: "خاص", variant: "admin" },
  SHARED_LINK: { label: "رابط", variant: "private" },
};

function displayYear(person: PersonItem) {
  return person.birthYear ?? person.birthDate?.getFullYear() ?? null;
}

function comparePersons(a: PersonItem, b: PersonItem) {
  const ay = displayYear(a) ?? 9999;
  const by = displayYear(b) ?? 9999;
  if (ay !== by) return ay - by;
  return a.fullName.localeCompare(b.fullName, "ar");
}

function fallbackGenerationLabel(index: number) {
  return index === 0 ? "الجيل الأول" : `الجيل ${index + 1}`;
}

export function PersonsList({ persons, familyId, canManage }: Props) {
  const [list, setList] = useState(persons);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const byGeneration = new Map<number, PersonItem[]>();
    for (const person of list) {
      const generation = person.generationIndex ?? 0;
      byGeneration.set(generation, [...(byGeneration.get(generation) ?? []), person]);
    }
    return Array.from(byGeneration.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, items]) => ({
        generation,
        label: items[0]?.generationLabel ?? fallbackGenerationLabel(generation),
        people: [...items].sort(comparePersons),
      }));
  }, [list]);

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
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">لا يوجد أفراد مسجلون بعد</p>
        {canManage && (
          <Link
            href={`/dashboard/families/${familyId}/build`}
            className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/30"
          >
            <Sparkles className="h-4 w-4" />
            ابدأ البناء السريع
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {groups.map((group) => (
        <section key={group.generation} className="bg-card/20">
          <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-4 py-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
              <p className="text-xs text-muted-foreground">
                {group.people.length} فرد
              </p>
            </div>
            <Badge variant="outline" className="text-[11px]">
              جيل {group.generation + 1}
            </Badge>
          </div>
          <ul className="divide-y divide-border/30">
            {group.people.map((person) => {
              const year = displayYear(person);
              return (
                <li key={person.id} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/20">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${person.isLiving ? "bg-primary/20" : "bg-muted/40"}`}>
                      {person.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : person.isLiving ? (
                        <User className="h-4 w-4 text-accent" />
                      ) : (
                        <UserX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/families/${familyId}/persons/${person.id}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-accent"
                      >
                        {person.kunya ? `${person.fullName} (${person.kunya})` : person.fullName}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {person.gender === "MALE" ? "ذكر" : "أنثى"}
                        </span>
                        {!person.isLiving && <span className="text-xs text-muted-foreground">• متوفى</span>}
                        {year && <span className="text-xs text-muted-foreground">• {year}</span>}
                        {person.profession && (
                          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                            <BriefcaseBusiness className="h-3 w-3" />
                            {person.profession}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={visibilityLabels[person.visibilityLevel].variant} className="hidden px-1.5 py-0 text-xs sm:inline-flex">
                      {visibilityLabels[person.visibilityLevel].label}
                    </Badge>
                    {canManage && (
                      <>
                        <Link
                          href={`/dashboard/families/${familyId}/persons/${person.id}/edit`}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-accent"
                          title="تعديل"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(person.id)}
                          disabled={isPending}
                          className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

