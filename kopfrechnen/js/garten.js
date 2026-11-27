'use strict';
/* =====================================================================
   Rechenblitz – Rechengarten (Roadmap Tag 5, „gemütlich statt Druck“)
   Jede richtige Antwort ist ein Wassertropfen 💧, Pflanzen wachsen in 5 Stufen
   (Samen → Keim → Pflanze → Knospe → reif). Reife Pflanzen ernten → Funken, neue Samen.
   Nichts welkt, Pausen kosten nichts. Statt „Tage in Folge“ zählen „Tage diese Woche“.
   Eigene SVG-Zeichnungen, offline. Daten: S.garten (nur auf dem Gerät).
   ===================================================================== */
const PLANTS = [
  { id: 'karotte', name: 'Karotte', icon: '🥕', need: 20, unlock: 0 },
  { id: 'tulpe', name: 'Tulpe', icon: '🌷', need: 30, unlock: 0 },
  { id: 'sonne', name: 'Sonnenblume', icon: '🌻', need: 40, unlock: 0 },
  { id: 'erdbeere', name: 'Erdbeere', icon: '🍓', need: 35, unlock: 1 },
  { id: 'tomate', name: 'Tomate', icon: '🍅', need: 50, unlock: 3 },
  { id: 'kuerbis', name: 'Kürbis', icon: '🎃', need: 70, unlock: 6 },
  { id: 'apfel', name: 'Apfelbaum', icon: '🍎', need: 100, unlock: 10 },
];
const PLANT_BY = Object.fromEntries(PLANTS.map(p => [p.id, p]));
const GARTEN = { plots: 6, rain: 10, tank: 60, ernte: 15, beds: [0, 0, 0, 2, 5, 9] };   // ab wie vielen Ernten welches Beet frei ist

function gartenState() {
  if (!S.garten) S.garten = { plots: [{ t: 'karotte', w: 0 }, { t: 'tulpe', w: 0 }, { t: 'sonne', w: 0 }, null, null, null], seen: [0, 0, 0, 0, 0, 0], harvest: {}, total: 0, rr: 0, tank: 0, drops: {}, rainDay: '' };
  return S.garten;
}
const gartenHarvests = () => gartenState().total;
const bedOpen = i => gartenHarvests() >= GARTEN.beds[i];
function plantStage(pl) {
  if (!pl) return -1;
  const need = PLANT_BY[pl.t].need, r = pl.w / need;
  return r >= 1 ? 4 : r >= .7 ? 3 : r >= .4 ? 2 : r >= .12 ? 1 : 0;
}
/** Tropfen verteilen: reihum an alle wachsenden Pflanzen; ist nichts am Wachsen, sammelt die Regentonne (max. 60) */
function gartenWater(n) {
  if (!n || typeof S === 'undefined' || !S) return;
  const g = gartenState(), today = todayStr();
  g.drops[today] = (g.drops[today] || 0) + n;
  for (const k of Object.keys(g.drops)) if (k < dayStr(14)) delete g.drops[k];
  if (typeof G !== 'undefined' && G && !G.over) G.drops = (G.drops || 0) + n;
  for (let k = 0; k < n; k++) {
    const grow = g.plots.map((p, i) => p && plantStage(p) < 4 ? i : -1).filter(i => i >= 0);
    if (!grow.length) { g.tank = Math.min(GARTEN.tank, g.tank + 1); continue; }
    const i = grow[g.rr++ % grow.length]; g.plots[i].w++;
  }
}
/** Regen fürs Tagesziel (einmal am Tag) */
function gartenRain() {
  const g = gartenState(), t = todayStr();
  if (g.rainDay === t) return; g.rainDay = t; gartenWater(GARTEN.rain);
}
/** Tage mit Übung in dieser Woche (Mo–So) – keine Serie, keine Strafe */
function weekDays() {
  const k = (new Date().getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => i <= k ? dayStr(k - i) : null);
}
const weekCount = () => weekDays().filter(d => d && S.hist[d] && S.hist[d].n).length;

