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
  let s = a.kind === 'dec' ? decOfQ(a.q) : d === 1 ? String(n) : `${n}/${d}`;
  if (a.money && s.includes(',')) s = s.replace(/,(\d)$/, ',$10');   // 38,7 → 38,70
  return s.replace('−', '-').replace(/\./g, '');
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
const Mo = c => ({ q: Q(c, 100), kind: 'dec', money: true });   // Geldbetrag: Lösung mit 2 Nachkommastellen
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
    case 'y': return `<span class="lgs" translate="no">${t.v.map(z => `<span>${esc(z)}</span>`).join('')}</span>`;
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
    case 'y': return t.v.join('; ');
    default: return t.v;
  }
}
const FRAC_NAMES = { 2: 'Halbe', 3: 'Drittel', 4: 'Viertel', 5: 'Fünftel', 6: 'Sechstel', 7: 'Siebtel', 8: 'Achtel', 9: 'Neuntel', 10: 'Zehntel', 11: 'Elftel', 12: 'Zwölftel', 13: 'Dreizehntel', 14: 'Vierzehntel', 15: 'Fünfzehntel', 16: 'Sechzehntel', 17: 'Siebzehntel', 18: 'Achtzehntel', 19: 'Neunzehntel', 20: 'Zwanzigstel', 24: 'Vierundzwanzigstel', 30: 'Dreißigstel', 36: 'Sechsunddreißigstel', 40: 'Vierzigstel', 50: 'Fünfzigstel', 1000: 'Tausendstel', 25: 'Fünfundzwanzigstel', 100: 'Hundertstel' };
function tokSpeech(t) {
  switch (t.t) {
    case 'n': return (t.v < 0 ? 'minus ' : '') + Math.abs(t.v);
    case 'd': return fmtDec(t.i, t.k).replace('−', 'minus ');
    case 'm': return `${Math.floor(t.c / 100)} Euro ${t.c % 100 || ''}`;
    case 'f': return t.n === 1 && t.d === 2 ? 'ein Halb' : FRAC_NAMES[t.d] ? `${t.n} ${FRAC_NAMES[t.d]}` : `${t.n} durch ${t.d}`;
    case 'o': return { '+': 'plus', '−': 'minus', '·': 'mal', ':': 'geteilt durch' }[t.v];
    case 'x': case 'u': case 's': return t.v.replace('%', ' Prozent').replace('€', ' Euro').replace('ggT', 'größter gemeinsamer Teiler von').replace('kgV', 'kleinstes gemeinsames Vielfaches von');
    case 'p': return `${tokSpeech(N(t.b))} hoch ${t.e}`;
    case 'r': return `Wurzel aus ${t.v}`;
    case 'g': return 'wie viel';
    case 'k': return t.v === '(' ? 'Klammer auf' : 'Klammer zu';
    case 'v': return `${t.c === 1 ? '' : t.c} x`;
    case 'q': return t.v === '=' ? 'gleich' : 'ungefähr';
    case 't': return t.v;
    case 'y': return t.v.join('. ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' gleich ');
  }
}
const taskText = t => t.e.map(tokText).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
const taskSpeech = t => t.e.map(tokSpeech).join(' ') + (t.hint ? '. ' + t.hint : '');

/* ---------- Themen ---------- */
const GROUPS = ['Grundrechnen', 'Brüche & Co.', 'Anwenden', 'Gemischt'];
const TOPICS = {
  add: { g: '+', name: 'Plus', grp: 0 }, sub: { g: '−', name: 'Minus', grp: 0 }, mul: { g: '·', name: 'Mal', grp: 0 },
  div: { g: ':', name: 'Geteilt', grp: 0 }, gap: { g: '□', name: 'Lücke', grp: 0 },
  doppel: { g: '×2', name: 'Verdoppeln', grp: 0 }, geld: { g: '€', name: 'Geld', grp: 0 },
  frac: { g: '½', name: 'Brüche', grp: 1 }, dec: { g: '0,5', name: 'Dezimal', grp: 1 }, pct: { g: '%', name: 'Prozent', grp: 1 },
  neg: { g: '−3', name: 'Negativ', grp: 1 }, pow: { g: 'x²', name: 'Potenzen', grp: 1 },
  term: { g: '3x', name: 'Terme', grp: 1 }, linear: { g: 'f(x)', name: 'Funktionen', grp: 1 }, zehner: { g: '10ⁿ', name: 'Zehnerpotenzen', grp: 1 },
  order: { g: '( )', name: 'Klammern', grp: 2 }, round: { g: '≈', name: 'Runden', grp: 2 }, unit: { g: 'cm', name: 'Einheiten', grp: 2 },
  divis: { g: 'ggT', name: 'Teiler', grp: 2 }, eq: { g: 'x=', name: 'Gleichung', grp: 2 }, lgs: { g: 'x|y', name: 'Gleichungssysteme', grp: 2 }, quad: { g: 'x²=0', name: 'Quadratische Gleichungen', grp: 2 },
  zeit: { g: '🕐', name: 'Uhr & Zeit', grp: 2 }, geo: { g: '📐', name: 'Geometrie', grp: 2 }, folge: { g: '🔢', name: 'Zahlenfolgen', grp: 2 },
  dreisatz: { g: '⇄', name: 'Dreisatz', grp: 2 }, zins: { g: '🏦', name: 'Zinsen', grp: 2 }, wahr: { g: '🎲', name: 'Wahrscheinlichkeit', grp: 2 }, stat: { g: 'Ø', name: 'Statistik', grp: 2 }, kreis: { g: 'π', name: 'Kreis', grp: 2 },
  word: { g: '📖', name: 'Textaufgaben', grp: 3, wide: true }, mix: { g: '★', name: 'Alles gemischt', grp: 3, wide: true },
};
const LEVEL_DESC = {
  add: ['Zahlenraum 10', 'Zahlenraum 20 mit Zehnerübergang', 'Bis 100: zweistellig + einstellig', 'Bis 100: zweistellig + zweistellig', 'Zahlenraum 1000', 'Profi: vierstellig mit mehreren Übergängen'],
  sub: ['Zahlenraum 10', 'Zahlenraum 20 mit Zehnerübergang', 'Bis 100: zweistellig − einstellig', 'Bis 100: zweistellig − zweistellig', 'Zahlenraum 1000', 'Profi: vierstellig mit mehreren Übergängen'],
  mul: ['Kernaufgaben (·1, ·2, ·5, ·10)', 'Kleines Einmaleins', 'Großes Einmaleins (11–19)', 'Zweistellig · einstellig', 'Zweistellig · zweistellig', 'Profi: dreistellig · zweistellig'],
  div: ['Kernaufgaben (:1, :2, :5, :10)', 'Kleines Einmaleins rückwärts', 'Großes Einmaleins rückwärts', 'Bis 900 : einstellig', 'Bis 625 : zweistellig', 'Profi: bis 25 000 : zweistellig'],
  gap: ['Plus- und Minus-Lücken bis 20', 'Plus- und Minus-Lücken bis 100', 'Mal-Lücken im großen Einmaleins', 'Geteilt-Lücken bis 900', 'Lücken bis 1000 und zweistellig mal', 'Profi: vierstellige und zweistufige Lücken'],
  frac: ['Gleichnamige Brüche addieren & subtrahieren', 'Kürzen und Bruchteile von Zahlen', 'Ungleichnamige Brüche addieren & subtrahieren', 'Brüche multiplizieren & dividieren', 'Brüche und ganze Zahlen gemischt', 'Profi: drei Brüche mit Klammern'],
  dec: ['Eine Nachkommastelle: plus & minus', 'Zwei Nachkommastellen: plus & minus', 'Mal & geteilt durch 10, 100, 1000', 'Dezimalzahlen multiplizieren', 'Dezimalzahlen dividieren & Brüche umwandeln', 'Profi: Rechenketten mit Dezimalzahlen'],
  pct: ['50 %, 25 % und 10 % von …', 'Weitere Prozentsätze von …', 'Prozentsatz gesucht', 'Grundwert gesucht', 'Preise erhöhen & reduzieren', 'Profi: mehrere Änderungen, Grundwert rückwärts'],
  neg: ['Plus mit negativen Zahlen bis 10', 'Minus ins Negative', 'Plus & minus mit Klammern bis 50', 'Mal & geteilt mit Vorzeichen', 'Drei Zahlen & größere Zahlen', 'Profi: Klammern und Punkt vor Strich mit Vorzeichen'],
  pow: ['Quadratzahlen bis 10²', 'Quadratzahlen & Wurzeln bis 12', 'Quadratzahlen & Wurzeln bis 20', 'Zweier-, Zehner- & Kubikpotenzen', 'Potenzen & Wurzeln kombinieren', 'Profi: Potenzregeln und Wurzeln aus Summen'],
  order: ['Punkt vor Strich', 'Klammern zuerst', 'Punkt vor Strich mit Geteilt', 'Klammern und Punkt vor Strich', 'Lange Rechenketten', 'Profi: verschachtelte Klammern'],
  round: ['Auf Zehner runden', 'Auf Hunderter runden', 'Auf Tausender oder Zehntel runden', 'Überschlag: plus & minus', 'Überschlag: mal', 'Profi: Überschlag mit großen Zahlen, Hundertstel'],
  unit: ['m, cm, kg, g, € und ct', 'km, Liter, Stunden, Minuten', 'Mit Kommazahlen umrechnen', 'Flächen und Rauminhalte', 'Gemischte Angaben (1 h 15 min …)', 'Profi: Tempo, Kommazahlen, gemischte Einheiten'],
  divis: ['Division mit Rest', 'Quersumme', 'Größter gemeinsamer Teiler', 'Kleinstes gemeinsames Vielfaches', 'Primfaktoren & Anzahl der Teiler', 'Profi: Euklid und kgV von drei Zahlen'],
  lgs: ['Additionsverfahren: x + y und x − y', 'Gleichsetzungsverfahren', 'Einsetzungsverfahren', 'Additionsverfahren: eine Gleichung malnehmen', 'Additionsverfahren: beide malnehmen, negative Lösungen', 'Profi: erst ordnen, große Zahlen'],
  quad: ['Quadratzahl umkehren: x² = Zahl', 'x² plus oder minus eine Zahl', 'Mit Faktor a·x² = Zahl und (x + s)² = Zahl', 'Produkt gleich null: (x + a)(x − b) = 0', 'Summe und Produkt: x² + px + q = 0', 'Profi: a·x² + b·x + c = 0'],
  eq: ['x + a = b', 'a · x = b und x : a = b', 'Zwei Schritte: a · x + b = c', 'Mit negativen Zahlen & Klammern', 'x auf beiden Seiten', 'Profi: Klammern auf beiden Seiten'],
  doppel: ['Verdoppeln & halbieren bis 20', 'Verdoppeln & halbieren bis 100', 'Verdoppeln & halbieren bis 1000', 'Halbieren mit Komma', 'Vierfach, Viertel, dreimal verdoppeln', 'Profi: Kommazahlen halbieren und vervielfachen'],
  geld: ['Cent plus & minus', 'Euro und Cent umrechnen, Rückgeld', 'Euro-Beträge plus & minus', 'Rückgeld und Mal mit Komma', 'Preise vergleichen (Dreisatz)', 'Profi: Kilopreise und Einkauf mit Rückgeld'],
  zeit: ['Viertelstunden, Stunden, Wochen', 'Uhrzeiten, Kalender, Tage und Stunden', 'Über die volle Stunde, Filmende', 'Lange Zeitspannen und Sekunden', 'Nachtfahrt, Kommastunden, Tempo', 'Profi: Etappen, Mehrtagesfahrten, Sekunden'],
  geo: ['Umfang von Quadrat und Rechteck', 'Fläche von Quadrat und Rechteck', 'Winkel im Dreieck, Seite aus Fläche', 'Dreieck, Quader, Viereck, Würfel', 'Pythagoras, Vielecke, Trapez, Volumen', 'Profi: Oberflächen, L-Formen, Prismen'],
  folge: ['Plus und minus in kleinen Schritten', 'Größere Schritte und Verdoppeln', 'Abwechselnd, wachsende Abstände, mal 3', 'Quadratzahlen, Halbieren, Fibonacci, Lücke', 'Negative Zahlen und knifflige Regeln', 'Profi: verschachtelte Regeln'],
  term: ['Termwert berechnen', 'Gleichartige Glieder zusammenfassen', 'Klammern ausmultiplizieren', 'Termwert mit x² und negativen Zahlen', 'Binomische Formeln', 'Profi: Klammer mal Klammer, x³'],
  linear: ['Funktionswert berechnen', 'Funktionswert & y-Achsenabschnitt', 'Steigung aus zwei Punkten', 'Nullstelle', 'Schnittpunkt zweier Geraden', 'Profi: Nullstelle aus zwei Punkten, Schnittpunkt'],
  zehner: ['Zehnerpotenzen ausrechnen', 'Zahl mal Zehnerpotenz', 'Kommazahl mal Zehnerpotenz', 'Große Zahlen: Exponent gesucht', 'Kleine Zahlen: negativer Exponent', 'Profi: mit Zehnerpotenzen rechnen'],
  dreisatz: ['Preise (proportional)', 'Verbrauch und Strecke', 'Antiproportional: Pumpen', 'Preise mit Komma', 'Antiproportional: Vorräte', 'Profi: zusammengesetzter Dreisatz'],
  zins: ['Jahreszinsen', 'Zinssatz gesucht', 'Kapital gesucht', 'Zinsen für Monate', 'Zinseszins', 'Profi: Zinseszins über 3 Jahre, Tageszinsen'],
  wahr: ['Würfel und Münze', 'Kugeln ziehen', 'Gegenereignis, Prozent, Erwartung', 'Zweistufig mit Zurücklegen', 'Ohne Zurücklegen, mindestens einmal', 'Profi: genau eine, mindestens eine, dreimal'],
  stat: ['Mittelwert', 'Median (ungerade Anzahl)', 'Spannweite', 'Median (gerade Anzahl)', 'Fehlender Wert für einen Durchschnitt', 'Profi: gewichteter Durchschnitt, zehn Werte'],
  kreis: ['Umfang aus dem Durchmesser', 'Umfang aus dem Radius', 'Kreisfläche', 'Kreisfläche aus dem Durchmesser', 'Volumen eines Zylinders', 'Profi: Kreisring, Zylinder-Oberfläche, Halbkreis'],
  word: ['Klasse 1–2: plus & minus', 'Klasse 3–4: mal, geteilt, Geld', 'Klasse 5–6: Komma, Brüche, Flächen', 'Klasse 7–8: Prozent, Dreisatz, Tempo', 'Mehrere Schritte', 'Profi: lange Aufgaben mit vielen Schritten'],
  mix: [...[1, 2, 3, 4, 5].map(n => `Alle Themen zufällig gemischt – Stufe ${n}`), 'Alle Themen zufällig gemischt – Profi'],
};
// Welche Themen (und Stufen) zu welcher Klassenstufe passen
const CLASS_TOPICS = {
  1: [['add', 0], ['sub', 0], ['gap', 0], ['doppel', 0], ['geld', 0], ['folge', 0]],
  2: [['add', 1], ['sub', 1], ['mul', 0], ['div', 0], ['gap', 0], ['word', 0], ['doppel', 1], ['geld', 1], ['zeit', 0], ['folge', 0]],
  3: [['add', 2], ['sub', 2], ['mul', 1], ['div', 1], ['gap', 1], ['order', 0], ['unit', 0], ['word', 0], ['doppel', 2], ['geld', 1], ['zeit', 1], ['geo', 0], ['folge', 1]],
  4: [['add', 3], ['sub', 3], ['mul', 2], ['div', 2], ['gap', 2], ['round', 0], ['unit', 1], ['order', 1], ['word', 1], ['doppel', 2], ['geld', 2], ['zeit', 2], ['geo', 1], ['folge', 1]],
  5: [['add', 4], ['sub', 4], ['mul', 3], ['div', 3], ['gap', 3], ['round', 1], ['frac', 0], ['dec', 0], ['divis', 0], ['order', 2], ['word', 1], ['doppel', 3], ['geld', 3], ['zeit', 3], ['geo', 2], ['folge', 2], ['stat', 0], ['dreisatz', 0]],
  6: [['mul', 4], ['frac', 1], ['frac', 2], ['dec', 1], ['dec', 2], ['divis', 2], ['unit', 2], ['round', 2], ['neg', 0], ['word', 2], ['doppel', 4], ['geld', 4], ['zeit', 4], ['geo', 3], ['folge', 3], ['stat', 1], ['dreisatz', 1], ['wahr', 0]],
  7: [['frac', 3], ['dec', 3], ['pct', 0], ['pct', 1], ['neg', 2], ['eq', 0], ['order', 3], ['unit', 3], ['divis', 3], ['word', 2], ['geo', 3], ['folge', 3], ['stat', 2], ['dreisatz', 2], ['dreisatz', 3], ['wahr', 1], ['term', 0], ['term', 1], ['zins', 0]],
  8: [['lgs', 0], ['lgs', 1], ['frac', 4], ['dec', 4], ['pct', 2], ['neg', 3], ['eq', 1], ['eq', 2], ['pow', 0], ['round', 3], ['order', 4], ['word', 3], ['geo', 4], ['folge', 4], ['stat', 3], ['dreisatz', 4], ['wahr', 2], ['term', 2], ['term', 3], ['zins', 1], ['zins', 2], ['linear', 0], ['linear', 1], ['kreis', 0], ['kreis', 1]],
  9: [['quad', 0], ['quad', 1], ['lgs', 2], ['lgs', 3], ['pct', 3], ['pow', 1], ['pow', 2], ['eq', 3], ['neg', 4], ['unit', 4], ['round', 4], ['word', 3], ['geo', 4], ['folge', 4], ['stat', 4], ['wahr', 3], ['term', 4], ['zins', 3], ['linear', 2], ['linear', 3], ['kreis', 2], ['kreis', 3], ['zehner', 0], ['zehner', 1], ['zehner', 2]],
  10: [['quad', 2], ['quad', 3], ['quad', 4], ['lgs', 4], ['pct', 4], ['pow', 3], ['pow', 4], ['eq', 4], ['divis', 4], ['word', 4], ['folge', 4], ['wahr', 4], ['zins', 4], ['linear', 4], ['kreis', 4], ['zehner', 3], ['zehner', 4]],
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
    if (big < 5) return [`${big} · ${sm} = ${Array(sm).fill(big).join(' + ')} = ${p}`];   // 3 · 3, 4 · 3, 4 · 4 (nicht „5 + -2“)
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
    if (p % 10 === 0) return [`10 % von ${fi(m)} = ${fi(m / 10)}`, `${p} % von ${fi(m)} = ${p / 10} · ${fi(m / 10)} = ${fi(r)}`];
    if (p === 5 && m % 20 === 0) return [`10 % von ${fi(m)} = ${fi(m / 10)}`, `5 % ist die Hälfte davon: ${fi(r)}`];
    if (p === 15 && m % 20 === 0) return [`10 % von ${fi(m)} = ${fi(m / 10)} und 5 % von ${fi(m)} = ${fi(m / 20)}`, `15 % von ${fi(m)} = ${fi(m / 10)} + ${fi(m / 20)} = ${fi(r)}`];
  }
  return [`${p} % von ${fi(m)} = ${fi(m)} · ${p} : 100`, `= ${fi(m * p)} : 100 = ${fi(r)}`];
}
const sgnTerm = v => v >= 0 ? ` + ${fi(v)}` : ` − ${fi(-v)}`;
const divisors = n => { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out; };

/* ---------- Aufgaben-Generatoren ---------- */
const nCarry = (a, b) => { let c = 0, n = 0; while (a || b) { c = a % 10 + b % 10 + c >= 10 ? 1 : 0; n += c; a = Math.floor(a / 10); b = Math.floor(b / 10); } return n; };
const carryAdd = (lo1, hi1, lo2, hi2, minC, max) => { let a, b; do { a = rnd(lo1, hi1); b = rnd(lo2, hi2); } while (a + b > max || nCarry(a, b) < minC); return [a, b]; };
// Ab Stufe 3 immer mit Übergang, damit jede Stufe nachweislich schwerer ist (Marcel 16.11.: „am Ende extrem kompliziert“)
const ADD = [
  () => { const a = rnd(0, 10); return [a, rnd(0, 10 - a)]; },
  () => { const a = rnd(2, 9); return [a, rnd(11 - a, 9)]; },
  () => carryAdd(11, 89, 2, 9, 1, 100),
  () => carryAdd(11, 79, 11, 89, 1, 100),
  () => carryAdd(100, 799, 100, 899, 1, 999),
  () => carryAdd(1000, 7999, 1000, 8999, 2, 9999),     // Profi: vierstellig mit mindestens zwei Übergängen
];
const MUL = [
  () => [rnd(1, 10), pick([1, 2, 5, 10])],
  () => [rnd(2, 10), rnd(2, 10)],
  () => [rnd(11, 19), rnd(2, 9)],
  () => [rnd(12, 99), rnd(2, 9)],
  () => [rnd(11, 25), rnd(11, 25)],
  () => [rnd(102, 499), noTrail(12, 49)],               // Profi: dreistellig · zweistellig
];
const properFrac = d => { let n; do n = rnd(1, d - 1); while (gcd(n, d) !== 1); return n; };
const noTrail = (lo, hi) => { let v; do v = rnd(lo, hi); while (v % 10 === 0); return v; };
const factKey = (a, b) => a <= 10 && b <= 10 && a >= 1 && b >= 1 ? `${Math.min(a, b)}x${Math.max(a, b)}` : null;
function tablePair(l) {      // im kleinen Einmaleins schwache Aufgaben bevorzugen
  if (l === 1 && !ENGINE.seeded && ENGINE.weakFact && rand() < .4) { const w = ENGINE.weakFact(); if (w) return w; }
  return MUL[l]();
}
const NAMES = ['Lena', 'Tim', 'Mia', 'Ben', 'Emma', 'Noah', 'Sofia', 'Elias', 'Hannah', 'Luca', 'Mila', 'Paul', 'Ella', 'Finn', 'Leonie', 'Jonas', 'Aylin', 'Mats', 'Zoe', 'Can'];

