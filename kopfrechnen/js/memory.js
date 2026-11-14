'use strict';
/* =====================================================================
   Rechenblitz – Merk-Training (verteilte Wiederholung, Roadmap Tag 1, 14.11.2026)
   Jede Kernaufgabe (Einmaleins, Plus bis 20, Quadratzahlen, Brüche …) hat eine
   Merkstärke (Kasten 0–6). Richtig und flott → nächster Kasten, die Aufgabe kommt
   später wieder (0, 1, 2, 4, 8, 16, 32 Tage). Falsch → zurück auf „heute“.
   „Heute wiederholen“ ist eine kurze Runde (höchstens 3 Minuten / 20 Aufgaben).
   Ab Kasten 4 (8 Tage) gilt eine Aufgabe als „sitzt fest“.
   Gespeichert pro Profil in S.merk (nur auf dem Gerät).
   ===================================================================== */
const MERK = {
  INT: [0, 1, 2, 4, 8, 16, 32],     // Tage bis zur nächsten Wiederholung je Kasten
  SOLID: 4,                          // ab diesem Kasten „sitzt fest“
  NEW_PER_DAY: 6,                    // neue Aufgaben pro Tag (nicht überfordern)
  MAX: 20,                           // Aufgaben pro Runde
  MS: 180000,                        // Rundenlänge: 3 Minuten
};

const BD = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [1, 10], [3, 10], [7, 10], [1, 20], [1, 25], [1, 50]];
const BP = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 10], [3, 10], [1, 20], [1, 25], [1, 50], [1, 100], [1, 8], [3, 8], [1, 3], [2, 3]];
const pctOf = (n, d) => Q(n * 100, d);
// Erweitern auf 10, 100 oder 1000 (für den Lösungsweg)
const tenPow = d => [10, 100, 1000].find(p => p % d === 0);

const MERK_DECKS = [
  { id: 'plus', icon: '➕', name: 'Plus bis 20', k: [1, 2],
    keys: () => { const r = []; for (let s = 2; s <= 20; s++) for (let a = 1; a <= Math.min(10, s - 1); a++) { const b = s - a; if (b >= a && b <= 10) r.push(`plus:${a}:${b}`); } return r; },
    task: (a, b) => { if (coin()) [a, b] = [b, a]; return { topic: 'add', lvl: 0, e: [N(a), O('+'), N(b)], a: I(a + b), w: addW(a, b) }; } },
  { id: 'ee', icon: '✖️', name: 'Einmaleins', k: [2, 3, 4, 5],
    keys: () => { const r = []; for (const set of [[2, 5, 10], [3, 4, 6, 9], [7, 8]]) for (let b = 2; b <= 10; b++) for (const a of set) if (a <= b && !r.includes(`ee:${a}:${b}`)) r.push(`ee:${a}:${b}`); for (let a = 2; a <= 10; a++) for (let b = a; b <= 10; b++) if (!r.includes(`ee:${a}:${b}`)) r.push(`ee:${a}:${b}`); return r; },
    task: (a, b) => { if (coin()) [a, b] = [b, a]; return { topic: 'mul', lvl: 1, e: [N(a), O('·'), N(b)], a: I(a * b), w: mulW(a, b), fact: factKey(a, b) }; } },
  { id: 'div', icon: '➗', name: 'Geteilt im Einmaleins', k: [3, 4, 5, 6],
    keys: () => { const r = []; for (let a = 2; a <= 10; a++) for (let b = a; b <= 10; b++) r.push(`div:${a}:${b}`); return r; },
    task: (a, b) => { if (coin()) [a, b] = [b, a]; return { topic: 'div', lvl: 1, e: [N(a * b), O(':'), N(b)], a: I(a), w: divW(a * b, b), fact: factKey(a, b) }; } },
  { id: 'sq', icon: '²', name: 'Quadratzahlen bis 20', k: [6, 7, 8, 9, 10],
    keys: () => Array.from({ length: 10 }, (_, i) => `sq:${i + 11}`),
    task: n => ({ topic: 'pow', lvl: 2, e: [P(n, 2)], a: I(n * n), w: [`${n}² = ${n} · ${n}`, `${n} · 10 + ${n} · ${n - 10} = ${n * 10} + ${n * (n - 10)}`, `= ${n * n}`] }) },
  { id: 'bd', icon: '½', name: 'Brüche als Dezimalzahl', k: [6, 7, 8, 9, 10],
    keys: () => BD.map(([n, d]) => `bd:${n}:${d}`),
    task: (n, d) => { const p = tenPow(d), m = p / d; return { topic: 'dec', lvl: 4, e: [F(n, d)], a: De(n, d), form: 'dec', hint: 'Als Dezimalzahl', w: [`Erweitere auf ${p}: ${n}/${d} = ${n * m}/${p}`, `${n * m}/${p} = ${showAns(De(n, d))}`] }; } },
  { id: 'bp', icon: '%', name: 'Brüche als Prozent', k: [7, 8, 9, 10],
    keys: () => BP.map(([n, d]) => `bp:${n}:${d}`),
    task: (n, d) => { const q = pctOf(n, d), a = q.d === 1 ? I(q.n) : De(q.n, q.d), p = tenPow(d);
      return { topic: 'pct', lvl: 2, e: [F(n, d)], a, unit: '%', w: p && p <= 100 ? [`Erweitere auf 100: ${n}/${d} = ${n * 100 / d}/100`, `${n * 100 / d}/100 = ${n * 100 / d} %`] : [`${n}/${d} = ${n} : ${d} · 100 %`, `= ${showAns(a)} %`] }; } },
];
const MERK_BY = Object.fromEntries(MERK_DECKS.map(d => [d.id, d]));

