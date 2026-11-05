const assert = require('assert');
const V = require('./engine.js'), X = require('./extras.js');
const known = {}; V.RECIPES.forEach(r => { known[r.id] = 1; });
const gridOf = (ids) => V.placeTokens(V.defaultGrid(), V.DEFAULT_SESS, Object.fromEntries(ids.map(id => [id, 2])));
const WS = '2026-10-25', WS2 = '2026-11-01';
const week = (ids, key) => ({ grid: gridOf(ids), sess: V.DEFAULT_SESS.map(s => Object.assign({}, s)), shopAt: { day: -1, time: '10:00' }, key, relaxed: false });
const base = () => ({
  settings: { persons: [{ name: 'Roman', protein: 120 }, { name: 'Partnerin', protein: 90 }], share: .7, vegMin: 3, fishMax: 1, moCook: 0 },
  disabled: [], recent: [], history: [], checked: { key: '', map: {} },
  offers: '', diversity: .5, ratings: {}, storeOv: {},
  weeks: { [WS]: week(['dal', 'shakshuka', 'tofucurry', 'halloumi', 'ofengemuese'], 'k1') },
  mt: { m: { plan: 100, pool: 100, settings: 100, offers: 100 }, ratings: {}, storeOv: {}, checked: {}, weeks: { [WS]: 100 } }
});
// 1) gleichzeitig verschiedene Posten abhaken -> beide bleiben (Haken tragen die Woche im Schlüssel)
const A = base(), Bv = base();
A.checked.map[WS + '|skyr'] = true; A.mt.checked[WS + '|skyr'] = 200;
Bv.checked.map[WS + '|feta'] = true; Bv.mt.checked[WS + '|feta'] = 210;
let m = X.merge(X.toDoc(A), X.toDoc(Bv));
assert.deepStrictEqual(Object.keys(m.checked.map).sort(), [WS + '|feta', WS + '|skyr']);
// 2) derselbe Posten: der neuere gewinnt
A.checked.map[WS + '|eier'] = true; A.mt.checked[WS + '|eier'] = 300; Bv.checked.map[WS + '|eier'] = false; Bv.mt.checked[WS + '|eier'] = 400;
m = X.merge(X.toDoc(A), X.toDoc(Bv));
assert.strictEqual(m.checked.map[WS + '|eier'][0], false);
// 3) Wochen werden einzeln gemischt: die neuere Fassung einer Woche gewinnt, verschiedene Wochen bleiben beide erhalten
const C = base(); C.weeks[WS] = week(['chana', 'burrito', 'lasagne', 'hokkaido', 'moussaka'], 'k2'); C.mt.weeks[WS] = 500;
C.weeks[WS2] = week(['dal', 'shakshuka', 'tofucurry', 'halloumi', 'ofengemuese'], 'k3'); C.mt.weeks[WS2] = 450;
m = X.merge(X.toDoc(A), X.toDoc(C));
assert.deepStrictEqual(m.weeks[WS][0].grid, C.weeks[WS].grid); assert.ok(m.weeks[WS2]);
m = X.merge(X.toDoc(C), X.toDoc(A));
assert.deepStrictEqual(m.weeks[WS][0].grid, C.weeks[WS].grid); assert.strictEqual(Object.keys(m.weeks).length, 2);
const D1 = base(), D2 = base(); D1.weeks['2026-11-08'] = week(['dal', 'shakshuka', 'tofucurry', 'halloumi', 'ofengemuese'], 'a'); D1.mt.weeks['2026-11-08'] = 700;
D2.weeks['2026-11-15'] = week(['dal', 'shakshuka', 'tofucurry', 'halloumi', 'ofengemuese'], 'b'); D2.mt.weeks['2026-11-15'] = 710;
m = X.merge(X.toDoc(D1), X.toDoc(D2)); assert.strictEqual(Object.keys(m.weeks).length, 3);
// 4) Pool und Einstellungen getrennt: A ändert Pool, B Einstellungen
const P = base(), Q = base(); P.disabled = ['dal']; P.mt.m.pool = 600; Q.settings.vegMin = 4; Q.mt.m.settings = 700;
m = X.merge(X.toDoc(P), X.toDoc(Q));
assert.deepStrictEqual(m.pool.disabled, ['dal']); assert.strictEqual(m.settings.settings.vegMin, 4);
// 5) Idempotenz und Reihenfolge-Unabhängigkeit
assert.ok(X.same(X.merge(X.toDoc(P), X.toDoc(Q)), X.merge(X.toDoc(Q), X.toDoc(P))));
assert.ok(X.same(X.merge(X.toDoc(D1), X.toDoc(D2)), X.merge(X.toDoc(D2), X.toDoc(D1))));
const dm = X.merge(X.toDoc(P), X.toDoc(Q)); assert.ok(X.same(X.merge(dm, dm), dm));
// 6) fremde Daten werden geprüft
const T = base();
const evil = X.toDoc(base());
evil.weeks[WS][0].grid['0l'] = { t: 'p', r: 'nix' };                                   // unbekanntes Rezept wird verworfen, die Woche bleibt
evil.weeks['2026-11-01'] = [{ grid: base().weeks[WS].grid, sess: [{ day: 9, time: 'abc' }], shopAt: { day: -1, time: '' }, key: 'x' }, 1];   // ungültige Termine: ganze Woche weg
evil.weeks['kaputt'] = [base().weeks[WS], 1];
evil.pool.disabled = ['dal', '<script>']; evil.offers = 'x'.repeat(2000);
evil.settings.settings.persons[0].protein = 99999; evil.ratings = { dal: [5, 1], shakshuka: [1, 1], bad: [1, 1] }; evil.storeOv = { skyr: ['m', 1], '../x': ['m', 1], feta: ['zz', 1] };
evil.checked.map = { [WS + '|skyr']: [true, 1], 'skyr': [true, 1], '../x|a': [true, 1] };
X.applyDoc(T, evil, known);
assert.deepStrictEqual(Object.keys(T.weeks), [WS]); assert.strictEqual(T.weeks[WS].grid['0l'].r, undefined); assert.strictEqual(T.weeks[WS].grid['0l'].t, 'p');
assert.deepStrictEqual(T.disabled, ['dal']); assert.strictEqual(T.offers.length, 600); assert.deepStrictEqual(Object.keys(T.checked.map), [WS + '|skyr']);
assert.strictEqual(T.settings.persons[0].protein, 220); assert.deepStrictEqual(T.ratings, { shakshuka: 1 }); assert.deepStrictEqual(T.storeOv, { skyr: 'm' });
assert.strictEqual(X.applyDoc(T, null, known), false); assert.strictEqual(X.applyDoc(T, { v: 1 }, known), false);
// 7) Round trip toDoc/pack/unpack/applyDoc
const R = base(); R.ratings = { dal: 1 }; R.mt.ratings = { dal: 9 }; R.checked.map[WS + '|skyr'] = true; R.mt.checked[WS + '|skyr'] = 5; R.weeks[WS2] = week(['chana', 'burrito', 'lasagne', 'hokkaido', 'moussaka'], 'k9'); R.mt.weeks[WS2] = 55;
const R2 = base(); X.applyDoc(R2, X.unpack(X.pack(X.toDoc(R))), known);
assert.ok(X.same(X.toDoc(R), X.toDoc(R2)));
// 7b) altes Dokument (Fassung 1, nur eine Woche) wird gelesen und in die neue Form gebracht
{
  const o = base(), wk = o.weeks[WS];
  const old = { v: 1, m: { plan: 100, pool: 100, settings: 100, offers: 100 }, plan: JSON.stringify({ grid: wk.grid, sess: wk.sess, shopAt: wk.shopAt, key: 'k1', weekStart: WS, recent: ['k0'], history: [['dal']], relaxed: false }),
    pool: JSON.stringify({ disabled: [] }), settings: JSON.stringify({ settings: o.settings, diversity: .5, motto: '', cal: null }), offers: '', ratings: {}, storeOv: {}, checked: { key: WS + '/1', map: { skyr: [true, 5], v_salz: [true, 6] } } };
  const d = X.unpack(old); assert.strictEqual(d.v, 2); assert.ok(d.weeks[WS] && d.weeks[WS][1] === 100);
  const T7 = base(); T7.weeks = {}; X.applyDoc(T7, d, known);
  assert.ok(T7.weeks[WS] && T7.weeks[WS].key === 'k1'); assert.deepStrictEqual(Object.keys(T7.checked.map).sort(), [WS + '|skyr', WS + '|v_salz']); assert.deepStrictEqual(T7.history, [['dal']]);
}
// 8) Teilen per Link
const h = X.encodeShare('s', { a: 'Äpfel & Öl €', n: [1, 2] }), dd = X.decodeShare(h);
assert.strictEqual(dd.kind, 's'); assert.strictEqual(dd.data.a, 'Äpfel & Öl €'); assert.strictEqual(X.decodeShare('#s=!!!'), null); assert.strictEqual(X.decodeShare('#x=abc'), null);
// 9) Kalenderdatei
const ics = X.buildICS({ weekStart: '2026-10-25', shop: { day: -1, time: '10:00' }, shopText: 'Liste, mit Komma; und Semikolon\nZeile 2',
  sessions: [{ key: 's0', day: 0, time: '16:00', who: 'Ihr kocht zusammen', mk: 40, thaw: [], dishes: ['Linsensuppe'], events: [{ start: 0, rs: 'Linsensuppe', tn: 'Suppe', m: 12, t: 'Zwiebeln würfeln' }] },
    { key: 's1', day: 1, time: '18:30', w: '0', who: 'Roman kocht', mk: 67, thaw: ['Hähnchen (TK)'], dishes: ['A', 'B'], events: [{ start: 0, rs: 'A', tn: 'A', m: 5, t: 'x'.repeat(300) }] },
    { key: 'fx', day: 3, time: '18:00', fresh: true, who: 'Frisch', mk: 30, thaw: [], dishes: ['Dal'], events: [{ start: 0, rs: 'Dal', tn: 'Dal', m: 5, t: 'Kochen' }] }] });
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 5); // Einkauf, Kochen So, Auftauen Mo, Kochen Mo, Frisch Mi
assert.ok(ics.includes('SUMMARY:Frisch kochen (zusammen): Dal') && ics.includes('DTSTART;TZID=Europe/Berlin:20261028T180000'));
assert.ok(ics.includes('DTSTART;TZID=Europe/Berlin:20261024T100000')); assert.ok(ics.includes('DTSTART;TZID=Europe/Berlin:20261025T160000') && ics.includes('DTEND;TZID=Europe/Berlin:20261025T164000'));
assert.ok(ics.includes('DTSTART;TZID=Europe/Berlin:20261026T183000') && ics.includes('DTEND;TZID=Europe/Berlin:20261026T193700'));
assert.ok(ics.includes('DTSTART;TZID=Europe/Berlin:20261025T190000'), 'Auftauen am Vorabend');
assert.ok(ics.replace(/\r\n /g, '').includes('Liste\\, mit Komma\\; und Semikolon\\nZeile 2'));
// 9b) pro Person, Mahlzeiten, Zeitzone
const inp = { weekStart: '2026-10-25', shop: { day: 2, time: '17:00', w: '1' }, shopText: 'x', names: ['Roman', 'Partnerin'], meals: [{ day: 1, meal: 'd', name: 'Dal', note: 'vorgekocht' }],
  sessions: [{ key: 's0', day: 0, time: '16:00', w: '0', who: 'Roman kocht', mk: 30, thaw: [], dishes: ['A'], events: [] }, { key: 's1', day: 1, time: '18:00', w: '1', who: 'P kocht', mk: 30, thaw: [], dishes: ['B'], events: [] }, { key: 's2', day: 4, time: '18:00', w: 'b', who: 'z', mk: 30, thaw: [], dishes: ['C'], events: [] }] };
