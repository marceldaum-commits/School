'use strict';
/* =====================================================================
   Rechenblitz – Extras für Reichweite & Werbung:
   Adventskalender, Urkunde, Flyer/Poster mit QR-Code, Freunde einladen,
   passende Probestunden-Hinweise, Klassen-Challenge (Server), Direktlinks
   ===================================================================== */
const publicUrl = () => CONFIG.publicUrl || appUrl();
const isTestHost = () => /(^|[.-])test\.|-test\.|localhost|127\.0\.0\.1/.test(location.hostname);
const longDate = (d = new Date()) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- QR-Code (lokal, js/vendor/qrcode.js) ---------- */
function qrMatrix(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); return { n, dark: (r, c) => q.isDark(r, c) }; }
function qrSvg(text, color = '#101b43') {
  const { n, dark } = qrMatrix(text); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${n + 8} ${n + 8}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="QR-Code: ${esc(text)}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="${color}"/></svg>`;
}
function qrDraw(ctx, text, x, y, size) {
  const { n, dark } = qrMatrix(text), m = 2, cell = size / (n + 2 * m);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = '#101b43';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) ctx.fillRect(x + (c + m) * cell, y + (r + m) * cell, Math.ceil(cell), Math.ceil(cell));
}
function printRaw(html, cls) {
  $('print').className = cls || ''; $('print').innerHTML = html;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); setTimeout(() => { document.body.classList.remove('printing'); $('print').className = ''; }, 500); }, 150);
}

/* ================= Adventskalender ================= */
const ADVENT_FACTS = [
  ['⭐', 'Wusstest du? 1 + 2 + 3 + … + 24 = 300. So viele Zahlen stecken in allen Türchen zusammen!'],
  ['❄️', 'Jede Schneeflocke hat 6 Arme – und trotzdem gleicht keine der anderen.'],
  ['🍪', '3 Bleche mit je 12 Plätzchen sind 36 Plätzchen. Malnehmen ist schnelles Plusrechnen!'],
  ['🎄', 'Eine Zahl ist durch 3 teilbar, wenn ihre Quersumme durch 3 teilbar ist: 1224 → 1 + 2 + 2 + 4 = 9 ✓'],
  ['🕯️', 'Kopfrechen-Trick: Mal 5 heißt mal 10 und dann halbieren. 48 · 5 = 480 : 2 = 240.'],
  ['🎅', 'Nikolaus! 6 ist eine „vollkommene Zahl“: Ihre Teiler 1 + 2 + 3 ergeben genau 6.'],
  ['🧦', 'Mal 9 mit den Fingern: Für 9 · 4 knickst du den 4. Finger ein – links 3, rechts 6 → 36.'],
  ['⛄', 'Ist jede Schneemann-Kugel doppelt so breit wie die darüber, ist die unterste 4-mal so breit wie der Kopf.'],
  ['🎁', '11 · 23? Die Ziffern addieren und in die Mitte setzen: 2 (2 + 3) 3 → 253.'],
  ['🦌', '9 Rentiere haben zusammen 36 Beine – 9 · 4 = 36.'],
  ['🌟', 'Prozent heißt „von Hundert“: 25 % ist ein Viertel, 50 % die Hälfte.'],
  ['🍫', '12 Stück sind ein Dutzend. Ein Adventskalender hat genau 2 Dutzend Türchen.'],
  ['🎶', 'Rechne 99 + 47 so: 100 + 47 − 1 = 146.'],
  ['🧁', 'Brüche teilen gerecht: 3 Kuchen für 4 Kinder – jedes bekommt 3/4 Kuchen.'],
  ['🛷', 'Trick für Quadratzahlen mit 5 am Ende: 15² → 1 · 2 = 2, dann 25 anhängen: 225.'],
  ['❄️', 'Minus mal Minus ergibt Plus: (−3) · (−4) = 12.'],
  ['🎄', 'Ungerade Zahlen ergeben Quadratzahlen: 1 + 3 + 5 + 7 = 16 = 4².'],
  ['🕯️', 'Runden: 4,6 ≈ 5 und 4,4 ≈ 4. Ab der 5 wird aufgerundet.'],
  ['🍪', 'Durch 4 teilen heißt zweimal halbieren: 96 → 48 → 24.'],
  ['🌨️', 'Bei −10 °C friert alles. Wird es 15 Grad wärmer, sind es +5 °C.'],
  ['🌙', 'Der 21. Dezember ist der kürzeste Tag des Jahres – ab jetzt werden die Tage wieder länger!'],
  ['⚖️', 'Gleichungen sind wie eine Waage: Was du links machst, musst du auch rechts machen.'],
  ['✨', '1000 Minuten sind 16 Stunden und 40 Minuten.'],
  ['🎄', 'Frohe Weihnachten! Du hast gerechnet wie ein Profi. 🎉'],
];
const ADVENT_ORDER = [7, 19, 2, 14, 23, 10, 5, 17, 1, 12, 21, 8, 16, 3, 24, 11, 20, 6, 13, 9, 22, 4, 18, 15];
const adventPreview = () => CONFIG.adventPreview === true || (CONFIG.adventPreview === 'auto' && isTestHost());
function adventYear() { const d = new Date(); return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(); }
function adventPhase() {   // 'off' | 'teaser' | 'on' | 'after'
  if (!CONFIG.advent) return 'off';
  if (adventPreview()) return 'on';
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  if (m === 11 && day >= 15) return 'teaser';
  if (m === 12 && day <= 24) return 'on';
  if ((m === 12 && day > 24) || (m === 1 && day <= 6)) return 'after';
  return 'off';
}
const adventOpen = d => adventPreview() || adventPhase() === 'after' || (adventPhase() === 'on' && new Date().getDate() >= d);
function adventState() { if (!S.advent || S.advent.year !== adventYear()) S.advent = { year: adventYear(), doors: {} }; return S.advent; }
function adventTasks(d) {
  const tier = challengeTier();
  return withSeed(hashStr(`rechenblitz-advent-${adventYear()}-${d}-${tier}`), () => {
    const topics = tier === 'A' ? ['add', 'sub', 'mul', 'div', 'gap', 'order', 'unit', 'word'] : ['mul', 'div', 'gap', 'frac', 'dec', 'pct', 'neg', 'pow', 'order', 'round', 'unit', 'divis', 'eq', 'word'];
    const lvl = tier === 'A' ? (d <= 8 ? 0 : d <= 16 ? 1 : 2) : (d <= 8 ? 1 : d <= 16 ? 2 : 3);
    return Array.from({ length: 5 }, () => makeTask(pick(topics), lvl));
  });
}
function startAdventDoor(d) { closeSheet(); startGame('advent', { queue: adventTasks(d), op: 'mix', lvl: 0, title: `Türchen ${d}`, door: d }); }

