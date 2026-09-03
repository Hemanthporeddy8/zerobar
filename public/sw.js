// Zerobar — Offline-first Service Worker with Predictive Pre-caching
// v5: Caches app shell routes and critical assets on install so the entire
// app works offline from the very first visit. Content stories are stored
// in IndexedDB/localStorage stash.

const CACHE_NAME = 'zerobar-cache-v5';

// App shell: all routes and critical assets pre-cached immediately on install
const PRECACHE_URLS = [
  '/',
  '/library',
  '/profile',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: pre-cache all app shell routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: purge older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first for navigation & dynamic pages, falling back to cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Do not cache third-party or Supabase API traffic
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
