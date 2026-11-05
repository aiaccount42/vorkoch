// Mini-Test ohne Browser: Stub für document/window, dann alle Ansichten rendern und Klicks simulieren.
const fs = require('fs');
const vm = require('vm');
const _log = console.log; console.log = (...a) => { if (/FALSCH|PROBLEM/.test(a.join(' '))) process.exitCode = 1; _log(...a); };
const html = fs.readFileSync(__dirname + '/vorkoch.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const handlers = {};
const V_IDS = require('./engine.js').RECIPES.map(r => r.id).slice(0, -4);
const store = {};
const appEl = { innerHTML: '' };
const els = { app: appEl, offers: { value: 'Lachs, Feta' }, div: { value: '50' }, copybox: { innerHTML: '' }, prog: { textContent: '' } };
const win = { scrollTo() {}, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } } };
const doc = {
  getElementById: id => els[id] || null,
  querySelectorAll: () => [],
  addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); }
};
const fakeDB = {}; const timers = [];
const fakeGH = {}; let ghAuth = 'ok';
const fakeFetch = (url, opt) => {
  const g = /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/contents\/(.+)$/.exec(url);
  if (g) {
    if (!opt.headers.Authorization || opt.headers.Authorization !== 'Bearer github_pat_TESTTOKEN1234567890') return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    const key = g[1] + ':' + g[2];
    if (opt.method === 'PUT') { const b = JSON.parse(opt.body); if (fakeGH[key] && b.sha !== fakeGH[key].sha) return Promise.resolve({ ok: false, status: 409, json: () => Promise.resolve({}) }); fakeGH[key] = { sha: 'sha' + Object.keys(fakeGH).length + Date.now(), text: Buffer.from(b.content, 'base64').toString('utf8') }; return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }); }
    return fakeGH[key] ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ sha: fakeGH[key].sha, content: Buffer.from(fakeGH[key].text, 'utf8').toString('base64') }) }) : Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  }
  const m = /^https:\/\/demo-default-rtdb\.europe-west1\.firebasedatabase\.app(\/.*)\.json$/.exec(url);
  if (!m) return Promise.reject(new Error('bad url ' + url));
  if (opt && opt.method === 'PUT') { fakeDB[m[1]] = JSON.parse(JSON.stringify(JSON.parse(opt.body))); return Promise.resolve({ ok: true, json: () => Promise.resolve(fakeDB[m[1]]) }); }
  return Promise.resolve({ ok: true, json: () => Promise.resolve(fakeDB[m[1]] === undefined ? null : JSON.parse(JSON.stringify(fakeDB[m[1]]))) });
};
const ctx = { window: win, document: doc, localStorage: win.localStorage, navigator: { clipboard: { writeText: () => Promise.resolve() } }, console, Math, JSON, Date, Set, Object, Array, String, Number, Promise,
  fetch: fakeFetch, btoa, atob, TextEncoder, TextDecoder, Uint8Array, URL, Blob, setInterval: () => 0, setTimeout: (f) => { timers.push(f); return timers.length; }, clearTimeout: () => {}, location: { hash: '', href: 'https://x.github.io/vorkoch/', pathname: '/vorkoch/', search: '' }, history: { replaceState() {} } };
win.window = win; win.document = doc;
vm.createContext(ctx);
vm.runInContext(script, ctx);

