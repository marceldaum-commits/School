# Übergabe Rechenblitz → Zahlensprint (Stand 19.11.2026, abends)

Diese Datei enthält alles, was die bisherige Arbeitssitzung (Claude Code, „Rechenblitz-Raum“) wusste.
Wer weiterarbeitet, liest zuerst diese Datei, dann `MELDUNG_RECHENBLITZ.md` (oben neueste Meldung), `PRUEFPLAN.md`,
`ROADMAP_RECHENBLITZ.md` und `docs/FAMILIEN-SPEICHER-RECHENBLITZ.md`.

## 1. Wo der Code liegt
- **Neu (ab 19.11.):** Repo `marceldaum-commits/AndroidApps`, Ordner `zahlensprint/` (Pfade wie hier, nur mit Präfix).
  - Arbeitsbranch `zahlensprint-test` (dceda882 = School `rechenblitz-test` a3b4d14).
  - Live `zahlensprint-live` (6e94654d = School 4df79f8 = 3.28.2). Live schaltet nur der Leitstand.
- **Alt:** Repo `School`, Branches `rechenblitz-test` / `rechenblitz-live`.
  - Übergangsregel des Leitstands (19.11.): Solange kein Zugriff auf AndroidApps besteht, darf auf `rechenblitz-test` gepusht werden; jeden Commit dem Leitstand melden, er übernimmt ihn per subtree.
  - Ausgeliefert wird nur aus `zahlensprint-test`.
- **Übernommen:** 9932c13 ist übernommen (→ e5758d96).
- **Noch zu übernehmen:** dieser Übergabe-Commit (78465e1 und die Nachträge danach).

## 2. Stand der App
- **Live:** 3.28.2 (19.11.) unter `lernen.mathenachhilfe-online.com/rechenblitz/`. Die alte Adresse `rechenblitz.mathenachhilfe-online.com` zieht beim Start mit Lernstand um (`js/umzug.js`, `config.js umzug: true`).
- **Inhalt:** 30 Themen × 6 Stufen (neu 3.27.0: Gleichungssysteme `lgs`), Spiele, Merk-Training, Elternbereich, Eltern-Kopplung (eltern/v1), Sicherung, Pro (7,99 €, Ed25519-Codes „RB-“), Zählung ohne Personendaten.
- **Vorlesen (Nova) aus:** `config.js vorlesen: false` (Marcel 18.11.).
- **Nur Web-App:** keine APK, kein Play-Store für 1–2 Monate (Marcel 18.11.). Android-Code bleibt im Repo; die Workflows sind auf manuell gestellt.

## 3. Regeln (Marcel bzw. Leitstand)
- **Inhaltsupdate Di + Fr bis 16 Uhr** auf test, mit Meldung: was neu ist, wie viele Aufgaben, wie geprüft. Pflicht: mathematisch korrekt, vollständig, nachvollziehbar, keine Abkürzungen (jeder Schritt im Lösungsweg, Regel mit Beispiel in der Theorie, jedes Ergebnis nachgerechnet).
- **Monatsprüfung** nach `PRUEFPLAN.md` (Nov.: Block C Sachaufgaben, 23.–30.11.).
- **Jede Änderung:**
  - EN/UK in `i18n/uebersetzungen.tsv` (Zahlen bzw. Namen als `{}` in allen drei Spalten), dann `node i18n/build.js`;
  - Version + Datum + CHANGELOG in `kopfrechnen/js/changelog.js`;
  - Cache-Name in `kopfrechnen/sw.js`;
  - `node android-app/stand.js`;
  - testen;
  - neue Meldung oben in `MELDUNG_RECHENBLITZ.md` und die Zeile „AKTUELLER STAND“ anpassen.
- **Live-Meldungen:** „zahlensprint-live → <Commit in AndroidApps>“ plus Zeile **„Rechtsbezug: ja/nein (was)“**. Rechtliches (Preise, Codes, Eltern- und Kindertexte, Datenschutz, Werbung, KI, Mikrofon) prüft vorher der Raum „Recht“ (über die AppZentrale).
- **UWG Anh. Nr. 28:** keine Kaufaufforderung an Kinder, keine Preise in Kinderansichten, kein „Frag deine Eltern“. Kauf nur hinter dem Eltern-Tor.
- **Repo öffentlich:** keine Geheimnisse, keine Modellnamen in Commits. Proxy-403 nicht umgehen. Neue Dateiendungen vorher melden. Anrede in der App: „du“.

