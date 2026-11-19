> **Pausiert (Marcel 18.11.2026):** Für die nächsten 1–2 Monate gibt es Rechenblitz nur als Web-App (PWA, „App installieren“). Keine APK und kein Play. Der Android-Code bleibt im Repo, wird aber nicht gebaut oder ausgeliefert.

# Rechenblitz als Android-App (APK) und im Google Play Store

Stand 16.11.2026, App 3.14.x. Marcels Google-Play-Konto ist bestätigt („Nun können wir veröffentlichen“). Die Play-Fassung ist vorbereitet, siehe unten.

## Entscheidung (Marcel 13.11.2026)

> „Die App muss, wenn APK, auch offline spielbar sein. Wer erwirbt eine Rechenapp mit Internetzwang … daher muss zukünftig die WebApp und die APK parallel gepflegt werden.“

Deshalb ist die APK **keine Hülle um die Website** (TWA). Sie liefert **alle Dateien der Web-App im Paket mit** (Capacitor) und läuft ab dem ersten Start komplett ohne Internet, ohne Service Worker und ohne Laden.

- **Eine Quelle:** `kopfrechnen/` ist für Web **und** APK. `android-app/build.sh` kopiert die Dateien beim Bauen 1:1 ins Paket.
- **Parallel pflegen:** Jede neue Web-Version bekommt eine neue APK mit derselben Versionsnummer. `versionName` = `APP_VERSION`, `versionCode` = z. B. 3.5.2 → 30502, beides automatisch aus `js/changelog.js`.
- **Unterschiede nur in `kopfrechnen/js/native.js`**, aktiv ausschließlich in der APK:
  - Server-Funktionen (Fehler melden, Gutschein, Klassen-Challenge) gehen an `https://rechenblitz.mathenachhilfe-online.com/api/…` über natives HTTP (`CapacitorHttp`, keine CORS-Änderung am Server nötig). Ohne Netz wartet alles im Postausgang wie in der Web-App.
  - Die **Erinnerung** wird lokal auf dem Gerät geplant (`@capacitor/local-notifications`): kein Server, kein Internet, kein Push-Abo. Bedienung wie in der Web-App (Schalter, Uhrzeit, Anleitung bei Sperre).
  - Kein Hinweis „Als App installieren“, kein Service Worker, keine Test-Vorschau des Adventskalenders.
  - Geteilte Links und QR-Codes zeigen auf die öffentliche Web-App.

| Punkt | Wert |
|---|---|
| Paketname | `com.mathenachhilfeonline.rechenblitz` (nach dem ersten Hochladen nicht mehr änderbar; Leitstand/Marcel bitte bestätigen) |
| Android | ab 7.0 (minSdk 23), Ziel-SDK 35 |
| Berechtigungen | Internet (nur für freiwillige Meldungen/Gutschein), Mitteilungen, Neustart-Empfang + Wecker (damit die Erinnerung nach einem Neustart bleibt) |
| Symbol / Startbild | aus `kopfrechnen/icons` erzeugt (`android-app/icons.py`) |
| Größe | ca. 2,4 MB (R8 verkleinert, Bilder als Palette) |

## APK bauen

```bash
cd android-app
npm install                 # einmalig
bash build.sh               # Test-APK: android/app/build/outputs/apk/debug/app-debug.apk
bash build.sh release       # Store-Fassung (APK + AAB), braucht den Signierschlüssel
```

Voraussetzungen: Node 18+, JDK 21, Android-SDK (Plattform 35, Build-Tools 35), `ANDROID_HOME` gesetzt. SDK ohne Android Studio einrichten:

```bash
mkdir -p ~/android-sdk && cd ~/android-sdk
curl -sSLO https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && unzip -q commandlinetools-linux-*.zip
mkdir -p cmdline-tools/latest && mv cmdline-tools/{bin,lib,NOTICE.txt,source.properties} cmdline-tools/latest/
yes | cmdline-tools/latest/bin/sdkmanager --sdk_root=$HOME/android-sdk "platforms;android-35" "build-tools;35.0.0" "platform-tools"
```

Meldet Maven Central „429 Too Many Requests“, eine Minute warten und neu starten. Bereits Geladenes bleibt erhalten.

**Signieren:** Der Upload-Schlüssel liegt nur bei Marcel (Bitwarden), nie im Repo (`*.jks`/`*.keystore` stehen in `.gitignore`). Für `release` die Signier-Angaben in `android/app/build.gradle` (`signingConfigs`) über Umgebungsvariablen eintragen, oder in Android Studio „Generate Signed Bundle“ nutzen. Google verwaltet den eigentlichen App-Signaturschlüssel (Play App Signing).

