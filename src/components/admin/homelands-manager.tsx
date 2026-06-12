"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Globe, MapPin, Building2, Plus, Pencil, Trash2,
  Check, X, ChevronDown, ChevronRight, Loader2, Users, Search,
} from "lucide-react";
import { createHomelandPlace, updateHomelandPlace, deleteHomelandPlace } from "@/lib/actions/homelands";
import { Input } from "@/components/ui/input";

export interface PlaceData {
  id: string;
  name: string;
  type: "COUNTRY" | "REGION" | "CITY";
  parentId: string | null;
  aliases: string[];
  sortOrder: number;
  familyCount: number;
  childCount: number;
}

const typeIcon = {
  COUNTRY: Globe,
  REGION: MapPin,
  CITY: Building2,
};

const typeLabel = {
  COUNTRY: "دولة",
  REGION: "منطقة",
  CITY: "مدينة / قرية",
};

const childTypeLabel = {
  COUNTRY: "منطقة",
  REGION: "مدينة / قرية",
  CITY: "",
};

interface AddFormProps {
  parentId: string | null;
  type: "COUNTRY" | "REGION" | "CITY";
  parentOptions?: PlaceData[];
  onDone: () => void;
}

function AddForm({ parentId, type, onDone }: AddFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createHomelandPlace({
        name: form.get("name") as string,
        type,
        parentId: parentId || null,
        aliases: form.get("aliases") as string,
        sortOrder: Number(form.get("sortOrder") || 0),
      });
      if (!result.success) { setError(result.error ?? "تعذرت الإضافة"); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <Input
        name="name"
        required
        minLength={2}
        autoFocus
        placeholder={`اسم ${typeLabel[type]}`}
        className="h-8 w-36 bg-background/60 text-sm"
      />
      <Input
        name="aliases"
        placeholder="أسماء بديلة (اختياري)"
        className="h-8 w-44 bg-background/60 text-sm"
      />
      <Input
        name="sortOrder"
        type="number"
        min={0}
        defaultValue={0}
        placeholder="الترتيب"
        className="h-8 w-20 bg-background/60 text-sm"
      />
      <div className="flex gap-1.5">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-1 rounded-md bg-primary/20 hover:bg-primary/30 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          إضافة
        </button>
        <button type="button" onClick={onDone}
          className="flex items-center gap-1 rounded-md border border-border/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> إلغاء
        </button>
      </div>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}

interface EditRowProps {
  place: PlaceData;
  onDone: () => void;
}

function EditRow({ place, onDone }: EditRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateHomelandPlace(place.id, {
        name: form.get("name") as string,
        aliases: form.get("aliases") as string,
        sortOrder: Number(form.get("sortOrder") || 0),
      });
      if (!result.success) { setError(result.error ?? "تعذر الحفظ"); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5">
      <Input
        name="name"
        required
        minLength={2}
        autoFocus
        defaultValue={place.name}
        className="h-8 w-36 bg-background/60 text-sm"
      />
      <Input
        name="aliases"
        defaultValue={place.aliases.join("، ")}
        placeholder="أسماء بديلة"
        className="h-8 w-44 bg-background/60 text-sm"
      />
      <Input
        name="sortOrder"
        type="number"
        min={0}
        defaultValue={place.sortOrder}
        className="h-8 w-20 bg-background/60 text-sm"
      />
      <div className="flex gap-1.5">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-1 rounded-md bg-accent/20 hover:bg-accent/30 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          حفظ
        </button>
        <button type="button" onClick={onDone}
          className="flex items-center gap-1 rounded-md border border-border/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> إلغاء
        </button>
      </div>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}

interface PlaceRowActionsProps {
  place: PlaceData;
  onEdit: () => void;
}

function PlaceRowActions({ place, onEdit }: PlaceRowActionsProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const canDelete = place.familyCount === 0 && place.childCount === 0;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteHomelandPlace(place.id);
      if (!result.success) { setError(result.error ?? "تعذر الحذف"); setConfirmDelete(false); return; }
      router.refresh();
    });
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-destructive/80">تأكيد الحذف؟</span>
        <button type="button" onClick={handleDelete} disabled={isPending}
          className="rounded bg-red-900/30 px-2 py-1 text-[11px] text-red-400 hover:bg-red-900/50 disabled:opacity-50 transition-colors">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "نعم، احذف"}
        </button>
        <button type="button" onClick={() => setConfirmDelete(false)}
          className="rounded border border-border/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          إلغاء
        </button>
        {error && <span className="text-[11px] text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-[11px] text-destructive mr-1">{error}</span>}
      <button type="button" onClick={onEdit}
        className="rounded p-1 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
        title="تعديل">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button"
        onClick={() => {
          if (canDelete) setConfirmDelete(true);
        }}
        disabled={!canDelete}
        title={!canDelete ? (place.familyCount > 0 ? `مرتبط بـ ${place.familyCount} عائلة` : "يحتوي على مواطن فرعية") : "حذف"}
        className="rounded p-1 text-muted-foreground/60 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface Props {
  places: PlaceData[];
}

