"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, Loader2, Check, ShieldCheck } from "lucide-react";
import { assignCoAdmin, removeCoAdmin } from "@/lib/actions/admin";
import { reviewRequest } from "@/lib/actions/requests";

interface AdminEntry {
  id: string;         // assignment id
  userId: string;
  displayName: string;
  email: string | null;
  isCurrentUser: boolean;
}

interface PendingJoinRequest {
  id: string;
  submittedByUserId: string;
  submitterName: string;
  relationship?: string | null;
  message?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface Props {
  familyId: string;
  admins: AdminEntry[];
  pendingJoinRequests: PendingJoinRequest[];
}

export function CoAdminManager({ familyId, admins: initialAdmins, pendingJoinRequests }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [admins, setAdmins] = useState(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleAssign() {
    if (!input.trim()) return;
    setError(""); setSuccess("");
    startTransition(async () => {
      const result = await assignCoAdmin(familyId, input.trim());
      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
      } else {
        setSuccess(`تم تعيين ${result.userName} مسؤولاً`);
        setInput(""); setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleRemove(assignmentId: string) {
    if (!confirm("هل تريد إزالة هذا المسؤول؟")) return;
    startTransition(async () => {
      const result = await removeCoAdmin(assignmentId, familyId);
      if (!result.success) {
        setError(result.error ?? "حدث خطأ");
      } else {
        setAdmins((prev) => prev.filter((a) => a.id !== assignmentId));
        router.refresh();
      }
    });
  }

  function handleReviewJoin(requestId: string, approve: boolean) {
    startTransition(async () => {
      await reviewRequest(requestId, "admin", approve);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* Current admins */}
      <ul className="space-y-1.5">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-accent border border-primary/20">
                {admin.displayName[0]?.toUpperCase() ?? "؟"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {admin.displayName}
                  {admin.isCurrentUser && <span className="text-xs text-muted-foreground mr-1">(أنت)</span>}
                </p>
                {admin.email && <p className="text-xs text-muted-foreground truncate">{admin.email}</p>}
              </div>
            </div>
            {!admin.isCurrentUser && (
              <button
                type="button"
                onClick={() => handleRemove(admin.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded"
                title="إزالة المسؤول"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Pending join requests */}
      {pendingJoinRequests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">طلبات الانضمام المعلقة</p>
          {pendingJoinRequests.map((req) => (
            <div key={req.id} className="space-y-2 rounded-lg border border-amber-700/30 bg-amber-900/10 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <p className="text-xs font-medium text-foreground truncate">{req.submitterName}</p>
                  </div>
                  {req.relationship && (
                    <p className="text-[11px] text-muted-foreground">الصلة: {req.relationship}</p>
                  )}
                  {(req.contactEmail || req.contactPhone) && (
                    <p className="text-[11px] text-muted-foreground">
                      التواصل: {[req.contactEmail, req.contactPhone].filter(Boolean).join(" / ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReviewJoin(req.id, true)}
                    disabled={isPending}
                    className="flex items-center gap-1 text-xs bg-green-900/30 hover:bg-green-900/50 text-green-400 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewJoin(req.id, false)}
                    disabled={isPending}
                    className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    رفض
                  </button>
                </div>
              </div>
              {req.message && (
                <p className="whitespace-pre-wrap rounded-md border border-border/30 bg-background/35 px-2 py-1.5 text-[11px] leading-5 text-muted-foreground">
                  {req.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add admin */}
      {showForm ? (
        <div className="space-y-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="البريد الإلكتروني أو رقم الهاتف"
            className="w-full h-8 rounded-md border border-input bg-background/50 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAssign()}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAssign}
              disabled={isPending || !input.trim()}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-primary/20 hover:bg-primary/30 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
              تعيين
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); setInput(""); }}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/40 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div>
          {success && <p className="text-xs text-green-400 mb-2">{success}</p>}
          <button
            type="button"
            onClick={() => { setShowForm(true); setSuccess(""); setError(""); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            تعيين مسؤول مشترك
          </button>
        </div>
      )}
    </div>
  );
}
