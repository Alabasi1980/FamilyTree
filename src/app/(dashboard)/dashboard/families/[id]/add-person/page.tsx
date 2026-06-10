"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DuplicateWarning from "@/components/persons/duplicate-warning";
import { createPerson } from "@/lib/actions/persons";
import { withBasePath } from "@/lib/base-path";

type Gender = "MALE" | "FEMALE";
type VisibilityValue = "PUBLIC" | "MEMBER" | "ADMIN";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const maxYear = new Date().getFullYear() + 1;

export default function AddPersonPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const familyId = params.id;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [visibilityLevel, setVisibilityLevel] = useState<VisibilityValue>("PUBLIC");
  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState<number | undefined>();
  const [successResult, setSuccessResult] = useState<{ personId: string; name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPerson({
        familyId,
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

      setSuccessResult({ personId: result.personId ?? "", name: fullName.trim() });
    });
  }

  if (successResult) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/families/${familyId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">إضافة فرد جديد</h1>
        </div>

        <div className="rounded-2xl border border-green-800/40 bg-green-900/10 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-900/30 border border-green-700/40">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
          </div>
          <p className="text-base font-semibold text-foreground">تمت الإضافة بنجاح</p>
          <p className="text-sm text-muted-foreground">
            تمت إضافة <span className="font-medium text-foreground">{successResult.name}</span> إلى العائلة.
          </p>
          <div className="flex justify-center gap-3 pt-2 flex-wrap">
            {successResult.personId && (
              <Button
                variant="gold"
                onClick={() => router.push(`/dashboard/families/${familyId}/persons/${successResult.personId}`)}
              >
                عرض الفرد
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSuccessResult(null);
                setFullName("");
                setGender("MALE");
                setVisibilityLevel("PUBLIC");
                setError("");
              }}
            >
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة فرد آخر
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/families/${familyId}`)}
            >
              العودة إلى العائلة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/families/${familyId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">إضافة فرد جديد</h1>
          <p className="text-sm text-muted-foreground">أدخل البيانات الأساسية، واترك الحقول غير المعروفة فارغة.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الكنية</label>
            <Input name="kunya" placeholder="أبو خالد" className="bg-card/60" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">المهنة</label>
            <Input name="profession" placeholder="طبيب، مهندس، تاجر..." className="bg-card/60" />
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
                    setVisibilityLevel(g === "FEMALE" ? "ADMIN" : "PUBLIC");
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

          <DuplicateWarning
            familyId={familyId}
            fullName={fullName}
            gender={gender}
            birthYear={birthYear}
            familyDashboardId={familyId}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">سنة الميلاد</label>
            <Input
              name="birthYear"
              type="number"
              min="1"
              max={maxYear}
              placeholder="1980"
              className="bg-card/60"
              dir="ltr"
              onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">سنة الوفاة</label>
            <Input
              name="deathYear"
              type="number"
              min="1"
              max={maxYear}
              placeholder="فارغة إذا كان حيًا"
              className="bg-card/60"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">مكان الميلاد</label>
            <Input name="birthPlace" placeholder="المدينة أو البلدة" className="bg-card/60" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">فصيلة الدم</label>
            <select
              name="bloodType"
              defaultValue=""
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

          <p className="text-xs leading-6 text-muted-foreground sm:col-span-2">
            وجود سنة وفاة يجعل الحالة متوفى تلقائيًا. إذا لم تسجل سنة وفاة سيظهر الشخص على قيد الحياة.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-xl border border-border/50 bg-card/35 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">المدينة الحالية</label>
            <Input name="residenceCity" placeholder="عمّان، جدة، دمشق..." className="bg-card/60" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">العنوان</label>
            <Input name="address" placeholder="اختياري" className="bg-card/60" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">رابط صورة الشخص</label>
            <Input name="photoUrl" placeholder="https://example.com/photo.jpg" className="bg-card/60" dir="ltr" />
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
            </select>
            <p className="text-xs text-muted-foreground">
              الإناث تكون خاصّة للمسؤولين افتراضيًا، ويمكن للمسؤول تغيير ذلك عند الحاجة.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نبذة مختصرة</label>
            <textarea
              name="biography"
              placeholder="سيرة مختصرة أو معلومات عامة..."
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-card/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات داخلية</label>
            <textarea
              name="notes"
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
            إضافة الفرد
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
