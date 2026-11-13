# Rechenblitz – Entwicklungsplan 14.11.–04.12.2026

Marcel 13.11.: „Für die nächsten 3 Wochen täglich ordentlich neue Dinge entwickeln. Bei der Version das Datum dazuschreiben.“
Jeden Tag ein vollständiges, getestetes Paket. Status: `[ ]` offen · `[x]` erledigt (mit Version und Commit).

## Regeln für jeden Entwicklungstag

1. Eintrag des Tages umsetzen (ist er schon erledigt oder blockiert, den nächsten offenen nehmen; Umfang sinnvoll anpassen und notieren).
2. Alle neuen Texte auch in `i18n/uebersetzungen.tsv` (Englisch, Ukrainisch) eintragen und `node i18n/build.js` ausführen.
3. Version erhöhen in `kopfrechnen/js/changelog.js` (`APP_VERSION`, `APP_DATE` = heutiges Datum, neuer Eintrag in `CHANGELOG` – kurz und kindgerecht) und Cache-Name in `kopfrechnen/sw.js`.
4. Testen: Rechen-Engine (alle Themen/Stufen korrekt), Browser-Durchlauf Handy + PC, Deutsch/Englisch/Ukrainisch ohne fehlende Übersetzungen, kein Überlauf auf 320 px, keine Fehler in der Konsole, keine fremden Abrufe.
5. Nur erlaubte Dateiarten in `kopfrechnen/` (html, css, js, json, webmanifest, svg, png, jpg, webp, ico, woff2, txt). Keine Personendaten, keine Geheimnisse, keine externen Dienste.
6. Commit auf den Arbeits-Branch, auf `rechenblitz-test` schieben (nie `rechenblitz-live` – das setzt der Leitstand), Meldung oben in `MELDUNG_RECHENBLITZ.md`, Status hier abhaken.
7. Braucht etwas einen Server oder eine Entscheidung von Marcel: App-Seite bauen und hinter einem Schalter in `config.js` verstecken, Frage als „OFFEN“ in die Meldung.

## Plan

| Tag | Datum | Thema | Inhalt |
|---|---|---|---|
| 1 | Sa 14.11. | **Neues Thema „Uhr & Zeit“** | Zeitspannen („Von 7:45 bis 9:10?“), Uhrzeit + Minuten, Stunden ↔ Minuten, Kalender (Tage/Wochen); 5 Stufen, Lösungsweg mit Zeitstrahl |
| 2 | So 15.11. | **Trick des Tages** | Kurze Rechentrick-Lektionen (×11, ×5, ×9, Quadrate mit 5, Ergänzen auf 100 …) mit Mini-Übung, täglich wechselnd, Abzeichen „Trickkiste“ |
| 3 | Mo 16.11. | **Zahlenmauern & Rechenpyramiden** | Neues Spiel: Lücken in Zahlenmauern füllen, 5 Stufen, passend zur Klassenstufe |
| 4 | Di 17.11. | **Sterne-Shop** | Gesammelte Sterne gegen Profilbilder, Farbthemen und Konfetti-Effekte tauschen (nur im Gerät) |
| 5 | Mi 18.11. | **Lernpfad „Missionen“** | Geführter Pfad je Klassenstufe mit 10 Stationen, Fortschrittskarte, Abschluss-Urkunde |
| 6 | Do 19.11. | **Barrierefreiheit** | Schriftgröße, gut lesbare Schrift für Kinder mit Leseschwäche, hoher Kontrast, Tastaturbedienung, Bildschirmleser-Texte |
| 7 | Fr 20.11. | **Zahlenstrahl-Hilfe** | Bildliche Erklärung im Lösungsweg für Plus/Minus/negative Zahlen/Runden |
| 8 | Sa 21.11. | **Bruch-Bilder** | Kreis- und Balkendarstellung bei Brüchen im Lösungsweg und als Hilfe-Knopf |
| 9 | So 22.11. | **Schätz-Blitz** | Neues Spiel: Ergebnis schätzen mit Toleranz-Ring, Punkte nach Nähe |
| 10 | Mo 23.11. | **Geometrie im Kopf** | Neues Thema: Umfang, Fläche, Winkel, Würfelnetze (Zahlen), mit Skizzen |
| 11 | Di 24.11. | **Wochenziele & Erinnerung** | Eigenes Wochenziel, Belohnung bei Erreichen, Kalender-Erinnerung als .ics-Datei |
| 12 | Mi 25.11. | **Eltern-Bereich mit PIN** | Fortschritt je Kind, Übungszeit-Grenze, Wochenbericht, Einstellungen sperren |
| 13 | Do 26.11. | **Fehler-Detektiv** | Typische Fehlermuster erkennen (Übertrag vergessen, Vorzeichen, Komma verrutscht) und gezielten Tipp geben |
| 14 | Fr 27.11. | **Klassenzimmer-Quiz** | Präsentationsmodus für Beamer/Whiteboard: Aufgabe groß, Countdown, Lösung aufdecken, 2–4 Teams |
| 15 | Sa 28.11. | **Winterdesign** | Schnee, Weihnachts-Farben und Klänge im Dezember (abschaltbar), passend zum Adventskalender |
| 16 | So 29.11. | **Hör-Rechnen** | Modus: Aufgaben nur hören (Vorlesen), Antwort tippen – für Kopfrechnen ohne Bild |
| 17 | Mo 30.11. | **Statistik-Seite** | Verlauf je Thema: Treffer, Tempo, Übungstage (eigene Diagramme, ohne Bibliothek) |
| 18 | Di 01.12. | **Adventskalender-Start** | Start-Check am 1. Türchen, Feinschliff, Fehler aus den ersten Meldungen beheben |
| 19 | Mi 02.12. | **Gleichungen mit Waage** | Animierte Waage im Lösungsweg und als Übungsmodus „Waage ausbalancieren“ |
| 20 | Do 03.12. | **Einkaufsspiel** | Prozent & Geld im Alltag: Einkaufszettel, Rabatte, Wechselgeld |
| 21 | Fr 04.12. | **Abschluss** | Ladezeit, Barrierefreiheit-Check, alle Sprachen prüfen, Rückblick + Liste offener Ideen für Marcel/Leitstand |

## Erledigt

- 13.11. – 3.5.0: Versionsnummer mit Datum, „Was ist neu?“ im Menü
