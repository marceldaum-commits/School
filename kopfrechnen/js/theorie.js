'use strict';
/* ---------- Theorie: zu jedem Thema und jeder Stufe die passende Regel + ein echtes Beispiel ----------
   Die Regeln stehen hier als kurze Sätze. Das Beispiel kommt aus demselben Aufgaben-Generator wie die Übung,
   mit demselben (geprüften) Lösungsweg – Theorie und Übung passen also immer zusammen. */
const THEORIE = {
  add: { k: 'Plus heißt: zusammenzählen. Die Reihenfolge ist egal: 3 + 5 = 5 + 3.', l: [
    ['Zähle vom größeren Summanden aus weiter.', 'Probe mit Minus: 6 + 2 = 8, also 8 − 2 = 6.'],
    ['Erst bis 10 auffüllen, dann den Rest dazu.', 'Beispiel 8 + 5: 8 + 2 = 10, dann 10 + 3 = 13.'],
    ['Die Einer zum nächsten Zehner auffüllen, dann den Rest dazu.', 'Beispiel 57 + 7: 57 + 3 = 60, dann 60 + 4 = 64.'],
    ['Erst die Zehner dazu, dann die Einer.', 'Beispiel 49 + 25: 49 + 20 = 69, dann 69 + 5 = 74.'],
    ['Die zweite Zahl in Hunderter, Zehner und Einer zerlegen und Schritt für Schritt dazuzählen.', 'Beispiel 336 + 218: + 200, dann + 10, dann + 8.'],
    ['Auch große Zahlen zerlegst du: Tausender, Hunderter, Zehner, Einer.', 'Bei jedem Schritt auf den Übergang achten: 4705 + 8 = 4713.'],
  ] },
  sub: { k: 'Minus heißt: wegnehmen. Die Probe machst du mit Plus.', l: [
    ['Rückwärts zählen oder überlegen: Was fehlt bis zur großen Zahl?', 'Probe: 8 − 2 = 6, denn 6 + 2 = 8.'],
    ['Erst bis zur 10 zurück, dann den Rest weg.', 'Beispiel 14 − 7: 14 − 4 = 10, dann 10 − 3 = 7.'],
    ['Erst bis zum Zehner zurück, dann den Rest weg.', 'Beispiel 62 − 9: 62 − 2 = 60, dann 60 − 7 = 53.'],
    ['Erst die Zehner weg, dann die Einer.', 'Beispiel 74 − 25: 74 − 20 = 54, dann 54 − 5 = 49.'],
    ['Die zweite Zahl zerlegen und Schritt für Schritt abziehen.', 'Beispiel 554 − 218: − 200, dann − 10, dann − 8.'],
    ['Tausender, Hunderter, Zehner und Einer nacheinander abziehen.', 'Probe mit Plus: Ergebnis + abgezogene Zahl = Startzahl.'],
  ] },
  mul: { k: 'Mal heißt: gleich große Gruppen zusammenzählen. 3 · 4 = 4 + 4 + 4.', l: [
    ['Mal 1 ändert nichts. Mal 10: eine Null anhängen.', 'Mal 2 ist das Doppelte. Mal 5 ist die Hälfte von mal 10.'],
    ['Aus Kernaufgaben ableiten: 6 · 3 = 5 · 3 + 1 · 3 = 15 + 3 = 18.', 'Tauschen hilft: 3 · 8 = 8 · 3.'],
    ['Zahlen von 11 bis 19 in Zehner und Einer zerlegen.', 'Beispiel 6 · 15: 6 · 10 = 60 und 6 · 5 = 30, zusammen 90.'],
    ['Die zweistellige Zahl zerlegen, beide Teile malnehmen, dann addieren.', 'Beispiel 9 · 14: 9 · 10 = 90 und 9 · 4 = 36, zusammen 126.'],
    ['Eine Zahl in Zehner und Einer zerlegen und jeden Teil mit der anderen Zahl malnehmen.', 'Beispiel 14 · 13: 14 · 10 = 140 und 14 · 3 = 42, zusammen 182.'],
    ['Die zweistellige Zahl zerlegen: 47 = 40 + 7.', 'Dann 465 · 40 und 465 · 7 rechnen und addieren.'],
  ] },
  div: { k: 'Geteilt ist die Umkehrung von mal: 12 : 3 = 4, weil 4 · 3 = 12.', l: [
    ['Frage dich: Welche Zahl mal 2 ergibt 10?', 'Geteilt durch 10: eine Null weglassen. Geteilt durch 2: halbieren.'],
    ['Nutze das Einmaleins rückwärts: 48 : 6 = 8, weil 8 · 6 = 48.'],
    ['Die Zahl in zwei leichte Teile zerlegen.', 'Beispiel 72 : 6: 60 : 6 = 10 und 12 : 6 = 2, zusammen 12.'],
    ['Zerlege so, dass sich jeder Teil gut teilen lässt.', 'Beispiel 210 : 6: 180 : 6 = 30 und 30 : 6 = 5, zusammen 35.'],
    ['Auch durch zweistellige Zahlen: in gut teilbare Teile zerlegen.', 'Beispiel 384 : 16: 320 : 16 = 20 und 64 : 16 = 4, zusammen 24.'],
    ['Großen Teil zuerst: Wie viele Zehner oder Hunderter passen hinein?', 'Probe mit mal: Ergebnis · Teiler = Startzahl.'],
  ] },
  gap: { k: 'Bei Lücken rechnest du rückwärts – mit der Umkehraufgabe.', l: [
    ['Plus-Lücke mit Minus lösen: 9 + ? = 11 → 11 − 9 = 2.', 'Minus-Lücke: 15 − ? = 9 → 15 − 9 = 6.'],
    ['Überlege: Wie viel fehlt von der kleinen bis zur großen Zahl?', 'Beispiel 31 − ? = 16 → 31 − 16 = 15.'],
    ['Mal-Lücke mit Geteilt lösen: 15 · ? = 90 → 90 : 15 = 6.'],
    ['Geteilt-Lücke: 42 : ? = 14 → Welche Zahl mal 14 ergibt 42? → 3.'],
    ['Erst die passende Umkehraufgabe aufschreiben, dann rechnen.', 'Am Ende die Probe: Zahl in die Lücke einsetzen.'],
    ['Zweistufige Lücken von außen nach innen rückwärts lösen.', 'Beispiel ? · 7 + 74 = 746: erst 746 − 74 = 672, dann 672 : 7 = 96.'],
  ] },
  doppel: { k: 'Verdoppeln heißt mal 2, halbieren heißt geteilt durch 2.', l: [
    ['Das Doppelte von 8 ist 8 + 8 = 16.', 'Die Hälfte von 16 ist 8, weil 8 + 8 = 16.'],
    ['Zehner und Einer getrennt verdoppeln oder halbieren.', 'Beispiel die Hälfte von 28: 20 → 10 und 8 → 4, zusammen 14.'],
    ['Geschickt zerlegen, damit beide Teile gerade sind.', 'Beispiel die Hälfte von 152: 140 → 70 und 12 → 6, zusammen 76.'],
    ['Die Hälfte von einer ungeraden Zahl endet auf ,5.', 'Beispiel die Hälfte von 7 ist 3,5.'],
    ['Vierfach = zweimal verdoppeln, ein Viertel = zweimal halbieren.', 'Achtfach = dreimal verdoppeln, ein Achtel = dreimal halbieren.'],
    ['Mit Kommazahlen genauso: Schritt für Schritt verdoppeln oder halbieren.', 'Beispiel ein Achtel von 9539: 4769,5 → 2384,75 → 1192,375.'],
  ] },
  geld: { k: '1 € = 100 ct. Bei Geld stehen hinter dem Komma immer zwei Stellen: 3,50 €.', l: [
    ['Cent wie normale Zahlen rechnen: 40 ct + 40 ct = 80 ct.'],
    ['Euro in Cent: mal 100. Cent in Euro: Komma zwei Stellen nach links.', 'Rückgeld = bezahlt − Preis.'],
    ['Am sichersten in Cent rechnen: 6,19 € − 4,93 € = 619 ct − 493 ct = 126 ct = 1,26 €.'],
    ['Rückgeld: vom Preis bis zum bezahlten Betrag ergänzen.', 'Mal mit Komma: erst in Cent malnehmen, dann zurück in Euro.'],
    ['Erst den Preis für 1 Stück ausrechnen, dann für die gesuchte Menge.', '1 kg = 1000 g. 250 g sind ein Viertel kg, also Preis mal 4.'],
    ['Kilopreis: Preis : Gramm · 1000.', 'Einkauf: alle Posten addieren, dann vom bezahlten Betrag abziehen.'],
  ] },
  frac: { k: 'Ein Bruch hat Zähler (oben) und Nenner (unten). Der Nenner sagt, in wie viele Teile das Ganze geteilt ist.', l: [
    ['Gleicher Nenner: nur die Zähler addieren oder subtrahieren.', 'Der Nenner bleibt gleich: 2/7 + 3/7 = 5/7.'],
    ['Kürzen: Zähler und Nenner durch dieselbe Zahl teilen.', 'Bruchteil von einer Zahl: 3/4 von 20 = 20 : 4 · 3 = 15.'],
    ['Erst auf einen gemeinsamen Nenner erweitern, dann die Zähler rechnen.', 'Beispiel 2/5 + 1/4 = 8/20 + 5/20 = 13/20.'],
    ['Malnehmen: Zähler mal Zähler, Nenner mal Nenner.', 'Teilen: mit dem Kehrwert malnehmen. Kehrwert von 6/7 ist 7/6.'],
    ['Eine ganze Zahl ist ein Bruch mit Nenner 1: 7 = 7/1.', 'Punkt vor Strich gilt auch bei Brüchen.'],
    ['Klammer zuerst, dann Punkt vor Strich.', 'Am Ende immer so weit wie möglich kürzen.'],
  ] },
  dec: { k: 'Bei Dezimalzahlen stehen nach dem Komma Zehntel, Hundertstel, Tausendstel.', l: [
    ['In Zehnteln rechnen: 3,6 + 7,8 = 36 + 78 Zehntel = 114 Zehntel = 11,4.'],
    ['Komma unter Komma schreiben. Fehlende Stellen mit 0 auffüllen: 1,2 = 1,20.'],
    ['Mal 10, 100, 1000: Komma 1, 2, 3 Stellen nach rechts.', 'Geteilt durch 10, 100, 1000: Komma 1, 2, 3 Stellen nach links.'],
    ['Erst ohne Komma rechnen, dann die Nachkommastellen beider Zahlen zusammenzählen.', 'Beispiel 5,38 · 2: 538 · 2 = 1076, zwei Stellen → 10,76.'],
    ['Durch eine Kommazahl teilen: beide Zahlen mit 10, 100 … malnehmen, bis der Teiler ohne Komma ist.', 'Bruch in Dezimalzahl: Zähler : Nenner, oder auf 10, 100, 1000 erweitern.'],
    ['Klammer zuerst, dann Punkt vor Strich – wie bei ganzen Zahlen.', 'Nachkommastellen beim Malnehmen sorgfältig zählen.'],
  ] },
  pct: { k: 'Prozent heißt „von hundert“: 1 % = 1/100. Das Ganze sind 100 %.', l: [
    ['50 % ist die Hälfte, 25 % ein Viertel, 10 % ein Zehntel.', 'Beispiel 25 % von 56 = 56 : 4 = 14.'],
    ['Über 10 % oder 1 % rechnen.', 'Beispiel 40 % von 210: 10 % sind 21, also 40 % = 4 · 21 = 84.'],
    ['Prozentsatz: Anteil als Bruch schreiben und auf Hundertstel erweitern.', 'Beispiel 5 von 25 = 5/25 = 20/100 = 20 %.'],
    ['Grundwert: erst 1 % ausrechnen, dann mal 100.', 'Beispiel 40 % sind 148 → 1 % ≙ 3,7 → 100 % ≙ 370.'],
    ['Erhöhen: Prozentwert dazuzählen. Reduzieren: Prozentwert abziehen.', 'Beispiel 120 € + 30 %: 30 % von 120 = 36, also 156 €.'],
    ['Mehrere Änderungen nacheinander: jede bezieht sich auf den neuen Wert.', '+ 10 % heißt mal 1,1. − 20 % heißt mal 0,8.'],
  ] },
  neg: { k: 'Negative Zahlen liegen auf dem Zahlenstrahl links von der 0.', l: [
    ['Plus heißt: auf dem Zahlenstrahl nach rechts gehen.', 'Beispiel −5 + 3: Start bei −5, 3 nach rechts → −2.'],
    ['Minus heißt: nach links gehen – auch über die 0 hinaus.', 'Beispiel 15 − 26 = −11.'],
    ['Plus eine negative Zahl heißt minus: 3 + (−50) = 3 − 50 = −47.'],
    ['Gleiche Vorzeichen ergeben plus, verschiedene Vorzeichen ergeben minus.', 'Beispiel 96 : (−8) = −12 und (−4) · (−5) = 20.'],
    ['Minus eine negative Zahl heißt plus: −74 − (−46) = −74 + 46 = −28.'],
    ['Erst Klammern, dann Punkt vor Strich, dann von links nach rechts.', 'Vorzeichenregeln bei jedem Schritt beachten.'],
  ] },
  pow: { k: 'Eine Potenz ist eine kurze Schreibweise für Malnehmen: 5² = 5 · 5, 2³ = 2 · 2 · 2.', l: [
    ['Hoch 2 heißt: die Zahl mit sich selbst malnehmen. 9² = 9 · 9 = 81.'],
    ['Die Wurzel fragt rückwärts: Welche Zahl mal sich selbst ergibt 49? → √49 = 7.'],
    ['Quadratzahlen bis 20² auswendig lernen hilft: 11² = 121, 15² = 225, 20² = 400.'],
    ['Der Exponent sagt, wie oft die Zahl mit sich selbst malgenommen wird.', 'Beispiel 4⁴ = 4 · 4 · 4 · 4 = 256.'],
    ['Erst alle Potenzen und Wurzeln ausrechnen, dann plus und minus.', 'Beispiel 12² − 5² = 144 − 25 = 119.'],
    ['Wurzel aus einer Summe: erst die Summe ausrechnen, dann die Wurzel ziehen.', 'Achtung: √(9 + 16) = √25 = 5, nicht 3 + 4 = 7.'],
  ] },
  term: { k: 'Ein Term ist ein Rechenausdruck mit Variablen wie x. 3x bedeutet 3 · x.', l: [
    ['Setze die Zahl für x ein und rechne Punkt vor Strich.', 'Beispiel 2x + 3 mit x = 10: 2 · 10 + 3 = 23.'],
    ['Gleichartige Glieder zusammenfassen: nur die Zahlen vor x rechnen.', 'Beispiel 7x + 5x − 6x = (7 + 5 − 6)x = 6x.'],
    ['Klammer ausmultiplizieren: die Zahl vor der Klammer mit jedem Glied in der Klammer malnehmen.', 'Beispiel 7 · (x − 3) = 7x − 21.'],
    ['Erst x² ausrechnen, dann einsetzen.', 'Negative Zahlen beim Einsetzen in Klammern: (−9)² = 81.'],
    ['(a + b)² = a² + 2ab + b²', '(a − b)² = a² − 2ab + b²', '(a + b) · (a − b) = a² − b²'],
    ['Klammer mal Klammer: jedes Glied der ersten mit jedem Glied der zweiten Klammer malnehmen.', 'x³ = x · x · x. Bei negativem x: (−2)³ = −8.'],
  ] },
  linear: { k: 'Eine lineare Funktion hat die Form f(x) = mx + b. m ist die Steigung, b der y-Achsenabschnitt.', l: [
    ['Funktionswert: die Zahl für x einsetzen.', 'Beispiel f(x) = 5x + 2, f(2) = 5 · 2 + 2 = 12.'],
    ['Auf der y-Achse ist x = 0. Der Graph schneidet sie bei y = b.', 'Beispiel f(x) = 3x − 5 schneidet die y-Achse bei −5.'],
    ['Steigung aus zwei Punkten: m = (y₂ − y₁) : (x₂ − x₁).', 'Beispiel P(2|8), Q(6|16): m = 8 : 4 = 2.'],
    ['Nullstelle: f(x) = 0 setzen und nach x auflösen.', 'Beispiel 6x + 9 = 0 → 6x = −9 → x = −1,5.'],
    ['Schnittpunkt: beide Funktionen gleichsetzen und nach x auflösen.', 'Beispiel 3x + 12 = −2x + 27 → 5x = 15 → x = 3.'],
    ['Gerade durch zwei Punkte: erst m, dann b = y₁ − m · x₁, dann die Nullstelle.', 'y-Koordinate des Schnittpunkts: x in eine der Funktionen einsetzen.'],
  ] },
  zehner: { k: 'Zehnerpotenzen: 10² = 100, 10³ = 1000. Der Exponent zählt die Nullen.', l: [
    ['10 hoch n ist eine 1 mit n Nullen: 10⁵ = 100.000.'],
    ['Zahl mal 10ⁿ: n Nullen anhängen. Beispiel 6 · 10² = 600.'],
    ['Kommazahl mal 10ⁿ: Komma um n Stellen nach rechts.', 'Beispiel 5,9 · 10⁶ = 5.900.000.'],
    ['Große Zahl in wissenschaftlicher Schreibweise: Komma so weit nach links, bis nur noch eine Ziffer davor steht.', 'Die Anzahl der Stellen ist der Exponent: 96.900 = 9,69 · 10⁴.'],
    ['Kleine Zahl: Komma nach rechts verschieben – der Exponent wird negativ.', 'Beispiel 0,00897 = 8,97 · 10⁻³.'],
    ['Beim Malnehmen werden die Exponenten addiert: 10³ · 10⁴ = 10⁷.', 'Erst beide Zahlen als Zehnerpotenz schreiben, dann die Vorzahlen malnehmen.'],
  ] },
  order: { k: 'Rechenregeln: Klammern zuerst, dann Punkt (· :) vor Strich (+ −), sonst von links nach rechts.', l: [
    ['Punkt vor Strich: erst mal, dann plus.', 'Beispiel 2 · 6 + 2 = 12 + 2 = 14.'],
    ['Was in Klammern steht, wird zuerst gerechnet.', 'Beispiel (6 + 2) · 5 = 8 · 5 = 40.'],
    ['Geteilt ist auch Punktrechnung – kommt also vor plus und minus.', 'Beispiel 11 · 5 − 7 · 5 = 55 − 35 = 20.'],
    ['Erst Klammern, dann Punkt vor Strich.', 'Beispiel 4 · (6 + 4) − 15 = 40 − 15 = 25.'],
    ['Lange Ketten: erst alle Punktrechnungen, dann die Strichrechnungen von links nach rechts.'],
    ['Verschachtelte Klammern von innen nach außen lösen.'],
  ] },
  round: { k: 'Beim Runden entscheidet die Ziffer rechts neben der Rundungsstelle: 0–4 abrunden, 5–9 aufrunden.', l: [
    ['Auf Zehner: die Einerstelle entscheidet. 957 ≈ 960.'],
    ['Auf Hunderter: die Zehnerstelle entscheidet. 5436 ≈ 5400.'],
    ['Auf Tausender: die Hunderterstelle entscheidet.', 'Auf Zehntel: die Hundertstelstelle entscheidet. 83,27 ≈ 83,3.'],
    ['Überschlag: erst beide Zahlen runden, dann rechnen.', 'Beispiel 9606 + 3838 ≈ 9600 + 3800 = 13.400.'],
    ['Beim Malnehmen: gerundete Zahlen ohne Nullen malnehmen, dann die Nullen anhängen.', 'Beispiel 7900 · 90: 79 · 9 = 711, drei Nullen → 711.000.'],
    ['Große Zahlen auf Tausender und Hunderter runden und die Nullen zählen.', 'Auf Hundertstel: die Tausendstelstelle entscheidet.'],
  ] },
  unit: { k: 'Beim Umrechnen: in die kleinere Einheit wird malgenommen, in die größere geteilt.', l: [
    ['1 m = 100 cm, 1 kg = 1000 g, 1 € = 100 ct.'],
    ['1 km = 1000 m, 1 l = 1000 ml, 1 h = 60 min, 1 min = 60 s, 1 t = 1000 kg.'],
    ['Mit Kommazahlen: Komma verschieben. 244 cm = 2,44 m, 3,5 kg = 3500 g.'],
    ['Flächen: 1 m² = 100 dm², 1 dm² = 100 cm². Umrechnungszahl 100.', 'Rauminhalte: 1 m³ = 1000 dm³, 1 dm³ = 1000 cm³ = 1 l. Umrechnungszahl 1000.'],
    ['Gemischte Angaben in die kleinere Einheit umrechnen und addieren.', 'Beispiel 3 km 371 m = 3000 m + 371 m = 3371 m.'],
    ['Tempo: 1 m/s = 3,6 km/h.', 'Erst alles in dieselbe Einheit bringen, dann rechnen.'],
  ] },
  divis: { k: 'Ein Teiler teilt eine Zahl ohne Rest. 3 ist ein Teiler von 12.', l: [
    ['Division mit Rest: Wie oft passt die Zahl hinein? Was bleibt übrig?', 'Beispiel 29 : 6 = 4 Rest 5, weil 4 · 6 = 24 und 29 − 24 = 5.'],
    ['Quersumme: alle Ziffern addieren.', 'Ist die Quersumme durch 3 (oder 9) teilbar, dann auch die Zahl.'],
    ['ggT: alle Teiler beider Zahlen aufschreiben und den größten gemeinsamen suchen.'],
    ['kgV: beide Zahlen in Primfaktoren zerlegen.', 'Jeden Primfaktor so oft nehmen, wie er höchstens vorkommt.'],
    ['Primfaktoren: immer wieder durch die kleinstmögliche Primzahl teilen.', 'Anzahl der Teiler: jeden Exponenten um 1 erhöhen und malnehmen.'],
    ['Euklid: die größere Zahl durch die kleinere teilen, mit dem Rest weitermachen, bis der Rest 0 ist.', 'kgV von drei Zahlen: alle Primfaktoren mit ihrer höchsten Anzahl.'],
  ] },
  lgs: { k: 'Ein Gleichungssystem besteht aus zwei Gleichungen mit zwei Unbekannten x und y. Gesucht ist das Zahlenpaar, das beide Gleichungen zugleich erfüllt. Idee: eine Unbekannte wegschaffen, die andere ausrechnen, dann einsetzen und mit einer Probe prüfen.', l: [
    ['Additionsverfahren: Die Gleichungen werden addiert. Steht in I + y und in II − y, fällt y weg.', 'Beispiel I: x + y = 10, II: x − y = 4. I + II: 2x = 14, also x = 7.', 'x = 7 in I einsetzen: 7 + y = 10, also y = 3.', 'Probe in II: 7 − 3 = 4 ✓'],
    ['Gleichsetzungsverfahren: Sind beide Gleichungen nach y aufgelöst, setzt man die rechten Seiten gleich – beide sind ja gleich y.', 'Beispiel I: y = 3x − 2, II: y = x + 4. Gleichsetzen: 3x − 2 = x + 4.', '− x auf beiden Seiten: 2x − 2 = 4. + 2 auf beiden Seiten: 2x = 6. Also x = 3.', 'x = 3 in I einsetzen: y = 3 · 3 − 2 = 7. Probe in II: 3 + 4 = 7 ✓'],
    ['Einsetzungsverfahren: Ist eine Gleichung nach y aufgelöst (y = …), schreibt man diesen Term in der anderen Gleichung für y – in Klammern.', 'Beispiel I: y = 2x + 1, II: x + y = 7. Einsetzen: x + (2x + 1) = 7.', 'Klammer auflösen und zusammenfassen: 3x + 1 = 7, also 3x = 6 und x = 2.', 'x = 2 in I einsetzen: y = 2 · 2 + 1 = 5. Probe in II: 2 + 5 = 7 ✓'],
    ['Additionsverfahren mit Malnehmen: Eine Gleichung wird zuerst mit einer Zahl malgenommen (jedes Glied!), damit vor y Gegenzahlen stehen, z. B. 6y und −6y.', 'Beispiel I: x + 6y = 45, II: 6x − y = 11. II · 6: 36x − 6y = 66.', 'Addieren: x + 36x + 6y − 6y = 45 + 66, also 37x = 111 und x = 3.', 'x = 3 in I einsetzen: 3 + 6y = 45, 6y = 42, y = 7. Probe in II: 6 · 3 − 7 = 11 ✓'],
    ['Beide Gleichungen malnehmen: mit dem kgV der Zahlen vor y arbeiten. Ein Faktor bekommt ein Minus, wenn vor y gleiche Vorzeichen stehen.', 'Beispiel I: 2x + 3y = 12, II: 3x + 2y = 13. kgV von 3 und 2 ist 6.', 'I · 2: 4x + 6y = 24. II · (−3): −9x − 6y = −39. Addieren: −5x = −15, also x = 3.', 'x = 3 in I einsetzen: 6 + 3y = 12, 3y = 6, y = 2. Probe in II: 3 · 3 + 2 · 2 = 13 ✓'],
    ['Erst ordnen: alle x- und y-Glieder auf die linke Seite, die Zahl auf die rechte Seite. Ein Glied, das die Seite wechselt, wechselt sein Vorzeichen.', 'Beispiel I: 5x = 13 + 2y wird zu 5x − 2y = 13. II: 3y = 9 − x wird zu x + 3y = 9.', 'Dann wie gewohnt mit dem Additionsverfahren lösen.', 'Bei großen Zahlen hilft die Probe in beiden Gleichungen besonders.'],
  ] },
  quad: { k: 'Eine quadratische Gleichung hat x² in sich und meist zwei Lösungen (x kann positiv oder negativ sein). Im Kopf helfen vier Wege: Wurzel ziehen, Faktoren gleich null setzen, Summe und Produkt der Lösungen (Satz von Vieta) und erst durch die Zahl vor x² teilen.', l: [
    ['x² = Zahl: Gesucht ist die Zahl, die mit sich selbst malgenommen die Zahl ergibt.', 'Beispiel x² = 49 → x = 7, denn 7 · 7 = 49. (Auch −7 passt; hier ist die positive Lösung gesucht.)'],
    ['Erst x² allein auf eine Seite bringen, dann die Wurzel ziehen.', 'Beispiel x² + 15 = 40 → x² = 25 → x = 5.'],
    ['a · x² = Zahl: erst beide Seiten durch a teilen. (x + s)² = k²: auf beiden Seiten die Wurzel ziehen – das gibt zwei Möglichkeiten.', 'Beispiel 3x² = 75 → x² = 25 → x = 5.', 'Beispiel (x − 3)² = 25: x − 3 = 5 oder x − 3 = −5, also x = 8 oder x = −2.'],
    ['Ein Produkt ist null, wenn ein Faktor null ist. Darum kann man die Lösungen direkt ablesen.', 'Beispiel (x + 3)(x − 5) = 0: x + 3 = 0 gibt x = −3, und x − 5 = 0 gibt x = 5.', 'Achtung: Die Zahl in der Klammer hat das Gegenteil des Vorzeichens der Lösung.'],
    ['Satz von Vieta: Bei x² + px + q = 0 ist die Summe der Lösungen −p und das Produkt q.', 'Beispiel x² − 7x + 12 = 0: Summe 7, Produkt 12 → die Lösungen sind 3 und 4.', 'Beispiel x² + 2x − 15 = 0: Summe −2, Produkt −15 → die Lösungen sind −5 und 3.'],
    ['Steht vor x² eine Zahl a, teilt man zuerst die ganze Gleichung durch a. Dann geht es wie gewohnt mit Summe und Produkt.', 'Beispiel 2x² − 12x + 16 = 0 → x² − 6x + 8 = 0 → Summe 6, Produkt 8 → x = 2 oder x = 4.'],
  ] },
  eq: { k: 'Eine Gleichung ist wie eine Waage: Was du links machst, musst du auch rechts machen.', l: [
    ['x + a = b: auf beiden Seiten a abziehen.', 'Beispiel x + 16 = 29 → x = 29 − 16 = 13.'],
    ['a · x = b: beide Seiten durch a teilen. x : a = b: beide Seiten mal a.', 'Beispiel 4x = 40 → x = 10.'],
    ['Erst die Zahl ohne x auf die andere Seite bringen, dann teilen.', 'Beispiel 4x + 21 = 77 → 4x = 56 → x = 14.'],
    ['Mit negativen Zahlen genauso – Vorzeichen beachten.', 'Beispiel 7x + 16 = −33 → 7x = −49 → x = −7.'],
    ['x auf beiden Seiten: erst alle x-Glieder auf eine Seite bringen.', 'Beispiel 5x + 5 = 3x − 9 → 2x + 5 = −9 → 2x = −14 → x = −7.'],
    ['Erst alle Klammern ausmultiplizieren, dann zusammenfassen, dann wie gewohnt lösen.'],
  ] },
  zeit: { k: '1 Tag = 24 h, 1 h = 60 min, 1 min = 60 s, 1 Woche = 7 Tage.', l: [
    ['Eine Viertelstunde sind 15 Minuten, eine halbe Stunde 30 Minuten.', 'Zeitspanne in vollen Stunden: Ende − Anfang.'],
    ['Minuten bis zur vollen Stunde zählen, dann den Rest.', 'Tage und Stunden: Tage · 24 + Stunden.'],
    ['Über die volle Stunde: erst bis zur vollen Stunde, dann weiter.', 'Beispiel 10:05 bis 12:10 Uhr: 55 min + 70 min = 125 min.'],
    ['Lange Zeitspannen: erst bis zur vollen Stunde, dann die vollen Stunden, dann den Rest.', 'In Sekunden: Stunden · 3600 + Minuten · 60 + Sekunden.'],
    ['Kommastunden in Minuten: Kommateil · 60. 0,25 h = 15 min, 0,5 h = 30 min.', 'Über Mitternacht: erst bis 24:00 Uhr, dann weiter.'],
    ['Mehrere Etappen: alle Zeiten in Minuten umrechnen und addieren.', '1 Tag = 86.400 s.'],
  ] },
  geo: { k: 'Umfang = Länge des Randes. Fläche = wie viel Platz innen ist (in cm², m²).', l: [
    ['Umfang Rechteck = 2 · (Länge + Breite).', 'Umfang Quadrat = 4 · Seite.'],
    ['Fläche Rechteck = Länge · Breite.', 'Fläche Quadrat = Seite · Seite.'],
    ['Im Dreieck sind alle Winkel zusammen 180°. Nebenwinkel ergeben 180°.', 'Seite aus Fläche: Länge = Fläche : Breite.'],
    ['Im Viereck sind alle Winkel zusammen 360°.', 'Fläche Dreieck = Grundseite · Höhe : 2. Oberfläche Würfel = 6 · Seite · Seite.', 'Volumen Quader = Länge · Breite · Höhe.'],
    ['Pythagoras: a² + b² = c² (c ist die längste Seite, die Hypotenuse).', 'Innenwinkel im n-Eck: (n − 2) · 180°.', 'Fläche Trapez = (a + c) : 2 · h. Volumen Würfel = Kante³.'],
    ['Prisma: Volumen = Grundfläche · Länge.', 'L-Formen: in Rechtecke zerlegen oder ein Stück vom großen Rechteck abziehen.'],
  ] },
  folge: { k: 'Bei Zahlenfolgen suchst du die Regel: Schau dir an, wie man von einer Zahl zur nächsten kommt.', l: [
    ['Rechne die Abstände aus: Kommt immer dasselbe dazu oder weg?'],
    ['Große Abstände oder mal 2: Prüfe auch, ob sich die Zahlen verdoppeln.'],
    ['Abwechselnde Regeln: zwei verschiedene Schritte im Wechsel.', 'Wachsende Abstände: + 1, + 2, + 3, …'],
    ['Quadratzahlen: 1, 4, 9, 16, 25 …', 'Fibonacci: Jede Zahl ist die Summe der beiden davor.'],
    ['Auch die Abstände können eine Regel haben: + 6, + 12, + 18 …', 'Folgen können ins Negative gehen.'],
    ['Kubikzahlen: 1, 8, 27, 64, 125 …', 'Abstände, die sich verdoppeln, oder mal (−3): Dann wechseln sich die Vorzeichen ab.'],
  ] },
  dreisatz: { k: 'Dreisatz: erst auf 1 zurückrechnen, dann auf die gesuchte Menge.', l: [
    ['Proportional: doppelt so viel kostet doppelt so viel.', 'Beispiel 2 Hefte 16 € → 1 Heft 8 € → 4 Hefte 32 €.'],
    ['Erst ausrechnen, wie weit man mit 1 Liter kommt.', 'Dann mit der neuen Menge malnehmen.'],
    ['Antiproportional: mehr Pumpen – weniger Zeit.', 'Beispiel 4 Pumpen 12 h → 1 Pumpe 48 h → 12 Pumpen 4 h.'],
    ['Wie proportional, nur mit Kommazahlen: erst der Preis für 1 kg.'],
    ['Vorrat in „Pferdetagen“ rechnen: Tiere · Tage.', 'Rest des Vorrats durch die neue Anzahl teilen.'],
    ['Zusammengesetzt: mehrere Dreisätze nacheinander, immer eine Größe auf 1 zurückrechnen.'],
  ] },
  zins: { k: 'Zinsen sind wie Prozente: Kapital = Grundwert, Zinssatz = Prozentsatz, Zinsen = Prozentwert.', l: [
    ['Jahreszinsen = Kapital · p : 100.', 'Beispiel 800 € bei 5 %: 800 · 5 : 100 = 40 €.'],
    ['Zinssatz p = Zinsen · 100 : Kapital.'],
    ['Kapital = Zinsen · 100 : p.'],
    ['Zinsen für Monate: erst die Jahreszinsen, dann · Monate : 12.'],
    ['Zinseszins: Die Zinsen bleiben auf dem Konto und werden mitverzinst.', 'Bei 5 % jedes Jahr mal 1,05 rechnen.'],
    ['Tageszinsen: Jahreszinsen · Tage : 360 (1 Jahr = 360 Zinstage).', 'Über 3 Jahre: dreimal hintereinander verzinsen.'],
  ] },
  wahr: { k: 'Wahrscheinlichkeit = günstige Ergebnisse : alle möglichen Ergebnisse.', l: [
    ['Ein Würfel hat 6 Seiten, eine Münze 2.', 'Beispiel gerade Zahl beim Würfel: 2, 4, 6 → 3/6 = 1/2.'],
    ['Alle Kugeln zählen (Nenner), die günstigen Kugeln zählen (Zähler).'],
    ['Gegenereignis: 1 − Wahrscheinlichkeit.', 'Bruch in Prozent: Zähler : Nenner, dann mal 100.', 'Erwartung: Anzahl der Versuche · Wahrscheinlichkeit.'],
    ['Mit Zurücklegen: Die Wahrscheinlichkeiten bleiben gleich.', 'Pfadregel: Wahrscheinlichkeiten entlang des Pfads malnehmen.'],
    ['Ohne Zurücklegen: Nach jedem Zug ist eine Kugel weniger in der Urne.', 'Mindestens einmal = 1 − nie.'],
    ['Genau einmal: alle passenden Pfade ausrechnen und addieren.', 'Bei drei Zügen: drei Brüche entlang des Pfads malnehmen.'],
  ] },
  stat: { k: 'Statistik beschreibt viele Werte mit einer Zahl.', l: [
    ['Mittelwert = Summe aller Werte : Anzahl der Werte.'],
    ['Median: die Werte der Größe nach ordnen, der mittlere Wert ist der Median.'],
    ['Spannweite = größter Wert − kleinster Wert.'],
    ['Gerade Anzahl: Median = Mittelwert der beiden mittleren Werte.'],
    ['Fehlender Wert: Summe aller = Anzahl · Durchschnitt, dann die bekannten Werte abziehen.'],
    ['Gewichteter Durchschnitt: jede Gruppe Anzahl · Durchschnitt, alles addieren, durch die Gesamtanzahl teilen.'],
  ] },
  kreis: { k: 'π (Pi) ≈ 3,14. Der Durchmesser d ist doppelt so lang wie der Radius r: d = 2 · r.', l: [
    ['Umfang = π · d.'],
    ['Umfang = 2 · π · r.'],
    ['Fläche = π · r². Erst r² ausrechnen, dann mal 3,14.'],
    ['Aus dem Durchmesser erst den Radius: r = d : 2. Dann Fläche = π · r².'],
    ['Volumen Zylinder = π · r² · h (Grundfläche mal Höhe).'],
    ['Kreisring: π · (R² − r²).', 'Oberfläche Zylinder: 2 · π · r² + 2 · π · r · h.', 'Rand des Halbkreises: π · d : 2 + d.'],
  ] },
  word: { k: 'So gehst du vor: 1. Genau lesen. 2. Was ist gefragt? 3. Rechnung aufschreiben. 4. Antwort mit Einheit.', l: [
    ['Signalwörter: „mehr“, „dazu“, „zusammen“ → plus. „weniger“, „übrig“ → minus.'],
    ['„je“, „pro“, „jeweils“ → mal. „verteilen“, „gleich viel“ → geteilt.'],
    ['Erst die passende Einheit wählen, dann rechnen.', 'Bruchteile: erst durch den Nenner, dann mal den Zähler.'],
    ['Prozent und Dreisatz: erst auf 1 % oder 1 Stück zurückrechnen.', 'Tempo: Strecke = Geschwindigkeit · Zeit.'],
    ['Mehrere Schritte: Zwischenergebnisse aufschreiben.', 'Am Ende prüfen: Ist das Ergebnis sinnvoll?'],
    ['Lange Aufgaben in kleine Fragen zerlegen und nacheinander lösen.'],
  ] },
};