const cnt = s => (s.match(/BEGIN:VEVENT/g) || []).length;
const iA = X.buildICS(Object.assign({ filter: 'all' }, inp)), i0 = X.buildICS(Object.assign({ filter: '0' }, inp)), i1 = X.buildICS(Object.assign({ filter: '1' }, inp));
assert.strictEqual(cnt(iA), 5); assert.strictEqual(cnt(i0), 3); assert.strictEqual(cnt(i1), 4);   // alle: Einkauf+3 Kochen+Essen; Roman: A, C, Essen; Partnerin: Einkauf, B, C, Essen
assert.ok(i0.includes('Vorkochen (du): A') && i0.includes('Vorkochen (zusammen): C') && !i0.includes(': B'));
assert.ok(i1.includes('Einkaufen (du)') && iA.includes('Vorkochen (Roman): A') && iA.includes('Einkaufen (Partnerin)'));
assert.ok(iA.includes('SUMMARY:Abend: Dal') && iA.includes('DTSTART;TZID=Europe/Berlin:20261026T193000'));
assert.ok(iA.includes('BEGIN:VTIMEZONE') && iA.includes('X-WR-TIMEZONE:Europe/Berlin'));
// 9c) Wer, Küche der Woche und Kalender-Ziel wandern und werden geprüft
{
  const A1 = base(), w1 = A1.weeks[WS]; w1.sess[1].w = '1'; w1.shopAt.w = '0'; w1.grid['2d'] = { t: 'f', r: 'dal', u: 1, w: '0' }; A1.motto = 'Italien'; A1.cal = { repo: 'roman/vorkoch', secret: 'abcdefghij1234' };
  const d1 = X.unpack(X.pack(X.toDoc(A1))), T = base(); T.mt = { m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} };
  X.applyDoc(T, d1, known);
  const tw = T.weeks[WS]; assert.strictEqual(tw.sess[1].w, '1'); assert.strictEqual(tw.shopAt.w, '0'); assert.strictEqual(tw.grid['2d'].w, '0'); assert.strictEqual(T.motto, 'Italien'); assert.deepStrictEqual(T.cal, A1.cal);
  const bad = JSON.parse(JSON.stringify(X.toDoc(A1))); bad.settings.cal = { repo: '../x', secret: 'A' }; bad.settings.motto = '<b>'; bad.weeks[WS][0].sess[1].w = 'zz'; bad.weeks[WS][0].shopAt.w = 'q';
  const T2 = base(); T2.mt = { m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} }; X.applyDoc(T2, bad, known);
  assert.strictEqual(T2.cal, null); assert.strictEqual(T2.motto, ''); assert.strictEqual(T2.weeks[WS].sess[1].w, undefined); assert.strictEqual(T2.weeks[WS].shopAt.w, undefined);
}
// 9d) Länder und neue Rezepte
assert.strictEqual(V.RECIPES.length, 59); V.RECIPES.forEach(r => assert.ok(r.country));
['Italien', 'Deutschland', 'Thailand', 'Vietnam'].forEach(c => assert.ok(V.countries().find(x => x.name === c && x.n >= 3), c));
// Motto zieht: mit Vietnam kommen im Schnitt mehr vietnamesische Gerichte
{
  const cntC = (motto) => { let n = 0; for (let k = 0; k < 20; k++) { const r = V.fillGrid(V.defaultGrid(), { pool: V.RECIPES, settings: base().settings, diversity: .5, history: [], offers: '', avoid: [], ratings: {}, sess: V.DEFAULT_SESS, motto }); n += V.CELLS.filter(c => r.grid[c].r && V.BY_ID[r.grid[c].r].country === 'Vietnam').length; } return n; };
  assert.ok(cntC('Vietnam') > cntC(''), 'Motto wirkt');
}
ics.split('\r\n').forEach(l => assert.ok(Buffer.byteLength(l) <= 75, 'zu lang: ' + l.length));
// 10) Bewertungen wirken auf die Planung, harte Regeln bleiben
function freq(ratings) {
  let seed = 7; const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const n = {};
  for (let i = 0; i < 60; i++) {
    const r = V.plan({ pool: V.RECIPES, settings: { persons: [{ protein: 120 }, { protein: 90 }], share: .7, vegMin: 3, fishMax: 1 }, diversity: .5, history: [], ratings, rand });
    const rs = r.ids.map(id => V.BY_ID[id]);
    assert.strictEqual(rs.length, 5);
    assert.ok(rs.filter(x => x.kind === 'veg').length >= 3 && rs.filter(x => x.kind === 'fisch').length <= 1);
    r.ids.forEach(id => { n[id] = (n[id] || 0) + 1; });
  }
  return n;
}
const f0 = freq({}), fUp = freq({ chana: 1 }), fDown = freq({ chana: -1 });
console.log('chana neutral/hoch/runter:', f0.chana || 0, fUp.chana || 0, fDown.chana || 0);
assert.ok((fUp.chana || 0) >= (f0.chana || 0) && (fDown.chana || 0) < (f0.chana || 0) + 1);

