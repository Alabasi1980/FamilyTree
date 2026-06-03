"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFamily } from "@/lib/actions/families";

interface Props {
  familyId: string;
  initialData: { name: string; originSummary: string; isPublic: boolean };
}

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
        isPublic,
      });

      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">اسم العائلة</label>
        <Input name="name" defaultValue={initialData.name} required className="bg-background/50 h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">ملخص الأصل</label>
        <textarea
          name="originSummary"
          defaultValue={initialData.originSummary}
          maxLength={500}
          rows={3}
          className="w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
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
          {isPublic ? "عامة (مرئية للجميع)" : "خاصة (للمسؤولين فقط)"}
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5 ml-1 text-green-400" />
        ) : null}
        {saved ? "تم الحفظ" : "حفظ التغييرات"}
      </Button>
    </form>
  );
}