/* ---------- Gutschein für alle 24 Türchen ---------- */
const voucher = () => CONFIG.adventVoucher && CONFIG.adventVoucher.code ? CONFIG.adventVoucher : null;
function voucherHtml() {
  const v = voucher(); if (!v) return '';
  return `<div class="voucher"><div class="v-top"><span class="v-pct">${v.percent || 10} %</span><div><b>Dein Gutschein für Nachhilfe – online</b><small>${esc(v.text || 'auf ein Stundenpaket')}${v.until ? ` · gültig bis ${fmtDay(v.until)}` : ''}</small></div></div>
    <div class="v-code"><code id="vCode">${esc(v.code)}</code><button class="btn small" id="vCopy">Kopieren</button></div>
    <p class="small muted" style="margin:6px 0 10px">Zeig den Code deinen Eltern – sie geben ihn bei der Buchung eines Stundenpakets an.</p>
    <a class="btn primary block" href="${esc(siteLink(v.url || CONFIG.packagesUrl, 'advent-gutschein'))}" target="_blank" rel="noopener">Zu den Stundenpaketen ↗</a></div>`;
}
function bindVoucher() {
  const b = $('vCopy'); if (!b) return;
  b.onclick = async () => { try { await navigator.clipboard.writeText(voucher().code); toast('Gutscheincode kopiert ✓'); } catch { const r = document.createRange(); r.selectNodeContents($('vCode')); getSelection().removeAllRanges(); getSelection().addRange(r); } };
}

