# Themenseiten für die Website (Vorschlag für den Website-Raum / Leitstand)

Ziel: Familien, die bei Google z. B. „Einmaleins üben kostenlos“ suchen, finden eine Seite von Nachhilfe – online, die direkt in das passende Rechenblitz-Thema führt – und nebenbei die Probestunde kennenlernen.

## Direktlinks in die App

Rechenblitz versteht Adress-Zusätze, die das Thema (und optional die Stufe und den Modus) vorwählen:

```
https://rechenblitz.mathenachhilfe-online.com/?thema=mul&stufe=2
https://rechenblitz.mathenachhilfe-online.com/?thema=frac&stufe=auto&modus=training
https://rechenblitz.mathenachhilfe-online.com/?advent
```

- `thema`: `add` Plus · `sub` Minus · `mul` Mal · `div` Geteilt · `gap` Lücke · `frac` Brüche · `dec` Dezimalzahlen · `pct` Prozent · `neg` negative Zahlen · `pow` Potenzen · `order` Klammern/Punkt vor Strich · `round` Runden · `unit` Einheiten · `divis` Teiler · `eq` Gleichungen · `word` Textaufgaben · `mix` gemischt
- `stufe`: `1`–`5` oder `auto` · `modus` (optional, startet sofort): `training`, `zen` (ruhig üben), `blitz`
- Der Zusatz wird nach dem Öffnen aus der Adresse entfernt; nichts wird gespeichert außer der Auswahl im Gerät.

Je Seite: Titel (≤ 60 Zeichen), Beschreibung (≤ 155 Zeichen), H1, Text, zwei Knöpfe („Jetzt üben“ → Direktlink, „Kostenlose Probestunde“). Texte bitte bei Bedarf an den Ton der Website anpassen.

---

## 1. Einmaleins üben – kostenlos online

- **Adresse:** `/einmaleins-ueben/`
- **Titel:** Einmaleins üben – kostenlos & ohne Anmeldung | Nachhilfe – online
- **Beschreibung:** Das kleine und große Einmaleins spielerisch üben: zufällige Aufgaben, Lösungsweg bei Fehlern, Übersicht über alle Reihen. Kostenlos im Browser.
- **H1:** Einmaleins üben – mit Spaß statt Pauken
- **Text:** Das Einmaleins ist die Grundlage für fast alles, was in Mathe noch kommt. Mit Rechenblitz übt dein Kind die Reihen in kurzen Runden – jede Aufgabe ist neu ausgewürfelt. Bei einem Fehler zeigt die App einen Rechentrick, z. B. „9 · 7 = 10 · 7 − 7“. Die Einmaleins-Übersicht zeigt in Grün, Gelb und Rot, welche Aufgaben schon sitzen; unsichere Aufgaben kommen automatisch öfter dran. Und wer mag, tritt im Duell gegen Geschwister an.
- **Abschnitte:** „Kernaufgaben zuerst (·1, ·2, ·5, ·10)“ · „Rechentricks für die schweren Reihen (6, 7, 8, 9)“ · „Wie lange am Tag üben? – 5 bis 10 Minuten reichen“
- **Knöpfe:** Kleines Einmaleins üben → `?thema=mul&stufe=2` · Kernaufgaben → `?thema=mul&stufe=1` · Großes Einmaleins → `?thema=mul&stufe=3`

## 2. Bruchrechnen üben

- **Adresse:** `/bruchrechnen-ueben/`
- **Titel:** Bruchrechnen üben – Aufgaben mit Lösungsweg | Nachhilfe – online
- **Beschreibung:** Brüche kürzen, addieren, multiplizieren und dividieren – zufällige Übungsaufgaben mit Schritt-für-Schritt-Lösung. Kostenlos, ohne Anmeldung.
- **H1:** Bruchrechnen üben – Schritt für Schritt
- **Text:** Bruchrechnung ist in Klasse 6 und 7 für viele der erste große Stolperstein. Rechenblitz führt in fünf Stufen von gleichnamigen Brüchen über Kürzen und den gemeinsamen Nenner bis zum Malnehmen und Teilen mit dem Kehrwert. Ist eine Antwort richtig, aber nicht gekürzt, gibt es einen Hinweis statt eines Fehlers – so lernt man das Kürzen ganz nebenbei.
- **Abschnitte:** „Gleichnamig oder ungleichnamig?“ · „Kürzen: durch den größten gemeinsamen Teiler“ · „Teilen = mal Kehrwert“
- **Knöpfe:** Leicht starten → `?thema=frac&stufe=1` · Gemeinsamer Nenner → `?thema=frac&stufe=3` · Automatisch passend → `?thema=frac&stufe=auto`

