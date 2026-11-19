// Web-Update-Test (Leitstand 18.11.): alte Version offen, neue auf den Server, Rückkehr → neue Version ohne manuelles Neuladen
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright'); import fs from 'fs'; import { spawn } from 'child_process';
// Aufruf: node tests/web-update.mjs   (arbeitet auf einer Kopie von kopfrechnen/ in einem Temp-Ordner)
import os from 'os'; import path from 'path';
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-webupd-')); fs.cpSync(new URL('../kopfrechnen', import.meta.url).pathname, DIR, { recursive: true });
const PORT = 8790, URL_ = `http://localhost:${PORT}/`;
const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: DIR, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
const OLD = fs.readFileSync(DIR + '/js/changelog.js', 'utf8').match(/APP_VERSION = '([\d.]+)'/)[1], NEW = '9.99.0';
const bump = (from, to) => { for (const f of ['js/changelog.js', 'js/rechenblitz.min.js', 'sw.js']) { const p = DIR + '/' + f; fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(`'${from}'`).join(`'${to}'`).split(`rechenblitz-${from}`).join(`rechenblitz-${to}`).split(`"${from}"`).join(`"${to}"`)); } };
const R = {}; const b = await chromium.launch();
try {
  // Fall 1: Tab bleibt offen, man ist mitten in einer Runde
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 } }); await ctx.addInitScript(() => { window.__noWelcome = true; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let loads = 0; p.on('load', () => loads++);
  await p.goto(URL_); await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(6500);
  R.start = await p.evaluate(async () => { S.total = 4242; save(); const c = await caches.open('rechenblitz-nova'); await c.put('/nova/test.mp3', new Response('x')); return { v: APP_VERSION, sw: !!navigator.serviceWorker.controller, caches: await caches.keys() }; });
  await p.evaluate(() => { S.sel = { op: 'mul', lvl: 1 }; startGame('training'); }); await p.waitForTimeout(3500);
  bump(OLD, NEW);
  const before = loads;
  await p.waitForTimeout(61000);   // Drossel (1 Min.) abwarten, dann „Rückkehr in den Tab“
  await p.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(9000);
  R.inGame = { reloaded: loads > before, screen: await p.evaluate(() => currentScreen()), v: await p.evaluate(() => APP_VERSION) };
  await p.evaluate(() => quitGame(true) || goHome?.()); await p.evaluate(() => { try { goHome(); } catch {} });
  await p.waitForFunction(v => typeof APP_VERSION !== 'undefined' && APP_VERSION === v, NEW, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(2500);
  R.after = await p.evaluate(async () => ({ v: APP_VERSION, total: S.total, nova: !!(await (await caches.open('rechenblitz-nova')).match('/nova/test.mp3')), caches: await caches.keys(), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | ') }));
  R.errs = errs; await ctx.close();
  // Fall 2: alte Version seit Tagen zu, beim nächsten Öffnen kommt die neue (ohne Klick)
  bump(NEW, OLD);
  const ctx2 = await b.newContext(); await ctx2.addInitScript(() => { window.__noWelcome = true; }); const q = await ctx2.newPage();
  await q.goto(URL_); await q.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {}); await q.waitForTimeout(6500); await q.close();
  bump(OLD, NEW);
  const q2 = await ctx2.newPage(); await q2.goto(URL_);
  await q2.waitForFunction(v => typeof APP_VERSION !== 'undefined' && APP_VERSION === v, NEW, { timeout: 30000 }).catch(() => {});
  R.reopen = await q2.evaluate(() => ({ v: APP_VERSION }));
  await ctx2.close();
} finally { await b.close(); srv.kill(); }
console.log(JSON.stringify(R, null, 1));
const ok = R.inGame && !R.inGame.reloaded && R.after.v === NEW && R.after.total === 4242 && R.after.nova && !R.after.caches.includes('rechenblitz-' + OLD) && /3|9/.test(R.after.toast) && R.reopen.v === NEW && !R.errs.length;
console.log(ok ? 'Web-Update ✓ (nicht mitten in der Runde, danach automatisch, Daten + Nova-Dateien bleiben, alter Cache weg, Hinweis, beim Wiederöffnen neu)' : 'Web-Update ✗'); process.exit(ok ? 0 : 1);
