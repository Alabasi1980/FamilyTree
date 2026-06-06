"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitComplaint } from "@/lib/actions/complaints";
import { Loader2, Send } from "lucide-react";

interface FamilyOption {
  id: string;
  name: string;
}

interface Props {
  families: FamilyOption[];
}

const complaintTypes = [
  { value: "ACCOUNT_ACCESS", label: "مشكلة وصول أو حساب" },
  { value: "FAMILY_ADMINISTRATION", label: "إدارة أو صلاحيات عائلة" },
  { value: "DATA_CORRECTION", label: "تصحيح بيانات" },
  { value: "PRIVACY_SAFETY", label: "خصوصية أو سلامة" },
  { value: "FAMILY_LINKING", label: "ربط عائلات أو توحيد فروع" },
  { value: "TECHNICAL_ISSUE", label: "مشكلة تقنية" },
  { value: "OTHER", label: "أخرى" },
];

export function ComplaintSubmitForm({ families }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);
    const form = event.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const result = await submitComplaint({
        type: data.get("type"),
        familyId: data.get("familyId"),
        title: data.get("title"),
        body: data.get("body"),
      });

      if (!result.success) {
        setError(result.error ?? "تعذر إرسال الشكوى");
        return;
      }

      form.reset();
      setSent(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">نوع الشكوى</label>
          <select
            name="type"
            required
            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {complaintTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">العائلة المرتبطة</label>
          <select
            name="familyId"
            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">بدون عائلة محددة</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">العنوان</label>
        <Input name="title" required minLength={3} maxLength={160} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">التفاصيل</label>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {sent && <p className="text-xs text-green-400">تم إرسال الشكوى إلى مدير النظام</p>}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Send className="ml-1 h-4 w-4" />}
        إرسال الشكوى
      </Button>
    </form>
  );
}
