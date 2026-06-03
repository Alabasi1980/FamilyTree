"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { approveFamilyLink, rejectFamilyLink } from "@/lib/actions/family-links";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  linkId: string;
}

export function ApproveFamilyLinkButton({ linkId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveFamilyLink(linkId);
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleApprove}
      disabled={isPending}
      className="text-green-600 hover:text-green-700 hover:bg-green-500/10 gap-1.5"
    >
      <CheckCircle2 className="h-4 w-4" />
      {isPending ? "جارٍ…" : "قبول"}
    </Button>
  );
}

export function RejectFamilyLinkButton({ linkId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReject() {
    startTransition(async () => {
      await rejectFamilyLink(linkId);
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleReject}
      disabled={isPending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
    >
      <XCircle className="h-4 w-4" />
      {isPending ? "جارٍ…" : "رفض"}
    </Button>
  );
}
