cd /var/www/bustanalosool/repo
mkdir -p src/lib src/app src/components public
cat > src/lib/base-path.ts <<'EOF'
export function normalizeBasePath(value?: string | null) {
  if (!value) return "";

  let normalized = value.trim();
  if (!normalized || normalized === "/") return "";

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}

export const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const appBasePathScope = appBasePath ? `${appBasePath}/` : "/";

export function withBasePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return appBasePath || "/";
  }

  return `${appBasePath}${normalizedPath}`;
}
EOF
cat > next.config.ts <<'EOF'
import type { NextConfig } from "next";
import { appBasePath } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  ...(appBasePath ? { basePath: appBasePath } : {}),
};

export default nextConfig;
EOF
cat > src/app/layout.tsx <<'EOF'
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { PWARegister } from "@/components/pwa-register";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حديقة العائلات",
  description: "منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها",
  keywords: ["شجرة العائلة", "نسب", "عائلة", "أنساب"],
  manifest: withBasePath("/manifest.webmanifest"),
};

export const viewport: Viewport = {
  themeColor: "#0f1a14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn(ibmPlexArabic.variable, "h-full")}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
EOF
cat > src/app/manifest.ts <<'EOF'
import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "حديقة العائلات",
    short_name: "حديقة العائلات",
    description: "منصة لتسجيل وعرض أشجار العائلات وربطها ببعضها",
    start_url: withBasePath("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1a14",
    theme_color: "#0f1a14",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: withBasePath("/icons/icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/maskable-icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icons/icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
EOF
cat > src/components/pwa-register.tsx <<'EOF'
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
EOF
cat > src/lib/auth.config.ts <<'EOF'
import type { NextAuthConfig } from "next-auth";
import { appBasePath, withBasePath } from "@/lib/base-path";

function stripBasePath(pathname: string) {
  if (!appBasePath) return pathname;
  if (pathname === appBasePath) return "/";
  return pathname.startsWith(`${appBasePath}/`) ? pathname.slice(appBasePath.length) : pathname;
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: withBasePath("/login"),
    error: withBasePath("/login"),
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSystemAdmin = auth?.user?.accountType === "SYSTEM_ADMIN";
      const pathname = stripBasePath(nextUrl.pathname);

      if (pathname.startsWith("/admin")) {
        return isSystemAdmin;
      }
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = (user as { accountType?: string }).accountType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as import("@/generated/prisma/client").AccountType;
      }
      return session;
    },
  },
  providers: [],
};
EOF
cat > public/sw.js <<'EOF'
// Minimal network-first service worker.
// Satisfies Chrome's PWA installability check while keeping
// Server Actions, NextAuth, and API routes fully functional.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `families-tree-static-${CACHE_VERSION}`;

const scopePath = (() => {
  const pathname = new URL(self.registration.scope).pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
})();

function withScope(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${scopePath}${normalizedPath}`;
}

function stripScope(pathname) {
  if (!scopePath) return pathname;
  if (pathname === scopePath) return "/";
  return pathname.startsWith(`${scopePath}/`) ? pathname.slice(scopePath.length) : pathname;
}

const PRECACHE_URLS = [
  withScope("/icons/icon-192x192.png"),
  withScope("/icons/icon-512x512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathname = stripScope(url.pathname);

  if (
    event.request.method !== "GET" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    event.request.headers.get("next-action") !== null
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
EOF
printf 'batch1 ok\n'
