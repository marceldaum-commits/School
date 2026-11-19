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
    // Zahl lösen: Wort aus dem Panel → Ziffern über gateWords rückwärts suchen
    const n = await p.evaluate(() => { const w = document.getElementById('gateWord').textContent; for (let i = 100; i < 1000; i++) if (gateWords(i, I18N.lang) === w) return i; });
    await p.fill('#gateIn', String(n)); await p.click('#gateForm button[type=submit]'); await p.waitForTimeout(600);
    const parent = await p.evaluate(() => document.getElementById('sheetBody').innerText);
    res[lang] = { kidHasPrice: /€|kaufen|Buy|Купити/i.test(kid), kidText: kid.slice(0, 160), gateOk: /Erwachsene|adults|дорослих/.test(gate), parentHasBuy: /7,99|€/.test(parent), errs, miss: [...new Set(miss)] };
    await p.close(); }
  await b.close(); const bad = Object.entries(res).filter(([, r]) => r.kidHasPrice || !r.gateOk || !r.parentHasBuy || r.errs.length || r.miss.length); console.log(bad.length ? "FEHLER " + JSON.stringify(bad, null, 1) : "Pro-Fenster Kind/Eltern ✓ (de, en, uk)"); process.exit(bad.length ? 1 : 0); })();
