'use strict';
/* =====================================================================
   Rechenblitz Pro – 7,99 € einmalig (Marcel 16.11.2026, Meldung 52/54)
   Frei: alle Themen Stufe 1–5, Spiele, 2 Profile.
   Pro: Profi-Stufe, unbegrenzt Profile, ausführlicher Elternbericht, Vorlagen speichern und teilen.
   Freischaltung ohne Konto: Code „RB-…“ (Ed25519-signiert, Crockford-Base32), geprüft nur auf dem Gerät.
   Sperren greifen erst, wenn CONFIG.proCheckout (Kassen-URL) eingetragen ist – bis dahin ist alles frei.
   Kauf nur hinter der Eltern-Abfrage, in der Play-Fassung vorerst kein Kauf-Knopf (später Play Billing).
   ===================================================================== */
const RBPRO = {
  key: '979eb515eb05b04dcc42e5fb776f108cdbdc86bb3c7cf28e05721fdde9e6b812',   // öffentlicher Schlüssel (Leitstand 16.11.)
  ver: 1, app: 2, product: 1,                                                  // Code-Version 1, App-Byte 2 = Rechenblitz, Produkt 1 = Pro
  b32: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
  ok: false,                                                                   // gültiger Code auf diesem Gerät geprüft
  price: '7,99 €',
  freeProfiles: 2,
};
const proLocks = () => !!CONFIG.proCheckout;                    // ohne Kassen-URL keine Sperren
const hasPro = () => !proLocks() || RBPRO.ok;
const proPlay = () => IS_NATIVE && (typeof liveUpd === 'undefined' || !liveUpd || liveUpd.store === 'play');   // Play-Fassung (oder noch unbekannt): kein Kauf-Knopf

/** Code → Bytes. Erlaubt „RB-“, Bindestriche, Leerzeichen, Kleinbuchstaben und die Verwechsler O/I/L. */
function proDecode(code) {
  const s = String(code || '').toUpperCase().replace(/\s+/g, '').replace(/^RB-?/, '').replace(/-/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (!s || /[^0-9A-Z]/.test(s)) return null;
  const out = []; let acc = 0, bits = 0;
  for (const ch of s) {
    const v = RBPRO.b32.indexOf(ch); if (v < 0) return null;
    acc = (acc << 5) | v; bits += 5;
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); }
    acc &= (1 << bits) - 1;
  }
  return new Uint8Array(out);
}
const proHex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
const proNorm = code => String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^RB/, '');

const proNacl = () => window.nacl ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'js/vendor/nacl.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
/** Prüft die Signatur. Aufbau: [Version, App, Produkt, … weitere Felder] + 64 Byte Ed25519-Signatur über alles davor. */
async function proVerify(code) {
  const b = proDecode(code);
  if (!b || b.length < 64 + 3) return { ok: false, why: 'format' };
  const msg = b.slice(0, b.length - 64), sig = b.slice(b.length - 64);
  if (msg[0] !== RBPRO.ver || msg[1] !== RBPRO.app) return { ok: false, why: 'app' };
  let good;
  try {   // 1. WebCrypto (neuere Browser)
    const key = await crypto.subtle.importKey('raw', proHex(RBPRO.key), { name: 'Ed25519' }, false, ['verify']);
    good = await crypto.subtle.verify({ name: 'Ed25519' }, key, sig, msg);
  } catch {   // 2. ältere Geräte (z. B. Android-WebView vor Chrome 137): TweetNaCl, wird nur dann nachgeladen
    try { await proNacl(); good = window.nacl.sign.detached.verify(msg, sig, proHex(RBPRO.key)); } catch { return { ok: false, why: 'crypto' }; }
  }
  return good ? { ok: msg[2] === RBPRO.product, why: msg[2] === RBPRO.product ? '' : 'product', product: msg[2] } : { ok: false, why: 'sig' };
}
const RBPRO_WHY = {
  format: 'Das sieht nicht wie ein Zahlensprint-Code aus. Bitte genau so eingeben, wie er in der E-Mail steht.',
  app: 'Dieser Code gehört zu einer anderen App.',
  product: 'Dieser Code schaltet etwas anderes frei.',
  sig: 'Dieser Code ist nicht gültig. Bitte noch einmal genau abschreiben.',
  crypto: 'Dieses Gerät kann den Code nicht prüfen. Bitte Browser bzw. App aktualisieren.',
};

