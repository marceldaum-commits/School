'use strict';
/* =====================================================================
   Zahlen-Dungeon (Roadmap Tag 6, 17.11.2026) – kurzer Roguelike-Lauf in 3–5 Minuten
   7 Räume, 5 Herzen. Vor jedem Raum zwei Türen: Monster, Schatz oder Lagerfeuer.
   Gegner = Aufgaben: Jede richtige Antwort ist ein Treffer (schnell = Volltreffer, doppelter Schaden),
   jede falsche kostet ein Herz – danach kommt wie immer der Lösungsweg. Im letzten Raum wartet der Wächter.
   Aufgaben: Themen der eingestellten Klasse (sonst das gewählte Thema und die aktuelle Stufe).
   Tag 7 (Dungeon 2): Rechen-Karten – echte Strategien als Spielzüge, Deck wächst mit jedem Sieg. Tag 8: Bosse, Freischaltungen.
   ===================================================================== */
const DG = { ROOMS: 7, HEARTS: 5 };
const DG_MON = {
  // Lebenspunkte seit Dungeon 2 höher: Rechen-Karten machen +1 Schaden, ein Lauf soll trotzdem 3–5 Minuten dauern
  schleim: { name: 'Schleimi', hp: 3 },
  fleder: { name: 'Flatter', hp: 4 },
  geist: { name: 'Der Zahlengeist', hp: 5 },
  golem: { name: 'Steinbeißer', hp: 6 },
  waechter: { name: 'Der Wächter', hp: 9, boss: true },
};
const DG_DEPTH = [['schleim', 'fleder'], ['schleim', 'fleder'], ['fleder', 'geist'], ['fleder', 'geist'], ['geist', 'golem'], ['geist', 'golem']];
let DGN = null;   // laufender Dungeon

/* ---------- Rechen-Karten (Roadmap Tag 7): jede Karte ist eine echte Rechenstrategie ----------
   Vor jedem Kampf ziehst du bis zu 3 Karten und kannst eine spielen: Dann kommen Aufgaben, bei denen genau dieser Trick hilft,
   und jeder Treffer macht 1 Schaden mehr. „Probe“ ist ein Schild. Nach jedem besiegten Monster wählst du 1 von 2 neuen Karten. */
