// Erzeugt kopfrechnen/stand.json: Version, Hüllen-Nummer und SHA-256 jeder Datei.
// Die Android-App lädt damit neue Inhalte selbst (GitHub, Ersatz: eigener Server) – ohne Neuinstallation.
// Aufruf im Repo-Stamm oder hier:  node android-app/stand.js          (schreibt die Datei)
//                                  node android-app/stand.js --check  (Fehler, wenn stand.json veraltet ist)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
// Zuerst das Auslieferungs-Bündel erzeugen (bzw. bei --check prüfen, ob es zu den Quellen passt)
const { build } = require('./bundle.js'), bundled = build(), rootDir = path.join(__dirname, '..', 'kopfrechnen');
for (const [f, txt] of Object.entries(bundled)) {
  const p = path.join(rootDir, f), cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (cur === txt) continue;
  if (process.argv.includes('--check')) { console.error(`kopfrechnen/${f} passt nicht zu den Quelldateien – bitte „node android-app/stand.js“ ausführen und mit committen.`); process.exit(1); }
  fs.writeFileSync(p, txt); console.log(`Bündel geschrieben: kopfrechnen/${f} (${Math.round(txt.length / 1024)} KB)`);
}
const root = path.join(__dirname, '..', 'kopfrechnen'), out = path.join(root, 'stand.json');
require('./vorlesen.js').build();   // feste Vorlese-Texte für die Stimme „Nova“ (kopfrechnen/vorlesen/texte.json) immer aktuell halten
const SKIP = new Set(['stand.json', 'sw.js']);   // sw.js braucht die App nicht
const files = {};
(function walk(dir) {
  for (const n of fs.readdirSync(dir).sort()) {
    const f = path.join(dir, n), rel = path.relative(root, f).split(path.sep).join('/');
    if (n.startsWith('.')) continue;
    if (fs.statSync(f).isDirectory()) walk(f);
    else if (!SKIP.has(rel)) files[rel] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  }
})(root);
const version = fs.readFileSync(path.join(root, 'js/changelog.js'), 'utf8').match(/APP_VERSION = '([\d.]+)'/)[1];
// shell = Mindest-Hülle, die dieser Inhalt braucht (MIN_SHELL). Die Hülle der APK selbst steht in SHELL und kann höher sein:
// dann gibt es eine neue APK (z. B. Startbild), ältere Apps laden die Inhalte trotzdem weiter.
const minFile = path.join(__dirname, 'MIN_SHELL');
const shell = +fs.readFileSync(fs.existsSync(minFile) ? minFile : path.join(__dirname, 'SHELL'), 'utf8').trim();
const id = crypto.createHash('sha256').update(JSON.stringify([version, shell, files])).digest('hex').slice(0, 16);
const json = `{"app":"rechenblitz","version":"${version}","shell":${shell},"id":"${id}","files":{\n${Object.entries(files).map(([k, v]) => `"${k}":"${v}"`).join(',\n')}\n}}\n`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== json) { console.error('kopfrechnen/stand.json ist veraltet – bitte „node android-app/stand.js“ ausführen und mit committen.'); process.exit(1); }
  console.log(`stand.json aktuell: ${version} · braucht Hülle ≥ ${shell} · ${id}`);
} else { fs.writeFileSync(out, json); console.log(`stand.json: ${version} · braucht Hülle ≥ ${shell} · ${Object.keys(files).length} Dateien · ${id}`); }