function click(data) {
  const t = { closest: () => ({ dataset: data }), matches: () => false };
  handlers.click.forEach(f => f({ target: t }));
}
function bad(label) {
  const s = appEl.innerHTML;
  const probs = [];
  if (!s || s.length < 200) probs.push('zu kurz');
  ['undefined', 'NaN', '[object', 'null'].forEach(w => { if (s.includes(w)) probs.push('enthält ' + w + ' @ ' + s.slice(Math.max(0, s.indexOf(w) - 60), s.indexOf(w) + 60)); });
  console.log(label.padEnd(10), s.length.toString().padStart(6), 'Zeichen', probs.length ? 'PROBLEM: ' + probs.join(' | ') : 'ok');
}
['plan', 'shop', 'cook', 'recipes', 'settings'].forEach(t => { click({ act: 'tab', tab: t }); bad(t); });
click({ act: 'tab', tab: 'plan' });
click({ act: 'reroll' }); bad('reroll');
click({ act: 'offerplan' }); bad('angebote');
click({ act: 'wk', d: '1' }); bad('Woche vor'); click({ act: 'wk', d: '-1' }); bad('Woche zurück');
click({ act: 'recipe', rid: 'dal' }); bad('rezept-sheet'); click({ act: 'close' });
click({ act: 'cookstart', key: 's0' }); bad('kochmodus');
for (let i = 0; i < 30; i++) click({ act: 'cmnext' }); bad('kochmodus-ende');
click({ act: 'cookstart', key: 's1' }); click({ act: 'timer', id: 's1:0', min: '5', label: 'x' }); click({ act: 'cmnext' }); click({ act: 'timer', id: 's1:1', min: '8', label: 'y' }); bad('timer'); console.log(/data-tmr="s1:0"/.test(appEl.innerHTML) && /data-tmr="s1:1"/.test(appEl.innerHTML) ? 'zwei Timer parallel ok' : 'FEHLT parallele Timer'); click({ act: 'timerstop', id: 's1:0' }); console.log(!/data-tmr="s1:0"/.test(appEl.innerHTML) && /data-tmr="s1:1"/.test(appEl.innerHTML) ? 'Timer einzeln stoppen ok' : 'FEHLT einzeln stoppen'); click({ act: 'timerstop', id: 's1:1' }); click({ act: 'cmnext' }); click({ act: 'tadj', id: 's1:2', d: '1', m: '5' }); console.log(/Timer starten \(\d+ Min\)/.test(appEl.innerHTML) ? 'Timer-Zeit änderbar ok' : 'FEHLT Timer-Zeit'); click({ act: 'cmprev' }); click({ act: 'close' });
click({ act: 'filter', f: 'veg' }); click({ act: 'filter', f: 'off' }); click({ act: 'filter', f: 'all' });
click({ act: 'theme', t: 'dark' }); bad('theme'); click({ act: 'theme', t: 'auto' });
click({ act: 'tab', tab: 'recipes' });
click({ act: 'pool', rid: 'dal' }); bad('pool aus');
click({ act: 'pool', rid: 'dal' });
click({ act: 'tab', tab: 'shop' });
click({ act: 'copy' });
// Einstellungen ändern
const chg = (t) => handlers.change.forEach(f => f({ target: t }));
chg({ id: 'x', dataset: { set: 'protein', i: '1' }, value: '120', matches: () => false });
chg({ id: 'share', value: '80', dataset: {}, matches: () => false });
click({ act: 'tab', tab: 'settings' }); bad('settings2');
// viele Würfe: nie leer, nie Fehler
click({ act: 'tab', tab: 'plan' });
for (let i = 0; i < 40; i++) click({ act: 'reroll' });
bad('40 Würfe');
// alle Rezepte bis auf 4 deaktivieren -> Meldung statt Fehler
const ids = V_IDS; const _x = ['dal', 'shakshuka', 'tofucurry', 'halloumi', 'ofengemuese', 'frittata', 'linsensuppe', 'lachs_bulgur', 'lachs_curry', 'garnelen_pasta', 'ofenhaehnchen'];
click({ act: 'tab', tab: 'recipes' }); bad('rezepte');
click({ act: 'poolnone' }); bad('alle ab'); click({ act: 'copysel' }); click({ act: 'poolall' });
chg({ dataset: { pool: 'dal' }, checked: false, closest: () => null, matches: () => false });
chg({ dataset: { pool: 'dal' }, checked: true, closest: () => null, matches: () => false });
ids.forEach(id => click({ act: 'pool', rid: id }));
click({ act: 'tab', tab: 'plan' }); click({ act: 'reroll' }); bad('Pool klein');
console.log(appEl.innerHTML.includes('weniger als fünf') ? 'Pool-Meldung sichtbar' : 'KEINE Pool-Meldung');
click({ act: 'resetall' }); click({ act: 'resetall' }); bad('Reset');

