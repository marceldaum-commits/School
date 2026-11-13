# Rechenblitz – Schnittstelle Klassen-Challenge

Die App ruft diese Endpunkte unter `CONFIG.classApi` auf (in `kopfrechnen/config.js`, z. B. `'/api'` → `/api/klasse…`). Solange `classApi` leer ist, ist die Klassen-Challenge in der App **unsichtbar**. Alle Antworten JSON; Fehler als `{ "error": "Text für die Anzeige" }` mit passendem Status (400 Eingabe, 404 unbekannt, 409 Spitzname vergeben, 429 Ratenbremse) – die App zeigt `error` direkt an.

Idee: Eine Lehrkraft legt eine Klasse an und verteilt den Code. Die Kinder treten mit **Spitznamen** bei (kein echter Name nötig). Jede Runde in der App bringt Punkte (`richtige Aufgaben × (Stufe + 1)`); die Rangliste zählt je **Woche** (Montag–Sonntag, Berliner Zeit).

## Endpunkte

| Methode & Pfad | Body / Abfrage | Antwort |
|---|---|---|
| `POST /klasse` | `{ name }` (2–30 Zeichen) | `{ code }` – 6–8 Zeichen A–Z/0–9, gut lesbar (ohne 0/O/1/I) |
| `POST /klasse/beitreten` | `{ code, spitzname }` (2–20 Zeichen, Buchstaben/Ziffern/Leerzeichen/`_.-`) | `{ spieler, name }` – `spieler` ist eine zufällige Kennung (Geheimnis des Geräts), `name` der Klassenname |
| `POST /klasse/punkte` | `{ code, spieler, id, punkte, aufgaben, richtig }` | `{ ok: true }` – `id` (UUID) einmalig, doppelte `id` ignorieren; `punkte` 1–500 je Runde |
| `GET /klasse/<code>/rangliste` | optional `?spieler=…` | `{ name, bis: "YYYY-MM-DD", eintraege: [{ spitzname, punkte, aufgaben, ich? }] }` – absteigend nach Punkten, `ich: true` für den anfragenden Spieler |
| `POST /klasse/verlassen` | `{ code, spieler }` | `{ ok: true }` – löscht den Eintrag (auch Punkte) |

Antwortet `/klasse/punkte` mit 404 oder 403 (Klasse/Spieler gelöscht), entfernt die App die Klasse aus dem Gerät. Bei Netzfehlern/429/5xx bleiben Punkte im Gerät (`klassePending`, max. 50) und werden später nachgereicht.

## Empfehlungen für den Server

- Wortfilter für Klassen- und Spitznamen (400 „Bitte einen anderen Spitznamen wählen.“), Spitzname je Klasse eindeutig (409).
- Max. Spieler je Klasse (z. B. 60), Ratenbremse je Gerät/IP, keine IP-Speicherung.
- Punkte plausibel begrenzen (z. B. max. 500 je Runde, max. 30 Runden je Tag und Spieler). Die Punkte werden im Gerät berechnet und sind nicht fälschungssicher – für eine Klassen-Rangliste ausreichend.
- Löschfristen wie beim Mathe-Trainer (z. B. inaktive Klassen nach 8 Wochen).
- Datenschutztext `#rechenblitz` um die Klassen-Challenge ergänzen (Spitzname, Kennung, Wochenpunkte).

Hinweis: Der Leitstand betreibt für den Mathe-Trainer bereits eine ähnliche Rangliste (`/api/klasse…`, Übergabe 25). Pfade und Fehlerformat sind bewusst ähnlich gehalten, damit sie wiederverwendet werden kann; Rechenblitz läuft auf einer eigenen Adresse, die Daten bleiben getrennt.
