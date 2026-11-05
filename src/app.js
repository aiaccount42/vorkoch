(function () {
'use strict';
const V = window.VK;
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const KEY = 'vorkoch.v1';
const APP_V = '__CACHE_V__'; /* beim Bauen durch CACHE_V aus build.js ersetzt */
const KIND = { veg: 'Vegetarisch', fisch: 'Fisch', fleisch: 'Fleisch' };

/* ---------- Zustand ---------- */
function defaults() {
  return {
    settings: { persons: [{ name: 'Roman', protein: 120 }, { name: 'Partnerin', protein: 90 }], share: 0.7, vegMin: 3, fishMax: 1, moCook: 0 },
    grid: V.defaultGrid(), sess: V.DEFAULT_SESS.map(s => Object.assign({}, s)), shopAt: { day: -1, time: '' },
    disabled: [], ids: null, key: '', recent: [], history: [], checked: { key: '', map: {} }, weeks: {},
    offers: '', diversity: 0.5, motto: '', cal: null, calAt: 0, tab: 'plan', weekStart: '', relaxed: false, theme: 'auto',
    ratings: {}, storeOv: {}, shopView: 'gang', extra: [], bundles: [], routineDay: 6, sync: { url: '', code: '', fresh: false },
    mt: { m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} }
  };
}
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      Object.keys(d).forEach(k => { if (o[k] !== undefined && k !== 'settings') d[k] = o[k]; });
      if (o.settings) {
        Object.assign(d.settings, o.settings);
        if (!Array.isArray(d.settings.persons) || d.settings.persons.length !== 2) d.settings.persons = defaults().settings.persons;
      }
    }
  } catch (e) { /* ohne Speicher weiterarbeiten */ }
  // Umstieg von der alten Fassung mit festem Rhythmus
  let old = null;
  try { const raw = localStorage.getItem(KEY); old = raw ? JSON.parse(raw) : null; } catch (e) { old = null; }
  if (old && !old.grid) {
    const dy = Object.assign({ shop: 6, so: 0, mo: 1, do: 4 }, (old.settings && old.settings.days) || {});
    const ck = Object.assign({ shop: '10:00', so: '16:00', mo: '18:00', do: '18:00' }, (old.settings && old.settings.cook) || {});
    d.sess = [{ day: dy.so, time: ck.so }, { day: dy.mo, time: ck.mo }, { day: dy.do, time: ck.do }];
    d.shopAt = { day: dy.shop === 6 ? -1 : dy.shop, time: ck.shop };
    if (Array.isArray(old.ids) && old.ids.length === 5 && old.ids.every(id => V.BY_ID[id])) {
      const tok = {}; old.ids.forEach(id => { tok[id] = 2; });
      d.grid = V.placeTokens(V.defaultGrid(), d.sess, tok);
    }
  }
  delete d.settings.cook; delete d.settings.days;
  if (!d.grid || !V.CELLS.every(k => d.grid[k] && /^[pfox]$/.test(d.grid[k].t))) d.grid = V.defaultGrid();
  if (!Array.isArray(d.sess) || !d.sess.length) d.sess = V.DEFAULT_SESS.map(s => Object.assign({}, s));
  if (!d.shopAt || typeof d.shopAt !== 'object') d.shopAt = { day: -1, time: '' };
  d.mt = Object.assign({ m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} }, d.mt || {});
  ['m', 'ratings', 'storeOv', 'checked', 'weeks'].forEach(k => { if (!d.mt[k] || typeof d.mt[k] !== 'object') d.mt[k] = {}; });
  if (!d.sync || typeof d.sync !== 'object') d.sync = { url: '', code: '', fresh: false };
  if (!Array.isArray(d.bundles)) d.bundles = [];
  if (!Number.isInteger(d.routineDay) || d.routineDay < 0 || d.routineDay > 6) d.routineDay = 6;
  // Umstieg: offene Eigene Artikel werden eine Runde „Sonstiges“ (alle 4 Wochen)
  if (Array.isArray(d.extra)) {
    const open = d.extra.filter(x => !x.d).map(x => x.n);
    if (open.length) { d.bundles.push({ id: 'b' + Date.now().toString(36), n: 'Sonstiges', items: open.join(', '), every: 4, last: '' }); d.mt.m.bundles = Date.now(); }
    d.extra = [];
  }
  if (!d.weeks || typeof d.weeks !== 'object' || Array.isArray(d.weeks)) d.weeks = {};
  if (!Object.keys(d.weeks).length && d.grid) {
    let ws = /^\d{4}-\d{2}-\d{2}$/.test(d.weekStart || '') ? d.weekStart : '';
    if (!ws) { const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() + ((7 - t.getDay()) % 7)); ws = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
    d.weekStart = ws;
    d.weeks[ws] = { grid: d.grid, sess: d.sess, shopAt: d.shopAt, key: d.key || '', relaxed: !!d.relaxed };
    d.mt.weeks[ws] = (d.mt.m && d.mt.m.plan) || 1;
    const cm = {}, ct = {};
    Object.keys((d.checked && d.checked.map) || {}).forEach(k => { const nk = k.indexOf('|') > 0 ? k : ws + '|' + k; cm[nk] = d.checked.map[k]; ct[nk] = (d.mt.checked && d.mt.checked[k]) || 0; });
    d.checked = { key: '', map: cm }; d.mt.checked = ct;
  }
  return d;
}
const TRANSIENT = ['msg', 'sheet', 'ci', 'timers', 'tadj', 'fresh', 'confirm', 'q', 'filter', 'country', 'carb', 'ss', 'ids', 'cs', 'undo'];
let S = load();
function resetTransient() { S.msg = ''; S.sheet = null; S.ci = 0; S.timers = []; S.tadj = {}; S.fresh = false; S.confirm = false; S.q = ''; S.filter = 'all'; S.country = ''; S.carb = ''; S.ss = null; S.cs = null; S.undo = null; }
resetTransient();
let calTimer = null, calBusy = false, calFail = 0;
function save() { saveLocal(); schedSync(); calSoon(); }
function touch(sec) { S.mt.m[sec] = Date.now(); }
function touchKey(sec, id) { S.mt[sec][id] = Date.now(); }
function saveLocal() { commitWeek(); try { const c = Object.assign({}, S); TRANSIENT.forEach(k => delete c[k]); localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* egal */ } }

