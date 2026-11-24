'use strict';
/* ================= Vorlesen: Aufgaben, Lösungswege, Theorie und Blitz =================
   Gesprochen wird nur mit den eigenen KI-Stimmen (stimme.js), nie mit der Gerätestimme. Mathe wird ausgesprochen: „3/4“ → „3 Viertel“, „x²“ → „x hoch 2“, Einheiten als Wörter. */
const SPEECH_FRAC = { de: FRAC_NAMES };
const SPEECH = {
  de: { op: { '·': 'mal', '×': 'mal', ':': 'geteilt durch', '÷': 'geteilt durch', '−': 'minus', '+': 'plus', '=': 'gleich', '≈': 'ungefähr', '≙': 'entspricht', '→': ', also', '<': 'kleiner als', '>': 'größer als' },
    pow: 'hoch', root: 'Wurzel aus', pct: 'Prozent', euro: 'Euro', cent: 'Cent', over: 'durch', half: 'ein Halb', and: 'und', deg: 'Grad',
    units: { 'km/h': 'Kilometer pro Stunde', 'm/s': 'Meter pro Sekunde', 'mm²': 'Quadratmillimeter', 'cm²': 'Quadratzentimeter', 'dm²': 'Quadratdezimeter', 'm²': 'Quadratmeter', 'km²': 'Quadratkilometer',
      'cm³': 'Kubikzentimeter', 'dm³': 'Kubikdezimeter', 'm³': 'Kubikmeter', mm: 'Millimeter', cm: 'Zentimeter', dm: 'Dezimeter', km: 'Kilometer', m: 'Meter', kg: 'Kilogramm', g: 'Gramm', t: 'Tonnen',
      ml: 'Milliliter', l: 'Liter', h: 'Stunden', min: 'Minuten', s: 'Sekunden', ct: 'Cent' } },
  en: { op: { '·': 'times', '×': 'times', ':': 'divided by', '÷': 'divided by', '−': 'minus', '+': 'plus', '=': 'equals', '≈': 'is about', '≙': 'corresponds to', '→': ', so', '<': 'less than', '>': 'greater than' },
    pow: 'to the power of', root: 'the square root of', pct: 'percent', euro: 'euros', cent: 'cents', over: 'over', half: 'one half', and: 'and', deg: 'degrees',
    units: { 'km/h': 'kilometres per hour', 'm/s': 'metres per second', 'mm²': 'square millimetres', 'cm²': 'square centimetres', 'dm²': 'square decimetres', 'm²': 'square metres', 'km²': 'square kilometres',
      'cm³': 'cubic centimetres', 'dm³': 'cubic decimetres', 'm³': 'cubic metres', mm: 'millimetres', cm: 'centimetres', dm: 'decimetres', km: 'kilometres', m: 'metres', kg: 'kilograms', g: 'grams', t: 'tonnes',
      ml: 'millilitres', l: 'litres', h: 'hours', min: 'minutes', s: 'seconds', ct: 'cents' } },
  uk: { op: { '·': 'помножити на', '×': 'помножити на', ':': 'поділити на', '÷': 'поділити на', '−': 'мінус', '+': 'плюс', '=': 'дорівнює', '≈': 'приблизно', '≙': 'відповідає', '→': ', отже', '<': 'менше ніж', '>': 'більше ніж' },
    pow: 'у степені', root: 'корінь з', pct: 'відсотків', euro: 'євро', cent: 'центів', over: 'поділити на', half: 'одна друга', and: 'і', deg: 'градусів',
    units: { 'km/h': 'кілометрів на годину', 'км/год': 'кілометрів на годину', 'м/с': 'метрів за секунду', 'm/s': 'метрів за секунду', 'cm²': 'квадратних сантиметрів', 'м²': 'квадратних метрів', 'm²': 'квадратних метрів', 'см²': 'квадратних сантиметрів',
      'cm³': 'кубічних сантиметрів', 'м³': 'кубічних метрів', 'm³': 'кубічних метрів', mm: 'міліметрів', cm: 'сантиметрів', km: 'кілометрів', m: 'метрів', kg: 'кілограмів', g: 'грамів', t: 'тонн',
      ml: 'мілілітрів', l: 'літрів', h: 'годин', min: 'хвилин', s: 'секунд', ct: 'центів', 'ц': 'центів', 'см': 'сантиметрів', 'км': 'кілометрів', 'м': 'метрів', 'кг': 'кілограмів', 'г': 'грамів', 'л': 'літрів', 'год': 'годин', 'хв': 'хвилин', 'с': 'секунд' } },
};
const SUP_DIGITS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '−', 'ˣ': 'x' };
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Text (so, wie er auf dem Bildschirm steht) in sprechbare Sprache umwandeln
// Ukrainische Brüche: Zähler (weiblich: одна, дві) + Ordnungszahl – nach 1 im Nominativ Singular („одна третя“),
// sonst im Genitiv Plural („дві третіх“, „5 восьмих“); bisher hieß es missverständlich „2 на 3“
const UK_ORD = { 2: 'друга', 3: 'третя', 4: 'четверта', 5: 'п’ята', 6: 'шоста', 7: 'сьома', 8: 'восьма', 9: 'дев’ята', 10: 'десята',
  11: 'одинадцята', 12: 'дванадцята', 13: 'тринадцята', 14: 'чотирнадцята', 15: 'п’ятнадцята', 16: 'шістнадцята', 17: 'сімнадцята',
  18: 'вісімнадцята', 19: 'дев’ятнадцята', 20: 'двадцята', 24: 'двадцять четверта', 25: 'двадцять п’ята', 30: 'тридцята',
  36: 'тридцять шоста', 40: 'сорокова', 50: 'п’ятдесята', 100: 'сота', 1000: 'тисячна' };
