'use strict';
/* =====================================================================
   Rechenblitz – Bilder fürs Merk-Training (Marcel 14.11.: „interaktiver, erlebbar,
   mit Bild und Animation, damit man sich erinnert“).
   - merkVisual(key): bewegtes Bild je Aufgabe (Punktefeld, Zwanzigerfeld,
     Quadrat in Teilen, Pizza + Hunderterfeld) – reines SVG, offline
   - merkSky(opts): Sternenhimmel – jede Aufgabe ein Stern, hell = sitzt fest,
     ganze Reihen werden zu Sternbildern
   ===================================================================== */
const MV = { or: '#ff7418', nv: '#2447b5', gd: '#ffc83d', gr: '#1f9d55' };
const mvPop = (i, step = .06) => `class="mv-pop" style="--d:${(i * step).toFixed(2)}s"`;

/* Punktefeld a Reihen · b Spalten (Fünfer-Lücke zum Zählen) */
function mvDots(a, b, label) {
  const s = Math.min(22, Math.floor(210 / Math.max(a, b + 1))), gap = s * .5;
  const x = j => j * s + (j >= 5 ? gap : 0) + s / 2, y = i => i * s + (i >= 5 ? gap : 0) + s / 2;
  const W = x(b - 1) + s / 2, H = y(a - 1) + s / 2;
  let g = '';
  for (let i = 0; i < a; i++) {
    let row = '';
    for (let j = 0; j < b; j++) row += `<circle cx="${x(j)}" cy="${y(i)}" r="${s * .36}" fill="${i % 2 ? MV.nv : MV.or}"/>`;
    g += `<g ${mvPop(i, .12)}>${row}<text x="${W + 6}" y="${y(i) + s * .3}" font-size="${s * .62}" fill="currentColor" opacity=".55">${(i + 1) * b}</text></g>`;
  }
  return `<svg class="mv" viewBox="-4 -4 ${W + s * 2.4 + 8} ${H + 8}" role="img" aria-label="${esc(label)}">${g}</svg>`;
}
/* Zwanzigerfeld: erst a orange, dann b blau – zeigt das Auffüllen bis 10 */
function mvTen(a, b) {
  const s = 22; let g = '';
  for (let k = 0; k < 20; k++) {
    const r = Math.floor(k / 10), c = k % 10, x = c * s + (c >= 5 ? 6 : 0), y = r * s;
    g += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
    if (k < a + b) g += `<circle ${mvPop(k, .07)} cx="${x + s / 2}" cy="${y + s / 2}" r="7.5" fill="${k < a ? MV.or : MV.nv}"/>`;
  }
  return `<svg class="mv" viewBox="-2 -2 ${10 * s + 10} ${2 * s + 4}" role="img" aria-label="${a} + ${b}">${g}</svg>`;
}
/* Quadrat n² in Teilen: 10·10, 10·k, 10·k, k·k */
function mvSquare(n) {
  const k = n - 10, S = 190, u = S / n, t = 10 * u, parts = [
    [0, 0, t, t, MV.nv, '100'], [t, 0, k * u, t, MV.or, `${10 * k}`], [0, t, t, k * u, MV.or, `${10 * k}`], [t, t, k * u, k * u, MV.gr, `${k * k}`]];
  const g = parts.map(([x, y, w, h, c, l], i) => `<g ${mvPop(i, .35)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}" fill-opacity=".85" stroke="#fff" stroke-width="2"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 6}" text-anchor="middle" font-size="${Math.min(22, Math.max(11, Math.min(w, h) * .45))}" font-weight="800" fill="#fff">${l}</text></g>`).join('');
  return `<svg class="mv" viewBox="-30 -26 ${S + 40} ${S + 34}" role="img" aria-label="${n}²">
    <text x="${t / 2}" y="-8" text-anchor="middle" font-size="14" fill="currentColor">10</text><text x="${t + k * u / 2}" y="-8" text-anchor="middle" font-size="14" fill="currentColor">${k}</text>
    <text x="-8" y="${t / 2 + 5}" text-anchor="end" font-size="14" fill="currentColor">10</text><text x="-8" y="${t + k * u / 2 + 5}" text-anchor="end" font-size="14" fill="currentColor">${k}</text>${g}</svg>`;
}
/* Bruch als Pizza + Hunderterfeld */
function mvFrac(n, d) {
  const R = 52, cx = 60, cy = 60;
  let pie = '';
  for (let i = 0; i < d; i++) {
    const a0 = i / d * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / d * 2 * Math.PI - Math.PI / 2;
    const p = d === 1 ? `<circle cx="${cx}" cy="${cy}" r="${R}"/>` : `<path d="M${cx},${cy} L${(cx + R * Math.cos(a0)).toFixed(1)},${(cy + R * Math.sin(a0)).toFixed(1)} A${R},${R} 0 0 1 ${(cx + R * Math.cos(a1)).toFixed(1)},${(cy + R * Math.sin(a1)).toFixed(1)} Z"/>`;
    pie += i < n ? `<g ${mvPop(i, .12)} fill="${MV.or}" stroke="#fff" stroke-width="1.5">${p}</g>` : `<g fill="none" stroke="currentColor" stroke-opacity=".3">${p}</g>`;
  }
  const pct = n * 100 / d, s = 11; let grid = '';
  for (let k = 0; k < 100; k++) {
    const x = 140 + (k % 10) * s, y = 5 + Math.floor(k / 10) * s, f = Math.max(0, Math.min(1, pct - k));
    grid += `<rect x="${x}" y="${y}" width="${s - 1}" height="${s - 1}" fill="currentColor" fill-opacity=".08"/>`;
    if (f > 0) grid += `<rect ${mvPop(0.6 / 0.012 + k * .4, .012)} x="${x}" y="${y}" width="${((s - 1) * f).toFixed(1)}" height="${s - 1}" fill="${MV.nv}"/>`;
  }
  return `<svg class="mv" viewBox="0 0 252 120" role="img" aria-label="${n}/${d}">${pie}${grid}</svg>`;
}