const pad = n => String(n).padStart(2, '0');
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function nextSunday(from) {
  const d = from ? new Date(from) : new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
}
function weekDays() {
  const s = new Date((S.weekStart || iso(nextSunday())) + 'T12:00:00'), today = iso(new Date());
  return DAYS.map((n, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return { n, num: d.getDate(), date: d.getDate() + '.' + (d.getMonth() + 1) + '.', today: iso(d) === today }; });
}
/* ---------- Wochen: jede Woche liegt unter ihrem Sonntag in S.weeks; S.grid, S.sess, S.shopAt sind die Arbeitskopie der angezeigten Woche ---------- */
const DATE_OK = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
function addDaysIso(ws, n) { const d = new Date(ws + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
function thisSunday() { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return iso(d); }
function fmtDay(s) { const d = new Date(s + 'T12:00:00'); return DAYS[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.'; }
function defaultWeek() { return iso(nextSunday()); }
function weekRec() { return { grid: V.copyGrid(S.grid), sess: S.sess.map(s => Object.assign({}, s)), shopAt: Object.assign({}, S.shopAt), key: S.key || '', relaxed: !!S.relaxed }; }
function commitWeek() {
  if (!S.weeks || !DATE_OK(S.weekStart) || !S.grid || !S.sess || !S.shopAt) return;
  const cur = weekRec(), old = S.weeks[S.weekStart];
  if (old && window.VX && window.VX.same(old, cur)) return;
  S.weeks[S.weekStart] = cur; S.mt.weeks[S.weekStart] = Date.now();
}
function loadWeek(ws) {
  const r = S.weeks[ws]; if (!r) return false;
  S.weekStart = ws; S.grid = V.copyGrid(r.grid); S.sess = V.sortSess(r.sess.map(s => Object.assign({}, s))); S.shopAt = Object.assign({}, r.shopAt); S.key = r.key || ''; S.relaxed = !!r.relaxed;
  syncIds(); return true;
}
function wkHasMeals(r) { return V.CELLS.some(k => r.grid[k] && (r.grid[k].t === 'p' || r.grid[k].t === 'f') && r.grid[k].r); }
function nearestWeek(ws) {
  const ks = Object.keys(S.weeks).filter(k => k !== ws).sort(), before = ks.filter(k => k < ws);
  const k = before.length ? before[before.length - 1] : ks[0];
  return k ? S.weeks[k] : null;
}
function histFor() {
  const t = new Date(S.weekStart + 'T12:00:00').getTime();
  const near = Object.keys(S.weeks).filter(k => k !== S.weekStart).sort((x, y) => Math.abs(new Date(x + 'T12:00:00') - t) - Math.abs(new Date(y + 'T12:00:00') - t)).slice(0, 3);
  const h = near.map(k => Object.keys(V.dishCounts(S.weeks[k].grid)));
  return h.concat((S.history || []).slice(0, 3 - h.length));
}
const tk = id => S.weekStart + '|' + id;
/* Rückgängig: merkt sich Plan und Haken vor Aktionen, die sonst Arbeit wegwerfen. */
let undoTimer = null;
function undoSnap() { return { ws: S.weekStart, grid: V.copyGrid(S.grid), key: S.key, relaxed: S.relaxed, recent: (S.recent || []).slice(), map: Object.assign({}, S.checked.map) }; }
function undoOffer(snap, msg) {
  S.undo = Object.assign(snap, { msg });
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { S.undo = null; const el = document.getElementById('undo'); if (el && el.remove) el.remove(); }, 8000);
}
function undoRun() {
  const u = S.undo; if (!u) return;
  S.undo = null; clearTimeout(undoTimer);
  if (S.weekStart !== u.ws) openWeek(u.ws);
  S.grid = u.grid; S.key = u.key; S.relaxed = u.relaxed; S.recent = u.recent;
  syncIds(); touch('plan');
  Object.keys(Object.assign({}, S.checked.map, u.map)).forEach(k => { if (k.indexOf(u.ws + '|') === 0 && !!S.checked.map[k] !== !!u.map[k]) { S.checked.map[k] = !!u.map[k]; touchKey('checked', k); } });
  save();
}
function clearTicks(ws) { Object.keys(S.checked.map).forEach(k => { if (k.indexOf(ws + '|') === 0 && S.checked.map[k]) { S.checked.map[k] = false; touchKey('checked', k); } }); }
function weekRange() { const d = weekDays(); return d[0].date + ' bis ' + d[6].date; }
function weekLabel() {
  const diff = Math.round((new Date(S.weekStart + 'T12:00:00') - new Date(thisSunday() + 'T12:00:00')) / 604800000);
  return diff === 0 ? 'Diese Woche' : diff === 1 ? 'Nächste Woche' : diff === -1 ? 'Letzte Woche' : diff > 1 ? 'In ' + diff + ' Wochen' : 'Vor ' + (-diff) + ' Wochen';
}
function canGo(ws) { return !!S.weeks[ws] || (ws >= thisSunday() && ws <= addDaysIso(defaultWeek(), 21)); }
function openWeek(ws) {
  commitWeek();
  S.msg = '';
  if (S.weeks[ws]) { loadWeek(ws); return; }
  const near = nearestWeek(ws);
  S.weekStart = ws;
  if (near) { S.grid = V.copyGrid(near.grid); S.sess = V.sortSess(near.sess.map(s => Object.assign({}, s))); S.shopAt = Object.assign({}, near.shopAt); }
  S.key = ''; S.relaxed = false;
  generate(true);
  commitWeek(); syncIds();
}
function initView() {
  const t = thisSunday(), dflt = defaultWeek();
  let ws = DATE_OK(S.weekStart) ? S.weekStart : dflt;
  if (ws < t) ws = dflt;
  const have = Object.keys(S.weeks).sort();
  if (!S.weeks[ws] && have.length) { const fut = have.filter(k => k >= t); if (fut.length) ws = fut.includes(dflt) ? dflt : fut[0]; }
  if (S.weeks[ws]) loadWeek(ws);
  else if (have.length) openWeek(ws);
  else S.weekStart = ws;
}
function reloadView() { if (!(DATE_OK(S.weekStart) && loadWeek(S.weekStart))) initView(); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function pool() { return V.RECIPES.filter(r => !S.disabled.includes(r.id)); }
function sessList() { return V.sortSess(S.sess); }
function syncIds() { S.ids = Object.keys(V.dishCounts(S.grid)); }
function planOpts() { return { pool: pool(), settings: S.settings, diversity: S.diversity, history: histFor(), offers: S.offers, avoid: S.recent, ratings: S.ratings, sess: sessList(), motto: S.motto }; }
function hasFilled() { return V.CELLS.some(k => (S.grid[k].t === 'p' || S.grid[k].t === 'f') && S.grid[k].r); }
function wantsMeals() { return V.CELLS.some(k => S.grid[k].t === 'p' || S.grid[k].t === 'f'); }
function generate(advance) {
  const pl = pool();
  if (pl.length < 5) { S.msg = 'Im Pool sind weniger als fünf Rezepte aktiv. Aktiviere weitere unter „Rezepte“.'; return; }
  let base = V.copyGrid(S.grid);
  if (advance) V.CELLS.forEach(k => { delete base[k].r; delete base[k].u; });
  const res = V.fillGrid(base, planOpts());
  if (!res) { S.msg = 'Mit diesen Regeln lässt sich keine Woche bilden. Lockere die Regeln unter „Mehr“.'; return; }
  S.msg = '';
  S.grid = res.grid; S.key = res.key; S.relaxed = res.relaxed;
  S.recent = [res.key].concat(S.recent).slice(0, 6);
  syncIds(); touch('plan');
  if (!S.weekStart) S.weekStart = defaultWeek();
  clearTicks(S.weekStart);
  save();
}
// Nach jeder Änderung von Hand: Lücken füllen, automatische Felder neu verteilen.
function editGrid(mutator) {
  mutator(S.grid);
  const res = pool().length >= 5 ? V.fillGrid(S.grid, Object.assign(planOpts(), { keep: true })) : null;
  if (res) S.grid = res.grid;
  S.grid = V.remapGrid(S.grid, sessList());
  syncIds(); touch('plan'); save();
}
if (!S.checked || S.checked.key === undefined) S.checked = { key: '', map: {} };
initView();
if (wantsMeals() && !hasFilled()) generate(false);
syncIds();

/* ---------- Abgleich zwischen Geräten (Firebase Realtime Database über REST) ---------- */
const VX = window.VX;
const URL_RE = /^https:\/\/[a-z0-9-]+(-default-rtdb)?(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/;
const CODE_RE = /^[a-z0-9]{8,32}$/;
function normUrl(u) { u = String(u || '').trim().replace(/\/+$/, '').toLowerCase(); return URL_RE.test(u) ? u : ''; }
function newCode() {
  const cs = 'abcdefghijkmnpqrstuvwxyz23456789', a = new Uint8Array(14); let o = '';
  crypto.getRandomValues(a); a.forEach(x => { o += cs[x % cs.length]; });
  return o;
}
function syncOn() { return !!(S.sync && S.sync.url && S.sync.code); }
function typing() {
  try { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|number|time|search)$/.test(a.type || 'text'))); } catch (e) { return false; }
}
function ssSet(state, msg) {
  S.ss = { state, msg, at: Date.now() };
  if (S.tab === 'settings' && !S.sheet && !typing()) { const el = document.getElementById('syncbox'); if (el) el.innerHTML = syncBox(); }
}
function jfetch(url, opt) {
  const c = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => { if (c) c.abort(); }, 12000);
  return fetch(url, Object.assign({ signal: c ? c.signal : undefined, cache: 'no-store' }, opt)).then(r => {
    clearTimeout(t);
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Zugriff verweigert. Regeln der Datenbank prüfen.' : 'Serverfehler ' + r.status);
    return r.json();
  }, err => { clearTimeout(t); throw new Error('Keine Verbindung.'); });
}
var syncing = false, syncTimer = null, again = false;
function schedSync() {
  if (!syncOn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, 1500);
}
/* Die Wochenliste liegt neben dem Plan, damit die Haushalts-App sie lesen kann, ohne den Plan zu berühren. Vergangene Wochen bleiben stehen. */
let pubLast = '';
function pubShop() {
  if (!syncOn() || !B || !B.shop || !DATE_OK(S.weekStart) || S.weekStart < thisSunday()) return;
  const body = JSON.stringify(VX.shopDoc(B.shop.items, addDaysIso(S.weekStart, S.shopAt.day), x => !!S.checked.map[tk(x.id)], storeOf));
  if (body === pubLast) return;
  pubLast = body;
  const ep = S.sync.url + '/vorkoch/' + S.sync.code + '-einkauf/';
  jfetch(ep + S.weekStart + '.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }).catch(() => { pubLast = ''; });
  jfetch(ep + addDaysIso(S.weekStart, -56) + '.json', { method: 'DELETE' }).catch(() => {});
}
async function syncNow() {
  if (!syncOn()) return;
  if (syncing) { again = true; return; }
  if (S.sheet && S.sheet.t === 'cook') return;
  syncing = true; ssSet('busy', 'Gleiche ab …');
  try {
    const ep = S.sync.url + '/vorkoch/' + S.sync.code + '.json';
    const raw = await jfetch(ep);
    const remote = raw === null ? null : VX.unpack(raw);
    if (raw !== null && !remote) throw new Error('Unbekanntes Datenformat unter diesem Code.');
    commitWeek();
    const local = VX.toDoc(S);
    let result;
    if (!remote) result = local;
    else if (S.sync.fresh) result = remote;
    else result = VX.merge(local, remote);
    if (!VX.same(result, local)) {
      if (typing()) { again = true; syncing = false; setTimeout(syncNow, 4000); return; }
      VX.applyDoc(S, result, V.BY_ID);
      reloadView();
      saveLocal(); render(); calSoon(5000);
    }
    S.sync.fresh = false; saveLocal();
    if (!remote || !VX.same(result, remote)) await jfetch(ep, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VX.pack(result)) });
    ssSet('ok', 'Abgeglichen um ' + new Date().toTimeString().slice(0, 5));
    pubShop();
  } catch (err) {
    ssSet('err', err && err.message ? err.message : 'Abgleich fehlgeschlagen.');
  }
  syncing = false;
  if (again) { again = false; schedSync(); }
}
setInterval(() => { try { if (document.visibilityState !== 'hidden') syncNow(); } catch (e) { /* egal */ } }, 20000);
document.addEventListener('visibilitychange', () => { try { if (document.visibilityState === 'visible') { syncNow(); calSoon(4000); } } catch (e) { /* egal */ } });
function baseUrl() { try { return location.href.split('#')[0]; } catch (e) { return ''; } }
function inviteLink() { return baseUrl() + VX.encodeShare('j', { u: S.sync.url, c: S.sync.code }); }
function snapLink() {
  commitWeek();
  const d = VX.toDoc(S), t = thisSunday(), w = {}, c = {};
  Object.keys(d.weeks).forEach(k => { if (k >= t) w[k] = d.weeks[k]; });
  Object.keys(d.checked.map).forEach(k => { if (k.split('|')[0] >= t) c[k] = d.checked.map[k]; });
  d.weeks = w; d.checked = { key: '', map: c };
  return baseUrl() + VX.encodeShare('s', d);
}
function checkHash() {
  let h = '';
  try { h = location.hash; } catch (e) { return; }
  const d = VX.decodeShare(h);
  if (!d) return;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* egal */ }
  if (d.kind === 'j' && d.data && normUrl(d.data.u) && CODE_RE.test(d.data.c || '')) S.sheet = { t: 'join', u: normUrl(d.data.u), c: d.data.c };
  else if (d.kind === 's' && d.data && (d.data.v === 2 || d.data.v === 1)) { const doc = d.data.v === 1 ? VX.unpack(d.data) : d.data; if (doc) S.sheet = { t: 'snap', doc }; }
}

