// Bump VERSION whenever any cached file changes so clients pick up the new copy.
const VERSION = 'v2';
const FILES = ['./', 'index.html', 'quotes.json', 'manifest.json', 'icon.svg', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first, so the clock works offline; refresh the cache in the background when online.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(event.request, { ignoreSearch: true }).then(cached => {
        const network = fetch(event.request)
          .then(response => { if (response.ok) cache.put(event.request, response.clone()); return response; })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