/** Bild zur Aufgabe t (Merk-Karte) – genau in der Reihenfolge, wie die Rechnung angezeigt wird */
function merkVisual(t, { cap = true } = {}) {
  const key = typeof t === 'string' ? t : t.card, e = typeof t === 'string' ? null : t.e;
  let [id, a, b] = key.split(':').map((x, i) => i ? +x : x);
  if (e && (id === 'plus' || id === 'ee')) { a = e[0].v; b = e[2].v; }
  if (e && id === 'div') { b = e[2].v; a = e[0].v / b; }
  let svg = '', line = '';
  if (id === 'plus') { svg = mvTen(a, b); line = a + b > 10 ? `Erst bis 10 auffüllen: ${a} + ${10 - a} = 10, dann noch ${a + b - 10}` : `${a} und ${b} zusammen sind ${a + b}`; }
  else if (id === 'ee') { svg = mvDots(a, b, `${a} · ${b}`); line = `${a} Reihen mit je ${b} Punkten = ${a * b}`; }
  else if (id === 'div') { svg = mvDots(a, b, `${a * b} : ${b}`); line = `${a * b} Punkte in Reihen zu ${b} → ${a} Reihen`; }
  else if (id === 'sq') { svg = mvSquare(a); line = `100 + ${10 * (a - 10)} + ${10 * (a - 10)} + ${(a - 10) ** 2} = ${a * a}`; }
  else { svg = mvFrac(a, b); const q = Q(a * 100, b); line = `${a} von ${b} Stücken = ${q.d === 1 ? q.n : showAns(De(q.n, q.d))} von 100 Kästchen`; }
  return `<figure class="mv-fig">${svg}${cap ? `<figcaption>${esc(line)}</figcaption>` : ''}</figure>`;
}

