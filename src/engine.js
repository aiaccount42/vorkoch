(function (root) {
'use strict';

/* =========================================================
   ZUTATEN
   cls: fresh   = verdirbt, Reste zählen
        can     = Dose, nach dem Öffnen kurz haltbar, Reste zählen
        keeps   = lange haltbar, Reste egal
        dry     = Trockenware, Reste egal
        frozen  = TK, Reste egal
        pantry  = Vorrat, wird nur zum Prüfen gelistet
   p/k/f = Protein / kcal / Ballaststoffe pro 100 g (g, ml) oder pro Einheit
   ========================================================= */
const AISLES = ['Obst & Gemüse', 'Kühlregal', 'Tiefkühl', 'Konserven', 'Trockenwaren', 'Brot'];

const ING = {
  skyr:      { n: 'Skyr', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 450, pl: 'Becher', pls: 'Becher', p: 11, k: 63, f: 0, al: ['skyr', 'quark', 'joghurt'] },
  feta:      { n: 'Feta', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 200, pl: 'Packung', pls: 'Packungen', p: 16, k: 250, f: 0, al: ['feta', 'schafskäse', 'hirtenkäse'] },
  halloumi:  { n: 'Halloumi', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 225, pl: 'Packung', pls: 'Packungen', p: 22, k: 320, f: 0, al: ['halloumi', 'grillkäse'] },
  eier:      { n: 'Eier', a: 'Kühlregal', cls: 'fresh', unit: 'Stk', pack: 10, pl: 'Karton', pls: 'Kartons', p: 7, k: 85, f: 0, al: ['ei', 'eier'], fm: a => a + (a === 1 ? ' Ei' : ' Eier'), nm: 'Eier' },
  tofu:      { n: 'Tofu natur', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 400, pl: 'Packung', pls: 'Packungen', p: 14, k: 130, f: 1, al: ['tofu'] },
  putenhack: { n: 'Putenhackfleisch', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 20, k: 120, f: 0, al: ['pute', 'hack', 'hackfleisch'] },
  huehnchen: { n: 'Hähnchenbrustfilet (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 1000, pl: 'Beutel', pls: 'Beutel', p: 23, k: 105, f: 0, thaw: true, al: ['hähnchen', 'huhn', 'hühnchen', 'geflügel'] },
  lachs:     { n: 'Lachsfilet (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 20, k: 200, f: 0, thaw: true, al: ['lachs', 'fisch'] },
  garnelen:  { n: 'Garnelen (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 400, pl: 'Packung', pls: 'Packungen', p: 17, k: 85, f: 0, thaw: true, al: ['garnele', 'shrimp', 'fisch'] },
  spinat:    { n: 'Blattspinat (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 450, pl: 'Packung', pls: 'Packungen', p: 3, k: 25, f: 2, al: ['spinat'] },
  erbsen:    { n: 'Erbsen (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 450, pl: 'Packung', pls: 'Packungen', p: 6, k: 70, f: 5, al: ['erbse'] },
  brokkoli:  { n: 'Brokkoli (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 3, k: 30, f: 3, al: ['brokkoli', 'broccoli'] },
  wok:       { n: 'Wok-Gemüse (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 600, pl: 'Beutel', pls: 'Beutel', p: 2, k: 40, f: 3, al: ['wok', 'gemüse'] },
  paprika:   { n: 'Paprika', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 2, k: 45, f: 3, al: ['paprika'], fm: a => a + ' Paprika', nm: 'Paprika' },
  zucchini:  { n: 'Zucchini', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 3, k: 50, f: 3, al: ['zucchini'], fm: a => a + ' Zucchini', nm: 'Zucchini' },
  suesskartoffel: { n: 'Süßkartoffeln', a: 'Obst & Gemüse', cls: 'keeps', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 5, k: 260, f: 9, al: ['süßkartoffel', 'batate'], fm: a => a + (a === 1 ? ' Süßkartoffel' : ' Süßkartoffeln'), nm: 'Süßkartoffeln' },
  karotten:  { n: 'Karotten', a: 'Obst & Gemüse', cls: 'keeps', unit: 'g', pack: 1000, pl: 'Beutel', pls: 'Beutel', p: 1, k: 35, f: 3, al: ['karotte', 'möhre'] },
  kartoffeln:{ n: 'Kartoffeln', a: 'Obst & Gemüse', cls: 'keeps', unit: 'g', pack: 1000, pl: 'Beutel', pls: 'Beutel', p: 2, k: 70, f: 2, al: ['kartoffel'] },
  petersilie:{ n: 'Petersilie', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Bund', pls: 'Bund', p: 0, k: 0, f: 0, al: ['petersilie'], fm: a => a + ' Bund Petersilie', nm: 'Petersilie' },
  zitrone:   { n: 'Zitrone', a: 'Obst & Gemüse', cls: 'keeps', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 0, k: 0, f: 0, al: ['zitrone'], fm: a => a + (a === 1 ? ' Zitrone' : ' Zitronen'), nm: 'Zitrone' },
  tomaten:   { n: 'Gehackte Tomaten', a: 'Konserven', cls: 'can', unit: 'g', pack: 400, pl: 'Dose', pls: 'Dosen', p: 1.3, k: 20, f: 1.5, al: ['tomate'] },
  kichererbsen: { n: 'Kichererbsen', a: 'Konserven', cls: 'can', unit: 'g', pack: 240, pl: 'Dose', pls: 'Dosen', p: 7, k: 120, f: 6, al: ['kichererbse'], ps: 'abgetropft' },
  kidney:    { n: 'Kidneybohnen', a: 'Konserven', cls: 'can', unit: 'g', pack: 240, pl: 'Dose', pls: 'Dosen', p: 8, k: 100, f: 7, al: ['kidney', 'bohne'], ps: 'abgetropft' },
  weisse:    { n: 'Weiße Bohnen', a: 'Konserven', cls: 'can', unit: 'g', pack: 240, pl: 'Dose', pls: 'Dosen', p: 6.5, k: 95, f: 6, al: ['weiße bohne', 'bohne'], ps: 'abgetropft' },
  kokos:     { n: 'Kokosmilch light', a: 'Konserven', cls: 'can', unit: 'ml', pack: 400, pl: 'Dose', pls: 'Dosen', p: 0.8, k: 70, f: 0, al: ['kokos'] },
  linsen:    { n: 'Rote Linsen', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 24, k: 340, f: 11, al: ['linse'] },
  reis:      { n: 'Vollkornreis', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 7.5, k: 350, f: 4, al: ['reis'] },
  nudeln:    { n: 'Vollkornnudeln', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 13, k: 340, f: 8, al: ['nudel', 'pasta', 'spaghetti'] },
  bulgur:    { n: 'Bulgur', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 12, k: 340, f: 8, al: ['bulgur'] },
  brot:      { n: 'Vollkornbrot', a: 'Brot', cls: 'keeps', unit: 'Stk', pack: 10, pl: 'Packung', pls: 'Packungen', p: 4, k: 105, f: 4, al: ['brot'], fm: a => a + (a === 1 ? ' Scheibe Vollkornbrot' : ' Scheiben Vollkornbrot'), nm: 'Scheiben' },

  thunfisch: { n: 'Thunfisch (im eigenen Saft)', a: 'Konserven', cls: 'can', unit: 'g', pack: 150, pl: 'Dose', pls: 'Dosen', p: 25, k: 110, f: 0, al: ['thunfisch', 'fisch'], ps: 'abgetropft' },
  mais:      { n: 'Mais', a: 'Konserven', cls: 'can', unit: 'g', pack: 285, pl: 'Dose', pls: 'Dosen', p: 3, k: 80, f: 3, al: ['mais'], ps: 'abgetropft' },
  seelachs:  { n: 'Seelachsfilet (TK)', a: 'Tiefkühl', cls: 'frozen', unit: 'g', pack: 800, pl: 'Beutel', pls: 'Beutel', p: 17, k: 80, f: 0, thaw: true, al: ['seelachs', 'fisch'] },
  rinderhack:{ n: 'Rinderhackfleisch', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 19, k: 220, f: 0, al: ['rind', 'hack', 'hackfleisch'] },
  huettenkaese: { n: 'Hüttenkäse', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 200, pl: 'Becher', pls: 'Becher', p: 12, k: 95, f: 0, al: ['hüttenkäse', 'frischkäse'] },
  mozzarella:{ n: 'Mozzarella', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 125, pl: 'Packung', pls: 'Packungen', p: 18, k: 240, f: 0, al: ['mozzarella'] },
  champignons: { n: 'Champignons', a: 'Obst & Gemüse', cls: 'fresh', unit: 'g', pack: 400, pl: 'Schale', pls: 'Schalen', p: 3, k: 22, f: 2, al: ['champignon', 'pilz'] },
  blumenkohl:{ n: 'Blumenkohl', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Kopf', pls: 'Köpfe', p: 10, k: 130, f: 11, al: ['blumenkohl'], fm: a => a + (a === 1 ? ' Kopf Blumenkohl' : ' Köpfe Blumenkohl'), nm: 'Köpfe' },
  aubergine: { n: 'Aubergine', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 3, k: 60, f: 8, al: ['aubergine'], fm: a => a + (a === 1 ? ' Aubergine' : ' Auberginen'), nm: 'Auberginen' },
  lauch:     { n: 'Lauch', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Stange', pls: 'Stangen', p: 2, k: 30, f: 3, al: ['lauch', 'porree'], fm: a => a + (a === 1 ? ' Stange Lauch' : ' Stangen Lauch'), nm: 'Stangen' },
  hokkaido:  { n: 'Hokkaido-Kürbis', a: 'Obst & Gemüse', cls: 'keeps', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 9, k: 270, f: 12, al: ['kürbis', 'hokkaido'], fm: a => a + ' Hokkaido-Kürbis', nm: 'Kürbisse' },
  berglinsen:{ n: 'Berglinsen', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 24, k: 330, f: 11, al: ['linse'] },
  couscous:  { n: 'Couscous', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 12.5, k: 350, f: 5, al: ['couscous'] },
  quinoa:    { n: 'Quinoa', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 14, k: 370, f: 7, al: ['quinoa'] },
  lasagne:   { n: 'Lasagneplatten (Vollkorn)', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 250, pl: 'Packung', pls: 'Packungen', p: 13, k: 340, f: 8, spec: true, al: ['lasagne', 'nudel', 'pasta'] },
  aprikosen: { n: 'Getrocknete Aprikosen', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 250, pl: 'Packung', pls: 'Packungen', p: 3.5, k: 240, f: 7, al: ['aprikose'] },
  wraps:     { n: 'Vollkorn-Wraps', a: 'Brot', cls: 'keeps', unit: 'Stk', pack: 6, pl: 'Packung', pls: 'Packungen', p: 5, k: 150, f: 4, al: ['wrap', 'tortilla'], fm: a => a + ' Vollkorn-Wraps', nm: 'Wraps' },

  zwiebel:   { n: 'Zwiebeln', cls: 'pantry', unit: 'Stk', fm: a => a + (a === 1 ? ' Zwiebel' : ' Zwiebeln') },
  knoblauch: { n: 'Knoblauch', cls: 'pantry', unit: 'Zehen', fm: a => a + (a === 1 ? ' Knoblauchzehe' : ' Knoblauchzehen') },
  ingwer:    { n: 'Ingwer', cls: 'pantry', unit: 'cm', fm: a => a + ' cm Ingwer' },
  olivenoel: { n: 'Olivenöl', cls: 'pantry', unit: 'EL', k: 120, fm: a => a + ' EL Olivenöl' },
  curry:     { n: 'Currypulver (mild)', cls: 'pantry', unit: 'EL', fm: a => a + ' EL Currypulver (mild)' },
  currypaste:{ n: 'Rote Currypaste (mild)', cls: 'pantry', unit: 'EL', fm: a => a + ' EL rote Currypaste (mild)' },
  sojasauce: { n: 'Sojasauce', cls: 'pantry', unit: 'EL', fm: a => a + ' EL Sojasauce' },
  paprikapulver: { n: 'Paprikapulver edelsüß', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Paprikapulver edelsüß' },
  kreuzkuemmel:  { n: 'Kreuzkümmel', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Kreuzkümmel' },
  oregano:   { n: 'Oregano', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Oregano' },
  tomatenmark: { n: 'Tomatenmark', cls: 'pantry', unit: 'EL', fm: a => a + ' EL Tomatenmark' },
  bruehe:    { n: 'Gemüsebrühe (Pulver)', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Gemüsebrühe' },
  honig:     { n: 'Honig', cls: 'pantry', unit: 'EL', k: 60, fm: a => a + ' EL Honig' },
  sesamoel:  { n: 'Sesamöl', cls: 'pantry', unit: 'EL', k: 120, fm: a => a + ' EL Sesamöl' },
  senf:      { n: 'Senf', cls: 'pantry', unit: 'EL', fm: a => a + ' EL Senf' },
  garammasala: { n: 'Garam Masala', cls: 'pantry', unit: 'TL', spec: true, fm: a => a + ' TL Garam Masala' },
  kurkuma:   { n: 'Kurkuma', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Kurkuma' },
  zimt:      { n: 'Zimt', cls: 'pantry', unit: 'TL', fm: a => a + ' TL Zimt' },
  erdnussbutter: { n: 'Erdnussbutter (ohne Zucker)', cls: 'pantry', unit: 'EL', p: 3.7, k: 90, f: 1.5, fm: a => a + ' EL Erdnussbutter' },
  tahin:     { n: 'Tahin (Sesammus)', cls: 'pantry', unit: 'EL', p: 2.7, k: 90, f: 1.5, spec: true, fm: a => a + ' EL Tahin' },
  fischsauce:{ n: 'Fischsauce', cls: 'pantry', unit: 'EL', spec: true, fm: a => a + ' EL Fischsauce' }
};
Object.assign(ING, {
  spaetzle:  { n: 'Spätzle (frisch)', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 10, k: 290, f: 3, al: ['spätzle', 'nudel'] },
  rindergulasch: { n: 'Rindergulasch', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 600, pl: 'Packung', pls: 'Packungen', p: 21, k: 130, f: 0, al: ['rind', 'gulasch'] },
  schweinefilet: { n: 'Schweinefilet (Minutensteaks)', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 400, pl: 'Packung', pls: 'Packungen', p: 21, k: 110, f: 0, al: ['schwein'] },
  cabanossi: { n: 'Mini-Cabanossi', a: 'Kühlregal', cls: 'keeps', unit: 'g', pack: 250, pl: 'Packung', pls: 'Packungen', p: 20, k: 380, f: 0, al: ['cabanossi', 'wurst'] },
  frischkaese: { n: 'Frischkäse', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 200, pl: 'Packung', pls: 'Packungen', p: 6, k: 250, f: 0, al: ['frischkäse'] },
  parmesan:  { n: 'Parmesan', a: 'Kühlregal', cls: 'fresh', unit: 'g', pack: 100, pl: 'Stück', pls: 'Stück', p: 36, k: 400, f: 0, al: ['parmesan', 'käse'] },
  salat:     { n: 'Romanasalat', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Kopf', pls: 'Köpfe', p: 1.5, k: 20, f: 2, al: ['salat'], fm: a => a + (a === 1 ? ' Kopf Romanasalat' : ' Köpfe Romanasalat'), nm: 'Salat' },
  gurke:     { n: 'Gurke', a: 'Obst & Gemüse', cls: 'fresh', unit: 'Stk', pack: 1, pl: 'Stück', pls: 'Stück', p: 3, k: 30, f: 1, al: ['gurke'], fm: a => a + ' Gurke', nm: 'Gurke' },
  linsen_dose: { n: 'Braune Linsen (Dose)', a: 'Konserven', cls: 'can', unit: 'g', pack: 265, pl: 'Dose', pls: 'Dosen', p: 8, k: 105, f: 5, al: ['linse'], ps: 'abgetropft' },
  polenta:   { n: 'Polenta', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 500, pl: 'Packung', pls: 'Packungen', p: 8, k: 350, f: 3, al: ['polenta', 'mais'] },
  ramen:     { n: 'Ramen-Nudeln', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 250, pl: 'Packung', pls: 'Packungen', p: 12, k: 350, f: 3, spec: true, al: ['ramen', 'nudel'] },
  kuerbiskerne: { n: 'Kürbiskerne', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 100, pl: 'Beutel', pls: 'Beutel', p: 30, k: 560, f: 6, al: ['kürbiskern', 'kern'] },
  walnuesse: { n: 'Walnüsse', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 100, pl: 'Beutel', pls: 'Beutel', p: 15, k: 650, f: 7, al: ['walnuss', 'nuss'] },
  balsamico: { n: 'Balsamico', cls: 'pantry', unit: 'EL', fm: a => a + ' EL Balsamico' }
});
ING.reisnudeln = { n: 'Reisbandnudeln', a: 'Trockenwaren', cls: 'dry', unit: 'g', pack: 250, pl: 'Packung', pls: 'Packungen', p: 7, k: 360, f: 1.5, al: ['reisnudel', 'nudel'] };

/* =========================================================
   REZEPTE (alle für 4 Portionen = 2 Personen × 2 Mahlzeiten)
   tracks: parallele Abläufe. k: a = aktiv (du stehst dran), p = läuft von allein
   ========================================================= */
const R = (o) => o;
const RICE = { n: 'Reis', ph: [
  { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
  { k: 'p', m: 35, d: 'Herd', t: 'Reis garen und quellen lassen.' }] };
const COUSC = { n: 'Couscous', ph: [
  { k: 'a', m: 3, d: '', t: 'Couscous mit der gleichen Menge heißem Salzwasser übergießen und abdecken.' },
  { k: 'p', m: 8, d: '', t: 'Quellen lassen.' },
  { k: 'a', m: 2, d: '', t: 'Mit einer Gabel auflockern.' }] };
const PASTA = { n: 'Nudeln', ph: [
  { k: 'a', m: 3, d: 'Herd', t: 'Nudeln in reichlich Salzwasser aufsetzen.' },
  { k: 'p', m: 10, d: 'Herd', t: 'Garen.' },
  { k: 'a', m: 2, d: 'Herd', t: 'Abgießen.' }] };
const RECIPES = [
  R({ id: 'dal', name: 'Rotes Linsen-Dal mit Spinat und Skyr', short: 'Linsen-Dal', cuisine: 'Indisch', kind: 'veg', base: 'Reis', reheat: 'sehr gut',
    note: 'Skyr erst beim Essen obendrauf geben. Dal lässt sich gut einfrieren.',
    i: [['linsen', 300], ['spinat', 450], ['kokos', 400], ['tomaten', 400], ['reis', 240], ['skyr', 450], ['zwiebel', 2], ['knoblauch', 3], ['ingwer', 3], ['curry', 2], ['olivenoel', 1]],
    tracks: [
      { n: 'Dal', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln, Knoblauch und Ingwer hacken, mit Currypulver in Öl anschwitzen. Linsen, Tomaten und 800 ml Wasser zugeben.' },
        { k: 'p', m: 22, d: 'Herd', t: 'Köcheln lassen, zwischendurch rühren.' },
        { k: 'a', m: 6, d: 'Herd', t: 'Gefrorenen Spinat und Kokosmilch einrühren, 5 Min ziehen lassen, mit Salz abschmecken.' }] },
      { n: 'Reis', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Reis nach Packungsangabe garen und quellen lassen.' }] }
    ] }),

  R({ id: 'shakshuka', name: 'Shakshuka mit Kichererbsen und Feta', short: 'Shakshuka', cuisine: 'Nahost', kind: 'veg', base: 'Brot', reheat: 'gut',
    note: 'Pro Portion etwa 2 Eier und 2 Scheiben Vollkornbrot. Beim Aufwärmen bei niedriger Leistung, damit die Eier nicht gummiartig werden.',
    i: [['eier', 10], ['tomaten', 800], ['kichererbsen', 240], ['paprika', 2], ['feta', 200], ['brot', 8], ['zwiebel', 2], ['knoblauch', 3], ['paprikapulver', 2], ['kreuzkuemmel', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Shakshuka', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln, Knoblauch und Paprika würfeln, mit Paprikapulver und Kreuzkümmel in Öl anbraten. Tomaten und Kichererbsen zugeben.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Sauce bei mittlerer Hitze einkochen lassen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Zehn Mulden in die Sauce drücken und die Eier hineinschlagen.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Deckel auf, Eier stocken lassen.' },
        { k: 'a', m: 2, d: '', t: 'Feta darüberbröseln.' }] }
    ] }),

  R({ id: 'tofucurry', name: 'Thai-Curry mit knusprigem Tofu und Brokkoli', short: 'Tofu-Curry', cuisine: 'Thai', kind: 'veg', base: 'Reis', reheat: 'gut',
    note: 'Tofu getrennt aufbewahren, dann bleibt er knusprig. Beim Aufwärmen erst die Sauce erhitzen, Tofu zum Schluss zugeben.',
    i: [['tofu', 800], ['brokkoli', 500], ['paprika', 2], ['kokos', 400], ['reis', 240], ['currypaste', 2], ['sojasauce', 3], ['ingwer', 3], ['knoblauch', 3], ['olivenoel', 1]],
    tracks: [
      { n: 'Tofu', ph: [
        { k: 'a', m: 8, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Tofu gut abtropfen, würfeln, mit 2 EL Sojasauce mischen und aufs Blech geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, nach 12 Min wenden.' }] },
      { n: 'Curry', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Knoblauch und Ingwer hacken, Currypaste in Öl anrösten, Kokosmilch mit 200 ml Wasser angießen, Paprika in Streifen zugeben.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Gefrorenen Brokkoli zugeben.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Brokkoli garen.' },
        { k: 'a', m: 2, d: '', t: 'Tofu unterheben, mit 1 EL Sojasauce abschmecken.' }] },
      { n: 'Reis', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Reis garen und quellen lassen.' }] }
    ] }),

  R({ id: 'halloumi', name: 'Bulgur-Gemüsepfanne mit Halloumi und Skyr-Zitronendip', short: 'Halloumi-Bulgur', cuisine: 'Levante', kind: 'veg', base: 'Bulgur', reheat: 'gut',
    note: 'Dip getrennt halten. Halloumi wird beim Aufwärmen fester, kurz in der Pfanne statt in der Mikrowelle erhitzen.',
    i: [['bulgur', 280], ['halloumi', 225], ['kichererbsen', 240], ['zucchini', 2], ['paprika', 2], ['skyr', 450], ['zitrone', 1], ['petersilie', 1], ['zwiebel', 1], ['knoblauch', 2], ['kreuzkuemmel', 1], ['paprikapulver', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Pfanne', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zucchini, Paprika und Zwiebel würfeln, mit Kreuzkümmel und Paprikapulver in Öl anbraten.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Bei mittlerer Hitze garen.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Halloumi würfeln, mit Kichererbsen zugeben und goldbraun braten, Bulgur untermischen.' }] },
      { n: 'Bulgur', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Bulgur mit der doppelten Menge Salzwasser aufsetzen.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Quellen lassen.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 4, d: '', t: 'Skyr mit Zitronensaft, Knoblauch und gehackter Petersilie verrühren.' }] }
    ] }),

  R({ id: 'ofengemuese', name: 'Ofengemüse mit Feta-Kichererbsen, Bulgur und Skyr-Dip', short: 'Ofengemüse', cuisine: 'Mittelmeer', kind: 'veg', base: 'Bulgur', reheat: 'sehr gut',
    note: 'Schmeckt auch kalt als Salat. Dip getrennt aufbewahren.',
    i: [['suesskartoffel', 3], ['paprika', 2], ['zucchini', 2], ['kichererbsen', 480], ['feta', 200], ['bulgur', 160], ['skyr', 450], ['zitrone', 1], ['zwiebel', 2], ['olivenoel', 2], ['paprikapulver', 2], ['kreuzkuemmel', 1]],
    tracks: [
      { n: 'Blech', ph: [
        { k: 'a', m: 15, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Süßkartoffeln, Paprika, Zucchini und Zwiebeln in grobe Stücke schneiden, mit Öl und Gewürzen auf zwei Bleche geben.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Backen, nach 12 Min wenden.' },
        { k: 'a', m: 3, d: 'Ofen', t: 'Abgetropfte Kichererbsen und gewürfelten Feta zugeben.' },
        { k: 'p', m: 12, d: 'Ofen', t: 'Weiterbacken.' }] },
      { n: 'Bulgur', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Bulgur mit der doppelten Menge Salzwasser aufsetzen.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Quellen lassen.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 4, d: '', t: 'Skyr mit Zitronensaft und Salz verrühren.' }] }
    ] }),

  R({ id: 'frittata', name: 'Spinat-Feta-Frittata mit Ofenkartoffeln und Kräuter-Skyr', short: 'Frittata', cuisine: 'Spanisch', kind: 'veg', base: 'Kartoffel', reheat: 'sehr gut',
    note: 'Schmeckt warm und kalt. In Stücke geschnitten hält sie sich gut in Dosen.',
    i: [['eier', 10], ['spinat', 450], ['feta', 200], ['kartoffeln', 600], ['skyr', 450], ['petersilie', 1], ['zwiebel', 2], ['knoblauch', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Frittata', ph: [
        { k: 'a', m: 12, d: 'Ofen', t: 'Ofen auf 200 °C. Kartoffeln in dünne Scheiben schneiden, mit Öl auf ein tiefes Blech geben.' },
        { k: 'p', m: 20, d: 'Ofen', t: 'Kartoffeln vorbacken.' },
        { k: 'a', m: 10, d: 'Ofen', t: 'Spinat auftauen und ausdrücken, Eier mit Feta, Zwiebeln, Knoblauch und Salz verquirlen, über die Kartoffeln gießen.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Bei 180 °C stocken lassen.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 4, d: '', t: 'Skyr mit gehackter Petersilie und Salz verrühren.' }] }
    ] }),

  R({ id: 'linsensuppe', name: 'Rote-Linsen-Suppe mit Kichererbsen und Skyr', short: 'Linsensuppe', cuisine: 'Türkisch', kind: 'veg', base: 'Suppe', reheat: 'sehr gut',
    note: 'Eine Portion Suppe plus 1 Scheibe Brot. Skyr erst beim Essen dazugeben. Lässt sich gut einfrieren.',
    i: [['linsen', 250], ['kichererbsen', 240], ['karotten', 300], ['tomaten', 400], ['brot', 6], ['skyr', 450], ['zitrone', 1], ['zwiebel', 2], ['knoblauch', 2], ['kreuzkuemmel', 2], ['paprikapulver', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Suppe', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln, Karotten und Knoblauch würfeln, mit Kreuzkümmel in Öl anrösten. Linsen, Tomaten und 1,2 l Wasser zugeben.' },
        { k: 'p', m: 20, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Mit dem Stabmixer grob pürieren, Kichererbsen und Zitronensaft zugeben, salzen.' }] }
    ] }),

  R({ id: 'lachs_bulgur', name: 'Ofen-Lachs mit Bulgur-Salat und Skyr-Dip', short: 'Ofen-Lachs', cuisine: 'Griechisch', kind: 'fisch', base: 'Bulgur', reheat: 'bedingt',
    note: 'Lachs am besten am ersten Abend essen. Am zweiten Tag den Lachs kalt über den Salat legen statt ihn aufzuwärmen.',
    i: [['lachs', 500], ['bulgur', 240], ['zucchini', 2], ['paprika', 1], ['petersilie', 1], ['zitrone', 1], ['skyr', 450], ['zwiebel', 1], ['knoblauch', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Lachs', ph: [
        { k: 'a', m: 10, d: 'Ofen', t: 'Ofen auf 180 °C. Zucchini und Paprika würfeln, mit Öl und Knoblauch auf ein Blech geben, aufgetauten Lachs darauflegen, mit Zitronenscheiben und Salz belegen.' },
        { k: 'p', m: 18, d: 'Ofen', t: 'Backen, bis der Lachs gar ist.' }] },
      { n: 'Bulgur', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Bulgur mit der doppelten Menge Salzwasser aufsetzen.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Quellen lassen.' },
        { k: 'a', m: 6, d: '', t: 'Bulgur mit gehackter Petersilie, Zwiebel, Zitronensaft und Olivenöl zum Salat mischen.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 4, d: '', t: 'Skyr mit Zitronensaft und Salz verrühren.' }] }
    ] }),

  R({ id: 'lachs_curry', name: 'Lachs-Kokos-Curry mit Erbsen und Reis', short: 'Lachs-Curry', cuisine: 'Thai', kind: 'fisch', base: 'Reis', reheat: 'gut',
    note: 'Die Sauce schützt den Lachs beim Aufwärmen. Nur kurz und bei niedriger Leistung erhitzen.',
    i: [['lachs', 500], ['kokos', 400], ['erbsen', 450], ['reis', 240], ['currypaste', 2], ['ingwer', 3], ['knoblauch', 2], ['zwiebel', 1], ['zitrone', 1], ['olivenoel', 1]],
    tracks: [
      { n: 'Curry', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Zwiebel, Knoblauch und Ingwer hacken, Currypaste in Öl anrösten, Kokosmilch mit 200 ml Wasser angießen, Erbsen zugeben.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Aufgetauten Lachs in Würfel schneiden und in die Sauce legen.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Bei kleiner Hitze gar ziehen lassen, mit Zitronensaft abschmecken.' }] },
      { n: 'Reis', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Reis garen und quellen lassen.' }] }
    ] }),

  R({ id: 'garnelen_pasta', name: 'Garnelen-Spinat-Pasta mit Feta', short: 'Garnelen-Pasta', cuisine: 'Italienisch', kind: 'fisch', base: 'Nudeln', reheat: 'bedingt',
    note: 'Garnelen werden beim Aufwärmen zäh. Zweite Portion bei niedriger Leistung und mit einem Schuss Wasser erhitzen.',
    i: [['garnelen', 400], ['nudeln', 320], ['tomaten', 800], ['spinat', 450], ['feta', 200], ['zwiebel', 1], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Zwiebel und Knoblauch hacken, in Öl anbraten, Tomaten, gefrorenen Spinat und Oregano zugeben.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Einköcheln lassen.' },
        { k: 'a', m: 5, d: 'Herd', t: 'Aufgetaute Garnelen zugeben, 4 Min garen, Feta zerbröseln und unterrühren.' }] },
      { n: 'Nudeln', ph: [
        { k: 'a', m: 3, d: 'Herd', t: 'Nudeln in reichlich Salzwasser aufsetzen.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Garen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abgießen und mit der Sauce mischen.' }] }
    ] }),

  R({ id: 'ofenhaehnchen', name: 'Ofen-Hähnchen mit Süßkartoffel, Brokkoli und Kichererbsen', short: 'Ofen-Hähnchen', cuisine: 'Hausküche', kind: 'fleisch', base: 'Süßkartoffel', reheat: 'gut',
    note: 'Aufwärmen am besten im Ofen oder in der Pfanne, damit das Hähnchen nicht austrocknet.',
    i: [['huehnchen', 600], ['suesskartoffel', 3], ['brokkoli', 500], ['kichererbsen', 240], ['knoblauch', 2], ['paprikapulver', 2], ['kreuzkuemmel', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Blech', ph: [
        { k: 'a', m: 15, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Süßkartoffeln würfeln, Hähnchen in Stücke schneiden, beides mit Öl, Knoblauch und Gewürzen mischen und auf zwei Bleche geben.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Backen, einmal wenden.' },
        { k: 'a', m: 4, d: 'Ofen', t: 'Gefrorenen Brokkoli und abgetropfte Kichererbsen mit aufs Blech geben.' },
        { k: 'p', m: 15, d: 'Ofen', t: 'Weiterbacken, bis das Hähnchen durch ist.' }] }
    ] }),

  R({ id: 'wok', name: 'Hähnchen-Gemüse-Wok mit Ei und Vollkornreis', short: 'Hähnchen-Wok', cuisine: 'Ostasiatisch', kind: 'fleisch', base: 'Reis', reheat: 'gut',
    note: 'Pfanne oder Mikrowelle, beides geht. Ein Spritzer Wasser hält das Gemüse saftig.',
    i: [['huehnchen', 600], ['wok', 600], ['reis', 240], ['eier', 2], ['sojasauce', 3], ['ingwer', 3], ['knoblauch', 3], ['zwiebel', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Wok', ph: [
        { k: 'a', m: 8, d: '', t: 'Aufgetautes Hähnchen in Streifen schneiden, mit Sojasauce, Ingwer und Knoblauch marinieren.' },
        { k: 'p', m: 10, d: '', t: 'Marinieren lassen, in der Zeit Zwiebel schneiden.' },
        { k: 'a', m: 12, d: 'Herd', t: 'In zwei Chargen in heißem Öl scharf anbraten.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Wok-Gemüse zugeben und braten.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Eier verquirlen, unterrühren und stocken lassen.' }] },
      { n: 'Reis', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Reis garen und quellen lassen.' }] }
    ] }),

  R({ id: 'chili', name: 'Chili con Pute mit Kidneybohnen und Reis', short: 'Pute-Chili', cuisine: 'Tex-Mex', kind: 'fleisch', base: 'Reis', reheat: 'sehr gut', early: true,
    note: 'Frisches Hack: dieses Gericht gehört in den ersten oder zweiten Kochtermin der Woche. Mild gehalten, kein Cayenne.',
    i: [['putenhack', 500], ['kidney', 480], ['tomaten', 800], ['paprika', 2], ['karotten', 200], ['reis', 200], ['tomatenmark', 2], ['zwiebel', 2], ['knoblauch', 3], ['paprikapulver', 2], ['kreuzkuemmel', 2], ['oregano', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Chili', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Zwiebeln, Knoblauch, Paprika und Karotten würfeln. Hack in Öl krümelig anbraten, Gemüse, Tomatenmark und Gewürze zugeben.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Tomaten, Bohnen und 200 ml Wasser zugeben, köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Abschmecken, mild halten.' }] },
      { n: 'Reis', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Reis mit Wasser aufsetzen.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Reis garen und quellen lassen.' }] }
    ] }),

  R({ id: 'bolognese', name: 'Linsen-Bolognese mit Vollkornnudeln', short: 'Bolognese', cuisine: 'Italienisch', kind: 'fleisch', base: 'Nudeln', reheat: 'sehr gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Sauce und Nudeln getrennt aufbewahren, dann werden die Nudeln nicht matschig.',
    i: [['putenhack', 500], ['linsen', 100], ['tomaten', 800], ['karotten', 300], ['nudeln', 320], ['tomatenmark', 2], ['zwiebel', 2], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Zwiebeln, Karotten und Knoblauch würfeln. Hack in Öl anbraten, Tomatenmark und Oregano zugeben.' },
        { k: 'p', m: 28, d: 'Herd', t: 'Tomaten, Linsen und 300 ml Wasser zugeben, einköcheln lassen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abschmecken.' }] },
      { n: 'Nudeln', ph: [
        { k: 'a', m: 3, d: 'Herd', t: 'Nudeln in reichlich Salzwasser aufsetzen.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Garen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abgießen.' }] }
    ] }),

  R({ id: 'bohneneintopf', name: 'Weiße-Bohnen-Eintopf mit Hähnchen und Spinat', short: 'Bohnen-Eintopf', cuisine: 'Toskanisch', kind: 'fleisch', base: 'Eintopf', reheat: 'sehr gut',
    note: 'Eintopf wird am zweiten Tag eher besser. Mit 1 Scheibe Vollkornbrot servieren.',
    i: [['huehnchen', 500], ['weisse', 480], ['spinat', 450], ['tomaten', 400], ['karotten', 300], ['kartoffeln', 400], ['brot', 4], ['zwiebel', 2], ['knoblauch', 3], ['oregano', 2], ['bruehe', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Eintopf', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Hähnchen würfeln und in Öl anbraten, Zwiebeln, Knoblauch, Karotten und Kartoffeln würfeln und mitbraten.' },
        { k: 'p', m: 30, d: 'Herd', t: 'Tomaten, Bohnen, Oregano und 600 ml Brühe zugeben, köcheln lassen.' },
        { k: 'a', m: 5, d: 'Herd', t: 'Gefrorenen Spinat einrühren, 5 Min ziehen lassen, abschmecken.' }] }
    ] }),

  /* ---------- Erweiterung: 24 neue Gerichte ---------- */
  R({ id: 'chana', isNew: true, name: 'Kichererbsen-Masala mit Halloumi und Reis', short: 'Chana-Masala', cuisine: 'Indisch', kind: 'veg', base: 'Reis', reheat: 'sehr gut',
    note: 'Halloumi erst beim Essen zugeben, damit er nicht zäh wird. Skyr als kühlen Klecks obendrauf.',
    i: [['kichererbsen', 720], ['tomaten', 400], ['halloumi', 225], ['reis', 200], ['skyr', 450], ['zwiebel', 2], ['knoblauch', 3], ['ingwer', 3], ['garammasala', 2], ['kurkuma', 1], ['kreuzkuemmel', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Masala', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln, Knoblauch und Ingwer hacken, mit Garam Masala, Kurkuma und Kreuzkümmel in Öl anbraten. Tomaten, Kichererbsen und 200 ml Wasser zugeben.' },
        { k: 'p', m: 20, d: 'Herd', t: 'Köcheln lassen, ein Drittel der Kichererbsen zerdrücken.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abschmecken.' }] },
      { n: 'Halloumi', ph: [{ k: 'a', m: 8, d: 'Herd', t: 'Halloumi würfeln und in einer Pfanne goldbraun braten.' }] },
      RICE
    ] }),

  R({ id: 'palak_tofu', isNew: true, name: 'Palak-Tofu mit Kichererbsen und Reis', short: 'Palak-Tofu', cuisine: 'Indisch', kind: 'veg', base: 'Reis', reheat: 'gut',
    note: 'Der Tofu bleibt knuspriger, wenn du ihn erst beim Aufwärmen unter die Sauce hebst.',
    i: [['tofu', 800], ['spinat', 450], ['kichererbsen', 240], ['tomaten', 400], ['reis', 240], ['zwiebel', 2], ['knoblauch', 3], ['ingwer', 3], ['curry', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Tofu', ph: [
        { k: 'a', m: 8, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Tofu abtropfen, würfeln, mit Öl und 1 EL Currypulver mischen, aufs Blech geben.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Backen, einmal wenden.' }] },
      { n: 'Sauce', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Zwiebeln, Knoblauch und Ingwer hacken, mit Currypulver in Öl anschwitzen. Tomaten, Kichererbsen und gefrorenen Spinat zugeben.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 4, d: 'Herd', w: ['Tofu'], t: 'Sauce grob pürieren, den Tofu unterheben, abschmecken.' }] },
      RICE
    ] }),

  R({ id: 'tajine', isNew: true, name: 'Hähnchen-Tajine mit Kichererbsen, Aprikosen und Couscous', short: 'Tajine', cuisine: 'Marokkanisch', kind: 'fleisch', base: 'Couscous', reheat: 'sehr gut',
    note: 'Zimt und Aprikosen machen es mild-süßlich, nicht scharf. Wird am zweiten Tag besser.',
    i: [['huehnchen', 500], ['kichererbsen', 240], ['aprikosen', 80], ['tomaten', 400], ['karotten', 300], ['couscous', 240], ['zwiebel', 2], ['knoblauch', 2], ['zimt', 1], ['kurkuma', 1], ['kreuzkuemmel', 1], ['paprikapulver', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Tajine', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln und mit den Gewürzen in Öl anbraten. Zwiebeln, Knoblauch und Karotten würfeln und mitbraten.' },
        { k: 'p', m: 30, d: 'Herd', t: 'Tomaten, Kichererbsen, gehackte Aprikosen und 200 ml Wasser zugeben, zugedeckt schmoren.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Abschmecken.' }] },
      COUSC
    ] }),

  R({ id: 'shawarma', isNew: true, name: 'Hähnchen-Shawarma mit Ofengemüse, Couscous und Knoblauch-Skyr', short: 'Shawarma', cuisine: 'Libanesisch', kind: 'fleisch', base: 'Couscous', reheat: 'gut',
    note: 'Dip getrennt halten. Beim Aufwärmen Hähnchen und Gemüse kurz in der Pfanne statt in der Mikrowelle.',
    i: [['huehnchen', 400], ['blumenkohl', 1], ['paprika', 2], ['couscous', 200], ['skyr', 450], ['zitrone', 1], ['zwiebel', 1], ['knoblauch', 3], ['paprikapulver', 2], ['kreuzkuemmel', 2], ['zimt', 1], ['kurkuma', 1], ['olivenoel', 3]],
    tracks: [
      { n: 'Blech', ph: [
        { k: 'a', m: 15, d: 'Ofen', t: 'Ofen auf 220 °C Umluft. Blumenkohl in Röschen, Paprika und Zwiebel in Streifen, aufgetautes Hähnchen in Streifen schneiden, alles mit Öl und den Gewürzen mischen und auf zwei Bleche geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, nach 12 Min wenden.' }] },
      COUSC,
      { n: 'Dip', ph: [{ k: 'a', m: 4, d: '', t: 'Skyr mit Knoblauch, Zitronensaft und Salz verrühren.' }] }
    ] }),

  R({ id: 'koefte', isNew: true, name: 'Köfte aus dem Ofen mit Tomatenreis und Skyr-Dip', short: 'Köfte', cuisine: 'Türkisch', kind: 'fleisch', red: true, early: true, base: 'Reis', reheat: 'gut',
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Das einzige Gericht mit Rindfleisch im Pool.',
    i: [['rinderhack', 500], ['brot', 2], ['tomaten', 400], ['reis', 240], ['skyr', 450], ['petersilie', 1], ['zwiebel', 2], ['knoblauch', 2], ['kreuzkuemmel', 2], ['paprikapulver', 2], ['tomatenmark', 2], ['olivenoel', 1]],
    tracks: [
      { n: 'Köfte', ph: [
        { k: 'a', m: 18, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Brot einweichen und ausdrücken. Hack mit einer geriebenen Zwiebel, Knoblauch, Brot und Gewürzen verkneten, zu 16 länglichen Köfte formen und aufs Blech legen.' },
        { k: 'p', m: 20, d: 'Ofen', t: 'Backen, einmal wenden.' }] },
      { n: 'Tomatenreis', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Zweite Zwiebel würfeln, in Öl anschwitzen, Tomatenmark, Reis, Tomaten und 300 ml Wasser zugeben.' },
        { k: 'p', m: 40, d: 'Herd', t: 'Zugedeckt garen, bis der Reis weich ist.' }] },
      { n: 'Dip', ph: [{ k: 'a', m: 4, d: '', t: 'Skyr mit gehackter Petersilie und Salz verrühren.' }] }
    ] }),

  R({ id: 'enchilada', isNew: true, name: 'Enchilada-Auflauf mit Pute, Bohnen und Mais', short: 'Enchilada', cuisine: 'Mexikanisch', kind: 'fleisch', early: true, base: 'Wraps', reheat: 'sehr gut',
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Mild gewürzt, Aufwärmen im Ofen oder in der Mikrowelle.',
    i: [['putenhack', 500], ['wraps', 6], ['kidney', 240], ['mais', 285], ['tomaten', 400], ['paprika', 2], ['mozzarella', 125], ['zwiebel', 2], ['knoblauch', 2], ['paprikapulver', 2], ['kreuzkuemmel', 1], ['oregano', 1], ['tomatenmark', 1], ['olivenoel', 1]],
    tracks: [
      { n: 'Auflauf', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Zwiebeln, Knoblauch und Paprika würfeln. Hack krümelig anbraten, Gemüse, Tomatenmark und Gewürze zugeben, Bohnen, Mais und Tomaten untermischen.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 10, d: 'Ofen', t: 'Ofen auf 200 °C. Füllung und Wraps abwechselnd in eine Auflaufform schichten, Mozzarella zerzupft darüber verteilen.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Überbacken.' }] }
    ] }),

  R({ id: 'burrito', isNew: true, name: 'Burrito-Bowl mit Bohnen, Feta und Skyr-Creme', short: 'Burrito-Bowl', cuisine: 'Mexikanisch', kind: 'veg', base: 'Reis', reheat: 'sehr gut',
    note: 'Skyr und Feta erst beim Essen auf die Bowl geben.',
    i: [['kidney', 480], ['mais', 285], ['paprika', 2], ['tomaten', 400], ['reis', 240], ['feta', 200], ['skyr', 450], ['zwiebel', 2], ['knoblauch', 2], ['paprikapulver', 2], ['kreuzkuemmel', 2], ['olivenoel', 1]],
    tracks: [
      { n: 'Bohnen', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln, Knoblauch und Paprika würfeln, mit Paprikapulver und Kreuzkümmel in Öl anbraten. Bohnen, Mais und Tomaten zugeben.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Abschmecken.' }] },
      RICE
    ] }),

  R({ id: 'lasagne', isNew: true, name: 'Spinat-Lasagne mit Hüttenkäse und Skyr-Haube', short: 'Spinat-Lasagne', cuisine: 'Italienisch', kind: 'veg', base: 'Nudeln', reheat: 'sehr gut',
    note: 'In Portionen geschnitten lässt sie sich sehr gut aufwärmen und einfrieren.',
    i: [['lasagne', 250], ['spinat', 450], ['huettenkaese', 400], ['mozzarella', 125], ['tomaten', 800], ['skyr', 450], ['zwiebel', 1], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 1]],
    tracks: [
      { n: 'Lasagne', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebel und Knoblauch in Öl anschwitzen, Tomaten, gefrorenen Spinat und Oregano zugeben.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 15, d: 'Ofen', t: 'Ofen auf 190 °C. Sauce, Platten und Hüttenkäse abwechselnd schichten, oben Skyr verstreichen, Mozzarella zerzupft darauf.' },
        { k: 'p', m: 35, d: 'Ofen', t: 'Backen, bis die Oberfläche gebräunt ist.' }] }
    ] }),

  R({ id: 'hokkaido', isNew: true, name: 'Hokkaido-Linsen-Suppe mit Kichererbsen und Skyr', short: 'Hokkaido-Suppe', cuisine: 'Herbstküche', kind: 'veg', base: 'Suppe', reheat: 'sehr gut',
    note: 'Hokkaido-Schale kann mitgegessen werden. Skyr erst beim Essen dazugeben, Suppe lässt sich einfrieren.',
    i: [['hokkaido', 1], ['linsen', 250], ['kichererbsen', 240], ['kokos', 400], ['karotten', 200], ['brot', 6], ['skyr', 450], ['zwiebel', 2], ['knoblauch', 2], ['ingwer', 3], ['curry', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Suppe', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Kürbis entkernen und mit Schale würfeln, Zwiebeln, Karotten und Ingwer klein schneiden, mit Currypulver in Öl anrösten.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Linsen und 1,2 l Wasser zugeben, köcheln lassen.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Pürieren, Kokosmilch und Kichererbsen zugeben, salzen.' }] }
    ] }),

  R({ id: 'linseneintopf', isNew: true, name: 'Linseneintopf mit Kartoffeln, Lauch und Hähnchen', short: 'Linseneintopf', cuisine: 'Deutsch', kind: 'fleisch', base: 'Eintopf', reheat: 'sehr gut',
    note: 'Klassiker, am zweiten Tag besser. Mit 1 Scheibe Vollkornbrot.',
    i: [['berglinsen', 250], ['huehnchen', 400], ['kartoffeln', 600], ['karotten', 300], ['lauch', 1], ['brot', 4], ['zwiebel', 2], ['knoblauch', 1], ['senf', 1], ['bruehe', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Eintopf', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Hähnchen würfeln und in Öl anbraten. Zwiebeln, Karotten, Lauch, Kartoffeln und Knoblauch würfeln und mitbraten.' },
        { k: 'p', m: 35, d: 'Herd', t: 'Linsen, 1,2 l Wasser und Brühe zugeben, köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Senf unterrühren, abschmecken.' }] }
    ] }),

  R({ id: 'lachs_kartoffel', isNew: true, name: 'Lachs mit Ofenkartoffeln, Erbsen und Senf-Skyr', short: 'Lachs-Kartoffel', cuisine: 'Skandinavisch', kind: 'fisch', base: 'Kartoffel', reheat: 'bedingt',
    note: 'Lachs am ersten Abend essen. Am zweiten Tag den Lachs kalt zu Kartoffeln und Dip legen.',
    i: [['lachs', 500], ['kartoffeln', 800], ['erbsen', 450], ['skyr', 450], ['petersilie', 1], ['zitrone', 1], ['zwiebel', 1], ['senf', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Blech', ph: [
        { k: 'a', m: 12, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Kartoffeln in Spalten schneiden, mit Öl und Salz aufs Blech geben.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Vorbacken.' },
        { k: 'a', m: 6, d: 'Ofen', t: 'Aufgetauten Lachs zwischen die Kartoffeln legen, mit Zitronenscheiben belegen.' },
        { k: 'p', m: 15, d: 'Ofen', t: 'Backen, bis der Lachs gar ist.' }] },
      { n: 'Erbsen', ph: [
        { k: 'a', m: 6, d: 'Herd', t: 'Zwiebel würfeln, in Öl anschwitzen, gefrorene Erbsen zugeben.' },
        { k: 'p', m: 5, d: 'Herd', t: 'Garen.' }] },
      { n: 'Dip', ph: [{ k: 'a', m: 4, d: '', t: 'Skyr mit Senf, Zitronensaft und gehackter Petersilie verrühren.' }] }
    ] }),

  R({ id: 'thunfisch_pasta', isNew: true, name: 'Thunfisch-Tomaten-Pasta mit Spinat', short: 'Thunfisch-Pasta', cuisine: 'Italienisch', kind: 'fisch', base: 'Nudeln', reheat: 'gut',
    note: 'Schnell, günstig und alles aus Dose und Tiefkühler. Sauce und Nudeln getrennt aufbewahren.',
    i: [['thunfisch', 450], ['nudeln', 320], ['tomaten', 800], ['spinat', 450], ['zwiebel', 1], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Zwiebel und Knoblauch in Öl anbraten, Tomaten, gefrorenen Spinat und Oregano zugeben.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Einköcheln lassen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Thunfisch abtropfen, zerzupfen und unterheben, abschmecken.' }] },
      PASTA
    ] }),

  R({ id: 'thunfisch_bohnen', isNew: true, name: 'Toskanischer Bohnensalat mit Thunfisch und Brot', short: 'Bohnensalat', cuisine: 'Toskanisch', kind: 'fisch', base: 'Brot', reheat: 'sehr gut',
    note: 'Kalt servieren, braucht keinen Herd. Gut für Tage, an denen es schnell gehen muss.',
    i: [['weisse', 480], ['thunfisch', 450], ['brot', 8], ['petersilie', 1], ['zitrone', 1], ['zwiebel', 2], ['olivenoel', 3], ['oregano', 1]],
    tracks: [
      { n: 'Salat', ph: [
        { k: 'a', m: 15, d: '', t: 'Zwiebeln in feine Ringe schneiden. Bohnen und Thunfisch abtropfen, mit Zwiebeln, gehackter Petersilie, Zitronensaft, Öl und Oregano mischen.' },
        { k: 'p', m: 10, d: '', t: 'Durchziehen lassen.' }] }
    ] }),

  R({ id: 'seelachs', isNew: true, name: 'Seelachs in Paprika-Tomaten-Sauce mit Couscous', short: 'Seelachs', cuisine: 'Spanisch', kind: 'fisch', base: 'Couscous', reheat: 'gut',
    note: 'Mild und günstig. Beim Aufwärmen Fisch in der Sauce lassen und nur kurz erhitzen.',
    i: [['seelachs', 800], ['tomaten', 400], ['paprika', 2], ['couscous', 240], ['zitrone', 1], ['zwiebel', 1], ['knoblauch', 3], ['paprikapulver', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Zwiebel, Knoblauch und Paprika würfeln, mit Paprikapulver in Öl anbraten, Tomaten zugeben.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Einköcheln lassen.' },
        { k: 'a', m: 5, d: 'Herd', t: 'Aufgetauten Seelachs in großen Stücken in die Sauce legen.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Bei kleiner Hitze gar ziehen lassen, mit Zitronensaft abschmecken.' }] },
      COUSC
    ] }),

  R({ id: 'erdnuss_tofu', isNew: true, name: 'Erdnuss-Tofu-Wok mit Gemüse und Reis', short: 'Erdnuss-Tofu', cuisine: 'Südostasiatisch', kind: 'veg', base: 'Reis', reheat: 'gut',
    note: 'Mild, nicht scharf. Beim Aufwärmen einen Schuss Wasser zur Sauce geben.',
    i: [['tofu', 800], ['wok', 600], ['reis', 240], ['erdnussbutter', 4], ['sojasauce', 3], ['honig', 1], ['ingwer', 3], ['knoblauch', 3], ['zitrone', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Tofu', ph: [
        { k: 'a', m: 8, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Tofu abtropfen, würfeln, mit 1 EL Sojasauce und Öl mischen, aufs Blech geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, nach 12 Min wenden.' }] },
      { n: 'Wok', ph: [
        { k: 'a', m: 5, d: '', t: 'Sauce rühren: Erdnussbutter, 2 EL Sojasauce, Honig, Zitronensaft und 100 ml warmes Wasser.' },
        { k: 'a', m: 12, d: 'Herd', t: 'Knoblauch und Ingwer in Öl anbraten, gefrorenes Wok-Gemüse zugeben und braten.' },
        { k: 'a', m: 3, d: 'Herd', w: ['Tofu'], t: 'Tofu und Sauce unterheben, kurz erwärmen.' }] },
      RICE
    ] }),

  R({ id: 'teriyaki', isNew: true, name: 'Teriyaki-Hähnchen mit Brokkoli und Reis', short: 'Teriyaki', cuisine: 'Japanisch', kind: 'fleisch', base: 'Reis', reheat: 'gut',
    note: 'Brokkoli kurz halten, nicht totkochen, er gart beim Aufwärmen nach.',
    i: [['huehnchen', 600], ['brokkoli', 500], ['reis', 240], ['sojasauce', 4], ['honig', 2], ['ingwer', 3], ['knoblauch', 3], ['sesamoel', 1], ['olivenoel', 1]],
    tracks: [
      { n: 'Hähnchen', ph: [
        { k: 'a', m: 8, d: '', t: 'Aufgetautes Hähnchen würfeln, mit Sojasauce, Honig, Ingwer und Knoblauch mischen.' },
        { k: 'p', m: 10, d: '', t: 'Marinieren lassen.' },
        { k: 'a', m: 12, d: 'Herd', t: 'In zwei Chargen in Öl braten, Marinade zugeben und einkochen lassen.' }] },
      { n: 'Brokkoli', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Gefrorenen Brokkoli in Salzwasser aufsetzen.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Garen.' },
        { k: 'a', m: 1, d: '', t: 'Abgießen und mit Sesamöl mischen.' }] },
      RICE
    ] }),

  R({ id: 'gigantes', isNew: true, name: 'Ofenbohnen nach griechischer Art mit Spinat, Feta und Skyr', short: 'Ofenbohnen', cuisine: 'Griechisch', kind: 'veg', base: 'Brot', reheat: 'sehr gut',
    note: 'Skyr als Klecks obendrauf. Mit 2 Scheiben Vollkornbrot servieren.',
    i: [['weisse', 720], ['tomaten', 800], ['spinat', 450], ['feta', 200], ['skyr', 450], ['brot', 8], ['zwiebel', 2], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Bohnen', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln und Knoblauch in Öl anschwitzen, Tomaten und Oregano zugeben, 5 Min köcheln.' },
        { k: 'a', m: 6, d: 'Ofen', t: 'Ofen auf 200 °C. Bohnen, gefrorenen Spinat und Sauce in eine Auflaufform mischen, Feta darüber bröseln.' },
        { k: 'p', m: 30, d: 'Ofen', t: 'Backen, bis die Oberfläche Farbe hat.' }] }
    ] }),

  R({ id: 'ratatouille', isNew: true, name: 'Ratatouille mit Linsen, Feta und Kräuter-Skyr', short: 'Ratatouille', cuisine: 'Französisch', kind: 'veg', base: 'Brot', reheat: 'sehr gut',
    note: 'Schmeckt warm und kalt. Skyr erst beim Essen dazugeben. Mit 1 bis 2 Scheiben Vollkornbrot.',
    i: [['berglinsen', 250], ['zucchini', 2], ['aubergine', 1], ['paprika', 2], ['tomaten', 800], ['feta', 200], ['skyr', 450], ['brot', 6], ['zwiebel', 2], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 3]],
    tracks: [
      { n: 'Ratatouille', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Zucchini, Aubergine, Paprika, Zwiebeln würfeln und in Öl mit Knoblauch anbraten.' },
        { k: 'p', m: 30, d: 'Herd', t: 'Tomaten, Linsen, Oregano und 400 ml Wasser zugeben, schmoren.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Abschmecken, Feta zerbröseln und beim Servieren darübergeben.' }] }
    ] }),

  R({ id: 'blumenkohl_ofen', isNew: true, name: 'Ofen-Blumenkohl mit Halloumi, Kichererbsen und Tahin-Skyr', short: 'Blumenkohl-Ofen', cuisine: 'Libanesisch', kind: 'veg', base: 'Couscous', reheat: 'gut',
    note: 'Tahin gibt es oft nur im Kaufland oder Marktkauf. Ohne Tahin schmeckt der Skyr-Dip mit etwas mehr Zitrone auch gut.',
    i: [['blumenkohl', 2], ['kichererbsen', 480], ['halloumi', 225], ['couscous', 200], ['skyr', 450], ['tahin', 2], ['zitrone', 1], ['zwiebel', 1], ['knoblauch', 2], ['kreuzkuemmel', 2], ['paprikapulver', 2], ['olivenoel', 3]],
    tracks: [
      { n: 'Blech', ph: [
        { k: 'a', m: 15, d: 'Ofen', t: 'Ofen auf 220 °C Umluft. Blumenkohl in Röschen, Zwiebel in Spalten, mit Öl, Kreuzkümmel und Paprikapulver auf zwei Bleche geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, einmal wenden.' },
        { k: 'a', m: 4, d: 'Ofen', t: 'Abgetropfte Kichererbsen und gewürfelten Halloumi aufs Blech geben.' },
        { k: 'p', m: 12, d: 'Ofen', t: 'Weiterbacken.' }] },
      COUSC,
      { n: 'Dip', ph: [{ k: 'a', m: 4, d: '', t: 'Skyr mit Tahin, Zitronensaft, Knoblauch und Salz verrühren.' }] }
    ] }),

  R({ id: 'stroganoff', isNew: true, name: 'Pilz-Hähnchen-Stroganoff mit Skyr und Vollkornnudeln', short: 'Stroganoff', cuisine: 'Russisch', kind: 'fleisch', base: 'Nudeln', reheat: 'gut',
    note: 'Skyr nie mitkochen, sonst flockt er aus. Beim Aufwärmen nur sanft erhitzen.',
    i: [['huehnchen', 400], ['champignons', 400], ['skyr', 450], ['nudeln', 320], ['zwiebel', 2], ['knoblauch', 2], ['paprikapulver', 2], ['senf', 1], ['bruehe', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Aufgetautes Hähnchen in Streifen in Öl scharf anbraten, Zwiebeln, Knoblauch und Champignons zugeben.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Garen, bis die Flüssigkeit verdampft ist, mit Brühe ablöschen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Pfanne vom Herd nehmen, Skyr mit Senf und Paprikapulver einrühren.' }] },
      PASTA
    ] }),

  R({ id: 'karibisch', isNew: true, name: 'Karibischer Reis mit Bohnen, Kokos und Hähnchen', short: 'Reis-Bohnen', cuisine: 'Karibisch', kind: 'fleisch', base: 'Reis', reheat: 'sehr gut',
    note: 'Alles in einem Topf. Wird am zweiten Tag noch aromatischer.',
    i: [['huehnchen', 500], ['kidney', 480], ['kokos', 400], ['reis', 240], ['paprika', 2], ['zwiebel', 2], ['knoblauch', 3], ['ingwer', 3], ['paprikapulver', 2], ['oregano', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Topf', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln und in Öl anbraten, Zwiebeln, Knoblauch, Ingwer und Paprika würfeln und mitbraten, Gewürze zugeben.' },
        { k: 'p', m: 40, d: 'Herd', t: 'Reis, Bohnen, Kokosmilch und 300 ml Wasser zugeben, zugedeckt garen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Umrühren und abschmecken.' }] }
    ] }),

  R({ id: 'chili_sin', isNew: true, name: 'Chili sin carne mit Tofu-Hack, Quinoa und Skyr', short: 'Chili sin carne', cuisine: 'Tex-Mex', kind: 'veg', base: 'Quinoa', reheat: 'sehr gut',
    note: 'Der zerbröselte Tofu ersetzt das Hack. Mild gehalten, Skyr als Sauerrahm-Ersatz erst beim Essen.',
    i: [['tofu', 400], ['kidney', 480], ['tomaten', 800], ['mais', 285], ['paprika', 2], ['quinoa', 200], ['skyr', 450], ['zwiebel', 2], ['knoblauch', 3], ['tomatenmark', 2], ['paprikapulver', 2], ['kreuzkuemmel', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Chili', ph: [
        { k: 'a', m: 15, d: 'Herd', t: 'Zwiebeln, Knoblauch und Paprika würfeln. Tofu zerbröseln und in Öl anbraten, Tomatenmark und Gewürze zugeben.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Tomaten, Bohnen, Mais und 200 ml Wasser zugeben, köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Abschmecken, mild halten.' }] },
      { n: 'Quinoa', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Quinoa abspülen, mit der doppelten Menge Wasser aufsetzen.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Garen und quellen lassen.' }] }
    ] }),

  R({ id: 'moussaka', isNew: true, name: 'Moussaka mit Pute, Aubergine und Skyr-Haube', short: 'Moussaka', cuisine: 'Griechisch', kind: 'fleisch', early: true, base: 'Kartoffel', reheat: 'sehr gut',
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. In Stücke geschnitten gut aufzuwärmen.',
    i: [['putenhack', 500], ['aubergine', 2], ['kartoffeln', 600], ['tomaten', 400], ['skyr', 450], ['tomatenmark', 1], ['zwiebel', 2], ['knoblauch', 2], ['zimt', 1], ['oregano', 1], ['olivenoel', 3]],
    tracks: [
      { n: 'Gemüse', ph: [
        { k: 'a', m: 12, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Auberginen und Kartoffeln in Scheiben schneiden, mit Öl und Salz auf zwei Bleche legen.' },
        { k: 'p', m: 20, d: 'Ofen', t: 'Vorbacken.' },
        { k: 'a', m: 10, d: 'Ofen', w: ['Hack'], t: 'Gemüse und Hackfleischsauce in einer Auflaufform schichten, oben den Skyr verstreichen.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Überbacken, bis die Haube Farbe hat.' }] },
      { n: 'Hack', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebeln und Knoblauch würfeln, Hack in Öl krümelig anbraten, Tomatenmark, Zimt und Oregano zugeben.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Tomaten zugeben und einköcheln lassen.' }] }
    ] }),

  R({ id: 'butter_chicken', isNew: true, name: 'Butter Chicken light mit Skyr und Vollkornreis', short: 'Butter Chicken', cuisine: 'Indisch', kind: 'fleisch', base: 'Reis', reheat: 'sehr gut',
    note: 'Skyr statt Sahne: erst nach dem Kochen einrühren und danach nicht mehr aufkochen. Aufwärmen bei niedriger Leistung.',
    i: [['huehnchen', 500], ['tomaten', 400], ['skyr', 450], ['reis', 240], ['zwiebel', 2], ['knoblauch', 3], ['ingwer', 3], ['garammasala', 2], ['paprikapulver', 2], ['kurkuma', 1], ['tomatenmark', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Curry', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln, mit den Gewürzen in Öl anbraten, Zwiebeln, Knoblauch und Ingwer zugeben, Tomatenmark und Tomaten einrühren.' },
        { k: 'p', m: 20, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Herd aus, Skyr einrühren, abschmecken.' }] },
      RICE
    ] }),

  R({ id: 'pho', isNew: true, name: 'Vietnamesische Hähnchen-Nudelsuppe mit Champignons und Karotten', short: 'Pho-Suppe', cuisine: 'Vietnamesisch', kind: 'fleisch', base: 'Nudeln', reheat: 'gut',
    note: 'Nach Phở-Art, mild. Nudeln und Brühe getrennt aufbewahren und beim Essen zusammengeben, dann bleiben die Nudeln bissfest.',
    i: [['huehnchen', 600], ['reisnudeln', 250], ['champignons', 400], ['karotten', 300], ['zitrone', 1], ['zwiebel', 2], ['ingwer', 4], ['knoblauch', 3], ['sojasauce', 3], ['fischsauce', 2], ['bruehe', 3]],
    tracks: [
      { n: 'Brühe', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Zwiebeln halbieren und im trockenen Topf anbräunen. Ingwer und Knoblauch in Scheiben schneiden, zugeben. Aufgetautes Hähnchen, 1,6 l Wasser, Brühe und Sojasauce zugeben.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Köcheln lassen, bis das Hähnchen gar ist.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Hähnchen herausnehmen und zerzupfen. Karotten und Champignons in dünne Scheiben schneiden und in die Brühe geben.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Gemüse garen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Hähnchen zurück in die Brühe, mit Fischsauce und Zitronensaft abschmecken.' }] },
      { n: 'Nudeln', ph: [
        { k: 'a', m: 2, d: '', t: 'Reisnudeln mit kochendem Wasser übergießen.' },
        { k: 'p', m: 10, d: '', t: 'Quellen lassen.' },
        { k: 'a', m: 2, d: '', t: 'Abgießen und mit kaltem Wasser abspülen.' }] }
    ] }),

  R({ id: 'viet_hack', isNew: true, name: 'Vietnamesische Hack-Bowl mit Paprika, Ei und Reis', short: 'Hack-Bowl', cuisine: 'Vietnamesisch', kind: 'fleisch', base: 'Reis', reheat: 'gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Mild, süßlich-salzig.',
    i: [['putenhack', 500], ['eier', 6], ['reis', 240], ['paprika', 3], ['karotten', 200], ['zwiebel', 2], ['ingwer', 3], ['knoblauch', 3], ['sojasauce', 3], ['fischsauce', 1], ['honig', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Hack', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Zwiebeln, Knoblauch, Ingwer, Paprika und Karotten klein schneiden. Hack in Öl anbraten, das Gemüse zugeben.' },
        { k: 'p', m: 10, d: 'Herd', t: 'Sojasauce, Fischsauce, Honig und 100 ml Wasser zugeben, einköcheln lassen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abschmecken.' }] },
      { n: 'Eier', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Eier in kochendes Wasser legen.' },
        { k: 'p', m: 9, d: 'Herd', t: 'Kochen.' },
        { k: 'a', m: 4, d: '', t: 'Abschrecken, pellen und halbieren.' }] },
      RICE
    ] }),

  R({ id: 'viet_nudel', isNew: true, name: 'Reisnudel-Wok mit Tofu, Ei und Erdnuss-Sauce', short: 'Nudel-Wok', cuisine: 'Vietnamesisch', kind: 'veg', base: 'Nudeln', reheat: 'gut',
    note: 'Mild. Beim Aufwärmen einen Schuss Wasser zugeben.',
    i: [['tofu', 800], ['reisnudeln', 250], ['wok', 600], ['eier', 4], ['erdnussbutter', 3], ['sojasauce', 3], ['honig', 1], ['zitrone', 1], ['ingwer', 3], ['knoblauch', 3], ['sesamoel', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Tofu', ph: [
        { k: 'a', m: 8, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Tofu abtropfen, würfeln, mit 1 EL Sojasauce und Öl mischen, aufs Blech geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, nach 12 Min wenden.' }] },
      { n: 'Nudeln', ph: [
        { k: 'a', m: 2, d: '', t: 'Reisnudeln mit kochendem Wasser übergießen.' },
        { k: 'p', m: 10, d: '', t: 'Quellen lassen.' },
        { k: 'a', m: 2, d: '', t: 'Abgießen.' }] },
      { n: 'Wok', ph: [
        { k: 'a', m: 5, d: '', t: 'Sauce rühren: Erdnussbutter, 2 EL Sojasauce, Honig, Zitronensaft, Sesamöl und 100 ml warmes Wasser.' },
        { k: 'a', m: 12, d: 'Herd', t: 'Knoblauch und Ingwer in Öl anbraten, gefrorenes Wok-Gemüse zugeben und braten. Eier zugeben und stocken lassen.' },
        { k: 'a', m: 3, d: 'Herd', w: ['Tofu', 'Nudeln'], t: 'Tofu, Nudeln und Sauce unterheben, kurz erwärmen.' }] }
    ] }),

  R({ id: 'geschnetzeltes', isNew: true, name: 'Paprika-Geschnetzeltes mit Hähnchen, Skyr und Vollkornnudeln', short: 'Geschnetzeltes', cuisine: 'Deutsch', kind: 'fleisch', base: 'Nudeln', reheat: 'gut',
    note: 'Skyr erst nach dem Kochen einrühren, sonst flockt er aus. Beim Aufwärmen nicht aufkochen.',
    i: [['huehnchen', 500], ['skyr', 450], ['paprika', 4], ['champignons', 400], ['nudeln', 320], ['tomatenmark', 2], ['zwiebel', 2], ['paprikapulver', 3], ['bruehe', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Pfanne', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Aufgetautes Hähnchen in Streifen schneiden und in Öl anbraten. Zwiebeln, Paprika und Champignons schneiden und mitbraten.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Tomatenmark, Paprikapulver, Brühe und 200 ml Wasser zugeben, köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Herd aus, Skyr einrühren, abschmecken.' }] },
      PASTA
    ] }),

  R({ id: 'kartoffelauflauf', isNew: true, name: 'Kartoffel-Lauch-Auflauf mit Putenhack, Ei und Mozzarella', short: 'Kartoffelauflauf', cuisine: 'Deutsch', kind: 'fleisch', base: 'Kartoffel', reheat: 'sehr gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Lässt sich sehr gut aufwärmen.',
    i: [['putenhack', 500], ['kartoffeln', 1000], ['lauch', 2], ['eier', 4], ['huettenkaese', 200], ['mozzarella', 125], ['zwiebel', 1], ['senf', 1], ['bruehe', 1], ['olivenoel', 1]],
    tracks: [
      { n: 'Kartoffeln', ph: [
        { k: 'a', m: 10, d: 'Herd', t: 'Kartoffeln schälen, in dünne Scheiben schneiden, in Salzwasser aufsetzen.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Vorgaren, abgießen.' }] },
      { n: 'Hack', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Zwiebel und Lauch schneiden. Hack in Öl anbraten, Zwiebel und Lauch zugeben, mit Brühe und Senf abschmecken.' }] },
      { n: 'Auflauf', ph: [
        { k: 'a', m: 8, d: 'Ofen', w: ['Kartoffeln', 'Hack'], t: 'Ofen auf 200 °C Umluft. Kartoffeln und Hack schichten. Eier mit Hüttenkäse verquirlen, darübergießen, Mozzarella darüberzupfen.' },
        { k: 'p', m: 30, d: 'Ofen', t: 'Backen, bis die Oberfläche goldbraun ist.' }] }
    ] }),

  R({ id: 'frikadellen', isNew: true, name: 'Putenfrikadellen mit Ofenkartoffeln, Brokkoli und Kräuter-Skyr', short: 'Frikadellen', cuisine: 'Deutsch', kind: 'fleisch', base: 'Kartoffel', reheat: 'gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Frikadellen kalt oder im Ofen aufwärmen.',
    i: [['putenhack', 500], ['kartoffeln', 1000], ['brokkoli', 500], ['skyr', 450], ['eier', 2], ['brot', 2], ['petersilie', 1], ['zwiebel', 2], ['senf', 1], ['olivenoel', 3]],
    tracks: [
      { n: 'Kartoffeln', ph: [
        { k: 'a', m: 10, d: 'Ofen', t: 'Ofen auf 200 °C Umluft. Kartoffeln in Spalten schneiden, mit Öl und Salz aufs Blech geben.' },
        { k: 'p', m: 35, d: 'Ofen', t: 'Backen, einmal wenden.' }] },
      { n: 'Frikadellen', ph: [
        { k: 'a', m: 16, d: 'Herd', t: 'Brot in Wasser einweichen und ausdrücken. Hack, Ei, Zwiebel, Senf und Brot mischen, zu Frikadellen formen. In Öl von beiden Seiten braten.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 5, d: '', t: 'Skyr mit gehackter Petersilie, Salz und Pfeffer verrühren.' }] },
      { n: 'Brokkoli', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Gefrorenen Brokkoli in Salzwasser aufsetzen.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Garen.' },
        { k: 'a', m: 1, d: '', t: 'Abgießen.' }] }
    ] }),

  R({ id: 'cacciatore', isNew: true, name: 'Hähnchen-Cacciatore mit Paprika, Champignons und Vollkornnudeln', short: 'Cacciatore', cuisine: 'Italienisch', kind: 'fleisch', base: 'Nudeln', reheat: 'sehr gut',
    note: 'Schmorgericht, wird beim Aufwärmen besser. Sauce und Nudeln getrennt aufbewahren.',
    i: [['huehnchen', 600], ['tomaten', 800], ['paprika', 3], ['champignons', 400], ['nudeln', 320], ['tomatenmark', 1], ['zwiebel', 2], ['knoblauch', 3], ['oregano', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Sauce', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln und in Öl anbraten. Zwiebeln, Paprika, Champignons und Knoblauch schneiden und mitbraten.' },
        { k: 'p', m: 30, d: 'Herd', t: 'Tomaten, Tomatenmark, Oregano und 100 ml Wasser zugeben, schmoren lassen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abschmecken.' }] },
      PASTA
    ] }),

  R({ id: 'kokossuppe', isNew: true, name: 'Thai-Kokossuppe mit Hähnchen, Champignons und Reis', short: 'Kokossuppe', cuisine: 'Thai', kind: 'fleisch', base: 'Reis', reheat: 'gut',
    note: 'Mild gehalten, Currypaste sparsam. Reis separat aufbewahren.',
    i: [['huehnchen', 600], ['kokos', 400], ['champignons', 400], ['paprika', 2], ['reis', 240], ['currypaste', 2], ['zitrone', 1], ['zwiebel', 1], ['ingwer', 3], ['sojasauce', 2], ['bruehe', 2], ['olivenoel', 1]],
    tracks: [
      { n: 'Suppe', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln. Mit Zwiebel, Ingwer und Currypaste in Öl anbraten.' },
        { k: 'p', m: 18, d: 'Herd', t: 'Kokosmilch, 600 ml Wasser, Brühe, geschnittene Champignons und Paprika zugeben, köcheln lassen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Mit Zitronensaft und Sojasauce abschmecken.' }] },
      RICE
    ] }),

  R({ id: 'thai_hack', isNew: true, name: 'Thai-Hackpfanne mit Paprika, Erbsen, Ei und Reis', short: 'Thai-Hack', cuisine: 'Thai', kind: 'fleisch', base: 'Reis', reheat: 'gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Mild, ohne Chili.',
    i: [['putenhack', 500], ['eier', 4], ['erbsen', 450], ['paprika', 3], ['reis', 240], ['currypaste', 1], ['zwiebel', 1], ['ingwer', 3], ['knoblauch', 3], ['sojasauce', 3], ['fischsauce', 1], ['honig', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Pfanne', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Zwiebel, Knoblauch, Ingwer und Paprika schneiden. Hack mit Currypaste in Öl anbraten, Gemüse zugeben.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Gefrorene Erbsen, Sojasauce, Fischsauce, Honig und 80 ml Wasser zugeben, garen.' },
        { k: 'a', m: 4, d: 'Herd', t: 'Eier verquirlen und unterrühren, stocken lassen.' }] },
      RICE
    ] }),

  R({ id: 'kuerbis_pasta', isNew: true, src: 'REWE Rezeptideen', name: 'Lauwarmer Kürbis-Pastasalat mit Mozzarella und Kichererbsen', short: 'Kürbis-Pastasalat', cuisine: 'Herbstküche', kind: 'veg', base: 'Nudeln', reheat: 'gut',
    note: 'Schmeckt lauwarm und kalt. Salat und Dressing erst beim Essen dazugeben, dann bleibt alles knackig.',
    i: [['nudeln', 320], ['hokkaido', 1], ['mozzarella', 250], ['kichererbsen', 480], ['salat', 1], ['kuerbiskerne', 60], ['honig', 1], ['balsamico', 2], ['olivenoel', 3]],
    tracks: [
      { n: 'Kürbis', ph: [
        { k: 'a', m: 10, d: 'Ofen', t: 'Ofen auf 180 °C Umluft. Kürbis entkernen und mit Schale würfeln, mit 1 EL Öl und Salz aufs Blech geben.' },
        { k: 'p', m: 25, d: 'Ofen', t: 'Backen, bis er weich ist.' }] },
      PASTA,
      { n: 'Salat', ph: [
        { k: 'a', m: 8, d: '', w: ['Kürbis', 'Nudeln'], t: 'Salat in Streifen schneiden, Mozzarella abtropfen und Kichererbsen abspülen. Aus Balsamico, Honig und 2 EL Öl ein Dressing rühren. Alles mit Nudeln und Kürbis mischen, Kürbiskerne darüberstreuen.' }] }
    ] }),

  R({ id: 'lachs_spinat_reis', isNew: true, src: 'REWE Rezeptideen', name: 'Lachs mit Frischkäse-Spinat und Vollkornreis', short: 'Lachs-Spinat-Reis', cuisine: 'Hausküche', kind: 'fisch', base: 'Reis', reheat: 'bedingt',
    note: 'Lachs am zweiten Tag lieber kalt oder nur kurz bei niedriger Leistung erwärmen. Spinat extra erhitzen.',
    i: [['lachs', 500], ['spinat', 450], ['reis', 240], ['frischkaese', 100], ['zwiebel', 1], ['knoblauch', 1], ['zitrone', 1], ['honig', 1], ['bruehe', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Spinat', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Zwiebel und Knoblauch würfeln, in Öl anschwitzen. Aufgetauten Spinat zugeben.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Dünsten, bis das Wasser verdampft ist.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Mit 100 ml Brühe ablöschen, Frischkäse einrühren und abschmecken.' }] },
      { n: 'Lachs', ph: [
        { k: 'a', m: 4, d: 'Herd', t: 'Aufgetauten Lachs salzen und pfeffern. Von beiden Seiten braten, mit Zitronensaft und Honig beträufeln.' },
        { k: 'p', m: 7, d: 'Herd', t: 'Braten, einmal wenden.' }] },
      RICE
    ] }),

  R({ id: 'pilzgulasch', isNew: true, src: 'REWE Rezeptideen', name: 'Rindergulasch mit Pilzen und Spätzle', short: 'Pilzgulasch', cuisine: 'Deutsch', kind: 'fleisch', base: 'Nudeln', reheat: 'sehr gut',
    note: 'Das Schmoren läuft lange von allein. Wird beim Aufwärmen noch besser. Paprikapulver edelsüß, nicht scharf.',
    i: [['rindergulasch', 600], ['champignons', 600], ['spaetzle', 500], ['paprika', 1], ['frischkaese', 100], ['zwiebel', 2], ['paprikapulver', 3], ['tomatenmark', 1], ['bruehe', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Gulasch', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Gulasch portionsweise in Öl scharf anbraten und herausnehmen. Zwiebeln und Paprika würfeln und im selben Topf anschwitzen.' },
        { k: 'a', m: 8, d: 'Herd', t: 'Pilze putzen, vierteln und mit anbraten. Fleisch zurück in den Topf, Tomatenmark und Paprikapulver zugeben, mit 500 ml Brühe ablöschen.' },
        { k: 'p', m: 80, d: 'Herd', t: 'Zugedeckt bei kleiner Hitze schmoren, bis das Fleisch zart ist.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Frischkäse einrühren und abschmecken.' }] },
      { n: 'Spätzle', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Wasser für die Spätzle aufsetzen.' },
        { k: 'p', m: 4, d: 'Herd', w: ['Gulasch'], t: 'Spätzle nach Packungsangabe garen.' },
        { k: 'a', m: 1, d: 'Herd', t: 'Abgießen.' }] }
    ] }),

  R({ id: 'kartoffelpfanne', isNew: true, src: 'REWE Rezeptideen', name: 'Herbstliche Kartoffelpfanne mit Schweinefilet, Lauch und Pilzen', short: 'Kartoffelpfanne', cuisine: 'Deutsch', kind: 'fleisch', base: 'Kartoffel', reheat: 'gut',
    note: 'Die Kartoffeln dürfen ruhig schon am Vortag gekocht sein, dann bräunen sie besser.',
    i: [['schweinefilet', 800], ['kartoffeln', 800], ['champignons', 200], ['karotten', 400], ['lauch', 2], ['paprika', 1], ['petersilie', 1], ['zwiebel', 1], ['paprikapulver', 2], ['bruehe', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Kartoffeln', ph: [
        { k: 'a', m: 3, d: 'Herd', t: 'Kartoffeln mit Schale in Salzwasser aufsetzen.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Gar kochen.' },
        { k: 'a', m: 6, d: '', t: 'Abgießen, pellen und würfeln.' }] },
      { n: 'Pfanne', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Fleisch in Streifen schneiden, in Öl braun anbraten und herausnehmen. Lauch, Karotten, Zwiebel, Paprika und Pilze schneiden.' },
        { k: 'a', m: 6, d: 'Herd', t: 'Lauch, Karotten, Zwiebel und Pilze im Bratfett anbraten, mit Brühe ablöschen.' },
        { k: 'p', m: 12, d: 'Herd', t: 'Garen, nach 5 Min die Paprika zugeben.' },
        { k: 'a', m: 4, d: 'Herd', w: ['Kartoffeln'], t: 'Kartoffelwürfel und Fleisch zugeben, mit Paprikapulver, Salz und Pfeffer würzen, Petersilie darüberstreuen.' }] }
    ] }),

  R({ id: 'cabanossi_eintopf', isNew: true, src: 'REWE Rezeptideen', name: 'Cabanossi-Bohneneintopf mit Kartoffeln und Skyr', short: 'Cabanossi-Eintopf', cuisine: 'Deutsch', kind: 'fleisch', base: 'Eintopf', reheat: 'sehr gut',
    note: 'Skyr erst im Teller obendrauf geben. Die Wurst ist deftig, deshalb nur eine Packung. Das Eiweiß kommt vor allem von Bohnen und Skyr.',
    i: [['cabanossi', 250], ['kartoffeln', 600], ['karotten', 300], ['paprika', 2], ['champignons', 200], ['weisse', 480], ['skyr', 450], ['zwiebel', 2], ['tomatenmark', 1], ['paprikapulver', 2], ['bruehe', 2], ['petersilie', 1], ['olivenoel', 1]],
    tracks: [
      { n: 'Eintopf', ph: [
        { k: 'a', m: 16, d: 'Herd', t: 'Zwiebeln, Karotten, Paprika und Pilze schneiden, Kartoffeln würfeln. Zwiebeln, Karotten und Pilze in Öl anbraten, Tomatenmark zugeben.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Mit 800 ml Wasser und Brühe aufgießen, Kartoffeln und Paprika zugeben.' },
        { k: 'p', m: 18, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Cabanossi in Stücken und abgespülte Bohnen zugeben.' },
        { k: 'p', m: 5, d: 'Herd', t: 'Mitziehen lassen, mit Paprikapulver und Salz abschmecken, Petersilie darüber.' }] }
    ] }),

  R({ id: 'ramen_tofu', isNew: true, src: 'REWE Rezeptideen', name: 'Ramen mit Ei, Tofu und Pilzen', short: 'Ramen', cuisine: 'Japanisch', kind: 'veg', base: 'Nudeln', reheat: 'gut',
    note: 'Nudeln, Brühe und Beilagen getrennt aufbewahren und erst beim Essen zusammengeben. Ohne Chili, mild.',
    i: [['ramen', 250], ['tofu', 800], ['eier', 6], ['champignons', 400], ['wok', 600], ['bruehe', 3], ['ingwer', 3], ['knoblauch', 3], ['sojasauce', 3], ['sesamoel', 1]],
    tracks: [
      { n: 'Brühe', ph: [
        { k: 'a', m: 6, d: 'Herd', t: 'Ingwer in Scheiben und Knoblauch andrücken. Mit Brühe, 1,2 l Wasser und Sojasauce aufsetzen.' },
        { k: 'p', m: 20, d: 'Herd', t: 'Leise köcheln lassen, am Ende mit Sesamöl abschmecken.' }] },
      { n: 'Tofu', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Tofu abtropfen, in Scheiben schneiden und mit den halbierten Pilzen in Öl goldbraun anbraten.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Braten, einmal wenden.' }] },
      { n: 'Eier', ph: [
        { k: 'a', m: 2, d: 'Herd', t: 'Eier in kochendes Wasser legen.' },
        { k: 'p', m: 7, d: 'Herd', t: 'Weich kochen.' },
        { k: 'a', m: 4, d: '', t: 'Abschrecken, pellen und halbieren.' }] },
      { n: 'Nudeln', ph: [
        { k: 'a', m: 3, d: 'Herd', t: 'Ramen-Nudeln und Wok-Gemüse nach Packungsangabe kochen.' },
        { k: 'p', m: 4, d: 'Herd', t: 'Garen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Abgießen.' }] }
    ] }),

  R({ id: 'hack_polenta', isNew: true, src: 'REWE Rezeptideen', name: 'Hackbällchen-Polenta-Auflauf mit Gemüse und Feta', short: 'Hack-Polenta', cuisine: 'Italienisch', kind: 'fleisch', base: 'Polenta', reheat: 'sehr gut', early: true,
    note: 'Frisches Hack: gehört in den ersten oder zweiten Kochtermin der Woche. Statt Gorgonzola kommt Feta drauf.',
    i: [['putenhack', 500], ['polenta', 250], ['wok', 600], ['feta', 200], ['eier', 1], ['brot', 2], ['zwiebel', 1], ['paprikapulver', 1], ['bruehe', 3], ['olivenoel', 2]],
    tracks: [
      { n: 'Polenta', ph: [
        { k: 'a', m: 4, d: 'Herd', t: 'Brühe mit 750 ml Wasser aufkochen, Polenta unter Rühren einstreuen.' },
        { k: 'p', m: 6, d: 'Herd', t: 'Quellen lassen, dann in eine geölte Auflaufform streichen.' }] },
      { n: 'Hackbällchen', ph: [
        { k: 'a', m: 16, d: 'Herd', t: 'Brot in Wasser einweichen und ausdrücken. Mit Hack, Ei, gewürfelter Zwiebel, Paprikapulver und Salz mischen, kleine Bällchen formen und in Öl rundum anbraten.' }] },
      { n: 'Auflauf', ph: [
        { k: 'a', m: 8, d: 'Ofen', w: ['Polenta', 'Hackbällchen'], t: 'Ofen auf 200 °C Umluft. Gefrorenes Gemüse auf der Polenta verteilen, Hackbällchen eindrücken, Feta darüberbröseln.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Backen, bis der Feta gebräunt ist.' }] }
    ] }),

  R({ id: 'linsen_bowl', isNew: true, src: 'REWE Rezeptideen', name: 'Knusprige Linsen-Bowl mit Couscous, Feta und Walnüssen', short: 'Linsen-Bowl', cuisine: 'Mittelmeer', kind: 'veg', base: 'Couscous', reheat: 'gut',
    note: 'Eine kalte Bowl. Die Linsen nur kurz im Ofen, dann bleiben sie knusprig. Dressing erst vor dem Essen darüber.',
    i: [['linsen_dose', 795], ['couscous', 240], ['feta', 200], ['walnuesse', 80], ['gurke', 1], ['paprika', 2], ['karotten', 200], ['zitrone', 1], ['honig', 1], ['senf', 1], ['paprikapulver', 2], ['kreuzkuemmel', 1], ['olivenoel', 3]],
    tracks: [
      { n: 'Linsen', ph: [
        { k: 'a', m: 6, d: 'Ofen', t: 'Ofen auf 180 °C Umluft. Linsen abspülen und gut trocknen, mit 1 EL Öl, Paprikapulver, Kreuzkümmel und Salz mischen, aufs Blech geben.' },
        { k: 'p', m: 22, d: 'Ofen', t: 'Backen, einmal wenden.' }] },
      COUSC,
      { n: 'Bowl', ph: [
        { k: 'a', m: 12, d: '', t: 'Gurke, Paprika und Karotten schneiden bzw. raspeln, Walnüsse hacken, Feta würfeln. Aus Zitronensaft, 2 EL Öl, Honig, Senf und Salz ein Dressing rühren.' },
        { k: 'a', m: 3, d: '', w: ['Linsen', 'Couscous'], t: 'Alles nebeneinander in Boxen verteilen.' }] }
    ] }),

  R({ id: 'curry_couscous', isNew: true, src: 'REWE Rezeptideen', name: 'Mildes Hähnchen-Curry mit Paprika, Mais und Couscous', short: 'Hähnchen-Curry', cuisine: 'Indisch', kind: 'fleisch', base: 'Couscous', reheat: 'sehr gut',
    note: 'Gewürze sparsam, mild. Statt Cashewmus kommt Erdnussbutter rein.',
    i: [['huehnchen', 500], ['kokos', 400], ['karotten', 300], ['paprika', 2], ['mais', 285], ['couscous', 240], ['erdnussbutter', 1], ['zwiebel', 1], ['knoblauch', 2], ['curry', 2], ['kurkuma', 1], ['kreuzkuemmel', 1], ['bruehe', 2], ['olivenoel', 2]],
    tracks: [
      { n: 'Curry', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Aufgetautes Hähnchen würfeln, in Öl anbraten. Zwiebel und Knoblauch zugeben, dann Curry, Kurkuma und Kreuzkümmel kurz mitrösten. Karotten in Scheiben, Paprika in Streifen zugeben.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Mit Kokosmilch und 200 ml Wasser samt Brühe aufkochen und köcheln lassen.' },
        { k: 'a', m: 3, d: 'Herd', t: 'Erdnussbutter und abgetropften Mais einrühren, abschmecken.' }] },
      COUSC
    ] }),

  R({ id: 'spinatknoedel', isNew: true, src: 'REWE Rezeptideen', name: 'Spinatknödel mit Parmesan und Skyr-Dip', short: 'Spinatknödel', cuisine: 'Deutsch', kind: 'veg', base: 'Brot', reheat: 'gut',
    note: 'Am zweiten Tag in Scheiben in der Pfanne anbraten, so schmecken sie fast frisch.',
    i: [['brot', 8], ['spinat', 450], ['eier', 4], ['parmesan', 200], ['skyr', 450], ['zwiebel', 1], ['knoblauch', 1], ['olivenoel', 2]],
    tracks: [
      { n: 'Knödel', ph: [
        { k: 'a', m: 14, d: 'Herd', t: 'Brot würfeln und mit 150 ml heißem Wasser übergießen. Zwiebel und Knoblauch würfeln, in Öl anschwitzen, gefrorenen Spinat zugeben und ausdampfen lassen.' },
        { k: 'a', m: 10, d: '', t: 'Spinat, Eier, 150 g geriebenen Parmesan und Salz zum Brot geben, mit nassen Händen etwa 8 Knödel formen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Knödel in siedendes Salzwasser legen.' },
        { k: 'p', m: 15, d: 'Herd', t: 'Ziehen lassen, bis sie oben schwimmen.' }] },
      { n: 'Dip', ph: [
        { k: 'a', m: 4, d: '', t: 'Skyr mit restlichem Parmesan, Salz und Pfeffer verrühren.' }] }
    ] }),

  R({ id: 'seelachs_lauch', isNew: true, src: 'REWE Rezeptideen', name: 'Panierter Seelachs mit Lauchrahm und Pellkartoffeln', short: 'Seelachs-Lauch', cuisine: 'Deutsch', kind: 'fisch', base: 'Kartoffel', reheat: 'bedingt',
    note: 'Der Fisch schmeckt frisch am besten. Am zweiten Tag kurz im Ofen knusprig machen. Lauchrahm separat aufwärmen.',
    i: [['seelachs', 800], ['kartoffeln', 1000], ['lauch', 3], ['eier', 2], ['brot', 4], ['frischkaese', 100], ['zitrone', 1], ['knoblauch', 2], ['bruehe', 1], ['olivenoel', 3]],
    tracks: [
      { n: 'Kartoffeln', ph: [
        { k: 'a', m: 3, d: 'Herd', t: 'Kartoffeln mit Schale in Salzwasser aufsetzen.' },
        { k: 'p', m: 25, d: 'Herd', t: 'Gar kochen, danach abgießen und pellen.' }] },
      { n: 'Lauchrahm', ph: [
        { k: 'a', m: 8, d: 'Herd', t: 'Lauch in halbe Ringe schneiden, Knoblauch hacken. In Öl andünsten, mit Brühe und 100 ml Wasser ablöschen.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Köcheln lassen.' },
        { k: 'a', m: 2, d: 'Herd', t: 'Frischkäse einrühren, mit Salz, Pfeffer und Zitronensaft abschmecken.' }] },
      { n: 'Fisch', ph: [
        { k: 'a', m: 12, d: 'Herd', t: 'Aufgetauten Fisch trocken tupfen und salzen. Brot fein zerbröseln. Fisch erst durchs verquirlte Ei, dann durch die Brösel ziehen und in Öl goldbraun braten.' },
        { k: 'p', m: 8, d: 'Herd', t: 'Braten, einmal wenden.' }] }
    ] })
];

