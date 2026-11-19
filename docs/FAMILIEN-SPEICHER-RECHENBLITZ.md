# Familien-Speicher – Anbindung Rechenblitz (Auszug Bauplan v1.1, AppZentrale 19.11.2026, 9edd3a9)

Stand: Anbindung geplant nach dem Fr-Update 20.11., sobald `familie.js` (Mathe-Trainer) und der Test-Server stehen.

## Begriffe
- `famId` 16 B base64url, `famKey` 32 B (nur auf Geräten), `schreib` 16 B (Header `X-Schreib`).
- Familien-Link: `https://lernen.mathenachhilfe-online.com/rechenblitz/#familie=<famId>.<famKey>.<schreib>`
- `kindId` 16 B base64url, dauerhaft im Profil (`ROOT.profiles[x].kindId`); Gerätedaten (`rb-classes`, `rb-teacher`) als `geraet-<Geräte-Id>`.

## Blob je Kind
`{"app":"rechenblitz","v":1,"kind":"<kindId>","stand":"<ISO>","daten":{"profil":{name,emoji,data},"lang"}}`.
- Pro-/Rechte-Codes NICHT im Kind-Blob (gehören zur Familie).
- Rahmen vor dem Verschlüsseln: `z` + gzip(JSON) oder `j` + JSON; beide lesen.
- Schlüssel: HKDF-SHA256(famKey, salt = 32 × 0, info = `lernapps/v1/rechenblitz/<kindId>`, 32 B); Index: `lernapps/v1/index`.
- AES-GCM-256, 12-B-IV, Body `<iv>.<ct>` (base64url); ≤ 2 MB je Blob, ≤ 30 MB je Familie.

## Server `/familie/v1/`
- `PUT /<famId>` (X-Schreib) anlegen · `GET/PUT /<famId>/index` · `GET/PUT /<famId>/s/rechenblitz/<kindId>` (If-Match: rev; 409 → {rev,d,t})
- `GET /<famId>/liste` · `GET /<famId>/rechte` · `POST /<famId>/einloesen {code}` · `DELETE /<famId>` · `GET /<famId>/protokoll`

## Konflikt
Server-`rev` entscheidet, nie Zeitstempel allein. Bei 409 sicher zusammenführen (beste Werte, Summen), sonst im Elternbereich beide Stände zeigen. Nie still überschreiben.

## In der App
- Automatisch sichern nach jeder Runde (höchstens alle 2 Min.) und beim Verstecken; beim Start `liste` prüfen, Neueres laden.
- Elternbereich (hinter dem Eltern-Tor): koppeln, Kind zuordnen, Status, Notfall-Blatt, Löschen, Protokoll, Zustimmung beim ersten Koppeln.
- Bestehende eltern/v1-Kopplung: beim Familien-Link Stand übernehmen; Bericht (`b/`) bleibt.

## Wiederherstellungs-Schlüssel (öffentlich, Marcel 19.11.)
`REC_PUB = vMrORj9yObM3Ijd9sGStjUB9I3f6ot9E8M-70yGeQ0M` (X25519, 32 B base64url). Gilt auch für Test-Familien auf lernen-test; keinen eigenen Test-Schlüssel verwenden. Der private Teil liegt nur in Bitwarden.

## Eltern-Hinweis und Löschen (FAMILIEN-SPEICHER.md v1.5, gilt für alle Apps)
**Pflicht-Hinweis** beim ersten Koppeln und im Bereich „Familie“, darunter Link zur Datenschutzerklärung und „Einverstanden“ (EN/UK sinngemäß):
„Eure Lernstände werden verschlüsselt auf unserem Server in Deutschland gespeichert. Der Schlüssel liegt auf euren Geräten. Damit wir euch helfen können, falls ihr den Familien-Zugang verliert, hinterlegen wir zusätzlich eine verschlüsselte Notfall-Kopie. Sie lässt sich nur mit einem getrennt und offline aufbewahrten Schlüssel von Mathenachhilfe Online öffnen. Technisch könnten wir damit eure Lernstände lesen; wir tun das nicht und nutzen ihn nur, wenn ihr uns um Wiederherstellung bittet. Jede Wiederherstellung seht ihr hier im Protokoll.“

**Löschen** nur hinter dem Eltern-Tor:
1. Warnung: „Das löscht die Familie in ALLEN Lern-Apps: alle Lernstände aller Kinder auf unserem Server, die Notfall-Kopie und das Protokoll. Gekaufte Codes werden wieder frei und lassen sich in einer neuen Familie erneut einlösen. Die Lernstände auf diesem Gerät bleiben erhalten.“
2. Familien-Nummer eintippen, dann `fa.loeschen()`. Lokal nur die Familien-Schlüssel entfernen.
3. 404 auf anderen Geräten: „Diese Familie gibt es nicht mehr. Lernstand bleibt auf diesem Gerät.“
4. Einzelnes Kind entfernen: noch nicht anbieten.

## Freigabe „Recht“ mit Auflagen (v1.6, 19.11.)
- Auflage A6: **nur ein Einwilligungstext** = der Pflichttext oben (unverändert), darunter der Link „Mehr dazu in der Datenschutzerklärung (Abschnitt 10m)“ und der Knopf **„Einverstanden – Familie anlegen“**. Nichts vorausgewählt.
- Anlegen und Beitreten nur hinter dem Eltern-Tor.
- Roadmap, noch nicht bauen: ein Kind einzeln löschen.

## Freigabe V8 mit Auflagen (v1.7, 19.11.)
1. **Beitreten** per Familien-Link oder QR-Code: derselbe Pflichttext hinter dem Eltern-Tor, Knopf **„Einverstanden – Familie beitreten“** (nicht vorausgewählt). Wer abbricht, lädt nichts hoch.
2. **Sicherheitshinweis** (NICHT im Pflichttext): dauerhaft auf der Familien-Seite und zusätzlich direkt bei „Link teilen“, beim QR-Code und beim Notfall-Blatt:
   „Wer den Familien-Link oder den QR-Code hat, kann die Lernstände eurer Familie öffnen, ändern und löschen. Teilt ihn nur mit Personen, denen ihr vertraut, und bewahrt das Notfall-Blatt sicher auf.“
3. Meldung mit Commit und Zeile „Rechtsbezug: ja (V8)“.
