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
  { id: 'wolken', icon: '☁️', name: 'Die Wolkenstadt', sky: ['#7fb2ff', '#3a6fd1'], path: '#ffffff', node: '#5a8dee', sticker: '🎈', words: true,
    intro: 'Ein Windstoß hat Funken bis hoch in die Wolkenstadt getragen. Wir fliegen mit dem Ballon hinterher!',
    st: ['Der Ballon steigt – jede richtige Antwort bringt uns höher.', 'Auf dem Wolkenmarkt wird gerechnet und gehandelt.', 'Regenbogenbrücke! Nur sichere Schritte zählen.', 'Die Wolkenschafe wollen gezählt werden.', 'Gewitter! Bleib ruhig und rechne weiter.', 'Der Wolkenkönig prüft dich – zeig, was du kannst!'],
    done: 'Die Wolkenstadt glitzert! Der Wolkenkönig schenkt dir einen Ballon-Sticker.', off: 1 },
  { id: 'vulkan', icon: '🌋', name: 'Der Feuerberg', sky: ['#ff8a3d', '#7a1d0b'], path: '#3b1a10', node: '#e8501c', sticker: '🐉', words: true,
    intro: 'Im Feuerberg glühen meine Funken in der Lava. Wir brauchen kühle Köpfe und schnelle Rechnungen!',
    st: ['Heiße Steine – rechne schnell, bevor es warm wird!', 'Die Lava-Brücke hält nur richtige Ergebnisse.', 'Feuerfunken springen umher – fang sie ein!', 'Dampfwolken versperren die Sicht. Konzentrier dich!', 'Fast am Gipfel – noch ein Stück!', 'Der Feuerdrache! Nur mit den besten Rechentricks kommst du vorbei.'],
    done: 'Du hast den Feuerdrachen besiegt – er schenkt dir einen Drachen-Sticker!', off: 1, hard: true, boss: 12 },
  { id: 'schloss', icon: '🏰', name: 'Das Sternenschloss', sky: ['#2a3a8c', '#070b24'], path: '#ffc83d', node: '#7a5cff', sticker: '👑', words: true,
    intro: 'Der allerletzte Funke liegt im Sternenschloss. Wenn wir ihn finden, leuchte ich wieder ganz!',
    st: ['Das Schlosstor öffnet sich nur für richtige Antworten.', 'Im Spiegelsaal sieht alles doppelt aus.', 'Die Sternentreppe – Stufe für Stufe nach oben.', 'Die Bibliothek der Rechentricks.', 'Der Thronsaal funkelt schon …', 'Der Sternenwächter! Die letzte Prüfung – du schaffst das!'],
    done: 'Alle Funken sind zurück – ich leuchte wieder! Danke, du bist ein echter Rechenblitz! 👑', off: 2, boss: 12 },
];

