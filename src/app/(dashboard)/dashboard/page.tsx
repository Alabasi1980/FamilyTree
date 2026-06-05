import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TreePine, Users, ClipboardList, Plus, MapPin, ArrowLeft, Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatFamilyHomeland, getFamilyHomelandKey } from "@/lib/family-homeland";

async function getDashboardData(userId: string, isAdmin: boolean) {
  const familyWhere = isAdmin
    ? { deletedAt: null }
    : { deletedAt: null, adminAssignments: { some: { userId, isActive: true } } };

  const [managedFamiliesCount, totalPersons, pendingRequests, families] = await Promise.all([
    isAdmin
      ? db.family.count({ where: { deletedAt: null } })
      : db.familyAdminAssignment.count({ where: { userId, isActive: true } }),
    isAdmin
      ? db.person.count({ where: { deletedAt: null } })
      : db.person.count({ where: { deletedAt: null, family: { adminAssignments: { some: { userId, isActive: true } } } } }),
    isAdmin
      ? db.adminRequest.count({ where: { status: "PENDING" } })
      : db.editRequest.count({ where: { submittedByUserId: userId, status: "PENDING" } }),
    db.family.findMany({
      where: familyWhere,
      include: { _count: { select: { persons: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  // تجميع العائلات حسب الموطن
  const homelandMap = new Map<string, typeof families>();
  families.forEach((f) => {
    const key = getFamilyHomelandKey(f);
    const label = formatFamilyHomeland(f) || "موطن غير محدد";
    const mapKey = `${key}||${label}`;
    homelandMap.set(mapKey, [...(homelandMap.get(mapKey) ?? []), f]);
  });

  const homelandGroups = Array.from(homelandMap.entries())
    .map(([mapKey, fams]) => {
      const [key, label] = mapKey.split("||");
      return { key, label, families: fams, totalMembers: fams.reduce((s, f) => s + f._count.persons, 0) };
    })
    .sort((a, b) => b.families.length - a.families.length);

  return { managedFamiliesCount, totalPersons, pendingRequests, families, homelandGroups };
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const isSystemAdmin = user.accountType === "SYSTEM_ADMIN";
  const { managedFamiliesCount, totalPersons, pendingRequests, families, homelandGroups } =
    await getDashboardData(user.id, isSystemAdmin);

  const firstName = (user.name ?? user.email ?? "").split(" ")[0];

  const stats = [
    {
      value: managedFamiliesCount,
      label: isSystemAdmin ? "عائلة في النظام" : "عائلة تديرها",
      icon: TreePine,
      color: "text-primary",
      bg: "bg-primary/15",
      href: "/dashboard/families",
    },
    {
      value: totalPersons,
      label: isSystemAdmin ? "فرد مسجّل" : "فرد في عائلاتك",
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/12",
      href: "/dashboard/families",
    },
    {
      value: pendingRequests,
      label: "طلب بانتظار المراجعة",
      icon: ClipboardList,
      color: pendingRequests > 0 ? "text-amber-400" : "text-muted-foreground",
      bg: pendingRequests > 0 ? "bg-amber-900/25" : "bg-muted/20",
      href: "/dashboard/requests",
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Sprout className="h-3 w-3 text-accent/70" />
            {isSystemAdmin ? "مدير النظام" : "لوحة التحكم"}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            مرحباً، <span className="text-accent">{firstName}</span>
          </h1>
        </div>
        <Button variant="gold" size="sm" asChild>
          <Link href="/dashboard/families/new">
            <Plus className="h-4 w-4 ml-1" />
            {isSystemAdmin ? "إنشاء عائلة" : "طلب إضافة عائلة"}
          </Link>
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-5 hover:border-border/70 hover:bg-card/80 transition-all duration-200"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-xl p-2 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-accent/60 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* ── مواطن العائلات ── */}
      {homelandGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent/70" />
              مواطن العائلات
            </h2>
            <span className="text-xs text-muted-foreground">{homelandGroups.length} موطن</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {homelandGroups.map((group) => (
              <div
                key={group.key}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 hover:border-accent/30 hover:bg-card/70 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-accent">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{group.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.families.length} {group.families.length === 1 ? "عائلة" : "عائلات"} · {group.totalMembers} فرد
                  </p>
                </div>
                <div className="flex -space-x-1 shrink-0">
                  {group.families.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-primary/30 text-[9px] font-bold text-accent"
                    >
                      {f.name[0]}
                    </div>
                  ))}
                  {group.families.length > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted/50 text-[9px] text-muted-foreground">
                      +{group.families.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── العائلات الأخيرة ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TreePine className="h-4 w-4 text-accent/70" />
            العائلات الأخيرة
          </h2>
          <Link href="/dashboard/families" className="text-xs text-accent hover:underline flex items-center gap-1">
            عرض الكل <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        {families.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 px-6 py-10 text-center">
            <TreePine className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد عائلات بعد</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/families/new">ابدأ بإضافة عائلة</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {families.slice(0, 6).map((family) => {
              const homeland = formatFamilyHomeland(family);
              return (
                <Link
                  key={family.id}
                  href={`/dashboard/families/${family.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 hover:border-primary/40 hover:bg-card/80 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-base font-bold text-accent border border-primary/20">
                    {family.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {family.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Users className="h-3 w-3" />
                      {family._count.persons} فرد
                      {homeland && (
                        <>
                          <span className="opacity-40">·</span>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{homeland}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent/60 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
