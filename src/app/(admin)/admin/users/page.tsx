import { db } from "@/lib/db";
import { Users } from "lucide-react";
import { AdminUsersList } from "@/components/admin/admin-users-list";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
      phone: true,
      accountType: true,
      createdAt: true,
      familyAdminAssignments: {
        where: { isActive: true },
        select: { family: { select: { name: true } } },
        take: 5,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">المستخدمون</h1>
      </div>

      <AdminUsersList users={users} />
    </div>
  );
}
