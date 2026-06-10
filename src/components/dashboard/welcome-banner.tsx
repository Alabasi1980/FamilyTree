"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TreePine, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

interface Props {
  userName: string;
}

export function WelcomeBanner({ userName }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setVisible(true);
      // Remove the param from URL without navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
        <TreePine className="h-4 w-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          أهلاً {userName}، مرحباً بك في بستان الأصول
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          ابدأ بإضافة عائلتك أو ابحث عن عائلة موجودة للانضمام إليها.
        </p>
        <Link
          href={withBasePath("/dashboard/families/new")}
          className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:underline font-medium"
        >
          إضافة عائلة الآن
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