## 3. Prozentrechnung üben

- **Adresse:** `/prozentrechnung-ueben/`
- **Titel:** Prozentrechnung üben – kostenlos online | Nachhilfe – online
- **Beschreibung:** Prozentwert, Prozentsatz und Grundwert im Kopf berechnen – mit Rabatt-Aufgaben aus dem Alltag und Lösungsweg bei jedem Fehler.
- **H1:** Prozentrechnung – im Kopf schneller als mit dem Taschenrechner
- **Text:** 25 % sind ein Viertel, 10 % ein Zehntel – wer diese Bausteine kennt, rechnet Prozente im Kopf. Rechenblitz übt erst die einfachen Prozentsätze, dann gesuchten Prozentsatz und Grundwert und schließlich Preise, die erhöht oder reduziert werden. Der Lösungsweg zeigt immer den kürzesten Kopfrechen-Weg.
- **Knöpfe:** Einstieg → `?thema=pct&stufe=1` · Grundwert gesucht → `?thema=pct&stufe=4` · Rabatte → `?thema=pct&stufe=5`

## 4. Kopfrechnen Grundschule

- **Adresse:** `/kopfrechnen-grundschule/`
- **Titel:** Kopfrechnen üben Grundschule – Klasse 1 bis 4 | Nachhilfe – online
- **Beschreibung:** Plus, Minus, Mal, Geteilt und Lückenaufgaben für Klasse 1–4: kurze Runden, Sterne, Abzeichen und eine Tageschallenge. Kostenlos und ohne Werbung im Spiel.
- **H1:** Kopfrechnen in der Grundschule – jeden Tag ein bisschen
- **Text:** Vom Zahlenraum 10 bis 1000: Rechenblitz passt die Aufgaben an die Klassenstufe an. Mit dem Einstufungstest weiß man nach fünf Minuten, wo das Kind steht. Sterne, Abzeichen, eine Urkunde zum Ausdrucken und die Tageschallenge sorgen dafür, dass Üben Spaß macht. Für Eltern gibt es einen Wochenbericht.
- **Knöpfe:** Plus bis 20 → `?thema=add&stufe=2` · Lückenaufgaben → `?thema=gap&stufe=1` · Textaufgaben → `?thema=word&stufe=1`

## 5. Gleichungen lösen üben

- **Adresse:** `/gleichungen-ueben/`
- **Titel:** Gleichungen lösen üben – mit Lösungsweg | Nachhilfe – online
- **Beschreibung:** Lineare Gleichungen von x + 5 = 12 bis x auf beiden Seiten: zufällige Aufgaben, jeder Umformungsschritt erklärt. Kostenlos.
- **H1:** Gleichungen lösen – wie eine Waage
- **Text:** Was links passiert, muss auch rechts passieren: Rechenblitz zeigt bei jedem Fehler die Umformungsschritte („− 11 auf beiden Seiten …“). Fünf Stufen von einfachen Gleichungen bis zu Klammern und x auf beiden Seiten.
- **Knöpfe:** Einstieg → `?thema=eq&stufe=1` · Zwei Schritte → `?thema=eq&stufe=3` · x auf beiden Seiten → `?thema=eq&stufe=5`

## 6. Dezimalzahlen üben

- **Adresse:** `/dezimalzahlen-ueben/`
- **Titel:** Dezimalzahlen üben – Kommazahlen im Kopf | Nachhilfe – online
- **Beschreibung:** Kommazahlen addieren, multiplizieren, durch 10, 100, 1000 teilen und Brüche umwandeln – mit Lösungsweg. Kostenlos und ohne Anmeldung.
- **H1:** Rechnen mit Kommazahlen – ganz ohne Komma-Chaos
- **Knöpfe:** Komma unter Komma → `?thema=dec&stufe=2` · Mal und geteilt durch 10, 100 → `?thema=dec&stufe=3`

---

**Für alle Seiten:** unten ein kurzer Absatz „Hakt es trotzdem? In einer kostenlosen Probestunde schauen wir gemeinsam drauf.“ mit Knopf zur Probestunde; interne Links zwischen den Themenseiten und zum Lernraum. Keine Einbettung als iframe (siehe Meldung (2)), sondern Links/Knöpfe in die App.