// Klassenstufe fürs Karten-Niveau: eingestellte Klasse, sonst aus der aktuellen Stufe geschätzt
const dgK = () => S.settings.klasse || [1, 2, 3, 4, 6, 8][Math.min(5, currentLevel(S.sel.op === 'mix' ? 'add' : S.sel.op))];
const DG_CARDS = {
  zehner: { icon: '⑩', name: 'Zehnerfreund', k: 1, trick: 'Erst bis zum Zehner auffüllen: 8 + 5 = 8 + 2 + 3',
    gen: k => { const a = k <= 2 ? rnd(6, 9) : 10 * rnd(2, 8) + rnd(5, 9), u = a % 10, b = rnd(11 - u, 9), f = 10 - u;
      return { e: [N(a), O('+'), N(b)], a: I(a + b), w: [`Zerlege ${b} in ${f} + ${b - f}, um zum Zehner zu springen:`, `${a} + ${f} = ${a + f}`, `${a + f} + ${b - f} = ${a + b}`] }; } },
  doppel: { icon: '✌️', name: 'Verdoppeln', k: 1, trick: 'Zehner und Einer getrennt verdoppeln: 2 · 34 = 60 + 8',
    gen: k => { const x = k <= 2 ? rnd(6, 25) : k <= 4 ? rnd(26, 99) : rnd(101, 499); return { e: [T('das Doppelte von'), N(x)], a: I(2 * x), w: dblW(x) }; } },
  halb: { icon: '✂️', name: 'Halbieren', k: 2, trick: 'Geschickt zerlegen: die Hälfte von 152 = 70 + 6',
    gen: k => { const x = k <= 3 ? 2 * rnd(6, 49) : 2 * rnd(51, 499); return { e: [T('die Hälfte von'), N(x)], a: I(x / 2), w: hlfW(x) }; } },
  tausch: { icon: '🔄', name: 'Tauschaufgabe', k: 1, trick: 'Die kleine Zahl zur großen: 3 + 48 = 48 + 3',
    gen: k => { const a = rnd(2, 9), b = k <= 2 ? rnd(11, 19) : k <= 4 ? rnd(31, 89) : rnd(120, 890);
      return { e: [N(a), O('+'), N(b)], a: I(a + b), w: [`Tauschen: ${a} + ${b} = ${b} + ${a}`, `${b} + ${a} = ${a + b}`] }; } },
  neun: { icon: '9️⃣', name: 'Neuner-Trick', k: 2, trick: '+ 9 ist + 10 − 1, und · 9 ist · 10 minus einmal',
    gen: k => { if (k <= 3) { const a = rnd(13, 79); return { e: [N(a), O('+'), N(9)], a: I(a + 9), w: ['+ 9 = + 10 − 1', `${a} + 10 = ${a + 10}`, `${a + 10} − 1 = ${a + 9}`] }; }
      const n = rnd(12, 45); return { e: [N(n), O('·'), N(9)], a: I(9 * n), w: [`${n} · 9 = ${n} · 10 − ${n}`, `${n} · 10 = ${10 * n}`, `${10 * n} − ${n} = ${9 * n}`] }; } },
  fuenf: { icon: '🖐️', name: 'Fünfer-Trick', k: 3, trick: '· 5 ist · 10 und dann halbieren: 46 · 5 = 460 : 2',
    gen: k => { const n = k <= 4 ? 2 * rnd(6, 49) : 2 * rnd(50, 240); return { e: [N(n), O('·'), N(5)], a: I(5 * n), w: [`${n} · 5 = ${n} · 10 : 2`, `${n} · 10 = ${10 * n}`, `${10 * n} : 2 = ${5 * n}`] }; } },
  komma: { icon: '↔️', name: 'Kommaschieber', k: 5, trick: '· 10, · 100: Komma nach rechts – : 10, : 100: Komma nach links',
    gen: () => GEN.dec(2) },
  probe: { icon: '🛡️', name: 'Probe', k: 1, shield: true, trick: 'Rechne rückwärts zur Kontrolle: 12 − 5 = 7, denn 7 + 5 = 12' },
};
// Namen und Tricks der Karten als ganze Sätze je Sprache (nicht über die automatische Übersetzung – Rechenzeichen bleiben richtig)
const DG_CARDS_I18N = {
  en: { zehner: ['Make ten', 'First fill up to the ten: 8 + 5 = 8 + 2 + 3'], doppel: ['Doubling', 'Double tens and ones separately: 2 × 34 = 60 + 8'],
    halb: ['Halving', 'Split cleverly: half of 152 = 70 + 6'], tausch: ['Swap it', 'Add the small number to the big one: 3 + 48 = 48 + 3'],
    neun: ['Nines trick', '+ 9 is + 10 − 1, and × 9 is × 10 minus one lot'], fuenf: ['Fives trick', '× 5 is × 10 and then halve: 46 × 5 = 460 ÷ 2'],
    komma: ['Point shifter', '× 10, × 100: point to the right – ÷ 10, ÷ 100: point to the left'], probe: ['Check', 'Work backwards to check: 12 − 5 = 7, because 7 + 5 = 12'] },
  uk: { zehner: ['Друг десятки', 'Спершу доповни до десятка: 8 + 5 = 8 + 2 + 3'], doppel: ['Подвоєння', 'Подвоюй десятки й одиниці окремо: 2 · 34 = 60 + 8'],
    halb: ['Половина', 'Розкладай вдало: половина від 152 = 70 + 6'], tausch: ['Переставляння', 'Менше число до більшого: 3 + 48 = 48 + 3'],
    neun: ['Трюк з дев’яткою', '+ 9 – це + 10 − 1, а · 9 – це · 10 мінус один раз'], fuenf: ['Трюк з п’ятіркою', '· 5 – це · 10 і поділити навпіл: 46 · 5 = 460 : 2'],
    komma: ['Посувач коми', '· 10, · 100: кома праворуч – : 10, : 100: кома ліворуч'], probe: ['Перевірка', 'Перевір у зворотному порядку: 12 − 5 = 7, бо 7 + 5 = 12'] },
};
const dgCardText = id => { const t = (DG_CARDS_I18N[I18N.lang] || {})[id]; return t ? { name: t[0], trick: t[1] } : { name: DG_CARDS[id].name, trick: DG_CARDS[id].trick }; };
const dgEligible = () => Object.keys(DG_CARDS).filter(id => DG_CARDS[id].k <= dgK());
const dgEffect = c => c.shield ? 'Der nächste Fehler kostet kein Herz.' : 'Aufgaben mit diesem Trick – jeder Treffer macht 1 Schaden mehr.';
function dgCardHtml(id, attrs = '') {
  const c = DG_CARDS[id];
  const tx = dgCardText(id), keep = x => esc(x).replace(/([+−·:×÷=]) (?=[\d(])/g, '$1\u00a0').replace(/(\d) (?=[+−·:×÷=])/g, '$1\u00a0');   // Rechnungen nicht umbrechen
  return `<button class="dg-card ${c.shield ? 'shield' : ''}" ${attrs}><span class="dg-card-ico" aria-hidden="true">${c.icon}</span><b translate="no">${esc(tx.name)}</b><span class="dg-card-fx">${esc(dgEffect(c))}</span><span class="dg-card-trick" translate="no">${keep(tx.trick)}</span></button>`;
}
function dgFound(id) { const st = dgState(); st.cards = st.cards || {}; st.cards[id] = (st.cards[id] || 0) + 1; }
const dgState = () => S.dungeon || (S.dungeon = { best: 0, runs: 0, wins: 0, beaten: 0 });

/** gezeichnete Monster (eigene SVGs) */
function dgMonSvg(kind, size = 72) {
  const eye = (x, y, r = 5, c = '#1d1b2f') => `<circle cx="${x}" cy="${y}" r="${r + 2.5}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 1}" r="${r}" fill="${c}"/><circle cx="${x + 2.5}" cy="${y - 1.5}" r="1.4" fill="#fff"/>`;
  const art = {
    schleim: `<path d="M-38 30 C-42 0 -26 -30 0 -32 C26 -30 42 0 38 30 Z" fill="#5fd068"/><path d="M-30 -6 C-26 -20 -14 -26 -6 -26" stroke="#b9f5bf" stroke-width="5" fill="none" stroke-linecap="round"/>${eye(-12, 2)}${eye(12, 2)}<path d="M-10 16 Q0 24 10 16" stroke="#1d6b2c" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="32" rx="40" ry="5" fill="#000" opacity=".18"/>`,
    fleder: `<path d="M-14 -4 C-30 -26 -46 -18 -48 -4 C-40 -10 -34 -2 -38 6 C-30 0 -24 8 -26 14 C-20 6 -14 8 -12 10 Z" fill="#6a4fb4"/><path d="M14 -4 C30 -26 46 -18 48 -4 C40 -10 34 -2 38 6 C30 0 24 8 26 14 C20 6 14 8 12 10 Z" fill="#6a4fb4"/><circle cx="0" cy="2" r="20" fill="#8e6bd8"/><path d="M-14 -14 L-10 -28 L-4 -16 Z M14 -14 L10 -28 L4 -16 Z" fill="#8e6bd8"/>${eye(-7, -1, 4, '#c0142f')}${eye(7, -1, 4, '#c0142f')}<path d="M-5 11 L-3 16 L-1 11 M1 11 L3 16 L5 11" fill="#fff"/>`,
    geist: `<path d="M-28 34 L-28 -6 C-28 -28 -14 -36 0 -36 C14 -36 28 -28 28 -6 L28 34 L19 26 L10 34 L0 26 L-10 34 L-19 26 Z" fill="#e8f1ff" stroke="#9bb7e0" stroke-width="2"/>${eye(-10, -10, 4.5)}${eye(10, -10, 4.5)}<ellipse cx="0" cy="6" rx="6" ry="7" fill="#1d1b2f"/><text x="-21" y="22" font-size="11" font-weight="800" fill="#9bb7e0" font-family="sans-serif">7</text><text x="13" y="22" font-size="11" font-weight="800" fill="#9bb7e0" font-family="sans-serif">3</text>`,
    golem: `<rect x="-34" y="-30" width="68" height="62" rx="16" fill="#9b8f84"/><path d="M-20 -30 L-14 -14 L-22 -4 M18 -30 L12 -18 M24 32 L18 18 L26 8" stroke="#6f655c" stroke-width="3" fill="none"/><rect x="-24" y="-12" width="16" height="9" rx="3" fill="#ffb347"/><rect x="8" y="-12" width="16" height="9" rx="3" fill="#ffb347"/><rect x="-16" y="10" width="32" height="8" rx="3" fill="#4e463f"/><path d="M-12 10 v4 M-4 10 v4 M4 10 v4 M12 10 v4" stroke="#d9d2c9" stroke-width="2.5"/>`,
    waechter: `<path d="M-30 -18 L-40 -44 L-18 -26 Z M30 -18 L40 -44 L18 -26 Z" fill="#ffd166"/><path d="M-36 34 C-44 4 -34 -28 0 -30 C34 -28 44 4 36 34 Z" fill="#e8673a"/><path d="M-20 22 C-10 30 10 30 20 22 L16 34 L-16 34 Z" fill="#fff3d6"/><path d="M-14 22 l3 6 l3 -6 M2 22 l3 6 l3 -6" fill="#fff"/>${eye(-13, -6, 5, '#7a0d0d')}${eye(13, -6, 5, '#7a0d0d')}<path d="M-22 -16 L-6 -11 M22 -16 L6 -11" stroke="#7a2a12" stroke-width="4" stroke-linecap="round"/><path d="M-6 6 Q0 10 6 6" stroke="#7a2a12" stroke-width="3" fill="none"/><path d="M-12 -32 L-6 -42 L0 -34 L6 -42 L12 -32 Z" fill="#ffd166"/>`,
  }[kind];
  return `<svg viewBox="-50 -50 100 100" width="${size}" height="${size}" aria-hidden="true">${art}</svg>`;
}
const dgDoorSvg = (icon, glow) => `<svg viewBox="0 0 80 110" width="78" height="106" aria-hidden="true"><path d="M6 108 V40 A34 34 0 0 1 74 40 V108 Z" fill="#3b2a20"/><path d="M14 108 V42 A26 26 0 0 1 66 42 V108 Z" fill="${glow}"/><path d="M40 16 V108 M14 60 H66 M14 84 H66" stroke="#2a1c14" stroke-width="2" opacity=".35"/><circle cx="58" cy="76" r="3" fill="#ffd166"/><text x="40" y="66" font-size="28" text-anchor="middle">${icon}</text></svg>`;
const dgHearts = () => Array.from({ length: DG.HEARTS }, (_, i) => `<span class="dg-heart ${i < DGN.hearts ? '' : 'lost'}">❤️</span>`).join('');

/** Aufgaben-Quelle: Themen der Klasse (ohne lange Textaufgaben), sonst gewähltes Thema */
function dgTopics() {
  const k = S.settings.klasse;
  if (k && CLASS_TOPICS[k]) { const t = CLASS_TOPICS[k].filter(([tp]) => tp !== 'word'); if (t.length) return t.map(([tp, l]) => [tp, S.autoLvl[tp] ?? l]); }
  const op = S.sel.op === 'mix' ? 'add' : S.sel.op;
  return [[op, currentLevel(op)]];
}
function dgInfo() {
  const k = S.settings.klasse;
  return k && CLASS_TOPICS[k] ? `Aufgaben aus Klasse ${k}` : `${TOPICS[S.sel.op === 'mix' ? 'add' : S.sel.op].name} · ${lvlName(currentLevel(S.sel.op === 'mix' ? 'add' : S.sel.op))}`;
}

function startDungeon() {
  if (Sheet.open) closeSheet();
  const el = shuffle(dgEligible().filter(id => id !== 'probe'));
  DGN = { room: 0, hearts: DG.HEARTS, mon: null, beaten: 0, chests: 0, funken: 0, won: false, dead: false, recent: [],
    draw: shuffle(['probe', el[0], el[1]].filter(Boolean)), discard: [], card: null, shield: false, reward: false };   // Startdeck: Probe + 2 Strategien
  DGN.draw.forEach(dgFound);
  dgState().runs++; save();
  startGame('dungeon', { gen: dgGen, op: 'mix', lvl: 0, title: 'Zahlen-Dungeon' });
  dgHud();
}
function dgGen() {
  if (!DGN || DGN.won || DGN.dead) return null;   // Ende → Ergebnis
  if (!DGN.mon || DGN.mon.dead) setTimeout(dgDoors, 30);   // zwischen zwei Räumen: zuerst die Türen
  const boss = DGN.mon && !DGN.mon.dead && DG_MON[DGN.mon.kind].boss, tops = dgTopics();
  let t;
  const c = DGN.card && DG_CARDS[DGN.card];
  if (c && c.gen) {   // gespielte Rechen-Karte: Aufgaben, bei denen genau dieser Trick hilft
    for (let i = 0; i < 20; i++) { t = c.gen(dgK() + (boss ? 1 : 0)); if (!DGN.recent.includes(keyOf({ ...t, topic: 'dgc' }))) break; }
    t.topic = t.topic || (DGN.card === 'komma' ? 'dec' : DGN.card === 'doppel' || DGN.card === 'halb' ? 'doppel' : ['fuenf', 'neun'].includes(DGN.card) && t.e[1].v === '·' ? 'mul' : 'add');
    t.lvl = t.lvl ?? Math.min(4, Math.max(0, dgK() - 1)); t.dgCard = DGN.card;
    DGN.recent.push(keyOf(t)); if (DGN.recent.length > 12) DGN.recent.shift();
    return t;
  }
  for (let i = 0; i < 20; i++) {
    const [tp, l] = pick(tops), lvl = Math.min(l + (boss ? 1 : 0), Math.max(l, 4));
    t = makeTask(tp, lvl); if (!DGN.recent.includes(keyOf(t))) break;
  }
  DGN.recent.push(keyOf(t)); if (DGN.recent.length > 12) DGN.recent.shift();
  return t;
}

/* ---------- Anzeige über der Aufgabe ---------- */
function dgHud() {
  let el = $('dgHud');
  if (!el) { el = document.createElement('div'); el.id = 'dgHud'; el.className = 'dg-hud'; $('game').insertBefore(el, $('game').querySelector('.win')); }
  if (!DGN) return;
  const m = DGN.mon, def = m && DG_MON[m.kind];
  const chip = DGN.card ? `<span class="dg-chip">${DG_CARDS[DGN.card].icon} <span translate="no">${esc(dgCardText(DGN.card).name)}</span> +1</span>` : DGN.shield ? '<span class="dg-chip">🛡️ <span>Probe</span></span>' : '';
  el.innerHTML = `<div class="dg-me"><div class="dg-hearts" aria-label="Herzen">${dgHearts()}</div><span class="dg-room">Raum ${Math.min(DGN.room, DG.ROOMS)}/${DG.ROOMS}</span>${chip}</div>
    ${m ? `<div class="dg-foe ${m.dead ? 'dead' : ''} ${def.boss ? 'boss' : ''}"><div class="dg-mon" id="dgMon">${dgMonSvg(m.kind, def.boss ? 62 : 54)}</div>
      <div class="dg-foeinfo"><b>${esc(def.name)}</b><div class="dg-hp"><i style="width:${Math.max(0, m.hp) / m.max * 100}%"></i></div></div></div>` : '<div class="dg-foe empty"></div>'}`;
}
function dgFloat(txt, cls) {
  const f = document.createElement('div'); f.className = 'dg-dmg ' + (cls || ''); f.textContent = txt;
  ($('dgMon') || $('dgHud')).appendChild(f); setTimeout(() => f.remove(), 900);
}

/** aus submit(): richtige Antwort = Treffer, falsche = ein Herz weniger */
function dgAnswer(ok, dt, t) {
  if (!DGN || !DGN.mon || DGN.mon.dead) return;
  const m = DGN.mon, def = DG_MON[m.kind];
  if (ok) {
    const crit = dt < (t && t.story ? 12000 : 4000), bonus = t && t.dgCard && t.dgCard === DGN.card ? 1 : 0, dmg = (crit ? 2 : 1) + bonus;
    m.hp -= dmg; dgHud(); $('dgMon')?.classList.add('hit'); dgFloat(`−${dmg}${crit ? ' Volltreffer!' : ''}${bonus ? ' 🃏' : ''}`, crit ? 'crit' : '');
    Sound.tone(crit ? 45 : 50, 0, .09, 'square', .12); Sound.tone(crit ? 40 : 45, .07, .12, 'square', .1);
    if (m.hp <= 0) {
      m.dead = true; DGN.beaten++; dgState().beaten++; dgEndFight(); if (!def.boss) DGN.reward = true;
      const f = def.boss ? 20 : 3; DGN.funken += f; addFunken(f);
      setTimeout(() => { if (DGN && DGN.mon === m) { dgHud(); dgFloat(`+${f} 💫`, 'gold'); } }, 150);
      [0, 4, 7, 12].forEach((n, i) => Sound.tone(67 + n, .15 + i * .08, .18, 'triangle', .14));
      if (def.boss) { DGN.won = true; DGN.room = DG.ROOMS; Confetti.burst(90); }
    }
  } else if (DGN.shield) {   // Karte „Probe“: dieser Fehler kostet kein Herz
    DGN.shield = false; dgHud(); dgFloat('🛡️ Probe schützt!', 'gold'); Sound.tone(72, 0, .2, 'triangle', .1);
  } else {
    DGN.hearts--; dgHud(); vibrate([80, 40, 80]);
    $('game').classList.remove('dg-ouch'); void $('game').offsetWidth; $('game').classList.add('dg-ouch');
    Sound.tone(40, 0, .25, 'sawtooth', .12, 33);
    if (DGN.hearts <= 0) DGN.dead = true;
  }
}

function dgEndFight() { if (DGN.card) DGN.discard.push(DGN.card); DGN.card = null; DGN.shield = false; }
function dgDrawHand() {
  const hand = [];
  while (hand.length < 3) {
    if (!DGN.draw.length) { if (!DGN.discard.length) break; DGN.draw = shuffle(DGN.discard); DGN.discard = []; }
    hand.push(DGN.draw.pop());
  }
  return hand;
}
// vor dem Kampf: eine Karte spielen (oder ohne kämpfen); ungespielte Karten gehen zurück in den Stapel
function dgHand(go) {
  const hand = dgDrawHand();
  if (!hand.length) return go();
  const ov = dgOverlay(`<div class="dg-handbox"><b>Spiel eine Rechen-Karte</b><p class="small">Eine Karte pro Kampf – oder ohne Karte kämpfen.</p>
    <div class="dg-hand">${hand.map((id, i) => dgCardHtml(id, `data-c="${i}"`)).join('')}</div>
    <button class="btn" id="dgNoCard">Ohne Karte kämpfen</button></div>`);
  const done = i => { Sound.click(); hand.forEach((id, j) => { if (j !== i) DGN.draw.unshift(id); });
    if (i >= 0) { const id = hand[i]; if (DG_CARDS[id].shield) { DGN.shield = true; DGN.discard.push(id); } else DGN.card = id; }
    dgHud(); go(); };
  ov.querySelectorAll('[data-c]').forEach(b => b.onclick = () => done(+b.dataset.c));
  $('dgNoCard').onclick = () => done(-1);
}
// nach einem Sieg: 1 von 2 neuen Karten ins Deck
function dgReward(then) {
  DGN.reward = false;
  const opts = shuffle(dgEligible()).slice(0, 2);
  const ov = dgOverlay(`<div class="dg-handbox"><div class="dg-big">🃏</div><b>Neue Rechen-Karte!</b><p class="small">Wähle eine für dein Deck.</p>
    <div class="dg-hand">${opts.map((id, i) => dgCardHtml(id, `data-c="${i}"`)).join('')}</div></div>`);
  ov.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { Sound.hint(); const id = opts[+b.dataset.c]; DGN.discard.push(id); dgFound(id); save(); then(); });
}

