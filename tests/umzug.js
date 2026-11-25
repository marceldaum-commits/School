// Rechenblitz – Umzug auf lernen(-test).mathenachhilfe-online.com/rechenblitz/ (19.11.2026)
// Spielt alte und neue Adresse im Browser nach (Playwright leitet beide Hosts auf die lokalen Dateien um)
// und ersetzt den Sicherungs-Server trainer-test …/eltern/v1/s/ durch einen Speicher im Test.
// Fälle: Umzug gelingt · offline (PUT scheitert) · neue Adresse hat schon Daten · Hash mit #pro= und ?thema= ·
//        Schalter aus · installierte App · ohne eigene Daten. Aufruf: node tests/umzug.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../kopfrechnen');
const OLD = 'https://rechenblitz-test.mathenachhilfe-online.com/', NEW = 'https://lernen-test.mathenachhilfe-online.com/rechenblitz/', NEW2 = 'https://lernen-test.mathenachhilfe-online.com/zahlensprint/';
const API = 'https://trainer-test.mathenachhilfe-online.com/eltern/v1/s/';
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', webmanifest: 'application/manifest+json', mp3: 'audio/mpeg' };
const OLD_DATA = { v: 3, cur: 'p1', profiles: { p1: { name: 'Alt', emoji: '🦊', data: { total: 123, sel: { op: 'mul', lvl: 1 } } } }, pro: { code: 'TESTCODE' } };

async function run(name, { zs = false, umzug = true, putFail = false, newDown = false, newWrong = false, newHas = null, oldHas = OLD_DATA, url = OLD, standalone = false }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const store = new Map(), log = [];
  const serve = base => async route => {
    let p = new URL(route.request().url()).pathname.replace(base === NEW ? /^\/rechenblitz\// : base === NEW2 ? /^\/zahlensprint\// : /^\//, '');
    if (!p || p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
    let body = fs.readFileSync(f);
    if (p === 'config.js') body = Buffer.from(body.toString().replace(/umzug: (true|false)/, `umzug: ${umzug}`));
    route.fulfill({ status: 200, body, contentType: TYPES[p.split('.').pop()] || 'application/octet-stream' });
  };
  await ctx.route(OLD + '**', serve(OLD));
  await ctx.route(NEW2 + '**', zs ? serve(NEW2) : r => r.fulfill({ status: 404, contentType: 'text/html', body: 'Not found' }));
  await ctx.route(NEW + '**', newDown ? r => r.abort('namenotresolved') : newWrong ? r => r.fulfill({ status: 404, contentType: 'text/html', body: 'Not found' }) : serve(NEW));
  await ctx.route(API + '**', async route => {
    const r = route.request(), id = r.url().slice(API.length), m = r.method();
    log.push(m);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Schreib', 'Access-Control-Allow-Methods': 'GET, PUT, DELETE' };
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (m === 'PUT') { if (putFail) return route.abort('internetdisconnected'); store.set(id, { d: r.postData(), w: r.headers()['x-schreib'] }); return route.fulfill({ status: 204, headers: cors }); }
    if (m === 'GET') { const e = store.get(id); return e ? route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ d: e.d }) }) : route.fulfill({ status: 404, headers: cors }); }
    if (m === 'DELETE') { const e = store.get(id); if (!e) return route.fulfill({ status: 404, headers: cors }); if (e.w !== r.headers()['x-schreib']) return route.fulfill({ status: 403, headers: cors }); store.delete(id); return route.fulfill({ status: 204, headers: cors }); }
    route.fulfill({ status: 405, headers: cors });
  });
  await ctx.route(/^https:\/\/(?!rechenblitz-test\.|lernen-test\.|trainer-test\.).*/, r => r.fulfill({ status: 204, body: '' }));   // keine fremden Abrufe
  await ctx.addInitScript(([oldHas, newHas, standalone]) => {
    window.__noWelcome = true;
    const h = location.hostname, seed = h.startsWith('rechenblitz-test') ? oldHas : h.startsWith('lernen-test') ? newHas : null;
    if (seed && !sessionStorage.getItem('seeded')) { localStorage.setItem('rechenblitz', JSON.stringify(seed)); sessionStorage.setItem('seeded', '1'); }
    if (standalone) { const mm = window.matchMedia; window.matchMedia = q => q.includes('standalone') ? { matches: true, addEventListener() {}, addListener() {} } : mm.call(window, q); }
  }, [oldHas, newHas, standalone]);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(3500);
  const r = await p.evaluate(() => ({
    href: location.href, data: localStorage.getItem('rechenblitz'),
    boot: document.getElementById('boot') ? document.getElementById('boot').innerText : '',
    toast: [...document.querySelectorAll('.toast, #toast')].map(t => t.innerText).join(' | '),
    sel: typeof S === 'object' && S && S.sel ? S.sel.op : null,
  }));
  await b.close();
  return { name, ...r, server: [...store.keys()].length, log, errs };
}