/* ---------- Sternenhimmel ---------- */
let mvSkyN = 0;
const mvHash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const mvGroup = key => { const [id, a, b] = key.split(':'); return id === 'ee' || id === 'div' ? id + a : id === 'plus' ? 'p' + (+a + +b) : id; };
/** opts: decks, mini (kleine Vorschau), rose (Set der Aufgaben, die gerade gestiegen sind) */
function merkSky({ decks = merkDecks(), mini = false, rose = null } = {}) {
  const st = merkState(), W = 360, H = mini ? 150 : 190, pad = 10, top = mini ? 8 : 12, bottom = mini ? 8 : 12, gid = 'skyg' + (++mvSkyN);
  const regW = (W - pad * 2) / decks.length;
  let stars = '', lines = '', labels = '';
  decks.forEach((id, di) => {
    const keys = MERK_BY[id].keys(), n = keys.length, rw = regW - 8, rh = H - top - bottom;
    const cols = Math.max(1, Math.round(Math.sqrt(n * rw / rh))), rows = Math.ceil(n / cols), cw = rw / cols, ch = rh / rows;
    const pos = {};
    keys.forEach((k, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      pos[k] = [pad + di * regW + 4 + (c + .5 + (mvHash(k) - .5) * .7) * cw, top + (r + .5 + (mvHash(k + '#') - .5) * .7) * ch];
    });
    MERK_CONSTS.filter(c => c.deck === id).forEach(c => {   // Sternbilder: feste Sterne verbinden, fertige leuchten
      const pts = c.keys.filter(k => st.c[k]?.b >= MERK.SOLID).map(k => pos[k]).sort((p, q) => p[0] - q[0]);
      if (pts.length >= 2) lines += `<polyline class="${pts.length === c.keys.length ? 'done' : ''}" points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/>`;
    });
    keys.forEach(k => {
      const c = st.c[k], [x, y] = pos[k], b = c ? c.b : -1, solid = b >= MERK.SOLID, up = rose && rose.has(k);
      const r = (mini ? .7 : 1) * (b < 0 ? 1 : 1.4 + b * .45), op = b < 0 ? .16 : .35 + b * .11;
      stars += `<circle class="${solid ? 'tw' : ''}${up ? ' up' : ''}" style="--t:${(mvHash(k) * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${solid ? MV.gd : '#fff'}" fill-opacity="${op.toFixed(2)}"/>`;
    });
    if (!mini) labels += `<span style="width:${(100 / decks.length).toFixed(2)}%"><i>${esc(MERK_BY[id].icon)}</i> ${esc(MERK_BY[id].name)}</span>`;
  });
  const svg = `<svg class="sky${mini ? ' mini' : ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Merk-Himmel">
    <defs><radialGradient id="${gid}" cx="70%" cy="0%" r="110%"><stop offset="0" stop-color="#2a3a8c"/><stop offset=".6" stop-color="#121a4a"/><stop offset="1" stop-color="#070b24"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${gid})"/><g class="sky-lines">${lines}</g><g class="sky-stars">${stars}</g></svg>`;
  return mini ? svg : svg + `<div class="sky-legend">${labels}</div>`;
}

/* ---------- Effekte im Spiel ---------- */
function merkFlyStar(big) {
  const box = $('taskBox'), r = box.getBoundingClientRect(), s = document.createElement('div');
  s.className = 'flystar' + (big ? ' big' : ''); s.textContent = '★';
  s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height * .55) + 'px';
  document.body.appendChild(s); setTimeout(() => s.remove(), 900);
}

