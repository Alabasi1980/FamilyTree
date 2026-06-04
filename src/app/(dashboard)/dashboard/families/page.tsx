import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TreePine, Users, Globe, Lock, ChevronLeft } from "lucide-react";
export default async function FamiliesListPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";

  const families = await db.family.findMany({
    where: isSystemAdmin
      ? { deletedAt: null }
      : {
          deletedAt: null,
          adminAssignments: { some: { userId: user.id, isActive: true } },
        },
    include: {
      _count: { select: { persons: true } },
      adminAssignments: {
        where: { isActive: true },
        include: { user: { select: { fullName: true } } },
        take: 3,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">العائلات</h1>
        <Button variant="gold" size="sm" asChild>
          <Link href="/dashboard/families/new">
            <Plus className="h-4 w-4 ml-1" />
            {isSystemAdmin ? "إنشاء عائلة" : "طلب إضافة عائلة"}
          </Link>
        </Button>
      </div>

      {families.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TreePine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد عائلات بعد</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/dashboard/families/new">
              {isSystemAdmin ? "أنشئ أول عائلة" : "اطلب إضافة عائلة"}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {families.map((family) => (
            <li key={family.id}>
              <Link
                href={`/dashboard/families/${family.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:border-accent/40 hover:bg-card/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <TreePine className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                      عائلة {family.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {family._count.persons} فرد
                      </span>
                      <Badge variant={family.isPublic ? "public" : "private"} className="text-xs px-1.5 py-0">
                        {family.isPublic ? <><Globe className="h-2.5 w-2.5 ml-0.5" />عامة</> : <><Lock className="h-2.5 w-2.5 ml-0.5" />خاصة</>}
                      </Badge>
                    </div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