/** Code einlösen: gilt für alle Profile auf diesem Gerät */
async function proRedeem(code, quiet) {
  const r = await proVerify(code);
  if (!r.ok) { if (!quiet) toast(RBPRO_WHY[r.why] || RBPRO_WHY.sig, 3200); return false; }
  RBPRO.ok = true; ROOT.pro = { code: proNorm(code), at: todayStr() }; save();
  if (!quiet) { toast('<span>⭐</span> <span>Zahlensprint Pro ist freigeschaltet – danke!</span>', 2600); if (typeof Sound !== 'undefined') Sound.win?.(); }
  renderHome(); return true;
}
/** Beim Start: gespeicherten Code erneut prüfen und den Code aus dem Freischalt-Link einlösen.
    Neu: #pro=CODE (bleibt im Browser, landet nicht in Server-Logs); ?pro=CODE weiter für alte Karten und Mails.
    Der Code wird sofort aus der Adresszeile entfernt. */
function proFromUrl() {
  let c = null, u = location.pathname + location.search + location.hash;
  const hm = location.hash.match(/^#(?:.*&)?pro=([^&]+)/);
  if (hm) { c = decodeURIComponent(hm[1]); const rest = location.hash.slice(1).split('&').filter(x => !x.startsWith('pro=')).join('&'); u = location.pathname + location.search + (rest ? '#' + rest : ''); }
  const p = new URLSearchParams(location.search);
  if (p.get('pro')) { c = c || p.get('pro'); p.delete('pro'); const q = p.toString(); u = location.pathname + (q ? '?' + q : '') + (hm ? (u.includes('#') ? u.slice(u.indexOf('#')) : '') : location.hash); }
  if (c) { try { history.replaceState(null, '', u); } catch {} }
  return c;
}
async function proStartup() {
  if (ROOT.pro && ROOT.pro.code) RBPRO.ok = (await proVerify(ROOT.pro.code)).ok;
  const c = proFromUrl();
  if (c && !(RBPRO.ok && proNorm(c) === (ROOT.pro && ROOT.pro.code))) await proRedeem(c);
  if (RBPRO.ok) renderHome();
}
// Link geöffnet, während die App schon läuft (nur der #-Teil ändert sich)
if (typeof addEventListener === 'function') addEventListener('hashchange', async () => { const c = proFromUrl(); if (c && !(RBPRO.ok && proNorm(c) === (ROOT.pro && ROOT.pro.code))) await proRedeem(c); });

/** Pro-Funktion angefragt: frei → true, sonst Pro-Fenster öffnen */
function needPro(what) {
  if (hasPro()) return true;
  if (Sheet.open) showPanel('pro', { what }, true); else openSheet('pro', { what });   // im offenen Fenster mit „Zurück“
  return false;
}
const proBadge = () => proLocks() && !RBPRO.ok ? ' <span class="probadge">Pro</span>' : '';

const elternFrei = () => typeof GATE === 'object' && Date.now() < GATE.okUntil;   // Eltern-Tor in den letzten 10 Minuten bestanden
PANELS.pro = ({ what, eltern } = {}) => {
  const own = RBPRO.ok, locks = proLocks();
  // UWG Anh. Nr. 28: In der Ansicht für Kinder kein Preis, kein Kauf-Knopf, keine Aufforderung – nur sachlich, Weg über das Eltern-Tor
  const kind = !own && locks && !eltern && !elternFrei();
  const feats = [['🏔️', 'Profi-Stufe in allen 29 Themen', 'Für richtig gute Rechner – große Zahlen, viele Schritte'],
    ['👨‍👩‍👧', 'Unbegrenzt Profile', `Frei sind ${RBPRO.freeProfiles} Profile – mit Pro für alle Geschwister`],
    ['📈', 'Elternbericht', 'Verlauf über 10 Wochen, Stärken und Schwächen je Thema, zum Ausdrucken'],
    ['💾', 'Vorlagen speichern und teilen', '„Üben nach Wunsch“ als Vorlage, Link oder QR-Code']];
  const WHAT = { profi: 'Die Profi-Stufe gehört zu Zahlensprint Pro.', profile: `Mehr als ${RBPRO.freeProfiles} Profile gibt es mit Zahlensprint Pro.`, bericht: 'Der Elternbericht gehört zu Zahlensprint Pro.', vorlage: 'Vorlagen speichern und teilen gehört zu Zahlensprint Pro.' };
  return { title: '<span>⭐</span> <span>Zahlensprint Pro</span>', html: `<div class="pro">
    ${own ? '<p class="pro-own"><span class="pro-on static">⭐ Pro aktiv</span> Zahlensprint Pro gilt in der Web-App auf diesem Gerät – für alle Profile. Danke für deine Unterstützung!</p>'
      : `${what && WHAT[what] ? `<p class="pro-what">${WHAT[what]}</p>` : ''}${!locks ? '<p class="small muted">Zurzeit sind alle Pro-Funktionen kostenlos freigeschaltet.</p>' : ''}`}
    <div class="menu">${feats.map(([i, t, s]) => `<div class="mi static"><div class="ico">${i}</div><div><b>${t}</b><span>${s}</span></div></div>`).join('')}</div>
    <p class="small muted">Kostenlos bleiben alle 29 Themen in Stufe 1–5, alle Spiele, Lösungswege, Reise und Garten – ohne Werbung.</p>
    ${kind ? `<p class="pro-kind">Das gehört zu Zahlensprint Pro. Deine Eltern können im Elternbereich nachsehen.</p><button class="btn block" id="proEltern">🔒 Für Eltern</button>` : ''}
    ${!kind && !own && locks && !proPlay() ? `<button class="btn primary big" id="proBuy">Pro kaufen – ${RBPRO.price} einmalig</button><p class="small muted" style="text-align:center;margin:4px 0 0">inkl. MwSt. · kein Abo · Kauf auf unserer Website, der Code kommt per E-Mail · gilt in der Web-App</p>` : ''}
    ${own ? '' : `<form class="pro-code" id="proForm" autocomplete="off"><label class="field"><span>Code schon gekauft? Hier einfügen:</span>
      <input id="proIn" placeholder="RB-…" autocapitalize="characters" spellcheck="false" translate="no"></label><button class="btn" type="submit">Einlösen</button></form>`}
  </div>`, init() {
    if ($('proEltern')) $('proEltern').onclick = () => showPanel('elternGate', { next: ['pro', { what, eltern: true }] }, true);
    if ($('proBuy')) $('proBuy').onclick = () => elternFrei() ? gateOpen(CONFIG.proCheckout) : openSheet('elternGate', { href: CONFIG.proCheckout, kind: 'kauf' });
    if ($('proForm')) $('proForm').onsubmit = async e => { e.preventDefault(); const v = $('proIn').value.trim(); if (!v) return $('proIn').focus(); if (await proRedeem(v)) closeSheet(); };
  } };
};

/* ---------- Elternbericht (Pro): Verlauf über 10 Wochen aus S.hist (wird 70 Tage aufbewahrt) ---------- */
function elternData() {
  const weeks = Array.from({ length: 10 }, (_, b) => weekData(b)).reverse();   // älteste zuerst
  const tp = {};
  weeks.forEach((w, i) => { for (const [k, s] of Object.entries(w.tp)) { const x = tp[k] || (tp[k] = { n: 0, ok: 0, early: [0, 0], late: [0, 0] }); x.n += s.n; x.ok += s.ok; const h = i < 5 ? x.early : x.late; h[0] += s.ok; h[1] += s.n; } });
  const topics = Object.entries(tp).filter(([k]) => TOPICS[k]).map(([k, s]) => ({ k, ...s, acc: s.ok / s.n, lvl: S.autoLvl[k], trend: s.early[1] >= 10 && s.late[1] >= 10 ? s.late[0] / s.late[1] - s.early[0] / s.early[1] : null }))
    .sort((a, b) => b.n - a.n);
  const box = {}; for (const b of Object.values(S.box)) if (TOPICS[b.topic]) box[b.topic] = (box[b.topic] || 0) + 1;
  return { weeks, topics, box, n: weeks.reduce((s, w) => s + w.n, 0), ok: weeks.reduce((s, w) => s + w.ok, 0), ms: weeks.reduce((s, w) => s + w.ms, 0), days: weeks.reduce((s, w) => s + w.days, 0) };
}
PANELS.elternbericht = () => {
  if (!hasPro()) return PANELS.pro({ what: 'bericht' });
  const d = elternData(), max = Math.max(1, ...d.weeks.map(w => w.n)), pc = (a, b) => b ? Math.round(a / b * 100) : 0;
  const amp = acc => acc >= .85 ? ['ok', 'sitzt sicher'] : acc >= .7 ? ['mid', 'fast sicher'] : ['bad', 'üben'];
  const rows = d.topics.map(t => { const [c, l] = amp(t.acc); return `<tr><td><span translate="no">${TOPICS[t.k].g}</span> ${TOPICS[t.k].name}</td><td>${t.n}</td><td><span class="amp ${c}">${pc(t.ok, t.n)} %</span></td><td>${t.lvl != null ? lvlName(t.lvl) : '–'}</td><td>${t.trend == null ? '–' : t.trend >= .03 ? '↗ besser' : t.trend <= -.03 ? '↘ schwächer' : '→ gleich'}</td><td class="small">${l}${d.box[t.k] ? ` · ${d.box[t.k]} in der Fehlerkiste` : ''}</td></tr>`; }).join('');
  const weak = d.topics.filter(t => t.n >= 10 && t.acc < .7).slice(0, 3), strong = d.topics.filter(t => t.n >= 10 && t.acc >= .9).slice(0, 3);
  return { title: `Elternbericht · ${esc(profile().name)}`, html: `<div class="report" id="elternReport">${RBPRO.ok ? '<p class="pro-line"><span class="pro-on static">⭐ Pro aktiv</span> <span class="small muted">Zahlensprint Pro ist auf diesem Gerät freigeschaltet.</span></p>' : ''}
    <p class="small muted" style="margin-top:0">Die letzten 10 Wochen (${fmtDay(dayStr(69))} bis ${fmtDay(dayStr(0))})</p>
    <div class="wgrid"><div class="stat"><b>${d.days}</b><span>Tage geübt</span></div><div class="stat"><b>${d.n}</b><span>Aufgaben</span></div><div class="stat"><b>${pc(d.ok, d.n)} %</b><span>richtig</span></div><div class="stat"><b>${Math.round(d.ms / 60000)}</b><span>Minuten</span></div></div>
    <h4>Aufgaben je Woche</h4>
    <div class="ebars">${d.weeks.map((w, i) => `<div class="ebar" title="${w.n} Aufgaben, ${pc(w.ok, w.n)} % richtig"><i style="height:${Math.max(3, w.n / max * 100)}%"></i><span>${i === 9 ? 'jetzt' : '−' + (9 - i)}</span></div>`).join('')}</div>
    ${weak.length ? `<h4>Hier lohnt sich Üben</h4><ul>${weak.map(t => `<li><b>${TOPICS[t.k].name}</b> – ${pc(t.ok, t.n)} % richtig</li>`).join('')}</ul>` : ''}
    ${strong.length ? `<h4>Läuft richtig gut</h4><ul>${strong.map(t => `<li><b>${TOPICS[t.k].name}</b> – ${pc(t.ok, t.n)} % richtig</li>`).join('')}</ul>` : ''}
    ${rows ? `<h4>Alle Themen</h4><div class="etable"><table><thead><tr><th>Thema</th><th>Aufgaben</th><th>richtig</th><th>Stufe</th><th>Entwicklung</th><th>Einschätzung</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">In den letzten 10 Wochen wurde noch nicht geübt.</p>'}
    <p class="small muted">„Entwicklung“ vergleicht die ersten und die letzten 5 Wochen (ab 10 Aufgaben je Hälfte). Die Daten bleiben auf diesem Gerät.</p>
    <a class="cta-inline" href="${esc(siteLink(CONFIG.trialUrl, 'elternbericht'))}" target="_blank" rel="noopener">🎓 Hakt es irgendwo? Kostenlose Probestunde bei Nachhilfe – online</a>
    </div><div class="row2" style="margin-top:12px"><button class="btn primary" id="ebPrint">Drucken / PDF</button><button class="btn" id="ebWeek">Wochenbericht</button></div>`, init() {
      $('ebPrint').onclick = () => printHtml(`<h1>Elternbericht · ${esc(profile().name)}</h1>${$('elternReport').innerHTML}`);
      $('ebWeek').onclick = () => showPanel('week', {}, true);
    } };
};
