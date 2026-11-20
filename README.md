# Dealline

Web-Programm von W Software unter **mert.win/deal**: Deals mit anderen festhalten – worum es geht, wer mitmacht,
wer was macht, Regeln für alle und für einzelne Mitglieder – unterschreiben, als Link teilen und als PDF oder Bild herunterladen.

Komplett statisch: kein Server, keine fremden Bibliotheken, keine CDNs. Läuft offline (Service Worker).

## Was es kann

- **Deal anlegen:** Titel, worum es geht, Datum, Ort, Laufzeit (Beginn/Ende), Fristen, Einsatz bzw. Gegenleistung
- **Mitglieder:** Name, Rolle, Farbe, Kürzel oder Emoji, Aufgaben pro Mitglied
- **Regeln:** für alle oder nur für ausgewählte Mitglieder (Mehrfachauswahl), optional Konsequenz bei Bruch, sortierbar
- **Unterschriften:** zeichnen (Maus/Finger) oder Namen tippen, mit Datum und Uhrzeit.
  Jede Unterschrift merkt sich den **Prüfcode** des Inhalts – wird der Deal danach geändert, steht sie als „vor einer Änderung unterschrieben“ da.
- **Export:** PDF (A4, mehrseitig, eigener kleiner PDF-Schreiber) und PNG (eine lange Seite), außerdem Drucken
- **Teilen:** Deal als Link – alles steckt komprimiert im Hash (`#d=…`, deflate-raw + base64url). Wer den Link öffnet,
  sieht den Deal, kann unterschreiben und einen neuen Link zurückschicken. Unterschriften werden beim Öffnen zusammengeführt.
- **Meine Deals:** Liste in localStorage, Import/Export als `.json` (einzeln oder alle)
- **Vorlagen:** Wette, Gruppenprojekt, WG-Regeln, Spiel-/Turnierregeln, Verleih, Leer
- Oberfläche Deutsch/Englisch, Dokumentsprache pro Deal einstellbar; hell/dunkel nach System; handytauglich ab 320 px

## Aufbau

```
deal/                 -> kommt auf die Website nach /deal/
  index.html          Oberfläche
  deal.css            Aufbau (Farben/Glas kommen von /app-icons/acryl.css)
  deal.js             alles andere: Dokument-Satz (Canvas), PDF, Link-Kodierung, Speicher, Oberfläche
  sw.js               offline
  app.webmanifest
  icon.svg, icon-192.png, icon-512.png
tests/                automatische Tests (headless Chromium über Playwright) + kleiner Testserver
tools/icons.js        rendert die PNG-Symbole aus icon.svg
screenshots/          WebP-Screenshots der wichtigsten Ansichten
release/              Zip des Ordners deal/ und Release-Notizen
vorlage/              Stil-Vorbild (QR-Gestalter) und die gemeinsamen Stylesheets
```

Wie die anderen Seiten lädt `index.html` als letzte Stylesheets `/app-icons/acryl.css` und `/app-icons/mobile.css`
und hat `data-acryl` am `<html>`. Fehlen die beiden (z. B. in W Hub), sieht die Seite dank eigener Rückfallwerte trotzdem richtig aus.

## Tests

```bash
npm install          # nur Playwright
npm test             # alle Tests, unsichtbar (headless)
npm run screenshots  # Tests + Screenshots nach screenshots/
npm run serve        # lokal ansehen: http://localhost:8080/deal/
```

Getestet wird: Deal anlegen, Mitglieder und Aufgaben, Regeln für alle/einzelne, Unterschrift (Maus, Finger, getippt),
Strich-Kodierung, Link-Rundlauf inkl. Antwort-Link und Zusammenführen, PDF (Rahmen, Größe, Seitenzahl, `pdfinfo` falls vorhanden),
PNG, JSON-Export/-Import, Prüfcode, Vorlagen, Sprache, 375 px ohne seitlichen Überlauf, Offline-Betrieb.

## Hinweis

Dealline hält Absprachen fest und ersetzt keinen rechtlich geprüften Vertrag. Der Prüfcode zeigt Änderungen an,
ist aber keine fälschungssichere Signatur.

Lizenz: Apache-2.0
