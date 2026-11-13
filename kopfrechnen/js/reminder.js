'use strict';
/* =====================================================================
   Rechenblitz – Erinnerung aufs Handy (Web-Push), gleiche Bedienung wie der Mathe-Trainer
   (Leitstand-Übergaben 33/34/38). Server: GET {api}/schluessel, POST {api} {abo, zeit},
   POST {api}/aus {endpoint}. Die Mitteilung hat keinen Inhalt – den Text legt die App
   im Cache ab, der Service Worker zeigt ihn an. Gespeichert wird auf dem Server nur die
   Push-Adresse des Geräts und die Uhrzeit (kein Lernstand, kein Name).
   ===================================================================== */
const Reminder = {
  CACHE: 'rechenblitz-push', KEY: 'push-info',
  api: () => (CONFIG.push && CONFIG.push.endpoint) || '',
  supported: () => !!(Reminder.api() && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window),
  st: () => (ROOT.push ||= { on: false, zeit: (CONFIG.push && CONFIG.push.time) || '17:00', sync: '' }),
  async reg() { return navigator.serviceWorker.getRegistration() .then(r => r || navigator.serviceWorker.ready); },
  async sub() { try { const r = await Reminder.reg(); return r ? await r.pushManager.getSubscription() : null; } catch { return null; } },
  /** Echter Zustand: Erlaubnis + Anmeldung im Browser (nicht nur der gespeicherte Wunsch) */
  async state() {
    if (!Reminder.supported()) return { mode: isIOS() && !isStandalone() ? 'ios' : 'none', on: false };
    const perm = Notification.permission;
    if (perm === 'denied') return { mode: 'denied', on: false };
    const s = perm === 'granted' ? await Reminder.sub() : null;
    return { mode: 'ok', on: !!s, sub: s };
  },
  /** Text für die Mitteilung in der aktuellen Sprache an den Service Worker übergeben */
  async storeText() {
    if (!('caches' in window)) return;
    const info = { title: tr('Rechenblitz ⚡'), body: tr('Zeit für 3 Minuten Kopfrechnen! Dein Gehirn freut sich.'), zeit: Reminder.st().zeit, api: Reminder.api() };
    try { const c = await caches.open(Reminder.CACHE); await c.put(Reminder.KEY, new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json' } })); } catch {}
  },
  async post(path, body) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(Reminder.api() + path, { method: path === '/schluessel' ? 'GET' : 'POST', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(j.error || j.fehler || 'HTTP ' + r.status); e.status = r.status; throw e; }
      return j;
    } finally { clearTimeout(to); }
  },
  async on() {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { const e = new Error(perm === 'denied' ? 'denied' : 'dismissed'); e.code = perm; throw e; }
    const r = await Reminder.reg();
    let s = await r.pushManager.getSubscription();
    if (!s) {
      const { key } = await Reminder.post('/schluessel');
      const raw = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((key.length + 3) % 4)), c => c.charCodeAt(0));
      s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: raw });
    }
    await Reminder.send(s);
    Reminder.st().on = true; save();
  },
  async send(s) {
    await Reminder.storeText();
    await Reminder.post('', { abo: s.toJSON(), zeit: Reminder.st().zeit });
    Reminder.st().sync = todayStr(); save();
  },
  async off() {
    const s = await Reminder.sub();
    if (s) { try { await Reminder.post('/aus', { endpoint: s.endpoint }); } catch {} try { await s.unsubscribe(); } catch {} }
    Reminder.st().on = false; save();
  },
  /** Beim Start: Text aktualisieren, einmal am Tag beim Server melden (hält die Anmeldung frisch) */
  async startup() {
    if (!Reminder.supported()) return;
    const st = Reminder.st(), s = Notification.permission === 'granted' ? await Reminder.sub() : null;
    if (!s) { if (st.on) { st.on = false; save(); } return; }
    await Reminder.storeText();
    if (st.sync !== todayStr() && navigator.onLine) Reminder.send(s).catch(() => {});
  },
};

