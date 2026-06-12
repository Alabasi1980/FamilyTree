"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { TreePine, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/lib/base-path";

export default function SignOutPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await signOut({ callbackUrl: withBasePath("/") });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <LogOut className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">تسجيل الخروج</h1>
          <p className="text-muted-foreground text-sm mt-2">
            هل أنت متأكد من رغبتك في تسجيل الخروج؟
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            className="w-full gap-2"
            variant="destructive"
            onClick={handleSignOut}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            العودة للرئيسية
          </Button>
        </div>

        {/* Brand */}
        <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
          <TreePine className="h-4 w-4 text-accent" />
          <span className="text-xs">بستان الأصول</span>
        </div>
      </div>
    </div>
  );
}