function reiseState() {
  S.reise ||= { k: 0, ch: {} };
  return S.reise;
}
const reiseKlasse = () => reiseState().k || S.settings.klasse || 0;
/** Themen + Stufen für Kapitel c (nach Klassenstufe): Kapitel 1 leichter, Kapitel 3 Stufe höher */
function reiseTopics(c) {
  const k = Math.max(1, Math.min(10, reiseKlasse() || 4)), ch = REISE_CH[c];
  let list = (CLASS_TOPICS[k] || []).filter(([t]) => ch.words || t !== 'word');
  if (list.length < 3) list = list.concat((CLASS_TOPICS[Math.max(1, k - 1)] || []).filter(([t]) => ch.words || t !== 'word'));
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
  const tops = reiseStationTopics(c, s), boss = s === REISE.N - 1, n = boss ? (REISE_CH[c].boss || REISE.BOSS) : REISE.TASKS;
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
  if (first) { const n = r.boss ? FUNKEN.boss : FUNKEN.etappe; addFunken(n); G.funken = (G.funken || 0) + n; }   // Runde ist schon beendet → Bonus in der Ergebnisanzeige mitzählen
  if (chDone) award('reise' + (r.c + 1));
  const ch = REISE_CH[r.c], nx = reiseCurrent();
  let html = `<div class="card reise-res"><div class="rr-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>`;
  if (stars === 0) html += blitzSay('comfort', `<span>Fast! Mit mindestens 60 % schaffst du die Etappe. Probier’s nochmal – ich glaub an dich!</span>`, 56);
  else if (chDone && r.c === REISE_CH.length - 1) {   // Finale: alle Funken gesammelt
    award('reiseAll');
    html += `<div class="rr-final"><div class="rr-glow">${blitzSvg('cheer', 120)}</div><b>Rechen-Reise geschafft!</b></div>` + blitzSay('cheer', `<span>${esc(ch.done)}</span>`, 56)
      + `<div class="rr-album">${REISE_CH.map(x => `<span>${x.sticker}</span>`).join('')}</div><button class="btn block" id="rrCert">🏅 Große Urkunde</button>`;
  } else if (chDone) html += `<div class="rr-sticker">${ch.sticker}</div>` + blitzSay('cheer', `<b>${esc(ch.name)}</b> <span>geschafft!</span> <span>${esc(ch.done)}</span>`, 60)
    + '<button class="btn block" id="rrCert">🏅 Urkunde</button>';
  else html += blitzSay(first ? 'cheer' : 'happy', `<span>${first ? 'Etappe geschafft! Weiter geht’s.' : 'Stark – noch besser als vorher?'}</span>`, 56);
  html += `<button class="btn primary block" id="rrNext">${stars === 0 ? '↻ Nochmal versuchen' : nx.soon || nx.all ? '🗺️ Zur Karte' : '▶ Nächste Etappe'}</button>${stars && !(nx.soon || nx.all) || !stars ? '<button class="btn block" id="rrMap">🗺️ Zur Karte</button>' : ''}</div>`;
  setTimeout(() => {
    $('rrMap') && ($('rrMap').onclick = () => { goHome(); openSheet('reise', { c: r.c }); });
    $('rrNext') && ($('rrNext').onclick = () => { if (stars === 0) startReise(r.c, r.s); else if (nx.soon || nx.all) { goHome(); openSheet('reise'); } else startReise(nx.c, nx.s); });
    const fin = chDone && r.c === REISE_CH.length - 1;
    $('rrCert') && ($('rrCert').onclick = () => openSheet('cert', fin ? { line1: 'Die ganze Rechen-Reise geschafft – alle 6 Kapitel!', line2: `Alle Funken für Blitz gesammelt · Klasse ${reiseKlasse() || '–'}`, icon: '👑' }
      : { line1: `${ch.name} – Kapitel ${r.c + 1} geschafft`, line2: `Rechen-Reise mit Blitz · Klasse ${reiseKlasse() || '–'}`, icon: ch.sticker }));
    if (chDone) { Confetti.burst(fin ? 400 : 220); if (fin) setTimeout(() => Confetti.burst(300), 900); }
  }, 60);
  return html;
}