## 4. Offene Aufgaben (in dieser Reihenfolge)
1. **Fr 20.11. – NUR KORREKTUREN** (Marcel 19.11.): kein Inhaltsupdate, keine neuen Funktionen, kein Familien-Speicher.
   - Selbstprüfung: Start, iPhone/WebKit, PC, alle Links und das Eltern-Tor (kein Kinderpfad ohne Tor zur Kasse oder nach außen), Schloss-Texte, Theorie und Lösungswege nachrechnen, Zählung, Datenschutz- und Lizenz-Hinweise, Konsole leer.
   - Korrekturen: Eltern-Tor im Web für Außen-Links, Werbekarte/Probestunde nur im Elternbereich, Schloss-Text kürzen. Der Gutschein im Elternbereich nur nach Vorlage bei Recht (bleibt bis dahin aus).
   - Bis 16 Uhr an die AppZentrale melden: geprüft, gefunden/behoben, Commit, Rückweg, „Rechtsbezug“.
   - Die folgenden Punkte (Elternbericht gratis, Zehnerpotenzen usw.) wandern auf **Di 24.11.**:
   - **Elternbericht gratis** (Marcel): `PANELS.elternbericht` ohne `hasPro`-Sperre, Pro-Liste anpassen, Store-Text anpassen.
   - **Eltern-Tor nach ELTERN-TOR.md:**
     - Aufgabe: Malaufgabe 13–19 × 6–9 in Worten, eigene Ziffern-Tastatur, nach einem Fehler neue Aufgabe, 10 Minuten nur im Arbeitsspeicher.
     - Vorlese-Knopf nur, wenn das Vorlesen an ist.
     - Gilt auch im Web für **alle** Außen-Links außer Impressum und Datenschutz (`elterntor.js:54`, heute `if (!IS_NATIVE …) return`), außerdem vor Elternbereich, Einstellungen, Kopplung, Löschen und Teilen.
     - Zählung „elternbereich“ beim gelösten Tor (steht in der Positivliste).
   - **Werbekarte und Probestunden-Hinweise nur im Elternbereich** (`panels.js` PROMOS/`renderPromo`, Ergebnis-Hinweis `extras.js:207`, Menü-Probestunde, Wochenbericht). „Lern-Geschenk“ ebenfalls hinter das Tor.
   - **Schloss-Text kürzen (Marcel/Recht 19.11.):** In der Kinderansicht nur „Das gehört zu Rechenblitz Pro.“ (`pro.js`, `.pro-kind`; Übersetzungen anpassen). Der Zusatz „Deine Eltern können im Elternbereich nachsehen.“ entfällt. Der Knopf „🔒 Für Eltern“ bleibt.
   - **Advents-Gutschein (Befund Recht, UWG):** Seit 3.28.3 per `adventVoucher: null` ganz abgeschaltet. Für den Fr-Stand (Recht): Gutschein nur im Elternbereich mit sachlichem Text, keine Hinweise im Kalender, im POST `api/gutschein` das Feld `klasse` streichen (sonst müsste die Datenschutzerklärung 10b ergänzt werden). Wieder einschalten nur nach Freigabe durch Recht. Bisherige Notiz: Alle Gutschein-Hinweise aus den Kinderansichten entfernen (`extras.js` Z. 256, 267, 402, 406). Den fertigen Gutschein (`voucherHtml`, Z. 124–136, mit Code, Bedingungen und Link „Zu den Stundenpaketen“) nur im Elternbereich hinter dem Tor zeigen. Die Kinderansicht nach 24 Türchen sagt nur „Geschafft! Alle 24 Türchen.“ Notfalls sofort: `config.js adventVoucher: null`.
   - **Zehnerpotenzen ausbauen:** wissenschaftliche Schreibweise mit vollständigem Lösungsweg (Komma verschieben, Stellen zählen, Exponent), Theorie mit Regel und Beispiel. Danach den unabhängigen Prüfer laufen lassen (Abschnitt 6).
   - Meldung mit „Rechtsbezug: ja (Eltern-Tor, Werbung, Elternbericht)“.
