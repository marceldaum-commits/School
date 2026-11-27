'use strict';
/* ================= Rechenblitz-Musik: selbst komponiert, im Code erzeugt (Web Audio, keine Samples) =================
   Neu am 18.11. (Marcel: „muss viel moderner werden“): weg vom Piep-Chiptune, hin zu einem warmen, modernen Klang –
   Hall und Echo, breite Flächen (mehrere leicht verstimmte Sägezähne), Sub-Bass, Kick mit „Pumpen“ (Sidechain),
   geschüttelte Hi-Hats, Klavier-/Rhodes-Akkorde und ein gezupfter Lead. Erkennungsmotiv „Blitz-Zickzack“: E – H – A – E.
   Vier Stücke, alle mit Grundton E:
     Menü     – Lo-Fi/Chillhop (84 BPM, geswingt, Rhodes, weiche Drums)
     Spiel    – leichter Future-Pop (110 BPM, Flächen, Pluck-Melodie, Pumpen)
     Blitz    – Dance (126 BPM, treibende Kick, Arpeggios, Build-ups)
     Dungeon  – dunkler Trap (72 BPM halbes Tempo, 808-Bass mit Glide, Glocken, Hi-Hat-Wirbel)
   Jede Schleife ändert sich (Melodie aus Bausteinen + Zufall, Breakdown, Pausen). Start: Web beim ersten Tippen, Android-App sofort. */
