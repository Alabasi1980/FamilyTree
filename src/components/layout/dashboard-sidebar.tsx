"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  TreePine,
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/generated/prisma/client";

interface SidebarUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  accountType: AccountType;
}

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/families", label: "العائلات", icon: TreePine },
  { href: "/dashboard/requests", label: "الطلبات", icon: ClipboardList },
];

const adminNavItems = [
  { href: "/admin", label: "لوحة الإدارة", icon: Shield, exact: true },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/families", label: "كل العائلات", icon: TreePine },
];

export function DashboardSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-56 border-l border-border/40 bg-card/30 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 group">
          <TreePine className="h-5 w-5 text-accent" />
          <span className="font-semibold text-sm text-foreground">حديقة العائلات</span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-border/40">
        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">القائمة</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(item.href, item.exact)
                ? "bg-primary/20 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        {user.accountType === "SYSTEM_ADMIN" && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs text-muted-foreground px-2 font-medium">إدارة النظام</p>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-primary/20 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-border/40 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          الإعدادات
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </button>
      </div>
    </aside>
  );
}