2. **Di 24.11. – Umbenennung „Zahlensprint“** (Marcel endgültig; DPMA frei; Recht prüft):
   - Anzeige DE/EN/UK, Manifest, Titel, Startbild, „Zahlensprint Pro“, Store-Text, Hinweis „Früher: Rechenblitz“ in Einstellungen/Elternbereich. Figur „Blitz der Fuchs“ bleibt.
   - Neue Adresse `lernen(-test).…/zahlensprint/`; neuer Cache-Präfix `zahlensprint-` (Nova-Cache übernehmen).
   - **Abschieds-Service-Worker** für `/rechenblitz/sw.js` liefern: meldet nur die eigene Registrierung ab, leert nur die eigenen Caches und lädt offene Fenster auf `/zahlensprint/` mit Query und Hash neu. Dazu leitet die App selbst weiter, wenn sie unter `/rechenblitz/` läuft. Die Server-301 auf `/rechenblitz/` gilt für alles außer `sw.js` (macht der Leitstand).
   - Hinweis für installierte Apps: „Rechenblitz heißt jetzt Zahlensprint – bitte neu installieren, dein Lernstand bleibt“.
   - **Intern bleibt alles „rechenblitz“:** Speicher `rechenblitz`, `rb-classes`, `rb-teacher`, Zähl-Kennung, Eltern-Kopplung, Familien-Speicher-App-Name (HKDF-info!), Code-Präfix RB-/App-Byte 2.
   - Rundlauf alt → neu: Lernstand, Pro, `#pro=`, `?thema=`.
   - **Auflagen Recht (V2, 19.11.):**
     - Hinweis „Früher: Rechenblitz“ etwa 3 Monate sichtbar lassen (bis ca. Ende Februar 2027).
     - Umbenennung zum 24.11. von Recht FREIGEGEBEN (TMview nicht nötig).
     - DSE 10b, AGB § 13, Shop und Widerrufsseite am selben Tag umstellen (Leitstand).
   - Außerdem am Di: quadratische Gleichungen im Kopf, PC-Ansicht verbessern (Fotos vorher in `docs/bilder/pc-vorher/`; ab etwa 1500 px bis 1360 px Breite, Übung als Raster, rechte Startspalte füllen; Handy und iPad unverändert).
3. **Familien-Speicher anbinden** (nach dem Fr-Update): siehe `docs/FAMILIEN-SPEICHER-RECHENBLITZ.md`.
   - Bibliothek `kopfrechnen/js/familie.js @ e9993ec` (unverändert, sha256 3f7ec567…f5f9, ES-Modul, per `import()` laden); `node tests/familie.mjs` → 51 Prüfungen.
   - Server Test `https://lernen-test.mathenachhilfe-online.com/familie/v1/`, live noch gesperrt. REC_PUB steht fest in familie.js.
   - Rundlauf mit dem Mathe-Trainer: 9 Punkte und Einlösen ✓ (19.11.).
   - Einbau: Elternbereich hinter dem Tor; nur EIN Einwilligungstext (Marcels Text, Link „Datenschutzerklärung (Abschnitt 10m)“, Knopf „Einverstanden – Familie anlegen“, nichts vorausgewählt); kindId je Profil; Gerätedaten als `geraet-<id>`; Rechte aus der Familie; Konflikt nie still überschreiben; Löschen mit Familien-Nummer; Meldung „Diese Familie gibt es nicht mehr …“ bei `familie-weg`.
4. **Monatsprüfung 23.–30.11.:** Block C (alle Sachaufgaben-Vorlagen lesen) + Neu-Content + Rundum-Prüfung.
5. **Weitere Pläne:**
   - Fr 27.11.: Sachaufgaben, darunter Physik (E = P · t, Wirkungsgrad) mit Links zu Experimentopia (`#thema=energie|hebel|strom`), KurvenFlug (`#kapitel=energie`) und Mathe-Trainer (k6/k7-prozent, k7-zinsen, k7-zuordnung).
   - Querverweise in der Theorie erst nach Wortlaut-Freigabe.
   - Ökosystem-Ideen (Themenverzeichnis, Link-Wächter, Lernpfade, Album) werden in der Wochenrunde verteilt.
