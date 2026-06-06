"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, ChevronUp, ChevronDown, Plus, Heart, Loader2,
  Sparkles, Undo2, Network, User, X, Check,
} from "lucide-react";
import {
  createPerson,
  createPersonAsChildOf,
  createPersonAsParentOf,
  createPersonAsSpouseOf,
} from "@/lib/actions/persons";

type Gender = "MALE" | "FEMALE";

interface BPerson {
  id: string;
  fullName: string;
  gender: Gender;
  isLiving: boolean;
  birthYear: number | null;
}
interface BRelation { parentPersonId: string; childPersonId: string; }
interface BMarriage { id: string; personAId: string; personBId: string; }

interface Props {
  familyId: string;
  familyName: string;
  initialPersons: BPerson[];
  initialRelations: BRelation[];
  initialMarriages: BMarriage[];
  initialFocusId: string | null;
}

let tempCounter = 0;
const tempId = () => `temp-${Date.now()}-${tempCounter++}`;

export function FamilyBuilder({
  familyId, familyName,
  initialPersons, initialRelations, initialMarriages, initialFocusId,
}: Props) {
  const [persons, setPersons] = useState<BPerson[]>(initialPersons);
  const [relations, setRelations] = useState<BRelation[]>(initialRelations);
  const [marriages, setMarriages] = useState<BMarriage[]>(initialMarriages);
  const [focusId, setFocusId] = useState<string | null>(
    initialFocusId && initialPersons.some((p) => p.id === initialFocusId)
      ? initialFocusId
      : initialPersons[0]?.id ?? null
  );
  const [history, setHistory] = useState<string[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [error, setError] = useState("");

  const personMap = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);
  const focus = focusId ? personMap.get(focusId) ?? null : null;

  const parents = useMemo(() => {
    if (!focusId) return [];
    return relations
      .filter((r) => r.childPersonId === focusId)
      .map((r) => personMap.get(r.parentPersonId))
      .filter((p): p is BPerson => !!p);
  }, [relations, focusId, personMap]);

  const father = parents.find((p) => p.gender === "MALE") ?? null;
  const mother = parents.find((p) => p.gender === "FEMALE") ?? null;

  const spouses = useMemo(() => {
    if (!focusId) return [];
    return marriages
      .filter((m) => m.personAId === focusId || m.personBId === focusId)
      .map((m) => personMap.get(m.personAId === focusId ? m.personBId : m.personAId))
      .filter((p): p is BPerson => !!p);
  }, [marriages, focusId, personMap]);

  const children = useMemo(() => {
    if (!focusId) return [];
    return relations
      .filter((r) => r.parentPersonId === focusId)
      .map((r) => personMap.get(r.childPersonId))
      .filter((p): p is BPerson => !!p)
      .sort((a, b) => (a.birthYear ?? 9999) - (b.birthYear ?? 9999));
  }, [relations, focusId, personMap]);

  const reconcile = useCallback((tempPersonId: string, realId: string) => {
    setPersons((prev) => prev.map((p) => (p.id === tempPersonId ? { ...p, id: realId } : p)));
    setRelations((prev) => prev.map((r) => ({
      parentPersonId: r.parentPersonId === tempPersonId ? realId : r.parentPersonId,
      childPersonId: r.childPersonId === tempPersonId ? realId : r.childPersonId,
    })));
    setMarriages((prev) => prev.map((m) => ({
      ...m,
      personAId: m.personAId === tempPersonId ? realId : m.personAId,
      personBId: m.personBId === tempPersonId ? realId : m.personBId,
    })));
  }, []);

  const rollback = useCallback((tempPersonId: string) => {
    setPersons((prev) => prev.filter((p) => p.id !== tempPersonId));
    setRelations((prev) => prev.filter((r) => r.parentPersonId !== tempPersonId && r.childPersonId !== tempPersonId));
    setMarriages((prev) => prev.filter((m) => m.personAId !== tempPersonId && m.personBId !== tempPersonId));
  }, []);

  function goFocus(id: string) {
    if (focusId) setHistory((h) => [...h, focusId]);
    setFocusId(id);
    setError("");
  }
  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = [...h];
      const prev = next.pop()!;
      setFocusId(prev);
      return next;
    });
  }

  // ── add operations (optimistic) ──
  async function addChild(name: string, gender: Gender) {
    if (!focusId) return;
    const id = tempId();
    setPersons((p) => [...p, { id, fullName: name, gender, isLiving: true, birthYear: null }]);
    setRelations((r) => [...r, { parentPersonId: focusId, childPersonId: id }]);
    setAddedCount((c) => c + 1);
    const res = await createPersonAsChildOf(focusId, { fullName: name, gender });
    if (res.success && res.personId) reconcile(id, res.personId);
    else { rollback(id); setAddedCount((c) => c - 1); setError(res.success ? "" : res.error); }
  }

  async function addParent(name: string, gender: Gender) {
    if (!focusId) return;
    const id = tempId();
    setPersons((p) => [...p, { id, fullName: name, gender, isLiving: false, birthYear: null }]);
    setRelations((r) => [...r, { parentPersonId: id, childPersonId: focusId }]);
    setAddedCount((c) => c + 1);
    const res = await createPersonAsParentOf(focusId, { fullName: name, gender });
    if (res.success && res.personId) reconcile(id, res.personId);
    else { rollback(id); setAddedCount((c) => c - 1); setError(res.success ? "" : res.error); }
  }

  async function addSpouse(name: string) {
    if (!focusId || !focus) return;
    const gender: Gender = focus.gender === "MALE" ? "FEMALE" : "MALE";
    const id = tempId();
    setPersons((p) => [...p, { id, fullName: name, gender, isLiving: focus.isLiving, birthYear: null }]);
    setMarriages((m) => [...m, { id: tempId(), personAId: focusId, personBId: id }]);
    setAddedCount((c) => c + 1);
    const res = await createPersonAsSpouseOf(focusId, { fullName: name });
    if (res.success && res.personId) reconcile(id, res.personId);
    else { rollback(id); setAddedCount((c) => c - 1); setError(res.success ? "" : res.error); }
  }

  async function addFirstPerson(name: string, gender: Gender) {
    const res = await createPerson({
      familyId, fullName: name, gender, isLiving: true,
    });
    if (res.success && res.personId) {
      const newPerson: BPerson = { id: res.personId, fullName: name, gender, isLiving: true, birthYear: null };
      setPersons((p) => [...p, newPerson]);
      setFocusId(res.personId);
      setAddedCount((c) => c + 1);
    } else if (!res.success) {
      setError(res.error);
    }
  }

  // ── Empty state ──
  if (!focus) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Header familyId={familyId} familyName={familyName} addedCount={addedCount} />
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/40 bg-card/30 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">ابدأ ببناء شجرة العائلة</h2>
            <p className="mt-1 text-sm text-muted-foreground">أضف أول فرد (الجدّ الأكبر عادةً) ثم وسّع الشجرة بسهولة.</p>
          </div>
          <QuickAddInput
            placeholder="اسم أول فرد..."
            withGender
            defaultGender="MALE"
            onAdd={addFirstPerson}
            buttonLabel="ابدأ"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <Header familyId={familyId} familyName={familyName} addedCount={addedCount} />

      {history.length > 0 && (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Undo2 className="h-3.5 w-3.5" />
          رجوع إلى الشخص السابق
        </button>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="إغلاق"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── PARENTS ZONE ── */}
      <section className="space-y-2">
        <ZoneLabel icon={<ChevronUp className="h-3.5 w-3.5" />} text="الوالدان" />
        <div className="grid grid-cols-2 gap-2">
          <ParentSlot
            slot="father" person={father}
            onAdd={(name) => addParent(name, "MALE")}
            onFocus={father ? () => goFocus(father.id) : undefined}
          />
          <ParentSlot
            slot="mother" person={mother}
            onAdd={(name) => addParent(name, "FEMALE")}
            onFocus={mother ? () => goFocus(mother.id) : undefined}
          />
        </div>
      </section>

      {/* ── FOCUS + SPOUSES ── */}
      <section className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-stretch justify-center gap-3">
          <FocusCard person={focus} />
          {spouses.map((s) => (
            <SpouseCard key={s.id} person={s} onClick={() => goFocus(s.id)} />
          ))}
          <AddSpouseCard onAdd={addSpouse} />
        </div>
      </section>

      {/* ── CHILDREN ZONE ── */}
      <section className="space-y-2">
        <ZoneLabel
          icon={<ChevronDown className="h-3.5 w-3.5" />}
          text={`الأبناء${children.length ? ` (${children.length})` : ""}`}
        />
        <div className="rounded-2xl border border-border/40 bg-card/20 p-3 space-y-3">
          {children.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {children.map((c) => (
                <RelativeCard key={c.id} person={c} onClick={() => goFocus(c.id)} />
              ))}
            </div>
          ) : (
            <p className="px-1 py-2 text-center text-xs text-muted-foreground">
              لا أبناء بعد — اكتب اسماً ثم اضغط Enter لإضافتهم بسرعة
            </p>
          )}
          <RapidChildInput onAdd={addChild} />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────── sub-components ───────────────────────

