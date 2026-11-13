// Rechenblitz – Konfiguration
// reportEndpoint: URL, die Fehlermeldungen per POST (JSON) annimmt und als E-Mail weiterleitet.
// Solange sie leer ist, werden Meldungen auf dem Gerät gespeichert und später übertragen.
// Format der Meldungen: siehe MELDUNGEN-API.md im Repo-Stamm.
// '/api/meldung' ist relativ: läuft auf rechenblitz(-test).mathenachhilfe-online.com (Leitstand, Übergabe 27).
window.RECHENBLITZ_CONFIG = {
  reportEndpoint: '/api/meldung'
};
