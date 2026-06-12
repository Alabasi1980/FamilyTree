"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TreePine, Users, MapPin, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { withBasePath } from "@/lib/base-path";
import type { ExplorerCountry, ExplorerRegion, ExplorerCity } from "@/lib/actions/homelands";

type Level = "countries" | "regions" | "cities";

const labels = {
  countries: "الدول",
  regions: "المناطق",
  cities: "المدن",
  families: "عائلة",
  familiesPlural: "عائلات",
  persons: "فرد",
  regions_: "منطقة",
  regions_plural: "مناطق",
  cities_: "مدينة",
  cities_plural: "مدن",
  search: "ابحث...",
  noResults: "لا توجد نتائج",
  noFamilies: "لا توجد عائلات",
  clickToExplore: "انقر للاستكشاف",
  root: "مواطن الأصول",
};

// ── Animated grid wrapper ─────────────────────────────────────────────────────

const gridVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit:   { opacity: 0, x: 16,  transition: { duration: 0.18 } },
};

// ── Stat badge ────────────────────────────────────────────────────────────────

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
      {icon}
      <span className="tabular-nums">{value}</span>
      <span>{label}</span>
    </span>
  );
}

// ── Country card ──────────────────────────────────────────────────────────────

function CountryCard({
  country,
  onClick,
  index,
}: {
  country: ExplorerCountry;
  onClick: () => void;
  index: number;
}) {
  const isEmpty = country.totalFamilyCount === 0;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      onClick={isEmpty ? undefined : onClick}
      disabled={isEmpty}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-xl border bg-card/70 p-4 text-right transition-all duration-200",
        isEmpty
          ? "border-border/20 opacity-40 cursor-not-allowed"
          : "border-border/50 hover:border-accent/50 hover:bg-card/90 hover:shadow-md hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      {/* علم + اسم */}
      <div className="flex w-full items-center gap-2.5">
        <span className="text-2xl leading-none shrink-0" role="img" aria-label={country.name}>
          {country.flag}
        </span>
        <span
          className={cn(
            "flex-1 text-sm font-bold leading-snug truncate transition-colors",
            isEmpty ? "text-muted-foreground" : "text-foreground group-hover:text-accent"
          )}
        >
          {country.name}
        </span>
      </div>

      {/* إحصائيات */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <StatBadge
          icon={<Globe className="h-3 w-3" />}
          value={country.regionCount}
          label={country.regionCount === 1 ? labels.regions_ : labels.regions_plural}
        />
        <StatBadge
          icon={<TreePine className="h-3 w-3" />}
          value={country.totalFamilyCount}
          label={country.totalFamilyCount === 1 ? labels.families : labels.familiesPlural}
        />
        {country.totalPersonCount > 0 && (
          <StatBadge
            icon={<Users className="h-3 w-3" />}
            value={country.totalPersonCount}
            label={labels.persons}
          />
        )}
      </div>
    </motion.button>
  );
}

// ── Region card ───────────────────────────────────────────────────────────────

function RegionCard({
  region,
  onClick,
  index,
}: {
  region: ExplorerRegion;
  onClick: () => void;
  index: number;
}) {
  const isEmpty = region.totalFamilyCount === 0;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      onClick={isEmpty ? undefined : onClick}
      disabled={isEmpty}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-xl border bg-card/70 p-4 text-right transition-all duration-200",
        isEmpty
          ? "border-border/20 opacity-40 cursor-not-allowed"
          : "border-border/50 hover:border-accent/50 hover:bg-card/90 hover:shadow-md hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      <div className="flex w-full items-center gap-2">
        <MapPin className={cn("h-4 w-4 shrink-0", isEmpty ? "text-muted-foreground/50" : "text-accent/70")} />
        <span
          className={cn(
            "flex-1 text-sm font-semibold leading-snug truncate transition-colors",
            isEmpty ? "text-muted-foreground" : "text-foreground group-hover:text-accent"
          )}
        >
          {region.name}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <StatBadge
          icon={<MapPin className="h-3 w-3" />}
          value={region.cityCount}
          label={region.cityCount === 1 ? labels.cities_ : labels.cities_plural}
        />
        <StatBadge
          icon={<TreePine className="h-3 w-3" />}
          value={region.totalFamilyCount}
          label={region.totalFamilyCount === 1 ? labels.families : labels.familiesPlural}
        />
      </div>
    </motion.button>
  );
}

// ── City card ─────────────────────────────────────────────────────────────────

