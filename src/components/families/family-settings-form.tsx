"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, Globe, Loader2, MapPinned, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFamily } from "@/lib/actions/families";
import { HomelandPlaceSelector } from "@/components/homelands/homeland-place-selector";

type HomelandConfidence = "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";

interface Props {
  familyId: string;
  initialData: {
    name: string;
    originSummary: string;
    isPublic: boolean;
    hideFemaleMembersFromPublic: boolean;
    homelandCountry: string;
    homelandRegion: string;
    homelandCity: string;
    homelandNote: string;
    homelandConfidence: HomelandConfidence;
    homelandPlaceId?: string | null;
  };
}

const confidenceLabels: Record<HomelandConfidence, string> = {
  UNSPECIFIED: "غير محدد",
  LIKELY: "مرجح",
  VERIFIED: "موثق",
  UNDOCUMENTED: "غير موثق",
};

export function FamilySettingsForm({ familyId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(initialData.isPublic);
  const [hideFemale, setHideFemale] = useState(initialData.hideFemaleMembersFromPublic);

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
        homelandPlaceId: form.get("homelandPlaceId") as string,
        isPublic,
        hideFemaleMembersFromPublic: hideFemale,
      });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ أثناء الحفظ");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-4 rounded-xl border border-border/50 bg-background/25 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">البيانات الأساسية</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">اسم العائلة</label>
            <Input name="name" defaultValue={initialData.name} required className="bg-background/60" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">ملخص الأصل</label>
            <textarea
              name="originSummary"
              defaultValue={initialData.originSummary}
              maxLength={500}
              rows={7}
              placeholder="نبذة مختصرة عن أصل العائلة أو الرواية العامة..."
              className="w-full resize-none rounded-md border border-input bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/50 bg-background/25 p-4">
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">موطن العائلة</h3>
          </div>

          <HomelandPlaceSelector
            initialPlaceId={initialData.homelandPlaceId}
            initialCountry={initialData.homelandCountry}
            initialRegion={initialData.homelandRegion}
            initialCity={initialData.homelandCity}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">حالة التوثيق</label>
              <select
                name="homelandConfidence"
                defaultValue={initialData.homelandConfidence}
                className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(confidenceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">ملاحظة الموطن</label>
              <Input
                name="homelandNote"
                defaultValue={initialData.homelandNote}
                maxLength={500}
                placeholder="معلومة إضافية أو درجة التأكد..."
                className="bg-background/60"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-background/25 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((value) => !value)}
          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right transition-colors ${
            isPublic
              ? "border-emerald-500/35 bg-emerald-500/10"
              : "border-border/50 bg-card/40"
          }`}
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              {isPublic ? "العائلة عامة" : "العائلة خاصة"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isPublic ? "تظهر في العرض العام والبحث حسب صلاحيات الأفراد." : "لا تظهر للزوار غير المصرح لهم."}
            </span>
          </span>
          {isPublic ? <Globe className="h-5 w-5 text-emerald-400" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={hideFemale}
          onClick={() => setHideFemale((value) => !value)}
          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right transition-colors ${
            hideFemale
              ? "border-rose-500/35 bg-rose-500/10"
              : "border-border/50 bg-card/40"
          }`}
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              {hideFemale ? "إخفاء الإناث عن الزوار" : "إظهار الإناث حسب خصوصية كل فرد"}
            </span>
            <span className="text-xs text-muted-foreground">
              هذا خيار عام إضافي، ولا يلغي مستوى ظهور كل شخص.
            </span>
          </span>
          {hideFemale ? <EyeOff className="h-5 w-5 text-rose-300" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
        </button>

        <div className="flex flex-col gap-2">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="min-w-40" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : null}
            {saved ? "تم الحفظ" : "حفظ التغييرات"}
          </Button>
        </div>
      </section>
    </form>
  );
}

