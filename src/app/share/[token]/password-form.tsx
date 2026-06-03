"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyShareLinkPassword } from "@/lib/actions/share";
import { Lock } from "lucide-react";

export default function SharePasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) return;
    startTransition(async () => {
      const res = await verifyShareLinkPassword(token, password);
      if (!res.success) setError(res.error ?? "حدث خطأ");
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">رابط محمي</h1>
          <p className="text-sm text-muted-foreground">
            أدخل كلمة المرور للوصول إلى شجرة العائلة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "جارٍ التحقق…" : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
