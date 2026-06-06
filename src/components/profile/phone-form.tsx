"use client";

import { useState, useTransition } from "react";
import { updatePhone } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";

interface Props {
  initialPhone: string;
}

export function PhoneForm({ initialPhone }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePhone(phone);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          رقم الهاتف
        </label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+966 5X XXX XXXX"
          disabled={isPending}
          className="max-w-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button type="submit" variant="gold" size="sm" disabled={isPending}>
        {isPending ? (
          <><Loader2 className="h-3.5 w-3.5 ml-1.5 animate-spin" />جارٍ الحفظ...</>
        ) : saved ? (
          <><Check className="h-3.5 w-3.5 ml-1.5" />تم الحفظ</>
        ) : (
          "حفظ الهاتف"
        )}
      </Button>
    </form>
  );
}
