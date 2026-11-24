// Rechenblitz – Pro-Fenster für Kinder ohne Preis/Kauf-Knopf (UWG Anh. Nr. 28), Kaufen erst nach dem Eltern-Tor. Braucht den lokalen Server auf :8765.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), res = {};
  for (const lang of ['de-DE', 'en-GB', 'uk-UA']) {
    const p = await (await b.newContext({ locale: lang, viewport: { width: 390, height: 844 } })).newPage(), errs = [], miss = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.exposeFunction('__m', k => miss.push(k)); await p.addInitScript(() => { window.__noWelcome = true; window.__i18nMiss = k => window.__m(k); });
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => needPro('profi')); await p.waitForTimeout(700);
    const kid = await p.evaluate(() => document.getElementById('sheetBody').innerText);
    await p.screenshot({ path: require("path").join(require("os").tmpdir(), `prokind-${lang}.png`) });
    await p.click('#proEltern'); await p.waitForTimeout(500);
    const gate = await p.evaluate(() => document.getElementById('sheetBody').innerText);
    // Aufgabe lösen: Zahlwörter aus dem Tor zurückrechnen, mit der Tastatur eingeben
    await p.evaluate(async () => { const W = GATE_W[I18N.lang] || GATE_W.de, t = document.getElementById('gateWord').textContent, has = w => new RegExp('(^|[^\\p{L}])' + w + '([^\\p{L}]|$)', 'u').test(t);
      const a = W.a.findIndex(has), bb = W.b.findIndex(has); for (const ch of String((13 + a) * (6 + bb))) document.querySelector(`.gate-key[data-k="${ch}"]`).click(); document.querySelector('.gate-key[data-k="✓"]').click(); await new Promise(r => setTimeout(r, 600)); });
    const parent = await p.evaluate(() => document.getElementById('sheetBody').innerText);
    res[lang] = { kidHasPrice: /€|kaufen|Buy|Купити/i.test(kid), kidText: kid.slice(0, 160), gateOk: /Erwachsene|adults|дорослих/.test(gate), parentHasBuy: /7,99|€/.test(parent), errs, miss: [...new Set(miss)] };
    await p.close(); }
  await b.close(); const bad = Object.entries(res).filter(([, r]) => r.kidHasPrice || !r.gateOk || !r.parentHasBuy || r.errs.length || r.miss.length); console.log(bad.length ? "FEHLER " + JSON.stringify(bad, null, 1) : "Pro-Fenster Kind/Eltern ✓ (de, en, uk)"); process.exit(bad.length ? 1 : 0); })();
