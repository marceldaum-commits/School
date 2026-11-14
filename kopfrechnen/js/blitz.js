'use strict';
/* =====================================================================
   Rechenblitz – Maskottchen „Blitz“ (Fuchs mit Blitz-Schwanz, Farben der Website)
   Eigene SVG-Zeichnung, offline. Stimmungen: happy, wow, think, comfort, wave, cheer.
   blitzSvg(mood) · blitzSay(mood, text) · blitzPop(mood, text) im Spiel
   ===================================================================== */
const BZ = { or: '#ff7418', dk: '#d9530b', nv: '#101b43', cr: '#fff6ec', gd: '#ffc83d' };
let bzN = 0;
function blitzSvg(mood = 'happy', size = 64) {
  const id = 'bz' + (++bzN);
  const eyes = {
    happy: `<path d="M44 47 q5 -6 10 0 M66 47 q5 -6 10 0" stroke="${BZ.nv}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    cheer: `<path d="M44 47 q5 -6 10 0 M66 47 q5 -6 10 0" stroke="${BZ.nv}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    wave: `<circle cx="49" cy="46" r="4.2" fill="${BZ.nv}"/><circle cx="71" cy="46" r="4.2" fill="${BZ.nv}"/><circle cx="50.4" cy="44.6" r="1.4" fill="#fff"/><circle cx="72.4" cy="44.6" r="1.4" fill="#fff"/>`,
    wow: `<circle cx="49" cy="46" r="5.4" fill="${BZ.nv}"/><circle cx="71" cy="46" r="5.4" fill="${BZ.nv}"/><circle cx="51" cy="44" r="2" fill="#fff"/><circle cx="73" cy="44" r="2" fill="#fff"/>`,
    think: `<circle cx="51" cy="44" r="4" fill="${BZ.nv}"/><circle cx="73" cy="44" r="4" fill="${BZ.nv}"/><path d="M44 36 l9 -3 M66 34 l9 1" stroke="${BZ.nv}" stroke-width="2.4" stroke-linecap="round"/>`,
    comfort: `<circle cx="49" cy="47" r="4" fill="${BZ.nv}"/><circle cx="71" cy="47" r="4" fill="${BZ.nv}"/><circle cx="50.2" cy="45.8" r="1.3" fill="#fff"/><circle cx="72.2" cy="45.8" r="1.3" fill="#fff"/><path d="M44 41 l9 -3.5 M76 41 l-9 -3.5" stroke="${BZ.nv}" stroke-width="2.2" stroke-linecap="round"/>`,
  }[mood] || '';
  const mouth = {
    happy: `<path d="M52 60 q8 9 16 0 z" fill="${BZ.nv}"/><path d="M56 63.5 q4 3 8 0" fill="#ff8fa3"/>`,
    cheer: `<path d="M51 59 q9 12 18 0 z" fill="${BZ.nv}"/><path d="M55.5 64 q4.5 3.4 9 0" fill="#ff8fa3"/>`,
    wave: `<path d="M53 60 q7 7 14 0" stroke="${BZ.nv}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    wow: `<ellipse cx="60" cy="63" rx="4.6" ry="5.4" fill="${BZ.nv}"/>`,
    think: `<path d="M55 63 q5 -2 10 1" stroke="${BZ.nv}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    comfort: `<path d="M54 61 q6 5 12 0" stroke="${BZ.nv}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  }[mood] || '';
  const armR = mood === 'wave' || mood === 'cheer'
    ? `<g class="bz-arm"><ellipse cx="88" cy="70" rx="6" ry="12" transform="rotate(35 88 70)" fill="${BZ.or}"/><circle cx="93" cy="60" r="5.5" fill="${BZ.cr}"/></g>`
    : mood === 'think' ? `<ellipse cx="66" cy="72" rx="6" ry="9" transform="rotate(-40 66 72)" fill="${BZ.or}"/><circle cx="66" cy="66" r="5" fill="${BZ.cr}"/>`
    : `<ellipse cx="84" cy="90" rx="6" ry="10" transform="rotate(-20 84 90)" fill="${BZ.or}"/>`;
  const armL = mood === 'cheer'
    ? `<ellipse cx="32" cy="70" rx="6" ry="12" transform="rotate(-35 32 70)" fill="${BZ.or}"/><circle cx="27" cy="60" r="5.5" fill="${BZ.cr}"/>`
    : `<ellipse cx="36" cy="90" rx="6" ry="10" transform="rotate(20 36 90)" fill="${BZ.or}"/>`;
  const extra = {
    think: `<g fill="${BZ.nv}" opacity=".55"><circle cx="96" cy="30" r="2.4"/><circle cx="103" cy="22" r="3.2"/><circle cx="111" cy="12" r="4.2"/></g>`,
    wow: `<g fill="${BZ.gd}"><path d="M14 22 l2 5 5 .5 -4 3 1.3 5 -4.3 -2.7 -4.3 2.7 1.3 -5 -4 -3 5 -.5z"/><path d="M104 18 l1.5 3.6 3.7.4 -2.9 2.3 .9 3.7 -3.2 -2 -3.2 2 .9 -3.7 -2.9 -2.3 3.7 -.4z"/></g>`,
    comfort: `<path d="M98 30 c0 -5 7 -6 7 0 c0 -6 7 -5 7 0 c0 5 -7 9 -7 11 c0 -2 -7 -6 -7 -11z" fill="#ff5b7a"/>`,
    cheer: `<g fill="${BZ.gd}"><circle cx="18" cy="40" r="2.4"/><circle cx="104" cy="38" r="2.4"/><circle cx="12" cy="58" r="1.8"/><circle cx="110" cy="56" r="1.8"/></g>`,
  }[mood] || '';
  return `<svg class="blitz bz-${mood}" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="Blitz">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a3a"/><stop offset="1" stop-color="${BZ.or}"/></linearGradient></defs>
    <path class="bz-tail" d="M84 92 L108 62 L98 64 L112 40 L88 70 L98 68 Z" fill="${BZ.gd}" stroke="${BZ.dk}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="60" cy="92" rx="25" ry="22" fill="url(#${id})"/>
    <ellipse cx="60" cy="96" rx="14" ry="13" fill="${BZ.cr}"/>
    ${armL}
    <path d="M38 72 q22 12 44 0 l-3 8 q-19 9 -38 0z" fill="${BZ.nv}"/><path d="M60 76 l-4 7 h4 l-2 6 6 -8 h-4 l2 -5z" fill="${BZ.gd}"/>
    <path d="M30 40 L26 8 L52 26 Z" fill="${BZ.or}"/><path d="M33 33 L31 15 L46 26 Z" fill="${BZ.dk}"/>
    <path d="M90 40 L94 8 L68 26 Z" fill="${BZ.or}"/><path d="M87 33 L89 15 L74 26 Z" fill="${BZ.dk}"/>
    <ellipse cx="60" cy="48" rx="32" ry="27" fill="url(#${id})"/>
    <path d="M28 52 q14 -2 22 6 q10 8 10 8 q0 0 10 -8 q8 -8 22 -6 q-6 20 -32 21 q-26 -1 -32 -21z" fill="${BZ.cr}"/>
    <ellipse cx="60" cy="55" rx="4.6" ry="3.4" fill="${BZ.nv}"/>
    ${eyes}${mouth}${armR}${extra}</svg>`;
}
/** Blitz mit Sprechblase (für Karten, Overlays, Ergebnis) */
const blitzSay = (mood, text, size = 64) => `<div class="blitz-say"><div class="bz-fig">${blitzSvg(mood, size)}</div><div class="bz-bubble">${text}</div></div>`;

