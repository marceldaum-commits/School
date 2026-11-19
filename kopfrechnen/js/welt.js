'use strict';
/* =====================================================================
   Rechenblitz – Blitz-Welt (Marcel 15.11.: „leg alles um“)
   💫 Funken als Währung · 🎩 Garderobe für Blitz · 🏠 Blitz' Zimmer · 🍂 Jahreszeiten-Events
   Alles nur auf dem Gerät (Profil: S.funken, S.welt = { own:{}, wear:{}, deco:{} }).
   ===================================================================== */
const FUNKEN = { correct: 1, etappe: 10, boss: 25, sternbild: 15, solid: 3, raetsel: 10, goal: 10, start: 30 };

function weltState() {
  S.welt ||= { own: {}, wear: {}, deco: {} };
  if (S.funken == null) { S.funken = FUNKEN.start; }   // Startbonus für alle
  return S.welt;
}
/** Funken gutschreiben (auch in der laufenden Runde mitzählen) */
function addFunken(n) {
  if (!n || typeof S === 'undefined' || !S) return;
  weltState(); S.funken += n;
  if (typeof G !== 'undefined' && G && !G.over) G.funken = (G.funken || 0) + n;
  const el = $('sFunken'); if (el) el.textContent = S.funken;
}

/* ---------- Kleidungsstücke (SVG-Ebenen im Koordinatensystem von Blitz, 120 × 120) ---------- */
const OUTFITS = [
  { id: 'cap', slot: 'hat', name: 'Basecap', price: 30, svg: '<path d="M38 26 Q40 6 60 6 Q80 6 82 26 Z" fill="#2b7de0"/><path d="M60 24 Q84 22 98 28 Q80 31 60 28 Z" fill="#1d5fa8"/><circle cx="60" cy="7" r="2.5" fill="#ff7418"/>' },
  { id: 'brille', slot: 'eyes', name: 'Schlaue Brille', price: 40, svg: '<g fill="none" stroke="#101b43" stroke-width="2.6"><circle cx="49" cy="46" r="8.5"/><circle cx="71" cy="46" r="8.5"/><path d="M57.5 46 h5"/></g>' },
  { id: 'fliege', slot: 'neck', name: 'Fliege', price: 40, svg: '<path d="M44 71 L58 79 L44 89 Z M76 71 L62 79 L76 89 Z" fill="#e8501c" stroke="#b83a12" stroke-width="1.5" stroke-linejoin="round"/><circle cx="60" cy="79.5" r="4.6" fill="#b83a12"/>' },
  { id: 'zylinder', slot: 'hat', name: 'Zylinder', price: 80, svg: '<rect x="44" y="-2" width="32" height="24" rx="2" fill="#1b1b2f"/><rect x="34" y="20" width="52" height="6" rx="3" fill="#1b1b2f"/><rect x="44" y="14" width="32" height="5" fill="#e8501c"/>' },
  { id: 'trikot', slot: 'body', name: 'Fußball-Trikot', price: 90, svg: '<path d="M37 80 Q60 73 83 80 L86 104 Q60 117 34 104 Z" fill="#2b7de0"/><text x="60" y="103" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="sans-serif">10</text>' },
  { id: 'sternbrille', slot: 'eyes', name: 'Sternen-Brille', price: 100, svg: '<g fill="#ff5b9e" fill-opacity=".9" stroke="#c2185b" stroke-width="1.5"><path d="M49 35 l3.4 7 7.6 1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1z"/><path d="M71 35 l3.4 7 7.6 1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1z"/></g><path d="M58 46 h4" stroke="#c2185b" stroke-width="2"/>' },
  { id: 'zauber', slot: 'hat', name: 'Zauberhut', price: 150, svg: '<path d="M60 -16 L84 24 L36 24 Z" fill="#6d4bd8"/><ellipse cx="60" cy="24" rx="28" ry="5" fill="#5a3cc4"/><path d="M58 2 l2 4 4 .5 -3 2.5 1 4 -4 -2.3 -4 2.3 1 -4 -3 -2.5 4 -.5z M68 12 l1.4 2.8 2.8.4 -2 1.8 .6 2.8 -2.8 -1.6 -2.8 1.6 .6 -2.8 -2 -1.8 2.8 -.4z" fill="#ffc83d"/>' },
  { id: 'umhang', slot: 'back', name: 'Helden-Umhang', price: 200, svg: '<path d="M38 72 Q16 100 26 118 L94 118 Q104 100 82 72 Z" fill="#d93a2b"/><path d="M46 80 Q40 100 44 116" stroke="#b02a1d" stroke-width="3" fill="none"/>' },
  { id: 'astro', slot: 'hat', name: 'Astronauten-Helm', price: 250, svg: '<circle cx="60" cy="50" r="41" fill="#bfe3ff" fill-opacity=".22" stroke="#e6ebf6" stroke-width="4"/><path d="M36 30 Q46 16 62 15" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>' },
  { id: 'krone', slot: 'hat', name: 'Königskrone', price: 400, svg: '<path d="M38 24 L40 4 L50 15 L60 -2 L70 15 L80 4 L82 24 Z" fill="#ffc83d" stroke="#d99a00" stroke-width="1.5"/><circle cx="60" cy="13" r="3" fill="#e8501c"/><circle cx="46" cy="19" r="2" fill="#2b7de0"/><circle cx="74" cy="19" r="2" fill="#2b7de0"/>' },
  // nur in Jahreszeiten-Events erhältlich
  { id: 'pilzhut', slot: 'hat', name: 'Pilzhut', price: 40, event: 'herbst', svg: '<path d="M28 26 Q30 -2 60 -2 Q90 -2 92 26 Z" fill="#d93a2b"/><circle cx="46" cy="10" r="4.5" fill="#fff"/><circle cx="66" cy="5" r="4" fill="#fff"/><circle cx="78" cy="16" r="3.2" fill="#fff"/><circle cx="58" cy="17" r="2.5" fill="#fff"/>' },
  { id: 'muetze', slot: 'hat', name: 'Wintermütze', price: 40, event: 'winter', svg: '<path d="M36 28 Q38 0 60 0 Q82 0 84 28 Z" fill="#e23b3b"/><rect x="33" y="22" width="54" height="9" rx="4.5" fill="#fff"/><circle cx="60" cy="-1" r="6.5" fill="#fff"/>' },
  { id: 'schal', slot: 'neck', name: 'Ringelschal', price: 50, event: 'winter', svg: '<path d="M37 71 q23 13 46 0 l-3 9 q-20 9 -40 0z" fill="#e23b3b"/><path d="M44 76 l3 4 M53 79 l3 3 M64 79 l3 -3 M74 76 l3 -4" stroke="#fff" stroke-width="2.6"/><path d="M68 80 l5 19 l8 -2 l-4 -17z" fill="#e23b3b"/><path d="M70 88 l7 -2 M72 94 l7 -2" stroke="#fff" stroke-width="2.2"/>' },
  { id: 'party', slot: 'hat', name: 'Partyhut', price: 40, event: 'fasching', svg: '<path d="M60 -12 L75 24 L45 24 Z" fill="#2b7de0"/><path d="M53 6 L67 6 M49 15 L71 15" stroke="#ffc83d" stroke-width="3.2"/><circle cx="60" cy="-13" r="4.5" fill="#ff5b7a"/>' },
  { id: 'blumen', slot: 'hat', name: 'Blumenkranz', price: 40, event: 'ostern', svg: '<path d="M32 26 Q60 12 88 26" stroke="#2f9e5f" stroke-width="4" fill="none"/><g><circle cx="38" cy="22" r="5" fill="#ff8fa3"/><circle cx="50" cy="17" r="5" fill="#ffc83d"/><circle cx="62" cy="15" r="5" fill="#9b6dff"/><circle cx="74" cy="17" r="5" fill="#ff8fa3"/><circle cx="85" cy="22" r="5" fill="#ffc83d"/></g>' },
  { id: 'sonne', slot: 'eyes', name: 'Sonnenbrille', price: 50, event: 'sommer', svg: '<g fill="#101b43"><rect x="39" y="39" width="20" height="12" rx="5"/><rect x="61" y="39" width="20" height="12" rx="5"/><rect x="57" y="42" width="6" height="2.6"/></g><path d="M43 42 h6" stroke="#fff" stroke-width="1.6" opacity=".6"/>' },
];
const OUTFIT_BY = Object.fromEntries(OUTFITS.map(o => [o.id, o]));
const SLOTS = [['hat', '🎩', 'Hüte'], ['eyes', '👓', 'Brillen'], ['neck', '🎀', 'Hals'], ['body', '👕', 'Anzug'], ['back', '🦸', 'Umhang']];
/** Ebene für Blitz' Zeichnung (blitz.js ruft das auf) */
function bzLayer(slot, outfit) {
  const wear = outfit || (typeof S !== 'undefined' && S && S.welt ? S.welt.wear : {});
  const o = OUTFIT_BY[wear[slot]];
  return o && o.slot === slot ? `<g class="bz-out bz-${slot}">${o.svg}</g>` : '';
}

