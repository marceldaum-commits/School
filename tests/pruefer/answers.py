# Unabhängige Prüfung jeder Lösung: Aufgabe aus den Bausteinen selbst lösen und mit der hinterlegten Lösung vergleichen
import json, re, sys, collections, math
from fractions import Fraction as F
sys.path.insert(0, '/tmp/claude-0/-home-user/f715e653-a171-56e1-b20f-9cef6d29641b/scratchpad/kp')
from stories import solve_story, val
SUPD = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'}
def sup(s): return int(''.join(SUPD[c] for c in s))
def tokval(k):
    t = k['t']
    if t == 'n': return F(k['v'])
    if t == 'd': return F(k['i'], 10 ** k['k'])
    if t == 'm': return F(k['c'], 100)
    if t == 'f': return F(k['n'], k['d'])
    if t == 'p': return F(k['b']) ** k['e']
    if t == 'r': r = math.isqrt(int(k['v'])); assert r * r == k['v'], 'Wurzel nicht ganz'; return F(r)
    return None
OPS = {'+': '+', '−': '-', '·': '*', ':': '/'}
def expr_of(toks, x=None, gap=None):
    out = []
    for k in toks:
        t = k['t']
        if t == 'o': out.append(OPS[k['v']])
        elif t == 'k': out.append(k['v'])
        elif t == 'g': out.append(f'({gap!r})' if not isinstance(gap, F) else f'F({gap.numerator},{gap.denominator})')
        elif t == 'v': out.append(f'(F({k["c"]})*x)')
        else:
            v = tokval(k)
            if v is None: raise ValueError('Baustein ' + t)
            out.append(f'F({v.numerator},{v.denominator})')
    ex = ' '.join(out); ex = re.sub(r'(\)|\d\))\s*\(', r'\1*(', ex)   # 3 (x + 6) → 3*(x + 6)
    return eval(ex, {'F': F, 'x': x})
def split_eq(toks):
    i = next(i for i, k in enumerate(toks) if k['t'] == 'q'); return toks[:i], toks[i + 1:]
def rnd_half(x, m): return F(math.floor(x / m + F(1, 2))) * m
UNIT = {'mm': F(1, 1000), 'cm': F(1, 100), 'dm': F(1, 10), 'm': 1, 'km': 1000, 'mm²': F(1, 10**6), 'cm²': F(1, 10**4), 'dm²': F(1, 100), 'm²': 1, 'a': 100, 'ha': 10**4, 'km²': 10**6,
  'cm³': F(1, 1000), 'ml': F(1, 1000), 'dm³': 1, 'l': 1, 'm³': 1000, 'g': F(1, 1000), 'kg': 1, 't': 1000, 's': 1, 'min': 60, 'h': 3600, 'Tage': 86400, '€': 1, 'ct': F(1, 100),
  'km/h': F(1000, 3600), 'm/s': 1}
def poly_eval(s, x):
    s = s.replace('−', '-').replace('·', '*')
    s = re.sub(r'(\d)\s*x', r'\1*x', s); s = re.sub(r'\)\s*\(', ')*(', s); s = re.sub(r'(\d)\s*\(', r'\1*(', s)
    s = s.replace('x²', 'x**2').replace('x³', 'x**3').replace(')²', ')**2')
    s = re.sub(r'(\d+)', r'F(\1)', s)
    return eval(s, {'F': F, 'x': x})
def lgs_side(s):
    # lineare Seite in x und y → (Faktor x, Faktor y, Zahl), unabhängig von der App ausgewertet
    s = s.replace('−', '-').replace('·', '*')
    s = re.sub(r'(\d)\s*([xy])', r'\1*\2', s)
    s = re.sub(r'(\d+)', r'F(\1)', s)
    f = lambda x, y: eval(s, {'F': F, 'x': x, 'y': y})
    c = f(F(0), F(0)); return f(F(1), F(0)) - c, f(F(0), F(1)) - c, c
