// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/eltern-kopplung.js   (echter Test-Server trainer-test, über curl)
// Rundlauf Eltern-Handy koppeln gegen trainer-test: App koppelt → PUT, Abruf + Entschlüsseln, fremdes schreib → 403, Entkoppeln → DELETE → weg
const { chromium } = require('playwright'); const { execFileSync } = require('child_process'); const crypto = require('crypto');
const ORIGIN = 'https://rechenblitz-test.mathenachhilfe-online.com';
const curl = (args) => { const out = execFileSync('curl', ['-s', '-H', 'Origin: ' + ORIGIN, '-w', '\n%{http_code}', ...args], { encoding: 'utf8' }); const i = out.lastIndexOf('\n'); return { body: out.slice(0, i), status: +out.slice(i + 1) }; };
const unb64u = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
(async () => { const R = {}; const b = await chromium.launch(); const ctx = await b.newContext({ locale: 'de-DE', serviceWorkers: 'block' }); await ctx.addInitScript(() => { window.__noWelcome = true; });
 const calls = [];
 await ctx.route(/trainer-test\.mathenachhilfe-online\.com/, async r => { const q = r.request(), m = q.method(), h = q.headers();
   if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type, X-Schreib', 'access-control-allow-methods': 'PUT, DELETE, OPTIONS' } });
   const args = ['-X', m, '-H', 'X-Schreib: ' + (h['x-schreib'] || ''), q.url()]; if (m === 'PUT') args.push('-H', 'Content-Type: text/plain', '--data-binary', q.postData() || '');
   const res = curl(args); calls.push({ m, status: res.status, len: (q.postData() || '').length, head: (q.postData() || '').slice(0, 40) });
   r.fulfill({ status: res.status, body: res.body, headers: { 'access-control-allow-origin': '*' } }); });
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
 // etwas Lernstand erzeugen
 const k = await p.evaluate(async () => { S.sel = { op: 'mul', lvl: 1 }; startGame('training'); await new Promise(r => setTimeout(r, 3000));
   for (let i = 0; i < 6; i++) { if (!G || G.over) break; G.input = i % 3 ? canon(G.task.a) : '0'; submit(); await new Promise(r => setTimeout(r, 2200)); try { continueAfterSolution(); } catch {} }
   openSheet('eltern'); await new Promise(r => setTimeout(r, 300)); const hasBtn = !!$('sheetBody').querySelector('[data-go="koppeln"]');
   showPanel('koppeln', {}, true); await new Promise(r => setTimeout(r, 300)); $('kpName').value = 'Testkind'; $('kpGo').click(); await new Promise(r => setTimeout(r, 4000));
   const k = kopplung(); return { hasBtn, id: k.id, schreib: k.schreib, key: k.key, last: k.last, link: kopplungLink(k), qr: !!$('sheetBody').querySelector('.qrbox svg'), ui: $('sheetBody').textContent.slice(0, 80) }; });
 R.app = { hasBtn: k.hasBtn, laengen: [k.id.length, k.schreib.length, k.key.length], hochgeladen: !!k.last, link: k.link.replace(k.key, '<key>'), qr: k.qr };
 // Abruf wie die Eltern-Seite + Entschlüsseln
 const g = curl([`https://trainer-test.mathenachhilfe-online.com/eltern/v1/b/${k.id}`]); R.get = g.status;
 R.getHead = g.body.slice(0, 60); R.getLen = g.body.length; if (g.status === 200) { try { const raw = g.body.trim().startsWith('{') ? JSON.parse(g.body).d : g.body.trim(); R.getForm = g.body.trim().startsWith('{') ? '{d: …}' : 'text'; const [iv, ct] = raw.split('.'); const buf = unb64u(ct), tag = buf.subarray(buf.length - 16), data = buf.subarray(0, buf.length - 16);
   const d = crypto.createDecipheriv('aes-256-gcm', unb64u(k.key), unb64u(iv)); d.setAuthTag(tag); const json = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8'));
   R.bericht = { ivLen: iv.length, format: json.format, app: json.app, appName: json.appName, name: json.name, stand: json.stand, aufgaben: json.aufgaben, richtigProzent: json.richtigProzent, schluessel: Object.keys(json) }; } catch (e) { R.decErr = e.message; } }
 // fremdes schreib → 403
 R.fremd = curl(['-X', 'PUT', '-H', 'X-Schreib: AAAAAAAAAAAAAAAAAAAAAA', '-H', 'Content-Type: text/plain', '--data-binary', 'AAAAAAAAAAAAAAAA.AAAA', `https://trainer-test.mathenachhilfe-online.com/eltern/v1/b/${k.id}`]).status;
 // Entkoppeln in der App → DELETE → Abruf weg
 await p.evaluate(async () => { window.confirm = () => true; $('kpOff').click(); await new Promise(r => setTimeout(r, 3000)); });
 R.nachDelete = curl([`https://trainer-test.mathenachhilfe-online.com/eltern/v1/b/${k.id}`]).status;
 R.lokalWeg = await p.evaluate(() => !kopplung());
 R.calls = calls; R.errs = errs; console.log(JSON.stringify(R, null, 1)); await b.close(); })();
