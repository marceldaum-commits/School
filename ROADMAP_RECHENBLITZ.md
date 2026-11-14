# Rechenblitz – Entwicklungsplan 14.11.–04.12.2026

Marcel 13.11.: „Für die nächsten 3 Wochen täglich ordentlich neue Dinge entwickeln. Bei der Version das Datum dazuschreiben.“
Jeden Tag ein vollständiges, getestetes Paket. Status: `[ ]` offen · `[x]` erledigt (mit Version und Commit).

## Regeln für jeden Entwicklungstag

1. Eintrag des Tages umsetzen (ist er schon erledigt oder blockiert, den nächsten offenen nehmen; Umfang sinnvoll anpassen und notieren).
2. Alle neuen Texte auch in `i18n/uebersetzungen.tsv` (Englisch, Ukrainisch) eintragen und `node i18n/build.js` ausführen.
3. Version erhöhen in `kopfrechnen/js/changelog.js` (`APP_VERSION`, `APP_DATE` = heutiges Datum, neuer Eintrag in `CHANGELOG` – kurz und kindgerecht) und Cache-Name in `kopfrechnen/sw.js`.
4. Testen: Rechen-Engine (alle Themen/Stufen korrekt), Browser-Durchlauf Handy + PC, Deutsch/Englisch/Ukrainisch ohne fehlende Übersetzungen, kein Überlauf auf 320 px (Seitenbreite = Bildschirmbreite, nichts ragt hinaus), keine Fehler in der Konsole, keine fremden Abrufe; zusätzlich in der **installierten Ansicht** (standalone/TWA) prüfen (Leitstand 39).
5. Nur erlaubte Dateiarten in `kopfrechnen/` (html, css, js, json, webmanifest, svg, png, jpg, webp, ico, woff2, txt). Keine Personendaten, keine Geheimnisse, keine externen Dienste.
6. Commit auf den Arbeits-Branch, auf `rechenblitz-test` schieben (nie `rechenblitz-live` – das setzt der Leitstand), Meldung oben in `MELDUNG_RECHENBLITZ.md`, Status hier abhaken.
8. **Web-App und APK parallel (Marcel 13.11.):** Die APK liefert alle Dateien mit und muss offline spielbar sein. Zu jeder Version `cd android-app && bash build.sh` (Version kommt automatisch aus `changelog.js`), APK-Modus testen (nachgebildetes Capacitor, keine Netzanfrage), APK-Inhalt prüfen. APK-eigene Anpassungen nur in `kopfrechnen/js/native.js`. In der Meldung steht immer die Zeile „Neue APK: 3.x.y gebaut“. Die APK kommt nicht ins Repo. GitHub baut sie beim Push auf `rechenblitz-test` selbst und legt sie dauerhaft auf die Release-Seite `rechenblitz-X.Y.Z`; nach dem Push prüfen, ob der Ablauf grün ist. Zusätzlich nach Google Drive („AndroidApps/Rechenblitz“), solange die APK unter ca. 3 MB bleibt.
7. Braucht etwas einen Server oder eine Entscheidung von Marcel: App-Seite bauen und hinter einem Schalter in `config.js` verstecken, Frage als „OFFEN“ in die Meldung.

## Leitlinien (Marcel 13.11., Markt 2025/26)

- **Marcel 14.11.: Alles muss erlebbar sein** – Bilder, Animationen, Dinge, an die man sich erinnert. Keine statischen Listen oder Karteikarten. Jede neue Funktion bekommt ein eigenes Bild bzw. eine Bewegung.

- **Mechanik, die das Lernen trägt** – nicht nur Punkte/Abzeichen: Wiederholen zum richtigen Zeitpunkt, Strategien als Spielzüge.
- **Kurze Einheiten (3–5 Min.) und Fortschritt über eine Geschichte** statt über Listen.
- **Lernen trifft Spielgenres** (Roguelike/Deckbuilder) – für Schulmathe auf dem Handy noch frei.
- **Gemütlich statt Druck:** keine Bestrafung für Pausen, ruhige Modi.
- **Design 2026:** kräftige Formen, Bewegung beim Antippen, Vibration, dunkler Modus, große Knöpfe, wenig Text, eigene gezeichnete Illustrationen (keine Stockbilder).
- **Android-Stärken** (Widgets, Sperrbildschirm, Wear OS, Farben aus dem Hintergrundbild) gehen nur als native App → Store ab 2027; im Browser vorbereiten, was geht.
- Konkurrenz in DE: Anton, Simpleclub, Knowunity – keins ist ein richtiges Spiel.

## Plan

