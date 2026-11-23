// Bygger sw.js: filliste og cache-version beregnes automatisk ud fra filernes indhold.
// Kør efter enhver ændring:  node tools/byg-sw.js   (tools/tjek.js gør det også)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const files = ['index.html', 'style.css', 'manifest.webmanifest', ...scripts, 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
const imgs = fs.readdirSync(path.join(root, 'billeder')).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().map(f => 'billeder/' + f);
const h = crypto.createHash('sha1');
for (const f of files.concat(imgs)) h.update(f).update(fs.readFileSync(path.join(root, f)));
const version = h.digest('hex').slice(0, 10);
const js = `// Offline-cache. GENERERET af tools/byg-sw.js – ret ikke i hånden.
const CACHE = 'quizapp-${version}';
const FILES = ${JSON.stringify(['./'].concat(files))};
const IMGS = ${JSON.stringify(imgs)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.concat(IMGS)))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Netværk først (så opdateringer kommer med), cache som reserve uden internet.
// Kun gyldige svar (200 OK fra samme side) gemmes – en fejlside må aldrig overskrive en god fil.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r.ok ? r : caches.match(e.request, { ignoreSearch: true }).then(m => m || r);
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), js);
console.log(`sw.js: ${files.length + 1} filer, ${imgs.length} billeder, version ${version}`);
