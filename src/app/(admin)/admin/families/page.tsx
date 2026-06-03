import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TreePine, Users, Globe, Lock } from "lucide-react";
import {
  ToggleFamilyPublicButton,
  RemoveFamilyAdminButton,
  DeleteFamilyButton,
  RestoreFamilyButton,
} from "@/components/admin/family-admin-actions";

export default async function AdminFamiliesPage() {
  const [activeFamilies, deletedFamilies] = await Promise.all([
    db.family.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { persons: true } },
        adminAssignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, fullName: true, name: true, email: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.family.findMany({
      where: { deletedAt: { not: null } },
      include: { _count: { select: { persons: true } } },
      orderBy: { deletedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TreePine className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">
          إدارة العائلات ({activeFamilies.length})
        </h1>
      </div>

      {/* Active families */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base text-muted-foreground font-normal">عائلات نشطة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeFamilies.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4">لا توجد عائلات</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {activeFamilies.map((family) => (
                <li key={family.id} className="px-6 py-4 space-y-3">
                  {/* Row 1: name + stats + actions */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">عائلة {family.name}</p>
                      <Badge variant={family.isPublic ? "public" : "private"} className="text-xs">
                        {family.isPublic ? (
                          <><Globe className="h-2.5 w-2.5 ml-0.5" />عامة</>
                        ) : (
                          <><Lock className="h-2.5 w-2.5 ml-0.5" />خاصة</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {family._count.persons} فرد
                      </span>
                      <span className="text-border/60">|</span>
                      <ToggleFamilyPublicButton
                        familyId={family.id}
                        isPublic={family.isPublic}
                      />
                      <span className="text-border/60">|</span>
                      <DeleteFamilyButton familyId={family.id} />
                    </div>
                  </div>

                  {/* Row 2: admins */}
                  {family.adminAssignments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {family.adminAssignments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1 text-xs"
                        >
                          <span className="text-foreground/80">
                            {a.user.fullName ?? a.user.name ?? a.user.email ?? "—"}
                          </span>
                          <RemoveFamilyAdminButton assignmentId={a.id} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">لا يوجد مسؤولون</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deleted families */}
      {deletedFamilies.length > 0 && (
        <Card className="border-border/30 opacity-80">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-muted-foreground font-normal">عائلات محذوفة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/20">
              {deletedFamilies.map((family) => (
                <li
                  key={family.id}
                  className="px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-muted-foreground line-through">عائلة {family.name}</p>
                    <p className="text-xs text-muted-foreground/60">
                      {family._count.persons} فرد •{" "}
                      {family.deletedAt
                        ? `حُذفت: ${new Date(family.deletedAt).toLocaleDateString("ar")}`
                        : ""}
                    </p>
                  </div>
                  <RestoreFamilyButton familyId={family.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
