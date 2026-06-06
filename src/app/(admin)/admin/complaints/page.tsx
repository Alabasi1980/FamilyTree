import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintStatusForm } from "@/components/admin/complaint-status-form";
import { AlertTriangle, MessageSquare } from "lucide-react";

const typeLabels = {
  ACCOUNT_ACCESS: "مشكلة وصول أو حساب",
  FAMILY_ADMINISTRATION: "إدارة أو صلاحيات عائلة",
  DATA_CORRECTION: "تصحيح بيانات",
  PRIVACY_SAFETY: "خصوصية أو سلامة",
  FAMILY_LINKING: "ربط عائلات أو توحيد فروع",
  TECHNICAL_ISSUE: "مشكلة تقنية",
  OTHER: "أخرى",
};

const statusLabels = {
  OPEN: { label: "مفتوحة", variant: "gold" as const },
  IN_REVIEW: { label: "قيد المراجعة", variant: "member" as const },
  WAITING_USER: { label: "بانتظار المستخدم", variant: "admin" as const },
  RESOLVED: { label: "محلولة", variant: "public" as const },
  CLOSED: { label: "مغلقة", variant: "secondary" as const },
};

export default async function AdminComplaintsPage() {
  const [openCount, complaints] = await Promise.all([
    db.complaint.count({ where: { status: { in: ["OPEN", "IN_REVIEW", "WAITING_USER"] } } }),
    db.complaint.findMany({
      include: {
        submittedBy: { select: { fullName: true, name: true, email: true } },
        handledBy: { select: { fullName: true, name: true, email: true } },
        family: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-accent" />
          <div>
            <h1 className="text-xl font-bold text-foreground">إدارة الشكاوى</h1>
            <p className="mt-1 text-sm text-muted-foreground">الشكاوى تصل هنا من المستخدمين ومسؤولي العائلات.</p>
          </div>
        </div>
        {openCount > 0 && <Badge variant="gold">{openCount} نشطة</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            الشكاوى
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {complaints.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">لا توجد شكاوى</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {complaints.map((complaint) => (
                <li id={`complaint-${complaint.id}`} key={complaint.id} className="scroll-mt-24 px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{complaint.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {typeLabels[complaint.type]} • {complaint.family?.name ?? "بدون عائلة"} • من{" "}
                        {complaint.submittedBy.fullName ?? complaint.submittedBy.name ?? complaint.submittedBy.email ?? "مستخدم"} •{" "}
                        {new Date(complaint.createdAt).toLocaleDateString("ar")}
                      </p>
                    </div>
                    <Badge variant={statusLabels[complaint.status].variant}>
                      {statusLabels[complaint.status].label}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{complaint.body}</p>
                  {complaint.handledBy && (
                    <p className="mt-2 text-[11px] text-muted-foreground/70">
                      آخر معالجة بواسطة {complaint.handledBy.fullName ?? complaint.handledBy.name ?? complaint.handledBy.email}
                    </p>
                  )}
                  <div className="mt-3">
                    <ComplaintStatusForm
                      complaintId={complaint.id}
                      currentStatus={complaint.status}
                      initialResponse={complaint.adminResponse}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
