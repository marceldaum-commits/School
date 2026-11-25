// Erzeugt kopfrechnen/vorlesen/texte.json – alle FESTEN Vorlese-Texte (Theorie, Blitz-Sätze) in DE/EN/UK,
// genau so, wie die App sie spricht (mathSpeak). Daraus entsteht die Textliste für das Tonstudio (eigene KI-Stimmen).
// Dazu die häufigsten Aufgaben-Sätze (vorlesen-haeufig.json); alle anderen Aufgaben vertont das Tonstudio bei Bedarf (/stimme/v1). Läuft bei jedem Bauen (stand.js).
const fs = require('fs'), path = require('path');
const JS = f => fs.readFileSync(path.join(__dirname, '../kopfrechnen/js', f), 'utf8').replace(/^'use strict';/, '');
function build(opt = {}) {
  const ctx = {};
  const fracLine = JS('engine.js').match(/const FRAC_NAMES = \{[^}]*\};/)[0];
  const speech = JS('speech.js').split('const Voice = {')[0].replace('const SPEECH_FRAC = { de: FRAC_NAMES };', '');
  const theo = JS('theorie.js'), th = theo.slice(theo.indexOf('const THEORIE ='), theo.indexOf('// Thema für die Theorie'));
  const thI = JS('theorie-i18n.js').split('// Theorie in der aktuellen Sprache')[0];
  const bl = JS('blitz.js'), bzStreak = bl.match(/const BZ_STREAK = \{[^}]*\};/)[0];
  const resFn = bl.slice(bl.indexOf('function blitzResultLine'), bl.indexOf('/** Tageschallenge-Karte'));
  new Function('ctx', `const I18N = { lang: 'de' }; ${fracLine} ${speech} ${th} ${thI} ${bzStreak} ${resFn}
    Object.assign(ctx, { mathSpeak, THEORIE, THEORIE_I18N, BZ_STREAK, blitzResultLine });`)(ctx);
  // Blitz: feste Sätze (ohne Zahlen), Übersetzungen aus der Übersetzungstabelle
  const blitzDe = [...Object.values(ctx.BZ_STREAK), 'Siehst du – geschafft!', 'Hallo, ich bin Blitz!',
    ...[0, 1, 2, 3].map(s => ctx.blitzResultLine(s, 'training')), ctx.blitzResultLine(3, 'zen'), ctx.blitzResultLine(3, 'test')];
  const tsv = new Map(fs.readFileSync(path.join(__dirname, '../i18n/uebersetzungen.tsv'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('\t')).map(r => [r[0], { en: r[1], uk: r[2] }]));
  const out = [], seen = new Set();
  const add = (text, sprache) => { const t = ctx.mathSpeak(text, sprache).normalize('NFC').replace(/\s+/g, ' ').trim(); const k = sprache + '|' + t;
    if (!t || seen.has(k)) return; if (t.length > 1500) throw new Error('Vorlese-Text zu lang: ' + t.slice(0, 60)); seen.add(k); out.push({ text: t, sprache }); };
  for (const [lang, T] of [['de', ctx.THEORIE], ['en', ctx.THEORIE_I18N.en], ['uk', ctx.THEORIE_I18N.uk]])
    for (const tp of Object.keys(T)) { add(T[tp].k, lang); T[tp].l.flat().forEach(x => add(x, lang)); }
  // Häufige Aufgaben (Einmaleins usw.) als ganze Sätze vorab – fertig gesprochen, daher ohne mathSpeak
  const haeufig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vorlesen-haeufig.json'), 'utf8')).texte;
  const addRaw = (text, sprache) => { const t = text.normalize('NFC').replace(/\s+/g, ' ').trim(), k = sprache + '|' + t; if (t && !seen.has(k)) { seen.add(k); out.push({ text: t, sprache, laufzeit: true }); } };
  for (const de of blitzDe) { add(de, 'de'); const t = tsv.get(de); if (t) { if (t.en) add(t.en, 'en'); if (t.uk) add(t.uk, 'uk'); } }
  for (const [lang, list] of Object.entries(haeufig)) list.forEach(t => addRaw(t, lang));
  if (opt.liste) return out;   // nur die Liste (für die Textliste des Tonstudios), ohne die Datei zu schreiben
  // Vorlesen abgeschaltet (config.js vorlesen: false, Marcel 18.11.): leere Liste, damit das Stimmen-Werk für Rechenblitz nichts spricht
  const aus = /^\s*vorlesen:\s*false/m.test(fs.readFileSync(path.join(__dirname, '../kopfrechnen/config.js'), 'utf8'));
  const json = JSON.stringify({ format: 1, app: 'rechenblitz', texte: aus ? [] : out }, null, 1) + '\n';
  const file = path.join(__dirname, '../kopfrechnen/vorlesen/texte.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== json) fs.writeFileSync(file, json);
  return aus ? 0 : out.length;
}
module.exports = { build };
if (require.main === module) console.log('vorlesen/texte.json: ' + build() + ' Texte');