## Selbst-Aktualisierung der Test-APK (3.7.2)

Die APK fragt einmal täglich die neueste Release-Seite ab (`apkUpdates` in `config.js`). Gibt es eine neuere Version, zeigt die Startseite „Jetzt aktualisieren“. Der Knopf lädt die APK, Android installiert sie als Update. **Für die Play-Store-Fassung `apkUpdates: null` setzen.**

## Inhalte aktualisieren sich selbst (ab 3.13.0, Hülle 2 – Marcel 15.11.2026)

- **Ablauf in der App:** Beim Start lädt die App im Hintergrund `stand.json`, mit Version, Hüllen-Nummer und SHA-256 jeder Datei.
  - **Test-Kanal:** `https://raw.githubusercontent.com/marceldaum-commits/School/rechenblitz-test/kopfrechnen/stand.json`, ersatzweise `https://rechenblitz-test.mathenachhilfe-online.com/stand.json`.
  - **Live-/Store-Kanal:** dieselben Adressen mit `rechenblitz-live` bzw. `https://rechenblitz.mathenachhilfe-online.com/`.
- **Übernahme:**
  - Neue oder geänderte Dateien werden geladen und geprüft. Nur ein vollständig geprüfter Stand wird übernommen, und zwar in einen eigenen Ordner auf dem Gerät.
  - Aktiv wird er beim nächsten Start oder sofort über „Jetzt neu starten“.
  - Ohne Netz bleibt der letzte gute Stand. Ältere Stände als der mitgelieferte werden nie geladen.
- **Kanal festlegen:** über die Umgebungsvariable `RB_CHANNEL` beim Bauen. `test` ist der Standard (GitHub-Ablauf); für den Store gilt `RB_CHANNEL=live bash build.sh release`.
- **Hüllen-Nummer:**
  - `android-app/SHELL` erhöhen, sobald sich die App-Hülle ändert.
  - Verlangt ein Stand eine neuere Hülle, übernimmt die App nichts. Sie zeigt dann „Neue App-Version nötig“ und den Download der neuesten Release-APK.
- **Code:**
  - `RbUpdatePlugin.java` (Hülle);
  - `liveUpdateCheck()` in `kopfrechnen/js/native.js` (Anzeige);
  - `android-app/stand.js` erzeugt und prüft `stand.json`.
- **Abgerufene Adressen (für die Datenschutzerklärung):**
  - `raw.githubusercontent.com`: stand.json und geänderte Dateien;
  - `rechenblitz.mathenachhilfe-online.com` bzw. `rechenblitz-test.mathenachhilfe-online.com`: Ersatz;
  - nur wenn eine neue Hülle nötig ist: `api.github.com` (Release-Info) sowie `github.com` / `objects.githubusercontent.com` (APK-Download nach Tipp).
  - Dabei werden keine Nutzerdaten gesendet. Übertragen werden nur die üblichen Verbindungsdaten (IP-Adresse) und die Kennung „Rechenblitz-App“.

## Release-Seiten auf GitHub (Marcel 14.11.2026, Variante 1)

Bei jedem Push auf `rechenblitz-test`, der `kopfrechnen/` oder `android-app/` ändert, baut GitHub (`.github/workflows/rechenblitz-release.yml`) automatisch:
- die APK,
- die Web-App als ZIP.

Beides legt GitHub **dauerhaft** auf die Release-Seite `rechenblitz-X.Y.Z` (Titel „Rechenblitz X.Y.Z“, Text aus `CHANGELOG`). Wird dieselbe Version erneut gepusht, ersetzt der Ablauf die Dateien. Starten lässt sich der Ablauf auch von Hand („Run workflow“). Die APK dort hat keine Größengrenze. Drive („AndroidApps/Rechenblitz“) wird zusätzlich befüllt, solange die APK unter ca. 3 MB bleibt.

**Fester Test-Schlüssel:**
- Er liegt im Repo-Geheimnis `RECHENBLITZ_TEST_KEYSTORE` (Base64 eines Android-Debug-Keystores, Passwort `android`, Alias `androiddebugkey`).
- Er ist derselbe Schlüssel wie bei der ersten Drive-APK 3.5.2 (SHA-256 `C8:E0:E9:77:…:52:FF:6D`). Deshalb installiert sich jede neue Test-APK als Update, und der Lernstand bleibt.
- Fehlt das Geheimnis, bricht der Ablauf bewusst ab.
- Eine Kopie gehört in Bitwarden.
- Der Schlüssel ist nur für Testfassungen. Der Play Store bekommt Marcels eigenen Upload-Schlüssel.

