// Abschieds-Service-Worker für /rechenblitz/ (Umbenennung in Zahlensprint, 24.11.2026).
// Wird anstelle des bisherigen Service Workers unter /rechenblitz/sw.js ausgeliefert (Leitstand). Er
//  1. löscht die Zwischenspeicher der alten App (rechenblitz-<Version>; „rechenblitz-push“ und „rechenblitz-stimme“ bleiben, sie gehören auch Zahlensprint),
//  2. meldet sich selbst ab und
//  3. schickt offene Fenster nach /zahlensprint/ (gleicher Ursprung: der Lernstand im Browser bleibt erhalten, kein Umzug nötig).
// Er speichert nichts und holt nichts aus dem Netz.
const KEEP = ['rechenblitz-push', 'rechenblitz-stimme'];
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try { for (const k of await caches.keys()) if (/^rechenblitz-\d/.test(k) && !KEEP.includes(k)) await caches.delete(k); } catch {}
    try { await self.registration.unregister(); } catch {}
    try { for (const c of await self.clients.matchAll({ type: 'window' })) { const u = new URL(c.url); c.navigate(new URL('/zahlensprint/' + u.pathname.replace(/^\/rechenblitz\//, '') + u.search + u.hash, u.origin).href).catch(() => {}); } } catch {}
  })());
});
// kein fetch-Handler: alles geht ans Netz
