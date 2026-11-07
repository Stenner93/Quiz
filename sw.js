// Offline-cache. Hæv versionen, når filerne ændres.
const CACHE = 'stjernejagt-v20';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'questions.js', 'questions_opentdb.js', 'themes/cykelsport.js', 'themes/besaettelsen.js', 'themes/politik.js', 'themes/koldkrig.js', 'themes/odense.js', 'themes/geografi.js', 'themes/klassisk.js', 'themes/it.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Netværk først (så opdateringer kommer med), cache som reserve uden internet.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
