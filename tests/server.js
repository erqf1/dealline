// Kleiner statischer Server für die Tests: spiegelt die Website.
//   /deal/…                -> deal/
//   /app-icons/acryl.css   -> vorlage/acryl.css (auf mert.win liegt sie dort)
//   /app-icons/mobile.css  -> vorlage/mobile.css
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.webp': 'image/webp' };
function resolve(url) {
  const p = decodeURIComponent(url.split('?')[0].split('#')[0]);
  if (p === '/app-icons/acryl.css') return path.join(ROOT, 'vorlage/acryl.css');
  if (p === '/app-icons/mobile.css') return path.join(ROOT, 'vorlage/mobile.css');
  if (p.startsWith('/deal/')) {
    const f = path.normalize(path.join(ROOT, p));
    if (!f.startsWith(path.join(ROOT, 'deal'))) return null;
    return p.endsWith('/') ? path.join(f, 'index.html') : f;
  }
  return null;
}
function start(port = 0) {
  return new Promise(res => {
    const srv = http.createServer((req, resp) => {
      const f = resolve(req.url);
      if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { resp.writeHead(404); return resp.end('not found'); }
      resp.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(resp);
    });
    srv.listen(port, 'localhost', () => res({ srv, url: `http://localhost:${srv.address().port}` }));
  });
}
module.exports = { start };
if (require.main === module) start(Number(process.argv[2]) || 8080).then(({ url }) => console.log(url + '/deal/'));
