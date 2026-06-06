"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePerson } from "@/lib/actions/persons";
import { withBasePath } from "@/lib/base-path";
import type { Gender, VisibilityLevel } from "@/generated/prisma/client";

interface PersonData {
  id: string;
  fullName: string;
  kunya: string | null;
  gender: Gender;
  isLiving: boolean;
  birthYear: number | null;
  birthDate: Date | null;
  birthPlace: string | null;
  deathYear: number | null;
  deathDate: Date | null;
  bloodType: string | null;
  residenceCity: string | null;
  address: string | null;
  profession: string | null;
  biography: string | null;
  notes: string | null;
  photoUrl: string | null;
  visibilityLevel: VisibilityLevel;
}

interface Props {
  person: PersonData;
  familyId: string;
}

type VisibilityValue = "PUBLIC" | "MEMBER" | "ADMIN" | "SHARED_LINK";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const maxYear = new Date().getFullYear() + 1;

export default function EditPersonForm({ person, familyId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [gender, setGender] = useState<Gender>(person.gender);
  const [visibilityLevel, setVisibilityLevel] = useState<VisibilityValue>(person.visibilityLevel);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updatePerson(person.id, {
        fullName: form.get("fullName") as string,
        kunya: (form.get("kunya") as string) || undefined,
        gender,
        isLiving: true,
        birthYear: (form.get("birthYear") as string) || undefined,
        birthPlace: (form.get("birthPlace") as string) || undefined,
        deathYear: (form.get("deathYear") as string) || undefined,
        bloodType: (form.get("bloodType") as string) || undefined,
        residenceCity: (form.get("residenceCity") as string) || undefined,
        address: (form.get("address") as string) || undefined,
        profession: (form.get("profession") as string) || undefined,
        photoUrl: (form.get("photoUrl") as string) || undefined,
        biography: (form.get("biography") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
        visibilityLevel: (form.get("visibilityLevel") as string) || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(withBasePath(`/dashboard/families/${familyId}`));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">الكنية</label>
          <Input name="kunya" defaultValue={person.kunya ?? ""} placeholder="أبو خالد" className="bg-card/60" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">المهنة</label>
          <Input
            name="profession"
            defaultValue={person.profession ?? ""}
            placeholder="طبيب، مهندس، تاجر..."
            className="bg-card/60"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">الجنس</label>
          <div className="flex gap-2">
            {(["MALE", "FEMALE"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGender(g);
                  if (g === "FEMALE" && visibilityLevel === "PUBLIC") setVisibilityLevel("ADMIN");
                }}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  gender === g
                    ? "border-accent bg-accent/10 font-medium text-foreground"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {g === "MALE" ? "ذكر" : "أنثى"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">سنة الميلاد</label>
          <Input
            name="birthYear"
            type="number"
            min="1"
            max={maxYear}
            defaultValue={person.birthYear ?? person.birthDate?.getFullYear() ?? ""}
            placeholder="1980"
            className="bg-card/60"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">سنة الوفاة</label>
          <Input
            name="deathYear"
            type="number"
            min="1"
            max={maxYear}
            defaultValue={person.deathYear ?? person.deathDate?.getFullYear() ?? ""}
            placeholder="فارغة إذا كان حيًا"
            className="bg-card/60"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">مكان الميلاد</label>
          <Input name="birthPlace" defaultValue={person.birthPlace ?? ""} placeholder="المدينة أو البلدة" className="bg-card/60" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">فصيلة الدم</label>
          <select
            name="bloodType"
            defaultValue={person.bloodType ?? ""}
            title="فصيلة الدم"
            className="h-9 w-full rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">غير محددة</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">المدينة الحالية</label>
          <Input
            name="residenceCity"
            defaultValue={person.residenceCity ?? ""}
            placeholder="عمّان، جدة، دمشق..."
            className="bg-card/60"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">العنوان</label>
          <Input name="address" defaultValue={person.address ?? ""} placeholder="اختياري" className="bg-card/60" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">رابط صورة الشخص</label>
          <Input
            name="photoUrl"
            defaultValue={person.photoUrl ?? ""}
            placeholder="https://example.com/photo.jpg"
            className="bg-card/60"
            dir="ltr"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/50 bg-card/35 p-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">مستوى الظهور</label>
          <select
            name="visibilityLevel"
            value={visibilityLevel}
            onChange={(e) => setVisibilityLevel(e.target.value as VisibilityValue)}
            title="مستوى الظهور"
            className="h-9 w-full rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="PUBLIC">عام</option>
            <option value="MEMBER">للأعضاء فقط</option>
            <option value="ADMIN">خاص للمسؤولين فقط</option>
            <option value="SHARED_LINK">برابط المشاركة</option>
          </select>
          <p className="text-xs text-muted-foreground">المسؤولون يرون البيانات الخاصة دائمًا.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">نبذة مختصرة</label>
          <textarea
            name="biography"
            defaultValue={person.biography ?? ""}
            placeholder="سيرة مختصرة أو معلومات عامة..."
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">ملاحظات داخلية</label>
          <textarea
            name="notes"
            defaultValue={person.notes ?? ""}
            placeholder="ملاحظات اختيارية..."
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </section>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="gold" disabled={isPending}>
          {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          حفظ التعديلات
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

