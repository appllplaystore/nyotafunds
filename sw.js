const CACHE_NAME = 'nyota-v2'; // <--- BUMPED VERSION
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png'
  // Add your CSS/JS assets here if they are separate files
];

// Install: Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // Activate new SW immediately
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // Take control of open pages immediately
});

// Fetch: Network-First for navigation, Cache-First for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Handle Navigation (HTML page loads)
  // This covers your intent landing (/?_pwa=1) and direct loads.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Network worked: cache the fresh copy and return it
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // Network failed (offline): serve the cached shell
          // We ignore search params for the fallback so ?_pwa=1 still matches cache
          return caches.match('./index.html', { ignoreSearch: true });
        })
    );
    return;
  }

  // 2. Handle Static Assets (images, manifest, etc.)
  // Cache-First is fine for these.
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Don't cache non-successful responses or cross-origin stuff
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
