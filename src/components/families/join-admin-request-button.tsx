"use client";

import { useTransition, useState } from "react";
import { Loader2, UserPlus, Check, X } from "lucide-react";
import { submitJoinFamilyAdminRequest } from "@/lib/actions/requests";

interface Props {
  familyId: string;
  hasPendingRequest?: boolean;
  initialContactEmail?: string | null;
  initialContactPhone?: string | null;
  compact?: boolean;
}

export function JoinAdminRequestButton({
  familyId,
  hasPendingRequest,
  initialContactEmail,
  initialContactPhone,
  compact = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(hasPendingRequest ?? false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitJoinFamilyAdminRequest(familyId, {
        applicantRelationship: form.get("applicantRelationship") as string,
        applicantMessage: form.get("applicantMessage") as string,
        applicantContactEmail: form.get("applicantContactEmail") as string,
        applicantContactPhone: form.get("applicantContactPhone") as string,
      });
      if (result.success) {
        setSubmitted(true);
        setIsOpen(false);
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
    <div className={compact ? "relative" : "flex flex-col items-end gap-2"}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isPending}
          className={
            compact
              ? "text-[11px] bg-primary/15 hover:bg-primary/25 text-foreground px-2 py-1 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
              : "flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
          }
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          طلب الانضمام كمسؤول
        </button>
      )}

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className={
            compact
              ? "mt-2 w-72 space-y-2 rounded-lg border border-border/50 bg-card p-3 shadow-xl"
              : "w-full max-w-md space-y-2 rounded-lg border border-border/50 bg-card/80 p-3 text-right shadow-xl"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">معلومات طلب الانضمام</p>
              <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                اكتب معلومات تساعد مسؤول العائلة على التحقق والتواصل.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            name="applicantRelationship"
            required
            minLength={2}
            maxLength={120}
            placeholder="صلتك بالعائلة: ابن عم، حفيد، قريب..."
            className="h-8 w-full rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <textarea
            name="applicantMessage"
            required
            minLength={20}
            maxLength={1000}
            rows={3}
            placeholder="لماذا تريد الانضمام كمسؤول؟ وما المعلومات التي تثبت صلتك أو دورك؟"
            className="w-full resize-none rounded-md border border-input bg-background/50 px-2.5 py-2 text-xs leading-5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              name="applicantContactEmail"
              type="email"
              defaultValue={initialContactEmail ?? ""}
              placeholder="البريد الإلكتروني"
              className="h-8 w-full rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              name="applicantContactPhone"
              defaultValue={initialContactPhone ?? ""}
              placeholder="رقم الهاتف"
              className="h-8 w-full rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            يجب توفر بريد أو رقم هاتف واحد على الأقل للمراجعة.
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-3 py-1.5 text-xs text-foreground hover:bg-primary/30 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              إرسال الطلب
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
