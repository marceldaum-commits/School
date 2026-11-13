// Rechenblitz Service Worker: App läuft nach dem ersten Besuch auch offline.
const CACHE = 'rechenblitz-3.4.0';
const FILES = ['./', 'index.html', 'app.css', 'config.js', 'js/engine.js', 'js/app.js', 'js/panels.js', 'js/i18n.js', 'js/lang-en.js', 'js/lang-uk.js', 'js/extras.js', 'js/vendor/qrcode.js', 'manifest.webmanifest', 'icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/apple-touch-icon.png', 'fonts/Inter.woff2', 'fonts/SourceSerif4-italic.woff2', 'fonts/Caveat.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rechenblitz-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;   // Server-Anfragen nie über den Cache   // Meldungen (POST) und fremde Adressen nie cachen
  const fresh = req.mode === 'navigate' || /\.(js|css)$/.test(url.pathname);
  if (fresh) {   // Seite & Konfiguration: erst Netz, sonst Cache
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
