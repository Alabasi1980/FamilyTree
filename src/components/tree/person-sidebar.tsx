"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  UserPlus,
  Heart,
  Trash2,
  Edit3,
  AlertCircle,
  Loader2,
  Link2,
} from "lucide-react";
import Link from "next/link";
import {
  createPersonAsChildOf,
  createPersonAsParentOf,
  removeParentChildRelation,
  deletePerson,
  addParentChildRelation,
} from "@/lib/actions/persons";
import { addMarriage, removeMarriage } from "@/lib/actions/marriages";
import { computeMahramIds } from "@/lib/mahram";

// ─── Types ──────────────────────────────────────────────────────────────────────────

export interface PersonData {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
  birthDate: string | null;
  deathDate: string | null;
  biography?: string | null;
  notes?: string | null;
  /** Set only for persons from a linked (non-current) family */
  sourceFamilyId?: string;
  sourceFamilyName?: string;
  sourceFamilySlug?: string;
}

export interface Relation {
  parentId: string;
  childId: string;
}

export interface Marriage {
  id: string;
  personAId: string;
  personBId: string;
}

interface Props {
  person: PersonData;
  allPersons: PersonData[];
  /** Persons from linked IN_LAW families — eligible for cross-family marriage */
  linkedPersons?: PersonData[];
  relations: Relation[];
  marriages: Marriage[];
  canManage: boolean;
  familyId: string;
  onClose: () => void;
  onPersonSelect: (personId: string) => void;
}

// ─── Mini form: create new person as child/parent ────────────────────────────

type AddMode = "create" | "existing";

