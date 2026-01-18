// Service Worker for Static Tools PWA
const CACHE_NAME = 'static-tools-v4';

// Files to cache on install
const PRECACHE_URLS = [
  '/tools/',
  '/tools/index.html',
  '/tools/manifest.json',
  '/tools/ant/index.html',
  '/tools/browser/index.htm',
  '/tools/sleeptimer/index.html',
  '/tools/torch/index.html'
];

// Install event - cache core assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function() {
        // Activate immediately without waiting
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name !== CACHE_NAME;
            })
            .map(function(name) {
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', function(event) {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (like Pico CSS from CDN)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // For HTML pages: network first, fallback to cache
  // This ensures pull-to-refresh gets fresh content
  if (request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          // Clone and cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(request, responseClone);
            });
          return response;
        })
        .catch(function() {
          // Network failed, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // For other assets: cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then(function(response) {
            // Cache the new resource
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(request, responseClone);
              });
            return response;
          });
      })
  );
});

// Listen for messages to update cache
self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
