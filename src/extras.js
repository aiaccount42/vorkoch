/* Zusatzfunktionen ohne Oberfläche: Kalenderdatei, Teilen per Link, Abgleich zwischen Geräten.
   Alles reine Funktionen, mit Node testbar. */
(function (root) {
'use strict';

/* ---------- Kalender (.ics) ---------- */
function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n'); }
function u8(ch) { const c = ch.codePointAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
function fold(line) {
  const out = []; let cur = '', n = 0, lim = 75;
  for (const ch of line) {
    const b = u8(ch);
    if (n + b > lim) { out.push(cur); cur = ' '; n = 1; lim = 75; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join('\r\n');
}
const p2 = n => String(n).padStart(2, '0');
function stamp(isoDay, hhmm, addMin) {
  // isoDay 'YYYY-MM-DD', hhmm 'HH:MM' -> 'YYYYMMDDTHHMM00' (lokale Zeit, ohne Zone)
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '') || [0, '18', '00'];
  const d = new Date(isoDay + 'T' + p2(+m[1]) + ':' + m[2] + ':00');
  d.setMinutes(d.getMinutes() + (addMin || 0));
  return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + 'T' + p2(d.getHours()) + p2(d.getMinutes()) + '00';
}
function addDays(isoDay, n) {
  const d = new Date(isoDay + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}
function fmtClock(m) { m = Math.round(m); return Math.floor(m / 60) + ':' + p2(m % 60); }

/* input: { weekStart: 'YYYY-MM-DD' (Sonntag), shop: {day, time} (day -1 = Samstag davor, 0..6 = Tag der Woche), shopText,
   sessions: [{key, day 0..6, time, fresh, who, mk, thaw: [], dishes: [name], events: [{start, rs, tn, t}]}] } */
const VTZ = ['BEGIN:VTIMEZONE', 'TZID:Europe/Berlin', 'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD', 'END:VTIMEZONE'].join('\r\n');
function buildICS(input) {
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = [];
  function add(uid, start, end, summary, desc, alarmMin) {
    let s = ['BEGIN:VEVENT', 'UID:' + uid + '@vorkoch', 'DTSTAMP:' + now, 'DTSTART;TZID=Europe/Berlin:' + start, 'DTEND;TZID=Europe/Berlin:' + end, 'SUMMARY:' + icsEsc(summary)];
    if (desc) s.push('DESCRIPTION:' + icsEsc(desc));
    if (alarmMin != null) s = s.concat(['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(summary), 'TRIGGER:-PT' + alarmMin + 'M', 'END:VALARM']);
    s.push('END:VEVENT');
    ev.push(s.map(fold).join('\r\n'));
  }
  function addAllDay(uid, dayIso, summary, desc, alarmHours) {
    const d0 = dayIso.replace(/-/g, ''), d1 = addDays(dayIso, 1).replace(/-/g, '');
    let s = ['BEGIN:VEVENT', 'UID:' + uid + '@vorkoch', 'DTSTAMP:' + now, 'DTSTART;VALUE=DATE:' + d0, 'DTEND;VALUE=DATE:' + d1, 'SUMMARY:' + icsEsc(summary), 'TRANSP:TRANSPARENT'];
    if (desc) s.push('DESCRIPTION:' + icsEsc(desc));
    if (alarmHours != null) s = s.concat(['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(summary), 'TRIGGER:PT' + alarmHours + 'H', 'END:VALARM']);
    s.push('END:VEVENT');
    ev.push(s.map(fold).join('\r\n'));
  }
  function addWeek(input) {
  const ws = input.weekStart, sh = input.shop || { day: -1, time: '' };
  const names = input.names || ['Roman', 'Partnerin'], flt = input.filter === '0' || input.filter === '1' ? input.filter : 'all';
  const mine = w => flt === 'all' || w === 'b' || w === flt;
  const lab = w => w === 'b' ? 'zusammen' : (flt !== 'all' && w === flt ? 'du' : names[+w] || '?');
  const shopDay = addDays(ws, sh.day), sw = sh.w === '0' || sh.w === '1' ? sh.w : 'b';
  if (mine(sw)) {
    if (sh.time) add('einkauf-' + ws, stamp(shopDay, sh.time), stamp(shopDay, sh.time, 60), 'Einkaufen (' + lab(sw) + ')', input.shopText || '', 60);
    else addAllDay('einkauf-' + ws, shopDay, 'Einkaufen (' + lab(sw) + ')', input.shopText || '', 8);
  }
  input.sessions.forEach(s => {
    const w = s.w === '0' || s.w === '1' ? s.w : 'b';
    if (!mine(w)) return;
    const day = addDays(ws, s.day), tm = s.time || '';
    if (s.thaw && s.thaw.length) {
      const prev = addDays(day, -1);
      add('auftauen-' + s.key + '-' + ws, stamp(prev, '19:00'), stamp(prev, '19:15'), 'Auftauen: ' + s.thaw.join(', '), 'Für morgen: ' + s.dishes.join(' und '), 0);
    }
    const lines = [s.dishes.join(' und '), s.who, ''];
    s.events.forEach(e => lines.push(fmtClock(e.start) + '  ' + e.rs + (e.tn && e.tn !== e.rs ? ' (' + e.tn + ')' : '') + ': ' + e.t));
    const ksum = (s.fresh ? 'Frisch kochen' : 'Vorkochen') + ' (' + lab(w) + '): ' + s.dishes.join(' + ');
    if (tm) add('kochen-' + s.key + '-' + ws, stamp(day, tm), stamp(day, tm, Math.round(s.mk)), ksum, lines.join('\n'), 30);
    else addAllDay('kochen-' + s.key + '-' + ws, day, ksum, lines.join('\n'), 8);
  });
  (input.meals || []).forEach(m => {
    const day = addDays(ws, m.day), l = m.meal === 'l', tm = l ? '12:30' : '19:30';
    add('essen-' + m.day + m.meal + '-' + ws, stamp(day, tm), stamp(day, tm, l ? 30 : 45), (l ? 'Mittag: ' : 'Abend: ') + m.name, m.note || '', null);
  });
  }
  addWeek(input);
  (input.more || []).forEach(addWeek);
  const head = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vorkoch//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEsc(input.calName || 'Vorkoch'), 'X-WR-TIMEZONE:Europe/Berlin', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  return head.join('\r\n') + '\r\n' + VTZ + '\r\n' + ev.join('\r\n') + '\r\nEND:VCALENDAR\r\n';
}

/* ---------- Teilen per Link ---------- */
function b64enc(s) {
  const bytes = typeof TextEncoder !== 'undefined' ? Array.from(new TextEncoder().encode(s)) : Array.from(unescape(encodeURIComponent(s))).map(c => c.charCodeAt(0));
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64dec(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(bytes) : decodeURIComponent(escape(bin));
}
function encodeShare(kind, obj) { return '#' + kind + '=' + b64enc(JSON.stringify(obj)); }
function decodeShare(hash) {
  const m = /^#([js])=([A-Za-z0-9_-]+)$/.exec(hash || '');
  if (!m) return null;
  try { return { kind: m[1], data: JSON.parse(b64dec(m[2])) }; } catch (e) { return null; }
}

/* ---------- Abgleich ----------
   Zustand S hat Zeitstempel in S.mt: m = {plan, pool, settings, offers}, ratings/storeOv/checked = {id: ms}.
   Dokument: Abschnitte mit Zeitstempel, Schlüssel-Maps mit [Wert, Zeit]. Der neuere Abschnitt gewinnt, Maps werden pro Eintrag gemischt. */
const SECTIONS = ['plan', 'pool', 'settings', 'offers', 'bundles'];
function mapTo(vals, times) { const o = {}; Object.keys(vals || {}).forEach(k => { o[k] = [vals[k], (times && times[k]) || 0]; }); return o; }
function toDoc(S) {
  const mt = S.mt || { m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} };
  return {
    v: 2, m: Object.assign({}, mt.m),
    plan: { recent: S.recent || [], history: S.history || [] },
    weeks: mapTo(S.weeks || {}, mt.weeks),
    pool: { disabled: S.disabled },
    settings: { settings: S.settings, diversity: S.diversity, motto: S.motto || '', cal: S.cal || null },
    offers: S.offers || '',
    bundles: { day: Number.isInteger(S.routineDay) ? S.routineDay : 6, list: S.bundles || [] },
    ratings: mapTo(S.ratings, mt.ratings), storeOv: mapTo(S.storeOv, mt.storeOv),
    checked: { key: '', map: mapTo(S.checked.map, mt.checked) }
  };
}
function mergeMap(a, b) {
  const o = {};
  [a || {}, b || {}].forEach(m => Object.keys(m).forEach(k => {
    const x = m[k];
    if (!Array.isArray(x)) return;
    if (!o[k] || ts(x[1]) > ts(o[k][1])) o[k] = x;
  }));
  return o;
}
function merge(a, b) {
  if (!b) return a;
  if (!a) return b;
  const out = { v: 2, m: {} };
  SECTIONS.forEach(sec => {
    const ta = ts(a.m && a.m[sec]), tb = ts(b.m && b.m[sec]);
    const w = ta >= tb ? a : b;
    out.m[sec] = Math.max(ta, tb);
    out[sec] = w[sec];
  });
  // Wochen und Bewertungen werden pro Eintrag gemischt, der neuere Eintrag gewinnt.
  out.weeks = mergeMap(a.weeks, b.weeks);
  out.ratings = mergeMap(a.ratings, b.ratings);
  out.storeOv = mergeMap(a.storeOv, b.storeOv);
  // Haken tragen die Woche im Schlüssel (Datum|Posten), deshalb reicht das Mischen pro Posten.
  out.checked = { key: '', map: mergeMap((a.checked || {}).map, (b.checked || {}).map) };
  return out;
}
function canon(o) {
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
  return JSON.stringify(o === undefined ? null : o);
}
function same(a, b) { return canon(a) === canon(b); }

/* Fremde Daten prüfen und in den Zustand schreiben. known = Menge gültiger Rezept-IDs. Gibt true zurück, wenn etwas übernommen wurde. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REPO_RE = /^[A-Za-z0-9_-]{1,39}\/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/;
// Regex wandeln Nicht-Texte stillschweigend um, deshalb erst den Typ prüfen.
const rx = (re, s) => typeof s === 'string' && re.test(s);
const ts = x => (typeof x === 'number' && isFinite(x) ? x : 0);
function cleanTimes(m) { const o = {}; SECTIONS.forEach(k => { const t = ts(m && m[k]); if (t) o[k] = t; }); return o; }
function cleanWeek(rec, isId) {
  if (!rec || typeof rec !== 'object' || !rec.grid || typeof rec.grid !== 'object') return null;
  const g = {};
  for (const d of ['0', '1', '2', '3', '4', '5', '6']) for (const m of ['l', 'd']) {
    const c = rec.grid[d + m];
    if (!c || typeof c !== 'object' || !rx(/^[pfox]$/, c.t)) return null;
    const o = { t: c.t };
    if ((c.t === 'p' || c.t === 'f') && isId(c.r)) { o.r = c.r; if (c.u) o.u = 1; }
    if (c.t === 'f' && rx(/^[b01]$/, c.w)) o.w = c.w;
    g[d + m] = o;
  }
  const tm = t => /^(\d{1,2}:\d{2})?$/.test(typeof t === 'string' ? t : '');
  if (!Array.isArray(rec.sess) || rec.sess.length < 1 || rec.sess.length > 4 || !rec.sess.every(s => s && Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && tm(s.time))) return null;
  const sa = rec.shopAt;
  if (!sa || !Number.isInteger(sa.day) || sa.day < -1 || sa.day > 6 || !tm(sa.time)) return null;
  const sess = rec.sess.map(s => { const o = { day: s.day, time: typeof s.time === 'string' ? s.time : '' }; if (rx(/^[b01]$/, s.w)) o.w = s.w; return o; });
  const shopAt = { day: sa.day, time: typeof sa.time === 'string' ? sa.time : '' }; if (rx(/^[01]$/, sa.w)) shopAt.w = sa.w;
  return { grid: g, sess, shopAt, key: String(rec.key || '').slice(0, 400), relaxed: !!rec.relaxed };
}
// Haushalt-Runden: nur gültige Einträge übernehmen.
const validBundle = b => !!b && typeof b === 'object' && rx(/^[a-z0-9]{1,30}$/i, b.id) && typeof b.n === 'string' && b.n.length > 0 && typeof b.items === 'string' && Number.isInteger(b.every) && b.every >= 1 && b.every <= 52 && (b.last === '' || rx(DATE_RE, b.last));
function applyDoc(S, doc, known) {
  if (!doc || doc.v !== 2) return false;
  const isId = id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(known, id);
  const num = (x, lo, hi, d) => (typeof x === 'number' && isFinite(x)) ? Math.min(hi, Math.max(lo, x)) : d;
  if (!S.mt) S.mt = { m: {}, ratings: {}, storeOv: {}, checked: {}, weeks: {} };
  S.mt.m = cleanTimes(doc.m);
  const p = doc.plan;
  if (p) {
    S.recent = Array.isArray(p.recent) ? p.recent.filter(x => typeof x === 'string' && x.length <= 400).slice(0, 6) : (S.recent || []);
    S.history = Array.isArray(p.history) ? p.history.filter(h => Array.isArray(h) && h.every(isId)).slice(0, 3) : (S.history || []);
  }
  if (doc.weeks && typeof doc.weeks === 'object') {
    S.weeks = {}; S.mt.weeks = {};
    Object.keys(doc.weeks).forEach(ws => {
      const e = doc.weeks[ws];
      if (!DATE_RE.test(ws) || !Array.isArray(e)) return;
      const r = cleanWeek(e[0], isId);
      if (r) { S.weeks[ws] = r; S.mt.weeks[ws] = ts(e[1]); }
    });
  }
  if (doc.pool && Array.isArray(doc.pool.disabled)) S.disabled = doc.pool.disabled.filter(isId);
  const st = doc.settings && doc.settings.settings;
  if (st && Array.isArray(st.persons) && st.persons.length === 2) {
    S.settings.persons = st.persons.map((x, i) => ({ name: String((x && x.name) || (i ? 'Partnerin' : 'Roman')).slice(0, 30), protein: num(x && x.protein, 40, 220, 90) }));
    S.settings.share = num(st.share, 0.5, 0.9, S.settings.share);
    S.settings.vegMin = num(st.vegMin, 0, 5, S.settings.vegMin);
    S.settings.fishMax = num(st.fishMax, 0, 5, S.settings.fishMax);
    S.settings.moCook = st.moCook === 1 ? 1 : 0;
  }
  if (doc.settings) {
    const mo = doc.settings.motto; S.motto = typeof mo === 'string' && /^[A-Za-zÄÖÜäöüß -]{0,20}$/.test(mo) ? mo : '';
    const cl = doc.settings.cal;
    S.cal = cl && rx(REPO_RE, cl.repo) && rx(/^[a-z0-9]{10,24}$/, cl.secret) ? { repo: cl.repo, secret: cl.secret } : (S.cal || null);
  }
  if (doc.settings && doc.settings.diversity != null) S.diversity = num(doc.settings.diversity, 0, 1, S.diversity);
  if (typeof doc.offers === 'string') S.offers = doc.offers.slice(0, 600);
  const bl = doc.bundles && (Array.isArray(doc.bundles) ? doc.bundles : doc.bundles.list);
  if (Array.isArray(bl)) S.bundles = bl.filter(validBundle).slice(0, 50).map(b => ({ id: b.id, n: b.n.slice(0, 30), items: b.items.slice(0, 200), every: b.every, last: b.last }));
  if (doc.bundles && Number.isInteger(doc.bundles.day) && doc.bundles.day >= 0 && doc.bundles.day <= 6) S.routineDay = doc.bundles.day;
  S.ratings = {}; S.mt.ratings = {};
  Object.keys(doc.ratings || {}).forEach(k => { const x = doc.ratings[k]; if (isId(k) && Array.isArray(x) && (x[0] === 1 || x[0] === -1 || x[0] === 0)) { S.ratings[k] = x[0]; S.mt.ratings[k] = ts(x[1]); } });
  S.storeOv = {}; S.mt.storeOv = {};
  Object.keys(doc.storeOv || {}).forEach(k => { const x = doc.storeOv[k]; if (/^[a-z_0-9]{1,30}$/.test(k) && Array.isArray(x) && (x[0] === 'd' || x[0] === 'm')) { S.storeOv[k] = x[0]; S.mt.storeOv[k] = ts(x[1]); } });
  const c = doc.checked;
  S.checked = { key: '', map: {} }; S.mt.checked = {};
  if (c) {
    Object.keys(c.map || {}).forEach(k => { const x = c.map[k]; if (/^\d{4}-\d{2}-\d{2}\|(v_)?[a-z_0-9]{1,30}$/.test(k) && Array.isArray(x)) { S.checked.map[k] = !!x[0]; S.mt.checked[k] = ts(x[1]); } });
  }
  return true;
}

/* Firebase löscht leere Arrays und leere Objekte. Deshalb gehen Pläne, Pool und Einstellungen als Text über die Leitung. */
function pack(doc) {
  const w = Object.assign({}, doc);
  ['plan', 'pool', 'settings', 'bundles'].forEach(k => { w[k] = JSON.stringify(doc[k] === undefined ? null : doc[k]); });
  w.weeks = {};
  Object.keys(doc.weeks || {}).forEach(ws => { const e = doc.weeks[ws]; if (Array.isArray(e)) w.weeks[ws] = [JSON.stringify(e[0]), e[1] || 0]; });
  return w;
}
// Alte Dokumente (Fassung 1, nur eine Woche) werden beim Lesen in die neue Form gebracht.
function upgrade1(d) {
  const p = d.plan || {}, ws = DATE_RE.test(p.weekStart || '') ? p.weekStart : '', t = (d.m && d.m.plan) || 0;
  d.weeks = {};
  if (ws && p.grid) d.weeks[ws] = [{ grid: p.grid, sess: p.sess, shopAt: p.shopAt, key: p.key || '', relaxed: !!p.relaxed }, t];
  d.plan = { recent: Array.isArray(p.recent) ? p.recent : [], history: Array.isArray(p.history) ? p.history : [] };
  const map = {};
  Object.keys(d.checked.map || {}).forEach(k => { if (ws) map[ws + '|' + k] = d.checked.map[k]; });
  d.checked = { key: '', map };
  d.v = 2;
}
function unpack(w) {
  if (!w || typeof w !== 'object' || (w.v !== 1 && w.v !== 2)) return null;
  const d = Object.assign({}, w);
  try { ['plan', 'pool', 'settings', 'bundles'].forEach(k => { d[k] = typeof w[k] === 'string' ? JSON.parse(w[k]) : w[k]; }); } catch (e) { return null; }
  d.m = d.m && typeof d.m === 'object' ? d.m : {};
  d.ratings = d.ratings || {}; d.storeOv = d.storeOv || {};
  d.checked = d.checked && typeof d.checked === 'object' ? { key: String(d.checked.key || ''), map: d.checked.map || {} } : { key: '', map: {} };
  if (typeof d.offers !== 'string') d.offers = '';
  if (w.v === 1) upgrade1(d);
  else {
    d.weeks = {};
    Object.keys(w.weeks || {}).forEach(ws => { const e = w.weeks[ws]; if (Array.isArray(e) && typeof e[0] === 'string') { try { d.weeks[ws] = [JSON.parse(e[0]), e[1] || 0]; } catch (err) { /* Woche überspringen */ } } });
  }
  return d;
}

/* Wochenliste für die Haushalts-App: nur was noch nicht abgehakt ist. s: d = Aldi/Lidl, m = Marktkauf. */
function shopDoc(items, shop, isDone, storeOf) {
  return { shop, items: items.filter(x => !isDone(x)).map(x => ({ id: x.id, n: x.n, q: x.txt, s: storeOf(x), a: x.a })) };
}
root.VX = { shopDoc, b64dec, b64std: s => { const by = Array.from(new TextEncoder().encode(s)); let bin = ''; by.forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); }, buildICS, encodeShare, decodeShare, toDoc, merge, same, applyDoc, canon, pack, unpack, REPO_RE };
if (typeof module !== 'undefined') module.exports = root.VX;
})(typeof window !== 'undefined' ? window : globalThis);
