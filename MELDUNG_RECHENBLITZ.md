# Meldung Raum „Kopfrechnen“ (Rechenblitz) → Leitstand

Neueste Meldung oben. Repo `marceldaum-commits/School`, Auslieferungsordner `kopfrechnen/` (Startdatei `index.html`).

---

## 13.11.2026 (7) – 10-%-Gutschein für alle 24 Türchen (3.1.1)

- **Marcel 13.11. (Auswahlfenster):** statt Verlosung ein **10-%-Gutschein**, den bekommt, wer **alle 24 Türchen** schafft; gilt für **jedes Stundenpaket**.
- **App:** Nach dem 24. geschafften Türchen erscheint der Gutschein (Code, „Kopieren“, Hinweis „Zeig den Code deinen Eltern“, Knopf „Zu den Stundenpaketen“ → `https://www.mathenachhilfe-online.com/stundenpakete-preise/`) im Ergebnis und dauerhaft im Adventskalender. Vorher steht im Kalender nur der Hinweis auf den Gutschein. **Ohne Code in `config.js` erscheint nichts** (aktueller Stand).
- **OFFEN (Leitstand, bis spätestens 24.12.):**
  1. Gutscheincode im Shop anlegen: 10 % auf jedes Stundenpaket, Vorschlag gültig bis **31.01.2027** (in `config.js` als `until` hinterlegt – bei anderem Datum bitte nennen), ggf. Nutzung je Kunde begrenzen.
  2. Code in `kopfrechnen/config.js` → `adventVoucher.code` eintragen (oder mir nennen) und auf `rechenblitz-test`/`-live` bringen.
  3. **Hinweis:** Der Code steht im öffentlichen Repo und im Quelltext der App und ist damit für Findige lesbar. Ein „echter“ Nachweis von 24 Türchen ginge nur mit Server; für eine Werbeaktion halte ich den offenen Code für vertretbar (ggf. Nutzung je Kunde begrenzen).
  4. Falls nötig: kurzer Hinweis zu den Gutschein-Bedingungen auf der Paketseite oder in den AGB.

## 13.11.2026 (6) – Entscheidung Marcel: keine Verlosung zum Adventskalender

- Marcel 13.11.: **keine Verlosung.** Der OFFEN-Punkt aus (5) Nr. 1 entfällt. `adventRaffleUrl` bleibt leer, in der App erscheint kein Verlosungs-Knopf; der Adventskalender läuft ohne Gewinnspiel (Türchen, Rechen-Tricks, Advents-Urkunde).
- Weiter offen beim Leitstand: Server Klassen-Challenge (`KLASSEN-API.md`), Themenseiten (`THEMENSEITEN.md`), Prüfung Testseite, Datenschutz `#rechenblitz`, `rechenblitz-live`, Umleitung `/lernraum/kopfrechnen/`.

## 13.11.2026 (5) – Rechenblitz 3.1.0: Reichweite & Werbung (Marcel: „Setze Punkt 1–7 um“)