// ---- Wochenraster
(function () {
  click({ act: 'tab', tab: 'plan' });
  click({ act: 'cell', k: '2d' }); bad('Feld-Sheet');
  console.log(appEl.innerHTML.includes('celltype') && appEl.innerHTML.includes('Automatisch') ? 'Feld-Sheet ok' : 'Feld-Sheet FEHLT');
  click({ act: 'celltype', t: 'f' }); bad('Feld frisch');
  click({ act: 'cellr', rid: 'dal' }); bad('Feld Rezept');
  console.log(/frisch gekocht<\/span><b>[^<]*Dal/i.test(appEl.innerHTML) || appEl.innerHTML.includes('frisch gekocht') ? 'frisches Feld sichtbar' : 'frisches Feld FEHLT');
  click({ act: 'cell', k: '3l' }); click({ act: 'celltype', t: 'o' }); bad('auswärts');
  console.log(appEl.innerHTML.includes('Auswärts') ? 'auswärts ok' : 'auswärts FEHLT');
  click({ act: 'cell', k: '6d' }); click({ act: 'celltype', t: 'p' }); click({ act: 'cellr', rid: '' }); bad('Feld Auto');
  console.log(/class="terms"/.test(appEl.innerHTML) && /Einkauf Sa davor/.test(appEl.innerHTML) && /tagsüber/.test(appEl.innerHTML) && !/Einkaufen und Kochen/.test(appEl.innerHTML) ? 'Termin-Kärtchen ok' : 'FEHLT Termin-Kärtchen');
  click({ act: 'sessadd' }); bad('Termin +');
  console.log(/data-tday/.test(appEl.innerHTML) && /Kochtermin \d/.test(appEl.innerHTML) ? 'Termin-Dialog nach + ok' : 'FEHLT Termin-Dialog');
  chg({ dataset: { tday: '' }, value: '2', matches: () => false }); bad('Termin Tag');
  chg({ dataset: { tmode: '' }, value: 'time', matches: () => false }); bad('Termin Uhrzeit an');
  console.log(/data-ttime/.test(appEl.innerHTML) ? 'Uhrzeitfeld erscheint ok' : 'FEHLT Uhrzeitfeld');
  chg({ dataset: { ttime: '' }, value: '17:30', matches: () => false }); bad('Termin Zeit');
  chg({ dataset: { tmode: '' }, value: 'day', matches: () => false }); bad('Termin tagsüber');
  console.log(!/data-ttime/.test(appEl.innerHTML) ? 'tagsüber blendet Uhrzeit aus ok' : 'FEHLT tagsüber');
  click({ act: 'sessdel', i: '3' }); bad('Termin -');
  click({ act: 'term', term: 'shop' }); bad('Einkauf-Dialog');
  chg({ dataset: { tday: '' }, value: '5', matches: () => false }); bad('Einkauf Tag');
  chg({ dataset: { twho: '' }, value: '1', matches: () => false }); bad('Einkauf wer');
  click({ act: 'close' });
  console.log(/Einkauf Fr/.test(appEl.innerHTML) ? 'Einkauf-Kärtchen aktualisiert ok' : 'FEHLT Einkauf-Kärtchen Update');
  click({ act: 'tab', tab: 'cook' }); bad('Kochen Tab');
  click({ act: 'tab', tab: 'shop' }); bad('Einkauf nach Raster');
  click({ act: 'tab', tab: 'settings' }); click({ act: 'ics' }); click({ act: 'icscopy' });
  click({ act: 'tab', tab: 'plan' }); click({ act: 'reroll' }); bad('Vorschlag');
  // ---- Wochen blättern: jede Woche bleibt erhalten
  const slots = html => (html.match(/<button class="slot[^>]*>.*?<\/button>/g) || []).join('');
  const label0 = (/<h1 class="ltitle">([^<]*)<\/h1>/.exec(appEl.innerHTML) || [])[1], s0 = slots(appEl.innerHTML);
  console.log('Wochenleiste:', /class="wbar"/.test(appEl.innerHTML) && /aria-label="Nächste Woche"/.test(appEl.innerHTML) && /Essensplan/.test(appEl.innerHTML) && !/Woche abschließen/.test(appEl.innerHTML) ? 'ok' : 'FEHLT Wochenleiste');
  click({ act: 'wk', d: '1' }); bad('Woche +1');
  const label1 = (/<h1 class="ltitle">([^<]*)<\/h1>/.exec(appEl.innerHTML) || [])[1], s1 = slots(appEl.innerHTML);
  console.log('Woche weiter:', label1 !== label0 && /In \d Wochen|Nächste Woche/.test(label1) ? 'ok' : 'FALSCH ' + label0 + ' / ' + label1);
  click({ act: 'wk', d: '-1' }); bad('Woche -1');
  console.log('Woche zurück unverändert:', slots(appEl.innerHTML) === s0 && (/<h1 class="ltitle">([^<]*)<\/h1>/.exec(appEl.innerHTML) || [])[1] === label0 ? 'ok' : 'FALSCH');
  const wk = JSON.parse(store['vorkoch.v1']).weeks; console.log('Wochen gespeichert:', Object.keys(wk).length === 2 ? 'ok' : 'FALSCH ' + Object.keys(wk).length);
  // Haken gelten pro Woche
  click({ act: 'tab', tab: 'shop' }); const key0 = /data-key="([a-z_0-9]+)"/.exec(appEl.innerHTML)[1]; chg({ dataset: { key: key0 }, checked: true, closest: () => null, matches: s => s.includes('checkbox') && !s.includes('xkey') });
  click({ act: 'tab', tab: 'plan' }); click({ act: 'wk', d: '1' }); click({ act: 'tab', tab: 'shop' });
  console.log('Haken pro Woche:', !/class="item done"/.test(appEl.innerHTML) ? 'ok' : 'FALSCH (Haken in anderer Woche sichtbar)');
  click({ act: 'tab', tab: 'plan' }); click({ act: 'wk', d: '-1' }); click({ act: 'tab', tab: 'shop' });
  console.log('Haken beim Zurückkommen da:', /class="item done"/.test(appEl.innerHTML) ? 'ok' : 'FALSCH');
  click({ act: 'tab', tab: 'plan' });
  // Termine einer Woche ändern wirkt nicht auf die andere
  click({ act: 'wk', d: '1' }); click({ act: 'term', term: 'shop' }); chg({ dataset: { tday: '' }, value: '3', matches: () => false }); click({ act: 'close' });
  const lab2 = /Einkauf Mi/.test(appEl.innerHTML); click({ act: 'wk', d: '-1' });
  console.log('Termine pro Woche:', lab2 && !/Einkauf Mi/.test(appEl.innerHTML) ? 'ok' : 'FALSCH');
  click({ act: 'wk', d: '-1' }); const prevOff = /aria-label="Vorherige Woche" disabled/.test(appEl.innerHTML);
  console.log('Vergangenheit begrenzt:', /Diese Woche|Letzte Woche|Nächste Woche|In \d Wochen|Vor \d Wochen/.test(appEl.innerHTML) ? 'ok' : 'FALSCH', prevOff ? '(Zurück gesperrt)' : '');
})();

// ---- neue Funktionen
(async () => {
  const flush = () => new Promise(r => setImmediate(r));
  const wait = async () => { for (let i = 0; i < 20; i++) await flush(); };
  click({ act: 'tab', tab: 'plan' });
  const rid0 = /data-act="rate" data-rid="([a-z_0-9]+)"/.exec(appEl.innerHTML)[1];
  click({ act: 'rate', rid: rid0, v: '1' }); bad('Bewertung');
  click({ act: 'rate', rid: rid0, v: '1' });
  click({ act: 'tab', tab: 'shop' });
  click({ act: 'shopview', v: 'laden' }); bad('Laden');
  console.log(appEl.innerHTML.includes('Marktkauf ·') && appEl.innerHTML.includes('Aldi Nord oder Lidl ·') ? 'Laden-Gruppen ok' : 'FEHLT Laden-Gruppen');
  const first = /data-act="store" data-id="([a-z_0-9]+)"/.exec(appEl.innerHTML);
  if (first) { click({ act: 'store', id: first[1] }); bad('Laden verschoben'); }
  click({ act: 'copy' });
  click({ act: 'shopview', v: 'gang' }); bad('Gang');
  click({ act: 'tab', tab: 'settings' }); bad('Mehr neu');
  chg({ dataset: { cook: 'so' }, value: '15:30', matches: () => false });
  click({ act: 'ics' }); click({ act: 'icscopy' });
  // Abgleich
  els.syncurl = { value: 'https://demo-default-rtdb.europe-west1.firebasedatabase.app/' };
  click({ act: 'connect' }); await wait();
  const keys = Object.keys(fakeDB);
  console.log('DB-Eintrag nach Verbinden:', keys.length === 1 && keys[0].startsWith('/vorkoch/') ? 'ok' : 'FEHLT ' + keys);
  const doc1 = fakeDB[keys[0]];
  console.log('Format:', doc1 && doc1.v === 2 && typeof doc1.plan === 'string' ? 'ok' : 'FALSCH');
  bad('Mehr verbunden');
  click({ act: 'tab', tab: 'plan' }); click({ act: 'tab', tab: 'settings' });
  console.log(appEl.innerHTML.includes('Abgeglichen um') ? 'Status ok' : 'Status fehlt');
  click({ act: 'invite' }); click({ act: 'snaplink' });
  click({ act: 'tab', tab: 'plan' }); click({ act: 'rate', rid: rid0, v: '-1' });
  timers.splice(0).forEach(f => f()); await wait();
  console.log('Bewertung im DB-Dokument:', fakeDB[keys[0]].ratings && fakeDB[keys[0]].ratings[rid0] && fakeDB[keys[0]].ratings[rid0][0] === -1 ? 'ok' : 'FEHLT');
  // fremde Änderung am Server kommt an
  const d2 = JSON.parse(JSON.stringify(fakeDB[keys[0]]));
  d2.ratings[rid0] = [1, Date.now() + 5000]; fakeDB[keys[0]] = d2;
  click({ act: 'tab', tab: 'settings' }); click({ act: 'syncnow' }); await wait();
  click({ act: 'tab', tab: 'plan' });
  console.log('Fremde Bewertung übernommen:', new RegExp('data-rid="' + rid0 + '" data-v="1" aria-pressed="true"').test(appEl.innerHTML) ? 'ok' : 'NEIN (dal evtl. nicht im Plan)');
  click({ act: 'tab', tab: 'settings' }); click({ act: 'disconnect' }); bad('getrennt');
  // Wer kocht / kauft, Land, Kalender-Abo
  click({ act: 'tab', tab: 'plan' }); bad('Plan Wer');
  console.log(!/data-swho/.test(appEl.innerHTML) && /data-motto/.test(appEl.innerHTML) ? 'Wer/Motto-Felder ok' : 'FEHLT Wer/Motto-Felder');
  chg({ dataset: { pwho: '0' }, value: '1', matches: () => false }); bad('Wer Termin 1');
  click({ act: 'cell', k: '1d' }); bad('Feld-Dialog'); console.log(/data-pwho=/.test(appEl.innerHTML) && /data-shopwho/.test(appEl.innerHTML) ? 'Wer im Feld-Dialog ok' : 'FEHLT Wer im Dialog'); click({ act: 'close' });
  console.log(/Partnerin kocht/.test(appEl.innerHTML) ? 'Wer-Wahl wirkt ok' : 'FEHLT Wer-Wahl');
  chg({ dataset: { shopwho: '' }, value: '0', matches: () => false }); bad('Wer kauft');
  chg({ dataset: { motto: '' }, value: 'Vietnam', matches: () => false }); bad('Motto');
  click({ act: 'reroll' }); bad('reroll Motto');
  click({ act: 'tab', tab: 'recipes' }); click({ act: 'country', c: 'Thailand' }); bad('Land');
  console.log(/Kokossuppe|Thai-Hack|Thai/.test(appEl.innerHTML) && !/Cacciatore/.test(appEl.innerHTML) ? 'Länderfilter ok' : 'FEHLT Länderfilter');
  click({ act: 'country', c: '' }); click({ act: 'carb', c: 'Kartoffel' }); bad('Beilage'); console.log(/Kartoffelpfanne/.test(appEl.innerHTML) && !/Linsen-Dal/.test(appEl.innerHTML) ? 'Beilagenfilter ok' : 'FEHLT Beilagenfilter'); click({ act: 'carb', c: '' }); click({ act: 'filter', f: 'rewe' }); console.log(/Pilzgulasch/.test(appEl.innerHTML) && !/Linsen-Dal/.test(appEl.innerHTML) ? 'REWE-Filter ok' : 'FEHLT REWE-Filter'); click({ act: 'filter', f: 'all' });
  click({ act: 'tab', tab: 'settings' }); bad('Kalender neu');
  els.calrepo = { value: 'https://github.com/roman/vorkoch.git' }; els.caltok = { value: 'github_pat_BAD' };
  click({ act: 'calsetup' }); console.log(/Token aus|nicht nach einem GitHub-Token/.test(appEl.innerHTML) ? 'falscher Token abgelehnt ok' : 'FEHLT Tokenprüfung');
  els.caltok = { value: 'github_pat_TESTTOKEN1234567890' };
  click({ act: 'calsetup' }); await wait(); bad('Kalender eingerichtet');
  const gk = Object.keys(fakeGH);
  console.log('3 Dateien veröffentlicht:', gk.length === 3 && gk.every(k => /^roman\/vorkoch:kalender\/[a-z0-9]{14}-(alle|0|1)\.ics$/.test(k)) ? 'ok' : 'FALSCH ' + gk);
  const fa = fakeGH[gk.find(k => k.endsWith('-alle.ics'))].text, f0 = fakeGH[gk.find(k => k.endsWith('-0.ics'))].text, f1 = fakeGH[gk.find(k => k.endsWith('-1.ics'))].text;
  console.log('ICS-Inhalt:', fa.startsWith('BEGIN:VCALENDAR') && /Mittag:|Abend:/.test(fa) && /Einkaufen \(Roman\)/.test(fa) && /Einkaufen \(du\)/.test(f0) && !/Einkaufen \(Roman\)/.test(f1) && (fa.match(/BEGIN:VEVENT/g) || []).length > (f0.match(/BEGIN:VEVENT/g) || []).length ? 'ok' : 'FALSCH');
  console.log('Zeitzone:', /TZID=Europe\/Berlin/.test(fa) ? 'ok' : 'FEHLT');
  console.log('Status-Hinweis:', /Veröffentlicht\. GitHub/.test(appEl.innerHTML) ? 'ok' : 'FEHLT');
  click({ act: 'calpub' }); await wait(); // zweites Mal: sha-Pfad
  console.log('Aktualisieren ok:', /Veröffentlicht\. GitHub/.test(appEl.innerHTML) && Object.keys(fakeGH).length === 3 ? 'ok' : 'FALSCH');
  const shaOf = () => Object.keys(fakeGH).map(k => fakeGH[k].sha).join(',');
  const sha0 = shaOf(); click({ act: 'calpub' }); await wait();
  console.log('Unveränderte Datei wird nicht neu geschrieben:', shaOf() === sha0 ? 'ok' : 'FALSCH');
  // automatisch: Änderung im Plan -> nach dem Timer ist die Datei neu
  const fa0 = fakeGH[gk.find(k => k.endsWith('-alle.ics'))].text;
  click({ act: 'tab', tab: 'plan' }); click({ act: 'cell', k: '2d' }); click({ act: 'celltype', t: 'o' }); await wait();
  timers.splice(0).forEach(f => f()); await wait();
  const fa1 = fakeGH[gk.find(k => k.endsWith('-alle.ics'))].text;
  console.log('Automatisch veröffentlicht nach Änderung:', fa1 !== fa0 && (fa1.match(/SUMMARY:(Mittag|Abend)/g) || []).length < (fa0.match(/SUMMARY:(Mittag|Abend)/g) || []).length ? 'ok' : 'FALSCH');
  const sha1 = shaOf(); timers.splice(0).forEach(f => f()); await wait(); click({ act: 'tab', tab: 'plan' }); timers.splice(0).forEach(f => f()); await wait();
  console.log('Ohne Änderung kein neuer Upload:', shaOf() === sha1 ? 'ok' : 'FALSCH');
  const goodTok = store['vorkoch.gh']; store['vorkoch.gh'] = 'github_pat_WRONGTOKEN123456789012';
  click({ act: 'cell', k: '2l' }); click({ act: 'celltype', t: 'o' }); timers.splice(0).forEach(f => f()); await wait();
  click({ act: 'tab', tab: 'plan' });
  console.log('Token-Fehler auf der Plan-Seite:', /nicht automatisch aktualisiert/.test(appEl.innerHTML) ? 'ok' : 'FEHLT');
  store['vorkoch.gh'] = goodTok;
  click({ act: 'tab', tab: 'settings' });
  click({ act: 'calcopy', w: '0' }); bad('Adresse');
  console.log('Token nicht im Speicher des Plans:', !JSON.stringify(store['vorkoch.v1']).includes('TESTTOKEN') ? 'ok' : 'LECK');
  click({ act: 'tab', tab: 'plan' }); console.log(/data-act="calpub"/.test(appEl.innerHTML) ? 'Plan-Knopf ok' : 'FEHLT Plan-Knopf');
  click({ act: 'tab', tab: 'settings' }); click({ act: 'caloff' }); bad('Kalender getrennt');
  // Einladung annehmen
  ctx.location.hash = ''; 
  console.log('Ende neue Tests');
})();
