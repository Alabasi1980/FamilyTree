"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { appBasePath } from "@/lib/base-path";

interface FamilyShareButtonProps {
  familyName: string;
  familySlug: string;
}

function getFamilyUrl(slug: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}${appBasePath}/family/${slug}`;
}

export function FamilyShareButton({ familyName, familySlug }: FamilyShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = getFamilyUrl(familySlug);
    const text = `عائلة ${familyName} — بستان الأصول`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  function handleWhatsApp() {
    const url = getFamilyUrl(familySlug);
    const text = encodeURIComponent(`عائلة ${familyName} — بستان الأصول\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        title="مشاركة عبر واتساب"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-green-500/10 hover:text-green-500"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.533 5.851L.054 23.25a.75.75 0 0 0 .918.983l5.65-1.48A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.72 9.72 0 0 1-4.964-1.362l-.356-.21-3.695.968.986-3.601-.232-.373A9.717 9.717 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </button>

      {/* Copy link */}
      <button
        onClick={handleShare}
        title={copied ? "تم النسخ!" : "نسخ رابط العائلة"}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-accent/10 hover:text-accent"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