const BY_ID = {};
const COUNTRY = { 'Italienisch': 'Italien', 'Toskanisch': 'Italien', 'Deutsch': 'Deutschland', 'Hausküche': 'Deutschland', 'Herbstküche': 'Deutschland', 'Thai': 'Thailand', 'Vietnamesisch': 'Vietnam',
  'Indisch': 'Indien', 'Griechisch': 'Griechenland', 'Türkisch': 'Türkei', 'Spanisch': 'Spanien', 'Französisch': 'Frankreich', 'Mexikanisch': 'Mexiko', 'Tex-Mex': 'Mexiko',
  'Nahost': 'Orient', 'Levante': 'Orient', 'Libanesisch': 'Orient', 'Marokkanisch': 'Orient', 'Mittelmeer': 'Mittelmeer', 'Ostasiatisch': 'Asien', 'Südostasiatisch': 'Asien', 'Japanisch': 'Japan',
  'Skandinavisch': 'Skandinavien', 'Russisch': 'Russland', 'Karibisch': 'Karibik' };
RECIPES.forEach(r => { BY_ID[r.id] = r; r.servings = 4; r.country = COUNTRY[r.cuisine] || r.cuisine; });
function countries(list) {
  const c = {};
  (list || RECIPES).forEach(r => { c[r.country] = (c[r.country] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a] || a.localeCompare(b, 'de')).map(k => ({ name: k, n: c[k] }));
}

/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */
const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
function fmtQ(x) {
  const w = Math.floor(x + 1e-9), f = Math.round((x - w) * 4) / 4;
  if (f >= 1) return String(w + 1);
  if (f === 0) return String(w);
  return (w ? w : '') + FR[f];
}
function fmtSize(n, unit) {
  if (unit === 'g') return n >= 1000 ? (n / 1000).toString().replace('.', ',') + ' kg' : Math.round(n) + ' g';
  if (unit === 'ml') return n >= 1000 ? (n / 1000).toString().replace('.', ',') + ' l' : Math.round(n) + ' ml';
  return String(n);
}
function fmtAmt(id, a) {
  const g = ING[id];
  if (g.fm) return g.fm(a);
  if (g.unit === 'g' || g.unit === 'ml') return fmtSize(a, g.unit) + ' ' + g.n + (g.ps ? ' (' + g.ps + ')' : '');
  return a + ' ' + g.unit + ' ' + g.n;
}
function fmtDur(m) {
  m = Math.round(m);
  if (m < 60) return m + ' Min';
  const h = Math.floor(m / 60), r = m % 60;
  return h + ' h' + (r ? ' ' + r + ' Min' : '');
}
function fmtClock(m) { m = Math.round(m); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }

function nutri(r) {
  let p = 0, k = 0, f = 0;
  r.i.forEach(([id, a]) => {
    const g = ING[id];
    const fac = (g.unit === 'g' || g.unit === 'ml') ? a / 100 : a;
    p += (g.p || 0) * fac; k += (g.k || 0) * fac; f += (g.f || 0) * fac;
  });
  return { p: p / r.servings, k: k / r.servings, f: f / r.servings };
}
RECIPES.forEach(r => { r.nu = nutri(r); r.spec = r.i.filter(([id]) => ING[id].spec).map(([id]) => id); });

function activeMin(r) { let s = 0; r.tracks.forEach(t => t.ph.forEach(p => { if (p.k === 'a') s += p.m; })); return s; }
function devices(r) { const s = new Set(); r.tracks.forEach(t => t.ph.forEach(p => { if (p.d) s.add(p.d); })); return [...s]; }

/* =========================================================
   EINKAUF
   ========================================================= */
function need(recipes, facs) {
  const t = {};
  recipes.forEach((r, k) => r.i.forEach(([id, a]) => { t[id] = (t[id] || 0) + a * (facs ? facs[k] : 1); }));
  return t;
}
function shop(recipes, facs) {
  const t = need(recipes, facs);
  const items = [], vorrat = [];
  Object.keys(t).forEach(id => {
    const g = ING[id];
    if (g.cls === 'pantry') { vorrat.push({ id, n: g.n, spec: !!g.spec }); return; }
    const packs = Math.max(1, Math.ceil(t[id] / g.pack - 1e-9));
    const left = packs * g.pack - t[id];
    const forR = [...new Set(recipes.filter(r => r.i.some(x => x[0] === id)).map(r => r.short))];
    const counts = g.unit === 'g' || g.unit === 'ml';
    let txt = packs + ' ' + (packs === 1 ? g.pl : g.pls);
    if (counts) txt += ' · je ' + fmtSize(g.pack, g.unit) + (g.ps ? ' ' + g.ps : '');
    else if (g.pack > 1) txt += ' · je ' + g.pack + ' ' + (g.nm || g.unit);
    const rest = (g.cls === 'fresh' || g.cls === 'can') && left > g.pack * 0.04;
    items.push({
      id, n: g.n, spec: !!g.spec, a: g.a, cls: g.cls, need: t[id], packs, left, leftFrac: left / g.pack, forR, txt,
      needTxt: counts ? fmtSize(t[id], g.unit) : (g.fm ? g.fm(t[id]) : fmtQ(t[id]) + ' ' + g.unit),
      leftTxt: rest ? (counts ? fmtSize(left, g.unit) : fmtQ(left) + ' ' + (g.nm || g.unit)) : '', rest
    });
  });
  items.sort((x, y) => AISLES.indexOf(x.a) - AISLES.indexOf(y.a) || x.n.localeCompare(y.n, 'de'));
  vorrat.sort((x, y) => x.n.localeCompare(y.n, 'de'));
  return { items, vorrat };
}
function wasteScore(recipes) {
  const t = need(recipes);
  let w = 0, kinds = 0;
  Object.keys(t).forEach(id => {
    const g = ING[id];
    if (g.cls === 'pantry') return;
    kinds++;
    const packs = Math.max(1, Math.ceil(t[id] / g.pack - 1e-9));
    const frac = (packs * g.pack - t[id]) / g.pack;
    if (g.cls === 'fresh') w += frac;
    else if (g.cls === 'can') w += 0.8 * frac;
  });
  return w + 0.06 * kinds;
}

/* =========================================================
   KOCH-ZEITPLAN (eine Person, mehrere Abläufe parallel)
   Probiert alle sinnvollen Reihenfolgen und nimmt die kürzeste.
   ========================================================= */
function scheduleSession(list) {
  const chains = [];
  list.forEach((r) => r.tracks.forEach((tr) => chains.push({ r, n: tr.n, ph: tr.ph })));
  const n = chains.length;
  const rem = chains.map(c => c.ph.map((p, i) => c.ph.slice(i).reduce((s, x) => s + x.m, 0)));
  const idx = new Array(n).fill(0), ready = new Array(n).fill(0);
  const log = [];
  let best = null;
  function lb(pf) {
    let m = pf;
    for (let i = 0; i < n; i++) {
      if (idx[i] < chains[i].ph.length) m = Math.max(m, ready[i] + rem[i][idx[i]]);
      else m = Math.max(m, ready[i]);
    }
    return m;
  }
  function depReady(i) {
    const w = chains[i].ph[idx[i]].w;
    if (!w) return 0;
    let m = 0;
    for (let j = 0; j < n; j++) {
      if (j === i || chains[j].r !== chains[i].r || !w.includes(chains[j].n)) continue;
      if (idx[j] < chains[j].ph.length) return -1;
      m = Math.max(m, ready[j]);
    }
    return m;
  }
  let nodes = 0;
  const LIM = n > 4 ? 30000 : Infinity;
  function dfs(pf) {
    if (++nodes > LIM && best) return;
    let done = true;
    for (let i = 0; i < n; i++) if (idx[i] < chains[i].ph.length) { done = false; break; }
    if (done) {
      const mk = Math.max(pf, ...ready);
      if (!best || mk < best.mk - 1e-9) best = { mk, log: log.slice() };
      return;
    }
    if (best && lb(pf) >= best.mk - 1e-9) return;
    const cand = [], dr = [];
    for (let i = 0; i < n; i++) if (idx[i] < chains[i].ph.length) {
      const d = depReady(i);
      if (d >= 0) { cand.push(i); dr[i] = d; }
    }
    if (!cand.length) return;
    cand.sort((a, b) => (rem[b][idx[b]] - chains[b].ph[idx[b]].m) - (rem[a][idx[a]] - chains[a].ph[idx[a]].m));
    for (const i of cand) {
      const ph = chains[i].ph[idx[i]];
      const start = Math.max(pf, ready[i], dr[i]), end = start + ph.m;
      const si = idx[i], sr = ready[i], ll = log.length;
      log.push({ c: i, start, end, ph });
      let t = end; idx[i]++;
      while (idx[i] < chains[i].ph.length && chains[i].ph[idx[i]].k === 'p') {
        const p = chains[i].ph[idx[i]];
        log.push({ c: i, start: t, end: t + p.m, ph: p });
        t += p.m; idx[i]++;
      }
      ready[i] = t;
      dfs(end);
      idx[i] = si; ready[i] = sr; log.length = ll;
    }
  }
  dfs(0);
  const events = best.log.map(e => ({
    c: e.c, rid: chains[e.c].r.id, rs: chains[e.c].r.short, tn: chains[e.c].n,
    start: e.start, end: e.end, m: e.ph.m, k: e.ph.k, d: e.ph.d, t: e.ph.t
  })).sort((a, b) => a.start - b.start || a.c - b.c);
  const rows = chains.map((c, i) => ({ c: i, rid: c.r.id, rs: c.r.short, tn: c.n }));
  return { mk: best.mk, events, rows, active: events.filter(e => e.k === 'a').reduce((s, e) => s + e.m, 0) };
}
const schedCache = {};
function sched(list) {
  const key = list.map(r => r.id).sort().join('+');
  if (!schedCache[key]) schedCache[key] = scheduleSession(list);
  return schedCache[key];
}

/* =========================================================
   PLANUNG
   ========================================================= */
const REHEAT_RANK = { 'bedingt': 0, 'gut': 1, 'sehr gut': 2 };

function sessionSizes(D, M) {
  // Gerichte pro Kochtermin: die ersten Termine bekommen eher weniger (5 Gerichte auf 3 Termine: 1, 2, 2)
  if (D <= 0) return [];
  M = Math.max(1, Math.min(M, D));
  const base = Math.floor(D / M), rem = D - base * M, a = [];
  for (let i = 0; i < M; i++) a.push(base + (i >= M - rem ? 1 : 0));
  return a;
}
function assign(rsIn, sizes, opt) {
  // Verteilt die Gerichte auf die Kochtermine (Gruppen laut sizes). Kurze Gesamtzeit, frisches Hack nicht im letzten Termin.
  const rs = rsIn.slice().sort((a, b) => a.id < b.id ? -1 : 1);
  const n = rs.length, M = sizes.length;
  if (!n) return [];
  const ord = (g) => g.slice().sort((x, y) => REHEAT_RANK[x.reheat] - REHEAT_RANK[y.reheat] || sched([y]).mk - sched([x]).mk);
  if (M === 1) return [ord(rs)];
  const need = (opt && opt.need) || {}, times = (opt && opt.times) || [];
  const late = (g, si) => g.reduce((s, r) => s + (need[r.id] === undefined || times[si] === undefined ? 0 : times[si] > need[r.id] ? 5000 : (need[r.id] - times[si]) / 1440 * 30), 0);
  let best = null;
  function rec(si, rest, groups, cost) {
    if (best && cost >= best.cost - 1e-9) return;
    if (si === M - 1) {
      if (rest.some(r => r.early)) return;
      const c = cost + sched(rest).mk + late(rest, si);
      if (!best || c < best.cost - 1e-9) best = { cost: c, groups: groups.concat([rest]) };
      return;
    }
    const k = sizes[si], idx = [];
    (function pick(s) {
      if (idx.length === k) {
        const g = idx.map(i => rest[i]), others = rest.filter((_, i) => !idx.includes(i));
        rec(si + 1, others, groups.concat([g]), cost + sched(g).mk + late(g, si));
        return;
      }
      for (let i = s; i < rest.length; i++) { idx.push(i); pick(i + 1); idx.pop(); }
    })(0);
  }
  rec(0, rs, [], 0);
  if (!best) return null;
  return best.groups.map(ord);
}

function gauss(rand) { return rand() + rand() + rand() - 1.5; }

function combos(n, k, cap, rand) {
  const out = [];
  function total(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  if (total(n, k) <= cap) {
    const idx = [];
    (function rec(s) {
      if (idx.length === k) { out.push(idx.slice()); return; }
      for (let i = s; i < n; i++) { idx.push(i); rec(i + 1); idx.pop(); }
    })(0);
  } else {
    const seen = new Set();
    while (out.length < cap) {
      const s = new Set();
      while (s.size < k) s.add(Math.floor(rand() * n));
      const a = [...s].sort((x, y) => x - y), key = a.join(',');
      if (!seen.has(key)) { seen.add(key); out.push(a); }
    }
  }
  return out;
}

function offerHits(r, offers) {
  const toks = (offers || '').toLowerCase().split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length >= 3);
  const hits = new Set();
  toks.forEach(tk => {
    r.i.forEach(([id]) => {
      const g = ING[id];
      if (g.cls === 'pantry') return;
      const names = [g.n.toLowerCase()].concat(g.al || []);
      if (names.some(x => x.includes(tk) || tk.includes(x))) hits.add(tk);
    });
  });
  return [...hits];
}

function plan(o) {
  // Wählt n neue Gerichte zusätzlich zu den schon festgelegten (o.fixed). o.sessions = Zahl der Kochtermine.
  const rand = o.rand || Math.random;
  const st = o.settings, fixed = o.fixed || [];
  const fixedIds = new Set(fixed.map(r => r.id));
  const pool = o.pool.filter(r => !fixedIds.has(r.id));
  const n = o.n == null ? 5 : o.n;
  const U = n + fixed.length;
  const v = o.diversity == null ? 0.5 : o.diversity;
  const hist = o.history || [];
  const noise = o.noise == null ? 0.3 : o.noise;
  const avoid = new Set(o.avoid || []);
  const M = Math.max(1, o.sessions || 3);
  const sizes = (o.sizes || sessionSizes(U, M)).filter(z => z > 0);
  const targetMeal = Math.max(...st.persons.map(p => p.protein)) * st.share / 2;
  const vegMin = Math.min(U, Math.round(st.vegMin * U / 5));
  const fishMax = st.fishMax === 0 ? 0 : Math.max(1, Math.round(st.fishMax * U / 5));
  const redMax = Math.max(1, Math.round(U / 5));
  const earlyMax = sizes.length > 1 ? U - sizes[sizes.length - 1] : U;
  if (n <= 0) return { ids: [], key: fixed.map(r => r.id).sort().join(','), relaxed: false };
  if (pool.length < n) return null;
  const hits = pool.map(r => offerHits(r, o.offers));
  let relaxed = false;

  function enumerate(strict) {
    const cs = combos(pool.length, n, 30000, rand), res = [];
    for (const c of cs) {
      const chosen = c.map(i => pool[i]), rs = fixed.concat(chosen);
      const veg = rs.filter(r => r.kind === 'veg').length;
      const fish = rs.filter(r => r.kind === 'fisch').length;
      if (rs.filter(r => r.early).length > earlyMax) continue;
      if (rs.filter(r => r.red).length > redMax) continue;
      if (strict && (veg < vegMin || fish > fishMax)) continue;
      const cuis = new Set(rs.map(r => r.cuisine)).size, bases = new Set(rs.map(r => r.base)).size;
      res.push({ c, chosen, rs, sp: new Set(rs.flatMap(r => r.spec)).size, w: wasteScore(rs), vr: (cuis + 0.6 * bases) / Math.max(1, U / 5) });
    }
    return res;
  }
  let res = enumerate(true);
  if (!res.length) { res = enumerate(false); relaxed = true; }
  if (!res.length) return null;
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = (a, m) => Math.sqrt(mean(a.map(x => (x - m) * (x - m)))) || 1;
  const ws = res.map(x => x.w), vs = res.map(x => x.vr);
  const mw = mean(ws), sw = sd(ws, mw), mv = mean(vs), sv = sd(vs, mv);
  let best = null;
  for (const x of res) {
    const ids = x.chosen.map(r => r.id);
    const key = x.rs.map(r => r.id).sort().join(',');
    if (avoid.has(key)) continue;
    let s = (1 - v) * (-(x.w - mw) / sw) + v * ((x.vr - mv) / sv);
    ids.forEach(id => { hist.forEach((h, wi) => { if (h.includes(id)) s -= [1.2, 0.6, 0.3][wi] || 0; }); });
    x.chosen.forEach(r => { s -= 4 * Math.max(0, 1 - r.nu.p / (targetMeal * 0.95)); });
    let ob = 0; x.c.forEach(i => { ob += Math.min(hits[i].length, 3) * 0.5; });
    s += Math.min(ob, 3);
    s -= 0.25 * x.sp;
    const rt = o.ratings || {};
    x.chosen.forEach(r => { const q = rt[r.id]; if (q > 0) s += 0.2; else if (q < 0) s -= 3; });
    if (o.motto) x.chosen.forEach(r => { if (r.country === o.motto) s += 2; });
    s += noise * gauss(rand);
    if (!best || s > best.s) best = { s, x, key };
  }
  if (!best) return null;
  return { ids: best.x.chosen.map(r => r.id), key: best.key, relaxed };
}

// Frisch gekochte Gerichte für einzelne Mahlzeiten: schnell, eiweißreich, ohne Dopplung.
function pickFresh(o) {
  const rand = o.rand || Math.random, st = o.settings, rt = o.ratings || {}, hist = o.history || [];
  const noise = o.noise == null ? 0.3 : o.noise;
  const used = new Set(o.exclude || []);
  const prep = (o.prepRs || []).slice();
  const targetMeal = Math.max(...st.persons.map(p => p.protein)) * st.share / 2;
  const out = [];
  for (let k = 0; k < o.count; k++) {
    const all = prep.concat(out.map(id => BY_ID[id]));
    const U = Math.max(5, all.length + (o.count - k));
    const fishMax = st.fishMax === 0 ? 0 : Math.max(1, Math.round(st.fishMax * U / 5));
    const redMax = Math.max(1, Math.round(U / 5));
    let best = null;
    o.pool.forEach(r => {
      if (used.has(r.id) || out.includes(r.id)) return;
      if (r.kind === 'fisch' && all.filter(x => x.kind === 'fisch').length >= fishMax) return;
      if (r.red && all.filter(x => x.red).length >= redMax) return;
      let s = -4 * Math.max(0, 1 - r.nu.p / (targetMeal * 0.95));
      hist.forEach((h, wi) => { if (h.includes(r.id)) s -= [1.2, 0.6, 0.3][wi] || 0; });
      s += Math.min(offerHits(r, o.offers).length, 3) * 0.5;
      const q = rt[r.id]; if (q > 0) s += 0.2; else if (q < 0) s -= 3;
      s -= 0.012 * activeMin(r);
      if (o.motto && r.country === o.motto) s += 2;
      s += noise * gauss(rand);
      if (!best || s > best.s) best = { s, r };
    });
    if (!best) break;
    out.push(best.r.id);
  }
  return out;
}

/* =========================================================
   WOCHENRASTER
   Zellen: Tag 0 (Sonntag) bis 6 (Samstag), dazu l (Mittag) oder d (Abend), also '0d', '1l' ...
   Typ t: p vorgekocht, f frisch, o auswärts, x offen. r = Rezept, u = von Hand gesetzt.
   ========================================================= */
const CELLS = [];
for (let d = 0; d < 7; d++) { CELLS.push(d + 'l'); CELLS.push(d + 'd'); }
const MEAL_MIN = { l: 12.5 * 60, d: 19.5 * 60 };
const FRESH_AT = { l: '11:30', d: '18:00' };
// time '' = im Lauf des Tages (zählt für die Planung als 18:00, im Kalender ganztägig)
const DEFAULT_SESS = [{ day: 0, time: '' }, { day: 1, time: '' }, { day: 4, time: '' }];
function defaultGrid() {
  const g = {};
  CELLS.forEach(k => { g[k] = { t: 'x' }; });
  ['0d', '1l', '1d', '2l', '2d', '3l', '4d', '5l', '5d', '6l'].forEach(k => { g[k] = { t: 'p' }; });
  return g;
}
const hm = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : 18 * 60; };
function cellTime(k) { return +k[0] * 1440 + MEAL_MIN[k[1]]; }
function sessTime(s) { return s.day * 1440 + hm(s.time); }
function sortSess(sess) { return sess.slice().sort((a, b) => sessTime(a) - sessTime(b)); }
function copyGrid(g) { const o = {}; CELLS.forEach(k => { o[k] = Object.assign({}, g[k] || { t: 'x' }); }); return o; }
function dishCounts(g) {
  const c = {};
  CELLS.forEach(k => { const x = g[k]; if (x && x.t === 'p' && x.r && BY_ID[x.r]) c[x.r] = (c[x.r] || 0) + 1; });
  return c;
}
const spareOf = k => 2 * Math.ceil(k / 2) - k;

