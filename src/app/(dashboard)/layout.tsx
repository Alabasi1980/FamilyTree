import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { withBasePath } from "@/lib/base-path";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { db } from "@/lib/db";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(withBasePath("/login"));

  const [unreadNotifications, user] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        phone: true,
        linkedPersonId: true,
        accounts: { select: { provider: true }, take: 1 },
      },
    }),
  ]);

  const isGoogleUser = user?.accounts.some((a) => a.provider === "google") ?? false;

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar user={session.user} unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="container mx-auto max-w-5xl px-4 pb-6 pt-16 md:py-6">
          <DashboardAlerts
            emailVerified={!!user?.emailVerified}
            hasPhone={!!user?.phone}
            linkedPersonId={user?.linkedPersonId ?? null}
            isGoogleUser={isGoogleUser}
          />
          {children}
        </div>
      </main>
    </div>
  );
}
