'use strict';
/* =====================================================================
   Rechenblitz – Rechen-Reise (Roadmap Tag 3/4): Fortschritt als Geschichte statt Liste.
   Ein Sturm hat Blitz' Funken verstreut – das Kind sammelt sie Etappe für Etappe wieder ein.
   Kapitel mit je 5 Etappen + Boss, Aufgaben passend zur Klassenstufe, Sterne je Etappe,
   Sticker + Urkunde je Kapitel. Gespeichert pro Profil in S.reise (nur auf dem Gerät).
   ===================================================================== */
const REISE = {
  N: 6,            // Etappen je Kapitel (5 + Boss)
  TASKS: 8,        // Aufgaben je Etappe
  BOSS: 10,        // Aufgaben in der Boss-Etappe
};
const REISE_CH = [
  { id: 'wald', icon: '🌲', name: 'Der Zahlenwald', sky: ['#1f6f4a', '#0f3d2c'], path: '#c9a26b', node: '#2f9e5f', sticker: '🦉',
    intro: 'Ein Sturm hat meine Funken im Zahlenwald verstreut! Hilfst du mir, sie wieder einzusammeln?',
    st: ['Hinter dem ersten Baum glitzert es. Los geht’s!', 'Die Eichhörnchen haben Funken versteckt.', 'Am Pilzring leuchtet etwas …', 'Über den Bach führen nur richtige Ergebnisse.', 'Die alte Eule will dich prüfen.', 'Der Wald-Wächter! Zeig ihm, was du kannst!'],
    done: 'Der Zahlenwald leuchtet wieder! Die Eule schenkt dir einen Sticker.', off: -1 },
  { id: 'fluss', icon: '🌊', name: 'Der Rechenfluss', sky: ['#1d5fa8', '#0b2e5e'], path: '#e8d6a8', node: '#2b7de0', sticker: '🐟',
    intro: 'Der Rechenfluss trägt meine Funken davon! Wir springen von Stein zu Stein.',
    st: ['Der erste Stein wackelt – rechne schnell!', 'Die Fische zählen mit.', 'Ein Strudel! Bleib konzentriert.', 'Am Wasserfall wird es laut.', 'Die Brücke hat Lücken – füll sie!', 'Der Fluss-Drache! Nur Profis kommen vorbei.'],
    done: 'Geschafft – alle Funken aus dem Fluss gefischt! Ein Fisch-Sticker für dich.', off: 0 },
  { id: 'hoehle', icon: '🕯️', name: 'Die Funkenhöhle', sky: ['#3b2a6e', '#120c2e'], path: '#8e7cc3', node: '#9b6dff', sticker: '💎',
    intro: 'Die letzten Funken liegen tief in der Höhle. Jede richtige Antwort macht es heller!',
    st: ['Es ist dunkel – jede richtige Antwort ist ein Licht.', 'Kristalle funkeln an der Decke.', 'Fledermäuse! Nicht ablenken lassen.', 'Ein unterirdischer See spiegelt die Zahlen.', 'Das Echo rechnet mit dir.', 'Der Höhlen-Troll bewacht den größten Funken!'],
    done: 'Die Höhle strahlt! Du hast den größten Funken gefunden – ein Kristall-Sticker für dich.', off: 0, hard: true },
  { id: 'wolken', icon: '☁️', name: 'Die Wolkenstadt', soon: true },
  { id: 'vulkan', icon: '🌋', name: 'Der Feuerberg', soon: true },
  { id: 'schloss', icon: '🏰', name: 'Das Sternenschloss', soon: true },
];