function merkState() {
  S.merk ||= { c: {}, decks: null, newDay: '', newCount: 0 };
  if (S.merk.newDay !== todayStr()) { S.merk.newDay = todayStr(); S.merk.newCount = 0; }
  return S.merk;
}
/** Aktive Stapel: selbst gewählt oder passend zur Klassenstufe */
function merkDecks() {
  const st = merkState();
  if (st.decks && st.decks.length) return st.decks.filter(id => MERK_BY[id]);
  const k = S.settings.klasse || 0;
  if (!k) return ['ee', 'div'];
  const fit = MERK_DECKS.filter(d => d.k.includes(k)).map(d => d.id);
  return fit.length ? fit : ['ee'];
}
const merkKeys = (decks = merkDecks()) => decks.flatMap(id => MERK_BY[id].keys());
const merkDue = c => c && c.due <= todayStr();
function merkStats(decks = merkDecks()) {
  const st = merkState(), keys = merkKeys(decks);
  let due = 0, solid = 0, learning = 0, fresh = 0, tomorrow = 0, week = 0;
  const t1 = dayStr(-1), t7 = dayStr(-7);
  for (const k of keys) {
    const c = st.c[k];
    if (!c) { fresh++; continue; }
    if (c.b >= MERK.SOLID) solid++; else learning++;
    if (merkDue(c)) due++; else if (c.due <= t1) tomorrow++; else if (c.due <= t7) week++;
  }
  const newToday = Math.max(0, Math.min(fresh, MERK.NEW_PER_DAY - st.newCount));
  return { total: keys.length, due, solid, learning, fresh, newToday, tomorrow, week, todo: Math.min(MERK.MAX, due + newToday) };
}
/** Alle „sitzt fest“-Aufgaben über alle Stapel (für Abzeichen und Menü) */
const merkSolidAll = () => Object.values(merkState().c).filter(c => c.b >= MERK.SOLID).length;

