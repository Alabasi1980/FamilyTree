"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HomelandGardenPlot {
  key: string;
  label: string;
  country?: string | null;
  familyCount: number;
  memberCount: number;
  familyNames: string[];
}

const labels = {
  explore: "استكشاف الموطن",
  families: "عائلات",
  family: "عائلة",
  members: "فرد",
  homelands: "مواطن",
  homeland: "موطن",
};

// ── Tree SVG — بسيط وعضوي ──────────────────────────────────────────────────

const treeSizes = { sm: 18, md: 26, lg: 38 } as const;
const treeOpacityClass: Record<string, string> = {
  "1":   "opacity-100",
  "0.85": "opacity-85",
  "0.75": "opacity-75",
  "0.65": "opacity-65",
  "0.6":  "opacity-60",
  "0.55": "opacity-55",
  "0.45": "opacity-45",
};

function TreeIcon({ size = "md", opacity = 1 }: { size?: "sm" | "md" | "lg"; opacity?: number }) {
  const dims = treeSizes[size];
  const cls = treeOpacityClass[String(opacity)] ?? "opacity-100";
  return (
    <svg
      width={dims}
      height={dims}
      viewBox="0 0 24 24"
      fill="none"
      className={cls}
      aria-hidden="true"
    >
      <path
        d="M12 2C8 2 5 6 5 9.5c0 2.5 1.5 4.5 3.5 5.5H10v5h4v-5h1.5c2-.9 3.5-3 3.5-5.5C19 6 16 2 12 2z"
        fill="currentColor"
      />
      <rect x="11" y="14" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// رسم غابة صغيرة تعكس حجم العائلة
function FamilyGrove({ count }: { count: number }) {
  if (count === 1) {
    return (
      <div className="flex items-end justify-center gap-0.5 text-primary/70">
        <TreeIcon size="lg" />
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="flex items-end justify-center gap-1 text-primary/70">
        <TreeIcon size="md" opacity={0.7} />
        <TreeIcon size="lg" />
      </div>
    );
  }
  if (count <= 4) {
    return (
      <div className="flex items-end justify-center gap-0.5 text-primary/70">
        <TreeIcon size="sm" opacity={0.55} />
        <TreeIcon size="md" opacity={0.75} />
        <TreeIcon size="lg" />
        <TreeIcon size="md" opacity={0.65} />
      </div>
    );
  }
  // كثير من العائلات = غابة كاملة
  return (
    <div className="flex items-end justify-center gap-0.5 text-primary/70">
      <TreeIcon size="sm" opacity={0.45} />
      <TreeIcon size="md" opacity={0.6} />
      <TreeIcon size="lg" />
      <TreeIcon size="lg" opacity={0.85} />
      <TreeIcon size="md" opacity={0.6} />
      <TreeIcon size="sm" opacity={0.45} />
    </div>
  );
}

// ── Card layout helpers ───────────────────────────────────────────────────

function getCardSpan(index: number, familyCount: number): string {
  // أول بطاقة أو أكبر مجموعة → عريضة
  if (index === 0 || familyCount >= 5) return "md:col-span-2";
  return "";
}

function getCardMinH(index: number, familyCount: number): string {
  if (index === 0 || familyCount >= 5) return "min-h-[280px]";
  if (familyCount >= 3) return "min-h-[240px]";
  return "min-h-[210px]";
}

// لون الـ accent بحسب الموطن (أقاليم متنوعة)
const accentPalette = [
  "from-primary/30 via-accent/8",
  "from-accent/25 via-primary/10",
  "from-emerald-600/20 via-primary/8",
  "from-teal-600/18 via-accent/8",
  "from-amber-700/15 via-primary/8",
];

// ── Main plot card ────────────────────────────────────────────────────────

function HomelandPlotCard({
  plot,
  index,
}: {
  plot: HomelandGardenPlot;
  index: number;
}) {
  const accent = accentPalette[index % accentPalette.length];
  const previewNames = plot.familyNames.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className={cn(getCardSpan(index, plot.familyCount))}
    >
      <Link
        href={`/homelands/${plot.key}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80",
          "transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5",
          getCardMinH(index, plot.familyCount)
        )}
      >
        {/* خلفية متدرجة علوية */}
        <div className={cn("absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b to-transparent opacity-90", accent)} />

        {/* نسيج دقيق */}
        <div className="card-texture pointer-events-none absolute inset-0 opacity-[0.025]" />

        {/* خط أرضي */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative flex flex-1 flex-col justify-between p-5 gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-background/50 text-accent shadow-inner">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-accent transition-colors duration-200">
                  {plot.label}
                </h3>
                {plot.country && (
                  <p className="text-xs text-muted-foreground mt-0.5">{plot.country}</p>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                {plot.familyCount} {plot.familyCount === 1 ? labels.family : labels.families}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Users className="h-3 w-3" />
                {plot.memberCount} {labels.members}
              </span>
            </div>
          </div>

          {/* الغابة */}
          <div className="flex justify-center py-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <FamilyGrove count={plot.familyCount} />
          </div>

          {/* أسماء العائلات — مُحسَّنة */}
          {previewNames.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                العائلات
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-border/40 bg-background/30 px-2.5 py-0.5 text-[11px] font-medium text-foreground/70 backdrop-blur-sm"
                  >
                    {name}
                  </span>
                ))}
                {plot.familyNames.length > 5 && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] text-accent/80 backdrop-blur-sm">
                    +{plot.familyNames.length - 5} أخرى
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-border/30 pt-3">
            <span className="flex items-center gap-1 text-xs font-medium text-accent/80 group-hover:text-accent transition-colors">
              {labels.explore}
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main garden ───────────────────────────────────────────────────────────

export function HomelandGarden({ plots }: { plots: HomelandGardenPlot[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plots.map((plot, index) => (
        <HomelandPlotCard key={plot.key} plot={plot} index={index} />
      ))}
    </div>
  );
}
