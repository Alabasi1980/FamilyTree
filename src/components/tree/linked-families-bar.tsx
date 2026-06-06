"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TreePine, Link2, ExternalLink, Plus, X, Loader2,
  Check, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkedFamilyInfo } from "./linked-families-panel";
import { listFamiliesForLinking, proposeFamilyLink } from "@/lib/actions/family-links";

type LinkType = "KINSHIP" | "IN_LAW";

const linkColors: Record<LinkType, { chip: string; activeBg: string; dot: string }> = {
  KINSHIP: {
    chip: "border-emerald-500/30 bg-emerald-500/8 text-emerald-300",
    activeBg: "border-emerald-500/60 bg-emerald-500/15 shadow-emerald-500/10",
    dot: "bg-emerald-400",
  },
  IN_LAW: {
    chip: "border-amber-500/30 bg-amber-500/8 text-amber-300",
    activeBg: "border-amber-500/60 bg-amber-500/15 shadow-amber-500/10",
    dot: "bg-amber-400",
  },
};

const linkTypeLabels: Record<LinkType, string> = {
  KINSHIP: "نسب",
  IN_LAW: "مصاهرة",
};

interface Props {
  linkedFamilies: LinkedFamilyInfo[];
  activeFamilyId: string | null;
  connectionCounts: Record<string, number>;
  onFamilyToggle: (id: string | null) => void;
  canManage: boolean;
  familyId: string;
  familySlug: string;
  isSystemAdmin?: boolean;
}

