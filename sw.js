// Offline-cache. Hæv versionen, når filerne ændres.
const CACHE = 'stjernejagt-v28';
const IMGS = ['billeder/abacus.jpg', 'billeder/accordion.jpg', 'billeder/acropolis.jpg', 'billeder/alhambra.jpg', 'billeder/amalienborg.jpg', 'billeder/angkor.jpg', 'billeder/astrolabe.jpg', 'billeder/atomium.jpg', 'billeder/bagpipes.jpg', 'billeder/barometer.jpg', 'billeder/bigben.jpg', 'billeder/borobudur.jpg', 'billeder/brandenburg.jpg', 'billeder/cassette.jpg', 'billeder/charlesbridge.jpg', 'billeder/chichenitza.jpg', 'billeder/colosseum.jpg', 'billeder/cristo.jpg', 'billeder/didgeridoo.jpg', 'billeder/divinghelmet.jpg', 'billeder/egeskov.jpg', 'billeder/eiffel.jpg', 'billeder/enigma.jpg', 'billeder/forbiddencity.jpg', 'billeder/frederiksborg.jpg', 'billeder/fuji.jpg', 'billeder/giza.jpg', 'billeder/gramophone.jpg', 'billeder/grandcanyon.jpg', 'billeder/greatwall.jpg', 'billeder/hagiasophia.jpg', 'billeder/hammershus.jpg', 'billeder/harp.jpg', 'billeder/hollywood.jpg', 'billeder/hourglass.jpg', 'billeder/jelling.jpg', 'billeder/kinkakuji.jpg', 'billeder/liberty.jpg', 'billeder/machupicchu.jpg', 'billeder/magiclantern.jpg', 'billeder/matterhorn.jpg', 'billeder/metronome.jpg', 'billeder/moai.jpg', 'billeder/monsklint.jpg', 'billeder/montstmichel.jpg', 'billeder/neuschwanstein.jpg', 'billeder/niagara.jpg', 'billeder/notredame.jpg', 'billeder/nyhavn.jpg', 'billeder/pennyfarthing.jpg', 'billeder/petra.jpg', 'billeder/petronas.jpg', 'billeder/pisa.jpg', 'billeder/potala.jpg', 'billeder/quill.jpg', 'billeder/rockinghorse.jpg', 'billeder/rotaryphone.jpg', 'billeder/rushmore.jpg', 'billeder/sextant.jpg', 'billeder/sitar.jpg', 'billeder/sphinx.jpg', 'billeder/spinningwheel.jpg', 'billeder/stbasil.jpg', 'billeder/stethoscope.jpg', 'billeder/stonehenge.jpg', 'billeder/stpeters.jpg', 'billeder/sydneyopera.jpg', 'billeder/tajmahal.jpg', 'billeder/telegraphkey.jpg', 'billeder/theodolite.jpg', 'billeder/towerbridge.jpg', 'billeder/trevi.jpg', 'billeder/typewriter.jpg', 'billeder/uluru.jpg', 'billeder/victoriafalls.jpg'];
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'questions.js', 'questions_opentdb.js', 'themes/cykelsport.js', 'themes/besaettelsen.js', 'themes/politik.js', 'themes/koldkrig.js', 'themes/odense.js', 'themes/geografi.js', 'themes/klassisk.js', 'themes/it.js', 'kransen.js', 'kort/alm.js', 'kort/temaer.js', 'kort/flere.js', 'kort/lande-former.js', 'kort/lande.js', 'kort/billeder.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.concat(IMGS)))); self.skipWaiting(); });
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