/* ---------- Zeichnungen (eigene SVGs) ---------- */
const GC = { stem: '#3f9b4b', leaf: '#56c46a', dark: '#2d7a3a', soil: '#8a5a33', soilD: '#6e4426' };
function plantSvg(t, st, ready) {
  const leaf = (x, y, r, s = 1) => `<ellipse cx="${x}" cy="${y}" rx="${7 * s}" ry="${3.4 * s}" transform="rotate(${r} ${x} ${y})" fill="${GC.leaf}"/>`;
  if (st < 0) return '';
  if (st === 0) return `<ellipse cx="0" cy="-2" rx="9" ry="4" fill="${GC.soilD}"/><ellipse cx="0" cy="-4" rx="3" ry="2.2" fill="#e8c27a"/>`;
  if (st === 1) return `<path d="M0 0 V-12" stroke="${GC.stem}" stroke-width="2.6" stroke-linecap="round"/>${leaf(-5, -12, -30, .8)}${leaf(5, -12, 30, .8)}`;
  const tree = t === 'apfel', h = tree ? [0, 0, 30, 44, 52][st] : [0, 0, 22, 32, 38][st];
  let s = tree
    ? `<path d="M0 0 V-${h}" stroke="#8a5a33" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-${h + 4}" r="${st >= 3 ? 20 : 13}" fill="${GC.leaf}"/><circle cx="-10" cy="-${h - 2}" r="${st >= 3 ? 12 : 8}" fill="${GC.dark}" opacity=".5"/>`
    : t === 'karotte' ? [-6, 0, 6].map(x => `<path d="M0 0 Q${x} -${h / 2} ${x * 1.6} -${h}" stroke="${GC.leaf}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`).join('')
    : t === 'kuerbis' || t === 'erdbeere' ? `<path d="M0 0 q-14 -6 -22 -2" stroke="${GC.stem}" stroke-width="2.2" fill="none"/>${leaf(-8, -10, -20, 1.3)}${leaf(8, -12, 25, 1.3)}${leaf(0, -18, 0, 1.1)}`
    : `<path d="M0 0 V-${h}" stroke="${GC.stem}" stroke-width="3" stroke-linecap="round"/>${leaf(-6, -h * .4, -30)}${leaf(6, -h * .55, 30)}`;
  if (st >= 3) {
    const big = st === 4;
    s += {
      sonne: big ? `<g transform="translate(0 -${h + 6})">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-10" rx="3.6" ry="7" fill="#ffc83d" transform="rotate(${i * 30})"/>`).join('')}<circle r="7" fill="#7a4a1d"/></g>` : `<circle cx="0" cy="-${h + 3}" r="5" fill="${GC.dark}"/>`,
      tulpe: big ? `<path d="M-8 -${h} q0 -14 8 -16 q8 2 8 16 q-8 6 -16 0z" fill="#ff5b7a"/><path d="M0 -${h + 16} q-3 8 0 14" stroke="#e03e62" stroke-width="1.5" fill="none"/>` : `<ellipse cx="0" cy="-${h + 4}" rx="4" ry="7" fill="#7fd08a"/>`,
      karotte: big ? `<path d="M-6 2 q6 18 12 0z" fill="#ff8a2a"/><path d="M-3 6 h5 M-2 10 h4" stroke="#d9530b" stroke-width="1"/>` : '',
      tomate: big ? `<circle cx="-6" cy="-${h * .5}" r="5" fill="#ef3b3b"/><circle cx="6" cy="-${h * .7}" r="5" fill="#ef3b3b"/><circle cx="-2" cy="-${h * .9}" r="4.5" fill="#ef3b3b"/>` : `<circle cx="-6" cy="-${h * .5}" r="3" fill="#9fdc7a"/><circle cx="6" cy="-${h * .7}" r="3" fill="#9fdc7a"/>`,
      erdbeere: big ? `<path d="M-14 -2 q-4 -10 2 -12 q6 2 2 12z" fill="#ef3b3b"/><path d="M14 -4 q-4 -10 2 -12 q6 2 2 12z" fill="#ef3b3b"/>` : `<circle cx="-12" cy="-6" r="3" fill="#fff"/><circle cx="12" cy="-8" r="3" fill="#fff"/>`,
      kuerbis: big ? `<ellipse cx="-12" cy="-8" rx="13" ry="10" fill="#ff8a2a"/><path d="M-12 -18 v-4" stroke="${GC.dark}" stroke-width="2.4"/><path d="M-18 -16 q0 8 2 16 M-6 -16 q0 8 -2 16" stroke="#d9530b" stroke-width="1.2" fill="none"/>` : `<circle cx="-14" cy="-4" r="4" fill="#ffc83d"/>`,
      apfel: big ? [[-10, -h - 6], [8, -h + 2], [2, -h - 14], [-4, -h + 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#ef3b3b"/>`).join('') : [[-8, -h - 6], [8, -h]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join(''),
    }[t] || '';
  }
  if (ready) s += `<g class="gp-spark"><path transform="translate(16 -${h + 20}) scale(1.6)" d="M0 0 l2 4 4 .5 -3 2.6 1 4 -4 -2.2 -4 2.2 1 -4 -3 -2.6 4 -.5z" fill="#ffc83d" stroke="#fff" stroke-width=".8"/></g>`;
  return s;
}
/** ganzer Garten als Bild (Tag/Nacht, 6 Beete in zwei Reihen) */
function gartenScene(anim = []) {
  const g = gartenState(), h = new Date().getHours(), night = h < 7 || h >= 20;
  const pos = [[62, 112], [180, 112], [298, 112], [62, 198], [180, 198], [298, 198]];
  const plots = pos.map(([x, y], i) => {
    const pl = g.plots[i], st = plantStage(pl), open = bedOpen(i), back = i < 3, sc = back ? .9 : 1.08;
    return `<g class="gp${open ? '' : ' lock'}${st === 4 ? ' ready' : ''}" data-p="${i}" role="button" tabindex="0" aria-label="${esc(open ? pl ? PLANT_BY[pl.t].name : 'Leeres Beet' : 'Gesperrtes Beet')}" transform="translate(${x} ${y})">
      <rect x="-54" y="-78" width="108" height="94" fill="#000" fill-opacity="0"/>
      <ellipse cx="0" cy="0" rx="${46 * sc}" ry="${12 * sc}" fill="${open ? GC.soil : '#b9a58f'}"/><ellipse cx="0" cy="-2" rx="${40 * sc}" ry="${8 * sc}" fill="${open ? GC.soilD : '#a8937c'}"/>
      ${open ? `<g class="gp-plant${anim.includes(i) ? ' grew' : ''}" transform="scale(${sc * 1.35})">${plantSvg(pl && pl.t, st, st === 4)}</g>${pl ? '' : `<text y="-8" text-anchor="middle" font-size="18">＋</text>`}` : `<text y="-6" text-anchor="middle" font-size="16">🔒</text>`}
      ${anim.includes(i) ? `<g class="gp-drops">${[-10, 0, 10].map((dx, k) => `<path d="M${dx} -70 q4 6 0 9 q-4 -3 0 -9z" fill="#5ab4ff" style="--k:${k}"/>`).join('')}</g>` : ''}</g>`;
  }).join('');
  return `<svg class="garten-svg" viewBox="0 0 360 230" role="group" aria-label="Rechengarten">
    <defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#1b2a5c' : '#9fd8ff'}"/><stop offset="1" stop-color="${night ? '#33497e' : '#d9f1ff'}"/></linearGradient></defs>
    <rect width="360" height="230" fill="url(#gsky)"/>
    ${night ? '<circle cx="318" cy="30" r="13" fill="#fff6d6"/><circle cx="324" cy="26" r="11" fill="#1b2a5c"/>' + [[40, 22], [120, 40], [200, 18], [260, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('') : '<circle class="g-sun" cx="318" cy="32" r="16" fill="#ffd54a"/><g fill="#fff" opacity=".9"><ellipse cx="70" cy="34" rx="22" ry="9"/><ellipse cx="88" cy="28" rx="15" ry="9"/><ellipse cx="200" cy="48" rx="18" ry="7"/></g>'}
    <path d="M0 78 q90 -18 180 0 t180 0 V230 H0z" fill="${night ? '#2f6b45' : '#7ccf6a'}"/>
    <path d="M0 150 q90 -10 180 0 t180 0 V230 H0z" fill="${night ? '#2a5f3d' : '#6cc05c'}"/>
    <g stroke="${night ? '#a88f73' : '#d9b48a'}" stroke-width="4" stroke-linecap="round">${Array.from({ length: 13 }, (_, i) => `<path d="M${6 + i * 29} 86 v-18"/>`).join('')}<path d="M4 74 H356" stroke-width="3"/></g>
    ${plots}
    <g transform="translate(150 22)">${blitzSvg('happy', 50)}</g>
    ${g.tank ? `<g transform="translate(322 214)"><rect x="-14" y="-26" width="28" height="26" rx="4" fill="#5a8dee"/><text x="0" y="-8" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">${g.tank}</text></g>` : ''}</svg>`;
}

