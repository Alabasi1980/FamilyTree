import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditFamilyData,
  auditAllFamilies,
  type FamilyAuditReport,
  type AuditIssue,
} from "@/lib/actions/data-audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCw, ShieldAlert, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ── Severity config ────────────────────────────────────────────────────────────

const severityConfig = {
  CRITICAL: { label: "حرج",    variant: "private" as const },
  HIGH:     { label: "عالٍ",   variant: "admin"   as const },
  MEDIUM:   { label: "متوسط",  variant: "gold"    as const },
};

// Issue codes where affectedIds are marriage IDs (not person IDs)
const MARRIAGE_ID_CODES = new Set([
  "ACTIVE_MARRIAGE_BOTH_DECEASED",
  "MARRIAGE_BEFORE_BIRTH",
  "MARRIAGE_AFTER_DEATH",
  "DIVORCE_BEFORE_MARRIAGE",
]);

// ── Sub-components ─────────────────────────────────────────────────────────────

function IssueRow({ issue, familyId }: { issue: AuditIssue; familyId: string }) {
  const sev = severityConfig[issue.severity];
  const personIds = MARRIAGE_ID_CODES.has(issue.code) ? [] : issue.affectedIds.slice(0, 2);

  return (
    <div className="flex items-start gap-3 py-3 first:pt-4 last:pb-4">
      <Badge variant={sev.variant} className="mt-0.5 shrink-0 text-[11px]">
        {sev.label}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{issue.description}</p>
        {issue.details && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{issue.details}</p>
        )}
        {personIds.length > 0 && (
          <div className="flex gap-3 mt-1.5 flex-wrap">
            {personIds.map((pid) => (
              <Link
                key={pid}
                href={`/dashboard/families/${familyId}/persons/${pid}/edit`}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <User className="h-3 w-3" />
                تعديل الشخص
              </Link>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 hidden sm:block text-[10px] font-mono text-muted-foreground/40 mt-0.5">
        {issue.code}
      </span>
    </div>
  );
}

function FamilyReportCard({ report }: { report: FamilyAuditReport }) {
  const sorted = [
    ...report.issues.filter((i) => i.severity === "CRITICAL"),
    ...report.issues.filter((i) => i.severity === "HIGH"),
    ...report.issues.filter((i) => i.severity === "MEDIUM"),
  ];

  return (
    <Card className={cn(
      "border-border/50",
      report.summary.critical > 0 && "border-red-900/40",
    )}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">
            <Link
              href={`/dashboard/families/${report.familyId}`}
              className="hover:text-accent transition-colors"
            >
              عائلة {report.familyName}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {report.summary.critical > 0 && (
              <Badge variant="private">{report.summary.critical} حرج</Badge>
            )}
            {report.summary.high > 0 && (
              <Badge variant="admin">{report.summary.high} عالٍ</Badge>
            )}
            {report.summary.medium > 0 && (
              <Badge variant="gold">{report.summary.medium} متوسط</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30 px-5">
          {sorted.map((issue, i) => (
            <IssueRow key={i} issue={issue} familyId={report.familyId} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AuditPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  let reports: FamilyAuditReport[] = [];

  if (isSystemAdmin) {
    const result = await auditAllFamilies();
    if (result.success) reports = result.reports;
  } else {
    // Family admin: audit only their managed families
    const assignments = await db.familyAdminAssignment.findMany({
      where: { userId: user.id, isActive: true },
      select: { familyId: true },
    });
    for (const a of assignments) {
      const result = await auditFamilyData(a.familyId);
      if (result.success && result.report.issues.length > 0) {
        reports.push(result.report);
      }
    }
    reports.sort((a, b) => b.summary.critical - a.summary.critical || b.summary.total - a.summary.total);
  }

  const totalCritical = reports.reduce((s, r) => s + r.summary.critical, 0);
  const totalHigh     = reports.reduce((s, r) => s + r.summary.high,     0);
  const totalMedium   = reports.reduce((s, r) => s + r.summary.medium,   0);
  const totalIssues   = totalCritical + totalHigh + totalMedium;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-accent/70" />
            أدوات البيانات
          </p>
          <h1 className="text-xl font-bold text-foreground">تقرير تدقيق البيانات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSystemAdmin
              ? "فحص تلقائي لجميع عائلات النظام"
              : "فحص تلقائي للعائلات التي تديرها"}
          </p>
        </div>
        <a
          href="/dashboard/audit"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث التقرير
        </a>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "إجمالي المشكلات", value: totalIssues,   color: "text-foreground",    bg: "bg-muted/20" },
          { label: "حرجة",            value: totalCritical, color: "text-red-400",        bg: "bg-red-900/15" },
          { label: "عالية الخطورة",   value: totalHigh,     color: "text-amber-400",      bg: "bg-amber-900/15" },
          { label: "متوسطة",          value: totalMedium,   color: "text-accent",         bg: "bg-accent/10" },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-xl border border-border/40 p-4",
              s.bg,
            )}
          >
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Results ── */}
      {totalIssues === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-900/30 bg-green-900/10 px-6 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500/60" />
          <p className="text-sm font-medium text-green-300">لا مشكلات — جميع البيانات سليمة</p>
          <p className="text-xs text-muted-foreground">
            لم يُكتشف أي انتهاك في قواعد النسب أو الزواج أو التواريخ.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <FamilyReportCard key={report.familyId} report={report} />
          ))}
        </div>
      )}

    </div>
  );
}
