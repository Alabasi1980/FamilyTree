"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { MailWarning, Phone, TreePine, Loader2, CheckCircle2, ChevronDown, ChevronUp, X } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("bastan_alerts_dismissed") === "1") setDismissed(true);
    if (localStorage.getItem("bastan_alerts_collapsed") === "1") setCollapsed(true);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("bastan_alerts_dismissed", "1");
  }

  function handleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("bastan_alerts_collapsed", next ? "1" : "0");
  }

  const showEmailAlert = !isGoogleUser && !emailVerified;
  const showPhoneAlert = !hasPhone;
  const showLinkAlert = !linkedPersonId;

  const totalPending = [showEmailAlert, showPhoneAlert, showLinkAlert].filter(Boolean).length;
  const totalItems = [true, showPhoneAlert, showLinkAlert].filter(Boolean).length; // email always counts if not google

  if (!showEmailAlert && !showPhoneAlert && !showLinkAlert) return null;
  if (dismissed) return null;

  function handleSendEmail() {
    startTransition(async () => {
      const res = await sendVerificationEmail();
      if (res.success) setEmailSent(true);
    });
  }

  const completedCount = [!showEmailAlert || isGoogleUser, !showPhoneAlert, !showLinkAlert].filter(Boolean).length;
  const totalSteps = isGoogleUser ? 2 : 3;
  const progressClass =
    completedCount === 0 ? "w-0"
    : completedCount >= totalSteps ? "w-full"
    : isGoogleUser ? "w-1/2"
    : completedCount === 1 ? "w-1/3"
    : "w-2/3";

  return (
    <div className="mb-4 rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      {/* رأس البطاقة */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/30">
        <button
          type="button"
          onClick={handleCollapse}
          className="flex items-center gap-2.5 flex-1 text-right"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-900/30 border border-amber-700/40">
            <span className="text-xs font-bold text-amber-400">{totalPending}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">أكمل إعداد حسابك</p>
            <p className="text-xs text-muted-foreground">
              {completedCount} من {!isGoogleUser ? 3 : 2} خطوات مكتملة
            </p>
          </div>
          {/* شريط تقدم */}
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted/40 overflow-hidden shrink-0">
            <div className={`h-full rounded-full bg-accent/70 transition-all duration-500 ${progressClass}`} />
          </div>
          {collapsed
            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          }
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
          title="إخفاء"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* قائمة الخطوات */}
      {!collapsed && (
        <ul className="divide-y divide-border/25">

          {/* 1. التحقق من البريد */}
          {!isGoogleUser && (
            <li className="flex items-center gap-3 px-4 py-3">
              {emailVerified
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                : <MailWarning className="h-4 w-4 shrink-0 text-amber-400" />
              }
              <span className={`flex-1 text-sm ${emailVerified ? "text-muted-foreground line-through" : "text-foreground"}`}>
                تأكيد البريد الإلكتروني
              </span>
              {!emailVerified && (
                emailSent ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    أُرسل
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={isPending}
                    className="text-xs text-accent hover:underline disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    إرسال رمز التأكيد
                  </button>
                )
              )}
            </li>
          )}

          {/* 2. رقم الهاتف */}
          <li className="flex items-center gap-3 px-4 py-3">
            {!showPhoneAlert
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              : <Phone className="h-4 w-4 shrink-0 text-muted-foreground/70" />
            }
            <span className={`flex-1 text-sm ${!showPhoneAlert ? "text-muted-foreground line-through" : "text-foreground"}`}>
              إضافة رقم الهاتف
            </span>
            {showPhoneAlert && (
              <Link href="/dashboard/settings" className="text-xs text-accent hover:underline shrink-0">
                أضف رقم هاتف
              </Link>
            )}
          </li>

          {/* 3. الربط بالشجرة */}
          <li className="flex items-center gap-3 px-4 py-3">
            {!showLinkAlert
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              : <TreePine className="h-4 w-4 shrink-0 text-muted-foreground/70" />
            }
            <span className={`flex-1 text-sm ${!showLinkAlert ? "text-muted-foreground line-through" : "text-foreground"}`}>
              ربط حسابك بورقتك في الشجرة
            </span>
            {showLinkAlert && (
              <Link href="/search" className="text-xs text-accent hover:underline shrink-0">
                ابحث عن نفسك
              </Link>
            )}
          </li>

        </ul>
      )}
    </div>
  );
}
