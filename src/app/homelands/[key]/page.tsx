import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Users, TreePine, Globe } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { db } from "@/lib/db";
import { parseFamilyHomelandKey, unspecifiedHomelandKey } from "@/lib/family-homeland";
import { withBasePath } from "@/lib/base-path";

interface Props {
  params: Promise<{ key: string }>;
}

function nullishStringFilter(field: "homelandCountry" | "homelandRegion" | "homelandCity") {
  return { OR: [{ [field]: null }, { [field]: "" }] };
}
function exactOrNullishFilter(
  field: "homelandCountry" | "homelandRegion" | "homelandCity",
  value: string | null
) {
  return value ? { [field]: value } : nullishStringFilter(field);
}

export default async function HomelandPage({ params }: Props) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const homeland = parseFamilyHomelandKey(key);
  if (!homeland.isUnspecified && !homeland.label) notFound();

  const where =
    key === unspecifiedHomelandKey
      ? {
          deletedAt: null, isPublic: true,
          AND: [nullishStringFilter("homelandCountry"), nullishStringFilter("homelandRegion"), nullishStringFilter("homelandCity")],
        }
      : {
          deletedAt: null, isPublic: true,
          AND: [
            exactOrNullishFilter("homelandCountry", homeland.country),
            exactOrNullishFilter("homelandRegion", homeland.region),
            exactOrNullishFilter("homelandCity", homeland.city),
          ],
        };

  const families = await db.family.findMany({
    where,
    include: { _count: { select: { persons: true } } },
    orderBy: [{ updatedAt: "desc" }],
  });

  const totalMembers = families.reduce((s, f) => s + f._count.persons, 0);
  const largestFamily = families.reduce((a, b) => (a._count.persons > b._count.persons ? a : b), families[0]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative isolate overflow-hidden border-b border-border/30">
          {/* خلفية */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-20%,hsl(145_35%_22%/0.5),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,hsl(42_55%_30%/0.1),transparent)]" />

          {/* ديكور دائري خلفي */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full border border-primary/10 opacity-40" />
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full border border-accent/8 opacity-30" />

          {/* خط مضيء سفلي */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <div className="container relative mx-auto max-w-6xl px-4 py-14 md:py-20">
            {/* رجوع */}
            <Link
              href={withBasePath("/")}
              className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              العودة إلى حديقة المواطن
            </Link>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              {/* اليسار: اسم + وصف */}
              <div className="space-y-4">
                {/* بادج */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-xs font-medium text-accent">
                  <MapPin className="h-3.5 w-3.5" />
                  موطن عائلي
                </div>

                <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  {homeland.label}
                </h1>

                {/* breadcrumb hierarchy */}
                {(homeland.country || homeland.region || homeland.city) && (
                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    {homeland.country && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-accent/60" />
                        {homeland.country}
                      </span>
                    )}
                    {homeland.region && <><span className="opacity-40">›</span><span>{homeland.region}</span></>}
                    {homeland.city && <><span className="opacity-40">›</span><span>{homeland.city}</span></>}
                  </div>
                )}
              </div>

              {/* اليمين: إحصائيات */}
              <div className="flex flex-wrap gap-3">
                <StatCard icon={<TreePine className="h-4 w-4" />} value={families.length} label={families.length === 1 ? "عائلة" : "عائلات"} />
                <StatCard icon={<Users className="h-4 w-4" />} value={totalMembers} label="فرد مسجّل" />
              </div>
            </div>
          </div>
        </section>

        {/* ── قسم العائلات ── */}
        <section className="container mx-auto max-w-6xl px-4 py-10">
          {families.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-20 text-center gap-4">
              <div className="flex items-end gap-1 text-muted-foreground/20">
                <TreePine className="h-8 w-8" />
                <TreePine className="h-12 w-12" />
                <TreePine className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground">لا توجد عائلات عامة في هذا الموطن</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* أكبر عائلة — بطاقة مميزة */}
              {largestFamily && families.length > 1 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span className="text-accent">✦</span> أكبر عائلة في هذا الموطن
                  </p>
                  <FamilyCard
                    id={largestFamily.id}
                    name={largestFamily.name}
                    slug={largestFamily.slug}
                    memberCount={largestFamily._count.persons}
                    isPublic={largestFamily.isPublic}
                    updatedAt={largestFamily.updatedAt}
                    originSummary={largestFamily.originSummary}
                    homelandCountry={largestFamily.homelandCountry}
                    homelandRegion={largestFamily.homelandRegion}
                    homelandCity={largestFamily.homelandCity}
                    size="large"
                  />
                </div>
              )}

              {/* بقية العائلات */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {families
                  .filter((f) => families.length <= 1 || f.id !== largestFamily?.id)
                  .map((family) => (
                    <FamilyCard
                      key={family.id}
                      id={family.id}
                      name={family.name}
                      slug={family.slug}
                      memberCount={family._count.persons}
                      isPublic={family.isPublic}
                      updatedAt={family.updatedAt}
                      originSummary={family.originSummary}
                      homelandCountry={family.homelandCountry}
                      homelandRegion={family.homelandRegion}
                      homelandCity={family.homelandCity}
                      size={family._count.persons >= 50 ? "large" : family._count.persons >= 15 ? "medium" : "small"}
                    />
                  ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
      <span className="text-accent">{icon}</span>
      <div>
        <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
