// Zahlensprint (früher Rechenblitz) Service Worker: App läuft nach dem ersten Besuch auch offline.
// Cache-Name nach Pfad: unter /zahlensprint/ „zahlensprint-<Version>“, sonst (alter Pfad /rechenblitz/, Hosts rechenblitz[-test].…) „rechenblitz-<Version>“ –
// so räumt der Service Worker des einen Pfads nie die Caches des anderen auf (beide liegen auf demselben Origin lernen.…)
const VER = '3.34.0', PRE = /\/zahlensprint\/$/.test(self.registration.scope) ? 'zahlensprint' : 'rechenblitz', CACHE = PRE + '-' + VER;
const PUSH = 'rechenblitz-push', STIMME = 'rechenblitz-stimme';   // Erinnerungstext und offline geladene Vorlese-Sätze – bleiben bei Updates erhalten
const FILES = ['./', 'index.html', 'app.min.css', 'config.js', 'js/rechenblitz.min.js', 'js/lang-en.js', 'js/lang-uk.js', 'manifest.webmanifest', 'icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'fonts/Inter.woff2', 'fonts/SourceSerif4-italic.woff2', 'fonts/Caveat.woff2'];
// Beim Installieren alles frisch vom Server holen (nicht aus dem Browser-Speicher), dann sofort aktiv werden
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PRE + '-') && k !== CACHE && k !== PUSH && k !== STIMME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /\/api\//.test(url.pathname)) return;   // Server-Anfragen und fremde Adressen nie über den Cache
  if (url.search && req.mode !== 'navigate') return;   // Abfragen mit ?… (z. B. Versionsprüfung js/changelog.js?u=…) immer frisch vom Server
  // Schneller Start (Marcel 16.11.): App-Dateien sofort aus dem Speicher dieser Version, sonst Netz.
  // Neue Versionen kommen über einen neuen Service Worker (neuer Cache-Name) – die App lädt dann von selbst neu.
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then(c => c.match(key)).then(hit => hit || fetch(req).then(r => {
    if (r.ok && req.mode !== 'navigate') { const cp = r.clone(); caches.open(CACHE).then(x => x.put(req, cp)); }
    return r;
  })).catch(() => caches.open(CACHE).then(c => c.match('index.html'))));   // nur im eigenen Cache suchen (gemeinsame Adresse mit anderen Apps)
});

/* ---------- Erinnerung aufs Handy: Push ohne Inhalt, Text kommt aus der App ---------- */
const pushInfo = () => caches.open(PUSH).then(c => c.match('push-info')).then(r => r ? r.json() : {}).catch(() => ({}));
self.addEventListener('push', e => {
  e.waitUntil(pushInfo().then(i => self.registration.showNotification(i.title || 'Zahlensprint ⚡', {
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
