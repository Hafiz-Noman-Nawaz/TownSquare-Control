// TownSquare Control Service Worker
// Security-First Policy: Sensitive incident, financial, and user data is NEVER cached.

const CACHE_NAME = "townsquare-static-v1";
const STATIC_ASSETS = [
  "/offline",
  "/manifest.json",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass all sensitive API, Supabase, photo, and authenticated routes
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/incidents") ||
    url.pathname.startsWith("/contractor") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.includes("supabase.co") ||
    url.pathname.includes("storage/v1")
  ) {
    // Strictly network-only, do not intercept or cache
    return;
  }

  // 2. Network-first strategy with offline fallback for static navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline") || Response.error();
      })
    );
    return;
  }

  // 3. Cache-first for explicitly static public assets only (icons, manifest)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
