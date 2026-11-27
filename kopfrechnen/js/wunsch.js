'use strict';
/* =====================================================================
   Rechenblitz – Üben nach Wunsch (Marcel 16.11.: „mehr Einstellungsmöglichkeiten, auch für Grundschüler –
   Zahlenraum begrenzen, nur bestimmte Mal-Reihen …“)
   Rechenarten, Zahlenraum, Zehnerübergang, Einmaleins-Reihen, Quadrat- und Restaufgaben, Lückenaufgaben,
   Anzahl, Zeit, große Tasten. Vorlagen speichern und teilen – alles steht im Link (#wunsch=…), ohne Server.
   ===================================================================== */
const WUNSCH_DEFAULT = { o: 'as', m: 20, c: 'a', r: [2, 5, 10], q: 0, d: 0, f: 'r', n: 20, t: 0, b: 0, k: '' };
const R10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], R1120 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
/** Schnellwahl je Klasse (Marcel 16.11.) – danach lässt sich alles einzeln ändern */
const WUNSCH_PRESETS = {
  1: { o: 'as', m: 20, c: 'o', f: 'r', n: 10 },
  2: { o: 'asm', m: 100, c: 'a', r: [1, 2, 5, 10], f: 'x', n: 20 },
  3: { o: 'asmd', m: 1000, c: 'o', r: R10, f: 'x', n: 20 },
  4: { o: 'asmd', m: 1000, c: 'w', r: R10, d: 1, f: 'x', n: 20 },
  5: { o: 'asmd', m: 10000, c: 'w', r: [11, 12, 13, 14, 15], d: 1, f: 'x', n: 20 },
  6: { o: 'md', m: 100000, r: R1120, d: 1, f: 'x', n: 20 },
  7: { o: 'm', r: R1120, q: 1, f: 'x', n: 20 },
  8: { o: 'asmd', m: 100000, c: 'w', r: [...R10, ...R1120], d: 1, f: 'x', t: 120 },
  9: { o: 'asmd', m: 100000, c: 'w', r: R1120, d: 1, f: 'g', t: 120 },
  10: { o: 'asmd', m: 100000, c: 'w', r: [...R10, ...R1120], d: 1, f: 'x', t: 180 },
  neu: { o: 'as', m: 10, c: 'a', f: 'r', n: 10, b: 1 },
};
const W_OPS = [['a', '+', 'Plus'], ['s', '−', 'Minus'], ['m', '·', 'Mal'], ['d', ':', 'Geteilt']];

