// public/service-worker.js
const CACHE_VERSION = "v5"; // <-- Incrémente à chaque nouvelle version
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  // Tu peux pré-cacher quelques assets vraiment statiques si tu veux.
  // "/favicon.ico",
  // "/icons/icon-192.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isHTMLorAPIorJSON(req) {
  const url = new URL(req.url);
  const isHTML =
    req.destination === "document" || req.headers.get("accept")?.includes("text/html");
  const isAPI = url.pathname.startsWith("/api");
  const isJSON = url.pathname.endsWith(".json");
  return isHTML || isAPI || isJSON;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Réseau d'abord pour HTML / API / JSON -> tu vois la dernière version quand tu publies
  if (isHTMLorAPIorJSON(req)) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Cache-first pour le reste (images, fonts, etc.)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const clone = resp.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
        return resp;
      });
    })
  );
});
