"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createShareLink,
  deactivateShareLink,
} from "@/lib/actions/share";
import { Copy, Link2, Trash2, Eye, EyeOff, Lock } from "lucide-react";

interface ShareLinkRow {
  id: string;
  token: string;
  hasPassword: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface ShareLinkManagerProps {
  familyId: string;
  links: ShareLinkRow[];
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:9322";

export default function ShareLinkManager({
  familyId,
  links: initialLinks,
}: ShareLinkManagerProps) {
  const [links, setLinks] = useState<ShareLinkRow[]>(initialLinks);
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const res = await createShareLink(familyId, {
        password: password.trim() || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      const expiresAt = expiresInDays
        ? new Date(Date.now() + Number(expiresInDays) * 86_400_000)
        : null;
      setLinks((prev) => [
        {
          id: res.token, // temp id until revalidation
          token: res.token,
          hasPassword: !!password.trim(),
          expiresAt,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setPassword("");
      setExpiresInDays("");
      setShowForm(false);
    });
  }

  function handleDelete(linkId: string, token: string) {
    startTransition(async () => {
      await deactivateShareLink(linkId);
      setLinks((prev) => prev.filter((l) => l.token !== token));
    });
  }

  function copyToClipboard(token: string) {
    navigator.clipboard.writeText(`${APP_URL}/share/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function formatExpiry(d: Date | null) {
    if (!d) return "لا ينتهي";
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return "منتهي الصلاحية";
    return `ينتهي بعد ${diff} يوم`;
  }

  return (
    <div className="space-y-3">
      {/* Existing links */}
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground">لا توجد روابط مشاركة حتى الآن.</p>
      )}

      {links.map((link) => (
        <div
          key={link.token}
          className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 text-sm"
        >
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
            /share/{link.token.slice(0, 12)}…
          </span>
          {link.hasPassword && (
            <Lock className="h-3.5 w-3.5 text-yellow-500" title="محمي بكلمة مرور" />
          )}
          <span className="text-muted-foreground text-xs mr-auto">
            {formatExpiry(link.expiresAt)}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="نسخ الرابط"
            onClick={() => copyToClipboard(link.token)}
            disabled={isPending}
          >
            <Copy className={`h-3.5 w-3.5 ${copiedToken === link.token ? "text-green-500" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="إلغاء الرابط"
            onClick={() => handleDelete(link.id, link.token)}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {/* Create form */}
      {showForm ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة مرور (اختياري)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-9 text-sm"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Input
            type="number"
            min="1"
            max="365"
            placeholder="تنتهي بعد (أيام) — اتركه فارغاً للدائم"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="text-sm"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              {isPending ? "جارٍ الإنشاء…" : "إنشاء"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setPassword("");
                setExpiresInDays("");
                setError("");
              }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Link2 className="h-4 w-4 ml-1" />
          رابط مشاركة جديد
        </Button>
      )}
    </div>
  );
}
