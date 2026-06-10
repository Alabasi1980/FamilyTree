"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { proposeFamilyLink, deleteFamilyLink } from "@/lib/actions/family-links";
import { Link2, TreePine, Trash2, Clock, CheckCircle2 } from "lucide-react";

interface FamilyOption {
  id: string;
  name: string;
}

interface LinkedFamily {
  linkId: string;
  familyId: string;
  familyName: string;
  linkType: "KINSHIP" | "IN_LAW";
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface FamilyLinkManagerProps {
  currentFamilyId: string;
  isSystemAdmin: boolean;
  links: LinkedFamily[];
  otherFamilies: FamilyOption[];
}

const LINK_TYPE_LABELS: Record<"KINSHIP" | "IN_LAW", string> = {
  KINSHIP: "نسب",
  IN_LAW: "مصاهرة",
};

const STATUS_LABELS: Record<"PENDING" | "APPROVED" | "REJECTED", string> = {
  PENDING: "بانتظار الموافقة",
  APPROVED: "مُوافق عليه",
  REJECTED: "مرفوض",
};

export default function FamilyLinkManager({
  currentFamilyId,
  isSystemAdmin,
  links: initialLinks,
  otherFamilies,
}: FamilyLinkManagerProps) {
  const [links, setLinks] = useState<LinkedFamily[]>(initialLinks);
  const [showForm, setShowForm] = useState(false);
  const [targetFamilyId, setTargetFamilyId] = useState("");
  const [linkType, setLinkType] = useState<"KINSHIP" | "IN_LAW">("KINSHIP");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }, []);

  const approvedLinks = links.filter((l) => l.status === "APPROVED");
  const pendingLinks = links.filter((l) => l.status === "PENDING");

  function handlePropose() {
    if (!targetFamilyId) {
      setError("اختر عائلة");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await proposeFamilyLink(
        currentFamilyId,
        targetFamilyId,
        linkType,
        description.trim() || undefined
      );
      if (!res.success) {
        setError(res.error ?? "حدث خطأ");
        return;
      }
      const targetFamily = otherFamilies.find((f) => f.id === targetFamilyId)!;
      const status = isSystemAdmin ? "APPROVED" : "PENDING";
      setLinks((prev) => [
        {
          linkId: `temp-${Date.now()}`,
          familyId: targetFamilyId,
          familyName: targetFamily.name,
          linkType,
          description: description.trim() || null,
          status,
        },
        ...prev,
      ]);
      setTargetFamilyId("");
      setDescription("");
      setShowForm(false);
      showSuccess(
        status === "APPROVED"
          ? `تم ربط عائلة ${targetFamily.name} بنجاح`
          : `تم إرسال اقتراح الربط مع عائلة ${targetFamily.name} — في انتظار الموافقة`
      );
    });
  }

  function handleDelete(linkId: string) {
    startTransition(async () => {
      await deleteFamilyLink(linkId);
      setLinks((prev) => prev.filter((l) => l.linkId !== linkId));
    });
  }

  return (
    <div className="space-y-4">
      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Approved links */}
      {approvedLinks.length === 0 && pendingLinks.length === 0 && !successMsg && (
        <p className="text-sm text-muted-foreground">لا توجد روابط مع عائلات أخرى.</p>
      )}

      {approvedLinks.length > 0 && (
        <div className="space-y-2">
          {approvedLinks.map((link) => (
            <div
              key={link.linkId}
              className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm"
            >
              <TreePine className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">عائلة {link.familyName}</span>
              <Badge variant="outline" className="text-xs">
                {LINK_TYPE_LABELS[link.linkType]}
              </Badge>
              {link.description && (
                <span className="text-muted-foreground text-xs truncate max-w-[120px]">
                  {link.description}
                </span>
              )}
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto" />
              {isSystemAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(link.linkId)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pending links */}
      {pendingLinks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">معلق</p>
          {pendingLinks.map((link) => (
            <div
              key={link.linkId}
              className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-2 text-sm"
            >
              <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
              <span className="text-foreground">عائلة {link.familyName}</span>
              <Badge variant="outline" className="text-xs">
                {LINK_TYPE_LABELS[link.linkType]}
              </Badge>
              <span className="text-yellow-600 text-xs mr-auto">
                {STATUS_LABELS.PENDING}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDelete(link.linkId)}
                disabled={isPending}
                title="إلغاء الاقتراح"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Propose form */}
      {showForm ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <select
            aria-label="اختر عائلة"
            value={targetFamilyId}
            onChange={(e) => setTargetFamilyId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">اختر عائلة…</option>
            {otherFamilies.map((f) => (
              <option key={f.id} value={f.id}>
                عائلة {f.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="linkType"
                value="KINSHIP"
                checked={linkType === "KINSHIP"}
                onChange={() => setLinkType("KINSHIP")}
                className="accent-primary"
              />
              نسب
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="linkType"
                value="IN_LAW"
                checked={linkType === "IN_LAW"}
                onChange={() => setLinkType("IN_LAW")}
                className="accent-primary"
              />
              مصاهرة
            </label>
          </div>

          <input
            type="text"
            placeholder="وصف (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handlePropose} disabled={isPending}>
              {isPending ? "جارٍ الإرسال…" : isSystemAdmin ? "ربط" : "اقتراح"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setTargetFamilyId("");
                setDescription("");
                setError("");
              }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
          disabled={otherFamilies.length === 0}
        >
          <Link2 className="h-4 w-4 ml-1" />
          {isSystemAdmin ? "ربط عائلة" : "اقتراح ربط عائلة"}
        </Button>
      )}
    </div>
  );
}