/* ---------- Karte ---------- */
function reiseMap(c) {
  const ch = REISE_CH[c], W = 340, H = 300, pts = [[60, 246], [210, 226], [292, 170], [160, 134], [62, 86], [214, 46]];
  const cur = reiseCurrent();
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  let deco = '';
  for (let i = 0; i < 14; i++) { const x = (mvHash(ch.id + i) * W) | 0, y = (mvHash(ch.id + i + 'y') * H) | 0; deco += `<text x="${x}" y="${y}" font-size="${14 + (i % 3) * 5}" opacity=".55">${{ wald: '🌲', fluss: '〰️', hoehle: '💎', wolken: '☁️', vulkan: '🔥', schloss: '✨' }[ch.id] || '·'}</text>`; }
  const nodes = pts.map(([x, y], s) => {
    const stars = reiseStars(c, s), open = reiseUnlocked(c, s), here = cur.c === c && cur.s === s && !cur.soon && !cur.all, boss = s === REISE.N - 1;
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
    ${nodes}${bz ? `<g class="rn-bz" transform="translate(${bz[1] < 90 ? bz[0] + (bz[0] > 250 ? -76 : 26) : bz[0] - 22} ${bz[1] < 90 ? bz[1] - 26 : bz[1] - 66})">${blitzSvg('wave', 44)}</g>` : ''}</svg>`;
}

PANELS.reise = (o = {}) => {
  const st = reiseState();
  if (!reiseKlasse()) {
    return { title: '<span>🗺️</span> <span>Rechen-Reise</span>', html: `<div class="reise">${blitzSay('wave', '<b>Auf zur Reise!</b> In welche Klasse gehst du? Dann passen die Aufgaben genau zu dir.', 60)}
      <div class="chips big" id="rkK">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}">${k}</button>`).join('')}</div></div>`,
      init() { $('rkK').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.k = +b.dataset.v; save(); showPanel('reise'); renderHome(); }; } };
  }
  const cur = reiseCurrent(), c = Math.min(o.c ?? (cur.soon ? Math.max(0, cur.c - 1) : cur.c), REISE_CH.length - 1), ch = REISE_CH[c];
  const tabs = REISE_CH.map((x, i) => `<button class="rt ${i === c ? 'sel' : ''}${x.soon || (i > 0 && !reiseChapterDone(i - 1)) ? ' locked' : ''}" data-ch="${i}" aria-disabled="${!!(x.soon || (i > 0 && !reiseChapterDone(i - 1)))}"><span>${x.icon}</span><small>${i + 1}</small></button>`).join('');
  return { title: '<span>🗺️</span> <span>Rechen-Reise</span>', html: `<div class="reise">
    <div class="reise-tabs">${tabs}</div>
    <h3 class="reise-h">${esc(ch.name)} <span class="muted">· Kapitel ${c + 1}</span></h3>
    ${blitzSay(reiseChapterDone(c) ? 'cheer' : 'wave', `<span>${esc(reiseChapterDone(c) ? ch.done : ch.intro)}</span>`, 52)}
    <div class="reise-wrap">${reiseMap(c)}</div>
    ${!cur.soon && !cur.all && cur.c === c ? `<button class="btn primary block" id="rkGo">▶ ${cur.s === REISE.N - 1 ? 'Boss-Etappe spielen' : `Etappe ${cur.s + 1} spielen`}</button>` : ''}
    <div class="mlabel">Sticker-Album</div>
    <div class="rr-album small">${REISE_CH.map((x, i) => `<span class="${reiseChapterDone(i) ? '' : 'lock'}" title="${esc(x.name)}" data-stk="${i}" role="button" tabindex="0">${reiseChapterDone(i) ? x.sticker : '❔'}</span>`).join('')}</div>
    <p class="small muted" style="margin:0;text-align:center">⭐ ${reiseTotalStars()} Sterne gesammelt · Klasse ${reiseKlasse()} <button class="linkbtn" id="rkChange">ändern</button></p>
    ${reiseTotalStars() ? '<button class="linkbtn" id="rkReset" style="align-self:center">↺ Reise neu starten</button>' : ''}
    ${REISE_CH.slice(3).some(x => x.soon) ? '<p class="small muted" style="margin:0;text-align:center">Kapitel 4–6 kommen bald: Wolkenstadt, Feuerberg und Sternenschloss.</p>' : ''}</div>`,
    init() {
      $('sheetBody').querySelectorAll('.rt').forEach(b => b.onclick = () => {
        const i = +b.dataset.ch;
        if (!b.classList.contains('locked')) return showPanel('reise', { c: i });
        toast(REISE_CH[i].soon ? 'Dieses Kapitel kommt bald!' : `🔒 Schaff zuerst Kapitel ${i}: ${tr(REISE_CH[i - 1].name)}`, 2200);
      });
      $('sheetBody').querySelectorAll('.rn.lock').forEach(g => g.onclick = () => toast(`🔒 Schaff zuerst Etappe ${+g.dataset.st}`, 1800));
      $('sheetBody').querySelectorAll('[data-stk]').forEach(x => x.onclick = () => { const i = +x.dataset.stk; toast(reiseChapterDone(i) ? `${REISE_CH[i].sticker} ${tr(REISE_CH[i].name)}` : `❔ ${tr('Sticker für')} ${tr(REISE_CH[i].name)}`, 1800); });
      $('sheetBody').querySelectorAll('.rn.open').forEach(g => {
        const go = () => { Sound.step(); showPanel('reiseStation', { c, s: +g.dataset.st }, true); };
        g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      });
      $('rkGo') && ($('rkGo').onclick = () => showPanel('reiseStation', { c: cur.c, s: cur.s }, true));
      $('rkReset') && ($('rkReset').onclick = () => resetPart('reise', () => showPanel('reise')));
      $('rkChange').onclick = () => showPanel('reiseKlasse', { c }, true);
    } };
};
PANELS.reiseKlasse = ({ c } = {}) => {
  const st = reiseState(), cur = reiseKlasse();
  return { title: '<span>🗺️</span> <span>Klassenstufe</span>', html: `<div class="reise">${blitzSay('think', '<span>In welche Klasse gehst du? Deine Sterne bleiben erhalten, die Aufgaben passen sich an.</span>', 56)}
    <div class="chips big" id="rkK2">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<button data-v="${k}" class="${k === cur ? 'sel' : ''}" aria-pressed="${k === cur}">${k}</button>`).join('')}</div>
    <button class="btn block" id="rkCancel">Abbrechen</button></div>`,
    init() {
      const back = () => { Sheet.stack.pop(); showPanel('reise', { c }); };
      $('rkK2').onclick = e => { const b = e.target.closest('button'); if (!b) return; const k = +b.dataset.v; if (k !== cur) { st.k = k; save(); renderHome(); toast(`<span>🗺️</span> <span>Klasse ${k}</span>`); } back(); };
      $('rkCancel').onclick = back;
    } };
};
PANELS.reiseStation = ({ c, s }) => {
  const ch = REISE_CH[c], boss = s === REISE.N - 1, stars = reiseStars(c, s), tops = reiseStationTopics(c, s);
  const names = [...new Set(tops.map(([t]) => TOPICS[t].name))];
  return { title: `<span>${ch.icon}</span> <span>${boss ? 'Boss-Etappe' : `Etappe ${s + 1}`}</span>`, html: `<div class="reise">
    ${blitzSay(boss ? 'wow' : 'happy', `<span>${esc(ch.st[s])}</span>`, 60)}
    <div class="rs-info"><div><b>${boss ? (ch.boss || REISE.BOSS) : REISE.TASKS}</b><span>Aufgaben</span></div><div><b>${names.length > 3 ? 'Mix' : names.map(n => `<span>${esc(n)}</span>`).join(' + ')}</b><span>Thema</span></div><div><b>${stars ? '★'.repeat(stars) : '–'}</b><span>Bestes</span></div></div>
    <p class="small muted" style="margin:0">Ab 60 % richtig ist die Etappe geschafft – 80 % gibt zwei Sterne, 95 % drei.</p>
    <button class="btn primary block" id="rsGo">▶ Los geht’s</button></div>`,
    init() { $('rsGo').onclick = () => { closeSheet(); startReise(c, s); }; } };
};

/* ---------- Karte auf der Startseite ---------- */
function renderReiseCard() {
  const el = $('reiseCard'); if (!el) return;
  const cur = reiseCurrent(), ch = REISE_CH[cur.soon ? Math.max(0, cur.c - 1) : cur.c];
  el.hidden = false;
  const line = !reiseKlasse() ? 'Hilf Blitz, seine Funken einzusammeln!' : cur.all ? 'Alle Funken gesammelt! 👑' : cur.soon ? 'Kapitel 1–3 geschafft! Bald geht’s weiter.' : `${ch.name} · Etappe ${cur.s + 1}/${REISE.N}`;
  el.innerHTML = `<div class="ch-ico reise-ico" aria-hidden="true">${ch.icon}</div><div class="ch-txt"><b>Rechen-Reise</b><span>${esc(line)}${reiseTotalStars() ? ` · ⭐ ${reiseTotalStars()}` : ''}</span></div>
    <button class="btn small primary" id="reiseGo">${cur.soon || cur.all ? 'Karte' : 'Weiter'}</button>`;
  $('reiseGo').onclick = () => openSheet('reise');   // immer zuerst die Karte mit Weg und Blitz zeigen (Marcel 15.11.)
}
