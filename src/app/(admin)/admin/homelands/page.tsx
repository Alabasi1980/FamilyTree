import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomelandPlaceRequestActions } from "@/components/admin/homeland-place-request-actions";
import { HomelandsManager, type PlaceData } from "@/components/admin/homelands-manager";
import { Globe, MapPin, MapPinned, Building2, Users, AlertTriangle } from "lucide-react";
import { formatFamilyHomeland } from "@/lib/family-homeland";

const requestStatusBadge = {
  APPROVED: { variant: "public" as const, label: "معتمد" },
  REJECTED: { variant: "private" as const, label: "مرفوض" },
  PENDING: { variant: "outline" as const, label: "قيد المراجعة" },
};

export default async function AdminHomelandsPage() {
  const [places, pendingRequests, recentRequests, unlinkedFamilies] = await Promise.all([
    db.homelandPlace.findMany({
      include: {
        _count: { select: { families: true, children: true } },
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    db.homelandPlaceRequest.findMany({
      where: { status: "PENDING" },
      include: { submittedBy: { select: { fullName: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    db.homelandPlaceRequest.findMany({
      where: { status: { not: "PENDING" } },
      include: {
        submittedBy: { select: { fullName: true, name: true, email: true } },
        approvedPlace: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.family.findMany({
      where: {
        deletedAt: null,
        homelandPlaceId: null,
        OR: [
          { homelandCountry: { not: null } },
          { homelandRegion: { not: null } },
          { homelandCity: { not: null } },
        ],
      },
      select: { id: true, name: true, homelandCountry: true, homelandRegion: true, homelandCity: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const countries = places.filter((p) => p.type === "COUNTRY");
  const regionCount = places.filter((p) => p.type === "REGION").length;
  const cityCount = places.filter((p) => p.type === "CITY").length;
  const totalFamilies = places.reduce((sum, p) => sum + p._count.families, 0);

  const placeData: PlaceData[] = places.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    parentId: p.parentId,
    aliases: p.aliases,
    sortOrder: p.sortOrder,
    familyCount: p._count.families,
    childCount: p._count.children,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-accent/80">
            <MapPinned className="h-3.5 w-3.5" />
            <span className="uppercase tracking-widest">أطلس المواطن العائلية</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">إدارة المواطن</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف وعدّل وأدر الدول والمناطق والمدن المتاحة لاختيار موطن العائلة.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatCard value={countries.length} label="دولة" icon={<Globe className="h-3.5 w-3.5" />} />
          <StatCard value={regionCount} label="منطقة" icon={<MapPin className="h-3.5 w-3.5" />} />
          <StatCard value={cityCount} label="مدينة" icon={<Building2 className="h-3.5 w-3.5" />} />
          <StatCard value={totalFamilies} label="عائلة مرتبطة" icon={<Users className="h-3.5 w-3.5" />} accent />
        </div>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-amber-400" />
              طلبات إضافة مواطن جديدة
              <Badge className="mr-auto bg-amber-900/40 text-amber-300 border-amber-700/40 text-xs">
                {pendingRequests.length} معلق
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/30">
              {pendingRequests.map((req) => (
                <li key={req.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[req.countryName, req.regionName, req.cityName].filter(Boolean).map((part, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground/40">←</span>}
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium
                            ${i === 0 ? "bg-blue-900/20 text-blue-300" :
                              i === 1 ? "bg-green-900/20 text-green-300" :
                                "bg-purple-900/20 text-purple-300"}`}>
                            {part}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        من: {req.submittedBy.fullName ?? req.submittedBy.name ?? req.submittedBy.email ?? "—"}
                      </span>
                      <span>{new Date(req.createdAt).toLocaleDateString("ar")}</span>
                    </div>
                    {req.note && (
                      <p className="text-xs text-muted-foreground/70 italic">&quot;{req.note}&quot;</p>
                    )}
                  </div>
                  <HomelandPlaceRequestActions requestId={req.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Interactive tree */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            شجرة المواطن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HomelandsManager places={placeData} />
        </CardContent>
      </Card>

      {/* Unlinked families */}
      {unlinkedFamilies.length > 0 && (
        <Card className="border-amber-700/30 bg-amber-950/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              عائلات بموطن نصي غير مرتبط بالأطلس ({unlinkedFamilies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/30">
              {unlinkedFamilies.map((family) => (
                <li key={family.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <span className="text-sm font-medium text-foreground">عائلة {family.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFamilyHomeland(family)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent reviewed requests */}
      {recentRequests.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              آخر الطلبات المراجعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/30">
              {recentRequests.map((req) => (
                <li key={req.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                  <span className="text-muted-foreground">
                    {[req.countryName, req.regionName, req.cityName].filter(Boolean).join(" ← ")}
                    {req.approvedPlace && (
                      <span className="mr-2 text-accent/70">→ {req.approvedPlace.name}</span>
                    )}
                  </span>
                  <Badge
                    variant={requestStatusBadge[req.status].variant}
                    className="text-xs shrink-0"
                  >
                    {requestStatusBadge[req.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  value, label, icon, accent,
}: {
  value: number; label: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-center
      ${accent ? "border-accent/20 bg-accent/5" : "border-border/40 bg-card/60"}`}>
      <div className={`flex justify-center mb-1 ${accent ? "text-accent/70" : "text-muted-foreground/50"}`}>
        {icon}
      </div>
      <p className={`text-xl font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
