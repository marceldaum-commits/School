'use strict';
/* =====================================================================
   Rechenblitz – App: Speicher & Profile, Sound, Statistik, Abzeichen,
   Startseite, Spielmodi, Ergebnis, Duell, Tageschallenge, Einstufung
   ===================================================================== */
const APP_VERSION = '3.1.0';
const CONFIG = Object.assign({
  reportEndpoint: '',                                   // URL, die Meldungen per POST (JSON) annimmt – siehe MELDUNGEN-API.md
  fallbackMail: 'website@mathenachhilfe-online.com',    // nur falls kein Endpunkt eingerichtet ist
  websiteUrl: 'https://www.mathenachhilfe-online.com/',
  trialUrl: 'https://www.mathenachhilfe-online.com/probestunde/',
  imprintUrl: 'https://www.mathenachhilfe-online.com/impressum/',
  privacyUrl: 'https://www.mathenachhilfe-online.com/datenschutz/#rechenblitz',
  appUrl: '',
  lernraumUrl: '',
  utm: false,
  publicUrl: '',                                        // Adresse für QR-Codes, Flyer, Urkunden, Einladungen
  referralUrl: 'https://www.mathenachhilfe-online.com/freunde-werben/',
  classApi: '',                                         // Server für die Klassen-Challenge (z. B. '/api'); leer = ausgeblendet
  advent: true, adventPreview: 'auto', adventRaffleUrl: '', adventRaffleMin: 12,                                           // true = Website-Links mit utm_source=rechenblitz (nur sinnvoll mit Besucherstatistik)                                      // Rück-Link „← Lernraum“; leer = ausgeblendet                                           // öffentliche Adresse der App (für geteilte Links); leer = aktuelle Adresse
}, window.RECHENBLITZ_CONFIG || {});

const $ = id => document.getElementById(id);
const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayStr = back => todayStr(new Date(Date.now() - back * 864e5));
const fmtDay = s => new Date(s + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
const fmtSec = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const appUrl = () => CONFIG.appUrl || location.href.split('#')[0].split('?')[0];
const DAILY_GOAL = 50;
const EMOJIS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧', '🐨', '🐶', '🐱', '🐵', '🦉', '🐢', '🐬', '🚀'];

/* ================= Speicher & Profile ================= */
const PROFILE_DEFAULT = () => ({
  xp: 0, total: 0, best: {}, box: {}, days: { last: '', streak: 0 }, today: { date: '', solved: 0 },
  settings: { sound: true, speech: false, auto: true, theme: 'auto', klasse: 0 }, sel: { op: 'mul', lvl: 1 },
  autoLvl: {}, facts: {}, stats: {}, hist: {}, badges: {}, star3: {}, played: {}, challenge: {}, assign: null, test: null, zenCount: 0, advent: null, klasse: null, klassePending: [], promoDay: '',
});
let ROOT, S;
function loadRoot() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem('rechenblitz') || 'null'); } catch {}
  if (raw && raw.v === 3) ROOT = raw;
  else {                                       // Daten aus Version 1/2 übernehmen
    const p = Object.assign(PROFILE_DEFAULT(), raw || {});
    p.settings = Object.assign(PROFILE_DEFAULT().settings, (raw && raw.settings) || {});
    const outbox = p.outbox || [], reporter = p.reporter || { name: '', email: '' };
    delete p.outbox; delete p.reporter; delete p.lastReportAt;
    for (const [k, v] of Object.entries(p.box)) if (!v.e) delete p.box[k];
    ROOT = { v: 3, cur: 'p1', profiles: { p1: { id: 'p1', name: 'Ich', emoji: '🦊', data: p } }, outbox, reporter, lastReportAt: 0 };
  }
  ROOT.outbox ||= []; ROOT.reporter ||= { name: '', email: '' };
  useProfile(ROOT.profiles[ROOT.cur] ? ROOT.cur : Object.keys(ROOT.profiles)[0]);
}
function useProfile(id) {
  ROOT.cur = id;
  const d = ROOT.profiles[id].data || {}, def = PROFILE_DEFAULT();
  S = ROOT.profiles[id].data = Object.assign(def, d);
  S.settings = Object.assign(PROFILE_DEFAULT().settings, d.settings || {});
  if (!TOPICS[S.sel.op]) S.sel.op = 'mul';
  const cut = dayStr(70); for (const k of Object.keys(S.hist)) if (k < cut) delete S.hist[k];
}
const save = () => { try { localStorage.setItem('rechenblitz', JSON.stringify(ROOT)); } catch {} };
const profile = () => ROOT.profiles[ROOT.cur];

/* ================= Sound (Web Audio, synthetisch) ================= */
const Sound = {
  ctx: null, master: null,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain(); this.master.gain.value = .6;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(midi, at, dur, type = 'sine', vol = .2, slideTo) {
    if (!S.settings.sound || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(440 * 2 ** ((midi - 69) / 12), t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(440 * 2 ** ((slideTo - 69) / 12), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + .05);
  },
  click() { this.tone(96, 0, .04, 'triangle', .05); },
  correct(streak, base = 72) { const b = base + Math.min(streak - 1, 12); [0, 4, 7].forEach((n, i) => { this.tone(b + n, i * .06, .22, 'sine', .18); this.tone(b + n + 12, i * .06, .12, 'triangle', .04); }); },
  wrong() { this.tone(57, 0, .16, 'triangle', .2); this.tone(52, .13, .32, 'triangle', .2, 50); },
  soft(ok) { ok ? (this.tone(76, 0, .35, 'sine', .09), this.tone(83, .08, .4, 'sine', .05)) : this.tone(64, 0, .4, 'sine', .06); },
  hint() { this.tone(76, 0, .12, 'sine', .12); this.tone(79, .1, .16, 'sine', .12); },
  milestone() { [72, 76, 79, 84, 88].forEach((n, i) => this.tone(n, i * .07, .3, 'square', .06)); this.tone(96, .38, .5, 'sine', .1); },
  tick(high) { this.tone(high ? 84 : 79, 0, .07, 'square', .05); },
  go() { this.tone(84, 0, .35, 'square', .08); this.tone(91, 0, .35, 'sine', .12); },
  badge() { [79, 84, 88, 91].forEach((n, i) => this.tone(n, .9 + i * .09, .35, 'triangle', .09)); },
  fanfare(stars) {
    [60, 64, 67, 72].forEach((n, i) => this.tone(n, i * .12, .25, 'square', .07));
    (stars >= 2 ? [72, 76, 79, 84] : [67, 72, 76]).forEach(n => { this.tone(n, .5, 1.1, 'triangle', .12); this.tone(n, .5, 1.1, 'sine', .08); });
  },
};
function speak(text) {
  if (!S.settings.speech || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 1.0;
  speechSynthesis.speak(u);
}
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

/* ================= Konfetti ================= */
const Confetti = (() => {
  const cv = $('confetti'), cx = cv.getContext('2d');
  let parts = [], running = false;
  const colors = ['#ff7418', '#ffb27d', '#101b43', '#173a74', '#2447b5', '#1f9d55', '#febc2e'];
  function resize() { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; cx.setTransform(r, 0, 0, r, 0, 0); }
  addEventListener('resize', resize); resize();
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.y < innerHeight + 20 && p.life > 0);
    for (const p of parts) {
      p.vy += .25; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2))); cx.restore();
    }
    if (parts.length) requestAnimationFrame(loop); else running = false;
  }
  return {
    burst(n = 80, x = innerWidth / 2, y = innerHeight / 3) {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[Math.floor(Math.random() * colors.length)], life: 180 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    },
  };
})();
function toast(html, ms = 1600) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; d.style.animationDuration = ms + 'ms'; document.body.appendChild(d); setTimeout(() => d.remove(), ms); }

