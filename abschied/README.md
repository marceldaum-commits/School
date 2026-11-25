# Abschied von /rechenblitz/ (Umbenennung in Zahlensprint, 24.11.2026)

Für den Leitstand. Diese zwei Dateien ersetzen **nur dann** den Inhalt von `lernen(-test).mathenachhilfe-online.com/rechenblitz/`, wenn `/zahlensprint/` die App ausliefert (Reihenfolge: Testseite, Geräte-Test, dann live).

| Datei | Ziel | Wirkung |
|---|---|---|
| `index.html` | `/rechenblitz/index.html` (und jede andere Adresse unter `/rechenblitz/`, die sonst 404 gäbe) | Weiterleitung nach `/zahlensprint/<gleicher Pfad><?Abfrage><#Hash>`, Hinweis „Bitte neu installieren“, meldet alte Service Worker und Caches ab |
| `sw.js` | `/rechenblitz/sw.js` | ersetzt den alten Service Worker: löscht `rechenblitz-<Version>`-Caches (behält `rechenblitz-push` und `rechenblitz-stimme`), meldet sich selbst ab, schickt offene Fenster nach `/zahlensprint/` |

- **Lernstand:** bleibt erhalten. `/rechenblitz/` und `/zahlensprint/` liegen auf demselben Ursprung (`lernen.…`), der Speicher im Browser (`rechenblitz`, `rb-classes`, `rb-teacher`) gilt für beide Pfade. Es ist kein Export nötig.
- **Dienste:** `/zahlensprint/api/…` muss dieselben Dienste wie bisher `/rechenblitz/api/…` bedienen (Meldungen, Klassen-Challenge, Erinnerung, Gutschein).
- **Alte Adressen** `rechenblitz.mathenachhilfe-online.com` und `rechenblitz-test.…`: bleiben vorerst unverändert (Marcel 22.11.: kein 301 vor dem 1.3.2027). Die App (ab 3.31.0) zieht von dort zuerst nach `lernen(-test).…/zahlensprint/`, sonst nach `/rechenblitz/`.
- **Test:** `node tests/abschied.js`.
