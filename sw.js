const CACHE_NAME = 'zambiacash-v3'; // Bumped version
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap'
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
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Intercept Requests (The Magic)
self.addEventListener('fetch', (e) => {
  // Never cache API calls (Supabase / Palpluss)
  if (e.request.url.includes('supabase.co') || e.request.url.includes('palpluss')) {
    return; 
  }

  e.respondWith(
    fetch(e.request)
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // CRITICAL FIX: If the user refreshes ANY page, serve the cached index.html
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
