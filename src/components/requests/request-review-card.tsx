"use client";

import { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { reviewRequest } from "@/lib/actions/requests";

interface Props {
  requestId: string;
  type: "admin" | "edit";
}

export function RequestReviewCard({ requestId, type }: Props) {
  const [isPending, startTransition] = useTransition();

  function handle(approve: boolean) {
    startTransition(async () => {
      await reviewRequest(requestId, type, approve);
    });
  }

  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handle(true)}
        className="p-1.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
        title="قبول"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handle(false)}
        className="p-1.5 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
        title="رفض"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
