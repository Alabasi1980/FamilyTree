"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { reviewHomelandPlaceRequest } from "@/lib/actions/homelands";

export function HomelandPlaceRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function review(approve: boolean) {
    setError("");
    startTransition(async () => {
      const result = await reviewHomelandPlaceRequest(requestId, approve);
      if (!result.success) {
        setError(result.error ?? "تعذر مراجعة الطلب");
        return;
      }
      router.refresh();
    });
  }

  if (isPending) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => review(true)}
          className="rounded bg-green-900/30 p-1.5 text-green-400 transition-colors hover:bg-green-900/50"
          title="اعتماد"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => review(false)}
          className="rounded bg-red-900/30 p-1.5 text-red-400 transition-colors hover:bg-red-900/50"
          title="رفض"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="max-w-48 text-xs text-destructive">{error}</p>}
    </div>
  );
}
