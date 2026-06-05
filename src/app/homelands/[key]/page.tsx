import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Trees, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import {
  parseFamilyHomelandKey,
  unspecifiedHomelandKey,
} from "@/lib/family-homeland";
import { withBasePath } from "@/lib/base-path";

interface HomelandPageProps {
  params: Promise<{ key: string }>;
}

const labels = {
  back:
    "\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u062d\u062f\u064a\u0642\u0629 \u0627\u0644\u0645\u0648\u0627\u0637\u0646",
  homeland:
    "\u0645\u0648\u0637\u0646 \u0639\u0627\u0626\u0644\u064a",
  families:
    "\u0639\u0627\u0626\u0644\u0627\u062a",
  family:
    "\u0639\u0627\u0626\u0644\u0629",
  members:
    "\u0641\u0631\u062f",
  noFamilies:
    "\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0627\u0626\u0644\u0627\u062a \u0639\u0627\u0645\u0629 \u062f\u0627\u062e\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0637\u0646.",
};

function nullishStringFilter(field: "homelandCountry" | "homelandRegion" | "homelandCity") {
  return {
    OR: [{ [field]: null }, { [field]: "" }],
  };
}

function exactOrNullishFilter(
  field: "homelandCountry" | "homelandRegion" | "homelandCity",
  value: string | null
) {
  return value ? { [field]: value } : nullishStringFilter(field);
}

export default async function HomelandPage({ params }: HomelandPageProps) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  const homeland = parseFamilyHomelandKey(key);

  if (!homeland.isUnspecified && !homeland.label) notFound();

  const where =
    key === unspecifiedHomelandKey
      ? {
          deletedAt: null,
          isPublic: true,
          AND: [
            nullishStringFilter("homelandCountry"),
            nullishStringFilter("homelandRegion"),
            nullishStringFilter("homelandCity"),
          ],
        }
      : {
          deletedAt: null,
          isPublic: true,
          AND: [
            exactOrNullishFilter("homelandCountry", homeland.country),
            exactOrNullishFilter("homelandRegion", homeland.region),
            exactOrNullishFilter("homelandCity", homeland.city),
          ],
        };

  const families = await db.family.findMany({
    where,
    include: {
      _count: { select: { persons: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const totalMembers = families.reduce((sum, family) => sum + family._count.persons, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40 bg-background-secondary/30">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),transparent_38%),linear-gradient(180deg,hsl(var(--background)/0.1),transparent)]" />
          <div className="container relative mx-auto max-w-6xl px-4 py-10">
            <Link
              href={withBasePath("/")}
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
              {labels.back}
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <Badge variant="member" className="mb-3 gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {labels.homeland}
                </Badge>
                <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  {homeland.label}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <Stat icon={<Trees className="h-4 w-4" />} value={families.length} label={families.length === 1 ? labels.family : labels.families} />
                <Stat icon={<Users className="h-4 w-4" />} value={totalMembers} label={labels.members} />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-8">
          {families.length === 0 ? (
            <div className="rounded-md border border-border/50 bg-card/60 px-4 py-14 text-center text-muted-foreground">
              {labels.noFamilies}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {families.map((family) => (
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
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex min-w-28 items-center gap-2 rounded-md border border-border/50 bg-card/60 px-3 py-2">
      <span className="text-accent">{icon}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
