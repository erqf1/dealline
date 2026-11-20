/* Dealline offline: eigene Dateien und die gemeinsamen Stylesheets zwischenspeichern.
   Erst aus dem Netz holen (immer aktuell), ohne Netz aus dem Speicher. */
const CACHE = 'dealline-1.0.0';
const FILES = ['./', 'index.html', 'deal.css', 'deal.js', 'icon.svg', 'icon-192.png', 'icon-512.png', 'app.webmanifest',
  '/app-icons/acryl.css', '/app-icons/mobile.css'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('dealline-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
