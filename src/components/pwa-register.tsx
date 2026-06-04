"use client";

import { useEffect } from "react";
import { appBasePathScope, withBasePath } from "@/lib/base-path";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(withBasePath("/sw.js"), { scope: appBasePathScope })
        .catch(() => {});
    }
  }, []);
  return null;
}
