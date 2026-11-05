// Jede Zutat jedes Rezepts erscheint genau einmal im Kochablauf (in einem Schritt oder unter "Dazu"), Mengen skalieren mit dem Faktor
const V = require('./engine.js'); let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FEHLER', m); } };
V.RECIPES.forEach(r => {
  const sc = V.sched([r]), a1 = V.stepAmounts(sc.events, () => 1), a2 = V.stepAmounts(sc.events, () => 2);
  const all = a1.flatMap(x => x.items.concat(x.extra)).filter(x => !x.startsWith('Wasser ca.'));
  ok(all.length === r.i.length, r.id + ' Zutaten ' + all.length + ' von ' + r.i.length);
  const g = a2.flatMap(x => x.items.concat(x.extra)).filter(x => !x.startsWith('Wasser ca.'));
  ok(g.length === all.length, r.id + ' Faktor 2');
});
const w = V.stepAmounts(V.sched([V.BY_ID.wok]).events, () => 1).flatMap(x => x.items);
ok(w.includes('240 g Vollkornreis') && w.some(x => x === 'Wasser ca. 500 ml'), 'Reis und Wasser: ' + w.join('|'));
const w2 = V.stepAmounts(V.sched([V.BY_ID.wok]).events, () => 2).flatMap(x => x.items);
ok(w2.includes('480 g Vollkornreis') && w2.some(x => x === 'Wasser ca. 950 ml'), 'Faktor 2: ' + w2.join('|'));
const w3 = V.stepAmounts(V.sched([V.BY_ID.wok]).events, () => 0.5).flatMap(x => x.items);
ok(w3.includes('120 g Vollkornreis'), 'halber Ansatz');
console.log(n - bad, '/', n, 'ok'); process.exit(bad ? 1 : 0);