/* Gerichte pro Kochtermin aus dem Wochenraster. Ein Gericht ergibt 2 Mahlzeiten. Jede Vorkoch-Mahlzeit muss von einem Termin vor ihr
   gedeckt werden: Zellen zwischen Termin i und i+1 brauchen Gerichte aus den Terminen bis i. Beispiel Mo und Do: Mahlzeiten Mo bis Do
   Mittag = 2 Gerichte am Montag, Rest = 1 Gericht am Donnerstag. D = Zahl der Gerichte insgesamt. Rückgabe: Größen je sortiertem Termin (auch 0). */
function demandSizes(g, sessIn, D) {
  const sess = sortSess(sessIn), M = sess.length, win = new Array(M).fill(0);
  if (!M || D <= 0) return new Array(M).fill(0);
  CELLS.forEach(k => {
    if (!g[k] || g[k].t !== 'p') return;
    const T = cellTime(k); let w = -1;
    for (let i = 0; i < M; i++) if (sessTime(sess[i]) <= T) w = i;
    if (w >= 0) win[w]++;
  });
  const sizes = []; let cum = 0, prev = 0;
  for (let i = 0; i < M; i++) { cum += win[i]; const N = Math.ceil(cum / 2); sizes.push(N - prev); prev = N; }
  let tot = sizes.reduce((a, b) => a + b, 0);
  if (tot < D) sizes[M - 1] += D - tot;          // Gerichte über den Bedarf hinaus: in den letzten Termin
  for (let i = M - 1; tot > D && i >= 0; i--) {  // weniger verschiedene Gerichte als Bedarf (ein Gericht mehrfach): hinten kürzen
    const cut = Math.min(sizes[i], tot - D); sizes[i] -= cut; tot -= cut;
  }
  if (sizes.reduce((a, b) => a + b, 0) !== D) { sizes.fill(0); sizes[M - 1] = D; }
  return sizes;
}