/* ================= Urkunde ================= */
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(' '); let line = '', lines = [];
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line); lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); return lines.length;
}
async function drawCertificate(o) {
  try { await document.fonts.ready; } catch {}
  const W = 1600, H = 1131, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#fdfdfb'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(16,27,67,.06)'; x.lineWidth = 2;
  for (let i = 40; i < W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 40; i < H; i += 40) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
  x.strokeStyle = '#101b43'; x.lineWidth = 22; x.strokeRect(34, 34, W - 68, H - 68);
  x.strokeStyle = '#ff7418'; x.lineWidth = 5; x.strokeRect(70, 70, W - 140, H - 140);
  x.fillStyle = '#ff7418'; x.beginPath(); x.arc(W - 150, 150, 26, 0, Math.PI * 2); x.fill();
  try { const logo = await loadImg('icons/logo.svg'); x.drawImage(logo, 120, 110, 96, 96); } catch {}
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.fillStyle = '#101b43'; x.font = '800 42px Inter, Arial, sans-serif'; x.fillText('Rechenblitz', 232, 155);
  x.fillStyle = '#61718a'; x.font = '500 24px Inter, Arial, sans-serif'; x.fillText('by Nachhilfe – online', 232, 192);
  x.textAlign = 'center';
  const g = x.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0); g.addColorStop(0, '#ff8a3d'); g.addColorStop(1, '#df5e0c');
  x.fillStyle = g; x.font = 'italic 600 128px "Source Serif 4", Georgia, serif'; x.fillText('Urkunde', W / 2, 345);
  x.fillStyle = '#61718a'; x.font = '500 32px Inter, Arial, sans-serif'; x.fillText(o.name ? 'für' : 'Für hervorragendes Rechnen', W / 2, 410);
  if (o.name) {
    x.fillStyle = '#2447b5'; x.font = '700 118px Caveat, "Segoe Print", cursive'; x.fillText(o.name, W / 2, 530);
    const w = Math.min(760, x.measureText(o.name).width + 120); x.strokeStyle = '#dbe4ef'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - w / 2, 556); x.lineTo(W / 2 + w / 2, 556); x.stroke();
  }
  x.fillStyle = '#101b43'; x.font = '800 50px Inter, Arial, sans-serif';
  const n1 = wrapText(x, o.line1, W / 2, o.name ? 650 : 560, 1150, 60);
  x.fillStyle = '#61718a'; x.font = '500 32px Inter, Arial, sans-serif';
  wrapText(x, o.line2 || '', W / 2, (o.name ? 650 : 560) + n1 * 60 + 14, 1100, 42);
  x.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.fillText(o.icon || '🏅', W / 2, 850);
  x.textAlign = 'left'; x.fillStyle = '#101b43'; x.font = '600 28px Inter, Arial, sans-serif'; x.fillText(longDate(), 130, 965);
  x.fillStyle = '#61718a'; x.font = '500 22px Inter, Arial, sans-serif'; x.fillText('Datum', 130, 1000);
  x.textAlign = 'right'; x.fillStyle = '#101b43'; x.font = '600 26px Inter, Arial, sans-serif';
  x.fillText('Kostenlos Kopfrechnen üben:', W - 330, 945);
  x.fillStyle = '#df5e0c'; x.fillText(publicUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W - 330, 982);
  qrDraw(x, publicUrl(), W - 300, 850, 170);
  return c;
}
function certFor(kind) {
  if (kind.badge) { const b = BADGES.find(x => x.id === kind.badge); return { line1: `Abzeichen „${b.name}“`, line2: b.desc, icon: b.icon }; }
  return kind;
}
let certCanvas = null;

/* ================= Werbung passend zum Lernstand ================= */
function weakTopic() {
  const agg = {};
  for (let i = 0; i < 14; i++) { const h = S.hist[dayStr(i)]; if (!h) continue; for (const [tp, [ok, bad]] of Object.entries(h.tp)) { const a = agg[tp] || (agg[tp] = [0, 0]); a[0] += ok; a[1] += bad; } }
  let best = null;
  for (const [tp, [ok, bad]] of Object.entries(agg)) { const n = ok + bad, acc = ok / n; if (n >= 10 && acc < .7 && (!best || acc < best[1])) best = [tp, acc]; }
  return best && best[0];
}
function resultPromo() {   // höchstens einmal am Tag, damit es nicht nervt
  const today = todayStr();
  if (!G || G.mode === 'test' || S.promoDay === today) return '';
  S.promoDay = today; save();
  const w = weakTopic();
  const txt = w ? `<b>${esc(TOPICS[w].name)}</b> klappt noch nicht ganz? In einer <b>kostenlosen Probestunde</b> schauen wir gemeinsam drauf.` : 'Mehr Hilfe gewünscht? <b>Kostenlose Probestunde bei Nachhilfe – online</b>';
  return `<a class="promo-line" href="${esc(siteLink(CONFIG.trialUrl, w ? 'ergebnis-' + w : 'ergebnis'))}" target="_blank" rel="noopener">🎓 <span>${txt}</span> ↗</a>`;
}

/* ================= Freunde einladen ================= */
const inviteText = () => `Ich übe Kopfrechnen mit Rechenblitz – kostenlos und ohne Anmeldung. Probier's aus: ${publicUrl()}`;
const shareInvite = () => shareText(inviteText(), 'Rechenblitz – Kopfrechnen üben');

