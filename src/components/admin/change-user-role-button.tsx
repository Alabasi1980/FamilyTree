"use client";

import { useTransition } from "react";
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
  VISITOR: "رفّع لعضو",
  MEMBER: "رفّع لمدير",
  SYSTEM_ADMIN: "خفّض لعضو",
};

export function ChangeUserRoleButton({ userId, currentRole }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await changeUserRole(userId, nextRole[currentRole]);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-accent hover:underline disabled:opacity-50 flex items-center gap-1"
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      {nextLabel[currentRole]}
    </button>
  );
}
