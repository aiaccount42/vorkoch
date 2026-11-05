// Zwei Geräte gegen eine Fake-Datenbank: Verbinden per Einladung, Bewertung, Haken, Pool-Änderung wandern hin und her.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(__dirname + '/vorkoch.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const DB = {};
const fetchF = (url, opt) => {
  const m = /^https:\/\/demo-default-rtdb\.europe-west1\.firebasedatabase\.app(\/.*)\.json$/.exec(url);
  if (!m) return Promise.reject(new Error('bad url'));
  if (opt && opt.method === 'PUT') { DB[m[1]] = JSON.parse(opt.body); return Promise.resolve({ ok: true, json: () => Promise.resolve(DB[m[1]]) }); }
  return Promise.resolve({ ok: true, json: () => Promise.resolve(DB[m[1]] === undefined ? null : JSON.parse(JSON.stringify(DB[m[1]]))) });
};
function device(hash) {
  const h = {}, store = {}, timers = [], appEl = { innerHTML: '' }, els = { app: appEl, offers: { value: '' } };
  const win = { scrollTo() {} };
  const doc = { getElementById: id => els[id] || null, querySelectorAll: () => [], addEventListener: (t, f) => { (h[t] = h[t] || []).push(f); } };
  const loc = { hash: hash || '', href: 'https://x.github.io/vorkoch/', pathname: '/vorkoch/', search: '' };
  const ls = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const ctx = { window: win, document: doc, localStorage: ls, navigator: {}, console, Math, JSON, Date, Set, Object, Array, String, Number, Promise, fetch: fetchF, btoa, atob, TextEncoder, TextDecoder, Uint8Array,
    setInterval: () => 0, setTimeout: f => { timers.push(f); return 1; }, clearTimeout() {}, location: loc, history: { replaceState() {} } };
  win.window = win; win.document = doc; vm.createContext(ctx); vm.runInContext(script, ctx);
  const click = d => h.click.forEach(f => f({ target: { closest: () => ({ dataset: d }), matches: () => false } }));
  const chg = t => h.change.forEach(f => f({ target: t }));
  const st = () => JSON.parse(store['vorkoch.v1'] || '{}');
  const flush = async () => { for (let i = 0; i < 30; i++) await new Promise(r => setImmediate(r)); };
  const fire = async () => { timers.splice(0).forEach(f => f()); await flush(); };
  return { click, chg, st, flush, fire, appEl, loc };
}
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok     ' : 'FEHLER ') + m); if (!c) fails++; };
run().catch(e => { console.log(e); process.exit(1); });
async function run() {
  const code = 'abcd2345wxyz';
  // Zustand via Einladungs-Hash auf A2 beitreten (leere DB -> A2 legt an)
  const share = '#j=' + Buffer.from(JSON.stringify({ u: 'https://demo-default-rtdb.europe-west1.firebasedatabase.app', c: code })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const D1 = device(share);
  ok(/Gemeinsamer Plan/.test(D1.appEl.innerHTML) && /joinok/.test(D1.appEl.innerHTML), 'Einladung zeigt Bestätigung');
  D1.click({ act: 'joinok' }); await D1.flush();
  const shopK = Object.keys(DB).filter(k => /-einkauf\//.test(k)), shopD = shopK.length ? DB[shopK[0]] : null;
  ok(Object.keys(DB).length - shopK.length === 1, 'Gerät 1 legt Dokument an');
  ok(shopK.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(shopD.shop) && shopD.items.length > 0 && shopD.items.every(x => x.id && x.n && x.q && 'ds'.length && x.a), 'Wochenliste liegt neben dem Plan');
  const ids1 = JSON.stringify(D1.st().grid);
  const D2 = device(share);
  D2.click({ act: 'joinok' }); await D2.flush();
  ok(JSON.stringify(D2.st().grid) === ids1, 'Gerät 2 übernimmt den Plan von Gerät 1');
  // Bewertung auf 2
  const rid = Object.values(D2.st().grid).find(c => c.r).r;
  D2.click({ act: 'rate', rid, v: '-1' }); await D2.fire();
  D1.click({ act: 'syncnow' }); await D1.flush();
  ok(D1.st().ratings[rid] === -1, 'Bewertung von 2 kommt auf 1 an');
  // Haken auf 1
  D1.click({ act: 'tab', tab: 'shop' });
  const m = /data-key="([a-z_0-9]+)"/.exec(D1.appEl.innerHTML);
  D1.chg({ dataset: { key: m[1] }, checked: true, closest: () => null, matches: s => s.includes('checkbox') && !s.includes('xkey') && !s.includes('bkey') });
  await D1.fire(); D2.click({ act: 'syncnow' }); await D2.flush();
  ok(D2.st().checked.map[D1.st().weekStart + '|' + m[1]] === true, 'Haken von 1 kommt auf 2 an');
  // Pool: 2 nimmt Rezept raus, 1 sieht es
  D2.click({ act: 'pool', rid: 'dal' }); await D2.fire();
  D1.click({ act: 'syncnow' }); await D1.flush();
  ok(D1.st().disabled.includes('dal'), 'Pool-Änderung wandert');
  // Alles wieder aufnehmen (leeres Array!) muss ebenfalls ankommen
  D2.click({ act: 'poolall' }); await D2.fire();
  D1.click({ act: 'syncnow' }); await D1.flush();
  ok(D1.st().disabled.length === 0, 'Leerer Pool-Ausschluss wandert (leere Arrays)');
  // Neu würfeln auf 1 -> Plan auf 2, Haken zurückgesetzt
  D1.click({ act: 'tab', tab: 'plan' }); D1.click({ act: 'reroll' }); await D1.fire();
  D2.click({ act: 'syncnow' }); await D2.flush();
  ok(JSON.stringify(D2.st().grid) === JSON.stringify(D1.st().grid), 'Neuer Plan wandert');
  ok(Object.values(D2.st().checked.map).every(v => !v), 'Haken gehören zum alten Plan und sind weg');
  // Feld ändern und Kochtermin verschieben wandern
  D2.click({ act: 'tab', tab: 'plan' }); D2.click({ act: 'cell', k: '3l' }); D2.click({ act: 'celltype', t: 'o' }); D2.click({ act: 'term', term: '0' }); D2.chg({ dataset: { tday: '' }, value: '2', matches: () => false }); await D2.fire();
  D1.click({ act: 'syncnow' }); await D1.flush();
  ok(D1.st().grid['3l'].t === 'o', 'Feldtyp wandert');
  ok(D1.st().sess.some(s => s.day === 2), 'Kochtermin wandert');
  ok(JSON.stringify(D1.st().grid) === JSON.stringify(D2.st().grid), 'Raster identisch');
  console.log(fails ? fails + ' FEHLER' : 'alles ok');
  process.exit(fails ? 1 : 0);
}
