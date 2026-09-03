const CACHE_NAME = 'ashfoods-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/ash-logo.jpg',
  './assets/icons/ash-logo.svg',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/views.css',
  './css/responsive.css',
  './js/data.js',
  './js/state.js',
  './js/geo.js',
  './js/search.js',
  './js/cart.js',
  './js/auth.js',
  './js/orders.js',
  './js/ui.js',
  './js/chatbot.js',
  './js/router.js',
  './js/app.js',
  './data/restaurants.json',
  './data/coupons.json',
  './data/faq.json'
];

// Install: Cache new assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Remove all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK-FIRST strategy to guarantee fresh changes on live reload
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update cache with fresh response
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