function merkTask(key) {
  const [id, ...nums] = key.split(':'), t = MERK_BY[id].task(...nums.map(Number));
  t.card = key;
  return t;
}
/** Runde zusammenstellen: fällige zuerst (schwächste zuerst), dann ein paar neue */
function merkQueue() {
  const st = merkState(), keys = merkKeys();
  const due = keys.filter(k => merkDue(st.c[k])).sort((x, y) => st.c[x].b - st.c[y].b || (st.c[x].due < st.c[y].due ? -1 : 1));
  // neue Aufgaben abwechselnd aus allen gewählten Stapeln (jeweils in sinnvoller Reihenfolge)
  const pools = merkDecks().map(id => MERK_BY[id].keys().filter(k => !st.c[k])), fresh = [];
  for (let i = 0; fresh.length < Math.max(0, MERK.NEW_PER_DAY - st.newCount) && pools.some(x => x.length); i++) { const x = pools[i % pools.length]; if (x.length) fresh.push(x.shift()); }
  const q = due.slice(0, MERK.MAX);
  for (const k of fresh) if (q.length < MERK.MAX) q.splice(Math.min(q.length, 1 + Math.floor(rand() * (q.length + 1))), 0, k);
  return q;
}
/** Antwort verbuchen; gibt den neuen Kasten zurück */
function merkAnswer(key, ok, dt) {
  const st = merkState();
  let c = st.c[key];
  if (!c) { c = st.c[key] = { b: 0, n: 0, ok: 0, due: todayStr() }; st.newCount++; }
  const slow = dt > (/^b[dp]:/.test(key) ? 12000 : 6000);
  c.n++;
  const before = c.b;
  if (ok) { c.ok++; c.b = slow || (G && G.merkTip) ? Math.max(c.b, 1) : Math.min(c.b + 1, MERK.INT.length - 1); }
  else c.b = 0;
  if (G_MERK) { G_MERK.rose ||= new Set(); G_MERK.intro ||= new Set(); }
  if (G_MERK && c.b > before) G_MERK.rose.add(key);
  if (G_MERK && c.b >= MERK.SOLID && before < MERK.SOLID) G_MERK.solidNow = key;
  if (c.b >= MERK.SOLID && before < MERK.SOLID) {   // ganzes Sternbild geschafft?
    const cs = merkConstOf(key);
    if (cs && merkConstDone(cs) && !(st.consts ||= {})[cs.id]) { st.consts[cs.id] = todayStr(); if (G_MERK) (G_MERK.consts ||= []).push(cs.id); award('sternbild'); }
  }
  c.due = dayStr(-MERK.INT[c.b]);
  if (merkSolidAll() >= 25) award('merk25');
  return c.b;
}
/** Fehler im normalen Training zählen auch: die Aufgabe wird wieder „heute“ fällig */
function merkFromPlay(t, ok) {
  if (t.card || ok || !t.fact) return;
  const st = merkState(), [a, b] = t.fact.split('x'), k = (t.topic === 'div' ? 'div' : 'ee') + `:${a}:${b}`;
  if (st.c[k]) { st.c[k].b = 0; st.c[k].due = todayStr(); }
}

/* ---------- Runde starten ---------- */
function startMerk() {
  const q = merkQueue();
  if (!q.length) { openSheet('merk'); return; }
  const before = merkSolidAll(), seen = {};
  let pos = 0;
  G_MERK = { before, start: Date.now(), queue: q, rose: new Set(), intro: new Set() };
  const gen = () => {
    if (pos >= q.length || (Date.now() - G_MERK.start > MERK.MS && G.correct + G.wrong >= 5)) { G.total = G.idx; return null; }
    const k = q[pos++]; seen[k] = (seen[k] || 0) + 1;
    return merkTask(k);
  };
  gen.requeue = key => { if ((seen[key] || 0) < 2) { q.splice(Math.min(q.length, pos + 3), 0, key); G.total++; } };
  startGame('merk', { gen, op: 'mix', lvl: 1, title: 'Merk-Training' });
  G.total = q.length;
  updateHud();
}
let G_MERK = null;

function merkResultHtml() {
  const s = merkStats(), now = merkSolidAll(), plus = Math.max(0, now - (G_MERK ? G_MERK.before : now));
  const up = G_MERK && G_MERK.rose ? G_MERK.rose.size : 0;
  const nc = (G_MERK && G_MERK.consts || []).map(id => MERK_CONSTS.find(c => c.id === id)).filter(Boolean);
  const constHtml = nc.map(c => `<div class="const-new"><span class="ci">${c.icon}</span><div><small>Neues Sternbild entdeckt!</small><b>${esc(c.name)}</b></div></div>`).join('');
  return `${constHtml}<div class="card merk-res"><div class="sky-wrap">${merkSky({ rose: G_MERK ? G_MERK.rose : null })}</div>
    <div class="mr-txt"><b>${up ? `✨ ${up} Sterne heller` : '🌙 Dein Merk-Himmel'}</b><span>${now} Aufgaben sitzen fest${plus ? ` (+${plus})` : ''} · ${s.due ? `Heute noch ${s.due} zu wiederholen` : s.tomorrow ? `Nächste Wiederholung morgen: ${s.tomorrow} Aufgaben` : 'Für heute alles wiederholt'}</span></div></div>`;
}

/* ---------- Karte auf der Startseite ---------- */
function renderMerkCard() {
  const el = $('merkCard'); if (!el) return;
  const s = merkStats(), solidAll = merkSolidAll();
  el.hidden = false;
  const line = s.todo ? `${s.todo} Aufgaben · ca. 3 Minuten` : s.tomorrow ? `Alles wiederholt ✓ · morgen ${s.tomorrow}` : 'Alles wiederholt ✓';
  el.innerHTML = `<div class="ch-ico merk-ico" aria-hidden="true">${MERK_ICON}</div><div class="ch-txt"><b>Merk-Training</b><span>${line}${solidAll ? ` · ${solidAll} sitzen fest` : ''}</span></div>
    ${s.todo ? '<button class="btn small primary" id="merkGo">Los</button>' : '<button class="btn small" id="merkInfo">Ansehen</button>'}`;
  $('merkGo') && ($('merkGo').onclick = startMerk);
  $('merkInfo') && ($('merkInfo').onclick = () => openSheet('merk'));
}