/* ---------- Hilfen ---------- */
let B = null;
function rebuild() { try { B = V.buildWeek(S.grid, sessList(), S.settings); } catch (e) { B = null; } }
function portion(r) {
  const f = B.targets.map(t => Math.min(1.5, Math.max(0.5, Math.round((t / r.nu.p) * 4) / 4)));
  const need = 2 * f.reduce((s, x) => s + x, 0);
  return { f, need, tight: need > r.servings + 1e-9 };
}
const names = () => S.settings.persons.map(p => p.name || '?');
function whoCode(s) {
  if (s.w === 'b' || s.w === '0' || s.w === '1') return s.w;
  if (s.fresh || s.rs.length === 1) return 'b';
  const multi = B.sessions.filter(x => !x.fresh && x.rs.length > 1), i = multi.indexOf(s);
  const first = S.settings.moCook === 0 ? 0 : 1;
  return String(i % 2 === 0 ? first : 1 - first);
}
function cookWho(s) {
  const n = names(), c = whoCode(s);
  if (s.fresh) return c === 'b' ? 'Frisch gekocht, halbe Menge' : n[+c] + ' kocht frisch, halbe Menge';
  return c === 'b' ? 'Ihr kocht zusammen' : n[+c] + ' kocht';
}
const shopCode = () => S.shopAt.w === '0' || S.shopAt.w === '1' ? S.shopAt.w : 'b';
const whoOpts = (cur, auto) => (auto ? [['a', 'Automatisch']] : []).concat([['b', 'Zusammen'], ['0', names()[0]], ['1', names()[1]]]).map(([v, l]) => '<option value="' + v + '"' + ((cur || (auto ? 'a' : 'b')) === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('');
function dishIdx(rid) { const i = B ? B.prepIds.indexOf(rid) : -1; return i < 0 ? -1 : i % 5; }
const sb = n => n ? '<span class="sb" aria-label="Kochtermin ' + n + '">' + n + '</span>' : '';
const dot = i => i < 0 ? '<span class="dot"></span>' : '<span class="dot" style="--c:var(--c' + (i + 1) + ')"></span>';
const DAYLONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const ICON = {
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>'
};
function rateBtns(id) {
  const v = S.ratings[id] || 0;
  return '<span class="rate"><button data-act="rate" data-rid="' + id + '" data-v="1" aria-pressed="' + (v === 1) + '" aria-label="Hat geschmeckt">' + ICON.up + '</button>' +
    '<button data-act="rate" data-rid="' + id + '" data-v="-1" aria-pressed="' + (v === -1) + '" aria-label="Hat nicht geschmeckt">' + ICON.down + '</button></span>';
}
const STORES = { d: 'Aldi Nord oder Lidl', m: 'Marktkauf' };
function storeOf(x) { return S.storeOv[x.id] || (x.spec ? 'm' : 'd'); }

const AGE = ['frisch', '1 Tag alt', '2 Tage alt'];
const TYPE_NAME = { p: 'Vorgekocht', f: 'Frisch', o: 'Auswärts', x: 'Offen' };
const MEAL_NAME = { l: 'Mittag', d: 'Abend' };

/* ---------- Plan ---------- */
function cellWarn(k) {
  const x = S.grid[k];
  if (x.t === 'p' && !x.r) return B.sessions.some(s => !s.fresh && V.sessTime(s) <= V.cellTime(k)) ? 'Kein Gericht fertig' : 'Kein Kochtermin davor';
  if (x.t === 'f' && !x.r) return 'Kein Rezept';
  if (x.t === 'p' && x.r && B.time[x.r] !== undefined && B.time[x.r] > V.cellTime(k)) return 'Noch nicht gekocht';
  return '';
}
function cellSess(k) { const x = S.grid[k]; return x && x.t === 'p' && x.r ? B.sessions.find(s => !s.fresh && s.rs.some(r => r.id === x.r)) : null; }
function cellWho(k) {
  const x = S.grid[k];
  if (x.t === 'f') return B.sessions.find(s => s.fresh && s.cell === k) ? whoCode(B.sessions.find(s => s.fresh && s.cell === k)) : 'b';
  const s = cellSess(k); return s ? whoCode(s) : 'b';
}
const whoTag = c => c === '0' || c === '1' ? ' · ' + esc((names()[+c] || '?').charAt(0).toUpperCase()) : '';
function slotHtml(k) {
  const x = S.grid[k], w = cellWarn(k);
  const wh = w ? '<span class="cw">' + w + '</span>' : '';
  if ((x.t === 'p' || x.t === 'f') && x.r && V.BY_ID[x.r]) {
    const r = V.BY_ID[x.r];
    let m;
    if (x.t === 'f') m = dot(-1) + 'frisch gekocht' + whoTag(cellWho(k));
    else { const age = Math.max(0, +k[0] - Math.floor((B.time[x.r] || 0) / 1440)), cs = cellSess(k); m = sb(cs && cs.n) + dot(dishIdx(x.r)) + (age < 3 ? AGE[age] : age + ' Tage alt') + whoTag(cellWho(k)); }
    return '<button class="slot" data-act="cell" data-k="' + k + '"><span class="m">' + m + '</span><b>' + esc(r.short) + '</b>' + wh + '</button>';
  }
  if (x.t === 'p' || x.t === 'f') return '<button class="slot warnslot" data-act="cell" data-k="' + k + '"><span class="m">' + TYPE_NAME[x.t] + '</span><b>–</b>' + wh + '</button>';
  return '<button class="slot off" data-act="cell" data-k="' + k + '">' + (x.t === 'o' ? 'Auswärts' : 'Offen') + '</button>';
}

const dayOpts = (cur, withBefore) => (withBefore ? [[-1, 'Sa davor']] : []).concat([1, 2, 3, 4, 5, 6, 0].map(d => [d, DAYS[d]])).map(([d, l]) => '<option value="' + d + '"' + (cur === d ? ' selected' : '') + '>' + l + '</option>').join('');
const tl = t => t || 'tagsüber';
const dayLbl = d => d < 0 ? 'Sa davor' : DAYS[d];
const whoLabel = c => c === '0' || c === '1' ? (names()[+c] || '?') : 'zusammen';
function termsCard() {
  const sl = sessList();
  const chip = (cls, k, title, line) => '<button class="tchip ' + cls + '" data-act="term" data-term="' + k + '"><b>' + esc(title) + '</b><span>' + esc(line) + '</span></button>';
  let h = '<p class="cap" style="margin-left:2px">Termine</p><div class="terms">';
  h += chip('shop', 'shop', 'Einkauf ' + dayLbl(S.shopAt.day), tl(S.shopAt.time) + ' · ' + whoLabel(shopCode()));
  sl.forEach((s, i) => {
    const bs = B.sessions.find(x => x.key === 's' + i), c = bs ? whoCode(bs) : (s.w || 'b');
    h += '<button class="tchip sess" data-act="term" data-term="' + i + '"><b>' + sb(i + 1) + 'Kochen ' + DAYS[s.day] + ' · ' + esc(tl(s.time)) + ' · ' + esc(whoLabel(c)) + '</b><span class="dl">' + (bs ? bs.rs.map(r => dot(dishIdx(r.id)) + esc(r.short)).join('') : 'Kein Gericht an diesem Termin') + '</span></button>';
  });
  if (sl.length < 4) h += '<button class="tchip add" data-act="sessadd">+ Kochtermin</button>';
  h += '</div><div style="height:14px"></div>';
  return h;
}
function viewPlan() {
  const days = weekDays(), st = B.stats;
  const prevWs = addDaysIso(S.weekStart, -7), nextWs = addDaysIso(S.weekStart, 7), dflt = defaultWeek();
  let h = '<div class="wbar"><button class="wnav" data-act="wk" data-d="-1" aria-label="Vorherige Woche"' + (canGo(prevWs) ? '' : ' disabled') + '>‹</button><div class="wmid"><h1 class="ltitle">' + weekLabel() + '</h1><p class="lsub">' + days[0].date + ' bis ' + days[6].date + '</p></div><button class="wnav" data-act="wk" data-d="1" aria-label="Nächste Woche"' + (canGo(nextWs) ? '' : ' disabled') + '>›</button></div>';
  if (S.weekStart !== dflt && canGo(dflt)) h += '<div class="wback"><button class="lnk" data-act="wkgo">Zurück zur Planungswoche</button></div>';
  if (S.msg) h += '<p class="alert">' + esc(S.msg) + '</p>';
  if (S.cs && S.cs.auto && S.cs.state === 'err') h += '<p class="alert">Kalender konnte nicht automatisch aktualisiert werden: ' + esc(S.cs.msg) + '</p>';
  if (S.relaxed) h += '<p class="alert">Der Pool ist für deine Regeln zu klein. Die Mindestzahl vegetarischer Gerichte wurde dieses Mal nicht eingehalten.</p>';
  h += '<p class="cap" style="margin-left:2px">Essensplan</p>';
  h += '<div class="grp"><div class="dh"><span></span><span>Mittag</span><span>Abend</span></div>';
  for (let d = 0; d < 7; d++) {
    h += '<div class="day' + (days[d].today ? ' today' : '') + '"><div class="dn"><b>' + days[d].n + '</b><span>' + days[d].num + '</span></div>' + slotHtml(d + 'l') + slotHtml(d + 'd') + '</div>';
  }
  h += '</div>';
  h += '<p class="wsum">' + V.fmtDur(st.mk) + ' kochen · ' + B.shop.items.length + ' Artikel' + (st.avgP ? ' · Ø ' + Math.round(st.avgP) + ' g Protein' : '') + (st.rests ? ' · ' + st.rests + ' mit Rest' : '') + '</p>';
  h += '<div class="actions"><button class="btn" data-act="tab" data-tab="shop">Passt, zum Einkauf</button></div>';
  h += termsCard();

  h += '<p class="cap">Anpassen</p><div class="grp">' +
    '<button class="row" data-act="reroll"><span class="grow"><b>Neu vorschlagen</b></span><span class="val">eigene Felder bleiben</span></button>' +
    (S.cal ? '<button class="row" data-act="calpub"><span class="grow"><b>Kalender aktualisieren</b></span><span class="val">' + (ghTok() ? 'automatisch · ' : 'Token fehlt · ') + calAgo() + '</span></button>' : '') +
    '<label class="row"><span class="grow"><b>Küche der Woche</b><div class="sub">bevorzugt beim Vorschlag</div></span><select class="inl day" data-motto aria-label="Küche der Woche" style="width:auto;max-width:150px"><option value="">Egal</option>' + V.countries().filter(c => c.n >= 2).map(c => '<option value="' + esc(c.name) + '"' + (S.motto === c.name ? ' selected' : '') + '>' + esc(c.name) + ' (' + c.n + ')</option>').join('') + '</select></label>' +
    '<div class="pad"><div class="flex" style="justify-content:space-between"><span class="sub">Reste verwerten</span><span class="sub">Vielfalt</span></div><input type="range" id="div" min="0" max="100" step="5" value="' + Math.round(S.diversity * 100) + '" aria-label="Reste verwerten oder Vielfalt"></div></div>';

  h += '<h2 class="sec">Kochen diese Woche</h2>';
  if (!B.sessions.length) h += '<div class="grp pad"><p class="sub">Noch nichts zu kochen. Lege Felder auf „Vorgekocht“ oder „Frisch“.</p></div>';
  B.sessions.forEach(s => {
    const dd = days[s.day];
    h += '<section class="sess"><h3>' + sb(s.fresh ? 0 : s.n) + dd.n + ' ' + dd.date + (s.fresh ? ' · ' + MEAL_NAME[s.cell[1]] + ' frisch' : '') + '</h3><p class="who">' + esc(cookWho(s)) + '</p>';
    s.rs.forEach(r => {
      const i = dishIdx(r.id), g = portion(r);
      const fq = g.f.map((x, k) => esc(names()[k]) + ' ' + V.fmtQ(x)).join(' · ');
      h += '<div class="dish">' + dot(i) + '<div><button class="lnk" style="padding:0;min-height:0;text-align:left;color:var(--ink);font-size:16px" data-act="recipe" data-rid="' + r.id + '">' + esc(r.name) + '</button>' +
        '<div class="sub">' + Math.round(r.nu.p) + ' g Protein · ' + Math.round(r.nu.f) + ' g Ballaststoffe · ' + Math.round(r.nu.k) + ' kcal</div>' +
        '<div class="sub">Portionen: ' + fq + (g.tight ? ' <em class="warn">knapp, Skyr oder Ei dazu</em>' : '') + '</div>';
      const hits = V.offerHits(r, S.offers);
      if (hits.length) h += '<div class="chips" style="margin-top:6px"><span class="chip hit">Angebot: ' + esc(hits.join(', ')) + '</span></div>';
      h += '</div>' + rateBtns(r.id) + '</div>';
    });
    h += '<div class="cfoot"><span>' + V.fmtDur(s.sched.mk) + ' gesamt, ' + V.fmtDur(s.sched.active) + ' aktiv</span><button class="btn sm soft" data-act="cookstart" data-key="' + s.key + '">Kochen</button></div></section>';
  });

  h += '<p class="foot">Daumen nach dem Essen: Gutes kommt häufiger auf den Plan, Schlechtes seltener.</p>';
  h += '<p class="cap">Angebote diese Woche</p><div class="grp pad"><p class="sub" style="margin-bottom:10px">Was ist im Prospekt günstig? Begriffe mit Komma trennen, zum Beispiel „Lachs, Feta, Paprika“. Passende Gerichte werden bevorzugt.</p>' +
    '<div class="flex"><input type="text" id="offers" value="' + esc(S.offers) + '" placeholder="Lachs, Feta, Paprika" aria-label="Angebote"><button class="btn sm" data-act="offerplan">Planen</button></div></div>';
  return h;
}

/* ---------- Einkauf ---------- */
function itemHtml(x, map, mv) {
  const st = storeOf(x);
  return '<label class="item' + (map[tk(x.id)] ? ' done' : '') + '"><input type="checkbox" data-key="' + x.id + '"' + (map[tk(x.id)] ? ' checked' : '') + '><span class="box"></span>' +
    '<span class="itx"><b>' + esc(x.n) + (!mv && st === 'm' ? '<span class="chip spec" style="margin-left:6px">Marktkauf</span>' : '') + '</b><small>' + esc(x.needTxt) + ' gebraucht · ' + esc(x.forR.join(', ')) + '</small>' +
    (x.rest ? '<small class="rest">Rest: ' + esc(x.leftTxt) + '</small>' : '') + '</span><span class="ipk">' + esc(x.txt) + '</span>' +
    (mv ? '<button type="button" class="mv" data-act="store" data-id="' + x.id + '" aria-label="' + esc(x.n) + ' zu ' + (st === 'm' ? 'Aldi oder Lidl' : 'Marktkauf') + ' verschieben">' + (st === 'm' ? 'zu Aldi/Lidl' : 'zu Marktkauf') + '</button>' : '') + '</label>';
}
function viewShop() {
  const items = B.shop.items, map = S.checked.map, by = S.shopView === 'laden';
  const done = items.filter(x => map[tk(x.id)]).length;
  let h = '<h1 class="ltitle">Einkauf</h1><p class="lsub">' + items.length + ' Posten in ganzen Packungen für ' + weekRange() + '</p>';
  h += '<div class="seg" style="margin-bottom:6px">' + [['gang', 'Nach Gang'], ['laden', 'Nach Laden']].map(([k, l]) => '<button data-act="shopview" data-v="' + k + '" aria-pressed="' + (S.shopView === k || (k === 'gang' && !by)) + '">' + l + '</button>').join('') + '</div>';
  h += '<div class="flex" style="justify-content:space-between;align-items:baseline;margin:10px 2px 0"><span class="sub">Erledigt</span><b id="prog">' + done + ' von ' + items.length + '</b></div><div class="pbar"><i id="pbar" style="width:' + (items.length ? done / items.length * 100 : 0) + '%"></i></div>';
  if (by) {
    ['d', 'm'].forEach(s => {
      const inStore = items.filter(x => storeOf(x) === s);
      h += '<p class="cap">' + STORES[s] + ' · ' + inStore.length + ' Posten</p>';
      if (!inStore.length) { h += '<div class="grp pad"><p class="sub">Hier ist nichts zu holen.</p></div>'; return; }
      V.AISLES.forEach(a => {
        const list = inStore.filter(x => x.a === a);
        if (!list.length) return;
        h += '<p class="sub" style="margin:10px 18px 4px">' + a + '</p><div class="grp">' + list.map(x => itemHtml(x, map, true)).join('') + '</div>';
      });
    });
    h += '<p class="foot">Spezialzutaten liegen bei Marktkauf, alles andere bei Aldi oder Lidl. Mit dem Knopf an jedem Posten wechselst du den Laden, auch für künftige Wochen.</p>';
  } else {
    V.AISLES.forEach(a => {
      const list = items.filter(x => x.a === a);
      if (!list.length) return;
      h += '<p class="cap">' + a + '</p><div class="grp">' + list.map(x => itemHtml(x, map, false)).join('') + '</div>';
    });
  }
  h += '<details><summary class="cap">Zuhause prüfen · ' + B.shop.vorrat.length + ' Posten</summary><div class="grp">';
  B.shop.vorrat.forEach(x => {
    const k = 'v_' + x.id;
    h += '<label class="item small' + (map[tk(k)] ? ' done' : '') + '"><input type="checkbox" data-key="' + k + '" data-v="1"' + (map[tk(k)] ? ' checked' : '') + '><span class="box"></span><span class="itx"><b>' + esc(x.n) + (x.spec ? '<span class="chip spec" style="margin-left:6px">Spezial</span>' : '') + '</b></span><span></span></label>';
  });
  h += '</div></details>';
  h += '<p class="foot">Die Einkaufsliste erscheint von selbst in der Haushalts-App, wenn beide verbunden sind.</p>';
  h += '<p class="foot">Fehlendes kommt auf die Liste. Tiefkühlware am Vorabend in den Kühlschrank legen. Hackfleisch kommt nur in die ersten beiden Kochtermine, damit es frisch bleibt.</p>';
  h += '<div class="actions"><button class="btn gray" data-act="copy">Liste kopieren</button><button class="btn gray" data-act="uncheck">Haken löschen</button></div><div id="copybox"></div>';
  h += '<a class="btn gray" style="display:block;text-align:center;text-decoration:none;margin:18px 0 6px" href="https://aiaccount42.github.io/haushalt/" target="_blank" rel="noopener">Weiter zu Haushalt</a>';
  return h;
}

/* ---------- Kochen ---------- */
function gantt(s) {
  const mk = s.sched.mk, tk = mk <= 60 ? 10 : mk <= 120 ? 15 : 30;
  let h = '<div class="gantt">';
  s.rs.forEach(r => {
    const i = dishIdx(r.id);
    h += '<div class="gh">' + dot(i) + esc(r.short) + '</div>';
    s.sched.rows.filter(x => x.rid === r.id).forEach(rw => {
      h += '<div class="gl">' + esc(rw.tn) + '</div><div class="gt" style="--c:var(--c' + (i + 1) + ')">';
      s.sched.events.filter(e => e.c === rw.c).forEach(e => {
        h += '<span class="bar ' + e.k + '" style="left:' + (e.start / mk * 100) + '%;width:' + Math.max(1.2, e.m / mk * 100) + '%"></span>';
      });
      h += '</div>';
    });
  });
  h += '<div></div><div class="gax">';
  for (let t = 0; t <= mk + 0.1; t += tk) h += '<span style="left:' + (t / mk * 100) + '%">' + V.fmtClock(t) + '</span>';
  h += '</div></div><p class="legend"><span class="lg a"></span>du bist dran<span class="lg p"></span>läuft von allein</p>';
  return h;
}
function viewCook() {
  const days = weekDays();
  let h = '<h1 class="ltitle">Kochen</h1><p class="lsub">' + weekRange() + ' · Ofen und Herd laufen parallel, damit die Zeit kurz bleibt.</p>';
  if (!B.sessions.length) h += '<div class="grp pad"><p class="sub">Diese Woche ist nichts zu kochen. Lege auf der Woche-Seite Felder auf „Vorgekocht“ oder „Frisch“.</p></div>';
  B.sessions.forEach(s => {
    const dd = days[s.day];
    h += '<section class="sess"><h3>' + sb(s.fresh ? 0 : s.n) + dd.n + ' ' + dd.date + (s.fresh ? ' · ' + MEAL_NAME[s.cell[1]] + ' frisch' : '') + '</h3><p class="who">' + esc(cookWho(s)) + ' · ' + V.fmtDur(s.sched.mk) + ' gesamt, ' + V.fmtDur(s.sched.active) + ' aktiv · ' + esc(s.dev.join(' und ')) + '</p>';
    if (s.thaw.length) h += '<p class="thaw">Am Vorabend in den Kühlschrank legen: ' + esc(s.thaw.join(', ')) + '</p>';
    h += gantt(s);
    h += '<div class="actions"><button class="btn" data-act="cookstart" data-key="' + s.key + '">Kochmodus starten</button></div>';
    s.rs.forEach(r => {
      h += '<button class="row chev" style="padding-left:0;padding-right:0" data-act="recipe" data-rid="' + r.id + '">' + dot(dishIdx(r.id)) + '<span class="grow">' + esc(r.name) + '</span></button>';
    });
    h += '</section>';
  });
  return h;
}

/* ---------- Rezepte ---------- */
/* Gezeichnete Gerichtsbilder (art.js). Ein eigenes Foto bilder/<id>.jpg kann später darüber gelegt werden. */
function dishImg(r) { try { return window.VA ? '<div class="dimg">' + window.VA.art(r) + '</div>' : ''; } catch (e) { return ''; } }
function dishThumb(r) { try { return window.VA ? '<span class="thumb" aria-hidden="true">' + window.VA.art(r, { thumb: 1 }).replace(' role="img"', '').replace(/ aria-label="[^"]*"/, '') + '</span>' : ''; } catch (e) { return ''; } }
function recipeBody(r) {
  const g = portion(r);
  let h = '<div class="chips"><span class="chip">' + Math.round(r.nu.p) + ' g Protein</span><span class="chip">' + Math.round(r.nu.f) + ' g Ballaststoffe</span><span class="chip">' + Math.round(r.nu.k) + ' kcal</span>' +
    '<span class="chip">' + V.activeMin(r) + ' Min aktiv</span><span class="chip">Aufwärmen: ' + r.reheat + '</span>' +
    (r.spec.length ? '<span class="chip spec">Spezialzutat: ' + r.spec.map(id => esc(V.ING[id].n)).join(', ') + '</span>' : '') + '</div>';
  h += '<p class="sub" style="margin-top:12px">Pro Person und Mahlzeit: ' + g.f.map((x, k) => esc(names()[k]) + ' ' + V.fmtQ(x) + ' Portion' + (x === 1 ? '' : 'en')).join(' · ') +
    (g.tight ? ' <em class="warn">Der Topf reicht dafür knapp, Skyr oder Ei dazu.</em>' : '') + '</p>';
  h += '<h4>Zutaten für 4 Portionen</h4><ul class="ing">';
  r.i.forEach(([id, a]) => { h += '<li' + (V.ING[id].cls === 'pantry' ? ' class="v"' : '') + '>' + esc(V.fmtAmt(id, a)) + '</li>'; });
  h += '</ul><h4>Ablauf</h4>';
  r.tracks.forEach(t => {
    if (r.tracks.length > 1) h += '<h5>' + esc(t.n) + '</h5>';
    h += '<ol class="steps">' + t.ph.map(p => '<li><span class="tag ' + p.k + '">' + (p.k === 'a' ? 'Aktiv' : 'Läuft') + ' ' + p.m + ' Min' + (p.d ? ' · ' + p.d : '') + '</span>' + esc(p.t) + '</li>').join('') + '</ol>';
  });
  if (r.note) h += '<p class="note">' + esc(r.note) + '</p>';
  return h;
}

const CARBS = ['Nudeln', 'Reis', 'Kartoffel', 'Brot', 'Sonstige'];
function carbOf(r) {
  const b = r.base;
  return b === 'Nudeln' || b === 'Reis' ? b : b === 'Kartoffel' || b === 'Süßkartoffel' ? 'Kartoffel' : b === 'Brot' || b === 'Wraps' ? 'Brot' : 'Sonstige';
}
function filteredRecipes() {
  const q = (S.q || '').trim().toLowerCase(), f = S.filter;
  return V.RECIPES.filter(r => {
    if (f === 'veg' || f === 'fisch' || f === 'fleisch') { if (r.kind !== f) return false; }
    else if (f === 'new') { if (!r.isNew) return false; }
    else if (f === 'rewe') { if (r.src !== 'REWE Rezeptideen') return false; }
    else if (f === 'off') { if (!S.disabled.includes(r.id)) return false; }
    if (S.country && r.country !== S.country) return false;
    if (S.carb && carbOf(r) !== S.carb) return false;
    if (!q) return true;
    return (r.name + ' ' + r.cuisine + ' ' + r.country + ' ' + r.i.map(x => V.ING[x[0]].n).join(' ')).toLowerCase().includes(q);
  });
}
function recipeList() {
  const list = filteredRecipes();
  if (!list.length) return '<p class="foot" style="text-align:center;margin-top:30px">Nichts gefunden.</p>';
  let h = '';
  ['veg', 'fisch', 'fleisch'].forEach(k => {
    const l = list.filter(r => r.kind === k).sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.cuisine.localeCompare(b.cuisine, 'de') || a.short.localeCompare(b.short, 'de'));
    if (!l.length) return;
    h += '<p class="cap">' + KIND[k] + ' · ' + l.length + '</p><div class="grp">';
    l.forEach(r => {
      const off = S.disabled.includes(r.id);
      h += '<div class="rrow' + (off ? ' offrec' : '') + '">' + dishThumb(r) + '<button class="open" data-act="recipe" data-rid="' + r.id + '"><b>' + esc(r.name) + (r.isNew ? '<span class="chip neu">neu</span>' : '') + (r.src ? '<span class="chip neu" style="background:var(--fill);color:var(--ink2)">REWE</span>' : '') + '</b>' +
        '<small>' + esc(r.country === r.cuisine ? r.country : r.country + ' · ' + r.cuisine) + ' · ' + Math.round(r.nu.p) + ' g Protein · ' + V.fmtDur(V.sched([r]).mk) + (r.spec.length ? ' · Spezialzutat' : '') + '</small></button>' +
        '<label class="sw"><input type="checkbox" data-pool="' + r.id + '"' + (off ? '' : ' checked') + ' aria-label="' + esc(r.short) + ' im Pool"><i></i></label></div>';
    });
    h += '</div>';
  });
  return h;
}
function viewRecipes() {
  const FIL = [['all', 'Alle'], ['new', 'Neu'], ['rewe', 'REWE Rezeptideen'], ['veg', 'Vegetarisch'], ['fisch', 'Fisch'], ['fleisch', 'Fleisch'], ['off', 'Abgewählt']];
  let h = '<h1 class="ltitle">Rezepte</h1><p class="lsub"><span id="poolcnt">' + pool().length + ' von ' + V.RECIPES.length + '</span> im Pool. Schalter an heißt: darf geplant werden.</p>';
  h += '<div class="search"><input type="search" id="q" placeholder="Suchen, zum Beispiel Linsen oder Indisch" value="' + esc(S.q) + '" aria-label="Rezepte suchen"></div>';
  h += '<div class="filters" role="group" aria-label="Filter" style="margin-top:10px">' + FIL.map(([k, l]) => '<button data-act="filter" data-f="' + k + '" aria-pressed="' + (S.filter === k) + '">' + l + '</button>').join('') + '</div>';
  h += '<div class="filters" role="group" aria-label="Kohlenhydratquelle" style="margin-top:2px"><button data-act="carb" data-c="" aria-pressed="' + (!S.carb) + '">Alle Beilagen</button>' + CARBS.map(c => '<button data-act="carb" data-c="' + c + '" aria-pressed="' + (S.carb === c) + '">' + c + ' ' + V.RECIPES.filter(r => carbOf(r) === c).length + '</button>').join('') + '</div>';
  h += '<div class="filters" role="group" aria-label="Land oder Region" style="margin-top:2px"><button data-act="country" data-c="" aria-pressed="' + (!S.country) + '">Alle Länder</button>' + V.countries().map(c => '<button data-act="country" data-c="' + esc(c.name) + '" aria-pressed="' + (S.country === c.name) + '">' + esc(c.name) + ' ' + c.n + '</button>').join('') + '</div>';
  h += '<div id="rlist">' + recipeList() + '</div>';
  h += '<div class="actions"><button class="btn gray" data-act="poolall">Alle aufnehmen</button><button class="btn gray" data-act="poolnone">Alle abwählen</button><button class="btn gray" data-act="copysel">Auswahl kopieren</button></div><div id="copybox"></div>';
  h += '<p class="foot">Koriander, Innereien und scharfe Gerichte sind ausgeschlossen.</p>';
  return h;
}

/* ---------- Mehr ---------- */
function syncBox() {
  const ss = S.ss;
  if (!syncOn()) {
    return '<div class="grp"><div class="pad"><p class="sub" style="margin-bottom:10px">Damit ihr beide denselben Plan, Einkauf und dieselben Bewertungen seht. Kostenlos über eine eigene Firebase-Datenbank, einmal eingerichtet.</p>' +
      '<ol class="mini"><li>console.firebase.google.com öffnen, Projekt anlegen (Analytics aus).</li><li>Build, Realtime Database, Datenbank erstellen, Testmodus.</li><li>Reiter „Regeln“: <code>{ "rules": { "vorkoch": { "$code": { ".read": true, ".write": true } } } }</code> einfügen und veröffentlichen.</li><li>Die Datenbank-URL (endet auf firebasedatabase.app oder firebaseio.com) hier einfügen.</li></ol>' +
      '<div class="flex" style="margin-top:12px"><input type="text" id="syncurl" inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="https://…firebasedatabase.app" aria-label="Datenbank-URL"><button class="btn sm" data-act="connect">Verbinden</button></div>' +
      (ss && ss.state === 'err' ? '<p class="warn" style="margin-top:8px">' + esc(ss.msg) + '</p>' : '') + '</div>' +
      '<button class="row" data-act="snaplink"><span class="grow"><b>Momentaufnahme als Link</b></span><span class="val">ohne Server</span></button></div><div id="syncout"></div>';
  }
  const st = !ss ? 'Verbunden' : ss.state === 'err' ? ss.msg : ss.msg;
  return '<div class="grp"><div class="row"><span class="grow"><b>' + (ss && ss.state === 'err' ? 'Problem' : 'Verbunden') + '</b><div class="sub">' + esc(st) + '</div></span></div>' +
    '<button class="row" data-act="syncnow"><span class="grow">Jetzt abgleichen</span></button>' +
    '<button class="row" data-act="invite"><span class="grow">Einladungslink für das andere Gerät</span></button>' +
    '<button class="row" data-act="snaplink"><span class="grow">Momentaufnahme als Link</span></button>' +
    '<button class="row" data-act="disconnect" style="color:var(--danger)"><span class="grow">Trennen</span></button></div><div id="syncout"></div>' +
    '<p class="foot">Wer den Link hat, hat Zugriff auf den Plan. Gleichzeitiges Bearbeiten innerhalb weniger Sekunden kann eine Änderung überschreiben.</p>';
}
function viewSettings() {
  const st = S.settings, p = st.persons;
  const opt = (v, cur, lab) => '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + lab + '</option>';
  let h = '<h1 class="ltitle">Mehr</h1><p class="lsub">Personen, Regeln und Darstellung.</p>';
  p.forEach((x, i) => {
    h += '<p class="cap">Person ' + (i + 1) + '</p><div class="grp">' +
      '<label class="row"><span class="grow">Name</span><input class="inl" type="text" data-set="name" data-i="' + i + '" value="' + esc(x.name) + '" aria-label="Name"></label>' +
      '<label class="row"><span class="grow">Protein pro Tag</span><input class="inl" type="number" inputmode="numeric" data-set="protein" data-i="' + i + '" min="40" max="220" step="5" value="' + x.protein + '" aria-label="Protein pro Tag in Gramm"><span class="val">g</span></label></div>';
  });
  h += '<p class="cap">Mittag und Abend</p><div class="grp pad"><div class="flex" style="justify-content:space-between"><span>Anteil am Tagesziel</span><b id="sharev">' + Math.round(st.share * 100) + ' %</b></div>' +
    '<input type="range" id="share" min="50" max="90" step="5" value="' + Math.round(st.share * 100) + '" aria-label="Anteil am Tagesziel"></div>' +
    '<p class="foot">Das Frühstück ist nicht Teil der Planung. Ziel pro Mahlzeit: ' + B.targets.map((t, i) => esc(names()[i]) + ' ' + Math.round(t) + ' g').join(', ') + '.</p>';
  h += '<p class="cap">Wochenregeln</p><div class="grp">' +
    '<label class="row"><span class="grow">Mindestens vegetarisch</span><select class="inl" data-set="vegMin">' + [2, 3, 4].map(n => opt(n, st.vegMin, n + ' von 5')).join('') + '</select></label>' +
    '<label class="row"><span class="grow">Höchstens Fisch</span><select class="inl" data-set="fishMax">' + [0, 1, 2].map(n => opt(n, st.fishMax, n + ' von 5')).join('') + '</select></label>' +
    '<label class="row"><span class="grow">Kocht zuerst allein</span><select class="inl" data-set="moCook">' + opt(0, st.moCook, esc(p[0].name)) + opt(1, st.moCook, esc(p[1].name)) + '</select></label></div>' +
    '<p class="foot">Regeln gelten ab dem nächsten Vorschlag. Sie werden auf die Zahl der vorgekochten Gerichte umgerechnet. Ist nur ein Gericht an einem Termin, kocht ihr zusammen.</p>';
  h += '<p class="cap">Darstellung</p><div class="pad" style="padding:0"><div class="seg">' + [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => '<button data-act="theme" data-t="' + k + '" aria-pressed="' + (S.theme === k) + '">' + l + '</button>').join('') + '</div></div>';
  h += '<p class="cap">Kalender abonnieren</p><div id="calsub">' + calBox() + '</div>';
  h += '<p class="cap">Kalenderdatei</p><div class="grp"><div class="pad"><p class="sub" style="margin-bottom:10px">Einmalig in einen Kalender übernehmen, ohne Abo.</p><div class="flex"><button class="btn sm" data-act="ics">Datei laden</button><button class="btn sm gray" data-act="icscopy">Als Text kopieren</button></div></div></div><div id="calbox"></div>';
  h += '<p class="cap">Gemeinsamer Plan</p><div id="syncbox">' + syncBox() + '</div>';
  h += '<p class="cap">Daten</p><div class="grp"><div class="pad"><p class="sub">Ohne gemeinsamen Plan liegt alles nur in diesem Browser auf diesem Gerät. Der Installationsmodus auf dem Home-Bildschirm und Safari speichern getrennt.</p></div>' +
    '<button class="row" data-act="resetall" style="color:var(--danger)"><span class="grow"><b>' + (S.confirm ? 'Wirklich alles zurücksetzen?' : 'Alles zurücksetzen') + '</b></span>' + (S.confirm ? '<span class="val">Tippe noch einmal</span>' : '') + '</button></div>';
  h += '<p class="foot">Version ' + APP_V + '</p>';
  return h;
}

/* ---------- Sheets ---------- */
function cookEvents() { if (!S.sheet || S.sheet.t !== 'cook') return []; const s = B.sessions.find(x => x.key === S.sheet.key); return s ? s.sched.events : []; }
function fmtMS(sec) { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60); }

function sheetHtml() {
  const sh = S.sheet;
  if (!sh) return '';
  if (sh.t === 'recipe') {
    const r = V.BY_ID[sh.id];
    if (!r) return '';
    const off = S.disabled.includes(r.id);
    return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(r.name) + '"><div class="shd"><span class="grab"></span><h3>' + esc(r.name) + '</h3><button class="btn sm soft" data-act="close">Fertig</button></div>' +
      '<div class="shb rb">' + dishImg(r) + '<p class="sub" style="margin-bottom:12px">' + esc(r.cuisine) + ' · ' + KIND[r.kind] + (r.src ? ' · nach einer Idee aus „' + esc(r.src) + '“, in eigener Fassung' : '') + '</p>' + recipeBody(r) +
      '<div class="flex" style="justify-content:space-between;margin-top:14px"><span class="sub">Hat es geschmeckt?</span>' + rateBtns(r.id) + '</div>' +
      '<div class="actions"><button class="btn ' + (off ? '' : 'gray') + '" data-act="pool" data-rid="' + r.id + '">' + (off ? 'In den Pool aufnehmen' : 'Aus dem Pool nehmen') + '</button></div></div></div>';
  }
  if (sh.t === 'cell') {
    const k = sh.k, x = S.grid[k];
    if (!x) return '';
    const days = weekDays(), dd = days[+k[0]];
    const typeSeg = '<div class="seg">' + ['p', 'f', 'o', 'x'].map(t => '<button data-act="celltype" data-t="' + t + '" aria-pressed="' + (x.t === t) + '">' + TYPE_NAME[t] + '</button>').join('') + '</div>';
    let body = typeSeg;
    if ((x.t === 'p' || x.t === 'f') && x.r && V.BY_ID[x.r]) {
      const fr = (lab, ctl) => '<label class="frow"><span>' + lab + '</span>' + ctl + '</label>';
      let rows = '';
      if (x.t === 'f') rows += fr('Wer kocht', '<select data-cwho aria-label="Wer kocht">' + whoOpts(x.w, true) + '</select>');
      else {
        const cs = cellSess(k);
        if (cs) rows += '<button class="row" data-act="term" data-term="' + (cs.n - 1) + '"><span class="grow">Kochtermin</span><span class="val">' + DAYS[cs.day] + ' · ' + esc(tl(cs.time)) + '</span></button>' +
          fr('Wer kocht', '<select data-pwho="' + (cs.n - 1) + '" aria-label="Wer kocht">' + whoOpts(sessList()[cs.n - 1].w, true) + '</select>');
      }
      body += '<div class="grp" style="margin-top:12px">' + rows + fr('Wer kauft ein', '<select data-shopwho aria-label="Wer kauft ein">' + whoOpts(shopCode(), false) + '</select>') + '</div>' +
        '<p class="foot" style="margin:6px 4px 0">' + (x.t === 'p' ? 'Person und Termin gelten für den ganzen Kochtermin. Einkaufen gilt für die ganze Woche.' : 'Einkaufen gilt für die ganze Woche.') + '</p>';
    }
    if (x.t === 'p' || x.t === 'f') {
      const week = x.t === 'p' ? B.prepIds : [];
      const row = (id, label, sub, on) => '<button class="row" data-act="cellr" data-rid="' + id + '"><span class="grow"><b>' + esc(label) + '</b>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</span>' + (on ? '<span class="val">✓</span>' : '') + '</button>';
      let list = row('', 'Automatisch', x.t === 'p' ? 'aus den vorgekochten Gerichten' : 'Vorschlag des Planers', !x.u);
      if (week.length) {
        list += '<p class="sub" style="padding:10px 16px 2px">Diese Woche vorgekocht</p>';
        week.forEach(id => { const r = V.BY_ID[id], t = B.time[id], late = t !== undefined && t > V.cellTime(k); list += row(id, r.name, 'gekocht ' + DAYLONG[Math.floor(t / 1440)] + (late ? ' (zu spät für dieses Feld)' : ''), x.u && x.r === id); });
      }
      list += '<p class="sub" style="padding:10px 16px 2px">Alle Rezepte</p>';
      V.RECIPES.filter(r => !week.includes(r.id)).forEach(r => { list += row(r.id, r.name, KIND[r.kind] + ' · ' + r.cuisine, x.u && x.r === r.id); });
      body += '<div class="grp cl" style="margin-top:12px">' + list + '</div>';
      if (x.r && V.BY_ID[x.r]) body += '<div class="flex" style="justify-content:space-between;margin-top:14px"><span class="sub">Hat es geschmeckt?</span>' + rateBtns(x.r) + '</div>';
    } else body += '<p class="sub" style="margin-top:14px">' + (x.t === 'o' ? 'Ihr esst auswärts. Dafür wird nichts gekocht oder eingekauft.' : 'Hier ist nichts geplant. Dafür wird nichts gekocht oder eingekauft.') + '</p>';
    return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Mahlzeit wählen"><div class="shd"><span class="grab"></span><h3>' + dd.n + ' ' + dd.date + ' · ' + MEAL_NAME[k[1]] + '</h3><button class="btn sm soft" data-act="close">Fertig</button></div><div class="shb">' + body + '</div></div>';
  }
  if (sh.t === 'term') {
    const isShop = sh.k === 'shop', o = isShop ? S.shopAt : sessList()[+sh.k];
    if (!o) return '';
    const hasT = !!o.time, bs = isShop ? null : B.sessions.find(x => x.key === 's' + sh.k);
    const fr = (lab, ctl) => '<label class="frow"><span>' + lab + '</span>' + ctl + '</label>';
    let g = fr('Tag', '<select data-tday aria-label="Tag">' + dayOpts(o.day, isShop) + '</select>') +
      fr('Wann', '<select data-tmode aria-label="Wann"><option value="day"' + (hasT ? '' : ' selected') + '>Im Lauf des Tages</option><option value="time"' + (hasT ? ' selected' : '') + '>Zur Uhrzeit</option></select>') +
      (hasT ? fr('Uhrzeit', '<input type="time" data-ttime value="' + esc(o.time) + '" aria-label="Uhrzeit">') : '') +
      fr('Wer', '<select data-twho aria-label="Wer">' + whoOpts(isShop ? shopCode() : o.w, !isShop) + '</select>');
    const foot = isShop ? 'Der Einkauf steht im Kalender. Ohne Uhrzeit als Ganztagstermin.' :
      (hasT ? 'Was hier gekocht wird, gibt es ab dieser Uhrzeit.' : 'Ohne Uhrzeit gibt es das Gekochte ab dem Abend dieses Tages.');
    return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Termin ändern"><div class="shd"><span class="grab"></span><h3>' + (isShop ? 'Einkaufen' : 'Kochtermin ' + (+sh.k + 1)) + '</h3><button class="btn sm soft" data-act="close">Fertig</button></div>' +
      '<div class="shb"><div class="grp">' + g + '</div><p class="foot" style="margin:8px 4px 0">' + foot + '</p>' +
      (bs ? '<p class="foot" style="margin:6px 4px 0"><b>Gerichte:</b> ' + esc(bs.rs.map(r => r.short).join(', ')) + '</p>' : '') +
      (!bs && !isShop ? '<p class="foot" style="margin:6px 4px 0"><b>Gerichte:</b> keine. Dem Termin sind keine Vorkoch-Mahlzeiten zugeordnet, weil vor dem nächsten Termin nichts gegessen wird, das von hier kommen könnte.</p>' : '') +
      (!isShop && S.sess.length > 1 ? '<div class="actions"><button class="btn danger" data-act="sessdel" data-i="' + sh.k + '">Termin entfernen</button></div>' : '') + '</div></div>';
  }
  if (sh.t === 'join') {
    return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Gemeinsamer Plan"><div class="shd"><span class="grab"></span><h3>Gemeinsamer Plan</h3><button class="btn sm soft" data-act="close">Abbrechen</button></div>' +
      '<div class="shb"><p>Dieses Gerät mit dem gemeinsamen Plan auf <b>' + esc(sh.u.replace('https://', '')) + '</b> verbinden? Der Plan, die Bewertungen und die Einstellungen von hier werden durch die gemeinsamen ersetzt.</p><div class="actions"><button class="btn" data-act="joinok">Verbinden</button></div></div></div>';
  }
  if (sh.t === 'snap') {
    return '<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Plan übernehmen"><div class="shd"><span class="grab"></span><h3>Plan übernehmen</h3><button class="btn sm soft" data-act="close">Abbrechen</button></div>' +
      '<div class="shb"><p>Das ist eine Momentaufnahme eines Plans. Übernehmen ersetzt Plan, Bewertungen und Einstellungen auf diesem Gerät.</p><div class="actions"><button class="btn" data-act="snapok">Übernehmen</button></div></div></div>';
  }
  if (sh.t === 'cook') {
    const s = B.sessions.find(x => x.key === sh.key), ev = cookEvents();
    if (!s || !ev.length) return '';
    const i = Math.min(S.ci, ev.length - 1), e = ev[i], di = dishIdx(e.rid), last = i === ev.length - 1;
    const multi = s.sched.rows.filter(x => x.rid === e.rid).length > 1;
    const par = ev.filter(o => o !== e && o.k === 'p' && o.start <= e.start + 1e-9 && o.end > e.start + 1e-9);
    let h = '<div class="sheet full" role="dialog" aria-modal="true" aria-label="Kochmodus"><div class="shd"><button class="lnk" data-act="close">Beenden</button><b>' + SESS_DAY_NAME(s) + '</b><span class="sub">' + (i + 1) + ' von ' + ev.length + '</span></div>' +
      '<div class="cm-top" style="padding:0 max(16px, env(safe-area-inset-left, 0px))">' + ev.map((_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="cm-body">' + timersHtml() + '<div class="cm-clock">' + (e.start < 1 ? 'Zu Beginn' : 'Nach ' + V.fmtDur(e.start)) + '</div>' +
      '<div class="cm-dish">' + dot(di) + esc(e.rs) + (multi ? ' · ' + esc(e.tn) : '') + '</div>' +
      '<div class="cm-text">' + esc(e.t) + '</div>' + amountsHtml(s, ev, i) + seasonHtml(e) +
      '<div class="cm-kind ' + e.k + '">' + (e.k === 'a' ? 'Du bist dran · ' + e.m + ' Min' : 'Läuft von allein · ' + e.m + ' Min') + (e.d ? ' · ' + esc(e.d) : '') + '</div>';
    const tid = s.key + ':' + i, tmin = (S.tadj && S.tadj[tid]) || e.m, own = (S.timers || []).find(x => x.id === tid);
    h += own ? '<p class="sub" style="margin:0">Timer für diesen Schritt läuft oben.</p>' :
      '<div class="tset"><button class="btn gray sm" data-act="tadj" data-id="' + esc(tid) + '" data-d="-1" data-m="' + e.m + '" aria-label="Weniger Minuten">−</button><button class="btn soft" data-act="timer" data-id="' + esc(tid) + '" data-min="' + tmin + '" data-label="' + esc(e.rs + (multi ? ' · ' + e.tn : '') + ': ' + e.t.slice(0, 34) + (e.t.length > 34 ? '…' : '')) + '">Timer starten (' + tmin + ' Min)</button><button class="btn gray sm" data-act="tadj" data-id="' + esc(tid) + '" data-d="1" data-m="' + e.m + '" aria-label="Mehr Minuten">+</button></div><p class="sub" style="margin:6px 0 0">Zeit passt nicht? Mit − und + ändern, zum Beispiel nach der Packungsangabe.</p>';
    if (par.length) h += '<div class="cm-par"><p>Gleichzeitig läuft</p><ul>' + par.map(o => '<li>' + dot(dishIdx(o.rid)) + esc(o.rs + (s.sched.rows.filter(x => x.rid === o.rid).length > 1 ? ' · ' + o.tn : '') + ' bis ' + V.fmtClock(o.end)) + '</li>').join('') + '</ul></div>';
    if (i === 0 && s.thaw.length) h += '<p class="thaw">Aufgetaut sein sollte: ' + esc(s.thaw.join(', ')) + '</p>';
    h += '</div><div class="cm-foot"><button class="btn gray" data-act="cmprev"' + (i === 0 ? ' disabled style="opacity:.4"' : '') + '>Zurück</button><button class="btn" data-act="cmnext">' + (last ? 'Fertig' : 'Weiter') + '</button></div></div>';
    return h;
  }
  return '';
}
function timersHtml() {
  const t = S.timers || [];
  if (!t.length) return '';
  return '<div class="timers">' + t.map(x => {
    const left = (x.end - Date.now()) / 1000;
    return '<div class="timer' + (left <= 0 ? ' done' : '') + '"><div><div class="sub">' + esc(x.label) + '</div><b data-tmr="' + esc(x.id) + '">' + (left <= 0 ? 'Fertig' : fmtMS(left)) + '</b></div><button class="btn sm gray" data-act="timerstop" data-id="' + esc(x.id) + '">' + (left <= 0 ? 'OK' : 'Stoppen') + '</button></div>';
  }).join('') + '</div>';
}
/* Mengen je Kochschritt (Faktor: Zahl der Rezeptansätze dieser Woche; frisch gekocht = halber Ansatz) */
function amountsHtml(s, ev, i) {
  const f = rid => s.fresh ? 0.5 : Math.max(1, Math.ceil((B.counts[rid] || 2) / 2));
  const a = V.stepAmounts(ev, f)[i];
  if (!a || (!a.items.length && !a.extra.length && !(a.again && a.again.length))) return '';
  let h = '<div class="cm-amt">';
  if (a.items.length) h += '<p>Dafür brauchst du</p><ul>' + a.items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  if (a.again && a.again.length) h += '<p>Weiter mit</p><ul>' + a.again.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  if (a.extra.length) h += '<p>Dazu, nicht vergessen</p><ul>' + a.extra.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  return h + '</div>';
}
/* Würzen: Salz und Pfeffer ohne feste Menge (nicht in den Zutaten), darum „nach Geschmack“ */
function seasonHtml(e) {
  const t = e.t || '', items = [];
  if (/\bsalz(?!wasser)/i.test(t)) items.push('Salz nach Geschmack');
  if (/\bpfeffer/i.test(t)) items.push('Pfeffer nach Geschmack');
  if (!items.length && /\bwürz|abschmeck/i.test(t)) items.push('Nach Geschmack abschmecken');
  if (!items.length) return '';
  return '<div class="cm-amt cm-season"><p>Würzen</p><ul>' + items.map(x => '<li>' + x + '</li>').join('') + '</ul><p class="sub" style="margin:6px 0 0">Erst probieren, dann nachwürzen.</p></div>';
}
function SESS_DAY_NAME(s) { return DAYLONG[s.day] + (s.fresh ? ', frisch' : ''); }

/* ---------- Rendern ---------- */
const app = document.getElementById('app');
let wl = null;
function lockScreen(on) {
  try {
    if (on) { navigator.wakeLock.request('screen').then(l => { wl = l; }, () => {}); }
    else if (wl) { wl.release(); wl = null; }
  } catch (e) { /* nicht verfügbar */ }
}
function applyTheme() {
  try {
    const r = document.documentElement;
    if (!r) return;
    if (S.theme === 'light' || S.theme === 'dark') r.setAttribute('data-theme', S.theme); else r.removeAttribute('data-theme');
  } catch (e) { /* egal */ }
}
function render() {
  rebuild();
  if (!B) { app.innerHTML = '<p class="alert">' + esc(S.msg || 'Keine Woche geplant.') + '</p><div class="actions"><button class="btn" data-act="reroll">Neu planen</button></div>'; return; }
  const v = { plan: viewPlan, shop: viewShop, cook: viewCook, recipes: viewRecipes, settings: viewSettings }[S.tab] || viewPlan;
  app.innerHTML = '<div class="' + (S.fresh ? 'view' : '') + '">' + v() + '</div>' + sheetHtml() +
    (S.undo ? '<div class="toast" id="undo" role="status"><span>' + S.undo.msg + '</span><button data-act="undo">Rückgängig</button></div>' : '');
  S.fresh = false;
  if (document.body && document.body.classList) document.body.classList.toggle('lock', !!S.sheet);
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
}

/* ---------- Ereignisse ---------- */
function listText() {
  let t = 'Einkauf Vorkoch\n';
  const block = (items) => V.AISLES.map(a => {
    const list = items.filter(x => x.a === a);
    return list.length ? '\n' + a + '\n' + list.map(x => '- ' + x.n + ': ' + x.txt).join('\n') + '\n' : '';
  }).join('');
  if (S.shopView === 'laden') ['d', 'm'].forEach(s => { const l = B.shop.items.filter(x => storeOf(x) === s); if (l.length) t += '\n=== ' + STORES[s] + ' ===' + block(l); });
  else t += block(B.shop.items).replace(/^/, '');
  t += '\nZuhause prüfen\n' + B.shop.vorrat.map(x => '- ' + x.n).join('\n') + '\n';
  return t;
}
/* ---------- Kalender abonnieren: Dateien über die GitHub-API ins eigene Repo legen ---------- */
const GH_KEY = 'vorkoch.gh';
function ghTok() { try { return localStorage.getItem(GH_KEY) || ''; } catch (e) { return ''; } }
function ghSet(t) { try { if (t) localStorage.setItem(GH_KEY, t); else localStorage.removeItem(GH_KEY); } catch (e) { /* egal */ } }
const REPO_RE = VX.REPO_RE;
function calUrl(w) {
  if (!S.cal) return '';
  const p = S.cal.repo.split('/'), o = p[0].toLowerCase(), r = p[1].toLowerCase();
  return 'https://' + o + '.github.io/' + (r === o + '.github.io' ? '' : p[1] + '/') + 'kalender/' + S.cal.secret + '-' + w + '.ics';
}
function icsInput(filter) {
  const meals = [];
  V.CELLS.forEach(k => {
    const x = S.grid[k];
    if ((x.t === 'p' || x.t === 'f') && x.r && V.BY_ID[x.r]) meals.push({ day: +k[0], meal: k[1], name: V.BY_ID[x.r].short, note: x.t === 'f' ? 'frisch gekocht' : 'vorgekocht' });
  });
  const n = names();
  return {
    weekStart: S.weekStart || iso(nextSunday()), shop: Object.assign({ w: shopCode() }, S.shopAt), shopText: listText(), names: n, filter,
    calName: filter === 'all' ? 'Vorkoch' : 'Vorkoch ' + n[+filter], meals,
    sessions: B.sessions.map(s => ({ key: s.key, day: s.day, time: s.time, fresh: s.fresh, w: whoCode(s), who: cookWho(s), mk: s.sched.mk, thaw: s.thaw, dishes: s.rs.map(r => r.name),
      events: s.sched.events.map(e => ({ start: e.start, rs: e.rs, tn: e.tn, t: e.t })) }))
  };
}
const stripStamp = t => String(t).replace(/\r?\n/g, '\n').split('\n').filter(l => !/^DTSTAMP:/.test(l)).join('\n');
function calDecode(b64) { try { return VX.b64dec(String(b64).replace(/\s/g, '')); } catch (e) { return ''; } }
async function ghPut(tok, repo, path, text) {
  const api = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  const hd = { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const fail = st => new Error(st === 401 ? 'Token ungültig oder abgelaufen.' : st === 403 || st === 404 ? 'Kein Zugriff. Der Token braucht „Contents: Read and write“ für genau dieses Repo, und der Repo-Name muss stimmen.' : 'GitHub-Fehler ' + st + '.');
  const one = async () => {
    let sha, r;
    try { r = await fetch(api, { headers: hd, cache: 'no-store' }); } catch (e) { throw new Error('Keine Verbindung.'); }
    if (r.status === 200) {
      const j = await r.json(); sha = j.sha;
      if (j.content && stripStamp(calDecode(j.content)) === stripStamp(text)) return;
    } else if (r.status !== 404) throw fail(r.status);
    const body = { message: 'Kalender aktualisiert', content: VX.b64std(text) }; if (sha) body.sha = sha;
    try { r = await fetch(api, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, hd), body: JSON.stringify(body) }); } catch (e) { throw new Error('Keine Verbindung.'); }
    if (!r.ok) { const er = fail(r.status); er.status = r.status; throw er; }
  };
  try { await one(); } catch (e) { if (e.status === 409 || e.status === 422) await one(); else throw e; }
}
const SIG_KEY = 'vorkoch.calsig';
function sigGet() { try { return localStorage.getItem(SIG_KEY) || ''; } catch (e) { return ''; } }
function sigSet(v) { try { localStorage.setItem(SIG_KEY, v); } catch (e) { /* egal */ } }
function withWeek(ws, fn) {
  const bak = { grid: S.grid, sess: S.sess, shopAt: S.shopAt, key: S.key, relaxed: S.relaxed, weekStart: S.weekStart, shopView: S.shopView }, bB = B;
  try {
    if (ws !== S.weekStart) { const r = S.weeks[ws]; S.grid = r.grid; S.sess = r.sess; S.shopAt = r.shopAt; S.key = r.key; S.relaxed = r.relaxed; S.weekStart = ws; }
    S.shopView = 'gang'; rebuild(); return fn();
  } finally { Object.assign(S, bak); B = bB; }
}
// Der Kalender enthält diese und alle geplanten kommenden Wochen.
function icsMulti(filter) {
  commitWeek();
  const t = thisSunday();
  let list = Object.keys(S.weeks).filter(k => k >= t && wkHasMeals(S.weeks[k])).sort();
  if (!list.length) list = [S.weekStart];
  const ins = list.map(ws => withWeek(ws, () => icsInput(filter)));
  const first = ins.shift(); first.more = ins; return first;
}
function calFiles() { return [['all', 'alle'], ['0', '0'], ['1', '1']].map(f => ({ path: 'kalender/' + S.cal.secret + '-' + f[1] + '.ics', text: VX.buildICS(icsMulti(f[0])) })); }
function calSig(files) { const s = files.map(f => stripStamp(f.text)).join('\u0001') + '|' + S.cal.repo; let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ':' + s.length; }
// Automatisch veröffentlichen: nach jeder Änderung, wenn dieses Gerät den Token hat und sich der Inhalt wirklich geändert hat.
function calSoon(ms) {
  if (!S.cal || !ghTok()) return;
  if (calTimer) clearTimeout(calTimer);
  calTimer = setTimeout(calAuto, ms == null ? 15000 : ms);
}
async function calAuto() {
  calTimer = null;
  const tok = ghTok();
  if (!S.cal || !tok || !B || calBusy) return;
  const files = calFiles(), sig = calSig(files);
  if (sig === sigGet()) return;
  calBusy = true;
  try {
    for (const f of files) await ghPut(tok, S.cal.repo, f.path, f.text);
    sigSet(sig); S.calAt = Date.now(); saveLocal(); calFail = 0;
    S.cs = { state: 'ok', auto: true, msg: 'Automatisch veröffentlicht. GitHub braucht ein bis zwei Minuten, Google danach oft noch Stunden.' };
  } catch (e) {
    S.cs = { state: 'err', auto: true, msg: e && e.message ? e.message : 'Fehler' };
    calFail++; if (calFail <= 3) calSoon(120000);
  }
  calBusy = false;
  if (!S.sheet && !typing()) render();
}
async function publishCal() {
  const tok = ghTok();
  if (!S.cal || !B) return;
  if (!tok) { S.cs = { state: 'err', msg: 'Auf diesem Gerät fehlt der GitHub-Token. Trage ihn hier ein, dann kannst du auch von hier aktualisieren.' }; setTab('settings'); return; }
  S.cs = { state: 'busy', msg: 'Veröffentliche …' }; render();
  try {
    const files = calFiles();
    for (const f of files) await ghPut(tok, S.cal.repo, f.path, f.text);
    sigSet(calSig(files)); S.calAt = Date.now(); saveLocal();
    S.cs = { state: 'ok', msg: 'Veröffentlicht. GitHub braucht ein bis zwei Minuten, Google danach oft noch Stunden.' };
  } catch (e) { S.cs = { state: 'err', msg: e.message || 'Fehler' }; }
  render();
}
function calAgo() {
  if (!S.calAt) return 'noch nie';
  const m = Math.round((Date.now() - S.calAt) / 60000);
  return m < 1 ? 'gerade eben' : m < 60 ? 'vor ' + m + ' Min' : m < 1440 ? 'vor ' + Math.round(m / 60) + ' Std' : 'vor ' + Math.round(m / 1440) + ' Tagen';
}
function calBox() {
  const cs = S.cs, tok = ghTok();
  const msg = cs ? '<p class="' + (cs.state === 'err' ? 'warn' : 'sub') + '" style="margin-top:8px">' + esc(cs.msg) + '</p>' : '';
  if (!S.cal) {
    return '<div class="grp"><div class="pad"><p class="sub" style="margin-bottom:10px">Dein Google Kalender zeigt dann automatisch Einkauf, Kochtermine und Mahlzeiten. Es gibt eine Version für alle, eine für ' + esc(names()[0]) + ' und eine für ' + esc(names()[1]) + '.</p>' +
      '<ol class="mini"><li>github.com, Profilbild, Settings, ganz unten Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.</li><li>Repository access: Only select repositories, dein Vorkoch-Repo. Permissions, Repository, Contents: Read and write. Erzeugen und den Token kopieren.</li><li>Unten Repo und Token eintragen und einrichten.</li></ol>' +
      '<div style="display:grid;gap:8px;margin-top:12px"><input type="text" id="calrepo" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="benutzername/repo-name" aria-label="GitHub-Repo"><input type="password" id="caltok" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Token (github_pat_…)" aria-label="GitHub-Token"><button class="btn sm" data-act="calsetup">Einrichten und veröffentlichen</button></div>' + msg + '</div></div>' +
      '<p class="foot">Der Token bleibt nur auf diesem Gerät. Die Kalender-Adressen enthalten ein Zufallswort und lassen sich nicht erraten, aber nicht geheim: Wer die Adresse kennt, sieht Termine und Gerichte.</p>';
  }
  const rows = [['alle', 'Für alle'], ['0', names()[0]], ['1', names()[1]]].map(([w, l]) => '<button class="row" data-act="calcopy" data-w="' + w + '"><span class="grow">Adresse kopieren: <b>' + esc(l) + '</b></span></button>').join('');
  return '<div class="grp"><div class="row"><span class="grow"><b>Eingerichtet</b><div class="sub">' + esc(S.cal.repo) + ' · zuletzt veröffentlicht: ' + calAgo() + '</div></span></div>' + rows +
    (tok ? '<button class="row" data-act="calpub"><span class="grow"><b>Jetzt aktualisieren</b></span></button>' :
      '<div class="pad"><p class="sub" style="margin-bottom:8px">Mit dem Token veröffentlicht dieses Gerät Änderungen automatisch. Ohne Token übernimmt das ein anderes Gerät, das den Token hat.</p><div class="flex"><input type="password" id="caltok" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Token" aria-label="GitHub-Token"><button class="btn sm" data-act="caltok">Speichern</button></div></div>') +
    '<button class="row" data-act="caloff" style="color:var(--danger)"><span class="grow">Kalender trennen</span></button></div>' + msg + '<div id="calurl"></div>' +
    '<p class="foot">Einmal in Google Kalender am Computer: Weitere Kalender, plus, Per URL, Adresse einfügen. Danach erscheint er auch auf dem Handy. Google holt Änderungen nur alle paar Stunden. Mit Token auf diesem Gerät wird etwa 15 Sekunden nach jeder Änderung automatisch veröffentlicht, solange die App offen ist oder wieder geöffnet wird. Hinweis: In GitHub Desktop vor dem nächsten Hochladen erst „Fetch origin“ und „Pull“ drücken, weil die App neue Dateien ins Repo legt.</p>';
}
function copyOut(txt, okMsg, rows, boxId) {
  const box = document.getElementById(boxId || 'copybox');
  if (!box) return;
  const fallback = () => { box.innerHTML = '<textarea readonly rows="' + rows + '" id="cptxt"></textarea>'; const ta = document.getElementById('cptxt'); if (ta) { ta.value = txt; ta.focus(); ta.select(); } };
  try { navigator.clipboard.writeText(txt).then(() => { box.innerHTML = '<p class="ok" style="margin:0 2px">' + okMsg + '</p>'; }, fallback); } catch (err) { fallback(); }
}
function setTab(t) { S.tab = t; S.sheet = null; S.fresh = true; save(); render(); window.scrollTo(0, 0); }
function closeSheet() { if (S.sheet && S.sheet.t === 'cook') lockScreen(false); S.sheet = null; render(); }
let tick = null;
function beep() {
  try { const C = window.AudioContext || window.webkitAudioContext, c = new C(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); setTimeout(() => { o.stop(); c.close(); }, 500); } catch (e) { /* egal */ }
}
function startTick() {
  if (tick || typeof setInterval !== 'function') return;
  tick = setInterval(() => {
    const ts = S.timers || [];
    if (!ts.length) { clearInterval(tick); tick = null; return; }
    let fire = false;
    ts.forEach(x => {
      const left = (x.end - Date.now()) / 1000;
      if (left <= 0 && !x.fired) { x.fired = true; fire = true; }
      else if (left > 0) { const el = document.querySelector('[data-tmr="' + x.id + '"]'); if (el) el.textContent = fmtMS(left); }
    });
    if (fire) { try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { /* egal */ } beep(); if (S.sheet) render(); }
  }, 500);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'tab') setTab(b.dataset.tab);
  else if (act === 'reroll') { const u = undoSnap(); generate(false); if (!S.msg) undoOffer(u, 'Neuer Vorschlag.'); render(); }
  else if (act === 'undo') { undoRun(); render(); }
  else if (act === 'wk') { const t = addDaysIso(S.weekStart, 7 * (+b.dataset.d < 0 ? -1 : 1)); if (canGo(t)) { openWeek(t); render(); window.scrollTo(0, 0); } }
  else if (act === 'wkgo') { openWeek(defaultWeek()); render(); window.scrollTo(0, 0); }
  else if (act === 'offerplan') { const i = document.getElementById('offers'); S.offers = i ? i.value : S.offers; touch('offers'); const u = undoSnap(); generate(false); if (!S.msg) undoOffer(u, 'Neuer Vorschlag.'); render(); }
  else if (act === 'recipe') { S.sheet = { t: 'recipe', id: b.dataset.rid }; render(); }
  else if (act === 'cookstart') { S.sheet = { t: 'cook', key: b.dataset.key }; S.ci = 0; lockScreen(true); render(); }
  else if (act === 'close') closeSheet();
  else if (act === 'cmnext') {
    if (!S.sheet || S.sheet.t !== 'cook') return;
    const n = cookEvents().length;
    if (S.ci >= n - 1) closeSheet(); else { S.ci++; render(); }
  }
  else if (act === 'cmprev') { if (S.sheet && S.sheet.t === 'cook' && S.ci > 0) { S.ci--; render(); } }
  else if (act === 'timer') {
    const id = b.dataset.id || b.dataset.label || 'Timer';
    if (!S.timers) S.timers = [];
    if (!S.timers.some(x => x.id === id)) S.timers.push({ id, end: Date.now() + (+b.dataset.min) * 60000, label: b.dataset.label || 'Timer' });
    startTick(); render();
  }
  else if (act === 'tadj') {
    const id = b.dataset.id, cur = (S.tadj && S.tadj[id]) || +b.dataset.m || 1;
    if (!S.tadj) S.tadj = {};
    S.tadj[id] = Math.max(1, Math.min(240, cur + (+b.dataset.d) * (cur >= 20 ? 5 : 1))); render();
  }
  else if (act === 'timerstop') { S.timers = (S.timers || []).filter(x => x.id !== b.dataset.id); render(); }
  else if (act === 'filter') { S.filter = b.dataset.f; render(); }
  else if (act === 'carb') { S.carb = b.dataset.c || ''; render(); }
  else if (act === 'country') { S.country = b.dataset.c || ''; render(); }
  else if (act === 'theme') { S.theme = b.dataset.t; applyTheme(); save(); render(); }
  else if (act === 'poolall') { S.disabled = []; touch('pool'); save(); render(); }
  else if (act === 'poolnone') { S.disabled = V.RECIPES.map(r => r.id); touch('pool'); save(); render(); }
  else if (act === 'copysel') {
    const f = on => V.RECIPES.filter(r => on === !S.disabled.includes(r.id)).map(r => r.id).join(', ');
    copyOut('Mag ich: ' + f(true) + '\nMag ich nicht: ' + f(false) + '\n', 'Auswahl kopiert.', 6);
  }
  else if (act === 'pool') {
    const id = b.dataset.rid, k = S.disabled.indexOf(id);
    if (k >= 0) S.disabled.splice(k, 1); else S.disabled.push(id);
    touch('pool'); save(); render();
  }
  else if (act === 'uncheck') { const u = undoSnap(); clearTicks(S.weekStart); undoOffer(u, 'Haken gelöscht.'); save(); render(); }
  else if (act === 'copy') copyOut(listText(), 'Liste kopiert.', 10);
  else if (act === 'term') { S.sess = V.sortSess(S.sess); S.sheet = { t: 'term', k: b.dataset.term }; render(); }
  else if (act === 'cell') { S.sheet = { t: 'cell', k: b.dataset.k }; render(); }
  else if (act === 'celltype') {
    const k = S.sheet && S.sheet.k, t = b.dataset.t;
    if (!k || !/^[pfox]$/.test(t)) return;
    editGrid(g => { g[k] = { t }; });
    if (t === 'o' || t === 'x') S.sheet = null;
    render();
  }
  else if (act === 'cellr') {
    const k = S.sheet && S.sheet.k, id = b.dataset.rid;
    if (!k) return;
    editGrid(g => { const t = g[k].t, w = g[k].w; g[k] = id && V.BY_ID[id] ? { t, r: id, u: 1 } : { t }; if (t === 'f' && w) g[k].w = w; });
    S.sheet = null; render();
  }
  else if (act === 'sessadd') {
    if (S.sess.length >= 4) return;
    const o = { day: 2, time: '' }; S.sess.push(o); S.sess = V.sortSess(S.sess);
    editGrid(() => {}); S.sheet = { t: 'term', k: String(S.sess.indexOf(o)) }; render();
  }
  else if (act === 'sessdel') {
    const i = +b.dataset.i; if (S.sess.length <= 1 || !(i >= 0 && i < S.sess.length)) return;
    S.sess.splice(i, 1); editGrid(() => {}); S.sheet = null; render();
  }
  else if (act === 'rate') {
    const id = b.dataset.rid, v = +b.dataset.v;
    S.ratings[id] = S.ratings[id] === v ? 0 : v; touchKey('ratings', id); save(); render();
  }
  else if (act === 'shopview') { S.shopView = b.dataset.v === 'laden' ? 'laden' : 'gang'; save(); render(); }
  else if (act === 'store') {
    const id = b.dataset.id, x = B.shop.items.find(o => o.id === id);
    if (x) { S.storeOv[id] = storeOf(x) === 'm' ? 'd' : 'm'; touchKey('storeOv', id); save(); render(); }
  }
  else if (act === 'ics' || act === 'icscopy') {
    const txt = VX.buildICS(icsMulti('all'));
    if (act === 'icscopy') { copyOut(txt, 'Kopiert. In eine Textdatei mit der Endung .ics einfügen und öffnen.', 8, 'calbox'); return; }
    try {
      const url = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
      const l = document.createElement('a'); l.href = url; l.download = 'vorkoch-woche.ics'; document.body.appendChild(l); l.click(); l.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      const box = document.getElementById('calbox'); if (box) box.innerHTML = '<p class="foot">Falls nichts passiert, nimm „Als Text kopieren“.</p>';
    } catch (err) { copyOut(txt, 'Kopiert. In eine Textdatei mit der Endung .ics einfügen und öffnen.', 8, 'calbox'); }
  }
  else if (act === 'calsetup') {
    const r = (document.getElementById('calrepo') || {}).value || '', t = ((document.getElementById('caltok') || {}).value || '').trim();
    const repo = r.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '').replace(/\.git$/, '');
    if (!REPO_RE.test(repo)) { S.cs = { state: 'err', msg: 'Das Repo muss so aussehen: benutzername/repo-name.' }; render(); return; }
    if (!/^[A-Za-z0-9_]{20,255}$/.test(t)) { S.cs = { state: 'err', msg: 'Das sieht nicht nach einem GitHub-Token aus.' }; render(); return; }
    ghSet(t); S.cal = { repo, secret: newCode().slice(0, 16) }; touch('settings'); saveLocal(); schedSync(); publishCal();
  }
  else if (act === 'calpub') publishCal();
  else if (act === 'caltok') { const t = ((document.getElementById('caltok') || {}).value || '').trim(); if (/^[A-Za-z0-9_]{20,255}$/.test(t)) { ghSet(t); S.cs = null; calSoon(1500); render(); } else { S.cs = { state: 'err', msg: 'Das sieht nicht nach einem GitHub-Token aus.' }; render(); } }
  else if (act === 'calcopy') copyOut(calUrl(b.dataset.w), 'Adresse kopiert. In Google Kalender „Per URL“ einfügen.', 3, 'calurl');
  else if (act === 'caloff') { S.cal = null; S.cs = null; ghSet(''); touch('settings'); saveLocal(); schedSync(); render(); }
  else if (act === 'connect') {
    const i = document.getElementById('syncurl'), u = normUrl(i ? i.value : '');
    if (!u) { ssSet('err', 'Das ist keine Firebase-Adresse. Sie endet auf firebasedatabase.app oder firebaseio.com.'); const el = document.getElementById('syncbox'); if (el) el.innerHTML = syncBox(); return; }
    S.sync = { url: u, code: newCode(), fresh: false }; S.ss = null; saveLocal(); syncNow(); render();
  }
  else if (act === 'syncnow') syncNow();
  else if (act === 'invite') copyOut(inviteLink(), 'Link kopiert. Auf dem anderen Gerät öffnen.', 4, 'syncout');
  else if (act === 'snaplink') copyOut(snapLink(), 'Link kopiert. Auf dem anderen Gerät öffnen, um den Plan zu übernehmen.', 4, 'syncout');
  else if (act === 'disconnect') { S.sync = { url: '', code: '', fresh: false }; S.ss = null; saveLocal(); render(); }
  else if (act === 'joinok') {
    const sh = S.sheet; if (!sh || sh.t !== 'join') return;
    S.sync = { url: sh.u, code: sh.c, fresh: true }; S.sheet = null; S.ss = null; saveLocal(); syncNow(); render();
  }
  else if (act === 'snapok') {
    const sh = S.sheet; if (!sh || sh.t !== 'snap') return;
    VX.applyDoc(S, sh.doc, V.BY_ID);
    reloadView();
    const n = Date.now(); ['plan', 'pool', 'settings', 'offers', 'bundles'].forEach(k => { S.mt.m[k] = n; });
    ['ratings', 'storeOv', 'checked'].forEach(k => Object.keys(k === 'checked' ? S.checked.map : S[k]).forEach(id => { S.mt[k][id] = n; }));
    Object.keys(S.weeks).forEach(ws => { S.mt.weeks[ws] = n; });
    S.sheet = null; syncIds();
    save(); render();
  }
  else if (act === 'resetall') {
    if (!S.confirm) { S.confirm = true; render(); return; }
    try { localStorage.removeItem(KEY); } catch (err) { /* egal */ }
    S = defaults(); resetTransient(); applyTheme(); generate(false); render(); window.scrollTo(0, 0);
  }
});

