// PC-Ansicht (27.11.2026): ab 1500 px breiter (1360 px) mit 6 Themen je Zeile; darunter (1366, 1024), iPad (820) und Handy (390) unverändert (1200 px bzw. 5 je Zeile); nie waagerechtes Scrollen.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/pc-ansicht.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), fails = [], ok = (c, m) => { if (!c) fails.push(m); }, res = {};
  for (const [w, h, maxW, cols] of [[1920, 1080, 1360, 6], [1500, 900, 1360, 6], [1499, 900, 1200, 5], [1366, 768, 1200, 5], [1024, 768, 1200, 5], [820, 1180, null, 5], [390, 844, null, 5], [320, 640, null, 5]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', locale: 'de-DE' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.fulfill({ status: 204, body: '' })); await ctx.addInitScript(() => { window.__noWelcome = true; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(3200);
    const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, app: Math.round(document.querySelector('.app').getBoundingClientRect().width), cols: getComputedStyle(document.getElementById('topics')).gridTemplateColumns.split(' ').length }));
    res[w] = o;
    ok(o.sw <= o.cw, `${w}: waagerechtes Scrollen (${o.sw}/${o.cw})`); ok(o.cols === cols, `${w}: ${o.cols} Spalten statt ${cols}`);
    if (maxW) ok(o.app <= Math.min(maxW, w) && o.app > Math.min(maxW, w) - 70, `${w}: App-Breite ${o.app} statt ca. ${maxW}`);
    ok(!errs.length, `${w}: Fehler ${errs.join('; ')}`); await ctx.close();
  }
  await b.close(); console.log(JSON.stringify(res));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('PC-Ansicht ✓ (ab 1500 px breiter mit 6 Themen je Zeile, darunter und auf iPad/Handy unverändert, kein waagerechtes Scrollen)');
})();