**Neu in der App** (alles ohne fremde Abrufe, getestet im Browser; QR-Codes mit einem Scanner-Programm nachgelesen):
1. **Rechen-Adventskalender:** Karte ab 15.11., Türchen 1.–24.12., nachholbar bis 6.1. Jedes Türchen: 5 Aufgaben (für alle gleich, Grundschule/ab Klasse 5) + Rechen-Trick. Ab 20 Türchen Advents-Urkunde. Auf Testseiten (`adventPreview: 'auto'`, Hostname mit „test“) sind zum Prüfen alle Türchen offen. **Verlosung:** In der App nur ein Knopf zu einer Website-Seite (`adventRaffleUrl` in `config.js`, ab `adventRaffleMin` = 12 Türchen); derzeit leer = keine Verlosung sichtbar. **OFFEN (Marcel/Leitstand):** Soll es eine Verlosung geben (Teilnahmebedingungen, Datenschutz, Preis z. B. Probestunde/Gutschein)? Dann bitte Seite auf der Website anlegen und Adresse nennen – die App sammelt selbst keine Kontaktdaten.
2. **Urkunde:** Bild (PNG, 1600×1131) mit Spitzname (freiwillig), Leistung, Datum, Logo und QR-Code zur App; Teilen (Web Share), Speichern, Drucken. Angeboten nach guten Runden, neuen Abzeichen, Einstufungstest, Adventskalender und für jedes Abzeichen in der Vitrine.
3. **Flyer & Poster** (Menü → Für Lehrkräfte): A4-Poster oder 4 Handzettel A6, mit QR-Code und optionalem eigenem Hinweis. QR-Bibliothek lokal: `kopfrechnen/js/vendor/qrcode.js` (MIT, `kopfrechnen/LICENSE-qrcode-generator.txt`).
4. **Klassen-Challenge:** App-Seite fertig (anlegen, Code/QR/Link `#klasse=CODE`, Beitritt mit Spitzname, Wochen-Rangliste, Klasse verlassen, Punkte nachreichen). **Unsichtbar, solange `classApi` leer ist.** Schnittstelle: `KLASSEN-API.md` im Repo-Stamm (an die Trainer-Rangliste aus Übergabe 25 angelehnt). **OFFEN (Leitstand):** Server bereitstellen und `classApi` freigeben; Datenschutz `#rechenblitz` ergänzen.
5. **Freunde einladen:** QR-Code + „Link teilen“; für Eltern Hinweis auf „Freunde werben“ (`referralUrl`).
6. **Probestunden-Hinweis passend zum Lernstand:** auf dem Ergebnis-Bildschirm höchstens **einmal am Tag**; wenn ein Thema in den letzten 14 Tagen < 70 % richtig war (mind. 10 Aufgaben), wird es genannt („Brüche klappt noch nicht ganz? …“).
7. **Themenseiten:** Direktlinks `?thema=…&stufe=…&modus=…` und `?advent`; Textvorschläge für 6 Seiten in `THEMENSEITEN.md` (Repo-Stamm). **OFFEN (Website-Raum/Leitstand):** Seiten anlegen.

**Weitere Änderungen:** `publicUrl` in `config.js` = `https://rechenblitz.mathenachhilfe-online.com/` (Ziel aller QR-Codes, Flyer, Urkunden, Einladungen – auch auf der Testseite); Service Worker lässt `/api/…` grundsätzlich durch (kein Cache); 3 neue Abzeichen (Adventsrechner, Weihnachtsprofi, Teamplayer).

**Neue Speicher-Einträge** (zu (1) „Gespeicherte Daten“): in `localStorage['rechenblitz']` je Profil `advent` (geöffnete Türchen, richtige Aufgaben, Datum), `klasse` (Code, Klassenname, Spieler-Kennung, Spitzname), `klassePending` (noch nicht übertragene Punkte), `promoDay` (Datum des letzten Probestunden-Hinweises). Neuer Schlüssel `localStorage['rb-classes']` nur auf Geräten, auf denen eine Lehrkraft eine Klasse angelegt hat (Code + Klassenname). Urkunden und Flyer werden nur im Gerät erzeugt, nichts wird übertragen.

## 13.11.2026 (4) – Entscheidungen Marcel zu den offenen Punkten aus (1) (3.0.3)

- **utm-Parameter:** Marcel nutzt derzeit keine Besucherstatistik → Website-Links **ohne** `utm_…` (Stand 3.0.3). Umschaltbar über `utm: true` in `kopfrechnen/config.js`, falls später eine Statistik kommt. Der Hinweis in (1) zu den utm-Parametern ist damit überholt.
- **Lehrkraft-Ergebnisse fälschungssicher (Server):** Marcel: nicht relevant → bleibt bei Links ohne Server. Kein OFFEN-Punkt mehr.
- Damit sind aus diesem Raum keine Punkte offen; Rechenblitz wartet auf Prüfung der Testseite, Datenschutz `#rechenblitz` und `rechenblitz-live` durch den Leitstand.

## 13.11.2026 (3) – Rück-Link „← Lernraum“ eingebaut (3.0.2)

- Marcel 13.11.: „ja“ zum Rück-Link. Ziel `https://www.mathenachhilfe-online.com/lernraum/` (Seite „Lernraum | Mathe mit Marcel“), eingetragen in `kopfrechnen/config.js` als `lernraumUrl` – leer setzen blendet den Link aus, andere Adresse ohne Codeänderung möglich.
- Anzeige: Knopf „← Lernraum“ oben links (neben „Zur Website“) und Eintrag „Zurück zum Lernraum“ im Menü. Öffnet im selben Fenster, mit `utm_source=rechenblitz&utm_campaign=lernraum`.
- Auf `rechenblitz-test` gesetzt (Commit siehe Branch).

## 13.11.2026 (2) – Entscheidung Marcel: `/lernraum/kopfrechnen/` durch Rechenblitz ersetzen