/* ---------- Fenster ---------- */
PANELS.garten = (o = {}) => {
  const g = gartenState();
  const grew = g.plots.map((p, i) => p && plantStage(p) > (g.seen[i] ?? 0) ? i : -1).filter(i => i >= 0);
  g.plots.forEach((p, i) => g.seen[i] = plantStage(p)); save();
  const wk = weekDays(), wc = weekCount(), today = g.drops[todayStr()] || 0;
  const growing = g.plots.map((p, i) => [p, i]).filter(([p]) => p && plantStage(p) < 4);
  const ready = g.plots.filter(p => p && plantStage(p) === 4).length;
  const next = growing.sort((a, b) => (PLANT_BY[a[0].t].need - a[0].w) - (PLANT_BY[b[0].t].need - b[0].w))[0];
  const say = ready ? `<b>${ready === 1 ? 'Eine Pflanze ist reif!' : `${ready} Pflanzen sind reif!`}</b> <span>Tipp sie an zum Ernten.</span>`
    : next ? `<span>${PLANT_BY[next[0].t].icon}</span> <span>${esc(PLANT_BY[next[0].t].name)}</span> · <span>${PLANT_BY[next[0].t].need - next[0].w} Tropfen bis zur Ernte.</span> <span>Jede richtige Antwort gießt deinen Garten.</span>`
    : '<span>Tipp auf ein leeres Beet und pflanz einen Samen!</span>';
  return { title: '<span>🌻</span> <span>Rechengarten</span>', html: `<div class="garten">
    <div class="garten-wrap">${gartenScene(grew)}</div>
    ${blitzSay(ready ? 'cheer' : 'happy', say, 52)}
    <div class="g-stats"><div><b>💧 ${today}</b><span>Tropfen heute</span></div><div><b>🧺 ${g.total}</b><span>geerntet</span></div><div><b>🌱 ${wc}/7</b><span>Tage diese Woche</span></div></div>
    <div class="g-week" aria-label="Tage diese Woche">${wk.map((d, i) => { const on = d && S.hist[d] && S.hist[d].n, n = new Date(), lbl = new Date(n.getFullYear(), n.getMonth(), n.getDate() - (n.getDay() + 6) % 7 + i, 12).toLocaleDateString(locale(), { weekday: 'short' }); return `<div class="${on ? 'on' : ''}${d === todayStr() ? ' today' : ''}"><i>${on ? '🌱' : d ? '·' : ''}</i><small translate="no">${esc(lbl)}</small></div>`; }).join('')}</div>
    <p class="small muted" style="margin:0;text-align:center">Pausen sind okay – in deinem Garten welkt nichts. Er wartet geduldig auf dich.</p>
    ${Object.keys(g.harvest).length ? `<div class="mlabel">Erntekorb</div><div class="g-basket">${PLANTS.filter(p => g.harvest[p.id]).map(p => `<span>${p.icon}<b>${g.harvest[p.id]}</b></span>`).join('')}</div>` : ''}
    </div>`,
    init() {
      $('sheetBody').querySelectorAll('.gp').forEach(el => {
        const go = () => gartenTap(+el.dataset.p);
        el.onclick = go; el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      });
      if (grew.length) Sound.water();
    } };
};
function gartenTap(i) {
  const g = gartenState(), pl = g.plots[i];
  if (!bedOpen(i)) { toast(`<span>🔒</span> <span>Dieses Beet wird nach ${GARTEN.beds[i]} Ernten frei</span>`, 2200); return; }
  if (!pl) return showPanel('gartenSeed', { i }, true);
  const p = PLANT_BY[pl.t], st = plantStage(pl);
  if (st < 4) { toast(`<span>${p.icon}</span> <span>${esc(p.name)}</span> · <span>noch ${p.need - pl.w} Tropfen</span>`, 2000); return; }
  // ernten
  g.plots[i] = null; g.seen[i] = -1; g.total++; g.harvest[pl.t] = (g.harvest[pl.t] || 0) + 1;
  addFunken(GARTEN.ernte); award('garten1'); if (g.total >= 10) award('garten10');
  const fresh = PLANTS.find(x => x.unlock === g.total), bed = GARTEN.beds.indexOf(g.total);
  save(); Sound.milestone(); Confetti.burst(90); announceBadges(); renderHome();
  toast(`<span>${p.icon}</span> <span>${esc(p.name)}</span> <span>geerntet!</span> <span>+${GARTEN.ernte} 💫</span>`, 2200);
  if (fresh) setTimeout(() => toast(`<span>${fresh.icon}</span> <span>Neuer Samen:</span> <span>${esc(fresh.name)}</span>`, 2400), 2300);
  if (bed > 0) setTimeout(() => toast('<span>🪴</span> <span>Ein neues Beet ist frei!</span>', 2400), fresh ? 4800 : 2300);
  showPanel('gartenSeed', { i }, true);
}
PANELS.gartenSeed = ({ i }) => {
  const g = gartenState();
  return { title: '<span>🌱</span> <span>Samen pflanzen</span>', html: `<div class="garten">
    ${blitzSay('wave', '<span>Was soll in diesem Beet wachsen?</span>', 48)}
    <div class="g-seeds">${PLANTS.map(p => { const ok = g.total >= p.unlock; return `<button class="g-seed${ok ? '' : ' lock'}" data-seed="${p.id}" aria-disabled="${!ok}"><svg viewBox="-30 -64 60 72" width="54" height="64">${plantSvg(p.id, 4, false)}</svg><b>${esc(p.name)}</b><small>${ok ? `💧 ${p.need}` : `<span>🔒</span> <span>${p.unlock} Ernten</span>`}</small></button>`; }).join('')}</div>
    ${g.tank ? `<p class="small muted" style="margin:0;text-align:center">💧 <span>In der Regentonne warten ${g.tank} Tropfen – sie gießen den neuen Samen.</span></p>` : ''}</div>`,
    init() {
      $('sheetBody').querySelectorAll('[data-seed]').forEach(b => b.onclick = () => {
        const p = PLANT_BY[b.dataset.seed];
        if (g.total < p.unlock) { toast(`<span>🔒</span> <span>Wird nach ${p.unlock} Ernten frei</span>`, 2000); return; }
        g.plots[i] = { t: p.id, w: 0 }; g.seen[i] = 0;
        if (g.tank) { const t = g.tank; g.tank = 0; gartenWater(t); }
        save(); Sound.click(); renderHome();
        Sheet.stack.pop(); if (Sheet.stack.length) showPanel('garten'); else showPanel('garten', {}, true);
      });
    } };
};