/* Symbol für die Startkarte: Mondsichel + kleines goldenes Sternbild (wie die anderen Karten-Symbole, 44 px) */
const MERK_ICON = `<svg viewBox="0 0 44 44" width="44" height="44"><defs><linearGradient id="mIcoG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b2aa8"/><stop offset="1" stop-color="#121a4a"/></linearGradient></defs>
  <rect width="44" height="44" rx="14" fill="url(#mIcoG)"/>
  <path d="M15.5 9.5a8 8 0 1 0 7.6 11.2 6.4 6.4 0 1 1-7.6-11.2z" fill="#ffe7a3"/>
  <polyline points="22,31 28.5,25.5 34,29 35.5,17" fill="none" stroke="#ffc83d" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  <g fill="#ffc83d"><circle cx="22" cy="31" r="2"/><circle cx="28.5" cy="25.5" r="2.4"/><circle cx="34" cy="29" r="1.8"/><path d="M35.5 12.6l1.15 2.95 3.05.25-2.35 1.95.75 3-2.6-1.65-2.6 1.65.75-3-2.35-1.95 3.05-.25z"/></g>
  <circle cx="30" cy="9.5" r=".9" fill="#fff" fill-opacity=".8"/><circle cx="10" cy="33" r=".8" fill="#fff" fill-opacity=".6"/></svg>`;