function needMap(g, onlyUser) {
  const m = {};
  CELLS.forEach(k => { const x = g[k]; if (x.t === 'p' && x.r && (!onlyUser || x.u)) { const t = cellTime(k); if (m[x.r] === undefined || t < m[x.r]) m[x.r] = t; } });
  return m;
}
// Wann ist welches Gericht fertig? Ergebnis: { id: Startzeit des Kochtermins in Minuten }, dazu die Gruppen.
function layout(ids, sessAll, need, grid) {
  const sortedAll = sortSess(sessAll);
  const rs = ids.map(id => BY_ID[id]).filter(Boolean).sort((a, b) => a.id < b.id ? -1 : 1);
  if (!rs.length || !sortedAll.length) return { groups: [], sess: [], idx: [], time: {} };
  const all = grid ? demandSizes(grid, sortedAll, rs.length) : sessionSizes(rs.length, sortedAll.length);
  // Termine ohne Gericht fallen weg
  const sess = [], sizes = [], idx = [];
  all.forEach((z, i) => { if (z > 0) { sess.push(sortedAll[i]); sizes.push(z); idx.push(i); } });
  let groups = assign(rs, sizes, { need, times: sess.map(sessTime) });
  if (!groups) { groups = []; let p = 0; sizes.forEach(z => { groups.push(rs.slice(p, p + z)); p += z; }); }
  const time = {};
  groups.forEach((g, i) => g.forEach(r => { time[r.id] = sessTime(sess[i]); }));
  return { groups, sess, idx, time };
}

