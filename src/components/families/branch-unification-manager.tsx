"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { GitMerge, Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitBranchUnificationRequest } from "@/lib/actions/branch-unification";

interface PersonOption {
  id: string;
  fullName: string;
}

interface TargetFamilyOption {
  id: string;
  name: string;
  persons: PersonOption[];
}

interface Props {
  currentFamilyId: string;
  currentPersons: PersonOption[];
  targetFamilies: TargetFamilyOption[];
}

export default function BranchUnificationManager({
  currentFamilyId,
  currentPersons,
  targetFamilies,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [sourcePersonId, setSourcePersonId] = useState("");
  const [targetFamilyId, setTargetFamilyId] = useState("");
  const [targetPersonId, setTargetPersonId] = useState("");
  const [relationship, setRelationship] = useState<"FULL_SIBLINGS" | "PATERNAL_SIBLINGS" | "MATERNAL_SIBLINGS">("FULL_SIBLINGS");
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const selectedTargetFamily = useMemo(
    () => targetFamilies.find((f) => f.id === targetFamilyId),
    [targetFamilies, targetFamilyId]
  );

  const step1Complete = !!sourcePersonId && !!targetFamilyId && !!targetPersonId;

  const textValue = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSent(false);
    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    startTransition(async () => {
      const result = await submitBranchUnificationRequest({
        sourceFamilyId: currentFamilyId,
        targetFamilyId,
        sourcePersonId,
        targetPersonId,
        relationship,
        sharedFatherName: textValue(form.get("sharedFatherName")),
        sharedMotherName: textValue(form.get("sharedMotherName")),
        notes: textValue(form.get("notes")),
      });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
        return;
      }

      setSent(true);
      setStep(1);
      setSourcePersonId("");
      setTargetFamilyId("");
      setTargetPersonId("");
      setRelationship("FULL_SIBLINGS");
      setShowNotes(false);
      formElement.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs leading-5 text-muted-foreground">
        اطلب توحيد فرعين دون حذف أي شخص. سيتم إنشاء والد/والدة مشتركين بعد موافقة الطرفين.
      </p>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 1 ? "bg-accent text-background" : "bg-accent/20 text-accent"}`}>
          1
        </span>
        <span className={step === 1 ? "text-foreground font-medium" : "text-muted-foreground"}>اختر الأشخاص</span>
        <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 2 ? "bg-accent text-background" : "bg-muted/30 text-muted-foreground"}`}>
          2
        </span>
        <span className={step === 2 ? "text-foreground font-medium" : "text-muted-foreground"}>صلة القرابة</span>
      </div>

      {/* ── Step 1: Who ── */}
      {step === 1 && (
        <div className="space-y-3">
          <Select label="شخص من عائلتك" value={sourcePersonId} onChange={setSourcePersonId} required>
            <option value="">اختر...</option>
            {currentPersons.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </Select>

          <Select
            label="العائلة الأخرى"
            value={targetFamilyId}
            onChange={(value) => { setTargetFamilyId(value); setTargetPersonId(""); }}
            required
          >
            <option value="">اختر...</option>
            {targetFamilies.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>

          <Select
            label="الشخص من العائلة الأخرى"
            value={targetPersonId}
            onChange={setTargetPersonId}
            required
            disabled={!selectedTargetFamily}
          >
            <option value="">اختر...</option>
            {(selectedTargetFamily?.persons ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </Select>

          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={!step1Complete}
            onClick={() => setStep(2)}
          >
            التالي
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Step 2: Relationship ── */}
      {step === 2 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
            تعديل الاختيار
          </button>

          <Select
            label="نوع الرابط"
            value={relationship}
            onChange={(v) => setRelationship(v as typeof relationship)}
            required
          >
            <option value="FULL_SIBLINGS">أخوة أشقاء</option>
            <option value="PATERNAL_SIBLINGS">أخوة من الأب</option>
            <option value="MATERNAL_SIBLINGS">أخوة من الأم</option>
          </Select>

          {(relationship === "FULL_SIBLINGS" || relationship === "PATERNAL_SIBLINGS") && (
            <Field name="sharedFatherName" label="اسم الوالد المشترك (اختياري)" />
          )}
          {(relationship === "FULL_SIBLINGS" || relationship === "MATERNAL_SIBLINGS") && (
            <Field name="sharedMotherName" label="اسم الوالدة المشتركة (اختياري)" />
          )}

          {/* Collapsible notes */}
          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-3 w-3" />
              إضافة ملاحظة للمراجع
            </button>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ملاحظة للمراجعة</label>
              <textarea
                name="notes"
                rows={2}
                maxLength={1000}
                title="ملاحظة للمراجعة"
                placeholder="أي تفاصيل تساعد المراجع على الفهم..."
                className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
          {sent && <p className="text-xs text-emerald-400">تم إرسال الطلب</p>}

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <GitMerge className="ml-1 h-3.5 w-3.5" />}
            إرسال طلب التوحيد
          </Button>
        </div>
      )}
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="h-8 w-full rounded-md border border-input bg-background/50 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input name={name} className="h-8 bg-background/50 text-sm" />
    </div>
  );
}