/* ================= Klassen-Challenge (braucht Server) ================= */
async function classApi(path, body) {
  const r = await fetch(CONFIG.classApi + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(j.error || `Fehler ${r.status}`); e.status = r.status; throw e; }
  return j;
}
const classCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const nickOk = s => /^[\p{L}\p{N} _.-]{2,20}$/u.test(s);
async function submitClassPoints(entry) {
  if (!CONFIG.classApi || !S.klasse) return;
  const queue = [...(S.klassePending || []), ...(entry ? [entry] : [])], rest = [];
  for (const e of queue) {
    try { await classApi('/klasse/punkte', { code: S.klasse.code, spieler: S.klasse.spieler, ...e }); }
    catch (err) { if (err.status === 404 || err.status === 403) { S.klasse = null; break; } if (err.status !== 400) rest.push(e); }
  }
  S.klassePending = rest.slice(-50); save();
}
function rankingHtml(d) {
  if (!d.eintraege || !d.eintraege.length) return '<p class="muted">Diese Woche hat noch niemand Punkte gesammelt. Sei die/der Erste!</p>';
  return `<ol class="ranking">${d.eintraege.map((e, i) => `<li class="${e.ich ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><b>${esc(e.spitzname)}</b><span class="pt">${e.punkte} P.</span></li>`).join('')}</ol>`;
}

