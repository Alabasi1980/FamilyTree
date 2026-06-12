"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, UserMinus, Plus, X, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PersonCombobox from "@/components/persons/person-combobox";
import {
  addParentChildRelation,
  removeParentChildRelation,
  createPersonAsChildOf,
  createPersonAsParentOf,
} from "@/lib/actions/persons";
import type { ParentChildRelationType, RelationConfidence } from "@/generated/prisma/client";

interface RelatedPerson {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  isLiving: boolean;
}

interface PersonOption {
  id: string;
  fullName: string;
}

type AddMode = "existing" | "new" | null;
const relationTypes: Array<{ value: ParentChildRelationType; label: string }> = [
  { value: "BIOLOGICAL", label: "بيولوجية" },
  { value: "STEP", label: "زوج/زوجة والد" },
  { value: "GUARDIANSHIP", label: "وصاية" },
  { value: "ADOPTIVE", label: "تبنٍ/رعاية" },
  { value: "UNKNOWN", label: "غير معروف" },
];
const confidenceLevels: Array<{ value: RelationConfidence; label: string }> = [
  { value: "VERIFIED", label: "موثقة" },
  { value: "LIKELY", label: "مرجحة" },
  { value: "UNVERIFIED", label: "غير موثقة" },
  { value: "DISPUTED", label: "متنازع عليها" },
];

interface SectionProps {
  title: string;
  people: RelatedPerson[];
  familyId: string;
  currentPersonId: string;
  allPersons: PersonOption[];
  role: "parent" | "child";
  onRemove: (otherId: string) => void;
  isPending: boolean;
}

