/* New Climate — service worker.
 * Network-first strategy: always try the live network for the app shell so
 * updates ship immediately, and fall back to the cache when offline. Live
 * weather/air-quality API calls (cross-origin or /api/*) are never cached.
 */
const CACHE_NAME = 'new-climate-v1';
const SHELL = ['./', './index.html', './client.js', './style.css', './data.json', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never interfere with live data: cross-origin APIs or internal /api/* routes.
  const isApi = url.origin !== self.location.origin || url.pathname.includes('/api/');
  if (isApi) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache a copy of successful same-origin GET responses for offline use.
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
