# Meldung Raum „Kopfrechnen“ (Rechenblitz) → Leitstand

Neueste Meldung oben. Repo `marceldaum-commits/School`, Auslieferungsordner `kopfrechnen/` (Startdatei `index.html`).

---

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
