const CACHE_NAME = 'thawankibox-v1.0'; // Nouveau nom pour forcer la mise à jour
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/privacy.html',
  // JS/CSS injectés dynamiquement par Vite → seront cachés à la volée
];

// Installation
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// Activation - Supprime les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch - Cache First, fallback offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache).catch(() => {}));

        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') return caches.match('/index.html');
      });
    })
  );
});
