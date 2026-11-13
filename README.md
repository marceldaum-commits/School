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

Web-App im Design von mathenachhilfe-online.com. Läuft im Browser und lässt sich als App installieren (PWA, offline nutzbar).
Für Installation/Offline über einen Webserver ausliefern (z. B. als Unterordner der Website); direkt als Datei geöffnet funktioniert das Üben ebenfalls.

- **Themen (je 5 Stufen, alle Aufgaben zufällig erzeugt):** Plus, Minus, Mal, Geteilt, Brüche, Dezimalzahlen, Prozent, negative Zahlen, Potenzen & Wurzeln, Mix aus allem
- **Eingabe:** Ziffernfeld mit Bruchstrich, Komma und Vorzeichen (oder Tastatur: Ziffern, `/`, `,`, `-`, ⌫, Enter). Ungekürzte, aber richtige Brüche → Hinweis „kürze noch“ statt Fehler
- **Modi:** Training (20 Aufgaben), Blitzrunde (60 s), Fehlerkiste (falsche Aufgaben kommen wieder, bis sie zweimal richtig sind)
- **Motivation:** Punkte mit Serienbonus, Sterne, Rekorde, XP & Ränge, Tagesziel, Tage-Serie, Konfetti, Sound (Web Audio), optional Vorlesen
- **Schwebender Button unten rechts:** Fehler melden (mit angehängter Aufgabe), Idee/Feedback, Einstellungen (Ton, Vorlesen, automatisch prüfen, Hell/Dunkel, Fortschritt zurücksetzen), App installieren, Probestunde
- **Fehlermeldungen:** werden per POST an `reportEndpoint` in `kopfrechnen/config.js` geschickt (Format: `kopfrechnen/MELDUNGEN-API.md`). Ohne Endpunkt oder offline bleiben sie im Postausgang auf dem Gerät und werden später übertragen.
- Schriften (Inter, Source Serif 4, Caveat; SIL Open Font License) sind lokal eingebunden – kein Abruf bei Google.
