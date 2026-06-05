"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { findDuplicateCandidates, type DuplicateCandidate } from "@/lib/actions/duplicate-check";

interface Props {
  familyId: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  birthYear?: number;
  excludePersonId?: string;
  familyDashboardId: string; // for link href
}

export default function DuplicateWarning({
  familyId,
  fullName,
  gender,
  birthYear,
  excludePersonId,
  familyDashboardId,
}: Props) {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef("");

  useEffect(() => {
    const trimmed = fullName.trim();
    // Need at least 3 chars to check
    if (trimmed.length < 3) {
      setCandidates([]);
      setDismissed(false);
      return;
    }

    const key = `${trimmed}|${gender}|${birthYear ?? ""}`;
    if (key === lastQueryRef.current) return;

    setDismissed(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      lastQueryRef.current = key;
      const results = await findDuplicateCandidates(
        familyId,
        trimmed,
        gender,
        birthYear,
        excludePersonId
      );
      setCandidates(results);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fullName, gender, birthYear, familyId, excludePersonId]);

  if (dismissed || candidates.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-700/50 bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-200">
            تحذير: أشخاص مشابهون مسجّلون
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-400/60 hover:text-amber-300 transition-colors"
          title="إخفاء"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-1.5">
        {candidates.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-2 rounded-md bg-amber-900/20 px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    c.gender === "MALE" ? "bg-blue-400" : "bg-rose-400"
                  }`}
                />
                <span className="text-sm font-medium text-foreground truncate">{c.fullName}</span>
                <span className="text-xs text-amber-400/80 shrink-0">
                  {c.score}%
                </span>
              </div>
              <p className="text-[10px] text-amber-300/60 mr-3.5">
                {c.reasons.join("، ")}
                {c.birthDate && ` • ${new Date(c.birthDate).getFullYear()}`}
              </p>
            </div>
            <Link
              href={`/dashboard/families/${familyDashboardId}/persons/${c.id}`}
              target="_blank"
              className="text-accent hover:text-accent/80 transition-colors shrink-0"
              title="عرض الشخص"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-amber-400/50">
        تأكد أن هذا الشخص غير مسجّل مسبقاً قبل الإضافة.
      </p>
    </div>
  );
}
