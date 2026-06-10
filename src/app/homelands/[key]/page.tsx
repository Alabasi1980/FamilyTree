import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Users, TreePine, Globe, Lock } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { Badge } from "@/components/ui/badge";
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
              href="/"
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
                <StatCard
                  icon={<TreePine className="h-5 w-5" />}
                  value={families.length}
                  label={families.length === 1 ? "عائلة" : "عائلات"}
                  bg="bg-primary/15"
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  value={totalMembers}
                  label="فرد مسجّل"
                  bg="bg-accent/10"
                />
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
            <div className="space-y-6">

              {/* ── نظرة سريعة — قبل الشبكة التفصيلية ── */}
              <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/10">
                  <p className="text-xs font-medium text-muted-foreground">نظرة سريعة</p>
                  <span className="text-xs text-muted-foreground/60">
                    {families.length} {families.length === 1 ? "عائلة" : "عائلات"} · {totalMembers} فرد
                  </span>
                </div>
                <ul className="divide-y divide-border/25">
                  {families.map((f) => (
                    <li key={f.id}>
                      <Link
                        href={`/family/${f.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            f.isPublic ? "bg-green-500" : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                          عائلة {f.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {f._count.persons} فرد
                        </span>
                        <Badge
                          variant={f.isPublic ? "public" : "private"}
                          className="shrink-0 text-[10px] py-0"
                        >
                          {f.isPublic ? (
                            <><Globe className="h-2.5 w-2.5 ml-0.5" />عامة</>
                          ) : (
                            <><Lock className="h-2.5 w-2.5 ml-0.5" />خاصة</>
                          )}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
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

function StatCard({
  icon, value, label, bg = "bg-primary/15",
}: {
  icon: ReactNode; value: number; label: string; bg?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-5 py-4 backdrop-blur-sm">
      <div className={`rounded-lg p-2 ${bg}`}>
        <span className="text-accent">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
