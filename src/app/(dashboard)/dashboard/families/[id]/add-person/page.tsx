"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPerson } from "@/lib/actions/persons";
import { withBasePath } from "@/lib/base-path";
import DuplicateWarning from "@/components/persons/duplicate-warning";

export default function AddPersonPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const familyId = params.id;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState<number | undefined>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPerson({
        familyId,
        fullName: form.get("fullName") as string,
        gender,
        isLiving: form.get("isLiving") === "true",
        birthDate: form.get("birthDate") as string || undefined,
        deathDate: form.get("deathDate") as string || undefined,
        biography: form.get("biography") as string || undefined,
        notes: form.get("notes") as string || undefined,
        visibilityLevel: form.get("visibilityLevel") as string || "PUBLIC",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(withBasePath(`/dashboard/families/${familyId}`));
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/families/${familyId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">إضافة فرد جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            الاسم الكامل <span className="text-destructive">*</span>
          </label>
          <Input
            name="fullName"
            placeholder="محمد أحمد علي"
            required
            className="bg-card/60"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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

        {/* Duplicate detection */}
        <DuplicateWarning
          familyId={familyId}
          fullName={fullName}
          gender={gender}
          birthYear={birthYear}
          familyDashboardId={familyId}
        />

        {/* Living status */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">الحالة</label>
          <select
            name="isLiving"
            defaultValue="true"
            title="الحالة"
            className="w-full h-9 rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="true">على قيد الحياة</option>
            <option value="false">متوفى</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">تاريخ الميلاد</label>
            <Input
              name="birthDate"
              type="date"
              className="bg-card/60"
              dir="ltr"
              onChange={(e) => {
                const y = e.target.value ? new Date(e.target.value).getFullYear() : undefined;
                setBirthYear(y);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">تاريخ الوفاة</label>
            <Input name="deathDate" type="date" className="bg-card/60" dir="ltr" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">مستوى الظهور</label>
          <select
            name="visibilityLevel"
            defaultValue="PUBLIC"
            title="مستوى الظهور"
            className="w-full h-9 rounded-md border border-input bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="PUBLIC">عام</option>
            <option value="MEMBER">للأعضاء فقط</option>
            <option value="ADMIN">للمسؤولين فقط</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">ملاحظات</label>
          <textarea
            name="notes"
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
            إضافة الفرد
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>إلغاء</Button>
        </div>
      </form>
    </div>
  );
}