// Legt Mahlzeit-Vorräte (tokens: {id: Anzahl}) auf leere p-Zellen. Früh verfügbar, frisches Hack und heikle Gerichte zuerst.
function placeTokens(g0, sessIn, tokens0) {
  const dishes = () => new Set(Object.keys(dishCounts(g0)).concat(Object.keys(tokens0)));
  let assumed = dishes(), g = null;
  for (let it = 0; it < 4; it++) {
    g = copyGrid(g0);
    const ids = [...assumed], lay = layout(ids, sessIn, needMap(g0, true), g0);
    const tok = {}; Object.keys(tokens0).forEach(id => { if (assumed.has(id)) tok[id] = tokens0[id]; });
    const empty = CELLS.filter(k => g[k].t === 'p' && !g[k].r).sort((a, b) => cellTime(a) - cellTime(b));
    empty.forEach(k => {
      let best = null;
      Object.keys(tok).forEach(id => {
        if (tok[id] <= 0 || lay.time[id] === undefined || lay.time[id] > cellTime(k)) return;
        const r = BY_ID[id], key = [r.early ? 0 : 1, REHEAT_RANK[r.reheat], lay.time[id]];
        if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && (key[1] < best.key[1] || (key[1] === best.key[1] && key[2] < best.key[2])))) best = { id, key };
      });
      if (best) { g[k].r = best.id; delete g[k].u; tok[best.id]--; }
    });
    const used = new Set(Object.keys(dishCounts(g)));
    if (used.size === assumed.size && [...used].every(x => assumed.has(x))) break;
    assumed = used;
  }
  return g;
}

