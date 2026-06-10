"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  TreePine, LayoutDashboard, Users, ClipboardList,
  Settings, LogOut, Shield, Menu, X, Globe, Bell, AlertTriangle, MapPinned, ShieldAlert,
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

// ── Nav structure ─────────────────────────────────────────────────────────────

const primaryNav = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
];

const homelandNav = [
  { href: "/", label: "حديقة المواطن", icon: Globe, exact: true },
];

const familyNav = [
  { href: "/dashboard/families",     label: "عائلاتي",      icon: TreePine,    exact: false },
  { href: "/dashboard/requests",     label: "الطلبات",      icon: ClipboardList, exact: false },
  { href: "/dashboard/notifications",label: "التنبيهات",    icon: Bell,        exact: false },
  { href: "/dashboard/complaints",   label: "الشكاوى",      icon: AlertTriangle, exact: false },
  { href: "/dashboard/audit",        label: "تدقيق البيانات", icon: ShieldAlert, exact: false },
];

const adminNav = [
  { href: "/admin", label: "لوحة الإدارة", icon: Shield, exact: true },
  { href: "/admin/users", label: "المستخدمون", icon: Users, exact: false },
  { href: "/admin/families", label: "كل العائلات", icon: TreePine, exact: false },
  { href: "/admin/homelands", label: "إدارة المواطن", icon: MapPinned, exact: false },
  { href: "/admin/complaints", label: "الشكاوى", icon: AlertTriangle, exact: false },
  { href: "/admin/audit", label: "تدقيق البيانات", icon: ShieldAlert, exact: false },
];

// ── Shared nav link ──────────────────────────────────────────────────────────

function NavLink({
  href, label, icon: Icon, isActive, badgeCount, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  isActive: boolean; badgeCount?: number; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        isActive
          ? "bg-primary/20 text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {isActive && (
        <span className="absolute inset-y-1 right-0 w-0.5 rounded-full bg-accent" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-accent" : "group-hover:text-foreground/80")} />
      {label}
      {!!badgeCount && (
        <span className="mr-auto inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 pt-3 pb-1">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export function DashboardSidebar({ user, unreadNotifications = 0 }: { user: SidebarUser; unreadNotifications?: number }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card/95 text-foreground shadow-lg shadow-black/20 backdrop-blur md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <button
          type="button"
          onClick={close}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          aria-label="إغلاق القائمة"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh w-72 flex-col transition-transform duration-200",
          "border-l border-border/30 bg-card shadow-2xl shadow-black/40",
          "md:sticky md:top-0 md:z-auto md:h-screen md:w-56 md:translate-x-0 md:bg-card/20 md:shadow-none md:backdrop-blur-sm",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* خط علوي مضيء */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border/30">
          <Link href="/" onClick={close} className="group flex items-center gap-2.5">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-background/50">
              <TreePine className="h-3.5 w-3.5 text-accent" />
              <div className="absolute inset-0 rounded-lg bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm font-bold text-foreground">
              بستان <span className="text-accent">الأصول</span>
            </span>
          </Link>
          <button
            type="button" onClick={close}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hidden"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User chip */}
        <div className="px-3 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-2.5 rounded-lg bg-background/30 px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/25 text-xs font-bold text-accent border border-primary/20">
              {(user.name ?? user.email ?? "؟")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.name ?? user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.accountType === "SYSTEM_ADMIN" ? "مدير النظام" : "عضو"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5">

          {/* الرئيسية */}
          {primaryNav.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href, item.exact)} onClick={close} />
          ))}

          {/* المواطن */}
          <SectionLabel>المواطن</SectionLabel>
          {homelandNav.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href, item.exact)} onClick={close} />
          ))}

          {/* العائلات */}
          <SectionLabel>العائلات</SectionLabel>
          {familyNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              badgeCount={item.href === "/dashboard/notifications" ? unreadNotifications : undefined}
              isActive={isActive(item.href, item.exact)}
              onClick={close}
            />
          ))}

          {/* إدارة النظام */}
          {user.accountType === "SYSTEM_ADMIN" && (
            <>
              <SectionLabel>إدارة النظام</SectionLabel>
              {adminNav.map((item) => (
                <NavLink key={item.href} {...item} isActive={isActive(item.href, item.exact)} onClick={close} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/30 px-2.5 py-2 space-y-0.5">
          <Link
            href="/dashboard/settings"
            onClick={close}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Settings className="h-4 w-4" />
            الإعدادات
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: withBasePath("/") })}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>

        {/* خط سفلي */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </aside>
    </>
  );
}
