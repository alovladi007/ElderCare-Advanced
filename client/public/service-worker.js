/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'evergreen-care-v3';

// Only paths that actually exist at these URLs. The previous list included
// '/static/css/main.css' and '/static/js/main.js', which create-react-app never
// emits - it emits content-hashed names. cache.addAll() rejects atomically if
// any URL 404s, so install always failed and the worker never activated. In
// development those same requests fell through to the dev-server proxy and
// showed up as "Proxy error: Could not proxy request /static/js/main.js".
const PRECACHE_URLS = ['/', '/manifest.json', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // addAll is atomic; a single missing file would fail the whole install.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

/**
 * Never serve application data from cache.
 *
 * This app displays vital signs, medication schedules and emergency alerts. A
 * cached vitals response served to a caregiver is a patient-safety defect, not
 * a stale-content annoyance, so API traffic bypasses the worker entirely and
 * only content-hashed static assets are cached.
 */
function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/uploads/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only; never touch cross-origin or API traffic.
  if (url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  // Navigations go to the network first so a deploy is picked up immediately,
  // falling back to the cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r || Response.error())),
    );
    return;
  }

  // Static assets are content-hashed, so cache-first is safe for them.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});