/* ---------- Übersicht im Menü ---------- */
PANELS.merk = () => {
  const act = merkDecks(), s = merkStats(), k = S.settings.klasse || 0;
  const rows = MERK_DECKS.map(d => {
    const on = act.includes(d.id), ds = merkStats([d.id]), pS = ds.solid / ds.total * 100, pL = ds.learning / ds.total * 100;
    return `<button class="merk-deck ${on ? 'on' : ''}" data-deck="${d.id}" role="switch" aria-checked="${on}">
      <span class="md-ico">${d.icon}</span><span class="md-txt"><b>${d.name}</b>
      <span class="md-bar"><i class="s" style="width:${pS}%"></i><i class="l" style="width:${pL}%"></i></span>
      <small>${ds.solid} von ${ds.total} sitzen fest${ds.due ? ` · ${ds.due} heute` : ''}</small></span>
      <span class="switch ${on ? 'on' : ''}"></span></button>`;
  }).join('');
  return { title: 'Merk-Training', html: `<div class="merk">
    <div class="sky-wrap">${merkSky()}</div>
    <p class="small muted" style="margin:0">Jede Aufgabe ist ein Stern. Je besser sie sitzt, desto heller leuchtet er – ganze Reihen werden zu Sternbildern.</p>
    <p class="small muted" style="margin:0">Was du sicher kannst, kommt seltener. Was noch wackelt, kommt öfter – genau dann, wenn du es sonst vergessen würdest.</p>
    <div class="merk-sum"><div><b>${merkSolidAll()}</b><span>sitzen fest</span></div><div><b>${s.due}</b><span>heute fällig</span></div><div><b>${s.tomorrow}</b><span>morgen</span></div></div>
    <button class="btn primary block" id="merkStart" ${s.todo ? '' : 'disabled'}>${s.todo ? `▶ Heute wiederholen (${s.todo})` : 'Für heute alles geschafft ✓'}</button>
    <div class="mlabel">Sternbilder-Album <span class="muted">(${MERK_CONSTS.filter(c => merkState().consts?.[c.id]).length}/${MERK_CONSTS.length})</span></div>
    <div class="const-album">${MERK_CONSTS.filter(c => act.includes(c.deck)).map(c => { const done = !!merkState().consts?.[c.id], n = merkConstCount(c);
      return `<div class="const-card ${done ? 'done' : ''}"><span class="ci">${done ? c.icon : '❔'}</span><b>${done ? esc(c.name) : '???'}</b><small>${n}/${c.keys.length}</small></div>`; }).join('')}</div>
    <div class="mlabel">Was willst du dir merken?${!merkState().decks && k ? ` <span class="muted">(passend zu Klasse ${k})</span>` : ''}</div>
    ${rows}
    <p class="small muted" style="margin:0">Fehler aus anderen Runden zählen mit: Was du dort falsch hattest, kommt hier wieder dran.</p></div>`,
    init() {
      $('merkStart').onclick = () => { closeSheet(); startMerk(); };
      $('sheetBody').querySelectorAll('[data-deck]').forEach(b => b.onclick = () => {
        const st = merkState(), cur = merkDecks(), id = b.dataset.deck;
        let next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
        if (!next.length) return toast('Mindestens ein Stapel bleibt an');
        st.decks = MERK_DECKS.map(d => d.id).filter(x => next.includes(x)); save(); Sound.click();
        const sc = $('sheetBody').parentElement.scrollTop; showPanel('merk'); $('sheetBody').parentElement.scrollTop = sc; renderHome();
      });
    } };
};

/** Anzeige oben im Aufgabenfenster: Merkstärke als Punkte */
function merkTag(key) {
  const c = merkState().c[key];
  if (!c) return 'Neu ✨';
  return `Merkstärke ${c.b}/${MERK.INT.length - 1}`;
}

