'use strict';
/* =====================================================================
   Rechenblitz – Sprachen (Deutsch, Englisch, Ukrainisch)
   Die App ist auf Deutsch geschrieben. Für andere Sprachen werden alle
   sichtbaren Texte beim Anzeigen übersetzt: Zahlen und Namen werden zu
   Platzhaltern, der Rest wird im Wörterbuch nachgeschlagen
   (js/lang-en.js, js/lang-uk.js). Fehlt ein Eintrag, bleibt der Text deutsch.
   ===================================================================== */
const I18N = {
  langs: { de: 'Deutsch', en: 'English', uk: 'Українська' },
  locales: { de: 'de-DE', en: 'en-GB', uk: 'uk-UA' },
  lang: 'de', dict: { en: {}, uk: {} }, observer: null,
  add(lang, entries) { Object.assign(this.dict[lang], entries); },
};
function i18nPref() { try { return (JSON.parse(localStorage.getItem('rechenblitz') || '{}') || {}).lang || 'auto'; } catch { return 'auto'; } }
function detectLang(pref = i18nPref()) {
  if (pref && pref !== 'auto' && I18N.langs[pref]) return pref;
  for (const l of navigator.languages || [navigator.language || 'de']) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (c === 'de' || c === 'en' || c === 'uk') return c;
  }
  return 'de';
}
const locale = () => I18N.locales[I18N.lang];

/* ---------- Text → Schlüssel mit Platzhaltern ---------- */
const I18N_NAMES = ['Lena', 'Tim', 'Mia', 'Ben', 'Emma', 'Noah', 'Sofia', 'Elias', 'Hannah', 'Luca', 'Mila', 'Paul', 'Ella', 'Finn', 'Leonie', 'Jonas', 'Aylin', 'Mats', 'Zoe', 'Can'];
const I18N_NUM = '(?:\\([−-]?\\d+(?:[.,]\\d+)*(?:\\/\\d+)?\\)|[−-]?\\d+(?:[.,]\\d+)*(?:\\/\\d+)?)[²³]?';
const I18N_DATE = '(?:(?:Mo|Di|Mi|Do|Fr|Sa|So)\\.,\\s?\\d{1,2}\\.\\d{1,2}\\.|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\\s\\d{1,2}\\/\\d{1,2}|(?:пн|вт|ср|чт|пт|сб|нд),\\s?\\d{1,2}\\.\\d{1,2})';
// Ganze Rechenausdrücke (z. B. „13 − 9 = 4“ oder „1, 2, 3, 6“) und Datumsangaben werden zu einem Platzhalter
const I18N_TOKEN = new RegExp(`https?:\\/\\/\\S+|${I18N_DATE}|${I18N_NUM}(?:\\s*(?:[+−·:=→≈×÷,]|…)\\s*${I18N_NUM})*|\\b(?:${I18N_NAMES.join('|')})\\b`, 'g');
function i18nKey(text) {
  const args = [];
  const key = text.replace(/\s+/g, ' ').trim().replace(I18N_TOKEN, m => { args.push(m); return '{}'; });
  return { key, args };
}
const hasWords = k => /[A-Za-zÄÖÜäöüß]{2,}/.test(k.replace(/\{\}/g, ''));
function fillArgs(tr, args) {
  if (/\{\d+\}/.test(tr)) return tr.replace(/\{(\d+)\}/g, (m, i) => args[+i] ?? '');
  let i = 0; return tr.replace(/\{\}/g, () => args[i++] ?? '');
}
// Zahlen- und Rechenzeichen-Schreibweise der Zielsprache
function i18nNumbers(s) {
  if (I18N.lang === 'en') {
    s = s.replace(/(\d)([.,])(?=(\d)|$)/g, (m, d, sep, nx) => d + (sep === ',' ? '.' : nx !== undefined ? ',' : '.'));
    s = s.replace(/ · /g, ' × ').replace(/ : /g, ' ÷ ');
    if (s === '·') s = '×'; else if (s === ':') s = '÷'; else if (s === ',') s = '.';
  } else if (I18N.lang === 'uk') {
    s = s.replace(/(\d)\.(?=\d{3}(?!\d))/g, '$1 ');
  }
  return s;
}
function tr(text) {
  if (window.__i18nRec && text != null) window.__i18nRec(String(text));
  if (I18N.lang === 'de' || text == null) return text;
  const s = String(text);
  if (!/\S/.test(s)) return s;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  return i18nNumbers(lead + trCore(s.trim()) + trail);
}
// Ganzer Text im Wörterbuch? Sonst an „ · “ bzw. „: “ zerlegen und die Teile übersetzen
function trCore(s) {
  const { key, args } = i18nKey(s);
  const hit = I18N.dict[I18N.lang][key];
  if (hit != null) return fillArgs(hit, args);
  if (!hasWords(key)) return s;
  const eq = s.match(/^(.*\S)(\s+[=≈](?:\s*\?)?)$/); if (eq) return trCore(eq[1]) + eq[2];
  const par = s.match(/^\((.+)\)$/); if (par) return '(' + trCore(par[1]) + ')';
  const i = s.indexOf(': ');
  if (i > 0 && i < s.length - 2) return trCore(s.slice(0, i)) + ': ' + trCore(s.slice(i + 2));
  if (s.includes(' · ')) return s.split(' · ').map(trCore).join(' · ');
  if (window.__i18nMiss) window.__i18nMiss(key);
  return s;
}

