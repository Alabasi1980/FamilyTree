"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFamilyRequest } from "@/lib/actions/families";

export default function NewFamilyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFamilyRequest({
        name: form.get("name") as string,
        originSummary: form.get("originSummary") as string,
        historicalNotes: form.get("historicalNotes") as string,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.familyId) {
        router.push(`/dashboard/families/${result.familyId}`);
      } else {
        router.push("/dashboard/requests");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/families" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">إضافة عائلة جديدة</h1>
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 flex gap-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
        <span>
          إذا لم تكن مدير النظام، سيُرسل طلبك للمراجعة وستتلقى إشعاراً عند الموافقة.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            اسم العائلة <span className="text-destructive">*</span>
          </label>
          <Input name="name" placeholder="الأحمدي" required minLength={2} className="bg-card/60" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">ملخص الأصل والمنشأ</label>
          <textarea
            name="originSummary"
            placeholder="موجز عن أصل العائلة وموطنها..."
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">ملاحظات تاريخية</label>
          <textarea
            name="historicalNotes"
            placeholder="تاريخ العائلة، الأحداث البارزة..."
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
            إرسال الطلب
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
