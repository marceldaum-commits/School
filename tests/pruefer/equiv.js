// Jede gleichwertige richtige Eingabe muss angenommen werden (Logik wie submit() in app.js); falsche nicht.
const fs = require('fs'); global.window = {}; global.document = {};
eval(fs.readFileSync(require('path').join(__dirname, '../../kopfrechnen/js/engine.js'), 'utf8') + ';global.E={GEN,makeTask,canon,parseInput,Q,gcd,withSeed,decOfQ};');
const { GEN, makeTask, canon, parseInput, withSeed, decOfQ } = E;
// wie submit(): Ergebnis 'ok' | 'zweite' (richtig, aber nicht gekürzt → zweite Chance) | 'format' (Dezimalzahl verlangt) | 'falsch' | 'unlesbar'
const judge = (t, s, hinted) => { const p = parseInput(s), a = t.a; if (!p) return 'unlesbar'; if (t.form === 'dec' && p.frac) return 'format';
  const eq = p.q.n === a.q.n && p.q.d === a.q.d; if (eq && p.frac && !p.reduced && !hinted) return 'zweite'; return eq ? 'ok' : 'falsch'; };
const bad = {}, cnt = { aufgaben: 0, eingaben: 0 };
const note = (k, ex) => { bad[k] = bad[k] || { n: 0, ex }; bad[k].n++; };
for (const tp of Object.keys(GEN)) for (let l = 0; l < 6; l++) withSeed(500 + l, () => { for (let i = 0; i < 1500; i++) { const t = makeTask(tp, l); cnt.aufgaben++;
  const { n, d } = t.a.q, neg = n < 0 ? '-' : '', an = Math.abs(n), c = canon(t.a);
  const alts = new Set([c]);
  if (d !== 1) alts.add(`${neg}${an}/${d}`);                         // gekürzter Bruch
  const dec = decOfQ({ n, d }).replace(/\./g, ''); if (!dec.includes('/')) { alts.add(dec.replace('−', '-')); if (dec.includes(',')) alts.add(dec.replace('−', '-') + '0'); else alts.add(dec.replace('−', '-') + ',0'); }
  if (c.includes(',') && c.endsWith('0')) alts.add(c.replace(/0+$/, '').replace(/,$/, ''));   // 8,60 → 8,6
  for (const s of alts) { cnt.eingaben++; const r = judge(t, s, false); if (r === 'ok') continue;
    if (r === 'format' && t.form === 'dec') continue;                 // Hinweis „Schreib es als Dezimalzahl“, zählt nicht als falsch
    if (r === 'zweite' && judge(t, s, true) === 'ok') continue;
    note(`${tp}${l} ${r}`, `${s} bei ${c}`); }
  const unred = `${neg}${an * 2}/${d * 2}`; cnt.eingaben++; if (!['ok', 'zweite', 'format'].includes(judge(t, unred, false)) || judge(t, unred, true) === 'falsch' && t.form !== 'dec') note(`${tp}${l} ungekürzt`, unred);
  // Gegenprobe: knapp daneben muss falsch sein
  const wrong = String(an + 1); if (judge(t, (n < 0 ? '-' : '') + wrong, true) === 'ok' && d === 1) note(`${tp}${l} falsch angenommen`, wrong);
} });
console.log(cnt, Object.keys(bad).length ? bad : 'alle gleichwertigen Eingaben angenommen ✓');