def lgs_solve(lines):
    rows = []
    for ln in lines:
        body = ln.split(': ', 1)[1]; L, R = body.split(' = ')
        lx, ly, lc = lgs_side(L); rx, ry, rc = lgs_side(R)
        rows.append((lx - rx, ly - ry, rc - lc))          # a·x + b·y = c
    (a1, b1, c1), (a2, b2, c2) = rows
    det = a1 * b2 - a2 * b1
    assert det != 0, 'keine eindeutige Lösung'
    return (c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det   # Cramersche Regel
def quad_solve(txt, which):
    # a·x² + b·x + c = 0 aus der Gleichung im Aufgabentext herleiten (Werte bei x = 0, 1, −1), Lösungen mit der Lösungsformel, exakt
    L, R = txt.split(' = ')
    f = lambda x: poly_eval(L, x) - poly_eval(R, x)
    c = f(F(0)); a = (f(F(1)) + f(F(-1))) / 2 - c; b = (f(F(1)) - f(F(-1))) / 2
    assert a != 0, 'keine quadratische Gleichung'
    d = b * b - 4 * a * c; n, m = math.isqrt(d.numerator), math.isqrt(d.denominator)
    assert d >= 0 and n * n == d.numerator and m * m == d.denominator, 'Diskriminante kein Quadrat'
    r = F(n, m); x1, x2 = (-b - r) / (2 * a), (-b + r) / (2 * a)
    assert x1.denominator == 1 and x2.denominator == 1 and x1 != x2, 'Lösungen nicht ganz oder gleich'
    if which == '(x > 0)':
        pos = [x for x in (x1, x2) if x > 0]; assert len(pos) == 1, 'nicht genau eine positive Lösung'; return pos[0]
    return x2 if which == '(größere Lösung)' else x1
def solve(t):
    tp, l, e, txt = t['tp'], t['l'], t['e'], t['text']
    a = F(t['a']['n'], t['a']['d'])
    if any(k['t'] == 't' for k in e):
        r, ok = solve_story(txt)
        if not ok: return None, 'Vorlage ohne Löser'
        return r, ''
    has = lambda typ: any(k['t'] == typ for k in e)
    xs = [k['v'] for k in e if k['t'] in 'xs']
    if tp in ('add', 'sub', 'mul', 'div', 'frac', 'dec', 'neg', 'pow', 'order') and not has('x') and not has('s') and not has('g') and not has('u'):
        return expr_of(e), ''
    if tp == 'pow' and has('s'):
        m = re.fullmatch(r'√\((\d+)² \+ (\d+)²\)', xs[0]); x2 = int(m.group(1)) ** 2 + int(m.group(2)) ** 2; r = math.isqrt(x2); assert r * r == x2; return F(r), ''
    if tp == 'divis' and has('g'):
        n = [k['v'] for k in e if k['t'] == 'n']; A, B, Qt = n; return (F(A - B * Qt) if 0 <= A - B * Qt < B else None), 'Rest'
    if tp == 'frac' and has('x'):
        s = xs[0]; fs = [k for k in e if k['t'] == 'f']
        if s == 'Kürze': f = F(fs[0]['n'], fs[0]['d']); return f, 'Kürzen'
        if s == 'von': n = [k['v'] for k in e if k['t'] == 'n']; return F(fs[0]['n'], fs[0]['d']) * n[0], ''
    if has('g') and has('q'):   # Lücke: hinterlegte Lösung einsetzen
        L, R = split_eq(e); return (a if expr_of(L, gap=a) == expr_of(R, gap=a) else None), 'Lücke'
    if tp == 'quad':
        return quad_solve(xs[0], xs[1]), 'quad'
    if tp == 'lgs':
        sy = next(k for k in e if k['t'] == 'y'); x, y = lgs_solve(sy['v'])
        assert x.denominator == 1 and y.denominator == 1, 'Lösung nicht ganzzahlig'
        return (x if t['pre'] == 'x =' else y), 'LGS'
    if tp == 'eq':
        L, R = split_eq(e); return (a if expr_of(L, x=a) == expr_of(R, x=a) else None), 'Gleichung'
    if tp == 'divis':
        if has('g'):   # a : b = q Rest ?
            n = [k['v'] for k in e if k['t'] == 'n']; A, B, Qt = n; return F(A - B * Qt) if 0 <= A - B * Qt < B else None, ''
        s = xs[0]; n = [k['v'] for k in e if k['t'] == 'n']
        if s.startswith('ggT('): v = list(map(int, re.findall(r'\d+', s))); return F(math.gcd(*v)), ''
        if s.startswith('kgV('): v = list(map(int, re.findall(r'\d+', s))); return F(math.lcm(*v)), ''
        if s == 'Quersumme von': return F(sum(map(int, str(n[0])))), ''
        if s == 'Anzahl der Teiler von': return F(sum(1 for d in range(1, n[0] + 1) if n[0] % d == 0)), ''
        if s in ('größter Primfaktor von', 'kleinster Primfaktor von'):
            N0, ps, p = n[0], [], 2
            while N0 > 1:
                while N0 % p == 0: ps.append(p); N0 //= p
                p += 1
            return F(max(ps) if s.startswith('größter') else min(ps)), ''
    if tp == 'round':
        nums = [tokval(k) for k in e if k['t'] in 'nd']
        if xs[0] == 'Runde':
            m = {'auf Zehner': 10, 'auf Hunderter': 100, 'auf Tausender': 1000, 'auf Zehntel': F(1, 10), 'auf Hundertstel': F(1, 100)}[xs[1]]
            return rnd_half(nums[0], m), ''
        h = t['hint']; o = next(k['v'] for k in e if k['t'] == 'o')
        ms = {'Runde beide Zahlen auf Hunderter': (100, 100), 'Runde beide Zahlen auf Zehner': (10, 10), 'Runde die erste Zahl auf Hunderter, die zweite auf Zehner': (100, 10), 'Runde die erste Zahl auf Tausender, die zweite auf Hunderter': (1000, 100)}[h]
        x, y = rnd_half(nums[0], ms[0]), rnd_half(nums[1], ms[1])
        return {'+': x + y, '−': x - y, '·': x * y}[o], ''
    if tp == 'unit':
        tot, i = F(0), 0; sign = 1; dim = None
        while i < len(e):
            k = e[i]
            if k['t'] in 'nd': v = tokval(k); u = e[i + 1]['v']; tot += sign * v * UNIT[u]; i += 2; continue
            if k['t'] == 'o': sign = 1 if k['v'] == '+' else -1
            i += 1
        return tot / UNIT[t['unit']], ''
    if tp == 'pct':
        nums = [tokval(k) for k in e if k['t'] == 'n']; s = ' '.join(xs)
        if s == '% von': return nums[0] * nums[1] / 100, ''
        if s == 'von': return nums[0] / nums[1] * 100, ''
        if s == '% sind': return nums[1] * 100 / nums[0], ''
        if has('u'): o = next(k['v'] for k in e if k['t'] == 'o'); return nums[0] * (1 + (1 if o == '+' else -1) * nums[1] / 100), ''
    if tp == 'doppel':
        v = next(tokval(k) for k in e if k['t'] in 'nd')
        return {'das Doppelte von': 2 * v, 'die Hälfte von': v / 2, 'das Vierfache von': 4 * v, 'ein Viertel von': v / 4, 'dreimal verdoppeln:': 8 * v, 'dreimal halbieren:': v / 8, 'ein Achtel von': v / 8}[xs[0]], ''
    if tp == 'geld':
        if has('o'):
            vals = []; sign = 1; ops = []
            for k in e:
                if k['t'] in 'nm':
                    v = tokval(k)
                    vals.append(v)
                elif k['t'] == 'u' and vals and k['v'] == 'ct': vals[-1] = vals[-1] / 100
                elif k['t'] == 'o': ops.append(k['v'])
            if ops == ['·']: r = vals[0] * vals[1]
            else:
                r = vals[0]
                for o, v in zip(ops, vals[1:]): r = r + v if o == '+' else r - v
            return r * (100 if t['unit'] == 'ct' else 1), ''
        nums = [k for k in e if k['t'] == 'n']
        if len(nums) == 2: return F(nums[0]['v']) * 100 + nums[1]['v'], ''   # 3 € 40 ct → ct
        if len(nums) == 1 and t['unit'] == '€': return F(nums[0]['v'], 100), ''
    if tp == 'zehner':
        if xs:
            s = xs[0]
            m = re.fullmatch(r'(.+) = ([\d,]+) · 10ˣ', s)
            if m:
                lhs, mant = m.group(1), F(m.group(2).replace(',', '.'))
                def num(z):
                    z = z.strip(); mm = re.fullmatch(r'\(([\d,]+) · 10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)', z)
                    if mm: return F(mm.group(1).replace(',', '.')) * F(10) ** sup(mm.group(2))
                    return F(z.replace('.', '').replace(',', '.'))
                if ' : ' in lhs: p, q = lhs.split(' : '); v = num(p) / num(q)
                elif ' · ' in lhs and lhs.count('(') != 1: parts = re.split(r'\s·\s(?![^()]*\))', lhs); v = F(1); [v := v * num(z) for z in parts]
                else: v = num(lhs)
                x = round(math.log10(v / mant)); return (F(x) if mant * F(10) ** x == v else None), ''
        return expr_of(e), ''
    if tp == 'linear':
        s = xs[0]
        def line(z):
            m = re.fullmatch(r'[fg]\(x\) = (−?\d*)x(?: ([+−]) (\d+))?', z.strip())
            mm = m.group(1); mm = -1 if mm == '−' else 1 if mm == '' else int(mm.replace('−', '-'))
            b = 0 if not m.group(2) else (int(m.group(3)) if m.group(2) == '+' else -int(m.group(3)))
            return F(mm), F(b)
        if s.startswith('P('):
            (x1, y1), (x2, y2) = [tuple(F(v.replace('−', '-')) for v in p) for p in re.findall(r'\((−?\d+)\|(−?\d+)\)', s)]
            m = (y2 - y1) / (x2 - x1); b = y1 - m * x1
            return {'m =': m, 'x =': -b / m}[t['pre']], ''
        if ';' in s:
            (m1, b1), (m2, b2) = [line(z) for z in s.split(';')]; x = (b2 - b1) / (m1 - m2)
            return {'x =': x, 'y =': m1 * x + b1}[t['pre']], ''
        m, b = line(s)
        if len(xs) > 1: x0 = F(re.search(r'f\((−?\d+)\)', xs[1]).group(1).replace('−', '-')); return m * x0 + b, ''
        return {'y =': b, 'x =': -b / m}[t['pre']], ''
    if tp == 'term':
        s = ' '.join(z for z in xs)
        mv = re.search(r'\(x = (−?\d+)\)', s)
        if mv: x = F(mv.group(1).replace('−', '-')); return poly_eval(xs[0], x), ''
        if s.endswith('='): return sum((-1 if sg == '−' else 1) * F(c or '1') for sg, c in re.findall(r'(?:^|([+−])\s*)(\d*)x', xs[0].replace(' =', ''))), ''
        # Ausmultiplizieren / Binome: links = rechts für alle x, mit Lösung eingesetzt
        full = ''.join(('(' + str(a) + ')' if k['t'] == 'g' else ' ' + k['v'] + ' ') for k in e)
        L, R = full.split(' = ') if ' = ' in full else full.split('=')
        if not R.strip().endswith(('+', '−')) and '?' not in R: pass
        R2 = R.strip()
        if R2.endswith(('+', '−')): R2 = R2 + ' (' + str(a) + ')'
        ok = all(poly_eval(L, F(x)) == poly_eval(R2.replace('(' + str(a) + ') x', '(' + str(a) + ')*x').replace(') x', ')*x'), F(x)) for x in (0, 1, 2, 3, -2))
        return (a if ok else None), 'Identität'
    if tp == 'stat':
        lst = [F(v) for v in re.findall(r'\d+', xs[1])]; s = xs[0]; ls = sorted(lst); n = len(ls)
        if s == 'Mittelwert von': return sum(lst) / n, ''
        if s == 'Spannweite von': return ls[-1] - ls[0], ''
        if s == 'Median von': return ls[n // 2] if n % 2 else (ls[n // 2 - 1] + ls[n // 2]) / 2, ''
    if tp == 'folge':
        s = xs[0]; parts = [p.strip() for p in s.split(',')]
        nums = [None if p == '?' else F(p.replace('.', '').replace('−', '-')) for p in parts]
        gi = nums.index(None); known = [v for v in nums if v is not None]
        cands = []
        def fits(seq):
            return all(seq[i] == nums[i] for i in range(len(nums)) if nums[i] is not None)
        n = len(nums); idx = [i for i in range(n) if nums[i] is not None]
        # arithmetisch
        if len(idx) >= 2:
            i0, i1 = idx[0], idx[1]; d = (nums[i1] - nums[i0]) / (i1 - i0); seq = [nums[i0] + (i - i0) * d for i in range(n)]
            if fits(seq): cands.append(seq[gi])
        k = known
        if len(k) >= 3 and gi == n - 1:
            if k[0] != 0 and k[1] != 0 and k[1] / k[0] == k[2] / k[1]: q = k[1] / k[0]; seq = [k[0] * q ** i for i in range(n)]; cands.append(seq[gi]) if fits(seq) else None
            # a(n+1) = p·a(n) + q
            if k[1] != k[0]:
                p = (k[2] - k[1]) / (k[1] - k[0]); qq = k[1] - p * k[0]; seq = [k[0]]
                for i in range(n - 1): seq.append(p * seq[-1] + qq)
                if fits(seq): cands.append(seq[gi])
            # Fibonacci
            seq = k[:2]
            while len(seq) < n: seq.append(seq[-1] + seq[-2])
            if fits(seq): cands.append(seq[gi])
            # zweite Differenzen konstant
            d1 = [k[i + 1] - k[i] for i in range(len(k) - 1)]; d2 = [d1[i + 1] - d1[i] for i in range(len(d1) - 1)]
            if len(set(d2)) == 1: cands.append(k[-1] + d1[-1] + d2[0])
            # Differenzen verdoppeln sich
            if len(d1) >= 2 and d1[0] != 0 and all(d1[i + 1] == 2 * d1[i] for i in range(len(d1) - 1)): cands.append(k[-1] + 2 * d1[-1])
            # abwechselnd +a −b
            if len(d1) >= 3 and all(d1[i] == d1[i % 2] for i in range(len(d1))): cands.append(k[-1] + d1[len(d1) % 2])
            # Kubikzahlen / Quadratzahlen
            for pw in (2, 3):
                if k[0] < 0: continue
                r = round(float(k[0]) ** (1 / pw))
                if all(F(r + i) ** pw == k[i] for i in range(len(k))): cands.append(F(r + len(k)) ** pw)
        return (a if a in cands else (cands[0] if cands else None)), 'Folge'
    return None, 'kein Löser'
if __name__ == '__main__':
    T = json.load(open(sys.argv[1]))
    st = collections.Counter(); bad = []; nos = collections.Counter()
    for t in T:
        a = F(t['a']['n'], t['a']['d'])
        try: r, how = solve(t)
        except Exception as ex: r, how = None, 'Fehler: ' + repr(ex)[:80]
        if r is None: nos[(t['tp'], t['l'], how)] += 1; bad.append((t, how)); continue
        if t['a']['money']: r = F(round(r * 100), 100) if r * 100 != int(r * 100) else r
        st['geprüft'] += 1
        if r != a: bad.append((t, f'gelöst {r} ≠ hinterlegt {a}'))
    print(dict(st), len(T))
    print('ohne Ergebnis:', dict(nos))
    seen = collections.Counter()
    for t, why in bad:
        k = (t['tp'], t['l'], why.split(' ')[0]); seen[k] += 1
        if seen[k] <= 2: print(' ', t['tp'], t['l'], '|', why, '|', t['text'][:140], '→', t['canon'], t['unit'])
