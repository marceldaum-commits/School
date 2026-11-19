// Rechenblitz: Skripte und CSS für die Auslieferung bündeln und verkleinern (Marcel 16.11.: schneller Start).
// Quelle bleiben die lesbaren Dateien in kopfrechnen/js und kopfrechnen/app.css – ausgeliefert werden
// kopfrechnen/js/rechenblitz.min.js und kopfrechnen/app.min.css. Aufruf über stand.js (schreibt bzw. prüft).
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const ROOT = path.join(__dirname, '..', 'kopfrechnen');
// Reihenfolge wie früher die einzelnen <script>-Tags (config.js bleibt eigene Datei, Übersetzungen werden bei Bedarf geladen)
const SOURCES = ['js/native.js', 'js/i18n.js', 'js/changelog.js', 'js/engine.js', 'js/app.js', 'js/panels.js', 'js/speech.js', 'js/nova.js', 'js/music.js', 'js/vendor/qrcode.js', 'js/extras.js',
  'js/memory.js', 'js/merkvis.js', 'js/blitz.js', 'js/reise.js', 'js/welt.js', 'js/raetsel.js', 'js/garten.js', 'js/dungeon.js', 'js/wunsch.js', 'js/elterntor.js', 'js/pro.js', 'js/kopplung.js', 'js/umzug.js', 'js/theorie.js', 'js/theorie-i18n.js', 'js/reminder.js'];
const OUT = { js: 'js/rechenblitz.min.js', css: 'app.min.css' };
function build() {
  const src = SOURCES.map(f => `/* ${f} */\n` + fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^'use strict';\s*/, '')).join('\n;\n');
  // Ein klassisches Skript (kein Modul): Namen auf oberster Ebene bleiben erhalten, die Teile teilen sich wie vorher den globalen Bereich
  const js = esbuild.transformSync("'use strict';\n" + src, { minify: true, target: 'es2020', legalComments: 'none', charset: 'utf8' }).code;
  const css = esbuild.transformSync(fs.readFileSync(path.join(ROOT, 'app.css'), 'utf8'), { loader: 'css', minify: true, legalComments: 'none', charset: 'utf8' }).code;
  return { [OUT.js]: '/* Rechenblitz – gebündelt aus kopfrechnen/js (android-app/bundle.js), nicht von Hand ändern */\n' + js, [OUT.css]: css };
}
module.exports = { build, SOURCES, OUT };
