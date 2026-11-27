'use strict';
/* ================= Eltern-Handy koppeln (Marcel 18.11.2026) =================
   Eltern sehen auf dem eigenen Handy Fortschritt und Problemstellen – ohne Konto, Ende-zu-Ende verschlüsselt.
   Die App erzeugt je Kind-Profil: id (16 Zufallsbytes), schreib (16) und key (32), alles base64url ohne Padding, nur lokal gespeichert.
   Eltern-Link: <seite>#<id>.<key> – der Schlüssel steht nur im Teil nach „#“ und geht nie an einen Server.
   Nach jeder Runde (höchstens alle 10 Min.): Bericht als JSON → AES-GCM-256 (12-Byte-IV) → PUT <api><id> mit X-Schreib,
   Text „<iv b64url>.<ciphertext b64url>“ (höchstens 24 KB). „Kopplung aufheben“ → DELETE. Server und Eltern-Seite baut der Leitstand.
   Sicherung (Zusatz 18.11.): mit demselben Schlüssel der ganze Lernstand dieses Profils → PUT <api>/s/<id> (nur bei Änderung, ≤ 512 KB).
   Wiederherstellen auf einem neuen Gerät über den Kopplungs-Link (GET /s/<id>, entschlüsseln, nachfragen, übernehmen, wieder gekoppelt). */
const KOPPLUNG = {
  // Test-Stufe auf rechenblitz-test / lernen-test (gemeinsame Adresse ab 19.11.) / localhost, sonst Live
  stufe: () => /^(rechenblitz-test\.|lernen-test\.|localhost|127\.)/.test(location.hostname) ? 'test' : 'live',
  host: (st = KOPPLUNG.stufe()) => st === 'test' ? 'https://trainer-test.mathenachhilfe-online.com/eltern/v1/' : 'https://trainer.mathenachhilfe-online.com/eltern/v1/',
  api: st => KOPPLUNG.host(st) + 'b/', sich: st => KOPPLUNG.host(st) + 's/', SMAX: 512 * 1024,
  seite: () => KOPPLUNG.stufe() === 'test' ? 'https://staging.mathenachhilfe-online.com/eltern-bericht/' : 'https://www.mathenachhilfe-online.com/eltern-bericht/',
  MAX: 24 * 1024, ABSTAND: 10 * 60000,
};
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const zufall = n => b64u(crypto.getRandomValues(new Uint8Array(n)));
// Kopplung des aktuellen Profils (lokal, nie an einen Server außer id/schreib im Aufruf)
const kopplung = () => (ROOT.eltern || {})[ROOT.cur] || null;
const kopplungLink = k => `${KOPPLUNG.seite()}#${k.id}.${k.key}`;

// Thema der App → Thema-Kennung der Eltern-Seite
const THEMA = { add: 'grundrechenarten', sub: 'grundrechenarten', gap: 'grundrechenarten', order: 'grundrechenarten', doppel: 'grundrechenarten',
  mul: 'einmaleins', div: 'einmaleins', frac: 'brueche', dec: 'dezimalzahlen', pct: 'prozent', zins: 'prozent', neg: 'negative-zahlen',
  pow: 'potenzen', zehner: 'potenzen', round: 'runden', unit: 'einheiten', geld: 'einheiten', zeit: 'einheiten', divis: 'teilbarkeit',
  term: 'terme', eq: 'gleichungen', lgs: 'gleichungssysteme', quad: 'gleichungen', linear: 'funktionen', geo: 'geometrie', kreis: 'geometrie', word: 'sachaufgaben', dreisatz: 'dreisatz',
  wahr: 'wahrscheinlichkeit', stat: 'statistik', folge: 'folgen' };

