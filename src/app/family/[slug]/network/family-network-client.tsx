"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FamilyNetwork } from "@/components/tree/family-network";
import type { FamilyNetworkResult } from "@/lib/network/get-family-network";

interface Props {
  network: FamilyNetworkResult;
  canManage: boolean;
  familySlug: string;
  currentExpandIds: string[];
}

export function FamilyNetworkClient({ network, canManage, familySlug, currentExpandIds }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleExpandFamily = useCallback((famId: string) => {
    const existingExpand = searchParams.get("expand");
    const ids = new Set(existingExpand ? existingExpand.split(",") : currentExpandIds);
    ids.add(famId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("expand", Array.from(ids).join(","));
    router.push(`/family/${encodeURIComponent(familySlug)}/network?${params.toString()}`);
  }, [searchParams, currentExpandIds, router, familySlug]);

  return (
    <FamilyNetwork
      {...network}
      canManage={canManage}
      familySlug={familySlug}
      onExpandFamily={handleExpandFamily}
    />
  );
}
