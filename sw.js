const CACHE_NAME = 'zambiacash-v3'; // Bumped version to force browser to drop old cache
const ASSETS = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forces the new SW to take over immediately without waiting
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key); // Clean up old caches
      }));
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 1. DO NOT CACHE POST/PUT/DELETE requests (like STK push)
  if (req.method !== 'GET') {
    return; 
  }

  // 2. DO NOT CACHE API calls (Supabase database or Palpluss API)
  if (url.origin.includes('supabase.co') || url.origin.includes('palpluss.com')) {
    return; 
  }

  // 3. For static assets (HTML, images, manifest), use Network-First
  // (Always try to get the latest version from the internet, fallback to cache if offline)
  e.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
