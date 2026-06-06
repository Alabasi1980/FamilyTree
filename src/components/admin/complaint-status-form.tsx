"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateComplaintStatus } from "@/lib/actions/complaints";
import type { ComplaintStatus } from "@/generated/prisma/client";
import { Loader2, Save } from "lucide-react";

interface Props {
  complaintId: string;
  currentStatus: ComplaintStatus;
  initialResponse?: string | null;
}

const statusOptions: Array<{ value: ComplaintStatus; label: string }> = [
  { value: "OPEN", label: "مفتوحة" },
  { value: "IN_REVIEW", label: "قيد المراجعة" },
  { value: "WAITING_USER", label: "بانتظار المستخدم" },
  { value: "RESOLVED", label: "محلولة" },
  { value: "CLOSED", label: "مغلقة" },
];

export function ComplaintStatusForm({ complaintId, currentStatus, initialResponse }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateComplaintStatus(complaintId, {
        status: data.get("status"),
        adminResponse: data.get("adminResponse"),
      });

      if (!result.success) {
        setError(result.error ?? "تعذر تحديث الشكوى");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-8 rounded-md border border-input bg-background/50 px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <input
          name="adminResponse"
          defaultValue={initialResponse ?? ""}
          maxLength={3000}
          placeholder="رد مختصر يظهر لصاحب الشكوى..."
          className="h-8 rounded-md border border-input bg-background/50 px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <Save className="ml-1 h-3.5 w-3.5" />}
          حفظ
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-green-400">تم تحديث الشكوى</p>}
    </form>
  );
}
