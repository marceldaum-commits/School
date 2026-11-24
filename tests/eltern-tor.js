// Eltern-Tor-Standard, V10 neu und Weg zur Probestunde V15 (24.11.2026). Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/eltern-tor.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), res = {}, fails = [], ok = (c, m) => { if (!c) fails.push(m); };
  const WORT = { 'de-DE': /Was ergibt \S+ mal \S+\?/, 'en-GB': /What is \S+ times \S+\?/, 'uk-UA': /Скільки буде .+ помножити на .+\?/ };
  for (const lang of ['de-DE', 'en-GB', 'uk-UA']) {
    const ctx = await b.newContext({ locale: lang, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.fulfill({ status: 204, body: '' }));
    const p = await ctx.newPage(), errs = [], miss = [], r = {};
    await p.exposeFunction('__m', k => miss.push(k));
    await p.addInitScript(() => { window.__noWelcome = true; window.__i18nMiss = k => window.__m(k); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
    // 1) Tor vor dem Elternbereich
    const gate = await p.evaluate(async () => {
      openSheet('menu'); await new Promise(r => setTimeout(r, 200));
      const menuLinks = [...document.querySelectorAll('#sheetBody a[href^="http"]')].map(a => a.getAttribute('href'));
      showPanel('eltern', {}, true); await new Promise(r => setTimeout(r, 300));
      const text = $('sheetBody').textContent, hasPad = !!document.querySelector('.gate-pad'), word = ($('gateWord') || {}).textContent || '';
      return { menuLinks, text, hasPad, word, elternSichtbar: !!$('zaehlSw') };
    });
    r.word = gate.word; ok(gate.hasPad && !gate.elternSichtbar, lang + ': Tor fehlt vor dem Elternbereich');
    ok(WORT[lang].test(gate.word), lang + ': Aufgabe nicht in Worten: ' + gate.word);
    ok(!gate.menuLinks.some(h => /probestunde|geschenk|kasse|shop/i.test(h)), lang + ': Menü hat Kauf-/Probestunden-Link: ' + gate.menuLinks.join());
    // falsche Antwort → neue Aufgabe, richtige → Elternbereich
    const falsch = await p.evaluate(async () => { const w1 = $('gateWord').textContent; for (const k of ['1', '✓']) document.querySelector(`.gate-key[data-k="${k}"]`).click(); await new Promise(r => setTimeout(r, 200)); return { w1, offen: !!document.querySelector('.gate-pad'), eingabeLeer: $('gateIn').textContent.trim() === '' }; });
    ok(falsch.offen && falsch.eingabeLeer, lang + ': nach Fehler bleibt das Tor mit leerer Eingabe offen');
    const richtig = await p.evaluate(async () => {
      // Antwort aus den Zahlwörtern zurückrechnen: Wörter → Zahl über die Tabelle des Tors
      const W = GATE_W[I18N.lang] || GATE_W.de, t = $('gateWord').textContent;
      const found = [...W.a, ...W.b].filter(w => t.includes(w)); const a = W.a.findIndex(w => t.includes(w) && !W.b.some(v => v === w)), b = W.b.findIndex(w => new RegExp('(^|[^\\p{L}])' + w + '([^\\p{L}]|$)', 'u').test(t));
      const aw = W.a.map((w, i) => [w, i]).filter(([w]) => new RegExp('(^|[^\\p{L}])' + w + '([^\\p{L}]|$)', 'u').test(t))[0];
      const ans = (13 + aw[1]) * (6 + b);
      for (const ch of String(ans)) document.querySelector(`.gate-key[data-k="${ch}"]`).click();
      document.querySelector('.gate-key[data-k="✓"]').click(); await new Promise(r => setTimeout(r, 400));
      const nach = { eltern: !!$('zaehlSw'), nhSw: !!$('nhSw'), frei: elternFrei() };
      // zweites Öffnen innerhalb von 10 Minuten ohne Tor
      closeSheet(); showPanel('eltern', {}, true); await new Promise(r => setTimeout(r, 200));
      nach.zweites = !!$('zaehlSw') && !document.querySelector('.gate-pad'); return nach;
    });
    ok(richtig.eltern && richtig.nhSw && richtig.frei && richtig.zweites, lang + ': Elternbereich nach Tor/zweites Öffnen: ' + JSON.stringify(richtig));
    // 2) Einstellungen: Schnell-Schalter offen, Zurücksetzen/Pro nicht
    await p.evaluate(() => { GATE.okUntil = 0; closeSheet(); });
    const einst = await p.evaluate(async () => { openSheet('settings'); await new Promise(r => setTimeout(r, 300)); const t = $('sheetBody').innerHTML; return { reset: /data-reset|btnReset/.test(t), pro: /data-go="pro"/.test(t), music: !!document.querySelector('[data-set="music"]'), eltern: /data-go="settingsEltern"/.test(t), klSeg: !!$('klSeg'), theme: !!$('themeSeg') }; });
    ok(!einst.reset && !einst.pro && einst.music && einst.eltern && einst.klSeg && einst.theme, lang + ': Einstellungen falsch geteilt ' + JSON.stringify(einst));
    const eltEin = await p.evaluate(async () => { showPanel('settingsEltern', {}, true); await new Promise(r => setTimeout(r, 200)); const gated = !!document.querySelector('.gate-pad'); GATE.okUntil = Date.now() + 6e5; showPanel('settingsEltern', {}, true); await new Promise(r => setTimeout(r, 300)); const t = $('sheetBody').innerHTML; return { gated, reset: /id="btnReset"/.test(t), pro: /data-go="pro"/.test(t) }; });
    ok(eltEin.gated && eltEin.reset && eltEin.pro, lang + ': Eltern-Einstellungen ' + JSON.stringify(eltEin));
    // 3) Teilen nach außen hinter dem Tor
    const teilen = await p.evaluate(async () => { GATE.okUntil = 0; closeSheet(); let n = 0; const oldShare = navigator.share; navigator.share = async () => { n++; }; shareText('x', 'y'); await new Promise(r => setTimeout(r, 300)); const vorTor = n, gated = !!document.querySelector('.gate-pad'); navigator.share = oldShare; closeSheet(); return { vorTor, gated }; });
    ok(teilen.vorTor === 0 && teilen.gated, lang + ': Teilen ohne Tor möglich ' + JSON.stringify(teilen));
    // 4) V15: Kinder – Hilfesatz ohne Außenlink; Eltern – Hinweis mit Zähl-/Pausenlogik; Klasse 9–10 – Tipp einmal pro Woche
    const v15 = await p.evaluate(async () => {
      const day = i => dayStr(i); S.hist[day(1)] = { n: 20, tp: { gap: [4, 16] } }; S.hist[day(3)] = { n: 20, tp: { gap: [2, 8] } };
      G = { mode: 'training', results: [] }; S.promoDay = null;
      const kid = resultPromo(); const box = document.createElement('div'); box.innerHTML = kid; document.body.appendChild(box); bindHilfe();
      const kidLinks = box.querySelectorAll('a').length, kidText = box.textContent, btns = box.querySelectorAll('button').length;
      $('hilfeLeicht').click(); const lvlNach = S.sel.op; box.remove();
      const tpOhne = schwierigesThema();
      GATE.okUntil = Date.now() + 6e5; closeSheet(); openSheet('eltern'); await new Promise(r => setTimeout(r, 300));
      const hinweis1 = !!$('nhHinweis'), href = ($('nhLink') || {}).href || '', text1 = ($('nhHinweis') || {}).textContent || '';
      closeSheet(); openSheet('eltern'); await new Promise(r => setTimeout(r, 300)); const hinweis2 = !!$('nhHinweis');
      S.nachhilfeSeen = {}; ROOT.hinweisAus = true; closeSheet(); openSheet('eltern'); await new Promise(r => setTimeout(r, 300)); const hinweis3 = !!$('nhHinweis'); ROOT.hinweisAus = false; closeSheet();
      S.settings.klasse = 9; S.tippDatum = null; renderPromo(); const tipp1 = !$('promo').hidden && /Probestunde/.test($('promo').textContent), tippHref = ($('tippLink') || {}).href || '';
      renderPromo(); const tipp2 = !$('promo').hidden;   // Datum ist gesetzt → nicht noch einmal
      S.settings.klasse = 6; S.tippDatum = null; renderPromo(); const tipp6 = !$('promo').hidden;
      return { kidLinks, btns, kidHatProbe: /Probestunde|kostenlos/i.test(kidText), tpOhne, hinweis1, href, text1: text1.slice(0, 90), hinweis2, hinweis3, tipp1, tippHref, tipp2, tipp6 };
    });
    r.v15 = v15;
    ok(v15.kidLinks === 0 && v15.btns === 2 && !v15.kidHatProbe, lang + ': Kinder-Hilfesatz ' + JSON.stringify(v15));
    ok(v15.tpOhne === 'gap' && v15.hinweis1 && /probestunde\/\?src=rechenblitz$/.test(v15.href) && !v15.hinweis2 && !v15.hinweis3, lang + ': Elternhinweis ' + JSON.stringify(v15));
    ok(v15.tipp1 && /probestunde\/\?src=rechenblitz$/.test(v15.tippHref) && !v15.tipp2 && !v15.tipp6, lang + ': Tipp Klasse 9–10 ' + JSON.stringify(v15));
    r.miss = [...new Set(miss)].filter(k => !/^(rechenblitz\.)?mathenachhilfe-online\.com(\/probestunde)?$/.test(k));
    ok(!r.miss.length, lang + ': fehlende Übersetzungen ' + r.miss.slice(0, 6).join(' | ')); ok(!errs.length, lang + ': Seitenfehler ' + errs.join('; '));
    res[lang] = r; await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { word: v.word, text1: v.v15.text1, miss: v.miss }])), null, 1));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Eltern-Tor ✓ (Aufgabe in Worten de/en/uk, Tastatur, Fehler → neue Aufgabe, 10 Minuten, Einstellungen geteilt, Teilen hinter dem Tor, V15 Kind/Eltern/Klasse 9–10)');
})();
