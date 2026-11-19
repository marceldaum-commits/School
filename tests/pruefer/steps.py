# Unabhängiger Prüf-Rechner (Python, exakte Brüche): jede Gleichung in Aufgabentext und Lösungsweg nachrechnen.
import json, re, sys, collections
from fractions import Fraction as Fr
SUP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'}
UNITS = r'(?:€|ct|cm³|cm²|cm|mm|dm³|dm²|dm|km/h|km²|km|m/s|m³|m²|m|ml|l|kg|g|t|ha|a|h|min|s|°|%|Tage|Tag|Stunden|Stunde|Minuten|Jahre|Pferdetage|Arbeitstage|Personentage|Hundertstel|Zehntel|Teile|Liter|Punkte)'
def num(s):
    s = s.strip()
    s = re.sub(r'(?<=\d)\.(?=\d{3}(?!\d))', '', s)   # Tausenderpunkte
    s = s.replace(',', '.')
    return s
def to_expr(s):
    s = s.replace('−', '-').replace('·', '*').replace('×', '*')
    s = re.sub(r'(?<=[\d)\s]) : (?=[\d(\s√-])', ' / ', s)
    s = re.sub(r'(?<=\d)\.(?=\d{3}(?!\d))', '', s)
    s = re.sub(r'(\d),(\d)', r'\1.\2', s)
    s = re.sub(r'√\(([^)]*)\)', r'sqrt(\1)', s); s = re.sub(r'√([\d.]+)', r'sqrt(\1)', s)
    s = re.sub(r'([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)', lambda m: '**(' + ''.join(SUP[c] for c in m.group(1)) + ')', s)
    s = re.sub(r'(\d+(?:\.\d+)?)', r'F("\1")', s)
    return s
def sqrt(x):
    x = Fr(x); import math
    n, d = math.isqrt(x.numerator), math.isqrt(x.denominator)
    if n * n != x.numerator or d * d != x.denominator: raise ValueError('irr')
    return Fr(n, d)
ARITH = re.compile(r'^[\d\s.,+\-−·×:/()√⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+$')
FAC = {'mm': ('L', Fr(1, 1000)), 'cm': ('L', Fr(1, 100)), 'dm': ('L', Fr(1, 10)), 'm': ('L', 1), 'km': ('L', 1000),
  'mm²': ('A', Fr(1, 10**6)), 'cm²': ('A', Fr(1, 10**4)), 'dm²': ('A', Fr(1, 100)), 'm²': ('A', 1), 'a': ('A', 100), 'ha': ('A', 10**4), 'km²': ('A', 10**6),
  'cm³': ('V', Fr(1, 1000)), 'ml': ('V', Fr(1, 1000)), 'dm³': ('V', 1), 'l': ('V', 1), 'Liter': ('V', 1), 'm³': ('V', 1000),
  'g': ('M', Fr(1, 1000)), 'kg': ('M', 1), 't': ('M', 1000), 's': ('T', 1), 'min': ('T', 60), 'Minuten': ('T', 60), 'h': ('T', 3600), 'Stunden': ('T', 3600), 'Stunde': ('T', 3600),
  'Tag': ('T', 86400), 'Tage': ('T', 86400), 'ct': ('€', Fr(1, 100)), '€': ('€', 1), 'Hundertstel': ('N', Fr(1, 100)), 'Zehntel': ('N', Fr(1, 10)), '%': ('%', 1),
  'km/h': ('v', Fr(1000, 3600)), 'm/s': ('v', 1)}