/* ---------- Merksätze: kleine Geschichten und Tricks, die Blitz erzählt (Marcel 14.11.) ---------- */
const MERK_STORY = {
  'ee:3:4': ['🔢', '1, 2, 3, 4 → 12 = 3 · 4. Die Zahlen stehen einfach der Reihe nach!'],
  'ee:7:8': ['🔢', '5, 6, 7, 8 → 56 = 7 · 8. Wieder der Reihe nach – so vergisst du es nie!'],
  'ee:8:8': ['♟️', '8 · 8 = 64 – so viele Felder hat ein Schachbrett.'],
  'ee:6:6': ['🎲', '6 · 6 = 36 – mit zwei Würfeln gibt es genau 36 Würfe.'],
  'ee:7:7': ['🧙', 'Sieben Zwerge mit je sieben Mützen: 7 · 7 = 49 Mützen.'],
  'ee:6:7': ['🐞', 'Sechs Marienkäfer mit je 7 Punkten: 6 · 7 = 42 Punkte.'],
  'ee:6:8': ['🕷️', 'Sechs Spinnen mit je 8 Beinen: 6 · 8 = 48 Beine.'],
  'ee:2:8': ['🕷️', 'Eine Spinne hat 8 Beine – zwei Spinnen haben 2 · 8 = 16.'],
  'ee:4:8': ['🕷️', 'Vier Spinnen mit je 8 Beinen: 4 · 8 = 32 Beine.'],
  'ee:8:9': ['🐙', 'Neun Kraken mit je 8 Armen: 8 · 9 = 72 Arme.'],
  'ee:2:7': ['📅', 'Zwei Wochen haben 2 · 7 = 14 Tage.'],
  'ee:3:7': ['📅', 'Drei Wochen haben 3 · 7 = 21 Tage.'],
  'ee:4:7': ['📅', 'Vier Wochen haben 4 · 7 = 28 Tage.'],
  'ee:4:6': ['🥚', 'Vier Eierkartons mit je 6 Eiern: 4 · 6 = 24 Eier.'],
  'ee:2:6': ['🥚', 'Zwei Eierkartons mit je 6 Eiern: 2 · 6 = 12 Eier.'],
  'ee:5:5': ['🖐️', 'Fünf Hände mit je 5 Fingern: 5 · 5 = 25 Finger.'],
  'ee:2:10': ['🦶', 'Finger und Zehen zusammen: 2 · 10 = 20.'],
  'ee:9:9': ['🖐️', 'Neuner-Trick: 9 · 10 = 90, eine 9 weg: 90 − 9 = 81.'],
  'ee:3:3': ['🔺', 'Ein Dreieck aus 3 Reihen zu je 3 Kugeln: 3 · 3 = 9.'],
  'ee:4:4': ['🐾', 'Vier Hunde mit je 4 Pfoten: 4 · 4 = 16 Pfoten.'],
  'ee:2:4': ['🐾', 'Zwei Katzen mit je 4 Pfoten: 2 · 4 = 8 Pfoten.'],
};
const MERK_FRAC_STORY = {
  '1:2': ['🍕', 'Eine halbe Pizza: 1/2 = 0,5 = 50 %.'], '1:4': ['🕒', 'Eine Viertelstunde – oder 25 Cent von 1 €: 1/4 = 0,25 = 25 %.'],
  '3:4': ['🕘', 'Dreiviertel – wie 75 Cent von 1 €: 3/4 = 0,75 = 75 %.'], '1:5': ['🪙', '20 Cent von 1 €: 1/5 = 0,2 = 20 %.'],
  '2:5': ['🪙', '40 Cent von 1 €: 2/5 = 0,4 = 40 %.'], '3:5': ['🪙', '60 Cent von 1 €: 3/5 = 0,6 = 60 %.'], '4:5': ['🪙', '80 Cent von 1 €: 4/5 = 0,8 = 80 %.'],
  '1:10': ['🪙', '10 Cent von 1 €: 1/10 = 0,1 = 10 %.'], '3:10': ['🪙', '30 Cent von 1 €: 3/10 = 0,3 = 30 %.'], '7:10': ['🪙', '70 Cent von 1 €: 7/10 = 0,7 = 70 %.'],
  '1:20': ['🪙', '5 Cent von 1 €: 1/20 = 0,05 = 5 %.'], '1:25': ['🪙', '4 Cent von 1 €: 1/25 = 0,04 = 4 %.'], '1:50': ['🪙', '2 Cent von 1 €: 1/50 = 0,02 = 2 %.'],
  '1:100': ['🪙', '1 Cent von 1 €: 1/100 = 0,01 = 1 %.'], '1:8': ['🍕', 'Eine Pizza in 8 Stücken – die Hälfte von einem Viertel: 1/8 = 0,125 = 12,5 %.'],
  '3:8': ['🍕', 'Drei von acht Pizzastücken: 3/8 = 0,375 = 37,5 %.'], '1:3': ['🍫', 'Eine Tafel für drei Kinder: 1/3 ≈ 0,333 – also gut 33 %.'], '2:3': ['🍫', 'Zwei von drei Stücken: 2/3 ≈ 0,667 – also knapp 67 %.'],
};
/** Merksatz zur Merk-Karte: eigene Geschichte oder passender Rechentrick → [Symbol, Text] */
function merkStory(t) {
  const key = typeof t === 'string' ? t : t.card;
  let [id, a, b] = key.split(':').map((x, i) => i ? +x : x);
  if (id === 'ee' || id === 'div') {
    const s = MERK_STORY[`ee:${Math.min(a, b)}:${Math.max(a, b)}`];
    if (s) return id === 'div' ? [s[0], s[1], true] : s;
    const f = [10, 2, 5, 9, 4, 8, 6, 3].find(k => k === a || k === b), o = f === a ? b : a;
    const tip = {
      10: ['🔟', `Mal 10: einfach eine 0 anhängen – ${o} · 10 = ${o * 10}.`],
      2: ['👯', `Verdoppeln: ${o} + ${o} = ${o * 2}.`],
      5: ['✋', `Fünfer-Trick: ${o} · 10 = ${o * 10}, davon die Hälfte: ${o * 5}.`],
      9: ['🖐️', `Neuner-Trick: ${o} · 10 = ${o * 10}, minus ${o} = ${o * 9}.`],
      4: ['🔁', `Doppelt verdoppeln: ${o} → ${o * 2} → ${o * 4}.`],
      8: ['🔁', `Dreimal verdoppeln: ${o} → ${o * 2} → ${o * 4} → ${o * 8}.`],
      6: ['➕', `Fünfmal und einmal: ${o * 5} + ${o} = ${o * 6}.`],
      3: ['➕', `Verdoppeln und einmal dazu: ${o * 2} + ${o} = ${o * 3}.`],
    }[f];
    if (tip) return id === 'div' ? [tip[0], tip[1], true] : tip;
    return ['💡', `${a} · ${b} = ${a * b}`];
  }
  if (id === 'plus') {
    if (a === b) return ['👯', `Verdoppeln: ${a} + ${a} = ${a * 2}.`];
    if (Math.abs(a - b) === 1) { const m = Math.min(a, b); return ['👯', `Fast verdoppeln: ${m} + ${m} = ${m * 2}, plus 1 = ${a + b}.`]; }
    if (a + b === 10) return ['🤝', `Zehnerfreunde: ${a} und ${b} ergeben zusammen 10.`];
    if (a + b > 10) return ['🔟', `Über die 10: erst bis 10 auffüllen, dann den Rest dazu.`];
    return ['🧮', `${a} + ${b} = ${a + b}`];
  }
  if (id === 'sq') return ['🏰', `Zerlege ${a} in 10 und ${a - 10}: 100 + 2 · ${10 * (a - 10)} + ${(a - 10) ** 2} = ${a * a}.`];
  return MERK_FRAC_STORY[`${a}:${b}`] || ['🍕', `${a}/${b}`];
}