// Neuer Vorschlag: von Hand gesetzte Zellen bleiben, der Rest wird neu gewählt.
function fillGrid(grid, o) {
  const g = copyGrid(grid);
  CELLS.forEach(k => { if (!o.keep && !g[k].u) delete g[k].r; if (g[k].t !== 'p' && g[k].t !== 'f') { delete g[k].r; delete g[k].u; } if (g[k].t !== 'f') delete g[k].w; });
  const st = o.settings, sess = o.sess;
  const cnt = dishCounts(g);
  const fixedIds = Object.keys(cnt), fixedRs = fixedIds.map(id => BY_ID[id]);
  const empty = CELLS.filter(k => g[k].t === 'p' && !g[k].r);
  const spare = fixedIds.reduce((s, id) => s + spareOf(cnt[id]), 0);
  const nNew = Math.max(0, Math.ceil((empty.length - spare) / 2));
  const pl = plan({ motto: o.motto, pool: o.pool, settings: st, diversity: o.diversity, history: o.history, offers: o.offers, avoid: o.avoid, ratings: o.ratings, rand: o.rand, noise: o.noise, fixed: fixedRs, n: nNew, sessions: sess.length, sizes: demandSizes(g, sess, nNew + fixedRs.length) });
  if (!pl) return null;
  const tokens = {};
  fixedIds.forEach(id => { if (spareOf(cnt[id]) > 0) tokens[id] = spareOf(cnt[id]); });
  pl.ids.forEach(id => { tokens[id] = 2; });
  let out = placeTokens(g, sess, tokens);
  // frische Gerichte
  const prepRs = Object.keys(dishCounts(out)).map(id => BY_ID[id]);
  const fresh = CELLS.filter(k => out[k].t === 'f' && !out[k].r);
  const userFresh = CELLS.filter(k => out[k].t === 'f' && out[k].r).map(k => out[k].r);
  const exclude = prepRs.map(r => r.id).concat(userFresh);
  const ids = pickFresh({ motto: o.motto, pool: o.pool, count: fresh.length, exclude, prepRs: prepRs.concat(userFresh.map(id => BY_ID[id])), settings: st, offers: o.offers, ratings: o.ratings, history: o.history, rand: o.rand, noise: o.noise });
  fresh.forEach((k, i) => { if (ids[i]) out[k].r = ids[i]; });
  return { grid: out, key: pl.key, relaxed: pl.relaxed };
}

