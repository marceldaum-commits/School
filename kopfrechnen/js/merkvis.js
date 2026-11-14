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
    keys.forEach((k, i) => {   // Sternbilder: Nachbarn derselben Reihe, beide fest
      const nx = keys[i + 1];
      if (nx && mvGroup(k) === mvGroup(nx) && st.c[k]?.b >= MERK.SOLID && st.c[nx]?.b >= MERK.SOLID)
        lines += `<line x1="${pos[k][0].toFixed(1)}" y1="${pos[k][1].toFixed(1)}" x2="${pos[nx][0].toFixed(1)}" y2="${pos[nx][1].toFixed(1)}"/>`;
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
