# Nachhilfe-online – 3D-Institut-Simulation

Eine kleine Lebenssimulation im Browser: Du leitest das Nachhilfe-Institut **Nachhilfe-online**.
Schüler kommen nachmittags, melden sich am Empfang an und lernen bei deinen Lehrkräften.

**Spielen:** Die Figuren werden als Dateien nachgeladen, deshalb das Spiel über einen kleinen Webserver öffnen:
`python3 -m http.server` im Ordner starten und http://localhost:8000 aufrufen (oder über GitHub Pages).
Direkt als Datei geöffnet läuft das Spiel mit einfachen Ersatzfiguren.
`python3 build-artifact.py` erzeugt eine einzelne HTML-Datei mit eingebetteten Figuren, die auch ohne Webserver läuft.

- **Leben:** Schüler und Lehrkräfte anklicken, loben, in die Pause schicken, Räume zuweisen
- **Bauen:** Tische, Whiteboards, Pflanzen, Sofas, Snackautomat und mehr kaufen und platzieren (R dreht)
- **Personal:** Lehrkräfte für fehlende Fächer einstellen oder entlassen
- **Kamera:** Ziehen dreht, Rechtsklick/Shift verschiebt, Mausrad zoomt; Handy: 1 Finger dreht, 2 Finger zoomen
- Tasten: Leertaste Pause, 1/2/3 Tempo, W Wände, C Kamera zurücksetzen

Der Spielstand wird im Browser gespeichert. Logo: `assets/logo.png`.

Figuren: *Ultimate Animated Character Pack* von Quaternius (https://quaternius.com), Lizenz CC0 1.0 (gemeinfrei), für das Web verkleinert in `assets/models/`.

---

# Rechenblitz – Kopfrechnen üben (`kopfrechnen/`)

Web-App im Design von mathenachhilfe-online.com, für Handy, Tablet und PC (eigenes PC-Layout). Läuft im Browser und lässt sich als App installieren (PWA, offline nutzbar). Für Installation/Offline über einen Webserver ausliefern (z. B. als Unterordner der Website).

**Aufbau:** `index.html` (Gerüst), `app.css` (Design), `js/engine.js` (Aufgaben-Generatoren mit Lösungswegen), `js/app.js` (Spiel, Profile, Statistik, Abzeichen, Duell), `js/panels.js` (Menü & Panels), `js/extras.js` (Advent, Urkunde, Flyer, Klassen-Challenge), `js/vendor/qrcode.js` (MIT), `config.js` (Adressen & Schalter), `LICENSE-*.txt`, `sw.js` (Offline).

- **17 Themen, je 5 Stufen, alles zufällig erzeugt:** Plus, Minus, Mal, Geteilt, Lücken · Brüche, Dezimalzahlen, Prozent, negative Zahlen, Potenzen & Wurzeln · Klammern/Punkt vor Strich, Runden & Überschlag, Einheiten, Teiler (Rest, Quersumme, ggT, kgV, Primfaktoren), Gleichungen · Textaufgaben · Alles gemischt
- **Lösungsweg** bei jedem Fehler (Schritt für Schritt), auch im Ergebnis nachlesbar
- **Stufe „Auto“:** passt sich beim Üben an; **Einstufungstest** je Klassenstufe stellt die Stufen ein; **Klassenmodus** zeigt nur passende Themen
- **Modi:** Training, Blitzrunde, Ruhig üben (ohne Zeit/Punkte), Duell zu zweit an einem Gerät, Fehlerkiste, Tageschallenge (für alle gleich, teilbar)
- **Einmaleins-Übersicht** (sichere/unsichere Aufgaben, Reihen gezielt üben; unsichere kommen öfter dran)
- **Motivation:** Punkte, Sterne, Rekorde, XP & Ränge, 29 Abzeichen, Tagesziel, Tage-Serie, Sound (Web Audio), Vorlesen
- **Profile** für mehrere Kinder auf einem Gerät · **Wochenbericht** für Eltern (teilen/drucken)
- **Für Lehrkräfte:** Auftrag als Link verschicken (Thema, Stufe, Runden, Mindest-Treffer, Termin, gleiche Aufgaben für alle) – Schüler schicken einen Ergebnis-Link zurück; **Arbeitsblätter** mit Lösungsblatt drucken
- **Versionen:** `js/changelog.js` (Nummer, Datum, „Was ist neu?“); Entwicklungsplan in `ROADMAP_RECHENBLITZ.md`
- **Sprachen:** Deutsch, Englisch, Ukrainisch – automatisch nach Gerätesprache, in den Einstellungen wählbar (`js/i18n.js`; Übersetzungen in `i18n/uebersetzungen.tsv`, erzeugen mit `node i18n/build.js`)
- **Reichweite:** Rechen-Adventskalender (1.–24.12.), Urkunden zum Teilen/Drucken, Flyer & Poster mit QR-Code, „Freunde einladen“, Klassen-Challenge mit Wochen-Rangliste (Server nach `KLASSEN-API.md`, sonst ausgeblendet), Direktlinks `?thema=…&stufe=…` für Themenseiten (`THEMENSEITEN.md`)
- **Website-Werbung:** Button „Zur Website“, wechselnde Werbekarte, Probestunden-Hinweise (optional mit `utm_source=rechenblitz`, Schalter `utm` in `config.js`); Probestunden-Hinweis höchstens einmal am Tag, passend zum Lernstand
- **Schwebender Button unten rechts:** Fehler melden (mit Aufgabe), Idee, Einstellungen, Profile, Fortschritt, Lehrkräfte, Website
- **Fehlermeldungen:** POST an `reportEndpoint` in `kopfrechnen/config.js` (Format: `MELDUNGEN-API.md` im Repo-Stamm, Endpunkt `/api/meldung` des Leitstands); ohne Endpunkt/offline Postausgang auf dem Gerät
- Schriften (Inter, Source Serif 4, Caveat; SIL Open Font License) lokal eingebunden – kein Abruf bei Google
