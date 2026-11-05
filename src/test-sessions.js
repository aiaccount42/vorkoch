const VK = require('./engine.js');
const st = { persons: [{ name: 'R', protein: 120 }, { name: 'P', protein: 90 }], share: 0.7, vegMin: 3, fishMax: 1 };
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
let bad = 0, runs = 0, unfill = 0, empties = 0;
const times = ['', '09:00', '17:00', '20:00'];
for (let it = 0; it < 150; it++) {
  const M = 1 + Math.floor(rnd() * 4), sess = [];
  while (sess.length < M) sess.push({ day: Math.floor(rnd() * 7), time: times[Math.floor(rnd() * 4)] });
  const g = VK.defaultGrid(); VK.CELLS.forEach(k => { g[k] = { t: 'x' }; });
  const np = 2 + Math.floor(rnd() * 9);
  VK.CELLS.filter(() => rnd() < np / 14).forEach(k => { g[k] = { t: 'p' }; });
  const res = VK.fillGrid(g, { pool: VK.RECIPES, settings: st, sess, noise: 0, rand: rnd });
  if (!res) continue; runs++;
  const b = VK.buildWeek(res.grid, sess, st);
  const first = Math.min(...sess.map(VK.sessTime));
  VK.CELLS.forEach(k => {
    const x = res.grid[k]; if (x.t !== 'p') return;
    if (VK.cellTime(k) < first) { unfill++; return; }
    if (!x.r) { empties++; console.log('LEER', k, JSON.stringify(sess)); bad++; return; }
    if (b.time[x.r] > VK.cellTime(k)) { bad++; console.log('ZU SPÄT', k, x.r, b.time[x.r], JSON.stringify(sess)); }
  });
  const cooked = b.sessions.filter(s => !s.fresh).reduce((n, s) => n + s.rs.length, 0);
  if (cooked !== Object.keys(VK.dishCounts(res.grid)).length) { bad++; console.log('Summe', cooked); }
}
console.log({ runs, bad, unfill, empties }); const sc = (() => { const sess = [{ day: 1, time: '' }, { day: 4, time: '' }], g = VK.defaultGrid(); VK.CELLS.forEach(k => { g[k] = { t: 'x' }; }); ['1d', '2l', '2d', '3l', '4d', '5l'].forEach(k => { g[k] = { t: 'p' }; }); return VK.demandSizes(g, sess, 3); })(); console.log('Mo+Do Größen', sc.join(','), sc.join(',') === '2,1' ? 'ok' : 'FEHLER'); process.exit(bad || sc.join(',') !== '2,1' ? 1 : 0);
