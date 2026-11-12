"""Baut eine einzelne HTML-Datei mit eingebetteten Figuren (für Hosting ohne .glb-Unterstützung)."""
import base64, glob, os, sys
src = open('index.html', encoding='utf-8').read()
frag = src.split('<!--FRAGMENT-START-->')[1].split('<!--FRAGMENT-END-->')[0]
data = {os.path.basename(f)[:-4]: 'data:model/gltf-binary;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
        for f in sorted(glob.glob('assets/models/*.glb'))}
js = '<script>window.MODEL_DATA={' + ','.join(f'"{k}":"{v}"' for k, v in data.items()) + '};</script>\n'
frag = frag.replace('<script src="https://cdn.jsdelivr.net/npm/three@', js + '<script src="https://cdn.jsdelivr.net/npm/three@', 1)
out = sys.argv[1] if len(sys.argv) > 1 else 'nachhilfe-online-einzeldatei.html'
open(out, 'w', encoding='utf-8').write(frag.strip() + '\n')
print(out, len(frag) // 1024, 'KB')
