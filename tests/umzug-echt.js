// Rechenblitz – echter Umzug auf der Test-Stufe: rechenblitz-test.… → lernen-test.…/rechenblitz/ (19.11.2026)
// Legt auf der alten Test-Adresse einen erkennbaren Lernstand an, lädt neu, folgt der Weiterleitung und prüft auf der neuen
// Adresse: Lernstand da, „umzug=“ aus der Adresse, Umzugs-Sicherung auf trainer-test gelöscht (GET → 404).
// Aufruf: node tests/umzug-echt.js   (braucht Netz; nutzt nur die Test-Stufe)
const { chromium } = require('playwright');
const OLD = 'https://rechenblitz-test.mathenachhilfe-online.com/', NEW = 'https://lernen-test.mathenachhilfe-online.com/rechenblitz/';
const API = 'https://trainer-test.mathenachhilfe-online.com/eltern/v1/s/';
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const p = await ctx.newPage(), errs = [], calls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { if (r.url().startsWith(API)) calls.push(r.method() + ' ' + r.url().slice(API.length)); });
  await p.addInitScript(() => { window.__noWelcome = true; });
  // 1) Alte Adresse: erst ohne Umzug starten lassen ist nicht möglich (Schalter an) – deshalb Lernstand vor dem Laden setzen
  await p.goto(OLD + 'favicon-32.png').catch(() => {});                 // Ursprung öffnen, ohne die App zu starten
  const marke = 'Umzugstest-' + Date.now();
  await p.evaluate(m => localStorage.setItem('rechenblitz', JSON.stringify({ v: 3, cur: 'p1', profiles: { p1: { name: m, emoji: '🦊', data: { total: 321 } } } })), marke);
  await p.goto(OLD + '?thema=lgs&stufe=1#pro=FALSCH');
  await p.waitForURL(u => u.href.startsWith(NEW), { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(5000);
  const r = await p.evaluate(() => ({ href: location.href, data: localStorage.getItem('rechenblitz'), toast: [...document.querySelectorAll('.toast')].map(t => t.innerText).join(' | '), sel: typeof S === 'object' && S ? S.sel.op : null, v: typeof APP_VERSION === 'string' ? APP_VERSION : null }));
  const del = calls.find(c => c.startsWith('DELETE')), put = calls.find(c => c.startsWith('PUT'));
  const id = put ? put.split(' ')[1] : null;
  const gone = id ? (await fetch(API + id)).status : null;   // nach dem Umzug muss die Sicherung weg sein
  await b.close();
  const ok = r.href.startsWith(NEW) && !r.href.includes('umzug=') && r.data && r.data.includes(marke) && !!put && !!del && gone === 404 && !errs.length;
  console.log(JSON.stringify({ ok, ...r, data: r.data && r.data.includes(marke) ? 'Lernstand da (' + marke + ')' : r.data, calls: calls.map(c => c.replace(/ (\S{6})\S+/, ' $1…')), sicherungDanach: gone, errs }, null, 1));
  process.exit(ok ? 0 : 1);
})();