function ukFrac(n, o) {
  const one = n % 10 === 1 && n % 100 !== 11, two = n % 10 === 2 && n % 100 !== 12;
  const num = n === 1 ? 'одна' : n === 2 ? 'дві' : one ? `${n - 1} одна`.replace(/^0 /, '') : two ? `${n - 2} дві`.replace(/^0 /, '') : String(n);
  if (one) return `${num} ${o}`;
  return `${num} ${o.replace(/я$/, 'іх').replace(/а$/, 'их')}`;
}
function mathSpeak(text, lang = I18N.lang) {
  const L = SPEECH[lang] || SPEECH.de, sp = ` ${L.op['−'] || 'minus'} `;
  let s = ' ' + String(text).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ') + ' ';
  // Einheiten nach Zahlen (längste zuerst), danach Hochzahlen – sonst würde „cm²“ zu „cm hoch 2“
  const units = Object.keys(L.units).sort((a, b) => b.length - a.length);
  s = s.replace(new RegExp(`(\\d|\\)|²|³)\\s?(${units.map(reEsc).join('|')})(?=[\\s.,;:!?)]|$)`, 'g'), (m, d, u) => `${d} ${L.units[u]}`);
  s = s.replace(/(\d)\s?°/g, `$1 ${L.deg}`);
  // Geld: „4,50 €“ und „€4.50“
  s = s.replace(/(\d)\s?€\s?(\d+)\s?(ct|ц)\b/gu, `$1 ${L.euro} $2 ${L.cent}`)   // „3 € 40 ct“
    .replace(/(?<!\d\s?)€\s?(\d[\d.,]*)/g, `$1 ${L.euro}`).replace(/(\d)\s?€/g, `$1 ${L.euro}`).replace(/€/g, L.euro);
  s = s.replace(/(\d)\s?%/g, `$1 ${L.pct}`).replace(/%/g, ` ${L.pct}`);
  // Brüche „3/4“ (nicht in Datumsangaben)
  s = s.replace(/(^|[^\d/])(\d+)\/(\d+)(?![\d/])/g, (m, pre, n, d) => {
    if (lang === 'de') { if (+n === 1 && +d === 2) return pre + L.half; const nm = FRAC_NAMES[+d]; return pre + (nm ? `${n} ${nm}` : `${n} ${L.over} ${d}`); }
    if (lang === 'uk') { const o = UK_ORD[+d]; if (o) return pre + ukFrac(+n, o); }
    return pre + (+n === 1 && +d === 2 ? L.half : `${n} ${L.over} ${d}`);
  });
  // Hochzahlen: „x²“ → „x hoch 2“, „10⁻³“ → „10 hoch minus 3“
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ˣ]+/g, m => ` ${L.pow} ${[...m].map(c => SUP_DIGITS[c]).join('').replace('−', sp.trim() + ' ')} `);
  s = s.replace(/√\s?\(/g, `${L.root} (`).replace(/√/g, `${L.root} `);
  // Punkte P(2|8): „P 2 und 8“
  s = s.replace(/\((−?\d[\d,.]*)\|(−?\d[\d,.]*)\)/g, ` $1 ${L.and} $2 `);
  // Rechenzeichen zwischen Zahlen/Klammern/x
  s = s.replace(/([\dx)²³]) ?([·×÷:]) ?(?=[\d(x√−])/g, (m, a, op) => `${a} ${L.op[op]} `);
  s = s.replace(/([·×÷])/g, m => ` ${L.op[m]} `);
  s = s.replace(/ ?([=≈≙→<>]) ?/g, (m, op) => ` ${L.op[op]} `);
  s = s.replace(/(^|[\s(=])−\s?(?=[\dx(])/g, `$1${sp}`).replace(/ − /g, sp);
  s = s.replace(/ \+ /g, ` ${L.op['+']} `);
  s = s.replace(/[()|]/g, ' ').replace(/(?<=^|[\s(])\?/gu, lang === 'de' ? ' wie viel? ' : '?');   // nur die Lücke „?“, nicht das Fragezeichen am Satzende
  s = s.replace(/\s+/g, ' ').replace(/ ([.,;:!])/g, '$1');
  // Einzahl nach „1“: „1 Stunde“, „1 hour“
  if (lang === 'de') s = s.replace(/(^|[^\d,])1 (Stunde|Minute|Sekunde|Tonne)n\b/g, '$1eine $2');
  if (lang === 'en') s = s.replace(/(^|[^\d.])1 (hour|minute|second|metre|kilometre|centimetre|millimetre|gram|kilogram|tonne|litre|millilitre|euro|cent|degree)s\b/g, '$11 $2');
  return s.trim();
}
// mehrere Sätze ohne doppelte Punkte verbinden
const joinSay = parts => parts.map(x => String(x).trim().replace(/[.!?:]+$/, '')).filter(Boolean).join('. ');
// Deutscher Quelltext → so, wie er gerade angezeigt wird (übersetzt, mit Zahlen-Schreibweise der Sprache)
const shownText = de => I18N.lang === 'de' ? de : (typeof i18nNumbers === 'function' ? i18nNumbers(tr(de)) : tr(de));

// Vorlesen insgesamt an? (Schalter in config.js; aus, bis die Tonstudio-Stimme steht)
const VORLESEN = () => CONFIG.vorlesen !== false;
const Voice = {
  available() { return VORLESEN() && Stimme.can(); },
  seq: 0, chain: Promise.resolve(),
  stop() { this.seq++; this.chain = Promise.resolve(); Stimme.stop(); },
  // lange Texte in Stücke bis 300 Zeichen (an Satzgrenzen) – so viel nimmt der Stimmen-Server
  chunks(text) {
    if (text.length <= 300) return [text];
    const out = []; let cur = '';
    for (const s of text.split(/(?<=[.!?])\s+/)) { if (cur && (cur + ' ' + s).length > 300) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s; }
    if (cur) out.push(cur);
    return out.flatMap(c => c.length <= 300 ? [c] : c.match(/.{1,300}(\s|$)/g).map(x => x.trim()));
  },
  // ein Text: Stück für Stück mit der KI-Stimme; es gibt keine Gerätestimme (Marcel 20.11.)
  async one(text, seq) {
    for (const c of this.chunks(text)) { if (seq !== this.seq) return; if ((await Stimme.play(c, I18N.lang, () => seq !== this.seq)) === false) return; }
  },
  // spricht Abschnitte nacheinander; queue: hinten anhängen statt unterbrechen
  speakParts(parts, { queue = false, force = false } = {}) {
    parts = parts.map(p => String(p || '').trim()).filter(Boolean);
    if (!VORLESEN() || (!S.settings.speech && !force) || !parts.length) return;
    if (!queue) this.stop();
    const seq = this.seq;
    this.chain = this.chain.then(async () => { for (const p of parts) { if (seq !== this.seq) return; await this.one(p, seq); } }).catch(() => {});
    return this.chain;
  },
  speakRaw(text, o) { return this.speakParts([text], o); },
  // deutscher Quelltext (wird übersetzt und mathematisch ausgesprochen)
  say(de, o) { return this.speakRaw(mathSpeak(shownText(de)), o); },
};
// alte Schnittstelle: speak(text) für fertige Aufgaben-Sprechtexte
function speak(text, o) { Voice.speakRaw(text, o); }
