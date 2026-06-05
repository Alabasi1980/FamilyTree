"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, UserMinus, Plus, X, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PersonCombobox from "@/components/persons/person-combobox";
import {
  addParentChildRelation,
  removeParentChildRelation,
  createPersonAsChildOf,
  createPersonAsParentOf,
} from "@/lib/actions/persons";

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
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<"MALE" | "FEMALE">("MALE");
  const [error, setError] = useState("");

  const isWorking = isPending || sectionPending;

  // Exclude already-related persons from the combobox
  const relatedIds = new Set(people.map((p) => p.id));
  relatedIds.add(currentPersonId);
  const availableOptions = allPersons.filter((p) => !relatedIds.has(p.id));

  function reset() {
    setAddMode(null);
    setSelectedId("");
    setNewName("");
    setNewGender("MALE");
    setError("");
  }

  async function handleAddExisting() {
    if (!selectedId) return;
    setError("");
    startSectionTransition(async () => {
      const result =
        role === "parent"
          ? await addParentChildRelation(selectedId, currentPersonId)
          : await addParentChildRelation(currentPersonId, selectedId);

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
        return;
      }
      reset();
      router.refresh();
    });
  }

  async function handleAddNew() {
    if (!newName.trim()) { setError("الاسم مطلوب"); return; }
    setError("");
    startSectionTransition(async () => {
      const result =
        role === "parent"
          ? await createPersonAsParentOf(currentPersonId, { fullName: newName.trim(), gender: newGender })
          : await createPersonAsChildOf(currentPersonId, { fullName: newName.trim(), gender: newGender });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
        return;
      }
      reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
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
  children: RelatedPerson[];
  allPersons: PersonOption[];
}

export default function ParentChildRelationManager({
  familyId,
  currentPerson,
  parents,
  children,
  allPersons,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState("");

  // Local state mirrors — optimistic UI for removes
  const [localParents, setLocalParents] = useState(parents);
  const [localChildren, setLocalChildren] = useState(children);

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
