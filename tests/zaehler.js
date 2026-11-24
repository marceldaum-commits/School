// Anonyme Zählung (Fehler-Fix 24.11.2026): wohin schickt die App ihr „start“ und – nach einem Umzug – „umzug“?
// Erwartung je Adresse:
//   lernen-test.…/rechenblitz/  → POST an lernen-test.…/zaehler/v1/e (gleicher Origin, nie an trainer.…)
//   lernen.…/rechenblitz/       → POST an lernen.…/zaehler/v1/e
//   rechenblitz.… (alt, live)   → POST an trainer.…/zaehler/v1/e (Umzug dort aus, damit die App startet)
//   rechenblitz-test.… (alt)    → keine Zählung (nie an die Live-Stufe)
//   localhost                   → keine Zählung
//   Android-App (Capacitor)     → trainer.…/zaehler/v1/e
//   Zählung aus                 → gar nichts
//   Umzug rechenblitz-test → lernen-test: genau ein „umzug“ (ev) an lernen-test, ohne Merker; mit Zählung aus keiner
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/zaehler.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../kopfrechnen');
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', webmanifest: 'application/manifest+json', mp3: 'audio/mpeg' };
const SICH = 'https://trainer-test.mathenachhilfe-online.com/eltern/v1/s/';
const DATA = { v: 3, cur: 'p1', profiles: { p1: { name: 'Alt', emoji: '🦊', data: { total: 5 } } } };

async function run(name, { url, umzug = false, native = false, zaehlung = true, seed = null, store = null }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const posts = [], mem = store || new Map();
  const serve = async route => {
    const u = new URL(route.request().url());
    let p = u.pathname.replace(/^\/rechenblitz\//, '/').replace(/^\//, '');
    if (!p || p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
    let body = fs.readFileSync(f);
    if (p === 'config.js') body = Buffer.from(body.toString().replace(/umzug: (true|false)/, `umzug: ${umzug}`));
    route.fulfill({ status: 200, body, contentType: TYPES[p.split('.').pop()] || 'application/octet-stream' });
  };
  const hosts = [
    'https://rechenblitz.mathenachhilfe-online.com/', 'https://rechenblitz-test.mathenachhilfe-online.com/', 'https://lernen.mathenachhilfe-online.com/rechenblitz/', 'https://lernen-test.mathenachhilfe-online.com/rechenblitz/', 'https://localhost/'];
  for (const h of hosts) await ctx.route(h + '**', r => { const x = new URL(r.request().url()); x.pathname = x.pathname; return serve(r); });
  // Zähl-Ziele protokollieren (alle Stufen), antworten mit 204
  await ctx.route(/\/zaehler\/v1\/e$/, r => { posts.push({ url: r.request().url(), body: r.request().postData() }); r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } }); });
  // Sicherungs-Server für den Umzug
  await ctx.route(SICH + '**', async route => {
    const r = route.request(), id = r.url().slice(SICH.length), m = r.method();
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Schreib', 'Access-Control-Allow-Methods': 'GET, PUT, DELETE' };
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (m === 'PUT') { mem.set(id, { d: r.postData(), w: r.headers()['x-schreib'] }); return route.fulfill({ status: 204, headers: cors }); }
    if (m === 'GET') { const e = mem.get(id); return e ? route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ d: e.d }) }) : route.fulfill({ status: 404, headers: cors }); }
    if (m === 'DELETE') { mem.delete(id); return route.fulfill({ status: 204, headers: cors }); }
    route.fulfill({ status: 405, headers: cors });
  });
  await ctx.route(/^https:\/\/(?!rechenblitz\.|rechenblitz-test\.|lernen\.|lernen-test\.|trainer\.|trainer-test\.|localhost).*/, r => r.fulfill({ status: 204, body: '' }));
  await ctx.addInitScript(([seed, zaehlung, native]) => {
    window.__noWelcome = true;
    if (native) window.Capacitor = { isNativePlatform: () => true, Plugins: {} };
    if (seed && location.hostname.startsWith('rechenblitz-test') && !sessionStorage.getItem('seeded')) { localStorage.setItem('rechenblitz', JSON.stringify({ ...seed, zaehlung })); sessionStorage.setItem('seeded', '1'); }
    else if (!seed && !sessionStorage.getItem('seeded') && zaehlung === false && !location.hostname.startsWith('rechenblitz-test')) { localStorage.setItem('rechenblitz', JSON.stringify({ v: 3, cur: 'p1', profiles: { p1: { name: 'Ich', data: {} } }, zaehlung: false })); sessionStorage.setItem('seeded', '1'); }
  }, [seed, zaehlung, native]);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(5500);
  const href = p.url();
  await b.close();
  return { name, href, posts, errs, mem };
}
const ev = r => r.posts.map(x => { const j = JSON.parse(x.body); return `${new URL(x.url).host}:${j.ev || Object.keys(j.e || {}).join('+')}`; });