(async () => {
  const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); };
  const r1 = await run('Umzug gelingt', {});
  ok(r1.href.startsWith(NEW) && !r1.href.includes('umzug='), 'gelingt: nicht auf neuer Adresse oder umzug= noch in der Adresse');
  ok(r1.data && JSON.parse(r1.data).profiles.p1.data.total === 123, 'gelingt: Lernstand nicht übernommen');
  ok(r1.server === 0 && r1.log.join(',') === 'PUT,GET,DELETE', 'gelingt: Sicherung nicht gelöscht (' + r1.log + ')');
  ok(/umgezogen/.test(r1.toast), 'gelingt: kein Hinweis „umgezogen“');
  const r2 = await run('offline', { putFail: true });
  ok(r2.href.startsWith(OLD) && r2.data && JSON.parse(r2.data).profiles.p1.data.total === 123 && !r2.boot.includes('umgezogen'), 'offline: nicht auf alter Adresse geblieben bzw. Daten weg');
  const NEWD = { v: 3, cur: 'p1', profiles: { p1: { name: 'Neu', data: { total: 7 } } } };
  const r3 = await run('neue Adresse hat schon Daten', { newHas: NEWD });
  ok(r3.href.startsWith(NEW) && JSON.parse(r3.data).profiles.p1.name === 'Neu' && r3.server === 0, 'schon Daten: überschrieben oder Sicherung nicht gelöscht');
  const r4 = await run('Hash mit #pro= und ?thema=', { url: OLD + '?thema=lgs&stufe=2#pro=ABC123' });
  ok(r4.href.startsWith(NEW) && !r4.href.includes('umzug=') && !r4.href.includes('pro=') && r4.sel === 'lgs', 'pro/thema: Angaben nicht erhalten oder nicht verarbeitet (' + r4.href + ', ' + r4.sel + ')');
  const r5 = await run('Schalter aus', { umzug: false });
  ok(r5.href.startsWith(OLD) && r5.log.length === 0, 'Schalter aus: trotzdem umgezogen');
  const r6 = await run('installierte App', { standalone: true });
  ok(r6.href.startsWith(OLD) && /umgezogen/.test(r6.boot) && r6.server === 1, 'installiert: kein Hinweis „neu installieren“');
  const r8 = await run('neue Adresse nicht erreichbar', { newDown: true });
  ok(r8.href.startsWith(OLD) && r8.log.length === 0 && r8.data && JSON.parse(r8.data).profiles.p1.data.total === 123, 'nicht erreichbar: trotzdem hochgeladen oder weitergeleitet');
  const r9 = await run('neue Adresse liefert nicht Rechenblitz (404)', { newWrong: true });
  ok(r9.href.startsWith(OLD) && r9.log.length === 0, '404: trotzdem hochgeladen oder weitergeleitet');
  const r10 = await run('Ziel /zahlensprint/ läuft', { zs: true });
  ok(r10.href.startsWith(NEW2) && !r10.href.includes('umzug=') && r10.data && JSON.parse(r10.data).profiles.p1.data.total === 123 && r10.log.join(',') === 'PUT,GET,DELETE', 'zahlensprint: nicht auf /zahlensprint/ gelandet oder Daten fehlen (' + r10.href + ', ' + r10.log + ')');
  const r11 = await run('/zahlensprint/ fehlt → /rechenblitz/', { zs: false });
  ok(r11.href.startsWith(NEW) && r11.data && JSON.parse(r11.data).profiles.p1.data.total === 123, 'Rückfall auf /rechenblitz/ fehlgeschlagen (' + r11.href + ')');
  const r7 = await run('ohne eigene Daten', { oldHas: null });
  ok(r7.href.startsWith(NEW) && r7.log.length === 0, 'ohne Daten: nicht direkt weitergeleitet');
  for (const r of [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11]) { console.log(`${r.name}: ${r.href.replace(/https:\/\//, '')} · Server ${r.log.join(',') || '–'} · Fehler ${r.errs.length}`); ok(!r.errs.length, r.name + ': Seitenfehler ' + r.errs.join('; ')); }
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Umzug ✓ (gelingt, offline, schon Daten, #pro=/?thema=, Schalter aus, installiert, ohne Daten, neue Adresse nicht erreichbar, neue Adresse liefert 404)');
})();
