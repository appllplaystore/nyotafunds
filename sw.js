const CACHE_NAME = 'nyota-v4'; // <--- CHANGED TO v4 TO FORCE NEW IMAGES TO LOAD
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png',
  './icon-192.png' // Added this just in case
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
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          return caches.match('./index.html', { ignoreSearch: true });
        })
    );
    return;
  }

  // 2. Handle Static Assets (images, manifest, etc.)
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
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
