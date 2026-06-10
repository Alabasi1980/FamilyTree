import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function checkPolygamousWomen() {
  const marriages = await db.marriageRelation.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      personA: { select: { id: true, fullName: true, gender: true, familyId: true } },
      personB: { select: { id: true, fullName: true, gender: true, familyId: true } },
    },
  });

  const counts = new Map<string, { name: string; familyId: string; count: number }>();
  for (const m of marriages) {
    for (const p of [m.personA, m.personB]) {
      if (p.gender === "FEMALE") {
        const prev = counts.get(p.id);
        counts.set(p.id, { name: p.fullName, familyId: p.familyId, count: (prev?.count ?? 0) + 1 });
      }
    }
  }
  return [...counts.values()].filter((v) => v.count > 1);
}

async function checkMaleMarriageLimitExceeded() {
  const marriages = await db.marriageRelation.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      personA: { select: { id: true, fullName: true, gender: true, familyId: true } },
      personB: { select: { id: true, fullName: true, gender: true, familyId: true } },
    },
  });

  const counts = new Map<string, { name: string; familyId: string; count: number }>();
  for (const m of marriages) {
    for (const p of [m.personA, m.personB]) {
      if (p.gender === "MALE") {
        const prev = counts.get(p.id);
        counts.set(p.id, { name: p.fullName, familyId: p.familyId, count: (prev?.count ?? 0) + 1 });
      }
    }
  }
  return [...counts.values()].filter((v) => v.count > 4);
}

async function checkMultipleParents() {
  const relations = await db.parentChildRelation.findMany({
    where: { child: { deletedAt: null }, parent: { deletedAt: null } },
    select: {
      childPersonId: true,
      child: { select: { fullName: true, familyId: true } },
      parent: { select: { gender: true } },
    },
  });

  const byChild = new Map<string, { name: string; familyId: string; fathers: number; mothers: number }>();
  for (const r of relations) {
    const prev = byChild.get(r.childPersonId) ?? {
      name: r.child.fullName,
      familyId: r.child.familyId,
      fathers: 0,
      mothers: 0,
    };
    if (r.parent.gender === "MALE") prev.fathers++;
    else prev.mothers++;
    byChild.set(r.childPersonId, prev);
  }

  return [...byChild.values()].filter((v) => v.fathers > 1 || v.mothers > 1).map((v) => ({
    ...v,
    issue:
      v.fathers > 1 && v.mothers > 1
        ? `${v.fathers} آباء و${v.mothers} أمهات`
        : v.fathers > 1
        ? `${v.fathers} آباء`
        : `${v.mothers} أمهات`,
  }));
}

async function checkActiveMarriagesBetweenDeceased() {
  return db.marriageRelation.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      personA: { isLiving: false, deletedAt: null },
      personB: { isLiving: false, deletedAt: null },
    },
    select: {
      id: true,
      personA: { select: { fullName: true, familyId: true } },
      personB: { select: { fullName: true } },
    },
  });
}

async function checkChronologyViolations() {
  const persons = await db.person.findMany({
    where: { deletedAt: null, birthYear: { not: null }, deathYear: { not: null } },
    select: { id: true, fullName: true, familyId: true, birthYear: true, deathYear: true },
  });
  return persons.filter((p) => p.birthYear! > p.deathYear!);
}

