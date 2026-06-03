import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TreePine, Users, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getDashboardStats(userId: string, isAdmin: boolean) {
  const [managedFamilies, pendingRequests, totalPersons] = await Promise.all([
    isAdmin
      ? db.family.count({ where: { deletedAt: null } })
      : db.familyAdminAssignment.count({ where: { userId, isActive: true } }),
    isAdmin
      ? db.adminRequest.count({ where: { status: "PENDING" } })
      : db.editRequest.count({ where: { submittedByUserId: userId, status: "PENDING" } }),
    isAdmin
      ? db.person.count({ where: { deletedAt: null } })
      : db.person.count({
          where: {
            deletedAt: null,
            family: {
              adminAssignments: { some: { userId, isActive: true } },
            },
          },
        }),
  ]);
  return { managedFamilies, pendingRequests, totalPersons };
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const stats = await getDashboardStats(user.id, isSystemAdmin);

  const recentFamilies = await db.family.findMany({
    where: isSystemAdmin
      ? { deletedAt: null }
      : {
          deletedAt: null,
          adminAssignments: { some: { userId: user.id, isActive: true } },
        },
    include: { _count: { select: { persons: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            مرحباً، {user.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isSystemAdmin ? "مدير النظام" : "لوحة التحكم"}
          </p>
        </div>
        <Button variant="gold" size="sm" asChild>
          <Link href="/dashboard/families/new">
            <Plus className="h-4 w-4 ml-1" />
            طلب إضافة عائلة
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-primary/20 p-2.5">
              <TreePine className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.managedFamilies}</p>
              <p className="text-xs text-muted-foreground">
                {isSystemAdmin ? "عائلة في النظام" : "عائلة تديرها"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-primary/20 p-2.5">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalPersons}</p>
              <p className="text-xs text-muted-foreground">
                {isSystemAdmin ? "شخص في النظام" : "فرد في عائلاتك"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-amber-900/30 p-2.5">
              <ClipboardList className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
              <p className="text-xs text-muted-foreground">طلب بانتظار المراجعة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent families */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">العائلات الأخيرة</CardTitle>
            <Link href="/dashboard/families" className="text-xs text-accent hover:underline">
              عرض الكل
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentFamilies.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 py-4">لا توجد عائلات بعد</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {recentFamilies.map((family) => (
                <li key={family.id}>
                  <Link
                    href={`/dashboard/families/${family.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TreePine className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        عائلة {family.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {family._count.persons} فرد
                    </span>
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
