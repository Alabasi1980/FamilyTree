"use client";

import { useTransition, useState } from "react";
import { Loader2, UserPlus, Check } from "lucide-react";
import { submitJoinFamilyAdminRequest } from "@/lib/actions/requests";

interface Props {
  familyId: string;
  hasPendingRequest?: boolean;
}

export function JoinAdminRequestButton({ familyId, hasPendingRequest }: Props) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(hasPendingRequest ?? false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await submitJoinFamilyAdminRequest(familyId);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "حدث خطأ");
      }
    });
  }

  if (submitted) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-green-400" />
        طلبك قيد المراجعة
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        طلب الانضمام كمسؤول
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
