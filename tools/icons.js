// Erzeugt deal/icon-192.png und deal/icon-512.png aus deal/icon.svg (headless Chromium).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const svg = fs.readFileSync(path.join(__dirname, '../deal/icon.svg'), 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const size of [192, 512]) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, `../deal/icon-${size}.png`), omitBackground: true });
    await p.close();
  }
  await b.close();
  console.log('icons ok');
})();
