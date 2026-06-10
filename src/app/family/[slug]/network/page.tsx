import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { FamilyNetworkClient } from "./family-network-client";
import { getFamilyNetwork, type ViewerContext } from "@/lib/network/get-family-network";
import { formatFamilyHomeland } from "@/lib/family-homeland";
import { withBasePath } from "@/lib/base-path";
import { ArrowRight, Network } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ families?: string; expand?: string }>;
}

export default async function FamilyNetworkPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const { families: familiesParam, expand: expandParam } = await searchParams;
  const slug = decodeURIComponent(rawSlug);

  const session = await auth();
  const userId  = session?.user?.id ?? null;
  const isSystemAdmin = session?.user?.accountType === "SYSTEM_ADMIN";
  const isLoggedIn = !!userId;

  // Load root family
  const family = await db.family.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, slug: true, isPublic: true, originSummary: true,
              homelandCountry: true, homelandRegion: true, homelandCity: true },
  });

  if (!family) notFound();
  if (!family.isPublic && !isLoggedIn) {
    const path = withBasePath(`/family/${encodeURIComponent(slug)}/network`);
    redirect(withBasePath(`/login?callbackUrl=${encodeURIComponent(path)}`));
  }

  // Viewer context
  const adminFamilyIds = new Set<string>();
  if (!isSystemAdmin && userId) {
    const assignments = await db.familyAdminAssignment.findMany({
      where: { userId, isActive: true }, select: { familyId: true },
    });
    assignments.forEach((a) => adminFamilyIds.add(a.familyId));
  }
  const isFamilyAdmin = isSystemAdmin || adminFamilyIds.has(family.id);
  const viewer: ViewerContext = { userId, isSystemAdmin, adminFamilyIds };

  // Parse URL params
  const selectedFamilyIds = familiesParam ? familiesParam.split(",").filter(Boolean) : undefined;
  const expandFamilyIds   = expandParam    ? expandParam.split(",").filter(Boolean)   : undefined;

  // Fetch network data
  const network = await getFamilyNetwork(family.id, { selectedFamilyIds, expandFamilyIds }, viewer);

  if (network.families.length === 0) notFound();

  const homeland = formatFamilyHomeland(family);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header bar */}
      <div className="relative border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(145_35%_22%/0.12),transparent)]" />

        <div className="container relative mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/family/${encodeURIComponent(slug)}`}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-accent shrink-0" />
                  <h1 className="text-base font-bold text-foreground truncate">
                    شبكة عائلة <span className="text-accent">{family.name}</span>
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {network.families.length} عائلة · {network.persons.length} فرد
                  {homeland && ` · ${homeland}`}
                  {network.truncated && " · (الحد الأقصى للعرض)"}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 bg-[hsl(145_40%_38%)] rounded" />
                <span>نسب أبوي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed border-[hsl(338_65%_62%)]" />
                <span>زواج</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed border-[hsl(45_90%_55%)]" />
                <span>مصاهرة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed border-[hsl(210_70%_55%)]" />
                <span>نسب عائلي</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network canvas */}
      <div className="flex-1 relative tree-viewport">
        <FamilyNetworkClient
          network={network}
          canManage={isFamilyAdmin}
          familySlug={slug}
          currentExpandIds={expandFamilyIds ?? []}
        />
      </div>
    </div>
  );
}