6. **Musik:** Rückmeldung von Marcel zu den neuen Stücken steht aus.
7. **Git-Bereinigung:** `tools/git-bereinigung.sh` muss Marcel selbst ausführen.

## 5. Ansprechpartner (Claude-Sitzungen, per send_message)
- **AppZentrale (Verteiler für alles):** `session_015vg1Tms4CCrpWLETiJCt12`. Tagesmeldung Mo–Fr 9:43, Wochenrunde Mo, Datei `WOCHENRUNDE.md`.
- **Leitstand:** `session_015vg1TkMxCUNjfjrwuzpSU9`. Direkt schreiben ging aus dieser Sitzung nicht (Geräte-Bestätigung fehlte); über die AppZentrale oder `MELDUNG_RECHENBLITZ.md`.
- **Mathe-Trainer** (familie.js): `session_015vg1TkfriYaHSmsqkXC11F`.
- **KurvenFlug:** `session_015vg1TniCB6sLGd2dNSJdge`.
- **Raumlicht:** `session_015vg1TkCEYsXkAEYjbLFPi2`.
- **Wissensgarten:** `session_015vg1Tm7yM3ri4iaUJ7mSEw`.
- **Experimentopia:** `session_015vg1TjxcWqLme2YSFCmCWd`.
- **Geld verdienen:** `session_015vg1TiesdKyR4LaAg8823A`.
- **Englisch/Quasselquest:** `session_015vg1TjebYSwmNKS51LnUAY`.

## 6. Prüfwerkzeuge (alle im Repo)
- **Aufgaben unabhängig nachrechnen:**
  - `node tests/pruefer/export.js 1500 /tmp/a.json`
  - `python3 tests/pruefer/answers.py /tmp/a.json`, `steps.py`, `lint.py`
  - `node tests/pruefer/equiv.js`
  - Zuletzt: 270 000/270 000 Aufgaben richtig, 0 Abweichungen in den Lösungswegen.
- **Schwierigkeit:** `node tests/schwierigkeit.js` (alle 180 Stufen strikt schwerer).
- **Browser:** `tests/web-update.mjs`, `app-installieren.js`, `vorlesen-aus.js`, `pro-code.js`, `pro-kind.js`, `umzug.js` (9 Fälle), `umzug-echt.js` (echte Test-Stufe), `speicher-unvollstaendig.js`, `eltern-*.js`, `zaehlung.js`, `familie.mjs`. Lokaler Server: `cd kopfrechnen && python3 -m http.server 8765`.

## 7. Nicht im Repo (Geheimnisse – bitte sicher aufbewahren, z. B. Bitwarden)
In der Arbeitsumgebung dieser Sitzung lagen außerhalb des Repos:
- der **Test-Signierschlüssel der APK** (liegt auch als GitHub-Secret `RECHENBLITZ_TEST_KEYSTORE`);
- ein **privater Test-Schlüssel für Pro-Test-Codes** (nur Test, nicht der echte Verkaufsschlüssel).

Beide gehören nicht ins Repo. Der echte Pro-Schlüssel liegt laut `tools/pro/rb_code.py` nur in Bitwarden bzw. beim Lizenz-Dienst.

## 8. Geplante Aufgaben (Scheduled Tasks)
„Rechenblitz – täglicher Entwicklungstag (bis 04.12.2026)“ (`trig_01KCXoqbpUn1w2v1gzuifWNv`, täglich 05:41 Berlin) läuft in DIESER Sitzung und arbeitet im Repo School.
- **Vor dem Löschen dieses Chats** umstellen: auf die neue Sitzung (`persistent_session_id`) oder „neue Sitzung je Lauf“, mit Prompt auf AndroidApps/zahlensprint/.
- **Sonst ins Leere:** Andernfalls läuft sie ins Leere.
