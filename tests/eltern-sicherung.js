// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/eltern-sicherung.js   (Sicherungs-Server nachgebildet, bis /eltern/v1/s/ auf trainer-test läuft)
// Rundlauf Sicherung: Gerät A koppelt + sichert → Gerät B (frisch) stellt mit dem Link wieder her → gleicher Lernstand, B schreibt weiter (204), fremder Schlüssel 403
const { chromium } = require('playwright');
const MOCK = process.argv[2] !== 'echt';
(async () => { const b = await chromium.launch(); const R = {}; const store = { b: {}, s: {} }, log = [];
 const route = async ctx => ctx.route(/trainer-test\.mathenachhilfe-online\.com\/eltern\/v1\/([bs])\/([A-Za-z0-9_-]+)/, async r => {
   const q = r.request(), m = q.method(), [, art, id] = q.url().match(/v1\/([bs])\/([A-Za-z0-9_-]+)/), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type, X-Schreib', 'access-control-allow-methods': 'GET, PUT, DELETE, OPTIONS' };
   if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
   const sch = q.headers()['x-schreib'], e = store[art][id]; let st = 404, body = '';
   if (m === 'PUT') { if (e && e.schreib !== sch) st = 403; else { store[art][id] = { schreib: sch, d: q.postData(), t: new Date().toISOString() }; st = 204; } }
   else if (m === 'GET') { if (e) { st = 200; body = JSON.stringify({ d: e.d, t: e.t }); } }
   else if (m === 'DELETE') { if (e && e.schreib !== sch) st = 403; else { delete store.b[id]; if (art === 'b') delete store.s[id]; else delete store.s[id]; st = 204; } }
   log.push(`${m} ${art} ${st} ${(q.postData() || '').length}`); r.fulfill({ status: st, body, headers: { ...cors, 'content-type': 'application/json' } }); });
 const neu = async () => { const ctx = await b.newContext({ locale: 'de-DE', serviceWorkers: 'block' }); await ctx.addInitScript(() => { window.__noWelcome = true; }); await route(ctx); const p = await ctx.newPage(); p.on('pageerror', e => R.errs = (R.errs || []).concat(e.message)); await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500); return { ctx, p }; };
 const spiel = p => p.evaluate(async n => { S.sel = { op: 'mul', lvl: 1 }; startGame('training'); await new Promise(r => setTimeout(r, 3000)); for (let i = 0; i < n; i++) { if (!G || G.over) break; G.input = i % 4 ? canon(G.task.a) : '0'; submit(); await new Promise(r => setTimeout(r, 2200)); try { continueAfterSolution(); } catch {} } try { quitGame(true); } catch {} }, 6);
 const A = await neu(); await spiel(A.p);
 const a = await A.p.evaluate(async () => { profile().name = 'Mia'; save(); await elternKoppeln('Mia'); const k = kopplung(); const s1 = k.sicherung; const again = await elternSync(true); return { link: kopplungLink(k), sicherung: s1, zweitesMalOhneAenderung: kopplung().sicherung, total: S.total, hist: Object.keys(S.hist), monate: S.monate, xp: S.xp }; });
 R.A = { sicherung: a.sicherung, ohneAenderung: a.zweitesMalOhneAenderung, total: a.total, monate: a.monate };
 // Bericht enthält verlauf
 R.berichtVerlauf = await A.p.evaluate(() => elternBerichtJson().verlauf);
 const B = await neu();
 const bb = await B.p.evaluate(async link => { window.confirm = () => true; S.total = 3; S.hist[todayStr()] = { n: 3, ok: 1, ms: 1000, tp: {} }; save(); showPanel('wiederherstellen', {}, true); await new Promise(r => setTimeout(r, 300));
   $('wdLink').value = link; $('wdGo').click(); await new Promise(r => setTimeout(r, 2500)); return { total: S.total, hist: Object.keys(S.hist), monate: S.monate, xp: S.xp, name: profile().name, gekoppelt: !!kopplung(), schreibDa: !!(kopplung() || {}).schreib }; }, a.link);
 R.B = { gleicherStand: bb.total === a.total && JSON.stringify(bb.hist) === JSON.stringify(a.hist) && JSON.stringify(bb.monate) === JSON.stringify(a.monate) && bb.xp === a.xp, name: bb.name, gekoppelt: bb.gekoppelt, schreibDa: bb.schreibDa };
 await spiel(B.p); R.B.schreibtWeiter = await B.p.evaluate(async () => { await elternSync(true); return kopplung().sicherung; });
 // fremder Schlüssel
 R.fremd = await B.p.evaluate(async () => { const k = kopplung(); const r = await fetch(KOPPLUNG.sich(k.stufe) + k.id, { method: 'PUT', headers: { 'Content-Type': 'text/plain', 'X-Schreib': 'AAAAAAAAAAAAAAAAAAAAAA' }, body: 'AAAAAAAAAAAAAAAA.AAAA' }); return r.status; });
 // falscher Link / andere Fehler
 R.fehlerTexte = await B.p.evaluate(async () => { const out = []; for (const v of ['quatsch', 'https://www.mathenachhilfe-online.com/eltern-bericht/#AAAAAAAAAAAAAAAAAAAAAA.' + 'B'.repeat(43)]) { showPanel('wiederherstellen', {}, true); await new Promise(r => setTimeout(r, 200)); $('wdLink').value = v; $('wdGo').click(); await new Promise(r => setTimeout(r, 1200)); out.push($('wdMsg').textContent); } return out; });
 R.log = log; console.log(JSON.stringify(R, null, 1)); await b.close(); })();