- **Marcel 13.11. (Auswahlfenster in diesem Raum):** Die bestehende Seite `https://www.mathenachhilfe-online.com/lernraum/kopfrechnen/` („Kopfrechen-Trainer“, 10 Levels, Zeitmodus, Challenge-Links, nutzt `../mm-core.js`) soll **durch Rechenblitz ersetzt** werden. Grund: Marcel findet die Seite am PC nicht ansprechend; Rechenblitz hat das Website-Design, Hell/Dunkel, Ton, eigenes PC-Layout und mehr Themen. Die Seite stammt nicht aus diesem Raum und liegt nicht in `School` – Umsetzung daher beim Leitstand.
- **Vorschlag zur Umsetzung:**
  1. Bis `rechenblitz-live` steht: Seite unverändert lassen (oder für Marcel zum Vergleich auf die Testseite verlinken).
  2. Mit `rechenblitz-live`: `/lernraum/kopfrechnen/` per **301** auf `https://rechenblitz.mathenachhilfe-online.com/` umleiten (auch mit angehängter Abfrage/Hash, damit alte Lesezeichen und Challenge-Links nicht ins Leere laufen – sie landen dann auf der Rechenblitz-Startseite; die alten Challenge-Codes sind mit Rechenblitz nicht kompatibel). Menüpunkt „Kopfrechnen“ im Lernraum auf dieselbe Adresse setzen.
  3. **Kein iframe-Einbetten** empfohlen: Installieren/Offline (Service Worker) und `localStorage` funktionieren in einem iframe einer anderen Adresse nur eingeschränkt (Speicher-Partitionierung).
  4. Falls `../mm-core.js` nur von dieser Seite genutzt wird, kann es danach entfallen – bitte im Lernraum prüfen.
- Wenn Rechenblitz einen Rück-Link „← Lernraum“ bekommen soll, bitte die Zieladresse nennen; ich baue ihn dann ein (über `config.js`, ohne Codeänderung umschaltbar).

## 13.11.2026 (1) – Antwort auf Übergabe (26) und (27): Stand 3.0.1 auf `rechenblitz-test`

**Erledigt nach (27):**
1. `kopfrechnen/config.js`: `reportEndpoint: '/api/meldung'` (relativ, kein CORS).
2. `MELDUNGEN-API.md` aus `kopfrechnen/` in den Repo-Stamm verschoben. In `kopfrechnen/` liegen jetzt nur noch: html, css, js, webmanifest, svg, png, woff2, txt (`LICENSE-fonts-OFL.txt`). Keine Symlinks, Größe ca. 750 KB, kein PHP.
3. Branch **`rechenblitz-test`** gesetzt: App-Stand **c2825c9** (3.0.1); dieser Nachtrag ändert nur `MELDUNG_RECHENBLITZ.md`, nichts in `kopfrechnen/`.
4. Meldeformular: Hinweis „Name und E-Mail sind freiwillig und werden nur für Rückfragen zu deiner Meldung genutzt. Ein echter Name ist nicht nötig – ein Spitzname reicht.“; Felder heißen „Name oder Spitzname (freiwillig)“ und „E-Mail für Rückfragen (freiwillig)“.
5. Server-Antworten werden ausgewertet: `200` → „Danke“; `429` → Meldung bleibt im Postausgang, später erneut; `400` → wird verworfen und nicht wiederholt (Hinweis an die Person); Netzfehler/5xx → Postausgang. Meldungen werden vor dem Senden auf < 15 KB begrenzt (zur Not ohne Rohdaten der Aufgabe). `id` = `crypto.randomUUID()` (Fallback: Ziffern/Buchstaben, ≥ 8 Zeichen).

**Erledigt nach (26):**
- Keine fremden Abrufe: Schriften lokal als woff2 (`kopfrechnen/fonts/`: Inter, Source Serif 4 kursiv, Caveat; **nicht** Fredoka/Nunito), Lizenz `kopfrechnen/LICENSE-fonts-OFL.txt` (SIL OFL 1.1). Keine CDNs, kein Tracking, keine Cookies. Browsertest: beim Laden und Melden nur Anfragen an die eigene Adresse.
- Logo: `kopfrechnen/icons/logo.svg` = Logo-Symbol der Website (`logo-symbol-20261111.svg`); App-Icons daraus erzeugt.
- Fußzeile: Impressum `…/impressum/`, Datenschutz `…/datenschutz/#rechenblitz`, Probestunde `…/probestunde/`.
- Links zur Website tragen `?utm_source=rechenblitz&utm_medium=app&utm_campaign=<Stelle>` (Button „Zur Website“, Werbekarte, Ergebnis-Hinweis, Menü, Wochenbericht). Bitte sagen, falls das nicht gewünscht ist – dann nehme ich die Parameter heraus.

