# Erzeugt den Startbildschirm der APK aus dem Symbol der Web-App und verkleinert alle Symbol-Bilder.
# Aufruf: node symbol.js && python3 icons.py   (nur nötig, wenn sich das Symbol ändert)
from PIL import Image
import os
R = 'android/app/src/main/res'
icon = Image.open('../kopfrechnen/icons/icon-512.png').convert('RGBA')
# Launcher-Symbole (ic_launcher*, auch adaptiv: Hintergrund = Verlauf, Vordergrund = Blitz) erzeugt seit 17.11. symbol.js
# Startbildschirm: Dunkelblau der Marke mit hellem Logo in der Mitte (wie das Startbild der Web-App, kein weißes Aufblitzen)
for root, _, files in os.walk(R):
    for fn in files:
        if fn == 'splash.png':
            p = os.path.join(root, fn); w, h = Image.open(p).size
            sp = Image.new('RGB', (w, h), (0x10, 0x1b, 0x43)); k = round(min(w, h) * 0.42)
            k = round(min(w, h) * 0.3); m = icon.resize((k, k), Image.LANCZOS)   # abgerundetes App-Symbol
            sp.paste(m, ((w - k) // 2, (h - k) // 2), m)
            sp.save(p)
# Alle erzeugten PNGs verlustarm verkleinern (Palette), damit die APK klein bleibt
for root, _, files in os.walk(R):
    for fn in files:
        if fn.endswith('.png') and (fn.startswith('ic_launcher') or fn == 'splash.png'):
            p = os.path.join(root, fn); im = Image.open(p)
            im = im.convert('RGBA').quantize(256, method=Image.FASTOCTREE) if im.mode == 'RGBA' else im.convert('RGB').quantize(256)
            im.save(p, optimize=True)
print('fertig')