(async () => {
  const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); };
  const rows = [];
  const a = await run('lernen-test', { url: 'https://lernen-test.mathenachhilfe-online.com/rechenblitz/' }); rows.push(a);
  ok(ev(a).join() === 'lernen-test.mathenachhilfe-online.com:start', 'lernen-test: Ziel falsch ' + ev(a));
  const b2 = await run('lernen (live)', { url: 'https://lernen.mathenachhilfe-online.com/rechenblitz/' }); rows.push(b2);
  ok(ev(b2).join() === 'lernen.mathenachhilfe-online.com:start', 'lernen: Ziel falsch ' + ev(b2));
  const c = await run('alt live', { url: 'https://rechenblitz.mathenachhilfe-online.com/' }); rows.push(c);
  ok(ev(c).join() === 'trainer.mathenachhilfe-online.com:start', 'alt live: Ziel falsch ' + ev(c));
  const d = await run('alt test', { url: 'https://rechenblitz-test.mathenachhilfe-online.com/' }); rows.push(d);
  ok(!d.posts.length, 'alt test: zählt trotzdem ' + ev(d));
  const e = await run('localhost', { url: 'https://localhost/' }); rows.push(e);
  ok(!e.posts.length, 'localhost: zählt trotzdem ' + ev(e));
  const f = await run('APK', { url: 'https://localhost/', native: true }); rows.push(f);
  ok(ev(f).join() === 'trainer.mathenachhilfe-online.com:start', 'APK: muss live zählen ' + ev(f));
  const g = await run('Zählung aus', { url: 'https://lernen-test.mathenachhilfe-online.com/rechenblitz/', zaehlung: false }); rows.push(g);
  ok(!g.posts.length, 'Zählung aus: sendet trotzdem ' + ev(g));
  // Umzug alt test → lernen-test: ein „umzug“, nicht mehr
  const h = await run('Umzug (an)', { url: 'https://rechenblitz-test.mathenachhilfe-online.com/', umzug: true, seed: DATA }); rows.push(h);
  ok(h.href.startsWith('https://lernen-test.mathenachhilfe-online.com/rechenblitz/'), 'Umzug: nicht auf neuer Adresse ' + h.href);
  ok(ev(h).join() === 'lernen-test.mathenachhilfe-online.com:start,lernen-test.mathenachhilfe-online.com:umzug', 'Umzug: erwartet start + umzug an lernen-test, war ' + ev(h));
  ok(!h.posts.some(x => /trainer\./.test(x.url)), 'Umzug: Zählung an die Live-Stufe');
  ok(!/"ev":"umzug"[^}]*"(name|daten|profiles)"/.test(h.posts.map(x => x.body).join()), 'Umzug: Lernstand im Zählwert');
  const i = await run('Umzug (Zählung aus)', { url: 'https://rechenblitz-test.mathenachhilfe-online.com/', umzug: true, seed: DATA, zaehlung: false }); rows.push(i);
  ok(i.href.startsWith('https://lernen-test.mathenachhilfe-online.com/rechenblitz/') && !i.posts.length, 'Umzug mit Zählung aus: sendet trotzdem ' + ev(i));
  for (const r of rows) { console.log(`${r.name}: ${ev(r).join(' · ') || '–'} · Fehler ${r.errs.length}`); ok(!r.errs.length, r.name + ': Seitenfehler ' + r.errs.join('; ')); }
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Zählung ✓ (lernen-test, lernen, alt live, alt test, localhost, APK, aus, Umzug an/aus)');
})();