/* ================= Statistik ================= */
function recordAnswer(t, ok, dt) {
  const d = todayStr(), h = S.hist[d] || (S.hist[d] = { n: 0, ok: 0, ms: 0, tp: {} });
  h.n++; if (ok) h.ok++; h.ms += Math.min(dt, 60000);
  const tp = h.tp[t.topic] || (h.tp[t.topic] = [0, 0]); tp[ok ? 0 : 1]++;
  const st = S.stats[`${t.topic}|${t.lvl}`] || (S.stats[`${t.topic}|${t.lvl}`] = { ok: 0, bad: 0 }); ok ? st.ok++ : st.bad++;
  S.played[t.topic] = 1;
  if (t.fact) {
    const f = S.facts[t.fact] || (S.facts[t.fact] = { ok: 0, bad: 0, t: 0, last: 1 });
    if (ok) { f.ok++; f.t = f.t ? f.t * .6 + dt * .4 : dt; } else f.bad++;
    f.last = ok ? 1 : 0;
  }
}
// 0 = noch nicht geübt, 1 = unsicher, 2 = fast, 3 = sicher
function factStatus(k) {
  const f = S.facts[k];
  if (!f) return 0;
  if (!f.last || f.bad > f.ok) return 1;
  if (f.ok >= 3 && f.bad * 4 <= f.ok && f.t < 5000) return 3;
  return 2;
}
ENGINE.weakFact = () => {
  const weak = [];
  for (let a = 2; a <= 10; a++) for (let b = a; b <= 10; b++) { const s = factStatus(`${a}x${b}`); if (s === 1) weak.push([a, b], [a, b]); else if (s === 2) weak.push([a, b]); }
  return weak.length ? pick(weak) : null;
};

/* ================= Abzeichen ================= */
const BADGES = [
  ['first', '🚀', 'Los geht’s', 'Die erste Runde gespielt'],
  ['perfect', '💯', 'Fehlerfrei', 'Ein Training mit 100 % beendet'],
  ['streak10', '🔥', 'Heiße Serie', '10 richtig in Folge'],
  ['streak25', '☄️', 'Unaufhaltsam', '25 richtig in Folge'],
  ['days3', '📅', 'Dranbleiber', '3 Tage in Folge geübt'],
  ['days7', '🗓️', 'Wochen-Held', '7 Tage in Folge geübt'],
  ['days30', '🏅', 'Monats-Meister', '30 Tage in Folge geübt'],
  ['solved100', '💪', 'Hundert', '100 Aufgaben gelöst'],
  ['solved500', '🏋️', 'Fünfhundert', '500 Aufgaben gelöst'],
  ['solved2000', '🏆', 'Rechenmaschine', '2000 Aufgaben gelöst'],
  ['goal', '🎯', 'Tagesziel', 'Das Tagesziel geschafft'],
  ['blitz25', '⚡', 'Blitzschnell', '25 richtige in einer Blitzrunde'],
  ['box', '📦', 'Aufgeräumt', 'Die Fehlerkiste geleert'],
  ['explorer', '🧭', 'Entdecker', '8 verschiedene Themen geübt'],
  ['allstar', '🌟', 'Alleskönner', 'In 5 Themen 3 Sterne geholt'],
  ['frac', '🍕', 'Bruch-Profi', 'Brüche ab Stufe 3 mit 3 Sternen'],
  ['dec', '🔢', 'Komma-Profi', 'Dezimalzahlen ab Stufe 3 mit 3 Sternen'],
  ['pct', '🏷️', 'Prozent-Profi', 'Prozent ab Stufe 3 mit 3 Sternen'],
  ['eq', '⚖️', 'Gleichungs-Löser', 'Gleichungen ab Stufe 3 mit 3 Sternen'],
  ['word', '📖', 'Textaufgaben-Fuchs', 'Textaufgaben ab Stufe 3 mit 3 Sternen'],
  ['table', '👑', 'Einmaleins-König', 'Das ganze kleine Einmaleins sicher'],
  ['challenge', '📆', 'Herausforderer', 'Eine Tageschallenge gespielt'],
  ['challenge10', '🥇', 'Perfekter Tag', '10 von 10 in der Tageschallenge'],
  ['duel', '⚔️', 'Duellant', 'Ein Duell gespielt'],
  ['test', '🧪', 'Vermessen', 'Den Einstufungstest gemacht'],
  ['zen', '🍃', 'Ruhepol', '20 Aufgaben im ruhigen Modus'],
  ['teacher', '📝', 'Auftrag erledigt', 'Einen Auftrag der Lehrkraft erfüllt'],
  ['night', '🦉', 'Nachteule', 'Nach 20 Uhr geübt'],
  ['early', '🐦', 'Frühaufsteher', 'Vor 7:30 Uhr geübt'],
  ['advent', '🎄', 'Adventsrechner', 'Ein Türchen im Adventskalender geöffnet'],
  ['advent24', '🌟', 'Weihnachtsprofi', 'Alle 24 Türchen geschafft'],
  ['klasse', '🏫', 'Teamplayer', 'Einer Klassen-Challenge beigetreten'],
].map(([id, icon, name, desc]) => ({ id, icon, name, desc }));
let newBadges = [];
function award(id) { if (!S.badges[id]) { S.badges[id] = todayStr(); newBadges.push(id); } }
function checkGlobalBadges() {
  if (S.days.streak >= 3) award('days3'); if (S.days.streak >= 7) award('days7'); if (S.days.streak >= 30) award('days30');
  if (S.total >= 100) award('solved100'); if (S.total >= 500) award('solved500'); if (S.total >= 2000) award('solved2000');
  if (Object.keys(S.played).length >= 8) award('explorer');
  if (Object.keys(S.star3).length >= 5) award('allstar');
  if (S.zenCount >= 20) award('zen');
  let all = true; for (let a = 2; a <= 10 && all; a++) for (let b = a; b <= 10; b++) if (factStatus(`${a}x${b}`) !== 3) { all = false; break; }
  if (all) award('table');
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 20) award('night'); if (h < 7.5) award('early');
}
function announceBadges() {
  newBadges.forEach((id, i) => { const b = BADGES.find(x => x.id === id); setTimeout(() => toast(`${b.icon} Abzeichen: <b>${esc(b.name)}</b>`, 2200), 1200 + i * 2300); });
  if (newBadges.length) Sound.badge();
  const out = newBadges; newBadges = []; return out;
}

