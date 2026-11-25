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
const sha = require('crypto');
const liste = alle.map((t, i) => ({
  id: `zs-${t.gruppe}-${t.sprache}-${sha.createHash('sha256').update(t.sprache + '|' + t.text).digest('hex').slice(0, 10)}`,
  text: t.text, sprache: t.sprache, tempo: [1.0, 0.8], gruppe: t.gruppe,
  ziel: `zahlensprint/${t.sprache}/${t.gruppe}/`,   // Dateiname: <id>-<tempo>.mp3
}));
const ids = new Set(liste.map(x => x.id)); if (ids.size !== liste.length) throw new Error('doppelte IDs');
const out = { format: 1, app: 'zahlensprint', stand: new Date().toISOString().slice(0, 10), hinweis: 'Entwurf, Format bitte mit VERTONUNG.md abgleichen', texte: liste };
fs.mkdirSync(path.join(__dirname, '../docs/tonstudio'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../docs/tonstudio/textliste.json'), JSON.stringify(out, null, 1) + '\n');
const z = {}; for (const t of liste) { const k = t.sprache + '/' + t.gruppe; z[k] = (z[k] || 0) + 1; }
console.log('Textliste:', liste.length, 'Texte', JSON.stringify(z), '→ ×2 Tempi =', liste.length * 2, 'Dateien');
