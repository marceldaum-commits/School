'use strict';
/* =====================================================================
   Rechenblitz – Rätsel des Tages („Blitz-Zahl“): eine geheime Zahl in 6 Versuchen finden.
   🟩 Ziffer an richtiger Stelle · 🟨 Ziffer kommt vor, andere Stelle · ⬜ kommt nicht vor.
   Jeder Versuch schaltet einen Mathe-Hinweis frei (gerade/ungerade, Quersumme, Bereich …).
   Jeden Tag für alle gleich (Klasse 1–2: zweistellig, sonst dreistellig) · Ergebnis teilbar.
   ===================================================================== */
const RAETSEL_TRIES = 6;
const raetselLen = () => (S.settings.klasse && S.settings.klasse <= 2) ? 2 : 3;
function raetselSecret(date = todayStr(), len = raetselLen()) {
  return withSeed(hashStr('blitzzahl|' + date + '|' + len), () => {
    const lo = len === 2 ? 10 : 100, hi = len === 2 ? 99 : 999;
    return String(rnd(lo, hi));
  });
}
function raetselState() {
  const t = todayStr(), len = raetselLen();
  // je Tag und Länge ein eigener Stand – ein Klassenwechsel löscht kein angefangenes Rätsel
  if (!S.raetselDay || S.raetselDay.date !== t) S.raetselDay = { date: t, by: {}, paid: false, counted: false };
  if (S.raetsel && S.raetsel.date === t && !S.raetselDay.by[S.raetsel.len]) { S.raetselDay.by[S.raetsel.len] = S.raetsel; if (S.raetsel.done) { S.raetselDay.counted = true; S.raetselDay.paid = !!S.raetsel.won; } }   // Stand aus 3.12.0 übernehmen
  S.raetsel = S.raetselDay.by[len] ||= { date: t, len, g: [], done: false, won: false };
  S.raetselStats ||= { played: 0, won: 0, streak: 0, last: '' };
  return S.raetsel;
}
/** Bewertung wie bei Wordle (doppelte Ziffern richtig gezählt) */
function raetselScore(guess, secret) {
  const res = Array(guess.length).fill('n'), left = {};
  for (let i = 0; i < guess.length; i++) if (guess[i] === secret[i]) res[i] = 'g'; else left[secret[i]] = (left[secret[i]] || 0) + 1;
  for (let i = 0; i < guess.length; i++) if (res[i] !== 'g' && left[guess[i]]) { res[i] = 'y'; left[guess[i]]--; }
  return res;
}
function raetselHints(secret, n) {
  const v = +secret, qs = [...secret].reduce((a, d) => a + +d, 0), len = secret.length, step = len === 2 ? 10 : 100, lo = Math.floor(v / step) * step;
  const all = [
    `Die Zahl ist ${v % 2 ? 'ungerade' : 'gerade'}.`,
    `Die Quersumme ist ${qs}.`,
    `Die Zahl liegt zwischen ${lo} und ${lo + step - 1}.`,
    `Die Zahl ist ${v % 3 ? 'nicht ' : ''}durch 3 teilbar.`,
    `Die letzte Ziffer ist ${secret[len - 1]}.`,
  ];
  return all.slice(0, Math.min(all.length, n + 1));
}
const RAETSEL_EMO = { g: '🟩', y: '🟨', n: '⬜' };
function raetselShare() {
  const st = raetselState(), sec = raetselSecret(st.date, st.len);
  const grid = st.g.map(g => raetselScore(g, sec).map(x => RAETSEL_EMO[x]).join('')).join('\n');
  shareText(`Rechenblitz – Rätsel des Tages ${fmtDay(st.date)}\n${st.won ? st.g.length : 'X'}/${RAETSEL_TRIES}\n${grid}\n${tr('Schaffst du es schneller?')} ${appUrl()}`, 'Rechenblitz-Rätsel');
}