const MOTIF = [0, 7, 5, 12];   // Blitz-Zickzack, Halbtöne über dem Grundton
// Akkorde als Halbtöne über E (Basston, Stimmen)
const TRACKS = {
  menu: { bpm: 84, swing: .14, scale: [0, 2, 4, 7, 9], minor: false,       // E-Dur-Pentatonik
    chords: [[0, [4, 7, 11, 14]], [-3, [0, 4, 7, 11]], [-7, [4, 7, 11, 16]], [-5, [2, 7, 11, 14]]],   // Emaj9 – C#m7 – Amaj9 – B6
    kick: 'x.........x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx', pad: 'keys', lead: 'keys', bass: 'sub', dens: .5, vol: 1 },
  game: { bpm: 110, swing: 0, scale: [0, 3, 5, 7, 10], minor: true,          // E-Moll-Pentatonik
    chords: [[0, [3, 7, 10, 14]], [-4, [0, 4, 7, 11]], [3, [4, 7, 11, 14]], [-2, [2, 7, 9, 14]]],    // Em9 – Cmaj7 – Gadd9 – Dsus
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', pad: 'saw', lead: 'pluck', bass: 'pulse', dens: .6, vol: .9 },
  blitz: { bpm: 126, swing: 0, scale: [0, 3, 5, 7, 10], minor: true,
    chords: [[0, [3, 7, 10, 15]], [-4, [0, 4, 7, 12]], [3, [4, 7, 11, 14]], [-2, [2, 7, 9, 14]]],
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', pad: 'saw', lead: 'arp', bass: 'offbeat', dens: .7, vol: .85 },
  dungeon: { bpm: 72, swing: 0, scale: [0, 1, 3, 7, 8], minor: true,       // E-phrygisch (dunkel)
    chords: [[0, [3, 7, 12]], [1, [4, 7, 12]], [0, [3, 7, 10]], [-2, [2, 5, 10]]],
    kick: 'x......x..x.....', snare: '........x.......', hat: 'x.x.x.xxx.x.x.x.', pad: 'dark', lead: 'bell', bass: '808', dens: .4, vol: .95 },
};
const RHYTHMS = [   // [Startschritt, Länge] in Sechzehnteln – singbare Phrasen mit Pausen
  [[0, 3], [3, 3], [6, 2], [10, 2], [12, 4]],
  [[0, 2], [2, 2], [4, 4], [12, 2], [14, 2]],
  [[2, 2], [4, 2], [6, 6], [14, 2]],
  [[0, 6], [8, 2], [10, 2], [12, 4]],
  [[0, 2], [3, 2], [6, 2], [8, 8]],
  [[4, 2], [6, 2], [8, 3], [11, 5]],
];
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const E2 = 40;   // Grundton E (Bass-Lage)

const Music = {
  scene: 'home', cur: null, timer: null, gain: null, noise: null, fx: null,
  st: null,   // Zustand des laufenden Stücks
  on: () => musicOn(),
  level: () => (S.settings.musicVol ?? 50) / 100,
  // Mischpult: Musik-Ausgang mit Hall (Faltung) und Echo (punktierte Achtel), Flächen-Bus mit Pumpen
  out() {
    const c = Sound.ctx; if (!c) return null;
    if (!this.noise) { const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0); let s = 7; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; } this.noise = b; }
    if (!this.gain) {
      this.gain = c.createGain(); this.gain.gain.value = 0; this.gain.connect(Sound.bus);
      const rev = c.createConvolver(), len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let s = 11 + ch; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 1073741823.5 - 1) * (1 - i / len) ** 2.6; } }
      rev.buffer = ir; const revIn = c.createGain(); revIn.gain.value = .55; const revLp = c.createBiquadFilter(); revLp.type = 'lowpass'; revLp.frequency.value = 5200;
      revIn.connect(rev).connect(revLp).connect(this.gain);
      const dl = c.createDelay(1), fb = c.createGain(), dlIn = c.createGain(), dlLp = c.createBiquadFilter();
      dlLp.type = 'lowpass'; dlLp.frequency.value = 2600; fb.gain.value = .32; dlIn.gain.value = .5;
      dlIn.connect(dl).connect(dlLp).connect(fb).connect(dl); dlLp.connect(this.gain); dlLp.connect(revIn);
      const pad = c.createGain(); pad.connect(this.gain); pad.connect(revIn);   // Flächen: pumpen mit der Kick
      const dry = c.createGain(); dry.connect(this.gain);
      this.fx = { rev: revIn, dl, dlIn, pad, dry };
    }
    return this.gain;
  },
  // Welche Musik gehört zum Bildschirm? (null = Stille)
  want(id) {
    if (id === 'game' && typeof G !== 'undefined' && G) {
      if (G.assign || G.cfg?.quiet || G.mode === 'test') return null;   // Aufträge von Lehrkräften, Einstufungstest: ohne Musik
      return G.mode === 'blitz' ? 'blitz' : G.mode === 'dungeon' ? 'dungeon' : G.cfg?.calm ? 'menu' : 'game';
    }
    if (id === 'duel') return 'blitz';
    if (id === 'home') return 'menu';
    return this.cur;   // Ergebnis: Stück läuft aus und geht ins Menü über
  },
  setScene(id) { this.scene = id; this.update(); },
  update() {
    const t = this.on() && !document.hidden && Sound.ctx && Sound.ctx.state === 'running' ? this.want(this.scene) : null;
    if (t === this.cur && (t === null || this.timer)) { this.applyVol(); return; }
    this.stop(); if (t) this.start(t);
  },
  applyVol() { if (this.gain && Sound.ctx) this.gain.gain.setTargetAtTime(this.cur ? .3 * this.level() * (TRACKS[this.cur]?.vol || 1) : 0, Sound.ctx.currentTime, .25); },
  start(name) {
    const g = this.out(); if (!g) return;
    const c = Sound.ctx, tr = TRACKS[name];
    this.cur = name;
    this.fx.dl.delayTime.value = 60 / tr.bpm * .75;   // punktierte Achtel
    this.st = { tr, step: 0, bar: 0, loop: 0, t: c.currentTime + .15, seed: (Date.now() & 0xffff) || 1, prev: 64 + 7, sect: 'A', rest: 0, intro: 2 };
    this.applyVol();
    this.timer = setInterval(() => this.tick(), 40); this.tick();
  },
  stop() {
    if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null;
    if (this.gain && Sound.ctx) { const c = Sound.ctx; this.gain.gain.cancelScheduledValues(c.currentTime); this.gain.gain.setTargetAtTime(0, c.currentTime, .12);
      const old = this.gain; this.gain = null; this.fx = null; setTimeout(() => { try { old.disconnect(); } catch {} }, 1500); }
  },
  rnd() { const s = this.st; s.seed = (s.seed * 16807) % 2147483647; return s.seed / 2147483647; },
  tick() {
    const c = Sound.ctx, s = this.st; if (!c || !s || !this.gain) return;
    if (c.state !== 'running') return;
    if (s.t < c.currentTime - .25) s.t = c.currentTime + .05;   // nach einer Pause des Tabs nicht nachholen
    const dt = 60 / s.tr.bpm / 4;
    while (s.t < c.currentTime + .25) {
      const sw = s.step % 2 ? dt * s.tr.swing : 0;   // Swing: jede zweite Sechzehntel etwas später
      this.play(s, s.t + sw, dt); s.t += dt; this.advance(s);
    }
  },
  advance(s) {
    if (++s.step < 16) return;
    s.step = 0; s.bar++;
    if (s.rest > 0) s.rest--;
    if (s.intro > 0) s.intro--;
    if (s.bar % 8 === 0) {   // eine Schleife = 8 Takte
      s.loop++;
      s.sect = s.loop % 4 === 3 ? 'B' : 'A';            // jede 4. Schleife: Breakdown (nur Flächen + Melodie)
      if (s.loop % 6 === 5) s.rest = 1;                  // ab und zu ein Takt Luft
      if (s.loop % 2 === 0) s.seed = (s.seed * 7 + 13) % 2147483647 || 1;   // neue Melodie-Variante
    }
  },
  play(s, t, dt) {
    const tr = s.tr, st = s.step, bar = s.bar % 8, [broot, voicing] = tr.chords[bar % 4], fx = this.fx; if (!fx) return;
    if (s.rest > 0) return;
    const drums = s.intro === 0 && (s.sect === 'A' || bar >= 6), build = s.sect === 'B' && bar >= 6;
    // Flächen / Akkorde: einmal pro Takt (Keys im Menü: geteilt in 2 Anschläge)
    if (st === 0) this.chord(tr, broot, voicing, t, dt * 16);
    if (tr.pad === 'keys' && st === 10 && bar % 2) this.chord(tr, broot, voicing.slice(1), t, dt * 6, .5);
    // Schlagzeug
    if (drums && tr.kick[st] === 'x') { this.kick(t, tr.bass === '808'); this.duck(t, dt); }
    if (build && st % (bar === 7 ? 1 : 2) === 0) this.snare(t, .12 + st / 70, tr);       // Snare-Wirbel vor dem Drop
    if (drums && tr.snare[st] === 'x') this.snare(t, .5, tr);
    if (drums || tr.pad === 'keys') { if (tr.hat[st] === 'x') this.hat(t, (st % 4 === 0 ? .26 : .17) * (.8 + .4 * this.rnd()), st === 14 && tr.bpm > 100);
      if (tr.bass === '808' && drums && bar % 2 && st >= 12 && this.rnd() > .4) { this.hat(t, .12); this.hat(t + dt / 3, .1); this.hat(t + dt * 2 / 3, .1); } }   // Trap-Wirbel
    // Bass
    const bn = E2 + broot;
    if (s.intro === 0) {
      if (tr.bass === 'sub' && (st === 0 || st === 10)) this.bass(bn, t, dt * (st ? 5 : 9), .5);
      if (tr.bass === 'pulse' && st % 4 === 2) this.bass(bn + (st === 14 ? 12 : 0), t, dt * 1.6, .45, true);
      if (tr.bass === 'offbeat' && st % 4 === 2) this.bass(bn + 12, t, dt * 1.7, .42, true);
      if (tr.bass === 'offbeat' && st % 4 === 0 && drums) this.bass(bn, t, dt * .9, .3);
      if (tr.bass === '808' && (st === 0 || (st === 7 && bar % 2) || st === 10)) this.e808(bn, t, dt * (st ? 4 : 7), st === 7 ? bn + 12 : null);
    }
    // Arpeggio (Blitz): schnelle Sechzehntel aus dem Akkord, durch Echo
    if (tr.lead === 'arp' && (drums || build)) { const n = 64 + broot % 12 + voicing[(st + (bar & 1) * 2) % voicing.length] - 12 + (st % 8 >= 4 ? 12 : 0); this.pluck(n, t, dt * .9, .07, .45); }
    // Melodie: im ersten Takt jeder Schleife das Blitz-Motiv, sonst aus Bausteinen
    if (s.sect === 'B' && bar < 4) return;
    if (st === 0) s.rh = bar === 0 ? MOTIF.map((m, i) => [i * 3, i === 3 ? 6 : 3, m]) : RHYTHMS[Math.floor(this.rnd() * RHYTHMS.length)];
    const ev = s.rh && s.rh.find(e => e[0] === st); if (!ev) return;
    if (bar !== 0 && this.rnd() > tr.dens + .15) return;   // Luft in der Melodie
    let n;
    if (bar === 0) n = 64 + ev[2];
    else {
      const pool = [];
      for (let o = 0; o <= 1; o++) for (const d of tr.scale) { const m = 64 + d + 12 * o; if (Math.abs(m - s.prev) <= 7) pool.push(m); }
      n = pool[Math.floor(this.rnd() * pool.length)] ?? 64;
    }
    s.prev = n;
    const len = dt * ev[1];
    if (tr.lead === 'keys') this.keys(n + 12, t, len, .13, true);
    else if (tr.lead === 'bell') this.bell(n + 12, t, len, .1);
    else this.pluck(n + (tr.lead === 'arp' ? 12 : 0), t, len, tr.lead === 'arp' ? .1 : .14, .9);
  },
  // ---------- Instrumente ----------
  env(g, t, a, peak, dur, rel) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(.0001, t + Math.max(a, dur), rel); },
  chord(tr, broot, voicing, t, dur, vel = 1) {
    const base = 52 + broot;   // Akkord um E3
    if (tr.pad === 'keys') voicing.forEach((v, i) => this.keys(base + v, t + i * .012, dur * .9, .075 * vel));
    else for (const v of voicing) this.pad(base + v, t, dur, tr.pad === 'dark' ? .045 : .038, tr.pad === 'dark' ? 900 : 1700);
  },
  pad(m, t, dur, vol, cut) {   // breite Fläche: 3 verstimmte Sägezähne, weicher Filter, langsamer Ein-/Ausklang
    const c = Sound.ctx, g = c.createGain(), f = c.createBiquadFilter(), pan = c.createStereoPanner ? c.createStereoPanner() : null;
    f.type = 'lowpass'; f.frequency.setValueAtTime(cut * .6, t); f.frequency.linearRampToValueAtTime(cut, t + dur * .5); f.Q.value = .4;
    this.env(g, t, Math.min(.35, dur / 3), vol, dur - .1, .25);
    [-9, 0, 9].forEach((det, i) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det + (i - 1) * 3; o.connect(f); o.start(t); o.stop(t + dur + 1.2); });
    f.connect(g); if (pan) { pan.pan.value = (m % 3 - 1) * .35; g.connect(pan).connect(this.fx.pad); } else g.connect(this.fx.pad);
  },
  keys(m, t, dur, vol, lead = false) {   // Rhodes-artig: Sinus + leiser Oberton, Tremolo
    const c = Sound.ctx, g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = mtof(m); o2.type = 'triangle'; o2.frequency.value = mtof(m) * 2; g2.gain.value = .18;
    f.type = 'lowpass'; f.frequency.value = lead ? 3200 : 2400;
    this.env(g, t, .006, vol, dur * .6, dur * .5 + .15);
    o.connect(f); o2.connect(g2).connect(f); f.connect(g); g.connect(this.fx.dry); g.connect(this.fx.rev);
    if (lead) g.connect(this.fx.dlIn);
    for (const x of [o, o2]) { x.start(t); x.stop(t + dur + 1.5); }
  },
  pluck(m, t, dur, vol, bright) {   // gezupfter Synth: Säge + Rechteck, Filter schließt schnell
    const c = Sound.ctx, g = c.createGain(), f = c.createBiquadFilter(), a = c.createOscillator(), b = c.createOscillator();
    a.type = 'sawtooth'; b.type = 'square'; a.frequency.value = mtof(m); b.frequency.value = mtof(m); b.detune.value = 7;
    f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(900 + 4200 * bright, t); f.frequency.setTargetAtTime(500, t + .01, .09);
    this.env(g, t, .004, vol, Math.min(dur, .18), .12);
    a.connect(f); b.connect(f); f.connect(g); g.connect(this.fx.dry); g.connect(this.fx.dlIn); g.connect(this.fx.rev);
    for (const x of [a, b]) { x.start(t); x.stop(t + dur + .8); }
  },
  bell(m, t, dur, vol) {   // Glocke: Sinus + unharmonischer Oberton (FM-artig), lang ausklingend
    const c = Sound.ctx, g = c.createGain(), o = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
    o.frequency.value = mtof(m); mod.frequency.value = mtof(m) * 3.5; mg.gain.setValueAtTime(mtof(m) * 1.2, t); mg.gain.setTargetAtTime(0, t, .25);
    mod.connect(mg).connect(o.frequency); this.env(g, t, .004, vol, .05, .6);
    o.connect(g); g.connect(this.fx.dry); g.connect(this.fx.rev); g.connect(this.fx.dlIn);
    for (const x of [o, mod]) { x.start(t); x.stop(t + 2.5); }
  },
  bass(m, t, dur, vol, pluck = false) {
    const c = Sound.ctx, g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter();
    o.type = 'sine'; o2.type = pluck ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.setValueAtTime(pluck ? 700 : 320, t); if (pluck) f.frequency.setTargetAtTime(220, t, .08);
    const g2 = c.createGain(); g2.gain.value = pluck ? .35 : .5;
    this.env(g, t, .008, vol, dur * .8, .06);
    o.connect(g); o2.connect(g2).connect(f).connect(g); g.connect(this.fx.dry);
    for (const x of [o, o2]) { x.start(t); x.stop(t + dur + .4); }
  },
  e808(m, t, dur, glideTo) {   // 808-Bass: Sinus mit Pitch-Abfall, leichte Sättigung, optionaler Glide
    const c = Sound.ctx, g = c.createGain(), o = c.createOscillator(), sh = c.createWaveShaper();
    const cur = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cur[i] = Math.tanh(2.2 * x); } sh.curve = cur;
    o.frequency.setValueAtTime(mtof(m + 12), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + .06);
    if (glideTo) o.frequency.setTargetAtTime(mtof(glideTo - 12), t + dur * .5, .05);
    this.env(g, t, .005, .55, dur, .15);
    o.connect(sh).connect(g).connect(this.fx.dry); o.start(t); o.stop(t + dur + .8);
  },
  kick(t, deep = false) {
    const c = Sound.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(deep ? 120 : 160, t); o.frequency.exponentialRampToValueAtTime(deep ? 38 : 46, t + .11);
    g.gain.setValueAtTime(.95, t); g.gain.exponentialRampToValueAtTime(.001, t + (deep ? .5 : .32));
    o.connect(g).connect(this.fx.dry); o.start(t); o.stop(t + .55);
    this.hit(t, .25, 3500, .012, this.fx.dry, 'highpass');   // Klick
  },
  duck(t, dt) { const p = this.fx.pad.gain; p.cancelScheduledValues(t); p.setValueAtTime(.25, t); p.setTargetAtTime(1, t + .02, dt * 1.1); },   // „Pumpen“
  hit(t, vol, freq, len, out, type = 'highpass', q = .7) {
    const c = Sound.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.noise;
    f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    s.connect(f).connect(g).connect(out); s.start(t, Math.random() * .5, len + .03);
  },
  snare(t, v, tr) {   // Clap/Snare: Rauschen mit Hall, im Menü weicher Rimshot
    if (tr && tr.pad === 'keys') { this.hit(t, v * .35, 1800, .06, this.fx.dry, 'bandpass', 2); this.hit(t, v * .22, 1800, .08, this.fx.rev, 'bandpass', 2); return; }
    for (const k of [0, .009, .02]) this.hit(t + k, v * .32, 1400, .09, this.fx.dry, 'bandpass', 1.2);
    this.hit(t, v * .3, 1200, .2, this.fx.rev, 'bandpass', .8);
  },
  hat(t, v, open = false) { this.hit(t, v * .18, 9000, open ? .16 : .03, this.fx.dry, 'highpass'); },
  // Erkennungsmelodie (z. B. beim ersten Start und wenn eine Stufe geschafft ist) – läuft über die Effekte, weich statt piepsig
  sting() { if (!S.settings.sound) return; MOTIF.forEach((m, i) => { Sound.tone(76 + m, i * .085, i === 3 ? .5 : .14, 'triangle', .09); Sound.tone(88 + m, i * .085, .1, 'sine', .035); }); Sound.zap(.3); },
};

// Start (Vorgabe Marcel 17.11.): Android-App sofort beim Öffnen (die WebView braucht keine Berührung für Ton);
// Web: Browser erlauben Ton erst nach einer Berührung – dann beim allerersten Tippen oder Klick irgendwo. „Musik aus“ gilt immer.
(() => {
  let first = true;
  const go = () => {
    Sound.init();
    if (first && Sound.ctx) { first = false; if (S.settings.sound) setTimeout(() => Music.sting(), 120); }
    setTimeout(() => Music.update(), first ? 0 : 50);
  };
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(ev, go, { capture: true, passive: true });
  const autoOk = () => { try { return IS_NATIVE || (navigator.getAutoplayPolicy && navigator.getAutoplayPolicy('audiocontext') === 'allowed'); } catch { return false; } };
  // erst, wenn das Profil geladen ist (Einstellung „Musik aus“)
  const auto = () => { if (typeof S === 'undefined' || !S) return setTimeout(auto, 100); if (autoOk() && musicOn()) go(); };
  setTimeout(auto, 0);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Sound.ctx) Sound.init(); Music.update(); });
})();
