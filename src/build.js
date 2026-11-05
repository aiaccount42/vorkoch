const fs = require('fs');
const CACHE_V = 24; /* bei jeder neuen Version erhöhen, sonst zeigt die App den alten Stand */
const d = __dirname + '/';
const css = fs.readFileSync(d + 'style.css', 'utf8');
const eng = fs.readFileSync(d + 'engine.js', 'utf8');
const app = fs.readFileSync(d + 'app.js', 'utf8').replace('__CACHE_V__', String(CACHE_V));
const art = fs.readFileSync(d + 'art.js', 'utf8');
const ext = fs.readFileSync(d + 'extras.js', 'utf8');
const icons = {
  plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  shop: '<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  cook: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h2M20 10h2M9 3c0 1.6 1 1.6 1 3.5M14 3c0 1.6 1 1.6 1 3.5"/>',
  recipes: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'
};
const tabs = [['plan', 'Woche'], ['shop', 'Einkauf'], ['cook', 'Kochen'], ['recipes', 'Rezepte'], ['settings', 'Mehr']];
const nav = '<nav id="tabs" aria-label="Bereiche"><div class="in">' +
  tabs.map(([k, l]) => '<button type="button" data-act="tab" data-tab="' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[k] + '</svg>' + l + '</button>').join('') + '</div></nav>';
const html =
  '<title>Vorkoch</title>\n' +
  '<meta name="claude:viewport-fit-sides" content="cover">\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">\n' +
  '<meta name="theme-color" content="#F2F2F7">\n' +
  '<style>\n' + css + '</style>\n' +
  '<div id="app"></div>\n' + nav + '\n' +
  '<script>\n' + eng + '\n' + art + '\n' + ext + '\n' + app + '\n</script>\n';
fs.writeFileSync(d + 'vorkoch.html', html);
console.log('geschrieben', html.length, 'Bytes');

/* Hosting-Variante (GitHub Pages oder Netlify): mit Manifest, Icon und Offline-Cache */
/* Ausgabe: liegt der Code in einem Ordner "src", gehen die fertigen Dateien in den Ordner darüber (Repo-Hauptordner = GitHub Pages).
   Sonst nach dist/. Mit OUT=pfad überschreibbar. */
const path = require('path');
const dist = (process.env.OUT ? path.resolve(process.env.OUT) : path.basename(path.resolve(d)) === 'src' ? path.resolve(d, '..') : path.resolve(d, 'dist')) + '/';
if (!fs.existsSync(dist)) fs.mkdirSync(dist);
const head = '<!doctype html>\n<html lang="de"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Vorkoch">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<link rel="icon" href="icon-192.png">\n';
const reg = '<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}</script>\n';
fs.writeFileSync(dist + 'index.html', head + html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + reg + '</head><body></body></html>'.replace('</head><body></body></html>', ''));
fs.writeFileSync(dist + 'manifest.webmanifest', JSON.stringify({
  name: 'Vorkoch', short_name: 'Vorkoch', description: 'Wochenplan, Einkauf und Meal Prep', lang: 'de',
  start_url: './', scope: './', display: 'standalone', background_color: '#F2F2F7', theme_color: '#F2F2F7',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 2));
fs.writeFileSync(dist + 'sw.js', "var C='vorkoch-v" + CACHE_V + "';var F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];\n" +
  "self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F);}).then(function(){return self.skipWaiting();}));});\n" +
  "self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});\n" +
  "self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;var u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.indexOf('/kalender/')>=0)return;e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(C).then(function(x){x.put(e.request,c);});return r;}).catch(function(){return caches.match(e.request).then(function(m){return m||caches.match('index.html');});}));});\n");
