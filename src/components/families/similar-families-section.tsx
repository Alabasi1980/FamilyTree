"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import { searchSimilarFamilies } from "@/lib/actions/families";

type FamilyResult = Awaited<ReturnType<typeof searchSimilarFamilies>>[number];

interface Props {
  name: string;
  isLoggedIn: boolean;
}

export function SimilarFamiliesSection({ name, isLoggedIn }: Props) {
  const [results, setResults] = useState<FamilyResult[]>([]);
  const [resultName, setResultName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedName = name.trim();
  const canSearch = normalizedName.length >= 2;
  const visibleResults = canSearch && resultName === normalizedName ? results : [];

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!canSearch) return;

    timerRef.current = setTimeout(async () => {
      const data = await searchSimilarFamilies(normalizedName);
      setResults(data);
      setResultName(normalizedName);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [canSearch, normalizedName]);

  if (visibleResults.length === 0) return null;

  function formatHomeland(f: FamilyResult) {
    const parts = [f.homelandCountry, f.homelandRegion, f.homelandCity].filter(Boolean);
    return parts.join(" ← ");
  }

  return (
    <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-3 space-y-2">
      <p className="text-xs font-medium text-amber-400">
        عائلات بنفس الاسم أو مشابهة — تأكد قبل الإنشاء
      </p>

      <ul className="space-y-1.5">
          {visibleResults.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-md bg-background/60 border border-border/30 px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{f.name}</span>
                  {!f.isPublic && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground border border-border/40 rounded px-1 py-0.5">
                      <Lock className="h-2.5 w-2.5" />
                      خاصة
                    </span>
                  )}
                </div>
                {f.isPublic && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {formatHomeland(f) || "—"}
                    {f.personCount > 0 && (
                      <span className="mr-2 text-muted-foreground/60">{f.personCount} فرد</span>
                    )}
                  </p>
                )}
              </div>

              {f.isPublic && isLoggedIn && (
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/family/${f.slug}`}
                    target="_blank"
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="عرض العائلة"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/family/${f.slug}`}
                    target="_blank"
                    className="text-[11px] bg-primary/15 hover:bg-primary/25 text-foreground px-2 py-1 rounded transition-colors whitespace-nowrap"
                  >
                    طلب من صفحة العائلة
                  </Link>
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
