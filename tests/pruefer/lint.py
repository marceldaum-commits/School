# Schreibweisen-Prüfung aller erzeugten Texte (Aufgabe, Hinweis, Lösungsweg)
import json, re, sys, collections
T = json.load(open(sys.argv[1]))
RULES = [
 ('doppeltes Vorzeichen', r'[+−-]\s*[+−-]\s*\d(?!\))'), ('„+ −“', r'\+ −'), ('minus null', r'(?<![\d,])−0(?![,\d])'), ('„1x“ statt „x“', r'(?<![\d,.])1x\b'),
 ('„0x“', r'(?<![\d,])0x\b'), ('„+ 0“ am Ende', r'[+−] 0(?![\d,])'), ('Bruch /1', r'\d/1(?!\d)'), ('Doppel-Leerzeichen', r'\S  \S'),
 ('undefined/NaN', r'undefined|NaN|Infinity|null'), ('Dezimalpunkt', r'(?<![\d.])\d+\.\d{1,2}(?!\d)'), ('Leerzeichen vor Satzzeichen', r' [,.;!?](?!\d)'),
 ('Komma-Null am Ende (kein Geld)', r'\d,\d*0(?![\d ]*€)(?!\d)'), ('„1 Tage/Stunden/…“', r'(?<![\d,])1 (Tage|Stunden|Minuten|Sekunden|Jahre|Wochen|Liter|Kugeln)\b'),
 ('Klammer leer', r'\(\s*\)'), ('Hochzahl 1', r'(?<![\d,])\d+¹(?!\d)'), ('negativer Nenner', r'/−'), ('x hoch 1', r'x¹'),
]
cnt = collections.Counter(); ex = {}
for t in T:
    for where, s in [('Aufgabe', t['text']), ('Hinweis', t['hint'])] + [('Weg', w) for w in t['w']]:
        for name, rx in RULES:
            m = re.search(rx, s)
            if m:
                if name == 'Komma-Null am Ende (kein Geld)' and (t['a']['money'] or '€' in s or 'ct' in s): continue
                k = (name, t['tp'], t['l'], where); cnt[k] += 1; ex.setdefault(k, s)
for k, n in sorted(cnt.items()): print(f'{n:6d}', k, '|', ex[k][:150])
print(sum(cnt.values()), 'Funde')
