"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMarriage, removeMarriage } from "@/lib/actions/marriages";

interface PersonOption {
  id: string;
  fullName: string;
}

interface MarriageEntry {
  id: string;
  personAId: string;
  personBId: string;
  personAName: string;
  personBName: string;
  marriageDate: Date | null;
}

interface Props {
  familyId: string;
  persons: PersonOption[];
  marriages: MarriageEntry[];
}

export default function MarriageManager({ familyId, persons, marriages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [personAId, setPersonAId] = useState("");
  const [personBId, setPersonBId] = useState("");
  const [marriageDate, setMarriageDate] = useState("");

  function handleAdd() {
    if (!personAId || !personBId) return;
    setError("");
    startTransition(async () => {
      const result = await addMarriage(personAId, personBId, {
        marriageDate: marriageDate || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPersonAId("");
      setPersonBId("");
      setMarriageDate("");
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeMarriage(id);
      router.refresh();
    });
  }

  const personsBOptions = persons.filter((p) => p.id !== personAId);
  const personsAOptions = persons.filter((p) => p.id !== personBId);

  return (
    <div className="space-y-3">
      {/* Existing marriages */}
      {marriages.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد زيجات مسجّلة</p>
      ) : (
        <ul className="space-y-2">
          {marriages.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 text-sm bg-muted/40 rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">{m.personAName}</span>
                <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{m.personBName}</span>
                {m.marriageDate && (
                  <span className="text-muted-foreground text-xs shrink-0">
                    ({new Date(m.marriageDate).getFullYear()})
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                disabled={isPending}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded shrink-0"
                title="حذف"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add marriage form */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground">إضافة زواج جديد</p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={personAId}
            onChange={(e) => setPersonAId(e.target.value)}
            aria-label="الزوج / الزوجة الأولى"
            className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— الطرف الأول —</option>
            {personsAOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
          <select
            value={personBId}
            onChange={(e) => setPersonBId(e.target.value)}
            aria-label="الزوج / الزوجة الثانية"
            className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— الطرف الثاني —</option>
            {personsBOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={marriageDate}
          onChange={(e) => setMarriageDate(e.target.value)}
          title="تاريخ الزواج (اختياري)"
          dir="ltr"
          className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs h-8"
          onClick={handleAdd}
          disabled={isPending || !personAId || !personBId}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Plus className="h-3.5 w-3.5 ml-1" />}
          إضافة
        </Button>
      </div>
    </div>
  );
}
