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

  // Never intercept: non-GET, Server Actions, API routes, Next.js internals
  if (
    event.request.method !== "GET" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    event.request.headers.get("next-action") !== null
  ) {
    return;
  }

  // Network-first for all other requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
