import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { PublicSearchForm } from "@/components/search/public-search-form";

const brandIcon = withBasePath("/icons/icon-192x192.png");

const labels = {
  brand: "\u0628\u0633\u062a\u0627\u0646 \u0627\u0644\u0623\u0635\u0648\u0644",
  dashboard: "\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645",
  admin: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629",
  logout: "\u062e\u0631\u0648\u062c",
  login: "\u062f\u062e\u0648\u0644",
  register: "\u062a\u0633\u062c\u064a\u0644",
  menu: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
};

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="h-8 w-8 rounded-full border border-accent/30 bg-cover bg-center shadow-sm shadow-black/30"
            style={{ backgroundImage: `url(${brandIcon})` }}
            aria-hidden="true"
          />
          <span className="font-semibold text-foreground">{labels.brand}</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-8">
          <PublicSearchForm />
        </div>

        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">{labels.dashboard}</Link>
              </Button>
              {session.user.accountType === "SYSTEM_ADMIN" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">{labels.admin}</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/signout">{labels.logout}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{labels.login}</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link href="/register">{labels.register}</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={labels.menu}>
            <Menu className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