function CityCard({
  city,
  onClick,
  index,
}: {
  city: ExplorerCity;
  onClick: () => void;
  index: number;
}) {
  const isEmpty = city.familyCount === 0;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: "easeOut" }}
      onClick={isEmpty ? undefined : onClick}
      disabled={isEmpty}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-xl border bg-card/70 p-4 text-right transition-all duration-200",
        isEmpty
          ? "border-border/20 opacity-40 cursor-not-allowed"
          : "border-border/50 hover:border-accent/50 hover:bg-card/90 hover:shadow-md hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold leading-snug truncate w-full text-right transition-colors",
          isEmpty ? "text-muted-foreground" : "text-foreground group-hover:text-accent"
        )}
      >
        {city.name}
      </span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <StatBadge
          icon={<TreePine className="h-3 w-3" />}
          value={city.familyCount}
          label={city.familyCount === 1 ? labels.families : labels.familiesPlural}
        />
        {city.personCount > 0 && (
          <StatBadge
            icon={<Users className="h-3 w-3" />}
            value={city.personCount}
            label={labels.persons}
          />
        )}
      </div>
      {isEmpty && (
        <span className="text-[10px] text-muted-foreground/50">{labels.noFamilies}</span>
      )}
    </motion.button>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labels.search}
        dir="rtl"
        className="w-full rounded-xl border border-border/50 bg-card/60 py-2.5 pr-9 pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
      />
      {value && (
        <button
          type="button"
          aria-label="مسح البحث"
          onClick={() => onChange("")}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <Search className="h-8 w-8 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">{labels.noResults}</p>
    </div>
  );
}

// ── Main explorer ─────────────────────────────────────────────────────────────

interface HomelandExplorerProps {
  countries: ExplorerCountry[];
}

export function HomelandExplorer({ countries }: HomelandExplorerProps) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("countries");
  const [selectedCountry, setSelectedCountry] = useState<ExplorerCountry | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ExplorerRegion | null>(null);
  const [search, setSearch] = useState("");

  function selectCountry(country: ExplorerCountry) {
    setSelectedCountry(country);
    setSelectedRegion(null);
    setSearch("");
    setLevel("regions");
  }

  function selectRegion(region: ExplorerRegion) {
    setSelectedRegion(region);
    setSearch("");
    setLevel("cities");
  }

  function goToLevel(target: Level) {
    if (target === "countries") {
      setSelectedCountry(null);
      setSelectedRegion(null);
    } else if (target === "regions") {
      setSelectedRegion(null);
    }
    setSearch("");
    setLevel(target);
  }

  function navigateToCity(city: ExplorerCity) {
    router.push(withBasePath(`/homelands/${city.homelandKey}`));
  }

  // Breadcrumb items
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: labels.root, onClick: () => goToLevel("countries") }];
    if (selectedCountry) {
      items.push({
        label: `${selectedCountry.flag} ${selectedCountry.name}`,
        onClick: level === "cities" ? () => goToLevel("regions") : undefined,
      });
    }
    if (selectedRegion) {
      items.push({ label: selectedRegion.name });
    }
    return items;
  }, [level, selectedCountry, selectedRegion]);

  // Filtered current items
  const normalizedSearch = search.trim().toLowerCase();

  const filteredCountries = useMemo(
    () => countries.filter((c) => !normalizedSearch || c.name.includes(normalizedSearch)),
    [countries, normalizedSearch]
  );

  const filteredRegions = useMemo(
    () =>
      selectedCountry?.regions.filter(
        (r) => !normalizedSearch || r.name.includes(normalizedSearch)
      ) ?? [],
    [selectedCountry, normalizedSearch]
  );

  const filteredCities = useMemo(
    () =>
      selectedRegion?.cities.filter(
        (c) => !normalizedSearch || c.name.includes(normalizedSearch)
      ) ?? [],
    [selectedRegion, normalizedSearch]
  );

  const levelKey = `${level}-${selectedCountry?.id ?? ""}-${selectedRegion?.id ?? ""}`;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={levelKey}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {level === "countries" && (
            <>
              {filteredCountries.length === 0 ? (
                <EmptySearch />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredCountries.map((country, i) => (
                    <CountryCard
                      key={country.id}
                      country={country}
                      index={i}
                      onClick={() => selectCountry(country)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {level === "regions" && selectedCountry && (
            <>
              {filteredRegions.length === 0 ? (
                <EmptySearch />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredRegions.map((region, i) => (
                    <RegionCard
                      key={region.id}
                      region={region}
                      index={i}
                      onClick={() => selectRegion(region)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {level === "cities" && selectedRegion && (
            <>
              {filteredCities.length === 0 ? (
                <EmptySearch />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredCities.map((city, i) => (
                    <CityCard
                      key={city.id}
                      city={city}
                      index={i}
                      onClick={() => navigateToCity(city)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
