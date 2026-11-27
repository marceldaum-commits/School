// Adventskalender: Der 10-%-Code erscheint NUR im Elternbereich (hinter dem Eltern-Tor); Kinder sehen nach Türchen 24 nur eine Belohnung ohne Geld- oder Kaufbezug (Marcel 27.11.2026).
// Prüft: Kinderansichten (Start, Kalender, Ergebnis) ohne Gutschein/%/Stunden/€/Eltern/Code; Anfrage ohne Klassenstufe; Elternbereich mit Wortlaut und Code; de/en/uk ohne fehlende Übersetzungen.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/advent-gutschein.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), fails = [], ok = (c, m) => { if (!c) fails.push(m); }, res = {};
  const KAUF = /Gutschein|voucher|ваучер|promo|\d\s?%|Stundenpaket|lesson package|пакет|€|Eltern|parents|батьк|Rabatt|discount|знижк|kaufen|buy|Code|код\b/i;
  for (const lang of ['de-DE', 'en-GB', 'uk-UA']) {
    const ctx = await b.newContext({ locale: lang, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const posts = []; await ctx.route(/\/api\/gutschein$/, r => { posts.push(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 'ADV-TEST-1234', prozent: 10, bis: '2027-01-15' }) }); });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.fulfill({ status: 204, body: '' }));
    const p = await ctx.newPage(), errs = [], miss = [];
    await p.exposeFunction('__m', k => miss.push(k));
    await p.addInitScript(() => { window.__noWelcome = true; window.__i18nMiss = k => window.__m(k); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
    const r = await p.evaluate(async () => {
      CONFIG.advent = true; CONFIG.adventPreview = true;
      const st = adventState(); st.klasse = 5; st.doors = {}; for (let d = 1; d <= 23; d++) st.doors[d] = { correct: 5, date: todayStr() }; save();
      const out = {};
      const wait = ms => new Promise(r => setTimeout(r, ms));
      renderHome(); await wait(300);
      out.startVor = ($('adventCard') || {}).textContent || '';
      closeSheet?.(); openSheet('advent'); await wait(400); out.kalenderVor = $('sheetBody').textContent; closeSheet();
      // Türchen 24 öffnen (Ergebnis nachgebaut)
      st.doors[24] = { correct: 5, date: todayStr() }; save();
      renderHome(); await wait(300); out.startNach = ($('adventCard') || {}).textContent + ' ' + ($('promo') ? $('promo').textContent : '');
      openSheet('advent'); await wait(400); out.kalenderNach = $('sheetBody').textContent; closeSheet();
      out.belohnung = adventReward();
      // Code abholen (Anfrage ohne Klasse), dann im Elternbereich lesen
      await fetchVoucher(); await wait(300);
      out.codeImKind = [out.startNach, out.kalenderNach, out.belohnung].join(' ').includes('ADV-TEST-1234');
      GATE.okUntil = 0; showPanel('eltern', {}, true); await wait(300); out.torDavor = !!document.querySelector('.gate-pad') && !$('sheetBody').textContent.includes('ADV-TEST-1234');
      GATE.okUntil = Date.now() + 6e5; closeSheet(); openSheet('eltern'); await wait(400); out.eltern = $('sheetBody').textContent; out.elternBox = !!$('voucherBox');
      return out;
    });
    for (const k of ['startVor', 'kalenderVor', 'startNach', 'kalenderNach', 'belohnung']) ok(!KAUF.test(r[k].replace(/\d+\/\d+/g, '')), `${lang}: Kinderansicht „${k}“ mit Kauf-/Geldbezug: ${(r[k].match(KAUF) || [''])[0]} – ${r[k].slice(0, 120)}`);
    ok(r.belohnung.length > 20, lang + ': keine Belohnung nach Türchen 24'); ok(!r.codeImKind, lang + ': Code im Kinder-Bereich'); ok(r.torDavor, lang + ': Elternbereich ohne Tor');
    ok(posts.length === 1 && JSON.parse(posts[0]).tueren === 24 && !('klasse' in JSON.parse(posts[0])), lang + ': Anfrage falsch: ' + posts.join('|'));
    ok(r.elternBox && r.eltern.includes('ADV-TEST-1234') && /10\s?%/.test(r.eltern), lang + ': Code/Wortlaut fehlt im Elternbereich');
    ok(/24/.test(r.eltern) && !/Klasse|class|клас/.test(r.eltern.split('ADV-TEST-1234')[1] ? r.eltern.split('ADV-TEST-1234')[1].slice(0, 160) : ''), lang + ': Elternwortlaut');
    res[lang] = { elternAnfang: r.eltern.slice(0, 200), belohnung: r.belohnung.replace(/<[^>]+>/g, ' ').slice(0, 120) };
    const m2 = [...new Set(miss)].filter(k => !/^(rechenblitz\.)?mathenachhilfe-online\.com(\/probestunde)?$/.test(k));
    ok(!m2.length, lang + ': fehlende Übersetzungen ' + m2.slice(0, 6).join(' | ')); ok(!errs.length, lang + ': Seitenfehler ' + errs.join('; '));
    await ctx.close();
  }
  await b.close(); console.log(JSON.stringify(res, null, 1));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Advent-Gutschein ✓ (Kind ohne Geldbezug, Code nur im Elternbereich hinter dem Tor, Anfrage ohne Klasse, de/en/uk)');
})();
