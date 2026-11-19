'use strict';
/* ================= Vorlesen mit der KI-Stimme „Nova“ =================
   Rechenblitz liest nur noch mit Nova vor (Vorgabe Marcel 17.11.). Die App schickt nie etwas an OpenAI:
   1. Jeder Text hat eine feste Adresse auf unserem Stimmen-Server:
      https://stimmen.mathenachhilfe-online.com/nova/<h[0:2]>/<h>.mp3, h = SHA-256("nova|" + sprache + "|" + text_normalisiert), erste 32 Hex-Zeichen.
      Feste Texte (Theorie, Blitz) stehen in vorlesen/texte.json und sind dort vorab vertont.
   2. Fehlt die Datei (z. B. eine neue Rechenaufgabe), fragt die App unseren Server: POST /jetzt {text, sprache} (höchstens 300 Zeichen).
      Er lässt den Text einmalig vertonen und antwortet mit {url}.
   3. Immer ganze Sätze (nie aus Schnipseln zusammengesetzt). Die App wartet bis ca. 3,5 s (ab 0,7 s mit Ladehinweis);
      was länger dauert, lädt im Hintergrund weiter und liegt beim nächsten Mal bereit.
   4. Gerätestimme NUR ohne Netz (und nichts offline geladen). Ist Nova bei bestehendem Netz nicht erreichbar:
      lieber still und einmal je Sitzung ein dezenter Hinweis (Vorgabe Marcel 17.11.).
   Es werden keine Namen, Konten oder Geräte-Kennungen übertragen. Tempo (1,25) legt der Server fest. */
