'use strict';
/* =====================================================================
   Rechenblitz als Android-App (APK, Capacitor): dieselben Dateien wie die Web-App,
   aber alles liegt im Paket → läuft komplett ohne Internet (Marcel 13.11.2026:
   „Wer erwirbt eine Rechenapp mit Internetzwang“). Diese Datei läuft direkt nach
   config.js und passt nur in der APK ein paar Einstellungen an; im Browser tut sie nichts.
   ===================================================================== */
const IS_NATIVE = !!(window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform());
if (IS_NATIVE) {
  const c = (window.RECHENBLITZ_CONFIG ||= {});
  const base = (c.nativeServer || 'https://rechenblitz.mathenachhilfe-online.com').replace(/\/$/, '');
  const abs = v => (typeof v === 'string' && v.startsWith('/') ? base + v : v);
  // Server-Funktionen (Fehler melden, Gutschein, Klassen) gehen an die Live-Seite – ohne Netz wartet alles im Postausgang
  c.reportEndpoint = abs(c.reportEndpoint);
  c.classApi = abs(c.classApi);
  if (c.adventVoucher) c.adventVoucher = { ...c.adventVoucher, endpoint: abs(c.adventVoucher.endpoint) };
  // Erinnerung: in der APK lokal auf dem Gerät geplant (kein Server, kein Internet nötig)
  if (c.push) c.push = { ...c.push, endpoint: 'native' };
  c.appUrl ||= c.publicUrl;   // geteilte Links/QR-Codes zeigen auf die öffentliche Web-App
  document.documentElement.classList.add('native');
}

/* ---------- APK: Selbst-Aktualisierung über GitHub-Releases (Marcel 14.11.2026) ----------
   Solange die App nicht im Play Store ist: höchstens einmal am Tag die neueste Release-Seite
   (rechenblitz-X.Y.Z) abfragen. Ist sie neuer, erscheint oben eine Karte „Jetzt aktualisieren“;
   der Knopf öffnet den APK-Download, Android fragt dann „Installieren?“ (gleicher Schlüssel →
   Update, Lernstand bleibt). Für die Play-Store-Fassung in config.js apkUpdates: null setzen. */
const verNum = v => String(v || '').split('.').map(Number).reduce((a, n) => a * 1000 + (n || 0), 0);
const apkNewer = v => !!v && verNum(v) > verNum(APP_VERSION);
async function apkUpdateCheck(force) {
  const cfg = CONFIG.apkUpdates;
  if (!IS_NATIVE || !cfg || !cfg.repo) return null;
  const st = (ROOT.apkUpd ||= {});
  if (!force && st.day === todayStr()) { renderApkUpdate(); return st; }
  if (!navigator.onLine) return null;
  try {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return null;
    const j = await r.json(), ver = String(j.tag_name || '').replace(/^rechenblitz-/, ''), apk = (j.assets || []).find(a => /\.apk$/i.test(a.name));
    Object.assign(st, { day: todayStr(), ver, url: apk ? apk.browser_download_url : '' }); save();
  } catch { return null; }
  renderApkUpdate();
  return st;
}
function renderApkUpdate() {
  const st = ROOT.apkUpd || {}, show = IS_NATIVE && apkNewer(st.ver) && st.url;
  let el = $('apkUpd');
  if (!show) { if (el) el.remove(); return; }
  if (!el) { $('home').querySelector('.col-left').insertAdjacentHTML('afterbegin', '<div class="card apk-upd" id="apkUpd"></div>'); el = $('apkUpd'); }
  el.innerHTML = `<div class="ch-ico">⬆️</div><div class="ch-txt"><b>Neue Version ${esc(st.ver)} ist da</b><span>Lernstand bleibt erhalten</span></div><button class="btn small primary" id="apkGo">Jetzt aktualisieren</button>`;
  $('apkGo').onclick = () => { toast('Download startet – danach „Installieren“ antippen', 3000); setTimeout(() => { location.href = st.url; }, 400); };
}
