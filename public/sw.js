const CACHE_NAME = 'emeieks-v1';
const IMAGE_CACHE = 'emeieks-images-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Helper: est-ce une URL d'image ?
function isImageUrl(url) {
  return /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|$)/i.test(url.pathname) ||
         url.hostname.includes('supabase.co') && url.pathname.includes('/storage/');
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── Images : cache permanent sur disque ──────────────────────────────────
  if (e.request.destination === 'image' || isImageUrl(url)) {
    e.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached; // instantané depuis le disque

          // Pas en cache → fetch + stocker
          return fetch(e.request, { mode: 'no-cors' }).then(res => {
            // Stocker même les réponses opaque (mode no-cors)
            if (res.status === 0 || res.ok) {
              cache.put(e.request, res.clone());
            }
            return res;
          }).catch(() => cached || new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  // ── Assets statiques (JS, CSS, HTML) : cache first ──────────────────────
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
          return cached || fetchPromise;
        })
      )
    );
  }
});
