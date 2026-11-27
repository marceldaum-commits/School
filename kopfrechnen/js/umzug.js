'use strict';
/* ================= Umzug auf die gemeinsame Adresse (Marcel 19.11.2026) =================
   Alle Lern-Apps ziehen nach lernen.mathenachhilfe-online.com/<app>/ (Test: lernen-test.…).
   Dieselbe Version läuft auf der alten und der neuen Adresse:
   Standard: UMZUG-LERNEN.md (AppZentrale, Stand 2a584ec). Seit der Umbenennung (24.11.2026) zuerst lernen(-test).…/zahlensprint/, sonst /rechenblitz/.
   ALT (rechenblitz[-test].mathenachhilfe-online.com): eigene Speicher-Schlüssel einsammeln → {"app","v":1,"umzug":true,"daten"} mit AES-GCM-256 →
     als Einmal-Sicherung PUT trainer(-test)…/eltern/v1/s/<id> (X-Schreib) → weiterleiten auf die neue Adresse mit #umzug=<id>.<key>.<schreib>
     (?thema=…, #pro=…, #auftrag=… usw. bleiben erhalten). Der Schlüssel steht nur im Teil nach „#“ und geht nie an einen Server.
   NEU: Sicherung holen, entschlüsseln, NUR übernehmen, wenn hier noch kein Lernstand liegt, dann DELETE und „umzug=“ aus der Adresse.
   Schaltet sich erst ein, wenn CONFIG.umzug gesetzt ist (Leitstand meldet: neue Adresse läuft) – vorher ändert sich nichts. */
