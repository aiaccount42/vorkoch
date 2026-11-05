// Berichtsskript: Rezepte, Zeitpläne und ein Beispielwochenplan
const VK = require('./engine.js');
const st = { persons: [{ name: 'Roman', protein: 120 }, { name: 'Partnerin', protein: 90 }], share: 0.7, vegMin: 3, fishMax: 1 };
console.log('--- Rezepte pro Portion ---');
VK.RECIPES.forEach(r => console.log(r.nu.p >= 38 ? 'ok ' : 'LOW', r.id.padEnd(15), 'P', r.nu.p.toFixed(1).padStart(5), 'g  kcal', Math.round(r.nu.k).toString().padStart(4)));
console.log('\n--- Plan mit Standardraster ---');
const t0 = Date.now();
const res = VK.fillGrid(VK.defaultGrid(), { pool: VK.RECIPES, settings: st, sess: VK.DEFAULT_SESS, noise: 0 });
const b = VK.buildWeek(res.grid, VK.DEFAULT_SESS, st);
console.log('Zeit', Date.now() - t0, 'ms');
VK.CELLS.forEach(k => console.log(k, res.grid[k].t, res.grid[k].r || ''));
b.sessions.forEach(s => {
  console.log('Tag', s.day, s.time, s.rs.map(r => r.short).join(' + '), VK.fmtDur(s.sched.mk), 'aktiv', VK.fmtDur(s.sched.active), s.thaw.length ? 'auftauen: ' + s.thaw.join(', ') : '');
});
console.log('\n--- Einkauf ---');
b.shop.items.forEach(x => console.log(x.a.padEnd(14), x.n.padEnd(26), x.txt.padEnd(28), 'Bedarf', x.needTxt.padEnd(12), x.rest ? 'REST ' + x.leftTxt : ''));
console.log('Vorrat:', b.shop.vorrat.map(x => x.n).join(', '));
console.log(b.stats);