function dblW(x) { const p = places(x); return p.length > 1 ? [`Zerlege ${x} in ${p.join(' + ')}:`, `Doppelt: ${p.map(v => 2 * v).join(' + ')} = ${2 * x}`] : [`${x} + ${x} = ${2 * x}`]; }
function hlfW(x) { const t = Math.floor(x / 10) * 10, e = x - t; return x <= 20 ? [`${x / 2} + ${x / 2} = ${x}`] : t && e && t % 20 === 0 ? [`Zerlege ${x} in ${t} + ${e}:`, `Hälfte: ${t / 2} + ${e / 2} = ${x / 2}`] : t && e ? [`Zerlege ${x} in ${t - 10} + ${e + 10}:`, `Hälfte: ${(t - 10) / 2} + ${(e + 10) / 2} = ${x / 2}`] : [`${x / 2} + ${x / 2} = ${x}`]; }
/* weitere Textaufgaben (16.11.2026) – je Stufe eine Liste, word() wählt sie etwa zur Hälfte */
const WORD_MORE = [
  [
    (n, n2, W_) => { const a = rnd(6, 15), b = rnd(2, a - 1); return W_(`Auf dem Baum sitzen ${a} Vögel. ${b} fliegen weg. Wie viele Vögel sitzen noch auf dem Baum?`, I(a - b), '', [`Wegfliegen heißt minus: ${a} − ${b} = ${a - b}`]); },
    (n, n2, W_) => { const a = rnd(3, 10), b = rnd(2, 9); return W_(`${n} hat ${a} rote und ${b} blaue Perlen. Wie viele Perlen sind das zusammen?`, I(a + b), '', [`Zusammen heißt plus: ${a} + ${b} = ${a + b}`]); },
    (n, n2, W_) => { const a = rnd(6, 14), b = rnd(2, 5); return W_(`Auf einem Teller liegen ${a} Kekse. ${n} isst ${b} davon. Wie viele Kekse liegen noch auf dem Teller?`, I(a - b), '', [`${a} − ${b} = ${a - b}`]); },
    (n, n2, W_) => { const a = rnd(3, 9), b = rnd(2, 9); return W_(`Im Stall stehen ${a} Pferde und ${b} Kühe. Wie viele Tiere sind es zusammen?`, I(a + b), '', [`${a} + ${b} = ${a + b}`]); },
    (n, n2, W_) => { const a = rnd(5, 9), b = rnd(2, 4); return W_(`${n} ist ${a} Jahre alt. ${n2} ist ${b} Jahre älter. Wie alt ist ${n2}?`, I(a + b), 'Jahre', [`Älter heißt plus: ${a} + ${b} = ${a + b}`]); },
    (n, n2, W_) => { const k = rnd(2, 4); return W_(`Ein Hase hat 4 Beine. Wie viele Beine haben ${k} Hasen zusammen?`, I(4 * k), '', [`${Array(k).fill(4).join(' + ')} = ${4 * k}`]); },
  ],
  [
    (n, n2, W_) => { const r = rnd(6, 12); return W_(`Ein Bus hat ${r} Sitzreihen mit je 4 Plätzen. Wie viele Kinder können sitzen?`, I(4 * r), '', [`${r} · 4 = ${4 * r}`]); },
    (n, n2, W_) => { const p = rnd(2, 5), w = rnd(3, 9); return W_(`${n} spart jede Woche ${p} €. Wie viel Geld hat ${n} nach ${w} Wochen?`, I(p * w), '€', [`${w} Wochen mit je ${p} €: ${w} · ${p} = ${w * p}`]); },
    (n, n2, W_) => { const c = pick([6, 8, 10, 12]), k = rnd(3, 9); return W_(`In einer Packung sind ${c} Stifte. Wie viele Stifte sind in ${k} Packungen?`, I(c * k), '', [`${k} · ${c} = ${k * c}`]); },
    (n, n2, W_) => { const c = pick([4, 5, 6]); let t; do t = rnd(13, 40); while (t % c === 0); const b = Math.ceil(t / c); return W_(`${t} Kinder fahren Boot. In ein Boot passen ${c} Kinder. Wie viele Boote braucht man mindestens?`, I(b), '', [`${t} : ${c} = ${Math.floor(t / c)} Rest ${t % c}`, `Die ${t % c} übrigen Kinder brauchen noch ein Boot: ${Math.floor(t / c)} + 1 = ${b}`]); },
    (n, n2, W_) => { const p = rnd(4, 8), k = rnd(2, 5), q = p + rnd(2, 4); return W_(`Ein Kinoticket für Kinder kostet ${p} €, für Erwachsene ${q} €. Was zahlen ${k} Kinder und ein Erwachsener zusammen?`, I(k * p + q), '€', [`Kinder: ${k} · ${p} = ${k * p}`, `${k * p} + ${q} = ${k * p + q}`]); },
    (n, n2, W_) => { const b = rnd(6, 15), c = rnd(2, 5), a = b + c + rnd(3, 20); return W_(`${n} hat ${a} € und kauft ein Buch für ${b} € und einen Stift für ${c} €. Wie viel Geld bleibt übrig?`, I(a - b - c), '€', [`Ausgaben: ${b} + ${c} = ${b + c}`, `${a} − ${b + c} = ${a - b - c}`]); },
  ],
  [
    (n, n2, W_) => { const a = rnd(3, 6), b = rnd(2, 5), p = pick([8, 10, 12, 15]); return W_(`Ein Zimmer ist ${a} m lang und ${b} m breit. Ein Quadratmeter Teppich kostet ${p} €. Was kostet der Teppich für das ganze Zimmer?`, I(a * b * p), '€', [`Fläche: ${a} · ${b} = ${a * b} m²`, `${a * b} · ${p} = ${a * b * p} €`]); },
    (n, n2, W_) => { const d = pick([3, 4, 5]), t = d * rnd(4, 20); return W_(`${n} hat ${t} € gespart und gibt 1/${d} davon für ein Spiel aus. Wie viel kostet das Spiel?`, I(t / d), '€', [`1/${d} von ${t} € = ${t} : ${d} = ${t / d} €`]); },
    (n, n2, W_) => { const s = 60 * rnd(7, 15) + 5 * rnd(1, 11), d = 5 * rnd(14, 30), e = s + d, hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; return W_(`Ein Zug fährt um ${hm(s)} Uhr ab und kommt um ${hm(e)} Uhr an. Wie viele Minuten dauert die Fahrt?`, I(d), 'min', [`Bis ${Math.ceil(s / 60)}:00 Uhr: ${60 - s % 60} min`, `Dann bis ${hm(e)} Uhr: ${e - Math.ceil(s / 60) * 60} min`, `${60 - s % 60} + ${e - Math.ceil(s / 60) * 60} = ${d} min`]); },
    (n, n2, W_) => { const t = 4 * rnd(30, 120); return W_(`An einer Schule sind ${t} Kinder. 3/4 davon kommen zu Fuß. Wie viele Kinder sind das?`, I(t * 3 / 4), '', [`1/4 von ${t} = ${t / 4}`, `3/4 von ${t} = 3 · ${t / 4} = ${t * 3 / 4}`]); },
    (n, n2, W_) => { const k = pick([2, 3]), a = k * rnd(2, 5), b = k * rnd(2, 4), c = k * rnd(1, 3); return W_(`Holzwürfel haben ${k} cm Kantenlänge. Wie viele passen in eine Kiste, die ${a} cm lang, ${b} cm breit und ${c} cm hoch ist?`, I(a / k * b / k * c / k), '', [`Pro Kante: ${a} : ${k} = ${a / k}, ${b} : ${k} = ${b / k}, ${c} : ${k} = ${c / k}`, `${a / k} · ${b / k} · ${c / k} = ${a / k * b / k * c / k}`]); },
    (n, n2, W_) => { const g = 4 * rnd(25, 100), p = pick([2, 3, 6, 8]); return W_(`Ein Rezept für 4 Personen braucht ${g} g Mehl. Wie viel Mehl braucht man für ${p} Personen?`, I(g / 4 * p), 'g', [`Für 1 Person: ${g} : 4 = ${g / 4} g`, `Für ${p} Personen: ${p} · ${g / 4} = ${g / 4 * p} g`]); },
    (n, n2, W_) => { const m = pick([200, 250, 400]), a = rnd(3, 12); return W_(`${n} läuft ${a} Runden. Eine Runde ist ${m} m lang. Wie viele Meter läuft ${n}?`, I(a * m), 'm', [`${a} · ${m} = ${fi(a * m)}`]); },
    (n, n2, W_) => { const d = pick([8, 10, 12, 16]), e = rnd(2, d - 2); return W_(`Ein Kuchen wird in ${d} gleich große Stücke geteilt. ${n} und ${n2} essen zusammen ${e} Stücke. Welcher Bruchteil des Kuchens wurde gegessen?`, Fr(e, d), '', [`${e} von ${d} Stücken: ${fr(e, d)}`, ...redW(e, d)], 'als gekürzter Bruch'); },
    (n, n2, W_) => { const [f, g, k] = pick([[15, 25, 6], [10, 2, 5], [20, 25, 8], [15, 3, 5], [10, 25, 4], [20, 4, 5]]); return W_(`Eine Flasche enthält ${fmtDec(f, 1)} l Saft. Wie viele Gläser mit ${fmtDec(g, g < 10 ? 1 : 2)} l kann man damit füllen?`, I(k), '', [`${fmtDec(f, 1)} l : ${fmtDec(g, g < 10 ? 1 : 2)} l = ${k}`, `Probe: ${k} · ${fmtDec(g, g < 10 ? 1 : 2)} l = ${fmtDec(f, 1)} l`]); },
    (n, n2, W_) => { const a = rnd(3, 12), b = rnd(2, 8), k = pick([2, 3, 4]); return W_(`Ein Beet ist ${a} m lang und ${b} m breit. Auf jeden Quadratmeter kommen ${k} Blumen. Wie viele Blumen braucht man?`, I(a * b * k), '', [`Fläche: ${a} · ${b} = ${a * b} m²`, `${a * b} · ${k} = ${a * b * k}`]); },
    (n, n2, W_) => { const m = rnd(7, 18), a = m + rnd(-3, 3), b = m + rnd(-3, 3), c = 3 * m - a - b; return W_(`${n} hat in drei Tests ${a}, ${b} und ${c} Punkte. Wie viele Punkte sind das im Durchschnitt?`, I(m), '', ['Durchschnitt = Summe : Anzahl', `${a} + ${b} + ${c} = ${3 * m}`, `${3 * m} : 3 = ${m}`]); },
  ],
  [
    (n, n2, W_) => { const p = 5 * rnd(4, 30), x = p * 4 / 5; return W_(`Ein T-Shirt kostet nach 20 % Rabatt noch ${x} €. Was hat es vorher gekostet?`, I(p), '€', ['Nach 20 % Rabatt bleiben 80 % übrig.', `80 % ≙ ${x} € → 10 % ≙ ${decOfQ(Q(x, 8))} €`, `100 % ≙ ${p} €`]); },
    (n, n2, W_) => { const t = pick([20, 25, 50]), k = rnd(1, t - 1); return W_(`In einer Klasse mit ${t} Kindern haben ${k} ein Haustier. Wie viel Prozent sind das?`, I(k * 100 / t), '%', [`${k} von ${t} = ${fr(k, t)}`, `Erweitern auf 100: ${fr(k * 100 / t, 100)} = ${k * 100 / t} %`]); },
    (n, n2, W_) => { const l = 4 * rnd(1, 6); return W_(`Eine Saftschorle wird aus 3 Teilen Saft und 1 Teil Wasser gemischt. Wie viele Liter Saft braucht man für ${l} Liter Schorle?`, I(l * 3 / 4), 'l', [`Zusammen 3 + 1 = 4 Teile`, `1 Teil: ${l} : 4 = ${l / 4} l`, `Saft: 3 · ${l / 4} = ${l * 3 / 4} l`]); },
    (n, n2, W_) => { const a = 20 * rnd(2, 20), q = pick([10, 20, 25, 50]), b = a * (100 + q) / 100; return W_(`Der Preis steigt von ${a} € auf ${b} €. Um wie viel Prozent ist er gestiegen?`, I(q), '%', [`Erhöhung: ${b} − ${a} = ${b - a} €`, `${b - a} von ${a} = ${fr(b - a, a)} = ${q} %`]); },
    (n, n2, W_) => { const l = 5 * rnd(4, 10), w = rnd(5, 15), d = rnd(1, 3); return W_(`Ein Schwimmbecken ist ${l} m lang, ${w} m breit und ${d} m tief. Wie viele Kubikmeter Wasser passen hinein?`, I(l * w * d), 'm³', ['Volumen = Länge · Breite · Tiefe', `${l} · ${w} · ${d} = ${l * w * d}`]); },
    (n, n2, W_) => { const q = pick([10, 20, 5]), p = (q === 5 ? 100 : 50) * rnd(4, 20); return W_(`Ein Handy kostet ${p} €. Der Preis steigt um ${q} %. Was kostet es jetzt?`, I(p + p * q / 100), '€', [`${q} % von ${p} € = ${p * q / 100} €`, `${p} + ${p * q / 100} = ${p + p * q / 100} €`]); },
    (n, n2, W_) => { const v = pick([12, 15, 20]); let d; do d = v * pick([20, 30, 40, 60, 80, 90, 120]) / 60; while (d % 1); return W_(`${n} fährt mit dem Fahrrad ${v} km pro Stunde. Wie viele Minuten braucht ${n} für ${d} km?`, I(d / v * 60), 'min', [`In 60 Minuten: ${v} km`, `${d} km = ${fq(d, v)} von ${v} km`, `${fq(d, v)} · 60 = ${d / v * 60} min`]); },
    (n, n2, W_) => { const r = rnd(4, 12), h = rnd(2, 7); let h2; do h2 = rnd(2, 9); while (h2 === h); return W_(`Ein Maler streicht in ${h} Stunden ${r * h} m². Wie viele m² schafft er in ${h2} Stunden?`, I(r * h2), 'm²', [`In 1 Stunde: ${r * h} : ${h} = ${r} m²`, `In ${h2} Stunden: ${h2} · ${r} = ${r * h2} m²`]); },
    (n, n2, W_) => { const k = 100 * rnd(2, 30), z = pick([1, 2, 3, 5]); return W_(`Auf einem Sparkonto liegen ${k} €. Im Jahr gibt es ${z} % Zinsen. Wie viele Euro Zinsen sind das nach einem Jahr?`, I(k * z / 100), '€', [`1 % von ${k} € = ${k / 100} €`, `${z} % von ${k} € = ${z} · ${k / 100} € = ${k * z / 100} €`]); },
    (n, n2, W_) => { const v = 5 * rnd(10, 26), h = rnd(2, 4); return W_(`Ein Auto fährt in ${h} Stunden ${v * h} km. Wie viele Kilometer fährt es im Durchschnitt pro Stunde?`, I(v), 'km', [`${v * h} : ${h} = ${v}`]); },
    (n, n2, W_) => { const c = rnd(2, 12); return W_(`Eine Wanderkarte hat den Maßstab 1 : 25000. Auf der Karte ist ein Weg ${c} cm lang. Wie viele Meter ist er in Wirklichkeit?`, I(c * 250), 'm', ['1 cm auf der Karte = 25000 cm = 250 m', `${c} · 250 = ${fi(c * 250)} m`]); },
  ],
  [
    (n, n2, W_) => { const g = rnd(5, 15), c = pick([5, 9, 10]), m = 10 * rnd(5, 30), t = g * 100 + c * m; return W_(`Ein Handytarif kostet ${g} € im Monat plus ${c} Cent pro Minute. ${n} bezahlt in einem Monat ${fmtMoney(t)} €. Wie viele Minuten hat ${n} telefoniert?`, I(m), 'min', [`Ohne Grundgebühr: ${fmtMoney(t)} € − ${g} € = ${fmtMoney(t - g * 100)} €`, `${t - g * 100} ct : ${c} ct = ${m} min`]); },
    (n, n2, W_) => { const dv = pick([1, 2]), [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]).map(v => v / dv); return W_(`Eine Leiter ist ${fmtDec(c * 10, 1)} m lang. Ihr Fuß steht ${fmtDec(a * 10, 1)} m von der Wand entfernt. Wie hoch reicht die Leiter an der Wand?`, De(b * 10, 10), 'm', ['Satz des Pythagoras: Höhe² = Leiter² − Abstand²', `${fmtDec(c * 10, 1)}² − ${fmtDec(a * 10, 1)}² = ${decOfQ(Q(c * c * 100 - a * a * 100, 100))}`, `Wurzel: ${fmtDec(b * 10, 1)} m`]); },
    (n, n2, W_) => { const s = pick([50, 100, 200, 300]), h = rnd(3, 6); return W_(`Eine Bakterienkultur verdoppelt sich jede Stunde. Am Anfang sind es ${s} Bakterien. Wie viele sind es nach ${h} Stunden?`, I(s * 2 ** h), '', [`Nach ${h} Stunden: ${s} · 2${String(h).split('').map(c => SUPS[c]).join('')}`, `= ${s} · ${2 ** h} = ${fi(s * 2 ** h)}`]); },
    (n, n2, W_) => { const p = 1000 * rnd(10, 40), q = pick([10, 15, 20, 25]); return W_(`Ein neues Auto kostet ${fi(p)} €. Nach einem Jahr ist es ${q} % weniger wert. Wie viel ist es dann noch wert?`, I(p * (100 - q) / 100), '€', [`${q} % von ${fi(p)} € = ${fi(p * q / 100)} €`, `${fi(p)} − ${fi(p * q / 100)} = ${fi(p * (100 - q) / 100)} €`]); },
    (n, n2, W_) => { const a = rnd(2, 9), b = rnd(1, 20), x = rnd(2, 15); return W_(`${n} denkt sich eine Zahl, nimmt sie mal ${a} und addiert ${b}. Das Ergebnis ist ${a * x + b}. Welche Zahl hat sich ${n} gedacht?`, I(x), '', [`Gleichung: ${a}x + ${b} = ${a * x + b}`, `${a}x = ${a * x} → x = ${x}`]); },
    (n, n2, W_) => { const k = pick([20, 24, 25, 30]), bus = k * rnd(8, 20), e = rnd(3, 9); return W_(`Eine Klasse mit ${k} Kindern macht einen Ausflug. Der Bus kostet ${bus} € für alle, der Eintritt ${e} € pro Kind. Wie viel muss jedes Kind bezahlen?`, I(bus / k + e), '€', [`Bus pro Kind: ${bus} : ${k} = ${bus / k} €`, `${bus / k} + ${e} = ${bus / k + e} €`]); },
    (n, n2, W_) => { const x = rnd(5, 30); return W_(`${n} hat 3-mal so viele Murmeln wie ${n2}. Zusammen haben sie ${4 * x} Murmeln. Wie viele Murmeln hat ${n}?`, I(3 * x), '', [`Zusammen sind es 3 + 1 = 4 gleiche Teile.`, `1 Teil: ${4 * x} : 4 = ${x}`, `${n}: 3 · ${x} = ${3 * x}`]); },
    (n, n2, W_) => { const r = pick([20, 25, 40, 50]), t = rnd(5, 30), v = 2 * r * t; return W_(`Ein leeres Becken fasst ${fi(v)} Liter. Pro Minute fließen ${r} Liter hinein. Nach wie vielen Minuten ist es halb voll?`, I(t), 'min', [`Halb voll: ${fi(v)} : 2 = ${fi(v / 2)} Liter`, `${fi(v / 2)} : ${r} = ${t} min`]); },
    (n, n2, W_) => { const t = 5 * rnd(4, 6), g = pick([2, 3]); return W_(`In einer Klasse sind ${t} Kinder. ${g}/5 davon sind Mädchen. Wie viele Jungen sind in der Klasse?`, I(t * (5 - g) / 5), '', [`Ein Fünftel: ${t} : 5 = ${t / 5}`, `Jungen: ${5 - g}/5 von ${t} = ${5 - g} · ${t / 5} = ${t * (5 - g) / 5}`]); },
    (n, n2, W_) => { const b = rnd(3, 20); return W_(`Ein Rechteck ist doppelt so lang wie breit. Sein Umfang ist ${6 * b} cm. Wie lang ist es?`, I(2 * b), 'cm', ['Umfang = 2 · (Länge + Breite) = 2 · (2 · Breite + Breite) = 6 · Breite', `Breite: ${6 * b} : 6 = ${b} cm`, `Länge: 2 · ${b} = ${2 * b} cm`]); },
    (n, n2, W_) => { const a = rnd(6, 12), b = rnd(6, 12), y = rnd(2, 10); return W_(`${n} ist ${a} Jahre alt, ${n2} ist ${b}. In wie vielen Jahren sind beide zusammen ${a + b + 2 * y} Jahre alt?`, I(y), 'Jahre', [`Heute zusammen: ${a} + ${b} = ${a + b}`, `Pro Jahr kommen 2 Jahre dazu.`, `(${a + b + 2 * y} − ${a + b}) : 2 = ${y}`]); },
  ],
];
/* ---------- Lineare Gleichungssysteme mit zwei Unbekannten (Fr 20.11.2026) ----------
   Lösungswege vollständig: Verfahren nennen, jeden Umformungsschritt, beide Unbekannten, Probe in beiden Gleichungen. */
const LGS_Y = v => ({ t: 'y', v });                      // Gleichungssystem: v = ['I: …', 'II: …']
const lgsCo = (c, v, first) => {                         // ein Glied: 3x, −x, + 2y, − y
  if (!c) return '';
  const a = Math.abs(c), s = (a === 1 ? '' : a) + v;
  return first ? (c < 0 ? '−' : '') + s : (c < 0 ? ' − ' : ' + ') + s;
};
const lgsLin = (a, b) => (lgsCo(a, 'x', true) + lgsCo(b, 'y', !a)) || '0';   // 2x − 3y
const lgsEq = (a, b, c) => `${lgsLin(a, b)} = ${fi(c)}`;
function lgsAsk(x, y, w, sys, ask) {
  const askX = ask === undefined ? coin() : ask;
  return { e: [LGS_Y(sys)], a: I(askX ? x : y), noEq: true, pre: askX ? 'x =' : 'y =', hint: 'Löse das Gleichungssystem.', w };
}
// Probe: beide Werte in beide Gleichungen einsetzen
function lgsProbe(eqs, x, y) {
  return eqs.map(([nm, a, b, c]) => {
    const parts = [a ? `${a === 1 ? '' : a === -1 ? '−' : fi(a) + ' · '}${par(x)}` : '', b ? `${b < 0 ? ' − ' : a ? ' + ' : ''}${Math.abs(b) === 1 ? '' : Math.abs(b) + ' · '}${par(y)}` : ''].join('');
    return `Probe in ${nm}: ${parts.replace(/^− /, '−')} = ${fi(a * x + b * y)} ✓`;
  });
}
// y aus einer Gleichung a·x + b·y = c berechnen, wenn x bekannt ist
function lgsBack(nm, a, b, c, x, y) {
  const w = [`x = ${fi(x)} in ${nm} einsetzen: ${a === 1 ? '' : a === -1 ? '−' : fi(a) + ' · '}${par(x)}${lgsCo(b, 'y', false)} = ${fi(c)}`];
  const ax = a * x;
  if (Math.abs(a) !== 1 || x < 0) w.push(`${fi(ax)}${lgsCo(b, 'y', false)} = ${fi(c)}`);
  if (ax) w.push(`${ax > 0 ? '− ' + fi(ax) : '+ ' + fi(-ax)} auf beiden Seiten: ${lgsLin(0, b)} = ${fi(c - ax)}`);
  if (b !== 1) w.push(`: ${par(b)} auf beiden Seiten: y = ${fi(c - ax)} : ${par(b)} = ${fi(y)}`);
  return w;
}
// Additionsverfahren: y fällt weg (Faktoren k1, k2 mit b1·k1 + b2·k2 = 0)
function lgsAdd(E1, E2, x, y) {
  const [, a1, b1, c1] = E1, [, a2, b2, c2] = E2;
  const L = lcm(Math.abs(b1), Math.abs(b2)); let k1 = L / Math.abs(b1), k2 = L / Math.abs(b2);
  if (Math.sign(b1) === Math.sign(b2)) { if (k1 > k2) k1 = -k1; else k2 = -k2; }   // Vorzeichen auf den größeren Faktor: so bleibt eine Gleichung oft unverändert
  const w = ['Additionsverfahren: Die Gleichungen so malnehmen, dass y beim Addieren wegfällt.'];
  if (k1 !== 1) w.push(`I · ${par(k1)}: ${lgsEq(a1 * k1, b1 * k1, c1 * k1)}`);
  if (k2 !== 1) w.push(`II · ${par(k2)}: ${lgsEq(a2 * k2, b2 * k2, c2 * k2)}`);
  const A = a1 * k1 + a2 * k2, C = c1 * k1 + c2 * k2;
  w.push(`Addieren: ${lgsLin(a1 * k1, b1 * k1)}${lgsCo(a2 * k2, 'x', false)}${lgsCo(b2 * k2, 'y', false)} = ${fi(c1 * k1)}${c2 * k2 < 0 ? ' − ' + fi(-c2 * k2) : ' + ' + fi(c2 * k2)}`);
  w.push(`${lgsLin(A, 0)} = ${fi(C)}`);
  if (A !== 1) w.push(`: ${par(A)} auf beiden Seiten: x = ${fi(C)} : ${par(A)} = ${fi(x)}`);
  const [U, P_] = Math.abs(b2) < Math.abs(b1) || (Math.abs(b2) === Math.abs(b1) && Math.abs(a2) < Math.abs(a1)) ? [E2, E1] : [E1, E2];   // in die einfachere Gleichung einsetzen
  return [...w, ...lgsBack(U[0], U[1], U[2], U[3], x, y), ...lgsProbe([P_], x, y)];
}
// zufällige Lösung und Koeffizienten mit Determinante ≠ 0
function lgsPick(cmax, smin, smax, ok) {
  for (;;) {
    const x = rnd(smin, smax), y = rnd(smin, smax);
    const a1 = rnd(-cmax, cmax), b1 = rnd(-cmax, cmax), a2 = rnd(-cmax, cmax), b2 = rnd(-cmax, cmax);
    if (!a1 || !b1 || !a2 || !b2 || a1 * b2 - a2 * b1 === 0 || !x || !y || x === y || !(a1 * x + b1 * y) || !(a2 * x + b2 * y)) continue;   // keine „= 0“-Gleichung
    if (ok && !ok(a1, b1, a2, b2, x, y)) continue;
    return { x, y, E1: ['I', a1, b1, a1 * x + b1 * y], E2: ['II', a2, b2, a2 * x + b2 * y] };
  }
}
const lgsSys = (E1, E2) => [`I: ${lgsEq(E1[1], E1[2], E1[3])}`, `II: ${lgsEq(E2[1], E2[2], E2[3])}`];
const lgsLx = (p, q) => p ? lgsLin(p, 0) + (q ? sgnTerm(q) : '') : fi(q);          // 3x − 4
const lgsVal = (p, x, q) => `${p === 1 ? '' : p === -1 ? '−' : fi(p) + ' · '}${par(x)}${q ? sgnTerm(q) : ''}`;   // 3 · 5 − 4

