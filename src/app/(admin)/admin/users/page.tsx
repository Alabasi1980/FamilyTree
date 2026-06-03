import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ChangeUserRoleButton } from "@/components/admin/change-user-role-button";

const roleLabels = {
  SYSTEM_ADMIN: { label: "مدير النظام", variant: "gold" as const },
  MEMBER: { label: "عضو", variant: "member" as const },
  VISITOR: { label: "زائر", variant: "outline" as const },
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
      phone: true,
      accountType: true,
      createdAt: true,
      _count: { select: { familyAdminAssignments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">المستخدمون ({users.length})</h1>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base sr-only">قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/40">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between px-6 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {(user.fullName ?? user.name ?? user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.fullName ?? user.name ?? user.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email ?? user.phone ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={roleLabels[user.accountType].variant} className="hidden sm:inline-flex">
                    {roleLabels[user.accountType].label}
                  </Badge>
                  <ChangeUserRoleButton userId={user.id} currentRole={user.accountType} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