/* ================= Panels ================= */
Object.assign(PANELS, {
  advent() {
    const st = adventState(), phase = adventPhase(), done = Object.keys(st.doors).length;
    const doors = ADVENT_ORDER.map(d => {
      const r = st.doors[d], open = adventOpen(d);
      return `<button class="door ${r ? 'done' : open ? 'open' : 'locked'}" data-door="${d}" ${open ? '' : 'disabled'} aria-label="Türchen ${d}${r ? ', geschafft' : open ? '' : ', noch geschlossen'}"><b>${d}</b>${r ? `<span>${ADVENT_FACTS[d - 1][0]}</span><small>${'★'.repeat(Math.max(1, Math.round(r.correct / 5 * 3)))}</small>` : open ? '<span>🎁</span>' : '<span>🔒</span>'}</button>`;
    }).join('');
    const raffle = CONFIG.adventRaffleUrl && done >= (CONFIG.adventRaffleMin || 12)
      ? `<a class="btn primary block" href="${esc(siteLink(CONFIG.adventRaffleUrl, 'advent-verlosung'))}" target="_blank" rel="noopener">🎁 Bei der Verlosung mitmachen ↗</a>` : CONFIG.adventRaffleUrl ? `<p class="small muted" style="margin:0">Ab ${CONFIG.adventRaffleMin || 12} geöffneten Türchen kannst du bei unserer Verlosung mitmachen.</p>` : '';
    return { title: 'Rechen-Adventskalender', html: `
      ${phase === 'teaser' ? '<p class="note">Ab dem <b>1. Dezember</b> öffnet sich jeden Tag ein Türchen mit 5 Aufgaben und einem Rechen-Trick. Verpasste Türchen kannst du nachholen.</p>' : `<p class="small muted" style="margin:0 0 10px">Jeden Tag ein Türchen: 5 Aufgaben – für alle gleich – und ein Rechen-Trick. Verpasste Türchen kannst du nachholen. Geschafft: <b>${done}/24</b></p>`}
      ${adventPreview() && phase === 'on' && !(new Date().getMonth() === 11) ? '<p class="note">Vorschau-Modus (Testseite): alle Türchen sind offen.</p>' : ''}
      <div class="advent">${doors}</div>
      ${done >= 20 ? '<button class="btn block" id="advCert" style="margin-top:12px">🏅 Advents-Urkunde holen</button>' : `<p class="small muted" style="margin:10px 0">Ab 20 Türchen gibt es eine Advents-Urkunde.</p>`}
      ${done >= 24 ? voucherHtml() : voucher() ? `<p class="note" style="margin-top:10px">🎁 Alle 24 Türchen geschafft? Dann gibt es einen <b>${voucher().percent || 10}-%-Gutschein</b> ${esc(voucher().text || 'auf ein Stundenpaket')}!</p>` : ''}
      ${raffle}`, init() {
        bindVoucher();
        $('sheetBody').querySelectorAll('[data-door]').forEach(b => b.onclick = () => showPanel('adventDoor', { d: +b.dataset.door }, true));
        $('advCert') && ($('advCert').onclick = () => showPanel('cert', { line1: 'Rechen-Adventskalender', line2: `${done} von 24 Türchen geschafft`, icon: '🎄' }, true));
      } };
  },
  adventDoor({ d }) {
    const r = adventState().doors[d], [icon, fact] = ADVENT_FACTS[d - 1];
    return { title: `Türchen ${d}`, html: `<div class="doorview"><div class="dicon">${icon}</div><p class="fact">${esc(fact)}</p>
      ${r ? `<p class="muted">Geschafft am ${fmtDay(r.date)}: <b>${r.correct}/5</b> richtig.</p>` : ''}
      <button class="btn primary block" id="doorGo">${r ? 'Nochmal rechnen' : '5 Aufgaben lösen'}</button></div>`, init() { $('doorGo').onclick = () => startAdventDoor(d); } };
  },
  cert(o) {
    const nm = profile().name === 'Ich' ? '' : profile().name;
    return { title: 'Urkunde', html: `<label class="field"><span>Name auf der Urkunde (Spitzname reicht, oder leer lassen)</span><input id="certName" maxlength="24" value="${esc(nm)}"></label>
      <div class="certprev"><img id="certImg" alt="Urkunde"></div>
      <div class="row3"><button class="btn primary" id="certShare">Teilen</button><a class="btn" id="certSave" download="rechenblitz-urkunde.png">Speichern</a><button class="btn" id="certPrint">Drucken</button></div>`,
      async init() {
        const data = certFor(o);
        const render = async () => { certCanvas = await drawCertificate({ ...data, name: $('certName').value.trim() }); const u = certCanvas.toDataURL('image/png'); $('certImg').src = u; $('certSave').href = u; };
        let t; $('certName').oninput = () => { clearTimeout(t); t = setTimeout(render, 250); };
        await render();
        $('certShare').onclick = async () => {
          const blob = await new Promise(r => certCanvas.toBlob(r, 'image/png')), file = new File([blob], 'rechenblitz-urkunde.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Meine Rechenblitz-Urkunde', text: `Geschafft! ${publicUrl()}` }); } catch {} }
          else { $('certSave').click(); toast('Bild gespeichert – jetzt z. B. per WhatsApp schicken'); }
        };
        $('certPrint').onclick = () => printRaw(`<img class="certprint" src="${certCanvas.toDataURL('image/png')}" alt="Urkunde">`, 'landscape');
      } };
  },
  invite() {
    return { title: 'Freunde einladen', html: `<p style="margin:0 0 10px">Rechenblitz ist <b>kostenlos</b> und braucht keine Anmeldung. Zeig den Code deinen Freunden oder schick ihnen den Link.</p>
      <div class="qrbox">${qrSvg(publicUrl())}<div class="small muted">${esc(publicUrl())}</div></div>
      <button class="btn primary block" id="invShare">Link teilen</button>
      <div class="card parents"><b>Für Eltern: Freunde werben</b><p class="small muted" style="margin:4px 0 8px">Empfehlen Sie Nachhilfe – online weiter: Bucht die empfohlene Familie ein Paket ab 10 Stunden, schenken wir Ihnen eine Unterrichtsstunde.</p><a class="btn block" href="${esc(siteLink(CONFIG.referralUrl, 'einladen'))}" target="_blank" rel="noopener">Zu „Freunde werben“ ↗</a></div>`,
      init() { $('invShare').onclick = shareInvite; } };
  },
  flyer() {
    return { title: 'Flyer & Poster', html: `<p class="small muted" style="margin:0 0 10px">Zum Aushängen in Schule, Hort, Bibliothek oder Praxis – mit QR-Code direkt zu Rechenblitz.</p>
      <div class="seg" id="flKind"><button data-v="poster" class="sel">Poster (A4)</button><button data-v="cards">4 Handzettel (A6)</button></div>
      <label class="field" style="margin-top:12px"><span>Eigener Hinweis (optional)</span><input id="flNote" maxlength="70" placeholder="z. B. Empfohlen von der Klasse 4b"></label>
      <div class="flyerprev" id="flPrev"></div>
      <button class="btn primary block" id="flPrint" style="margin-top:12px">Drucken / als PDF speichern</button>`,
      init() {
        let kind = 'poster';
        const upd = () => { $('flPrev').innerHTML = flyerHtml($('flNote').value.trim(), true); };
        $('flKind').onclick = e => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.v; $('flKind').querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); };
        $('flNote').oninput = upd; upd();
        $('flPrint').onclick = () => { const one = flyerHtml($('flNote').value.trim()); printRaw(kind === 'poster' ? `<div class="flyer-a4">${one}</div>` : `<div class="flyer-a6">${one.repeat(4)}</div>`, 'flyerprint'); };
      } };
  },
  klasse(o = {}) {
    if (!CONFIG.classApi) return { title: 'Klassen-Challenge', html: '<p>Die Klassen-Challenge ist bald verfügbar.</p>' };
    if (S.klasse) return { title: `Klasse ${esc(S.klasse.name || S.klasse.code)}`, html: `<p class="small muted" style="margin:0 0 8px">Du bist dabei als <b>${esc(S.klasse.spitzname)}</b>. Jede richtige Aufgabe bringt Punkte – je höher die Stufe, desto mehr. Die Wertung startet jeden Montag neu.</p>
      <div id="rankBox"><p class="muted">Rangliste wird geladen …</p></div>
      <div class="row2" style="margin-top:12px"><button class="btn" id="klRefresh">Aktualisieren</button><button class="btn" id="klLeave">Klasse verlassen</button></div>`,
      async init() {
        const load = async () => { try { await submitClassPoints(); const d = await classApi(`/klasse/${encodeURIComponent(S.klasse.code)}/rangliste?spieler=${encodeURIComponent(S.klasse.spieler)}`); $('rankBox').innerHTML = `${d.bis ? `<p class="small muted">Diese Woche bis ${fmtDay(d.bis)}</p>` : ''}${rankingHtml(d)}`; } catch (e) { $('rankBox').innerHTML = `<p class="status err">${esc(e.message)}</p>`; } };
        $('klRefresh').onclick = load; load();
        $('klLeave').onclick = async () => {
          if (!confirm('Klasse wirklich verlassen? Dein Eintrag in der Rangliste wird gelöscht.')) return;
          try { await classApi('/klasse/verlassen', { code: S.klasse.code, spieler: S.klasse.spieler }); } catch (e) { if (e.status !== 404) { toast(esc(e.message)); return; } }
          S.klasse = null; S.klassePending = []; save(); renderHome(); closeSheet(); toast('Klasse verlassen');
        };
      } };
    return { title: 'Klassen-Challenge', html: `<form class="form" id="klJoin">
      <p class="small muted" style="margin:0">Deine Lehrkraft gibt dir einen Klassencode. Dann sammelt ihr eine Woche lang Punkte – wer rechnet am meisten?</p>
      <label class="field"><span>Klassencode</span><input id="klCode" maxlength="8" autocapitalize="characters" autocomplete="off" value="${esc(classCode(o.code))}" placeholder="z. B. K7R2QX" required></label>
      <label class="field"><span>Spitzname (kein echter Name nötig)</span><input id="klNick" maxlength="20" autocomplete="off" placeholder="z. B. Zahlenfuchs" required></label>
      <p class="small muted" style="margin:0">In der Rangliste sehen alle aus der Klasse nur deinen Spitznamen und deine Punkte.</p>
      <button class="btn primary block">Beitreten</button><div class="status err" id="klErr"></div></form>`,
      init() {
        $('klJoin').onsubmit = async e => {
          e.preventDefault(); const code = classCode($('klCode').value), nick = $('klNick').value.trim();
          if (code.length < 4) return $('klErr').textContent = 'Bitte den Klassencode prüfen.';
          if (!nickOk(nick)) return $('klErr').textContent = 'Spitzname: 2–20 Zeichen, nur Buchstaben, Zahlen und Leerzeichen.';
          try { const r = await classApi('/klasse/beitreten', { code, spitzname: nick }); S.klasse = { code, name: r.name || code, spieler: r.spieler, spitzname: nick }; S.klassePending = []; award('klasse'); save(); renderHome(); showPanel('klasse'); toast(`Willkommen in der Klasse, ${esc(nick)}!`); }
          catch (err) { $('klErr').textContent = err.message; }
        };
      } };
  },
  classCreate() {
    if (!CONFIG.classApi) return { title: 'Klassen-Challenge', html: '<p>Die Klassen-Challenge wird gerade eingerichtet und ist bald verfügbar.</p>' };
    return { title: 'Klassen-Challenge anlegen', html: `<form class="form" id="ccForm"><p class="small muted" style="margin:0">Ihre Klasse rechnet eine Woche lang um die Wette. Die Kinder treten mit einem Code bei und nutzen nur Spitznamen.</p>
      <label class="field"><span>Name der Klasse</span><input id="ccName" maxlength="30" required placeholder="z. B. 4b Lindenschule"></label>
      <button class="btn primary block">Klasse anlegen</button><div class="status err" id="ccErr"></div><div id="ccOut"></div></form>`,
      init() {
        $('ccForm').onsubmit = async e => {
          e.preventDefault(); const name = $('ccName').value.trim(); if (name.length < 2) return;
          try {
            const r = await classApi('/klasse', { name }), link = `${publicUrl()}#klasse=${r.code}`;
            const mine = JSON.parse(localStorage.getItem('rb-classes') || '[]'); mine.unshift({ code: r.code, name }); try { localStorage.setItem('rb-classes', JSON.stringify(mine.slice(0, 20))); } catch {}
            $('ccOut').innerHTML = `<div class="card" style="box-shadow:none;text-align:center"><div class="small muted">Klassencode</div><div class="bigcode">${esc(r.code)}</div><div class="qrbox">${qrSvg(link)}</div><textarea class="sharebox" readonly rows="2">${esc(link)}</textarea><div class="row2"><button type="button" class="btn primary" id="ccShare">Teilen</button><button type="button" class="btn" id="ccRank">Rangliste</button></div></div>`;
            $('ccShare').onclick = () => shareText(`Klassen-Challenge „${name}“ bei Rechenblitz: Code ${r.code}\n${link}`, 'Rechenblitz Klassen-Challenge');
            $('ccRank').onclick = () => showPanel('rankingView', { code: r.code, name }, true);
          } catch (err) { $('ccErr').textContent = err.message; }
        };
      } };
  },
  rankingView(o) {
    return { title: `Rangliste ${esc(o.name || o.code)}`, html: '<div id="rankBox"><p class="muted">Wird geladen …</p></div>',
      async init() { try { const d = await classApi(`/klasse/${encodeURIComponent(o.code)}/rangliste`); $('rankBox').innerHTML = rankingHtml(d); } catch (e) { $('rankBox').innerHTML = `<p class="status err">${esc(e.message)}</p>`; } } };
  },
});