/* ---------- Jahreszeiten-Events ---------- */
const EVENTS = [
  { id: 'herbst', icon: '🍂', name: 'Herbstzeit', from: '09-22', to: '11-30' },
  { id: 'winter', icon: '❄️', name: 'Winterzauber', from: '12-01', to: '01-06' },
  { id: 'fasching', icon: '🎭', name: 'Fasching', from: '02-01', to: '03-04' },
  { id: 'ostern', icon: '🐣', name: 'Frühlingsfest', from: '03-20', to: '04-30' },
  { id: 'sommer', icon: '☀️', name: 'Sommerferien', from: '07-01', to: '09-10' },
];
function eventNow(d = new Date()) {
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return EVENTS.find(e => e.from <= e.to ? md >= e.from && md <= e.to : md >= e.from || md <= e.to) || null;
}
const eventEnd = e => { const [m, d] = e.to.split('-').map(Number); return `${d}.${m}.`; };
const buyable = o => !o.event || (eventNow() && eventNow().id === o.event);

/* ---------- Zimmer-Deko ---------- */
const DECO = [
  { id: 'pflanze', icon: '🪴', name: 'Zimmerpflanze', price: 20, x: 26, y: 186, s: 34 },
  { id: 'lampe', icon: '💡', name: 'Leselampe', price: 25, x: 318, y: 66, s: 26 },
  { id: 'teppich', icon: '', name: 'Bunter Teppich', price: 40, rug: true },
  { id: 'globus', icon: '🌍', name: 'Globus', price: 50, x: 300, y: 196, s: 28 },
  { id: 'aquarium', icon: '🐠', name: 'Aquarium', price: 60, tank: true },
  { id: 'gitarre', icon: '🎸', name: 'Gitarre', price: 70, x: 268, y: 200, s: 34 },
  { id: 'rakete', icon: '🚀', name: 'Raketen-Modell', price: 80, x: 176, y: 64, s: 26 },
  { id: 'katze', icon: '🐈', name: 'Katze Pixel', price: 120, x: 230, y: 214, s: 30 },
];
const DECO_BY = Object.fromEntries(DECO.map(d => [d.id, d]));

