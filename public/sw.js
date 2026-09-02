// Bump this version to invalidate the cached app shell on next load.
// Keep in sync with SW_CACHE_NAME in src/app/lib/constants.ts
// (sw.js is served raw and cannot import the TypeScript module).
const CACHE_NAME = "egx-v4";
const SHELL_ASSETS = ["/", "/icons/egx-logo-192.png", "/icons/egx-logo-512.png"];

// Endpoints served STALE-WHILE-REVALIDATE rather than network-first.
//
// Only the dashboard snapshot qualifies, and the reason is specific to it: it
// is a whole-universe read of a table the nightly cron writes, so a cached copy
// is at worst one refresh behind and is never wrong about anything the reader
// is about to act on. Painting it immediately means returning to the grid is
// never a blank screen waiting on a round trip.
//
// Nothing else belongs here. Portfolio, sales and settings are things the user
// CHANGES, and showing a stale copy of those first would let an edit appear not
// to have taken. Those stay network-first.
const SWR_PATHS = ["/api/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Network-first for API calls and navigation.
  // INVARIANT: all backend routes must keep the "/api/" path prefix
  // so this substring match works against cross-origin URLs like
  // https://backend.example.com/api/analysis. If the prefix ever changes,
  // update this check to match on the backend origin instead.
  if (request.url.includes("/api/") || request.mode === "navigate") {
    const revalidate = fetch(request)
      .then((response) => {
        // Only cache what we could serve back. Caching a 401 or a 500 would
        // leave the worker replaying an error page offline.
        if (response && response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => undefined);

    if (
      request.method === "GET" &&
      SWR_PATHS.some((p) => request.url.includes(p))
    ) {
      // Stale-while-revalidate: answer from cache NOW and refresh behind it.
      // The network copy still lands in the cache for next time, and the page
      // itself re-requests on its own schedule, so nothing goes unrefreshed.
      event.respondWith(
        caches.match(request).then(
          (cached) =>
            cached ||
            revalidate.then(
              (r) => r || Response.error()
            )
        )
      );
      return;
    }

    // Everything else: network-first, cache only as an offline fallback.
    event.respondWith(revalidate.then((r) => r || caches.match(request)));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
