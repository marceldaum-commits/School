// Export: viele Aufgaben je Thema × Stufe als JSON (Text, Token, Lösung, Lösungsweg) für den unabhängigen Prüfer
const fs = require('fs'); global.window = {}; global.document = {};
eval(fs.readFileSync(require('path').join(__dirname, '../../kopfrechnen/js/engine.js'), 'utf8') + ';global.E={GEN,makeTask,taskText,canon,withSeed};');
const { GEN, makeTask, taskText, canon, withSeed } = E;
const N = +process.argv[2] || 400, out = [];
for (const tp of Object.keys(GEN)) for (let l = 0; l < 6; l++) withSeed(1000 + l * 7 + tp.length, () => { for (let i = 0; i < N; i++) { const t = makeTask(tp, l);
  out.push({ tp, l, text: taskText(t), e: t.e, a: { n: t.a.q.n, d: t.a.q.d, kind: t.a.kind, money: !!t.a.money }, canon: canon(t.a), unit: t.unit || '', pre: t.pre || '', hint: t.hint || '', w: t.w || [], eqSign: t.eqSign || '=' }); } });
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log(out.length, 'Aufgaben exportiert');
