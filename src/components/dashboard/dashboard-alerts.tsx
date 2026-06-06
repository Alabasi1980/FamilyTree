"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MailWarning, Phone, TreePine, Loader2, CheckCircle } from "lucide-react";
import { sendVerificationEmail } from "@/lib/actions/verification";

interface Props {
  emailVerified: boolean;
  hasPhone: boolean;
  linkedPersonId: string | null;
  isGoogleUser: boolean;
}

export function DashboardAlerts({ emailVerified, hasPhone, linkedPersonId, isGoogleUser }: Props) {
  const [emailSent, setEmailSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showEmailAlert = !isGoogleUser && !emailVerified;
  const showPhoneAlert = !hasPhone;
  const showLinkAlert = !linkedPersonId;

  if (!showEmailAlert && !showPhoneAlert && !showLinkAlert) return null;

  function handleSendEmail() {
    startTransition(async () => {
      const res = await sendVerificationEmail();
      if (res.success) setEmailSent(true);
    });
  }

  return (
    <div className="space-y-1.5 mb-4">
      {showEmailAlert && (
        <Alert icon={<MailWarning className="h-4 w-4 shrink-0" />}>
          <span>لم تؤكد بريدك الإلكتروني بعد.</span>
          {emailSent ? (
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <CheckCircle className="h-3 w-3" />
              أُرسل — تحقق من بريدك
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isPending}
              className="flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              أرسل رمز التأكيد
            </button>
          )}
          <Link href="/dashboard/settings" className="text-xs underline underline-offset-2 hover:no-underline">
            الإعدادات
          </Link>
        </Alert>
      )}

      {showPhoneAlert && (
        <Alert icon={<Phone className="h-4 w-4 shrink-0" />}>
          <span>رقم هاتفك مفقود — مطلوب لإشعارات واتساب لاحقاً.</span>
          <Link href="/dashboard/settings" className="text-xs underline underline-offset-2 hover:no-underline">
            أضف رقم هاتف
          </Link>
        </Alert>
      )}

      {showLinkAlert && (
        <Alert icon={<TreePine className="h-4 w-4 shrink-0" />}>
          <span>لم يتم ربطك بأي شجرة عائلة بعد.</span>
          <Link href="/search" className="text-xs underline underline-offset-2 hover:no-underline">
            ابحث عن نفسك في الشجرة
          </Link>
        </Alert>
      )}
    </div>
  );
}

function Alert({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-700/40 bg-amber-900/10 px-3 py-2 text-sm text-amber-200/90">
      <span className="text-amber-400">{icon}</span>
      <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">{children}</div>
    </div>
  );
}
