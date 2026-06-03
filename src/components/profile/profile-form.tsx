"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";

interface Props {
  initialFullName: string;
}

export function ProfileForm({ initialFullName }: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile({ fullName });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          الاسم الكامل
        </label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="أدخل اسمك الكامل"
          disabled={isPending}
          className="max-w-sm"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <Button type="submit" variant="gold" size="sm" disabled={isPending || !fullName.trim()}>
        {isPending ? (
          <><Loader2 className="h-3.5 w-3.5 ml-1.5 animate-spin" />جارٍ الحفظ...</>
        ) : saved ? (
          <><Check className="h-3.5 w-3.5 ml-1.5" />تم الحفظ</>
        ) : (
          "حفظ التغييرات"
        )}
      </Button>
    </form>
  );
}
