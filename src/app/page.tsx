import { Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/layout/hero-section";
import { HomelandGarden, type HomelandGardenPlot } from "@/components/homelands/homeland-garden";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Family } from "@/generated/prisma/client";
import { Sprout, TreePine, Search, UserPlus } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { formatFamilyHomeland, getFamilyHomelandKey } from "@/lib/family-homeland";

type FamilyWithCount = Family & { _count: { persons: number } };

const heroIcon = withBasePath("/icons/icon-512x512.png");

const labels = {
  noPublicFamilies: "لا توجد عائلات عامة حتى الآن",
  firstFamily: "كن أول من يضيف عائلته",
  brand: "بستان الأصول",
  tagline: "أرشيف عائلي رقمي لتوثيق الأنساب، ربط العائلات، وحفظ الذاكرة بطريقة تحترم الخصوصية والمراجعة.",
  homelandGroups: "المواطن العائلية",
  homelandSubtitle: "اكتشف العائلات من مواطنها الأصلية",
  unspecifiedHomeland: "موطن غير محدد",
  footer: "بستان الأصول — حفظ التاريخ العائلي للأجيال القادمة",
};

async function FamiliesGarden({ isLoggedIn }: { isLoggedIn: boolean }) {
  const families = await db.family.findMany({
    where: { isPublic: true, deletedAt: null },
    include: { _count: { select: { persons: true } } },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  if (families.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6 px-4">
        <div className="flex items-end gap-1 text-muted-foreground/20">
          <TreePine className="h-8 w-8" />
          <TreePine className="h-14 w-14" />
          <TreePine className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-sm">
          <p className="text-lg font-semibold text-foreground">{labels.noPublicFamilies}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            بستان الأصول هو مساحة لتوثيق أنساب العائلات بشكل مرتب وآمن. يمكنك البحث عن عائلتك أو البدء بتسجيل شجرة عائلتك.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={withBasePath("/search")}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-foreground hover:border-accent/40 hover:bg-card/80 transition-all"
          >
            <Search className="h-4 w-4 text-accent" />
            ابحث عن عائلة
          </Link>
          <Link
            href={withBasePath(isLoggedIn ? "/dashboard/families/new" : "/register")}
            className="flex items-center gap-2 rounded-lg bg-accent/20 border border-accent/30 px-4 py-2.5 text-sm text-accent hover:bg-accent/30 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            {labels.firstFamily}
          </Link>
        </div>
      </div>
    );
  }

  const groups = new Map<string, FamilyWithCount[]>();
  (families as FamilyWithCount[]).forEach((family) => {
    const key = getFamilyHomelandKey(family);
    groups.set(key, [...(groups.get(key) ?? []), family]);
  });

  const plots: HomelandGardenPlot[] = Array.from(groups.entries())
    .map(([key, group]) => {
      const first = group[0];
      return {
        key,
        label: formatFamilyHomeland(first) || labels.unspecifiedHomeland,
        country: first.homelandCountry,
        familyCount: group.length,
        memberCount: group.reduce((sum, f) => sum + f._count.persons, 0),
        familyNames: group.map((f) => f.name),
      };
    })
    .sort((a, b) => b.familyCount - a.familyCount || b.memberCount - a.memberCount);

  return <HomelandGarden plots={plots} />;
}

const skeletonClasses = [
  "md:col-span-2 min-h-[280px]",
  "min-h-[210px]",
  "min-h-[210px]",
  "min-h-[240px]",
  "min-h-[210px]",
  "min-h-[210px]",
];

function GardenSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {skeletonClasses.map((cls, i) => (
        <div key={i} className={`rounded-2xl border border-border/30 bg-card/40 animate-pulse ${cls}`} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection heroIconUrl={heroIcon} brand={labels.brand} tagline={labels.tagline} />

        {/* فاصل مزخرف بين Hero والحديقة */}
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

        {/* قسم المواطن */}
        <section id="homeland-garden" className="container mx-auto max-w-6xl px-4 py-8">
          {/* عنوان القسم */}
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-accent/80 mb-1">
                <Sprout className="h-3.5 w-3.5" />
                <span className="uppercase tracking-widest">حديقة العائلات</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{labels.homelandGroups}</h2>
              <p className="text-sm text-muted-foreground">{labels.homelandSubtitle}</p>
            </div>
            {/* خط زخرفي */}
            <div className="hidden md:flex items-center gap-2 text-accent/30">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent/40" />
              <TreePine className="h-4 w-4" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent/40" />
            </div>
          </div>

          <Suspense fallback={<GardenSkeleton />}>
            <FamiliesGarden isLoggedIn={!!session?.user} />
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
