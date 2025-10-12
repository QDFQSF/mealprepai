// =======================
// Service Worker MealPrepAI
// =======================

const CACHE_NAME = "mealprep-cache-v1";
const OFFLINE_URLS = ["/"];

// Installation du service worker et mise en cache initiale
self.addEventListener("install", (event) => {
  console.log("📦 Installation du service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Mise en cache initiale :", OFFLINE_URLS);
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  console.log("✨ Service worker activé !");
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  // Ne pas gérer les appels vers des API externes
  if (event.request.url.startsWith("http") === false) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourne la réponse en cache ou fait une requête réseau
      return (
        response ||
        fetch(event.request).then((fetchRes) => {
          // Met à jour le cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});
