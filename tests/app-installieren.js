// „App installieren“ (Leitstand 18.11.): Knopf nur, wenn nicht installiert; Chrome-Dialog, iPhone-Anleitung, Übersetzungen, 320 px.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/app-installieren.js
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const R = {};
 const run = async (name, ctxOpts, init, fn) => { const ctx = await b.newContext({ viewport: { width: 320, height: 680 }, serviceWorkers: 'block', ...ctxOpts });
   await ctx.addInitScript(init || (() => {})); await ctx.addInitScript(() => { window.__noWelcome = true; window.__miss = new Set(); window.__i18nMiss = k => window.__miss.add(k); });
   const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
   R[name] = await p.evaluate(fn); R[name].errs = errs; R[name].miss = await p.evaluate(() => [...__miss]); R[name].overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
   await ctx.close(); };
 await run('desktop-ohne', {}, null, async () => ({ visible: !$('installCta').hidden }));
 await run('chrome-prompt', { locale: 'en-GB' }, () => { window.__prompted = 0; setTimeout(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted++; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(e); }, 800); },
   async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const r = { visible: !$('installCta').hidden, text: $('installCta').textContent };
     openSheet('settings'); await sl(300); r.inSettings = !!document.querySelector('[data-install]'); closeSheet(); await sl(200);
     $('installCta').click(); await sl(400); r.prompted = window.__prompted; r.hiddenAfter = $('installCta').hidden; return r; });
 await run('iphone', { ...devices['iPhone 13'], locale: 'uk-UA' }, null, async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const r = { visible: !$('installCta').hidden };
   $('installCta').click(); await sl(400); r.sheet = $('sheetBody').textContent.slice(0, 120); return r; });
 await run('iphone-installiert', { ...devices['iPhone 13'] }, () => { Object.defineProperty(navigator, 'standalone', { get: () => true }); }, async () => ({ visible: !$('installCta').hidden }));
 await run('pro-texte', { locale: 'en-GB' }, null, async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); openSheet('pro'); await sl(400); return { text: $('sheetBody').textContent.match(/incl[^]*?app/)?.[0] || $('sheetBody').textContent.slice(-200) }; });
 console.log(JSON.stringify(R, null, 1)); await b.close(); })();