**Gespeicherte Daten (nur im Gerät, nie automatisch übertragen außer Meldungen):**
- `localStorage['rechenblitz']` (JSON, Version 3): je Profil (Name/Spitzname + Emoji, frei wählbar) Lernstand: XP, gelöste Aufgaben, Rekorde, Fehlerkiste (Aufgaben), Abzeichen, Einmaleins-Statistik je Aufgabe, Übungsverlauf je Tag (max. 70 Tage: Anzahl, richtig, Übungszeit, je Thema), Tageschallenge-Ergebnis, Einstellungen (Ton, Vorlesen, Design, Klassenstufe), Auftrag einer Lehrkraft (falls per Link geöffnet) mit eigenen Runden-Ergebnissen. Außerdem geräteweit: **Postausgang** (`outbox`, s. u.), zuletzt eingegebener Name/E-Mail des Meldeformulars (`reporter`, damit man sie nicht neu tippen muss), Zeitpunkt der letzten Meldung (`lastReportAt`).
- `localStorage['rb-teacher']`: nur auf Geräten, auf denen jemand einen Lehrkraft-Auftrag erstellt hat – der angezeigte Name der Lehrkraft.
- Cache Storage `rechenblitz-<Version>` (Service Worker): nur die App-Dateien für Offline/Installieren. Keine Cookies, kein sessionStorage, keine IndexedDB.
- **Postausgang:** vollständige Meldungen (Format `MELDUNGEN-API.md`: id, Zeit, Art, Nachricht, freiwillig Name/E-Mail, ggf. Aufgabe mit Antwort und Lösung, App-Version, Browserkennung, Bildschirmgröße, Einstellungen), die noch nicht übertragen werden konnten (offline, 429, Serverfehler). Werden beim nächsten Start bzw. wenn das Gerät wieder online ist gesendet und danach gelöscht; 400-Antworten werden verworfen.
- **Links ohne Server:** Lehrkraft-Aufträge (`#auftrag=…`) und Ergebnisse (`#ergebnis=…`) stecken base64-kodiert in der Adresse; sie enthalten Titel, Name der Lehrkraft, Thema/Stufe und beim Ergebnis den Profilnamen des Kindes und dessen Runden (richtig/falsch, Zeiten, bis 8 Fehler je Runde). Diese Links werden nur geteilt, wenn jemand selbst auf „Teilen/Senden“ tippt. Für den Datenschutztext relevant.

**Was gebaut ist (3.0.1):** 17 Themen × 5 Stufen, alle Aufgaben zufällig erzeugt, mit Lösungsweg bei Fehlern; Stufe „Auto“; Einstufungstest; Klassenmodus; Training, Blitzrunde, Ruhig üben, Duell (zwei Personen, ein Gerät), Fehlerkiste, Tageschallenge (für alle gleich, Ergebnis teilbar); Einmaleins-Übersicht; 29 Abzeichen; Profile; Wochenbericht (teilen/drucken); Lehrkraft-Aufträge und Arbeitsblätter (Druck); schwebender Menü-Button mit „Fehler melden“; Werbung für die Website; PWA (offline, installierbar); Hell/Dunkel, Ton (Web Audio), Vorlesen (Sprachausgabe des Browsers); eigenes PC-Layout. Details: `README.md`.

**Hinweise für die Prüfung:**
- „Vorlesen“ nutzt `speechSynthesis` des Browsers (je nach System können Stimmen online sein – nicht von der App gesteuert). Standard: aus.
- Der Service Worker cached nur GET-Anfragen der eigenen Adresse; `/api/meldung` (POST) wird nie gecacht. Seite, JS und CSS werden „erst Netz, dann Cache“ geladen.
- Teilen nutzt `navigator.share` bzw. die Zwischenablage, sonst ein Textfeld zum Kopieren.

**OFFEN:**
- Lehrkraft-Ergebnisse sind nicht fälschungssicher (werden im Gerät des Kindes erzeugt). Wenn gewünscht, könnte ein Server-Endpunkt Ergebnisse annehmen – nur nach Marcels Entscheidung.
- Bitte Rückmeldung, ob die `utm`-Parameter an Website-Links bleiben sollen.
