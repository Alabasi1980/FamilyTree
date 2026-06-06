"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHomelandPlace } from "@/lib/actions/homelands";

interface PlaceOption {
  id: string;
  name: string;
  type: "COUNTRY" | "REGION" | "CITY";
  parentId: string | null;
}

const labels = {
  title: "إضافة موطن إلى الأطلس",
  name: "اسم الموطن",
  aliases: "أسماء بديلة",
  sortOrder: "ترتيب الظهور",
  type: "المستوى",
  parent: "يتبع إلى",
  country: "دولة",
  region: "منطقة / محافظة",
  city: "مدينة / قرية",
  noParent: "بدون",
  chooseParent: "اختر الموطن الأب",
  add: "إضافة",
  added: "تمت الإضافة",
  error: "تعذر إضافة الموطن",
};

export function HomelandPlaceForm({ places }: { places: PlaceOption[] }) {
  const router = useRouter();
  const [type, setType] = useState<"COUNTRY" | "REGION" | "CITY">("COUNTRY");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const parentOptions = useMemo(() => {
    if (type === "REGION") return places.filter((place) => place.type === "COUNTRY");
    if (type === "CITY") return places.filter((place) => place.type === "REGION");
    return [];
  }, [places, type]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      const result = await createHomelandPlace({
        name: form.get("name") as string,
        type,
        parentId: type === "COUNTRY" ? null : (form.get("parentId") as string),
        aliases: form.get("aliases") as string,
        sortOrder: Number(form.get("sortOrder") || 0),
      });
      if (!result.success) {
        setError(result.error ?? labels.error);
        return;
      }
      setMessage(labels.added);
      formElement.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border/50 bg-card/60 p-4">
      <h2 className="text-sm font-semibold text-foreground">{labels.title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{labels.type}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "COUNTRY" | "REGION" | "CITY")}
            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm"
          >
            <option value="COUNTRY">{labels.country}</option>
            <option value="REGION">{labels.region}</option>
            <option value="CITY">{labels.city}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{labels.parent}</label>
          <select
            name="parentId"
            disabled={type === "COUNTRY"}
            required={type !== "COUNTRY"}
            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm disabled:opacity-60"
          >
            <option value="">{type === "COUNTRY" ? labels.noParent : labels.chooseParent}</option>
            {parentOptions.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px]">
        <Input name="name" required minLength={2} placeholder={labels.name} className="h-9 bg-background/50 text-sm" />
        <Input name="aliases" placeholder={labels.aliases} className="h-9 bg-background/50 text-sm" />
        <Input name="sortOrder" type="number" min={0} defaultValue={0} placeholder={labels.sortOrder} className="h-9 bg-background/50 text-sm" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" size="sm" variant="gold" disabled={isPending}>
          {isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="ml-1 h-3.5 w-3.5" />}
          {labels.add}
        </Button>
        {message && <p className="text-xs text-green-400">{message}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </form>
  );
}
