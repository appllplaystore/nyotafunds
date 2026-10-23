const CACHE_NAME = 'zambiacash-v5';
const ASSETS = ['./icon.png', './manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Never intercept POST/DELETE or API calls
  if (req.method !== 'GET') return;
  if (url.origin.includes('supabase.co') || url.origin.includes('palpluss.com')) return;

  // Never cache HTML - always fetch fresh from server
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname === '') {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // For static assets, try network first, fallback to cache
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