/* ---------- Türen zwischen den Räumen ---------- */
function dgOverlay(html) {
  let ov = $('dgOv'); if (!ov) { ov = document.createElement('div'); ov.id = 'dgOv'; ov.className = 'dg-ov'; $('game').appendChild(ov); }
  ov.innerHTML = html; i18nTree?.(ov); return ov;
}
function dgCloseOverlay() { $('dgOv')?.remove(); }
function dgDoors() {
  if (!G || G.mode !== 'dungeon' || G.over || !DGN || DGN.won || DGN.dead || (DGN.mon && !DGN.mon.dead)) return;
  G.paused = true; $('solution').hidden = true;
  if (DGN.reward) return dgReward(dgDoors);
  const last = DGN.room >= DG.ROOMS - 1;
  let doors;
  if (last) doors = [{ type: 'boss' }];
  else {
    // höchstens 2 Schätze je Lauf (sonst ließen sich alle Kämpfe umgehen), Lagerfeuer nur mit fehlenden Herzen, Raum 1 immer Kampf
    const r = rand(), extra = DGN.room === 0 ? 'kampf' : DGN.hearts < DG.HEARTS && r < .3 ? 'rast' : DGN.chests < 2 && r < .6 ? 'schatz' : 'kampf';
    doors = shuffle([{ type: 'kampf' }, { type: extra }]);
  }
  const D = { kampf: ['👾', '#5a2e2e', 'Monster', 'Kampf!'], schatz: ['💎', '#2e4a5a', 'Schatz', 'Funken finden'], rast: ['🔥', '#5a4a2e', 'Lagerfeuer', '+1 Herz'], boss: ['👑', '#6a2414', 'Der Wächter', 'Letzter Raum'] };
  const ov = dgOverlay(`<div class="dg-room-head"><b>${last ? 'Letzter Raum' : `Raum ${DGN.room + 1} von ${DG.ROOMS}`}</b><div class="dg-hearts">${dgHearts()}</div></div>
    <p class="dg-say">${DGN.room === 0 ? 'Willkommen im Zahlen-Dungeon! Welche Tür nimmst du?' : last ? 'Hinter dieser Tür wartet der Wächter. Bist du bereit?' : 'Zwei Türen. Wohin jetzt?'}</p>
    <div class="dg-doors">${doors.map((d, i) => { const [ic, col, name, sub] = D[d.type]; return `<button class="dg-door ${d.type}" data-i="${i}">${dgDoorSvg(ic, col)}<b>${name}</b><span>${sub}</span></button>`; }).join('')}</div>
    <p class="small dg-info">${esc(dgInfo())}</p>`);
  ov.querySelectorAll('.dg-door').forEach(b => b.onclick = () => { Sound.click(); dgEnter(doors[+b.dataset.i].type); });
}
function dgEnter(type) {
  if (!DGN) return;
  DGN.room++;
  if (type === 'schatz' || type === 'rast') {
    let msg;
    if (type === 'schatz') { const f = rnd(5, 10); DGN.funken += f; DGN.chests++; addFunken(f); msg = `<div class="dg-big">💎</div><b>Ein Schatz!</b><p>Du findest <b>${f} 💫</b>.</p>`; [0, 7, 12].forEach((n, i) => Sound.tone(79 + n, i * .09, .2, 'sine', .12)); }
    else { DGN.hearts = Math.min(DG.HEARTS, DGN.hearts + 1); msg = `<div class="dg-big dg-fire">🔥</div><b>Ein Lagerfeuer</b><p>Du ruhst dich aus: <b>+1 ❤️</b></p>`; Sound.tone(60, 0, .4, 'sine', .1); }
    save(); dgHud();
    const ov = dgOverlay(`<div class="dg-reward">${msg}<div class="dg-hearts">${dgHearts()}</div><button class="btn primary" id="dgOn">Weiter</button></div>`);
    $('dgOn').onclick = () => { Sound.click(); if (DGN.room >= DG.ROOMS) DGN.room = DG.ROOMS - 1; dgDoors(); };
    return;
  }
  const kind = type === 'boss' ? 'waechter' : pick(DG_DEPTH[Math.min(DGN.room - 1, DG_DEPTH.length - 1)]), def = DG_MON[kind];
  DGN.mon = { kind, hp: def.hp, max: def.hp, dead: false };
  dgHud(); dgCloseOverlay();
  dgOverlay(`<div class="dg-intro ${def.boss ? 'boss' : ''}">${dgMonSvg(kind, 120)}<b>${esc(def.name)}</b><span>${def.boss ? `Besiege ihn mit ${def.hp} Treffern!` : `${def.hp} Treffer besiegen das Monster.`}</span></div>`);
  Sound.tone(def.boss ? 36 : 48, 0, .3, 'sawtooth', .08, def.boss ? 30 : 44);
  setTimeout(() => { if (!G || G.mode !== 'dungeon' || G.over) return;
    dgHand(() => { dgCloseOverlay(); G.paused = false; G.locked = false; nextTask(); }); }, def.boss ? 1400 : 900);
}

