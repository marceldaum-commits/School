// Rechenblitz – Start mit unvollständigem Speicher (z. B. nur rb-classes, {"v":3} ohne Profile). Braucht den lokalen Server auf :8765.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), out = {};
  for (const [name, val] of [['leer-objekt', '{}'], ['nur-v3', '{"v":3}'], ['v3-ohne-profile', '{"v":3,"cur":"p1"}'], ['null', 'null'], ['kaputt', '{x'], ['v3-profil-ohne-data', '{"v":3,"cur":"p1","profiles":{"p1":{"name":"A"}}}']]) {
    const p = await (await b.newContext()).newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/favicon-32.png');
    await p.evaluate(v => { localStorage.clear(); localStorage.setItem('rb-classes', '[]'); localStorage.setItem('rechenblitz', v); }, val);
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
    out[name] = errs; await p.close(); }
  await b.close(); const bad = Object.entries(out).filter(([, e]) => e.length); console.log(bad.length ? "FEHLER " + JSON.stringify(bad) : "Unvollständiger Speicher ✓ (" + Object.keys(out).length + " Fälle)"); process.exit(bad.length ? 1 : 0); })();
