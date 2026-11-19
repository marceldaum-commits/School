// Neues App-Symbol (Marcel 17.11.): oranger Verlauf, dunkler Blitz, Rechenzeichen + × ÷ − halbtransparent (als Pfade, keine Schrift).
// Erzeugt alle Größen für Web (Favicon, PWA, Apple) und Android (Launcher, adaptiv: Hintergrund = Verlauf, Vordergrund = Blitz).
// Aufruf: node symbol.js   (danach python3 icons.py für Startbild und Verkleinern) – nur nötig, wenn sich das Symbol ändert.
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const GRAD = '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff6a00"/></linearGradient></defs>';
const BOLT = '<path d="M262 60 L150 280 H248 L208 452 L380 214 H286 L334 60 Z" fill="#0a0f24"/>';
// Rechenzeichen als Striche (gleiche Lage wie im Shop-Bild: + oben links, × oben rechts, ÷ unten links, − unten rechts)
const OPS = `<g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".35">
  <path d="M88 82 V122 M68 102 H108"/>
  <path d="M407 90 L435 118 M435 90 L407 118"/>
  <path d="M68 400 H108"/><circle cx="88" cy="384" r="5.5" fill="#fff" stroke="none"/><circle cx="88" cy="416" r="5.5" fill="#fff" stroke="none"/>
  <path d="M406 412 H446"/></g>`;
const svg = (body, rx = 112) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${GRAD}${rx === null ? '' : `<rect width="512" height="512" rx="${rx}" fill="url(#g)"/>`}${body}</svg>`;
const scale = (k, inner) => `<g transform="translate(256 256) scale(${k}) translate(-256 -256)">${inner}</g>`;
const V = {
  'icon': svg(OPS + BOLT),                                   // Standard mit runden Ecken
  'icon-klein': svg(BOLT),                                   // ≤ 48 px: ohne Rechenzeichen
  'maskable': svg(scale(0.74, OPS + BOLT), 0),               // randlos, Inhalt im sicheren Kreis (80 %)
  'apple': svg(scale(0.92, OPS + BOLT), 0),                  // iOS rundet selbst ab
  'android-hintergrund': svg('', 0),                         // adaptiv: nur Verlauf
  'android-vordergrund': svg(scale(0.56, BOLT), null),       // adaptiv: nur Blitz, im sicheren Bereich (66/108)
};
const WEB = '../kopfrechnen/icons', RES = 'android/app/src/main/res';
const jobs = [
  ['icon', 512, `${WEB}/icon-512.png`], ['icon', 192, `${WEB}/icon-192.png`], ['apple', 180, `${WEB}/apple-touch-icon.png`],
  ['maskable', 512, `${WEB}/icon-maskable-512.png`], ['icon-klein', 32, `${WEB}/favicon-32.png`], ['icon', 1024, 'symbol/icon-1024.png'],
];
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, f] of Object.entries(dens)) {
  const s = Math.round(48 * f), fg = Math.round(108 * f);
  jobs.push(['icon-klein', s, `${RES}/mipmap-${d}/ic_launcher.png`], ['rund', s, `${RES}/mipmap-${d}/ic_launcher_round.png`],
    ['android-vordergrund', fg, `${RES}/mipmap-${d}/ic_launcher_foreground.png`], ['android-hintergrund', fg, `${RES}/mipmap-${d}/ic_launcher_background.png`]);
}
V.rund = svg(scale(0.9, BOLT), 256);   // rundes Launcher-Symbol
(async () => {
  for (const [k, v] of Object.entries(V)) fs.writeFileSync(path.join('symbol', k + '.svg'), v + '\n');
  const b = await chromium.launch(), p = await b.newPage();
  for (const [k, s, out] of jobs) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0;background:transparent">${V[k].replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
  console.log(jobs.length, 'Bilder erzeugt');
})();
