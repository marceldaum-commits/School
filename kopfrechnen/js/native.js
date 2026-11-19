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
/* ---------- APK ab Hülle 2: Inhalte kommen von selbst (Marcel 15.11.: „der Updateserver soll der Git sein“) ----------
   Die App lädt neue Stände im Hintergrund von GitHub (Ersatz: eigener Server), prüft jede Datei und übernimmt
   nur vollständige Stände – beim nächsten Start oder von selbst, sobald man auf der Startseite ist. Eine neue APK ist nur nötig,
   wenn sich die App-Hülle ändert (stand.json „shell“). */
const RbUpd = () => (IS_NATIVE && window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.RbUpdate) || null;
let liveUpd = null;
async function liveUpdateCheck(force) {
  const U = RbUpd(); if (!U) return null;
  try { liveUpd = force ? await U.check() : await U.status(); } catch { return null; }
  renderLiveUpdate();
  if (liveUpd.needShell) shellApkFetch();
  if (liveUpd.store === 'play') playUpdateCheck(!!liveUpd.needShell);
  return liveUpd;
}
/** Play-Fassung: neue App-Hülle über die In-App-Updates von Google Play – flexibel im Hintergrund,
    sofort, wenn der geladene Inhalt eine neuere Hülle braucht. Einspielen von selbst auf der Startseite. */
let playChecked = false, playReadyT = 0;
async function playUpdateCheck(immediate) {
  const U = RbUpd(); if (!U || !U.playUpdate || (playChecked && !immediate)) return;
  playChecked = true;
  try { const r = await U.playUpdate({ immediate }); if (r && r.result === 'downloaded') playAutoComplete(); } catch {}
}
function playAutoComplete() {
  clearTimeout(playReadyT);
  if (typeof currentScreen !== 'function' || currentScreen() !== 'home' || (typeof Sheet !== 'undefined' && Sheet.open) || document.hidden) { playReadyT = setTimeout(playAutoComplete, 4000); return; }
  try { save(); } catch {}
  RbUpd()?.playComplete().catch(() => {});
}
if (RbUpd() && RbUpd().addListener) RbUpd().addListener('playReady', () => playAutoComplete()).catch?.(() => {});
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.mathenachhilfeonline.rechenblitz';
async function shellApkFetch() {   // Download-Adresse der neuen APK (GitHub-Release) für die Karte
  if (liveUpd && liveUpd.store === 'play') { liveUpd.apkUrl = PLAY_URL; renderLiveUpdate(); return; }   // Play-Fassung: neue App nur über Google Play
  const cfg = CONFIG.apkUpdates; if (!cfg || !cfg.repo || !navigator.onLine) return;
  try {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return;
    const j = await r.json(), apk = (j.assets || []).find(a => /\.apk$/i.test(a.name));
    if (apk && liveUpd) { liveUpd.apkUrl = apk.browser_download_url; renderLiveUpdate(); }
  } catch {}
}
/** geladenen Stand automatisch aktivieren – erst auf der Startseite, nie mitten in einer Runde (Marcel 15.11.: kein Update-Knopf) */
let autoApplyT = 0;
function nativeAutoApply() {
  clearTimeout(autoApplyT);
  const v = liveUpd && liveUpd.pending; if (!v || v === APP_VERSION) return;
  let tried = null; try { tried = sessionStorage.getItem('rbApplied'); } catch {}
  if (tried === v) return;   // höchstens ein Versuch je Version und Sitzung
  if (typeof currentScreen !== 'function' || currentScreen() !== 'home' || (typeof Sheet !== 'undefined' && Sheet.open) || document.hidden) { autoApplyT = setTimeout(nativeAutoApply, 4000); return; }
  try { sessionStorage.setItem('rbApplied', v); } catch {}
  try { save(); } catch {}
  RbUpd()?.apply().catch(() => {});
}
function renderLiveUpdate() {
  const u = liveUpd || {}, home = $('home');
  let el = $('apkUpd');
  if (!u.needShell && u.pending && u.pending !== APP_VERSION) nativeAutoApply();   // neuer Stand geladen → von selbst einspielen
  const kind = u.needShell ? 'shell' : '';
  if (!kind || !home) { if (el) el.remove(); return; }
  if (!el) { home.querySelector('.col-left').insertAdjacentHTML('afterbegin', '<div class="card apk-upd" id="apkUpd"></div>'); el = $('apkUpd'); }
  el.innerHTML = kind === 'ready'
    ? `<div class="ch-ico">✨</div><div class="ch-txt"><b>Version ${esc(u.pending)} ist geladen</b><span>Lernstand bleibt erhalten</span></div><button class="btn small primary" id="apkGo">Jetzt neu starten</button>`
    : u.store === 'play'
      ? `<div class="ch-ico">⬆️</div><div class="ch-txt"><b>Neue App-Version nötig</b><span>Für Version ${esc(u.needVersion || '')} bitte Rechenblitz im Play Store aktualisieren – der Lernstand bleibt</span></div><button class="btn small primary" id="apkGo">Play Store</button>`
      : `<div class="ch-ico">⬆️</div><div class="ch-txt"><b>Neue App-Version nötig</b><span>Für Version ${esc(u.needVersion || '')} bitte die App einmal neu installieren – der Lernstand bleibt</span></div>${u.apkUrl ? '<button class="btn small primary" id="apkGo">Herunterladen</button>' : ''}`;
  $('apkGo') && ($('apkGo').onclick = () => {
    if (kind === 'ready') { save(); RbUpd()?.apply().catch(() => {}); return; }
    if (u.store === 'play') { location.href = PLAY_URL; return; }
    toast('Download startet – danach „Installieren“ antippen', 3000); setTimeout(() => { location.href = u.apkUrl; }, 400);
  });
}
if (RbUpd()) RbUpd().addListener('ready', s => { liveUpd = s; renderLiveUpdate(); if (s.needShell) shellApkFetch(); }).catch?.(() => {});

