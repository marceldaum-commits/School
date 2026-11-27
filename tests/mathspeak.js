// Vorlese-Text (mathSpeak) – Doppelpunkt als Satzzeichen oder Rechenzeichen (Fund Tonstudio 25.11.2026). Aufruf: node tests/mathspeak.js
const fs = require('fs'), path = require('path');
const JS = f => fs.readFileSync(path.join(__dirname, '../kopfrechnen/js', f), 'utf8').replace(/^'use strict';/, '');
const fracLine = JS('engine.js').match(/const FRAC_NAMES = \{[^}]*\};/)[0];
const speech = JS('speech.js').split('const Voice = {')[0].replace('const SPEECH_FRAC = { de: FRAC_NAMES };', '');
const ctx = {}; new Function('ctx', `const I18N = { lang: 'de' }; ${fracLine} ${speech} Object.assign(ctx, { mathSpeak });`)(ctx);
const ms = ctx.mathSpeak, fails = [];
const ok = (text, lang, expect, no) => { const r = ms(text, lang); if (expect && !r.includes(expect)) fails.push(`${lang} „${text}“ → „${r}“ (erwartet: ${expect})`); if (no && r.includes(no)) fails.push(`${lang} „${text}“ → „${r}“ (darf nicht enthalten: ${no})`); };
// Satzzeichen
ok('Beispiel 8 + 5: 8 + 2 = 10, dann 10 + 3 = 13.', 'de', 'Beispiel 8 plus 5: 8 plus 2 gleich 10', 'geteilt');
ok('Eine ganze Zahl ist ein Bruch mit Nenner 1: 7 = 7/1.', 'de', 'Nenner 1: 7 gleich 7 durch 1', 'geteilt');
ok('Beispiel 5,38 · 2: 538 · 2 = 1076', 'de', '5,38 mal 2: 538 mal 2', 'geteilt');
ok('Example 8 + 5: 8 + 2 = 10', 'en', '8 plus 5: 8 plus 2', 'divided');
// Rechenzeichen
ok('12 : 4 = 3', 'de', '12 geteilt durch 4 gleich 3');
ok('12:4 = 3', 'de', '12 geteilt durch 4 gleich 3');
ok('(8 + 4) : 3', 'de', 'geteilt durch 3');
ok('12 : 4 = 3', 'en', '12 divided by 4 equals 3');
ok('12 : 4 = 3', 'uk', 'поділити');
// Wörter mit Doppelpunkt-Rechenzeichen
ok('Kilopreis: Preis : Gramm · 1000.', 'de', 'Kilopreis: Preis geteilt durch Gramm mal 1000');
ok('Bruch in Dezimalzahl: Zähler : Nenner', 'de', 'Zähler geteilt durch Nenner');
// unverändert
ok('Mal 10, 100, 1000: Komma 1, 2, 3 Stellen nach rechts.', 'de', 'Mal 10, 100, 1000: Komma');
if (fails.length) { console.log('FEHLER:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('mathSpeak ✓ (Doppelpunkt: Satzzeichen vs. geteilt durch, de/en/uk)');