/** Einstellungen prüfen (auch aus fremden Links): nur erlaubte Werte, sonst Standard */
function cleanWunsch(x) {
  if (!x || typeof x !== 'object') return null;
  const o = [...new Set(String(x.o || '').split('').filter(c => 'asmd'.includes(c)))].join('');
  const r = [...new Set((Array.isArray(x.r) ? x.r : []).map(Number).filter(v => Number.isInteger(v) && v >= 1 && v <= 20))].sort((a, b) => a - b);
  const m = Math.round(+x.m);
  return {
    o: o || WUNSCH_DEFAULT.o,
    m: Number.isFinite(m) ? Math.min(100000, Math.max(5, m)) : WUNSCH_DEFAULT.m,
    c: ['a', 'o', 'w'].includes(x.c) ? x.c : 'a',
    r: r.length ? r : WUNSCH_DEFAULT.r.slice(),
    q: x.q ? 1 : 0, d: x.d ? 1 : 0,
    f: ['r', 'g', 'x'].includes(x.f) ? x.f : 'r',
    n: [10, 20, 30, 50].includes(+x.n) ? +x.n : 20,
    t: [0, 60, 120, 180].includes(+x.t) ? +x.t : 0,
    b: x.b ? 1 : 0,
    k: String(x.k || '').replace(/[<>"]/g, '').trim().slice(0, 40),
  };
}
function wunschState() { S.wunsch ||= { last: null, tpl: [] }; return S.wunsch; }

/* ---------- Aufgaben ---------- */
const wDigits = n => String(n).split('').reverse().map(Number);
function wCarryAdd(a, b) { const x = wDigits(a), y = wDigits(b); let c = 0; for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) + (y[i] || 0) + c >= 10) return true; c = 0; } return false; }
function wBorrowSub(a, b) { const x = wDigits(a), y = wDigits(b); for (let i = 0; i < x.length; i++) if ((x[i] || 0) < (y[i] || 0)) return true; return false; }
const wLvl = m => m <= 10 ? 0 : m <= 20 ? 1 : m <= 100 ? 2 : m <= 1000 ? 4 : 4;
function wPair(op, C) {
  const max = C.m, want = max <= 10 ? 'a' : C.c;   // bis 10 gibt es keinen Zehnerübergang
  let a, b, best = null;
  for (let i = 0; i < 400; i++) {
    if (op === 'a') { a = rnd(1, Math.max(1, max - 1)); b = rnd(1, Math.max(1, max - a)); }
    else { a = rnd(2, max); b = rnd(1, a - 1 || 1); }
    if (op === 'a' && a + b > max) continue;
    const carry = op === 'a' ? wCarryAdd(a, b) : wBorrowSub(a, b);
    best = [a, b];
    if (want === 'a' || (want === 'w') === carry) return [a, b];
  }
  return best || [1, 1];
}
function wunschTask(C) {
  const op = pick(C.o.split('')), form = C.f === 'x' ? (coin() ? 'r' : 'g') : C.f, lvl = op === 'a' || op === 's' ? wLvl(C.m) : 1;
  const gap = (e, ans, w) => ({ e, a: I(ans), noEq: true, hint: 'Welche Zahl fehlt?', w });
  let t;
  if (op === 'a') {
    const [a, b] = wPair('a', C), s = a + b;
    t = form === 'r' ? { e: [N(a), O('+'), N(b)], a: I(s), w: addW(a, b) }
      : coin() ? gap([N(a), O('+'), Gap(), Eq(), N(s)], b, [`Rechne rückwärts: ${s} − ${a} = ${b}`]) : gap([Gap(), O('+'), N(b), Eq(), N(s)], a, [`Rechne rückwärts: ${s} − ${b} = ${a}`]);
    t.topic = 'add';
  } else if (op === 's') {
    const [a, b] = wPair('s', C), d = a - b;
    t = form === 'r' ? { e: [N(a), O('−'), N(b)], a: I(d), w: subW(a, b) }
      : coin() ? gap([N(a), O('−'), Gap(), Eq(), N(d)], b, [`Wie viel fehlt von ${d} bis ${a}?`, `${a} − ${d} = ${b}`]) : gap([Gap(), O('−'), N(b), Eq(), N(d)], a, [`Rechne rückwärts: ${d} + ${b} = ${a}`]);
    t.topic = 'sub';
  } else {
    const x = pick(C.r), y = C.q ? x : rnd(1, 10), p = x * y, fact = x <= 10 && y <= 10 ? factKey(x, y) : undefined;
    if (op === 'm') {
      const [f1, f2] = C.q || coin() ? [x, y] : [y, x];   // Tauschaufgaben
      t = form === 'r' ? { e: [N(f1), O('·'), N(f2)], a: I(p), w: mulW(f1, f2), fact }
        : coin() ? gap([N(f1), O('·'), Gap(), Eq(), N(p)], f2, [`Umkehraufgabe: ${p} : ${f1} = ${f2}`]) : gap([Gap(), O('·'), N(f2), Eq(), N(p)], f1, [`Umkehraufgabe: ${p} : ${f2} = ${f1}`]);
      if (form !== 'r') t.fact = fact;
      t.topic = 'mul';
    } else {
      // Geteilt aus denselben Reihen (Umkehraufgaben); Reste nur, wenn gewählt
      if (C.d && x > 1 && coin()) {
        const r = rnd(1, x - 1), z = p + r;
        t = coin() ? { e: [N(z), O(':'), N(x), Eq(), Gap(), T('Rest'), N(r)], a: I(y), noEq: true, hint: 'Wie oft passt es hinein?', w: [`${y} · ${x} = ${p}`, `${z} − ${p} = ${r}`, `Also ${z} : ${x} = ${y} Rest ${r}`] }
          : { e: [N(z), O(':'), N(x), Eq(), N(y), T('Rest'), Gap()], a: I(r), noEq: true, hint: 'Wie groß ist der Rest?', w: [`${y} · ${x} = ${p}`, `${z} − ${p} = ${r}`, `Also ${z} : ${x} = ${y} Rest ${r}`] };
      } else t = form === 'r' ? { e: [N(p), O(':'), N(x)], a: I(y), w: divW(p, x), fact }
        : coin() ? gap([N(p), O(':'), Gap(), Eq(), N(y)], x, [`${p} geteilt durch welche Zahl ergibt ${y}?`, `${p} : ${y} = ${x}`]) : gap([Gap(), O(':'), N(x), Eq(), N(y)], p, [`Umkehraufgabe: ${y} · ${x} = ${p}`]);
      t.topic = 'div';
    }
  }
  t.lvl = lvl;
  return t;
}
/** Aufgaben-Quelle für eine Runde – ohne direkte Wiederholungen */
function wunschGen(C) {
  const recent = [];
  return () => {
    let t; for (let i = 0; i < 25; i++) { t = wunschTask(C); if (!recent.includes(keyOf(t))) break; }
    recent.push(keyOf(t)); if (recent.length > 8) recent.shift();
    return t;
  };
}
function startWunsch(C) {
  C = cleanWunsch(C); if (!C) return;
  wunschState().last = C; save(); closeSheet();
  startGame('wunsch', { gen: wunschGen(C), op: { a: 'add', s: 'sub', m: 'mul', d: 'div' }[C.o[0]], lvl: 1, title: C.k || 'Üben nach Wunsch',
    cfg: C.t ? { timed: C.t * 1000 } : { count: C.n }, big: !!C.b, wunsch: C });
}
const wunschLink = C => `${appUrl()}#wunsch=${b64e(cleanWunsch(C))}`;
/** kurze Beschreibung einer Einstellung (für Vorlagen, Karte, Link) */
function wunschSummary(C) {
  const ops = W_OPS.filter(([k]) => C.o.includes(k)).map(x => x[1] === '·' ? '×' : x[1]).join(' ');
  const parts = [ops];
  if (/[as]/.test(C.o)) parts.push(`bis ${fi(C.m)}${C.c === 'o' ? ', ohne Übergang' : C.c === 'w' ? ', mit Übergang' : ''}`);
  if (/[md]/.test(C.o)) parts.push(C.q ? 'Quadratzahlen' : `Reihen ${C.r.join(', ')}`);
  if (C.f !== 'r') parts.push(C.f === 'g' ? 'Lücken' : 'mit Lücken');
  parts.push(C.t ? `${C.t / 60} Min.` : `${C.n} Aufgaben`);
  return parts.join(' · ');
}

