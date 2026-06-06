"use client";

import { useState, useTransition } from "react";
import { UserCheck, Loader2, CheckCircle } from "lucide-react";
import { requestUserPersonLink } from "@/lib/actions/linking";

interface Props {
  personId: string;
}

export function LinkPersonButton({ personId }: Props) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await requestUserPersonLink(personId);
      if (res.success) {
        setDone(true);
      } else {
        setError(res.error ?? null);
      }
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400 py-1.5">
        <CheckCircle className="h-3.5 w-3.5" />
        أُرسل الطلب — في انتظار موافقة مسؤول العائلة
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 w-full justify-center rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        هذا أنا
      </button>
      {error && <p className="text-[11px] text-destructive text-center">{error}</p>}
    </div>
  );
}
