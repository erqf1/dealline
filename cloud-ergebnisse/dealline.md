ERGEBNIS CLOUD-SESSION dealline

1. Aufgabe und Status
   Dealline 1.0 als statisches Web-Programm für mert.win/deal gebaut. Fertig und getestet (82/82 Tests grün).
   Kein Server, keine fremden Bibliotheken oder CDNs, läuft offline.

2. Branch, Commits, PR, Release
   - Branch: claude/laughing-dijkstra-2whid6 (gepusht)
   - Commits: "Dealline 1.0: Web-Programm unter /deal …" + "Ergebnis-Bericht"
   - PR nach main: https://github.com/erqf1/dealline/pull/1
   - Tag v1.0.0: lokal erstellt, Push aus der Cloud abgelehnt (Git-Proxy lässt nur den Session-Branch zu).
     GitHub-Release konnte ich nicht anlegen (kein Release-Werkzeug). Zip und Notizen liegen bereit:
     release/dealline-v1.0.0.zip (Ordner deal/) und release/v1.0.0.md.

3. Was gebaut wurde
   - deal/index.html, deal.css, deal.js, sw.js (offline), app.webmanifest, icon.svg, icon-192.png, icon-512.png
   - acryl.css und mobile.css als letzte Stylesheets, data-acryl="ocean" + data-acryl-auto; eigene Rückfallwerte, falls sie fehlen
   - Eine Akzentfarbe (Tintenblau #2f55c8), kein Orange; Logo = Unterschrift-Schwung über einer Linie
   - Deal: Titel, worum es geht, Datum, Ort, Laufzeit (Beginn/Ende), Fristen-Liste, Einsatz/Gegenleistung
   - Mitglieder: Name, Rolle, Farbe (8 Farben), Kürzel/Emoji, Aufgaben pro Mitglied
   - Regeln: für alle oder für ausgewählte Mitglieder (Mehrfachauswahl), Konsequenz bei Bruch, sortierbar
   - Unterschriften: zeichnen (Maus/Finger, kompakt als Striche kodiert) oder tippen, mit Datum/Uhrzeit.
     Prüfcode (Fingerabdruck des Inhalts): Unterschriften vor einer späteren Änderung werden als veraltet markiert.
   - Dokument: eigener Canvas-Satz, A4, mehrseitig, hell, Kopf/Fuß mit Prüfcode und Seitenzahl
   - Export: PDF (eigener kleiner PDF-Schreiber, Seiten als JPEG, Text daher nicht markierbar), PNG (eine lange Seite), Drucken
   - Teilen: Link mit Deal im Hash (#d=…, deflate-raw + base64url). Empfänger sieht den Deal, unterschreibt,
     schickt neuen Link zurück; beim Öffnen werden Unterschriften zusammengeführt (kein doppelter Deal)
   - Meine Deals (localStorage), Import/Export .json (einzeln oder alle)
   - Vorlagen: Wette, Gruppenprojekt, WG-Regeln, Spiel-/Turnierregeln, Verleih, Leer
   - Oberfläche Deutsch/Englisch (Umschalter), Dokumentsprache pro Deal; Handy: eigener Tab "Dokument"
   - Hinweis in der App: ersetzt keinen geprüften Vertrag, Prüfcode ist nicht fälschungssicher

4. Was getestet wurde (tests/dealline.test.js, headless Chromium über Playwright)
   Getestet: Deal anlegen über die Oberfläche, Mitglieder/Aufgaben/Farbe, Regeln für alle/einzelne inkl. Umschalter,
   Unterschrift mit Maus, Finger (Touch) und getippt, leere Unterschrift abgelehnt, Strich-Kodierung, Link-Rundlauf
   (gleicher Prüfcode, Unterschriften drin, kaputte Links abgelehnt, fremde Daten bereinigt), Antwort-Link + Zusammenführen,
   PDF (Rahmen, >30 KB, Seitenzahl = Vorschau, pdfinfo bestätigt 2 bzw. 5 Seiten), PNG (Signatur, 1588 px breit),
   JSON-Export/-Import, Prüfcode bei Änderung, alle Vorlagen, Sprachwechsel, Neuladen, 375 px ohne Überlauf
   (Bearbeiten, Dokument, Liste, Unterschrift-Dialog), offline nach Service-Worker-Installation, keine JS-Fehler.
   Screenshots (WebP) in screenshots/.
   Nicht getestet: Safari/iOS und Firefox (nur Chromium), echtes Drucken auf Papier, navigator.share,
   Zwischenablage auf echten Geräten, die echten Acryl-Hintergrundbilder (/app-icons/acryl/*.webp fehlen in der Vorlage).

5. Offene Punkte / was der Nutzer tun muss
   - PR https://github.com/erqf1/dealline/pull/1 prüfen und nach main mergen
   - Danach Tag v1.0.0 auf main setzen und GitHub-Release anlegen: Text aus release/v1.0.0.md,
     Anhang release/dealline-v1.0.0.zip (oder neu zippen aus deal/)
   - Kurz auf iPhone/Safari ansehen (Unterschreiben mit Finger, PDF-Download)

6. Nächste Schritte für die Haupt-Session
   - Ordner deal/ nach Websites/deal kopieren und per CasaOS hochladen (eigene Pfade sind relativ;
     erwartet /app-icons/acryl.css und /app-icons/mobile.css wie die anderen Seiten)
   - Karte auf /help ergänzen: "Dealline" – Deals festhalten, unterschreiben, als Link/PDF teilen; Link /deal/
   - App-Symbole nach app-icons/ kopieren: deal/icon-192.png -> app-icons/deal-192.png, deal/icon-512.png -> app-icons/deal-512.png
     (Symbol-Farbe für .ico auf /help: --c #2f55c8)
   - In W Hub aufnehmen: läuft komplett offline; window.Dealline bietet newDeal, encodeDeal/decodeDeal, makePdf, makePng.
     Geteilte Links zeigen außerhalb von http(s) auf https://mert.win/deal/