function weltRoom() {
  const w = weltState(), own = id => !!w.deco[id], night = new Date().getHours() >= 19 || new Date().getHours() < 7;
  const stickers = typeof REISE_CH !== 'undefined' ? REISE_CH.filter((_, i) => reiseChapterDone(i)).map(c => c.sticker) : [];
  const nBadges = Object.keys(S.badges || {}).length, solid = typeof merkSolidAll === 'function' ? merkSolidAll() : 0, ev = eventNow();
  let stars = ''; for (let i = 0; i < Math.min(14, solid); i++) stars += `<circle cx="${32 + (i * 37) % 76}" cy="${30 + (i * 23) % 44}" r="${1 + (i % 3) * .5}" fill="#ffc83d"/>`;
  return `<svg class="room" viewBox="0 0 360 240" role="img" aria-label="Blitz' Zimmer">
    <defs><linearGradient id="rmW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9d1"/><stop offset="1" stop-color="#ffd9b3"/></linearGradient></defs>
    <rect width="360" height="170" fill="url(#rmW)"/><rect y="170" width="360" height="70" fill="#c98b5a"/><rect y="168" width="360" height="5" fill="#a86b3f"/>
    <g><rect x="22" y="22" width="96" height="70" rx="6" fill="${night ? '#121a4a' : '#9fd3ff'}" stroke="#fff" stroke-width="5"/>${night ? stars : '<circle cx="96" cy="40" r="10" fill="#ffd54a"/>'}<path d="M70 22 v70 M22 57 h96" stroke="#fff" stroke-width="3"/>
      ${ev ? `<text x="30" y="88" font-size="14">${ev.icon}</text><text x="100" y="40" font-size="12">${ev.icon}</text>` : ''}</g>
    ${solid ? '<text x="124" y="160" font-size="34">🔭</text>' : ''}
    <g><rect x="208" y="34" width="132" height="8" rx="3" fill="#8a5a33"/><rect x="208" y="88" width="132" height="8" rx="3" fill="#8a5a33"/>
      <text x="214" y="32" font-size="20">${stickers.slice(0, 6).join(' ') || ''}</text>
      <text x="214" y="86" font-size="18">${'🏆'.repeat(Math.min(6, Math.ceil(nBadges / 4)))}</text>
      ${!stickers.length ? '<text x="216" y="29" font-size="10" fill="#8a5a33">Sticker aus der Rechen-Reise</text>' : ''}</g>
    ${own('teppich') ? '<ellipse cx="180" cy="210" rx="92" ry="20" fill="#7a5cff" opacity=".85"/><ellipse cx="180" cy="210" rx="70" ry="13" fill="#ffc83d" opacity=".8"/><ellipse cx="180" cy="210" rx="44" ry="7" fill="#ff7418" opacity=".8"/>' : ''}
    ${own('aquarium') ? '<rect x="24" y="112" width="62" height="42" rx="5" fill="#9fd3ff" stroke="#5a8dee" stroke-width="3"/><rect x="24" y="154" width="62" height="14" fill="#8a5a33"/><text x="32" y="142" font-size="17">🐠</text><text x="58" y="132" font-size="12">🫧</text>' : ''}
    ${DECO.filter(d => own(d.id) && d.x).map(d => `<text x="${d.x}" y="${d.y}" font-size="${d.s}">${d.icon}</text>`).join('')}
    <g transform="translate(118 92)">${blitzSvg('wave', 124)}</g></svg>`;
}

