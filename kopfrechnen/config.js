// Rechenblitz – Konfiguration
// reportEndpoint: URL, die Fehlermeldungen per POST (JSON) annimmt und als E-Mail weiterleitet.
// Solange sie leer ist, werden Meldungen auf dem Gerät gespeichert und später übertragen.
// Format der Meldungen: siehe MELDUNGEN-API.md im Repo-Stamm.
// '/api/meldung' ist relativ: läuft auf rechenblitz(-test).mathenachhilfe-online.com (Leitstand, Übergabe 27).
window.RECHENBLITZ_CONFIG = {
  reportEndpoint: '/api/meldung',
  // Rück-Link „← Lernraum“ oben links und im Menü; leer = ausgeblendet
  lernraumUrl: 'https://www.mathenachhilfe-online.com/lernraum/',
  // true: Links zur Website bekommen ?utm_source=rechenblitz… (nur sinnvoll mit Besucherstatistik)
  utm: false,
  // Öffentliche Adresse für QR-Codes, Flyer, Urkunden und Einladungen (immer die Live-Seite)
  publicUrl: 'https://rechenblitz.mathenachhilfe-online.com/',
  // Klassen-Challenge: Server-Adresse (z. B. '/api'), leer = Funktion ausgeblendet – siehe KLASSEN-API.md
  classApi: '',
  // Adventskalender: Karte ab 15.11., Türchen 1.–24.12., nachholbar bis 6.1.
  // adventPreview: 'auto' = auf Testseiten alle Türchen offen; adventRaffleUrl = Seite zur Verlosung (leer = keine)
  advent: true,
  adventPreview: 'auto',
  adventRaffleUrl: '',
  adventRaffleMin: 12
};
