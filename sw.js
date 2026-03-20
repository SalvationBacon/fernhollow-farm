const CACHE_NAME = 'fernhollow-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

// Install — cache all core assets, activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clear old caches, take control of all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML (navigate requests): network-first so players always get updates,
//   fall back to cache only when offline
// - Everything else (icons, fonts): cache-first for speed
self.addEventListener('fetch', e => {
  const isNavigate = e.request.mode === 'navigate' ||
    e.request.url.endsWith('index.html') ||
    e.request.url.endsWith('/');

  if (isNavigate) {
    // Network-first for HTML — always get latest version
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Update cache with fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback — serve cached version
          return caches.match('./index.html');
        })
    );
  } else {
    // Cache-first for static assets (icons, fonts, manifest)
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok && e.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        });
      }).catch(() => caches.match('./index.html'))
    );
  }
});
