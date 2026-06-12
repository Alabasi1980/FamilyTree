import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/layout/hero-section";
import { HomelandExplorer } from "@/components/homelands/homeland-explorer";
import { getHomelandExplorerData } from "@/lib/actions/homelands";
import { auth } from "@/lib/auth";
import { Globe, TreePine } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

const heroIcon = withBasePath("/icons/icon-512x512.png");

const labels = {
  brand: "بستان الأصول",
  tagline: "أرشيف عائلي رقمي لتوثيق الأنساب، ربط العائلات، وحفظ الذاكرة بطريقة تحترم الخصوصية والمراجعة.",
  sectionLabel: "استكشف المواطن",
  sectionTitle: "مواطن الأصول",
  sectionSubtitle: "ابحث عن عائلتك عبر الدول والمناطق والمدن",
  footer: "بستان الأصول — حفظ التاريخ العائلي للأجيال القادمة",
};

async function ExplorerSection() {
  const countries = await getHomelandExplorerData();
  return <HomelandExplorer countries={countries} />;
}

function ExplorerSkeleton() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb skeleton */}
      <div className="h-10 w-64 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
      {/* Search skeleton */}
      <div className="h-10 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] rounded-xl border border-border/30 bg-card/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  void session; // available for future use

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection heroIconUrl={heroIcon} brand={labels.brand} tagline={labels.tagline} />

        {/* فاصل مزخرف */}
        <div className="relative h-10 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-background to-transparent" />
          <svg
            className="absolute inset-x-0 top-0 w-full opacity-20"
            height="40"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 20 C200 5, 400 35, 600 20 C800 5, 1000 35, 1200 20 L1200 0 L0 0 Z"
              fill="hsl(145 35% 32% / 0.3)"
            />
          </svg>
        </div>

        {/* قسم المستكشف */}
        <section id="homeland-explorer" className="container mx-auto max-w-6xl px-4 py-8">
          {/* عنوان القسم */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-accent/80 mb-1">
                <Globe className="h-3.5 w-3.5" />
                <span className="uppercase tracking-widest">{labels.sectionLabel}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{labels.sectionTitle}</h2>
              <p className="text-sm text-muted-foreground">{labels.sectionSubtitle}</p>
            </div>
            {/* خط زخرفي */}
            <div className="hidden md:flex items-center gap-2 text-accent/30">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent/40" />
              <TreePine className="h-4 w-4" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent/40" />
            </div>
          </div>

          <Suspense fallback={<ExplorerSkeleton />}>
            <ExplorerSection />
          </Suspense>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative mt-8 border-t border-border/30 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <TreePine className="h-4 w-4 text-accent/50" />
            <span className="text-sm">{labels.footer}</span>
          </div>
          <div className="flex items-center gap-1 text-accent/40 text-xs">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
