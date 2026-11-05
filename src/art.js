/* Vorkoch: gezeichnete Gerichtsbilder. Jedes Rezept bekommt eine kleine Illustration von oben, aus seinen Zutaten und seiner Zubereitungsart gebaut.
   Reine Funktion: VA.art(rezept, { thumb }) -> SVG-Text. Keine Fotos, keine fremden Bilder. */
(function (root) {
  'use strict';
  const W = 320, H = 180, CX = 160, CY = 92;

  /* Zutat -> [Farbe, Form, Größe]. Alles, was hier fehlt (Gewürze, Öl, Soßen), wird nicht gezeichnet. */
  const VIS = {
    linsen: ['#C9772E', 'dot', 3.2], berglinsen: ['#6E5233', 'dot', 3.2], linsen_dose: ['#7A5A38', 'dot', 3.2],
    spinat: ['#2F8F4A', 'leaf', 9], tomaten: ['#D8402D', 'chunk', 8], reis: ['#FBF6EA', 'grain'], kichererbsen: ['#E2B866', 'dot', 4.2],
    feta: ['#FFFDF4', 'cube', 6], paprika: ['#E5462C', 'strip', 10], zucchini: ['#78B552', 'coin', 6], halloumi: ['#F1D58A', 'slice', 9],
    bulgur: ['#E3C687', 'grain'], couscous: ['#EBD39A', 'grain'], quinoa: ['#E8D8A8', 'grain'], brokkoli: ['#2E7D3A', 'floret', 6], tofu: ['#F3E4BD', 'cube', 7],
    karotten: ['#F28C28', 'coin', 5], huehnchen: ['#D9A86C', 'chunk', 9], lachs: ['#F4906F', 'fillet'], seelachs: ['#EFE4D2', 'fillet'], garnelen: ['#F59A72', 'shrimp'],
    nudeln: ['#EFD28A', 'pasta'], reisnudeln: ['#F3E6C0', 'pasta'], ramen: ['#F0D585', 'pasta'], eier: ['#FFF6D6', 'egg'], kartoffeln: ['#E9C97F', 'wedge', 9],
    suesskartoffel: ['#EC9A44', 'wedge', 9], champignons: ['#CDB89C', 'mush', 7], lauch: ['#A9CF74', 'ring', 5], aubergine: ['#5E3F7C', 'chunk', 8], mais: ['#F7D43B', 'dot', 3.4],
    kidney: ['#8E2D2D', 'dot', 4], weisse: ['#F4EEDB', 'dot', 4.2], erbsen: ['#6EBE46', 'dot', 3.6], putenhack: ['#9B5E3E', 'crumb'], rinderhack: ['#8A4B33', 'crumb'],
    mozzarella: ['#FFFFFF', 'cube', 6], brot: ['#CFA062', 'chunk', 9], hokkaido: ['#EA7F2A', 'chunk', 8], blumenkohl: ['#F2EEE2', 'floret', 6], wok: ['#5DAA4B', 'strip', 9],
    spaetzle: ['#E9CC7B', 'crumb'], schweinefilet: ['#D7A079', 'chunk', 9], cabanossi: ['#A8452F', 'coin', 6], rindergulasch: ['#8A4B33', 'chunk', 9],
    salat: ['#79B955', 'leaf', 9], gurke: ['#9ACD6A', 'coin', 6], polenta: ['#F2CB4E', 'cube', 8], kuerbiskerne: ['#6F8F3C', 'dot', 3], walnuesse: ['#B58A5A', 'chunk', 6],
    thunfisch: ['#C98F7B', 'chunk', 8], aprikosen: ['#F4A640', 'chunk', 6], huettenkaese: ['#FFFFFF', 'crumb']
  };
  const GARNISH = { skyr: 1, frischkaese: 1, petersilie: 1, zitrone: 1, parmesan: 1 };

  /* Zubereitungsart je Gericht */
  const CAT = {
    linsensuppe: 'soup', hokkaido: 'soup', bohneneintopf: 'soup', linseneintopf: 'soup', pho: 'soup', kokossuppe: 'soup', cabanossi_eintopf: 'soup', ramen_tofu: 'soup', chili: 'soup', chili_sin: 'soup',
    dal: 'curry', tofucurry: 'curry', lachs_curry: 'curry', chana: 'curry', palak_tofu: 'curry', butter_chicken: 'curry', curry_couscous: 'curry', karibisch: 'curry', tajine: 'curry',
    pilzgulasch: 'curry', kartoffelpfanne: 'curry', seelachs: 'curry', erdnuss_tofu: 'curry', teriyaki: 'curry', wok: 'curry',
    garnelen_pasta: 'pasta', bolognese: 'pasta', thunfisch_pasta: 'pasta', stroganoff: 'pasta', geschnetzeltes: 'pasta', cacciatore: 'pasta', kuerbis_pasta: 'pasta', viet_nudel: 'pasta',
    burrito: 'bowl', viet_hack: 'bowl', thai_hack: 'bowl', linsen_bowl: 'bowl', halloumi: 'bowl', thunfisch_bohnen: 'bowl',
    lasagne: 'bake', enchilada: 'bake', moussaka: 'bake', kartoffelauflauf: 'bake', hack_polenta: 'bake', gigantes: 'bake', ratatouille: 'bake', ofengemuese: 'bake', blumenkohl_ofen: 'bake',
    shakshuka: 'pan', frittata: 'pan',
    ofenhaehnchen: 'tray', shawarma: 'tray', koefte: 'tray', frikadellen: 'tray', lachs_kartoffel: 'tray', lachs_bulgur: 'tray', lachs_spinat_reis: 'tray', seelachs_lauch: 'tray', spinatknoedel: 'tray'
  };

  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const mk = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const f = n => Math.round(n * 10) / 10;
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = i => Math.max(0, Math.min(255, Math.round(((n >> i) & 255) * k))); return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; };

  /* ---- einzelne Zutaten zeichnen ---- */
  function piece(kind, c, x, y, s, R) {
    const rot = Math.round(R() * 180), st = shade(c, .78);
    const g = 'transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"';
    switch (kind) {
      case 'dot': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * (.8 + R() * .4)) + '" fill="' + c + '"/>';
      case 'chunk': return '<rect x="' + f(x - s / 2) + '" y="' + f(y - s * .4) + '" width="' + f(s) + '" height="' + f(s * .8) + '" rx="2.4" fill="' + c + '" stroke="' + st + '" stroke-width=".8" ' + g + '/>';
      case 'cube': return '<rect x="' + f(x - s / 2) + '" y="' + f(y - s / 2) + '" width="' + f(s) + '" height="' + f(s) + '" rx="1.6" fill="' + c + '" stroke="' + st + '" stroke-width=".7" ' + g + '/>';
      case 'coin': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s) + '" fill="' + c + '" stroke="' + st + '" stroke-width=".8"/><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * .5) + '" fill="none" stroke="' + st + '" stroke-width=".6" opacity=".55"/>';
      case 'strip': return '<rect x="' + f(x - s * .8) + '" y="' + f(y - s * .22) + '" width="' + f(s * 1.6) + '" height="' + f(s * .44) + '" rx="' + f(s * .22) + '" fill="' + c + '" ' + g + '/>';
      case 'leaf': return '<g ' + g + '><ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(s * .85) + '" ry="' + f(s * .42) + '" fill="' + c + '"/><path d="M' + f(x - s * .8) + ' ' + f(y) + 'H' + f(x + s * .8) + '" stroke="' + shade(c, .7) + '" stroke-width=".8"/></g>';
      case 'floret': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * .75) + '" fill="' + c + '"/><circle cx="' + f(x - s * .5) + '" cy="' + f(y + s * .25) + '" r="' + f(s * .5) + '" fill="' + c + '"/><circle cx="' + f(x + s * .5) + '" cy="' + f(y + s * .2) + '" r="' + f(s * .5) + '" fill="' + c + '"/><circle cx="' + f(x) + '" cy="' + f(y - s * .1) + '" r="' + f(s * .3) + '" fill="' + shade(c, 1.2) + '" opacity=".5"/>';
      case 'wedge': return '<path d="M' + f(x - s * .6) + ' ' + f(y + s * .35) + 'Q' + f(x) + ' ' + f(y - s * .7) + ' ' + f(x + s * .6) + ' ' + f(y + s * .35) + 'Z" fill="' + c + '" stroke="' + st + '" stroke-width=".8" stroke-linejoin="round" ' + g + '/>';
      case 'slice': return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(s * .6) + '" ry="' + f(s * .38) + '" fill="' + c + '" stroke="' + st + '" stroke-width=".8" ' + g + '/><path d="M' + f(x - s * .35) + ' ' + f(y) + 'H' + f(x + s * .35) + '" stroke="' + shade(c, .85) + '" stroke-width="1" ' + g + '/>';
      case 'ring': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * .7) + '" fill="none" stroke="' + c + '" stroke-width="2.2"/>';
      case 'mush': return '<path d="M' + f(x - s * .65) + ' ' + f(y) + 'a' + f(s * .65) + ' ' + f(s * .55) + ' 0 0 1 ' + f(s * 1.3) + ' 0z" fill="' + c + '" stroke="' + st + '" stroke-width=".7" ' + g + '/><rect x="' + f(x - s * .15) + '" y="' + f(y) + '" width="' + f(s * .3) + '" height="' + f(s * .4) + '" fill="#EFE3D0" ' + g + '/>';
      case 'crumb': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2.4" fill="' + c + '"/><circle cx="' + f(x + 3) + '" cy="' + f(y + 2) + '" r="2" fill="' + shade(c, .85) + '"/><circle cx="' + f(x - 2) + '" cy="' + f(y + 3) + '" r="1.8" fill="' + shade(c, 1.1) + '"/>';
      case 'grain': return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="2.6" ry="1.2" fill="' + c + '" ' + g + '/>';
      case 'egg': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="9" fill="#FFFFFF" stroke="#E7DFC8" stroke-width=".8"/><circle cx="' + f(x) + '" cy="' + f(y) + '" r="4" fill="#F6B21A"/>';
      case 'fillet': return '<path d="M' + f(x - 15) + ' ' + f(y) + 'Q' + f(x - 12) + ' ' + f(y - 9) + ' ' + f(x) + ' ' + f(y - 8) + 'Q' + f(x + 14) + ' ' + f(y - 7) + ' ' + f(x + 17) + ' ' + f(y) + 'Q' + f(x + 12) + ' ' + f(y + 9) + ' ' + f(x) + ' ' + f(y + 8) + 'Q' + f(x - 12) + ' ' + f(y + 8) + ' ' + f(x - 15) + ' ' + f(y) + 'Z" fill="' + c + '" stroke="' + st + '" stroke-width=".8" ' + g + '/>';
      case 'shrimp': return '<path d="M' + f(x - 7) + ' ' + f(y + 4) + 'Q' + f(x - 8) + ' ' + f(y - 7) + ' ' + f(x + 2) + ' ' + f(y - 6) + 'Q' + f(x + 9) + ' ' + f(y - 4) + ' ' + f(x + 6) + ' ' + f(y + 4) + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" ' + g + '/>';
      case 'herb': return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="1.5" fill="' + c + '"/>';
      default: return '';
    }
  }

  /* Bestandteile eines Gerichts: Zutaten mit Darstellung, ohne Gewürze, in Rezeptreihenfolge */
  function parts(r) {
    const seen = {}, out = [];
    r.i.forEach(([id]) => { if (VIS[id] && !seen[id]) { seen[id] = 1; out.push({ id, c: VIS[id][0], k: VIS[id][1], s: VIS[id][2] || 5 }); } });
    return out;
  }
  const has = (r, id) => r.i.some(x => x[0] === id);

  function sauceColor(r) {
    if (has(r, 'kokos') && (has(r, 'currypaste') || has(r, 'curry'))) return '#E9B65A';
    if (has(r, 'kokos')) return '#EFD9A6';
    if (has(r, 'tomaten') || has(r, 'tomatenmark')) return has(r, 'skyr') || has(r, 'frischkaese') ? '#D5603F' : '#C63D28';
    if (has(r, 'hokkaido')) return '#E8862E';
    if (has(r, 'linsen')) return '#D98F3F';
    if (has(r, 'spinat') && has(r, 'frischkaese')) return '#8DB66A';
    if (has(r, 'sojasauce')) return '#8A5A32';
    if (has(r, 'skyr') || has(r, 'frischkaese') || has(r, 'paprikapulver')) return '#E7C18A';
    return '#C99A5C';
  }
  const grainOf = r => ['reis', 'couscous', 'bulgur', 'quinoa', 'spaetzle', 'polenta'].find(id => has(r, id)) || '';

  /* ---- Bausteine ---- */
  const inCircle = (R, rad) => { const a = R() * 6.2832, d = Math.sqrt(R()) * rad; return [Math.cos(a) * d, Math.sin(a) * d]; };
  function scatter(list, n, cx, cy, rad, R, skip) {
    let s = '';
    if (!list.length) return s;
    for (let i = 0; i < n; i++) {
      const p = list[i % list.length]; if (skip && skip[p.id]) continue;
      const [dx, dy] = inCircle(R, rad);
      s += piece(p.k, p.c, cx + dx, cy + dy, p.s, R);
    }
    return s;
  }
  const plate = (cx, cy, rad) => '<circle cx="' + cx + '" cy="' + (cy + 5) + '" r="' + (rad + 2) + '" fill="#000" opacity=".13"/><circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="#FBFAF6" stroke="#E4DED2" stroke-width="1.5"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (rad - 9) + '" fill="none" stroke="#EFEADF" stroke-width="2"/>';
  const bowlRim = (cx, cy, rad, liquid) => '<circle cx="' + cx + '" cy="' + (cy + 5) + '" r="' + (rad + 2) + '" fill="#000" opacity=".15"/><circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="#F3EFE6" stroke="#DCD5C6" stroke-width="1.5"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (rad - 9) + '" fill="' + liquid + '"/><circle cx="' + (cx - 10) + '" cy="' + (cy - 12) + '" r="' + (rad - 26) + '" fill="#fff" opacity=".1"/>';
  const dollop = (x, y, s) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + s + '" fill="#FFFFFF" stroke="#E8E2D4" stroke-width=".8"/><path d="M' + f(x - s * .5) + ' ' + f(y) + 'q' + f(s * .5) + ' ' + f(-s * .7) + ' ' + f(s) + ' 0" fill="none" stroke="#E3DCCB" stroke-width="1"/>';
  const lemon = (x, y) => '<path d="M' + (x - 9) + ' ' + y + 'a9 9 0 0 1 18 0z" fill="#F6E25A" stroke="#D9C43A" stroke-width=".9"/><path d="M' + x + ' ' + y + 'v-8M' + (x - 5) + ' ' + y + 'l2-7M' + (x + 5) + ' ' + y + 'l-2-7" stroke="#FBF1A6" stroke-width=".8"/>';
  const herbs = (cx, cy, rad, R, n) => { let s = ''; for (let i = 0; i < n; i++) { const [dx, dy] = inCircle(R, rad); s += piece('herb', '#3E9A45', cx + dx, cy + dy, 1, R); } return s; };

  /* ---- Maler ---- */
  function paintSoup(r, P, R) {
    const liq = sauceColor(r), rad = 66;
    let s = bowlRim(CX, CY, rad, liq);
    const pcs = P.filter(p => !['reis', 'nudeln', 'brot', 'reisnudeln', 'ramen'].includes(p.id));
    if (has(r, 'reisnudeln') || has(r, 'ramen')) { for (let i = 0; i < 9; i++) { const a = R() * 3, x = CX - 28 + R() * 40, y = CY - 20 + i * 7; s += '<path d="M' + f(x) + ' ' + f(y) + 'q18 -6 36 0" fill="none" stroke="' + VIS[has(r, 'ramen') ? 'ramen' : 'reisnudeln'][0] + '" stroke-width="3.2" stroke-linecap="round"/>'; } }
    s += scatter(pcs, 26, CX, CY, rad - 18, R);
    if (has(r, 'reis') && !has(r, 'kokos')) s += scatter([{ id: 'reis', c: '#FBF6EA', k: 'grain' }], 20, CX + 18, CY + 14, 20, R);
    if (has(r, 'eier')) s += piece('egg', '#fff', CX + 26, CY - 22, 1, R);
    if (has(r, 'skyr')) s += dollop(CX - 4, CY + 2, 12);
    s += herbs(CX, CY, rad - 20, R, 10);
    if (has(r, 'brot')) s += '<rect x="228" y="36" width="52" height="22" rx="8" fill="#CFA062" stroke="#B98745" stroke-width="1" transform="rotate(-18 254 47)"/>';
    return s;
  }
  function paintCurry(r, P, R) {
    const sc = sauceColor(r), gr = grainOf(r);
    let s = plate(CX, CY, 68);
    s += '<path d="M' + (CX - 52) + ' ' + (CY + 6) + 'C' + (CX - 56) + ' ' + (CY - 40) + ' ' + (CX - 8) + ' ' + (CY - 50) + ' ' + (CX + 4) + ' ' + (CY - 14) + 'C' + (CX + 12) + ' ' + (CY + 26) + ' ' + (CX + 2) + ' ' + (CY + 50) + ' ' + (CX - 28) + ' ' + (CY + 48) + 'C' + (CX - 52) + ' ' + (CY + 44) + ' ' + (CX - 48) + ' ' + (CY + 28) + ' ' + (CX - 52) + ' ' + (CY + 6) + 'Z" fill="' + sc + '" stroke="' + shade(sc.length === 7 ? sc : '#C99A5C', .8) + '" stroke-width="1"/>';
    const pcs = P.filter(p => !['reis', 'couscous', 'bulgur', 'quinoa', 'spaetzle', 'polenta', 'kokos'].includes(p.id));
    s += scatter(pcs, 16, CX - 24, CY, 26, R);
    if (gr) {
      const col = gr === 'polenta' ? '#F2CB4E' : (VIS[gr] ? VIS[gr][0] : '#FBF6EA');
      s += '<ellipse cx="' + (CX + 32) + '" cy="' + (CY + 2) + '" rx="25" ry="36" fill="' + (gr === 'reis' ? '#FFFFFF' : col) + '" opacity=".96" stroke="#E5DFD0" stroke-width="1"/>';
      s += scatter([{ id: gr, c: gr === 'reis' ? '#EDE4CF' : shade(col, .85), k: gr === 'spaetzle' ? 'crumb' : 'grain' }], 34, CX + 32, CY + 2, 24, R);
    }
    if (has(r, 'skyr') || has(r, 'frischkaese')) s += dollop(CX - 14, CY - 4, 9);
    s += herbs(CX - 16, CY, 28, R, 8);
    if (has(r, 'zitrone')) s += lemon(CX + 44, CY + 52);
    if (has(r, 'erdnussbutter') || has(r, 'sojasauce')) s += '<circle cx="' + (CX + 52) + '" cy="' + (CY - 40) + '" r="2" fill="#FBF6EA" opacity=".9"/>';
    return s;
  }
  function paintPasta(r, P, R) {
    const noodle = has(r, 'reisnudeln') ? '#F3E6C0' : '#EFD28A', sc = sauceColor(r);
    let s = plate(CX, CY, 68);
    for (let i = 0; i < 9; i++) { const rr = 8 + i * 5.4, ox = (R() - .5) * 5, oy = (R() - .5) * 5; s += '<circle cx="' + f(CX + ox) + '" cy="' + f(CY + oy) + '" r="' + f(rr) + '" fill="none" stroke="' + noodle + '" stroke-width="4.2" opacity="' + f(.75 + R() * .25) + '"/>'; }
    s += '<circle cx="' + (CX + 2) + '" cy="' + (CY - 2) + '" r="26" fill="' + sc + '" opacity=".8"/>';
    const pcs = P.filter(p => !['nudeln', 'reisnudeln', 'ramen'].includes(p.id));
    s += scatter(pcs, 18, CX, CY - 2, 30, R);
    if (has(r, 'eier') || has(r, 'wok')) s += scatter([{ id: 'wok', c: '#5DAA4B', k: 'strip', s: 8 }], 5, CX, CY, 34, R);
    if (has(r, 'skyr')) s += dollop(CX + 4, CY - 4, 9);
    s += herbs(CX, CY, 34, R, 12);
    return s;
  }
  function paintBowl(r, P, R) {
    let s = bowlRim(CX, CY, 68, '#F8F4EA');
    const secs = P.filter(p => p.k !== 'pasta' && !GARNISH[p.id]).slice(0, 5), n = Math.max(3, secs.length), rad = 59;
    secs.forEach((p, i) => {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, big = (a1 - a0) > Math.PI ? 1 : 0;
      const x0 = CX + rad * Math.cos(a0), y0 = CY + rad * Math.sin(a0), x1 = CX + rad * Math.cos(a1), y1 = CY + rad * Math.sin(a1);
      const base = p.k === 'grain' ? '#FDFBF4' : p.k === 'dot' || p.k === 'crumb' ? shade(p.c, .55) : '#F4EFE2';
      s += '<path d="M' + CX + ' ' + CY + 'L' + f(x0) + ' ' + f(y0) + 'A' + rad + ' ' + rad + ' 0 ' + big + ' 1 ' + f(x1) + ' ' + f(y1) + 'Z" fill="' + base + '" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>';
      const am = (a0 + a1) / 2;
      for (let j = 0; j < 14; j++) { const aa = a0 + (a1 - a0) * (.12 + R() * .76), dd = 14 + R() * (rad - 22); s += piece(p.k === 'pasta' ? 'strip' : p.k, p.c, CX + dd * Math.cos(aa), CY + dd * Math.sin(aa), p.s, R); }
    });
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="13" fill="#FFFFFF" stroke="#E8E2D4" stroke-width=".9"/>';
    if (has(r, 'skyr')) s += '<circle cx="' + CX + '" cy="' + CY + '" r="8" fill="#F8F6EE"/>'; else if (has(r, 'eier')) s += '<circle cx="' + CX + '" cy="' + CY + '" r="6" fill="#F6B21A"/>'; else if (has(r, 'zitrone')) s += '<circle cx="' + CX + '" cy="' + CY + '" r="7" fill="#F6E25A"/>';
    return s;
  }
  function paintBake(r, P, R) {
    const cheesy = has(r, 'mozzarella') || has(r, 'parmesan') || has(r, 'huettenkaese') || has(r, 'feta') || has(r, 'skyr') || has(r, 'eier');
    const top = has(r, 'moussaka') ? '#E6C27A' : cheesy ? '#E4B24C' : (sauceColor(r));
    const x = 54, y = 34, w = 212, h = 116;
    let s = '<rect x="' + (x + 3) + '" y="' + (y + 8) + '" width="' + w + '" height="' + h + '" rx="20" fill="#000" opacity=".14"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="20" fill="#8F8B84"/><rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="' + (w - 12) + '" height="' + (h - 12) + '" rx="15" fill="#B9B5AD"/>';
    s += '<rect x="' + (x + 12) + '" y="' + (y + 12) + '" width="' + (w - 24) + '" height="' + (h - 24) + '" rx="11" fill="' + top + '"/>';
    // gebräunte Flecken
    for (let i = 0; i < 14; i++) { const px = x + 22 + R() * (w - 44), py = y + 22 + R() * (h - 44); s += '<ellipse cx="' + f(px) + '" cy="' + f(py) + '" rx="' + f(5 + R() * 9) + '" ry="' + f(3 + R() * 5) + '" fill="' + shade(top.length === 7 ? top : '#E4B24C', .82) + '" opacity=".55"/>'; }
    const pcs = P.filter(p => !['nudeln'].includes(p.id));
    for (let i = 0; i < 30; i++) { const p = pcs[i % Math.max(1, pcs.length)]; if (!p) break; s += piece(p.k, p.c, x + 24 + R() * (w - 48), y + 24 + R() * (h - 48), p.s * .9, R); }
    // Portionsschnitte
    s += '<path d="M' + (x + w / 2) + ' ' + (y + 14) + 'v' + (h - 28) + 'M' + (x + 16) + ' ' + (y + h / 2) + 'h' + (w - 32) + '" stroke="#000" stroke-opacity=".13" stroke-width="1.6" stroke-linecap="round"/>';
    s += herbs(x + w / 2, y + h / 2, 70, R, 12);
    return s;
  }
  function paintPan(r, P, R) {
    const shak = has(r, 'tomaten');
    let s = '<circle cx="' + (CX - 6) + '" cy="' + (CY + 6) + '" r="70" fill="#000" opacity=".15"/><rect x="' + (CX + 56) + '" y="' + (CY - 8) + '" width="70" height="16" rx="8" fill="#3B3A38"/>';
    s += '<circle cx="' + (CX - 8) + '" cy="' + CY + '" r="70" fill="#34322F"/><circle cx="' + (CX - 8) + '" cy="' + CY + '" r="62" fill="' + (shak ? '#C63D28' : '#F2C94C') + '"/>';
    if (shak) {
      s += scatter(P.filter(p => ['tomaten', 'paprika', 'kichererbsen', 'zwiebel'].includes(p.id)), 22, CX - 8, CY, 52, R);
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + .5, px = CX - 8 + Math.cos(a) * 28, py = CY + Math.sin(a) * 28; s += piece('egg', '#fff', px, py, 1, R); }
      s += scatter([{ id: 'feta', c: '#FFFDF4', k: 'cube', s: 5 }], 8, CX - 8, CY, 44, R);
      s += herbs(CX - 8, CY, 50, R, 14);
    } else {
      s += scatter(P.filter(p => ['spinat', 'kartoffeln'].includes(p.id)), 18, CX - 8, CY, 50, R);
      s += scatter([{ id: 'feta', c: '#FFFDF4', k: 'cube', s: 5 }], 8, CX - 8, CY, 48, R);
      s += '<path d="M' + (CX - 8) + ' ' + (CY - 56) + 'V' + (CY + 56) + 'M' + (CX - 62) + ' ' + CY + 'H' + (CX + 46) + 'M' + (CX - 46) + ' ' + (CY - 38) + 'L' + (CX + 30) + ' ' + (CY + 38) + 'M' + (CX + 30) + ' ' + (CY - 38) + 'L' + (CX - 46) + ' ' + (CY + 38) + '" stroke="#B8892E" stroke-opacity=".35" stroke-width="1.4"/>';
    }
    return s;
  }
  function paintTray(r, P, R) {
    let s = plate(CX, CY, 68);
    const id = r.id;
    if (id === 'spinatknoedel') {
      [[-24, -14], [10, -22], [-6, 14]].forEach(([dx, dy]) => { s += '<circle cx="' + (CX + dx) + '" cy="' + (CY + dy) + '" r="19" fill="#9DBF6E" stroke="#7FA254" stroke-width="1.2"/>'; s += scatter([{ id: 'p', c: '#6A8F3C', k: 'dot', s: 1.6 }], 8, CX + dx, CY + dy, 15, R); });
      s += scatter([{ id: 'parmesan', c: '#F3E3A5', k: 'herb' }], 18, CX, CY, 34, R).replace(/r="1.5"/g, 'r="2"');
      s += dollop(CX + 36, CY + 22, 11);
      return s;
    }
    // Eiweiß-Teil links
    if (has(r, 'huehnchen')) {
      [[-34, -14, -20], [-30, 14, 18]].forEach(([dx, dy, a]) => { s += '<g transform="rotate(' + a + ' ' + (CX + dx) + ' ' + (CY + dy) + ')"><ellipse cx="' + (CX + dx) + '" cy="' + (CY + dy) + '" rx="18" ry="11" fill="#C8873F" stroke="#A66B2A" stroke-width="1"/><rect x="' + (CX + dx + 14) + '" y="' + (CY + dy - 3) + '" width="14" height="6" rx="3" fill="#F3E9D6" stroke="#D9CDB3" stroke-width=".8"/><circle cx="' + (CX + dx + 29) + '" cy="' + (CY + dy - 3) + '" r="3.4" fill="#F3E9D6"/><circle cx="' + (CX + dx + 29) + '" cy="' + (CY + dy + 3) + '" r="3.4" fill="#F3E9D6"/></g>'; });
    } else if (has(r, 'lachs') || has(r, 'seelachs')) {
      const c = has(r, 'seelachs') ? (has(r, 'brot') ? '#E2B56B' : '#EFE4D2') : '#F4906F';
      s += piece('fillet', c, CX - 30, CY - 2, 1, () => .5).replace(/ ?transform="[^"]*"/, ' transform="scale(1.5) translate(' + f(-(CX - 30) / 3) + ' ' + f(-(CY - 2) / 3) + ')"');
    } else if (has(r, 'putenhack') || has(r, 'rinderhack')) {
      [[-36, -18], [-30, 14], [-8, -2]].forEach(([dx, dy]) => { s += '<circle cx="' + (CX + dx) + '" cy="' + (CY + dy) + '" r="14" fill="#9B5E3E" stroke="#7B4529" stroke-width="1.2"/><circle cx="' + (CX + dx - 4) + '" cy="' + (CY + dy - 4) + '" r="5" fill="#fff" opacity=".12"/>'; });
    } else {
      s += scatter(P.slice(0, 2), 5, CX - 30, CY, 14, R);
    }
    // Beilagen rechts
    const sides = P.filter(p => ['kartoffeln', 'suesskartoffel', 'brokkoli', 'erbsen', 'couscous', 'bulgur', 'reis', 'zucchini', 'paprika', 'blumenkohl', 'kichererbsen', 'lauch', 'spinat', 'karotten'].includes(p.id)).slice(0, 3);
    sides.forEach((p, i) => {
      const bx = CX + 26 + (i % 2) * 6, by = CY - 30 + i * 28;
      if (p.k === 'grain') s += '<ellipse cx="' + bx + '" cy="' + by + '" rx="22" ry="12" fill="' + (p.id === 'reis' ? '#FFFFFF' : p.c) + '" stroke="#E5DFD0"/>' + scatter([{ id: p.id, c: shade(p.c, .85), k: 'grain' }], 16, bx, by, 14, R);
      else s += scatter([p], p.k === 'dot' ? 14 : 5, bx, by, 17, R);
    });
    if (has(r, 'skyr') || has(r, 'frischkaese')) s += dollop(CX + 44, CY + 34, 9);
    if (has(r, 'zitrone')) s += lemon(CX - 6, CY + 44);
    s += herbs(CX, CY, 46, R, 8);
    return s;
  }

  const PAINT = { soup: paintSoup, curry: paintCurry, pasta: paintPasta, bowl: paintBowl, bake: paintBake, pan: paintPan, tray: paintTray };
  const cache = {};

  function art(r, o) {
    const thumb = !!(o && o.thumb), key = r.id + (thumb ? 't' : '');
    if (cache[key]) return cache[key];
    const R = mk(hash(r.id)), h = hash(r.cuisine || r.id) % 360, P = parts(r), kind = CAT[r.id] || 'bowl';
    const c1 = 'hsl(' + h + ',42%,86%)', c2 = 'hsl(' + ((h + 28) % 360) + ',44%,76%)', gid = 'vg' + hash(key).toString(36);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="' + (thumb ? 'xMidYMid slice' : 'xMidYMid slice') + '" role="img" aria-label="Illustration: ' + String(r.short || r.name).replace(/[<>&"]/g, '') + '" class="dart">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + gid + ')"/>';
    // Tischtuch: feine Streifen und ein Zipfel Serviette
    s += '<g opacity=".16" stroke="#fff" stroke-width="10">' + [0, 1, 2, 3, 4, 5, 6, 7].map(i => '<path d="M' + (i * 48 - 20) + ' -10l-40 200"/>').join('') + '</g>';
    if (!thumb) s += '<path d="M268 0h52v70z" fill="#fff" opacity=".42"/><path d="M0 120L52 180H0z" fill="#fff" opacity=".3"/>';
    s += PAINT[kind](r, P, R);
    s += '</svg>';
    cache[key] = s;
    return s;
  }
  root.VA = { art, CAT };
  if (typeof module !== 'undefined') module.exports = root.VA;
})(typeof window !== 'undefined' ? window : globalThis);
