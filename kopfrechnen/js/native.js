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