/* ---------- Laden (Garderobe + Zimmer) ---------- */
PANELS.welt = (o = {}) => {
  const w = weltState(), tab = o.tab || 'hat', ev = eventNow();
  const tabs = [...SLOTS, ['room', '🏠', 'Zimmer']].map(([id, ic, nm]) => `<button class="${id === tab ? 'sel' : ''}" data-tab="${id}" aria-label="${esc(nm)}"><span>${ic}</span><small>${esc(nm)}</small></button>`).join('');
  const items = tab === 'room' ? DECO.map(d => ({ ...d, kind: 'deco' })) : OUTFITS.filter(x => x.slot === tab && (buyable(x) || w.own[x.id])).map(x => ({ ...x, kind: 'outfit' }));
  const card = it => {
    const owned = it.kind === 'deco' ? !!w.deco[it.id] : !!w.own[it.id], worn = it.kind === 'outfit' && w.wear[it.slot] === it.id;
    const pic = it.kind === 'outfit' ? blitzSvg('happy', 74, { [it.slot]: it.id }) : `<span class="shop-emoji">${it.rug ? '🟪' : it.tank ? '🐠' : it.icon}</span>`;
    const btn = worn ? '<span class="shop-tag on">✓ An</span>' : owned ? (it.kind === 'outfit' ? '<span class="shop-tag">Anziehen</span>' : '<span class="shop-tag on">✓ Im Zimmer</span>')
      : `<span class="shop-price ${S.funken >= it.price ? '' : 'poor'}">💫 ${it.price}</span>`;
    return `<button class="shop-item ${worn ? 'worn' : ''}" data-item="${it.id}" data-kind="${it.kind}">${it.event ? `<span class="shop-ev">${esc(EVENTS.find(e => e.id === it.event).icon)} <span>Nur jetzt</span></span>` : ''}${pic}<b>${esc(it.name)}</b>${btn}</button>`;
  };
  return { title: '<span>🎩</span> <span>Blitz-Welt</span>', html: `<div class="welt">
    <div class="welt-top"><div class="welt-bz">${tab === 'room' ? '' : blitzSvg('happy', 110)}</div>${tab === 'room' ? `<div class="room-wrap">${weltRoom()}</div>` : ''}
      ${tab === 'room' ? '' : `<div class="welt-funken"><b>💫 ${S.funken}</b><span>Funken</span></div>`}</div>
    ${tab === 'room' ? `<div class="welt-funken-line"><b>💫 ${S.funken}</b> <span>Funken</span></div>` : ''}
    ${ev ? `<div class="welt-ev">${ev.icon} <b>${esc(ev.name)}</b> – <span>Sonder-Outfit nur bis ${eventEnd(ev)}</span></div>` : ''}
    <div class="welt-tabs">${tabs}</div>
    <div class="shop-grid">${items.map(card).join('')}</div>
    ${tab !== 'room' && w.wear[tab] ? `<button class="linkbtn" id="weltOff" style="align-self:center">${tab === 'hat' ? 'Hut' : 'Teil'} ausziehen</button>` : ''}
    <p class="small muted" style="margin:0;text-align:center">Funken gibt es für jede richtige Antwort, Etappen der Rechen-Reise, Sternbilder, das Rätsel des Tages und das Tagesziel.</p></div>`,
    init() {
      const body = $('sheetBody'), keep = () => body.parentElement.scrollTop, re = (t, sc) => { showPanel('welt', { tab: t }); body.parentElement.scrollTop = sc; };
      body.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { Sound.click(); showPanel('welt', { tab: b.dataset.tab }); });
      body.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
        const id = b.dataset.item, kind = b.dataset.kind, it = kind === 'deco' ? DECO_BY[id] : OUTFIT_BY[id], sc = keep();
        if (kind === 'outfit' && w.own[id]) { w.wear[it.slot] = w.wear[it.slot] === id ? null : id; save(); Sound.click(); renderHome(); return re(tab, sc); }
        if (kind === 'deco' && w.deco[id]) { toast(`${it.icon || '✨'} ${tr('Steht schon in Blitz\' Zimmer')}`); return; }
        if (S.funken < it.price) { toast(`Dir fehlen noch 💫 ${it.price - S.funken} Funken`); Sound.wrong && Sound.wrong(); return; }
        if (!confirm(`${tr(it.name)} – ${tr(`Für ${it.price} Funken kaufen?`)}`)) return;
        S.funken -= it.price;
        if (kind === 'deco') w.deco[id] = todayStr(); else { w.own[id] = todayStr(); w.wear[it.slot] = id; }
        save(); Sound.milestone(); Confetti.burst(80); award('shop'); announceBadges(); renderHome();
        toast(kind === 'deco' ? `<span>${esc(it.icon || '✨')}</span> <span>Neu in Blitz' Zimmer!</span>` : '<span>✨ Blitz hat ein neues Outfit!</span>', 1800);
        re(tab, sc);
      });
      $('weltOff') && ($('weltOff').onclick = () => { w.wear[tab] = null; save(); renderHome(); re(tab, keep()); });
    } };
};
