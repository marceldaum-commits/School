# Rechenblitz – Schnittstelle für Fehlermeldungen

Rechenblitz (Ordner `kopfrechnen/`) schickt Meldungen aus dem Menü (schwebender Button unten rechts) per `POST` an die URL in `config.js` (`reportEndpoint`, derzeit `/api/meldung`).

- Methode: `POST`, Header `Content-Type: application/json`
- Erfolg: beliebige Antwort mit Status 2xx. Alles andere (oder keine Verbindung) → die App legt die Meldung in einen Postausgang auf dem Gerät und versucht es beim nächsten Start bzw. sobald das Gerät wieder online ist erneut.
- Läuft die App auf einer anderen Domain als der Endpunkt, muss der Server CORS erlauben (`Access-Control-Allow-Origin`, `OPTIONS`-Preflight mit `Content-Type`).
- Die Meldung hat eine eindeutige `id` – doppelt ankommende Meldungen (Wiederholungsversuche) bitte anhand der `id` ignorieren.
- Spam: Die App sendet nur, wenn ein verstecktes Honeypot-Feld leer ist, und höchstens alle 15 Sekunden. Serverseitig zusätzlich begrenzen (z. B. pro IP).

## Beispiel

```json
{
  "id": "6f1c2a4e-…",
  "createdAt": "2026-11-13T12:34:56.000Z",
  "type": "aufgabe",                     // "aufgabe" | "app" | "idee"
  "message": "Bei 3/4 + 1/8 müsste 7/8 herauskommen.",
  "name": "Lena",                        // optional, kann leer sein
  "email": "lena@example.org",          // optional (für Rückfragen), kann leer sein
  "task": {                              // null, wenn keine Aufgabe angehängt ist
    "task": "3/4 + 1/8 = ?",
    "given": "7/8",                      // Eingabe der Person (leer, wenn noch nichts eingetippt)
    "expected": "7/8",                   // Lösung laut App
    "correct": true,                     // true/false, null = Aufgabe noch offen
    "topic": "Brüche", "level": 3, "mode": "training",
    "raw": { "topic": "frac", "level": 3, "expr": [ … ], "answer": { "q": { "n": 7, "d": 8 }, "kind": "frac" } }
  },
  "app": {
    "name": "Rechenblitz", "version": "3.0.1", "url": "https://…/rechenblitz/",
    "screen": "game", "standalone": false, "userAgent": "Mozilla/5.0 …",
    "language": "de-DE", "viewport": "390x844", "theme": "light",
    "settings": { "sound": true, "speech": false, "auto": true, "theme": "auto" },
    "selection": { "topic": "frac", "level": 3 }
  }
}
```

## Gewünschte Weiterleitung

- E-Mail **von** `system@mathenachhilfe-online.com` an den Betreiber, Betreff z. B. `Rechenblitz: Fehlermeldung (Brüche, Stufe 3)`.
- Ist `email` gesetzt, als `Reply-To` verwenden, damit man direkt antworten kann.
- Zusätzlich speichern (Datenbank/Liste), damit Meldungen später ausgewertet und Fehler im Code behoben werden können.
- Alle Felder sind Nutzereingaben bzw. vom Gerät gemeldet → vor der Ausgabe in HTML-Mails escapen.