// Sprechtempo aus den Einstellungen (1,0 = Server-Tempo); Stufen wie bei allen Apps
const RATES = [0.75, 0.9, 1, 1.15, 1.3, 1.5];
const speechRate = () => RATES.includes(S.settings.rate) ? S.settings.rate : 1;
const novaNorm = s => String(s).normalize('NFC').replace(/\s+/g, ' ').trim();
const Nova = {
  miss: new Map(), pending: new Map(), audio: null, fail: '', WAIT: 3500,
  cfg: () => CONFIG.nova || {},
  base: () => (Nova.cfg().base || '').replace(/\/?$/, '/'),
  can: () => CONFIG.vorlesen !== false && !!Nova.cfg().base && !!(window.crypto && crypto.subtle),
  // In der Android-App normales fetch (nicht über die Capacitor-Brücke)
  get: (url, o) => (window.CapacitorWebFetch || fetch)(url, o),
  async hash(lang, text) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nova|' + lang + '|' + novaNorm(text)));
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  },
  async url(lang, text) { const h = await this.hash(lang, text); return `${this.base()}${h.slice(0, 2)}/${h}.mp3`; },
  // keine echten Namen an den Server: ein Profilname (als ganzes Wort) wird vor dem Senden herausgenommen.
  // Ausnahmen: „Ich“ (Standard) und die Namen aus den Textaufgaben (Lena, Tim …) – die sind allgemein.
  scrub(text) {
    let s = text;
    try {
      for (const p of Object.values(ROOT.profiles || {})) {
        const n = p && p.name && p.name.trim(); if (!n || n.length < 2 || n === 'Ich' || (typeof NAMES !== 'undefined' && NAMES.includes(n))) continue;
        const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), w = `(?<![\\p{L}\\d])${e}(?![\\p{L}\\d])`;
        s = s.replace(new RegExp(`,\\s*${w}`, 'gu'), '').replace(new RegExp(`${w}\\s*,\\s*`, 'gu'), '').replace(new RegExp(w, 'gu'), '');
      }
    } catch {}
    return s === text ? s : s.replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  },
  async cachePut(url, blob) { try { const c = await caches.open('rechenblitz-nova'); await c.put(url, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } })); } catch {} },
  // Audiodatei holen: Gerätespeicher → feste Adresse → /jetzt; null = gerade nicht verfügbar (Grund in Nova.fail)
  async src(text, lang, jetzt = true) {
    const key = lang + '|' + novaNorm(text), pkey = key + (jetzt ? '' : '|nur-datei');
    if (!this.can()) { this.fail = 'aus'; return null; }
    if ((this.miss.get(key) || 0) > Date.now()) { this.fail = 'fehlt'; return null; }
    if (this.pending.has(pkey)) return this.pending.get(pkey);
    const job = (async () => {
      const url = await this.url(lang, text);
      try { const c = await caches.open('rechenblitz-nova'); const hit = await c.match(url); if (hit) return hit.blob(); } catch {}
      try {
        let r = await this.get(url);
        if (!r.ok && r.status === 404 && !jetzt) return null;   // nur nachsehen, ob es die fertige Datei gibt
        if (!r.ok && r.status === 404 && this.cfg().jetzt && novaNorm(text).length <= 300) {
          const ask = () => this.slot(() => this.get(this.cfg().jetzt, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: novaNorm(text), sprache: lang }) }));
          let j = await ask();
          // Serverfehler (5xx) oder Drossel bei vielen Anfragen (204): kurz warten und bis zu zweimal neu versuchen
          for (let k = 0; k < 2 && (j.status >= 500 || j.status === 204); k++) { await new Promise(r => setTimeout(r, 700 + 600 * k)); j = await ask(); }
          if (j.status !== 200) { this.miss.set(key, Date.now() + 20000); this.fail = 'fehlt'; return null; }   // weiter abgelehnt: in 20 s neu versuchen
          const u = (await j.json()).url; if (!u) { this.miss.set(key, Date.now() + 60000); this.fail = 'fehlt'; return null; }
          r = await this.get(new URL(u, this.cfg().jetzt).href);
        }
        if (!r.ok) { this.miss.set(key, Date.now() + 60000); this.fail = 'fehlt'; return null; }
        const b = await r.blob(); this.cachePut(url, b); return b;
      } catch { this.fail = navigator.onLine === false ? 'offline' : 'netz'; return null; }   // später wieder versuchen
    })();
    this.pending.set(pkey, job); job.finally(() => setTimeout(() => this.pending.delete(pkey), 60000));
    return job;
  },
  // ganze Sätze eines Textes (nicht an „z. B.“ oder Zahlen wie „2.5“ trennen)
  sentences: text => text.split(/(?<=(?:\p{L}{3,}|\d|\)|%|€)[.!?])\s+/u).map(x => x.trim()).filter(Boolean),
  // höchstens 2 Bestellungen gleichzeitig an /jetzt (der Server drosselt sonst und antwortet 204)
  slots: 0, waiting: [],
  async slot(fn) {
    if (this.slots >= 2) await new Promise(r => this.waiting.push(r));
    this.slots++;
    try { return await fn(); } finally { this.slots--; const n = this.waiting.shift(); if (n) n(); }
  },
  // vorab holen (z. B. die nächste Aufgabe in der Blitzrunde)
  prefetch(text, lang = I18N.lang) { if (text) this.src(text, lang); },
  stop() { if (this.audio) { try { this.audio.pause(); } catch {} this.audio = null; } },
  // Ladehinweis, wenn Nova etwas länger braucht
  busy(on) {
    clearTimeout(this.busyT);
    if (on) { this.busyT = setTimeout(() => { if (!$('novaLoad')) { const d = document.createElement('div'); d.id = 'novaLoad'; d.className = 'nova-load'; d.setAttribute('aria-hidden', 'true'); d.textContent = '🔊 …'; document.body.appendChild(d); } }, 700); }
    else $('novaLoad')?.remove();
  },
  // einmal je Sitzung: Nova gerade nicht erreichbar
  notice() { if (this.noticed) return; this.noticed = true; try { toast('🔇 ' + tr('Nova gerade nicht erreichbar'), 2600); } catch {} },
  // true = mit Nova gesprochen (oder abgebrochen); false = nicht möglich, Grund in Nova.fail ('offline' → Gerätestimme)
  async play(text, lang, cancelled = () => false, jetzt = true) {
    text = this.scrub(text); if (!text) return true;
    this.fail = ''; this.busy(true);
    const blob = await Promise.race([this.src(text, lang, jetzt), new Promise(r => setTimeout(() => r('zeit'), this.WAIT))]);
    this.busy(false);
    if (blob === 'zeit') { this.fail = navigator.onLine === false ? 'offline' : 'zeit'; return false; }   // lädt im Hintergrund weiter (pending)
    if (!blob) { if (!jetzt && !this.fail) this.fail = 'fehlt'; return false; }
    if (cancelled()) return true;
    const a = new Audio(URL.createObjectURL(blob)); a.preservesPitch = true; a.playbackRate = speechRate(); this.audio = a;   // Sprechtempo, gleiche Tonhöhe
    try { await a.play(); } catch { this.audio = null; this.fail = 'abspielen'; return false; }
    await new Promise(res => { a.onended = a.onerror = a.onpause = res; });
    URL.revokeObjectURL(a.src); if (this.audio === a) this.audio = null;
    return true;
  },
};
// ---------- Alle festen Nova-Texte offline laden (Vorgabe Marcel 17.11.) ----------
// Nur die eingestellte Sprache, nur fehlende Dateien, 4 parallel; Abbrechen und später weitermachen; 404 still überspringen.
// Gespeichert im Cache-Speicher der App (Web: Cache Storage, Android: derselbe Speicher im privaten App-Bereich der WebView).
const NovaOffline = {
  busy: false, stopFlag: false,
  host: () => (typeof IS_NATIVE !== 'undefined' && IS_NATIVE) ? 'rechenblitz.mathenachhilfe-online.com' : location.hostname,
  async all() { try { return ((await (await fetch('vorlesen/texte.json')).json()).texte || []); } catch { return []; } },
  async texts(lang = I18N.lang) { return (await this.all()).filter(t => t.sprache === lang).map(t => t.text); },
  // Größe aller Dateien laut Server (live, wird kleiner, wenn der Server neu kodiert)
  async stand() { try { const r = await Nova.get(`${Nova.base()}stand-${this.host()}.json`, { cache: 'no-cache' }); return r.ok ? await r.json() : null; } catch { return null; } },
  async cache() { try { return await caches.open('rechenblitz-nova'); } catch { return null; } },
  // was liegt schon auf dem Gerät: have (beliebige Qualität) / best (Bestqualität) dieser Sprache, total, bytes (alle Nova-Dateien)
  async status(lang = I18N.lang) {
    const c = await this.cache(), list = await this.texts(lang); let have = 0, best = 0, bytes = 0;
    if (c) { for (const t of list) { const r = await c.match(await Nova.url(lang, t)); if (r) { have++; if (r.headers.get('X-Nova-Q') === 'best') best++; } }
      for (const k of await c.keys()) { try { const r = await c.match(k); bytes += (await r.blob()).size; } catch {} } }
    return { have, best, total: list.length, bytes };
  },
  // geschätzte Download-Größe (MB) für die fehlenden Dateien dieser Sprache – Standard und Bestqualität.
  // Nach Textlänge gerechnet (Bytes pro Zeichen aus der Server-Übersicht), denn kurze Aufgaben-Sätze sind viel kleiner als Theorie-Texte.
  async estimate(lang = I18N.lang) {
    const [st, s, all] = await Promise.all([this.stand(), this.status(lang), this.all()]);
    if (!st || !st.bytes || !all.length) return { ...s, std: null, bestMb: null };
    const c = await this.cache(), chars = all.reduce((a, t) => a + t.text.length, 0) * (st.texte && st.vorhanden ? st.vorhanden / st.texte : 1);   // nur schon vertonte Texte zählen in st.bytes
    let missStd = 0, missBest = 0;
    for (const t of all) { if (t.sprache !== lang) continue; const r = c ? await c.match(await Nova.url(lang, t.text)) : null;
      if (!r) missStd += t.text.length; if (!r || r.headers.get('X-Nova-Q') !== 'best') missBest += t.text.length; }
    const mb = (bytes, n) => n ? Math.max(1, Math.round(bytes / chars * n / 1e6)) : null;
    return { ...s, std: mb(st.bytes, missStd), bestMb: mb(st.bytes_original || st.bytes, missBest) };
  },
  stop() { this.stopFlag = true; },
  async load(onProg = () => {}, q = 'std', lang = I18N.lang) {
    if (this.busy) return false; this.busy = true; this.stopFlag = false;
    try {
      const c = await this.cache(); if (!c) return false;
      const list = await this.texts(lang), todo = [];
      for (const t of list) { const u = await Nova.url(lang, t), r = await c.match(u); if (!r || (q === 'best' && r.headers.get('X-Nova-Q') !== 'best')) todo.push(u); }
      let done = list.length - todo.length; onProg(done, list.length);
      const fetchOne = async u => {
        if (q === 'best') {   // Bestqualität: …/nova/original/…; gibt es die nicht (404), die normale Datei
          try { const r = await Nova.get(u.replace(Nova.base(), Nova.base() + 'original/')); if (r.ok) return [await r.blob(), 'best']; } catch {}
        }
        const r = await Nova.get(u); return r.ok ? [await r.blob(), q === 'best' ? 'best' : 'std'] : null;   // ohne Original: normale Datei gilt als beste verfügbare
      };
      const worker = async () => {
        while (todo.length && !this.stopFlag) {
          const u = todo.shift();
          try { const got = await fetchOne(u); if (got) await c.put(u, new Response(got[0], { headers: { 'Content-Type': 'audio/mpeg', 'X-Nova-Q': got[1] } })); } catch {}   // 404/Fehler: still überspringen
          done++; onProg(done, list.length);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      return !this.stopFlag;
    } finally { this.busy = false; }
  },
  async clear() { try { await caches.delete('rechenblitz-nova'); } catch {} Nova.pending.clear(); },
};
// Speicher der früheren Zusatzstimme (bis 3.24.x) vom Gerät räumen
// Altlasten: vor 3.28.0 hießen die Caches rb-*. Offline geladene Nova-Sätze in den neuen Cache übernehmen, dann den alten löschen.
(async () => { try {
  caches.delete('rb-stimme');
  if (!(await caches.has('rb-nova'))) return;
  const alt = await caches.open('rb-nova'), neu = await caches.open('rechenblitz-nova');
  for (const req of await alt.keys()) { const r = await alt.match(req); if (r) await neu.put(req, r); }
  await caches.delete('rb-nova');
} catch {} })();
