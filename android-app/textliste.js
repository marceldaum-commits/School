// Textliste für das Tonstudio (Auftrag AppZentrale 20.11./25.11.2026): alle festen Vorlese-Texte von Zahlensprint (Theorie, Blitz) in de/en/uk
// plus die 84 Sätze des Eltern-Tors (28 Aufgaben 13–19 × 6–9 × 3 Sprachen). Formeln und Zahlen stehen in Worten (mathSpeak).
// Schreibt docs/tonstudio/textliste.json (NICHT in kopfrechnen/, wird also nicht ausgeliefert). Aufruf: node android-app/textliste.js
const fs = require('fs'), path = require('path');
const { build } = require('./vorlesen.js');
const fest = build({ liste: true });
const W = {
  de: { a: ['dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'], b: ['sechs', 'sieben', 'acht', 'neun'], q: (a, b) => `Was ergibt ${a} mal ${b}?` },
  en: { a: ['thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], b: ['six', 'seven', 'eight', 'nine'], q: (a, b) => `What is ${a} times ${b}?` },
  uk: { a: ['тринадцять', 'чотирнадцять', 'п’ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев’ятнадцять'], b: ['шість', 'сім', 'вісім', 'дев’ять'], q: (a, b) => `Скільки буде ${a} помножити на ${b}?` },
};
const tor = [];
for (const [lang, w] of Object.entries(W)) for (let a = 13; a <= 19; a++) for (let b = 6; b <= 9; b++) tor.push({ text: w.q(w.a[a - 13], w.b[b - 6]), sprache: lang, gruppe: 'tor' });
const alle = [...fest.map(t => ({ text: t.text, sprache: t.sprache, gruppe: 'fest' })), ...tor];
const crypto = require('crypto');
// Format „Tonstudio“ Format 1 (quasselquest/VERTONUNG.md, Zusammenfassung der AppZentrale 25.11.2026):
// id = erste 20 Hex-Zeichen von SHA-1 über „<sprache>|<sprechtext>“ (normalisiert: NFC, Leerraum zusammengefasst, getrimmt – Annahme, bitte mit dem Tonstudio abgleichen),
// fassungen[] mit art (normal 1,0 / langsam 0,8), speed, datei. Rückgabe laut Format: audio/server/<sprache>/.
const norm = t => String(t).normalize('NFC').replace(/\s+/g, ' ').trim();
const FASSUNGEN = [['normal', 1.0], ['langsam', 0.8]];
const seen = new Map();
for (const t of alle) {
  const sprechtext = norm(t.text), id = crypto.createHash('sha1').update(`${t.sprache}|${sprechtext}`).digest('hex').slice(0, 20);
  if (seen.has(id)) continue;   // gleicher Text, gleiche Datei
  seen.set(id, { id, sprache: t.sprache, sprechtext, fassungen: FASSUNGEN.map(([art, speed]) => ({ art, speed, datei: `${id}_${art}.mp3` })) });
}
const liste = [...seen.values()];
const out = { format: 1, app: 'zahlensprint', stand: new Date().toISOString().slice(0, 10), hinweis: 'Ukrainisch (Piper uk_UA ukrainian_tts, Sprecherin tetiana) ist im Quasselquest-Format nicht vorgesehen; Zahlen stehen als Ziffern, das Tonstudio schreibt sie aus (Marcel 25.11.).', eintraege: liste };
fs.mkdirSync(path.join(__dirname, '../docs/tonstudio'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../docs/tonstudio/textliste.json'), JSON.stringify(out, null, 1) + '\n');
const z = {}; for (const t of liste) z[t.sprache] = (z[t.sprache] || 0) + 1;
console.log('Textliste:', liste.length, 'Texte', JSON.stringify(z), '→', liste.length * FASSUNGEN.length, 'Dateien');