function Header({ familyId, familyName, addedCount }: { familyId: string; familyName: string; addedCount: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/families/${familyId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            البناء السريع
          </h1>
          <p className="text-xs text-muted-foreground">عائلة {familyName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {addedCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-green-900/20 px-2.5 py-1 text-xs text-green-400">
            <Check className="h-3 w-3" />
            أضفت {addedCount}
          </span>
        )}
        <Link
          href={`/dashboard/families/${familyId}`}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-foreground hover:bg-muted/30 transition-colors"
        >
          <Network className="h-3.5 w-3.5" />
          عرض الشجرة
        </Link>
      </div>
    </div>
  );
}

function ZoneLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
      {icon}{text}
    </div>
  );
}

function genderStyles(gender: Gender) {
  return gender === "MALE"
    ? { ring: "border-sky-500/30", bg: "bg-sky-500/15", text: "text-sky-300" }
    : { ring: "border-rose-500/30", bg: "bg-rose-500/15", text: "text-rose-300" };
}

function Avatar({ person, size = "md" }: { person: BPerson; size?: "sm" | "md" | "lg" }) {
  const g = genderStyles(person.gender);
  const dim = size === "lg" ? "h-12 w-12 text-lg" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-full border ${g.ring} ${g.bg} ${g.text} font-bold`}>
      {person.fullName.trim()[0] ?? "؟"}
    </div>
  );
}

function FocusCard({ person }: { person: BPerson }) {
  const g = genderStyles(person.gender);
  return (
    <div className={`flex min-w-48 flex-col items-center gap-2 rounded-2xl border-2 ${g.ring} bg-card/70 px-6 py-4 shadow-lg shadow-black/20`}>
      <Avatar person={person} size="lg" />
      <div className="text-center">
        <p className="font-bold text-foreground">{person.fullName}</p>
        <p className="text-[11px] text-muted-foreground">
          {person.gender === "MALE" ? "ذكر" : "أنثى"}
          {!person.isLiving && " · متوفى"}
          {person.birthYear ? ` · ${person.birthYear}` : ""}
        </p>
      </div>
    </div>
  );
}

function RelativeCard({ person, onClick }: { person: BPerson; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-xl border border-border/40 bg-card/50 px-3 py-2 text-right transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <Avatar person={person} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{person.fullName}</span>
    </button>
  );
}

function SpouseCard({ person, onClick }: { person: BPerson; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card/40 px-4 py-3 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <Heart className="h-3 w-3 text-rose-400/70" />
      <Avatar person={person} />
      <span className="max-w-24 truncate text-xs text-foreground">{person.fullName}</span>
    </button>
  );
}

function AddSpouseCard({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function submit() {
    const n = name.trim();
    if (!n) return;
    onAdd(n);
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => ref.current?.focus(), 0); }}
        className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/50 px-4 py-3 text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
      >
        <Heart className="h-4 w-4" />
        <span className="text-xs">زوج / ة</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/5 px-3 py-3">
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="اسم الزوج/ة"
        className="h-8 w-28 rounded-md border border-input bg-background/60 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-1">
        <button type="button" onClick={submit} className="rounded bg-rose-500/20 p-1 text-rose-300 hover:bg-rose-500/30">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { setOpen(false); setName(""); }} className="rounded border border-border/40 p-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ParentSlot({
  slot, person, onAdd, onFocus,
}: {
  slot: "father" | "mother";
  person: BPerson | null;
  onAdd: (name: string) => void;
  onFocus?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const label = slot === "father" ? "الأب" : "الأم";
  const g = genderStyles(slot === "father" ? "MALE" : "FEMALE");

  function submit() {
    const n = name.trim();
    if (!n) return;
    onAdd(n);
    setName("");
    setOpen(false);
  }

  if (person) {
    return (
      <button
        type="button"
        onClick={onFocus}
        className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 text-right transition-colors hover:border-accent/40 hover:bg-accent/5"
      >
        <Avatar person={person} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{person.fullName}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </button>
    );
  }

  if (open) {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border ${g.ring} bg-card/40 px-2.5 py-2`}>
        <input
          ref={ref}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
          placeholder={`اسم ${label}`}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background/60 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button type="button" onClick={submit} className={`rounded p-1 ${g.bg} ${g.text}`}><Check className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => { setOpen(false); setName(""); }} className="rounded border border-border/40 p-1 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setOpen(true); setTimeout(() => ref.current?.focus(), 0); }}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/50 px-3 py-2.5 text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      <span className="text-xs">أضف {label}</span>
    </button>
  );
}

