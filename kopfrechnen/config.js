// Rechenblitz – Konfiguration
// reportEndpoint: URL, die Fehlermeldungen per POST (JSON) annimmt und als E-Mail weiterleitet.
// Solange sie leer ist, werden Meldungen auf dem Gerät gespeichert und später übertragen.
// Format der Meldungen: siehe MELDUNGEN-API.md im Repo-Stamm.
// 'api/…' ist relativ zum App-Ordner (ohne führendes „/“): auf rechenblitz(-test).… → /api/…, auf lernen(-test).…/rechenblitz/ → /rechenblitz/api/… (Leitstand 19.11.)
window.RECHENBLITZ_CONFIG = {
  reportEndpoint: 'api/meldung',
  // Rück-Link „← Lernraum“ oben links und im Menü; leer = ausgeblendet
  lernraumUrl: 'https://www.mathenachhilfe-online.com/lernraum/',
  // true: Links zur Website bekommen ?utm_source=rechenblitz… (nur sinnvoll mit Besucherstatistik)
  utm: false,
  // Öffentliche Adresse für QR-Codes, Flyer, Urkunden und Einladungen (immer die Live-Seite)
  publicUrl: 'https://lernen.mathenachhilfe-online.com/zahlensprint/',
  // Klassen-Challenge: Server-Adresse (z. B. '/api'), leer = Funktion ausgeblendet – siehe KLASSEN-API.md
  // Rechenblitz Pro (7,99 € einmalig): Kassen-URL des Woo-Produkts RB-PRO. Leer = keine Sperren, alles frei (pro.js, Meldung 54)
  proCheckout: 'https://www.mathenachhilfe-online.com/kasse/?bestellweg=aendern&add-to-cart=4150',   // Rechenblitz Pro 7,99 € (Shop-Produkt 4150, Leitstand 17.11.) – damit sind die Pro-Sperren an
  classApi: 'api',
  // Erinnerung aufs Handy (Web-Push, Leitstand-Übergabe 38): Server-Pfad und vorgeschlagene Uhrzeit; endpoint '' = ausgeblendet
  push: { endpoint: 'api/push', time: '17:00' },
  // Nur in der Android-App (APK, solange nicht im Play Store): neue Versionen von den GitHub-Release-Seiten anbieten.
  // Für die Play-Store-Fassung auf null setzen (dort aktualisiert Google Play).
  apkUpdates: { repo: 'marceldaum-commits/School' },
  // Vorlesen (eigene KI-Stimmen) an/aus. Marcel 18.11.: „Vorlesen erstmal rausnehmen“ – false = keine Vorlese-Knöpfe/-Einstellungen,
  // keine Abrufe beim Stimmen-Server, keine Gerätestimme. Der Code bleibt; true schaltet alles wieder ein.
  vorlesen: false,
  // Umzug auf die gemeinsame Adresse lernen.mathenachhilfe-online.com/rechenblitz/ (Marcel 19.11.2026, js/umzug.js).
  // false = nichts passiert. true (erst wenn der Leitstand meldet, dass die neue Adresse läuft): die alte Adresse packt den
  // Lernstand verschlüsselt ein und leitet weiter, die neue Adresse übernimmt ihn.
  umzug: true,
  // Vorlesen nur mit den eigenen KI-Stimmen (Tonstudio, ab Mi 25.11.): base = Adresse der Audiodateien; leer = Stimme aus. Kein externer Anbieter, keine Gerätestimme.
  stimme: { base: '' },
  // Anonyme Nutzungszählung (Leitstand 18.11.): beim Start nur {app, Version, start:1} – ohne Namen, Kennungen, Cookies.
  // Abschaltbar im Elternbereich; '' = Zählung aus.
  zaehler: 'https://trainer.mathenachhilfe-online.com/zaehler/v1/e',
  // „🎁 Lern-Geschenk verschenken“ im Elternbereich ('' = ausgeblendet)
  geschenkUrl: 'https://www.mathenachhilfe-online.com/geschenke/?src=rechenblitz-geschenk',
  // Adventskalender: Karte ab 15.11., Türchen 1.–24.12., nachholbar bis 6.1.
  // adventPreview: 'auto' = auf Testseiten alle Türchen offen; adventRaffleUrl = Seite zur Verlosung (leer = keine)
  advent: true,
  adventPreview: 'auto',
  adventRaffleUrl: '',
  adventRaffleMin: 12,
  // Gutschein für alle 24 Türchen: jeder Code wird vom Server frisch erzeugt und gilt nur einmal (Leitstand 13.11.):
  // POST /api/gutschein { klasse, tueren } → { code, prozent, bis, gilt }. 10 % auf jedes Stundenpaket, einmal je Familie,
  // bis 15.01.2027, nur bei zutreffender Klassenstufe. Leer lassen (endpoint: '') = Gutschein und Werbung dafür ausgeblendet.
  // Abgeschaltet (Marcel 19.11., Befund Recht/UWG): Gutschein-Hinweise nicht in Kinderansichten. Wieder einschalten erst nach dem
  // Umbau (nur im Elternbereich hinter dem Eltern-Tor) und Freigabe durch Recht. Vorher: { endpoint: 'api/gutschein', percent: 10, text: 'auf jedes Stundenpaket', until: '2027-01-15' }
  adventVoucher: null
};