/* ================= Startseite ================= */
const RANKS = ['Rechen-Starter', 'Zahlenfuchs', 'Rechenprofi', 'Kopfrechen-Ass', 'Mathe-Meister', 'Zahlen-Genie', 'Rechenblitz-Legende'];
const levelFromXp = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpForLevel = l => 40 * (l - 1) ** 2;
const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
function applyTheme() { document.documentElement.dataset.theme = S.settings.theme; }
const isDark = () => S.settings.theme === 'dark' || (S.settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
const defaultLevel = op => (S.settings.klasse && classLevel(S.settings.klasse, op)) ?? 1;
const currentLevel = op => S.sel.lvl === 'auto' ? (S.autoLvl[op] ?? defaultLevel(op)) : S.sel.lvl;
const streakDays = () => (S.days.last === todayStr() || S.days.last === dayStr(1)) ? S.days.streak : 0;

function renderHome() {
  const p = profile();
  $('btnProfile').innerHTML = `<span class="av">${p.emoji}</span><span class="pn">${esc(p.name)}</span>`;
  const lv = levelFromXp(S.xp), cur = xpForLevel(lv), nxt = xpForLevel(lv + 1);
  $('pLevel').textContent = lv;
  $('pRank').textContent = RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 3))];
  $('pXpBar').style.width = ((S.xp - cur) / (nxt - cur) * 100) + '%';
  $('pXpText').textContent = `${S.xp - cur} / ${nxt - cur} XP bis Stufe ${lv + 1}`;
  $('sDays').textContent = streakDays();
  $('sToday').textContent = `${S.today.date === todayStr() ? S.today.solved : 0}/${DAILY_GOAL}`;
  $('sTotal').textContent = S.total;
  $('qBadges').innerHTML = `🏅 Abzeichen <b>${Object.keys(S.badges).length}/${BADGES.length}</b>`;
  renderSoundIcons();
  renderAssignCard(); renderChallengeCard();

  // Themen (im Klassenmodus nur passende)
  const k = S.settings.klasse, vis = k && !homeShowAll ? classTopicSet(k) : null;
  if (vis && !vis.has(S.sel.op)) S.sel.op = [...vis][1] || 'mix';
  $('classNote').innerHTML = k ? `Themen für <b>Klasse ${k}</b> · <button class="linkbtn" id="toggleAll">${homeShowAll ? 'nur passende zeigen' : 'alle Themen zeigen'}</button>` : '';
  $('topics').innerHTML = GROUPS.map((g, gi) => {
    const items = Object.entries(TOPICS).filter(([tk, o]) => o.grp === gi && (!vis || vis.has(tk)));
    if (!items.length) return '';
    return `<div class="tgroup"><div class="tglabel">${g}</div><div class="topics ${gi === 3 ? 'wide' : ''}">${items.map(([tk, o]) =>
      `<button class="topic ${S.sel.op === tk ? 'sel' : ''}" data-op="${tk}" aria-pressed="${S.sel.op === tk}"><span class="g">${o.g}</span><small>${o.name}</small></button>`).join('')}</div></div>`;
  }).join('');
  $('levels').innerHTML = [0, 1, 2, 3, 4].map(i => `<button class="lvl ${S.sel.lvl === i ? 'sel' : ''}" data-lvl="${i}">${i + 1}</button>`).join('')
    + `<button class="lvl auto ${S.sel.lvl === 'auto' ? 'sel' : ''}" data-lvl="auto" title="Stufe passt sich automatisch an">Auto</button>`;
  const L = currentLevel(S.sel.op);
  $('lvlDesc').innerHTML = S.sel.lvl === 'auto' ? `<b>Automatisch</b> – gerade Stufe ${L + 1}: ${LEVEL_DESC[S.sel.op][L]}` : LEVEL_DESC[S.sel.op][S.sel.lvl];
  for (const m of ['training', 'blitz']) {
    const b = S.best[`${m}|${S.sel.op}|${S.sel.lvl === 'auto' ? 'A' : S.sel.lvl}`];
    $('best-' + m).innerHTML = b ? `Rekord<br><b>${b}</b>` : '';
  }
  const n = Object.keys(S.box).length;
  $('btnFehler').disabled = n === 0;
  $('fehlerText').textContent = n ? `${n} Aufgabe${n > 1 ? 'n' : ''} zum Wiederholen` : 'Leer – super gemacht!';
  $('testText').textContent = S.test ? `Zuletzt: Klasse ${S.test.k}, ${fmtDay(S.test.date)} – nochmal testen` : 'In 5 Minuten herausfinden, welche Stufen passen';
  if (typeof renderExtrasHome === 'function') renderExtrasHome();
}
let homeShowAll = false;
$('topics').addEventListener('click', e => {
  const b = e.target.closest('.topic'); if (!b) return;
  Sound.init(); Sound.click(); S.sel.op = b.dataset.op;
  if (S.settings.klasse && S.sel.lvl !== 'auto') { const r = classLevel(S.settings.klasse, S.sel.op); if (r != null) S.sel.lvl = r; }
  save(); renderHome();
});
$('classNote').addEventListener('click', e => { if (e.target.id === 'toggleAll') { homeShowAll = !homeShowAll; renderHome(); } });
$('levels').addEventListener('click', e => { const b = e.target.closest('.lvl'); if (!b) return; Sound.init(); Sound.click(); S.sel.lvl = b.dataset.lvl === 'auto' ? 'auto' : +b.dataset.lvl; save(); renderHome(); });
function renderSoundIcons() { for (const id of ['btnSound', 'btnSoundG']) { $(id).innerHTML = S.settings.sound ? ICON_SOUND_ON : ICON_SOUND_OFF; $(id).title = S.settings.sound ? 'Ton aus' : 'Ton an'; } }
const toggleSound = () => { S.settings.sound = !S.settings.sound; save(); Sound.init(); Sound.click(); renderSoundIcons(); toast(S.settings.sound ? '🔊 Ton an' : '🔇 Ton aus', 1100); };
const toggleTheme = () => { S.settings.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); };
$('btnSound').onclick = $('btnSoundG').onclick = toggleSound;
$('btnTheme').onclick = $('btnThemeG').onclick = toggleTheme;
$('modes').addEventListener('click', e => {
  const b = e.target.closest('[data-mode]'); if (!b) return;
  const m = b.dataset.mode;
  if (m === 'duel') return startDuel();
  if (m === 'test') return openSheet('testStart');
  startGame(m);
});

function show(id) {
  for (const s of ['home', 'game', 'result', 'duel']) $(s).hidden = s !== id;
  document.body.classList.toggle('ingame', id === 'game');
  document.body.classList.toggle('induel', id === 'duel');
  scrollTo(0, 0);
}
const currentScreen = () => ['home', 'game', 'result', 'duel'].find(s => !$(s).hidden);
function goHome() { show('home'); renderHome(); }