/* ---------- Sternbilder mit Namen (Sammelalbum) ---------- */
const MERK_CONSTS = (() => {
  const L = [], ani = { 2: ['Der Zweier-Hase', '🐇'], 3: ['Die Dreier-Eule', '🦉'], 4: ['Die Vierer-Katze', '🐈'], 5: ['Der Fünfer-Fuchs', '🦊'], 6: ['Die Sechser-Biene', '🐝'], 7: ['Die Siebener-Schlange', '🐍'], 8: ['Der Achter-Drache', '🐉'], 9: ['Der Neuner-Wal', '🐋'] };
  const obj = { 2: ['Das Zweier-Boot', '⛵'], 3: ['Der Dreier-Ballon', '🎈'], 4: ['Die Vierer-Rakete', '🚀'], 5: ['Der Fünfer-Stern', '⭐'], 6: ['Die Sechser-Krone', '👑'], 7: ['Der Siebener-Komet', '☄️'], 8: ['Das Achter-Ufo', '🛸'], 9: ['Die Neuner-Laterne', '🏮'] };
  for (const [deck, names] of [['ee', ani], ['div', obj]]) for (let a = 2; a <= 9; a++) {
    const keys = []; for (let x = a; x <= (a === 9 ? 10 : a); x++) for (let b = x; b <= 10; b++) keys.push(`${deck}:${x}:${b}`);
    L.push({ id: `${deck}${a}`, deck, name: names[a][0], icon: names[a][1], keys });
  }
  const plus = []; for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) if (a + b <= 20) plus.push([a, b]);
  L.push({ id: 'plusK', deck: 'plus', name: 'Der Kleine Bär', icon: '🧸', keys: plus.filter(([a, b]) => a + b <= 10).map(([a, b]) => `plus:${a}:${b}`) });
  L.push({ id: 'plusG', deck: 'plus', name: 'Der Große Bär', icon: '🐻', keys: plus.filter(([a, b]) => a + b > 10).map(([a, b]) => `plus:${a}:${b}`) });
  L.push({ id: 'sq', deck: 'sq', name: 'Das Quadrat-Schloss', icon: '🏰', keys: Array.from({ length: 10 }, (_, i) => `sq:${i + 11}`) });
  L.push({ id: 'bd', deck: 'bd', name: 'Die Komma-Pizza', icon: '🍕', keys: BD.map(([n, d]) => `bd:${n}:${d}`) });
  L.push({ id: 'bp', deck: 'bp', name: 'Der Prozent-Mond', icon: '🌙', keys: BP.map(([n, d]) => `bp:${n}:${d}`) });
  return L;
})();
const merkConstOf = key => MERK_CONSTS.find(c => c.keys.includes(key));
const merkConstDone = c => { const st = merkState(); return c.keys.every(k => st.c[k] && st.c[k].b >= MERK.SOLID); };
const merkConstCount = c => { const st = merkState(); return c.keys.filter(k => st.c[k] && st.c[k].b >= MERK.SOLID).length; };
