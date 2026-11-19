// Rechenblitz – Nachweis, dass jede Stufe schwerer ist als die vorige (Marcel 16.11.: „am Ende extrem kompliziert, nachweislich“).
// Erzeugt je Thema × Stufe viele Aufgaben, misst Kennzahlen und bildet daraus eine Schwierigkeitszahl.
// Aufruf: node tests/schwierigkeit.js [--md]   → Tabelle; Exit-Code 1, wenn eine Stufe nicht strikt schwerer ist.
const fs = require('fs'), path = require('path');
global.window = {}; global.document = {};
eval(fs.readFileSync(path.join(__dirname, '../kopfrechnen/js/engine.js'), 'utf8') + ';global.E={GEN,TOPICS,LEVEL_DESC,makeTask,taskText,canon,fmtDec,withSeed};');
const { GEN, TOPICS, LEVEL_DESC, makeTask, taskText, canon, fmtDec, withSeed } = E;
const SEED = 20261116;   // fester Startwert: der Nachweis ist wiederholbar und schwankt nicht von Lauf zu Lauf
const N = 3000, LEVELS = LEVEL_DESC.add.length;
const numsOf = t => {   // alle Zahlen der Aufgabe (auch in Textaufgaben)
  const out = [];
  for (const k of t.e) {
    if (k.t === 'n') out.push(Math.abs(k.v));
    else if (k.t === 'd') out.push(fmtDec(Math.abs(k.i), k.k));
    else if (k.t === 'm') out.push(String(k.c));
    else if (k.t === 'f') out.push(Math.abs(k.n), k.d);
    else if (k.t === 'p') out.push(Math.abs(k.b) ** Math.min(k.e, 6));
    else if (k.t === 'r') out.push(+k.v);
    else if (k.t === 'v') out.push(Math.abs(k.c));
    else if (k.t === 'y') k.v.join(' ').match(/\d+/g).forEach(s => out.push(s));
    else if (/^[stx]$/.test(k.t)) (String(k.v).match(/\d+(?:[.,:]\d+)*/g) || []).forEach(s => out.push(s.replace(/\.(?=\d{3})/g, '')));   // 1.250.000 und 14:35 sind je eine Zahl
  }
  return out;
};
// Stellen einer Zahl: Ziffern vor dem Komma (ohne führende Nullen) plus alle Nachkommastellen – 0,00456 hat 5 Stellen
const digitsOf = v => { const [i, d = ''] = String(v).replace(/\.(?=\d{3})/g, '').split(/[,.]/); return (i.replace(/\D/g, '').replace(/^0+/, '').length + d.replace(/\D/g, '').length) || 1; };
function carries(t) {   // Überträge bei Plus/Minus mit zwei ganzen Zahlen
  const ns = t.e.filter(k => k.t === 'n').map(k => Math.abs(k.v)), o = t.e.find(k => k.t === 'o');
  if (ns.length !== 2 || !o || !'+−'.includes(o.v)) return 0;
  let [a, b] = ns, c = 0, n = 0;
  if (o.v === '−') { [a, b] = a >= b ? [a, b] : [b, a]; while (a || b) { const x = a % 10 - c, y = b % 10; c = x < y ? 1 : 0; n += c; a = Math.floor(a / 10); b = Math.floor(b / 10); } }
  else while (a || b) { const s = a % 10 + b % 10 + c; c = s >= 10 ? 1 : 0; n += c; a = Math.floor(a / 10); b = Math.floor(b / 10); }
  return n;
}
function measure(t) {
  const ns = numsOf(t), ansParts = canon(t.a).replace('-', '').split('/'), all = [...ns, ...ansParts];
  const txt = taskText(t);
  return {
    stellen: Math.max(...all.map(digitsOf), 1),                  // Stellen der größten Zahl
    ziffern: all.reduce((s, v) => s + digitsOf(v), 0),          // Ziffern insgesamt (Aufgabe + Ergebnis) = Rechenaufwand
    zahlen: ns.length,                                           // wie viele Zahlen verarbeitet werden
    schritte: (t.w || []).length,                                // Länge des Lösungswegs
    bruch: t.a.kind === 'frac' || t.e.some(k => k.t === 'f') || /\d\/\d/.test(txt) ? 1 : 0,
    komma: t.a.kind === 'dec' || t.e.some(k => k.t === 'd' || k.t === 'm') || /\d,\d/.test(txt) ? 1 : 0,
    negativ: t.a.q.n < 0 || /−\d|\(−/.test(txt) ? 1 : 0,
    klammer: t.e.some(k => k.t === 'k') || /\(/.test(txt.replace(/[fg]\([^)]*\)|P\(|Q\(|\(x = |ggT\(|kgV\(/g, '')) ? 1 : 0,
    uebertrag: carries(t),
  };
}
// Schwierigkeitszahl: Gewichte bewusst einfach und für alle Themen gleich
const score = m => m.stellen * 1.0 + m.ziffern * 0.25 + m.zahlen * 0.6 + m.schritte * 0.7 + m.bruch * 1.5 + m.komma * 1.2 + m.negativ * 1.0 + m.klammer * 1.0 + m.uebertrag * 0.5;
const rows = [], fails = [];
for (const tp of Object.keys(GEN)) {
  let prev = -Infinity;
  for (let l = 0; l < LEVELS; l++) {
    const acc = { stellen: 0, ziffern: 0, zahlen: 0, schritte: 0, bruch: 0, komma: 0, negativ: 0, klammer: 0, uebertrag: 0, score: 0 }; let maxDig = 0;
    const tasks = withSeed(SEED + l, () => Array.from({ length: N }, () => makeTask(tp, l)));
    for (let i = 0; i < N; i++) { const m = measure(tasks[i]); for (const k in m) acc[k] += m[k]; acc.score += score(m); maxDig = Math.max(maxDig, m.stellen); }
    for (const k in acc) acc[k] /= N;
    rows.push({ tp, l, ...acc, maxDig });
    if (!(acc.score > prev + 0.05)) fails.push(`${tp} Stufe ${l + 1}: ${acc.score.toFixed(2)} ist nicht schwerer als Stufe ${l}: ${prev.toFixed(2)}`);
    prev = acc.score;
  }
}
const f1 = v => v.toFixed(1), pc = v => Math.round(v * 100) + ' %';
if (process.argv.includes('--md')) {
  console.log('| Thema | Stufe | Schwierigkeit | Ø Stellen (max) | Ø Zahlen | Ø Schritte Lösungsweg | Übertrag Ø | Brüche | Komma | negativ | Klammern |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${TOPICS[r.tp].name} | ${r.l === 5 ? 'Profi' : r.l + 1} | **${r.score.toFixed(2)}** | ${f1(r.stellen)} (${r.maxDig}) | ${f1(r.zahlen)} | ${f1(r.schritte)} | ${f1(r.uebertrag)} | ${pc(r.bruch)} | ${pc(r.komma)} | ${pc(r.negativ)} | ${pc(r.klammer)} |`);
} else for (const r of rows) console.log(`${r.tp.padEnd(9)} ${r.l === 5 ? 'P' : r.l + 1}  ${r.score.toFixed(2).padStart(6)}  stellen ${f1(r.stellen)}(${r.maxDig}) zahlen ${f1(r.zahlen)} schritte ${f1(r.schritte)} üb ${f1(r.uebertrag)} br ${pc(r.bruch)} ko ${pc(r.komma)} neg ${pc(r.negativ)} kl ${pc(r.klammer)}`);
console.log(fails.length ? `\n${fails.length} Stufen NICHT schwerer:\n` + fails.join('\n') : `\nAlle ${rows.length} Stufen sind strikt schwerer als die vorige ✓`);
process.exitCode = fails.length ? 1 : 0;
