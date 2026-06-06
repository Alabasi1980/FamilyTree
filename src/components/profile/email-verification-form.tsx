"use client";

import { useState, useTransition } from "react";
import { sendVerificationEmail, verifyEmailOtp } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, MailCheck } from "lucide-react";

interface Props {
  email: string;
}

export function EmailVerificationForm({ email }: Props) {
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const res = await sendVerificationEmail();
      if (res.success) {
        setStep("sent");
      } else {
        setError(res.error ?? null);
      }
    });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyEmailOtp(code);
      if (res.success) {
        setVerified(true);
      } else {
        setError(res.error ?? null);
      }
    });
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <CheckCircle className="h-4 w-4" />
        تم تأكيد بريدك الإلكتروني بنجاح
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        سيُرسَل رمز تأكيد مكوّن من 6 أرقام إلى: <span className="text-foreground" dir="ltr">{email}</span>
      </p>

      {step === "idle" ? (
        <div className="space-y-2">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="button" variant="outline" size="sm" onClick={handleSend} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="h-3.5 w-3.5 ml-1.5 animate-spin" />جارٍ الإرسال...</>
            ) : (
              <><MailCheck className="h-3.5 w-3.5 ml-1.5" />أرسل رمز التأكيد</>
            )}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          <p className="text-xs text-green-400">أُرسل الرمز — صالح لمدة 15 دقيقة.</p>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="_ _ _ _ _ _"
              maxLength={6}
              className="text-center tracking-widest text-lg"
              autoFocus
            />
            <Button type="submit" variant="gold" size="sm" disabled={isPending || code.length < 6}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "تأكيد"}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="button"
            onClick={() => { setStep("idle"); setCode(""); setError(null); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            إعادة الإرسال
          </button>
        </form>
      )}
    </div>
  );
}