## Test je Version (Pflicht, siehe ROADMAP-Regeln)

1. Web-App im Browser testen (Handy/PC, DE/EN/UK, 320 px, offline nach dem ersten Besuch).
2. APK-Modus im Browser mit nachgebildetem Capacitor testen (keine Netzanfrage, lokale Erinnerung).
3. `bash build.sh` → APK bauen, Inhalt prüfen (`aapt2 dump badging`).
4. **Auf einem echten Android-Handy:** APK installieren, Flugmodus an, App starten und spielen; Erinnerung an, 2 Minuten später einstellen und warten.

## Veröffentlichung bei Google Play (Leitstand/Marcel 16.11.2026: „Nun können wir veröffentlichen“)

### Zwei Fassungen aus derselben Quelle

| | Test-APK (GitHub) | Play-Fassung |
|---|---|---|
| Bauen | GitHub-Ablauf `rechenblitz-release.yml` bei Push auf `rechenblitz-test` | GitHub-Ablauf `rechenblitz-play.yml` bei Push auf `rechenblitz-live` (oder von Hand starten) |
| Schalter | `RB_STORE=github`, `RB_CHANNEL=test` | `RB_STORE=play`, `RB_CHANNEL=live` |
| Signatur | Test-Schlüssel (`RECHENBLITZ_TEST_KEYSTORE`) | **Upload-Schlüssel** (`RECHENBLITZ_UPLOAD_*`), Google signiert danach selbst (Play App Signing) |
| Neue Inhalte (HTML/JS/CSS) | von selbst vom Branch `rechenblitz-test` | von selbst vom Branch `rechenblitz-live`, also nur, was der Leitstand freigibt |
| Neue App-Hülle | Karte „Herunterladen“ (APK von GitHub) | **In-App-Update von Google Play**: flexibel im Hintergrund, eingespielt auf der Startseite; „sofort“, wenn der neue Inhalt eine neuere Hülle braucht. Ersatz: Karte „Play Store“. Die App lädt **nie selbst eine APK**, kein `REQUEST_INSTALL_PACKAGES` |

**Richtlinie:**
- Google Play verbietet Apps, die sich außerhalb von Play selbst aktualisieren oder ausführbaren Code (dex/JAR/.so) nachladen.
- **Ausdrücklich ausgenommen** ist Code, der in einer WebView läuft (JavaScript).
- Die Play-Fassung lädt deshalb weiterhin neue Web-Inhalte selbst. So bleibt sie automatisch aktuell, wie Marcel es wollte.
- Der APK-Download ist in der Play-Fassung abgeschaltet.
- Die geladenen Dateien sind dieselbe Web-App wie im Browser: Inhalte und Fehlerkorrekturen. Neue Berechtigungen oder versteckte Funktionen kommen so nicht dazu, denn neue Berechtigungen gehen nur über eine neue Hülle bei Google Play.

### Was ich vorbereitet habe

- **Signiertes App-Bundle (AAB):**
  - `rechenblitz-play.yml` baut es bei jeder Live-Freigabe und legt es unter **Actions → Rechenblitz Play → Artifacts** ab (90 Tage).
  - Das Signieren ist mit einem Wegwerf-Schlüssel getestet.
  - Ohne die Geheimnisse wird der Lauf übersprungen und zeigt nur einen Hinweis.
- **Versionscode:** wird automatisch aus der Version erzeugt, z. B. 3.14.2 → 31402, und steigt mit jeder Version. Neue Inhalte allein brauchen kein neues Bundle. Ein neues Bundle ist nur nötig, wenn sich die Hülle ändert, sonst etwa einmal im Monat für die Store-Seite.
- **Store-Texte (Deutsch):** `android-app/store/eintrag-de.txt` (Name, Kurz- und Langbeschreibung, Kategorie).
- **Grafiken:** `android-app/store/`
  - Symbol 512×512, Vorschaubild 1024×500;
  - 7 Handy-Bilder 1080×1920;
  - je 6 Tablet-Bilder für 7 Zoll (1200×1920) und 10 Zoll (2560×1600).

### Schritt für Schritt: Was Marcel selbst klickt

**A. Einmalig: Upload-Schlüssel nach GitHub** (der Schlüssel liegt in Bitwarden)