function flyerHtml(note, preview) {
  const url = publicUrl(), short = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<div class="flyer${preview ? ' prev' : ''}">
    <div class="fl-head"><img src="icons/logo.svg" alt=""><div><b>Rechenblitz</b><small>by Nachhilfe – online</small></div></div>
    <div class="fl-eyebrow">Kostenlos · ohne Anmeldung</div>
    <h2>Kopfrechnen üben mit <em>Rechenblitz</em></h2>
    <p class="fl-lead">Vom Einmaleins bis zu Brüchen, Prozent und Gleichungen – mit Lösungsweg bei jedem Fehler.</p>
    <div class="fl-body"><ul><li>17 Themen, 5 Stufen – passt sich automatisch an</li><li>Tageschallenge, Duell & Abzeichen</li><li>Handy, Tablet und PC – auch offline</li><li>Für Lehrkräfte: Aufträge & Arbeitsblätter</li></ul>
    <div class="fl-qr">${qrSvg(url)}<span>${esc(short)}</span></div></div>
    ${note ? `<div class="fl-note">${esc(note)}</div>` : ''}
    <div class="fl-foot"><b>Nachhilfe – online</b> · Persönliche Online-Nachhilfe 1:1 · Kostenlose Probestunde: mathenachhilfe-online.com/probestunde</div></div>`;
}

/* ================= Startseite & Hooks ================= */
function renderExtrasHome() {
  const ph = adventPhase(), ac = $('adventCard');
  if (ac) {
    ac.hidden = ph === 'off';
    if (ph !== 'off') {
      const n = Object.keys(adventState().doors).length, today = new Date().getDate();
      const sub = ph === 'teaser' ? 'Ab 1. Dezember: jeden Tag ein Türchen mit Rechen-Rätseln' : ph === 'after' ? `Du hast ${n}/24 Türchen geschafft – noch bis 6. Januar nachholbar` : adventState().doors[today] ? `Heute geschafft! ${n}/24 Türchen` : `Türchen ${Math.min(24, today)} wartet auf dich · ${n}/24 geschafft`;
      ac.innerHTML = `<div class="adv-ico">🎄</div><div class="ch-txt"><b>Rechen-Adventskalender</b><span>${sub}</span></div><button class="btn small primary" data-open="advent">${ph === 'teaser' ? 'Ansehen' : 'Öffnen'}</button>`;
    }
  }
  const cc = $('classCard');
  if (cc) {
    cc.hidden = !CONFIG.classApi;
    if (CONFIG.classApi) cc.innerHTML = S.klasse
      ? `<div class="ch-ico">🏫</div><div class="ch-txt"><b>Klassen-Challenge</b><span>${esc(S.klasse.name)} · du bist ${esc(S.klasse.spitzname)}</span></div><button class="btn small" data-open="klasse">Rangliste</button>`
      : `<div class="ch-ico">🏫</div><div class="ch-txt"><b>Klassen-Challenge</b><span>Code von deiner Lehrkraft? Rechnet gemeinsam um die Wette!</span></div><button class="btn small" data-open="klasse">Beitreten</button>`;
  }
}
// wird am Ende jeder Runde aufgerufen; liefert zusätzliche Ergebnis-Karten
function extrasAfterGame(acc) {
  let html = '';
  if (G.mode === 'advent' && G.door) {
    const st = adventState(), prev = st.doors[G.door];
    if (!prev || G.correct > prev.correct) st.doors[G.door] = { correct: G.correct, date: todayStr() };
    const allNow = Object.keys(st.doors).length >= 24 && !prev;
    award('advent'); if (Object.keys(st.doors).length >= 24) award('advent24');
    const [icon, fact] = ADVENT_FACTS[G.door - 1];
    html += `<div class="card doorview"><div class="dicon">${icon}</div><b>Türchen ${G.door} geöffnet!</b><p class="fact">${esc(fact)}</p><button class="btn block" data-open="advent">Zum Adventskalender</button></div>`;
    if (allNow && voucher()) { html += `<div class="card"><h3 style="margin:0 0 10px">🎉 Alle 24 Türchen geschafft!</h3>${voucherHtml()}</div>`; setTimeout(bindVoucher, 50); Confetti.burst(200); }
  }
  if (S.klasse && CONFIG.classApi && G.correct > 0 && G.mode !== 'test') {
    const punkte = G.correct * (G.lvl + 1);
    submitClassPoints({ id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2), punkte, aufgaben: G.correct + G.wrong, richtig: G.correct });
    html += `<div class="card small" style="text-align:left">🏫 <b>+${punkte} Punkte</b> für die Klasse ${esc(S.klasse.name)}</div>`;
  }
  return html;
}
function resultExtrasHtml(r) {
  const cert = (r.stars >= 2 || r.badges.length || G.mode === 'test' || G.mode === 'advent') && G.correct > 0;
  return `<div class="sharerow">${cert ? '<button class="btn" id="rCert">🏅 Urkunde</button>' : ''}<button class="btn" id="rInvite">💌 Freunde einladen</button></div>`;
}
function bindResultExtras(r) {
  $('rInvite') && ($('rInvite').onclick = () => openSheet('invite'));
  $('rCert') && ($('rCert').onclick = () => {
    const answered = G.correct + G.wrong;
    let o;
    if (r.badges.length) o = { badge: r.badges[0] };
    else if (G.mode === 'test') o = { line1: `Einstufungstest Klasse ${G.klasse} geschafft`, line2: `${G.correct} von ${answered} Aufgaben richtig`, icon: '🧪' };
    else if (G.mode === 'advent') o = { line1: `Adventskalender – Türchen ${G.door}`, line2: `${G.correct} von 5 Aufgaben richtig`, icon: '🎄' };
    else o = { line1: `${'★'.repeat(r.stars)} · ${G.op === 'mix' ? 'Alles gemischt' : TOPICS[G.op].name} · Stufe ${G.lvl + 1}`, line2: `${G.correct} von ${answered} Aufgaben richtig${G.mode === 'blitz' ? ' in 60 Sekunden' : ''}`, icon: r.stars === 3 ? '🏆' : '🥈' };
    openSheet('cert', o);
  });
}

/* ---------- Direktlinks: ?thema=frac&stufe=3&modus=training · ?advent · #klasse=CODE ---------- */
function handleParams() {
  const p = new URLSearchParams(location.search);
  let used = false;
  const th = p.get('thema'), st = p.get('stufe'), mo = p.get('modus');
  if (th && TOPICS[th]) { S.sel.op = th; used = true; }
  if (st) { if (st === 'auto') S.sel.lvl = 'auto'; else if (/^[1-5]$/.test(st)) S.sel.lvl = +st - 1; used = true; }
  if (used) { save(); renderHome(); }
  if (p.has('advent')) { used = true; setTimeout(() => openSheet('advent'), 300); }
  if (used) history.replaceState(null, '', location.pathname + location.hash);
  if (mo && ['training', 'zen', 'blitz'].includes(mo)) { history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => startGame(mo), 300); }
  handleClassHash();
}
function handleClassHash() {
  const m = location.hash.match(/^#klasse=([A-Za-z0-9]+)/); if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!CONFIG.classApi) { toast('Die Klassen-Challenge ist bald verfügbar.'); return; }
  if (S.klasse && S.klasse.code === classCode(m[1])) { openSheet('klasse'); return; }
  openSheet('klasse', { code: m[1] });
}
addEventListener('hashchange', handleClassHash);
addEventListener('online', () => submitClassPoints());
// Abzeichen in der Vitrine antippen → Urkunde
document.addEventListener('click', e => { const b = e.target.closest('[data-cert]'); if (b && S.badges[b.dataset.cert]) showPanel('cert', { badge: b.dataset.cert }, true); });
