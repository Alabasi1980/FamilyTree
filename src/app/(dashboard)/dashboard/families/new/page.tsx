"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFamilyRequest } from "@/lib/actions/families";
import { withBasePath } from "@/lib/base-path";
import { SimilarFamiliesSection } from "@/components/families/similar-families-section";
import { HomelandPlaceSelector } from "@/components/homelands/homeland-place-selector";

const labels = {
  title:
    "\u0625\u0636\u0627\u0641\u0629 \u0639\u0627\u0626\u0644\u0629 \u062c\u062f\u064a\u062f\u0629",
  reviewNote:
    "\u0625\u0630\u0627 \u0644\u0645 \u062a\u0643\u0646 \u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645\u060c \u0633\u064a\u0631\u0633\u0644 \u0637\u0644\u0628\u0643 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u0633\u062a\u062a\u0644\u0642\u0649 \u0625\u0634\u0639\u0627\u0631\u0627 \u0639\u0646\u062f \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629.",
  familyName:
    "\u0627\u0633\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  familyNamePlaceholder: "\u0627\u0644\u0623\u062d\u0645\u062f\u064a",
  homeland:
    "\u0645\u0648\u0637\u0646 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  homelandHint:
    "\u064a\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u0648\u0637\u0646 \u0639\u0644\u0649 \u062a\u0645\u064a\u064a\u0632 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a \u0627\u0644\u0645\u062a\u0634\u0627\u0628\u0647\u0629 \u0639\u0646\u062f \u062a\u0648\u0633\u0639 \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0639\u0627\u0644\u0645\u064a\u0627.",
  country: "\u0627\u0644\u062f\u0648\u0644\u0629",
  countryPlaceholder: "\u0627\u0644\u0623\u0631\u062f\u0646",
  region:
    "\u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629 / \u0627\u0644\u0645\u0646\u0637\u0642\u0629",
  regionPlaceholder: "\u0625\u0631\u0628\u062f",
  city:
    "\u0627\u0644\u0645\u062f\u064a\u0646\u0629 / \u0627\u0644\u0642\u0631\u064a\u0629",
  cityPlaceholder: "\u0628\u0644\u062f\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629",
  confidence:
    "\u062d\u0627\u0644\u0629 \u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u0645\u0648\u0637\u0646",
  confidenceUnspecified:
    "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
  confidenceLikely: "\u0645\u0631\u062c\u062d",
  confidenceVerified: "\u0645\u0624\u0643\u062f",
  confidenceUndocumented:
    "\u063a\u064a\u0631 \u0645\u0648\u062b\u0642",
  homelandNote:
    "\u0645\u0644\u0627\u062d\u0638\u0629 \u0639\u0646 \u0627\u0644\u0645\u0648\u0637\u0646",
  homelandNotePlaceholder:
    "\u0645\u062b\u0644\u0627: \u0627\u0644\u0623\u0635\u0644 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0628\u0644\u062f\u0629\u060c \u0645\u0639 \u0641\u0631\u0648\u0639 \u0644\u0627\u062d\u0642\u0629 \u0641\u064a \u0645\u062f\u0646 \u0623\u062e\u0631\u0649...",
  originSummary:
    "\u0645\u0644\u062e\u0635 \u0627\u0644\u0623\u0635\u0644 \u0648\u0627\u0644\u0645\u0646\u0634\u0623",
  originSummaryPlaceholder:
    "\u0645\u0648\u062c\u0632 \u0639\u0646 \u0623\u0635\u0644 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0648\u0641\u0631\u0648\u0639\u0647\u0627...",
  historicalNotes:
    "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u062a\u0627\u0631\u064a\u062e\u064a\u0629",
  historicalNotesPlaceholder:
    "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0639\u0627\u0626\u0644\u0629\u060c \u0627\u0644\u0623\u062d\u062f\u0627\u062b \u0627\u0644\u0628\u0627\u0631\u0632\u0629...",
  submit:
    "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628",
  cancel: "\u0625\u0644\u063a\u0627\u0621",
};

export default function NewFamilyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [familyName, setFamilyName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFamilyRequest({
        name: form.get("name") as string,
        originSummary: form.get("originSummary") as string,
        historicalNotes: form.get("historicalNotes") as string,
        homelandCountry: form.get("homelandCountry") as string,
        homelandRegion: form.get("homelandRegion") as string,
        homelandCity: form.get("homelandCity") as string,
        homelandNote: form.get("homelandNote") as string,
        homelandConfidence: form.get("homelandConfidence") as
          | "VERIFIED"
          | "LIKELY"
          | "UNDOCUMENTED"
          | "UNSPECIFIED",
        homelandPlaceId: form.get("homelandPlaceId") as string,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.familyId) {
        router.push(withBasePath(`/dashboard/families/${result.familyId}`));
      } else {
        router.push(withBasePath("/dashboard/requests"));
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/families" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">{labels.title}</h1>
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 flex gap-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
        <span>{labels.reviewNote}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {labels.familyName} <span className="text-destructive">*</span>
          </label>
          <Input
            name="name"
            placeholder={labels.familyNamePlaceholder}
            required
            minLength={2}
            className="bg-card/60"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
          />
        </div>

        <SimilarFamiliesSection name={familyName} isLoggedIn={true} />

        <div className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{labels.homeland}</h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{labels.homelandHint}</p>
          </div>
          <HomelandPlaceSelector compact />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{labels.confidence}</label>
              <select
                name="homelandConfidence"
                defaultValue="UNSPECIFIED"
                className="h-10 w-full rounded-md border border-input bg-card/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="UNSPECIFIED">{labels.confidenceUnspecified}</option>
                <option value="LIKELY">{labels.confidenceLikely}</option>
                <option value="VERIFIED">{labels.confidenceVerified}</option>
                <option value="UNDOCUMENTED">{labels.confidenceUndocumented}</option>
              </select>
            </div>
            <Field name="homelandNote" label={labels.homelandNote} placeholder={labels.homelandNotePlaceholder} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{labels.originSummary}</label>
          <textarea
            name="originSummary"
            placeholder={labels.originSummaryPlaceholder}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{labels.historicalNotes}</label>
          <textarea
            name="historicalNotes"
            placeholder={labels.historicalNotesPlaceholder}
            maxLength={2000}
            rows={5}
            className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="gold" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {labels.submit}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {labels.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input name={name} placeholder={placeholder} className="bg-card/60" />
    </div>
  );
}
