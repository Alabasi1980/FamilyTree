import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { db } from "@/lib/db";
import type { Family } from "@/generated/prisma/client";
import { Search, TreePine, Leaf } from "lucide-react";

type FamilyWithCount = Family & { _count: { persons: number } };

async function FamiliesGarden() {
  const families = await db.family.findMany({
    where: { isPublic: true, deletedAt: null },
    include: {
      _count: { select: { persons: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  if (families.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Leaf className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg">لا توجد عائلات عامة حتى الآن</p>
        <p className="text-muted-foreground/60 text-sm mt-1">كن أول من يضيف عائلته</p>
      </div>
    );
  }

  const getSize = (count: number): "small" | "medium" | "large" => {
    if (count >= 50) return "large";
    if (count >= 15) return "medium";
    return "small";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
      {(families as FamilyWithCount[]).map((family) => (
        <FamilyCard
          key={family.id}
          id={family.id}
          name={family.name}
          slug={family.slug}
          memberCount={family._count.persons}
          isPublic={family.isPublic}
          updatedAt={family.updatedAt}
          originSummary={family.originSummary}
          size={getSize(family._count.persons)}
        />
      ))}
    </div>
  );
}

function FamiliesGardenSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-52 rounded-xl border border-border/40 bg-card/40 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <section className="text-center py-12 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <TreePine className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            بستان الأصول
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            اكتشف تاريخ العائلات، تتبع الأنساب، وابنِ شجرة عائلتك بطريقة بصرية سهلة
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="ابحث عن عائلة أو شخص..."
              className="w-full h-12 rounded-xl border border-border bg-card/60 pr-12 pl-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </section>

        {/* Families Garden */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              العائلات المسجّلة
            </h2>
          </div>

          <Suspense fallback={<FamiliesGardenSkeleton />}>
            <FamiliesGarden />
          </Suspense>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        بستان الأصول — حفظ التاريخ العائلي للأجيال القادمة
      </footer>
    </div>
  );
}