const UMZUG = {
  KEYS: ['rechenblitz', 'rb-classes', 'rb-teacher'],          // alle eigenen Schlüssel im Browser-Speicher
  alt: () => /^rechenblitz(-test)?\.mathenachhilfe-online\.com$/.test(location.hostname),
  stufe: () => /^rechenblitz-test\./.test(location.hostname) ? 'test' : 'live',
  // Zielpfad: zuerst /zahlensprint/ (neuer Name), sonst /rechenblitz/ – welcher wirklich die App ausliefert, zeigt die Probe in umzugAlt()
  pfade: ['zahlensprint', 'rechenblitz'], pfad: 'zahlensprint',
  ziel: st => (st === 'test' ? 'https://lernen-test.' : 'https://lernen.') + 'mathenachhilfe-online.com/' + UMZUG.pfad + '/',
};
const umzugAn = () => !!(typeof CONFIG === 'object' && CONFIG.umzug) && !(typeof IS_NATIVE !== 'undefined' && IS_NATIVE);
// Zieladresse: Pfad bleibt (z. B. index.html), Abfrage bleibt, Hash bekommt vorne „umzug=…“ (andere Angaben bleiben dahinter)
function umzugZielUrl(token) {
  const rest = location.hash.replace(/^#/, ''), file = location.pathname.replace(/^\/+/, '').replace(/^index\.html$/, '');
  const hash = [token ? 'umzug=' + token : '', rest].filter(Boolean).join('&');
  return UMZUG.ziel(UMZUG.stufe()) + file + location.search + (hash ? '#' + hash : '');
}
function umzugDaten() {
  const d = {}; for (const k of UMZUG.KEYS) { try { const v = localStorage.getItem(k); if (v != null) d[k] = v; } catch {} }
  return d;
}
// ALT: einpacken, hochladen, weiterleiten. Gibt false zurück, wenn die App hier normal starten soll.
async function umzugAlt() {
  // Liefert die neue Adresse wirklich Rechenblitz aus? Eigenes App-Symbol als Bild laden (404, falsche Seite oder kein Netz → Fehler).
  // Sonst hier bleiben und beim nächsten Start erneut versuchen (Standard UMZUG-LERNEN.md)
  const probe = ziel => new Promise(res => { const im = new Image(), t = setTimeout(() => res(false), 8000); im.onload = () => { clearTimeout(t); res(im.naturalWidth === 192); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = ziel + 'icons/icon-192.png?u=' + Date.now(); });
  let bereit = false;
  for (const pf of UMZUG.pfade) { UMZUG.pfad = pf; if (await probe(UMZUG.ziel(UMZUG.stufe()))) { bereit = true; break; } }
  if (!bereit) return false;
  const daten = umzugDaten();
  if (!Object.keys(daten).length) { umzugWeiter(umzugZielUrl('')); return true; }   // nichts zu übertragen: nur weiterleiten
  const st = UMZUG.stufe(), k = { id: zufall(16), schreib: zufall(16), key: zufall(32) };
  try {
    umzugHinweis('Wir ziehen um …');
    const body = await verschluesseln(JSON.stringify({ app: 'rechenblitz', v: 1, umzug: true, version: APP_VERSION, daten }), k.key);
    if (body.length > KOPPLUNG.SMAX) return false;
    const r = await fetch(KOPPLUNG.sich(st) + k.id, { method: 'PUT', headers: { 'Content-Type': 'text/plain', 'X-Schreib': k.schreib }, body, credentials: 'omit', cache: 'no-store' });
    if (!(r.status === 204 || r.ok)) return false;                 // Server nicht bereit: hier bleiben, beim nächsten Start erneut
  } catch { return false; }                                        // offline: hier bleiben, nichts geht verloren
  // Kein „schon umgezogen“-Merker: Klappt das Einlösen auf der neuen Adresse nicht, bleibt der Lernstand hier und zieht beim nächsten Start erneut um.
  umzugWeiter(umzugZielUrl(`${k.id}.${k.key}.${k.schreib}`));
  return true;
}
// Hinweis auf dem Startbild (die Oberfläche ist noch nicht geladen)
const umzugTr = t => typeof tr === 'function' ? tr(t) : t;
function umzugHinweis(t) { window.__bootHold = true; try { const el = document.querySelector('#boot small'); if (el) el.textContent = umzugTr(t); } catch {} }
const umzugInstalliert = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
// Weiterleiten – in der installierten App (Home-Bildschirm) stattdessen „Bitte neu installieren“ mit Knopf zur neuen Adresse
function umzugWeiter(url) {
  if (!umzugInstalliert()) { location.replace(url); return; }
  window.__bootHold = true;
  const b = document.getElementById('boot'); if (!b) { location.replace(url); return; }
  b.innerHTML = `<div class="umzug-box"><b>${esc(umzugTr('Zahlensprint ist umgezogen'))}</b><p>${esc(umzugTr('Dein Lernstand ist schon unterwegs. Öffne die neue Adresse und installiere die App dort bitte neu auf dem Startbildschirm. Diese alte App kannst du danach löschen.'))}</p><a class="umzug-btn" href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener">${esc(umzugTr('Zur neuen Adresse'))}</a><small>${UMZUG.ziel(UMZUG.stufe()).replace(/^https:\/\//, '')}</small></div>`;
}
// NEU: „#umzug=<id>.<key>.<schreib>“ einlösen. Läuft vor loadRoot()/init().
async function umzugNeu() {
  const m = location.hash.match(/^#(?:.*&)?umzug=([\w-]{16,32})\.([\w-]{40,48})\.([\w-]{16,32})(?:&|$)/);
  if (!m) return;
  const rest = location.hash.slice(1).split('&').filter(x => !x.startsWith('umzug=')).join('&');
  try { history.replaceState(null, '', location.pathname + location.search + (rest ? '#' + rest : '')); } catch {}
  const id = m[1], key = m[2], schreib = m[3], st = /^(lernen-test\.|localhost|127\.)/.test(location.hostname) ? 'test' : 'live';
  let s; try {
    const r = await fetch(KOPPLUNG.sich(st) + id, { credentials: 'omit', cache: 'no-store' });
    if (!r.ok) return;
    let d = (await r.json()).d; if (typeof d === 'string' && d.startsWith('{')) d = JSON.parse(d).d;   // Server speichert den Text so, wie er kam
    s = JSON.parse(await entschluesseln(d, key));
  } catch { return; }
  if (!s || s.app !== 'rechenblitz' || s.umzug !== true || !s.daten) return;
  let leer = true; try { leer = UMZUG.KEYS.every(k => localStorage.getItem(k) == null); } catch {}
  if (leer) for (const [k, v] of Object.entries(s.daten)) if (UMZUG.KEYS.includes(k) && typeof v === 'string') { try { localStorage.setItem(k, v); } catch {} }
  try { await fetch(KOPPLUNG.sich(st) + id, { method: 'DELETE', headers: { 'X-Schreib': schreib }, credentials: 'omit', cache: 'no-store' }); } catch {}
  window.__umzugOk = leer;
}
// Vor dem Start: auf der alten Adresse umziehen (Start bleibt dann hinter dem Startbild stehen), auf der neuen einlösen
async function umzugStart() {
  if (!umzugAn()) return;
  if (UMZUG.alt()) { if (await umzugAlt()) return new Promise(() => {}); return; }
  await umzugNeu();
}
