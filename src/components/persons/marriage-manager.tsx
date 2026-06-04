"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, HeartCrack, Trash2, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMarriage, removeMarriage, divorceMarriage } from "@/lib/actions/marriages";
import PersonCombobox from "@/components/persons/person-combobox";

interface PersonOption {
  id: string;
  fullName: string;
  familyName?: string;
}

interface MarriageEntry {
  id: string;
  personAId: string;
  personBId: string;
  personAName: string;
  personBName: string;
  marriageDate: Date | null;
  status: string;
  divorceDate: Date | null;
}

interface Props {
  familyId: string;
  persons: PersonOption[];
  linkedPersons?: PersonOption[];
  marriages: MarriageEntry[];
  lockedPersonA?: PersonOption;
}

export default function MarriageManager({ familyId, persons, linkedPersons = [], marriages, lockedPersonA }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [personAId, setPersonAId] = useState("");
  const [personBId, setPersonBId] = useState("");
  const [marriageDate, setMarriageDate] = useState("");

  // Divorce state
  const [divorceTargetId, setDivorceTargetId] = useState<string | null>(null);
  const [divorceDateInput, setDivorceDateInput] = useState("");

  // Use locked person A directly from prop if provided, otherwise fall back to state
  const effectivePersonAId = lockedPersonA?.id ?? personAId;

  function handleAdd() {
    if (!effectivePersonAId || !personBId) return;
    setError("");
    startTransition(async () => {
      const result = await addMarriage(effectivePersonAId, personBId, {
        marriageDate: marriageDate || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!lockedPersonA) setPersonAId("");
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

  function handleDivorce(id: string) {
    setError("");
    startTransition(async () => {
      const result = await divorceMarriage(id, divorceDateInput || undefined);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDivorceTargetId(null);
      setDivorceDateInput("");
      router.refresh();
    });
  }

  // personB options: exclude the locked/selected personA
  const personsBOptions = persons.filter((p) => p.id !== effectivePersonAId);
  // personA options (when not locked): exclude selected personB
  const personsAOptions = persons.filter((p) => p.id !== personBId);
  // linked options for personB: exclude effectivePersonAId
  const linkedBOptions = linkedPersons.filter((p) => p.id !== effectivePersonAId);
  // linked options for personA: exclude personBId
  const linkedAOptions = linkedPersons.filter((p) => p.id !== personBId);

  return (
    <div className="space-y-3">
      {/* Existing marriages */}
      {marriages.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد زيجات مسجّلة</p>
      ) : (
        <ul className="space-y-2">
          {marriages.map((m) => {
            const isEnded = m.status === "ENDED";
            const isBeingDivorced = divorceTargetId === m.id;
            return (
              <li key={m.id} className="space-y-1">
                <div
                  className={`flex items-center justify-between gap-2 text-sm rounded-md px-3 py-2 ${
                    isEnded ? "bg-muted/20 text-muted-foreground" : "bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={`truncate ${isEnded ? "line-through" : ""}`}>{m.personAName}</span>
                    {isEnded ? (
                      <HeartCrack className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className={`truncate ${isEnded ? "line-through" : ""}`}>{m.personBName}</span>
                    {m.marriageDate && (
                      <span className="text-muted-foreground text-xs shrink-0">
                        ({new Date(m.marriageDate).getFullYear()})
                      </span>
                    )}
                    {isEnded && (
                      <span className="text-xs bg-muted rounded px-1.5 py-0.5 shrink-0">
                        منتهٍ{m.divorceDate ? ` ${new Date(m.divorceDate).getFullYear()}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isEnded && (
                      <button
                        onClick={() => {
                          setDivorceTargetId(isBeingDivorced ? null : m.id);
                          setDivorceDateInput("");
                          setError("");
                        }}
                        disabled={isPending}
                        className="p-1 text-muted-foreground hover:text-amber-500 transition-colors rounded"
                        title="تسجيل الطلاق"
                      >
                        <HeartCrack className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={isPending}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                      title="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline divorce form */}
                {isBeingDivorced && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <span className="text-xs text-amber-700 dark:text-amber-400 shrink-0">تاريخ الطلاق:</span>
                    <input
                      type="date"
                      value={divorceDateInput}
                      onChange={(e) => setDivorceDateInput(e.target.value)}
                      title="تاريخ الطلاق (اختياري)"
                      placeholder="تاريخ الطلاق"
                      dir="ltr"
                      className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => handleDivorce(m.id)}
                      disabled={isPending}
                      className="h-7 px-2.5 text-xs rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      تأكيد
                    </button>
                    <button
                      onClick={() => { setDivorceTargetId(null); setDivorceDateInput(""); setError(""); }}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                      title="إلغاء"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add marriage form */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground">إضافة زواج جديد</p>
        <div className="flex flex-col gap-2">
          {/* Locked person A display */}
          {lockedPersonA ? (
            <div className="flex items-center gap-2 h-8 rounded-md border border-input bg-muted/30 px-2 text-xs text-foreground">
              <span className="text-muted-foreground shrink-0">الطرف الأول:</span>
              <span className="font-medium truncate">{lockedPersonA.fullName}</span>
            </div>
          ) : (
            <PersonCombobox
              options={personsAOptions}
              linkedOptions={linkedAOptions}
              value={personAId}
              onChange={setPersonAId}
              placeholder="— الطرف الأول —"
              disabled={isPending}
            />
          )}
          <PersonCombobox
            options={personsBOptions}
            linkedOptions={linkedBOptions}
            value={personBId}
            onChange={setPersonBId}
            placeholder="— الطرف الثاني —"
            disabled={isPending}
          />
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
          disabled={isPending || !effectivePersonAId || !personBId}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Plus className="h-3.5 w-3.5 ml-1" />}
          إضافة
        </Button>
      </div>
    </div>
  );
}
