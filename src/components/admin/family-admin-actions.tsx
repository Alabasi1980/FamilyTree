"use client";

import { useTransition, useState } from "react";
import { Loader2, Globe, Lock, UserMinus, Trash2, RotateCcw } from "lucide-react";
import {
  toggleFamilyPublic,
  removeFamilyAdmin,
  deleteFamily,
  restoreFamily,
} from "@/lib/actions/admin";

// ── Toggle public/private ─────────────────────────────────────────────────

export function ToggleFamilyPublicButton({
  familyId,
  isPublic,
}: {
  familyId: string;
  isPublic: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleFamilyPublic(familyId))}
      disabled={pending}
      title={isPublic ? "تحويل لخاصة" : "تحويل لعامة"}
      className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPublic ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Globe className="h-3.5 w-3.5" />
      )}
      {isPublic ? "خاصة" : "عامة"}
    </button>
  );
}

// ── Remove family admin ───────────────────────────────────────────────────

export function RemoveFamilyAdminButton({ assignmentId }: { assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => removeFamilyAdmin(assignmentId))}
      disabled={pending}
      title="إزالة المسؤول"
      className="text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Delete / restore family ───────────────────────────────────────────────

export function DeleteFamilyButton({ familyId }: { familyId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-xs text-red-400 hover:underline flex items-center gap-1"
      >
        <Trash2 className="h-3.5 w-3.5" />
        حذف
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        onClick={() => startTransition(() => deleteFamily(familyId))}
        disabled={pending}
        className="text-xs text-red-400 font-semibold hover:underline disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "تأكيد الحذف"}
      </button>
      <button onClick={() => setConfirmed(false)} className="text-xs text-muted-foreground hover:underline">
        إلغاء
      </button>
    </span>
  );
}

export function RestoreFamilyButton({ familyId }: { familyId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => restoreFamily(familyId))}
      disabled={pending}
      className="text-xs text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      استعادة
    </button>
  );
}
