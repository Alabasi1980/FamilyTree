import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Search, TreePine, Menu } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <TreePine className="h-5 w-5 text-accent group-hover:text-accent/80 transition-colors" />
          <span className="font-semibold text-foreground">بستان الأصول</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-8">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="ابحث عن عائلة أو شخص..."
              className="w-full h-8 rounded-md border border-input bg-muted/40 pr-9 pl-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Actions */}
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">لوحة التحكم</Link>
              </Button>
              {session.user.accountType === "SYSTEM_ADMIN" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">الإدارة</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/signout">خروج</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">دخول</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link href="/register">تسجيل</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
