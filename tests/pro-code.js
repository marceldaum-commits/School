// Rechenblitz Pro – Test der Code-Prüfung (pro.js) mit einem eigenen Test-Schlüsselpaar.
// Erzeugt Codes im Format [Version 1, App 2, Produkt, Seriennummer …] + Ed25519-Signatur, Crockford-Base32, Präfix „RB-“,
// und prüft: gültig, falsche App, falsches Produkt, verändert, Bindestriche/Kleinbuchstaben/O-I-L, Unsinn.
// Aufruf: node tests/pro-code.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
global.window = global; global.CONFIG = {}; global.IS_NATIVE = false; global.PANELS = {};
eval(fs.readFileSync(path.join(__dirname, '../kopfrechnen/js/pro.js'), 'utf8') + ';global.P={RBPRO,proDecode,proVerify,proNorm};');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
P.RBPRO.key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const enc = bytes => { let out = '', acc = 0, bits = 0; for (const b of bytes) { acc = (acc << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; out += B32[(acc >> bits) & 31]; } acc &= (1 << bits) - 1; } if (bits) out += B32[(acc << (5 - bits)) & 31]; return out; };
const make = (ver, app, prod, extra = [0x12, 0x34, 0x56, 0x78]) => { const msg = Buffer.from([ver, app, prod, ...extra]); const sig = crypto.sign(null, msg, privateKey); return 'RB-' + enc(Buffer.concat([msg, sig])).match(/.{1,5}/g).join('-'); };
(async () => {
  let fail = 0; const t = async (name, code, want) => { const r = await P.proVerify(code); const ok = r.ok === want; if (!ok) fail++; console.log(ok ? '✓' : '✗', name, r.ok ? 'gültig' : 'abgelehnt (' + r.why + ')'); };
  const good = make(1, 2, 1);
  await t('gültiger Pro-Code', good, true);
  await t('ohne Bindestriche, klein geschrieben', good.replace(/-/g, '').toLowerCase(), true);
  await t('mit Leerzeichen', good.replace(/-/g, ' '), true);
  await t('längerer Datenteil (z. B. Datum)', make(1, 2, 1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), true);
  await t('Code einer anderen App (App 1)', make(1, 1, 1), false);
  await t('anderes Produkt (2)', make(1, 2, 2), false);
  await t('andere Code-Version (2)', make(2, 2, 1), false);
  const chars = good.split(''); const i = chars.findIndex((c, k) => k > 10 && c !== '-'); chars[i] = chars[i] === 'A' ? 'B' : 'A';
  await t('ein Zeichen verändert', chars.join(''), false);
  await t('Unsinn', 'RB-HALLO-WELT', false);
  await t('leer', '', false);
  const other = crypto.generateKeyPairSync('ed25519'); const msg = Buffer.from([1, 2, 1, 9, 9, 9, 9]);
  await t('mit fremdem Schlüssel signiert', 'RB-' + enc(Buffer.concat([msg, crypto.sign(null, msg, other.privateKey)])), false);
  console.log(fail ? `\n${fail} Fehler` : '\nAlle Code-Prüfungen richtig ✓'); process.exitCode = fail ? 1 : 0;
})();
