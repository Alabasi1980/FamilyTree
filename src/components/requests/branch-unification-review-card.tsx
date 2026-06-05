"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { reviewBranchUnificationRequest } from "@/lib/actions/branch-unification";

interface Props {
  requestId: string;
}

const labels = {
  approve: "\u0642\u0628\u0648\u0644",
  reject: "\u0631\u0641\u0636",
  failed: "\u062a\u0639\u0630\u0631 \u062a\u0646\u0641\u064a\u0630 \u0637\u0644\u0628 \u062a\u0648\u062d\u064a\u062f \u0627\u0644\u0641\u0631\u0639\u064a\u0646",
};

export function BranchUnificationReviewCard({ requestId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handle(approve: boolean) {
    setError("");
    startTransition(async () => {
      const result = await reviewBranchUnificationRequest(requestId, approve);
      if (!result.success) {
        setError(result.error ?? labels.failed);
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
          title={labels.approve}
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => handle(false)}
          className="rounded bg-red-900/30 p-1.5 text-red-400 transition-colors hover:bg-red-900/50"
          title={labels.reject}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="max-w-56 text-xs text-destructive">{error}</p>}
    </div>
  );
}