/* ---------- Quadratische Gleichungen im Kopf (quad): immer ganzzahlige Lösungen; gefragt ist eine Lösung (positiv, größere oder kleinere) ---------- */
const quadFac = r => r < 0 ? `(x + ${-r})` : `(x − ${r})`;                     // Faktor mit Nullstelle r
const quadZero = r => r < 0 ? `x + ${-r} = 0 → x = ${fi(r)}` : `x − ${r} = 0 → x = ${r}`;
const quadPoly = (a, b, c) => `${a === 1 ? '' : a}x²${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x` : ''}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''}`;
function quadPick(lo, hi, ok = () => true) {   // zwei verschiedene Lösungen ≠ 0 mit Summe ≠ 0, [kleinere, größere]
  let r1, r2; do { r1 = rnd(lo, hi); r2 = rnd(lo, hi); } while (r1 === r2 || !r1 || !r2 || r1 + r2 === 0 || !ok(r1, r2));
  return [Math.min(r1, r2), Math.max(r1, r2)];
}
function quadAsk(txt, [lo, hi], w, hint, pos) {   // pos: Gleichung hat nur eine positive Lösung gesucht; sonst größere oder kleinere Lösung
  if (pos) return { e: [S_(txt), T('(x > 0)')], a: I(pos), noEq: true, pre: 'x =', hint, w };
  const big = coin(), x = big ? hi : lo;
  return { e: [S_(txt), T(big ? '(größere Lösung)' : '(kleinere Lösung)')], a: I(x), noEq: true, pre: 'x =', hint, w: [...w, `${big ? 'Größere' : 'Kleinere'} Lösung: x = ${fi(x)}`] };
}

const GEN = {
  add(l) { const [a, b] = ADD[l](); return { e: [N(a), O('+'), N(b)], a: I(a + b), w: addW(a, b) }; },
  sub(l) { const [x, y] = ADD[l](); return { e: [N(x + y), O('−'), N(y)], a: I(x), w: subW(x + y, y) }; },
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
      const [x, y] = MUL[2]();
      return coin() ? mk([N(x), O('·'), Gap(), Eq(), N(x * y)], y, [`Umkehraufgabe: ${x * y} : ${x}`, ...divW(x * y, x)])
        : mk([Gap(), O('·'), N(y), Eq(), N(x * y)], x, [`Umkehraufgabe: ${x * y} : ${y}`, ...divW(x * y, y)]);
    }
    if (l === 3) {
      const [x, y] = MUL[3]();
      return coin() ? mk([N(x * y), O(':'), Gap(), Eq(), N(x)], y, [`${x * y} geteilt durch welche Zahl ergibt ${x}?`, ...divW(x * y, x)])
        : mk([Gap(), O(':'), N(y), Eq(), N(x)], x * y, [`Umkehraufgabe: ${x} · ${y}`, ...mulW(x, y)]);
    }
    if (coin()) {
      const [x, y] = ADD[4](), s = x + y;
      return coin() ? mk([N(x), O('+'), Gap(), Eq(), N(s)], y, [`Rechne rückwärts: ${s} − ${x}`, ...subW(s, x)])
        : mk([Gap(), O('−'), N(x), Eq(), N(y)], s, [`Rechne rückwärts: ${y} + ${x}`, ...addW(y, x)]);
    }
    const [x, y] = MUL[4]();
    return mk([N(x), O('·'), Gap(), Eq(), N(x * y)], y, [`Umkehraufgabe: ${x * y} : ${x}`, ...divW(x * y, x)]);
  },

  frac(l) {
    const H = 'als gekürzter Bruch';
    if (l === 0) {
      const d = rnd(3, 9);
      if (coin()) { const a = rnd(1, d - 1), b = rnd(1, d - 1); return { e: [F(a, d), O('+'), F(b, d)], a: Fr(a + b, d), hint: H, w: ['Gleicher Nenner – nur die Zähler addieren:', `${fr(a, d)} + ${fr(b, d)} = ${fr(a + b, d)}`, ...redW(a + b, d)] }; }
      const a = rnd(2, d - 1), b = rnd(1, a - 1);
      return { e: [F(a, d), O('−'), F(b, d)], a: Fr(a - b, d), hint: H, w: ['Gleicher Nenner – nur die Zähler subtrahieren:', `${fr(a, d)} − ${fr(b, d)} = ${fr(a - b, d)}`, ...redW(a - b, d)] };
    }
    if (l === 1) {
      if (coin()) { const d = rnd(3, 12), n = properFrac(d), k = rnd(3, 9); return { e: [T('Kürze'), F(n * k, d * k)], a: Fr(n, d), hint: 'so weit wie möglich', w: [`Größter gemeinsamer Teiler von ${n * k} und ${d * k}: ${k}`, `${n * k} : ${k} = ${n} und ${d * k} : ${k} = ${d}`, `Gekürzt: ${fr(n, d)}`] }; }
      const d = pick([3, 4, 5, 6, 8, 10, 12]), n = properFrac(d), m = d * rnd(3, 12);
      return { e: [F(n, d), T('von'), N(m)], a: I(n * m / d), w: [`${fr(n, d)} von ${m}: erst durch ${d} teilen, dann mal ${n}.`, `${m} : ${d} = ${m / d}`, ...(n > 1 ? [`${m / d} · ${n} = ${n * m / d}`] : [])] };
    }
    if (l === 2) {
      let d1, d2;
      const DS = [2, 3, 4, 5, 6, 8, 9, 10, 12];
      do { d1 = pick(DS); d2 = pick(DS); } while (d1 === d2 || lcm(d1, d2) > 36 || lcm(d1, d2) === Math.max(d1, d2) && rand() < .5);
      let n1 = properFrac(d1), n2 = properFrac(d2);
      if (coin() && n1 * d2 !== n2 * d1) {
        if (n1 * d2 < n2 * d1) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; }
        return { e: [F(n1, d1), O('−'), F(n2, d2)], a: Fr(n1 * d2 - n2 * d1, d1 * d2), hint: H, w: fracAddW(n1, d1, n2, d2, '−') };
      }
      return { e: [F(n1, d1), O('+'), F(n2, d2)], a: Fr(n1 * d2 + n2 * d1, d1 * d2), hint: H, w: fracAddW(n1, d1, n2, d2, '+') };
    }
    if (l === 3) {
      const d1 = rnd(3, 12), d2 = rnd(3, 12), n1 = properFrac(d1), n2 = properFrac(d2);
      if (rand() < .6) { const d3 = rnd(3, 12), n3 = properFrac(d3), zn = n1 * n2 * d3, nn = d1 * d2 * n3;
        return { e: [F(n1, d1), O('·'), F(n2, d2), O(':'), F(n3, d3)], a: Fr(zn, nn), hint: H, w: [`Mit dem Kehrwert von ${fr(n3, d3)} malnehmen:`, `${fr(n1, d1)} · ${fr(n2, d2)} · ${fr(d3, n3)}`, `= ${fr(zn, nn)}`, ...redW(zn, nn)] }; }
      return coin()
        ? { e: [F(n1, d1), O('·'), F(n2, d2)], a: Fr(n1 * n2, d1 * d2), hint: H, w: ['Zähler mal Zähler, Nenner mal Nenner:', `${fr(n1, d1)} · ${fr(n2, d2)} = ${fr(n1 * n2, d1 * d2)}`, ...redW(n1 * n2, d1 * d2)] }
        : { e: [F(n1, d1), O(':'), F(n2, d2)], a: Fr(n1 * d2, d1 * n2), hint: H, w: [`Mit dem Kehrwert von ${fr(n2, d2)} malnehmen:`, `${fr(n1, d1)} · ${fr(d2, n2)} = ${fr(n1 * d2, d1 * n2)}`, ...redW(n1 * d2, d1 * n2)] };
    }
    const d = rnd(3, 12), n = properFrac(d), k = rnd(2, 12);
    switch (rnd(0, 3)) {
      case 0: { const k2 = rnd(3, 12), d2 = d * pick([2, 3]), n2 = properFrac(d2), z = k2 * n * (d2 / d) + n2; return { e: [N(k2), O('·'), F(n, d), O('+'), F(n2, d2)], a: Fr(z, d2), hint: H, w: [`Punkt vor Strich: ${k2} · ${fr(n, d)} = ${fr(k2 * n, d)}`, `Gemeinsamer Nenner ${d2}: ${fr(k2 * n, d)} = ${fr(k2 * n * d2 / d, d2)}`, `${fr(k2 * n * d2 / d, d2)} + ${fr(n2, d2)} = ${fr(z, d2)}`, ...redW(z, d2)] }; }
      case 1: {
        let d1, d2; do { d1 = rnd(2, 12); d2 = rnd(2, 12); } while (d1 === d2 || lcm(d1, d2) > 60);
        const n1 = properFrac(d1), n2 = properFrac(d2), g = rnd(2, 9), L = lcm(d1, d2), a = n1 * L / d1, b = n2 * L / d2, r = g * L - a - b;
        return { e: [N(g), O('−'), F(n1, d1), O('−'), F(n2, d2)], a: Fr(r, L), hint: H, w: [`Gemeinsamer Nenner: ${L}`, `${g} = ${fr(g * L, L)}, ${fr(n1, d1)} = ${fr(a, L)}, ${fr(n2, d2)} = ${fr(b, L)}`, `${fr(g * L, L)} − ${fr(a, L)} − ${fr(b, L)} = ${fr(r, L)}`, ...redW(r, L)] };
      }
      case 2: { const d2 = rnd(2, 9), n2 = properFrac(d2); return { e: [F(n, d), O(':'), N(k), O('·'), F(n2, d2)], a: Fr(n * n2, d * k * d2), hint: H, w: [`Von links nach rechts: ${fr(n, d)} : ${k} = ${fr(n, d * k)}`, `${fr(n, d * k)} · ${fr(n2, d2)} = ${fr(n * n2, d * k * d2)}`, ...redW(n * n2, d * k * d2)] }; }
      default: {
        let d1, d2; do { d1 = rnd(3, 16); d2 = rnd(3, 16); } while (d1 === d2 || lcm(d1, d2) > 120 || lcm(d1, d2) === Math.max(d1, d2));
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
      const k = rnd(1, 2), xi = noTrail(101, 2999), f = pick([10, 100, 1000]), z = Math.log10(f), st = z > 1 ? `${z} Stellen` : 'eine Stelle';
      return coin() ? { e: [D(xi, k), O('·'), N(f)], a: De(xi * f, 10 ** k), w: [`Mal ${f}: Komma um ${st} nach rechts`, `${fmtDec(xi, k)} · ${f} = ${decOfQ(Q(xi * f, 10 ** k))}`] }
        : { e: [D(xi, k), O(':'), N(f)], a: De(xi, 10 ** k * f), w: [`Geteilt durch ${f}: Komma um ${st} nach links`, `${fmtDec(xi, k)} : ${f} = ${decOfQ(Q(xi, 10 ** k * f))}`] };
    }
    if (l === 3) {
      const a = noTrail(101, 2999), b = rnd(2, 9);
      if (coin()) return { e: [D(a, 2), O('·'), D(b, 1)], a: De(a * b, 1000), w: [`Ohne Komma rechnen: ${a} · ${b} = ${a * b}`, 'Nachkommastellen zählen: 2 + 1 = 3', `${fmtDec(a * b, 3)}`] };
      return { e: [D(a, 2), O('·'), N(b)], a: De(a * b, 100), w: [`Ohne Komma rechnen: ${a} · ${b} = ${a * b}`, 'Nachkommastellen zählen: 2', `${fmtDec(a * b, 2)}`] };
    }
    switch (rnd(0, 2)) {
      case 0: { const q = noTrail(1001, 9999), b = rnd(3, 9); return { e: [D(q * b, 2), O(':'), N(b)], a: De(q, 100), w: [`In Hundertsteln rechnen: ${q * b} Hundertstel : ${b} = ${q} Hundertstel`, `${q} Hundertstel = ${fmtDec(q, 2)}`] }; }
      case 1: { const b = noTrail(11, 99), q = rnd(101, 999); return { e: [D(q * b, 2), O(':'), D(b, 2)], a: I(q), w: ['Beide Zahlen mal 100 – das Ergebnis bleibt gleich:', `${fmtDec(q * b, 2)} : ${fmtDec(b, 2)} = ${q * b} : ${b}`, `${q * b} : ${b} = ${q}`] }; }
      default: {
        const d = pick([16, 32, 40, 80, 125, 160, 250]), n = properFrac(d);
        let k = 1; while ((10 ** k) % d) k++; const m = 10 ** k / d;
        return { e: [F(n, d)], a: De(n, d), hint: 'als Dezimalzahl', w: [`${10 ** k} : ${d} = ${m}`, `Erweitern mit ${m}: ${fr(n, d)} = ${fr(n * m, 10 ** k)}`, `${fr(n * m, 10 ** k)} = ${fmtDec(n * m, k)}`] };
      }
    }
  },

  pct(l) {
    const mult = (p, max) => { const step = 100 / gcd(p, 100); return step * rnd(1, Math.max(1, Math.floor(max / step))); };
    if (l <= 1) { const p = l === 0 ? pick([50, 25, 10]) : pick([1, 5, 20, 75, 30, 40, 15, 60]), m = mult(p, l === 0 ? 200 : 400); return { e: [N(p), T('% von'), N(m)], a: I(p * m / 100), w: pctW(p, m) }; }
    const p = pick([10, 20, 25, 50, 75, 5, 40, 30]), m = mult(p, 300), part = p * m / 100;
    if (l === 2) return { e: [N(part), T('von'), N(m)], a: I(p), unit: '%', hint: 'Wie viel Prozent sind das?', w: [`Anteil als Bruch: ${fr(part, m)}`, `${fr(part, m)} = ${fr(p, 100)}`, `${fr(p, 100)} = ${p} %`] };
    if (l === 3) { const p3 = pick([5, 15, 35, 40, 75, 12, 45, 60]), m3 = mult(p3, 1000), pt = p3 * m3 / 100; return { e: [N(p3), T('% sind'), N(pt)], a: I(m3), hint: 'Wie viel sind 100 %?', w: [`${p3} % sind ${fi(pt)}`, `1 % ≙ ${fi(pt)} : ${p3} = ${decOfQ(Q(pt, p3))}`, `100 % ≙ ${decOfQ(Q(pt, p3))} · 100 = ${fi(m3)}`] }; }
    const up = coin(), q = pick([12, 15, 35, 8, 30, 40, 25, 5]), price = mult(q, 1200), dlt = price * q / 100;
    return { e: [N(price), U('€'), O(up ? '+' : '−'), N(q), U('%')], a: I(price + (up ? dlt : -dlt)), unit: '€', hint: up ? 'Preis wird erhöht' : 'Preis wird reduziert', w: [...pctW(q, price), up ? `${price} € + ${dlt} € = ${price + dlt} €` : `${price} € − ${dlt} € = ${price - dlt} €`] };
  },

  neg(l) {
    const plusW = (a, b) => b < 0 ? [`Plus eine negative Zahl heißt minus: ${fi(a)} + ${par(b)} = ${fi(a)} − ${fi(-b)}`, `= ${fi(a + b)}`] : [`Starte bei ${fi(a)} und gehe ${b} nach rechts.`, `${fi(a)} + ${b} = ${fi(a + b)}`];
    const minusW = (a, b) => b < 0 ? [`Minus eine negative Zahl heißt plus: ${fi(a)} − ${par(b)} = ${fi(a)} + ${fi(-b)}`, `= ${fi(a - b)}`] : [`Starte bei ${fi(a)} und gehe ${b} nach links.`, `${fi(a)} − ${b} = ${fi(a - b)}`];
    const signW = (a, b, r, op) => [`Vorzeichen: ${a < 0 ? 'minus' : 'plus'} ${op} ${b < 0 ? 'minus' : 'plus'} ergibt ${r < 0 ? 'minus' : 'plus'}.`, `${Math.abs(a)} ${op === 'mal' ? '·' : ':'} ${Math.abs(b)} = ${Math.abs(r)}`, `Ergebnis: ${fi(r)}`];
    if (l === 0) { let a, b; do { a = rnd(-10, 10); b = rnd(-10, 10); } while (a >= 0 && b >= 0); return { e: [N(a), O('+'), N(b, true)], a: I(a + b), w: plusW(a, b) }; }
    if (l === 1) { const a = rnd(-30, 30), b = rnd(11, 40); return { e: [N(a), O('−'), N(b)], a: I(a - b), w: minusW(a, b) }; }
    if (l === 2) { const a = rnd(-50, 50), b = rnd(-50, -1); return coin() ? { e: [N(a), O('+'), N(b, true)], a: I(a + b), w: plusW(a, b) } : { e: [N(a), O('−'), N(b, true)], a: I(a - b), w: minusW(a, b) }; }
    if (l === 3) {
      let a, b; do { a = rnd(2, 15) * sign(); b = rnd(2, 12) * sign(); } while (a > 0 && b > 0);
      return coin() ? { e: [N(a), O('·'), N(b, true)], a: I(a * b), w: signW(a, b, a * b, 'mal') } : { e: [N(a * b), O(':'), N(b, true)], a: I(a), w: signW(a * b, b, a, 'geteilt durch') };
    }
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(-99, 99), b = rnd(-99, -11); return { e: [N(a), O('−'), N(b, true)], a: I(a - b), w: minusW(a, b) }; }
      case 1: { const a = rnd(11, 25) * sign(), b = rnd(3, 12) * sign(); return { e: [N(a), O('·'), N(b, true)], a: I(a * b), w: signW(a, b, a * b, 'mal') }; }
      default: { const a = rnd(-50, 50), b = rnd(-50, 50), c = rnd(-50, 50); return { e: [N(a), O('−'), N(b, true), O('+'), N(c, true)], a: I(a - b + c), w: ['Von links nach rechts rechnen:', `${fi(a)} − ${par(b)} = ${fi(a - b)}`, `${fi(a - b)} + ${par(c)} = ${fi(a - b + c)}`] }; }
    }
  },

  pow(l) {
    const sq = (lo, hi) => { const n = rnd(lo, hi); return { e: [P(n, 2)], a: I(n * n), w: [`${n}² = ${n} · ${n} = ${n * n}`] }; };
    const rt = (lo, hi) => { const n = rnd(lo, hi); return { e: [W(n * n)], a: I(n), w: [`Welche Zahl mal sich selbst ergibt ${n * n}?`, `${n} · ${n} = ${n * n}, also √${n * n} = ${n}`] }; };
    if (l === 0) return sq(1, 10);
    if (l === 1) return coin() ? sq(1, 12) : rt(1, 12);
    if (l === 2) return coin() ? sq(11, 20) : rt(11, 20);
    if (l === 3) {
      const [b, e] = pick([[2, rnd(5, 12)], [10, rnd(3, 8)], [rnd(3, 9), 3], [3, rnd(3, 7)], [5, rnd(3, 5)], [4, rnd(3, 6)]]), r = b ** e;
      const w = e === 0 ? ['Jede Zahl hoch 0 ergibt 1.'] : e === 1 ? [`Hoch 1 ändert nichts: ${b}`] : b === 10 ? [`10 hoch ${e} ist eine 1 mit ${e} Nullen: ${fi(r)}`] : [`${b} ${e}-mal mit sich selbst malnehmen:`, `${Array(e).fill(b).join(' · ')} = ${fi(r)}`];
      return { e: [P(b, e)], a: I(r), w };
    }
    switch (rnd(0, 3)) {
      case 0: { const a = rnd(5, 20), b = rnd(5, 20); return { e: [P(a, 2), O('+'), P(b, 2)], a: I(a * a + b * b), w: [`Erst die Potenzen: ${a}² = ${a * a}, ${b}² = ${b * b}`, `${a * a} + ${b * b} = ${a * a + b * b}`] }; }
      case 1: { const a = rnd(11, 25), b = rnd(3, a - 1); return { e: [P(a, 2), O('−'), P(b, 2)], a: I(a * a - b * b), w: [`Erst die Potenzen: ${a}² = ${a * a}, ${b}² = ${b * b}`, `${a * a} − ${b * b} = ${a * a - b * b}`] }; }
      case 2: { const x = rnd(6, 25), y = rnd(6, 25); return { e: [W(x * x), O('+'), W(y * y)], a: I(x + y), w: [`√${x * x} = ${x} und √${y * y} = ${y}`, `${x} + ${y} = ${x + y}`] }; }
      default: { const x = rnd(11, 25), b = rnd(3, 9); return { e: [W(x * x), O('·'), N(b)], a: I(x * b), w: [`√${x * x} = ${x}`, `${x} · ${b} = ${x * b}`] }; }
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
        case 0: { const c = rnd(3, 12), b = c * rnd(3, 15), a = rnd(11, 99); return { e: [N(a), O('+'), N(b), O(':'), N(c)], a: I(a + b / c), w: [`${PV}zuerst ${b} : ${c} = ${b / c}`, `${a} + ${b / c} = ${a + b / c}`] }; }
        case 1: { const a = rnd(4, 12), b = rnd(4, 12), c = rnd(2, 9), d = rnd(1, Math.floor(a * b / c)); return { e: [N(a), O('·'), N(b), O('−'), N(c), O('·'), N(d)], a: I(a * b - c * d), w: [`${PV}${a} · ${b} = ${a * b} und ${c} · ${d} = ${c * d}`, `${a * b} − ${c * d} = ${a * b - c * d}`] }; }
        default: { const b = rnd(11, 40), a = b + rnd(2, 12), c = rnd(3, 12); return { e: [K('('), N(a), O('−'), N(b), K(')'), O('·'), N(c)], a: I((a - b) * c), w: [`Klammer zuerst: ${a} − ${b} = ${a - b}`, `${a - b} · ${c} = ${(a - b) * c}`] }; }
      }
    }
    if (l === 3) {
      if (coin()) { const a = rnd(2, 9), b = rnd(1, 12), c = rnd(1, 12), d = rnd(1, a * (b + c)); return { e: [N(a), O('·'), K('('), N(b), O('+'), N(c), K(')'), O('−'), N(d)], a: I(a * (b + c) - d), w: [`Klammer zuerst: ${b} + ${c} = ${b + c}`, `Dann Punkt vor Strich: ${a} · ${b + c} = ${a * (b + c)}`, `${a * (b + c)} − ${d} = ${a * (b + c) - d}`] }; }
      const c = rnd(2, 9), s = c * rnd(2, 12), a = rnd(1, s - 1), b = s - a, d = rnd(1, 40);
      return { e: [K('('), N(a), O('+'), N(b), K(')'), O(':'), N(c), O('+'), N(d)], a: I(s / c + d), w: [`Klammer zuerst: ${a} + ${b} = ${s}`, `Dann Punkt vor Strich: ${s} : ${c} = ${s / c}`, `${s / c} + ${d} = ${s / c + d}`] };
    }
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(6, 30), b = rnd(6, 30), d = rnd(2, 19), c = d + rnd(2, 9); return { e: [K('('), N(a), O('+'), N(b), K(')'), O('·'), K('('), N(c), O('−'), N(d), K(')')], a: I((a + b) * (c - d)), w: [`Beide Klammern zuerst: ${a} + ${b} = ${a + b} und ${c} − ${d} = ${c - d}`, `${a + b} · ${c - d} = ${(a + b) * (c - d)}`] }; }
      case 1: { const a = rnd(6, 15), b = rnd(3, 12), c = rnd(3, 12), d = rnd(3, 12), e = rnd(11, a * b + c * d); return { e: [N(a), O('·'), N(b), O('+'), N(c), O('·'), N(d), O('−'), N(e)], a: I(a * b + c * d - e), w: [`${PV}${a} · ${b} = ${a * b} und ${c} · ${d} = ${c * d}`, `${a * b} + ${c * d} = ${a * b + c * d}`, `${a * b + c * d} − ${e} = ${a * b + c * d - e}`] }; }
      default: { const c = rnd(5, 30), b = c + rnd(2, 9), d = rnd(3, 12), a = (b - c) * d + rnd(11, 150); return { e: [N(a), O('−'), K('('), N(b), O('−'), N(c), K(')'), O('·'), N(d)], a: I(a - (b - c) * d), w: [`Klammer zuerst: ${b} − ${c} = ${b - c}`, `Dann Punkt vor Strich: ${b - c} · ${d} = ${(b - c) * d}`, `${a} − ${(b - c) * d} = ${a - (b - c) * d}`] }; }
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
      let a = rnd(1001, 9999), b = rnd(1001, 9999); const minus = coin();
      if (minus && r(a, 100) < r(b, 100)) [a, b] = [b, a];
      const ra = r(a, 100), rb = r(b, 100);
      return { e: [T('Überschlag:'), N(a), O(minus ? '−' : '+'), N(b)], a: I(minus ? ra - rb : ra + rb), eqSign: '≈', hint: 'Runde beide Zahlen auf Hunderter', w: [`${a} ≈ ${ra} und ${b} ≈ ${rb}`, `${ra} ${minus ? '−' : '+'} ${rb} = ${minus ? ra - rb : ra + rb}`] };
    }
    let a, b; do { a = rnd(1001, 9999); b = rnd(12, 99); } while (r(a, 100) % 1000 === 0 || b % 10 === 0);
    const ra = r(a, 100), rb = r(b, 10);
    return { e: [T('Überschlag:'), N(a), O('·'), N(b)], a: I(ra * rb), eqSign: '≈', hint: 'Runde die erste Zahl auf Hunderter, die zweite auf Zehner', w: [`${fi(a)} ≈ ${fi(ra)} und ${b} ≈ ${rb}`, `${ra / 100} · ${rb / 10} = ${ra * rb / 1000}, dann drei Nullen anhängen`, `${fi(ra)} · ${rb} = ${fi(ra * rb)}`] };
  },

  unit(l) {
    const conv = (pairs, maxX) => {
      const [from, to, f] = pick(pairs), one = from === 'Tage' ? 'Tag' : from, lo = from === 'Tage' ? 2 : 1;   // „1 Tag“, nie „1 Tage“
      if (coin()) { const x = rnd(lo, maxX); return { e: [N(x), U(from)], a: I(x * f), unit: to, w: [`1 ${one} = ${fi(f)} ${to}`, `${x} · ${fi(f)} = ${fi(x * f)}`] }; }
      const y = rnd(lo, maxX); return { e: [N(y * f), U(to)], a: I(y), unit: from, w: [`1 ${one} = ${fi(f)} ${to}`, `${fi(y * f)} : ${fi(f)} = ${y}`] };
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
    if (l === 3) {
      if (coin()) return conv([['m²', 'dm²', 100], ['dm²', 'cm²', 100], ['m²', 'cm²', 10000], ['ha', 'm²', 10000], ['l', 'cm³', 1000], ['m³', 'dm³', 1000], ['a', 'm²', 100], ['m³', 'l', 1000]], 99);
      const [from, to, f] = pick([['m²', 'dm²', 100], ['m²', 'cm²', 10000], ['ha', 'm²', 10000], ['m³', 'dm³', 1000], ['m³', 'l', 1000], ['l', 'cm³', 1000]]), i = noTrail(11, 99);
      return { e: [D(i, 1), U(from)], a: De(i * f, 10), unit: to, w: [`1 ${from} = ${fi(f)} ${to}`, `${fmtDec(i, 1)} · ${fi(f)} = ${decOfQ(Q(i * f, 10))}`] };
    }
    switch (rnd(0, 4)) {
      case 0: { const k = rnd(2, 19), m = rnd(105, 995); return { e: [N(k), U('km'), N(m), U('m')], a: I(k * 1000 + m), unit: 'm', w: [`${k} km = ${fi(k * 1000)} m`, `${fi(k * 1000)} + ${m} = ${fi(k * 1000 + m)} m`] }; }
      case 1: { const h = rnd(1, 3), m = rnd(11, 59), c = rnd(11, 59); return { e: [N(h), U('h'), N(m), U('min'), N(c), U('s')], a: I(3600 * h + 60 * m + c), unit: 's', w: [`${h} h = ${fi(3600 * h)} s`, `${m} min = ${60 * m} s`, `${fi(3600 * h)} + ${60 * m} + ${c} = ${fi(3600 * h + 60 * m + c)} s`] }; }
      case 2: { const k = rnd(2, 19), g = rnd(105, 995); return { e: [N(k), U('kg'), N(g), U('g')], a: I(k * 1000 + g), unit: 'g', w: [`${k} kg = ${k * 1000} g`, `${k * 1000} + ${g} = ${fi(k * 1000 + g)} g`] }; }
      case 3: { const h = rnd(2, 9), q = pick([6, 12, 15, 18, 24, 36, 42, 45, 48, 54]), mi = h * 60 + q; return { e: [N(mi), U('min')], a: De(mi, 60), unit: 'h', w: [`${mi} min = ${h} h ${q} min`, `${q} min = ${fmtDec(q * 100 / 60, 2)} h → ${decOfQ(Q(mi, 60))} h`] }; }
      default: { let i; do i = 5 * rnd(21, 199); while (i % 10 === 0); return { e: [D(i, 2), U('h')], a: I(i * 60 / 100), unit: 'min', w: ['1 h = 60 min', `${fmtDec(i, 2)} · 60 = ${i * 60 / 100} min`] }; }
    }
  },

  divis(l) {
    const pf = n => { const out = []; for (let p = 2; n > 1; p++) while (n % p === 0) { out.push(p); n /= p; } return out; };
    if (l === 0) {
      const b = rnd(2, 9), q = rnd(2, 10), r = rnd(1, b - 1), a = b * q + r;
      return { e: [N(a), O(':'), N(b), Eq(), N(q), T('Rest'), Gap()], a: I(r), noEq: true, hint: 'Wie groß ist der Rest?', w: [`${q} · ${b} = ${q * b}`, `${a} − ${q * b} = ${r}`, `Also ${a} : ${b} = ${q} Rest ${r}`] };
    }
    if (l === 1) {
      const x = rnd(100, 9999), dg = String(x).split('').map(Number), s = dg.reduce((p, c) => p + c, 0);
      return { e: [T('Quersumme von'), N(x)], a: I(s), w: [`Alle Ziffern addieren: ${dg.join(' + ')} = ${s}`, s % 3 === 0 ? `Tipp: ${s} ist durch 3 teilbar – also auch ${fi(x)}.` : `Tipp: ${s} ist nicht durch 3 teilbar – also auch ${fi(x)} nicht.`, s % 9 === 0 ? `${s} ist sogar durch 9 teilbar – also auch ${fi(x)}.` : `${s} ist nicht durch 9 teilbar – also auch ${fi(x)} nicht.`] };
    }
    if (l === 2) {
      const g = rnd(12, 50); let x, y; do { x = rnd(2, 15); y = rnd(2, 15); } while (x === y || gcd(x, y) !== 1);
      const a = g * x, b = g * y;
      return { e: [S_(`ggT(${a}, ${b})`)], a: I(g), w: [`Teiler von ${a}: ${divisors(a).join(', ')}`, `Teiler von ${b}: ${divisors(b).join(', ')}`, `Der größte gemeinsame Teiler ist ${g}.`] };
    }
    if (l === 3) {
      let a, b; do { a = rnd(8, 60); b = rnd(8, 60); } while (a === b || lcm(a, b) > 900 || lcm(a, b) === Math.max(a, b) || lcm(a, b) === a * b && rand() < .5);
      const L = lcm(a, b);
      return { e: [S_(`kgV(${a}, ${b})`)], a: I(L), w: [`${a} = ${pf(a).join(' · ')}`, `${b} = ${pf(b).join(' · ')}`, 'Jeden Primfaktor so oft nehmen, wie er höchstens vorkommt:', `kgV = ${pf(L).join(' · ')} = ${L}`] };
    }
    if (coin()) {
      let n, f; do { n = pick([2, 3, 4, 5, 6, 7]) * pick([3, 5, 7, 11, 13]) * pick([11, 13, 17, 19, 23, 29, 31, 37]); f = pf(n); } while (n > 9999 || n < 500 || f[f.length - 1] === f[f.length - 2]);
      let cur = n; const steps = f.slice(0, -1).map(p => { const t = `${fi(cur)} : ${p} = ${fi(cur / p)}`; cur /= p; return t; });
      return { e: [T('größter Primfaktor von'), N(n)], a: I(f[f.length - 1]), w: [...steps, `${fi(n)} = ${f.join(' · ')}`, `Der größte Primfaktor ist ${f[f.length - 1]}.`] };
    }
    const [a, b, c] = [rnd(2, 5), rnd(1, 3), rnd(1, 2)], n = 2 ** a * 3 ** b * 5 ** c, f = pf(n);
    const ex = [[2, a], [3, b], [5, c]].filter(([, e]) => e), cnt = (a + 1) * (b + 1) * (c + 1);
    let cur = n; const steps = f.slice(0, -1).map(p => { const t = `${fi(cur)} : ${p} = ${fi(cur / p)}`; cur /= p; return t; });
    return { e: [T('Anzahl der Teiler von'), N(n)], a: I(cnt), w: [...steps, `${n} = ${f.join(' · ')} = ${ex.map(([p, e]) => e > 1 ? p + String(e).split('').map(d => SUPS[d]).join('') : p).join(' · ')}`, 'Anzahl der Teiler: jeden Exponenten um 1 erhöhen und malnehmen', `${ex.map(([, e]) => e + 1).join(' · ')} = ${cnt}`] };
  },

  eq(l) {
    const mk = (e, x, w) => ({ e, a: I(x), noEq: true, pre: 'x =', w });
    if (l === 0) {
      const a = rnd(1, 20);
      if (coin()) { const x = rnd(1, 20); return mk([V(1), O('+'), N(a), Eq(), N(x + a)], x, [`Auf beiden Seiten ${a} abziehen:`, `x = ${x + a} − ${a} = ${x}`]); }
      const x = rnd(a + 1, a + 20); return mk([V(1), O('−'), N(a), Eq(), N(x - a)], x, [`Auf beiden Seiten ${a} addieren:`, `x = ${x - a} + ${a} = ${x}`]);
    }
    if (l === 1) {
      const a = rnd(3, 15), x = rnd(6, 25);
      return coin() ? mk([V(a), Eq(), N(a * x)], x, [`Beide Seiten durch ${a} teilen:`, `x = ${a * x} : ${a} = ${x}`]) : mk([V(1), O(':'), N(a), Eq(), N(x)], x * a, [`Beide Seiten mal ${a} nehmen:`, `x = ${x} · ${a} = ${x * a}`]);
    }
    if (l === 2) {
      const a = rnd(3, 12), x = rnd(2, 15), b = rnd(11, 40);
      return coin() ? mk([V(a), O('+'), N(b), Eq(), N(a * x + b)], x, [`− ${b} auf beiden Seiten: ${a}x = ${a * x}`, `: ${a} auf beiden Seiten: x = ${x}`])
        : mk([V(a), O('−'), N(b), Eq(), N(a * x - b)], x, [`+ ${b} auf beiden Seiten: ${a}x = ${a * x}`, `: ${a} auf beiden Seiten: x = ${x}`]);
    }
    if (l === 3) {
      let x; do x = rnd(-15, 15); while (Math.abs(x) < 2);
      const a = rnd(3, 12), b = rnd(2, 19);
      if (coin()) { const c = a * x + b; return mk([V(a), O('+'), N(b), Eq(), N(c)], x, [`− ${b} auf beiden Seiten: ${a}x = ${fi(c - b)}`, `: ${a} auf beiden Seiten: x = ${fi(x)}`]); }
      return mk([N(a), K('('), V(1), O('+'), N(b), K(')'), Eq(), N(a * (x + b))], x, [`: ${a} auf beiden Seiten: x + ${b} = ${fi(x + b)}`, `− ${b} auf beiden Seiten: x = ${fi(x)}`]);
    }
    const a = rnd(4, 12), c = rnd(1, a - 2); let x; do x = rnd(-12, 15); while (Math.abs(x) < 2);
    let b; do b = rnd(-40, 40); while (Math.abs(b) < 5); const d = (a - c) * x + b;
    const side = (k, v) => [V(k), ...(v ? [O(v > 0 ? '+' : '−'), N(Math.abs(v))] : [])];
    return mk([...side(a, b), Eq(), ...side(c, d)], x, [`− ${c === 1 ? '' : c}x auf beiden Seiten: ${a - c === 1 ? '' : a - c}x${b ? sgnTerm(b) : ''} = ${fi(d)}`, ...(b ? [`${b > 0 ? '− ' + b : '+ ' + (-b)} auf beiden Seiten: ${a - c === 1 ? '' : a - c}x = ${fi(d - b)}`] : []), ...(a - c > 1 ? [`: ${a - c} auf beiden Seiten: x = ${fi(x)}`] : [])]);
  },

  lgs(l) {
    if (l === 0) {   // Additionsverfahren direkt: x + y = s, x − y = d
      const x = rnd(3, 20), y = rnd(1, x - 1), s = x + y, d = x - y;
      return lgsAsk(x, y, ['Additionsverfahren: I + II, dabei fällt y weg.', `(x + y) + (x − y) = ${s} + ${d}`, `2x = ${s + d}`, `: 2 auf beiden Seiten: x = ${s + d} : 2 = ${x}`, ...lgsBack('I', 1, 1, s, x, y), ...lgsProbe([['II', 1, -1, d]], x, y)],
        [`I: x + y = ${s}`, `II: x − y = ${d}`]);
    }
    if (l === 2) {   // Einsetzungsverfahren: I ist nach y aufgelöst
      let x, m, c, a, b, y; do { x = rnd(1, 12); m = rnd(2, 5); c = rnd(-9, 9); a = rnd(1, 5); b = rnd(1, 3); y = m * x + c; } while (y <= 0);
      const s = a * x + b * y, A = a + b * m, C = b * c;
      const ein = b === 1 ? `${lgsLin(a, 0)} + (${lgsLx(m, c)}) = ${s}` : `${lgsLin(a, 0)} + ${b} · (${lgsLx(m, c)}) = ${s}`;
      const w = ['Einsetzungsverfahren: Für y den Term aus I in II einsetzen.', ein, `Klammer auflösen: ${lgsLin(a, 0)} + ${lgsLx(b * m, C)} = ${s}`, `Zusammenfassen: ${lgsLx(A, C)} = ${s}`];
      if (C) w.push(`${C > 0 ? '− ' + C : '+ ' + -C} auf beiden Seiten: ${lgsLin(A, 0)} = ${s - C}`);
      w.push(`: ${A} auf beiden Seiten: x = ${s - C} : ${A} = ${x}`, `x = ${x} in I einsetzen: y = ${lgsVal(m, x, c)} = ${y}`, ...lgsProbe([['II', a, b, s]], x, y));
      return lgsAsk(x, y, w, [`I: y = ${lgsLx(m, c)}`, `II: ${lgsEq(a, b, s)}`]);
    }
    if (l === 1) {   // Gleichsetzungsverfahren: beide Gleichungen nach y aufgelöst
      let x, m1, m2, b1, b2; do { x = rnd(-8, 8); m1 = rnd(-5, 5); m2 = rnd(-5, 5); b1 = rnd(-10, 10); b2 = b1 + (m1 - m2) * x; } while (!x || !m1 || !m2 || m1 === m2 || Math.abs(b2) > 30 || !b2);
      const y = m1 * x + b1, D = m1 - m2, w = ['Gleichsetzungsverfahren: Beide Gleichungen sind nach y aufgelöst, also die rechten Seiten gleichsetzen.', `${lgsLx(m1, b1)} = ${lgsLx(m2, b2)}`];
      w.push(`${m2 > 0 ? '− ' + (m2 === 1 ? '' : m2) : '+ ' + (m2 === -1 ? '' : -m2)}x auf beiden Seiten: ${lgsLx(D, b1)} = ${fi(b2)}`);
      if (b1) w.push(`${b1 > 0 ? '− ' + b1 : '+ ' + -b1} auf beiden Seiten: ${lgsLin(D, 0)} = ${fi(b2 - b1)}`);
      if (D !== 1) w.push(`: ${par(D)} auf beiden Seiten: x = ${fi(b2 - b1)} : ${par(D)} = ${fi(x)}`);
      w.push(`x = ${fi(x)} in I einsetzen: y = ${lgsVal(m1, x, b1)} = ${fi(y)}`, `Probe in II: ${lgsVal(m2, x, b2)} = ${fi(m2 * x + b2)} ✓`);
      return lgsAsk(x, y, w, [`I: y = ${lgsLx(m1, b1)}`, `II: y = ${lgsLx(m2, b2)}`]);
    }
    if (l === 3) {   // Additionsverfahren: eine Gleichung malnehmen
      const { x, y, E1, E2 } = lgsPick(6, 1, 12, (a1, b1, a2, b2) => a1 > 0 && a2 > 0 && Math.abs(b1) !== Math.abs(b2) && (Math.abs(b1) % Math.abs(b2) === 0 || Math.abs(b2) % Math.abs(b1) === 0));
      return lgsAsk(x, y, lgsAdd(E1, E2, x, y), lgsSys(E1, E2));
    }
    // Stufe 5: Additionsverfahren, beide Gleichungen malnehmen, negative Lösungen
    const { x, y, E1, E2 } = lgsPick(9, -12, 12, (a1, b1, a2, b2) => lcm(Math.abs(b1), Math.abs(b2)) > Math.max(Math.abs(b1), Math.abs(b2)));
    return lgsAsk(x, y, lgsAdd(E1, E2, x, y), lgsSys(E1, E2));
  },
  quad(l) {
    if (l === 0) {   // x² = Quadratzahl, positive Lösung
      const x = rnd(2, 15);
      return quadAsk(`x² = ${x * x}`, [0, 0], [`Welche positive Zahl mal sich selbst ergibt ${x * x}?`, `x = ${x}, denn ${x} · ${x} = ${x * x}`], 'Welche Zahl mal sich selbst?', x);
    }
    if (l === 1) {   // x² ± Zahl = Zahl
      const x = rnd(3, 14), c = rnd(4, Math.min(40, x * x - 1));
      return coin() ? quadAsk(`x² + ${c} = ${x * x + c}`, [0, 0], [`${c} auf beiden Seiten abziehen: x² = ${x * x}`, `x = ${x}, denn ${x} · ${x} = ${x * x}`], 'Erst x² allein', x)
        : quadAsk(`x² − ${c} = ${x * x - c}`, [0, 0], [`${c} auf beiden Seiten addieren: x² = ${x * x}`, `x = ${x}, denn ${x} · ${x} = ${x * x}`], 'Erst x² allein', x);
    }
    if (l === 2) {   // a·x² = Zahl, oder (x + s)² = k²
      if (coin()) {
        const a = rnd(2, 12), x = rnd(3, 15);
        return quadAsk(`${a}x² = ${a * x * x}`, [0, 0], [`Beide Seiten durch ${a} teilen: x² = ${x * x}`, `x = ${x}, denn ${x} · ${x} = ${x * x}`], 'Erst durch den Faktor teilen', x);
      }
      const [r1, r2] = quadPick(-14, 14, (a, b) => (b - a) % 2 === 0 && (b - a) / 2 >= 2), m = (r1 + r2) / 2, k = (r2 - r1) / 2, sg = m > 0 ? '−' : '+';
      return quadAsk(`(x ${sg} ${Math.abs(m)})² = ${k * k}`, [r1, r2], [`Wurzel ziehen: x ${sg} ${Math.abs(m)} = ${k} oder x ${sg} ${Math.abs(m)} = ${fi(-k)}`, `x = ${fi(m + k)} oder x = ${fi(m - k)}`], 'Auf beiden Seiten die Wurzel ziehen');
    }
    if (l === 3) {   // Produkt gleich null
      const [r1, r2] = quadPick(-12, 12), f = coin() ? [r2, r1] : [r1, r2];
      return quadAsk(`${quadFac(f[0])}${quadFac(f[1])} = 0`, [r1, r2], ['Ein Produkt ist null, wenn ein Faktor null ist.', quadZero(f[0]), quadZero(f[1])], 'Jeder Faktor kann null sein');
    }
    // x² + px + q = 0, Satz von Vieta
    const [r1, r2] = quadPick(-15, 15, (a, b) => a * b !== 0 && Math.abs(a * b) >= 12), p = -(r1 + r2), q = r1 * r2;
    return quadAsk(`${quadPoly(1, p, q)} = 0`, [r1, r2], [`Gesucht: zwei Zahlen mit Summe ${fi(-p)} und Produkt ${fi(q)}`, `Das sind ${fi(r1)} und ${fi(r2)}`], 'Summe und Produkt der Lösungen');
  },
  word(l) {
    const n = pick(NAMES); let n2; do n2 = pick(NAMES); while (n2 === n);
    const W_ = (story, a, unit, w, hint) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true, hint });
    if (rand() < .5) return pick(WORD_MORE[l])(n, n2, W_);   // neue Geschichten
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
        case 0: { const c = rnd(69, 199), k = rnd(2, 5); return W_(`Ein Liter Milch kostet ${fmtMoney(c)} €. Wie viel kosten ${k} Liter?`, Mo(c * k), '€', [`In Cent rechnen: ${k} · ${c} ct = ${c * k} ct`, `${c * k} ct = ${fmtMoney(c * k)} €`]); }
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
        default: { const c = 5 * rnd(10, 30), a = rnd(2, 5); let b; do b = rnd(3, 9); while (b === a); return W_(`${a} Hefte kosten ${fmtMoney(a * c)} €. Wie viel kosten ${b} Hefte?`, Mo(b * c), '€', [`Dreisatz: erst den Preis für 1 Heft`, `${fmtMoney(a * c)} € : ${a} = ${fmtMoney(c)} €`, `${b} · ${fmtMoney(c)} € = ${fmtMoney(b * c)} €`]); }
      }
    }
    switch (rnd(0, 4)) {
      case 0: { const c = rnd(30, 60), k = rnd(3, 8), z = k * c < 500 ? 5 : 10; return W_(`${n} kauft ${k} Brötchen zu je ${c} Cent und bezahlt mit ${z} €. Wie viel Cent Rückgeld bekommt ${n}?`, I(z * 100 - k * c), 'ct', [`Preis: ${k} · ${c} ct = ${k * c} ct`, `${z} € = ${z * 100} ct`, `${z * 100} − ${k * c} = ${z * 100 - k * c} ct`]); }
      case 1: { const a = rnd(6, 12), m = rnd(3, 4), y = rnd(2, 10); return W_(`${n} ist ${a} Jahre alt. Die Mutter ist ${m}-mal so alt. Wie alt ist die Mutter in ${y} Jahren?`, I(a * m + y), 'Jahre', [`Mutter heute: ${m} · ${a} = ${a * m}`, `In ${y} Jahren: ${a * m} + ${y} = ${a * m + y}`]); }
      case 2: { const v = rnd(5, 9), d = 50 * rnd(3, 12); return W_(`Ein Auto verbraucht ${v} Liter auf 100 km. Wie viele Liter braucht es für ${d} km?`, De(v * d, 100), 'l', [`Für 1 km: ${v} : 100 Liter`, `Für ${d} km: ${v} · ${d} : 100 = ${decOfQ(Q(v * d, 100))}`]); }
      case 3: { const p = 20 * rnd(5, 20), q = pick([10, 20, 25]), r = 5 * rnd(1, 8), up = p * q / 100; return W_(`Ein Fahrrad kostet ${p} €. Zuerst wird es um ${q} % teurer, dann um ${r} € billiger. Was kostet es am Ende?`, I(p + up - r), '€', [`${q} % von ${p} € = ${up} €`, `${p} + ${up} = ${p + up} €`, `${p + up} − ${r} = ${p + up - r} €`]); }
      default: { const b = rnd(2, 8), a = rnd(2, 6), t = b * rnd(1, 4); return W_(`${a} Personen brauchen ${t} Tage, um einen Zaun zu streichen. Wie viele Tage brauchen ${b} Personen, wenn alle gleich schnell arbeiten?`, I(a * t / b), 'Tage', [`Mehr Personen – weniger Tage (antiproportional).`, `Arbeit insgesamt: ${a} · ${t} = ${a * t} Personentage`, `${a * t} : ${b} = ${fq(a * t, b)}`]); }
    }
  },

  /* ---------- neue Themen (16.11.2026, Marcel: „sehr erweitern mit vielen neuen Aufgaben“) ---------- */
  doppel(l) {
    const dbl = x => ({ e: [T('das Doppelte von'), N(x)], a: I(2 * x), w: dblW(x) });
    const hlf = x => ({ e: [T('die Hälfte von'), N(x)], a: I(x / 2), w: hlfW(x) });
    if (l === 0) return coin() ? dbl(rnd(1, 10)) : hlf(2 * rnd(1, 10));
    if (l === 1) return coin() ? dbl(rnd(11, 50)) : hlf(2 * rnd(6, 50));
    if (l === 2) return coin() ? dbl(rnd(51, 499)) : hlf(pick([2 * rnd(51, 499), 10 * rnd(11, 99)]));
    if (l === 3) {
      if (coin()) { const x = 2 * rnd(5, 49) + 1; return { e: [T('die Hälfte von'), N(x)], a: De(x, 2), w: [`${x} = ${x - 1} + 1`, `Hälfte von ${x - 1} = ${(x - 1) / 2}, Hälfte von 1 = 0,5`, `${(x - 1) / 2} + 0,5 = ${fmtDec(x * 5, 1)}`] }; }
      const i = noTrail(11, 99); return { e: [T('das Doppelte von'), D(i, 1)], a: De(2 * i, 10), w: [`Doppelt so viel: ${fmtDec(i, 1)} + ${fmtDec(i, 1)} = ${fmtDec(2 * i, 1)}`] };
    }
    switch (rnd(0, 3)) {
      case 0: { const x = rnd(101, 999); return { e: [T('das Vierfache von'), N(x)], a: I(4 * x), w: ['Vierfach = zweimal verdoppeln', `${x} → ${2 * x} → ${4 * x}`] }; }
      case 1: { const x = 4 * rnd(101, 999); return { e: [T('ein Viertel von'), N(x)], a: I(x / 4), w: ['Ein Viertel = zweimal halbieren', `${x} → ${x / 2} → ${x / 4}`] }; }
      case 2: { const x = rnd(26, 125); return { e: [T('dreimal verdoppeln:'), N(x)], a: I(8 * x), w: [`${x} → ${2 * x} → ${4 * x} → ${8 * x}`, `Dreimal verdoppeln heißt mal 8.`] }; }
      default: { const x = 8 * rnd(101, 999); return { e: [T('dreimal halbieren:'), N(x)], a: I(x / 8), w: [`${x} → ${x / 2} → ${x / 4} → ${x / 8}`, `Dreimal halbieren heißt geteilt durch 8.`] }; }
    }
  },

  geld(l) {
    const ct = c => [M(c), U('€')];
    if (l === 0) {
      const a = 5 * rnd(2, 12), b = 5 * rnd(2, 10);
      return coin() ? { e: [N(a), U('ct'), O('+'), N(b), U('ct')], a: I(a + b), unit: 'ct', w: addW(a, b) }
        : { e: [N(a + b), U('ct'), O('−'), N(a), U('ct')], a: I(b), unit: 'ct', w: subW(a + b, a) };
    }
    if (l === 1) {
      switch (rnd(0, 2)) {
        case 0: { const e = rnd(1, 9), c = 10 * rnd(1, 9); return { e: [N(e), U('€'), N(c), U('ct')], a: I(e * 100 + c), unit: 'ct', w: [`${e} € = ${e * 100} ct`, `${e * 100} + ${c} = ${e * 100 + c} ct`] }; }
        case 1: { const c = 10 * rnd(11, 99); return { e: [N(c), U('ct')], a: Mo(c), unit: '€', w: ['100 ct = 1 €', `${c} ct = ${fmtMoney(c)} €`] }; }
        default: { const p = rnd(2, 18), z = p < 10 ? 10 : 20; return { e: [Story(`Du kaufst etwas für ${p} € und bezahlst mit einem ${z}-€-Schein. Wie viel Rückgeld bekommst du?`)], a: I(z - p), unit: '€', noEq: true, story: true, w: [`Rückgeld = bezahlt − Preis`, `${z} − ${p} = ${z - p}`] }; }
      }
    }
    if (l === 2) {
      const a = rnd(105, 899), b = rnd(105, 899);
      if (coin()) return { e: [...ct(a), O('+'), ...ct(b)], a: Mo(a + b), unit: '€', w: [`In Cent rechnen: ${a} ct + ${b} ct = ${a + b} ct`, `${a + b} ct = ${fmtMoney(a + b)} €`] };
      const [x, y] = a > b ? [a, b] : [b, a];
      return { e: [...ct(x), O('−'), ...ct(y)], a: Mo(x - y), unit: '€', w: [`In Cent rechnen: ${x} ct − ${y} ct = ${x - y} ct`, `${x - y} ct = ${fmtMoney(x - y)} €`] };
    }
    if (l === 3) {
      switch (rnd(0, 2)) {
        case 0: { const p = rnd(111, 1899), z = p < 500 ? 5 : p < 1000 ? 10 : 20; return { e: [Story(`Du kaufst für ${fmtMoney(p)} € ein und bezahlst mit ${z} €. Wie viel Rückgeld bekommst du?`)], a: Mo(z * 100 - p), unit: '€', noEq: true, story: true, w: [`Ergänze von ${fmtMoney(p)} € bis ${z} €:`, `${z * 100} ct − ${p} ct = ${z * 100 - p} ct = ${fmtMoney(z * 100 - p)} €`] }; }
        case 1: { const c = 5 * rnd(20, 180), k = rnd(2, 6); return { e: [N(k), O('·'), ...ct(c)], a: Mo(k * c), unit: '€', w: [`In Cent: ${k} · ${c} ct = ${k * c} ct`, `${k * c} ct = ${fmtMoney(k * c)} €`] }; }
        default: { const a = rnd(99, 599), b = rnd(99, 599), c = rnd(99, 599); return { e: [...ct(a), O('+'), ...ct(b), O('+'), ...ct(c)], a: Mo(a + b + c), unit: '€', w: [`${a} + ${b} + ${c} = ${a + b + c} ct`, `= ${fmtMoney(a + b + c)} €`] }; }
      }
    }
    switch (rnd(0, 2)) {
      case 0: { const p = rnd(151, 995); return { e: [Story(`500 g Käse kosten ${fmtMoney(p)} €. Wie viel kostet 1 kg Käse?`)], a: Mo(2 * p), unit: '€', noEq: true, story: true, w: ['1 kg = 2 · 500 g', `2 · ${fmtMoney(p)} € = ${fmtMoney(2 * p)} €`] }; }
      case 1: { const u = rnd(41, 399), k = 3, m = rnd(4, 12); return { e: [Story(`${k} Stück kosten ${fmtMoney(k * u)} €. Wie viel kosten ${m} Stück?`)], a: Mo(m * u), unit: '€', noEq: true, story: true, w: [`1 Stück: ${fmtMoney(k * u)} € : ${k} = ${fmtMoney(u)} €`, `${m} Stück: ${m} · ${fmtMoney(u)} € = ${fmtMoney(m * u)} €`] }; }
      default: { const g = pick([250, 200, 125]), p = rnd(51, 499), f = 1000 / g; return { e: [Story(`${g} g Käse kosten ${fmtMoney(p)} €. Wie viel kostet 1 kg?`)], a: Mo(f * p), unit: '€', noEq: true, story: true, w: [`1 kg = 1000 g = ${f} · ${g} g`, `${f} · ${fmtMoney(p)} € = ${fmtMoney(f * p)} €`] }; }
    }
  },

  zeit(l) {
    const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a: I(a), unit, w, noEq: true, story: true });
    if (l === 0) {
      switch (rnd(0, 3)) {
        case 0: { const [n, m] = pick([['eine halbe Stunde', 30], ['eine Viertelstunde', 15], ['eine Dreiviertelstunde', 45], ['eine ganze Stunde', 60]]); return S2(`Wie viele Minuten sind ${n}?`, m, 'min', [`1 Stunde = 60 Minuten`, `${n[0].toUpperCase() + n.slice(1)} = ${m} Minuten`]); }
        case 1: { const a = rnd(1, 8), b = a + rnd(1, 4); return S2(`Von ${a} Uhr bis ${b} Uhr: Wie viele Stunden sind das?`, b - a, 'h', [`${b} − ${a} = ${b - a}`]); }
        case 2: { const w = rnd(2, 4); return S2(`Wie viele Tage haben ${w} Wochen?`, 7 * w, 'Tage', ['1 Woche = 7 Tage', `${w} · 7 = ${7 * w}`]); }
        default: { const a = rnd(6, 8), d = rnd(2, 4); return S2(`Es ist ${a} Uhr morgens. Wie spät ist es in ${d} Stunden?`, a + d, 'Uhr', [`${a} + ${d} = ${a + d}`]); }
      }
    }
    if (l === 1) {
      const c = rnd(0, 3);
      if (c === 2) { const [mn, len] = pick([['März', 31], ['Mai', 31], ['April', 30], ['Juni', 30], ['Oktober', 31], ['November', 30]]), a = rnd(len - 10, len - 1), b = rnd(2, 12), nx = { März: 'April', Mai: 'Juni', April: 'Mai', Juni: 'Juli', Oktober: 'November', November: 'Dezember' }[mn];
        return S2(`Heute ist der ${a}. ${mn}. In wie vielen Tagen ist der ${b}. ${nx}?`, len - a + b, 'Tage', [`Der ${mn} hat ${len} Tage.`, `Bis zum Monatsende: ${len} − ${a} = ${len - a}`, `${len - a} + ${b} = ${len - a + b}`]); }
      if (c === 3) { const d = rnd(2, 6), h = rnd(2, 23); return S2(`Wie viele Stunden sind ${d} Tage und ${h} Stunden?`, 24 * d + h, 'h', ['1 Tag = 24 Stunden', `${d} · 24 = ${24 * d}`, `${24 * d} + ${h} = ${24 * d + h}`]); }
      const h = rnd(7, 17), m1 = 5 * rnd(0, 8), d = 5 * rnd(3, 11), s = h * 60 + m1;
      return S2(`Von ${hm(s)} Uhr bis ${hm(s + d)} Uhr: Wie viele Minuten sind das?`, d, 'min', s % 60 + d > 60 ? [`Bis ${h + 1}:00 Uhr: ${60 - m1} Minuten`, `Dann noch ${(s + d) % 60} Minuten`, `${60 - m1} + ${(s + d) % 60} = ${d}`] : [`Ende minus Anfang (in Minuten nach ${h}:00 Uhr): ${(s + d) % 60 || 60} − ${m1} = ${d}`]);
    }
    if (l === 2) {
      if (coin()) {
        const s = 60 * rnd(7, 18) + 5 * rnd(1, 11), d = 5 * rnd(13, 30), e = s + d;
        return S2(`Von ${hm(s)} Uhr bis ${hm(e)} Uhr: Wie viele Minuten sind das?`, d, 'min', [`Bis zur vollen Stunde ${Math.ceil(s / 60)}:00 Uhr: ${60 - s % 60} min`, `Dann bis ${hm(e)} Uhr: ${e - Math.ceil(s / 60) * 60} min`, `${60 - s % 60} + ${e - Math.ceil(s / 60) * 60} = ${d} min`]);
      }
      let s, d, e; do { s = 60 * rnd(14, 19) + 5 * rnd(0, 11); d = 5 * rnd(15, 30); e = s + d; } while (e % 60 === 0);
      return S2(`Ein Film beginnt um ${hm(s)} Uhr und dauert ${d} Minuten. Wie viele Minuten nach ${Math.floor(e / 60)} Uhr ist er zu Ende?`, e % 60, 'min', [`${d} min = ${Math.floor(d / 60)} h ${d % 60} min`, `${hm(s)} Uhr + ${d} min = ${hm(e)} Uhr`]);
    }
    if (l === 3) {
      switch (rnd(0, 3)) {
        case 0: case 1: { const s = 60 * rnd(6, 11) + 5 * rnd(1, 11), e = 60 * rnd(13, 20) + 5 * rnd(0, 11), d = e - s; return S2(`Von ${hm(s)} Uhr bis ${hm(e)} Uhr: Wie viele Minuten sind das?`, d, 'min', [`Bis zur vollen Stunde ${Math.ceil(s / 60)}:00 Uhr: ${60 - s % 60} min`, `Von ${Math.ceil(s / 60)}:00 bis ${Math.floor(e / 60)}:00 Uhr: ${Math.floor(e / 60) - Math.ceil(s / 60)} h = ${(Math.floor(e / 60) - Math.ceil(s / 60)) * 60} min`, `Dann noch ${e % 60} min`, `${60 - s % 60} + ${(Math.floor(e / 60) - Math.ceil(s / 60)) * 60} + ${e % 60} = ${d} min`]); }
        case 2: { const m = rnd(11, 59), c = rnd(11, 59); return S2(`Wie viele Sekunden sind ${m} Minuten und ${c} Sekunden?`, 60 * m + c, 's', ['1 Minute = 60 Sekunden', `${m} · 60 = ${60 * m}`, `${60 * m} + ${c} = ${fi(60 * m + c)}`]); }
        default: { const h = rnd(1, 3), m = rnd(11, 59), c = rnd(11, 59); return S2(`Wie viele Sekunden sind ${h} h ${m} min ${c} s?`, 3600 * h + 60 * m + c, 's', ['1 h = 3600 s, 1 min = 60 s', `${h} · 3600 = ${fi(3600 * h)} und ${m} · 60 = ${60 * m}`, `${fi(3600 * h)} + ${60 * m} + ${c} = ${fi(3600 * h + 60 * m + c)}`]); }
      }
    }
    switch (rnd(0, 3)) {
      case 0: { const s = 60 * rnd(19, 23) + rnd(1, 59), e = 60 * rnd(4, 9) + rnd(1, 59), d = 1440 - s + e; return S2(`Ein Nachtzug fährt um ${hm(s)} Uhr ab und kommt am nächsten Morgen um ${hm(e)} Uhr an. Wie viele Minuten dauert die Fahrt?`, d, 'min', [`Bis Mitternacht: 24:00 − ${hm(s)} = ${1440 - s} min`, `Nach Mitternacht: ${hm(e)} = ${e} min`, `${1440 - s} + ${e} = ${d} min`]); }
      case 1: { let i, s; do { i = 5 * rnd(21, 79); s = 60 * rnd(8, 19) + 5 * rnd(0, 11); } while (i % 10 === 0 || (s + i * 60 / 100) % 60 === 0); const m = i * 60 / 100, h = Math.floor(i / 100), r = i % 100, e = s + m;
        return S2(`Ein Film beginnt um ${hm(s)} Uhr und dauert ${fmtDec(i, 2)} Stunden. Wie viele Minuten nach ${Math.floor(e / 60)} Uhr ist er zu Ende?`, e % 60, 'min', [`${h} h = ${60 * h} min und ${fmtDec(r, 2)} h = ${fmtDec(r, 2)} · 60 min = ${r * 60 / 100} min`, `Der Film dauert ${m} min = ${Math.floor(m / 60)} h ${m % 60} min`, `${hm(s)} Uhr + ${Math.floor(m / 60)} h ${m % 60} min = ${hm(e)} Uhr`]); }
      case 2: { let p, km, sec; do { p = [rnd(3, 7), 5 * rnd(1, 11)]; km = pick([8, 10, 12, 15, 21]); sec = (p[0] * 60 + p[1]) * km; } while (sec % 6);
        return { ...S2(`Eine Läuferin braucht für 1 km ${p[0]} min ${p[1]} s. Wie viele Minuten braucht sie für ${km} km?`, 0, 'min', [`1 km: ${p[0] * 60 + p[1]} s`, `${km} km: ${km} · ${p[0] * 60 + p[1]} s = ${sec} s`, `${sec} s : 60 = ${decOfQ(Q(sec, 60))} min`]), a: De(sec, 60) }; }
      default: { let t; do t = 5 * rnd(21, 99); while (t % 10 === 0); const v = rnd(12, 35); return { ...S2(`Ein Radfahrer fährt ${fmtDec(t, 2)} Stunden lang mit ${v} km pro Stunde. Wie viele Kilometer schafft er?`, 0, 'km', ['Weg = Tempo · Zeit', `${v} · ${Math.floor(t / 100)} = ${v * Math.floor(t / 100)} und ${v} · ${fmtDec(t % 100, 2)} = ${decOfQ(Q(v * (t % 100), 100))}`, `${v * Math.floor(t / 100)} + ${decOfQ(Q(v * (t % 100), 100))} = ${decOfQ(Q(v * t, 100))} km`]), a: De(v * t, 100) }; }
    }
  },

  geo(l) {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a: I(a), unit, w, noEq: true, story: true });
    if (l === 0) {
      if (coin()) { const s = rnd(2, 12); return S2(`Ein Quadrat hat die Seitenlänge ${s} cm. Wie groß ist sein Umfang?`, 4 * s, 'cm', ['Umfang Quadrat = 4 · Seite', `4 · ${s} = ${4 * s}`]); }
      const a = rnd(3, 12), b = rnd(2, 9); return S2(`Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie groß ist sein Umfang?`, 2 * (a + b), 'cm', ['Umfang = 2 · (Länge + Breite)', `2 · (${a} + ${b}) = ${2 * (a + b)}`]);
    }
    if (l === 1) {
      switch (rnd(0, 2)) {
        case 0: { const s = rnd(4, 20); return S2(`Ein Quadrat hat die Seitenlänge ${s} cm. Wie groß ist seine Fläche?`, s * s, 'cm²', ['Fläche Quadrat = Seite · Seite', `${s} · ${s} = ${s * s}`]); }
        case 1: { const a = rnd(6, 25), b = rnd(3, 15); return S2(`Ein Rechteck ist ${a} m lang und ${b} m breit. Wie groß ist seine Fläche?`, a * b, 'm²', ['Fläche = Länge · Breite', `${a} · ${b} = ${a * b}`]); }
        default: { const s = rnd(6, 30); return S2(`Ein Quadrat hat den Umfang ${4 * s} cm. Wie lang ist eine Seite?`, s, 'cm', ['Ein Quadrat hat 4 gleich lange Seiten.', `${4 * s} : 4 = ${s}`]); }
      }
    }
    if (l === 2) {
      switch (rnd(0, 2)) {
        case 0: { const a = 5 * rnd(6, 16), b = 5 * rnd(4, Math.min(20, 34 - a / 5)); return S2(`In einem Dreieck sind zwei Winkel ${a}° und ${b}° groß. Wie groß ist der dritte Winkel?`, 180 - a - b, '°', ['Alle Winkel im Dreieck zusammen: 180°', `180 − ${a} − ${b} = ${180 - a - b}`]); }
        case 1: { const a = 5 * rnd(4, 32); return S2(`Zwei Nebenwinkel ergeben zusammen 180°. Einer ist ${a}° groß. Wie groß ist der andere?`, 180 - a, '°', [`Nebenwinkel ergänzen sich zu 180°.`, `Der andere Winkel: 180° − ${a}° = ${180 - a}°`]); }
        default: { const b = rnd(3, 12), a = rnd(3, 15); return S2(`Ein Rechteck hat die Fläche ${a * b} cm² und ist ${b} cm breit. Wie lang ist es?`, a, 'cm', ['Länge = Fläche : Breite', `${a * b} : ${b} = ${a}`]); }
      }
    }
    if (l === 3) {
      switch (rnd(0, 3)) {
        case 0: { const g = 2 * rnd(2, 10), h = rnd(3, 12); return S2(`Ein Dreieck hat die Grundseite ${g} cm und die Höhe ${h} cm. Wie groß ist seine Fläche?`, g * h / 2, 'cm²', ['Fläche Dreieck = Grundseite · Höhe : 2', `${g} · ${h} : 2 = ${g * h / 2}`]); }
        case 1: { const a = rnd(2, 8), b = rnd(2, 6), c = rnd(2, 5); return S2(`Ein Quader ist ${a} cm lang, ${b} cm breit und ${c} cm hoch. Wie groß ist sein Volumen?`, a * b * c, 'cm³', ['Volumen = Länge · Breite · Höhe', `${a} · ${b} · ${c} = ${a * b * c}`]); }
        case 2: { const a = 5 * rnd(14, 24), b = 5 * rnd(14, 24), c = 5 * rnd(12, Math.min(26, (360 - a - b - 60) / 5)); return S2(`In einem Viereck sind drei Winkel ${a}°, ${b}° und ${c}° groß. Wie groß ist der vierte Winkel?`, 360 - a - b - c, '°', ['Alle Winkel im Viereck zusammen: 360°', `360 − ${a} − ${b} − ${c} = ${360 - a - b - c}`]); }
        default: { const s = rnd(2, 9); return S2(`Ein Würfel hat die Kantenlänge ${s} cm. Wie groß ist seine Oberfläche?`, 6 * s * s, 'cm²', ['Ein Würfel hat 6 gleiche Quadrate.', `Ein Quadrat: ${s} · ${s} = ${s * s}`, `6 · ${s * s} = ${6 * s * s}`]); }
      }
    }
    switch (rnd(0, 3)) {
      case 0: { const k = rnd(1, 3), [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]).map(v => v * k); return S2(`Ein rechtwinkliges Dreieck hat die Katheten ${x} cm und ${y} cm. Wie lang ist die Hypotenuse?`, z, 'cm', ['Satz des Pythagoras: a² + b² = c²', `${x}² + ${y}² = ${x * x} + ${y * y} = ${z * z}`, `√${z * z} = ${z}`]); }
      case 1: { const n = rnd(7, 24); return S2(`Wie groß ist die Summe aller Innenwinkel in einem ${n}-Eck?`, (n - 2) * 180, '°', ['Innenwinkelsumme = (Ecken − 2) · 180°', `(${n} − 2) · 180 = ${(n - 2) * 180}`]); }
      case 2: { const a = rnd(8, 25), c = a + 2 * rnd(2, 9), h = rnd(5, 19); return S2(`Ein Trapez hat die parallelen Seiten ${a} cm und ${c} cm und die Höhe ${h} cm. Wie groß ist seine Fläche?`, (a + c) / 2 * h, 'cm²', ['Fläche Trapez = (a + c) : 2 · h', `(${a} + ${c}) : 2 = ${(a + c) / 2}`, `${(a + c) / 2} · ${h} = ${(a + c) / 2 * h}`]); }
      default: { const s = rnd(6, 25); return S2(`Ein Würfel hat die Kantenlänge ${s} cm. Wie groß ist sein Volumen?`, s ** 3, 'cm³', ['Volumen Würfel = Kante · Kante · Kante', `${s} · ${s} · ${s} = ${s ** 3}`]); }
    }
  },

  folge(l) {
    const mk = (seq, ans, w, gapAt) => {
      const shown = seq.map((v, i) => i === gapAt ? '?' : fi(v)).join(', ') + (gapAt == null ? ', ?' : '');
      return { e: [S_(shown)], a: I(ans), noEq: true, hint: gapAt == null ? 'Welche Zahl kommt als Nächstes?' : 'Welche Zahl fehlt?', w };
    };
    const ar = (s, d, n = 5) => Array.from({ length: n }, (_, i) => s + i * d);
    if (l === 0) { const d = pick([1, 2, 2, 3, 5, 10]), down = coin() && d < 5, s = down ? rnd(4 * d + 1, 20 + 4 * d) : rnd(0, 15), dd = down ? -d : d, q = ar(s, dd, 4); return mk(q, s + 4 * dd, [`Immer ${down ? '−' : '+'} ${d}`, `${q[3]} ${down ? '−' : '+'} ${d} = ${s + 4 * dd}`]); }
    if (l === 1) {
      if (coin()) { const d = rnd(3, 12) * (coin() ? 1 : -1), s = d > 0 ? rnd(1, 50) : rnd(60, 100), q = ar(s, d, 4); return mk(q, s + 4 * d, [`Immer ${d > 0 ? '+' : '−'} ${Math.abs(d)}`, `${q[3]} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = ${s + 4 * d}`]); }
      const s = rnd(1, 6), q = [s, 2 * s, 4 * s, 8 * s]; return mk(q, 16 * s, ['Immer verdoppeln (· 2)', `${8 * s} · 2 = ${16 * s}`]);
    }
    if (l === 2) {
      switch (rnd(0, 2)) {
        case 0: { const a = rnd(3, 9), b = rnd(1, a - 1), s = rnd(1, 20), q = [s, s + a, s + a - b, s + 2 * a - b, s + 2 * a - 2 * b]; return mk(q, s + 3 * a - 2 * b, [`Abwechselnd + ${a} und − ${b}`, `${q[4]} + ${a} = ${s + 3 * a - 2 * b}`]); }
        case 1: { const s = rnd(1, 10), q = [s, s + 1, s + 3, s + 6, s + 10]; return mk(q, s + 15, ['Die Abstände wachsen: + 1, + 2, + 3, + 4, …', `${s + 10} + 5 = ${s + 15}`]); }
        default: { const s = rnd(1, 4), q = [s, 3 * s, 9 * s, 27 * s]; return mk(q, 81 * s, ['Immer mal 3', `${27 * s} · 3 = ${81 * s}`]); }
      }
    }
    if (l === 3) {
      switch (rnd(0, 3)) {
        case 0: { const s = rnd(5, 12), q = [s, s + 1, s + 2, s + 3].map(x => x * x); return mk(q, (s + 4) ** 2, ['Quadratzahlen', `${s + 4} · ${s + 4} = ${(s + 4) ** 2}`]); }
        case 1: { const e = rnd(5, 8), f = pick([3, 5, 7, 9]), q = [e, e - 1, e - 2, e - 3].map(k => 2 ** k * f); return mk(q, f * 2 ** (e - 4), ['Immer halbieren (: 2)', `${q[3]} : 2 = ${f * 2 ** (e - 4)}`]); }
        case 2: { let a = rnd(3, 9), b = rnd(a, 15); const q = [a, b]; while (q.length < 6) q.push(q[q.length - 1] + q[q.length - 2]); return mk(q, q[4] + q[5], ['Jede Zahl ist die Summe der beiden davor', `${q[4]} + ${q[5]} = ${q[4] + q[5]}`]); }
        default: { const d = rnd(11, 39), s = rnd(101, 400), q = ar(s, d, 5), g = rnd(1, 3); return mk(q, q[g], [`Immer + ${d}`, `${q[g - 1]} + ${d} = ${q[g]}`], g); }
      }
    }
    switch (rnd(0, 3)) {
      case 0: { const s = rnd(3, 12) * (coin() ? 1 : -1), q = [s, -2 * s, 4 * s, -8 * s]; return mk(q, 16 * s, ['Immer mal (−2)', `${fi(-8 * s)} · (−2) = ${fi(16 * s)}`]); }
      case 1: { const s = rnd(3, 12), q = [s]; while (q.length < 5) q.push(q[q.length - 1] * 2 + 1); return mk(q, q[4] * 2 + 1, ['Immer · 2, dann + 1', `${q[4]} · 2 + 1 = ${q[4] * 2 + 1}`]); }
      case 2: { const d = rnd(11, 29), s = rnd(20, 60), q = ar(s, -d, 6); return mk(q, s - 6 * d, [`Immer − ${d} (auch unter null)`, `${fi(q[5])} − ${d} = ${fi(s - 6 * d)}`]); }
      default: { const a = rnd(3, 9), s = rnd(11, 50), q = [s, s + a, s + 3 * a, s + 6 * a, s + 10 * a]; return mk(q, s + 15 * a, [`Die Abstände wachsen: + ${a}, + ${2 * a}, + ${3 * a}, + ${4 * a}, …`, `${s + 10 * a} + ${5 * a} = ${s + 15 * a}`]); }
    }
  },

  /* ---------- Klasse 5–10 (16.11.2026, Leitstand/Marcel: „sehr viel Inhalt“) ---------- */
  term(l) {
    const tm = (c, v = 'x') => c === 1 ? v : c === -1 ? `−${v}` : `${fi(c)}${v}`;
    const join = cs => cs.map((c, i) => i === 0 ? tm(c) : `${c < 0 ? '−' : '+'} ${tm(Math.abs(c))}`).join(' ');
    if (l === 0) {
      const a = rnd(2, 9), b = rnd(1, 15), x = rnd(2, 10), minus = coin() && a * x > b;
      return { e: [S_(`${a}x ${minus ? '−' : '+'} ${b}`), T(`(x = ${x})`)], hint: 'Setze die Zahl für x ein', a: I(minus ? a * x - b : a * x + b), w: [`x durch ${x} ersetzen: ${a} · ${x} ${minus ? '−' : '+'} ${b}`, `${a * x} ${minus ? '−' : '+'} ${b} = ${minus ? a * x - b : a * x + b}`] };
    }
    if (l === 1) {
      const cs = [rnd(2, 12), rnd(2, 12) * (coin() ? 1 : -1), rnd(1, 9) * (coin() ? 1 : -1)]; const s = cs.reduce((p, c) => p + c, 0);
      if (!s) cs[0]++;
      const sum = cs.reduce((p, c) => p + c, 0);
      return { e: [S_(`${join(cs)} =`)], a: I(sum), unit: 'x', noEq: true, hint: 'Fasse zusammen', w: ['Gleichartige Glieder: nur die Zahlen vor x rechnen', `${cs.map((c, i) => i ? (c < 0 ? `− ${-c}` : `+ ${c}`) : fi(c)).join(' ')} = ${fi(sum)}`, `Also ${tm(sum)}`] };
    }
    if (l === 2) {
      const a = rnd(2, 9) * (coin() ? 1 : -1), b = rnd(1, 12) * (coin() ? 1 : -1);
      return { e: [S_(`${fi(a)} · (x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${tm(a)} +`)], a: I(a * b), noEq: true, hint: 'Klammer ausmultiplizieren', w: [`Jedes Glied in der Klammer mal ${fi(a)}:`, `${fi(a)} · x = ${tm(a)}`, `${fi(a)} · ${par(b)} = ${fi(a * b)}`] };
    }
    if (l === 3) {
      let x, b, c; do { x = rnd(-9, 9); b = rnd(-12, 12); c = rnd(-25, 25); } while (Math.abs(x) < 2 || Math.abs(b) < 2 || Math.abs(c) < 2); const a = rnd(2, 6), v = a * x * x + b * x + c;
      return { e: [S_(`${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${tm(Math.abs(b)).replace(/^1x$/, 'x')} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`), T(`(x = ${fi(x)})`)], hint: 'Setze die Zahl für x ein', a: I(v), w: [`x² = ${par(x)}² = ${x * x}`, `${a} · ${x * x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} · ${par(x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`, `= ${fi(a * x * x)} ${b * x < 0 ? '−' : '+'} ${Math.abs(b * x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${fi(v)}`] };
    }
    const k = rnd(3, 15), m = rnd(2, 9), mx = `${m}x`;
    switch (rnd(0, 2)) {
      case 0: return { e: [S_(`(${mx} + ${k})² = ${m * m}x² +`), Gap(), S_(`x + ${k * k}`)], a: I(2 * m * k), noEq: true, hint: '1. binomische Formel', w: ['(a + b)² = a² + 2ab + b²', `a = ${mx}, b = ${k}`, `2 · ${mx} · ${k} = ${2 * m * k}x`] };
      case 1: return { e: [S_(`(${mx} − ${k})² = ${m * m}x² −`), Gap(), S_(`x + ${k * k}`)], a: I(2 * m * k), noEq: true, hint: '2. binomische Formel', w: ['(a − b)² = a² − 2ab + b²', `a = ${mx}, b = ${k}`, `2 · ${mx} · ${k} = ${2 * m * k}x`] };
      default: return { e: [S_(`(${mx} + ${k}) · (${mx} − ${k}) = ${m * m}x² −`)], a: I(k * k), noEq: true, hint: '3. binomische Formel', w: ['(a + b)(a − b) = a² − b²', `a² = (${mx})² = ${m * m}x²`, `b² = ${k}² = ${k * k}`] };
    }
  },

  linear(l) {
    const fx = (m, b) => `f(x) = ${m === 1 ? '' : m === -1 ? '−' : fi(m)}x${b ? (b < 0 ? ` − ${-b}` : ` + ${b}`) : ''}`;
    if (l === 0) { const m = rnd(2, 5), b = rnd(0, 6), x = rnd(1, 6); return { e: [S_(fx(m, b)), T(`f(${x}) =`)], a: I(m * x + b), noEq: true, w: [`x = ${x} einsetzen: ${m} · ${x}${b ? ' + ' + b : ''}`, `= ${m * x + b}`] }; }
    if (l === 1) {
      let m, b, x; do { m = rnd(-8, 8); b = rnd(-15, 15); x = rnd(-9, 9); } while (Math.abs(m) < 2 || Math.abs(b) < 2 || Math.abs(x) < 2);
      return coin() ? { e: [S_(fx(m, b)), T(`f(${fi(x)}) =`)], a: I(m * x + b), noEq: true, w: [`x = ${fi(x)} einsetzen: ${fi(m)} · ${par(x)}${b ? (b < 0 ? ' − ' + -b : ' + ' + b) : ''}`, `= ${fi(m * x + b)}`] }
        : { e: [S_(fx(m, b))], a: I(b), noEq: true, pre: 'y =', hint: 'Wo schneidet der Graph die y-Achse?', w: ['Auf der y-Achse ist x = 0.', `f(0) = ${fi(b)}`] };
    }
    if (l === 2) {
      let m; do m = rnd(-7, 7); while (Math.abs(m) < 2); const x1 = rnd(-9, 6), dx = rnd(2, 6), y1 = rnd(-12, 12), x2 = x1 + dx, y2 = y1 + m * dx;
      return { e: [S_(`P(${fi(x1)}|${fi(y1)}),  Q(${fi(x2)}|${fi(y2)})`)], a: I(m), noEq: true, pre: 'm =', hint: 'Wie groß ist die Steigung der Geraden durch P und Q?', w: ['m = (y₂ − y₁) : (x₂ − x₁)', `(${fi(y2)} − ${par(y1)}) : (${fi(x2)} − ${par(x1)}) = ${fi(y2 - y1)} : ${dx} = ${fi(m)}`] };
    }
    if (l === 3) {
      const [m0, den] = pick([[2, 2], [4, 2], [4, 4], [8, 4], [8, 8], [5, 5], [10, 5], [6, 2]]), m = m0 * (coin() ? 1 : -1); let j; do j = rnd(-12 * den, 12 * den); while (Math.abs(j) < 3 || j % den === 0); const x0 = Q(j, den), b = -m * j / den;
      return { e: [S_(fx(m, b))], a: De(j, den), noEq: true, pre: 'x =', hint: 'Wo ist die Nullstelle?', w: ['Nullstelle: f(x) = 0', `${fx(m, b).slice(7)} = 0`, `${fi(m)}x = ${fi(-b)}`, `x = ${fi(-b)} : ${par(m)} = ${decOfQ(x0)}`] };
    }
    const m1 = rnd(2, 12), m2 = -rnd(2, 12); let x0, b1; do { x0 = rnd(-9, 9); b1 = rnd(-15, 15); } while (Math.abs(x0) < 2 || Math.abs(b1) < 2); const b2 = (m1 - m2) * x0 + b1;
    return { e: [S_(`${fx(m1, b1)};  g(x) = ${m2 === -1 ? '−' : fi(m2)}x${b2 ? (b2 < 0 ? ` − ${-b2}` : ` + ${b2}`) : ''}`)], a: I(x0), noEq: true, pre: 'x =', hint: 'Wo schneiden sich die Geraden?', w: ['Gleichsetzen: f(x) = g(x)', `${m1 === 1 ? '' : m1}x${b1 ? (b1 < 0 ? ' − ' + -b1 : ' + ' + b1) : ''} = ${fi(m2)}x${b2 ? (b2 < 0 ? ' − ' + -b2 : ' + ' + b2) : ''}`, `x-Terme nach links, Zahlen nach rechts: ${m1}x − ${par(m2)}x = ${fi(b2)} − ${par(b1)}`, `${m1 - m2}x = ${fi(b2 - b1)}`, `x = ${fi(b2 - b1)} : ${m1 - m2} = ${fi(x0)}`] };
  },

  wahr(l) {
    const F_ = (n, d) => Fr(n, d), S2 = (story, a, w, hint) => ({ e: [Story(story)], a, w, noEq: true, story: true, hint });
    if (l === 0) {
      switch (rnd(0, 2)) {
        case 0: { const z = rnd(1, 6); return S2(`Du würfelst einmal mit einem normalen Würfel. Wie groß ist die Wahrscheinlichkeit für eine ${z}?`, F_(1, 6), ['Ein Würfel hat 6 gleich wahrscheinliche Zahlen.', `Günstig: 1 von 6 → 1/6`], 'als Bruch'); }
        case 1: return S2('Du würfelst einmal. Wie groß ist die Wahrscheinlichkeit für eine gerade Zahl?', F_(1, 2), ['Gerade Zahlen: 2, 4, 6 → 3 von 6', '3/6 = 1/2'], 'als gekürzter Bruch');
        default: return S2('Du wirfst eine Münze. Wie groß ist die Wahrscheinlichkeit für Kopf?', F_(1, 2), ['Zwei Seiten: Kopf oder Zahl', 'Günstig: 1 von 2 → 1/2'], 'als Bruch');
      }
    }
    if (l === 1) {
      const r = rnd(1, 9), b = rnd(1, 9), g = rand() < .2 ? rnd(1, 5) : 0, t = r + b + g;
      return S2(`In einer Tüte sind ${r} rote${g ? `, ${b} blaue und ${g} grüne` : ` und ${b} blaue`} Kugeln. Du ziehst blind eine Kugel. Wie groß ist die Wahrscheinlichkeit für Rot?`, F_(r, t), [`Alle Kugeln: ${r} + ${b}${g ? ' + ' + g : ''} = ${t}`, `Günstig: ${r} rote → ${fr(r, t)}`, ...redW(r, t)], 'als gekürzter Bruch');
    }
    if (l === 2) {
      switch (rnd(0, 2)) {
        case 0: { const d = rnd(5, 24); let n; do n = rnd(2, d - 1); while (gcd(n, d) !== 1); return S2(`Die Wahrscheinlichkeit für Regen ist ${n}/${d}. Wie groß ist die Wahrscheinlichkeit, dass es nicht regnet?`, F_(d - n, d), ['Gegenereignis: 1 − p', `1 = ${fr(d, d)}`, `${fr(d, d)} − ${fr(n, d)} = ${fr(d - n, d)}`, ...redW(d - n, d)], 'als gekürzter Bruch'); }
        case 1: { const k = pick([8, 16, 40]); let f; do f = rnd(3, k - 1); while (f * 100 % k === 0); return { ...S2(`Ein Glücksrad hat ${k} gleich große Felder, ${f} davon sind Gewinne. Wie groß ist die Gewinnchance in Prozent?`, De(f * 100, k), [`${f} von ${k} = ${fr(f, k)}`, `${fr(f, k)} = ${f} : ${k} = ${decOfQ(Q(f, k))}`, `${decOfQ(Q(f, k))} = ${decOfQ(Q(f * 100, k))} %`]), unit: '%' }; }
        default: { const n = 6 * rnd(15, 200), [ev, g] = pick([['eine Sechs', 1], ['eine Zahl größer als 4', 2], ['eine gerade Zahl', 3], ['eine Zahl kleiner als 5', 4]]); return S2(`Du würfelst ${n}-mal. Wie oft erwartest du im Durchschnitt ${ev}?`, I(n * g / 6), [`Günstig: ${g} von 6 Zahlen → ${fr(g, 6)}`, `${n} : 6 = ${n / 6}`, `${n / 6} · ${g} = ${n * g / 6}`]); }
      }
    }
    if (l === 3) {
      switch (rnd(0, 2)) {
        case 0: { const k = rnd(8, 20), g = rnd(3, k - 1); return S2(`Ein Glücksrad hat ${k} gleich große Felder, ${g} davon sind rot. Du drehst zweimal. Wie groß ist die Wahrscheinlichkeit für zweimal Rot?`, F_(g * g, k * k), [`Einmal Rot: ${fr(g, k)}`, `Pfadregel: ${fr(g, k)} · ${fr(g, k)} = ${fr(g * g, k * k)}`, ...redW(g * g, k * k)], 'als gekürzter Bruch'); }
        case 1: { const r = rnd(2, 9), b = rnd(2, 9), g = rnd(2, 9), t = r + b + g; return S2(`In einer Urne sind ${r} rote, ${b} blaue und ${g} grüne Kugeln. Du ziehst zweimal mit Zurücklegen. Wie groß ist die Wahrscheinlichkeit für erst Rot, dann Blau?`, F_(r * b, t * t), [`Alle Kugeln: ${r} + ${b} + ${g} = ${t}`, `Pfadregel: ${fr(r, t)} · ${fr(b, t)} = ${fr(r * b, t * t)}`, ...redW(r * b, t * t)], 'als gekürzter Bruch'); }
        default: { const r = rnd(3, 12), b = rnd(3, 12), t = r + b; return S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst zweimal mit Zurücklegen. Wie groß ist die Wahrscheinlichkeit für zweimal Rot?`, F_(r * r, t * t), [`Einmal Rot: ${fr(r, t)}`, `Zweimal (Pfadregel): ${fr(r, t)} · ${fr(r, t)} = ${fr(r * r, t * t)}`, ...redW(r * r, t * t)], 'als gekürzter Bruch'); }
      }
    }
    const r = rnd(4, 15), b = rnd(4, 15), t = r + b;
    return coin() ? S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst zwei Kugeln ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für zweimal Rot?`, F_(r * (r - 1), t * (t - 1)), [`Erste Kugel rot: ${fr(r, t)}`, `Dann sind noch ${r - 1} rote von ${t - 1} übrig: ${fr(r - 1, t - 1)}`, `${fr(r, t)} · ${fr(r - 1, t - 1)} = ${fr(r * (r - 1), t * (t - 1))}`, ...redW(r * (r - 1), t * (t - 1))], 'als gekürzter Bruch')
      : S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst zweimal mit Zurücklegen. Wie groß ist die Wahrscheinlichkeit für mindestens einmal Blau?`, F_(t * t - r * r, t * t), ['Gegenereignis: zweimal Rot', `P(zweimal Rot) = ${fr(r * r, t * t)}`, `1 − ${fr(r * r, t * t)} = ${fr(t * t - r * r, t * t)}`, ...redW(t * t - r * r, t * t)], 'als gekürzter Bruch');
  },

  zins(l) {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true });
    if (l === 0) { const k = 100 * rnd(2, 50), p = pick([1, 2, 3, 4, 5]); return S2(`Wie viele Euro Zinsen bringen ${fi(k)} € in einem Jahr bei ${p} % Zinsen?`, I(k * p / 100), '€', ['Zinsen = Kapital · p : 100', `${fi(k)} · ${p} : 100 = ${fi(k * p / 100)}`]); }
    if (l === 1) { const k = 100 * rnd(10, 90), p = rnd(1, 6); return S2(`${fi(k)} € bringen in einem Jahr ${fi(k * p / 100)} € Zinsen. Wie hoch ist der Zinssatz in Prozent?`, I(p), '%', ['p = Zinsen · 100 : Kapital', `${fi(k * p / 100)} · 100 : ${fi(k)} = ${p}`]); }
    if (l === 2) { const k = 100 * rnd(20, 180), p = pick([2, 4, 5]); return S2(`Bei ${p} % Zinsen gibt es in einem Jahr ${fi(k * p / 100)} € Zinsen. Wie groß ist das Kapital?`, I(k), '€', ['Kapital = Zinsen · 100 : p', `${fi(k * p / 100)} · 100 : ${p} = ${fi(k)}`]); }
    if (l === 3) { const k = 1200 * rnd(1, 10), p = pick([1, 2, 3, 5]), m = pick([1, 2, 3, 4, 6, 8, 9]); return S2(`${fi(k)} € liegen ${m} ${m === 1 ? 'Monat' : 'Monate'} zu ${p} % Jahreszins auf dem Konto. Wie viele Euro Zinsen gibt es?`, I(k * p / 100 * m / 12), '€', [`Jahreszinsen: ${fi(k)} · ${p} : 100 = ${fi(k * p / 100)} €`, `Für ${m} Monate: ${fi(k * p / 100)} · ${m} : 12 = ${fi(k * p / 100 * m / 12)} €`]); }
    const k = 1000 * rnd(1, 10), p = pick([5, 10]), k1 = k * (100 + p) / 100, k2 = k1 * (100 + p) / 100;
    return S2(`${fi(k)} € werden 2 Jahre lang mit ${p} % verzinst, die Zinsen bleiben auf dem Konto (Zinseszins). Wie viel Geld ist es nach 2 Jahren?`, Mo(Math.round(k2 * 100)), '€', [`Nach 1 Jahr: ${fi(k)} · ${fmtDec(100 + p, 2)} = ${fi(k1)} €`, `Nach 2 Jahren: ${fi(k1)} · ${fmtDec(100 + p, 2)} = ${decOfQ(Q(Math.round(k2 * 100), 100))} €`]);
  },

  stat(l) {
    const list = a => a.join(', ');
    if (l === 0) { const n = rnd(3, 5), m = rnd(4, 20); const a = Array.from({ length: n - 1 }, () => m + rnd(-4, 4)); a.push(n * m - a.reduce((p, c) => p + c, 0)); if (a.some(v => v < 0)) return GEN.stat(0); return { e: [T('Mittelwert von'), S_(list(a))], a: I(m), w: ['Mittelwert = Summe : Anzahl', `${a.join(' + ')} = ${n * m}`, `${n * m} : ${n} = ${m}`] }; }
    if (l === 1) { const a = Array.from({ length: pick([5, 7]) }, () => rnd(1, 30)), s = [...a].sort((x, y) => x - y); return { e: [T('Median von'), S_(list(a))], a: I(s[(s.length - 1) / 2]), w: [`Der Größe nach ordnen: ${list(s)}`, `Der mittlere Wert ist ${s[(s.length - 1) / 2]}.`] }; }
    if (l === 2) { const a = Array.from({ length: rnd(5, 7) }, () => rnd(2, 60)), mx = Math.max(...a), mn = Math.min(...a); return { e: [T('Spannweite von'), S_(list(a))], a: I(mx - mn), w: ['Spannweite = größter − kleinster Wert', `${mx} − ${mn} = ${mx - mn}`] }; }
    if (l === 3) { let s; do s = Array.from({ length: 6 }, () => rnd(11, 99)).sort((x, y) => x - y); while ((s[s.length / 2 - 1] + s[s.length / 2]) % 2); const a = shuffle([...s]), med = (s[s.length / 2 - 1] + s[s.length / 2]) / 2; return { e: [T('Median von'), S_(list(a))], a: I(med), w: [`Ordnen: ${list(s)}`, 'Gerade Anzahl: Mittelwert der beiden mittleren Werte', `(${s[s.length / 2 - 1]} + ${s[s.length / 2]}) : 2 = ${med}`] }; }
    if (l === 4) { const n = rnd(6, 8), m = rnd(21, 80), have = Array.from({ length: n - 1 }, () => m + rnd(-15, 15)), x = n * m - have.reduce((p, c) => p + c, 0); if (x < 1 || x > 99) return GEN.stat(4);
      return { e: [Story(`Der Durchschnitt von ${n} Zahlen ist ${m}. ${n - 1} davon sind ${list(have)}. Wie heißt die fehlende Zahl?`)], a: I(x), noEq: true, story: true, w: [`Summe aller ${n} Zahlen: ${n} · ${m} = ${n * m}`, `Bekannte Summe: ${have.join(' + ')} = ${have.reduce((p, c) => p + c, 0)}`, `${n * m} − ${have.reduce((p, c) => p + c, 0)} = ${x}`] }; }
    const n = 4, m = rnd(6, 15), a = [m + rnd(-3, 3), m + rnd(-3, 3), m + rnd(-3, 3)], x = (n + 1) * m - a.reduce((p, c) => p + c, 0) - (m + 2);
    const have = [...a, m + 2];
    if (x < 1 || x > 30) return GEN.stat(4);
    return { e: [Story(`Die Noten-Punkte von vier Tests sind ${list(have)}. Wie viele Punkte braucht man im fünften Test für einen Durchschnitt von ${m}?`)], a: I(x), noEq: true, story: true, w: [`Summe für Durchschnitt ${m} bei 5 Tests: 5 · ${m} = ${5 * m}`, `Bisher: ${have.join(' + ')} = ${have.reduce((p, c) => p + c, 0)}`, `${5 * m} − ${have.reduce((p, c) => p + c, 0)} = ${x}`] };
  },

  kreis(l) {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true, hint: 'Rechne mit π ≈ 3,14' });
    if (l === 0) { const d = rnd(2, 12); return S2(`Ein Kreis hat den Durchmesser ${d} cm. Wie groß ist sein Umfang?`, De(314 * d, 100), 'cm', ['Umfang = π · d', `3,14 · ${d} = ${decOfQ(Q(314 * d, 100))}`]); }
    if (l === 1) { const r = rnd(3, 25); return S2(`Ein Kreis hat den Radius ${r} cm. Wie groß ist sein Umfang?`, De(628 * r, 100), 'cm', ['Umfang = 2 · π · r', `2 · 3,14 · ${r} = ${decOfQ(Q(628 * r, 100))}`]); }
    if (l === 2) { const r = rnd(4, 15); return S2(`Ein Kreis hat den Radius ${r} cm. Wie groß ist seine Fläche?`, De(314 * r * r, 100), 'cm²', ['Fläche = π · r²', `3,14 · ${r}² = 3,14 · ${r * r} = ${decOfQ(Q(314 * r * r, 100))}`]); }
    if (l === 3) { const d = 2 * rnd(8, 25); return S2(`Ein Kreis hat den Durchmesser ${d} m. Wie groß ist seine Fläche?`, De(314 * (d / 2) ** 2, 100), 'm²', [`Radius = Durchmesser : 2 = ${d / 2}`, `Fläche = 3,14 · ${d / 2}² = ${decOfQ(Q(314 * (d / 2) ** 2, 100))}`]); }
    const r = rnd(3, 12), h = rnd(5, 25); return S2(`Ein Zylinder hat den Radius ${r} cm und die Höhe ${h} cm. Wie groß ist sein Volumen?`, De(314 * r * r * h, 100), 'cm³', ['Volumen = π · r² · h', `3,14 · ${r * r} · ${h} = ${decOfQ(Q(314 * r * r * h, 100))}`]);
  },

  zehner(l) {
    const P10 = k => P(10, k);
    if (l === 0) { const k = rnd(2, 6); return { e: [P10(k)], a: I(10 ** k), w: [`10 hoch ${k}: eine 1 mit ${k} Nullen`, `= ${fi(10 ** k)}`] }; }
    if (l === 1) { const a = rnd(2, 9), k = rnd(2, 6); return { e: [N(a), O('·'), P10(k)], a: I(a * 10 ** k), w: [`${a} mit ${k} Nullen`, `= ${fi(a * 10 ** k)}`] }; }
    if (l === 2) { const i = noTrail(11, 99), k = rnd(3, 7); return { e: [D(i, 1), O('·'), P10(k)], a: I(i * 10 ** (k - 1)), w: [`Komma um ${k} Stellen nach rechts`, `${fmtDec(i, 1)} · 10${String(k).split('').map(c => SUPS[c]).join('')} = ${fi(i * 10 ** (k - 1))}`] }; }
    if (l === 3) { const i = noTrail(101, 999), k = rnd(4, 9), v = i * 10 ** (k - 2); return { e: [S_(`${fi(v)} = ${fmtDec(i, 2)} · 10ˣ`)], a: I(k), noEq: true, pre: 'x =', w: [`Das Komma wandert von ${fi(v)} bis ${fmtDec(i, 2)} um ${k} Stellen nach links`, `Also 10${String(k).split('').map(c => SUPS[c]).join('')}`] }; }
    const i = noTrail(101, 999), k = rnd(3, 8), v = fmtDec(i, k + 2);
    return { e: [S_(`${v} = ${fmtDec(i, 2)} · 10ˣ`)], a: I(-k), noEq: true, pre: 'x =', w: [`Das Komma wandert von ${v} bis ${fmtDec(i, 2)} um ${k} Stellen nach rechts`, `Kleine Zahl → negativer Exponent: x = −${k}`] };
  },

  dreisatz(l) {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true });
    if (l === 0) { const u = rnd(2, 9), a = rnd(2, 5); let b; do b = rnd(2, 9); while (b === a); return S2(`${a} Hefte kosten ${a * u} €. Wie viel kosten ${b} Hefte?`, I(b * u), '€', [`1 Heft: ${a * u} : ${a} = ${u} €`, `${b} Hefte: ${b} · ${u} = ${b * u} €`]); }
    if (l === 1) { const u = rnd(8, 15), a = rnd(2, 6); let b; do b = rnd(2, 9); while (b === a); return S2(`Ein Auto fährt mit ${a} Litern Benzin ${a * u} km. Wie weit kommt es mit ${b} Litern?`, I(b * u), 'km', [`Mit 1 Liter: ${a * u} : ${a} = ${u} km`, `Mit ${b} Litern: ${b} · ${u} = ${b * u} km`]); }
    if (l === 2) { const p = rnd(3, 9); let q; do q = rnd(2, 12); while (q === p); const W = lcm(p, q) * rnd(2, 8), t = W / p; return S2(`${p} Pumpen leeren ein Becken in ${t} Stunden. Wie lange brauchen ${q} Pumpen?`, I(p * t / q), 'h', ['Mehr Pumpen – weniger Zeit (antiproportional)', `1 Pumpe: ${p} · ${t} = ${p * t} h`, `${q} Pumpen: ${p * t} : ${q} = ${p * t / q} h`]); }
    if (l === 3) { const u = 5 * rnd(3, 40), a = rnd(2, 8); let b; do b = rnd(2, 12); while (b === a); return S2(`${a} kg Äpfel kosten ${fmtMoney(a * u)} €. Wie viel kosten ${b} kg?`, Mo(b * u), '€', [`1 kg: ${fmtMoney(a * u)} € : ${a} = ${fmtMoney(u)} €`, `${b} kg: ${b} · ${fmtMoney(u)} € = ${fmtMoney(b * u)} €`]); }
    let k, d, t, z, rest, nn; do { k = rnd(15, 48); d = rnd(30, 120); t = rnd(5, d - 8); z = rnd(3, k - 4) * (coin() ? 1 : -1); nn = k - z; rest = k * (d - t); } while (rest % nn);
      return S2(`Ein Futtervorrat reicht für ${k} Pferde ${d} Tage. Nach ${t} Tagen werden ${Math.abs(z)} Pferde ${z > 0 ? 'verkauft' : 'dazugekauft'}. Wie viele Tage reicht der Rest?`, I(rest / nn), 'Tage', [`Vorrat insgesamt: ${k} · ${d} = ${fi(k * d)} Pferdetage`, `Nach ${t} Tagen verbraucht: ${k} · ${t} = ${fi(k * t)} Pferdetage`, `Rest: ${fi(k * d)} − ${fi(k * t)} = ${fi(rest)} Pferdetage`, `Jetzt ${nn} Pferde: ${fi(rest)} : ${nn} = ${rest / nn} Tage`]);
  },
};
/* ---------- Profi-Stufe (Stufe 6) – Marcel 16.11.2026: „am Ende extrem kompliziert, also nachweislich“ ----------
   Je Thema die schwersten Aufgaben: große Zahlen, mehrere Schritte, Klammern, Brüche und Kommazahlen gemischt.
   tests/schwierigkeit.js weist nach, dass jede Stufe – auch Profi – strikt schwerer ist als die vorige. */
