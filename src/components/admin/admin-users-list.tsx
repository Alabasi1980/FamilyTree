"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { ChangeUserRoleButton } from "@/components/admin/change-user-role-button";
import type { AccountType } from "@/generated/prisma/client";

const roleLabels = {
  SYSTEM_ADMIN: { label: "مدير النظام", variant: "gold" as const },
  MEMBER: { label: "عضو", variant: "member" as const },
  VISITOR: { label: "زائر", variant: "outline" as const },
};

interface UserItem {
  id: string;
  fullName: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  accountType: AccountType;
  createdAt: Date;
  familyAdminAssignments: { family: { name: string } }[];
}

export function AdminUsersList({ users }: { users: UserItem[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => {
        const name = (u.fullName ?? u.name ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        const phone = (u.phone ?? "").toLowerCase();
        const families = u.familyAdminAssignments.map((a) => a.family.name.toLowerCase()).join(" ");
        return name.includes(q) || email.includes(q) || phone.includes(q) || families.includes(q);
      })
    : users;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو العائلة..."
          className="h-9 w-full rounded-lg border border-border/60 bg-card/60 pr-8 pl-8 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            title="مسح البحث"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === users.length ? `مستخدم` : `من أصل ${users.length}`}
      </p>

      <ul className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden">
        {filtered.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-muted-foreground">لا نتائج مطابقة</li>
        ) : (
          filtered.map((user) => (
            <li key={user.id} className="px-6 py-3 bg-card/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {(user.fullName ?? user.name ?? user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.fullName ?? user.name ?? user.email ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email ?? user.phone ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <Badge variant={roleLabels[user.accountType].variant}>
                      {roleLabels[user.accountType].label}
                    </Badge>
                    {user.familyAdminAssignments.length > 0 && (
                      <Badge variant="admin">
                        مسؤول عائلة
                        {user.familyAdminAssignments.length > 1 ? ` (${user.familyAdminAssignments.length})` : ""}
                      </Badge>
                    )}
                  </div>
                  <ChangeUserRoleButton userId={user.id} currentRole={user.accountType} />
                </div>
              </div>
              {user.familyAdminAssignments.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  يدير: {user.familyAdminAssignments.map((a) => a.family.name).join("، ")}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
