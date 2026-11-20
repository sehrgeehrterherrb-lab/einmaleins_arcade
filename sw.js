/* ==========================================================================
   EINMALEINS ARCADE - SERVICE WORKER (OFFLINE CACHE)
   Ermöglicht 100% Offline-Betrieb auf dem Tablet / Smartphone (auch bei Oma!)
   ========================================================================== */

const CACHE_NAME = '1x1-arcade-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './audio.js',
  './game.js',
  './qrcode.min.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Aus Cache liefern oder aus Netzwerk nachladen
      return response || fetch(event.request);
    }).catch(() => {
      // Offline-Fallback
      return caches.match('./index.html');
    })
  );
});
