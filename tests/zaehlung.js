// Zählung: kommt beim Start genau eine Meldung {app,v,e:{start:1}} an den EIGENEN Host (lernen-test, nie an die Live-Stufe trainer.…)? Nach Abschalten im Elternbereich keine mehr.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOTDIR = path.join(__dirname, '../kopfrechnen');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ locale: 'de-DE', serviceWorkers: 'block' }); await ctx.addInitScript(() => { window.__noWelcome = true; });
 const hits = [];
 await ctx.route('https://lernen-test.mathenachhilfe-online.com/rechenblitz/**', r => { let f = new URL(r.request().url()).pathname.replace(/^\/rechenblitz\//, '/'); if (f.endsWith('/')) f += 'index.html'; const p = path.join(ROOTDIR, f);
   if (!fs.existsSync(p)) return r.fulfill({ status: 404 }); const ct = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }[path.extname(p)] || 'application/octet-stream';
   r.fulfill({ status: 200, body: fs.readFileSync(p), headers: { 'content-type': ct } }); });
 const live = []; await ctx.route('https://trainer.mathenachhilfe-online.com/**', r => { live.push(r.request().url()); r.abort(); });
 await ctx.route('https://lernen-test.mathenachhilfe-online.com/zaehler/**', r => { hits.push({ url: r.request().url(), ct: r.request().headers()['content-type'], body: r.request().postData() }); r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); });
 await ctx.route(/^https:\/\/(?!lernen-test\.|trainer\.)/, r => r.abort());
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.goto('https://lernen-test.mathenachhilfe-online.com/rechenblitz/'); await p.waitForTimeout(4500);
 const first = hits.length;
 const ui = await p.evaluate(async () => { openSheet('eltern'); await new Promise(r => setTimeout(r, 300)); const t = $('sheetBody').textContent; const sw = $('zaehlSw'); const on = sw.getAttribute('aria-checked'); sw.click(); return { gift: /Lern-Geschenk/.test(t), giftHref: $('sheetBody').querySelector('a[href*="geschenke"]')?.href, on, after: sw.getAttribute('aria-checked'), week: /Wochenbericht/.test(t) }; });
 await p.reload(); await p.waitForTimeout(4500);
 console.log(JSON.stringify({ ersterStart: first, meldung: hits[0], ui, nachAbschalten: hits.length - first, anLiveStufe: live.length, errs })); await b.close(); })();