function RelationForm({
  sectionLabel,
  availablePersons,
  onCreate,
  onLink,
  onCancel,
}: {
  sectionLabel: string;
  availablePersons: PersonData[];
  onCreate: (fullName: string, gender: "MALE" | "FEMALE") => Promise<void>;
  onLink: (personId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<AddMode>(availablePersons.length > 0 ? "existing" : "create");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [selectedId, setSelectedId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "create") setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (mode === "create") {
      if (!fullName.trim()) { setErr("الاسم مطلوب"); return; }
      startTransition(async () => {
        try { await onCreate(fullName.trim(), gender); }
        catch { setErr("حدث خطأ"); }
      });
    } else {
      if (!selectedId) { setErr("اختر شخصاً"); return; }
      startTransition(async () => {
        try { await onLink(selectedId); }
        catch { setErr("حدث خطأ"); }
      });
    }
  }

  return (
    <form onSubmit={submit} className="mt-1.5 bg-secondary/20 rounded-lg p-2.5 space-y-2">
      {availablePersons.length > 0 && (
        <div className="flex rounded overflow-hidden border border-border/50 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex-1 py-1 transition-colors ${mode === "existing" ? "bg-primary/20 text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            اختر موجود
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-1 transition-colors ${mode === "create" ? "bg-primary/20 text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}
          >
            أضف جديد
          </button>
        </div>
      )}

      {mode === "create" ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={`اسم ${sectionLabel}`}
            className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60"
          />
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={gender === "MALE"} onChange={() => setGender("MALE")} className="w-3 h-3" />
              ذكر
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={gender === "FEMALE"} onChange={() => setGender("FEMALE")} className="w-3 h-3" />
              أنثى
            </label>
          </div>
        </>
      ) : (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="اختر شخصاً"
          className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground outline-none focus:border-primary/60"
        >
          <option value="">اختر شخصاً...</option>
          {availablePersons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName} ({p.gender === "MALE" ? "ذكر" : "أنثى"})
            </option>
          ))}
        </select>
      )}

      {err && <p className="text-[10px] text-destructive">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 text-xs py-1.5 rounded bg-primary/20 hover:bg-primary/30 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-xs py-1.5 px-3 rounded border border-border/40 hover:bg-secondary/50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

// ─── Person row (inside relatives list) ──────────────────────────────────────

function PersonRow({
  person,
  onSelect,
  onRemove,
  canManage,
  isPending,
}: {
  person: PersonData;
  onSelect: () => void;
  onRemove?: () => void;
  canManage: boolean;
  isPending: boolean;
}) {
  const isMale = person.gender === "MALE";
  return (
    <div className="flex items-center gap-1.5 group">
      <button
        onClick={onSelect}
        className={`flex-1 flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-secondary/60 transition-colors text-right min-w-0`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            isMale ? "bg-blue-500/15 text-blue-400" : "bg-rose-400/15 text-rose-400"
          }`}
        >
          {person.fullName[0]}
        </span>
        <span className={`truncate ${isMale ? "text-blue-300/90" : "text-rose-300/90"}`}>
          {person.fullName}
        </span>
      </button>
      {canManage && onRemove && (
        <button
          onClick={onRemove}
          disabled={isPending}
          title="إزالة الصلة"
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function PersonSidebar({
  person,
  allPersons,
  linkedPersons = [],
  relations,
  marriages,
  canManage,
  familyId,
  onClose,
  onPersonSelect,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [addingParent, setAddingParent] = useState(false);
  const [addingSpouse, setAddingSpouse] = useState(false);
  const [selectedSpouseId, setSelectedSpouseId] = useState("");
  const [error, setError] = useState("");

  // ── Computed relatives ──────────────────────────────────────────────────────
  const parents = relations
    .filter((r) => r.childId === person.id)
    .map((r) => allPersons.find((p) => p.id === r.parentId))
    .filter(Boolean) as PersonData[];

  const children = relations
    .filter((r) => r.parentId === person.id)
    .map((r) => allPersons.find((p) => p.id === r.childId))
    .filter(Boolean) as PersonData[];

  // All persons we can potentially look up (same family + linked families)
  const allKnownPersons = [...allPersons, ...linkedPersons];

  const spouseEntries = marriages
    .filter((m) => m.personAId === person.id || m.personBId === person.id)
    .map((m) => {
      const spouseId = m.personAId === person.id ? m.personBId : m.personAId;
      return { marriage: m, spouse: allKnownPersons.find((p) => p.id === spouseId) };
    })
    .filter((s) => s.spouse) as { marriage: Marriage; spouse: PersonData }[];

  // Core related IDs (self + immediate relations + current spouses)
  const relatedIds = new Set([
    person.id,
    ...parents.map((p) => p.id),
    ...children.map((p) => p.id),
    ...spouseEntries.map((s) => s.spouse.id),
  ]);

  // Mahram filter: blood-relation prohibitions
  const mahramIds = computeMahramIds(person.id, relations);

  // Available for spouse: opposite gender, not mahram, not already related
  // Includes persons from linked (IN_LAW) families
  const availableForSpouse = allKnownPersons.filter(
    (p) => !relatedIds.has(p.id) && !mahramIds.has(p.id) && p.gender !== person.gender
  );

  // Available for parent/child: same-family only
  const availableForParent = allPersons.filter(
    (p) => !relatedIds.has(p.id) && p.id !== person.id
  );
  const availableForChild = allPersons.filter(
    (p) => !relatedIds.has(p.id) && p.id !== person.id
  );

  // ── Dates & age ─────────────────────────────────────────────────────────────
  const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : null;
  const age =
    birthYear && deathYear
      ? deathYear - birthYear
      : birthYear && person.isLiving
      ? new Date().getFullYear() - birthYear
      : null;

  function refresh() { router.refresh(); }

  // ── Action helpers ───────────────────────────────────────────────────────────
  function closeAddForms() {
    setAddingChild(false);
    setAddingParent(false);
    setAddingSpouse(false);
  }

  async function handleDelete() {
    startTransition(async () => {
      const r = await deletePerson(person.id);
      if (r.success) { onClose(); refresh(); }
      else setError(r.error ?? "حدث خطأ");
    });
  }

  async function handleAddChild(fullName: string, gender: "MALE" | "FEMALE") {
    const r = await createPersonAsChildOf(person.id, { fullName, gender });
    if (r.success) { setAddingChild(false); refresh(); }
    else setError(r.error ?? "حدث خطأ");
  }

  async function handleLinkChild(childId: string) {
    const r = await addParentChildRelation(person.id, childId);
    if (r.success) { setAddingChild(false); refresh(); }
    else setError(r.error ?? "حدث خطأ");
  }

  async function handleAddParent(fullName: string, gender: "MALE" | "FEMALE") {
    const r = await createPersonAsParentOf(person.id, { fullName, gender });
    if (r.success) { setAddingParent(false); refresh(); }
    else setError(r.error ?? "حدث خطأ");
  }

  async function handleLinkParent(parentId: string) {
    const r = await addParentChildRelation(parentId, person.id);
    if (r.success) { setAddingParent(false); refresh(); }
    else setError(r.error ?? "حدث خطأ");
  }

  async function handleAddSpouse() {
    if (!selectedSpouseId) return;
    startTransition(async () => {
      const r = await addMarriage(person.id, selectedSpouseId);
      if (r.success) { setAddingSpouse(false); setSelectedSpouseId(""); refresh(); }
      else setError(r.error ?? "حدث خطأ");
    });
  }

  async function handleRemoveParentChild(parentId: string, childId: string) {
    startTransition(async () => {
      const r = await removeParentChildRelation(parentId, childId);
      if (!r.success) setError(r.error ?? "حدث خطأ");
      else refresh();
    });
  }

  async function handleRemoveSpouse(marriageId: string) {
    startTransition(async () => {
      const r = await removeMarriage(marriageId);
      if (!r.success) setError(r.error ?? "حدث خطأ");
      else refresh();
    });
  }

  const isMale = person.gender === "MALE";

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 max-h-[72vh] rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/40 flex flex-col overflow-hidden md:relative md:inset-auto md:z-auto md:h-full md:max-h-none md:w-72 md:rounded-none md:border-y-0 md:border-l-0 md:border-r md:shadow-none"
      dir="rtl"
    >
      {/* ── Header ── */}
      <div
        className={`flex items-center gap-2.5 px-4 py-3 border-b border-border/40 shrink-0 ${
          isMale ? "bg-blue-500/5" : "bg-rose-500/5"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            isMale ? "bg-blue-500/20 text-blue-400" : "bg-rose-400/20 text-rose-400"
          }`}
        >
          {person.fullName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground truncate">{person.fullName}</h3>
          <p className="text-[10px] text-muted-foreground">
            {isMale ? "ذكر" : "أنثى"}
            {age !== null && ` · ${age} سنة`}
            {!person.isLiving && " · متوفى"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 rounded hover:bg-secondary/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} aria-label="إغلاق الخطأ" className="shrink-0 hover:text-destructive/70">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* ── Basic info ── */}
        <div className="space-y-1.5">
          {person.birthDate && (
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground shrink-0">المواليد:</span>
              <span className="text-right">
                {new Date(person.birthDate).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          {person.deathDate && (
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground shrink-0">الوفاة:</span>
              <span className="text-right">
                {new Date(person.deathDate).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          {person.biography && (
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2 mt-2">
              {person.biography}
            </p>
          )}
          {person.notes && (
            <p className="text-[10px] text-muted-foreground/60 italic">{person.notes}</p>
          )}
        </div>

        {/* ── Actions ── */}
        {canManage && (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/families/${familyId}/persons/${person.id}/edit`}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              تعديل
            </Link>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-border/50 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </button>
            ) : (
              <div className="flex gap-1 flex-1">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium transition-colors"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "تأكيد الحذف"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs py-1.5 px-2 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Section divider ── */}
        <div className="border-t border-border/30" />

        {/* ── Parents ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              الوالدان
            </h4>
            {canManage && !addingParent && (
              <button
                onClick={() => { closeAddForms(); setAddingParent(true); }}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <UserPlus className="h-3 w-3" /> إضافة
              </button>
            )}
          </div>
          {parents.length === 0 && !addingParent && (
            <p className="text-xs text-muted-foreground/50 italic">لم يُسجَّل والدان</p>
          )}
          {parents.map((parent) => (
            <PersonRow
              key={parent.id}
              person={parent}
              onSelect={() => onPersonSelect(parent.id)}
              onRemove={() => handleRemoveParentChild(parent.id, person.id)}
              canManage={canManage}
              isPending={isPending}
            />
          ))}
          {addingParent && (
            <RelationForm
              sectionLabel="الوالد/الوالدة"
              availablePersons={availableForParent}
              onCreate={handleAddParent}
              onLink={handleLinkParent}
              onCancel={() => setAddingParent(false)}
            />
          )}
        </div>

        {/* ── Children ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              الأبناء
            </h4>
            {canManage && !addingChild && (
              <button
                onClick={() => { closeAddForms(); setAddingChild(true); }}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <UserPlus className="h-3 w-3" /> إضافة
              </button>
            )}
          </div>
          {children.length === 0 && !addingChild && (
            <p className="text-xs text-muted-foreground/50 italic">لم يُسجَّل أبناء</p>
          )}
          {children.map((child) => (
            <PersonRow
              key={child.id}
              person={child}
              onSelect={() => onPersonSelect(child.id)}
              onRemove={() => handleRemoveParentChild(person.id, child.id)}
              canManage={canManage}
              isPending={isPending}
            />
          ))}
          {addingChild && (
            <RelationForm
              sectionLabel="الابن/البنت"
              availablePersons={availableForChild}
              onCreate={handleAddChild}
              onLink={handleLinkChild}
              onCancel={() => setAddingChild(false)}
            />
          )}
        </div>

        {/* ── Spouses ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              الزيجات
            </h4>
            {canManage && !addingSpouse && availableForSpouse.length > 0 && (
              <button
                onClick={() => { closeAddForms(); setAddingSpouse(true); }}
                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
              >
                <Heart className="h-3 w-3" /> إضافة
              </button>
            )}
          </div>
          {spouseEntries.length === 0 && !addingSpouse && (
            <p className="text-xs text-muted-foreground/50 italic">لم تُسجَّل زيجات</p>
          )}
          {spouseEntries.map(({ marriage, spouse }) => (
            <div key={marriage.id} className="flex items-center gap-1.5 group">
              {spouse.sourceFamilySlug ? (
                /* Cross-family spouse: navigate to their family page */
                <a
                  href={`/family/${encodeURIComponent(spouse.sourceFamilySlug)}`}
                  className="flex-1 flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-secondary/60 transition-colors text-right min-w-0"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-400/60 shrink-0" />
                  <span className="truncate text-foreground/80">{spouse.fullName}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 shrink-0">
                    {spouse.sourceFamilyName}
                  </span>
                </a>
              ) : (
                /* Same-family spouse: select node */
                <button
                  onClick={() => onPersonSelect(spouse.id)}
                  className="flex-1 flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-secondary/60 transition-colors text-right min-w-0"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-400/60 shrink-0" />
                  <span className="truncate text-foreground/80">{spouse.fullName}</span>
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => handleRemoveSpouse(marriage.id)}
                  disabled={isPending}
                  title="إزالة الزواج"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {addingSpouse && (
            <div className="mt-1.5 bg-secondary/20 rounded-lg p-2.5 space-y-2">
              <select
                value={selectedSpouseId}
                onChange={(e) => setSelectedSpouseId(e.target.value)}
                aria-label="اختر شريك الحياة"
                className="w-full text-xs px-2.5 py-1.5 rounded border border-border/60 bg-card text-foreground outline-none focus:border-primary/60"
              >
                <option value="">اختر شخصاً...</option>
                {/* Same-family persons */}
                {availableForSpouse.filter((p) => !p.sourceFamilyId).length > 0 && (
                  <optgroup label="نفس العائلة">
                    {availableForSpouse
                      .filter((p) => !p.sourceFamilyId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                  </optgroup>
                )}
                {/* Linked-family persons grouped by family name */}
                {Array.from(
                  new Set(
                    availableForSpouse
                      .filter((p) => p.sourceFamilyId)
                      .map((p) => p.sourceFamilyName ?? "")
                  )
                ).map((familyName) => (
                  <optgroup key={familyName} label={`عائلة ${familyName}`}>
                    {availableForSpouse
                      .filter((p) => p.sourceFamilyName === familyName)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSpouse}
                  disabled={isPending || !selectedSpouseId}
                  className="flex-1 text-xs py-1.5 rounded bg-primary/20 hover:bg-primary/30 transition-colors disabled:opacity-50 font-medium"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "ربط"}
                </button>
                <button
                  onClick={() => { setAddingSpouse(false); setSelectedSpouseId(""); }}
                  className="text-xs py-1.5 px-3 rounded border border-border/40 hover:bg-secondary/50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── View full profile ── */}
        <div className="border-t border-border/30 pt-3">
          <Link
            href={`/dashboard/families/${familyId}/persons/${person.id}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            عرض الملف الكامل
          </Link>
        </div>
      </div>
    </div>
  );
}
