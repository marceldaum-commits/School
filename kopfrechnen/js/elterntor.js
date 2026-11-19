'use strict';
/* =====================================================================
   Rechenblitz – Elternabfrage vor Links nach außen (Marcel 16.11., Google-Play-Familienrichtlinie)
   Nur in der Android-App: Bevor ein Link die App verlässt (Website, Probestunde, Stundenpakete …),
   muss ein Erwachsener eine ausgeschriebene Zahl in Ziffern eintippen. Impressum und Datenschutz
   bleiben ohne Abfrage erreichbar. Einmal bestanden gilt die Abfrage 10 Minuten.
   ===================================================================== */
const GATE = { okUntil: 0, pass: false, minutes: 10 };
const GATE_FREE = /\/(impressum|datenschutz)\b/i;

/** Zahl 121–999 als Wort (Deutsch, Englisch, Ukrainisch) */
function gateWords(n, lang) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  if (lang === 'en') {
    const O = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'], T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    return `${O[h]} hundred and ${T[t]}-${O[o]}`;
  }
  if (lang === 'uk') {
    const H = ['', 'сто', 'двісті', 'триста', 'чотириста', 'п’ятсот', 'шістсот', 'сімсот', 'вісімсот', 'дев’ятсот'];
    const T = ['', '', 'двадцять', 'тридцять', 'сорок', 'п’ятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'дев’яносто'];
    const O = ['', 'один', 'два', 'три', 'чотири', 'п’ять', 'шість', 'сім', 'вісім', 'дев’ять'];
    return `${H[h]} ${T[t]} ${O[o]}`;
  }
  const O = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'], T = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  return `${O[h]}hundert${O[o]}und${T[t]}`;
}
const gateNumber = () => rnd(1, 9) * 100 + rnd(2, 9) * 10 + rnd(1, 9);   // immer dreistellig mit Zehner ≥ 2 und Einer ≥ 1

PANELS.elternGate = ({ href, next }) => {   // next: [Panel, Optionen] – statt eines Links einen Bereich für Erwachsene öffnen (z. B. Pro-Kauf)
  let n = gateNumber();
  const lang = (typeof I18N !== 'undefined' && I18N.lang) || 'de';
  return { title: '<span>🔒</span> <span>Nur für Erwachsene</span>', html: `<form class="gate" id="gateForm" autocomplete="off">
    <p style="margin:0">${next ? 'Dieser Bereich ist für Erwachsene.' : 'Dieser Link führt aus der App zur Website von Nachhilfe – online.'}</p>
    <p class="small muted" style="margin:0">Bitte gib die Zahl in Ziffern ein:</p>
    <div class="gate-word" id="gateWord" translate="no">${esc(gateWords(n, lang))}</div>
    <input id="gateIn" inputmode="numeric" pattern="[0-9]*" maxlength="3" aria-label="Zahl in Ziffern" required>
    <div class="row2"><button class="btn" type="button" id="gateCancel">Abbrechen</button><button class="btn primary" type="submit">Weiter</button></div></form>`,
    focus: 'gateIn',
    init() {
      $('gateCancel').onclick = closeSheet;
      $('gateForm').onsubmit = e => {
        e.preventDefault();
        if (+$('gateIn').value.trim() === n) { GATE.okUntil = Date.now() + GATE.minutes * 60000; if (next) { showPanel(next[0], next[1] || {}, false); return; } closeSheet(); gateOpen(href); return; }
        n = gateNumber(); $('gateWord').textContent = gateWords(n, lang); $('gateIn').value = ''; $('gateIn').focus();
        toast('Das war nicht richtig – bitte einen Erwachsenen fragen.', 2200);
      };
    } };
};
function gateOpen(href) {
  const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener';
  GATE.pass = true; document.body.appendChild(a); a.click(); a.remove(); GATE.pass = false;
}
document.addEventListener('click', e => {
  if (!IS_NATIVE || GATE.pass) return;
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  let u; try { u = new URL(a.getAttribute('href'), location.href); } catch { return; }
  if (!/^https?:$/.test(u.protocol) || u.host === location.host || GATE_FREE.test(u.pathname)) return;
  if (Date.now() < GATE.okUntil) return;
  e.preventDefault(); e.stopPropagation();
  openSheet('elternGate', { href: u.href });
}, true);