/* ---------- Startseite + Ergebnis ---------- */
function renderGartenCard() {
  const el = $('gartenCard'); if (!el) return;
  const g = gartenState(), ready = g.plots.filter(p => p && plantStage(p) === 4).length, today = g.drops[todayStr()] || 0;
  el.hidden = false;
  el.innerHTML = `<div class="g-mini" aria-hidden="true">${g.plots.slice(0, 3).map(p => `<svg viewBox="-24 -60 48 66" width="34" height="46">${p ? plantSvg(p.t, plantStage(p), false) : ''}<ellipse cx="0" cy="0" rx="18" ry="5" fill="${GC.soil}"/></svg>`).join('')}</div>
    <div class="ch-txt"><b>Rechengarten</b><span>${ready ? `<span>🧺</span> <span>${ready === 1 ? 'Eine Pflanze ist reif!' : `${ready} Pflanzen sind reif!`}</span>` : today ? `<span>💧</span> <span>${today} Tropfen heute</span> · <span>🌱</span> <span>${weekCount()}/7 Tage diese Woche</span>` : '<span>Jede richtige Antwort gießt deine Pflanzen</span>'}</span></div>
    <button class="btn small${ready ? ' primary' : ''}" data-open="garten">${ready ? 'Ernten' : 'Ansehen'}</button>`;
}
function gartenResultHtml() {
  if (!G || !G.drops) return '';
  const g = gartenState(), ready = g.plots.filter(p => p && plantStage(p) === 4).length;
  return `<button class="card g-res" data-open="garten"><span class="g-res-i">💧</span><span><b>+${G.drops} Tropfen</b> <span>für deinen Garten</span>${ready ? ' · <span>🧺</span> <span>Ernte bereit!</span>' : ''}</span><span class="chev">›</span></button>`;
}