| Tag | Datum | Thema | Inhalt |
|---|---|---|---|
| 1 ✅ | Sa 14.11. | **Merk-Training** (3.6.0) | Verteilte Wiederholung (Leitner/Intervalle) für Einmaleins, Kernaufgaben, Brüche usw.: jede Aufgabe hat eine Merkstärke, „Heute wiederholen“ als 3-Minuten-Runde, Anzeige „X Aufgaben sitzen fest“ |
| 2 | So 15.11. | **3-Minuten-Runden + Maskottchen „Blitz“** | Eigenes, gezeichnetes SVG-Maskottchen (Fuchs/Blitz) mit Stimmungen (freut sich, denkt nach, tröstet); Standard-Runde 3–5 Minuten; Texte kürzen, mehr Symbole |
| 3 | Mo 16.11. | **Rechen-Reise (Kapitel 1–3)** | Story-Karte statt Liste: Etappen à 3–5 Min., kleine Geschichte je Kapitel, passend zur Klassenstufe |
| 4 | Di 17.11. | **Rechen-Reise (Kapitel 4–6)** | Weitere Kapitel, Belohnungsbilder, Urkunde je Kapitel |
| 5 | Mi 18.11. | **Rechengarten (gemütlich)** | Gelöste Aufgaben lassen Pflanzen wachsen; keine Serien-Strafe: „Tage diese Woche“ statt Tage in Folge, Pausen ohne Verlust |
| 6 | Do 19.11. | **Zahlen-Dungeon 1** | Roguelike: Räume, Gegner = Aufgaben, Lebenspunkte, kurze Läufe (3–5 Min.) |
| 7 | Fr 20.11. | **Zahlen-Dungeon 2** | Deckbuilding: Rechen-Karten = echte Strategien (Zehnerfreund, Verdoppeln, Halbieren, Kommaschieber …) |
| 8 | Sa 21.11. | **Zahlen-Dungeon 3** | Bosse, Freischaltungen, Balance je Klassenstufe |
| 9 | So 22.11. | **Fehler-Detektiv 1** ⭐ | Typische Denkfehler erkennen (Reihe verrutscht, Stellenwert, Zähler+Nenner addiert, Vorzeichen, Punkt vor Strich …) und genau diesen Fehler mit Bild erklären |
| 10 | Mo 23.11. | **Fehler-Detektiv 2** ⭐ | „Lernstand-Brief“ für Eltern (Schwachstellen in Worten, druck-/teilbar) + Brücke zur Probestunde |
| 11 | Di 24.11. | **Sprachbrücke Mathe + Deutsch** ⭐ | Wort in Textaufgaben antippen → Übersetzung (EN/UK) + Vorlesen; Fachwörter-Sammlung (Summe, Nenner …); vorbereitet für Türkisch/Arabisch |
| 12 | Mi 25.11. | **Einmaleins-Rhythmus** ⭐ | Jede Reihe mit eigenem Beat, im Takt mittippen – Musik als Merkhilfe |
| 13 | Do 26.11. | **Geister-Rennen + Herausforderungs-Links** ⭐ | Gegen das eigene Ich von letzter Woche; Link „Schlag meine Zeit!“ zum Teilen |
| 14 | Fr 27.11. | **Design „Expressive“ + „Marcel erklärt“** | Formen, Bewegung, Vibration; Plätze für kurze Erklär-Clips von Marcel (Video/Ton, Schalter in config.js); sichtbarer Hinweis „Ohne Werbung, ohne Konto, offline – datenschutzfreundlich“ |
| 15 | Sa 28.11. | **Winterdesign + Weihnachtskapitel** | Schnee/Farben im Dezember (abschaltbar), Weihnachtskapitel in der Rechen-Reise |
| 16 | So 29.11. | **Klassenzimmer-Quiz** | Beamer-/Whiteboard-Modus, 2–4 Teams, Countdown |
| 17 | Mo 30.11. | **Eltern-Bereich + Nachhilfe-Verbindung** ⭐ | PIN, Fortschritt je Kind, Verlauf; per Code Lernstand (Merk-Himmel, Schwachstellen) mit der Nachhilfelehrkraft teilen und Merk-Stapel als Hausaufgabe empfangen (App-Seite; Server/Lehrer-App: Leitstand) |
| 18 | Di 01.12. | **Adventskalender-Start + Barrierefreiheit** | Start-Check, Feinschliff; Schriftgröße, Kontrast, Tastatur, Bildschirmleser |
| 19 | Mi 02.12. | **Trick des Tages + Zahlenmauern** | Kurze Trick-Lektionen (werden Dungeon-Karten), Zahlenmauern passend zur Klasse |
| 20 | Do 03.12. | **Android-App 2027** | Store-Texte/Bilder, App-Verknüpfungen, Zahl am App-Symbol; Konzept Widgets, Sperrbildschirm, Wear OS, Autofahrt-Modus |
| 21 | Fr 04.12. | **Abschluss** | Ladezeit, Barrierefreiheit-Check, alle Sprachen, Rückblick + offene Ideen für Marcel/Leitstand |

⭐ = Alleinstellungsmerkmal (Marcel 14.11.: „Was kann man machen als Alleinstellungsmerkmal?“ → „übernimm es step by step“). Kern: **Hinter Rechenblitz steht echte Nachhilfe** – Diagnose, Verbindung zur Lehrkraft, Marcels Erklärungen.

**Ideen-Speicher (wenn Zeit bleibt):** Uhr & Zeit, Geometrie im Kopf, Autofahrt-Modus (Aufgaben vorlesen, Antwort sprechen), Türkisch/Arabisch für die Sprachbrücke, Schätz-Blitz, Hör-Rechnen, Fehler-Detektiv (typische Fehlermuster), Gleichungs-Waage, Einkaufsspiel, Wochenziele mit Kalender-Erinnerung.

## Erledigt

- 13.11. – 3.5.0: Versionsnummer mit Datum, „Was ist neu?“ im Menü
- 13.11. – 3.5.1: Erinnerung aufs Handy (Leitstand-Übergabe 38), Play-Store-Vorbereitung, schmale Handys ohne Verkleinern
- 14.11. – 3.5.2: Gutschein für jedes Stundenpaket; Android-App (APK) mit allen Dateien im Paket, komplett offline, Erinnerung lokal; Web + APK parallel
- 14.11. – 3.6.0: Merk-Training (verteilte Wiederholung, 185 Kernaufgaben in 6 Stapeln, „Heute wiederholen“ in 3 Minuten)
- 14.11. – 3.7.0: Merk-Training erlebbar (Marcel: „fesseln, mit Bild und Animation“) – bewegte Bilder je Aufgabe, Merk-Moment, Bild-Tipp, Merk-Himmel mit Sternbildern