/* ---------- Bereich in den Einstellungen ---------- */
function reminderHtml() {
  return `<div class="setrow col remind" id="remBox"><div><b>🔔 Erinnerung aufs Handy</b><span>Einmal am Tag zu deiner Uhrzeit</span></div><div class="small muted">…</div></div>`;
}
async function renderReminder() {
  const box = $('remBox'); if (!box) return;
  const s = await Reminder.state(), st = Reminder.st();
  const steps = (isIOS()
    ? ['iPhone/iPad: Einstellungen öffnen', '„Mitteilungen“ → „Rechenblitz“', '„Mitteilungen erlauben“ einschalten']
    : isStandalone()
      ? ['Android-Einstellungen öffnen', '„Apps“ → „Rechenblitz“ → „Benachrichtigungen“', 'Einschalten und hier den Schalter antippen']
      : ['Oben links neben der Adresse auf das Schloss bzw. den Regler tippen', '„Berechtigungen“ → „Benachrichtigungen“', '„Zulassen“ wählen und die Seite neu laden']);
  const install = !isStandalone() && (installPrompt || isIOS() || s.mode === 'ios')
    ? `<div class="rem-hint">📱 <span>Am besten als App installieren – dann kommt die Erinnerung wie bei jeder App.</span> <button class="linkbtn" data-go="install">So geht’s</button></div>` : '';
  let body;
  if (s.mode === 'none') body = `<p class="small muted" style="margin:0">Dieser Browser kann leider keine Erinnerungen anzeigen.</p>`;
  else if (s.mode === 'ios') body = `<p class="small muted" style="margin:0">Auf dem iPhone und iPad gehen Erinnerungen nur, wenn Rechenblitz als App auf dem Home-Bildschirm liegt.</p>`;
  else body = `<button class="setrow sw-inner" id="remSw" role="switch" aria-checked="${s.on}" ${s.mode === 'denied' ? 'disabled' : ''}><div><b>${s.on ? 'An' : 'Aus'}</b><span>${s.on ? `Jeden Tag um ${esc(st.zeit)} Uhr` : 'Tippe, um die Erinnerung einzuschalten'}</span></div><span class="switch ${s.on ? 'on' : ''}"></span></button>
    ${s.on ? `<label class="rem-time"><span>Uhrzeit</span><input type="time" id="remTime" step="300" value="${esc(st.zeit)}"></label>` : ''}
    ${s.mode === 'denied' ? `<div class="rem-denied"><b>Mitteilungen sind gesperrt.</b> So erlaubst du sie:<ol>${steps.map(x => `<li>${x}</li>`).join('')}</ol></div>` : ''}
    <p class="small muted" style="margin:0">Gespeichert wird nur die Push-Adresse dieses Geräts und die Uhrzeit – kein Name, kein Lernstand. <a href="${esc(CONFIG.privacyUrl)}" target="_blank" rel="noopener">Datenschutz</a></p>
    <div class="status" id="remStatus" role="status"></div>`;
  box.innerHTML = `<div><b>🔔 Erinnerung aufs Handy</b><span>Einmal am Tag zu deiner Uhrzeit</span></div>${body}${install}`;
  const msg = (t, ok) => { const el = $('remStatus'); if (el) { el.textContent = t; el.className = 'status ' + (ok ? 'ok' : 'err'); } };
  const sw = $('remSw');
  if (sw) sw.onclick = async () => {
    sw.disabled = true; Sound.click();
    try {
      if (s.on) { await Reminder.off(); await renderReminder(); msg('Erinnerung ist aus.', true); }
      else { await Reminder.on(); await renderReminder(); msg(`Erinnerung ist an – jeden Tag um ${st.zeit} Uhr.`, true); }
    } catch (e) {
      await renderReminder();
      msg(e.code === 'denied' ? 'Mitteilungen sind gesperrt – siehe Anleitung oben.' : e.code === 'default' ? 'Ohne Erlaubnis geht es leider nicht.' : !navigator.onLine ? 'Keine Internetverbindung – bitte später noch einmal.' : e.status === 429 ? 'Zu viele Versuche – bitte später erneut.' : 'Das hat nicht geklappt – bitte später noch einmal.', false);
    }
  };
  const tm = $('remTime');
  if (tm) tm.onchange = async () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(tm.value)) return;
    st.zeit = tm.value; save();
    try { const sub = await Reminder.sub(); if (sub) await Reminder.send(sub); msg(`Gespeichert: jeden Tag um ${st.zeit} Uhr.`, true); const b = sw && sw.querySelector('span'); if (b) b.textContent = `Jeden Tag um ${st.zeit} Uhr`; }
    catch { msg('Das hat nicht geklappt – bitte später noch einmal.', false); }
  };
}
