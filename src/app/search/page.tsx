import Link from "next/link";
import type { ReactNode } from "react";
import { Search, TreePine, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { FamilyCard } from "@/components/families/family-card";
import { PublicSearchForm } from "@/components/search/public-search-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

const labels = {
  publicSearch: "\u0627\u0644\u0628\u062d\u062b \u0627\u0644\u0639\u0627\u0645",
  title:
    "\u0627\u0628\u062d\u062b \u0641\u064a \u0628\u0633\u062a\u0627\u0646 \u0627\u0644\u0623\u0635\u0648\u0644",
  description:
    "\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629 \u0648\u0627\u0644\u0623\u0641\u0631\u0627\u062f \u0627\u0644\u0645\u062a\u0627\u062d\u0648\u0646 \u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u0639\u0627\u0645 \u0641\u0642\u0637.",
  minTitle:
    "\u0627\u0643\u062a\u0628 \u062d\u0631\u0641\u064a\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644",
  minDescription:
    "\u0627\u0633\u062a\u062e\u062f\u0645 \u0627\u0633\u0645 \u0639\u0627\u0626\u0644\u0629\u060c \u0627\u0633\u0645 \u0634\u062e\u0635\u060c \u0623\u0648 \u062c\u0632\u0621\u0627 \u0645\u0646 \u0627\u0644\u0646\u0628\u0630\u0629 \u0627\u0644\u062a\u0627\u0631\u064a\u062e\u064a\u0629.",
  noResults: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629",
  noResultsPrefix:
    "\u0644\u0645 \u0646\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0639\u0627\u0645\u0629 \u0644\u0639\u0628\u0627\u0631\u0629",
  families: "\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a",
  persons: "\u0627\u0644\u0623\u0641\u0631\u0627\u062f",
  living: "\u062d\u064a",
  deceased: "\u0645\u062a\u0648\u0641\u0649",
  family: "\u0639\u0627\u0626\u0644\u0629",
  born: "\u0645\u0648\u0627\u0644\u064a\u062f",
  died: "\u062a\u0648\u0641\u064a",
  noDates: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0648\u0627\u0631\u064a\u062e",
  resultsFor:
    "\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b \u0639\u0646",
  result: "\u0646\u062a\u064a\u062c\u0629",
};

function normalizeQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function formatYears(
  birthDate: Date | null, deathDate: Date | null, isLiving: boolean,
  birthYearField?: number | null, deathYearField?: number | null,
) {
  const birthYear = birthDate?.getFullYear() ?? birthYearField ?? null;
  const deathYear = deathDate?.getFullYear() ?? deathYearField ?? null;

  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (birthYear && isLiving) return `${labels.born} ${birthYear}`;
  if (birthYear) return `${birthYear} - ؟`;
  if (deathYear) return `${labels.died} ${deathYear}`;
  return labels.noDates;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = normalizeQuery(q);
  const canSearch = query.length >= 2;

  const [families, persons] = canSearch
    ? await Promise.all([
        db.family.findMany({
          where: {
            deletedAt: null,
            isPublic: true,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { originSummary: { contains: query, mode: "insensitive" } },
              { historicalNotes: { contains: query, mode: "insensitive" } },
              { homelandCountry: { contains: query, mode: "insensitive" } },
              { homelandRegion: { contains: query, mode: "insensitive" } },
              { homelandCity: { contains: query, mode: "insensitive" } },
              { homelandNote: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            _count: { select: { persons: true } },
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 12,
        }),
        db.person.findMany({
          where: {
            deletedAt: null,
            visibilityLevel: "PUBLIC",
            family: {
              deletedAt: null,
              isPublic: true,
            },
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { biography: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            fullName: true,
            gender: true,
            isLiving: true,
            birthYear: true,
            birthDate: true,
            deathYear: true,
            deathDate: true,
            biography: true,
            family: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: [{ fullName: "asc" }],
          take: 20,
        }),
      ])
    : [[], []];

  const hasResults = families.length > 0 || persons.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/40 bg-background-secondary/30">
          <div className="container mx-auto max-w-6xl px-4 py-10">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                {labels.publicSearch}
              </div>
              <h1 className="text-3xl font-bold text-foreground">{labels.title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {labels.description}
              </p>
              <PublicSearchForm query={query} size="large" className="mt-6" />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-8">
          {!canSearch ? (
            <EmptyState title={labels.minTitle} description={labels.minDescription} />
          ) : !hasResults ? (
            <EmptyState
              title={labels.noResults}
              description={`${labels.noResultsPrefix} "${query}".`}
            />
          ) : (
            <div className="space-y-10">
              <ResultsHeader query={query} total={families.length + persons.length} />

              {families.length > 0 && (
                <div>
                  <SectionTitle icon={<TreePine className="h-4 w-4" />} title={labels.families} />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        size="medium"
                      />
                    ))}
                  </div>
                </div>
              )}

              {persons.length > 0 && (
                <div>
                  <SectionTitle icon={<Users className="h-4 w-4" />} title={labels.persons} />
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {persons.map((person) => (
                      <Link key={person.id} href={`/family/${encodeURIComponent(person.family.slug)}?person=${person.id}`}>
                        <Card className="h-full rounded-lg border-border/60 bg-card/80 transition-colors hover:border-accent/50">
                          <CardContent className="flex items-start gap-3 p-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted/30 text-sm font-bold
                              ${person.gender === "MALE" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : "border-rose-400/30 text-rose-400 bg-rose-400/10"}`}>
                              {person.fullName[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="line-clamp-1 text-sm font-semibold text-foreground">
                                  {person.fullName}
                                </h2>
                                <Badge variant={person.isLiving ? "public" : "private"} className="text-[10px]">
                                  {person.isLiving ? labels.living : labels.deceased}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {person.family.name}
                                {" · "}
                                {formatYears(person.birthDate, person.deathDate, person.isLiving, person.birthYear, person.deathYear)}
                              </p>
                              {person.biography && (
                                <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">
                                  {person.biography}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResultsHeader({ query, total }: { query: string; total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">{labels.resultsFor}</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{`"${query}"`}</h2>
      </div>
      <Badge variant="member">
        {total} {labels.result}
      </Badge>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span className="text-accent">{icon}</span>
      {title}
    </h2>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/60 px-4 py-12 text-center">
      <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
