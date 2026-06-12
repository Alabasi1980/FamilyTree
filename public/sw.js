// Conservative service worker:
// - never caches mutations, API routes, auth/admin/dashboard pages, or Server Actions
// - caches public navigations and static assets after successful network responses
// - returns a small offline fallback when no cached public page exists

const CACHE_VERSION = "v1";
const STATIC_CACHE = `families-tree-static-${CACHE_VERSION}`;
const PAGE_CACHE = `families-tree-pages-${CACHE_VERSION}`;

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

const OFFLINE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>غير متصل</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #07130f; color: #f3fbf7; }
    main { width: min(92vw, 420px); text-align: center; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p { color: #b6c7bf; line-height: 1.8; margin: 0; }
  </style>
</head>
<body>
  <main>
    <h1>لا يوجد اتصال حاليًا</h1>
    <p>يمكنك عرض الصفحات العامة التي فتحتها سابقًا عند توفر نسخة محفوظة.</p>
  </main>
</body>
</html>`;

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
          keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathname = stripScope(url.pathname);

  // Never intercept: non-GET, Server Actions, API routes, auth/private routes
  if (
    event.request.method !== "GET" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signout") ||
    pathname.startsWith("/share/") ||
    event.request.headers.get("next-action") !== null
  ) {
    return;
  }

  if (pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for public pages, with runtime caching for offline revisit.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok && response.type === "basic") {
          caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return new Response(OFFLINE_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response("", { status: 504, statusText: "Offline" });
      })
  );
});