/* ---------- Erlebbar: Merk-Moment, Bild-Tipp, Effekte (Marcel 14.11.) ---------- */
/** Vor jeder Aufgabe im Merk-Training: neue Aufgaben erst zeigen, sonst Bild-Tipp anbieten */
function merkBeforeTask(t) {
  G.merkTip = false;
  $('taskBox').classList.remove('flipin'); void $('taskBox').offsetWidth; $('taskBox').classList.add('flipin');
  G_MERK ||= { before: merkSolidAll(), start: Date.now() }; G_MERK.rose ||= new Set(); G_MERK.intro ||= new Set();
  const c = merkState().c[t.card];
  if (!c && !G_MERK.intro.has(t.card)) { G_MERK.intro.add(t.card); return merkOverlay(t, true); }
  if (!c || c.b <= 1) $('hint').insertAdjacentHTML('beforeend', ' <button class="mtip" id="mTip">💡 Bild-Tipp</button>');
  $('mTip') && ($('mTip').onclick = e => { e.stopPropagation(); G.merkTip = true; merkOverlay(t, false); });
}
/** Overlay im Aufgabenfenster: Merk-Moment (mit Lösung) oder Bild-Tipp (ohne Lösung) */
function merkOverlay(t, mode) {
  if (mode === true) mode = 'intro'; else if (mode === false) mode = 'tip';
  G.waiting = true; G.merkPeek = mode !== 'wrong';
  const show = mode !== 'tip', eq = taskText(t) + (t.noEq ? '' : ' = ') + (show ? showAns(t.a) + (t.unit ? ' ' + t.unit : '') : '?');
  const head = { intro: '✨ Neu – merk dir das!', tip: '💡 Bild-Tipp', wrong: '🔁 Schau nochmal genau hin' }[mode];
  $('merkOv')?.remove();
  $('game').insertAdjacentHTML('beforeend', `<div class="merk-ov ${mode}" id="merkOv" role="dialog" aria-modal="true" aria-label="${esc(head)}"><div class="merk-ov-card">
    <div class="mo-head">${head}</div>
    <div class="merk-eq${mode === 'wrong' ? ' good' : ''}"><span translate="no">${esc(eq)}</span></div>
    ${merkVisual(t)}
    ${bzOn() ? blitzSay(mode === 'intro' ? 'wow' : mode === 'tip' ? 'think' : 'comfort', `<span class="st-i">${merkStory(t)[0]}</span> ${mode !== 'tip' && merkStory(t)[2] ? '<span>Rückwärts gedacht:</span> ' : ''}<span>${esc(mode === 'tip' ? merkTipText(t) : merkStory(t)[1])}</span>`, 52) : ''}
    ${mode === 'wrong' && t.w && t.w.length ? `<ol class="steps">${t.w.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <button class="btn primary block" id="solNext">${{ intro: 'Jetzt du!', tip: 'Zurück zur Aufgabe', wrong: 'Weiter' }[mode]} <span class="muted-on-dark">(OK)</span></button></div></div>`);
  $('solNext').onclick = continueAfterSolution;
  if (mode === 'intro') Sound.hint();
}
/** richtig im Merk-Training: Stern fliegt, bei „sitzt fest“ kleine Feier */
function merkCorrectFx(t) {
  const solid = G_MERK && G_MERK.solidNow === t.card;
  merkFlyStar(solid);
  const cs = G_MERK && G_MERK.consts && G_MERK.consts.length && !G_MERK.constShown?.includes(G_MERK.consts[G_MERK.consts.length - 1]) ? MERK_CONSTS.find(c => c.id === G_MERK.consts[G_MERK.consts.length - 1]) : null;
  if (cs) { (G_MERK.constShown ||= []).push(cs.id); G_MERK.solidNow = null; setTimeout(() => { Sound.milestone(); Confetti.burst(160); blitzPop('cheer', `<span>Neues Sternbild:</span> <span>${esc(cs.icon)}</span> <b>${esc(cs.name)}</b>`); }, 250); return; }
  if (solid) { G_MERK.solidNow = null; setTimeout(() => { Sound.milestone(); Confetti.burst(60); blitzPop('wow', `<span translate="no">${esc(taskText(t))} = ${esc(showAns(t.a))}</span> <span>sitzt jetzt fest!</span>`); }, 250); }
}

/** Bild-Tipp: Trick ohne Ergebnis verraten (Geschichten mit Ergebnis werden zum Rechenweg-Hinweis) */
function merkTipText(t) {
  const [id] = t.card.split(':');
  if (id === 'ee' || id === 'div') { const a = t.e[0].v, b = t.e[2].v; return id === 'ee' ? `Zähl die Reihen: ${a} Reihen mit je ${b} Punkten.` : `Wie viele Reihen zu ${b} Punkten ergeben ${a}?`; }
  if (id === 'plus') return 'Füll erst bis 10 auf – dann den Rest dazu.';
  if (id === 'sq') return 'Rechne die vier Flächen zusammen.';
  return 'Wie viele der 100 Kästchen sind gefärbt?';
}
