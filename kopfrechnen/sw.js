// Rechenblitz Service Worker: App läuft nach dem ersten Besuch auch offline.
const CACHE = 'rechenblitz-3.7.0';
const PUSH = 'rechenblitz-push';   // Text der Erinnerung (legt die App ab) – bleibt bei Updates erhalten
const FILES = ['./', 'index.html', 'app.css', 'config.js', 'js/native.js', 'js/changelog.js', 'js/engine.js', 'js/app.js', 'js/panels.js', 'js/i18n.js', 'js/lang-en.js', 'js/lang-uk.js', 'js/extras.js', 'js/reminder.js', 'js/memory.js', 'js/merkvis.js', 'js/vendor/qrcode.js', 'manifest.webmanifest', 'icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'fonts/Inter.woff2', 'fonts/SourceSerif4-italic.woff2', 'fonts/Caveat.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rechenblitz-') && k !== CACHE && k !== PUSH).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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

/* ---------- Erinnerung aufs Handy: Push ohne Inhalt, Text kommt aus der App ---------- */
const pushInfo = () => caches.open(PUSH).then(c => c.match('push-info')).then(r => r ? r.json() : {}).catch(() => ({}));
self.addEventListener('push', e => {
  e.waitUntil(pushInfo().then(i => self.registration.showNotification(i.title || 'Rechenblitz ⚡', {
    body: i.body || 'Zeit für 3 Minuten Kopfrechnen! Dein Gehirn freut sich.',
    icon: 'icons/icon-192.png', tag: 'rechenblitz-erinnerung', renotify: false, data: { url: './' } })));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => new URL(x.url).pathname.startsWith(new URL('./', self.registration.scope).pathname));
    return c ? c.focus() : self.clients.openWindow('./');
  }));
});
// Erneuert der Browser die Anmeldung, die neue Adresse mit derselben Uhrzeit beim Server eintragen
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(pushInfo().then(async i => {
    if (!i.api) return;
    const old = e.oldSubscription, sub = e.newSubscription || (old && await self.registration.pushManager.subscribe(old.options));
    if (old) await fetch(i.api + '/aus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: old.endpoint }) }).catch(() => {});
    if (sub) await fetch(i.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ abo: sub.toJSON(), zeit: i.zeit || '17:00' }) });
  }).catch(() => {}));
});