/* ---------- Auftrag der Lehrkraft (Karte) ---------- */
function renderAssignCard() {
  const a = S.assign, el = $('assignCard');
  if (!a) { el.hidden = true; return; }
  el.hidden = false;
  const done = a.runs.filter(r => r.ok).length, finished = done >= a.r;
  const what = `${TOPICS[a.op].name} · Stufe ${a.l + 1} · ${a.r}× ${a.m === 'blitz' ? 'Blitzrunde' : 'Training'}${a.min ? ` (mind. ${a.min} %)` : ''}`;
  el.innerHTML = `<div class="ac-top"><div class="ac-ico">📝</div><div><div class="eyebrow">Auftrag${a.by ? ' von ' + esc(a.by) : ''}</div><b>${esc(a.t || what)}</b>${a.t ? `<div class="muted small">${what}</div>` : ''}</div></div>
    <div class="dots">${Array.from({ length: a.r }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')}<span class="muted small">${done}/${a.r} erledigt${a.due ? ` · bis ${fmtDay(a.due)}` : ''}</span></div>
    ${finished ? `<p class="small" style="margin:6px 0 10px">Geschafft! Schick deiner Lehrkraft jetzt dein Ergebnis.</p><div class="row2"><button class="btn primary" id="acSend">Ergebnis senden</button><button class="btn" id="acRemove">Entfernen</button></div>`
    : `<div class="row2"><button class="btn primary" id="acStart">Jetzt üben</button><button class="btn" id="acRemove">Entfernen</button></div>`}`;
  $('acStart') && ($('acStart').onclick = startAssignment);
  $('acSend') && ($('acSend').onclick = () => shareAssignResult());
  $('acRemove').onclick = () => { if (confirm('Auftrag entfernen?')) { S.assign = null; save(); renderHome(); } };
}
function startAssignment() {
  const a = S.assign, i = a.runs.length, opts = { op: a.op, lvl: a.l, assign: true };
  if (a.s) opts.queue = withSeed(a.s + i, () => Array.from({ length: a.m === 'blitz' ? 150 : 20 }, () => makeTask(a.op, a.l)));
  startGame(a.m === 'blitz' ? 'blitz' : 'training', opts);
}
function shareAssignResult() {
  const a = S.assign;
  const data = { i: a.i, t: a.t, by: a.by, n: profile().name, op: a.op, l: a.l, m: a.m, r: a.r, min: a.min, runs: a.runs };
  const url = `${appUrl()}#ergebnis=${b64e(data)}`;
  const done = a.runs.filter(r => r.ok).length;
  shareText(`Rechenblitz – Ergebnis von ${profile().name}\n${a.t || TOPICS[a.op].name + ' Stufe ' + (a.l + 1)}: ${done}/${a.r} Runden geschafft\nAlle Details: ${url}`, 'Rechenblitz-Ergebnis', url);
}
const b64e = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
async function shareText(text, title, url) {
  if (navigator.share) { try { await navigator.share({ title, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert ✓'); }
  catch { openSheet('shareBox', { text, url }); }
}

/* ---------- Tageschallenge ---------- */
const challengeTier = () => S.settings.klasse && S.settings.klasse <= 4 ? 'A' : 'B';
function challengeTasks(date = todayStr(), tier = challengeTier()) {
  return withSeed(hashStr(`rechenblitz-${date}-${tier}`), () => {
    const topics = tier === 'A' ? ['add', 'sub', 'mul', 'div', 'gap', 'order', 'unit', 'word'] : ['add', 'sub', 'mul', 'div', 'gap', 'frac', 'dec', 'pct', 'neg', 'pow', 'order', 'round', 'unit', 'divis', 'eq', 'word'];
    const lv = tier === 'A' ? [0, 0, 1, 1, 1, 1, 2, 2, 2, 2] : [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
    return lv.map(l => makeTask(pick(topics), l));
  });
}
function renderChallengeCard() {
  const c = S.challenge, done = c.date === todayStr(), tierName = challengeTier() === 'A' ? 'Grundschule' : 'ab Klasse 5';
  $('challengeCard').innerHTML = `<div class="ch-ico">📆</div><div class="ch-txt"><b>Tageschallenge</b><span>${done ? `Heute: ${c.correct}/10 in ${fmtSec(c.ms)} ${c.marks}` : `10 Aufgaben – heute für alle gleich (${tierName})`}</span></div>
    ${done ? '<button class="btn small" id="chShare">Teilen</button>' : '<button class="btn small primary" id="chStart">Los</button>'}`;
  $('chStart') && ($('chStart').onclick = () => startGame('challenge', { queue: challengeTasks(), op: 'mix', lvl: 0 }));
  $('chShare') && ($('chShare').onclick = shareChallenge);
}
function shareChallenge() {
  const c = S.challenge;
  shareText(`Rechenblitz – Tageschallenge ${fmtDay(c.date)}\n${c.marks}\n${c.correct}/10 richtig in ${fmtSec(c.ms)}\nSchaffst du mehr? ${appUrl()}`, 'Rechenblitz Tageschallenge');
}

/* ================= Spiel ================= */
const MODE_CFG = {
  training: { title: 'Training', count: 20, steps: true, points: true },
  blitz: { title: 'Blitzrunde', timed: 60000, points: true },
  fehler: { title: 'Fehlerkiste', steps: true, points: true },
  zen: { title: 'Ruhig üben', count: Infinity, steps: true, calm: true },
  challenge: { title: 'Tageschallenge', count: 10, points: true },
  test: { title: 'Einstufungstest', quiet: true },
  row: { title: 'Reihe üben', count: 20, steps: true, points: true },
  advent: { title: 'Adventskalender', count: 5, steps: true, points: true },
};
let G = null, timerRaf = 0, lastAnswered = null;

const PAD = ['7', '8', '9', 'del', '4', '5', '6', '/', '1', '2', '3', ',', 'neg', '0', 'ok'];
const PAD_LABEL = { del: '⌫', '/': '<span style="font-size:.6em">a/b</span>', ',': ',', neg: '±', ok: 'OK' };
const PAD_ARIA = { del: 'Löschen', '/': 'Bruchstrich', ',': 'Komma', neg: 'Vorzeichen', ok: 'Prüfen' };
const padHtml = () => PAD.map(k => `<button class="key ${k === 'ok' ? 'ok' : /\d/.test(k) ? '' : 'fn'}" data-k="${k}" aria-label="${PAD_ARIA[k] || k}">${PAD_LABEL[k] || k}</button>`).join('');
$('pad').innerHTML = padHtml();
$('pad').addEventListener('pointerdown', e => { const b = e.target.closest('.key'); if (!b) return; e.preventDefault(); press(b.dataset.k); });
$('pad').addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('.key'); if (b) press(b.dataset.k); } });

function startGame(mode, opts = {}) {
  Sound.init();
  const cfg = MODE_CFG[mode], op = opts.op ?? S.sel.op;
  const adapt = !opts.queue && !opts.gen && opts.lvl == null && S.sel.lvl === 'auto' && ['training', 'blitz', 'zen'].includes(mode);
  const lvl = opts.lvl ?? currentLevel(op);
  G = { mode, cfg, op, lvl, adapt, win: [], idx: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, score: 0, input: '', task: null, locked: true,
    mistakes: [], results: [], times: [], recent: [], queue: opts.queue || null, gen: opts.gen || null, title: opts.title, assign: !!opts.assign,
    testPlan: opts.testPlan, klasse: opts.klasse, door: opts.door, endAt: 0, lastTick: 99, over: false, paused: false, waiting: false, started: Date.now() };
  if (mode === 'fehler') G.queue = shuffle(Object.values(S.box)).slice(0, 15).map(x => ({ ...x }));
  G.total = G.queue ? (cfg.timed ? Infinity : G.queue.length) : cfg.timed ? Infinity : cfg.count;
  $('game').classList.toggle('calm', !!(cfg.calm || cfg.quiet));
  $('gBarFill').style.width = cfg.timed ? '100%' : '0%';
  for (const id of ['expr', 'hint', 'unit', 'pre', 'feedback']) $(id).textContent = '';
  $('answer').className = 'answer'; $('answer').textContent = ''; $('solution').hidden = true;
  $('winTitle').textContent = G.title || (mode === 'training' || mode === 'blitz' || mode === 'zen' ? TOPICS[op].name : cfg.title);
  updateHud(); show('game');
  const go = () => {
    if (!G || G.over) return;
    G.locked = false;
    if (cfg.timed) G.endAt = performance.now() + cfg.timed;
    if (Sheet.open) pauseGame(true);
    cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(timerLoop);
    nextTask();
  };
  cfg.calm ? go() : countdown(go);
}

function countdown(done) {
  const ov = $('overlay'); let n = 3;
  const step = () => {
    if ((!G || G.over) && !DU) { ov.innerHTML = ''; return; }
    if (n === 0) { ov.innerHTML = '<div class="count">Los!</div>'; Sound.go(); setTimeout(() => { ov.innerHTML = ''; }, 500); done(); return; }
    ov.innerHTML = `<div class="count">${n}</div>`; Sound.tick(false); n--; setTimeout(step, 650);
  };
  step();
}

function fitExpr() {
  const el = $('expr'), box = $('taskBox');
  const story = !!G.task.story;
  const desk = innerWidth >= 1000 && innerHeight >= 640;
  let size = story ? (desk ? 26 : innerHeight < 620 ? 16 : 19) : desk ? 84 : innerHeight < 620 ? 40 : innerHeight < 760 ? 48 : 56;
  el.style.fontSize = size + 'px';
  while ((el.scrollWidth > box.clientWidth - 20 || box.scrollHeight > box.clientHeight + 1) && size > (story ? 12 : 26)) { size -= story ? 1 : 3; el.style.fontSize = size + 'px'; }
}

function nextTask() {
  if (G.total !== Infinity && G.idx >= G.total) return finish();
  let t;
  if (G.queue) { t = G.queue[G.idx]; if (!t) return finish(); }
  else if (G.gen) t = G.gen();
  else { for (let i = 0; i < 25; i++) { t = makeTask(G.op, G.lvl); if (!G.recent.includes(keyOf(t))) break; } G.recent.push(keyOf(t)); if (G.recent.length > 10) G.recent.shift(); }
  G.task = t; G.input = ''; G.t0 = performance.now(); G.hinted = false;
  $('expr').className = 'expr' + (t.story ? ' storymode' : '');
  $('expr').innerHTML = t.e.map(tokHtml).join('') + (t.noEq ? '' : `<span class="eq">${t.eqSign || '='}</span>`);
  $('hint').textContent = t.hint || '';
  $('unit').textContent = t.unit || '';
  $('pre').textContent = t.pre || '';
  if (G.op === 'mix' || G.queue) $('winTitle').textContent = `${G.mode === 'training' || G.mode === 'blitz' ? '' : G.cfg.title + ' · '}${TOPICS[t.topic].name}`;
  $('winTag').textContent = ['challenge', 'test', 'advent'].includes(G.mode) ? `Aufgabe ${G.idx + 1}/${G.total}` : `Stufe ${t.lvl + 1}${G.adapt ? ' · Auto' : ''}`;
  $('feedback').textContent = ''; $('feedback').className = 'feedback';
  renderAnswer(); updateHud(); fitExpr();
  speak(t.story ? t.e[0].v : taskSpeech(t));
}

function renderAnswer(state) {
  const el = $('answer'), txt = G.input.replace('-', '−');
  el.className = 'answer' + (state ? ' ' + state : G.input ? ' typing' : '');
  if (state) el.textContent = txt || '–';
  else el.innerHTML = txt ? esc(txt) : '<span class="caret"></span>';
}

function editInput(s, k) {
  if (k === 'del') return s.slice(0, -1);
  if (k === 'neg') return s.startsWith('-') ? s.slice(1) : '-' + s;
  if (s.length >= 9) return s;
  if (k === ',') { if (s.includes('/') || s.includes(',')) return s; return s + (/\d$/.test(s) ? ',' : '0,'); }
  if (k === '/') { if (s.includes('/') || s.includes(',') || !/\d$/.test(s)) return s; return s + '/'; }
  return (s === '0' ? '' : s === '-0' ? '-' : s) + k;
}
const autoReady = (input, a) => S.settings.auto && input.length >= canon(a).length && parseInput(input) && !input.endsWith(',');

function press(k) {
  if (!G || Sheet.open || G.paused) return;
  if (G.waiting) { if (k === 'ok') continueAfterSolution(); return; }
  if (G.locked) return;
  if (k === 'ok') return submit();
  G.input = editInput(G.input, k); Sound.click(); renderAnswer();
  if (k !== 'del' && autoReady(G.input, G.task.a)) submit();
}

function submit() {
  if (!G || G.locked || G.input === '') return;
  const p = parseInput(G.input), t = G.task, a = t.a;
  if (!p) { $('feedback').className = 'feedback info'; $('feedback').textContent = 'Diese Eingabe verstehe ich nicht.'; return; }
  const equal = p.q.n === a.q.n && p.q.d === a.q.d;
  if (equal && p.frac && !p.reduced && !G.hinted) {           // richtig, aber nicht gekürzt → zweite Chance
    G.hinted = true; Sound.hint();
    $('feedback').className = 'feedback info'; $('feedback').textContent = a.q.d === 1 ? 'Stimmt – schreib es als ganze Zahl!' : 'Stimmt – aber kürze noch vollständig!';
    G.input = ''; renderAnswer(); return;
  }
  const dt = performance.now() - G.t0, key = keyOf(t), cfg = G.cfg;
  G.locked = true; G.idx++;
  lastAnswered = { task: taskText(t) + (t.noEq ? '' : ` ${t.eqSign || '='} ?`), given: G.input.replace('-', '−'), expected: showAns(a) + (t.unit ? ' ' + t.unit : ''), correct: equal, topic: TOPICS[t.topic].name, level: t.lvl + 1, mode: G.mode, _task: t };
  recordAnswer(t, equal, dt);
  G.results.push({ ok: equal, topic: t.topic, lvl: t.lvl });
  if (equal) {
    G.correct++; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.times.push(dt);
    if (S.box[key] && --S.box[key].need <= 0) { delete S.box[key]; if (G.mode === 'fehler' && !Object.keys(S.box).length) award('box'); }
    renderAnswer('ok');
    if (cfg.calm || cfg.quiet) Sound.soft(true);
    else {
      Sound.correct(G.streak);
      if (cfg.points) {
        const pts = Math.round((10 + Math.min(G.streak, 10) * 2 + (dt < (t.story ? 15000 : 4000) ? 5 : 0)) * (1 + t.lvl * .5));
        G.score += pts;
        const f = document.createElement('div'); f.className = 'float'; f.textContent = '+' + pts; $('taskBox').appendChild(f); setTimeout(() => f.remove(), 800);
      }
      if (G.streak % 5 === 0) {
        setTimeout(() => Sound.milestone(), 150);
        toast(G.streak >= 15 ? `<b>${G.streak}</b> richtig in Folge – Wahnsinn!` : G.streak >= 10 ? `<b>${G.streak}</b> richtig in Folge – stark!` : '<b>5</b> richtig in Folge!');
        Confetti.burst(40 + G.streak * 2);
      }
    }
    adaptStep(true, dt); updateHud(); save();
    setTimeout(() => { if (!G.over) { G.locked = false; nextTask(); } }, cfg.calm ? 700 : 400);
    return;
  }
  G.wrong++; G.streak = 0;
  G.mistakes.push({ ...lastAnswered });
  S.box[key] = { topic: t.topic, lvl: t.lvl, e: t.e, a: t.a, hint: t.hint, unit: t.unit, pre: t.pre, noEq: t.noEq, eqSign: t.eqSign, story: t.story, w: t.w, need: 2 };
  if (cfg.calm || cfg.quiet) Sound.soft(false); else { Sound.wrong(); vibrate(60); }
  renderAnswer('no'); adaptStep(false, dt); updateHud(); save();
  if (cfg.steps) { setTimeout(() => showSolution(t), 450); return; }
  $('feedback').className = 'feedback no';
  $('feedback').innerHTML = `Richtig ist: <span class="fx">${esc(showAns(a))}${t.unit ? ' ' + esc(t.unit) : ''}</span>`;
  setTimeout(() => { if (!G.over) { G.locked = false; nextTask(); } }, cfg.timed ? 1200 : 1600);
}

/* Lösungsweg nach einem Fehler */
function showSolution(t) {
  if (!G || G.over) return;
  G.waiting = true;
  $('solution').innerHTML = `<div class="sol-head"><b>So geht’s</b><span>Richtig ist: <span class="fx">${esc(showAns(t.a))}${t.unit ? ' ' + esc(t.unit) : ''}</span></span></div>
    <ol class="steps">${(t.w || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <button class="btn primary block" id="solNext">Weiter <span class="muted-on-dark">(OK)</span></button>`;
  $('solution').hidden = false;
  $('solNext').onclick = continueAfterSolution;
}
function continueAfterSolution() {
  if (!G || !G.waiting) return;
  G.waiting = false; $('solution').hidden = true; Sound.click();
  G.locked = false; nextTask();
}

/* Stufe passt sich an */
function adaptStep(ok, dt) {
  if (!G.adapt) return;
  const fast = dt < (G.task.story ? 25000 : 7000);
  G.win.push(ok ? (fast ? 2 : 1) : 0); if (G.win.length > 6) G.win.shift();
  const l5 = G.win.slice(-5), l4 = G.win.slice(-4);
  if (l5.length === 5 && l5.every(v => v > 0) && l5.filter(v => v === 2).length >= 4 && G.lvl < 4) {
    G.lvl++; G.win = []; setTimeout(() => toast(`⬆ <b>Stufe ${G.lvl + 1}</b> – du wirst besser!`, 1800), 450);
  } else if (l4.filter(v => v === 0).length >= 2 && G.lvl > 0) {
    G.lvl--; G.win = []; setTimeout(() => toast(`Etwas leichter: <b>Stufe ${G.lvl + 1}</b>`, 1800), 450);
  }
  S.autoLvl[G.op] = G.lvl;
}

function updateHud() {
  $('gStreak').textContent = `🔥 ${G.streak}`;
  $('gStreak').classList.toggle('hot', G.streak >= 5);
  $('gScore').textContent = G.cfg.points ? `${G.score} Punkte` : '';
  if (G.cfg.timed) return;
  if (G.total === Infinity) { $('gInfo').textContent = `${G.correct} ✓`; $('gBarFill').style.width = '0%'; return; }
  $('gInfo').textContent = `${Math.min(G.idx + 1, G.total)}/${G.total}`;
  $('gBarFill').style.width = (G.idx / G.total * 100) + '%';
}

function timerLoop() {
  if (!G || G.over) return;
  if (G.cfg.timed && !G.paused && G.endAt) {
    const left = Math.max(0, G.endAt - performance.now()), sec = Math.ceil(left / 1000);
    $('gBarFill').style.width = (left / G.cfg.timed * 100) + '%';
    $('gInfo').textContent = sec + ' s';
    if (sec <= 5 && sec < G.lastTick && sec > 0) Sound.tick(true);
    G.lastTick = sec;
    if (left <= 0) return finish();
  }
  timerRaf = requestAnimationFrame(timerLoop);
}
function pauseGame(on) {
  if (!G || G.over || currentScreen() !== 'game') return;
  const now = performance.now();
  if (on && !G.paused) { G.paused = true; G.pausedAt = now; }
  else if (!on && G.paused) { const d = now - G.pausedAt; G.paused = false; if (G.endAt) G.endAt += d; if (G.t0) G.t0 += d; }
}
function quitGame() {
  if (G && !G.over && G.cfg.calm && G.idx > 0) return finish();   // ruhiges Üben endet mit einer kleinen Übersicht
  if (G) G.over = true; cancelAnimationFrame(timerRaf); $('overlay').innerHTML = '';
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  goHome();
}
$('btnQuit').onclick = () => { Sound.click(); quitGame(); };

/* ================= Ergebnis ================= */
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" stroke-linejoin="round"/></svg>';
function finish() {
  if (G.over) return;
  G.over = true; G.locked = true; G.waiting = false; cancelAnimationFrame(timerRaf); $('solution').hidden = true;
  const cfg = G.cfg, answered = G.correct + G.wrong, acc = answered ? G.correct / answered : 0, today = todayStr();
  let stars = null;
  if (cfg.timed) {
    const f = [1, .8, .6, .45, .3][G.lvl] * (['add', 'sub', 'mul', 'div', 'gap'].includes(G.op) ? 1 : G.op === 'word' ? .35 : .7);
    stars = acc < .7 ? (G.correct >= 8 * f ? 1 : 0) : G.correct >= 26 * f ? 3 : G.correct >= 17 * f ? 2 : G.correct >= 8 * f ? 1 : 0;
  } else if (!cfg.calm && !cfg.quiet && answered) stars = acc >= .95 ? 3 : acc >= .8 ? 2 : acc >= .6 ? 1 : 0;

  let newBest = false;
  if (G.mode === 'training' || G.mode === 'blitz') {
    const bk = `${G.mode}|${G.op}|${G.adapt ? 'A' : G.lvl}`;
    if (G.score > 0 && G.score > (S.best[bk] || 0)) { newBest = !!S.best[bk]; S.best[bk] = G.score; }
  }
  const xp = G.correct * (G.lvl + 1) + (stars || 0) * 10, lvBefore = levelFromXp(S.xp);
  S.xp += xp; S.total += G.correct;
  if (S.today.date !== today) S.today = { date: today, solved: 0 };
  const goalBefore = S.today.solved < DAILY_GOAL;
  S.today.solved += G.correct;
  if (G.correct > 0 && S.days.last !== today) { S.days.streak = S.days.last === dayStr(1) ? S.days.streak + 1 : 1; S.days.last = today; }

  // Abzeichen
  if (answered) award('first');
  if (G.mode === 'training' && answered >= 20 && acc === 1) award('perfect');
  if (G.bestStreak >= 10) award('streak10'); if (G.bestStreak >= 25) award('streak25');
  if (goalBefore && S.today.solved >= DAILY_GOAL) award('goal');
  if (G.mode === 'blitz' && G.correct >= 25) award('blitz25');
  if (stars === 3 && ['training', 'blitz'].includes(G.mode)) { S.star3[G.op] = 1; if (G.lvl >= 2 && ['frac', 'dec', 'pct', 'eq', 'word'].includes(G.op)) award(G.op); }
  if (G.mode === 'zen') S.zenCount += G.correct;

  let extra = '';
  if (G.mode === 'challenge') {
    const marks = G.results.map(r => r.ok ? '🟩' : '🟥').join(''), ms = Date.now() - G.started;
    const first = S.challenge.date !== today;
    if (first) S.challenge = { date: today, correct: G.correct, ms, marks };
    award('challenge'); if (G.correct === 10) award('challenge10');
    extra = `<div class="card"><div class="marks">${marks}</div><p class="muted" style="margin:6px 0 10px">${G.correct}/10 richtig in ${fmtSec(ms)}${first ? '' : ' · Wiederholung (zählt nicht)'}</p><button class="btn primary block" id="rShare">Ergebnis teilen</button></div>`;
  }
  if (G.mode === 'test') extra = finishTest();
  if (G.assign && S.assign) {
    const a = S.assign, ok = Math.round(acc * 100) >= (a.min || 0) && answered > 0;
    a.runs.push({ d: today, sc: G.score, c: G.correct, w: G.wrong, ms: G.times.length ? Math.round(G.times.reduce((x, y) => x + y, 0) / G.times.length) : 0, ok, mi: G.mistakes.slice(0, 8).map(m => [m.task, m.given, m.expected]) });
    const done = a.runs.filter(r => r.ok).length;
    if (done >= a.r) award('teacher');
    extra += `<div class="card assign-note">📝 Auftrag: <b>${done}/${a.r}</b> Runden geschafft${ok ? '' : ` – diese Runde zählt nicht (mind. ${a.min} % nötig)`}${done >= a.r ? '<br><button class="btn primary block" id="rSendAssign" style="margin-top:10px">Ergebnis an Lehrkraft senden</button>' : ''}</div>`;
  }
  extra += extrasAfterGame(acc);
  checkGlobalBadges();
  save();
  renderResult({ stars, acc, xp, lvBefore, newBest, goalBefore, extra, badges: announceBadges() });
}

function renderResult(r) {
  const cfg = G.cfg;
  const title = G.mode === 'test' ? 'Dein <em>Ergebnis</em>' : cfg.calm ? 'Schön <em>geübt!</em>' : ['Weiter <em>üben!</em>', 'Gut <em>gemacht!</em>', '<em>Super!</em>', '<em>Perfekt!</em>'][r.stars ?? 1];
  const avg = G.times.length ? G.times.reduce((a, b) => a + b, 0) / G.times.length : 0;
  let xpText = `+${r.xp} XP · beste Serie: ${G.bestStreak}`;
  if (levelFromXp(S.xp) > r.lvBefore) xpText += ` · Stufe ${levelFromXp(S.xp)} erreicht!`;
  if (r.goalBefore && S.today.solved >= DAILY_GOAL) xpText += ' · Tagesziel geschafft! 🎯';
  if (G.adapt) xpText += ` · Auto-Stufe jetzt ${G.lvl + 1}`;
  $('result').innerHTML = `
    <h2>${title}</h2>
    ${r.stars != null ? `<div class="stars" id="rStars">${STAR + STAR + STAR}</div>` : ''}
    ${cfg.points ? `<div class="card"><div class="big">${G.score}</div><div class="muted">Punkte</div>${r.newBest ? '<span class="newbest">Neuer Rekord!</span>' : ''}</div>` : ''}
    ${r.extra}
    ${G.mode !== 'test' ? `<div class="rgrid"><div class="stat card"><b>${G.correct}</b><span>richtig</span></div><div class="stat card"><b>${Math.round(r.acc * 100)}%</b><span>Treffer</span></div><div class="stat card"><b>${avg ? fmtSec(avg) : '–'}</b><span>pro Aufgabe</span></div></div>` : ''}
    ${r.badges.length ? `<div class="card newbadges">${r.badges.map(id => { const b = BADGES.find(x => x.id === id); return `<div class="nb"><span>${b.icon}</span><div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div></div>`; }).join('')}</div>` : ''}
    ${G.mistakes.length && G.mode !== 'test' ? `<div class="card mistakes"><b>Das üben wir nochmal:</b><ul>${G.mistakes.slice(0, 10).map((m, i) => `<li><details><summary><span class="m">${esc(m.task.replace(/ [=≈] \?$/, ''))} = <b>${esc(m.expected)}</b> <span class="muted">(du: <s>${esc(m.given)}</s>)</span></span></summary><ol class="steps">${(m._task.w || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol><button class="linkbtn" data-i="${i}">Glaubst du, die Lösung ist falsch? Melden</button></details></li>`).join('')}</ul></div>` : ''}
    <div class="muted small">${xpText}</div>
    ${resultExtrasHtml(r)}
    ${resultPromo()}
    <div class="btns"><button class="btn" id="btnMenu">Menü</button><button class="btn primary" id="btnAgain">${G.mode === 'test' ? 'Weiter üben' : 'Nochmal'}</button></div>`;
  show('result');
  $('btnMenu').onclick = () => { Sound.click(); goHome(); };
  $('btnAgain').onclick = () => {
    if (G.mode === 'test') return goHome();
    if (G.mode === 'fehler' && !Object.keys(S.box).length) return goHome();
    if (G.mode === 'advent') return startAdventDoor(G.door);
    if (G.mode === 'challenge') return startGame('challenge', { queue: challengeTasks(), op: 'mix', lvl: 0 });
    if (G.assign && S.assign) return S.assign.runs.filter(x => x.ok).length >= S.assign.r ? goHome() : startAssignment();
    if (G.gen) return startGame(G.mode, { gen: G.gen, op: G.op, lvl: G.lvl, title: G.title });
    startGame(G.mode);
  };
  $('rShare') && ($('rShare').onclick = shareChallenge);
  $('rSendAssign') && ($('rSendAssign').onclick = shareAssignResult);
  bindResultExtras(r);
  $('result').querySelectorAll('.mistakes .linkbtn').forEach(b => b.onclick = () => openSheet('report', { type: 'aufgabe', ctx: G.mistakes[+b.dataset.i] }));
  $('result').querySelectorAll('[data-go]').forEach(b => b.onclick = () => openSheet(b.dataset.go));
  if (r.stars != null) {
    const starEls = $('rStars').children;
    Sound.fanfare(r.stars);
    for (let i = 0; i < r.stars; i++) setTimeout(() => { starEls[i].classList.add('on'); Sound.tone(84 + i * 4, 0, .2, 'triangle', .1); }, 500 + i * 300);
    if (r.stars >= 2 || r.newBest) setTimeout(() => Confetti.burst(140), 500 + r.stars * 300);
  } else Sound.soft(true);
}

/* ================= Einstufungstest ================= */
function startTest(k) {
  const seen = new Map();
  for (const [tp, l] of CLASS_TOPICS[k]) seen.set(tp, Math.max(seen.get(tp) ?? 0, l));
  const plan = [...seen.entries()].slice(-6).map(([topic, lvl]) => ({ topic, lvl }));
  const queue = plan.flatMap(p => Array.from({ length: 3 }, () => makeTask(p.topic, p.lvl)));
  startGame('test', { queue, op: 'mix', lvl: 0, testPlan: plan, klasse: k });
}
function finishTest() {
  const res = G.testPlan.map(p => {
    const ok = G.results.filter(r => r.topic === p.topic).filter(r => r.ok).length;
    const rec = ok === 3 ? Math.min(4, p.lvl + 1) : ok === 2 ? p.lvl : Math.max(0, p.lvl - 1);
    S.autoLvl[p.topic] = rec;
    return { ...p, ok, rec };
  });
  S.test = { date: todayStr(), k: G.klasse, res }; S.settings.klasse = G.klasse; S.sel.lvl = 'auto';
  const weak = res.filter(r => r.ok <= 1);
  if (weak.length) S.sel.op = weak[0].topic;
  award('test');
  return `<div class="card testres"><p class="muted" style="margin:0 0 8px">Klasse ${G.klasse} · ${G.correct} von ${G.results.length} richtig</p>
    ${res.map(r => `<div class="tr"><span class="tg">${TOPICS[r.topic].g}</span><div><b>${TOPICS[r.topic].name}</b><small>${r.ok === 3 ? 'Sitzt sicher 💪' : r.ok === 2 ? 'Fast sicher' : 'Hier lohnt sich Üben'} · empfohlen: Stufe ${r.rec + 1}</small></div><span class="pill3">${'●'.repeat(r.ok)}${'○'.repeat(3 - r.ok)}</span></div>`).join('')}
    <p class="small muted" style="margin:10px 0 0">Die Stufen sind jetzt auf <b>Auto</b> gestellt und passen sich beim Üben weiter an.</p></div>
    ${weak.length >= 2 ? `<a class="card cta" href="${esc(CONFIG.trialUrl)}" target="_blank" rel="noopener" style="text-decoration:none"><div style="font-size:26px">🎓</div><p><b>Bei ein paar Themen hakt es noch.</b><br>In einer kostenlosen Probestunde schauen wir gemeinsam drauf.</p></a>` : ''}`;
}

/* ================= Duell ================= */
let DU = null;
function startDuel() {
  Sound.init();
  const op = S.sel.op, lvl = currentLevel(op), seed = Math.floor(Math.random() * 1e9);
  DU = { op, lvl, target: 10, over: false, started: false, queue: withSeed(seed, () => Array.from({ length: 120 }, () => makeTask(op, lvl))), p: [0, 1].map(() => ({ idx: 0, score: 0, input: '', locked: false })) };
  $('duel').innerHTML = [1, 0].map(i => `<div class="dhalf ${i ? 'flip' : ''}" data-p="${i}">
      <div class="dhead"><b>${i ? '🔵' : '🟠'} Spieler ${i + 1}</b><span class="dbar"><i></i></span><span class="dscore">0/${DU.target}</span></div>
      <div class="dtask"><div class="dexpr"></div><div class="dhint"></div><div class="dans"></div></div>
      <div class="dpad">${padHtml()}</div><div class="dover" hidden></div></div>`).join('<div class="dmid"><button class="round" id="duelQuit" aria-label="Duell beenden">✕</button><span>' + esc(TOPICS[op].name) + ' · Stufe ' + (lvl + 1) + ' · Wer zuerst 10 schafft</span></div>');
  show('duel');
  $('duelQuit').onclick = () => { DU = null; goHome(); };
  [0, 1].forEach(duelRender);
  countdown(() => { if (!DU) return; DU.started = true; [0, 1].forEach(duelRender); });
}
$('duel').addEventListener('pointerdown', e => {
  const k = e.target.closest('.key'), h = e.target.closest('.dhalf'); if (!k || !h || !DU) return;
  e.preventDefault(); duelPress(+h.dataset.p, k.dataset.k);
});
const dEl = (i, cls) => $('duel').querySelector(`.dhalf[data-p="${i}"] ${cls}`);
function duelRender(i, state) {
  const P_ = DU.p[i], t = DU.queue[P_.idx];
  dEl(i, '.dexpr').innerHTML = DU.started ? t.e.map(tokHtml).join('') + (t.noEq ? '' : `<span class="eq">${t.eqSign || '='}</span>`) : '…';
  dEl(i, '.dexpr').classList.toggle('storymode', !!t.story);
  dEl(i, '.dhint').textContent = DU.started ? [t.pre, t.hint, t.unit && `in ${t.unit}`].filter(Boolean).join(' · ') : '';
  const a = dEl(i, '.dans'); a.className = 'dans' + (state ? ' ' + state : '');
  a.textContent = state === 'no' ? showAns(t.a) : P_.input.replace('-', '−') || ' ';
  dEl(i, '.dscore').textContent = `${P_.score}/${DU.target}`;
  dEl(i, '.dbar i').style.width = (P_.score / DU.target * 100) + '%';
}
function duelPress(i, k) {
  if (!DU || DU.over || !DU.started) return;
  const P_ = DU.p[i], t = DU.queue[P_.idx];
  if (P_.locked) return;
  if (k === 'ok' || (k !== 'del' && (P_.input = editInput(P_.input, k)) && autoReady(P_.input, t.a))) return duelSubmit(i);
  if (k === 'del') P_.input = editInput(P_.input, k);
  Sound.click(); duelRender(i);
}
function duelSubmit(i) {
  const P_ = DU.p[i], t = DU.queue[P_.idx], p = parseInput(P_.input);
  if (!p) return;
  const ok = p.q.n === t.a.q.n && p.q.d === t.a.q.d;
  P_.locked = true;
  if (ok) {
    P_.score++; Sound.correct(P_.score, i ? 67 : 72); duelRender(i, 'ok');
    if (P_.score >= DU.target) return duelEnd(i);
    setTimeout(() => { if (!DU) return; P_.idx++; P_.input = ''; P_.locked = false; duelRender(i); }, 300);
  } else {
    Sound.wrong(); duelRender(i, 'no');
    setTimeout(() => { if (!DU) return; P_.idx++; P_.input = ''; P_.locked = false; duelRender(i); }, 1300);
  }
}
function duelEnd(w) {
  DU.over = true; Sound.fanfare(3); Confetti.burst(160, innerWidth / 2, w ? innerHeight / 4 : innerHeight * .75);
  award('first'); award('duel'); checkGlobalBadges(); save(); announceBadges();
  [0, 1].forEach(i => {
    const o = dEl(i, '.dover'); o.hidden = false;
    o.innerHTML = i === w ? `<div class="dwin">🏆</div><b>Gewonnen!</b><span>${DU.p[i].score} : ${DU.p[1 - i].score}</span>` : `<div class="dwin">💪</div><b>Knapp daneben!</b><span>${DU.p[i].score} : ${DU.p[1 - i].score}</span>`;
    o.innerHTML += `<div class="row2"><button class="btn primary" data-act="again">Revanche</button><button class="btn" data-act="menu">Menü</button></div>`;
    o.querySelector('[data-act=again]').onclick = startDuel;
    o.querySelector('[data-act=menu]').onclick = () => { DU = null; goHome(); };
  });
}

/* ================= Tastatur ================= */
addEventListener('keydown', e => {
  if (Sheet.open) { if (e.key === 'Escape') closeSheet(); return; }
  const scr = currentScreen();
  if (scr === 'game') {
    const map = { Backspace: 'del', Enter: 'ok', ',': ',', '.': ',', '/': '/', '-': 'neg' };
    const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (e.key === 'Escape') return quitGame();
    if (k) {
      e.preventDefault(); press(k);
      const b = $('pad').querySelector(`.key[data-k="${CSS.escape(k)}"]`); b?.classList.add('down'); setTimeout(() => b?.classList.remove('down'), 100);
    }
  } else if (scr === 'result') {
    if (e.key === 'Enter' && document.activeElement === document.body) { e.preventDefault(); $('btnAgain')?.click(); }
    if (e.key === 'Escape') $('btnMenu')?.click();
  } else if (scr === 'duel' && e.key === 'Escape') { DU = null; goHome(); }
});
addEventListener('resize', () => { if (currentScreen() === 'game' && G?.task) fitExpr(); });