1. Die Keystore-Datei (`.jks`/`.keystore`) in Base64 umwandeln:
   - Mac/Linux: `base64 -i upload.jks | pbcopy`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload.jks")) | Set-Clipboard`
2. GitHub → Repo **School** → Settings → Secrets and variables → Actions → **New repository secret**. Vier Geheimnisse anlegen:
   - `RECHENBLITZ_UPLOAD_KEYSTORE` = der Base64-Text
   - `RECHENBLITZ_UPLOAD_STORE_PASSWORD` = Keystore-Passwort
   - `RECHENBLITZ_UPLOAD_KEY_ALIAS` = Alias des Schlüssels
   - `RECHENBLITZ_UPLOAD_KEY_PASSWORD` = Schlüssel-Passwort. Bei einem mit `keytool` erzeugten Schlüssel ist es meist **dasselbe** wie das Keystore-Passwort, dann denselben Wert eintragen. Alle vier sind Pflicht.
   - Fehlt ein Geheimnis oder ist es vertauscht, bricht „Rechenblitz Play“ mit einer klaren Meldung ab. Die Meldung sagt, welches Geheimnis betroffen ist. Läuft alles, zeigt das Protokoll Alias und SHA-256 des Schlüssels.
3. GitHub → Actions → **Rechenblitz Play** → „Run workflow“, Branch **rechenblitz-live** wählen. Nach ca. 5 Minuten unter „Artifacts“ die Datei `Rechenblitz-play-X.Y.Z.aab` herunterladen.
   - **Geklärt (Leitstand 16.11.):** Rechenblitz bekommt einen **eigenen** Upload-Schlüssel. Er ist getrennt vom gemeinsamen Schlüssel von Wissensgarten, KurvenFlug und Raumlicht (`WG_KEYSTORE`). Marcel erzeugt ihn selbst (Befehl unten), legt ihn in Bitwarden ab und trägt die 4 Werte bei GitHub ein.
   - Schlüssel erzeugen: In der Play Console beim ersten Hochladen „Play App Signing“ wählen und einen Upload-Schlüssel erzeugen, z. B. mit `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`. Danach in Bitwarden ablegen.

**B. Play Console: App anlegen**

4. Alle Apps → **App erstellen**:
   - Name „Rechenblitz: Kopfrechnen üben“, Standardsprache Deutsch, **App**, **Kostenlos**;
   - Erklärungen (Richtlinien, US-Exportgesetze) bestätigen.
5. **App-Integrität → App-Signatur:** „Play App Signing“ verwenden (Standard).

**C. Store-Eintrag** (Wachstum → Store-Präsenz → Haupteintrag)

6. Name, Kurz- und Langbeschreibung aus `eintrag-de.txt` einfügen.
7. App-Symbol, Vorschaubild, Handy-Screenshots (2–8) und Tablet-Screenshots (7 und 10 Zoll) aus `android-app/store/` hochladen.
8. **Store-Einstellungen:**
   - Kategorie **Lernen**;
   - Kontakt-E-Mail;
   - Website `https://rechenblitz.mathenachhilfe-online.com`.

**D. App-Inhalte** (Richtlinie → App-Inhalte). Alle Punkte ausfüllen:

9. **Datenschutzerklärung:** `https://www.mathenachhilfe-online.com/datenschutz/`
10. **App-Zugriff:** „Alle Funktionen ohne besondere Zugriffsrechte verfügbar“ (kein Login).
11. **Werbung:** „Nein, meine App enthält keine Werbung“.
12. **Altersfreigabe (IARC-Fragebogen):**
    - Kategorie „Lern-/Bildungs-App“ bzw. „Referenz, Nachrichten oder Bildung“, E-Mail angeben;
    - Gewalt, Angst, Sexualität, Sprache, Drogen, Glücksspiel: überall **Nein**;
    - **Interaktion von Nutzern:** **Ja, eingeschränkt.** In der Klassen-Challenge sehen Kinder einer Klasse die Spitznamen und Punkte der anderen, ein Wortfilter läuft auf dem Server. Sonst gibt es keinen Chat und keinen Austausch;
    - persönliche Daten teilen: Nein; digitale Käufe: Nein; Standort: Nein;
    - erwartetes Ergebnis: USK 0 / PEGI 3.