// 11) Wochenraster
const st0 = { persons: [{ name: 'R', protein: 120 }, { name: 'P', protein: 90 }], share: .7, vegMin: 3, fishMax: 1 };
function weekCheck(grid, sess, label) {
  const res = V.fillGrid(grid, { pool: V.RECIPES, settings: st0, sess, noise: .3 });
  assert.ok(res, label + ': Ergebnis');
  const g = res.grid, b = V.buildWeek(g, sess, st0);
  // jede p-Zelle mit Gericht: Gericht ist vor der Mahlzeit gekocht
  V.CELLS.forEach(k => { const x = g[k]; if (x.t === 'p' && x.r) assert.ok(b.time[x.r] <= V.cellTime(k), label + ': ' + k + ' vor dem Kochen'); if (x.t === 'f') assert.ok(x.r, label + ': frisch ohne Rezept'); if (x.t === 'o' || x.t === 'x') assert.ok(!x.r); });
  // jedes Gericht höchstens 2 Mahlzeiten pro Portion-Satz
  Object.keys(b.counts).forEach(id => assert.ok(b.counts[id] <= 2, label + ': ' + id + ' ' + b.counts[id] + 'x'));
  // frisches Hack nicht im letzten Termin
  const lastS = b.sessions.filter(s => !s.fresh).slice(-1)[0];
  if (lastS && b.sessions.filter(s => !s.fresh).length > 1) lastS.rs.forEach(r => assert.ok(!r.early, label + ': early im letzten Termin'));
  return { g, b };
}
for (let i = 0; i < 15; i++) weekCheck(V.defaultGrid(), V.DEFAULT_SESS, 'default');
const g1 = V.defaultGrid(); g1['2d'] = { t: 'f' }; g1['3l'] = { t: 'o' }; g1['5d'] = { t: 'f', r: 'dal', u: 1 }; g1['6l'] = { t: 'p', r: 'gigantes', u: 1 }; g1['1l'] = { t: 'p', r: 'dal', u: 1 };
for (let i = 0; i < 15; i++) { const { g, b } = weekCheck(g1, V.DEFAULT_SESS, 'gemischt'); assert.strictEqual(g['5d'].r, 'dal'); assert.strictEqual(g['6l'].r, 'gigantes'); assert.ok(b.sessions.some(s => s.fresh)); }
const g2 = V.defaultGrid(); V.CELLS.forEach(k => { g2[k] = { t: 'p' }; });
for (let i = 0; i < 5; i++) weekCheck(g2, [{ day: 0, time: '16:00' }, { day: 3, time: '18:00' }], '14 Felder, 2 Termine');
const g3 = V.defaultGrid(); V.CELLS.forEach(k => { g3[k] = { t: 'x' }; });
const w3 = weekCheck(g3, V.DEFAULT_SESS, 'leer'); assert.strictEqual(w3.b.sessions.length, 0); assert.strictEqual(w3.b.shop.items.length, 0);
// Remap verschiebt nichts Gesetztes
const r4 = V.remapGrid(V.fillGrid(g1, { pool: V.RECIPES, settings: st0, sess: V.DEFAULT_SESS }).grid, V.DEFAULT_SESS);
assert.strictEqual(r4['5d'].r, 'dal');
// frische Gerichte kommen in halber Menge in den Einkauf
const gf = V.defaultGrid(); V.CELLS.forEach(k => { gf[k] = { t: 'x' }; }); gf['2d'] = { t: 'f', r: 'dal', u: 1 };
const bf = V.buildWeek(gf, V.DEFAULT_SESS, st0), full = V.shop([V.BY_ID.dal]), half = bf.shop;
const lin = id => (half.items.find(x => x.id === id) || {}).need, linF = id => (full.items.find(x => x.id === id) || {}).need;
V.BY_ID.dal.i.forEach(([id]) => { if (lin(id) !== undefined) assert.ok(Math.abs(lin(id) - linF(id) / 2) < 1e-6, 'halbe Menge ' + id); });
// 10) Ohne Uhrzeit: Ganztagstermine; Sync akzeptiert leere Zeit
const adIcs = X.buildICS({ weekStart: '2026-10-25', shop: { day: -1, time: '' }, shopText: 'L', names: ['A', 'B'], meals: [], sessions: [
  { key: 's0', day: 0, time: '', fresh: false, w: 'b', who: 'x', mk: 60, thaw: [], dishes: ['A'], events: [{ start: 0, rs: 'A', t: 'x' }] },
  { key: 's1', day: 1, time: '17:30', fresh: false, w: 'b', who: 'x', mk: 60, thaw: [], dishes: ['B'], events: [{ start: 0, rs: 'B', t: 'y' }] }] });
