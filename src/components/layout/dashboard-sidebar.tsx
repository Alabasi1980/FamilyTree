"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  TreePine,
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
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
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card/95 text-foreground shadow-lg shadow-black/20 backdrop-blur md:hidden"
        aria-label="فتح القائمة"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          aria-label="إغلاق القائمة"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh w-72 flex-col border-l border-border/40 bg-card shadow-2xl shadow-black/30 transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-56 md:translate-x-0 md:bg-card/30 md:shadow-none",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border/40">
        <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 group">
          <TreePine className="h-5 w-5 text-accent" />
          <span className="font-semibold text-sm text-foreground">بستان الأصول</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4" />
        </button>
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
            onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          الإعدادات
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: withBasePath("/") })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </button>
      </div>
      </aside>
    </>
  );
}
