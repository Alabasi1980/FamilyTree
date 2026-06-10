"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import {
  analyzeBranchUnificationImpact,
  reviewBranchUnificationRequest,
} from "@/lib/actions/branch-unification";

type ImpactData = Extract<
  Awaited<ReturnType<typeof analyzeBranchUnificationImpact>>,
  { success: true }
>;

export function BranchUnificationReviewCard({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [impact, setImpact] = useState<ImpactData | null>(null);

  // Step 1: fetch impact preview before showing the confirm button
  function handleApproveClick() {
    setError("");
    startTransition(async () => {
      const result = await analyzeBranchUnificationImpact(requestId);
      if (!result.success) {
        setError(result.error ?? "تعذر تحليل التأثير");
        return;
      }
      setImpact(result as ImpactData);
    });
  }

  // Step 2: confirmed — execute the actual approval
  function confirmApprove() {
    setError("");
    startTransition(async () => {
      const result = await reviewBranchUnificationRequest(requestId, true);
      if (!result.success) {
        setError(result.error ?? "تعذر تنفيذ طلب توحيد الفرعين");
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    setError("");
    setImpact(null);
    startTransition(async () => {
      const result = await reviewBranchUnificationRequest(requestId, false);
      if (!result.success) {
        setError(result.error ?? "تعذر تنفيذ طلب توحيد الفرعين");
        return;
      }
      router.refresh();
    });
  }

  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  // ── Impact preview panel ────────────────────────────────────────────────────
  if (impact) {
    return (
      <div className="flex flex-col gap-2 max-w-72">
        <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-xs space-y-2">
          <p className="font-medium text-foreground">معاينة التوحيد</p>

          <p className="text-muted-foreground">
            {impact.summary.movingCount} شخص سيحصل على عضوية في العائلة الموحَّدة
          </p>

          {impact.sharedParentsToCreate.map((parent, i) => (
            <p key={i} className="text-muted-foreground">
              إنشاء{" "}
              <span className="text-foreground">
                {parent.gender === "MALE" ? "أب مشترك" : "أم مشتركة"}:
              </span>{" "}
              {parent.name}
            </p>
          ))}

          {impact.summary.hasWarnings && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="h-3 w-3" />
                علاقات ستصبح عابرة للعائلتين
              </div>
              {impact.crossFamilyMarriages.map((m) => (
                <p key={m.marriageId} className="text-amber-300/80">
                  زواج: {m.personA.fullName} × {m.personB.fullName}
                </p>
              ))}
              {impact.crossFamilyParentLinks.map((link, i) => (
                <p key={i} className="text-amber-300/80">
                  أبوة: {link.parent.fullName} ← {link.child.fullName}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 justify-end">
          <button
            onClick={() => setImpact(null)}
            className="rounded bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
            type="button"
          >
            إلغاء
          </button>
          <button
            onClick={confirmApprove}
            className="rounded bg-green-900/40 px-2.5 py-1 text-xs text-green-300 transition-colors hover:bg-green-900/60"
            type="button"
          >
            تأكيد التوحيد
          </button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Default: approve / reject buttons ──────────────────────────────────────
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <button
          onClick={handleApproveClick}
          className="rounded bg-green-900/30 p-1.5 text-green-400 transition-colors hover:bg-green-900/50"
          title="معاينة وقبول"
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleReject}
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