/** Bericht für die Eltern-Seite (nur Lernstand, keine Personendaten außer dem freiwilligen Spitznamen) */
function elternBerichtJson() {
  const d = elternData(), pc = (a, b) => b ? Math.round(a / b * 100) : 0, k = kopplung();
  const tipp = t => `Ein paar Minuten ${TOPICS[t.k].name} in Stufe ${(t.lvl ?? 0) + 1} üben – bei Fehlern den Lösungsweg und die Theorie ansehen.`;
  const top = d.topics.filter(t => t.n >= 10);
  const letzte = [];
  for (let i = 13; i >= 0; i--) { const h = S.hist[dayStr(i)]; if (h && h.n) letzte.push({ tag: dayStr(i), min: Math.round(h.ms / 60000), aufgaben: h.n, richtig: h.ok }); }
  const merkVon = MERK_DECKS.reduce((a, x) => a + x.keys().length, 0), reiseVon = REISE_CH.length * REISE.N * 3;
  const r = {
    format: 1, app: 'rechenblitz', appName: 'Zahlensprint',
    ...(k && k.name ? { name: k.name } : {}),
    ...(S.settings.klasse ? { klasse: S.settings.klasse } : {}),
    stand: new Date().toISOString(),
    zeitraum: `${dayStr(69)} bis ${dayStr(0)}`,
    lernzeitMin: Math.round(d.ms / 60000), tageAktiv: d.days, aufgaben: d.n, richtigProzent: pc(d.ok, d.n),
    staerken: top.filter(t => t.acc >= .85).sort((a, b) => b.acc - a.acc).slice(0, 5).map(t => ({ thema: THEMA[t.k] || 'grundrechenarten', titel: TOPICS[t.k].name, prozent: pc(t.ok, t.n) })),
    schwach: top.filter(t => t.acc < .7).sort((a, b) => a.acc - b.acc).slice(0, 5).map(t => ({ thema: THEMA[t.k] || 'grundrechenarten', titel: TOPICS[t.k].name, prozent: pc(t.ok, t.n), tipp: tipp(t) })),
    fortschritt: [{ titel: 'Merk-Training: sitzt fest', geschafft: merkSolidAll(), von: merkVon }, { titel: 'Rechen-Reise: Sterne', geschafft: reiseTotalStars(), von: reiseVon }],
    letzte,
    verlauf: Object.entries(monateInit()).sort(([a], [b]) => a < b ? -1 : 1).slice(-12).map(([monat, m]) => ({ monat, min: Math.round(m.ms / 60000), aufgaben: m.n, richtigProzent: pc(m.ok, m.n) })),
    hinweis: 'Aus der Zahlensprint-App, letzte 10 Wochen. Hakt es irgendwo? Kostenlose Probestunde: mathenachhilfe-online.com/probestunde/',
  };
  return r;
}
async function verschluesseln(text, keyB64) {
  const key = await crypto.subtle.importKey('raw', unb64u(keyB64), { name: 'AES-GCM' }, false, ['encrypt']), iv = crypto.getRandomValues(new Uint8Array(12));
  return `${b64u(iv)}.${b64u(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))))}`;
}
async function entschluesseln(text, keyB64) {
  const [iv, ct] = String(text).trim().split('.'), key = await crypto.subtle.importKey('raw', unb64u(keyB64), { name: 'AES-GCM' }, false, ['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv) }, key, unb64u(ct)));
}
// Sicherung: alles, was dieses Profil zum Weiterlernen braucht (Fortschritt, Statistik, Monatssummen, Einstellungen, Pro-Code)
function sicherungDaten(kurz = false) {
  const p = ROOT.profiles[ROOT.cur], data = JSON.parse(JSON.stringify(p.data || S));
  if (kurz) { const cut = dayStr(90); for (const x of Object.keys(data.hist || {})) if (x < cut) delete data.hist[x]; }
  const k = kopplung();
  return { profil: { name: p.name, emoji: p.emoji, data }, ...(k && k.name ? { kopplungName: k.name } : {}), ...(ROOT.pro && ROOT.pro.code ? { pro: ROOT.pro } : {}), ...(ROOT.lang ? { lang: ROOT.lang } : {}) };
}
async function sicherungHochladen(k) {
  let daten = sicherungDaten(), klar = JSON.stringify(daten);
  const h = b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(klar)))).slice(0, 22);
  if (h === k.sHash) return 'gleich';   // nur bei Änderung
  let body = await verschluesseln(JSON.stringify({ format: 1, app: 'rechenblitz', v: APP_VERSION, stand: new Date().toISOString(), schreib: k.schreib, daten }), k.key);
  if (body.length > KOPPLUNG.SMAX) { daten = sicherungDaten(true); body = await verschluesseln(JSON.stringify({ format: 1, app: 'rechenblitz', v: APP_VERSION, stand: new Date().toISOString(), schreib: k.schreib, daten }), k.key); }
  if (body.length > KOPPLUNG.SMAX) return 'zu-gross';
  const r = await fetch(KOPPLUNG.sich(k.stufe) + k.id, { method: 'PUT', headers: { 'Content-Type': 'text/plain', 'X-Schreib': k.schreib }, body, credentials: 'omit', cache: 'no-store' });
  if (r.status === 204 || r.ok) { k.sHash = h; k.sLast = Date.now(); return 'ok'; }
  return r.status;   // 404: Sicherung auf dem Server noch nicht freigeschaltet – später wieder versuchen
}
async function elternVerschluesseln(obj, keyB64) {
  const key = await crypto.subtle.importKey('raw', unb64u(keyB64), { name: 'AES-GCM' }, false, ['encrypt']);
  let o = obj, text;
  for (;;) {   // höchstens 24 KB: zur Not die Tagesliste kürzen
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(o))));
    text = `${b64u(iv)}.${b64u(ct)}`;
    if (text.length <= KOPPLUNG.MAX || !o.letzte || !o.letzte.length) return text;
    o = { ...o, letzte: o.letzte.slice(Math.ceil(o.letzte.length / 2)) };
  }
}
/** Bericht hochladen; force: sofort (z. B. direkt nach dem Koppeln), sonst höchstens alle 10 Min. */
async function elternSync(force = false) {
  const k = kopplung(); if (!k || !navigator.onLine) return false;
  if (!force && Date.now() - (k.last || 0) < KOPPLUNG.ABSTAND) { k.pending = true; save(); return false; }
  try {
    const body = await elternVerschluesseln(elternBerichtJson(), k.key);
    const r = await fetch(KOPPLUNG.api(k.stufe) + k.id, { method: 'PUT', headers: { 'Content-Type': 'text/plain', 'X-Schreib': k.schreib }, body, credentials: 'omit', cache: 'no-store' });
    if (r.status === 204 || r.ok) { k.last = Date.now(); k.pending = false; k.fehler = 0; try { k.sicherung = await sicherungHochladen(k); } catch { k.sicherung = 'fehler'; } save(); return true; }
    k.fehler = r.status; save(); return false;
  } catch { return false; }
}
// nach jeder Runde (aus finish() aufgerufen) und beim Wiederöffnen, falls noch etwas aussteht
function elternNachRunde() { if (kopplung()) setTimeout(() => elternSync(false), 1500); }
setInterval(() => { const k = typeof ROOT !== 'undefined' && kopplung(); if (k && k.pending && Date.now() - (k.last || 0) >= KOPPLUNG.ABSTAND) elternSync(true); }, 60000);
async function elternKoppeln(name) {
  ROOT.eltern = ROOT.eltern || {};
  const k = { id: zufall(16), schreib: zufall(16), key: zufall(32), stufe: KOPPLUNG.stufe(), seit: Date.now(), last: 0 };
  const n = String(name || '').trim().slice(0, 24); if (n) k.name = n;
  ROOT.eltern[ROOT.cur] = k; save();
  return elternSync(true);
}
async function elternEntkoppeln() {
  const k = kopplung(); if (!k) return true;
  let ok = false;
  try { const r = await fetch(KOPPLUNG.api(k.stufe) + k.id, { method: 'DELETE', headers: { 'X-Schreib': k.schreib }, credentials: 'omit', cache: 'no-store' }); ok = r.status === 204 || r.ok || r.status === 404; } catch {}
  delete ROOT.eltern[ROOT.cur]; save();
  return ok;
}

