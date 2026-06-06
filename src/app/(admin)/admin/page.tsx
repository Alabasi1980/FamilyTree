import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, ClipboardList, Shield } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [totalUsers, totalFamilies, totalPersons, pendingAdminReqs, pendingEditReqs, activeComplaints] =
    await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.family.count({ where: { deletedAt: null } }),
      db.person.count({ where: { deletedAt: null } }),
      db.adminRequest.count({ where: { status: "PENDING" } }),
      db.editRequest.count({ where: { status: "PENDING" } }),
      db.complaint.count({ where: { status: { in: ["OPEN", "IN_REVIEW", "WAITING_USER"] } } }),
    ]);

  const recentRequests = await db.adminRequest.findMany({
    where: { status: "PENDING" },
    include: { submittedBy: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "مستخدم", value: totalUsers, icon: Users, href: "/admin/users" },
    { label: "عائلة", value: totalFamilies, icon: TreePine, href: "/admin/families" },
    { label: "فرد مسجّل", value: totalPersons, icon: Users, href: "/admin/families" },
    {
      label: "طلب إداري معلق",
      value: pendingAdminReqs,
      icon: ClipboardList,
      href: "/dashboard/requests",
      urgent: pendingAdminReqs > 0,
    },
    {
      label: "طلب تعديل معلق",
      value: pendingEditReqs,
      icon: ClipboardList,
      href: "/dashboard/requests",
      urgent: pendingEditReqs > 0,
    },
    {
      label: "شكاوى نشطة",
      value: activeComplaints,
      icon: ClipboardList,
      href: "/admin/complaints",
      urgent: activeComplaints > 0,
    },
  ];

  const reqTypeLabels: Record<string, string> = {
    CREATE_FAMILY_AND_ADMINISTER: "إنشاء عائلة جديدة",
    BECOME_FAMILY_ADMIN: "إدارة عائلة",
    JOIN_FAMILY_ADMINS: "الانضمام لمسؤولي عائلة",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-accent" />
        <h1 className="text-xl font-bold text-foreground">لوحة إدارة النظام</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={`hover:border-accent/40 transition-colors ${s.urgent ? "border-amber-700/60" : ""}`}>
              <CardContent className="pt-4 pb-3 px-4">
                <p className={`text-2xl font-bold ${s.urgent ? "text-amber-400" : "text-foreground"}`}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending admin requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            طلبات إدارية معلقة
            {pendingAdminReqs > 0 && (
              <Badge variant="gold" className="mr-auto text-xs">{pendingAdminReqs}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">لا توجد طلبات معلقة</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {recentRequests.map((req) => (
                <li key={req.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {reqTypeLabels[req.requestType] ?? req.requestType}
                      {req.proposedFamilyName && `: ${req.proposedFamilyName}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      من {req.submittedBy.fullName} •{" "}
                      {new Date(req.createdAt).toLocaleDateString("ar")}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/requests"
                    className="text-xs text-accent hover:underline shrink-0"
                  >
                    مراجعة
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