function RelationSection({
  title, people, currentPersonId, allPersons, role, onRemove, isPending,
}: SectionProps) {
  const router = useRouter();
  const [sectionPending, startSectionTransition] = useTransition();
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [selectedId, setSelectedId] = useState("");
  const [relationType, setRelationType] = useState<ParentChildRelationType>("BIOLOGICAL");
  const [confidence, setConfidence] = useState<RelationConfidence>("VERIFIED");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"MALE" | "FEMALE">("MALE");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }, []);

  const isWorking = isPending || sectionPending;

  // Exclude already-related persons from the combobox
  const relatedIds = new Set(people.map((p) => p.id));
  relatedIds.add(currentPersonId);
  const availableOptions = allPersons.filter((p) => !relatedIds.has(p.id));

  function reset() {
    setAddMode(null);
    setSelectedId("");
    setRelationType("BIOLOGICAL");
    setConfidence("VERIFIED");
    setNewName("");
    setNewGender("MALE");
    setError("");
  }

  async function handleAddExisting() {
    if (!selectedId) return;
    setError("");
    const selectedName = allPersons.find((p) => p.id === selectedId)?.fullName ?? "";
    startSectionTransition(async () => {
      const result =
        role === "parent"
          ? await addParentChildRelation(selectedId, currentPersonId, { relationType, confidence })
          : await addParentChildRelation(currentPersonId, selectedId, { relationType, confidence });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
        return;
      }
      reset();
      showSuccess(
        role === "parent"
          ? `تم ربط ${selectedName} كوالد بنجاح`
          : `تم ربط ${selectedName} كابن/بنت بنجاح`
      );
      router.refresh();
    });
  }

  async function handleAddNew() {
    if (!newName.trim()) { setError("الاسم مطلوب"); return; }
    setError("");
    const nameToShow = newName.trim();
    startSectionTransition(async () => {
      const result =
        role === "parent"
          ? await createPersonAsParentOf(currentPersonId, { fullName: nameToShow, gender: newGender, relationType, confidence })
          : await createPersonAsChildOf(currentPersonId, { fullName: nameToShow, gender: newGender, relationType, confidence });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
        return;
      }
      reset();
      showSuccess(
        role === "parent"
          ? `تم إنشاء ${nameToShow} وربطه كوالد بنجاح`
          : `تم إنشاء ${nameToShow} وربطه كابن/بنت بنجاح`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {addMode === null && (
          <button
            type="button"
            onClick={() => setAddMode("existing")}
            disabled={isWorking}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة
          </button>
        )}
      </div>

      {/* Existing relations */}
      {people.length === 0 ? (
        <p className="text-xs text-muted-foreground pr-1">لا يوجد {title.toLowerCase()} مسجّل</p>
      ) : (
        <ul className="space-y-1">
          {people.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.gender === "MALE" ? "bg-blue-400" : "bg-rose-400"}`}
                />
                <span className="truncate text-foreground">{p.fullName}</span>
                {!p.isLiving && (
                  <span className="text-[10px] text-muted-foreground shrink-0">متوفى</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                disabled={isWorking}
                title="إزالة العلاقة"
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 shrink-0"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      {addMode !== null && (
        <div className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2.5">
          {/* Mode toggle */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { setAddMode("existing"); setError(""); }}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                addMode === "existing"
                  ? "bg-primary/20 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              اختيار من العائلة
            </button>
            <button
              type="button"
              onClick={() => { setAddMode("new"); setError(""); }}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                addMode === "new"
                  ? "bg-primary/20 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              شخص جديد
            </button>
          </div>

          {/* Existing person */}
          {addMode === "existing" && (
            <div className="space-y-2">
              <PersonCombobox
                options={availableOptions}
                value={selectedId}
                onChange={setSelectedId}
                placeholder={`— اختر ${title.slice(0, -1) === "الوالدا" ? "الوالد/الوالدة" : "الابن/البنت"} —`}
                disabled={isWorking}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">نوع العلاقة</span>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as ParentChildRelationType)}
                    disabled={isWorking}
                    className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {relationTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">درجة الثقة</span>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value as RelationConfidence)}
                    disabled={isWorking}
                    className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {confidenceLevels.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleAddExisting}
                  disabled={isWorking || !selectedId}
                >
                  {sectionPending ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <UserPlus className="h-3 w-3 ml-1" />}
                  ربط
                </Button>
                <button
                  type="button"
                  onClick={reset}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* New person */}
          {addMode === "new" && (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="الاسم الكامل"
                className="h-8 w-full rounded-md border border-input bg-card/60 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <div className="flex gap-1">
                {(["MALE", "FEMALE"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setNewGender(g)}
                    className={`flex-1 py-1 rounded text-xs border transition-colors ${
                      newGender === g
                        ? g === "MALE"
                          ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                          : "border-rose-500/60 bg-rose-500/10 text-rose-400"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {g === "MALE" ? "ذكر" : "أنثى"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">نوع العلاقة</span>
                  <select
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as ParentChildRelationType)}
                    disabled={isWorking}
                    className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {relationTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">درجة الثقة</span>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value as RelationConfidence)}
                    disabled={isWorking}
                    className="h-8 w-full rounded-md border border-input bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {confidenceLevels.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleAddNew}
                  disabled={isWorking || !newName.trim()}
                >
                  {sectionPending ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <UserPlus className="h-3 w-3 ml-1" />}
                  إنشاء وربط
                </Button>
                <button
                  type="button"
                  onClick={reset}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface Props {
  familyId: string;
  currentPerson: { id: string; fullName: string };
  parents: RelatedPerson[];
  childPeople: RelatedPerson[];
  allPersons: PersonOption[];
}

export default function ParentChildRelationManager({
  familyId,
  currentPerson,
  parents,
  childPeople,
  allPersons,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState("");

  // Local state mirrors — optimistic UI for removes
  const [localParents, setLocalParents] = useState(parents);
  const [localChildren, setLocalChildren] = useState(childPeople);

  function handleRemoveParent(parentId: string) {
    if (!confirm("هل تريد إزالة هذه العلاقة الأبوية؟")) return;
    startTransition(async () => {
      const result = await removeParentChildRelation(parentId, currentPerson.id);
      if (!result.success) { setRemoveError(result.error ?? "حدث خطأ"); return; }
      setLocalParents((prev) => prev.filter((p) => p.id !== parentId));
      setRemoveError("");
      router.refresh();
    });
  }

  function handleRemoveChild(childId: string) {
    if (!confirm("هل تريد إزالة هذه العلاقة الأبوية؟")) return;
    startTransition(async () => {
      const result = await removeParentChildRelation(currentPerson.id, childId);
      if (!result.success) { setRemoveError(result.error ?? "حدث خطأ"); return; }
      setLocalChildren((prev) => prev.filter((c) => c.id !== childId));
      setRemoveError("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {removeError && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">{removeError}</p>
      )}

      {/* Parents */}
      <RelationSection
        title="الوالدان"
        people={localParents}
        familyId={familyId}
        currentPersonId={currentPerson.id}
        allPersons={allPersons}
        role="parent"
        onRemove={handleRemoveParent}
        isPending={isPending}
      />

      <div className="border-t border-border/40" />

      {/* Children */}
      <RelationSection
        title="الأبناء"
        people={localChildren}
        familyId={familyId}
        currentPersonId={currentPerson.id}
        allPersons={allPersons}
        role="child"
        onRemove={handleRemoveChild}
        isPending={isPending}
      />
    </div>
  );
}