function RapidChildInput({ onAdd }: { onAdd: (name: string, gender: Gender) => void }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const ref = useRef<HTMLInputElement>(null);

  function submit() {
    const n = name.trim();
    if (!n) return;
    onAdd(n, gender);
    setName("");
    ref.current?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 overflow-hidden rounded-lg border border-border/50">
        {(["MALE", "FEMALE"] as const).map((gd) => {
          const active = gender === gd;
          const g = genderStyles(gd);
          return (
            <button
              key={gd}
              type="button"
              onClick={() => { setGender(gd); ref.current?.focus(); }}
              className={`px-2.5 py-2 text-xs transition-colors ${active ? `${g.bg} ${g.text} font-medium` : "text-muted-foreground hover:text-foreground"}`}
            >
              {gd === "MALE" ? "ابن" : "ابنة"}
            </button>
          );
        })}
      </div>
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="اكتب اسم الابن ثم Enter..."
        className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!name.trim()}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-accent/20 px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/30 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        إضافة
      </button>
    </div>
  );
}

function QuickAddInput({
  placeholder, withGender, defaultGender = "MALE", onAdd, buttonLabel = "إضافة", autoFocus,
}: {
  placeholder: string;
  withGender?: boolean;
  defaultGender?: Gender;
  onAdd: (name: string, gender: Gender) => void;
  buttonLabel?: string;
  autoFocus?: boolean;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>(defaultGender);
  const [pending, setPending] = useState(false);

  async function submit() {
    const n = name.trim();
    if (!n) return;
    setPending(true);
    await onAdd(n, gender);
    setPending(false);
    setName("");
  }

  return (
    <div className="flex w-full max-w-md items-center gap-2">
      {withGender && (
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-border/50">
          {(["MALE", "FEMALE"] as const).map((gd) => {
            const active = gender === gd;
            const g = genderStyles(gd);
            return (
              <button key={gd} type="button" onClick={() => setGender(gd)}
                className={`px-2.5 py-2 text-xs transition-colors ${active ? `${g.bg} ${g.text} font-medium` : "text-muted-foreground"}`}>
                {gd === "MALE" ? "ذكر" : "أنثى"}
              </button>
            );
          })}
        </div>
      )}
      <input
        autoFocus={autoFocus}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button type="button" onClick={submit} disabled={pending || !name.trim()}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-accent/20 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/30 disabled:opacity-40">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {buttonLabel}
      </button>
    </div>
  );
}
