// Dealline – automatische Tests (headless Chromium über Playwright, nichts öffnet sich sichtbar).
//   node tests/dealline.test.js           Tests ausführen
//   node tests/dealline.test.js --shots   zusätzlich Screenshots (WebP) nach screenshots/ schreiben
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { start } = require('./server');

const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = path.join(__dirname, '..', 'screenshots');
let passed = 0, failed = 0;
const results = [];
function ok(cond, name, info = '') {
  if (cond) { passed++; results.push(`  ✓ ${name}`); }
  else { failed++; results.push(`  ✗ ${name}${info ? '  → ' + info : ''}`); }
}
async function step(name, fn) {
  results.push(name);
  try { await fn(); } catch (e) { failed++; results.push(`  ✗ Fehler: ${e.message.split('\n')[0]}`); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function toWebp(page, pngBuffer, file) {
  const data = await page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, pngBuffer.toString('base64'));
  fs.writeFileSync(path.join(SHOT_DIR, file), Buffer.from(data, 'base64'));
}
async function shot(page, file, opts = {}) {
  if (!SHOTS) return;
  const png = await page.screenshot(opts);
  await toWebp(page, png, file);
}
async function download(page, selector) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click(selector)]);
  return { name: dl.suggestedFilename(), bytes: fs.readFileSync(await dl.path()) };
}
const pdfPages = buf => { const m = buf.toString('latin1').match(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/); return m ? Number(m[1]) : 0; };
function pdfinfoPages(file) {
  try { const out = execFileSync('pdfinfo', [file], { encoding: 'utf8' }); const m = out.match(/Pages:\s+(\d+)/); return m ? Number(m[1]) : null; } catch { return null; }
}
const pngSize = buf => ({ sig: buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

// Ein langer Deal, damit das PDF mehrere Seiten bekommt
function longDeal() {
  const members = ['Alex Berger', 'Sam Yilmaz', 'Kim Novak', 'Jo Wagner'].map((name, i) => ({ id: 'm' + i, name, role: i ? 'Spieler' : 'Spielleitung',
    tasks: ['Bringt Snacks mit', 'Baut die Konsole auf', 'Schreibt die Ergebnisse auf'].slice(0, (i % 3) + 1) }));
  const rules = Array.from({ length: 26 }, (_, i) => ({ id: 'r' + i, text: `Regel ${i + 1}: ` + 'Alle halten sich fair an die Abmachung und sagen rechtzeitig Bescheid, wenn etwas dazwischenkommt. '.repeat(1 + (i % 3)),
    who: i % 4 === 0 ? ['m1', 'm3'] : 'all', penalty: i % 3 === 0 ? 'Gibt eine Runde aus' : '' }));
  return { id: 'longdeal01', lang: 'de', title: 'Turnier: Langer Spieleabend mit sehr vielen Regeln', about: 'Ein Test mit vielen Regeln. '.repeat(20),
    date: '2026-11-19', start: '2026-11-20', end: '2026-12-20', place: 'Berlin', stake: 'Der Sieger sucht das nächste Spiel aus.',
    deadlines: [{ date: '2026-11-25', label: 'Anmeldung' }, { date: '2026-12-01', label: 'Erste Runde' }], members, rules, sigs: {} };
}

(async () => {
  const { srv, url } = await start();
  const APP = url + '/deal/';
  const browser = await chromium.launch();
  const ctxOpts = { locale: 'de-DE', serviceWorkers: 'block', acceptDownloads: true, viewport: { width: 1280, height: 860 }, colorScheme: 'dark' };
  const ctxA = await browser.newContext(ctxOpts);
  const page = await ctxA.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (SHOTS) fs.mkdirSync(SHOT_DIR, { recursive: true });

  await step('Start', async () => {
    await page.goto(APP);
    await page.waitForSelector('#pages canvas');
    ok(await page.evaluate(() => document.documentElement.lang) === 'de', 'Oberfläche auf Deutsch (Browser-Sprache de)');
    ok(await page.$eval('[data-tab="edit"]', e => e.textContent) === 'Deal', 'Tabs beschriftet');
    ok(await page.evaluate(() => !!window.Dealline && Dealline.deal.members.length === 2), 'neuer Deal mit zwei leeren Mitgliedern');
    const css = await page.$$eval('link[rel=stylesheet]', l => l.map(x => x.getAttribute('href')));
    ok(css.slice(-2).join() === '/app-icons/acryl.css,/app-icons/mobile.css', 'acryl.css und mobile.css als letzte Stylesheets');
    ok(await page.evaluate(() => document.documentElement.hasAttribute('data-acryl')), 'data-acryl am <html>');
    const ext = await page.$$eval('script[src], link[href]', l => l.map(x => x.src || x.href).filter(u => !u.startsWith(location.origin)));
    ok(ext.length === 0, 'keine externen Skripte oder Stylesheets', ext.join(', '));
  });

  let ids;
  await step('Deal anlegen (Oberfläche)', async () => {
    await page.fill('[data-f="title"]', 'Wette um das Derby');
    await page.fill('[data-f="about"]', 'Wir wetten, wer das Derby am Samstag gewinnt.\nWer falsch liegt, löst den Einsatz ein.');
    await page.fill('[data-f="date"]', '2026-11-19');
    await page.fill('[data-f="place"]', 'Köln');
    await page.fill('[data-f="start"]', '2026-11-19');
    await page.fill('[data-f="end"]', '2026-11-30');
    await page.fill('[data-f="stake"]', 'Wer verliert, gibt eine Pizza aus.');
    await page.click('#add-deadline');
    await page.fill('#deadlines li:last-child input[type=date]', '2026-11-26');
    await page.fill('#deadlines li:last-child input[type=text]', 'Einsatz einlösen');
    const d = await page.evaluate(() => Dealline.deal);
    ok(d.title === 'Wette um das Derby' && d.place === 'Köln' && d.end === '2026-11-30', 'Titel, Ort, Laufzeit gespeichert');
    ok(d.about.includes('\n'), 'Beschreibung mit Zeilenumbruch');
    ok(d.deadlines.length === 1 && d.deadlines[0].label === 'Einsatz einlösen', 'Frist angelegt');
  });

  await step('Mitglieder und Aufgaben', async () => {
    const names = ['Mert Öz', 'Lena Schmidt'];
    for (let i = 0; i < 2; i++) await page.fill(`#members .member:nth-child(${i + 1}) .m-name`, names[i]);
    await page.click('#add-member');
    await page.fill('#members .member:nth-child(3) .m-name', 'Jonas Weber');
    await page.fill('#members .member:nth-child(3) .m-role', 'Schiedsrichter');
    // Aufgaben
    await page.click('#members .member:nth-child(1) .btn.ghost');
    await page.fill('#members .member:nth-child(1) .tasks li:last-child input', 'Tippt auf Heimsieg');
    await page.press('#members .member:nth-child(1) .tasks li:last-child input', 'Enter');
    await page.keyboard.type('Bringt die Pizza, falls verloren');
    await page.click('#members .member:nth-child(2) .btn.ghost');
    await page.keyboard.type('Tippt auf Auswärtssieg');
    await page.click('#members .member:nth-child(3) .btn.ghost');
    await page.keyboard.type('Schaut das Spiel und bestätigt das Ergebnis');
    // Farbe/Kürzel
    await page.click('#members .member:nth-child(2) .av');
    await page.click('#members .member:nth-child(2) .sw:nth-child(4)');
    const d = await page.evaluate(() => Dealline.deal);
    ids = d.members.map(m => m.id);
    ok(d.members.length === 3, 'drei Mitglieder');
    ok(d.members[0].tasks.join('|') === 'Tippt auf Heimsieg|Bringt die Pizza, falls verloren', 'Aufgaben mit Enter fortsetzen');
    ok(d.members[2].role === 'Schiedsrichter', 'Rolle gespeichert');
    ok(d.members[1].color === '#1d8a87', 'Farbe gewählt');
  });

  await step('Regeln für alle und für einzelne', async () => {
    await page.click('#add-rule');
    await page.fill('#rules .rule:nth-child(1) textarea', 'Es zählt das Ergebnis nach 90 Minuten.');
    await page.click('#add-rule');
    await page.fill('#rules .rule:nth-child(2) textarea', 'Dürfen vor dem Spiel nicht über das Ergebnis reden.');
    await page.click('#rules .rule:nth-child(2) .seg [data-v="some"]');
    await page.click(`#rules .rule:nth-child(2) .who [data-mid="${ids[0]}"]`);
    await page.click(`#rules .rule:nth-child(2) .who [data-mid="${ids[1]}"]`);
    await page.fill('#rules .rule:nth-child(2) .penalty', 'Die Wette ist verloren.');
    await page.click('#add-rule');
    await page.fill('#rules .rule:nth-child(3) textarea', 'Entscheidet bei Streit.');
    await page.click('#rules .rule:nth-child(3) .seg [data-v="some"]');
    ok(await page.isVisible('#rules .rule:nth-child(3) .who .warn'), 'Hinweis, wenn niemand gewählt ist');
    await page.click(`#rules .rule:nth-child(3) .who [data-mid="${ids[2]}"]`);
    const d = await page.evaluate(() => Dealline.deal);
    ok(d.rules[0].who === 'all', 'Regel 1 gilt für alle');
    ok(JSON.stringify(d.rules[1].who) === JSON.stringify([ids[0], ids[1]]), 'Regel 2 gilt für zwei ausgewählte Mitglieder');
    ok(d.rules[1].penalty === 'Die Wette ist verloren.', 'Konsequenz gespeichert');
    ok(JSON.stringify(d.rules[2].who) === JSON.stringify([ids[2]]), 'Regel 3 gilt nur für eins');
    ok(await page.$eval('#rules .rule:nth-child(3) .seg [data-v="some"]', e => e.getAttribute('aria-pressed')) === 'true', 'Umschalter zeigt „Nur für …“');
    // Reihenfolge
    await page.click('#rules .rule:nth-child(3) [title="Nach oben"]');
    ok(await page.evaluate(() => Dealline.deal.rules[1].text) === 'Entscheidet bei Streit.', 'Regel nach oben verschieben');
    await page.click('#rules .rule:nth-child(2) [title="Nach unten"]');
    await sleep(300);
    ok(await page.evaluate(() => document.querySelectorAll('#pages canvas').length) >= 1, 'Vorschau gezeichnet');
    await shot(page, 'deal-bearbeiten.webp');
  });

  await step('Unterschriften (zeichnen und tippen)', async () => {
    await page.click(`#sigs [data-mid="${ids[0]}"] .btn`);
    await page.waitForSelector('#sign-dlg[open]');
    await page.click('#sign-mode [data-v="draw"]');
    const box = await page.$eval('#pad', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    await page.mouse.move(box.x + box.w * 0.1, box.y + box.h * 0.6);
    await page.mouse.down();
    for (let i = 0; i <= 40; i++) await page.mouse.move(box.x + box.w * (0.1 + i * 0.018), box.y + box.h * (0.55 + 0.25 * Math.sin(i / 3)), { steps: 2 });
    await page.mouse.up();
    await page.mouse.move(box.x + box.w * 0.82, box.y + box.h * 0.3); await page.mouse.down();
    await page.mouse.move(box.x + box.w * 0.86, box.y + box.h * 0.7, { steps: 6 }); await page.mouse.up();
    await shot(page, 'unterschreiben.webp');
    await page.click('#sign-ok');
    await page.waitForSelector('#sign-dlg:not([open])', { state: 'attached' });
    let s = await page.evaluate(id => Dealline.deal.sigs[id], ids[0]);
    ok(s && s.type === 'draw' && s.s.length > 20, 'gezeichnete Unterschrift gespeichert', s && s.s.length);
    const strokes = await page.evaluate(id => Dealline.decStrokes(Dealline.deal.sigs[id].s), ids[0]);
    ok(strokes.length === 2 && strokes[0].length > 3, 'Striche lassen sich dekodieren', JSON.stringify(strokes.map(x => x.length)));
    ok(await page.evaluate(id => Dealline.sigState(Dealline.deal, Dealline.deal.members.find(m => m.id === id)), ids[0]) === 'ok', 'Unterschrift gültig');

    await page.click(`#sigs [data-mid="${ids[1]}"] .btn`);
    await page.click('#sign-mode [data-v="type"]');
    ok(await page.inputValue('#sig-text') === 'Lena Schmidt', 'Name vorausgefüllt');
    await page.click('#sign-ok');
    s = await page.evaluate(id => Dealline.deal.sigs[id], ids[1]);
    ok(s && s.type === 'type' && s.text === 'Lena Schmidt' && s.at > 0, 'getippte Unterschrift mit Datum');
    ok(await page.waitForFunction(() => document.querySelector('#doc-info').textContent.includes('2 von 3'), null, { timeout: 3000 }).then(() => true, () => false), 'Status „2 von 3 unterschrieben“');
    // leere Zeichenfläche wird abgelehnt
    await page.click(`#sigs [data-mid="${ids[2]}"] .btn`);
    await page.click('#sign-mode [data-v="draw"]');
    await page.click('#sign-ok');
    ok(await page.isVisible('#sign-dlg[open]'), 'leere Unterschrift wird nicht angenommen');
    await page.click('#sign-cancel');
  });

  await step('Stroke-Kodierung (Rundlauf)', async () => {
    const r = await page.evaluate(() => {
      const strokes = [[[0, 0], [600, 200], [300, 100]], [[50, 50]], Array.from({ length: 700 }, (_, i) => [i % 600, 100 + Math.round(80 * Math.sin(i / 9))])];
      const back = Dealline.decStrokes(Dealline.encStrokes(strokes));
      const ends = back.map(s => [s[0], s[s.length - 1]]);
      return { n: back.length, first: back[0][0], last: back[0][back[0].length - 1], dot: back.find(s => s.length === 1) ? 1 : 0, ends };
    });
    ok(r.first.join() === '0,0' && r.last.join() === '300,100', 'große Sprünge bleiben exakt');
    ok(r.dot === 1, 'einzelner Punkt bleibt erhalten');
    ok(r.n >= 3, 'lange Striche werden in Abschnitte geteilt', r.n);
  });

  let link;
  await step('Link kodieren und dekodieren (Rundlauf)', async () => {
    const r = await page.evaluate(async () => {
      const d = Dealline.deal;
      const link = await Dealline.dealLink(d);
      const code = link.split('#d=')[1];
      const back = await Dealline.decodeDeal(code);
      return { link, same: Dealline.contentHash(back) === Dealline.contentHash(d), sigs: Object.keys(back.sigs).length,
        title: back.title, who: back.rules.map(r => r.who), origWho: d.rules.map(r => r.who), json: JSON.stringify(d).length };
    });
    link = r.link;
    ok(r.link.startsWith(APP + '#d=1'), 'Link mit komprimierten Daten (#d=1…)');
    ok(r.same, 'Inhalt nach Rundlauf identisch (gleicher Prüfcode)');
    ok(r.sigs === 2, 'Unterschriften im Link enthalten');
    ok(JSON.stringify(r.who) === JSON.stringify(r.origWho), 'Regel-Zuordnung bleibt erhalten');
    ok(r.link.length < r.json, `Link kürzer als das JSON (${r.link.length} < ${r.json} Zeichen)`);
    const bad = await page.evaluate(async () => { try { await Dealline.decodeDeal('1abc$$'); return 'ok'; } catch { return 'error'; } });
    ok(bad === 'error', 'kaputter Code wird abgelehnt');
    const evil = await page.evaluate(() => Dealline.normalize({ title: 'x', members: [{ name: '<img src=x onerror=alert(1)>', color: 'red;}' }], rules: [{ text: 'a', who: ['nope'] }] }));
    ok(evil.members[0].color.startsWith('#') && evil.rules[0].who.length === 0, 'fremde Daten werden bereinigt');
  });

  await step('Geteilten Link öffnen, unterschreiben, zurückschicken', async () => {
    const ctxB = await browser.newContext({ ...ctxOpts, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: 'light' });
    const pb = await ctxB.newPage();
    pb.on('pageerror', e => errors.push('B: ' + e.message));
    await pb.goto(link);
    await pb.waitForSelector('#pages canvas');
    const st = await pb.evaluate(() => ({ title: Dealline.deal.title, view: document.body.dataset.view, recv: !document.querySelector('#recv').hidden, hash: location.hash, saved: Object.keys(Dealline.deals).length }));
    ok(st.title === 'Wette um das Derby', 'Empfänger sieht den Deal');
    ok(st.view === 'doc', 'auf dem Handy direkt die Dokument-Ansicht');
    ok(st.hash === '', 'Hash nach dem Laden entfernt');
    ok(st.saved === 1, 'Deal beim Empfänger gespeichert');
    await shot(pb, 'handy-geteilter-deal.webp');
    // Unterschreiben per Finger
    await pb.click(`#sigs [data-mid="${ids[2]}"] .btn`);
    await pb.click('#sign-mode [data-v="draw"]');
    const box = await pb.$eval('#pad', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const cdp = await ctxB.newCDPSession(pb);
    const pts = Array.from({ length: 25 }, (_, i) => ({ x: box.x + box.w * (0.15 + i * 0.028), y: box.y + box.h * (0.5 + 0.2 * Math.cos(i / 2)) }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pts[0]] });
    for (const p of pts.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [p] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pb.click('#sign-ok');
    const sB = await pb.evaluate(id => Dealline.deal.sigs[id], ids[2]);
    ok(sB && sB.type === 'draw', 'Unterschrift mit dem Finger');
    // Antwort-Link über den Teilen-Dialog
    await pb.click('#share');
    await pb.waitForSelector('#share-dlg[open]');
    const back = await pb.inputValue('#share-link');
    ok(back.includes('#d=1') && back !== link, 'neuer Link zum Zurückschicken');
    await shot(pb, 'handy-link-teilen.webp');
    await ctxB.close();

    // Absender öffnet den Antwort-Link: Unterschriften werden zusammengeführt
    await page.goto(back);
    await page.waitForSelector('#pages canvas');
    await sleep(200);
    const r = await page.evaluate(() => ({ n: Object.keys(Dealline.deal.sigs).length, deals: Object.keys(Dealline.deals).length, text: document.querySelector('#recv-text').textContent }));
    ok(r.n === 3 && r.deals === 1, 'Antwort zusammengeführt: 3 Unterschriften, kein doppelter Deal');
    ok(/1 neue Unterschrift/.test(r.text), 'Hinweis auf neue Unterschrift', r.text);
    ok(await page.$eval('#doc-info', e => e.textContent.includes('3 von 3')), 'alle haben unterschrieben');
    await page.evaluate(() => document.querySelector('.preview').scrollTo(0, 0));
    await page.evaluate(() => window.scrollTo(0, 0));
    if (SHOTS) await sleep(2800); // Toast abwarten, Glas fertig zeichnen lassen
    await shot(page, 'deal-unterschrieben.webp');
  });

  await step('PDF-Export', async () => {
    const { name, bytes } = await download(page, '#dl-pdf');
    ok(name === 'dealline-wette-um-das-derby.pdf', 'Dateiname', name);
    ok(bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(-6).toString().includes('%%EOF'), 'gültiger PDF-Rahmen');
    ok(bytes.length > 30000, `PDF nicht leer (${Math.round(bytes.length / 1024)} KB)`);
    const n = pdfPages(bytes);
    const shown = await page.$$eval('#pages canvas', l => l.length);
    ok(n >= 1 && n === shown, `Seitenzahl ${n} = Vorschau ${shown}`);
    const f = path.join(require('os').tmpdir(), 'dealline-test.pdf'); fs.writeFileSync(f, bytes);
    const pi = pdfinfoPages(f);
    if (pi !== null) ok(pi === n, `pdfinfo liest das PDF (${pi} Seiten)`); else results.push('  – pdfinfo nicht vorhanden, übersprungen');
    // langer Deal: mehrere Seiten
    await page.evaluate(d => Dealline.openDeal(d), longDeal());
    await sleep(300);
    const long = await download(page, '#dl-pdf');
    const ln = pdfPages(long.bytes);
    ok(ln >= 3, `langer Deal ergibt mehrere Seiten (${ln})`);
    ok(ln === await page.$$eval('#pages canvas', l => l.length), 'Seitenzahl PDF = Vorschau (langer Deal)');
    fs.writeFileSync(f, long.bytes);
    const pi2 = pdfinfoPages(f);
    if (pi2 !== null) ok(pi2 === ln, `pdfinfo: ${pi2} Seiten`);
    if (SHOTS) {
      const png = await page.evaluate(async () => { const [cv] = Dealline.renderDoc(Dealline.deals[Object.keys(Dealline.deals).find(k => k !== 'longdeal01')], { scale: 1.2 }); return cv.toDataURL('image/png').split(',')[1]; });
      await toWebp(page, Buffer.from(png, 'base64'), 'dokument-seite.webp');
    }
  });

  await step('Bild-Export (PNG)', async () => {
    const { name, bytes } = await download(page, '#dl-png');
    const p = pngSize(bytes);
    ok(p.sig, 'PNG-Signatur');
    ok(p.w === 1588 && p.h > 3000, `Größe ${p.w}×${p.h} (eine lange Seite)`);
    ok(bytes.length > 20000, `PNG nicht leer (${Math.round(bytes.length / 1024)} KB)`);
    ok(name.endsWith('.png'), 'Dateiname .png');
  });

  await step('Datei-Export und -Import (.json)', async () => {
    const { bytes } = await download(page, '#dl-json');
    const o = JSON.parse(bytes.toString());
    ok(o.app === 'dealline' && o.deal.id === 'longdeal01', 'JSON enthält den Deal');
    await page.click('[data-tab="list"]');
    await page.evaluate(() => { const id = 'longdeal01'; delete Dealline.deals[id]; });
    const f = path.join(require('os').tmpdir(), 'dealline-import.json'); fs.writeFileSync(f, bytes);
    await page.setInputFiles('#open-file', f);
    await sleep(300);
    ok(await page.evaluate(() => !!Dealline.deals.longdeal01), 'Import legt den Deal wieder an');
    ok(await page.$$eval('#deals li', l => l.length) === 2, 'Liste „Meine Deals“ zeigt zwei Deals');
    await shot(page, 'meine-deals.webp');
  });

  await step('Prüfcode: Änderung nach dem Unterschreiben', async () => {
    await page.click('#deals li:last-child .deal-open');
    const before = await page.evaluate(() => Dealline.deal.title);
    ok(before === 'Wette um das Derby', 'Deal aus der Liste geöffnet');
    await page.fill('[data-f="stake"]', 'Wer verliert, gibt zwei Pizzen aus.');
    const st = await page.evaluate(() => Dealline.deal.members.map(m => Dealline.sigState(Dealline.deal, m)));
    ok(st.every(s => s === 'stale'), 'Unterschriften werden als veraltet markiert');
    ok(await page.isVisible('#sigs .warn'), 'Warnung bei den Unterschriften sichtbar');
    await page.fill('[data-f="stake"]', 'Wer verliert, gibt eine Pizza aus.');
    ok(await page.evaluate(() => Dealline.deal.members.every(m => Dealline.sigState(Dealline.deal, m) === 'ok')), 'zurückgeändert = wieder gültig');
  });

  await step('Vorlagen und Sprache', async () => {
    await page.click('[data-tab="list"]');
    await page.click('#new-deal');
    for (const id of ['bet', 'project', 'flat', 'game', 'lend']) {
      await page.click('[data-tab="list"]'); await page.click('#new-deal');
      await page.evaluate(() => document.querySelector('#tpl-box').open = true);
      await page.click(`[data-tpl="${id}"]`);
      const d = await page.evaluate(() => Dealline.deal);
      ok(d.title && d.rules.length >= 3 && d.members.length >= 2, `Vorlage ${id}`);
    }
    const flat = await page.evaluate(() => Dealline.deal);
    ok(flat.rules.some(r => Array.isArray(r.who) && r.who.length === 1), 'Verleih-Vorlage hat Regel für einzelne');
    await page.click('#lang');
    ok(await page.$eval('[data-tab="list"]', e => e.textContent) === 'My deals', 'Umschalten auf Englisch');
    ok(await page.evaluate(() => Dealline.deal.lang) === 'de', 'Dokumentsprache bleibt beim Deal');
    await page.click('#lang');
    // ein Deal bleibt nach dem Neuladen erhalten
    await page.reload(); await page.waitForSelector('#pages canvas');
    ok(await page.evaluate(() => Object.keys(Dealline.deals).length) >= 7, 'Deals überleben das Neuladen (localStorage)');
  });

  await step('Handy-Breite 375 px ohne seitlichen Überlauf', async () => {
    const ctxM = await browser.newContext({ ...ctxOpts, viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const pm = await ctxM.newPage();
    pm.on('pageerror', e => errors.push('M: ' + e.message));
    await pm.goto(APP);
    await pm.evaluate(d => Dealline.openDeal(d), longDeal());
    await pm.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true); document.querySelectorAll('.m-opts').forEach(o => o.hidden = false); });
    const over = () => pm.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      for (const e of document.querySelectorAll('body *')) {
        const r = e.getBoundingClientRect();
        if (r.width && r.right > W + 0.5 && !e.closest('dialog:not([open])')) bad.push(e.tagName + '.' + e.className + ' ' + Math.round(r.right));
      }
      return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 5) };
    });
    for (const v of ['edit', 'doc', 'list']) {
      await pm.click(`[data-tab="${v}"]`); await sleep(250);
      const o = await over();
      ok(o.sw <= 375 && !o.bad.length, `Ansicht „${v}“ passt in 375 px`, JSON.stringify(o));
    }
    await pm.click('[data-tab="doc"]');
    await pm.click('#sigs li:first-child .btn');
    const o = await over();
    ok(!o.bad.length, 'Unterschrift-Dialog passt in 375 px', JSON.stringify(o.bad));
    await pm.click('#sign-cancel');
    await pm.click('[data-tab="edit"]');
    await pm.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = false); document.querySelectorAll('.m-opts').forEach(o => o.hidden = true); });
    await pm.evaluate(() => Dealline.openDeal(Object.values(Dealline.deals).find(d => d.id !== 'longdeal01') || Dealline.newDeal()));
    await shot(pm, 'handy-bearbeiten.webp');
    await ctxM.close();
  });

  await step('Offline (Service Worker)', async () => {
    const ctxO = await browser.newContext({ ...ctxOpts, serviceWorkers: 'allow' });
    const po = await ctxO.newPage();
    po.on('pageerror', e => errors.push('O: ' + e.message));
    await po.goto(APP);
    await po.evaluate(() => navigator.serviceWorker.ready);
    await po.reload(); await po.waitForSelector('#pages canvas');
    await ctxO.setOffline(true);
    await po.reload(); await po.waitForSelector('#pages canvas', { timeout: 10000 });
    ok(await po.evaluate(() => !!window.Dealline && document.styleSheets.length >= 3), 'Seite lädt ohne Netz (inkl. Stylesheets)');
    const pdf = await po.evaluate(async () => (await Dealline.makePdf(Dealline.deal)).pages);
    ok(pdf >= 1, 'PDF entsteht auch offline');
    await ctxO.close();
  });

  if (SHOTS) {
    // helles Design auf dem Desktop
    const ctxL = await browser.newContext({ ...ctxOpts, colorScheme: 'light' });
    const pl = await ctxL.newPage();
    await pl.goto(link); await pl.waitForSelector('#pages canvas'); await sleep(300);
    await shot(pl, 'hell-geteilter-deal.webp');
    await ctxL.close();
  }

  ok(errors.length === 0, 'keine JavaScript-Fehler', errors.join(' | '));
  await browser.close(); srv.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