/* ---------- Einstellen ---------- */
PANELS.wunsch = (o = {}) => {
  const st = wunschState();
  const k0 = S.settings.klasse;   // erstes Öffnen: Vorschlag passend zur eingestellten Klasse
  let C = o.cfg || st.last ? cleanWunsch(o.cfg || st.last) : k0 && WUNSCH_PRESETS[k0] ? { ...cleanWunsch({ ...WUNSCH_DEFAULT, r: R10, ...WUNSCH_PRESETS[k0] }), p: String(k0) } : cleanWunsch(WUNSCH_DEFAULT), more = C.r.some(v => v > 10);
  const chip = (v, label, sel, extra = '') => `<button type="button" data-v="${v}" class="${sel ? 'sel' : ''}" aria-pressed="${!!sel}" ${extra}>${label}</button>`;
  const kl = S.settings.klasse;
  const html = () => `<div class="wun">
    <div class="mlabel">Schnellwahl für Klasse</div>
    <div class="chips wpre" id="wPre">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => chip(k, String(k), C.p === String(k), kl === k ? 'data-mine="1"' : '')).join('')}${chip('neu', '🌱 <span>Neustart</span>', C.p === 'neu')}</div>
    ${C.p ? `<p class="small muted wpre-note" style="margin:0">${C.p === 'neu' ? '<span>Neustart:</span> <span>alles von Grund auf – bis 10, ohne Zeitdruck, große Tasten.</span>' : `<span>Vorschlag für Klasse ${C.p}</span> – <span>jede Einstellung lässt sich unten noch ändern.</span>`}</p>` : ''}
    ${o.fromLink ? `<div class="wun-link"><b><span>📝</span> <span>Übung aus einem Link</span></b>${C.k ? `<span translate="no">${esc(C.k)}</span>` : ''}</div>` : '<p class="small muted" style="margin:0">Stell dir deine Übung selbst zusammen – genau den Zahlenraum und die Reihen, die du üben möchtest.</p>'}
    <div class="mlabel">Rechenarten</div>
    <div class="chips" id="wOps">${W_OPS.map(([k, s, n]) => chip(k, `<b>${s}</b> <span>${n}</span>`, C.o.includes(k))).join('')}</div>
    <div id="wAS" ${/[as]/.test(C.o) ? '' : 'hidden'}>
      <div class="mlabel">Zahlenraum (Plus und Minus)</div>
      <div class="chips" id="wMax">${[10, 20, 100, 1000].map(v => chip(v, `<span>bis</span> <span>${fi(v)}</span>`, C.m === v)).join('')}${chip('x', 'eigene', ![10, 20, 100, 1000].includes(C.m))}</div>
      <label class="field" id="wMaxBox" ${[10, 20, 100, 1000].includes(C.m) ? 'hidden' : ''}><span>Eigene Grenze (5 bis 100000)</span><input id="wMaxIn" type="number" inputmode="numeric" min="5" max="100000" value="${C.m}"></label>
      <div class="mlabel">Zehnerübergang / Übertrag</div>
      <div class="chips" id="wCarry">${chip('a', 'egal', C.c === 'a')}${chip('o', 'ohne', C.c === 'o')}${chip('w', 'mit', C.c === 'w')}</div>
      <p class="small muted" id="wCarryNote" style="margin:0" ${C.m <= 10 ? '' : 'hidden'}>Bis 10 gibt es noch keinen Zehnerübergang.</p>
    </div>
    <div id="wMD" ${/[md]/.test(C.o) ? '' : 'hidden'}>
      <div class="mlabel">Einmaleins-Reihen (Mal und Geteilt)</div>
      <div class="chips wrows" id="wRows">${Array.from({ length: more ? 20 : 10 }, (_, i) => chip(i + 1, `${i + 1}er`, C.r.includes(i + 1))).join('')}</div>
      <div class="chips wquick" id="wQuick">${chip('all', 'alle')}${chip('core', 'Kernaufgaben')}${chip('none', 'keine')}${chip('more', more ? 'nur 1–10' : '11–20 zeigen')}</div>
      <label class="wchk"><input type="checkbox" id="wSq" ${C.q ? 'checked' : ''}> <span>Nur Quadratzahlen</span> <span translate="no" class="muted">(3 · 3, 4 · 4 …)</span></label>
      <label class="wchk" id="wRestBox" ${C.o.includes('d') ? '' : 'hidden'}><input type="checkbox" id="wRest" ${C.d ? 'checked' : ''}> <span>Geteilt mit Rest</span></label>
    </div>
    <div class="mlabel">Aufgabenform</div>
    <div class="chips" id="wForm">${chip('r', '<span translate="no">3 + 5 = ?</span>', C.f === 'r')}${chip('g', '<span translate="no">3 + ? = 8</span>', C.f === 'g')}${chip('x', 'gemischt', C.f === 'x')}</div>
    <div class="mlabel">Umfang der Übung</div>
    <div class="chips" id="wN">${[10, 20, 30, 50].map(v => chip(v, `<span>${v}</span> <span>Aufgaben</span>`, !C.t && C.n === v)).join('')}</div>
    <div class="chips" id="wT">${chip(0, 'ohne Zeitdruck', !C.t)}${[60, 120, 180].map(v => chip(v, `<span>⏱️</span> <span>${v / 60} Min.</span>`, C.t === v)).join('')}</div>
    <label class="wchk"><input type="checkbox" id="wBig" ${C.b ? 'checked' : ''}> <span>Große Ziffern und Tasten</span></label>
    <div class="wun-ex"><span>Zum Beispiel:</span> <b translate="no" id="wEx"></b></div>
    <button class="btn primary block" id="wGo">▶ Los geht’s</button>
    <div class="row2"><button class="btn" id="wSave">💾 Als Vorlage speichern</button><button class="btn" id="wShare">🔗 Teilen</button></div>
    ${st.tpl.length ? `<div class="mlabel">Meine Vorlagen</div><div class="wtpl">${st.tpl.map((t, i) => `<div class="wtpl-row"><button class="wtpl-go" data-tpl="${i}"><b translate="no">${esc(t.k || 'Vorlage')}</b><small>${esc(wunschSummary(t))}</small></button><button class="wtpl-del" data-del="${i}" aria-label="Vorlage löschen">🗑️</button></div>`).join('')}</div>` : ''}
  </div>`;
  const body = () => $('sheetBody');
  const read = () => {   // aktuelle Auswahl aus dem Formular
    const val = id => [...body().querySelectorAll(`#${id} .sel`)].map(b => b.dataset.v);
    const mx = val('wMax')[0];
    return cleanWunsch({ ...C, o: val('wOps').join(''), m: mx === 'x' ? +$('wMaxIn').value : +mx, c: val('wCarry')[0], r: val('wRows').map(Number),
      q: $('wSq').checked, d: $('wRest').checked, f: val('wForm')[0], n: +(val('wN')[0] || C.n), t: +(val('wT')[0] || 0), b: $('wBig').checked });
  };
  const example = () => { try { const t = withSeed(7, () => wunschTask(read())); $('wEx').textContent = i18nNumbers(taskText(t) + (t.noEq ? '' : ' = ?')); } catch {} };
  const init = () => {
    const single = id => body().querySelector('#' + id).onclick = e => { const b = e.target.closest('button'); if (!b) return; body().querySelectorAll(`#${id} button`).forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', x === b); }); after(id, b); };
    const multi = id => body().querySelector('#' + id).onclick = e => { const b = e.target.closest('button'); if (!b) return; const on = !b.classList.contains('sel'); b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); after(id, b); };
    const after = (id, b) => {
      Sound.click && Sound.click();
      if (id === 'wOps') {
        if (!body().querySelector('#wOps .sel')) { b.classList.add('sel'); b.setAttribute('aria-pressed', true); toast('Mindestens eine Rechenart wählen', 1600); }
        const ops = read().o; $('wAS').hidden = !/[as]/.test(ops); $('wMD').hidden = !/[md]/.test(ops); $('wRestBox').hidden = !ops.includes('d');
      }
      if (id === 'wMax') $('wMaxBox').hidden = b.dataset.v !== 'x';
      if (id === 'wMax') $('wCarryNote').hidden = read().m > 10;
      if (id === 'wRows' && !body().querySelector('#wRows .sel')) { b.classList.add('sel'); b.setAttribute('aria-pressed', true); toast('Mindestens eine Reihe wählen', 1600); }
      if (id === 'wN') body().querySelectorAll('#wT button').forEach(x => { x.classList.toggle('sel', x.dataset.v === '0'); x.setAttribute('aria-pressed', x.dataset.v === '0'); });
      if (id === 'wT' && b.dataset.v !== '0') body().querySelectorAll('#wN button').forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-pressed', false); });
      if (id === 'wT' && b.dataset.v === '0' && !body().querySelector('#wN .sel')) { const x = body().querySelector(`#wN [data-v="${C.n}"]`); x.classList.add('sel'); x.setAttribute('aria-pressed', true); }
      example();
    };
    ['wMax', 'wCarry', 'wForm', 'wN', 'wT'].forEach(single); ['wOps', 'wRows'].forEach(multi);
    $('wPre').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; Sound.click && Sound.click();
      const pr = WUNSCH_PRESETS[b.dataset.v];
      C = { ...cleanWunsch({ ...WUNSCH_DEFAULT, r: R10, ...pr }), p: b.dataset.v }; more = C.r.some(v => v > 10); redraw();
    };
    $('wQuick').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const cur = read();
      if (b.dataset.v === 'more') { C = { ...cur, r: more ? cur.r.filter(v => v <= 10) : cur.r }; more = !more; if (!C.r.length) C.r = [2, 5, 10]; return redraw(); }
      const set = b.dataset.v === 'all' ? Array.from({ length: more ? 20 : 10 }, (_, i) => i + 1) : b.dataset.v === 'core' ? [1, 2, 5, 10] : [];
      body().querySelectorAll('#wRows button').forEach(x => { const on = set.includes(+x.dataset.v); x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on); });
      if (!set.length) toast('Tippe die Reihen an, die du üben möchtest', 1800);
      example();
    };
    $('wMaxIn').oninput = () => { $('wCarryNote').hidden = read().m > 10; example(); }; $('wSq').onchange = example; $('wRest').onchange = example;
    $('wGo').onclick = () => { const c = read(); if (/[md]/.test(c.o) && !body().querySelector('#wRows .sel')) { toast('Mindestens eine Reihe wählen', 1600); return; } startWunsch(c); };
    $('wSave').onclick = () => {
      if (!needPro('vorlage')) return;   // gespeicherte Vorlagen bleiben nutzbar (Bestandsschutz)
      const c = read(), name = prompt(tr('Name der Vorlage (z. B. „Einmaleins 3 und 4“)'), c.k || '');
      if (name === null) return;
      c.k = String(name).replace(/[<>"]/g, '').trim().slice(0, 40) || tr('Meine Übung');
      const st = wunschState(); st.tpl = [c, ...st.tpl.filter(t => t.k !== c.k)].slice(0, 12); save();
      toast('<span>💾</span> <span>Vorlage gespeichert</span>'); C = c; redraw();
    };
    $('wShare').onclick = () => { if (!needPro('vorlage')) return; const c = read(); Sheet.stack[Sheet.stack.length - 1][1] = { ...o, cfg: c }; showPanel('wunschShare', { cfg: c }, true); };   // „Zurück“ behält die Auswahl
    body().querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => startWunsch(wunschState().tpl[+b.dataset.tpl]));
    body().querySelectorAll('.wtpl-del').forEach(b => b.onclick = () => { const st = wunschState(), t = st.tpl[+b.dataset.del]; if (!t || !confirm(`${tr('Vorlage löschen?')}\n${t.k}`)) return; st.tpl.splice(+b.dataset.del, 1); save(); C = read(); redraw(); });
    example();
  };
  const redraw = () => { const sc = body().parentElement.scrollTop; body().innerHTML = html(); init(); body().parentElement.scrollTop = sc; };
  return { title: '<span>🎯</span> <span>Üben nach Wunsch</span>', html: html(), init };
};
PANELS.wunschShare = ({ cfg }) => {
  const C = cleanWunsch(cfg), url = wunschLink(C);
  return { title: '<span>🔗</span> <span>Übung teilen</span>', html: `<div class="wun">
    <p class="small muted" style="margin:0">Mit diesem Link oder QR-Code bekommen Kinder genau diese Übung – zum Beispiel als Hausaufgabe. Alles steht im Link, es wird nichts gespeichert.</p>
    <div class="wun-ex">${C.k ? `<b translate="no">${esc(C.k)}</b>` : '<b>Üben nach Wunsch</b>'}<span>${esc(wunschSummary(C))}</span></div>
    <div class="qrbox">${qrSvg(url)}</div>
    <button class="btn primary block" id="wsShare">Link teilen</button>
    <button class="btn block" id="wsCopy">Link kopieren</button></div>`,
    init() {
      $('wsShare').onclick = () => shareText(`${tr('Übung für dich')}: ${C.k || tr('Üben nach Wunsch')} – ${tr(wunschSummary(C))}\n${url}`, 'Zahlensprint', url);
      $('wsCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Link kopiert ✓'); } catch { showPanel('shareBox', { text: url }, true); } };
    } };
};
/** Link „#wunsch=…“ öffnen: Einstellungen zeigen, Kind tippt auf „Los“ */
function wunschFromHash(code) {
  let c; try { c = cleanWunsch(b64d(code)); } catch { c = null; }
  if (!c) { toast('Der Link ist leider beschädigt.'); return; }
  if (['game', 'duel'].includes(currentScreen())) return;
  openSheet('wunsch', { cfg: c, fromLink: true });
}

/* ---------- Karte auf der Startseite ---------- */
function renderWunschCard() {
  const el = $('wunschCard'); if (!el) return;
  const st = wunschState(); el.hidden = false;
  el.innerHTML = `<div class="ch-ico wun-ico">🎯</div><div class="ch-txt"><b>Üben nach Wunsch</b><span>${st.last ? esc(wunschSummary(st.last)) : 'Zahlenraum, Mal-Reihen, Lücken – selbst einstellen'}</span></div>
    ${st.last ? '<button class="btn small primary" id="wunAgain" aria-label="Letzte Übung starten">▶</button>' : ''}<button class="btn small" data-open="wunsch">Einstellen</button>`;
  $('wunAgain') && ($('wunAgain').onclick = () => startWunsch(st.last));
}
