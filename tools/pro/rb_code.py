#!/usr/bin/env python3
"""
Rechenblitz Pro – Freischalt-Codes erzeugen (für den Lizenz-Dienst / WooCommerce-Anbindung). Gemeinsames Format aller Lern-Apps.

  python3 rb_code.py pro GEHEIM.key 1001 [2026-11-20]   # Rechenblitz Pro, laufende Nummer 1001, Ausstellungstag (Standard: heute)

GEHEIM.key enthält den geheimen Ed25519-Schlüssel als Hex – NIE ins Repo (nur Bitwarden / Lizenz-Dienst).
Öffentlicher Schlüssel in der App: 979eb515…b812 (kopfrechnen/js/pro.js, RBPRO.key).
Aufbau (9 Byte + 64 Byte Signatur, Crockford-Base32): Version 1 · App 2 (Rechenblitz) · Produkt 1 (Pro) · Nummer (4 Byte) · Tag seit 1.1.2020 (2 Byte).
Ausgabe: Code (für die E-Mail) und Freischalt-Link (ein Tipp genügt). Braucht: pip install cryptography
"""
import sys, datetime
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

APP_RECHENBLITZ, PRODUCT_PRO = 2, 1
ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
DAY0 = datetime.date(2020, 1, 1)
LINK = "https://rechenblitz.mathenachhilfe-online.com/#pro="   # seit 18.11.: im #-Teil, landet nicht in Server-Logs (?pro= liest die App weiter)


def b32(data: bytes) -> str:
    bits, buf, out = 0, 0, []
    for b in data:
        buf = (buf << 8) | b; bits += 8
        while bits >= 5:
            out.append(ALPHABET[(buf >> (bits - 5)) & 31]); bits -= 5
        buf &= (1 << bits) - 1
    if bits:
        out.append(ALPHABET[(buf << (5 - bits)) & 31])
    s = "".join(out)
    return "RB-" + "-".join(s[i:i + 5] for i in range(0, len(s), 5))


def make(k: Ed25519PrivateKey, serial: int, day: datetime.date) -> str:
    payload = bytes([1, APP_RECHENBLITZ, PRODUCT_PRO]) + serial.to_bytes(4, "big") + (day - DAY0).days.to_bytes(2, "big")
    return b32(payload + k.sign(payload))


def main(a):
    if len(a) >= 3 and a[0] == "pro":
        k = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(open(a[1]).read().strip()))
        day = datetime.date.fromisoformat(a[3]) if len(a) >= 4 else datetime.date.today()
        c = make(k, int(a[2]), day)
        print(c); print(LINK + c.replace("-", ""))
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
