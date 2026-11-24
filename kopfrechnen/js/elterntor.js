'use strict';
/* =====================================================================
   Zahlensprint – Eltern-Tor (Standard der AppZentrale, ELTERN-TOR.md; Marcel 24.11.2026)
   Eine Malaufgabe in Worten (13–19 × 6–9), eigene Zifferntastatur, nach einem Fehler eine neue Aufgabe,
   danach 10 Minuten offen (nur im Arbeitsspeicher, nie gespeichert). Ein Vorlese-Knopf kommt erst mit der Tonstudio-Stimme.
   Hinter dem Tor: Elternbereich, Kauf (Pro), Zurücksetzen/Löschen, Familie/Kopplung, Klassen-Code, Teilen nach außen,
   alle Links aus der App hinaus – AUSSER Impressum, Datenschutz, der Website-Startseite („Zu Nachhilfe – online“,
   „← Alle Apps“, /lern-apps/) und den Schwester-Apps (V10 neu, Marcel: „Ohne Tor, neutral“).
   ===================================================================== */
const GATE = { okUntil: 0, pass: false, minutes: 10 };
const GATE_FREE = /\/(impressum|datenschutz)\b/i;
// Ohne Tor erlaubt (V10 neu): Website-Startseite und /lern-apps/, Impressum, Datenschutz, die Schwester-Apps auf *.mathenachhilfe-online.com außer www
const gateFrei = u => GATE_FREE.test(u.pathname) || (u.host === 'www.mathenachhilfe-online.com' ? /^\/(lern-apps\/?)?$/.test(u.pathname) : /(^|\.)mathenachhilfe-online\.com$/.test(u.hostname));
const elternFrei = () => Date.now() < GATE.okUntil;   // Eltern-Tor in den letzten 10 Minuten bestanden

/** Zahlwörter 13–19 und 6–9 (Deutsch, Englisch, Ukrainisch) */
const GATE_W = {
  de: { a: ['dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'], b: ['sechs', 'sieben', 'acht', 'neun'], q: (a, b) => `Was ergibt ${a} mal ${b}?` },
  en: { a: ['thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], b: ['six', 'seven', 'eight', 'nine'], q: (a, b) => `What is ${a} times ${b}?` },
  uk: { a: ['тринадцять', 'чотирнадцять', 'п’ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев’ятнадцять'], b: ['шість', 'сім', 'вісім', 'дев’ять'], q: (a, b) => `Скільки буде ${a} помножити на ${b}?` },
};
function gateTask(lang) {
  const a = 13 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 4), W = GATE_W[lang] || GATE_W.de;
  return { a, b, answer: a * b, text: W.q(W.a[a - 13], W.b[b - 6]) };
}

PANELS.elternGate = ({ href, next, then, grund }) => {   // next: [Panel, Optionen] – Bereich für Erwachsene öffnen; then: Funktion nach bestandenem Tor; href: Link öffnen
  const lang = (typeof I18N !== 'undefined' && I18N.lang) || 'de';
  let t = gateTask(lang), eingabe = '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
  return { title: '<span>🔒</span> <span>Nur für Erwachsene</span>', html: `<div class="gate" id="gateForm">
    <p style="margin:0">${esc(grund || (next || then ? 'Dieser Bereich ist für Erwachsene.' : 'Dieser Link führt aus der App hinaus.'))}</p>
    <p class="small muted" style="margin:0">Bitte löse die Aufgabe:</p>
    <div class="gate-word" id="gateWord" translate="no">${esc(t.text)}</div>
    <div class="gate-in" id="gateIn" role="status" aria-live="polite" aria-label="Deine Eingabe" translate="no">&nbsp;</div>
    <div class="gate-pad" role="group" aria-label="Zifferntastatur" translate="no">${keys.map(k => `<button type="button" class="gate-key${k === '✓' ? ' ok' : ''}" data-k="${k}" aria-label="${k === '⌫' ? 'Löschen' : k === '✓' ? 'Fertig' : k}">${k}</button>`).join('')}</div>
    <div class="row2"><button class="btn" type="button" id="gateCancel">Abbrechen</button></div></div>`,
    init() {
      const show = () => { $('gateIn').textContent = eingabe || '\u00a0'; };
      const fertig = () => {
        if (+eingabe === t.answer) {
          GATE.okUntil = Date.now() + GATE.minutes * 60000;
          if (next) { showPanel(next[0], next[1] || {}, false); return; }
          closeSheet();
          if (then) { try { then(); } catch {} } else if (href) gateOpen(href);
          return;
        }
        t = gateTask(lang); eingabe = ''; $('gateWord').textContent = t.text; show();
        toast('Das war nicht richtig – bitte einen Erwachsenen fragen.', 2200);
      };
      $('gateCancel').onclick = closeSheet;
      $('gateForm').querySelector('.gate-pad').addEventListener('click', e => {
        const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
        if (k === '⌫') eingabe = eingabe.slice(0, -1); else if (k === '✓') { if (eingabe) fertig(); return; } else if (eingabe.length < 3) eingabe += k;
        show();
      });
    } };
};
function gateOpen(href) {
  const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener';
  GATE.pass = true; document.body.appendChild(a); a.click(); a.remove(); GATE.pass = false;
}
/** Etwas nur nach dem Eltern-Tor tun (z. B. Teilen nach außen) */
function mitTor(fn, grund) { if (elternFrei()) return fn(); openSheet('elternGate', { then: fn, grund }); }
document.addEventListener('click', e => {
  if (GATE.pass) return;
  const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  let u; try { u = new URL(a.getAttribute('href'), location.href); } catch { return; }
  if (!/^https?:$/.test(u.protocol) || u.host === location.host || gateFrei(u)) return;
  if (elternFrei()) return;
  e.preventDefault(); e.stopPropagation();
  openSheet('elternGate', { href: u.href });
}, true);
