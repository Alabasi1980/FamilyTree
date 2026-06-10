"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, TreePine, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFamilyRequest } from "@/lib/actions/families";
import { withBasePath } from "@/lib/base-path";
import { SimilarFamiliesSection } from "@/components/families/similar-families-section";
import { HomelandPlaceSelector } from "@/components/homelands/homeland-place-selector";

export default function NewFamilyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [successResult, setSuccessResult] = useState<{ familyId?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createFamilyRequest({
          name: form.get("name") as string,
          originSummary: form.get("originSummary") as string,
          historicalNotes: form.get("historicalNotes") as string,
          homelandCountry: form.get("homelandCountry") as string,
          homelandRegion: form.get("homelandRegion") as string,
          homelandCity: form.get("homelandCity") as string,
          homelandNote: form.get("homelandNote") as string,
          homelandConfidence: (form.get("homelandConfidence") as string || "UNSPECIFIED") as
            | "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED",
          homelandPlaceId: form.get("homelandPlaceId") as string,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }

        setSuccessResult({ familyId: result.familyId });
      } catch {
        setError("حدث خطأ غير متوقع أثناء الإرسال. يرجى المحاولة مرة أخرى.");
      }
    });
  }

  // ── حالة النجاح ──────────────────────────────────────────────────────────────
  if (successResult) {
    const isDirect = !!successResult.familyId;
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/families" className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">إضافة عائلة جديدة</h1>
        </div>

        <div className="rounded-2xl border border-green-800/40 bg-green-900/10 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-900/30 border border-green-700/40">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
          </div>

          {isDirect ? (
            <>
              <p className="text-base font-semibold text-foreground">تم إنشاء العائلة بنجاح</p>
              <p className="text-sm text-muted-foreground">
                عائلة <span className="font-medium text-foreground">{familyName}</span> جاهزة الآن — يمكنك البدء بإضافة الأفراد.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="gold"
                  onClick={() => router.push(withBasePath(`/dashboard/families/${successResult.familyId}`))}
                >
                  <TreePine className="h-4 w-4 ml-2" />
                  افتح العائلة
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-foreground">تم إرسال الطلب بنجاح</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                طلب إنشاء عائلة <span className="font-medium text-foreground">{familyName}</span> قيد المراجعة من مدير النظام.
                ستصلك إشعاراً بالموافقة أو الرفض قريباً.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(withBasePath("/dashboard/requests"))}
                >
                  <ClipboardList className="h-4 w-4 ml-2" />
                  متابعة حالة الطلب
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(withBasePath("/dashboard"))}
                >
                  العودة للوحة التحكم
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── النموذج ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/families" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">إضافة عائلة جديدة</h1>
      </div>

      {/* توضيح مسار المراجعة */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 flex gap-3 text-sm">
        <ClipboardList className="h-4 w-4 shrink-0 mt-0.5 text-accent/80" />
        <span className="text-muted-foreground">
          سيُرسل طلبك لمراجعة مدير النظام وستتلقى إشعاراً عند الموافقة.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* اسم العائلة */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            اسم العائلة <span className="text-destructive">*</span>
          </label>
          <Input
            name="name"
            placeholder="الأحمدي"
            required
            minLength={2}
            className="bg-card/60"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
          />
        </div>

        <SimilarFamiliesSection name={familyName} isLoggedIn={true} />

        {/* الموطن */}
        <div className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">موطن العائلة</h2>
          <HomelandPlaceSelector compact />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              مستوى التوثيق
              <span className="mr-2 text-xs font-normal text-muted-foreground">(اختياري)</span>
            </label>
            <select
              name="homelandConfidence"
              defaultValue="UNSPECIFIED"
              aria-label="مستوى التوثيق"
              className="h-10 w-full rounded-md border border-input bg-card/60 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="UNSPECIFIED">غير محدد</option>
              <option value="LIKELY">مرجّح — متوارث شفهياً</option>
              <option value="VERIFIED">مؤكد — بوثائق</option>
              <option value="UNDOCUMENTED">غير موثق</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              ملاحظة عن الموطن
              <span className="mr-2 text-xs font-normal text-muted-foreground">(اختياري)</span>
            </label>
            <Input
              name="homelandNote"
              placeholder="مثلاً: الأصل من هذه البلدة، مع فروع لاحقة في مدن أخرى..."
              className="bg-card/60"
            />
          </div>
        </div>

        {/* ملخص الأصل */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            ملخص الأصل والمنشأ
            <span className="mr-2 text-xs font-normal text-muted-foreground">(اختياري)</span>
          </label>
          <textarea
            name="originSummary"
            placeholder="موجز عن أصل العائلة وفروعها..."
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* ملاحظات تاريخية */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            ملاحظات تاريخية
            <span className="mr-2 text-xs font-normal text-muted-foreground">(اختياري)</span>
          </label>
          <textarea
            name="historicalNotes"
            placeholder="تاريخ العائلة، الأحداث البارزة..."
            maxLength={2000}
            rows={4}
            className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="gold" disabled={isPending}>
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</>
              : "إرسال الطلب"
            }
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
