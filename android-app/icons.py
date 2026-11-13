# Erzeugt App-Symbol und Startbildschirm der APK aus den Symbolen der Web-App (../kopfrechnen/icons).
# Aufruf: python3 icons.py   (nur nötig, wenn sich die Symbole ändern)
from PIL import Image
import os
R = 'android/app/src/main/res'
mask = Image.open('../kopfrechnen/icons/icon-maskable-512.png').convert('RGBA')
icon = Image.open('../kopfrechnen/icons/icon-512.png').convert('RGBA')
bg = mask.getpixel((4, 4))
hexbg = '#%02X%02X%02X' % bg[:3]
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
def circle(im):
    m = Image.new('L', im.size, 0); from PIL import ImageDraw; ImageDraw.Draw(m).ellipse((0, 0, im.size[0] - 1, im.size[1] - 1), fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out
for d, f in dens.items():
    s = round(48 * f); fg = round(108 * f)
    icon.resize((s, s), Image.LANCZOS).save(f'{R}/mipmap-{d}/ic_launcher.png')
    circle(mask.resize((s, s), Image.LANCZOS)).save(f'{R}/mipmap-{d}/ic_launcher_round.png')
    # Vordergrund für adaptive Symbole: maskierbares Symbol randlos (Logo liegt im sicheren Bereich)
    mask.resize((fg, fg), Image.LANCZOS).save(f'{R}/mipmap-{d}/ic_launcher_foreground.png')
open(f'{R}/values/ic_launcher_background.xml', 'w').write(f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{hexbg}</color>\n</resources>\n')
# Startbildschirm: heller App-Hintergrund mit Symbol in der Mitte
for root, _, files in os.walk(R):
    for fn in files:
        if fn == 'splash.png':
            p = os.path.join(root, fn); w, h = Image.open(p).size
            sp = Image.new('RGB', (w, h), (0xf7, 0xf9, 0xfd)); k = round(min(w, h) * 0.28)
            sp.paste(icon.resize((k, k), Image.LANCZOS), ((w - k) // 2, (h - k) // 2), icon.resize((k, k), Image.LANCZOS))
            sp.save(p)
print('Hintergrund', hexbg)
