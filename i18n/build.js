// Erzeugt kopfrechnen/js/lang-en.js und lang-uk.js aus i18n/uebersetzungen.tsv
// Aufruf im Repo-Stamm: node i18n/build.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
global.window = {}; global.localStorage = { getItem: () => null }; global.navigator = { languages: ['de'] }; global.document = {};
eval(fs.readFileSync(path.join(root, 'kopfrechnen/js/i18n.js'), 'utf8') + ';global.i18nKey = i18nKey;');
const rows = fs.readFileSync(path.join(__dirname, 'uebersetzungen.tsv'), 'utf8').split('\n').filter(l => l && !l.startsWith('#'));
const out = { en: {}, uk: {} }, problems = [];
const count = s => (s.match(/\{\}/g) || []).length;
for (const r of rows) {
  const [de, en, uk] = r.split('\t');
  if (!en || !uk) { problems.push('Spalte fehlt: ' + r); continue; }
  const { key } = i18nKey(de);
  for (const [lang, t] of [['en', en], ['uk', uk]]) {
    if (!/\{\d+\}/.test(t) && count(t) !== count(key)) problems.push(`${lang}: Platzhalter ${count(key)} ≠ ${count(t)}: ${de}`);
    if (out[lang][key] && out[lang][key] !== t) problems.push(`${lang}: doppelt: ${de}`);
    out[lang][key] = t;
  }
}
for (const lang of ['en', 'uk']) {
  const js = `'use strict';\n// Automatisch erzeugt aus i18n/uebersetzungen.tsv – nicht von Hand ändern (node i18n/build.js)\nI18N.add('${lang}', ${JSON.stringify(out[lang], null, 0).replace(/","/g, '",\n"')});\n`;
  fs.writeFileSync(path.join(root, `kopfrechnen/js/lang-${lang}.js`), js);
}
console.log(`Einträge: ${Object.keys(out.en).length}`); if (problems.length) { console.log('Probleme:\n' + problems.join('\n')); process.exitCode = 1; }