export function LinkedFamiliesBar({
  linkedFamilies,
  activeFamilyId,
  connectionCounts,
  onFamilyToggle,
  canManage,
  familyId,
  familySlug,
  isSystemAdmin = false,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const hasLinkedFamilies = linkedFamilies.length > 0;

  // Don't render bar at all if nothing to show
  if (!hasLinkedFamilies && !canManage) return null;

  return (
    <div
      dir="rtl"
      className="flex shrink-0 items-center gap-1.5 border-b border-border/30 bg-background/40 px-3 py-1.5 backdrop-blur-sm"
    >
      {/* Label */}
      <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60">
        <Link2 className="h-3 w-3" />
        <span className="uppercase tracking-widest">مرتبطة بـ</span>
      </div>

      {/* Scrollable chips area */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none">
        {!hasLinkedFamilies && canManage && (
          <span className="text-xs text-muted-foreground/40 italic">
            لا توجد عائلات مرتبطة بعد
          </span>
        )}

        {linkedFamilies.map((family) => {
          const count = connectionCounts[family.familyId] ?? 0;
          const isActive = activeFamilyId === family.familyId;
          const colors = linkColors[family.linkType];

          return (
            <div key={family.id} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onFamilyToggle(isActive ? null : family.familyId)}
                className={cn(
                  "flex items-center gap-1.5 rounded-r-full rounded-l border py-0.5 pl-2.5 pr-1.5 text-xs transition-all duration-150",
                  isActive
                    ? cn(colors.activeBg, "shadow-sm")
                    : cn(colors.chip, "hover:opacity-80")
                )}
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
                <span className="max-w-28 truncate font-medium">{family.name}</span>
                <span className="rounded border border-current/20 bg-current/10 px-1 py-px text-[10px] opacity-70">
                  {linkTypeLabels[family.linkType]}
                </span>
                {count > 0 && (
                  <span className="text-[10px] opacity-60">{count}</span>
                )}
              </button>
              <Link
                href={`/family/${encodeURIComponent(family.slug)}`}
                target="_blank"
                className={cn(
                  "flex items-center justify-center rounded-l-full rounded-r border border-r-0 p-1 text-muted-foreground/50 transition-colors hover:text-foreground",
                  isActive ? "border-current/40" : "border-border/30 hover:bg-muted/30"
                )}
                title={`فتح عائلة ${family.name}`}
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          );
        })}

        {/* Clear active */}
        {activeFamilyId && (
          <button
            type="button"
            onClick={() => onFamilyToggle(null)}
            title="إلغاء التظليل"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Network link */}
        {hasLinkedFamilies && familySlug && (
          <Link
            href={`/family/${encodeURIComponent(familySlug)}/network`}
            className="flex items-center gap-1 rounded-lg border border-border/30 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            title="خريطة شبكة العائلات"
          >
            <Network className="h-3 w-3" />
            <span className="hidden sm:inline">الشبكة</span>
          </Link>
        )}

        {/* Add linked family (admins only) */}
        {canManage && (
          <div className="nodrag nopan nowheel relative">
            <button
              ref={addBtnRef}
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors",
                showAddForm
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border/30 text-muted-foreground hover:border-accent/40 hover:bg-accent/5 hover:text-foreground"
              )}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">ربط عائلة</span>
            </button>

            {showAddForm && (
              <AddLinkForm
                familyId={familyId}
                isSystemAdmin={isSystemAdmin}
                onClose={() => setShowAddForm(false)}
                anchorRef={addBtnRef}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Link Form ─────────────────────────────────────────────────────────────

interface AddLinkFormProps {
  familyId: string;
  isSystemAdmin: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

function AddLinkForm({ familyId, isSystemAdmin, onClose, anchorRef }: AddLinkFormProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [families, setFamilies] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState("");
  const [linkType, setLinkType] = useState<LinkType>("KINSHIP");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listFamiliesForLinking(familyId).then((data) => {
      setFamilies(data);
      setLoading(false);
    });
  }, [familyId]);

  useEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = 288;
      const margin = 12;
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  const filtered = searchQuery.trim()
    ? families.filter((f) => f.name.includes(searchQuery.trim()))
    : families;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) { setError("اختر عائلة"); return; }
    setError("");
    startTransition(async () => {
      const res = await proposeFamilyLink(familyId, targetId, linkType, description.trim() || undefined);
      if (!res.success) { setError(res.error ?? "حدث خطأ"); return; }
      setSuccess(true);
      router.refresh();
      setTimeout(onClose, 1200);
    });
  }

  const dialog = (
    <div
      ref={ref}
      className="nodrag nopan nowheel pointer-events-auto fixed z-[9999] w-72 rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/30 backdrop-blur-sm"
      style={{ top: position.top, left: position.left }}
      dir="rtl"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Link2 className="h-3.5 w-3.5 text-accent" />
          ربط عائلة
        </div>
        <button type="button" onClick={onClose} aria-label="إغلاق"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {success ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-green-400">
          <Check className="h-4 w-4" />
          {isSystemAdmin ? "تم الربط بنجاح" : "أُرسل الطلب للمراجعة"}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 p-3">
          {/* Link type */}
          <div className="grid grid-cols-2 gap-1.5">
            {(["KINSHIP", "IN_LAW"] as const).map((type) => {
              const colors = linkColors[type];
              const active = linkType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLinkType(type)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all",
                    active ? cn(colors.activeBg, "shadow-sm") : "border-border/40 text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                  {linkTypeLabels[type]}
                </button>
              );
            })}
          </div>

          {/* Family search */}
          <div className="space-y-1.5">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن عائلة..."
              className="h-8 w-full rounded-md border border-input bg-background/60 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <div className="max-h-36 overflow-y-auto rounded-md border border-border/40 bg-background/40">
              {loading ? (
                <div className="flex items-center justify-center gap-1.5 py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جارٍ التحميل...
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {searchQuery.trim() ? "لا نتائج" : "لا توجد عائلات متاحة"}
                </p>
              ) : (
                filtered.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTargetId(f.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-right text-xs transition-colors hover:bg-muted/30",
                      targetId === f.id && "bg-accent/10 text-accent"
                    )}
                  >
                    <TreePine className="h-3 w-3 shrink-0 opacity-60" />
                    <span className="flex-1 truncate">{f.name}</span>
                    {targetId === f.id && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Description */}
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف الصلة (اختياري)"
            className="h-8 w-full rounded-md border border-input bg-background/60 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />

          {/* Info note */}
          {!isSystemAdmin && (
            <p className="text-[10px] text-muted-foreground/60 leading-4">
              سيُرسَل طلب ربط للمراجعة من مدير النظام.
            </p>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !targetId}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent/20 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/30 disabled:opacity-40"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isSystemAdmin ? "ربط" : "إرسال الطلب"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}
