"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { reviewCrossMarriageRequest } from "@/lib/actions/cross-family-marriages";

interface Props {
  requestId: string;
}

export function CrossFamilyMarriageReviewCard({ requestId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handle(approve: boolean) {
    setError("");
    startTransition(async () => {
      const result = await reviewCrossMarriageRequest(requestId, approve);
      if (!result.success) {
        setError(result.error ?? "تعذر تنفيذ الطلب");
        return;
      }
      router.refresh();
    });
  }

  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <button
          onClick={() => handle(true)}
          className="rounded bg-green-900/30 p-1.5 text-green-400 transition-colors hover:bg-green-900/50"
          title="موافقة"
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => handle(false)}
          className="rounded bg-red-900/30 p-1.5 text-red-400 transition-colors hover:bg-red-900/50"
          title="رفض"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="max-w-56 text-xs text-destructive">{error}</p>}
    </div>
  );
}
