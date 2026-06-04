"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, X, Plus, Loader2 } from "lucide-react";
import { addFamilyLink, removeFamilyLink } from "@/lib/actions/family-links";

interface FamilyInfo {
  id: string;
  name: string;
  slug: string;
}

export interface FamilyLinkData {
  id: string;
  otherFamily: FamilyInfo;
  linkType: "KINSHIP" | "IN_LAW";
  description: string | null;
}

interface Props {
  currentFamilyId: string;
  familyLinks: FamilyLinkData[];
  allFamilies: FamilyInfo[];
  canManage: boolean;
}

const LINK_LABELS: Record<string, string> = {
  KINSHIP: "نسب",
  IN_LAW: "مصاهرة",
};

export function FamilyLinksSection({
  currentFamilyId,
  familyLinks,
  allFamilies,
  canManage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [linkType, setLinkType] = useState<"KINSHIP" | "IN_LAW">("KINSHIP");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const linkedIds = new Set(familyLinks.map((l) => l.otherFamily.id));
  const available = allFamilies.filter((f) => !linkedIds.has(f.id));

  if (familyLinks.length === 0 && !canManage) return null;

  function handleAdd() {
    if (!selectedFamilyId) return;
    setError("");
    startTransition(async () => {
      const r = await addFamilyLink(
        currentFamilyId,
        selectedFamilyId,
        linkType,
        description || undefined
      );
      if (r.success) {
        setShowForm(false);
        setSelectedFamilyId("");
        setDescription("");
        router.refresh();
      } else {
        setError(r.error ?? "حدث خطأ");
      }
    });
  }

  function handleRemove(linkId: string) {
    startTransition(async () => {
      await removeFamilyLink(linkId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      {/* Label */}
      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
        <Link2 className="h-3.5 w-3.5" />
        عائلات مرتبطة:
      </span>

      {/* Links list */}
      {familyLinks.map((link) => (
        <div key={link.id} className="flex items-center gap-0.5 group">
          <Link
            href={`/family/${encodeURIComponent(link.otherFamily.slug)}`}
            className="text-xs bg-secondary/60 hover:bg-secondary px-2.5 py-0.5 rounded-full text-foreground/80 hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {link.otherFamily.name}
            <span className="text-[10px] text-muted-foreground">
              ({LINK_LABELS[link.linkType]})
            </span>
          </Link>
          {canManage && (
            <button
              onClick={() => handleRemove(link.id)}
              disabled={isPending}
              title="إزالة الرابط"
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* Add link button/form */}
      {canManage && !showForm && available.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          ربط عائلة
        </button>
      )}

      {showForm && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedFamilyId}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            aria-label="اختر عائلة"
            className="text-xs border border-border/60 rounded-lg bg-card px-2 py-1 outline-none focus:border-primary/60"
          >
            <option value="">اختر عائلة...</option>
            {available.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as "KINSHIP" | "IN_LAW")}
            aria-label="نوع الرابط"
            className="text-xs border border-border/60 rounded-lg bg-card px-2 py-1 outline-none focus:border-primary/60"
          >
            <option value="KINSHIP">نسب</option>
            <option value="IN_LAW">مصاهرة</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={isPending || !selectedFamilyId}
            className="text-xs bg-primary/20 hover:bg-primary/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "ربط"}
          </button>
          <button
            onClick={() => { setShowForm(false); setError(""); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            إلغاء
          </button>
          {error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      )}
    </div>
  );
}
