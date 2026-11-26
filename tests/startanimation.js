// Startanimation (Standard Leitstand 22.11.2026): schwarzer Splash #05070f mit weißem Zeichen 96 px, atmet, Zoom-Ausblenden, höchstens 4 s,
// reduced-motion nur kurzes Ausblenden, inline ohne Netzabruf, aria-hidden, App erst nach dem Ausblenden bedienbar, danach Element entfernt.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/startanimation.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), fails = [], ok = (c, m) => { if (!c) fails.push(m); }, res = {};
  const run = async (name, { reduce = false, slowJs = 0 } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: reduce ? 'reduce' : 'no-preference' });
    const ext = []; ctx.on('request', r => { if (!/^http:\/\/localhost/.test(r.url())) ext.push(r.url()); });
    if (slowJs) await ctx.route('**/js/rechenblitz.min.js', async r => { await new Promise(x => setTimeout(x, slowJs)); r.continue(); });
    await ctx.addInitScript(() => { window.__noWelcome = true; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    const t0 = Date.now(); await p.goto('http://localhost:8765/', { waitUntil: 'commit' });
    await p.waitForSelector('#boot', { state: 'attached' });
    const early = await p.evaluate(() => { const b = document.getElementById('boot'), s = b.querySelector('svg'), cs = getComputedStyle(b), r = s.getBoundingClientRect(); return { bg: cs.backgroundColor, w: Math.round(r.width), aria: b.getAttribute('aria-hidden'), inert: !!document.querySelector('.app').inert, fill: getComputedStyle(s).color, html: getComputedStyle(document.documentElement).backgroundColor, anim: getComputedStyle(s).animationName }; });
    await p.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 8000 });
    const gone = Date.now() - t0;
    const after = await p.evaluate(() => ({ inert: !!document.querySelector('.app').inert, boot: !!document.getElementById('boot'), top: (() => { const e = document.elementFromPoint(195, 400); return !!e && !e.closest('#boot'); })(), app: typeof APP_VERSION === 'string' }));
    res[name] = { early, gone, after, ext: ext.length, errs: errs.length };
    ok(early.bg === 'rgb(5, 7, 15)' && early.html === 'rgb(5, 7, 15)', name + ': Hintergrund nicht #05070f ' + early.bg + '/' + early.html);
    ok(early.w === 96, name + ': Zeichen nicht 96 px: ' + early.w); ok(early.aria === 'true', name + ': aria-hidden fehlt'); ok(early.inert, name + ': App nicht gesperrt (Fokus) während des Startbilds');
    ok(early.fill === 'rgb(255, 255, 255)', name + ': Zeichen nicht weiß ' + early.fill); ok(reduce ? early.anim === 'none' : (slowJs ? early.anim === 'bootbz' : /^boot(bz|zoom)$/.test(early.anim)), name + ': Atmen/Reduced-Motion falsch: ' + early.anim);   // beim langsamen Netz sieht man sicher das Atmen
    ok(!after.inert && !after.boot && after.top && (slowJs || after.app), name + ': nach dem Ausblenden ' + JSON.stringify(after)); ok(!ext.length, name + ': fremde Abrufe ' + ext.slice(0, 2)); ok(!errs.length, name + ': Fehler ' + errs.join('; '));
    await ctx.close(); return gone;
  };
  const g1 = await run('normal'); ok(g1 < 4000 + 900 + 500, 'normal: zu spät weg: ' + g1);
  const g2 = await run('reduced-motion', { reduce: true }); ok(g2 < g1 + 100 || g2 < 3000, 'reduced: ' + g2);
  const g3 = await run('langsames Netz (JS 6 s)', { slowJs: 6000 }); ok(g3 >= 3800 && g3 < 4000 + 900 + 600, 'langsam: Splash muss nach ca. 4 s weichen: ' + g3);
  await b.close();
  console.log(JSON.stringify(res));
  if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
  console.log('Startanimation ✓ (schwarz #05070f, Zeichen 96 px weiß, atmet, reduced-motion, höchstens ~4 s, inline, App erst danach bedienbar)');
})();