function reiseState() {
  S.reise ||= { k: 0, ch: {} };
  return S.reise;
}
const reiseKlasse = () => reiseState().k || S.settings.klasse || 0;
/** Themen + Stufen für Kapitel c (nach Klassenstufe): Kapitel 1 leichter, Kapitel 3 Stufe höher */
function reiseTopics(c) {
  const k = Math.max(1, Math.min(10, reiseKlasse() || 4)), ch = REISE_CH[c];
  let list = (CLASS_TOPICS[k] || []).filter(([t]) => t !== 'word');
  if (list.length < 3) list = list.concat((CLASS_TOPICS[Math.max(1, k - 1)] || []).filter(([t]) => t !== 'word'));
  return list.map(([t, l]) => [t, Math.max(0, Math.min(4, l + (ch.off || 0) + (ch.hard ? 1 : 0)))]);
}
function reiseStationTopics(c, s) {
  const L = reiseTopics(c);
  if (s === REISE.N - 1) return L;                                  // Boss: alles gemischt
  return [L[(c * 2 + s) % L.length], L[(c * 2 + s + 1) % L.length]];  // je Etappe zwei Themen
}
const reiseStars = (c, s) => (reiseState().ch[c] || {})[s] || 0;
const reiseUnlocked = (c, s) => c === 0 && s === 0 || (s > 0 ? reiseStars(c, s - 1) > 0 : reiseChapterDone(c - 1));
const reiseChapterDone = c => c >= 0 && reiseStars(c, REISE.N - 1) > 0;
/** aktuelle Station: erste noch nicht geschaffte */
function reiseCurrent() {
  for (let c = 0; c < REISE_CH.length; c++) {
    if (REISE_CH[c].soon) return { c, s: 0, soon: true };
    for (let s = 0; s < REISE.N; s++) if (!reiseStars(c, s)) return { c, s };
  }
  return { c: REISE_CH.length - 1, s: REISE.N - 1, all: true };
}
const reiseTotalStars = () => Object.values(reiseState().ch).reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0);

/* ---------- Etappe spielen ---------- */
let G_REISE = null;
function startReise(c, s) {
  const tops = reiseStationTopics(c, s), boss = s === REISE.N - 1, n = boss ? REISE.BOSS : REISE.TASKS;
  G_REISE = { c, s, boss, before: reiseStars(c, s) };
  let i = 0;
  const gen = () => { const [t, l] = tops[i++ % tops.length]; return makeTask(t, l); };
  startGame('reise', { gen, op: 'mix', lvl: tops[0][1], title: REISE_CH[c].name });
  G.total = n; updateHud();
}
/** Ergebnis der Etappe verbuchen → HTML für die Ergebnisseite */
function reiseFinish(acc) {
  const r = G_REISE; if (!r) return '';
  const stars = acc >= .95 ? 3 : acc >= .8 ? 2 : acc >= .6 ? 1 : 0, st = reiseState();
  (st.ch[r.c] ||= {});
  const first = !r.before && stars > 0, chDone = r.boss && stars > 0 && !r.before;
  if (stars > (st.ch[r.c][r.s] || 0)) st.ch[r.c][r.s] = stars;
  if (chDone) award('reise' + (r.c + 1));
  const ch = REISE_CH[r.c], nx = reiseCurrent();
  let html = `<div class="card reise-res"><div class="rr-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>`;
  if (stars === 0) html += blitzSay('comfort', `<span>Fast! Mit mindestens 60 % schaffst du die Etappe. Probier’s nochmal – ich glaub an dich!</span>`, 56);
  else if (chDone) html += `<div class="rr-sticker">${ch.sticker}</div>` + blitzSay('cheer', `<b>${esc(ch.name)}</b> <span>geschafft!</span> <span>${esc(ch.done)}</span>`, 60)
    + '<button class="btn block" id="rrCert">🏅 Urkunde</button>';
  else html += blitzSay(first ? 'cheer' : 'happy', `<span>${first ? 'Etappe geschafft! Weiter geht’s.' : 'Stark – noch besser als vorher?'}</span>`, 56);
  html += `<button class="btn primary block" id="rrNext">${stars === 0 ? '↻ Nochmal versuchen' : nx.soon ? '🗺️ Zur Karte' : '▶ Nächste Etappe'}</button></div>`;
  setTimeout(() => {
    $('rrNext') && ($('rrNext').onclick = () => { if (stars === 0) startReise(r.c, r.s); else if (nx.soon || nx.all) { goHome(); openSheet('reise'); } else startReise(nx.c, nx.s); });
    $('rrCert') && ($('rrCert').onclick = () => openSheet('cert', { line1: `${ch.name} – Kapitel ${r.c + 1} geschafft`, line2: `Rechen-Reise mit Blitz · Klasse ${reiseKlasse() || '–'}`, icon: ch.sticker }));
    if (chDone) Confetti.burst(220);
  }, 60);
  return html;
}