assert.ok(/DTSTART;VALUE=DATE:20261024/.test(adIcs) && /DTSTART;VALUE=DATE:20261025/.test(adIcs) && /DTSTART;TZID=Europe\/Berlin:20261026T173000/.test(adIcs), 'Ganztag und Uhrzeit gemischt');
const RT = base(); RT.weeks[WS].sess = [{ day: 0, time: '' }, { day: 3, time: '17:30' }]; RT.weeks[WS].shopAt = { day: -1, time: '' };
const RT2 = base(); X.applyDoc(RT2, X.toDoc(RT), known);
assert.deepStrictEqual(RT2.weeks[WS].sess.map(s => s.time), ['', '17:30']); assert.strictEqual(RT2.weeks[WS].shopAt.time, '');
// 10b) mehrere Wochen in einer Kalenderdatei
const two = { weekStart: '2026-10-25', shop: { day: -1, time: '' }, shopText: 'a', names: ['A', 'B'], meals: [], sessions: [{ key: 's0', day: 0, time: '', fresh: false, w: 'b', who: 'x', mk: 60, thaw: [], dishes: ['A'], events: [] }],
  more: [{ weekStart: '2026-11-01', shop: { day: -1, time: '' }, shopText: 'b', names: ['A', 'B'], meals: [], sessions: [{ key: 's0', day: 0, time: '', fresh: false, w: 'b', who: 'x', mk: 60, thaw: [], dishes: ['B'], events: [] }] }] };
const twoIcs = X.buildICS(two); assert.strictEqual((twoIcs.match(/BEGIN:VEVENT/g) || []).length, 4); assert.ok(/UID:einkauf-2026-10-25@vorkoch/.test(twoIcs) && /UID:einkauf-2026-11-01@vorkoch/.test(twoIcs) && /DTSTART;VALUE=DATE:20261101/.test(twoIcs));
console.log('test-extras ok');
