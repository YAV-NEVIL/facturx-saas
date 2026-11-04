// FacturX PWA Service Worker — Mode Hors-Ligne & Cache Statique
const CACHE_NAME = "facturx-cache-v1";
const OFFLINE_URL = "/";

const STATIC_PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

// Installation : Mise en cache préalable de l'App Shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Avertissement pré-cache:", err);
      });
    })
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[SW] Suppression de l'ancien cache:", name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau (Fetch)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Laisser passer les requêtes Supabase Cloud et les méthodes autres que GET
  // (Le gestionnaire de file d'attente offlineSyncService s'occupe de la résilience API)
  if (event.request.method !== "GET" || url.hostname.includes("supabase.co")) {
    return;
  }

  // 2. Requêtes de navigation (HTML) : Réseau en priorité, avec repli immédiat sur le cache hors-ligne
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 3. Fichiers statiques Next.js, images, polices (Stale-While-Revalidate)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