// Kochtermin geändert oder Zelle bearbeitet: automatisch gesetzte Zellen neu verteilen, Gerichte bleiben gleich.
function remapGrid(grid, sess) {
  const g = copyGrid(grid), tokens = {};
  CELLS.forEach(k => { const x = g[k]; if (x.t === 'p' && x.r && !x.u) { tokens[x.r] = (tokens[x.r] || 0) + 1; delete x.r; } });
  const cnt = dishCounts(g);
  return placeTokens(g, sess, tokens);
}


/* ---------- Mengen im Kochmodus ----------
   Jeder Schritt zeigt die Zutaten, die er nennt, in der Menge für diese Woche (factor = Vielfaches des Rezepts, 1 = 4 Portionen).
   Eine Zutat erscheint nur im ersten Schritt, der sie nennt. Was kein Schritt nennt (Beilage, Gewürz), steht im letzten Schritt des Gerichts. */
const MATCH_SKIP = new Set(['dose', 'pulver', 'frisch', 'mild', 'vollkorn', 'ohne', 'zucker', 'braune', 'rote', 'abgetropft', 'edelsüß', 'stück', 'gehackt']);
const MATCH_EXTRA = { olivenoel: ['öl'], bruehe: ['brühe'], knoblauch: ['knoblauch', 'knofi'], lasagne: ['platte'], curry: ['curry'] };
const MATCH_LOOSE = { zitrone: 1 };
const SPICES = ['paprikapulver', 'kreuzkuemmel', 'oregano', 'zimt', 'kurkuma', 'garammasala', 'curry', 'currypaste'];
const matchCache = {};
function ingMatcher(id) {
  if (matchCache[id]) return matchCache[id];
  const g = ING[id], ks = new Set(MATCH_EXTRA[id] || []), strip = w => w.replace(/(en|n|e)$/, '');
  g.n.toLowerCase().split(/[^a-zäöüß]+/).filter(w => w.length >= 3 && !MATCH_SKIP.has(w)).forEach(w => ks.add(strip(w)));
  (g.al || []).forEach(a => ks.add(strip(a.toLowerCase())));
  return (matchCache[id] = new RegExp('(^|[^a-zäöüß])(' + [...ks].map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')[a-zäöüß]{0,' + (MATCH_LOOSE[id] ? 9 : 3) + '}(?![a-zäöüß])', 'i'));
}
function amtText(id, a) {
  const g = ING[id];
  if (g.unit === 'g' || g.unit === 'ml') return fmtAmt(id, a);
  const n = Math.round(a * 4) / 4;
  return g.fm ? g.fm(Number.isInteger(n) ? n : fmtQ(n)) : fmtQ(n) + ' ' + g.unit + ' ' + g.n;
}
// evs: Ereignisse eines Kochtermins (mit rid und t), factorOf(rid) liefert den Faktor. Ergebnis je Ereignis: { items: [Text], extra: [Text] }
function stepAmounts(evs, factorOf) {
  const used = {}, last = {}, out = evs.map(() => ({ items: [], extra: [], again: [] }));
  evs.forEach((e, i) => { last[e.rid] = i; });
  evs.forEach((e, i) => {
    const r = BY_ID[e.rid]; if (!r) return;
    const u = used[e.rid] = used[e.rid] || new Set(), f = factorOf(e.rid) || 1, txt = e.t || '';
    const spice = /gewürz/i.test(txt);
    r.i.forEach(([id, amt]) => {
      if (u.has(id) || !ING[id]) return;
      if (ingMatcher(id).test(txt) || (spice && SPICES.includes(id))) {
        u.add(id); out[i].items.push(amtText(id, amt * f));
        if (id === 'reis' && /aufsetzen|kochen|garen/i.test(txt)) out[i].items.push('Wasser ca. ' + (Math.round(amt * f * 2 / 50) * 50 >= 1000 ? (Math.round(amt * f * 2 / 50) * 50 / 1000).toString().replace('.', ',') + ' l' : Math.round(amt * f * 2 / 50) * 50 + ' ml'));
      }
    });
  });
  const lastIt = {};
  evs.forEach((e, i) => {
    const k = e.rid + '|' + e.tn;
    if (out[i].items.length) lastIt[k] = out[i].items.filter(x => !/^Wasser/.test(x));
    else if (lastIt[k] && lastIt[k].length) out[i].again = lastIt[k];
  });
  Object.keys(last).forEach(rid => {
    const r = BY_ID[rid], f = factorOf(rid) || 1; if (!r) return;
    r.i.forEach(([id, amt]) => { if (!(used[rid] && used[rid].has(id)) && ING[id]) out[last[rid]].extra.push(amtText(id, amt * f)); });
  });
  return out;
}

