const CACHE_NAME = 'zambiacash-v4'; // Bumped version to force update

// ONLY cache local files here to ensure the Service Worker installs successfully
const ASSETS_TO_CACHE = [
  './',
  './index.html'
  // ONLY uncomment the line below if you are 100% sure the file is named exactly "icon.png" and is in the same folder
  // './icon.png' 
];

// 1. Install & Cache the App Shell
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate & Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Intercept Requests
self.addEventListener('fetch', (e) => {
  // Never cache API calls (Supabase / Palpluss)
  if (e.request.url.includes('supabase.co') || e.request.url.includes('palpluss')) {
    return; 
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Dynamically cache external assets (Tailwind, Fonts, Images) as they load
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If user refreshes a page, fallback to cached index.html
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
