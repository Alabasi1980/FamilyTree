"use client";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  onClick?: (() => void) | undefined;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      dir="rtl"
      className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/50 px-4 py-2.5 text-sm backdrop-blur-sm overflow-x-auto"
      aria-label="تنقل المستوى"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 shrink-0">
          {i > 0 && (
            <span className="text-muted-foreground/40 select-none" aria-hidden>
              ‹
            </span>
          )}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                "font-medium transition-colors hover:text-accent",
                i === items.length - 1
                  ? "text-foreground cursor-default pointer-events-none"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
