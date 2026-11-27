'use strict';
/* ================= Vorlesen mit den eigenen KI-Stimmen (Tonstudio) =================
   Beschluss Marcel 20.11.2026: keine Anbindung an einen externen Anbieter mehr, keine Gerätestimme. Gesprochen wird nur mit den eigenen
   Stimmen auf unserem Server (Tonstudio: Deutsch de-1, Englisch af_heart, Ukrainisch Piper tetiana), immer ganze Sätze.
   Bis das Tonstudio steht (ab Mi 25.11.: Textliste, Dateiadressen, /stimme/v1 für Sätze aus Aufgaben), ist die Stimme AUS:
   Stimme.can() ist false, die App ruft nichts ab und spricht nichts. Vorlesen bleibt zusätzlich über config.js (vorlesen: false) abgeschaltet.
   Kennzeichnung später: „KI-generiert (synthetische Stimme)“. */
// Sprechtempo aus den Einstellungen (1,0 = Server-Tempo); Stufen wie bei allen Apps
const RATES = [0.75, 0.9, 1, 1.15, 1.3, 1.5];
const speechRate = () => RATES.includes(S.settings.rate) ? S.settings.rate : 1;
const Stimme = {
  fail: 'aus', audio: null,
  cfg: () => CONFIG.stimme || {},
  can: () => CONFIG.vorlesen !== false && !!Stimme.cfg().base,   // erst mit Tonstudio-Adresse in config.js
  // keine echten Namen an den Server (gilt später für den Bedarfs-Weg): Profilname als ganzes Wort herausnehmen
  scrub: text => text,
  // ganze Sätze eines Textes (nicht an „z. B.“ oder Zahlen wie „2.5“ trennen)
  sentences: text => text.split(/(?<=(?:\p{L}{3,}|\d|\)|%|€)[.!?])\s+/u).map(x => x.trim()).filter(Boolean),
  prefetch() {},
  stop() { if (this.audio) { try { this.audio.pause(); } catch {} this.audio = null; } },
  notice() {},
  async play() { this.fail = 'aus'; return false; },
};
// Speicher früherer Stimmen vom Gerät räumen (Zwischenspeicher der früheren Anbindung)
(async () => { try { for (const k of ['rb-nova', 'rb-stimme', 'rechenblitz-nova']) await caches.delete(k); } catch {} })();
