import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { TreePine, Search } from "lucide-react";

const labels = {
  brand: "بستان الأصول",
  brandSub: "الأصول",
  dashboard: "لوحة التحكم",
  admin: "الإدارة",
  logout: "خروج",
  login: "دخول",
  register: "انضم",
  search: "بحث",
};

export async function Navbar({ minimal = false }: { minimal?: boolean } = {}) {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* خط مضيء علوي */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4">

          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-accent/15 blur-sm group-hover:bg-accent/25 transition-all duration-300" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-background/60">
                <TreePine className="h-4 w-4 text-accent" />
              </div>
            </div>
            <span className="font-bold text-sm text-foreground leading-none">
              بستان{" "}
              <span className="text-accent">الأصول</span>
            </span>
          </Link>

          {/* Nav actions */}
          <nav className="flex items-center gap-1.5 shrink-0">
            {!minimal && (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 gap-1.5" asChild>
                <Link href="/search">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{labels.search}</span>
                </Link>
              </Button>
            )}
            {session?.user ? (
              <>
                {!minimal && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8" asChild>
                    <Link href="/dashboard">{labels.dashboard}</Link>
                  </Button>
                )}
                {!minimal && session.user.accountType === "SYSTEM_ADMIN" && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8" asChild>
                    <Link href="/admin">{labels.admin}</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-xs h-8 border-border/50 hover:border-border" asChild>
                  <Link href="/signout">{labels.logout}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8" asChild>
                  <Link href="/login">{labels.login}</Link>
                </Button>
                {!minimal && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 hover:border-accent/50 transition-all duration-200"
                    asChild
                  >
                    <Link href="/register">{labels.register}</Link>
                  </Button>
                )}
              </>
            )}
          </nav>

        </div>
      </div>

      {/* خط سفلي خفي */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </header>
  );
}