UNIT_RE = re.compile(r'(?<![A-Za-zÄÖÜäöüß])(' + '|'.join(sorted(map(re.escape, FAC), key=len, reverse=True)) + r')(?![A-Za-zÄÖÜäöüß²³/])')
def ev(side):
    side = side.strip().rstrip('.!✓').strip()
    side = re.sub(r'(?<![\d,])(\d{1,2}):(\d{2})(?!\d)', lambda m: str(int(m.group(1)) * 60 + int(m.group(2))) + ' min', side)   # Uhrzeit → Minuten nach Mitternacht
    if re.fullmatch(r'[\d\s]+ min − [\d\s]+ min', side): a, b = re.findall(r'\d+', side); return ('U', 'T', (int(a) - int(b)) * 60)
    units = UNIT_RE.findall(side)
    if units:
        dims = {FAC[u][0] for u in units}
        if len(dims) != 1: return None
        # zusammengesetzte Größe „6 h 15 min“ oder „1 km 808 m“: Summe der Teile
        parts = re.findall(r'([\d.,]+)\s*(' + '|'.join(sorted(map(re.escape, FAC), key=len, reverse=True)) + r')(?![A-Za-zÄÖÜäöüß²³/])', side)
        rest = UNIT_RE.sub('', side)
        if len(parts) >= 2 and re.fullmatch(r'[\d.,\s]*', rest):
            return ('U', dims.pop(), sum(Fr(num(n)) * FAC[u][1] for n, u in parts))
        if len(units) == 1 and side.rstrip().endswith(units[0]):
            base = side.rstrip()[: -len(units[0])]
            v = ev(base)
            if v is None or v == 'ERR' or isinstance(v, tuple): return v
            return ('U', FAC[units[0]][0], v * FAC[units[0]][1], v)
        return None
    if not side or not ARITH.match(side) or not re.search(r'\d', side): return None
    try: return eval(to_expr(side), {'F': Fr, 'sqrt': sqrt})
    except Exception: return 'ERR'
def same(a, b):
    ua, ub = isinstance(a, tuple), isinstance(b, tuple)
    if ua and ub: return a[1] == b[1] and a[2] == b[2], True
    if ua != ub:
        u = a if ua else b; v = b if ua else a
        if u[1] == '%': return (u[2] / 100 == v) or (None if v > 1 else False), (v <= 1)     # 0,25 = 25 %; „1 % = 4“ ist eine Zuordnung (≙)
        if u[1] == 'N': return u[2] == v or u[3] == v, True   # 94 − 92 = 2 Zehntel bzw. 489 Hundertstel = 4,89
        if u[1] == '%' or u[3] is None: return None, False
        return (u[3] == v) or None, True                  # „280 : 10 = 28 Tage“: Zahlenwert vergleichen; sonst Umrechnung → gesondert
    return a == b, True
def clauses(line):
    line = line.replace('→', ',').replace(' und ', ', ').replace(';', ',')
    parts = re.split(r'(?<! ):\s', line)          # Doppelpunkt als Satzzeichen (nicht „ : “ für Geteilt)
    out = []
    for p in parts: out += re.split(r',\s+', p)
    return out
def check(T):
    stats = collections.Counter(); bad = []; global zu; zu = []
    for t in T:
        for line in [t['text']] + t['w']:
            for c in clauses(line):
                if '=' not in c or '≈' in c: continue
                sides = c.split('=')
                vals = [ev(s) for s in sides]
                for a, b, sa, sb in zip(vals, vals[1:], sides, sides[1:]):
                    if a is None or b is None: stats['übersprungen'] += 1; continue
                    if a == 'ERR' or b == 'ERR': stats['nicht lesbar'] += 1; bad.append((t['tp'], t['l'], 'nicht lesbar', c, line)); continue
                    eq, cmp = same(a, b)
                    if cmp and eq is None: stats['Umrechnung (Größe ↔ Zahl)'] += 1; zu.append((t['tp'], t['l'], c, line)); continue
                    if not cmp: stats['Zuordnung (Größe ↔ Zahl)'] += 1; zu.append((t['tp'], t['l'], c, line)); continue
                    stats['geprüft'] += 1
                    if not eq: bad.append((t['tp'], t['l'], f'{a} ≠ {b}', c, line))
    return stats, bad
if __name__ == '__main__':
    T = json.load(open(sys.argv[1]))
    stats, bad = check(T)
    print(dict(stats)); print(len(bad), 'Abweichungen')
    zc = collections.Counter(); ze = {}
    for z in zu:
        k = (z[0], re.sub(r'[\d.,]+', '#', z[2])); zc[k] += 1; ze[k] = z[2]
    print('--- Zuordnungen (Muster) ---')
    for k, n in zc.most_common(): print(f'  {n:5d} {k[0]:8s} {ze[k]}')
    seen = collections.Counter()
    for b in bad:
        k = (b[0], b[1], re.sub(r'\d+', '#', b[3]))
        seen[k] += 1
        if seen[k] == 1: print(' ', b[0], b[1], '|', b[2], '|', b[3], '||', b[4][:120])