const supN = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(c => SUPS[c]).join('');
const dn = v => String(v).replace('.', ',');
const primeF = n => { const out = []; for (let p = 2; n > 1; p++) while (n % p === 0) { out.push(p); n /= p; } return out; };
const WORD_PRO = [
  (n, n2, W_) => { const g = rnd(8, 25), c = pick([3, 5, 9]), m = 10 * rnd(6, 30), d = rnd(1, 4), gb = rnd(2, 9), month = g * 100 + c * m + d * 100 * gb;
    return W_(`Ein Handytarif kostet ${g} € im Monat, jede Minute ${c} Cent und jedes Gigabyte Daten ${d} €. ${n} telefoniert jeden Monat ${m} Minuten und braucht ${gb} Gigabyte. Wie viel kostet das in einem Jahr?`, Mo(12 * month), '€', [`Minuten: ${m} · ${c} ct = ${c * m} ct = ${fmtMoney(c * m)} €`, `Daten: ${gb} · ${d} € = ${gb * d} €`, `Ein Monat: ${g} + ${fmtMoney(c * m)} + ${gb * d} = ${fmtMoney(month)} €`, `Ein Jahr: 12 · ${fmtMoney(month)} € = ${fmtMoney(12 * month)} €`]); },
  (n, n2, W_) => { const a = rnd(20, 60), b = rnd(10, 40), c = rnd(5, 15), t = rnd(12, 90), v = (a + b - c) * t;
    return W_(`Ein leeres Becken fasst ${fi(v)} Liter. Rohr A füllt ${a} Liter pro Minute, Rohr B ${b} Liter pro Minute. Gleichzeitig laufen ${c} Liter pro Minute ab. Nach wie vielen Minuten ist das Becken voll?`, I(t), 'min', [`Zufluss: ${a} + ${b} = ${a + b} Liter pro Minute`, `Abfluss abziehen: ${a + b} − ${c} = ${a + b - c} Liter pro Minute`, `${fi(v)} : ${a + b - c} = ${t} Minuten`]); },
  (n, n2, W_) => { const k = rnd(5, 15), y = rnd(2, 20), m = 2 * k + y;
    return W_(`Die Mutter von ${n} ist heute ${m} Jahre alt, ${n} ist ${k}. In wie vielen Jahren ist die Mutter genau doppelt so alt wie ${n}?`, I(y), 'Jahre', [`In y Jahren: ${m} + y = 2 · (${k} + y)`, `${m} + y = ${2 * k} + 2y`, `y = ${m} − ${2 * k} = ${y}`]); },
  (n, n2, W_) => { const k = rnd(20, 30), u = rnd(8, 25), e = rnd(4, 12), bus = k * u;
    return W_(`${k} Kinder und 2 Lehrkräfte machen einen Ausflug. Der Bus kostet ${bus} € für alle, der Eintritt ${e} € pro Kind, Lehrkräfte zahlen keinen Eintritt. Alle Kosten werden auf die Kinder verteilt. Wie viel zahlt jedes Kind?`, I(u + e), '€', [`Eintritt: ${k} · ${e} = ${k * e} €`, `Gesamt: ${bus} + ${k * e} = ${bus + k * e} €`, `Pro Kind: ${bus + k * e} : ${k} = ${u + e} €`]); },
  (n, n2, W_) => { let a, p, b; do { a = rnd(2, 10); p = pick([20, 30, 40, 50, 60, 80, 100]); b = rnd(1, 10); } while ((a * p) % (a + b) || a * p / (a + b) % 1);
    const juice = Q(a * p, 100), pc = a * p / (a + b);
    return W_(`${a} Liter Saft mit ${p} % Fruchtanteil werden mit ${b} Litern Wasser gemischt. Wie viel Prozent Fruchtanteil hat die Mischung?`, I(pc), '%', [`Fruchtsaft: ${p} % von ${a} l = ${decOfQ(juice)} l`, `Mischung: ${a} + ${b} = ${a + b} l`, `${decOfQ(juice)} : ${a + b} = ${decOfQ(Q(pc, 100))} = ${pc} %`]); },
  (n, n2, W_) => { const k = 100 * rnd(10, 60), p = pick([2, 3, 4, 5]), ab = 50 * rnd(2, 10), k1 = k * (100 + p), c2 = (k1 - ab * 100) * (100 + p) / 100;
    return W_(`${n} legt ${fi(k)} € zu ${p} % Zinsen an. Nach einem Jahr hebt ${n} ${ab} € ab, der Rest wird ein weiteres Jahr mit ${p} % verzinst. Wie viel Geld ist es am Ende?`, Mo(c2), '€', [`Nach 1 Jahr: ${fi(k)} · ${dn((100 + p) / 100)} = ${fmtMoney(k1)} €`, `Abheben: ${fmtMoney(k1)} − ${ab} = ${fmtMoney(k1 - ab * 100)} €`, `Nach 2 Jahren: ${fmtMoney(k1 - ab * 100)} · ${dn((100 + p) / 100)} = ${fmtMoney(c2)} €`]); },
];
const PRO = {
  gap() {
    const mk = (e, ans, w) => ({ e, a: I(ans), noEq: true, hint: 'Welche Zahl fehlt?', w });
    if (coin()) {
      const [x, y] = ADD[5](), s = x + y;
      return coin() ? mk([N(x), O('+'), Gap(), Eq(), N(s)], y, [`Rechne rückwärts: ${fi(s)} − ${fi(x)}`, ...subW(s, x)])
        : mk([Gap(), O('−'), N(x), Eq(), N(y)], s, [`Rechne rückwärts: ${fi(y)} + ${fi(x)}`, ...addW(y, x)]);
    }
    const a = rnd(3, 19), x = rnd(12, 99), b = rnd(11, 99), c = a * x + b;
    return mk([Gap(), O('·'), N(a), O('+'), N(b), Eq(), N(c)], x, [`Erst rückwärts minus: ${c} − ${b} = ${c - b}`, `Dann rückwärts geteilt: ${c - b} : ${a}`, ...divW(c - b, a)]);
  },
  frac() {
    const H = 'als gekürzter Bruch';
    let d1, d2; do { d1 = rnd(3, 15); d2 = rnd(3, 15); } while (d1 === d2 || lcm(d1, d2) > 90);
    const d3 = rnd(3, 15), n1 = properFrac(d1), n2 = properFrac(d2), n3 = properFrac(d3), L = lcm(d1, d2), a = n1 * L / d1, b = n2 * L / d2;
    if (coin()) { const s = a + b; return { e: [K('('), F(n1, d1), O('+'), F(n2, d2), K(')'), O('·'), F(n3, d3)], a: Fr(s * n3, L * d3), hint: H, w: [`Klammer zuerst, gemeinsamer Nenner ${L}:`, `${fr(a, L)} + ${fr(b, L)} = ${fr(s, L)}`, `${fr(s, L)} · ${fr(n3, d3)} = ${fr(s * n3, L * d3)}`, ...redW(s * n3, L * d3)] }; }
    if (a === b) return PRO.frac();
    const [p1, q1, p2, q2, A, B] = a > b ? [n1, d1, n2, d2, a, b] : [n2, d2, n1, d1, b, a], df = A - B;
    return { e: [F(n3, d3), O(':'), K('('), F(p1, q1), O('−'), F(p2, q2), K(')')], a: Fr(n3 * L, d3 * df), hint: H, w: [`Klammer zuerst, gemeinsamer Nenner ${L}:`, `${fr(A, L)} − ${fr(B, L)} = ${fr(df, L)}`, `Mit dem Kehrwert malnehmen: ${fr(n3, d3)} · ${fr(L, df)} = ${fr(n3 * L, d3 * df)}`, ...redW(n3 * L, d3 * df)] };
  },
  dec() {
    switch (rnd(0, 2)) {
      case 0: { const a = noTrail(11, 99), b = noTrail(11, 99), p = a * b; let c; do c = rnd(101, p - 1); while (c % 10 === 0); return { e: [D(a, 1), O('·'), D(b, 1), O('−'), D(c, 2)], a: De(p - c, 100), w: [`Punkt vor Strich – ohne Komma: ${a} · ${b} = ${p}`, `Zwei Nachkommastellen: ${fmtDec(p, 2)}`, `${fmtDec(p, 2)} − ${fmtDec(c, 2)} = ${fmtDec(p - c, 2)}`] }; }
      case 1: { const q = noTrail(101, 999), b = noTrail(11, 99); return { e: [D(q * b, 3), O(':'), D(b, 2)], a: De(q, 10), w: ['Beide Zahlen mal 100 – das Ergebnis bleibt gleich:', `${fmtDec(q * b, 3)} : ${fmtDec(b, 2)} = ${fmtDec(q * b, 1)} : ${b}`, `${q * b} : ${b} = ${q}, also ${fmtDec(q, 1)}`] }; }
      default: { const a = noTrail(101, 999), b = noTrail(101, 999), k = rnd(2, 9); return { e: [K('('), D(a, 2), O('+'), D(b, 2), K(')'), O('·'), D(k, 1)], a: De((a + b) * k, 1000), w: [`Klammer zuerst: ${fmtDec(a, 2)} + ${fmtDec(b, 2)} = ${fmtDec(a + b, 2)}`, `Ohne Komma: ${a + b} · ${k} = ${(a + b) * k}`, `Drei Nachkommastellen: ${fmtDec((a + b) * k, 3)}`] }; }
    }
  },
  pct() {
    if (coin()) {
      const base = 100 * rnd(2, 40), p = pick([10, 20, 25, 50, 15, 30]), q = pick([10, 20, 25, 15, 5]), x = base * (100 + p) / 100, c = x * (100 - q);
      return { e: [Story(`Ein Preis von ${fi(base)} € steigt erst um ${p} % und sinkt dann um ${q} %. Wie hoch ist er am Ende?`)], a: Mo(c), unit: '€', noEq: true, story: true, w: [`+ ${p} %: ${fi(base)} · ${dn((100 + p) / 100)} = ${fi(x)} €`, `− ${q} %: ${fi(x)} · ${dn((100 - q) / 100)} = ${fmtMoney(c)} €`, `Nicht einfach ${p} % − ${q} %: Die zweite Änderung bezieht sich auf den neuen Preis.`] };
    }
    const up = coin(), p = pick([8, 12, 15, 25, 35, 40]), st = 100 / gcd(p, 100), base = st * rnd(2, Math.floor(3000 / st)), pp = up ? 100 + p : 100 - p, x = base * pp / 100;
    return { e: [Story(up ? `Nach einer Erhöhung um ${p} % kostet etwas ${fi(x)} €. Was hat es vorher gekostet?` : `Nach ${p} % Rabatt kostet etwas ${fi(x)} €. Was hat es vorher gekostet?`)], a: I(base), unit: '€', noEq: true, story: true, w: [`${fi(x)} € sind ${pp} % des alten Preises`, `1 % ≙ ${fi(x)} : ${pp} = ${decOfQ(Q(x, pp))} €`, `100 % ≙ ${decOfQ(Q(x, pp))} · 100 = ${fi(base)} €`] };
  },
  neg() {
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(3, 15) * sign(); let b, c; do { b = rnd(-30, 30); c = rnd(-30, 30); } while (b === c || !b || !c); return { e: [N(a), O('·'), K('('), N(b), O('−'), N(c, true), K(')')], a: I(a * (b - c)), w: [`Klammer zuerst: ${fi(b)} − ${par(c)} = ${fi(b - c)}`, `Vorzeichen: ${a < 0 ? 'minus' : 'plus'} mal ${b - c < 0 ? 'minus' : 'plus'} ergibt ${a * (b - c) < 0 ? 'minus' : 'plus'}.`, `${fi(a)} · ${par(b - c)} = ${fi(a * (b - c))}`] }; }
      case 1: { const b = rnd(2, 12) * sign(), q = rnd(2, 15) * sign(), c = rnd(2, 12) * sign(), d = rnd(2, 12) * sign(), a = b * q; return { e: [N(a), O(':'), N(b, true), O('−'), N(c, true), O('·'), N(d, true)], a: I(q - c * d), w: [`Punkt vor Strich: ${fi(a)} : ${par(b)} = ${fi(q)}`, `${par(c)} · ${par(d)} = ${fi(c * d)}`, `${fi(q)} − ${par(c * d)} = ${fi(q - c * d)}`] }; }
      default: { const v = [rnd(-99, 99), rnd(-99, 99), rnd(-99, 99), rnd(-99, 99)], r = v[0] - v[1] + v[2] - v[3]; return { e: [N(v[0]), O('−'), N(v[1], true), O('+'), N(v[2], true), O('−'), N(v[3], true)], a: I(r), w: ['Von links nach rechts:', `${fi(v[0])} − ${par(v[1])} = ${fi(v[0] - v[1])}`, `${fi(v[0] - v[1])} + ${par(v[2])} = ${fi(v[0] - v[1] + v[2])}`, `${fi(v[0] - v[1] + v[2])} − ${par(v[3])} = ${fi(r)}`] }; }
    }
  },
  pow() {
    switch (rnd(0, 2)) {
      case 0: { const b = rnd(2, 4), a = rnd(b + 1, b + 6), r = 2 ** a * 5 ** b; return { e: [P(2, a), O('·'), P(5, b)], a: I(r), w: [`2 · 5 = 10, also: 2${supN(a)} · 5${supN(b)} = 2${supN(a - b)} · 10${supN(b)}`, `2${supN(a - b)} = ${2 ** (a - b)}`, `${2 ** (a - b)} · ${fi(10 ** b)} = ${fi(r)}`] }; }
      case 1: { const k = rnd(1, 4), [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]).map(v => v * k); return { e: [S_(`√(${x}² + ${y}²)`)], a: I(z), w: [`${x}² = ${x * x} und ${y}² = ${y * y}`, `${x * x} + ${y * y} = ${z * z}`, `√${z * z} = ${z}`] }; }
      default: { const a = rnd(4, 12), b = rnd(11, 30), c = rnd(11, 25), r = a ** 3 - b * b + c; return { e: [P(a, 3), O('−'), P(b, 2), O('+'), W(c * c)], a: I(r), w: [`${a}³ = ${fi(a ** 3)}`, `${b}² = ${b * b}`, `√${c * c} = ${c}`, `${fi(a ** 3)} − ${b * b} + ${c} = ${fi(r)}`] }; }
    }
  },
  order() {
    switch (rnd(0, 2)) {
      case 0: { const a = rnd(6, 30), b = rnd(6, 30), c = rnd(3, 12), e = rnd(3, 12), q = rnd(2, Math.floor((a + b) * c / e) - 1), d = (a + b) * c - e * q; return { e: [K('('), K('('), N(a), O('+'), N(b), K(')'), O('·'), N(c), O('−'), N(d), K(')'), O(':'), N(e)], a: I(q), w: [`Innere Klammer: ${a} + ${b} = ${a + b}`, `${a + b} · ${c} = ${(a + b) * c}`, `${(a + b) * c} − ${d} = ${e * q}`, `${e * q} : ${e} = ${q}`] }; }
      case 1: { let a, b, c, d; do { a = rnd(6, 15); b = rnd(6, 15); c = rnd(3, 12); d = rnd(3, 12); } while (a * b <= c * d); const f = rnd(3, 12), k = rnd(3, 15), e = f * k; return { e: [N(a), O('·'), N(b), O('−'), N(c), O('·'), N(d), O('+'), N(e), O(':'), N(f)], a: I(a * b - c * d + k), w: [`Punkt vor Strich: ${a} · ${b} = ${a * b}, ${c} · ${d} = ${c * d}, ${e} : ${f} = ${k}`, `${a * b} − ${c * d} = ${a * b - c * d}`, `${a * b - c * d} + ${k} = ${a * b - c * d + k}`] }; }
      default: { const e = rnd(3, 9), x = rnd(3, 15), y = e * rnd(3, 12), c = rnd(2, y - 2), d = y - c, b = rnd(5, 40), a = b + x; return { e: [K('('), N(a), O('−'), N(b), K(')'), O('·'), K('('), N(c), O('+'), N(d), K(')'), O(':'), N(e)], a: I(x * y / e), w: [`Klammern zuerst: ${a} − ${b} = ${x} und ${c} + ${d} = ${y}`, `Von links nach rechts: ${x} · ${y} = ${x * y}`, `${x * y} : ${e} = ${x * y / e}`] }; }
    }
  },
  round() {
    const r = (x, m) => Math.round(x / m) * m;
    if (coin()) {
      let a, b; do { a = rnd(10001, 99999); b = rnd(101, 999); } while (r(b, 100) % 1000 === 0);
      const ra = r(a, 1000), rb = r(b, 100);
      return { e: [T('Überschlag:'), N(a), O('·'), N(b)], a: I(ra * rb), eqSign: '≈', hint: 'Runde die erste Zahl auf Tausender, die zweite auf Hunderter', w: [`${fi(a)} ≈ ${fi(ra)} und ${b} ≈ ${rb}`, `${ra / 1000} · ${rb / 100} = ${ra * rb / 100000}, dann fünf Nullen anhängen`, `${fi(ra)} · ${rb} = ${fi(ra * rb)}`] };
    }
    const i = noTrail(100001, 9999999), dg = Math.floor(i / 10) % 10, ri = Math.round(i / 100);
    return { e: [T('Runde'), D(i, 4), T('auf Hundertstel')], a: De(ri, 100), eqSign: '≈', w: [`Entscheidend ist die Tausendstelstelle: ${dg}`, dg >= 5 ? `${dg} ist 5 oder mehr → aufrunden` : `${dg} ist kleiner als 5 → abrunden`, `${fmtDec(i, 4)} ≈ ${fmtDec(ri, 2)}`] };
  },
  unit() {
    switch (rnd(0, 3)) {
      case 0: { const v = 5 * rnd(1, 12), k = 18 * v / 5; return coin() ? { e: [N(k), U('km/h')], a: I(v), unit: 'm/s', w: ['1 km/h = 1000 m in 3600 s', `${k} km/h = ${fi(k * 1000)} m : 3600 s`, `= ${k} : 3,6 = ${v} m/s`] } : { e: [N(v), U('m/s')], a: I(k), unit: 'km/h', w: ['1 m/s = 3600 m pro Stunde = 3,6 km/h', `${v} · 3,6 = ${k} km/h`] }; }
      case 1: { const k = rnd(1, 9), m = rnd(105, 995), d = noTrail(101, 999); return { e: [N(k), U('km'), N(m), U('m'), O('+'), D(d, 2), U('km')], a: I(k * 1000 + m + d * 10), unit: 'm', w: [`${k} km ${m} m = ${fi(k * 1000 + m)} m`, `${fmtDec(d, 2)} km = ${fi(d * 10)} m`, `${fi(k * 1000 + m)} + ${fi(d * 10)} = ${fi(k * 1000 + m + d * 10)} m`] }; }
      case 2: { const i = noTrail(1001, 9999), [from, to, f] = pick([['m³', 'l', 1000], ['ha', 'm²', 10000], ['km²', 'ha', 100], ['m²', 'cm²', 10000]]); return { e: [D(i, 3), U(from)], a: De(i * f, 1000), unit: to, w: [`1 ${from} = ${fi(f)} ${to}`, `Mal ${fi(f)}: Komma um ${Math.round(Math.log10(f))} Stellen nach rechts`, `${fmtDec(i, 3)} · ${fi(f)} = ${decOfQ(Q(i * f, 1000))}`] }; }
      default: { const t = noTrail(101, 999), g = rnd(105, 995); return { e: [D(t, 2), U('t'), O('+'), N(g), U('kg')], a: I(t * 10 + g), unit: 'kg', w: ['1 t = 1000 kg', `${fmtDec(t, 2)} t = ${fi(t * 10)} kg`, `${fi(t * 10)} + ${g} = ${fi(t * 10 + g)} kg`] }; }
    }
  },
  divis() {
    if (coin()) {
      const g = rnd(12, 99); let x, y; do { x = rnd(5, 40); y = rnd(5, 40); } while (x === y || gcd(x, y) !== 1);
      let a = g * x, b = g * y; if (a < b) [a, b] = [b, a];
      const w = ['Euklid: immer mit Rest teilen'], st = [a, b]; let p = a, q = b; while (q) { const rr = p % q; w.push(`${fi(p)} = ${Math.floor(p / q)} · ${fi(q)} + ${rr}`); [p, q] = [q, rr]; }
      w.push(`Der letzte Teiler ohne Rest ist der ggT: ${g}`);
      return { e: [S_(`ggT(${st[0]}, ${st[1]})`)], a: I(g), w };
    }
    let a, b, c, L; do { a = rnd(4, 30); b = rnd(4, 30); c = rnd(4, 30); L = lcm(lcm(a, b), c); } while (new Set([a, b, c]).size < 3 || L > 2000 || L < 100 || L === Math.max(a, b, c));
    return { e: [S_(`kgV(${a}, ${b}, ${c})`)], a: I(L), w: [`${a} = ${primeF(a).join(' · ')}`, `${b} = ${primeF(b).join(' · ')}`, `${c} = ${primeF(c).join(' · ')}`, 'Jeden Primfaktor so oft nehmen, wie er höchstens vorkommt:', `kgV = ${primeF(L).join(' · ')} = ${fi(L)}`] };
  },
  eq() {
    let a, d, x, b, e, c, L0, R0; do { a = rnd(2, 9); d = rnd(2, 9); x = rnd(-12, 12); b = rnd(-9, 9); e = rnd(-9, 9); c = a * (x + b) - d * (x - e); L0 = a * b - c; R0 = -d * e; } while (a === d || Math.abs(x) < 2 || !b || !e || !c || Math.abs(c) > 60 || !L0);
    const sg = v => v < 0 ? ['−', -v] : ['+', v], [sb, ab] = sg(b), [se, ae] = sg(-e), [sc, ac] = sg(-c);
    return { e: [N(a), K('('), V(1), O(sb), N(ab), K(')'), O(sc), N(ac), Eq(), N(d), K('('), V(1), O(se), N(ae), K(')')], a: I(x), noEq: true, pre: 'x =', w: [`Ausmultiplizieren: ${a}x${sgnTerm(a * b)}${sgnTerm(-c)} = ${d}x${sgnTerm(R0)}`, `Zusammenfassen: ${a}x${sgnTerm(L0)} = ${d}x${sgnTerm(R0)}`, `− ${d === 1 ? '' : d}x und ${L0 > 0 ? '− ' + L0 : '+ ' + -L0} auf beiden Seiten: ${a - d === 1 ? '' : a - d === -1 ? '−' : fi(a - d)}x = ${fi(R0 - L0)}`, `x = ${fi(R0 - L0)} : ${par(a - d)} = ${fi(x)}`] };
  },
  lgs() {   // Profi: Gleichungen erst ordnen, große Koeffizienten, beide malnehmen
    const { x, y, E1, E2 } = lgsPick(12, -15, 15, (a1, b1, a2, b2) => Math.abs(a1) >= 2 && Math.abs(b2) >= 2 && lcm(Math.abs(b1), Math.abs(b2)) > Math.max(Math.abs(b1), Math.abs(b2)));
    const [, a1, b1, c1] = E1, [, a2, b2, c2] = E2;
    const sys = [`I: ${lgsLin(a1, 0)} = ${fi(c1)}${lgsCo(-b1, 'y', false)}`, `II: ${lgsLin(0, b2)} = ${fi(c2)}${lgsCo(-a2, 'x', false)}`];
    return lgsAsk(x, y, ['Ordnen: alle x- und y-Glieder nach links, die Zahl nach rechts.', `I: ${lgsEq(a1, b1, c1)}`, `II: ${lgsEq(a2, b2, c2)}`, ...lgsAdd(E1, E2, x, y)], sys);
  },
  quad() {   // Profi: a·x² + b·x + c = 0 mit Faktor a vor x²
    const a = rnd(2, 5), [r1, r2] = quadPick(-10, 10), b = -a * (r1 + r2), c = a * r1 * r2, p = -(r1 + r2), q = r1 * r2;
    return quadAsk(`${quadPoly(a, b, c)} = 0`, [r1, r2], [`Durch ${a} teilen: ${quadPoly(1, p, q)} = 0`, `Gesucht: zwei Zahlen mit Summe ${fi(-p)} und Produkt ${fi(q)}`, `Das sind ${fi(r1)} und ${fi(r2)}`], 'Erst durch den Faktor vor x² teilen');
  },
  word() {
    const n = pick(NAMES); let n2; do n2 = pick(NAMES); while (n2 === n);
    return pick(WORD_PRO)(n, n2, (story, a, unit, w, hint) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true, hint }));
  },
  doppel() {
    switch (rnd(0, 3)) {
      case 0: { let i; do i = noTrail(101, 9999); while (i % 2 === 0); return { e: [T('die Hälfte von'), D(i, 2)], a: De(i, 200), w: [`${fmtDec(i, 2)} = ${fmtDec(i - 1, 2)} + 0,01`, `Hälfte von ${fmtDec(i - 1, 2)} = ${fmtDec((i - 1) / 2, 2)}, Hälfte von 0,01 = 0,005`, `${fmtDec((i - 1) / 2, 2)} + 0,005 = ${fmtDec(i * 5, 3)}`] }; }
      case 1: { const i = noTrail(101, 9999); return { e: [T('das Vierfache von'), D(i, 2)], a: De(4 * i, 100), w: ['Vierfach = zweimal verdoppeln', `${fmtDec(i, 2)} → ${fmtDec(2 * i, 2)} → ${fmtDec(4 * i, 2)}`] }; }
      case 2: { let x; do x = rnd(1001, 9999); while (x % 8 === 0); return { e: [T('ein Achtel von'), N(x)], a: De(x, 8), w: ['Ein Achtel = dreimal halbieren', `${fi(x)} → ${decOfQ(Q(x, 2))} → ${decOfQ(Q(x, 4))} → ${decOfQ(Q(x, 8))}`] }; }
      default: { const i = noTrail(101, 999); return { e: [T('dreimal verdoppeln:'), D(i, 1)], a: De(8 * i, 10), w: [`${fmtDec(i, 1)} → ${fmtDec(2 * i, 1)} → ${fmtDec(4 * i, 1)} → ${fmtDec(8 * i, 1)}`, 'Dreimal verdoppeln heißt mal 8.'] }; }
    }
  },
  geld() {
    const S3 = (story, a, w) => ({ e: [Story(story)], a, unit: '€', noEq: true, story: true, w });
    if (coin()) { const g = pick([150, 250, 400, 600, 750, 1250]), u = 20 * rnd(5, 60), p = u * g / 1000; return S3(`${fi(g)} g Käse kosten ${fmtMoney(p)} €. Wie viel kostet 1 kg Käse?`, Mo(u), [`${fmtMoney(p)} € = ${p} ct`, `1 kg = 1000 g: ${p} ct : ${fi(g)} · 1000`, `= ${u} ct = ${fmtMoney(u)} €`]); }
    const a = rnd(2, 5), pa = rnd(105, 499), b = rnd(2, 5), pb = rnd(45, 199), tot = a * pa + b * pb, z = tot < 2000 ? 20 : 50;
    return S3(`Du kaufst ${a} Hefte zu je ${fmtMoney(pa)} € und ${b} Stifte zu je ${fmtMoney(pb)} € und bezahlst mit ${z} €. Wie viel Rückgeld bekommst du?`, Mo(z * 100 - tot), [`Hefte: ${a} · ${pa} ct = ${a * pa} ct`, `Stifte: ${b} · ${pb} ct = ${b * pb} ct`, `Zusammen: ${a * pa} + ${b * pb} = ${tot} ct = ${fmtMoney(tot)} €`, `${z},00 € − ${fmtMoney(tot)} € = ${fmtMoney(z * 100 - tot)} €`]);
  },
  zeit() {
    const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a: I(a), unit, w, noEq: true, story: true });
    switch (rnd(0, 2)) {
      case 0: { const h1 = rnd(1, 3), m1 = rnd(11, 59), h2 = rnd(1, 3), m2 = rnd(11, 59), m3 = rnd(25, 59), tot = 60 * (h1 + h2) + m1 + m2 + m3; return S2(`Eine Radtour hat drei Etappen: ${h1} h ${m1} min, ${h2} h ${m2} min und ${m3} min. Wie viele Minuten dauert sie insgesamt?`, tot, 'min', [`Stunden: ${h1} + ${h2} = ${h1 + h2} h = ${60 * (h1 + h2)} min`, `Minuten: ${m1} + ${m2} + ${m3} = ${m1 + m2 + m3} min`, `${60 * (h1 + h2)} + ${m1 + m2 + m3} = ${tot} min`]); }
      case 1: { const s = 60 * rnd(19, 23) + rnd(1, 59), e = 60 * rnd(4, 11) + rnd(1, 59), d = 1440 - s + 1440 + e; return S2(`Ein Bus fährt am Montag um ${hm(s)} Uhr ab und kommt am Mittwoch um ${hm(e)} Uhr an. Wie viele Minuten ist er unterwegs?`, d, 'min', [`Montag bis Mitternacht: 24:00 − ${hm(s)} = ${1440 - s} min`, 'Dienstag ganz: 24 h = 1440 min', `Mittwoch bis ${hm(e)} Uhr: ${e} min`, `${1440 - s} + 1440 + ${e} = ${fi(d)} min`]); }
      default: { const d = rnd(2, 3), h = rnd(1, 23), m = rnd(11, 59), v = 86400 * d + 3600 * h + 60 * m; return S2(`Wie viele Sekunden sind ${d} Tage ${h} h ${m} min?`, v, 's', [`1 Tag = ${fi(86400)} s, 1 h = 3600 s, 1 min = 60 s`, `${d} · ${fi(86400)} = ${fi(86400 * d)}`, `${h} · 3600 = ${fi(3600 * h)} und ${m} · 60 = ${60 * m}`, `${fi(86400 * d)} + ${fi(3600 * h)} + ${60 * m} = ${fi(v)}`]); }
    }
  },
  geo() {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a: I(a), unit, w, noEq: true, story: true });
    switch (rnd(0, 3)) {
      case 0: { const a = rnd(5, 25), b = rnd(4, 20), c = rnd(3, 15), s = a * b + a * c + b * c; return S2(`Ein Quader ist ${a} cm lang, ${b} cm breit und ${c} cm hoch. Wie groß ist seine Oberfläche?`, 2 * s, 'cm²', ['Oberfläche = 2 · (a · b + a · c + b · c)', `${a} · ${b} = ${a * b}, ${a} · ${c} = ${a * c}, ${b} · ${c} = ${b * c}`, `${a * b} + ${a * c} + ${b * c} = ${s}`, `2 · ${s} = ${fi(2 * s)}`]); }
      case 1: { const a = rnd(8, 25), b = rnd(6, 20), c = rnd(2, a - 3), d = rnd(2, b - 3); return S2(`Ein Grundstück ist ein Rechteck von ${a} m mal ${b} m, aus dem in einer Ecke ein Rechteck von ${c} m mal ${d} m herausgeschnitten ist. Wie groß ist die Fläche?`, a * b - c * d, 'm²', [`Großes Rechteck: ${a} · ${b} = ${a * b}`, `Ausschnitt: ${c} · ${d} = ${c * d}`, `${a * b} − ${c * d} = ${a * b - c * d}`]); }
      case 2: { const k = rnd(1, 3), [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]).map(v => v * k); return S2(`Ein rechtwinkliges Dreieck hat die Hypotenuse ${z} cm und eine Kathete ${x} cm. Wie lang ist die andere Kathete?`, y, 'cm', ['Pythagoras umgestellt: b² = c² − a²', `${z}² − ${x}² = ${z * z} − ${x * x} = ${y * y}`, `b = √${y * y} = ${y}`]); }
      default: { const g = 2 * rnd(2, 12), h = rnd(3, 15), l = rnd(5, 30); return S2(`Ein Prisma hat als Grundfläche ein Dreieck mit Grundseite ${g} cm und Höhe ${h} cm. Das Prisma ist ${l} cm lang. Wie groß ist sein Volumen?`, g * h / 2 * l, 'cm³', [`Grundfläche: ${g} · ${h} : 2 = ${g * h / 2}`, 'Volumen = Grundfläche · Länge', `${g * h / 2} · ${l} = ${fi(g * h / 2 * l)}`]); }
    }
  },
  folge() {
    const mk = (q, ans, w) => ({ e: [S_(q.map(fi).join(', ') + ', ?')], a: I(ans), noEq: true, hint: 'Welche Zahl kommt als Nächstes?', w });
    switch (rnd(0, 3)) {
      case 0: { const s = rnd(4, 12), d = rnd(1, 7), q = [s]; while (q.length < 5) q.push(q[q.length - 1] * 3 - d); return mk(q, q[4] * 3 - d, [`Immer · 3, dann − ${d}`, `${fi(q[4])} · 3 = ${fi(q[4] * 3)}`, `${fi(q[4] * 3)} − ${d} = ${fi(q[4] * 3 - d)}`]); }
      case 1: { const a = rnd(2, 9), s = rnd(5, 40), q = [s]; let st = a; while (q.length < 6) { q.push(q[q.length - 1] + st); st *= 2; } return mk(q, q[5] + st, [`Die Abstände verdoppeln sich: + ${a}, + ${2 * a}, + ${4 * a}, …`, `Nächster Abstand: ${st}`, `${q[5]} + ${st} = ${q[5] + st}`]); }
      case 2: { const s = rnd(2, 6), q = [0, 1, 2, 3, 4].map(i => (s + i) ** 3); return mk(q, (s + 5) ** 3, ['Kubikzahlen (hoch 3)', `${s + 5}³ = ${s + 5} · ${s + 5} · ${s + 5}`, `= ${fi((s + 5) ** 3)}`]); }
      default: { const s = rnd(2, 6) * sign(), q = [s]; while (q.length < 5) q.push(q[q.length - 1] * -3); return mk(q, q[4] * -3, ['Immer mal (−3)', `${fi(q[4])} · (−3) = ${fi(q[4] * -3)}`]); }
    }
  },
  term() {
    if (coin()) {
      let a, b, c, d; do { a = rnd(2, 9); c = rnd(2, 9); b = rnd(-12, 12); d = rnd(-12, 12); } while (!b || !d || a * d + b * c <= 0);
      const tx = (k, v) => `${k}x ${v < 0 ? '−' : '+'} ${Math.abs(v)}`, bd = b * d;
      return { e: [S_(`(${tx(a, b)}) · (${tx(c, d)}) = ${a * c}x² +`), Gap(), S_(`x ${bd < 0 ? '−' : '+'} ${Math.abs(bd)}`)], a: I(a * d + b * c), noEq: true, hint: 'Jedes Glied mit jedem Glied malnehmen', w: [`${a}x · ${c}x = ${a * c}x²`, `${a}x · ${par(d)} = ${fi(a * d)}x und ${par(b)} · ${c}x = ${fi(b * c)}x`, `${fi(a * d)}x ${b * c < 0 ? '−' : '+'} ${Math.abs(b * c)}x = ${a * d + b * c === 1 ? '' : a * d + b * c}x`, `${par(b)} · ${par(d)} = ${fi(bd)}`] };
    }
    let x; do x = rnd(-4, 4); while (Math.abs(x) < 2);
    const a = rnd(2, 5), b = rnd(2, 9) * sign(), c = rnd(2, 12) * sign(), d = rnd(2, 30) * sign(), v = a * x ** 3 + b * x * x + c * x + d, sg = k => k < 0 ? '−' : '+';
    return { e: [S_(`${a}x³ ${sg(b)} ${Math.abs(b)}x² ${sg(c)} ${Math.abs(c)}x ${sg(d)} ${Math.abs(d)}`), T(`(x = ${fi(x)})`)], hint: 'Setze die Zahl für x ein', a: I(v), w: [`x² = ${x * x} und x³ = ${fi(x ** 3)}`, `${a} · ${par(x ** 3)} = ${fi(a * x ** 3)}, ${fi(b)} · ${x * x} = ${fi(b * x * x)}, ${fi(c)} · ${par(x)} = ${fi(c * x)}`, `${fi(a * x ** 3)}${sgnTerm(b * x * x)}${sgnTerm(c * x)}${sgnTerm(d)} = ${fi(v)}`] };
  },
  linear() {
    const fx = (m, b, f = 'f') => `${f}(x) = ${m === 1 ? '' : m === -1 ? '−' : fi(m)}x${b ? (b < 0 ? ` − ${-b}` : ` + ${b}`) : ''}`;
    if (coin()) {
      let m, b; do { m = pick([2, 4, 5, 8]) * sign(); b = rnd(-30, 30); } while (Math.abs(b) < 3 || b % m === 0);
      const x1 = rnd(-12, 12), dx = rnd(2, 7), y1 = m * x1 + b, x2 = x1 + dx, y2 = y1 + m * dx;
      return { e: [S_(`P(${fi(x1)}|${fi(y1)}),  Q(${fi(x2)}|${fi(y2)})`)], a: De(-b, m), noEq: true, pre: 'x =', hint: 'Wo hat die Gerade durch P und Q ihre Nullstelle?', w: ['m = (y₂ − y₁) : (x₂ − x₁)', `m = ${fi(y2 - y1)} : ${dx} = ${fi(m)}`, `b = y₁ − m · x₁ = ${fi(y1)} − ${par(m * x1)} = ${fi(b)}`, `Nullstelle: ${fi(m)}x${sgnTerm(b)} = 0`, `x = ${fi(-b)} : ${par(m)} = ${decOfQ(Q(-b, m))}`] };
    }
    const m1 = rnd(2, 12), m2 = -rnd(2, 12); let x0, b1; do { x0 = rnd(-12, 12); b1 = rnd(-25, 25); } while (Math.abs(x0) < 2 || Math.abs(b1) < 3);
    const b2 = (m1 - m2) * x0 + b1, y0 = m1 * x0 + b1;
    return { e: [S_(`${fx(m1, b1)};  ${fx(m2, b2, 'g')}`)], a: I(y0), noEq: true, pre: 'y =', hint: 'Wie groß ist die y-Koordinate des Schnittpunkts?', w: ['Gleichsetzen: f(x) = g(x)', `${m1}x − ${par(m2)}x = ${fi(b2)} − ${par(b1)}`, `${m1 - m2}x = ${fi(b2 - b1)} → x = ${fi(x0)}`, `y = f(${fi(x0)}) = ${m1} · ${par(x0)}${sgnTerm(b1)}`, `y = ${fi(m1 * x0)}${sgnTerm(b1)} = ${fi(y0)}`] };
  },
  wahr() {
    const S2 = (story, a, w, hint) => ({ e: [Story(story)], a, w, noEq: true, story: true, hint });
    switch (rnd(0, 2)) {
      case 0: { const r = rnd(5, 15), b = rnd(5, 15), t = r + b, num = 2 * r * b, den = t * (t - 1); return S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst zwei Kugeln ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für genau eine rote Kugel?`, Fr(num, den), [`Pfad Rot–Blau: ${fr(r, t)} · ${fr(b, t - 1)} = ${fr(r * b, den)}`, `Pfad Blau–Rot: ${fr(b, t)} · ${fr(r, t - 1)} = ${fr(r * b, den)}`, `Summe: ${fr(num, den)}`, ...redW(num, den)], 'als gekürzter Bruch'); }
      case 1: { const r = rnd(2, 9), b = rnd(3, 12), t = r + b, den = t ** 3, num = den - b ** 3; return S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst dreimal mit Zurücklegen. Wie groß ist die Wahrscheinlichkeit für mindestens eine rote Kugel?`, Fr(num, den), ['Gegenereignis: keine einzige rote Kugel', `P(dreimal Blau) = (${b}/${t})³ = ${fr(b ** 3, den)}`, `1 − ${fr(b ** 3, den)} = ${fr(num, den)}`, ...redW(num, den)], 'als gekürzter Bruch'); }
      default: { const r = rnd(5, 15), b = rnd(4, 12), t = r + b, num = r * (r - 1) * (r - 2), den = t * (t - 1) * (t - 2); return S2(`In einer Urne sind ${r} rote und ${b} blaue Kugeln. Du ziehst drei Kugeln ohne Zurücklegen. Wie groß ist die Wahrscheinlichkeit für dreimal Rot?`, Fr(num, den), [`Pfadregel: ${fr(r, t)} · ${fr(r - 1, t - 1)} · ${fr(r - 2, t - 2)}`, `= ${fr(num, den)}`, ...redW(num, den)], 'als gekürzter Bruch'); }
    }
  },
  zins() {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true });
    switch (rnd(0, 2)) {
      case 0: { const p = pick([5, 10, 20]), k = p === 5 ? 1600 * rnd(4, 30) : 1000 * rnd(5, 60), f = (100 + p) / 100; let c = k * 100; const st = [];
        for (let y = 1; y <= 3; y++) { const nc = c * (100 + p) / 100; st.push(`Nach ${y} ${y === 1 ? 'Jahr' : 'Jahren'}: ${fmtMoney(c)} · ${dn(f)} = ${fmtMoney(nc)} €`); c = nc; }
        return S2(`${fi(k)} € werden 3 Jahre lang mit ${p} % verzinst, die Zinsen bleiben auf dem Konto. Wie viel Geld ist es nach 3 Jahren?`, Mo(c), '€', st); }
      case 1: { const k = 1800 * rnd(5, 40), p = rnd(2, 6), t = pick([20, 30, 45, 60, 72, 90, 100, 120, 150, 180, 200, 240, 270]), ct = k * p * t / 360; return S2(`${fi(k)} € liegen ${t} Tage zu ${p} % Jahreszins auf dem Konto (1 Jahr = 360 Tage). Wie viele Euro Zinsen gibt es?`, Mo(ct), '€', [`Jahreszinsen: ${fi(k)} · ${p} : 100 = ${fi(k * p / 100)} €`, `Pro Tag: ${fi(k * p / 100)} : 360 = ${decOfQ(Q(k * p, 36000))} €`, `Für ${t} Tage: ${decOfQ(Q(k * p, 36000))} · ${t} = ${fmtMoney(ct)} €`]); }
      default: { const k = 1200 * rnd(5, 40), m = pick([3, 4, 6, 8, 9]), p = rnd(1, 6), z = k * p * m / 1200; return S2(`${fi(k)} € bringen in ${m} Monaten ${fi(z)} € Zinsen. Wie hoch ist der Jahreszinssatz?`, I(p), '%', [`Zinsen für 12 Monate: ${fi(z)} : ${m} · 12 = ${fi(k * p / 100)} €`, 'p = Jahreszinsen · 100 : Kapital', `${fi(k * p / 100)} · 100 : ${fi(k)} = ${p}`]); }
    }
  },
  stat() {
    if (coin()) {
      let a, b, c, ma, mb, mc, S; do { a = rnd(12, 30); b = rnd(12, 30); c = rnd(12, 30); ma = rnd(20, 99); mb = rnd(20, 99); mc = rnd(20, 99); S = a * ma + b * mb + c * mc; } while (S % (a + b + c) || ma === mb || mb === mc);
      const g = S / (a + b + c);
      return { e: [Story(`Klasse A hat ${a} Kinder mit durchschnittlich ${ma} Punkten, Klasse B ${b} Kinder mit durchschnittlich ${mb} Punkten und Klasse C ${c} Kinder mit durchschnittlich ${mc} Punkten. Wie groß ist der Durchschnitt aller Kinder?`)], a: I(g), noEq: true, story: true, w: [`Punkte A: ${a} · ${ma} = ${a * ma}`, `Punkte B: ${b} · ${mb} = ${b * mb}`, `Punkte C: ${c} · ${mc} = ${c * mc}`, `Zusammen: ${fi(S)} Punkte für ${a + b + c} Kinder`, `${fi(S)} : ${a + b + c} = ${g}`] };
    }
    const v = Array.from({ length: 10 }, () => rnd(11, 99)), sum = v.reduce((p, c) => p + c, 0);
    return { e: [T('Mittelwert von'), S_(v.join(', '))], a: De(sum, 10), w: ['Mittelwert = Summe : Anzahl', `${v.join(' + ')} = ${sum}`, `${sum} : 10 = ${decOfQ(Q(sum, 10))}`] };
  },
  kreis() {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true, hint: 'Rechne mit π ≈ 3,14' });
    switch (rnd(0, 2)) {
      case 0: { const R = rnd(10, 30), r = rnd(3, R - 3), d = R * R - r * r; return S2(`Ein Kreisring hat den Außenradius ${R} cm und den Innenradius ${r} cm. Wie groß ist seine Fläche?`, De(314 * d, 100), 'cm²', ['Fläche = π · (R² − r²)', `${R}² − ${r}² = ${R * R} − ${r * r} = ${d}`, `3,14 · ${d} = ${decOfQ(Q(314 * d, 100))}`]); }
      case 1: { const r = rnd(5, 15), h = rnd(10, 30), o = 2 * r * r + 2 * r * h; return S2(`Ein Zylinder hat den Radius ${r} cm und die Höhe ${h} cm. Wie groß ist seine Oberfläche?`, De(314 * o, 100), 'cm²', ['Oberfläche = 2 · π · r² + 2 · π · r · h', `2 · ${r * r} + 2 · ${r} · ${h} = ${2 * r * r} + ${2 * r * h} = ${o}`, `3,14 · ${o} = ${decOfQ(Q(314 * o, 100))}`]); }
      default: { const d = rnd(12, 60); return S2(`Ein Halbkreis hat den Durchmesser ${d} m. Wie lang ist sein Rand (Bogen und Durchmesser)?`, De(257 * d, 100), 'm', ['Bogen = π · d : 2', `3,14 · ${d} : 2 = ${decOfQ(Q(157 * d, 100))}`, `${decOfQ(Q(157 * d, 100))} + ${d} = ${decOfQ(Q(257 * d, 100))}`]); }
    }
  },
  zehner() {
    const MS = [12, 15, 16, 24, 25, 32, 35, 45, 48, 64, 75, 84, 96], A = pick(MS), B = pick(MS);
    let m, n; do { m = rnd(-8, 9); n = rnd(-8, 9); } while (Math.abs(m) < 3 || Math.abs(n) < 3 || m * n > 0 && rand() < .7);
    const show = (X, e) => e >= 1 ? fi(X * 10 ** (e - 1)) : fmtDec(X, 1 - e);          // X/10 · 10^e ausgeschrieben
    const prod = Q(A * B, 100), sh = A * B >= 1000 ? 1 : 0, mant = decOfQ(Q(A * B, 100 * 10 ** sh)), x = m + n + sh;
    return { e: [S_(`${show(A, m)} · ${show(B, n)} = ${mant} · 10ˣ`)], a: I(x), noEq: true, pre: 'x =', hint: 'Erst beide Zahlen als Zehnerpotenz schreiben', w: [`${show(A, m)} = ${decOfQ(Q(A, 10))} · 10${supN(m)}`, `${show(B, n)} = ${decOfQ(Q(B, 10))} · 10${supN(n)}`, `${decOfQ(Q(A, 10))} · ${decOfQ(Q(B, 10))} = ${decOfQ(prod)}${sh ? ` = ${mant} · 10` : ''}`, `x = ${fi(m)} + ${par(n)}${sh ? ' + 1' : ''} = ${fi(x)}`] };
  },
  dreisatz() {
    const S2 = (story, a, unit, w) => ({ e: [Story(story)], a, unit, w, noEq: true, story: true });
    if (coin()) {
      let m1, h1, m2, h2; do { m1 = rnd(2, 8); h1 = rnd(3, 10); m2 = rnd(2, 12); h2 = rnd(2, 12); } while (m1 * h1 === m2 * h2 || m1 === m2);
      const u = rnd(5, 40), n1 = m1 * h1 * u;
      return S2(`${m1} Maschinen stellen in ${h1} Stunden ${fi(n1)} Teile her. Wie viele Teile stellen ${m2} Maschinen in ${h2} Stunden her?`, I(m2 * h2 * u), 'Teile', [`1 Maschine in ${h1} Stunden: ${fi(n1)} : ${m1} = ${h1 * u}`, `1 Maschine in 1 Stunde: ${h1 * u} : ${h1} = ${u}`, `${m2} Maschinen in 1 Stunde: ${m2} · ${u} = ${m2 * u}`, `In ${h2} Stunden: ${m2 * u} · ${h2} = ${fi(m2 * h2 * u)}`]);
    }
    let a, t, b, f; do { a = rnd(3, 12); t = rnd(4, 20); b = rnd(2, 15); f = rnd(2, 5); } while (b === a || (a * t * f) % b);
    return S2(`${a} Arbeiter pflastern einen Platz in ${t} Tagen. Wie viele Tage brauchen ${b} Arbeiter für ${f} gleich große Plätze?`, I(a * t * f / b), 'Tage', [`Arbeit für 1 Platz: ${a} · ${t} = ${a * t} Arbeitstage`, `Für ${f} Plätze: ${a * t} · ${f} = ${a * t * f} Arbeitstage`, `${b} Arbeiter: ${a * t * f} : ${b} = ${a * t * f / b} Tage`]);
  },
};
// Profi-Stufe einhängen: GEN.thema(5) liefert die Profi-Aufgabe (Plus, Minus, Mal, Geteilt über ADD[5] und MUL[5])
for (const k of Object.keys(PRO)) { const g = GEN[k]; GEN[k] = l => l >= 5 ? PRO[k]() : g(l); }
const REAL_TOPICS = Object.keys(GEN);
const LEVELS = 6;                                            // Stufe 1–5 und Profi
const lvlName = l => l >= 5 ? 'Profi' : `Stufe ${l + 1}`;
function makeTask(topic, lvl) {
  const tp = topic === 'mix' ? pick(REAL_TOPICS) : topic;
  const t = GEN[tp](lvl);
  t.topic = tp; t.lvl = lvl;
  return t;
}
const keyOf = t => `${t.topic}|${taskText(t)}`;
