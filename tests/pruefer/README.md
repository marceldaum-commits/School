# Unabhängiger Aufgaben-Prüfer (Rechenblitz)

Rechnet alle erzeugten Aufgaben mit eigenem Code (Python, exakte Brüche) nach – ohne Code der App.

```bash
node tests/pruefer/export.js 1500 /tmp/aufgaben.json     # 29 Themen × 6 Stufen × 1500 Aufgaben
python3 tests/pruefer/answers.py /tmp/aufgaben.json       # Lösungen (Textaufgaben über stories.py)
python3 tests/pruefer/steps.py /tmp/aufgaben.json         # Gleichungen in den Lösungswegen
python3 tests/pruefer/lint.py /tmp/aufgaben.json          # Schreibweisen
node tests/pruefer/equiv.js                               # gleichwertige Antworten werden angenommen
```

Neue oder geänderte Textaufgaben-Vorlagen brauchen einen Eintrag in `stories.py`, sonst meldet `answers.py` „Vorlage ohne Löser“.
