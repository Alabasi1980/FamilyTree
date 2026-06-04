import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { PublicSearchForm } from "@/components/search/public-search-form";
import { db } from "@/lib/db";
import type { Family } from "@/generated/prisma/client";
import { Leaf } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

type FamilyWithCount = Family & { _count: { persons: number } };

const heroIcon = withBasePath("/icons/icon-512x512.png");
const maskableIcon = withBasePath("/icons/maskable-icon-512x512.png");

const labels = {
  noPublicFamilies:
    "\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0627\u0626\u0644\u0627\u062a \u0639\u0627\u0645\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646",
  firstFamily:
    "\u0643\u0646 \u0623\u0648\u0644 \u0645\u0646 \u064a\u0636\u064a\u0641 \u0639\u0627\u0626\u0644\u062a\u0647",
  brand: "\u0628\u0633\u062a\u0627\u0646 \u0627\u0644\u0623\u0635\u0648\u0644",
  tagline:
    "\u0623\u0631\u0634\u064a\u0641 \u0639\u0627\u0626\u0644\u064a \u0631\u0642\u0645\u064a \u0644\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u0623\u0646\u0633\u0627\u0628\u060c \u0631\u0628\u0637 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a\u060c \u0648\u062d\u0641\u0638 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0628\u0637\u0631\u064a\u0642\u0629 \u062a\u062d\u062a\u0631\u0645 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629 \u0648\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629.",
  registeredFamilies:
    "\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a \u0627\u0644\u0645\u0633\u062c\u0644\u0629",
  footer:
    "\u0628\u0633\u062a\u0627\u0646 \u0627\u0644\u0623\u0635\u0648\u0644 - \u062d\u0641\u0638 \u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0639\u0627\u0626\u0644\u064a \u0644\u0644\u0623\u062c\u064a\u0627\u0644 \u0627\u0644\u0642\u0627\u062f\u0645\u0629",
};

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
        <Leaf className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <p className="text-lg text-muted-foreground">{labels.noPublicFamilies}</p>
        <p className="mt-1 text-sm text-muted-foreground/60">{labels.firstFamily}</p>
      </div>
    );
  }

  const getSize = (count: number): "small" | "medium" | "large" => {
    if (count >= 50) return "large";
    if (count >= 15) return "medium";
    return "small";
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-44 rounded-lg border border-border/40 bg-card/40 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-border/40 bg-background">
          <div
            className="pointer-events-none absolute -left-28 top-10 h-[520px] w-[520px] bg-contain bg-center bg-no-repeat opacity-[0.055]"
            style={{ backgroundImage: `url(${maskableIcon})` }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--accent)/0.13),transparent_34%),linear-gradient(180deg,hsl(var(--background-secondary)/0.42),transparent_70%)]" />

          <div className="container relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="max-w-2xl">
              <div
                className="mb-6 h-24 w-24 rounded-2xl border border-accent/30 bg-cover bg-center shadow-2xl shadow-black/30"
                style={{ backgroundImage: `url(${heroIcon})` }}
                aria-hidden="true"
              />
              <h1 className="text-4xl font-bold leading-tight text-foreground md:text-6xl">
                {labels.brand}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                {labels.tagline}
              </p>

              <PublicSearchForm className="mt-8 max-w-xl" size="large" />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {labels.registeredFamilies}
            </h2>
          </div>

          <Suspense fallback={<FamiliesGardenSkeleton />}>
            <FamiliesGarden />
          </Suspense>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
        {labels.footer}
      </footer>
    </div>
  );
}
