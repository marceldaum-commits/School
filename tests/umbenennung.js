// Umbenennung Rechenblitz → Zahlensprint (24.11.2026): sichtbare Texte in de/en/uk, keine fehlenden Übersetzungen, keine Fehler.
// Erlaubt bleiben: „früher Rechenblitz“, „neue Name von Rechenblitz“ (nur bis 28.2.2027), das Wortspiel „Echter Rechenblitz“, „Rechenblitz-Legende“,
// und die Namen alter Versionen im Änderungsprotokoll. Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/umbenennung.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), res = {}, fails = [];
  for (const lang of ['de-DE', 'en-GB', 'uk-UA']) {
    const ctx = await b.newContext({ locale: lang, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p = await ctx.newPage(), errs = [], miss = [];
    await p.exposeFunction('__m', k => miss.push(k));
    await p.addInitScript(() => { window.__noWelcome = true; window.__i18nMiss = k => window.__m(k); });
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.fulfill({ status: 204, body: '' }));
    await p.goto('http://localhost:' + (process.env.PORT || 8765) + '/'); await p.waitForTimeout(1500);
    const seen = {};
    seen.titel = await p.title();
    seen.manifest = await p.evaluate(async () => (await (await fetch('manifest.webmanifest')).json()));
    seen.home = await p.evaluate(() => document.body.innerText);
    const panels = ['menu', 'news', 'settings', 'invite', 'flyer', 'install', 'teacher', 'pro', 'eltern'];
    for (const k of panels) {
      seen[k] = await p.evaluate(async k => { try { openSheet(k, k === 'pro' ? { what: 'profi', eltern: true } : {}); } catch (e) { return 'ERR ' + e.message; } await new Promise(r => setTimeout(r, 400)); const t = ($('sheetBody') || {}).textContent || ''; try { closeSheet(); } catch {} return t; }, k);
    }
    const news1 = seen.news.split(/Version 3\.\d+\.\d+/).slice(0, 3).join(' ');   // nur die neuesten Einträge, ältere sind Geschichte
    const all = [seen.titel, seen.manifest.name, seen.manifest.short_name, seen.manifest.description, seen.home, ...panels.filter(k => k !== 'news').map(k => seen[k]), news1].join('\n');
    const bad = (all.match(/.{0,40}Rechenblitz.{0,40}/g) || []).filter(x => !/früher Rechenblitz|formerly Rechenblitz|раніше Rechenblitz|neue Name von Rechenblitz|new name of Rechenblitz|нова назва Rechenblitz|нове ім’я Rechenblitz|Echter Rechenblitz|Rechenblitz-Legende|Rechenblitz becomes|Rechenblitz стає|Rechenblitz wird|Version 3\.|Rechenblitz-Musik|Rechenblitz-Symbol|Rechenblitz-Widget|Rechenblitz gibt es|Rechenblitz im Browser|Rechenblitz kommt|Rechenblitz öffnet|Namen Rechenblitz|Rechenblitz-Zeichen|Rechenblitz ⚡/.test(x));
    res[lang] = { titel: seen.titel, name: seen.manifest.name, short: seen.manifest.short_name, zahlensprintImMenue: /Zahlensprint/.test(seen.menu), frueher: /früher Rechenblitz|formerly Rechenblitz|раніше Rechenblitz/.test(seen.menu), bad, miss: [...new Set(miss)].filter(k => !/^(rechenblitz\.)?mathenachhilfe-online\.com(\/probestunde)?$|^rechenblitz\.mathenachhilfe-online\.com$/.test(k)), errs };
    if (!/Zahlensprint/.test(seen.titel) || seen.manifest.short_name !== 'Zahlensprint' || !res[lang].zahlensprintImMenue || !res[lang].frueher) fails.push(lang + ': Name nicht überall oder „früher“ fehlt');
    if (bad.length) fails.push(lang + ': noch „Rechenblitz“: ' + bad.slice(0, 5).join(' | '));
    if (res[lang].miss.length) fails.push(lang + ': fehlende Übersetzungen: ' + res[lang].miss.slice(0, 5).join(' | '));
    if (errs.length) fails.push(lang + ': Seitenfehler ' + errs.join('; '));
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(res, null, 1).slice(0, 2500));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Umbenennung ✓ (de, en, uk)');
})();