/* ---------- Karte ---------- */
function reiseMap(c) {
  const ch = REISE_CH[c], W = 340, H = 300, pts = [[60, 262], [210, 238], [292, 178], [160, 140], [62, 86], [214, 42]];
  const cur = reiseCurrent();
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  let deco = '';
  for (let i = 0; i < 14; i++) { const x = (mvHash(ch.id + i) * W) | 0, y = (mvHash(ch.id + i + 'y') * H) | 0; deco += `<text x="${x}" y="${y}" font-size="${14 + (i % 3) * 5}" opacity=".55">${{ wald: '🌲', fluss: '〰️', hoehle: '💎' }[ch.id] || '·'}</text>`; }
  const nodes = pts.map(([x, y], s) => {
    const stars = reiseStars(c, s), open = reiseUnlocked(c, s), here = cur.c === c && cur.s === s && !cur.soon, boss = s === REISE.N - 1;
    return `<g class="rn ${open ? 'open' : 'lock'}${here ? ' here' : ''}" data-st="${s}" role="button" tabindex="${open ? 0 : -1}" aria-label="Etappe ${s + 1}">
      <circle cx="${x}" cy="${y}" r="${boss ? 25 : 20}" fill="${open ? ch.node : '#6b7390'}" stroke="#fff" stroke-width="3"/>
      <text x="${x}" y="${y + 6}" text-anchor="middle" font-size="${boss ? 20 : 16}" font-weight="800" fill="#fff">${boss ? '👑' : open ? s + 1 : '🔒'}</text>
      ${stars ? `<text x="${x}" y="${y + (boss ? 42 : 37)}" text-anchor="middle" font-size="12" fill="#ffc83d">${'★'.repeat(stars)}</text>` : ''}</g>`;
  }).join('');
  const bz = cur.c === c && !cur.soon ? pts[cur.s] : null;
  return `<svg class="reise-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ch.name)}">
    <defs><linearGradient id="rg${c}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ch.sky[0]}"/><stop offset="1" stop-color="${ch.sky[1]}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" rx="18" fill="url(#rg${c})"/>${deco}
    <path d="${d}" fill="none" stroke="${ch.path}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round" opacity=".7"/>
    ${nodes}${bz ? `<g class="rn-bz" transform="translate(${bz[0] - 22} ${bz[1] - 66})">${blitzSvg('wave', 44)}</g>` : ''}</svg>`;
}

