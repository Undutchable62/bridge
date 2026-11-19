/* Offline-ondersteuning voor De Hollandse Bridgetafel.
   Het spel en config.js worden eerst via internet opgehaald (zodat updates direct
   doorkomen) en vallen terug op de bewaarde versie als je offline bent. */
const VERSIE = 'hbt-4';
const BESTANDEN = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Firebase e.d. altijd rechtstreeks
  const eerstNet = req.mode === 'navigate' || /\/(index\.html|config\.js)?$/.test(url.pathname) || url.pathname.endsWith('config.js');
  if (eerstNet) {
    e.respondWith(fetch(req).then(res => {
      if (res && res.ok) { const kopie = res.clone(); caches.open(VERSIE).then(c => c.put(req, kopie)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});