// Thema für die Theorie: bei „Alles gemischt“ das Thema der Aufgabe
// Querverweise zu den anderen Lern-Apps (abgestimmt in der Wochenrunde 18.11.): nur freie Inhalte, keine Kaufseiten
const THEO_LINKS = {
  lgs: [['📘', 'Ausführlich üben im Mathe-Trainer', 'trainer', '#/u/k8-lgs'], ['📈', 'Als Schnittpunkt zweier Geraden sehen in KurvenFlug', 'kurvenflug', '#kapitel=rendezvous']],
};
const theoLinkUrl = (app, hash) => `https://${app}${typeof KOPPLUNG === 'object' && KOPPLUNG.stufe() === 'test' ? '-test' : ''}.mathenachhilfe-online.com/?src=rechenblitz-theorie${hash}`;
const theoTopic = (tp) => THEORIE[tp] ? tp : null;
function theoExample(tp, lvl, avoid) {
  for (let i = 0; i < 12; i++) { const t = makeTask(tp, lvl); if (!avoid || taskText(t) !== avoid) return t; }
  return makeTask(tp, lvl);
}

PANELS.theorie = (o = {}) => {
  const tp = theoTopic(o.topic);
  if (!tp) {   // Übersicht: alle Themen
    const tps = Object.keys(THEORIE).filter(k => TOPICS[k]);
    return { title: '<span>📖</span> <span>Theorie</span>', html: `<p class="small muted">Zu jedem Thema die Regeln – mit einem Beispiel und dem Lösungsweg.</p>
      <div class="theo-grid">${tps.map(k => `<button class="theo-tp" data-tp="${k}"><span class="g">${esc(TOPICS[k].g)}</span><span>${esc(TOPICS[k].name)}</span></button>`).join('')}</div>`,
      init() { $('sheetBody').querySelectorAll('[data-tp]').forEach(b => b.onclick = () => showPanel('theorie', { topic: b.dataset.tp, lvl: Math.min(4, curLvlFor(b.dataset.tp)) }, true)); } };
  }
  const T = theoText(tp), lvl = Math.max(0, Math.min(5, o.lvl ?? 0)), inGame = !!o.game;
  const ex = theoExample(tp, lvl, o.avoid);
  const name = esc(TOPICS[tp].name);
  return { title: `<span>📖</span> <span>${name}</span>`, html: `<div class="theo">
    <p class="theo-k" translate="no">${esc(T.k)}</p>
    <div class="theo-lv" role="group" aria-label="Stufe">${[0, 1, 2, 3, 4, 5].map(i => `<button class="${i === lvl ? 'sel' : ''}" data-l="${i}" aria-pressed="${i === lvl}">${i === 5 ? 'Profi' : i + 1}</button>`).join('')}</div>
    <h3 class="theo-h">${esc(LEVEL_DESC[tp][lvl])}</h3>
    <ul class="theo-r" translate="no">${T.l[lvl].map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    ${Voice.available() ? '<button class="btn block theo-say" id="theoSay">🔊 Vorlesen</button>' : ''}
    <div class="theo-ex"><div class="theo-exh"><b>Beispiel</b><button class="linkbtn" id="theoNew">🔄 Anderes Beispiel</button></div>
      <div class="theo-task"><span class="expr theo-expr${ex.story ? ' storymode' : ''}">${ex.e.map(tokHtml).join('')}${ex.noEq ? '' : `<span class="eq">${esc(ex.eqSign || '=')}</span>`}</span>${ex.noEq ? ' <span class="theo-arr">→</span>' : ''} <b class="theo-ans">${ex.pre ? `<span>${esc(ex.pre)}</span> ` : ''}<span>${esc(showAns(ex.a))}</span>${ex.unit ? ` <span>${esc(ex.unit)}</span>` : ''}</b></div>
      ${(ex.w || []).length ? `<ol class="steps">${ex.w.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</div>
    ${(THEO_LINKS[tp] || []).length ? `<div class="theo-links">${THEO_LINKS[tp].map(([ic, t, app, h]) => `<a class="theo-link" href="${esc(theoLinkUrl(app, h))}" target="_blank" rel="noopener"><span>${ic}</span><span>${esc(t)}</span><span>↗</span></a>`).join('')}</div>` : ''}
    ${inGame ? '<button class="btn primary block" id="theoBack">Zurück zur Aufgabe</button>' : '<button class="btn primary block" id="theoGo">▶ Jetzt üben</button>'}
  </div>`, init() {
    const re = l => { const no = { ...o, lvl: l }; const top = Sheet.stack[Sheet.stack.length - 1]; if (top) top[1] = no; showPanel('theorie', no, false); };
    $('sheetBody').querySelectorAll('[data-l]').forEach(b => b.onclick = () => re(+b.dataset.l));
    $('theoNew').onclick = () => re(lvl);
    if ($('theoSay')) $('theoSay').onclick = () => {   // liest Kernsatz, Regeln und Beispiel mit Lösungsweg – auch wenn das Vorlesen sonst aus ist
      const L = I18N.lang, parts = [T.k, ...T.l[lvl]].map(x => mathSpeak(x, L));
      const q = L === 'de' ? (ex.story ? mathSpeak(ex.e[0].v, L) : taskSpeech(ex)) : mathSpeak(ex.story ? tr(ex.e[0].v) : i18nSpeech(ex), L);
      const ans = mathSpeak($('sheetBody').querySelector('.theo-ans').textContent, L), steps = [...$('sheetBody').querySelectorAll('.theo-ex .steps li')].map(li => mathSpeak(li.textContent, L));
      Voice.speakParts([...parts, joinSay([`${q} ${ex.noEq ? '' : mathSpeak('=', L)} ${ans}`, ...steps])], { force: true });   // Regeln einzeln (vorab vertont), Beispiel mit Zufallszahlen danach
    };
    if ($('theoBack')) $('theoBack').onclick = () => closeSheet();
    if ($('theoGo')) $('theoGo').onclick = () => { closeSheet(); S.sel = { op: tp, lvl: lvl === 5 && !hasPro() ? 4 : lvl }; save(); renderHome(); startGame('training'); };
  } };
};
// Stufe, die das Kind in diesem Thema gerade übt (für den Einstieg in die Theorie)
function curLvlFor(tp) { try { return currentLevel(tp); } catch (e) { return 0; } }
// Aus der laufenden Übung: Theorie genau zur aktuellen Aufgabe
function openTheorie(t) { if (!t || !theoTopic(t.topic)) return openSheet('theorie'); openSheet('theorie', { topic: t.topic, lvl: t.lvl ?? 0, game: true, avoid: taskText(t) }); }