function termObj() {
  const sh = S.sheet; if (!sh || sh.t !== 'term') return null;
  if (sh.k === 'shop') return { shop: true, o: S.shopAt };
  const o = S.sess[+sh.k]; return o ? { shop: false, o } : null;
}
function termAfter(t) {
  if (t.shop) { touch('plan'); save(); render(); return; }
  S.sess = V.sortSess(S.sess); S.sheet.k = String(S.sess.indexOf(t.o)); editGrid(() => {}); render();
}

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.tday !== undefined) {
    const o = termObj(), v = +t.value; if (o && v >= (o.shop ? -1 : 0) && v <= 6) { o.o.day = v; termAfter(o); }
  } else if (t.dataset && t.dataset.tmode !== undefined) {
    const o = termObj(); if (o) { o.o.time = t.value === 'time' ? (o.shop ? '10:00' : '18:00') : ''; termAfter(o); }
  } else if (t.dataset && t.dataset.ttime !== undefined) {
    const o = termObj(); if (o && /^\d{1,2}:\d{2}$/.test(t.value)) { o.o.time = t.value; termAfter(o); }
  } else if (t.dataset && t.dataset.twho !== undefined) {
    const o = termObj(); if (o && /^[ab01]$/.test(t.value)) {
      if (o.shop) { if (t.value === 'b' || t.value === 'a') delete o.o.w; else o.o.w = t.value; }
      else if (t.value === 'a') delete o.o.w; else o.o.w = t.value;
      termAfter(o);
    }
  } else if (t.dataset && t.dataset.shopwho !== undefined) {
    if (/^[b01]$/.test(t.value)) { if (t.value === 'b') delete S.shopAt.w; else S.shopAt.w = t.value; touch('plan'); save(); render(); }
  } else if (t.dataset && t.dataset.pwho !== undefined) {
    const o = sessList()[+t.dataset.pwho]; if (o && /^[ab01]$/.test(t.value)) { if (t.value === 'a') delete o.w; else o.w = t.value; touch('plan'); save(); render(); }
  } else if (t.dataset && t.dataset.cwho !== undefined) {
    const k = S.sheet && S.sheet.k; if (k && /^[ab01]$/.test(t.value)) { editGrid(g => { if (t.value === 'a') delete g[k].w; else g[k].w = t.value; }); render(); }
  } else if (t.dataset && t.dataset.motto !== undefined) {
    S.motto = t.value && V.countries().some(c => c.name === t.value) ? t.value : ''; touch('settings'); save(); render();
  } else if (t.id === 'syncurl') { /* wird beim Verbinden gelesen */ }
  else if (t.dataset && t.dataset.pool) {
    const id = t.dataset.pool, k = S.disabled.indexOf(id);
    if (t.checked && k >= 0) S.disabled.splice(k, 1); else if (!t.checked && k < 0) S.disabled.push(id);
    touch('pool');
    const w = t.closest('.rrow'); if (w) w.classList.toggle('offrec', !t.checked);
    const c = document.getElementById('poolcnt'); if (c) c.textContent = pool().length + ' von ' + V.RECIPES.length;
    save();
  } else if (t.matches('input[type=checkbox][data-key]')) {
    S.checked.map[tk(t.dataset.key)] = t.checked; touchKey('checked', tk(t.dataset.key));
    const row = t.closest('.item'); if (row) row.classList.toggle('done', t.checked);
    const items = B.shop.items, n = items.filter(x => S.checked.map[tk(x.id)]).length, pr = document.getElementById('prog'), pb = document.getElementById('pbar');
    if (pr) pr.textContent = n + ' von ' + items.length;
    if (pb) pb.style.width = (items.length ? n / items.length * 100 : 0) + '%';
    save();
  } else if (t.id === 'div') { S.diversity = t.value / 100; touch('settings'); save(); }
  else if (t.id === 'offers') { S.offers = t.value; touch('offers'); save(); }
  else if (t.id === 'share') { S.settings.share = t.value / 100; touch('settings'); save(); render(); }
  else if (t.dataset && t.dataset.set) {
    const k = t.dataset.set;
    if (k === 'name') S.settings.persons[+t.dataset.i].name = t.value.trim() || (t.dataset.i === '0' ? 'Roman' : 'Partnerin');
    else if (k === 'protein') S.settings.persons[+t.dataset.i].protein = Math.min(220, Math.max(40, +t.value || 90));
    else S.settings[k] = +t.value;
    touch('settings'); save(); render();
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'share') { const o = document.getElementById('sharev'); if (o) o.textContent = t.value + ' %'; }
  else if (t.id === 'q') { S.q = t.value; const l = document.getElementById('rlist'); if (l) l.innerHTML = recipeList(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.sheet) closeSheet(); });
let tx = null;
document.addEventListener('touchstart', e => { if (S.sheet && S.sheet.t === 'cook' && e.touches && e.touches[0]) tx = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!tx || !S.sheet || S.sheet.t !== 'cook' || !e.changedTouches || !e.changedTouches[0]) { tx = null; return; }
  const dx = e.changedTouches[0].clientX - tx[0], dy = e.changedTouches[0].clientY - tx[1];
  tx = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 60) return;
  const n = cookEvents().length;
  if (dx < 0) { if (S.ci < n - 1) { S.ci++; render(); } }
  else if (S.ci > 0) { S.ci--; render(); }
}, { passive: true });

applyTheme();
checkHash();
render();
if (syncOn()) { S.sync.fresh = !!S.sync.fresh; syncNow(); }
})();
