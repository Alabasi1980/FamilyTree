import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintSubmitForm } from "@/components/complaints/complaint-submit-form";
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
  WAITING_USER: { label: "بانتظارك", variant: "admin" as const },
  RESOLVED: { label: "محلولة", variant: "public" as const },
  CLOSED: { label: "مغلقة", variant: "secondary" as const },
};

export default async function ComplaintsPage() {
  const session = await auth();
  const user = session!.user;

  const [families, complaints] = await Promise.all([
    db.family.findMany({
      where: user.accountType === "SYSTEM_ADMIN"
        ? { deletedAt: null }
        : { deletedAt: null, adminAssignments: { some: { userId: user.id, isActive: true } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    db.complaint.findMany({
      where: { submittedByUserId: user.id },
      include: { family: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-accent" />
        <div>
          <h1 className="text-xl font-bold text-foreground">الشكاوى والدعم</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أرسل مشكلة تحتاج متابعة مدير النظام وتابع حالتها من هنا.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">شكوى جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplaintSubmitForm families={families} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            شكاواي
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {complaints.length === 0 ? (
            <div className="px-6 py-8 text-center space-y-3">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">لم ترسل أي شكوى بعد</p>
              <div className="text-right max-w-xs mx-auto space-y-1.5">
                <p className="text-[11px] text-muted-foreground/70 font-medium">يمكنك استخدام هذا القسم للإبلاغ عن:</p>
                <ul className="space-y-1 text-[11px] text-muted-foreground/60">
                  <li className="flex items-center gap-1.5"><span className="text-accent/60">•</span> مشكلة في الوصول إلى حسابك</li>
                  <li className="flex items-center gap-1.5"><span className="text-accent/60">•</span> بيانات خاطئة تحتاج تصحيحًا من المدير</li>
                  <li className="flex items-center gap-1.5"><span className="text-accent/60">•</span> طلب ربط عائلتين أو توحيد فروع</li>
                  <li className="flex items-center gap-1.5"><span className="text-accent/60">•</span> أي مشكلة تقنية أو خصوصية</li>
                </ul>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {complaints.map((complaint) => (
                <li id={`complaint-${complaint.id}`} key={complaint.id} className="scroll-mt-24 px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{complaint.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {typeLabels[complaint.type]} • {complaint.family?.name ?? "بدون عائلة"} •{" "}
                        {new Date(complaint.createdAt).toLocaleDateString("ar")}
                      </p>
                    </div>
                    <Badge variant={statusLabels[complaint.status].variant}>
                      {statusLabels[complaint.status].label}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{complaint.body}</p>
                  {complaint.adminResponse && (
                    <div className="mt-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground">
                      {complaint.adminResponse}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
