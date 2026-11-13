'use strict';
// Rechenblitz – Versionen mit Datum (neueste oben). Wird unter „Was ist neu?“ angezeigt.
const APP_VERSION = '3.5.0';
const APP_DATE = '2026-11-13';
const CHANGELOG = [
  ['3.5.0', '2026-11-13', ['Versionsnummer mit Datum', 'Neu im Menü: „Was ist neu?“ mit allen Änderungen']],
  ['3.4.2', '2026-11-13', ['Adventskalender: persönlicher Gutscheincode für alle 24 Türchen']],
  ['3.4.0', '2026-11-13', ['Einfachere Startseite mit einem großen Start-Knopf', 'Schwierigkeit stellt sich automatisch ein']],
  ['3.3.0', '2026-11-13', ['Englisch und Ukrainisch – passend zur Sprache des Geräts', 'Logo führt zur Website']],
  ['3.2.0', '2026-11-13', ['Adventskalender passend zur Klassenstufe']],
  ['3.1.0', '2026-11-13', ['Rechen-Adventskalender', 'Urkunden zum Teilen und Drucken', 'Flyer & Poster mit QR-Code', 'Freunde einladen']],
  ['3.0.0', '2026-11-13', ['17 Themen mit Lösungsweg bei jedem Fehler', 'Profile, Abzeichen, Duell, Tageschallenge', 'Einstufungstest und Wochenbericht']],
];
const fmtDateShort = s => new Date(s + 'T12:00').toLocaleDateString(typeof locale === 'function' ? locale() : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const versionLabel = () => `${APP_VERSION} · ${fmtDateShort(APP_DATE)}`;
