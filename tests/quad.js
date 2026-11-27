// Quadratische Gleichungen im Kopf (quad, Kl. 9–10): Thema in der Klassenliste, Aufgabe auf dem Handy (320 px) ohne Überlauf, Theorie, de/en/uk ohne fehlende Übersetzungen.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/quad.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), fails = [], ok = (c, m) => { if (!c) fails.push(m); }, res = {};
  for (const lang of ['de-DE', 'en-GB', 'uk-UA']) {
    const ctx = await b.newContext({ locale: lang, viewport: { width: 320, height: 680 }, serviceWorkers: 'block' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.fulfill({ status: 204, body: '' }));
    const p = await ctx.newPage(), errs = [], miss = [];
    await p.exposeFunction('__m', k => miss.push(k));
    await p.addInitScript(() => { window.__noWelcome = true; window.__i18nMiss = k => window.__m(k); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
    const r = {};
    r.klassen = await p.evaluate(() => [9, 10].map(k => classTopicSet(k).has('quad')));
    r.levels = await p.evaluate(() => LEVEL_DESC.quad.length);
    const w = [];
    for (let l = 0; l < 6; l++) {
      const o = await p.evaluate(async l => {
        S.sel = { op: 'quad', lvl: l === 5 ? 5 : l }; S.settings.klasse = 10; if (l === 5) RBPRO.ok = true;
        goHome(); startGame('training'); await new Promise(r => setTimeout(r, 3300));
        const el = document.getElementById('expr');
        const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth, task = el ? el.textContent : '';
        const wide = el ? el.scrollWidth > el.parentElement.clientWidth + 1 : true;
        return { sw, cw, task, wide, hint: !!document.getElementById('game') };
      }, l);
      w.push(o); ok(o.sw <= o.cw && !o.wide, `${lang} Stufe ${l + 1}: Überlauf bei 320 px (${o.sw}/${o.cw}) ${o.task}`); ok(/x/.test(o.task), `${lang} Stufe ${l + 1}: keine Gleichung: ${o.task}`);
    }
    r.tasks = w.map(x => x.task);
    r.theorie = await p.evaluate(async () => { closeSheet?.(); openSheet('theorie', { topic: 'quad', lvl: 2 }); await new Promise(r => setTimeout(r, 400)); const t = $('sheetBody').textContent; return { has: /x²|Wurzel|root|корін/.test(t), len: t.length }; });
    ok(r.klassen.every(Boolean), lang + ': quad nicht in Klasse 9/10'); ok(r.levels === 6, lang + ': LEVEL_DESC hat nicht 6 Einträge'); ok(r.theorie.has, lang + ': Theorie fehlt');
    r.miss = [...new Set(miss)].filter(k => !/^(rechenblitz\.)?mathenachhilfe-online\.com(\/probestunde)?$/.test(k));
    ok(!r.miss.length, lang + ': fehlende Übersetzungen ' + r.miss.slice(0, 6).join(' | ')); ok(!errs.length, lang + ': Seitenfehler ' + errs.join('; '));
    res[lang] = r; await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { tasks: v.tasks, miss: v.miss }])), null, 1));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Quadratische Gleichungen ✓ (Klasse 9/10, 6 Stufen, 320 px ohne Überlauf, Theorie, de/en/uk)');
})();
