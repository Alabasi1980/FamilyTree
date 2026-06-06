"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { changeUserRole } from "@/lib/actions/admin";
import type { AccountType } from "@/generated/prisma/client";

interface Props {
  userId: string;
  currentRole: AccountType;
}

const nextRole: Record<AccountType, AccountType> = {
  VISITOR: "MEMBER",
  MEMBER: "SYSTEM_ADMIN",
  SYSTEM_ADMIN: "MEMBER",
};

const nextLabel: Record<AccountType, string> = {
  VISITOR: "رفع الدور العام لعضو",
  MEMBER: "رفع الدور العام لمدير",
  SYSTEM_ADMIN: "تغيير الدور العام لعضو",
};

export function ChangeUserRoleButton({ userId, currentRole }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await changeUserRole(userId, nextRole[currentRole]);
      if (!result.success) setError(result.error ?? "تعذر تغيير الدور");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        {nextLabel[currentRole]}
      </button>
      {error && <p className="max-w-44 text-left text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
