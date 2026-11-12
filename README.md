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