async function apkUpdateCheck(force) {
  if (RbUpd()) return liveUpdateCheck(force);   // neue Hülle: Inhalte über stand.json, kein APK-Download nötig
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

/* ---------- APK: Startbildschirm-Widget mit aktuellen Zahlen füttern (Marcel 15.11.) ----------
   Merk-Training, Tagesziel, Serie und „Heute dran“ – fertig übersetzt; das Widget zeigt sie an.
   Ist der Stand nicht von heute, zeigt das Widget stattdessen eine Einladung zum Üben. */
let widgetT = 0;
function widgetUpdate() {
  const W = IS_NATIVE && window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.RbWidget;
  if (!W || typeof S === 'undefined' || !S) return;
  clearTimeout(widgetT);
  widgetT = setTimeout(() => {
    try {
      const today = todayStr(), m = typeof merkStats === 'function' ? merkStats() : null;
      const solved = S.today.date === today ? S.today.solved : 0;
      const streak = S.days.last === today || S.days.last === dayStr(1) ? S.days.streak : 0;
      const next = m && m.todo ? merkQueue()[0] : null;
      const line1 = m && m.todo ? tr(`🧠 ${m.todo} Aufgaben warten · ca. 3 Min.`)
        : m && merkSolidAll() ? tr(`🧠 Alles wiederholt ✓ · ${merkSolidAll()} sitzen fest`) : tr('🧠 Zeit für 3 Minuten Kopfrechnen!');
      const line2 = [tr(`🎯 ${solved}/${DAILY_GOAL} heute`), tr(`🌱 ${typeof weekCount === 'function' ? weekCount() : 0}/7 diese Woche`), next ? `${tr('Heute dran:')} ${i18nNumbers(taskText(merkTask(next)))}` : ''].filter(Boolean).join(' · ');
      W.update({ title: 'Rechenblitz', line1, line2, button: tr('Los'), idle1: tr('🧠 Zeit für 3 Minuten Kopfrechnen!'), idle2: tr('Tippe hier – Blitz wartet schon'), day: today }).catch(() => {});
    } catch {}
  }, 300);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) widgetUpdate(); });
