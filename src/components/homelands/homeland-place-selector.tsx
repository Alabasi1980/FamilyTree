"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, Globe, Loader2, MapPin, Building2, Send, Plus, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listActiveHomelandPlaces, submitHomelandPlaceRequest } from "@/lib/actions/homelands";

type HomelandPlace = Awaited<ReturnType<typeof listActiveHomelandPlaces>>[number];

interface Props {
  initialPlaceId?: string | null;
  initialCountry?: string | null;
  initialRegion?: string | null;
  initialCity?: string | null;
  compact?: boolean;
}

export function HomelandPlaceSelector({
  initialPlaceId,
  initialCountry,
  initialRegion,
  initialCity,
}: Props) {
  const [places, setPlaces] = useState<HomelandPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [countryId, setCountryId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [cityId, setCityId] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    listActiveHomelandPlaces()
      .then((data) => {
        if (!active) return;
        setPlaces(data);
        if (initialPlaceId) {
          const sel = getInitialSelection(data, initialPlaceId);
          if (sel) { setCountryId(sel.countryId); setRegionId(sel.regionId); setCityId(sel.cityId); }
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [initialPlaceId]);

  const placeMap = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const countries = places.filter((p) => p.type === "COUNTRY" && !p.parentId);
  const regions = places.filter((p) => p.type === "REGION" && p.parentId === countryId);
  const cities = places.filter((p) => p.type === "CITY" && p.parentId === regionId);

  const selectedCountry = countryId ? placeMap.get(countryId) : null;
  const selectedRegion = regionId ? placeMap.get(regionId) : null;
  const selectedCity = cityId ? placeMap.get(cityId) : null;
  const selectedPlaceId = selectedCity?.id ?? selectedRegion?.id ?? selectedCountry?.id ?? "";

  const countryName = selectedCountry?.name ?? initialCountry ?? "";
  const regionName = selectedRegion?.name ?? initialRegion ?? "";
  const cityName = selectedCity?.name ?? initialCity ?? "";
  const hasLegacyOnly = !selectedPlaceId && [initialCountry, initialRegion, initialCity].some(Boolean);
  const hasSelection = !!selectedPlaceId;

  function handleCountryChange(value: string) {
    setCountryId(value); setRegionId(""); setCityId("");
  }
  function handleRegionChange(value: string) {
    setRegionId(value); setCityId("");
  }
  function handleClear() {
    setCountryId(""); setRegionId(""); setCityId("");
  }

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRequestError("");
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitHomelandPlaceRequest({
        countryName: form.get("reqCountry") as string,
        regionName: form.get("reqRegion") as string,
        cityName: form.get("reqCity") as string,
        note: form.get("reqNote") as string,
      });
      if (!result.success) { setRequestError(result.error ?? "تعذر الإرسال"); return; }
      setRequestSent(true);
      setShowRequest(false);
    });
  }

  const pathParts = [countryName, regionName, cityName].filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Hidden form fields */}
      <input type="hidden" name="homelandPlaceId" value={selectedPlaceId} />
      <input type="hidden" name="homelandCountry" value={countryName} />
      <input type="hidden" name="homelandRegion" value={regionName} />
      <input type="hidden" name="homelandCity" value={cityName} />

      {/* Legacy warning */}
      {hasLegacyOnly && (
        <div className="flex items-center gap-2 rounded-md border border-amber-700/40 bg-amber-900/10 px-3 py-2 text-xs text-amber-300">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>الموطن الحالي: {[initialCountry, initialRegion, initialCity].filter(Boolean).join(" ← ")}</span>
        </div>
      )}

      {/* Selected path chip */}
      {hasSelection && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
          <div className="flex flex-wrap items-center gap-1 flex-1 text-sm text-foreground">
            {pathParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronLeft className="h-3 w-3 text-muted-foreground/40" />}
                <span>{part}</span>
              </span>
            ))}
          </div>
          <button type="button" onClick={handleClear} aria-label="مسح الاختيار"
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Cascade selects */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StepSelect
          step={1}
          icon={<Globe className="h-3.5 w-3.5" />}
          label="الدولة"
          value={countryId}
          onChange={handleCountryChange}
          options={countries}
          placeholder={isLoading ? "جارٍ التحميل..." : "اختر الدولة"}
          disabled={isLoading}
          active={true}
        />
        <StepSelect
          step={2}
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="المنطقة / المحافظة"
          value={regionId}
          onChange={handleRegionChange}
          options={regions}
          placeholder={!countryId ? "اختر دولة أولاً" : regions.length ? "اختر المنطقة" : "لا توجد مناطق بعد"}
          disabled={!countryId || isLoading}
          active={!!countryId}
          optional
        />
        <StepSelect
          step={3}
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="المدينة / القرية"
          value={cityId}
          onChange={setCityId}
          options={cities}
          placeholder={!regionId ? "اختر منطقة أولاً" : cities.length ? "اختر المدينة" : "لا توجد مدن بعد"}
          disabled={!regionId || isLoading}
          active={!!regionId}
          optional
        />
      </div>

      {/* Request section */}
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {!requestSent ? (
          <button type="button"
            onClick={() => setShowRequest((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
            <Plus className="h-3.5 w-3.5" />
            طلب إضافة موطن غير موجود
          </button>
        ) : (
          <span className="text-xs text-green-400">✓ أُرسل طلبك للمراجعة</span>
        )}
      </div>

      {showRequest && (
        <form onSubmit={handleRequestSubmit}
          className="rounded-lg border border-border/40 bg-card/30 p-3 space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">اقترح موطناً غير موجود في الأطلس</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input name="reqCountry" required placeholder="الدولة *" defaultValue={countryName}
              className="h-8 bg-background/60 text-sm" />
            <Input name="reqRegion" placeholder="المنطقة (اختياري)" defaultValue={regionName}
              className="h-8 bg-background/60 text-sm" />
            <Input name="reqCity" placeholder="المدينة (اختياري)" defaultValue={cityName}
              className="h-8 bg-background/60 text-sm" />
          </div>
          <Input name="reqNote" placeholder="ملاحظة إضافية (اختياري)" className="h-8 bg-background/60 text-sm" />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" variant="outline" disabled={isPending} className="h-7 text-xs">
              {isPending
                ? <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                : <Send className="ml-1 h-3 w-3" />}
              إرسال الطلب
            </Button>
            <button type="button" onClick={() => setShowRequest(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              إلغاء
            </button>
            {requestError && <p className="text-xs text-destructive">{requestError}</p>}
          </div>
        </form>
      )}
    </div>
  );
}

function StepSelect({
  step, icon, label, value, onChange, options, placeholder, disabled, active, optional,
}: {
  step: number; icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; options: HomelandPlace[];
  placeholder: string; disabled?: boolean; active?: boolean; optional?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors
          ${active ? "bg-accent/20 text-accent" : "bg-muted/30 text-muted-foreground/50"}`}>
          {step}
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium transition-colors
          ${active ? "text-foreground" : "text-muted-foreground/50"}`}>
          {icon}{label}
          {optional && <span className="text-muted-foreground/40">(اختياري)</span>}
        </span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={`h-9 w-full appearance-none rounded-md border px-3 pr-8 text-sm transition-colors
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
            disabled:cursor-not-allowed disabled:opacity-40
            ${active && !disabled
              ? "border-input bg-card/60 text-foreground"
              : "border-border/30 bg-background/30 text-muted-foreground"
            }
            ${value ? "border-accent/30 bg-accent/5" : ""}`}
        >
          <option value="">{placeholder}</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p._count.families > 0 ? ` (${p._count.families} عائلة)` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className={`pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors
          ${active && !disabled ? "text-muted-foreground" : "text-muted-foreground/30"}`} />
      </div>
    </div>
  );
}

function getInitialSelection(places: HomelandPlace[], initialPlaceId: string) {
  const map = new Map(places.map((p) => [p.id, p]));
  const place = map.get(initialPlaceId);
  if (!place) return null;
  if (place.type === "COUNTRY") return { countryId: place.id, regionId: "", cityId: "" };
  if (place.type === "REGION") return { countryId: place.parentId ?? "", regionId: place.id, cityId: "" };
  const region = place.parentId ? map.get(place.parentId) : null;
  return { countryId: region?.parentId ?? "", regionId: region?.id ?? "", cityId: place.id };
}
