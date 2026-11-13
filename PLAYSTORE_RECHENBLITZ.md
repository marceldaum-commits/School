# Rechenblitz im Google Play Store – Vorbereitung (Stand 13.11.2026, App 3.5.1)

Leitstand-Übergabe (38): gleiches Vorgehen wie beim Mathe-Trainer (Übergabe 34). Marcel 13.11.: Veröffentlichung **ab 2027**, wenn alles passt – bis dahin nur vorbereiten.

## Weg: Trusted Web Activity (TWA)

Die Android-App ist eine dünne Hülle um die Web-App `https://rechenblitz.mathenachhilfe-online.com/`. Alle Updates kommen weiter über die Website (kein neues Store-Paket nötig). Mitteilungen laufen über **Benachrichtigungs-Delegation**: Android zeigt die Erinnerung als Mitteilung der App „Rechenblitz“. Die Erlaubnis verwaltet man in den Android-Einstellungen wie bei jeder App.

| Punkt | Wert / Stand |
|---|---|
| Paketname (Vorschlag) | `com.mathenachhilfeonline.rechenblitz` (gleiches Schema wie der Trainer verwenden; **nach dem ersten Hochladen nicht mehr änderbar**) |
| Start-Adresse | `https://rechenblitz.mathenachhilfe-online.com/` |
| Manifest | `kopfrechnen/manifest.webmanifest`: `id`, Name, Symbole 192/512 + maskable, `display: standalone`, `categories` ✅ |
| Offline | Service Worker `kopfrechnen/sw.js` ✅ |
| Erinnerung (Push) | ✅ ab 3.5.1, Server `/api/push` (gemeinsam mit dem Trainer) |
| Benachrichtigungs-Delegation | im TWA-Paket einschalten (`enableNotifications: true`) |
| Digital Asset Links | Datei `/.well-known/assetlinks.json` auf **rechenblitz.mathenachhilfe-online.com** – **Leitstand** (siehe unten) |
| Signierschlüssel | nur bei Marcel (Bitwarden), nie im Repo |
| Konto | Marcels Organisationskonto (D-U-N-S), dasselbe wie für den Trainer – keine 12-Tester-Pflicht |
| Zielgruppe / Inhalte | Kinder **und** Erwachsene (Lehrkräfte, Eltern) → „Familien“-Richtlinien von Google prüfen: keine Werbung von Drittanbietern ✅, kein Tracking ✅, keine Konten ✅ |

## Schritte (wenn der Trainer durch ist – gleiche Werkzeuge)

1. Paket erzeugen (z. B. mit Bubblewrap oder PWABuilder) aus `https://rechenblitz.mathenachhilfe-online.com/manifest.webmanifest`, Werte aus der Tabelle, `enableNotifications: true`, Farben `#101b43` (Leiste) / `#f7f9fd` (Startbild).
2. Signierschlüssel neu anlegen oder den Play-App-Signing-Schlüssel nutzen; SHA-256-Fingerabdruck notieren (Play Console → App-Integrität).
3. **Leitstand:** `assetlinks.json` unter `https://rechenblitz.mathenachhilfe-online.com/.well-known/assetlinks.json` ausliefern (Content-Type `application/json`):
   ```json
   [{ "relation": ["delegate_permission/common.handle_all_urls"],
      "target": { "namespace": "android_app", "package_name": "com.mathenachhilfeonline.rechenblitz",
                  "sha256_cert_fingerprints": ["<SHA-256 aus der Play Console>"] } }]
   ```
   Ohne diese Datei zeigt Android eine Adressleiste über der App.
4. Store-Eintrag: Kurzbeschreibung, lange Beschreibung (DE, EN, UK), Symbol 512 px, Vorschaubild 1024×500, mind. 4 Bildschirmfotos Handy (+ Tablet). Bilder und Texte erstellt der Raum Kopfrechnen am **03.12.** (Roadmap Tag 20).
5. Datenschutz-Angaben (Data Safety): gespeichert auf dem Server nur Fehlermeldungen (freiwillig), Push-Adresse + Uhrzeit (freiwillig), Gutschein-Abruf (Klassenstufe); kein Konto, keine Werbe-ID, keine Weitergabe.
6. Interner Test → geschlossener Test → Produktion (frühestens 2027).

## Offen
- Paketname bestätigen (Marcel/Leitstand, gleiches Schema wie Trainer).
- `assetlinks.json` (Leitstand), sobald der Fingerabdruck existiert.
- Datenschutzerklärung Abschnitt Rechenblitz um „Erinnerung aufs Handy“ ergänzen (vor Live-Freigabe von 3.5.1).