PANELS.reise = (o = {}) => {
  const st = reiseState();
  if (!reiseKlasse()) {
    return { title: '<span>🗺️</span> <span>Rechen-Reise</span>', html: `<div class="reise">${blitzSay('wave', '<b>Auf zur Reise!</b> In welche Klasse gehst du? Dann passen die Aufgaben genau zu dir.', 60)}
      <div class="chips big" id="rkK">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}">${k}</button>`).join('')}</div></div>`,
      init() { $('rkK').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.k = +b.dataset.v; save(); showPanel('reise'); renderHome(); }; } };
  }
  const cur = reiseCurrent(), c = Math.min(o.c ?? (cur.soon ? Math.max(0, cur.c - 1) : cur.c), REISE_CH.length - 1), ch = REISE_CH[c];
  const tabs = REISE_CH.map((x, i) => `<button class="rt ${i === c ? 'sel' : ''}" data-ch="${i}" ${x.soon || (i > 0 && !reiseChapterDone(i - 1)) ? 'disabled' : ''}><span>${x.icon}</span><small>${i + 1}</small></button>`).join('');
  return { title: '<span>🗺️</span> <span>Rechen-Reise</span>', html: `<div class="reise">
    <div class="reise-tabs">${tabs}</div>
    <h3 class="reise-h">${esc(ch.name)} <span class="muted">· Kapitel ${c + 1}</span></h3>
    ${blitzSay(reiseChapterDone(c) ? 'cheer' : 'wave', `<span>${esc(reiseChapterDone(c) ? ch.done : ch.intro)}</span>`, 52)}
    <div class="reise-wrap">${reiseMap(c)}</div>
    <p class="small muted" style="margin:0;text-align:center">⭐ ${reiseTotalStars()} Sterne gesammelt · Klasse ${reiseKlasse()} <button class="linkbtn" id="rkChange">ändern</button></p>
    ${REISE_CH.slice(3).some(x => x.soon) ? '<p class="small muted" style="margin:0;text-align:center">Kapitel 4–6 kommen bald: Wolkenstadt, Feuerberg und Sternenschloss.</p>' : ''}</div>`,
    init() {
      $('sheetBody').querySelectorAll('.rt:not([disabled])').forEach(b => b.onclick = () => showPanel('reise', { c: +b.dataset.ch }));
      $('sheetBody').querySelectorAll('.rn.open').forEach(g => {
        const go = () => showPanel('reiseStation', { c, s: +g.dataset.st }, true);
        g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      });
      $('rkChange').onclick = () => { if (confirm(tr('Klassenstufe ändern? Deine Sterne bleiben erhalten, die Aufgaben passen sich an.'))) { st.k = 0; save(); showPanel('reise'); } };
    } };
};
PANELS.reiseStation = ({ c, s }) => {
  const ch = REISE_CH[c], boss = s === REISE.N - 1, stars = reiseStars(c, s), tops = reiseStationTopics(c, s);
  const names = [...new Set(tops.map(([t]) => TOPICS[t].name))];
  return { title: `<span>${ch.icon}</span> <span>${boss ? 'Boss-Etappe' : `Etappe ${s + 1}`}</span>`, html: `<div class="reise">
    ${blitzSay(boss ? 'wow' : 'happy', `<span>${esc(ch.st[s])}</span>`, 60)}
    <div class="rs-info"><div><b>${boss ? REISE.BOSS : REISE.TASKS}</b><span>Aufgaben</span></div><div><b>${names.length > 3 ? 'Mix' : names.map(n => `<span>${esc(n)}</span>`).join(' + ')}</b><span>Thema</span></div><div><b>${stars ? '★'.repeat(stars) : '–'}</b><span>Bestes</span></div></div>
    <p class="small muted" style="margin:0">Ab 60 % richtig ist die Etappe geschafft – 80 % gibt zwei Sterne, 95 % drei.</p>
    <button class="btn primary block" id="rsGo">▶ Los geht’s</button></div>`,
    init() { $('rsGo').onclick = () => { closeSheet(); startReise(c, s); }; } };
};

/* ---------- Karte auf der Startseite ---------- */
function renderReiseCard() {
  const el = $('reiseCard'); if (!el) return;
  const cur = reiseCurrent(), ch = REISE_CH[cur.soon ? Math.max(0, cur.c - 1) : cur.c];
  el.hidden = false;
  const line = !reiseKlasse() ? 'Hilf Blitz, seine Funken einzusammeln!' : cur.soon ? 'Kapitel 1–3 geschafft! Bald geht’s weiter.' : `${ch.name} · Etappe ${cur.s + 1}/${REISE.N}`;
  el.innerHTML = `<div class="ch-ico reise-ico" aria-hidden="true">${ch.icon}</div><div class="ch-txt"><b>Rechen-Reise</b><span>${esc(line)}${reiseTotalStars() ? ` · ⭐ ${reiseTotalStars()}` : ''}</span></div>
    <button class="btn small primary" id="reiseGo">${cur.soon ? 'Karte' : 'Weiter'}</button>`;
  $('reiseGo').onclick = () => { if (!reiseKlasse() || cur.soon) openSheet('reise'); else openSheet('reiseStation', { c: cur.c, s: cur.s }); };
}
