// Abschied von /rechenblitz/ (Umbenennung, 24.11.2026): Weiterleitung nach /zahlensprint/ mit Abfrage und Hash, Lernstand bleibt (gleicher Ursprung),
// Abschieds-Service-Worker räumt rechenblitz-<Version> auf, behält push/stimme, meldet sich ab und schickt Fenster weiter.
// Aufruf: node tests/abschied.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '../kopfrechnen'), AB = path.join(__dirname, '../abschied');
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', webmanifest: 'application/manifest+json', woff2: 'font/woff2' };
const H = 'https://lernen-test.mathenachhilfe-online.com';
(async () => {
  const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
  // 1) Seite: /rechenblitz/ liefert die Abschiedsseite, /zahlensprint/ die App
  const b = await chromium.launch(), ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const send = (route, base, p) => { const f = path.join(base, p || 'index.html'); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' }); route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: TYPES[f.split('.').pop()] || 'application/octet-stream' }); };
  await ctx.route(H + '/rechenblitz/**', r => { const p = new URL(r.request().url()).pathname.replace(/^\/rechenblitz\//, ''); send(r, AB, p === '' || p.endsWith('/') ? 'index.html' : p); });
  await ctx.route(H + '/zahlensprint/**', r => { const p = new URL(r.request().url()).pathname.replace(/^\/zahlensprint\//, ''); send(r, ROOT, p === '' || p.endsWith('/') ? 'index.html' : p); });
  await ctx.route(/^https:\/\/(?!lernen-test\.)/, r => r.fulfill({ status: 204, body: '' }));
  await ctx.addInitScript(() => { window.__noWelcome = true; if (location.pathname.startsWith('/rechenblitz/') && !sessionStorage.getItem('s')) { localStorage.setItem('rechenblitz', JSON.stringify({ v: 3, cur: 'p1', profiles: { p1: { id: 'p1', name: 'Alt', emoji: '🦊', data: { total: 321 } } } })); sessionStorage.setItem('s', '1'); } });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(H + '/rechenblitz/?thema=lgs&stufe=2#pro=ABC123'); await p.waitForTimeout(4500);
  const r = await p.evaluate(() => ({ href: location.href, total: (() => { try { return JSON.parse(localStorage.getItem('rechenblitz')).profiles.p1.data.total; } catch { return null; } })(), name: typeof APP_VERSION === 'string' ? document.title : '', op: typeof S === 'object' && S.sel ? S.sel.op : null }));
  ok(r.href.startsWith(H + '/zahlensprint/'), 'Weiterleitung nicht nach /zahlensprint/: ' + r.href);
  ok(r.op === 'lgs', 'Abfrage ?thema=lgs wurde nicht übernommen (op=' + r.op + ')');   // die App liest ?thema= und räumt die Adresse selbst auf
  ok(r.total === 321, 'Lernstand nicht erhalten: ' + r.total);
  ok(/Zahlensprint/.test(r.name), 'App unter /zahlensprint/ nicht gestartet: ' + r.name);
  ok(!errs.length, 'Seitenfehler: ' + errs.join('; '));
  await b.close();
  // 2) Service Worker (ohne Browser nachgebaut)
  const deleted = [], navs = [], caches = ['rechenblitz-3.28.3', 'rechenblitz-push', 'rechenblitz-stimme', 'zahlensprint-3.31.0', 'andere'];
  let unregistered = false, activate = null;
  const self = { skipWaiting() {}, addEventListener: (t, f) => { if (t === 'activate') activate = f; }, registration: { unregister: async () => { unregistered = true; } },
    clients: { matchAll: async () => [{ url: H + '/rechenblitz/index.html?thema=lgs#x', navigate: async u => { navs.push(u); } }] } };
  vm.runInNewContext(fs.readFileSync(path.join(AB, 'sw.js'), 'utf8'), { self, caches: { keys: async () => caches, delete: async k => { deleted.push(k); } }, URL, Promise });
  let wait; activate({ waitUntil: p => { wait = p; } }); await wait;
  ok(deleted.join() === 'rechenblitz-3.28.3', 'SW löscht falsche Caches: ' + deleted);
  ok(unregistered, 'SW meldet sich nicht ab');
  ok(navs.join() === H + '/zahlensprint/index.html?thema=lgs#x', 'SW schickt Fenster nicht richtig weiter: ' + navs);
  // 3) Service Worker der App: Cache-Name und Aufräumen nach Pfad (/zahlensprint/ räumt nie rechenblitz-*, der alte Pfad nie zahlensprint-*)
  for (const [scope, own, expectDel] of [[H + '/zahlensprint/', 'zahlensprint-', ['zahlensprint-3.0.0']], [H + '/rechenblitz/', 'rechenblitz-', ['rechenblitz-3.0.0']]]) {
    const del = [], names = ['rechenblitz-3.0.0', 'zahlensprint-3.0.0', 'rechenblitz-push', 'rechenblitz-stimme']; let act = null, cacheName = null;
    const sw = { addEventListener: (t, f) => { if (t === 'activate') act = f; }, registration: { scope }, clients: { claim: async () => {} }, skipWaiting() {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), { self: sw, location: { origin: H }, URL, Promise, caches: { keys: async () => names, delete: async k => { del.push(k); } , open: async () => ({}) } });
    names.push(own + require('../kopfrechnen/stand.json').version);
    let w; act({ waitUntil: p => { w = p; } }); await w;
    ok(del.join() === expectDel.join(), `SW-Aufräumen bei ${scope}: gelöscht ${del} statt ${expectDel}`);
  }
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Abschied ✓ (Weiterleitung mit Abfrage/Hash, Lernstand bleibt, Service Worker räumt auf, meldet sich ab, schickt weiter)');
})();