/* ---------- Automatische Übersetzung der Seite ---------- */
const I18N_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const i18nSeen = new WeakMap();
function i18nSkip(el) { return !el || el.closest('[translate="no"],script,style,textarea,code'); }
function i18nText(n) {
  if (i18nSkip(n.parentElement)) return;
  const cur = n.nodeValue;
  if (i18nSeen.get(n) === cur) return;
  const out = tr(cur);
  if (out !== cur) n.nodeValue = out;
  i18nSeen.set(n, n.nodeValue);
}
function i18nAttrs(el) {
  if (i18nSkip(el)) return;
  let m = i18nSeen.get(el); if (!m || typeof m !== 'object') { m = {}; i18nSeen.set(el, m); }
  for (const a of I18N_ATTRS) {
    const v = el.getAttribute(a); if (v == null || m[a] === v) continue;
    const out = tr(v); if (out !== v) el.setAttribute(a, out); m[a] = el.getAttribute(a);
  }
}
function i18nTree(root) {
  if (root.nodeType === 3) return i18nText(root);
  if (root.nodeType !== 1) return;
  i18nAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n; while ((n = w.nextNode())) n.nodeType === 3 ? i18nText(n) : i18nAttrs(n);
}
function i18nStart() {
  I18N.lang = detectLang();
  document.documentElement.lang = I18N.lang;
  if (I18N.observer) { I18N.observer.disconnect(); I18N.observer = null; }
  if (I18N.lang === 'de') return;
  document.title = tr(document.title);
  i18nTree(document.body);
  I18N.observer = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') i18nText(m.target);
      else if (m.type === 'attributes') i18nAttrs(m.target);
      else m.addedNodes.forEach(i18nTree);
    }
  });
  I18N.observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
}
// Sprache wechseln: Auswahl merken und die Seite neu laden (alle Texte frisch auf Deutsch erzeugen, dann übersetzen)
function setLanguage(pref) { ROOT.lang = pref; save(); location.reload(); }

/* ---------- Vorlesen in der Zielsprache ---------- */
const I18N_SAY = {
  en: { '+': ' plus ', '−': ' minus ', '·': ' times ', ':': ' divided by ', '=': ' equals ', '≈': ' is about ', '?': ' what ', '√': ' square root of ', '%': ' percent', '/': ' over ' },
  uk: { '+': ' плюс ', '−': ' мінус ', '·': ' помножити на ', ':': ' поділити на ', '=': ' дорівнює ', '≈': ' приблизно ', '?': ' скільки ', '√': ' корінь з ', '%': ' відсотків', '/': ' на ' },
};
function i18nSpeech(t) {
  const say = I18N_SAY[I18N.lang]; let s = tr(taskText(t));
  s = s.replace(/×/g, '·').replace(/÷/g, ':').replace(/[+−·:=≈?√%/]/g, c => say[c] || c).replace(/²/g, I18N.lang === 'en' ? ' squared' : ' в квадраті');
  return s + (t.hint ? '. ' + tr(t.hint) : '');
}