PANELS.raetsel = () => {
  const st = raetselState(), sec = raetselSecret(st.date, st.len), stats = S.raetselStats;
  let input = '';
  const rows = () => Array.from({ length: RAETSEL_TRIES }, (_, r) => {
    const g = st.g[r], sc = g ? raetselScore(g, sec) : null, cur = !st.done && r === st.g.length;
    return `<div class="rz-row${cur ? ' cur' : ''}" translate="no">${Array.from({ length: st.len }, (_, i) => `<span class="rz-c ${sc ? 'c-' + sc[i] : ''}" style="--i:${i}">${g ? g[i] : cur ? (input[i] || '') : ''}</span>`).join('')}</div>`;
  }).join('');
  const hints = () => `<ul class="rz-hints">${raetselHints(sec, st.g.length).map((h, i) => `<li style="--i:${i}"><span>💡</span> <span>${esc(h)}</span></li>`).join('')}</ul>`;
  const end = () => st.done ? `<div class="rz-end">${blitzSay(st.won ? 'cheer' : 'comfort', st.won ? `<b>Geschafft!</b> <span>Die Blitz-Zahl war</span> <b translate="no">${sec}</b>. ${st.paid ? `<span>+${st.paid} 💫</span>` : ''}` : `<span>Diesmal nicht – die Zahl war</span> <b translate="no">${sec}</b>. <span>Morgen gibt es ein neues Rätsel!</span>`, 56)}
      <div class="rz-stats"><div><b>${stats.played}</b><span>gespielt</span></div><div><b>${stats.won}</b><span>gelöst</span></div><div><b>${stats.streak}</b><span>in Folge</span></div></div>
      <button class="btn primary block" id="rzShare">Ergebnis teilen</button></div>` : '';
  const keys = () => st.done ? '' : `<div class="rz-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k => `<button data-k="${k}" class="${k === 'ok' ? 'ok' : k === 'del' ? 'fn' : ''}">${k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}</button>`).join('')}</div>`;
  const html = () => `<div class="raetsel">
    <p class="small muted" style="margin:0">Finde die geheime ${st.len === 2 ? 'zweistellige' : 'dreistellige'} Blitz-Zahl in ${RAETSEL_TRIES} Versuchen. 🟩 richtige Stelle · 🟨 andere Stelle · ⬜ kommt nicht vor.</p>
    <div class="rz-grid">${rows()}</div>${hints()}${end()}${keys()}</div>`;
  const draw = () => { $('sheetBody').innerHTML = html(); bind(); };
  const submitGuess = () => {
    if (input.length !== st.len) { toast(`Bitte ${st.len} Ziffern eingeben`); return; }
    if (input[0] === '0') { toast('Die Zahl beginnt nicht mit 0'); return; }
    st.g.push(input); input = ''; Sound.click();
    const won = st.g[st.g.length - 1] === sec;
    if (won || st.g.length >= RAETSEL_TRIES) {
      st.done = true; st.won = won;
      const day = S.raetselDay, first = !day.counted; day.counted = true;   // Statistik und Funken nur einmal pro Tag
      if (first) stats.played++;
      if (won) {
        if (stats.last !== st.date) { stats.won++; stats.streak = stats.last === dayStr(1) ? stats.streak + 1 : 1; stats.last = st.date; }
        if (!day.paid) { day.paid = true; st.paid = FUNKEN.raetsel + RAETSEL_TRIES - st.g.length; addFunken(st.paid); }
        award('raetsel'); announceBadges(); Sound.milestone(); Confetti.burst(120);
      } else { if (first) stats.streak = 0; Sound.wrong(); }
    } else { const sc = raetselScore(st.g[st.g.length - 1], sec); sc.every(x => x !== 'n') ? Sound.hint() : Sound.click(); }
    save(); draw(); renderHome();
  };
  const press = k => {
    if (st.done) return;
    if (k === 'del') input = input.slice(0, -1);
    else if (k === 'ok') return submitGuess();
    else if (input.length < st.len) input += k;
    $('sheetBody').querySelector('.rz-grid').innerHTML = rows();
  };
  const bind = () => {
    $('sheetBody').querySelectorAll('.rz-keys [data-k]').forEach(b => b.onclick = () => press(b.dataset.k));
    $('rzShare') && ($('rzShare').onclick = raetselShare);
  };
  PANELS.raetsel.key = e => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') press('ok'); else return false; return true; };
  return { title: '<span>🧩</span> <span>Rätsel des Tages</span>', html: html(), init: bind };
};

/* ---------- Kacheln auf der Startseite: Rätsel · Garderobe · Zimmer ---------- */
function renderWeltCard() {
  const el = $('weltCard'); if (!el) return;
  weltState(); const st = raetselState(), ev = eventNow();
  el.hidden = false;
  el.innerHTML = `<button class="wt" data-open="raetsel"><span class="wt-i">🧩</span><b>Rätsel</b><small>${st.done ? (st.won ? `✓ ${st.g.length}/${RAETSEL_TRIES}` : '✗') : 'Heute neu'}</small></button>
    <button class="wt" data-open="welt"><span class="wt-i">🎩</span><b>Garderobe</b><small>💫 ${S.funken}</small></button>
    <button class="wt" data-room><span class="wt-i">🏠</span><b>Zimmer</b><small>${ev ? `<span>${ev.icon}</span> <span>${esc(ev.name)}</span>` : 'Einrichten'}</small></button>`;
  el.querySelector('[data-room]').onclick = () => openSheet('welt', { tab: 'room' });
}