async function checkActiveMarriageSameGender() {
  const marriages = await db.marriageRelation.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      personA: { select: { fullName: true, gender: true, familyId: true } },
      personB: { select: { fullName: true, gender: true } },
    },
  });
  return marriages.filter((m) => m.personA.gender === m.personB.gender);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AuditPage() {
  const [
    polygamousWomen,
    maleOverLimit,
    multipleParents,
    deadActiveMarriages,
    chronoViolations,
    sameGenderMarriages,
  ] = await Promise.all([
    checkPolygamousWomen(),
    checkMaleMarriageLimitExceeded(),
    checkMultipleParents(),
    checkActiveMarriagesBetweenDeceased(),
    checkChronologyViolations(),
    checkActiveMarriageSameGender(),
  ]);

  const totalIssues =
    polygamousWomen.length +
    maleOverLimit.length +
    multipleParents.length +
    deadActiveMarriages.length +
    chronoViolations.length +
    sameGenderMarriages.length;

  const checks: {
    title: string;
    description: string;
    issues: { label: string; sub?: string; href?: string }[];
  }[] = [
    {
      title: "نساء بأكثر من زوج نشط",
      description: "كل امرأة يجب ألا تملك سوى زواج نشط واحد",
      issues: polygamousWomen.map((v) => ({
        label: v.name,
        sub: `${v.count} زيجات نشطة`,
        href: `/admin/families/${v.familyId}`,
      })),
    },
    {
      title: "رجال تجاوزوا حد 4 زوجات",
      description: "الحد الأقصى للزيجات النشطة للرجل هو 4",
      issues: maleOverLimit.map((v) => ({
        label: v.name,
        sub: `${v.count} زيجات نشطة`,
        href: `/admin/families/${v.familyId}`,
      })),
    },
    {
      title: "أشخاص بأكثر من والدين",
      description: "كل شخص يجب ألا يكون له أكثر من أب واحد وأم واحدة",
      issues: multipleParents.map((v) => ({
        label: v.name,
        sub: v.issue,
        href: `/admin/families/${v.familyId}`,
      })),
    },
    {
      title: "زيجات نشطة بين متوفيين",
      description: "الزيجات بين شخصين متوفيين يجب أن تكون بحالة HISTORICAL لا ACTIVE",
      issues: deadActiveMarriages.map((m) => ({
        label: `${m.personA.fullName} ← ${m.personB.fullName}`,
        href: `/admin/families/${m.personA.familyId}`,
      })),
    },
    {
      title: "تعارض تواريخ الميلاد والوفاة",
      description: "سنة الميلاد يجب أن تكون قبل سنة الوفاة",
      issues: chronoViolations.map((p) => ({
        label: p.fullName,
        sub: `ولد ${p.birthYear} — توفي ${p.deathYear}`,
        href: `/admin/families/${p.familyId}`,
      })),
    },
    {
      title: "زيجات نشطة بين نفس الجنس",
      description: "جميع الزيجات يجب أن تكون بين ذكر وأنثى",
      issues: sameGenderMarriages.map((m) => ({
        label: `${m.personA.fullName} ← ${m.personB.fullName}`,
        sub: m.personA.gender === "MALE" ? "ذكر + ذكر" : "أنثى + أنثى",
        href: `/admin/families/${m.personA.familyId}`,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">تدقيق سلامة البيانات</h1>
        </div>
        {totalIssues === 0 ? (
          <Badge variant="member" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            لا توجد مشكلات
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalIssues} مشكلة
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground -mt-3">
        يعرض هذا التقرير التناقضات الموجودة في قاعدة البيانات — الفحوصات الوقائية تمنع حدوثها حديثاً، لكن البيانات القديمة قد تحتاج مراجعة يدوية.
      </p>

      {/* Checks */}
      <div className="space-y-4">
        {checks.map((check) => (
          <Card key={check.title} className={check.issues.length > 0 ? "border-destructive/40" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  {check.issues.length === 0 ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  {check.title}
                </span>
                {check.issues.length > 0 && (
                  <Badge variant="destructive" className="shrink-0 text-xs">
                    {check.issues.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground pr-6">{check.description}</p>
            </CardHeader>
            {check.issues.length > 0 && (
              <CardContent className="p-0">
                <ul className="divide-y divide-border/40">
                  {check.issues.map((issue, i) => (
                    <li key={i} className="flex items-center justify-between px-5 py-2.5 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{issue.label}</p>
                        {issue.sub && (
                          <p className="text-xs text-muted-foreground">{issue.sub}</p>
                        )}
                      </div>
                      {issue.href && (
                        <Link
                          href={issue.href}
                          className="shrink-0 text-xs text-accent hover:underline"
                        >
                          فتح العائلة
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
