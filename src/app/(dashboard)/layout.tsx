import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { withBasePath } from "@/lib/base-path";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect(withBasePath("/login"));

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="container mx-auto px-4 py-6 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
