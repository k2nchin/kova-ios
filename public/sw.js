// Kova service worker — offline shell for the installed PWA.
// Strategy: network-first for navigations, cache-first for immutable static
// assets, and full passthrough for API, updater binaries and downloads.
// Bump CACHE_VERSION on every release so stale shells never linger.

const CACHE_VERSION = 'kova-v1.0.13';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SHELL_URL = '/index.html';

// Requests that must always hit the network (fresh data & signed binaries).
const NEVER_CACHE = [/^\/api\//, /^\/updates\//, /^\/downloads\//, /^\/invite\//];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([SHELL_URL, '/manifest.webmanifest', '/kova-chrome-cube.png', '/pwa-192.png', '/pwa-512.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((pattern) => pattern.test(url.pathname))) return;

  // Navigations: network first, offline fallback to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL))
    );
    return;
  }

  // Immutable build assets & PWA icons: cache first.
  const isStaticAsset = url.pathname.startsWith('/assets/') || /^\/(pwa-192|pwa-512|kova-chrome-cube)\.png$/.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
