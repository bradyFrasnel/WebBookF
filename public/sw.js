const STATIC_CACHE = "webbook-static-v10";
const API_CACHE = "webbook-api-v10";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/iconeWebBook.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Laisse le navigateur charger directement les ressources externes (favicons Google, icônes distantes, etc.)
  const isSameOrigin = url.origin === self.location.origin;
  const isBackendApi = url.pathname.startsWith("/api/") && !isSameOrigin;

  if (!isSameOrigin && !isBackendApi) {
    return;
  }

  if (isBackendApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Ne jamais intercepter les routes serverless internes /api/* du même domaine
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((res) => res || caches.match("/index.html"))
      )
  );
});
