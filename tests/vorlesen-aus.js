// Vorlesen abgeschaltet (config.js vorlesen: false, Marcel 18.11.): keine Vorlese-Knöpfe, keine Abrufe beim Stimmen-Server, keine Gerätestimme.
// Aufruf: (cd kopfrechnen && python3 -m http.server 8765) & node tests/vorlesen-aus.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const R = {};
 for (const L of ['de-DE', 'en-GB', 'uk-UA']) {
  const ctx = await b.newContext({ locale: L, viewport: { width: 320, height: 680 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { window.__noWelcome = true; window.__said = [];
    const fake = { speak: u => window.__said.push(u.text), cancel() {}, getVoices: () => [{ voiceURI: 'v', name: 'T', lang: navigator.language, localService: true }], addEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: fake }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    // altes Profil mit eingeschaltetem Vorlesen
    localStorage.setItem('rechenblitz', JSON.stringify({ v: 3, cur: 'p1', profiles: { p1: { id: 'p1', name: 'Ich', emoji: '🦊', data: { settings: { speech: true, sound: true, music: true } } } } })); });
  const stimmen = []; ctx.on('request', r => { if (r.url().includes('stimmen.') || r.url().includes('/jetzt') || r.url().includes('vorlesen/')) stimmen.push(r.url()); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500); await p.mouse.click(160, 20); await p.waitForTimeout(300);
  R[L] = await p.evaluate(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const r = {};
    openSheet('settings'); await sl(400); const body = $('sheetBody');
    r.ui = { speechSwitch: !!body.querySelector('[data-k="speech"], #sw-speech') || /Vorlesen|Read aloud|Читання/.test(body.textContent), voiceTest: !!$('voiceTest'), rate: !!$('rateSeg'), musik: !!$('volMusic') || /Musik|Music|Музик/.test(body.textContent), toene: /Effekte|effects|ефект/i.test(body.textContent) };
    closeSheet(); openSheet('theorie', { topic: 'mul', lvl: 1 }); await sl(300); r.ui.theoSay = !!$('theoSay'); closeSheet();
    S.sel = { op: 'mul', lvl: 1 }; startGame('training'); await sl(3500); G.input = canon(G.task.a) === '1' ? '2' : '1'; submit(); await sl(2500);
    r.said = __said.length; r.toasts = [...document.querySelectorAll('.toast')].map(t => t.textContent).join('|'); r.music = Music.cur; r.speechSetting = S.settings.speech; r.available = Voice.available(); r.stimmeCan = Stimme.can();
    return r; });
  R[L].stimmenAbrufe = stimmen.length; R[L].errs = errs; await ctx.close(); }
 console.log(JSON.stringify(R, null, 1)); await b.close(); })();