export function HomelandsManager({ places }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingUnder, setAddingUnder] = useState<{ parentId: string | null; type: "COUNTRY" | "REGION" | "CITY" } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const byParent = new Map<string | null, PlaceData[]>();
  for (const place of places) {
    const key = place.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), place]);
  }
  const allCountries = byParent.get(null) ?? [];

  const q = search.trim().toLowerCase();
  const matches = (name: string, aliases: string[]) =>
    !q || name.toLowerCase().includes(q) || aliases.some((a) => a.toLowerCase().includes(q));

  const countries = q
    ? allCountries.filter((c) => {
        if (matches(c.name, c.aliases)) return true;
        const regions = byParent.get(c.id) ?? [];
        return regions.some((r) => {
          if (matches(r.name, r.aliases)) return true;
          const cities = byParent.get(r.id) ?? [];
          return cities.some((city) => matches(city.name, city.aliases));
        });
      })
    : allCountries;

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function isAddingUnder(parentId: string | null, type: "COUNTRY" | "REGION" | "CITY") {
    return addingUnder?.parentId === parentId && addingUnder?.type === type;
  }

  return (
    <div className="space-y-3">
      {/* Search + Add country */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن دولة أو منطقة أو مدينة..."
            className="h-8 w-full rounded-md border border-border/60 bg-card/60 pr-8 pl-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {search && (
          <button type="button" onClick={() => setSearch("")} title="مسح البحث"
            className="text-[10px] text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {countries.length === 0 && q ? "لا نتائج مطابقة للبحث" : countries.length === 0 ? "لم تتم إضافة أي مواطن بعد." : `${countries.length} دولة`}
        </p>
        {!isAddingUnder(null, "COUNTRY") && (
          <button type="button"
            onClick={() => { setAddingUnder({ parentId: null, type: "COUNTRY" }); setEditingId(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" />
            إضافة دولة
          </button>
        )}
      </div>

      {isAddingUnder(null, "COUNTRY") && (
        <AddForm parentId={null} type="COUNTRY" onDone={() => setAddingUnder(null)} />
      )}

      {/* Countries tree */}
      <div className="space-y-2">
        {countries.map((country) => {
          const regions = byParent.get(country.id) ?? [];
          const isCollapsed = q ? false : collapsed.has(country.id);
          const CountryIcon = typeIcon.COUNTRY;

          return (
            <div key={country.id} className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
              {/* Country header */}
              {editingId === country.id ? (
                <div className="px-4 py-3">
                  <EditRow place={country} onDone={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-muted/10 transition-colors">
                  <button type="button" onClick={() => toggleCollapse(country.id)}
                    className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    {isCollapsed
                      ? <ChevronRight className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <CountryIcon className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-semibold text-foreground">{country.name}</span>
                  {country.aliases.length > 0 && (
                    <span className="text-xs text-muted-foreground/60">({country.aliases.join(", ")})</span>
                  )}
                  <div className="flex items-center gap-2 mr-auto text-xs text-muted-foreground">
                    {regions.length > 0 && <span>{regions.length} منطقة</span>}
                    {country.familyCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />{country.familyCount}
                      </span>
                    )}
                  </div>
                  <PlaceRowActions place={country} onEdit={() => { setEditingId(country.id); setAddingUnder(null); }} />
                </div>
              )}

              {/* Regions */}
              {!isCollapsed && (
                <div className="border-t border-border/30 px-4 pb-3 pt-2 space-y-2 bg-background/20">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {regions.map((region) => {
                      const cities = byParent.get(region.id) ?? [];
                      const RegionIcon = typeIcon.REGION;

                      return (
                        <div key={region.id} className="rounded-lg border border-border/30 bg-card/50 p-3 space-y-2">
                          {editingId === region.id ? (
                            <EditRow place={region} onDone={() => setEditingId(null)} />
                          ) : (
                            <div className="flex items-center gap-2">
                              <RegionIcon className="h-3.5 w-3.5 text-accent/70 shrink-0" />
                              <span className="text-sm font-medium text-foreground flex-1">{region.name}</span>
                              {region.familyCount > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />{region.familyCount}
                                </span>
                              )}
                              <PlaceRowActions place={region} onEdit={() => { setEditingId(region.id); setAddingUnder(null); }} />
                            </div>
                          )}

                          {/* Cities */}
                          <div className="flex flex-wrap gap-1.5">
                            {cities.map((city) => (
                              editingId === city.id ? (
                                <div key={city.id} className="w-full">
                                  <EditRow place={city} onDone={() => setEditingId(null)} />
                                </div>
                              ) : (
                                <div key={city.id}
                                  className="flex items-center gap-1 rounded-full border border-border/40 bg-background/50 pl-2.5 pr-1 py-0.5 group">
                                  <Building2 className="h-2.5 w-2.5 text-muted-foreground/50" />
                                  <span className="text-[11px] text-muted-foreground">{city.name}</span>
                                  {city.familyCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground/60">·{city.familyCount}</span>
                                  )}
                                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => { setEditingId(city.id); setAddingUnder(null); }}
                                      className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors">
                                      <Pencil className="h-2.5 w-2.5" />
                                    </button>
                                    <DeleteCityButton city={city} />
                                  </div>
                                </div>
                              )
                            ))}

                            {/* Add city inline */}
                            {isAddingUnder(region.id, "CITY") ? (
                              <div className="w-full mt-1">
                                <AddForm parentId={region.id} type="CITY" onDone={() => setAddingUnder(null)} />
                              </div>
                            ) : (
                              <button type="button"
                                onClick={() => { setAddingUnder({ parentId: region.id, type: "CITY" }); setEditingId(null); }}
                                className="flex items-center gap-1 rounded-full border border-dashed border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                                <Plus className="h-2.5 w-2.5" /> مدينة
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add region */}
                  {isAddingUnder(country.id, "REGION") ? (
                    <AddForm parentId={country.id} type="REGION" onDone={() => setAddingUnder(null)} />
                  ) : (
                    <button type="button"
                      onClick={() => { setAddingUnder({ parentId: country.id, type: "REGION" }); setEditingId(null); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                      <Plus className="h-3 w-3" />
                      إضافة {childTypeLabel[country.type]}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeleteCityButton({ city }: { city: PlaceData }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canDelete = city.familyCount === 0;

  if (!canDelete) {
    return (
      <button disabled title={`مرتبطة بـ ${city.familyCount} عائلة`}
        className="p-0.5 opacity-20 cursor-not-allowed">
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    );
  }

  if (confirmDelete) {
    return (
      <button type="button"
        onClick={() => startTransition(async () => {
          await deleteHomelandPlace(city.id);
          router.refresh();
        })}
        disabled={isPending}
        className="p-0.5 text-red-400 hover:text-red-300 transition-colors">
        {isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => setConfirmDelete(true)}
      className="p-0.5 text-muted-foreground/50 hover:text-red-400 transition-colors">
      <Trash2 className="h-2.5 w-2.5" />
    </button>
  );
}