/* ---------- Oberfläche (nur im Elternbereich) ---------- */
PANELS.koppeln = () => {
  const k = kopplung(), pn = profile().name === 'Ich' ? '' : profile().name;
  if (!k) return { title: '📲 Eltern-Handy koppeln', html: `<div class="kopplung">
      <p>Sieh auf deinem eigenen Handy, was dein Kind übt und wo es hakt – ohne Konto. Der Bericht wird auf diesem Gerät verschlüsselt; nur dein Handy hat den Schlüssel.</p>
      <label class="field"><span>Spitzname für den Bericht (freiwillig)</span><input id="kpName" maxlength="24" value="${esc(pn)}" placeholder="z. B. Lena" autocomplete="off"></label>
      <button class="btn primary block" id="kpGo">📲 Jetzt koppeln</button>
      <p class="small muted">Nach jeder Runde (höchstens alle 10 Minuten) lädt die App einen verschlüsselten Bericht hoch: geübte Zeit, Aufgaben, Stärken, Problemstellen, Fortschritt. Keine weiteren Personendaten. Ohne Aktualisierung wird er nach 90 Tagen gelöscht; du kannst die Kopplung jederzeit aufheben.</p>
      <p class="small muted">Bei gekoppeltem Eltern-Handy wird zusätzlich eine Ende-zu-Ende-verschlüsselte Sicherung des Lernstands gespeichert (siehe Datenschutzerklärung 10i). Mit dem Kopplungs-Link lässt sich der Fortschritt auf einem neuen Gerät wiederherstellen.</p>
    </div>`, init() {
      $('kpGo').onclick = async () => { const b = $('kpGo'); b.disabled = true; b.textContent = '⏳ …'; const ok = await elternKoppeln($('kpName').value);
        if (!ok) toast('Gekoppelt – der Bericht wird hochgeladen, sobald eine Verbindung besteht', 2600); showPanel('koppeln', {}, false); };
    } };
  const url = kopplungLink(k), wann = k.last ? new Date(k.last).toLocaleString(I18N.lang === 'de' ? 'de-DE' : I18N.lang === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '–';
  return { title: '📲 Eltern-Handy gekoppelt', html: `<div class="kopplung">
      <p>Scanne den Code mit dem Eltern-Handy oder schick dir den Link. Die Seite zeigt den Lernstand${k.name ? ` von <b translate="no">${esc(k.name)}</b>` : ''}.</p>
      <div class="qrbox">${qrSvg(url)}</div>
      <div class="row2"><button class="btn primary" id="kpShare">📤 Link teilen</button><button class="btn" id="kpSync">🔄 Jetzt aktualisieren</button></div>
      <p class="small muted">Zuletzt hochgeladen: <span translate="no">${esc(wann)}</span>${k.fehler ? ` · <span class="kp-err">Fehler ${esc(String(k.fehler))}</span>` : ''}</p>
      <p class="small muted">Der Link enthält den Schlüssel – bitte nur an Eltern weitergeben. Er stellt auch den Fortschritt auf einem neuen Gerät wieder her (Elternbereich → Fortschritt wiederherstellen).</p>
      <button class="btn block kp-off" id="kpOff">Kopplung aufheben</button>
    </div>`, init() {
      $('kpShare').onclick = () => shareText(`Zahlensprint – Lernstand${k.name ? ' von ' + k.name : ''}\n${url}`, 'Zahlensprint – Eltern-Bericht', url);
      $('kpSync').onclick = async () => { const ok = await elternSync(true); toast(ok ? '✓ Bericht aktualisiert' : 'Gerade keine Verbindung – bitte später nochmal', 2000); showPanel('koppeln', {}, false); };
      $('kpOff').onclick = async () => { if (!confirm(tr('Kopplung aufheben? Der Bericht wird vom Server gelöscht und der Link funktioniert nicht mehr.'))) return;
        const ok = await elternEntkoppeln(); toast(ok ? 'Kopplung aufgehoben' : 'Kopplung aufgehoben – der Server war nicht erreichbar, der Bericht verfällt nach 90 Tagen', 2600); showPanel('koppeln', {}, false); };
    } };
};

/* ---------- Fortschritt wiederherstellen (neues Gerät): Kopplungs-Link einfügen ---------- */
function linkLesen(text) {
  const m = String(text || '').trim().match(/^(?:https?:\/\/([^\/#\s]+)[^#\s]*)?#?([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})\s*$/);
  if (!m) return null;
  return { id: m[2], key: m[3], stufe: m[1] && /^(staging\.|localhost|127\.)/.test(m[1]) ? 'test' : m[1] ? 'live' : KOPPLUNG.stufe() };
}
async function sicherungHolen(l) {
  let r; try { r = await fetch(KOPPLUNG.sich(l.stufe) + l.id, { credentials: 'omit', cache: 'no-store' }); } catch { return { fehler: 'netz' }; }
  if (r.status === 404) return { fehler: 'keine' };
  if (!r.ok) return { fehler: 'netz' };
  let s; try { const j = await r.json(); s = JSON.parse(await entschluesseln(j.d, l.key)); } catch { return { fehler: 'schluessel' }; }
  if (!s || s.app !== 'rechenblitz' || !s.daten || !s.daten.profil) return { fehler: 'andere' };
  return { s };
}
async function sicherungUebernehmen(l, s) {
  const p = ROOT.profiles[ROOT.cur], d = s.daten;
  p.data = d.profil.data; if (d.profil.name) p.name = d.profil.name; if (d.profil.emoji) p.emoji = d.profil.emoji;
  if (d.pro && d.pro.code && !(ROOT.pro && ROOT.pro.code)) ROOT.pro = d.pro;
  ROOT.eltern = ROOT.eltern || {};
  ROOT.eltern[ROOT.cur] = { id: l.id, key: l.key, schreib: s.schreib, stufe: l.stufe, seit: Date.now(), last: 0, ...(d.kopplungName ? { name: d.kopplungName } : {}) };
  useProfile(ROOT.cur); save();
  try { if (typeof proStartup === 'function') proStartup(); } catch {}
  try { applyTheme(); renderHome(); } catch {}
}
PANELS.wiederherstellen = () => ({ title: '♻️ Fortschritt wiederherstellen', html: `<div class="kopplung">
    <p>Neues Gerät oder Browserdaten gelöscht? Ist das Eltern-Handy gekoppelt, liegt eine verschlüsselte Sicherung bereit. Auf der Eltern-Seite gibt es dafür den Knopf „Neues Gerät des Kindes? Fortschritt übertragen“.</p>
    <label class="field"><span>Kopplungs-Link einfügen</span><input id="wdLink" autocomplete="off" spellcheck="false" placeholder="https://…/eltern-bericht/#…" translate="no"></label>
    <button class="btn primary block" id="wdGo">♻️ Wiederherstellen</button>
    <p class="small muted" id="wdMsg" role="status"></p>
  </div>`, init() {
    const msg = t => { $('wdMsg').textContent = t; };   // deutscher Text, die Seite übersetzt ihn selbst
    $('wdGo').onclick = async () => {
      const l = linkLesen($('wdLink').value); if (!l) return msg('Das ist kein gültiger Kopplungs-Link.');
      msg('⏳ …'); const r = await sicherungHolen(l);
      if (r.fehler) return msg({ keine: 'Keine Sicherung gefunden.', andere: 'Dieser Link gehört zu einer anderen App.', schluessel: 'Der Link passt nicht zur Sicherung.', netz: 'Gerade keine Verbindung – bitte später nochmal.' }[r.fehler]);
      const vorhanden = (S.total || 0) > 0 || Object.keys(S.hist || {}).length > 0;
      if (vorhanden && !confirm(tr('Auf diesem Gerät gibt es schon einen Lernstand. Mit der Sicherung überschreiben?'))) return msg('Nichts geändert.');
      await sicherungUebernehmen(l, r.s);
      closeSheet(); toast('♻️ Fortschritt wiederhergestellt', 2600);
    };
  } });