/** kurzer Auftritt im Spiel (Serie, Comeback) – oben rechts am Aufgabenfenster */
let bzPopT = 0;
function blitzPop(mood, text) {
  if (!bzOn()) return;
  const win = document.querySelector('#game .win'); if (!win) return;
  $('bzPop')?.remove(); clearTimeout(bzPopT);
  win.insertAdjacentHTML('beforeend', `<div class="bz-pop" id="bzPop"><div class="bz-bubble">${text}</div>${blitzSvg(mood, 58)}</div>`);
  bzPopT = setTimeout(() => $('bzPop')?.classList.add('out'), 1700);
  setTimeout(() => $('bzPop')?.remove(), 2200);
}
/* Sprüche */
const BZ_STREAK = { 3: 'Stark!', 5: 'Super Serie!', 10: 'Wahnsinn!', 15: 'Du bist ein echter Blitz!', 20: 'Unglaublich!' };
function blitzGreeting() {
  const h = new Date().getHours(), hi = h < 11 ? 'Guten Morgen!' : h < 18 ? 'Hallo!' : 'Guten Abend!';
  let line = 'Lust auf eine Runde?';
  try {
    const m = typeof merkStats === 'function' ? merkStats() : null;
    if (m && m.todo) line = `Im Merk-Training warten ${m.todo} Aufgaben auf dich.`;
    else if (S.challenge.date !== todayStr()) line = 'Die Tageschallenge wartet auf dich!';
  } catch {}
  return `<b>${hi}</b> ${line}`;
}
function blitzResultLine(stars, mode) {
  if (mode === 'zen') return 'Schön ruhig geübt. Das tut gut!';
  if (mode === 'test') return 'Danke! Jetzt weiß ich, was zu dir passt.';
  return stars >= 3 ? 'Perfekt! Ich bin stolz auf dich!' : stars === 2 ? 'Richtig gut gemacht!' : stars === 1 ? 'Gut gemacht – weiter so!' : 'Übung macht den Meister – probier’s nochmal!';
}

const bzOn = () => S.settings.blitz !== false;
