// Cufy Native PWA Ultra-Fast Cache Service Worker
const CACHE_NAME = 'cufy-cache-v3';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
  '/photos/cufylogo.jpg',
  '/photos/front1.jpg',
  '/photos/front2.jpg',
  '/photos/front3.jpg',
  '/photos/couple1.jpg',
  '/photos/couple2.jpg',
  '/photos/couple3.jpg',
  '/photos/haikei2 (1).png',
  '/photos/haikei2 (2).png',
  '/photos/haikei2 (3).png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-First strategy for images & static assets for 0ms instant loading
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Instant Cache-First for photos & static assets
  if (url.pathname.startsWith('/photos/') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML / routes
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
