"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePerson } from "@/lib/actions/persons";
import type { Gender, VisibilityLevel } from "@/generated/prisma/client";

interface PersonData {
  id: string;
  fullName: string;
  gender: Gender;
  isLiving: boolean;
  birthDate: Date | null;
  deathDate: Date | null;
  biography: string | null;
  notes: string | null;
  visibilityLevel: VisibilityLevel;
}

interface Props {
  person: PersonData;
  familyId: string;
}

function toInputDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function EditPersonForm({ person, familyId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">(person.gender);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updatePerson(person.id, {
        fullName: form.get("fullName") as string,
        gender,
        isLiving: form.get("isLiving") === "true",
        birthDate: (form.get("birthDate") as string) || undefined,
        deathDate: (form.get("deathDate") as string) || undefined,
        biography: (form.get("biography") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
        visibilityLevel: form.get("visibilityLevel") as string || "PUBLIC",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/families/${familyId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          الاسم الكامل <span className="text-destructive">*</span>
        </label>
        <Input
          name="fullName"
          defaultValue={person.fullName}
          placeholder="محمد أحمد علي"
          required
          className="bg-card/60"
        />
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">الجنس</label>
        <div className="flex gap-2">
          {(["MALE", "FEMALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                gender === g
                  ? "border-accent bg-accent/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {g === "MALE" ? "ذكر" : "أنثى"}
            </button>
          ))}
        </div>
      </div>

      {/* Living status */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">الحالة</label>
        <select
          name="isLiving"
          defaultValue={person.isLiving ? "true" : "false"}
          title="الحالة"
          className="w-full h-9 rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="true">على قيد الحياة</option>
          <option value="false">متوفى</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">تاريخ الميلاد</label>
          <Input
            name="birthDate"
            type="date"
            defaultValue={toInputDate(person.birthDate)}
            className="bg-card/60"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">تاريخ الوفاة</label>
          <Input
            name="deathDate"
            type="date"
            defaultValue={toInputDate(person.deathDate)}
            className="bg-card/60"
            dir="ltr"
          />
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">مستوى الظهور</label>
        <select
          name="visibilityLevel"
          defaultValue={person.visibilityLevel}
          title="مستوى الظهور"
          className="w-full h-9 rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="PUBLIC">عام</option>
          <option value="MEMBER">للأعضاء فقط</option>
          <option value="ADMIN">للمسؤولين فقط</option>
          <option value="SHARED_LINK">برابط المشاركة</option>
        </select>
      </div>

      {/* Biography */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">نبذة</label>
        <textarea
          name="biography"
          defaultValue={person.biography ?? ""}
          placeholder="نبذة مختصرة..."
          rows={3}
          className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">ملاحظات</label>
        <textarea
          name="notes"
          defaultValue={person.notes ?? ""}
          placeholder="ملاحظات اختيارية..."
          rows={2}
          className="w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="gold" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          حفظ التعديلات
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