/** Ergebnis-Karte */
function dgFinish() {
  dgCloseOverlay();
  if (!DGN) return '';
  const st = dgState(), reached = DGN.won ? DG.ROOMS : Math.max(1, DGN.room), rec = reached > st.best;
  if (rec) st.best = reached;
  if (DGN.won) st.wins++;
  save();
  const head = DGN.won ? `${dgMonSvg('waechter', 74)}<div><b>Dungeon geschafft!</b><span>Du hast den Wächter besiegt. 👑</span></div>`
    : DGN.dead ? `${dgMonSvg(DGN.mon ? DGN.mon.kind : 'schleim', 64)}<div><b>Keine Herzen mehr …</b><span>Raum ${reached} von ${DG.ROOMS} – beim nächsten Mal kommst du weiter!</span></div>`
      : `${dgMonSvg('schleim', 56)}<div><b>Lauf beendet</b><span>Raum ${reached} von ${DG.ROOMS}</span></div>`;
  return `<div class="card dg-res ${DGN.won ? 'won' : ''}"><div class="dg-res-head">${head}</div>
    <div class="dg-res-stats"><span>👾 <b>${DGN.beaten}</b> besiegt</span><span>💎 <b>${DGN.chests}</b> Schätze</span><span>💫 <b>+${DGN.funken}</b></span><span>🃏 <b>${DGN.draw.length + DGN.discard.length + (DGN.card ? 1 : 0)}</b> Karten</span></div>
    ${rec ? '<span class="newbest">Neuer Rekord!</span>' : `<span class="small muted">Rekord: Raum ${st.best} von ${DG.ROOMS}${st.wins ? ` · ${st.wins}× geschafft` : ''}</span>`}</div>`;
}

/* ---------- Startseite ---------- */
function renderDungeonCard() {
  const el = $('dungeonCard'); if (!el) return;
  const st = dgState(), coll = Object.keys(st.cards || {}).length;
  el.hidden = false;
  el.innerHTML = `<div class="ch-ico dg-ico" aria-hidden="true">${dgMonSvg('schleim', 40)}</div><div class="ch-txt"><b>Zahlen-Dungeon</b><span>${st.runs ? `Rekord: Raum ${st.best}/${DG.ROOMS}${st.wins ? ` · ${st.wins}× geschafft 👑` : ''}${coll ? ` · 🃏 ${coll}/${Object.keys(DG_CARDS).length}` : ''}` : '7 Räume, 5 Herzen, Rechen-Karten – schaffst du den Wächter?'}</span></div>
    <button class="btn small primary" id="dgGo">Los</button>`;
  $('dgGo').onclick = () => { Sound.init(); Sound.click(); startDungeon(); };
}
