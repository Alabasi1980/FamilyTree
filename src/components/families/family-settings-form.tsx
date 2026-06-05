"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFamily } from "@/lib/actions/families";

type HomelandConfidence = "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";

interface Props {
  familyId: string;
  initialData: {
    name: string;
    originSummary: string;
    isPublic: boolean;
    homelandCountry: string;
    homelandRegion: string;
    homelandCity: string;
    homelandNote: string;
    homelandConfidence: HomelandConfidence;
  };
}

const labels = {
  familyName:
    "\u0627\u0633\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  originSummary:
    "\u0645\u0644\u062e\u0635 \u0627\u0644\u0623\u0635\u0644",
  homeland:
    "\u0645\u0648\u0637\u0646 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  country: "\u0627\u0644\u062f\u0648\u0644\u0629",
  region:
    "\u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629 / \u0627\u0644\u0645\u0646\u0637\u0642\u0629",
  city:
    "\u0627\u0644\u0645\u062f\u064a\u0646\u0629 / \u0627\u0644\u0642\u0631\u064a\u0629",
  homelandNote:
    "\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0645\u0648\u0637\u0646",
  confidence:
    "\u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u0648\u062b\u064a\u0642",
  public:
    "\u0639\u0627\u0645\u0629 (\u0645\u0631\u0626\u064a\u0629 \u0644\u0644\u062c\u0645\u064a\u0639)",
  private:
    "\u062e\u0627\u0635\u0629 (\u0644\u0644\u0645\u0633\u0624\u0648\u0644\u064a\u0646 \u0641\u0642\u0637)",
  saved:
    "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638",
  save:
    "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a",
  error:
    "\u062d\u062f\u062b \u062e\u0637\u0623",
  unspecified:
    "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
  likely: "\u0645\u0631\u062c\u062d",
  verified: "\u0645\u0624\u0643\u062f",
  undocumented:
    "\u063a\u064a\u0631 \u0645\u0648\u062b\u0642",
};

export function FamilySettingsForm({ familyId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(initialData.isPublic);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateFamily(familyId, {
        name: form.get("name") as string,
        originSummary: form.get("originSummary") as string,
        homelandCountry: form.get("homelandCountry") as string,
        homelandRegion: form.get("homelandRegion") as string,
        homelandCity: form.get("homelandCity") as string,
        homelandNote: form.get("homelandNote") as string,
        homelandConfidence: form.get("homelandConfidence") as HomelandConfidence,
        isPublic,
      });

      if (!result.success) {
        setError(result.error ?? labels.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{labels.familyName}</label>
        <Input name="name" defaultValue={initialData.name} required className="bg-background/50 h-8 text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{labels.originSummary}</label>
        <textarea
          name="originSummary"
          defaultValue={initialData.originSummary}
          maxLength={500}
          rows={3}
          className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-3">
        <h3 className="text-xs font-semibold text-foreground">{labels.homeland}</h3>
        <div className="grid grid-cols-1 gap-2">
          <Field name="homelandCountry" label={labels.country} value={initialData.homelandCountry} />
          <Field name="homelandRegion" label={labels.region} value={initialData.homelandRegion} />
          <Field name="homelandCity" label={labels.city} value={initialData.homelandCity} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{labels.confidence}</label>
            <select name="homelandConfidence" defaultValue={initialData.homelandConfidence}
              className="h-8 w-full rounded-md border border-input bg-background/50 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" >
              <option value="UNSPECIFIED">{labels.unspecified}</option>
              <option value="LIKELY">{labels.likely}</option>
              <option value="VERIFIED">{labels.verified}</option>
              <option value="UNDOCUMENTED">{labels.undocumented}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{labels.homelandNote}</label>
            <textarea
              name="homelandNote"
              defaultValue={initialData.homelandNote}
              maxLength={500}
              rows={2}
              className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic(!isPublic)}
          className={`w-9 h-5 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              isPublic ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
        <label className="text-xs text-muted-foreground cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
          {isPublic ? labels.public : labels.private}
        </label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5 ml-1 text-green-400" />
        ) : null}
        {saved ? labels.saved : labels.save}
      </Button>
    </form>
  );
}

function Field({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input name={name} defaultValue={value} className="bg-background/50 h-8 text-sm" />
    </div>
  );
}