function buildWeek(grid, sessIn, st) {
  const counts = dishCounts(grid);
  const ids = Object.keys(counts);
  const lay = layout(ids, sessIn, needMap(grid, false), grid);
  const mkSess = (key, day, time, list, extra) => {
    const sc = sched(list), thaw = [];
    list.forEach(r => r.i.forEach(([id]) => { if (ING[id].thaw && !thaw.includes(ING[id].n)) thaw.push(ING[id].n); }));
    return Object.assign({ key, day, time, rs: list, sched: sc, thaw, dev: [...new Set(list.flatMap(devices))], fresh: false }, extra || {});
  };
  const sessions = lay.groups.map((list, i) => mkSess('s' + lay.idx[i], lay.sess[i].day, lay.sess[i].time, list, { n: lay.idx[i] + 1, w: lay.sess[i].w }));
  CELLS.forEach(k => {
    const x = grid[k];
    if (x.t === 'f' && x.r && BY_ID[x.r]) sessions.push(mkSess('f' + k, +k[0], FRESH_AT[k[1]], [BY_ID[x.r]], { fresh: true, cell: k, w: x.w }));
  });
  sessions.sort((a, b) => sessTime(a) - sessTime(b));
  const recs = [], facs = [];
  ids.forEach(id => { recs.push(BY_ID[id]); facs.push(Math.ceil(counts[id] / 2)); });
  sessions.filter(s => s.fresh).forEach(s => { recs.push(s.rs[0]); facs.push(0.5); });
  const sh = shop(recs, facs);
  const packs = sh.items.reduce((s, x) => s + x.packs, 0);
  const rests = sh.items.filter(x => x.rest).length;
  const mk = sessions.reduce((s, x) => s + x.sched.mk, 0);
  const rsAll = [...new Set(recs)];
  const avgP = rsAll.length ? rsAll.reduce((s, r) => s + r.nu.p, 0) / rsAll.length : 0;
  const targets = st.persons.map(p => p.protein * st.share / 2);
  return { rs: rsAll, prepIds: lay.groups.flat().map(r => r.id), counts, sessions, shop: sh, stats: { mk, packs, rests, avgP, kinds: sh.items.length }, targets, time: lay.time };
}

root.VK = { countries, ING, RECIPES, BY_ID, AISLES, CELLS, MEAL_MIN, FRESH_AT, DEFAULT_SESS, defaultGrid, copyGrid, cellTime, sessTime, sortSess, dishCounts, layout, sessionSizes, demandSizes, stepAmounts, ingMatcher, plan, pickFresh, fillGrid, remapGrid, buildWeek, placeTokens, assign, sched, shop, nutri, activeMin, devices, offerHits, fmtQ, fmtAmt, fmtDur, fmtClock, fmtSize, wasteScore };
if (typeof module !== 'undefined') module.exports = root.VK;
})(typeof window !== 'undefined' ? window : globalThis);
