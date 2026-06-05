"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { GitMerge, Loader2 } from "lucide-react";
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

const labels = {
  intro:
    "\u0627\u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0641\u0631\u0639\u064a\u0646 \u062f\u0648\u0646 \u062d\u0630\u0641 \u0623\u064a \u0634\u062e\u0635. \u0633\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0648\u0627\u0644\u062f/\u0648\u0627\u0644\u062f\u0629 \u0645\u0634\u062a\u0631\u0643\u064a\u0646 \u0628\u0639\u062f \u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0637\u0631\u0641\u064a\u0646.",
  localPerson:
    "\u0634\u062e\u0635 \u0645\u0646 \u0639\u0627\u0626\u0644\u062a\u0643",
  targetFamily:
    "\u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0623\u062e\u0631\u0649",
  targetPerson:
    "\u0627\u0644\u0634\u062e\u0635 \u0645\u0646 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0623\u062e\u0631\u0649",
  relationship:
    "\u0646\u0648\u0639 \u0627\u0644\u0631\u0627\u0628\u0637",
  full:
    "\u0623\u062e\u0648\u0629 \u0623\u0634\u0642\u0627\u0621",
  paternal:
    "\u0623\u062e\u0648\u0629 \u0645\u0646 \u0627\u0644\u0623\u0628",
  maternal:
    "\u0623\u062e\u0648\u0629 \u0645\u0646 \u0627\u0644\u0623\u0645",
  fatherName:
    "\u0627\u0633\u0645 \u0627\u0644\u0648\u0627\u0644\u062f \u0627\u0644\u0645\u0634\u062a\u0631\u0643",
  motherName:
    "\u0627\u0633\u0645 \u0627\u0644\u0648\u0627\u0644\u062f\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0629",
  optional:
    "\u0627\u062e\u062a\u064a\u0627\u0631\u064a",
  notes:
    "\u0645\u0644\u0627\u062d\u0638\u0629 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  submit:
    "\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062a\u0648\u062d\u064a\u062f",
  sent:
    "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628",
  choose:
    "\u0627\u062e\u062a\u0631...",
  error:
    "\u062d\u062f\u062b \u062e\u0637\u0623",
};

export default function BranchUnificationManager({
  currentFamilyId,
  currentPersons,
  targetFamilies,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [sourcePersonId, setSourcePersonId] = useState("");
  const [targetFamilyId, setTargetFamilyId] = useState("");
  const [targetPersonId, setTargetPersonId] = useState("");
  const [relationship, setRelationship] = useState<"FULL_SIBLINGS" | "PATERNAL_SIBLINGS" | "MATERNAL_SIBLINGS">("FULL_SIBLINGS");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const selectedTargetFamily = useMemo(
    () => targetFamilies.find((family) => family.id === targetFamilyId),
    [targetFamilies, targetFamilyId]
  );

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
        setError(result.error ?? labels.error);
        return;
      }

      setSent(true);
      setTargetFamilyId("");
      setTargetPersonId("");
      setSourcePersonId("");
      formElement.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs leading-6 text-muted-foreground">{labels.intro}</p>

      <Select label={labels.localPerson} value={sourcePersonId} onChange={setSourcePersonId} required>
        <option value="">{labels.choose}</option>
        {currentPersons.map((person) => (
          <option key={person.id} value={person.id}>
            {person.fullName}
          </option>
        ))}
      </Select>

      <Select
        label={labels.targetFamily}
        value={targetFamilyId}
        onChange={(value) => {
          setTargetFamilyId(value);
          setTargetPersonId("");
        }}
        required
      >
        <option value="">{labels.choose}</option>
        {targetFamilies.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </Select>

      <Select label={labels.targetPerson} value={targetPersonId} onChange={setTargetPersonId} required disabled={!selectedTargetFamily}>
        <option value="">{labels.choose}</option>
        {(selectedTargetFamily?.persons ?? []).map((person) => (
          <option key={person.id} value={person.id}>
            {person.fullName}
          </option>
        ))}
      </Select>

      <Select label={labels.relationship} value={relationship} onChange={(value) => setRelationship(value as typeof relationship)} required>
        <option value="FULL_SIBLINGS">{labels.full}</option>
        <option value="PATERNAL_SIBLINGS">{labels.paternal}</option>
        <option value="MATERNAL_SIBLINGS">{labels.maternal}</option>
      </Select>

      {(relationship === "FULL_SIBLINGS" || relationship === "PATERNAL_SIBLINGS") && (
        <Field name="sharedFatherName" label={`${labels.fatherName} (${labels.optional})`} />
      )}
      {(relationship === "FULL_SIBLINGS" || relationship === "MATERNAL_SIBLINGS") && (
        <Field name="sharedMotherName" label={`${labels.motherName} (${labels.optional})`} />
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{labels.notes}</label>
        <textarea
          name="notes"
          rows={2}
          maxLength={1000}
          className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {sent && <p className="text-xs text-emerald-400">{labels.sent}</p>}

      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={isPending || !sourcePersonId || !targetFamilyId || !targetPersonId}
      >
        {isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <GitMerge className="ml-1 h-3.5 w-3.5" />}
        {labels.submit}
      </Button>
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
        onChange={(event) => onChange(event.target.value)}
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
