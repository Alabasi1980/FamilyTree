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

function TreeIcon({ size = "md", opacity = 1 }: { size?: "sm" | "md" | "lg"; opacity?: number }) {
  const dims = { sm: 18, md: 26, lg: 38 }[size];
  return (
    <svg
      width={dims}
      height={dims}
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path d="M12 2C8 2 5 6 5 9.5c0 2.5 1.5 4.5 3.5 5.5H10v5h4v-5h1.5c2-.9 3.5-3 3.5-5.5C19 6 16 2 12 2z"
        fill="currentColor" />
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
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        {/* خط أرضي */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="relative flex flex-1 flex-col justify-between p-5 gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-background/50 text-accent shadow-inner">
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
            <span className="shrink-0 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              {plot.familyCount} {plot.familyCount === 1 ? labels.family : labels.families}
            </span>
          </div>

          {/* الغابة */}
          <div className="flex justify-center py-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <FamilyGrove count={plot.familyCount} />
          </div>

          {/* أسماء العائلات */}
          {previewNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {previewNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-border/40 bg-background/30 px-2.5 py-0.5 text-[11px] text-muted-foreground backdrop-blur-sm"
                >
                  {name}
                </span>
              ))}
              {plot.familyNames.length > 5 && (
                <span className="rounded-full border border-border/40 bg-background/30 px-2.5 py-0.5 text-[11px] text-accent/80 backdrop-blur-sm">
                  +{plot.familyNames.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/30 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {plot.memberCount} {labels.members}
            </span>
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
