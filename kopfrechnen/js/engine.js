'use strict';
/* =====================================================================
   Rechenblitz – Rechen-Engine
   Zufall (auch reproduzierbar), Zahlen-Darstellung, Themen und
   Aufgaben-Generatoren. Jede Aufgabe bringt ihren Lösungsweg (w) mit.
   ===================================================================== */

/* ---------- Zufall ---------- */
let RNG = Math.random;
const ENGINE = { weakFact: null, seeded: false };
const rand = () => RNG();
const rnd = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
const coin = () => rand() < .5;
const sign = () => coin() ? 1 : -1;
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
function seeded(seed) {   // mulberry32
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function withSeed(seed, fn) { const old = RNG, os = ENGINE.seeded; RNG = seeded(seed); ENGINE.seeded = true; try { return fn(); } finally { RNG = old; ENGINE.seeded = os; } }
const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- Zahlen ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const Q = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const fi = v => (v < 0 ? '−' : '') + (Math.abs(v) >= 10000 ? Math.abs(v).toLocaleString('de-DE') : Math.abs(v));
const par = v => v < 0 ? `(${fi(v)})` : fi(v);
function fmtDec(i, k) {
  if (!k) return fi(i);
  const s = String(Math.abs(i)).padStart(k + 1, '0'), frac = s.slice(-k).replace(/0+$/, '');
  return (i < 0 ? '−' : '') + s.slice(0, -k) + (frac ? ',' + frac : '');
}
const fmtMoney = c => `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')}`;
function decOfQ(q) { for (let k = 0; k <= 8; k++) { const p = 10 ** k; if (p % q.d === 0) return fmtDec(q.n * (p / q.d), k); } return `${q.n}/${q.d}`; }
const fq = (n, d) => { const q = Q(n, d); return q.d === 1 ? fi(q.n) : `${fi(q.n)}/${q.d}`; };
const fr = (n, d) => `${fi(n)}/${d}`;                       // Bruch ungekürzt anzeigen
// Lösung → so, wie man sie eintippt
function canon(a) {
  const { n, d } = a.q;
  return (a.kind === 'dec' ? decOfQ(a.q) : d === 1 ? String(n) : `${n}/${d}`).replace('−', '-').replace(/\./g, '');
}
const showAns = a => canon(a).replace('-', '−');
function parseInput(s) {
  const neg = s.startsWith('-'), b = neg ? s.slice(1) : s, sg = neg ? -1 : 1;
  if (!b) return null;
  if (b.includes('/')) {
    const [x, y] = b.split('/');
    if (!/^\d+$/.test(x) || !/^\d+$/.test(y) || +y === 0) return null;
    return { q: Q(sg * +x, +y), frac: true, reduced: gcd(+x, +y) === 1 && +y !== 1 };
  }
  if (!/^\d*,?\d*$/.test(b) || b === ',') return null;
  const [ip, fp = ''] = b.split(',');
  return { q: Q(sg * parseInt((ip || '0') + fp, 10), 10 ** fp.length) };
}

/* ---------- Bausteine einer Aufgabe ---------- */
const N = (v, paren) => ({ t: 'n', v, paren });       // ganze Zahl
const D = (i, k) => ({ t: 'd', i, k });               // Dezimalzahl i/10^k
const M = c => ({ t: 'm', c });                       // Geldbetrag in Cent
const F = (n, d) => ({ t: 'f', n, d });               // Bruch
const O = v => ({ t: 'o', v });                       // Rechenzeichen
const T = v => ({ t: 'x', v });                       // kleiner Text
const U = v => ({ t: 'u', v });                       // Einheit
const S_ = v => ({ t: 's', v });                      // normaler Text
const P = (b, e) => ({ t: 'p', b, e });               // Potenz
const W = v => ({ t: 'r', v });                       // Wurzel
const Gap = () => ({ t: 'g' });                       // Lücke
const K = v => ({ t: 'k', v });                       // Klammer
const V = c => ({ t: 'v', c });                       // c·x
const Eq = (v = '=') => ({ t: 'q', v });              // = oder ≈
const Story = v => ({ t: 't', v });                   // Textaufgabe
const I = v => ({ q: Q(v), kind: 'int' });
const Fr = (n, d) => ({ q: Q(n, d), kind: 'frac' });
const De = (n, d) => ({ q: Q(n, d), kind: 'dec' });
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const coefTxt = c => c === 1 ? '' : c === -1 ? '−' : fi(c);

function tokHtml(t) {
  switch (t.t) {
    case 'n': return `<span>${t.paren ? par(t.v) : fi(t.v)}</span>`;
    case 'd': return `<span>${fmtDec(t.i, t.k)}</span>`;
    case 'm': return `<span>${fmtMoney(t.c)}</span>`;
    case 'f': return `<span class="frac"><span>${t.n}</span><span>${t.d}</span></span>`;
    case 'o': return `<span class="o">${t.v}</span>`;
    case 'x': return `<span class="tx">${esc(t.v)}</span>`;
    case 'u': return `<span class="ux">${esc(t.v)}</span>`;
    case 's': return `<span>${esc(t.v)}</span>`;
    case 'p': return `<span>${par(t.b)}<sup>${t.e}</sup></span>`;
    case 'r': return `<span class="root">√<span class="rad">${t.v}</span></span>`;
    case 'g': return '<span class="gapbox">?</span>';
    case 'k': return `<span class="br">${t.v}</span>`;
    case 'v': return `<span>${coefTxt(t.c)}<i class="var">x</i></span>`;
    case 'q': return `<span class="eq">${t.v}</span>`;
    case 't': return `<span class="story">${esc(t.v)}</span>`;
  }
}
function tokText(t) {
  switch (t.t) {
    case 'n': return t.paren ? par(t.v) : fi(t.v);
    case 'd': return fmtDec(t.i, t.k);
    case 'm': return fmtMoney(t.c);
    case 'f': return `${t.n}/${t.d}`;
    case 'p': return par(t.b) + String(t.e).split('').map(c => SUPS[c]).join('');
    case 'r': return `√${t.v}`;
    case 'g': return '?';
    case 'v': return coefTxt(t.c) + 'x';
    default: return t.v;
  }
}
const FRAC_NAMES = { 2: 'Halbe', 3: 'Drittel', 4: 'Viertel', 5: 'Fünftel', 6: 'Sechstel', 7: 'Siebtel', 8: 'Achtel', 9: 'Neuntel', 10: 'Zehntel', 11: 'Elftel', 12: 'Zwölftel', 20: 'Zwanzigstel', 25: 'Fünfundzwanzigstel', 100: 'Hundertstel' };
function tokSpeech(t) {
  switch (t.t) {
    case 'n': return (t.v < 0 ? 'minus ' : '') + Math.abs(t.v);
    case 'd': return fmtDec(t.i, t.k).replace('−', 'minus ');
    case 'm': return `${Math.floor(t.c / 100)} Euro ${t.c % 100 || ''}`;
    case 'f': return t.n === 1 && t.d === 2 ? 'ein Halb' : FRAC_NAMES[t.d] ? `${t.n} ${FRAC_NAMES[t.d]}` : `${t.n} durch ${t.d}`;
    case 'o': return { '+': 'plus', '−': 'minus', '·': 'mal', ':': 'geteilt durch' }[t.v];
    case 'x': case 'u': case 's': return t.v.replace('%', ' Prozent').replace('€', ' Euro').replace('ggT', 'größter gemeinsamer Teiler von').replace('kgV', 'kleinstes gemeinsames Vielfaches von');
    case 'p': return t.e === 2 ? `${tokSpeech(N(t.b))} zum Quadrat` : `${tokSpeech(N(t.b))} hoch ${t.e}`;
    case 'r': return `Wurzel aus ${t.v}`;
    case 'g': return 'wie viel';
    case 'k': return t.v === '(' ? 'Klammer auf' : 'Klammer zu';
    case 'v': return `${t.c === 1 ? '' : t.c} x`;
    case 'q': return t.v === '=' ? 'gleich' : 'ungefähr';
    case 't': return t.v;
  }
}
const taskText = t => t.e.map(tokText).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
const taskSpeech = t => t.e.map(tokSpeech).join(' ') + (t.hint ? '. ' + t.hint : '');

/* ---------- Themen ---------- */
const GROUPS = ['Grundrechnen', 'Brüche & Co.', 'Anwenden', 'Gemischt'];
const TOPICS = {
  add: { g: '+', name: 'Plus', grp: 0 }, sub: { g: '−', name: 'Minus', grp: 0 }, mul: { g: '·', name: 'Mal', grp: 0 },
  div: { g: ':', name: 'Geteilt', grp: 0 }, gap: { g: '□', name: 'Lücke', grp: 0 },
  frac: { g: '½', name: 'Brüche', grp: 1 }, dec: { g: '0,5', name: 'Dezimal', grp: 1 }, pct: { g: '%', name: 'Prozent', grp: 1 },
  neg: { g: '−3', name: 'Negativ', grp: 1 }, pow: { g: 'x²', name: 'Potenzen', grp: 1 },
  order: { g: '( )', name: 'Klammern', grp: 2 }, round: { g: '≈', name: 'Runden', grp: 2 }, unit: { g: 'cm', name: 'Einheiten', grp: 2 },
  divis: { g: 'ggT', name: 'Teiler', grp: 2 }, eq: { g: 'x=', name: 'Gleichung', grp: 2 },
  word: { g: '📖', name: 'Textaufgaben', grp: 3, wide: true }, mix: { g: '★', name: 'Alles gemischt', grp: 3, wide: true },
};
const LEVEL_DESC = {
  add: ['Zahlenraum 10', 'Zahlenraum 20 mit Zehnerübergang', 'Bis 100: zweistellig + einstellig', 'Bis 100: zweistellig + zweistellig', 'Zahlenraum 1000'],
  sub: ['Zahlenraum 10', 'Zahlenraum 20 mit Zehnerübergang', 'Bis 100: zweistellig − einstellig', 'Bis 100: zweistellig − zweistellig', 'Zahlenraum 1000'],
  mul: ['Kernaufgaben (·1, ·2, ·5, ·10)', 'Kleines Einmaleins', 'Großes Einmaleins (11–19)', 'Zweistellig · einstellig', 'Zweistellig · zweistellig'],
  div: ['Kernaufgaben (:1, :2, :5, :10)', 'Kleines Einmaleins rückwärts', 'Großes Einmaleins rückwärts', 'Bis 900 : einstellig', 'Bis 625 : zweistellig'],
  gap: ['Plus-Lücken bis 20', 'Plus- und Minus-Lücken bis 100', 'Mal-Lücken im Einmaleins', 'Geteilt-Lücken im Einmaleins', 'Lücken bis 1000 und zweistellig mal'],
  frac: ['Gleichnamige Brüche addieren & subtrahieren', 'Kürzen und Bruchteile von Zahlen', 'Ungleichnamige Brüche addieren & subtrahieren', 'Brüche multiplizieren & dividieren', 'Brüche und ganze Zahlen gemischt'],
  dec: ['Eine Nachkommastelle: plus & minus', 'Zwei Nachkommastellen: plus & minus', 'Mal & geteilt durch 10, 100, 1000', 'Dezimalzahlen multiplizieren', 'Dezimalzahlen dividieren & Brüche umwandeln'],
  pct: ['50 %, 25 % und 10 % von …', 'Weitere Prozentsätze von …', 'Prozentsatz gesucht', 'Grundwert gesucht', 'Preise erhöhen & reduzieren'],
  neg: ['Plus mit negativen Zahlen bis 10', 'Minus ins Negative', 'Plus & minus mit Klammern bis 20', 'Mal & geteilt mit Vorzeichen', 'Drei Zahlen & größere Zahlen'],
  pow: ['Quadratzahlen bis 10²', 'Quadratzahlen & Wurzeln bis 12', 'Quadratzahlen & Wurzeln bis 20', 'Zweier-, Zehner- & Kubikpotenzen', 'Potenzen & Wurzeln kombinieren'],
  order: ['Punkt vor Strich', 'Klammern zuerst', 'Punkt vor Strich mit Geteilt', 'Klammern und Punkt vor Strich', 'Lange Rechenketten'],
  round: ['Auf Zehner runden', 'Auf Hunderter runden', 'Auf Tausender oder Zehntel runden', 'Überschlag: plus & minus', 'Überschlag: mal'],
  unit: ['m, cm, kg, g, € und ct', 'km, Liter, Stunden, Minuten', 'Mit Kommazahlen umrechnen', 'Flächen und Rauminhalte', 'Gemischte Angaben (1 h 15 min …)'],
  divis: ['Division mit Rest', 'Quersumme', 'Größter gemeinsamer Teiler', 'Kleinstes gemeinsames Vielfaches', 'Primfaktoren & Anzahl der Teiler'],
  eq: ['x + a = b', 'a · x = b und x : a = b', 'Zwei Schritte: a · x + b = c', 'Mit negativen Zahlen & Klammern', 'x auf beiden Seiten'],
  word: ['Klasse 1–2: plus & minus', 'Klasse 3–4: mal, geteilt, Geld', 'Klasse 5–6: Komma, Brüche, Flächen', 'Klasse 7–8: Prozent, Dreisatz, Tempo', 'Mehrere Schritte'],
  mix: [1, 2, 3, 4, 5].map(n => `Alle Themen zufällig gemischt – Stufe ${n}`),
};
// Welche Themen (und Stufen) zu welcher Klassenstufe passen
const CLASS_TOPICS = {
  1: [['add', 0], ['sub', 0], ['gap', 0]],
  2: [['add', 1], ['sub', 1], ['mul', 0], ['div', 0], ['gap', 0], ['word', 0]],
  3: [['add', 2], ['sub', 2], ['mul', 1], ['div', 1], ['gap', 1], ['order', 0], ['unit', 0], ['word', 0]],
  4: [['add', 3], ['sub', 3], ['mul', 2], ['div', 2], ['gap', 2], ['round', 0], ['unit', 1], ['order', 1], ['word', 1]],
  5: [['add', 4], ['sub', 4], ['mul', 3], ['div', 3], ['gap', 3], ['round', 1], ['frac', 0], ['dec', 0], ['divis', 0], ['order', 2], ['word', 1]],
  6: [['mul', 4], ['frac', 1], ['frac', 2], ['dec', 1], ['dec', 2], ['divis', 2], ['unit', 2], ['round', 2], ['neg', 0], ['word', 2]],
  7: [['frac', 3], ['dec', 3], ['pct', 0], ['pct', 1], ['neg', 2], ['eq', 0], ['order', 3], ['unit', 3], ['divis', 3], ['word', 2]],
  8: [['frac', 4], ['dec', 4], ['pct', 2], ['neg', 3], ['eq', 1], ['eq', 2], ['pow', 0], ['round', 3], ['order', 4], ['word', 3]],
  9: [['pct', 3], ['pow', 1], ['pow', 2], ['eq', 3], ['neg', 4], ['unit', 4], ['round', 4], ['word', 3]],
  10: [['pct', 4], ['pow', 3], ['pow', 4], ['eq', 4], ['divis', 4], ['word', 4]],
};
function classLevel(k, topic) { // empfohlene Stufe einer Klassenstufe (höchste genannte)
  for (let c = k; c >= 1; c--) { const hits = CLASS_TOPICS[c].filter(([t]) => t === topic); if (hits.length) return Math.max(...hits.map(h => h[1])); }
  return null;
}
function classTopicSet(k) { const s = new Set(['mix']); for (const c of [k - 1, k]) (CLASS_TOPICS[c] || []).forEach(([t]) => s.add(t)); return s; }

/* ---------- Lösungswege ---------- */
const places = n => { const out = []; let m = 1; while (m * 10 <= n) m *= 10; for (; m >= 1; m /= 10) { const d = Math.floor(n / m) % 10; if (d) out.push(d * m); } return out; };
function addW(a, b) {
  const s = a + b;
  if (b < 10) {
    const r = 10 - a % 10;
    if (a % 10 && b > r) return [`Zerlege ${b} in ${r} + ${b - r}, um zum Zehner zu springen:`, `${a} + ${r} = ${a + r}`, `${a + r} + ${b - r} = ${s}`];
    return [`${a} + ${b} = ${s}`, `Probe: ${s} − ${b} = ${a}`];
  }
  const parts = places(b); if (parts.length === 1) return [`${a} + ${b} = ${s}`, `Probe: ${s} − ${b} = ${a}`];
  const out = [`Zerlege ${b} in ${parts.join(' + ')}:`]; let cur = a;
  for (const p of parts) { out.push(`${cur} + ${p} = ${cur + p}`); cur += p; }
  return out;
}
function subW(a, b) {
  const s = a - b;
  if (b < 10) {
    const r = a % 10;
    if (r && b > r) return [`Zerlege ${b} in ${r} + ${b - r}, um zum Zehner zu springen:`, `${a} − ${r} = ${a - r}`, `${a - r} − ${b - r} = ${s}`];
    return [`${a} − ${b} = ${s}`, `Probe: ${s} + ${b} = ${a}`];
  }
  const parts = places(b); if (parts.length === 1) return [`${a} − ${b} = ${s}`, `Probe: ${s} + ${b} = ${a}`];
  const out = [`Zerlege ${b} in ${parts.join(' + ')}:`]; let cur = a;
  for (const p of parts) { out.push(`${cur} − ${p} = ${cur - p}`); cur -= p; }
  return out;
}
function mulW(a, b) {
  const p = a * b, big = Math.max(a, b), sm = Math.min(a, b);
  if (big <= 10) {
    if (sm === 1) return [`Mal 1 ändert nichts: ${p}`];
    if (big === 10) return [`Mal 10: eine Null anhängen → ${p}`];
    if (sm === 2) return [`Mal 2 ist das Doppelte: ${big} + ${big} = ${p}`];
    if (sm === 5 || big === 5) { const x = sm === 5 ? big : sm; return [`5 · ${x} ist die Hälfte von 10 · ${x}:`, `10 · ${x} = ${10 * x}, die Hälfte ist ${p}`]; }
    if (big === 9) return [`9 · ${sm} = 10 · ${sm} − ${sm}`, `= ${10 * sm} − ${sm} = ${p}`];
    return [`Zerlege ${big} in 5 + ${big - 5}:`, `5 · ${sm} = ${5 * sm}`, `${big - 5} · ${sm} = ${(big - 5) * sm}`, `${5 * sm} + ${(big - 5) * sm} = ${p}`];
  }
  if (sm <= 10) {
    const tn = big - big % 10, o = big % 10;
    if (!o) return [`${big / 10} · ${sm} = ${big / 10 * sm}, dann eine Null anhängen → ${p}`];
    return [`Zerlege ${big} in ${tn} + ${o}:`, `${tn} · ${sm} = ${tn * sm}`, `${o} · ${sm} = ${o * sm}`, `${tn * sm} + ${o * sm} = ${p}`];
  }
  const tn = sm - sm % 10, o = sm % 10;
  if (!o) return [`${big} · ${sm / 10} = ${big * sm / 10}, dann eine Null anhängen → ${p}`];
  return [`Zerlege ${sm} in ${tn} + ${o}:`, `${big} · ${tn} = ${big * tn}`, `${big} · ${o} = ${big * o}`, `${big * tn} + ${big * o} = ${p}`];
}
function divW(a, b) {
  const q = a / b;
  if (q <= 10) return [`Welche Zahl mal ${b} ergibt ${a}?`, `${q} · ${b} = ${a}`, `Also ${a} : ${b} = ${q}`];
  const qt = q - q % 10, qo = q % 10;
  if (!qo) return [`${a} : ${b} = ${q}`, `Probe: ${q} · ${b} = ${a}`];
  return [`Zerlege ${a} in ${qt * b} + ${qo * b}:`, `${qt * b} : ${b} = ${qt}`, `${qo * b} : ${b} = ${qo}`, `${qt} + ${qo} = ${q}`];
}
function redW(n, d) {
  const g = gcd(n, d);
  if (d / g === 1) return n === d ? [`${fr(n, d)} = 1`] : [`${fr(n, d)} = ${n / d}`];
  return g > 1 ? [`Kürzen mit ${g}: ${fr(n, d)} = ${fr(n / g, d / g)}`] : [];
}
function fracAddW(n1, d1, n2, d2, op) {
  const L = lcm(d1, d2), a = n1 * L / d1, b = n2 * L / d2, r = op === '+' ? a + b : a - b, out = [`Gemeinsamer Nenner: ${L}`];
  if (d1 !== L) out.push(`${fr(n1, d1)} = ${fr(a, L)}`);
  if (d2 !== L) out.push(`${fr(n2, d2)} = ${fr(b, L)}`);
  out.push(`${fr(a, L)} ${op} ${fr(b, L)} = ${fr(r, L)}`);
  return out.concat(redW(r, L));
}
function pctW(p, m) {
  const r = p * m / 100;
  const known = { 50: [2, 1, 'die Hälfte'], 25: [4, 1, 'ein Viertel'], 10: [10, 1, 'ein Zehntel'], 20: [5, 1, 'ein Fünftel'], 75: [4, 3, 'drei Viertel'], 1: [100, 1, 'ein Hundertstel'] }[p];
  if (known) { const [d, n, name] = known; return n === 1 ? [`${p} % ist ${name}:`, `${fi(m)} : ${d} = ${fi(r)}`] : [`${p} % ist ${name}:`, `${fi(m)} : ${d} = ${fi(m / d)}`, `${fi(m / d)} · ${n} = ${fi(r)}`]; }
  if (m % 10 === 0) {
    if (p % 10 === 0) return [`10 % von ${fi(m)} = ${fi(m / 10)}`, `${p} % = ${p / 10} · ${fi(m / 10)} = ${fi(r)}`];
    if (p === 5 && m % 20 === 0) return [`10 % von ${fi(m)} = ${fi(m / 10)}`, `5 % ist die Hälfte davon: ${fi(r)}`];
    if (p === 15 && m % 20 === 0) return [`10 % = ${fi(m / 10)} und 5 % = ${fi(m / 20)}`, `15 % = ${fi(m / 10)} + ${fi(m / 20)} = ${fi(r)}`];
  }
  return [`${p} % von ${fi(m)} = ${fi(m)} · ${p} : 100`, `= ${fi(m * p)} : 100 = ${fi(r)}`];
}
const sgnTerm = v => v >= 0 ? ` + ${fi(v)}` : ` − ${fi(-v)}`;
const divisors = n => { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out; };

/* ---------- Aufgaben-Generatoren ---------- */
const ADD = [
  () => { const a = rnd(0, 10); return [a, rnd(0, 10 - a)]; },
  () => { const a = rnd(2, 9); return [a, rnd(11 - a, 9)]; },
  () => { const a = rnd(11, 89); return [a, rnd(2, Math.min(9, 100 - a))]; },
  () => { const a = rnd(11, 89); return [a, rnd(11, 100 - a)]; },
  () => { const a = rnd(100, 899); return [a, rnd(11, 999 - a)]; },
];
const MUL = [
  () => [rnd(1, 10), pick([1, 2, 5, 10])],
  () => [rnd(2, 10), rnd(2, 10)],
  () => [rnd(11, 19), rnd(2, 9)],
  () => [rnd(12, 99), rnd(2, 9)],
  () => [rnd(11, 25), rnd(11, 25)],
];
const properFrac = d => { let n; do n = rnd(1, d - 1); while (gcd(n, d) !== 1); return n; };
const noTrail = (lo, hi) => { let v; do v = rnd(lo, hi); while (v % 10 === 0); return v; };
const factKey = (a, b) => a <= 10 && b <= 10 && a >= 1 && b >= 1 ? `${Math.min(a, b)}x${Math.max(a, b)}` : null;
function tablePair(l) {      // im kleinen Einmaleins schwache Aufgaben bevorzugen
  if (l === 1 && !ENGINE.seeded && ENGINE.weakFact && rand() < .4) { const w = ENGINE.weakFact(); if (w) return w; }
  return MUL[l]();
}
const NAMES = ['Lena', 'Tim', 'Mia', 'Ben', 'Emma', 'Noah', 'Sofia', 'Elias', 'Hannah', 'Luca', 'Mila', 'Paul', 'Ella', 'Finn', 'Leonie', 'Jonas', 'Aylin', 'Mats', 'Zoe', 'Can'];

const GEN = {
  add(l) { const [a, b] = ADD[l](); return { e: [N(a), O('+'), N(b)], a: I(a + b), w: addW(a, b) }; },
  sub(l) { const [x, y] = ADD[l](); return { e: [N(x + y), O('−'), N(x)], a: I(y), w: subW(x + y, x) }; },
  mul(l) { let [a, b] = tablePair(l); if (coin()) [a, b] = [b, a]; return { e: [N(a), O('·'), N(b)], a: I(a * b), w: mulW(a, b), fact: factKey(a, b) }; },
  div(l) { const [x, y] = tablePair(l); return { e: [N(x * y), O(':'), N(y)], a: I(x), w: divW(x * y, y), fact: factKey(x, y) }; },

  gap(l) {
    const mk = (e, ans, w, fact) => ({ e, a: I(ans), noEq: true, hint: 'Welche Zahl fehlt?', w, fact });
    if (l <= 1) {
      const [x, y] = ADD[l === 0 ? 1 : 3](), s = x + y;
      switch (rnd(0, 2)) {
        case 0: return mk([N(x), O('+'), Gap(), Eq(), N(s)], y, [`Rechne rückwärts: ${s} − ${x} = ${y}`]);
        case 1: return mk([Gap(), O('+'), N(y), Eq(), N(s)], x, [`Rechne rückwärts: ${s} − ${y} = ${x}`]);
        default: return mk([N(s), O('−'), Gap(), Eq(), N(x)], y, [`Wie viel fehlt von ${x} bis ${s}?`, `${s} − ${x} = ${y}`]);
      }
    }
    if (l === 2) {
      const [x, y] = tablePair(1);
      return coin() ? mk([N(x), O('·'), Gap(), Eq(), N(x * y)], y, [`Umkehraufgabe: ${x * y} : ${x} = ${y}`], factKey(x, y))
        : mk([Gap(), O('·'), N(y), Eq(), N(x * y)], x, [`Umkehraufgabe: ${x * y} : ${y} = ${x}`], factKey(x, y));
    }
    if (l === 3) {
      const [x, y] = tablePair(1);
      return coin() ? mk([N(x * y), O(':'), Gap(), Eq(), N(x)], y, [`${x * y} geteilt durch welche Zahl ergibt ${x}?`, `${x * y} : ${x} = ${y}`], factKey(x, y))
        : mk([Gap(), O(':'), N(y), Eq(), N(x)], x * y, [`Umkehraufgabe: ${x} · ${y} = ${x * y}`], factKey(x, y));
    }
    if (coin()) {
      const [x, y] = ADD[4](), s = x + y;
      return coin() ? mk([N(x), O('+'), Gap(), Eq(), N(s)], y, [`Rechne rückwärts: ${s} − ${x} = ${y}`])
        : mk([Gap(), O('−'), N(x), Eq(), N(y)], s, [`Rechne rückwärts: ${y} + ${x} = ${s}`]);
    }
    const [x, y] = MUL[3]();
    return mk([N(x), O('·'), Gap(), Eq(), N(x * y)], y, [`Umkehraufgabe: ${x * y} : ${x} = ${y}`]);
  },

  frac(l) {
    const H = 'als gekürzter Bruch';
    if (l === 0) {
      const d = rnd(3, 12);
      if (coin()) { const a = rnd(1, d - 1), b = rnd(1, d - 1); return { e: [F(a, d), O('+'), F(b, d)], a: Fr(a + b, d), hint: H, w: ['Gleicher Nenner – nur die Zähler addieren:', `${fr(a, d)} + ${fr(b, d)} = ${fr(a + b, d)}`, ...redW(a + b, d)] }; }
      const a = rnd(2, d - 1), b = rnd(1, a - 1);
      return { e: [F(a, d), O('−'), F(b, d)], a: Fr(a - b, d), hint: H, w: ['Gleicher Nenner – nur die Zähler subtrahieren:', `${fr(a, d)} − ${fr(b, d)} = ${fr(a - b, d)}`, ...redW(a - b, d)] };
    }
    if (l === 1) {
      if (coin()) { const d = rnd(2, 9), n = properFrac(d), k = rnd(2, 6); return { e: [T('Kürze'), F(n * k, d * k)], a: Fr(n, d), hint: 'so weit wie möglich', w: [`${n * k} und ${d * k} sind beide durch ${k} teilbar.`, `Zähler und Nenner durch ${k} teilen: ${fr(n, d)}`] }; }
      const d = pick([2, 3, 4, 5, 6, 8, 10]), n = properFrac(d), m = d * rnd(1, 10);
      return { e: [F(n, d), T('von'), N(m)], a: I(n * m / d), w: [`${fr(n, d)} von ${m}: erst durch ${d} teilen, dann mal ${n}.`, `${m} : ${d} = ${m / d}`, ...(n > 1 ? [`${m / d} · ${n} = ${n * m / d}`] : [])] };
    }
    if (l === 2) {
      let d1, d2;
      do { d1 = pick([2, 3, 4, 5, 6, 8, 10, 12]); d2 = pick([2, 3, 4, 5, 6, 8, 10, 12]); } while (d1 === d2 || lcm(d1, d2) > 24);
      let n1 = properFrac(d1), n2 = properFrac(d2);
      if (coin() && n1 * d2 !== n2 * d1) {
        if (n1 * d2 < n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; }
        return { e: [F(n1, d1), O('−'), F(n2, d2)], a: Fr(n1 * d2 - n2 * d1, d1 * d2), hint: H, w: fracAddW(n1, d1, n2, d2, '−') };
      }
      return { e: [F(n1, d1), O('+'), F(n2, d2)], a: Fr(n1 * d2 + n2 * d1, d1 * d2), hint: H, w: fracAddW(n1, d1, n2, d2, '+') };
    }
    if (l === 3) {
      const d1 = rnd(2, 9), d2 = rnd(2, 9), n1 = properFrac(d1), n2 = properFrac(d2);
      return coin()
        ? { e: [F(n1, d1), O('·'), F(n2, d2)], a: Fr(n1 * n2, d1 * d2), hint: H, w: ['Zähler mal Zähler, Nenner mal Nenner:', `${fr(n1, d1)} · ${fr(n2, d2)} = ${fr(n1 * n2, d1 * d2)}`, ...redW(n1 * n2, d1 * d2)] }
        : { e: [F(n1, d1), O(':'), F(n2, d2)], a: Fr(n1 * d2, d1 * n2), hint: H, w: [`Mit dem Kehrwert von ${fr(n2, d2)} malnehmen:`, `${fr(n1, d1)} · ${fr(d2, n2)} = ${fr(n1 * d2, d1 * n2)}`, ...redW(n1 * d2, d1 * n2)] };
    }
    const d = rnd(2, 9), n = properFrac(d), k = rnd(2, 9);
    switch (rnd(0, 3)) {
      case 0: return { e: [N(k), O('·'), F(n, d)], a: Fr(k * n, d), hint: H, w: [`Nur den Zähler mal ${k} nehmen:`, `${k} · ${fr(n, d)} = ${fr(k * n, d)}`, ...redW(k * n, d)] };
      case 1: { const g = rnd(1, 5); return { e: [N(g), O('−'), F(n, d)], a: Fr(g * d - n, d), hint: H, w: [`${g} als Bruch: ${g} = ${fr(g * d, d)}`, `${fr(g * d, d)} − ${fr(n, d)} = ${fr(g * d - n, d)}`, ...redW(g * d - n, d)] }; }
      case 2: return { e: [F(n, d), O(':'), N(k)], a: Fr(n, d * k), hint: H, w: [`Durch ${k} teilen heißt: Nenner mal ${k}.`, `${fr(n, d)} : ${k} = ${fr(n, d * k)}`, ...redW(n, d * k)] };
      default: {
        let d1, d2; do { d1 = rnd(2, 12); d2 = rnd(2, 12); } while (d1 === d2 || lcm(d1, d2) > 60);
        const n1 = properFrac(d1), n2 = properFrac(d2);
        return { e: [F(n1, d1), O('+'), F(n2, d2)], a: Fr(n1 * d2 + n2 * d1, d1 * d2), hint: H, w: fracAddW(n1, d1, n2, d2, '+') };
      }
    }
  },

  dec(l) {
    if (l === 0) {
      let a = noTrail(11, 99), b = noTrail(11, 99);
      if (coin()) return { e: [D(a, 1), O('+'), D(b, 1)], a: De(a + b, 10), w: [`In Zehnteln rechnen: ${a} + ${b} = ${a + b} Zehntel`, `${a + b} Zehntel = ${fmtDec(a + b, 1)}`] };
      if (a === b) a += 1; if (a < b) [a, b] = [b, a];
      return { e: [D(a, 1), O('−'), D(b, 1)], a: De(a - b, 10), w: [`In Zehnteln rechnen: ${a} − ${b} = ${a - b} Zehntel`, `${a - b} Zehntel = ${fmtDec(a - b, 1)}`] };
    }
    if (l === 1) {
      const x = D(noTrail(101, 999), 2), y = D(noTrail(11, 99), 1), vx = x.i, vy = y.i * 10;
      const head = ['Komma unter Komma – in Hundertsteln rechnen:', `${fmtDec(x.i, 2)} = ${vx} Hundertstel, ${fmtDec(y.i, 1)} = ${vy} Hundertstel`];
      if (coin() || vx === vy) { const e = coin() ? [x, O('+'), y] : [y, O('+'), x]; return { e, a: De(vx + vy, 100), w: [...head, `${vx} + ${vy} = ${vx + vy} Hundertstel = ${fmtDec(vx + vy, 2)}`] }; }
      return vx > vy ? { e: [x, O('−'), y], a: De(vx - vy, 100), w: [...head, `${vx} − ${vy} = ${vx - vy} Hundertstel = ${fmtDec(vx - vy, 2)}`] }
        : { e: [y, O('−'), x], a: De(vy - vx, 100), w: [...head, `${vy} − ${vx} = ${vy - vx} Hundertstel = ${fmtDec(vy - vx, 2)}`] };
    }
    if (l === 2) {
      const k = rnd(1, 2), xi = noTrail(11, 999), f = pick([10, 100, 1000]), z = Math.log10(f), st = z > 1 ? `${z} Stellen` : 'eine Stelle';
      return coin() ? { e: [D(xi, k), O('·'), N(f)], a: De(xi * f, 10 ** k), w: [`Mal ${f}: Komma um ${st} nach rechts`, `${fmtDec(xi, k)} · ${f} = ${decOfQ(Q(xi * f, 10 ** k))}`] }
        : { e: [D(xi, k), O(':'), N(f)], a: De(xi, 10 ** k * f), w: [`Geteilt durch ${f}: Komma um ${st} nach links`, `${fmtDec(xi, k)} : ${f} = ${decOfQ(Q(xi, 10 ** k * f))}`] };
    }
    if (l === 3) {
      if (rand() < .3) { const a = rnd(1, 9), b = rnd(1, 9); return { e: [D(a, 1), O('·'), D(b, 1)], a: De(a * b, 100), w: [`Ohne Komma rechnen: ${a} · ${b} = ${a * b}`, `Zusammen zwei Nachkommastellen: ${fmtDec(a * b, 2)}`] }; }
      const a = noTrail(11, 99), b = rnd(2, 9);
      return { e: [D(a, 1), O('·'), N(b)], a: De(a * b, 10), w: [`Ohne Komma rechnen: ${a} · ${b} = ${a * b}`, `Eine Nachkommastelle zurück: ${fmtDec(a * b, 1)}`] };
    }
    switch (rnd(0, 2)) {
      case 0: { const q = noTrail(11, 99), b = rnd(2, 9); return { e: [D(q * b, 1), O(':'), N(b)], a: De(q, 10), w: [`In Zehnteln rechnen: ${q * b} Zehntel : ${b} = ${q} Zehntel`, `${q} Zehntel = ${fmtDec(q, 1)}`] }; }
      case 1: { const b = rnd(2, 9), q = rnd(2, 12); return { e: [D(q * b, 1), O(':'), D(b, 1)], a: I(q), w: ['Beide Zahlen mal 10 – das Ergebnis bleibt gleich:', `${q * b} : ${b} = ${q}`] }; }
      default: {
        const d = pick([2, 4, 5, 8, 10, 20, 25]), n = properFrac(d);
        let k = 1; while ((10 ** k) % d) k++; const m = 10 ** k / d;
        return { e: [F(n, d)], a: De(n, d), hint: 'als Dezimalzahl', w: [`Erweitern auf ${10 ** k}: ${fr(n, d)} = ${fr(n * m, 10 ** k)}`, `${fr(n * m, 10 ** k)} = ${fmtDec(n * m, k)}`] };
      }
    }
  },

  pct(l) {
    const mult = (p, max) => { const step = 100 / gcd(p, 100); return step * rnd(1, Math.max(1, Math.floor(max / step))); };
    if (l <= 1) { const p = l === 0 ? pick([50, 25, 10]) : pick([1, 5, 20, 75, 30, 40, 15, 60]), m = mult(p, l === 0 ? 200 : 400); return { e: [N(p), T('% von'), N(m)], a: I(p * m / 100), w: pctW(p, m) }; }
    const p = pick([10, 20, 25, 50, 75, 5, 40, 30]), m = mult(p, 300), part = p * m / 100;
    if (l === 2) return { e: [N(part), T('von'), N(m)], a: I(p), unit: '%', hint: 'Wie viel Prozent sind das?', w: [`Anteil als Bruch: ${fr(part, m)}`, `${fr(part, m)} = ${fr(p, 100)}`, `${fr(p, 100)} = ${p} %`] };
    if (l === 3) return { e: [N(p), T('% sind'), N(part)], a: I(m), hint: 'Wie viel sind 100 %?', w: 100 % p === 0 ? [`${p} % passen ${100 / p}-mal in 100 %.`, `${part} · ${100 / p} = ${m}`] : [`1 % = ${part} : ${p}`, `100 % = ${part} : ${p} · 100 = ${m}`] };
    const up = coin(), q = pick([10, 20, 25, 50, 5, 15, 30]), price = mult(q, 400), dlt = price * q / 100;
    return { e: [N(price), U('€'), O(up ? '+' : '−'), N(q), U('%')], a: I(price + (up ? dlt : -dlt)), unit: '€', hint: up ? 'Preis wird erhöht' : 'Preis wird reduziert', w: [...pctW(q, price), up ? `${price} € + ${dlt} € = ${price + dlt} €` : `${price} € − ${dlt} € = ${price - dlt} €`] };
  },

  neg(l) {
    const plusW = (a, b) => b < 0 ? [`Plus eine negative Zahl heißt minus: ${fi(a)} + ${par(b)} = ${fi(a)} − ${fi(-b)}`, `= ${fi(a + b)}`] : [`Starte bei ${fi(a)} und gehe ${b} nach rechts.`, `${fi(a)} + ${b} = ${fi(a + b)}`];
    const minusW = (a, b) => b < 0 ? [`Minus eine negative Zahl heißt plus: ${fi(a)} − ${par(b)} = ${fi(a)} + ${fi(-b)}`, `= ${fi(a - b)}`] : [`Starte bei ${fi(a)} und gehe ${b} nach links.`, `${fi(a)} − ${b} = ${fi(a - b)}`];
    const signW = (a, b, r, op) => [`Vorzeichen: ${a < 0 ? 'minus' : 'plus'} ${op} ${b < 0 ? 'minus' : 'plus'} ergibt ${r < 0 ? 'minus' : 'plus'}.`, `${Math.abs(a)} ${op === 'mal' ? '·' : ':'} ${Math.abs(b)} = ${Math.abs(r)}`, `Ergebnis: ${fi(r)}`];
    if (l === 0) { let a, b; do { a = rnd(-10, 10); b = rnd(-10, 10); } while (a >= 0 && b >= 0); return { e: [N(a), O('+'), N(b, true)], a: I(a + b), w: plusW(a, b) }; }
    if (l === 1) { const a = rnd(-10, 10), b = rnd(2, 15); return { e: [N(a), O('−'), N(b)], a: I(a - b), w: minusW(a, b) }; }
    if (l === 2) { const a = rnd(-20, 20), b = rnd(-20, -1); return coin() ? { e: [N(a), O('+'), N(b, true)], a: I(a + b), w: plusW(a, b) } : { e: [N(a), O('−'), N(b, true)], a: I(a - b), w: minusW(a, b) }; }
    if (l === 3) {
      let a, b; do { a = rnd(1, 10) * sign(); b = rnd(1, 10) * sign(); } while (a > 0 && b > 0);
      return coin() ? { e: [N(a), O('·'), N(b, true)], a: I(a * b), w: signW(a, b, a * b, 'mal') } : { e: [N(a * b), O(':'), N(b, true)], a: I(a), w: signW(a * b, b, a, 'geteilt durch') };
    }
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(-60, 60), b = rnd(-60, 60); return { e: [N(a), O('−'), N(b, true)], a: I(a - b), w: minusW(a, b) }; }
      case 1: { const a = rnd(2, 15) * sign(), b = rnd(2, 9) * sign(); return { e: [N(a), O('·'), N(b, true)], a: I(a * b), w: signW(a, b, a * b, 'mal') }; }
      default: { const a = rnd(-20, 20), b = rnd(-20, 20), c = rnd(-20, 20); return { e: [N(a), O('−'), N(b, true), O('+'), N(c, true)], a: I(a - b + c), w: ['Von links nach rechts rechnen:', `${fi(a)} − ${par(b)} = ${fi(a - b)}`, `${fi(a - b)} + ${par(c)} = ${fi(a - b + c)}`] }; }
    }
  },

  pow(l) {
    const sq = (lo, hi) => { const n = rnd(lo, hi); return { e: [P(n, 2)], a: I(n * n), w: [`${n}² = ${n} · ${n} = ${n * n}`] }; };
    const rt = (lo, hi) => { const n = rnd(lo, hi); return { e: [W(n * n)], a: I(n), w: [`Welche Zahl mal sich selbst ergibt ${n * n}?`, `${n} · ${n} = ${n * n}, also √${n * n} = ${n}`] }; };
    if (l === 0) return sq(1, 10);
    if (l === 1) return coin() ? sq(1, 12) : rt(1, 12);
    if (l === 2) return coin() ? sq(11, 20) : rt(11, 20);
    if (l === 3) {
      const [b, e] = pick([[2, rnd(0, 10)], [10, rnd(0, 6)], [rnd(1, 6), 3], [3, rnd(0, 5)], [5, rnd(0, 4)]]), r = b ** e;
      const w = e === 0 ? ['Jede Zahl hoch 0 ergibt 1.'] : e === 1 ? [`Hoch 1 ändert nichts: ${b}`] : b === 10 ? [`10 hoch ${e} ist eine 1 mit ${e} Nullen: ${fi(r)}`] : [`${b} ${e}-mal mit sich selbst malnehmen:`, `${Array(e).fill(b).join(' · ')} = ${fi(r)}`];
      return { e: [P(b, e)], a: I(r), w };
    }
    switch (rnd(0, 3)) {
      case 0: { const a = rnd(1, 12), b = rnd(1, 12); return { e: [P(a, 2), O('+'), P(b, 2)], a: I(a * a + b * b), w: [`Erst die Potenzen: ${a}² = ${a * a}, ${b}² = ${b * b}`, `${a * a} + ${b * b} = ${a * a + b * b}`] }; }
      case 1: { const a = rnd(3, 15), b = rnd(1, a - 1); return { e: [P(a, 2), O('−'), P(b, 2)], a: I(a * a - b * b), w: [`Erst die Potenzen: ${a}² = ${a * a}, ${b}² = ${b * b}`, `${a * a} − ${b * b} = ${a * a - b * b}`] }; }
      case 2: { const x = rnd(1, 15), y = rnd(1, 15); return { e: [W(x * x), O('+'), W(y * y)], a: I(x + y), w: [`√${x * x} = ${x} und √${y * y} = ${y}`, `${x} + ${y} = ${x + y}`] }; }
      default: { const x = rnd(2, 12), b = rnd(2, 9); return { e: [W(x * x), O('·'), N(b)], a: I(x * b), w: [`√${x * x} = ${x}`, `${x} · ${b} = ${x * b}`] }; }
    }
  },

  order(l) {
    const PV = 'Punkt vor Strich: ';
    if (l === 0) {
      const a = rnd(1, 20), b = rnd(2, 10), c = rnd(2, 10);
      return coin() ? { e: [N(a), O('+'), N(b), O('·'), N(c)], a: I(a + b * c), w: [`${PV}zuerst ${b} · ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] }
        : { e: [N(b), O('·'), N(c), O('+'), N(a)], a: I(b * c + a), w: [`${PV}zuerst ${b} · ${c} = ${b * c}`, `${b * c} + ${a} = ${b * c + a}`] };
    }
    if (l === 1) {
      if (coin()) { const a = rnd(1, 9), b = rnd(1, 9), c = rnd(2, 9); return { e: [K('('), N(a), O('+'), N(b), K(')'), O('·'), N(c)], a: I((a + b) * c), w: [`Klammer zuerst: ${a} + ${b} = ${a + b}`, `${a + b} · ${c} = ${(a + b) * c}`] }; }
      const b = rnd(2, 9), c = rnd(2, 9), a = b * c + rnd(0, 30);
      return { e: [N(a), O('−'), N(b), O('·'), N(c)], a: I(a - b * c), w: [`${PV}zuerst ${b} · ${c} = ${b * c}`, `${a} − ${b * c} = ${a - b * c}`] };
    }
    if (l === 2) {
      switch (rnd(0, 2)) {
        case 0: { const c = rnd(2, 9), b = c * rnd(2, 10), a = rnd(1, 50); return { e: [N(a), O('+'), N(b), O(':'), N(c)], a: I(a + b / c), w: [`${PV}zuerst ${b} : ${c} = ${b / c}`, `${a} + ${b / c} = ${a + b / c}`] }; }
        case 1: { const a = rnd(3, 9), b = rnd(3, 9), c = rnd(2, 5), d = rnd(1, Math.floor(a * b / c)); return { e: [N(a), O('·'), N(b), O('−'), N(c), O('·'), N(d)], a: I(a * b - c * d), w: [`${PV}${a} · ${b} = ${a * b} und ${c} · ${d} = ${c * d}`, `${a * b} − ${c * d} = ${a * b - c * d}`] }; }
        default: { const b = rnd(1, 15), a = b + rnd(1, 10), c = rnd(2, 9); return { e: [K('('), N(a), O('−'), N(b), K(')'), O('·'), N(c)], a: I((a - b) * c), w: [`Klammer zuerst: ${a} − ${b} = ${a - b}`, `${a - b} · ${c} = ${(a - b) * c}`] }; }
      }
    }
    if (l === 3) {
      if (coin()) { const a = rnd(2, 9), b = rnd(1, 12), c = rnd(1, 12), d = rnd(1, a * (b + c)); return { e: [N(a), O('·'), K('('), N(b), O('+'), N(c), K(')'), O('−'), N(d)], a: I(a * (b + c) - d), w: [`Klammer zuerst: ${b} + ${c} = ${b + c}`, `Dann Punkt vor Strich: ${a} · ${b + c} = ${a * (b + c)}`, `${a * (b + c)} − ${d} = ${a * (b + c) - d}`] }; }
      const c = rnd(2, 9), s = c * rnd(2, 12), a = rnd(1, s - 1), b = s - a, d = rnd(1, 40);
      return { e: [K('('), N(a), O('+'), N(b), K(')'), O(':'), N(c), O('+'), N(d)], a: I(s / c + d), w: [`Klammer zuerst: ${a} + ${b} = ${s}`, `Dann Punkt vor Strich: ${s} : ${c} = ${s / c}`, `${s / c} + ${d} = ${s / c + d}`] };
    }
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(2, 15), b = rnd(2, 15), d = rnd(1, 9), c = d + rnd(1, 9); return { e: [K('('), N(a), O('+'), N(b), K(')'), O('·'), K('('), N(c), O('−'), N(d), K(')')], a: I((a + b) * (c - d)), w: [`Beide Klammern zuerst: ${a} + ${b} = ${a + b} und ${c} − ${d} = ${c - d}`, `${a + b} · ${c - d} = ${(a + b) * (c - d)}`] }; }
      case 1: { const a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 9), d = rnd(2, 9), e = rnd(1, a * b + c * d); return { e: [N(a), O('·'), N(b), O('+'), N(c), O('·'), N(d), O('−'), N(e)], a: I(a * b + c * d - e), w: [`${PV}${a} · ${b} = ${a * b} und ${c} · ${d} = ${c * d}`, `${a * b} + ${c * d} = ${a * b + c * d}`, `${a * b + c * d} − ${e} = ${a * b + c * d - e}`] }; }
      default: { const c = rnd(1, 9), b = c + rnd(1, 6), d = rnd(2, 9), a = (b - c) * d + rnd(0, 60); return { e: [N(a), O('−'), K('('), N(b), O('−'), N(c), K(')'), O('·'), N(d)], a: I(a - (b - c) * d), w: [`Klammer zuerst: ${b} − ${c} = ${b - c}`, `Dann Punkt vor Strich: ${b - c} · ${d} = ${(b - c) * d}`, `${a} − ${(b - c) * d} = ${a - (b - c) * d}`] }; }
    }
  },

  round(l) {
    const r = (x, m) => Math.round(x / m) * m;
    const NM = { 10: ['Zehner', 'Einerstelle'], 100: ['Hunderter', 'Zehnerstelle'], 1000: ['Tausender', 'Hunderterstelle'] };
    const rw = (x, m) => { const dig = Math.floor(x % m / (m / 10)); return [`Entscheidend ist die ${NM[m][1]}: ${dig}`, dig >= 5 ? `${dig} ist 5 oder mehr → aufrunden` : `${dig} ist kleiner als 5 → abrunden`, `${fi(x)} ≈ ${fi(r(x, m))}`]; };
    const task = (x, m) => ({ e: [T('Runde'), N(x), T(`auf ${NM[m][0]}`)], a: I(r(x, m)), eqSign: '≈', w: rw(x, m) });
    if (l === 0) { let x; do x = rnd(11, 999); while (x % 10 === 0); return task(x, 10); }
    if (l === 1) { let x; do x = rnd(101, 9999); while (x % 100 === 0); return task(x, 100); }
    if (l === 2) {
      if (coin()) { let x; do x = rnd(1001, 99999); while (x % 1000 === 0); return task(x, 1000); }
      const i = noTrail(101, 9999), h = i % 10, ri = Math.round(i / 10);
      return { e: [T('Runde'), D(i, 2), T('auf Zehntel')], a: De(ri, 10), eqSign: '≈', w: [`Entscheidend ist die Hundertstelstelle: ${h}`, h >= 5 ? `${h} ist 5 oder mehr → aufrunden` : `${h} ist kleiner als 5 → abrunden`, `${fmtDec(i, 2)} ≈ ${fmtDec(ri, 1)}`] };
    }
    if (l === 3) {
      let a = rnd(101, 999), b = rnd(101, 999); const minus = coin();
      if (minus && r(a, 100) < r(b, 100)) [a, b] = [b, a];
      const ra = r(a, 100), rb = r(b, 100);
      return { e: [T('Überschlag:'), N(a), O(minus ? '−' : '+'), N(b)], a: I(minus ? ra - rb : ra + rb), eqSign: '≈', hint: 'Runde beide Zahlen auf Hunderter', w: [`${a} ≈ ${ra} und ${b} ≈ ${rb}`, `${ra} ${minus ? '−' : '+'} ${rb} = ${minus ? ra - rb : ra + rb}`] };
    }
    const a = rnd(12, 99), b = rnd(12, 99), ra = r(a, 10), rb = r(b, 10);
    return { e: [T('Überschlag:'), N(a), O('·'), N(b)], a: I(ra * rb), eqSign: '≈', hint: 'Runde beide Zahlen auf Zehner', w: [`${a} ≈ ${ra} und ${b} ≈ ${rb}`, `${ra} · ${rb} = ${fi(ra * rb)}`] };
  },

  unit(l) {
    const conv = (pairs, maxX) => {
      const [from, to, f] = pick(pairs);
      if (coin()) { const x = rnd(1, maxX); return { e: [N(x), U(from)], a: I(x * f), unit: to, w: [`1 ${from} = ${fi(f)} ${to}`, `${x} · ${fi(f)} = ${fi(x * f)}`] }; }
      const y = rnd(1, maxX); return { e: [N(y * f), U(to)], a: I(y), unit: from, w: [`1 ${from} = ${fi(f)} ${to}`, `${fi(y * f)} : ${fi(f)} = ${y}`] };
    };
    if (l === 0) return conv([['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['€', 'ct', 100], ['m', 'dm', 10]], 20);
    if (l === 1) return conv([['km', 'm', 1000], ['h', 'min', 60], ['min', 's', 60], ['Tage', 'h', 24], ['l', 'ml', 1000], ['t', 'kg', 1000]], 12);
    if (l === 2) {
      if (coin()) {
        const [from, to, f] = pick([['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000], ['h', 'min', 60], ['€', 'ct', 100]]), i = noTrail(11, 99);
        return { e: [D(i, 1), U(from)], a: De(i * f, 10), unit: to, w: [`1 ${from} = ${fi(f)} ${to}`, `${fmtDec(i, 1)} · ${fi(f)} = ${decOfQ(Q(i * f, 10))}`] };
      }
      const [from, to, f] = pick([['g', 'kg', 1000], ['m', 'km', 1000], ['ml', 'l', 1000], ['cm', 'm', 100], ['ct', '€', 100]]);
      let x; do x = rnd(11, f * 3 - 1); while (x % f === 0 || x % 10 === 0 && x % 100 === 0);
      return { e: [N(x), U(from)], a: De(x, f), unit: to, w: [`1 ${to} = ${fi(f)} ${from}`, `${fi(x)} : ${fi(f)} = ${decOfQ(Q(x, f))}`] };
    }
    if (l === 3) return conv([['m²', 'dm²', 100], ['dm²', 'cm²', 100], ['m²', 'cm²', 10000], ['ha', 'm²', 10000], ['l', 'cm³', 1000], ['dm³', 'l', 1], ['cm³', 'ml', 1], ['m³', 'dm³', 1000], ['a', 'm²', 100]], 9);
    switch (rnd(0, 4)) {
      case 0: { const h = rnd(1, 4), mi = 5 * rnd(1, 11); return { e: [N(h), U('h'), N(mi), U('min')], a: I(h * 60 + mi), unit: 'min', w: [`${h} h = ${h * 60} min`, `${h * 60} + ${mi} = ${h * 60 + mi} min`] }; }
      case 1: { const m = rnd(1, 9), c = rnd(1, 99); return { e: [N(m), U('m'), N(c), U('cm')], a: I(m * 100 + c), unit: 'cm', w: [`${m} m = ${m * 100} cm`, `${m * 100} + ${c} = ${m * 100 + c} cm`] }; }
      case 2: { const k = rnd(1, 9), g = rnd(5, 995); return { e: [N(k), U('kg'), N(g), U('g')], a: I(k * 1000 + g), unit: 'g', w: [`${k} kg = ${k * 1000} g`, `${k * 1000} + ${g} = ${fi(k * 1000 + g)} g`] }; }
      case 3: { const h = rnd(1, 4), q = pick([15, 30, 45]), mi = h * 60 + q; return { e: [N(mi), U('min')], a: De(mi, 60), unit: 'h', w: [`${mi} min = ${h} h ${q} min`, `${q} min = ${fmtDec(q * 100 / 60, 2)} h → ${decOfQ(Q(mi, 60))} h`] }; }
      default: { const x = pick([[25, 2, 15], [5, 1, 30], [75, 2, 45]]); return { e: [D(x[0], x[1]), U('h')], a: I(x[2]), unit: 'min', w: ['1 h = 60 min', `${fmtDec(x[0], x[1])} · 60 = ${x[2]} min`] }; }
    }
  },

  divis(l) {
    if (l === 0) {
      const b = rnd(2, 9), q = rnd(2, 10), r = rnd(1, b - 1), a = b * q + r;
      return { e: [N(a), O(':'), N(b), Eq(), N(q), T('Rest'), Gap()], a: I(r), noEq: true, hint: 'Wie groß ist der Rest?', w: [`${q} · ${b} = ${q * b}`, `${a} − ${q * b} = ${r}`, `Also ${a} : ${b} = ${q} Rest ${r}`] };
    }
    if (l === 1) {
      const x = rnd(100, 99999), dg = String(x).split('').map(Number), s = dg.reduce((p, c) => p + c, 0);
      return { e: [T('Quersumme von'), N(x)], a: I(s), w: [`Alle Ziffern addieren: ${dg.join(' + ')} = ${s}`, s % 3 === 0 ? `Tipp: ${s} ist durch 3 teilbar – also auch ${fi(x)}.` : `Tipp: ${s} ist nicht durch 3 teilbar – also auch ${fi(x)} nicht.`] };
    }
    if (l === 2) {
      const g = rnd(2, 12); let x, y; do { x = rnd(1, 9); y = rnd(1, 9); } while (x === y || gcd(x, y) !== 1);
      const a = g * x, b = g * y;
      return { e: [S_(`ggT(${a}, ${b})`)], a: I(g), w: [`Teiler von ${a}: ${divisors(a).join(', ')}`, `Teiler von ${b}: ${divisors(b).join(', ')}`, `Der größte gemeinsame Teiler ist ${g}.`] };
    }
    if (l === 3) {
      let a, b; do { a = rnd(2, 15); b = rnd(2, 15); } while (a === b || lcm(a, b) > 120);
      const L = lcm(a, b), mult = n => Array.from({ length: L / n }, (_, i) => n * (i + 1)).slice(-6);
      return { e: [S_(`kgV(${a}, ${b})`)], a: I(L), w: [`Vielfache von ${a}: …, ${mult(a).join(', ')}`, `Vielfache von ${b}: …, ${mult(b).join(', ')}`, `Das kleinste gemeinsame Vielfache ist ${L}.`] };
    }
    if (coin()) {
      const pr = [3, 5, 7, 11, 13]; let p, q; do { p = pick(pr); q = pick(pr); } while (p * q > 200); if (p > q) [p, q] = [q, p];
      const n = p * q, before = [2, 3, 5, 7, 11].filter(x => x < p);
      return { e: [T('kleinster Primfaktor von'), N(n)], a: I(p), w: [...(before.length ? [`${n} ist nicht durch ${before.join(', ')} teilbar.`] : []), `${n} = ${p} · ${q}`, `Der kleinste Primfaktor ist ${p}.`] };
    }
    const n = rnd(12, 100), dv = divisors(n);
    return { e: [T('Anzahl der Teiler von'), N(n)], a: I(dv.length), w: [`Teiler von ${n}: ${dv.join(', ')}`, `Das sind ${dv.length} Teiler.`] };
  },

  eq(l) {
    const mk = (e, x, w) => ({ e, a: I(x), noEq: true, pre: 'x =', w });
    if (l === 0) {
      const a = rnd(1, 30);
      if (coin()) { const x = rnd(1, 30); return mk([V(1), O('+'), N(a), Eq(), N(x + a)], x, [`Auf beiden Seiten ${a} abziehen:`, `x = ${x + a} − ${a} = ${x}`]); }
      const x = rnd(a + 1, a + 30); return mk([V(1), O('−'), N(a), Eq(), N(x - a)], x, [`Auf beiden Seiten ${a} addieren:`, `x = ${x - a} + ${a} = ${x}`]);
    }
    if (l === 1) {
      const a = rnd(2, 10), x = rnd(2, 12);
      return coin() ? mk([V(a), Eq(), N(a * x)], x, [`Beide Seiten durch ${a} teilen:`, `x = ${a * x} : ${a} = ${x}`]) : mk([V(1), O(':'), N(a), Eq(), N(x)], x * a, [`Beide Seiten mal ${a} nehmen:`, `x = ${x} · ${a} = ${x * a}`]);
    }
    if (l === 2) {
      const a = rnd(2, 9), x = rnd(1, 12), b = rnd(1, 20);
      return coin() ? mk([V(a), O('+'), N(b), Eq(), N(a * x + b)], x, [`− ${b} auf beiden Seiten: ${a}x = ${a * x}`, `: ${a} auf beiden Seiten: x = ${x}`])
        : mk([V(a), O('−'), N(b), Eq(), N(a * x - b)], x, [`+ ${b} auf beiden Seiten: ${a}x = ${a * x}`, `: ${a} auf beiden Seiten: x = ${x}`]);
    }
    if (l === 3) {
      let x; do x = rnd(-10, 10); while (!x);
      const a = rnd(2, 9), b = rnd(1, 9);
      if (coin()) { const c = a * x + b; return mk([V(a), O('+'), N(b), Eq(), N(c)], x, [`− ${b} auf beiden Seiten: ${a}x = ${fi(c - b)}`, `: ${a} auf beiden Seiten: x = ${fi(x)}`]); }
      return mk([N(a), K('('), V(1), O('+'), N(b), K(')'), Eq(), N(a * (x + b))], x, [`: ${a} auf beiden Seiten: x + ${b} = ${fi(x + b)}`, `− ${b} auf beiden Seiten: x = ${fi(x)}`]);
    }
    const a = rnd(3, 9), c = rnd(1, a - 1); let x; do x = rnd(-8, 12); while (!x);
    const b = rnd(-20, 20), d = (a - c) * x + b;
    const side = (k, v) => [V(k), ...(v ? [O(v > 0 ? '+' : '−'), N(Math.abs(v))] : [])];
    return mk([...side(a, b), Eq(), ...side(c, d)], x, [`− ${c}x auf beiden Seiten: ${a - c === 1 ? '' : a - c}x${b ? sgnTerm(b) : ''} = ${fi(d)}`, ...(b ? [`${b > 0 ? '− ' + b : '+ ' + (-b)} auf beiden Seiten: ${a - c === 1 ? '' : a - c}x = ${fi(d - b)}`] : []), ...(a - c > 1 ? [`: ${a - c} auf beiden Seiten: x = ${fi(x)}`] : [])]);
  },

  word(l) {
    const n = pick(NAMES); let n2; do n2 = pick(NAMES); while (n2 === n);
    const W_ = (story, a, unit, w, hint) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true, hint });
    if (l === 0) {
      switch (rnd(0, 3)) {
        case 0: { const a = rnd(3, 12), b = rnd(2, 8); return W_(`${n} hat ${a} Murmeln und bekommt ${b} geschenkt. Wie viele Murmeln hat ${n} jetzt?`, I(a + b), '', [`Dazubekommen heißt plus: ${a} + ${b} = ${a + b}`]); }
        case 1: { const a = rnd(8, 20), b = rnd(2, a - 1); return W_(`Im Bus sitzen ${a} Kinder. An der Haltestelle steigen ${b} aus. Wie viele Kinder sitzen noch im Bus?`, I(a - b), '', [`Aussteigen heißt minus: ${a} − ${b} = ${a - b}`]); }
        case 2: { const a = rnd(3, 12), b = a + rnd(2, 8); return W_(`${n} hat ${a} Sticker, ${n2} hat ${b} Sticker. Wie viele Sticker hat ${n2} mehr?`, I(b - a), '', [`Unterschied: ${b} − ${a} = ${b - a}`]); }
        default: { const p = rnd(1, 4), z = pick([5, 10]); return W_(`Ein Eis kostet ${p} €. ${n} bezahlt mit ${z} €. Wie viel Geld bekommt ${n} zurück?`, I(z - p), '€', [`Rückgeld = bezahlt − Preis`, `${z} − ${p} = ${z - p}`]); }
      }
    }
    if (l === 1) {
      switch (rnd(0, 4)) {
        case 0: { const p = rnd(2, 9), k = rnd(2, 9); return W_(`Ein Heft kostet ${p} €. ${n} kauft ${k} Hefte. Wie viel muss ${n} bezahlen?`, I(p * k), '€', [`${k} Hefte zu je ${p} €: ${k} · ${p} = ${k * p}`]); }
        case 1: { const k = rnd(2, 9), c = rnd(2, 9); return W_(`${k * c} Bonbons werden gerecht an ${k} Kinder verteilt. Wie viele Bonbons bekommt jedes Kind?`, I(c), '', [`Gerecht verteilen heißt teilen: ${k * c} : ${k} = ${c}`]); }
        case 2: { const r = rnd(3, 9), c = rnd(4, 9); return W_(`Im Klassenzimmer stehen ${r} Reihen mit je ${c} Stühlen. Wie viele Stühle sind es zusammen?`, I(r * c), '', [`${r} Reihen mit je ${c}: ${r} · ${c} = ${r * c}`]); }
        case 3: { const p = rnd(5, 20), d = rnd(3, 7); return W_(`${n} liest jeden Tag ${p} Seiten. Wie viele Seiten liest ${n} in ${d} Tagen?`, I(p * d), '', [`${d} Tage mit je ${p} Seiten: ${d} · ${p} = ${d * p}`]); }
        default: { const k = rnd(2, 6); return W_(`Eine Schulstunde dauert 45 Minuten. Wie viele Minuten dauern ${k} Schulstunden?`, I(45 * k), 'min', [`${k} · 45 = ${45 * k}`]); }
      }
    }
    if (l === 2) {
      switch (rnd(0, 3)) {
        case 0: { const c = rnd(69, 199), k = rnd(2, 5); return W_(`Ein Liter Milch kostet ${fmtMoney(c)} €. Wie viel kosten ${k} Liter?`, De(c * k, 100), '€', [`In Cent rechnen: ${k} · ${c} ct = ${c * k} ct`, `${c * k} ct = ${fmtMoney(c * k)} €`]); }
        case 1: { const d = pick([6, 8, 10, 12]), e = rnd(1, d - 1); return W_(`Eine Pizza wird in ${d} gleich große Stücke geschnitten. ${n} isst ${e} Stücke. Welcher Bruchteil der Pizza ist übrig?`, Fr(d - e, d), '', [`Übrig sind ${d - e} von ${d} Stücken: ${fr(d - e, d)}`, ...redW(d - e, d)], 'als gekürzter Bruch'); }
        case 2: { const a = rnd(3, 15), b = rnd(2, 12); return W_(`Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie groß ist seine Fläche?`, I(a * b), 'cm²', ['Fläche = Länge · Breite', `${a} · ${b} = ${a * b}`]); }
        default: { const a = rnd(5, 40), b = rnd(3, 25); return W_(`Ein Garten ist ${a} m lang und ${b} m breit. Wie lang wird ein Zaun rundherum?`, I(2 * (a + b)), 'm', ['Umfang = 2 · (Länge + Breite)', `2 · (${a} + ${b}) = 2 · ${a + b} = ${2 * (a + b)}`]); }
      }
    }
    if (l === 3) {
      switch (rnd(0, 3)) {
        case 0: { const q = pick([10, 20, 25, 50]), p = 20 * rnd(2, 12), d = p * q / 100; return W_(`Eine Jacke kostet ${p} € und wird um ${q} % reduziert. Was kostet sie jetzt?`, I(p - d), '€', [...pctW(q, p).slice(0, -1), `${q} % von ${p} € = ${d} €`, `${p} € − ${d} € = ${p - d} €`]); }
        case 1: { const tot = pick([20, 25, 50]), k = rnd(1, tot - 1), pc = k * 100 / tot; return W_(`Von ${tot} Schülerinnen und Schülern kommen ${k} mit dem Fahrrad. Wie viel Prozent sind das?`, I(pc), '%', [`Anteil: ${fr(k, tot)}`, `Erweitern auf 100: ${fr(k, tot)} = ${fr(pc, 100)} = ${pc} %`]); }
        case 2: { const v = 10 * rnd(6, 16), h = rnd(2, 5); return W_(`Ein Zug fährt ${v} km pro Stunde. Wie weit kommt er in ${h} Stunden?`, I(v * h), 'km', [`Weg = Tempo · Zeit`, `${v} · ${h} = ${v * h}`]); }
        default: { const c = 5 * rnd(10, 30), a = rnd(2, 5); let b; do b = rnd(3, 9); while (b === a); return W_(`${a} Hefte kosten ${fmtMoney(a * c)} €. Wie viel kosten ${b} Hefte?`, De(b * c, 100), '€', [`Dreisatz: erst den Preis für 1 Heft`, `${fmtMoney(a * c)} € : ${a} = ${fmtMoney(c)} €`, `${b} · ${fmtMoney(c)} € = ${fmtMoney(b * c)} €`]); }
      }
    }
    switch (rnd(0, 4)) {
      case 0: { const c = rnd(30, 60), k = rnd(3, 8), z = k * c < 500 ? 5 : 10; return W_(`${n} kauft ${k} Brötchen zu je ${c} Cent und bezahlt mit ${z} €. Wie viel Cent Rückgeld bekommt ${n}?`, I(z * 100 - k * c), 'ct', [`Preis: ${k} · ${c} ct = ${k * c} ct`, `${z} € = ${z * 100} ct`, `${z * 100} − ${k * c} = ${z * 100 - k * c} ct`]); }
      case 1: { const a = rnd(6, 12), m = rnd(3, 4), y = rnd(2, 10); return W_(`${n} ist ${a} Jahre alt. Die Mutter ist ${m}-mal so alt. Wie alt ist die Mutter in ${y} Jahren?`, I(a * m + y), 'Jahre', [`Mutter heute: ${m} · ${a} = ${a * m}`, `In ${y} Jahren: ${a * m} + ${y} = ${a * m + y}`]); }
      case 2: { const v = rnd(5, 9), d = 50 * rnd(3, 12); return W_(`Ein Auto verbraucht ${v} Liter auf 100 km. Wie viele Liter braucht es für ${d} km?`, De(v * d, 100), 'l', [`Für 1 km: ${v} : 100 Liter`, `Für ${d} km: ${v} · ${d} : 100 = ${decOfQ(Q(v * d, 100))}`]); }
      case 3: { const p = 20 * rnd(5, 20), q = pick([10, 20, 25]), r = 5 * rnd(1, 8), up = p * q / 100; return W_(`Ein Fahrrad kostet ${p} €. Zuerst wird es um ${q} % teurer, dann um ${r} € billiger. Was kostet es am Ende?`, I(p + up - r), '€', [`${q} % von ${p} € = ${up} €`, `${p} + ${up} = ${p + up} €`, `${p + up} − ${r} = ${p + up - r} €`]); }
      default: { const b = rnd(2, 8), a = rnd(2, 6), t = b * rnd(1, 4); return W_(`${a} Personen brauchen ${t} Tage, um einen Zaun zu streichen. Wie viele Tage brauchen ${b} Personen?`, I(a * t / b), 'Tage', [`Mehr Personen – weniger Tage (antiproportional).`, `Arbeit insgesamt: ${a} · ${t} = ${a * t} Personentage`, `${a * t} : ${b} = ${fq(a * t, b)}`]); }
    }
  },
};
const REAL_TOPICS = Object.keys(GEN);
function makeTask(topic, lvl) {
  const tp = topic === 'mix' ? pick(REAL_TOPICS) : topic;
  const t = GEN[tp](lvl);
  t.topic = tp; t.lvl = lvl;
  return t;
}
const keyOf = t => `${t.topic}|${taskText(t)}`;