13. **Zielgruppe und Inhalte:**
    - Altersgruppen **6–8, 9–12, 13–15** (und 16–17 möglich);
    - Frage „Spricht die App versehentlich Kinder an?“ entfällt, weil sie Kinder ausdrücklich anspricht;
    - dadurch gilt die **Familienrichtlinie**: keine Werbung ✅, keine Werbe-ID ✅, kein Standort ✅, Datenschutzerklärung ✅;
    - **Elternabfrage eingebaut (Marcel 16.11.):** In der Android-App muss vor jedem Link nach außen (Website, Probestunde, Stundenpakete, Lernraum) ein Erwachsener eine ausgeschriebene Zahl in Ziffern eintippen. Danach ist 10 Minuten Ruhe. Impressum und Datenschutz bleiben frei erreichbar. Die Web-App im Browser hat keine Abfrage.
14. **Datensicherheit** (Antworten):
    - Werden Daten erhoben oder geteilt? **Ja** (nur freiwillige Funktionen).
    - Alle Daten **verschlüsselt übertragen**: Ja (HTTPS).
    - Kann man die Löschung beantragen? **Ja**: Klasse verlassen bzw. Profil löschen löscht den Ranglisten-Eintrag; Fehlermeldungen auf Anfrage per E-Mail.
    - **Erhobene Daten** (alle *optional*, *nicht geteilt*, nicht für Werbung):
      - *Persönliche Daten → Name:* Spitzname in der Klassen-Challenge; optionaler Name beim Fehler-Melden. Zweck: App-Funktionen, Kommunikation des Entwicklers.
      - *Persönliche Daten → E-Mail-Adresse:* optional beim Fehler-Melden, für Rückfragen. Zweck: Kommunikation des Entwicklers.
      - *App-Aktivitäten → Andere nutzergenerierte Inhalte:* Text von Fehlermeldungen und Ideen. Zweck: App-Funktionen.
      - *App-Aktivitäten → Andere Aktionen:* Punkte und gelöste Aufgaben je Runde für die Klassen-Rangliste. Zweck: App-Funktionen.
      - *App-Informationen und -Leistung → Diagnosedaten:* App-Version, Bildschirm, Sprache, Gerätekennung des Browsers bei Fehlermeldungen. Zweck: Analysen zur Fehlerbehebung.
      - *Geräte- oder andere IDs:* zufällige Spieler-Kennung der Klassen-Challenge. Zweck: App-Funktionen.
    - Nicht erhoben: Standort, Kontakte, Fotos, Werbe-ID, Finanzdaten, Gesundheit, Suchverlauf.
    - Der Update-Abruf (stand.json/Dateien von GitHub bzw. eigenem Server) sendet keine Nutzerdaten, das ist nur technische Verarbeitung.
15. **Weitere Formulare:**
    - Nachrichten-App: Nein;
    - Finanzfunktionen: keine;
    - Gesundheit: Nein;
    - Behörden-App: Nein;
    - Berechtigungen: nur Internet, Mitteilungen, Neustart-Empfang. Kein genauer Wecker, deshalb keine Sonder-Erklärung nötig.

**E. Test und Veröffentlichung**

16. **Testen → Interner Test** → „Neuen Release erstellen“:
    - AAB hochladen;
    - Release-Name = Version;
    - Notizen aus dem Changelog;
    - Tester-Liste mit eigenen Google-Konten anlegen, Link öffnen, installieren.
17. **Keine 12-Tester-Pflicht:** Marcels Konto ist ein **Firmenkonto** (Marcel 16.11.). Nach dem internen Test kann direkt Produktionszugriff beantragt werden. Ein geschlossener Test bleibt freiwillig.
18. Danach: optional geschlossener Test → Produktionszugriff beantragen → **Produktion** (Länder: Deutschland, Österreich, Schweiz, …).

### Nach dem Start

- **Neue Inhalte** gehen nach der Freigabe auf `rechenblitz-live` automatisch an alle Play-Nutzer. Ein Play-Release ist dafür nicht nötig.
- **Neues Bundle** nur bei Hüllen-Änderung (die Meldung sagt dann „NEUE APK/AAB“). Sonst etwa monatlich, damit die Versionsnummer im Store aktuell bleibt. Jeweils das Artefakt aus „Rechenblitz Play“ hochladen.

## Offen

- Paketname bestätigen.
- APK auf einem echten Handy testen (Marcel). Hier gibt es keinen Emulator.
- Datenschutzerklärung:
  - Abschnitt Rechenblitz um die Erinnerung ergänzen (Web: Push-Adresse + Uhrzeit; APK: nur lokal).
  - Abschnitt um die Android-App ergänzen.
