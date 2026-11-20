/* Dealline – Deals festhalten, unterschreiben, teilen, als PDF/PNG speichern.
   Läuft komplett im Browser, ohne Server und ohne fremde Bibliotheken:
   - Dokument: eigener Canvas-Satz (A4, mehrseitig), daraus PNG und PDF (eigener kleiner PDF-Schreiber, Seiten als JPEG).
   - Link: Deal als JSON, mit deflate-raw komprimiert, base64url im Hash (#d=…).
   - Speicher: localStorage („Meine Deals“), dazu Import/Export als .json. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ============================================================ Texte */
const STR = {
  de: {
    tabEdit: 'Deal', tabDoc: 'Dokument', tabList: 'Meine Deals', allApps: 'Alle Apps von mert.win',
    langTitle: 'Switch to English', langBtn: 'EN',
    tpl: 'Vorlagen', tplHint: 'Eine Vorlage füllt einen leeren Deal – sonst wird daraus ein neuer Deal.',
    secDeal: 'Deal', fTitle: 'Titel', phTitle: 'z. B. Wette um das Derby', fAbout: 'Worum es geht',
    phAbout: 'Beschreibe kurz, was ihr vereinbart.', fDate: 'Datum', fPlace: 'Ort', optional: 'optional',
    fTerm: 'Laufzeit', fStart: 'Beginn', fEnd: 'Ende', fStake: 'Einsatz / Gegenleistung',
    phStake: 'optional – z. B. eine Pizza oder 20 € Pfand',
    secDeadlines: 'Fristen', phDeadline: 'Was ist bis dahin fällig?', addDeadline: 'Frist hinzufügen',
    secMembers: 'Mitglieder', phName: 'Name', phRole: 'Rolle (optional)', tasks: 'Was macht diese Person?',
    phTask: 'Aufgabe oder Pflicht', addTask: 'Aufgabe', addMember: 'Mitglied hinzufügen', avatarLbl: 'Kürzel oder Emoji',
    colorLbl: 'Farbe und Kürzel', removeMember: 'Mitglied entfernen', memberN: 'Mitglied {n}',
    secRules: 'Regeln', phRule: 'Regel', forAll: 'Für alle', forSome: 'Nur für …', pickMembers: 'Wähle mindestens ein Mitglied.',
    phPenalty: 'Bei Bruch (optional) – z. B. gibt eine Runde aus', addRule: 'Regel hinzufügen', noRules: 'Noch keine Regeln.',
    up: 'Nach oben', down: 'Nach unten', removeRule: 'Regel entfernen', remove: 'Entfernen',
    secMore: 'Erweitert', docLang: 'Sprache des Dokuments', clearSigs: 'Alle Unterschriften entfernen', delDeal: 'Deal löschen', dupDeal: 'Duplizieren',
    secSigs: 'Unterschriften', sign: 'Unterschreiben', signAgain: 'Neu', signedAt: 'Unterschrieben am {d}', notSigned: 'Noch offen',
    staleSig: 'Vor einer Änderung unterschrieben – bitte neu unterschreiben', needName: 'Trag zuerst einen Namen ein.',
    signTitle: 'Unterschrift: {n}', draw: 'Zeichnen', type: 'Tippen', clear: 'Löschen', padHint: 'Hier mit Maus oder Finger unterschreiben',
    typeLbl: 'Name zum Unterschreiben', signNote: 'Mit dem Unterschreiben stimmst du dem Deal in der jetzigen Form zu. Datum: {d}',
    cancel: 'Abbrechen', close: 'Schließen', padEmpty: 'Noch keine Unterschrift gezeichnet.', typeEmpty: 'Tipp deinen Namen ein.',
    pdf: 'PDF', png: 'Bild (PNG)', share: 'Link teilen', json: 'Als Datei (.json)', print: 'Drucken', making: 'Wird erstellt …', failed: 'Das hat nicht geklappt.',
    shareTitle: 'Deal als Link', shareText: 'Der ganze Deal steckt im Link – nichts liegt auf einem Server. Wer ihn öffnet, kann unterschreiben und einen neuen Link zurückschicken.',
    copy: 'Kopieren', copied: 'Link kopiert', shareSys: 'Teilen …', linkLong: 'Der Link ist lang ({n} Zeichen). Manche Messenger kürzen sehr lange Links – dann lieber die .json-Datei schicken.',
    recvTitle: 'Deal über einen Link geöffnet', recvText: 'Er ist jetzt unter „Meine Deals“ gespeichert. Unterschreibe und schick den Link zurück.',
    recvMerged: 'Er war schon gespeichert – {n} neue Unterschrift(en) wurden übernommen.', toSign: 'Zum Unterschreiben', badLink: 'Der Link ist kaputt oder unvollständig.',
    listTitle: 'Meine Deals', newDeal: 'Neuer Deal', openFile: 'Datei öffnen', exportAll: 'Alle als Datei', listEmpty: 'Noch keine Deals gespeichert.',
    listNote: 'Gespeichert nur in diesem Browser. Für ein Backup: „Alle als Datei“.', del: 'Löschen', confirmDel: '„{t}“ wirklich löschen?',
    untitled: 'Ohne Titel', nMembers: '{n} Mitglieder', nSigned: '{a} von {b} unterschrieben', changed: 'geändert {d}', current: 'offen',
    imported: '{n} Deal(s) geöffnet', badFile: 'Die Datei ist kein Dealline-Deal.', saved: 'Gespeichert', notSaved: 'Speicher voll – nicht gespeichert',
    fromTpl: 'Neuer Deal aus der Vorlage', yes: 'Ja', no: 'Nein', confirmClear: 'Alle Unterschriften entfernen?', dupDone: 'Kopie angelegt',
    legal: 'Dealline hält Absprachen fest und ersetzt keinen rechtlich geprüften Vertrag. Der Prüfcode zeigt Änderungen an, ist aber nicht fälschungssicher.',
    pages1: '1 Seite', pagesN: '{n} Seiten',
    tpl_bet: 'Wette', tpl_project: 'Gruppenprojekt', tpl_flat: 'WG-Regeln', tpl_game: 'Spiel- / Turnierregeln', tpl_lend: 'Verleih', tpl_blank: 'Leer',
    // Dokument
    d_about: 'Worum es geht', d_stake: 'Einsatz / Gegenleistung', d_deadlines: 'Fristen', d_members: 'Mitglieder und Aufgaben',
    d_rules: 'Regeln', d_sigs: 'Unterschriften', d_date: 'Datum', d_place: 'Ort', d_term: 'Laufzeit', d_from: 'ab {d}', d_until: 'bis {d}',
    d_noTasks: 'Keine Aufgaben eingetragen', d_forAll: 'Gilt für alle', d_forSome: 'Gilt für', d_nobody: 'niemanden ausgewählt', d_penalty: 'Bei Bruch: ',
    d_signedAt: 'Unterschrieben am {d}', d_typed: 'getippt', d_open: 'Noch nicht unterschrieben', d_stale: 'Vor einer Änderung am Deal unterschrieben',
    d_page: 'Seite {a} von {b}', d_code: 'Prüfcode {c}', d_status: '{a} von {b} unterschrieben', d_untitled: 'Ohne Titel', d_member: 'Mitglied {n}',
    d_noDate: 'ohne Datum'
  },
  en: {
    tabEdit: 'Deal', tabDoc: 'Document', tabList: 'My deals', allApps: 'All apps by mert.win',
    langTitle: 'Auf Deutsch umschalten', langBtn: 'DE',
    tpl: 'Templates', tplHint: 'A template fills an empty deal – otherwise it starts a new one.',
    secDeal: 'Deal', fTitle: 'Title', phTitle: 'e.g. Bet on the derby', fAbout: 'What it is about',
    phAbout: 'Briefly describe what you agree on.', fDate: 'Date', fPlace: 'Place', optional: 'optional',
    fTerm: 'Term', fStart: 'Start', fEnd: 'End', fStake: 'Stake / in return',
    phStake: 'optional – e.g. a pizza or a €20 deposit',
    secDeadlines: 'Deadlines', phDeadline: 'What is due by then?', addDeadline: 'Add deadline',
    secMembers: 'Members', phName: 'Name', phRole: 'Role (optional)', tasks: 'What does this person do?',
    phTask: 'Task or duty', addTask: 'Task', addMember: 'Add member', avatarLbl: 'Initials or emoji',
    colorLbl: 'Colour and initials', removeMember: 'Remove member', memberN: 'Member {n}',
    secRules: 'Rules', phRule: 'Rule', forAll: 'Everyone', forSome: 'Only for …', pickMembers: 'Pick at least one member.',
    phPenalty: 'If broken (optional) – e.g. buys a round', addRule: 'Add rule', noRules: 'No rules yet.',
    up: 'Move up', down: 'Move down', removeRule: 'Remove rule', remove: 'Remove',
    secMore: 'More', docLang: 'Document language', clearSigs: 'Remove all signatures', delDeal: 'Delete deal', dupDeal: 'Duplicate',
    secSigs: 'Signatures', sign: 'Sign', signAgain: 'Redo', signedAt: 'Signed on {d}', notSigned: 'Pending',
    staleSig: 'Signed before a change – please sign again', needName: 'Enter a name first.',
    signTitle: 'Signature: {n}', draw: 'Draw', type: 'Type', clear: 'Clear', padHint: 'Sign here with mouse or finger',
    typeLbl: 'Name to sign with', signNote: 'By signing you agree to the deal as it is now. Date: {d}',
    cancel: 'Cancel', close: 'Close', padEmpty: 'Nothing drawn yet.', typeEmpty: 'Type your name.',
    pdf: 'PDF', png: 'Image (PNG)', share: 'Share link', json: 'As file (.json)', print: 'Print', making: 'Creating …', failed: 'That did not work.',
    shareTitle: 'Deal as a link', shareText: 'The whole deal is inside the link – nothing is stored on a server. Whoever opens it can sign and send a new link back.',
    copy: 'Copy', copied: 'Link copied', shareSys: 'Share …', linkLong: 'The link is long ({n} characters). Some messengers cut very long links – send the .json file instead.',
    recvTitle: 'Deal opened from a link', recvText: 'It is now saved under “My deals”. Sign it and send the link back.',
    recvMerged: 'It was already saved – {n} new signature(s) were added.', toSign: 'Go to signing', badLink: 'The link is broken or incomplete.',
    listTitle: 'My deals', newDeal: 'New deal', openFile: 'Open file', exportAll: 'All as file', listEmpty: 'No deals saved yet.',
    listNote: 'Saved in this browser only. For a backup: “All as file”.', del: 'Delete', confirmDel: 'Really delete “{t}”?',
    untitled: 'Untitled', nMembers: '{n} members', nSigned: '{a} of {b} signed', changed: 'changed {d}', current: 'open',
    imported: '{n} deal(s) opened', badFile: 'This file is not a Dealline deal.', saved: 'Saved', notSaved: 'Storage full – not saved',
    fromTpl: 'New deal from template', yes: 'Yes', no: 'No', confirmClear: 'Remove all signatures?', dupDone: 'Copy created',
    legal: 'Dealline records agreements and is no substitute for a legally reviewed contract. The check code reveals changes but is not tamper-proof.',
    pages1: '1 page', pagesN: '{n} pages',
    tpl_bet: 'Bet', tpl_project: 'Group project', tpl_flat: 'Flat rules', tpl_game: 'Game / tournament', tpl_lend: 'Lending', tpl_blank: 'Blank',
    d_about: 'What it is about', d_stake: 'Stake / in return', d_deadlines: 'Deadlines', d_members: 'Members and tasks',
    d_rules: 'Rules', d_sigs: 'Signatures', d_date: 'Date', d_place: 'Place', d_term: 'Term', d_from: 'from {d}', d_until: 'until {d}',
    d_noTasks: 'No tasks entered', d_forAll: 'Applies to everyone', d_forSome: 'Applies to', d_nobody: 'nobody selected', d_penalty: 'If broken: ',
    d_signedAt: 'Signed on {d}', d_typed: 'typed', d_open: 'Not signed yet', d_stale: 'Signed before the deal was changed',
    d_page: 'Page {a} of {b}', d_code: 'Check code {c}', d_status: '{a} of {b} signed', d_untitled: 'Untitled', d_member: 'Member {n}',
    d_noDate: 'no date'
  }
};
const LANGS = ['de', 'en'];
let lang = (() => {
  try { const s = localStorage.getItem('dealline.lang'); if (LANGS.includes(s)) return s; } catch {}
  return /^de\b/i.test(navigator.language || 'de') ? 'de' : 'en';
})();
function tr(L, k, v) {
  let s = (STR[L] && STR[L][k]) ?? STR.de[k] ?? k;
  if (v) s = s.replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
  return s;
}
const t = (k, v) => tr(lang, k, v);

/* ============================================================ Hilfen */
const PALETTE = ['#3f6fd8', '#7b55d0', '#c23d78', '#1d8a87', '#c0392b', '#3f8a4a', '#5b6573', '#8a4b9a'];
const ALPHA = 'abcdefghijkmnpqrstuvwxyz23456789';
function uid(n = 8) {
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  return [...a].map(b => ALPHA[b % 32]).join('');
}
const pad2 = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => isoDate(new Date());
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
const isISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
function fmtDate(s, L) {
  if (!isISO(s)) return '';
  const [y, m, d] = s.split('-').map(Number);
  return new Intl.DateTimeFormat(L === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(y, m - 1, d));
}
function fmtDateTime(ms, L) {
  return new Intl.DateTimeFormat(L === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
}
const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const slug = s => (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'deal';
function initials(m, i, L) {
  if (m.avatar) return m.avatar;
  const parts = (m.name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return String(i + 1);
  return ([...parts[0]][0] + (parts.length > 1 ? [...parts[parts.length - 1]][0] : '')).toUpperCase();
}
const memberName = (m, i, L) => (m.name || '').trim() || tr(L, 'd_member', { n: i + 1 });

/* ============================================================ Datenmodell */
function newMember(i, data = {}) {
  return { id: uid(6), name: '', role: '', color: PALETTE[i % PALETTE.length], avatar: '', tasks: [], ...data };
}
function newDeal(L = lang) {
  const now = Date.now();
  return { v: 1, id: uid(10), lang: L, title: '', about: '', date: today(), place: '', start: '', end: '', stake: '',
    deadlines: [], members: [newMember(0), newMember(1)], rules: [], sigs: {}, created: now, updated: now };
}
/* Nimmt alles, was von außen kommt (Link, Datei, Speicher), und macht daraus einen sauberen Deal – oder null. */
function normalize(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  if (!Array.isArray(o.members) && typeof o.title !== 'string') return null;
  const d = newDeal(LANGS.includes(o.lang) ? o.lang : lang);
  d.id = typeof o.id === 'string' && /^[a-z0-9]{4,24}$/.test(o.id) ? o.id : uid(10);
  d.title = str(o.title, 200); d.about = str(o.about, 5000); d.place = str(o.place, 120); d.stake = str(o.stake, 2000);
  d.date = isISO(o.date) ? o.date : ''; d.start = isISO(o.start) ? o.start : ''; d.end = isISO(o.end) ? o.end : '';
  d.created = Number.isFinite(o.created) ? o.created : Date.now();
  d.updated = Number.isFinite(o.updated) ? o.updated : d.created;
  d.deadlines = (Array.isArray(o.deadlines) ? o.deadlines : []).slice(0, 50)
    .map(x => ({ date: isISO(x && x.date) ? x.date : '', label: str(x && x.label, 300) }));
  const ids = new Set();
  d.members = (Array.isArray(o.members) ? o.members : []).slice(0, 50).map((m, i) => {
    m = m && typeof m === 'object' ? m : {};
    let id = typeof m.id === 'string' && /^[a-z0-9]{2,16}$/.test(m.id) && !ids.has(m.id) ? m.id : uid(6);
    ids.add(id);
    return { id, name: str(m.name, 80), role: str(m.role, 80),
      color: /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : PALETTE[i % PALETTE.length],
      avatar: str(m.avatar, 4), tasks: (Array.isArray(m.tasks) ? m.tasks : []).slice(0, 50).map(x => str(x, 500)) };
  });
  d.rules = (Array.isArray(o.rules) ? o.rules : []).slice(0, 200).map(r => {
    r = r && typeof r === 'object' ? r : {};
    const who = Array.isArray(r.who) ? r.who.filter(id => ids.has(id)) : 'all';
    return { id: typeof r.id === 'string' && /^[a-z0-9]{2,16}$/.test(r.id) ? r.id : uid(6), text: str(r.text, 2000), who, penalty: str(r.penalty, 500) };
  });
  d.sigs = {};
  if (o.sigs && typeof o.sigs === 'object') {
    for (const [mid, s] of Object.entries(o.sigs)) {
      if (!ids.has(mid) || !s || typeof s !== 'object') continue;
      const at = Number.isFinite(s.at) ? s.at : 0;
      const h = typeof s.h === 'string' ? s.h.slice(0, 32) : '';
      if (s.type === 'draw' && typeof s.s === 'string' && /^[A-Za-z0-9+/=]{4,40000}$/.test(s.s)) d.sigs[mid] = { type: 'draw', s: s.s, at, h };
      else if (s.type === 'type' && typeof s.text === 'string' && s.text.trim()) d.sigs[mid] = { type: 'type', text: str(s.text, 60), at, h };
    }
  }
  return d;
}

/* Prüfcode: Fingerabdruck des Inhalts (ohne Unterschriften und Farben). Zwei FNV-1a-Läufe = 64 Bit. */
function contentKey(d) {
  return JSON.stringify([d.title, d.about, d.date, d.place, d.start, d.end, d.stake,
    d.deadlines.map(x => [x.date, x.label]), d.members.map(m => [m.id, m.name, m.role, m.tasks]),
    d.rules.map(r => [r.text, r.who, r.penalty])]);
}
function fnv(s, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function contentHash(d) {
  const s = contentKey(d);
  return fnv(s, 2166136261).toString(16).padStart(8, '0') + fnv(s, 0x9747b28c).toString(16).padStart(8, '0');
}
const checkCode = h => (h.slice(0, 4) + '-' + h.slice(4, 8)).toUpperCase();
function sigState(d, m, hash = contentHash(d)) {
  const s = d.sigs[m.id];
  if (!s) return 'open';
  return s.h === hash ? 'ok' : 'stale';
}
const signedCount = d => { const h = contentHash(d); return d.members.filter(m => sigState(d, m, h) === 'ok').length; };

/* Zwei Stände desselben Deals zusammenführen: neuerer Inhalt gewinnt, Unterschriften werden vereinigt. */
function mergeDeals(local, inc) {
  if (!local) return { deal: inc, added: Object.keys(inc.sigs).length };
  const base = JSON.parse(JSON.stringify((inc.updated || 0) > (local.updated || 0) ? inc : local));
  const ids = new Set(base.members.map(m => m.id));
  let added = 0; const sigs = {};
  for (const mid of new Set([...Object.keys(local.sigs), ...Object.keys(inc.sigs)])) {
    if (!ids.has(mid)) continue;
    const a = local.sigs[mid], b = inc.sigs[mid];
    const pick = !a ? b : !b ? a : (b.at > a.at ? b : a);
    if (b && pick === b && (!a || a.at !== b.at)) added++;
    sigs[mid] = pick;
  }
  base.sigs = sigs;
  base.updated = Math.max(local.updated || 0, inc.updated || 0);
  return { deal: base, added };
}

/* ============================================================ Link: komprimiert im Hash */
const b64u = {
  enc(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
};
const bytesToB64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const b64ToBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function pipeBytes(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
/* leere Felder weglassen – der Link wird kürzer, normalize() füllt sie wieder auf */
function strip(v) {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const y = strip(x);
      if (y === '' || y == null || (Array.isArray(y) && !y.length) || (typeof y === 'object' && !Array.isArray(y) && !Object.keys(y).length)) continue;
      o[k] = y;
    }
    return o;
  }
  return v;
}
async function encodeDeal(d) {
  const bytes = new TextEncoder().encode(JSON.stringify(strip(d)));
  if (typeof CompressionStream === 'function') {
    try { return '1' + b64u.enc(await pipeBytes(bytes, new CompressionStream('deflate-raw'))); } catch {}
  }
  return '0' + b64u.enc(bytes);
}
async function decodeDeal(code) {
  code = String(code || '').trim();
  const kind = code[0];
  let bytes = b64u.dec(code.slice(1));
  if (kind === '1') bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== '0') throw new Error('format');
  const d = normalize(JSON.parse(new TextDecoder().decode(bytes)));
  if (!d) throw new Error('content');
  return d;
}
function shareBase() {
  if (/^https?:$/.test(location.protocol)) return location.href.split('#')[0].split('?')[0];
  return 'https://mert.win/deal/';
}
async function dealLink(d) { return shareBase() + '#d=' + await encodeDeal(d); }

/* ============================================================ Unterschrift: Striche kompakt kodieren
   Raum 600×200. Je Abschnitt: x (2 Byte), y (2 Byte), Anzahl n (1 Byte), dann n Schritte (dx, dy als int8). */
const PAD_W = 600, PAD_H = 200;
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (dist > max) { max = dist; idx = i; }
    }
    if (max > eps && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function encStrokes(strokes) {
  const out = [];
  for (const raw of strokes) {
    if (!raw.length) continue;
    const s = simplify(raw, 0.7).map(([x, y]) => [Math.max(0, Math.min(PAD_W, Math.round(x))), Math.max(0, Math.min(PAD_H, Math.round(y)))]);
    const pts = [s[0]];
    for (let i = 1; i < s.length; i++) {
      const [px, py] = pts[pts.length - 1], [x, y] = s[i];
      const steps = Math.ceil(Math.max(Math.abs(x - px), Math.abs(y - py)) / 127) || 1;
      for (let k = 1; k <= steps; k++) pts.push([Math.round(px + (x - px) * k / steps), Math.round(py + (y - py) * k / steps)]);
    }
    let i = 0;
    do {
      const n = Math.min(255, pts.length - 1 - i), [x0, y0] = pts[i];
      out.push(x0 >> 8, x0 & 255, y0 >> 8, y0 & 255, n);
      for (let k = 1; k <= n; k++) out.push((pts[i + k][0] - pts[i + k - 1][0]) & 255, (pts[i + k][1] - pts[i + k - 1][1]) & 255);
      i += n;
    } while (i < pts.length - 1);
  }
  return bytesToB64(new Uint8Array(out));
}
function decStrokes(b64) {
  let b; try { b = b64ToBytes(b64); } catch { return []; }
  const strokes = []; let i = 0;
  while (i + 5 <= b.length) {
    let x = (b[i] << 8) | b[i + 1], y = (b[i + 2] << 8) | b[i + 3]; const n = b[i + 4]; i += 5;
    const st = [[x, y]];
    for (let k = 0; k < n && i + 1 < b.length; k++) { x += (b[i] << 24) >> 24; y += (b[i + 1] << 24) >> 24; i += 2; st.push([x, y]); }
    strokes.push(st);
  }
  return strokes;
}
const CURSIVE = '"Segoe Script", "Bradley Hand", "Brush Script MT", "Snell Roundhand", "Apple Chancery", "URW Chancery L", "Z003", cursive';
function drawStrokes(ctx, strokes, x, y, w, h, color) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const st of strokes) for (const [px, py] of st) { minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py); }
  if (!Number.isFinite(minX)) return;
  const bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
  const sc = Math.min(w / bw, h / bh, (w / PAD_W) * 1.6);
  const ox = x + 4 - minX * sc, oy = y + (h - bh * sc) - minY * sc;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.2, Math.min(3, 3.2 * sc));
  for (const st of strokes) {
    const p = st.map(([px, py]) => [ox + px * sc, oy + py * sc]);
    ctx.beginPath();
    if (p.length === 1) { ctx.arc(p[0][0], p[0][1], ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    ctx.stroke();
  }
  ctx.restore();
}
function drawTyped(ctx, text, x, y, w, h, color) {
  ctx.save();
  let size = Math.min(40, h * 0.8);
  ctx.font = `italic 400 ${size}px ${CURSIVE}`;
  while (size > 12 && ctx.measureText(text).width > w - 8) { size -= 2; ctx.font = `italic 400 ${size}px ${CURSIVE}`; }
  ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x + 4, y + h - 6);
  ctx.restore();
}

/* ============================================================ Dokument-Satz (Canvas, A4) */
const DOC = { W: 794, H: 1123, M: 66, TOP: 82, BOTTOM: 78 };
const DOCFONT = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
const C = { text: '#1c1e23', muted: '#575d67', faint: '#8b9099', rule: '#dde0e6', acc: '#2f55c8', ink: '#1a2b5c', warn: '#b3261e', chip: '#f0f2f6' };
const F = (w, s, style = '') => `${style} ${w} ${s}px ${DOCFONT}`.trim();
const LOGO_PATHS = ['M4 14.5c1.6-4.6 3.3-6.9 4.4-6.1 1.3 1-1.6 6.1-.3 6.7 1.4.6 2.7-4.3 4.2-4 1.3.2.2 3.4 1.6 3.6 1.1.2 2.4-1.9 3.6-2.7', 'M4 19h16'];
let measureCtx = null;
const mctx = () => measureCtx || (measureCtx = document.createElement('canvas').getContext('2d'));

function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).replace(/\r/g, '').split('\n')) {
    const words = para.split(/ +/);
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxW) { line = test; continue; }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxW) { line = word; continue; }
      let piece = '';
      for (const ch of word) {
        if (ctx.measureText(piece + ch).width > maxW && piece) { lines.push(piece); piece = ch; } else piece += ch;
      }
      line = piece;
    }
    lines.push(line);
  }
  return lines;
}
function ellipsize(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}
function setSpacing(ctx, v) { if ('letterSpacing' in ctx) ctx.letterSpacing = v; }

/* Zeilen bauen: jede Zeile hat eine Höhe h und zeichnet sich selbst. keep = mit der nächsten zusammenhalten. */
function buildRows(d) {
  const L = d.lang, T = (k, v) => tr(L, k, v), m = mctx();
  const CW = DOC.W - 2 * DOC.M, rows = [];
  const space = h => rows.push({ h, space: true, draw() {} });
  const textRows = (text, font, color, lh, indent = 0, keepAll = false) => {
    m.font = font;
    const lines = wrap(m, text, CW - indent);
    lines.forEach((line, i) => rows.push({ h: lh, keep: keepAll || i < lines.length - 1 && lines.length <= 4,
      draw(c, x, y) { c.font = font; c.fillStyle = color; c.textBaseline = 'middle'; c.fillText(line, x + indent, y + lh / 2); } }));
    return lines.length;
  };
  const heading = (label) => {
    space(18);
    rows.push({ h: 32, keep: true, draw(c, x, y) {
      c.font = F(700, 11.5); c.fillStyle = C.acc; c.textBaseline = 'middle'; setSpacing(c, '1px');
      c.fillText(label.toUpperCase(), x, y + 12); setSpacing(c, '0px');
      c.fillStyle = C.rule; c.fillRect(x, y + 25, CW, 1);
    } });
  };
  const hash = contentHash(d);

  // Titel und Eckdaten
  textRows(d.title.trim() || T('d_untitled'), F(600, 26), C.text, 34, 0, true);
  const meta = [];
  meta.push(T('d_date') + ' ' + (fmtDate(d.date, L) || T('d_noDate')));
  if (d.place.trim()) meta.push(T('d_place') + ' ' + d.place.trim());
  const s = fmtDate(d.start, L), e = fmtDate(d.end, L);
  if (s || e) meta.push(T('d_term') + ' ' + (s && e ? `${s} – ${e}` : s ? T('d_from', { d: s }) : T('d_until', { d: e })));
  if (d.members.length) meta.push(T('d_status', { a: signedCount(d), b: d.members.length }));
  space(4);
  textRows(meta.join('   ·   '), F(400, 13), C.muted, 20);

  if (d.about.trim()) { heading(T('d_about')); textRows(d.about.trim(), F(400, 14.5), C.text, 22); }
  if (d.stake.trim()) { heading(T('d_stake')); textRows(d.stake.trim(), F(400, 14.5), C.text, 22); }

  const dls = d.deadlines.filter(x => x.date || x.label.trim());
  if (dls.length) {
    heading(T('d_deadlines'));
    for (const x of dls) {
      m.font = F(400, 14.5);
      const lines = wrap(m, x.label.trim() || '–', CW - 120);
      lines.forEach((line, i) => rows.push({ h: 22, keep: i < lines.length - 1, draw(c, X, Y) {
        c.textBaseline = 'middle';
        if (i === 0) { c.font = F(600, 14); c.fillStyle = C.text; c.fillText(fmtDate(x.date, L) || '–', X, Y + 11); }
        c.font = F(400, 14.5); c.fillStyle = C.text; c.fillText(line, X + 120, Y + 11);
      } }));
      space(4);
    }
  }

  if (d.members.length) {
    heading(T('d_members'));
    d.members.forEach((mb, i) => {
      const name = memberName(mb, i, L), av = initials(mb, i, L), tasks = mb.tasks.filter(x => x.trim());
      rows.push({ h: 40, keep: true, draw(c, x, y) {
        c.fillStyle = mb.color; c.beginPath(); c.arc(x + 15, y + 20, 15, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.font = F(600, [...av].length > 2 ? 10 : 12.5); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(av, x + 15, y + 21); c.textAlign = 'left';
        c.font = F(600, 15); c.fillStyle = C.text; const nm = ellipsize(c, name, CW - 44); c.fillText(nm, x + 42, y + 20);
        if (mb.role.trim()) {
          const nw = c.measureText(nm).width; c.font = F(400, 13); c.fillStyle = C.muted;
          c.fillText(ellipsize(c, '·  ' + mb.role.trim(), CW - 56 - nw), x + 52 + nw, y + 20);
        }
      } });
      if (!tasks.length) {
        rows.push({ h: 21, draw(c, x, y) { c.font = F(400, 13, 'italic'); c.fillStyle = C.faint; c.textBaseline = 'middle'; c.fillText(T('d_noTasks'), x + 42, y + 10); } });
      }
      tasks.forEach((task, ti) => {
        m.font = F(400, 14);
        const lines = wrap(m, task.trim(), CW - 58);
        lines.forEach((line, li) => rows.push({ h: 21, keep: li < lines.length - 1, draw(c, x, y) {
          c.textBaseline = 'middle';
          if (li === 0) { c.fillStyle = mb.color; c.fillRect(x + 44, y + 9.5, 6, 2); }
          c.font = F(400, 14); c.fillStyle = C.text; c.fillText(line, x + 58, y + 10.5);
        } }));
      });
      space(10);
    });
  }

  const rules = d.rules.filter(r => r.text.trim() || r.penalty.trim());
  if (rules.length) {
    heading(T('d_rules'));
    rules.forEach((r, ri) => {
      const IND = 34, W2 = CW - IND, start = rows.length;
      m.font = F(400, 14.5);
      const lines = wrap(m, r.text.trim() || '–', W2);
      lines.forEach((line, li) => rows.push({ h: 22, draw(c, x, y) {
        c.textBaseline = 'middle';
        if (li === 0) { c.font = F(600, 14.5); c.fillStyle = C.acc; c.fillText(ri + 1 + '.', x, y + 11); }
        c.font = F(400, 14.5); c.fillStyle = C.text; c.fillText(line, x + IND, y + 11);
      } }));
      // für wen
      if (r.who === 'all') {
        rows.push({ h: 22, draw(c, x, y) { c.font = F(400, 12.5); c.fillStyle = C.muted; c.textBaseline = 'middle'; c.fillText(T('d_forAll'), x + IND, y + 11); } });
      } else {
        const who = r.who.map(id => d.members.findIndex(mb => mb.id === id)).filter(i => i >= 0);
        m.font = F(400, 12.5);
        const label = T('d_forSome'), lw = m.measureText(label).width + 10;
        const chips = who.map(i => ({ mb: d.members[i], text: memberName(d.members[i], i, L) }));
        if (!chips.length) chips.push({ mb: null, text: T('d_nobody') });
        // Zeilen aus Chips
        const chipLines = [[]]; let cx = lw;
        for (const ch of chips) {
          ch.w = Math.min(W2 - lw, m.measureText(ch.text).width + (ch.mb ? 30 : 18));
          if (cx + ch.w > W2 && chipLines[chipLines.length - 1].length) { chipLines.push([]); cx = lw; }
          ch.x = cx; cx += ch.w + 6; chipLines[chipLines.length - 1].push(ch);
        }
        chipLines.forEach((line, li) => rows.push({ h: 27, draw(c, x, y) {
          c.textBaseline = 'middle'; c.font = F(400, 12.5);
          if (li === 0) { c.fillStyle = C.muted; c.fillText(label, x + IND, y + 13); }
          for (const ch of line) {
            const X = x + IND + ch.x;
            c.fillStyle = C.chip; c.beginPath(); c.roundRect ? c.roundRect(X, y + 3, ch.w, 21, 10.5) : c.rect(X, y + 3, ch.w, 21); c.fill();
            let tx = X + 9;
            if (ch.mb) { c.fillStyle = ch.mb.color; c.beginPath(); c.arc(X + 12, y + 13.5, 4, 0, Math.PI * 2); c.fill(); tx = X + 21; }
            c.fillStyle = ch.mb ? C.text : C.faint; c.fillText(ellipsize(c, ch.text, ch.w - (tx - X) - 8), tx, y + 14);
          }
        } }));
      }
      if (r.penalty.trim()) {
        m.font = F(400, 13, 'italic');
        const pl = wrap(m, T('d_penalty') + r.penalty.trim(), W2);
        pl.forEach(line => rows.push({ h: 20, draw(c, x, y) { c.font = F(400, 13, 'italic'); c.fillStyle = C.muted; c.textBaseline = 'middle'; c.fillText(line, x + IND, y + 10); } }));
      }
      // eine Regel möglichst nicht über zwei Seiten verteilen
      for (let k = start; k < rows.length - 1; k++) rows[k].keep = true;
      space(10);
    });
  }

  if (d.members.length) {
    heading(T('d_sigs'));
    const GAP = 32, colW = (CW - GAP) / 2;
    for (let i = 0; i < d.members.length; i += 2) {
      const pair = d.members.slice(i, i + 2);
      rows.push({ h: 150, draw(c, x, y) {
        pair.forEach((mb, k) => {
          const idx = i + k, X = x + k * (colW + GAP), sg = d.sigs[mb.id], st = sigState(d, mb, hash);
          if (sg) {
            if (sg.type === 'draw') drawStrokes(c, decStrokes(sg.s), X, y + 8, colW - 8, 64, C.ink);
            else drawTyped(c, sg.text, X, y + 8, colW - 8, 64, C.ink);
          } else {
            c.font = F(400, 14); c.fillStyle = C.faint; c.textBaseline = 'alphabetic'; c.fillText('✕', X + 2, y + 74);
          }
          c.fillStyle = '#9aa0a9'; c.fillRect(X, y + 80, colW, 1);
          c.textBaseline = 'middle'; c.font = F(600, 13.5); c.fillStyle = C.text;
          const nm = ellipsize(c, memberName(mb, idx, L), colW); c.fillText(nm, X, y + 96);
          c.font = F(400, 11.5); c.fillStyle = sg ? C.muted : C.faint;
          const line2 = sg ? T('d_signedAt', { d: fmtDateTime(sg.at, L) }) + (sg.type === 'type' ? ' · ' + T('d_typed') : '') : T('d_open');
          c.fillText(ellipsize(c, line2, colW), X, y + 114);
          if (st === 'stale') { c.fillStyle = C.warn; c.fillText(ellipsize(c, T('d_stale'), colW), X, y + 131); }
        });
      } });
    }
  }
  return rows;
}

function paginate(rows, ch) {
  const pages = [[]]; let y = 0;
  const next = () => { pages.push([]); y = 0; };
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.space) { if (y === 0) continue; if (y + r.h > ch) { next(); continue; } pages[pages.length - 1].push({ r, y }); y += r.h; continue; }
    let chain = r.h;
    for (let j = i; rows[j].keep && j + 1 < rows.length; j++) chain += rows[j + 1].h;
    if (y > 0 && y + chain > ch && chain <= ch) next();
    else if (y > 0 && y + r.h > ch) next();
    pages[pages.length - 1].push({ r, y }); y += r.h;
  }
  return pages;
}

function drawLogo(c, x, y, size, color) {
  c.save(); c.translate(x, y); c.scale(size / 24, size / 24);
  c.strokeStyle = color; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const p of LOGO_PATHS) c.stroke(new Path2D(p));
  c.restore();
}

/* mode: 'pages' (A4-Seiten) oder 'long' (eine lange Seite für das Bild) */
function renderDoc(d, { scale = 1, mode = 'pages' } = {}) {
  const rows = buildRows(d), L = d.lang, T = (k, v) => tr(L, k, v);
  const code = T('d_code', { c: checkCode(contentHash(d)) });
  const contentH = DOC.H - DOC.TOP - DOC.BOTTOM;
  let pages;
  if (mode === 'long') {
    const all = []; let y = 0;
    for (const r of rows) { if (r.space && y === 0) continue; all.push({ r, y }); y += r.h; }
    pages = [all];
  } else pages = paginate(rows, contentH);
  return pages.map((items, pi) => {
    const H = mode === 'long' ? Math.max(560, DOC.TOP + (items.length ? items[items.length - 1].y + items[items.length - 1].r.h : 0) + DOC.BOTTOM) : DOC.H;
    let sc = scale;
    if (H * sc > 16000) sc = 16000 / H;
    const cv = document.createElement('canvas');
    cv.width = Math.round(DOC.W * sc); cv.height = Math.round(H * sc);
    const c = cv.getContext('2d');
    c.scale(sc, sc);
    c.fillStyle = '#fff'; c.fillRect(0, 0, DOC.W, H);
    const X = DOC.M, CW = DOC.W - 2 * DOC.M;
    // Kopf
    drawLogo(c, X - 2, 22, 18, C.acc);
    c.textBaseline = 'middle'; c.font = F(600, 12.5); c.fillStyle = C.text; c.fillText('Dealline', X + 22, 32);
    c.font = F(400, 11); c.fillStyle = C.faint; c.textAlign = 'right';
    c.fillText(pi > 0 ? ellipsize(c, d.title.trim() || T('d_untitled'), CW - 160) : code, X + CW, 32); c.textAlign = 'left';
    c.fillStyle = C.rule; c.fillRect(X, 48, CW, 1);
    // Inhalt
    for (const { r, y } of items) { c.save(); r.draw(c, X, DOC.TOP + y); c.restore(); }
    // Fuß
    const fy = H - 42;
    c.fillStyle = C.rule; c.fillRect(X, fy - 12, CW, 1);
    c.font = F(400, 10.5); c.fillStyle = C.faint; c.textBaseline = 'middle';
    c.fillText(pi > 0 || mode === 'long' ? 'mert.win/deal  ·  ' + code : 'mert.win/deal', X, fy + 4);
    if (mode !== 'long') { c.textAlign = 'right'; c.fillText(T('d_page', { a: pi + 1, b: pages.length }), X + CW, fy + 4); c.textAlign = 'left'; }
    return cv;
  });
}

/* ============================================================ PDF-Schreiber (Seiten als JPEG) */
const canvasBytes = (cv, type, q) => new Promise((res, rej) => cv.toBlob(b => b ? b.arrayBuffer().then(a => res(new Uint8Array(a)), rej) : rej(new Error('toBlob')), type, q));
function pdfText(s) { // UTF-16BE als Hex-String
  let hex = 'FEFF';
  for (const ch of String(s)) { const cp = ch.codePointAt(0); if (cp > 0xffff) { const v = cp - 0x10000; hex += (0xd800 + (v >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (v & 1023)).toString(16).padStart(4, '0'); } else hex += cp.toString(16).padStart(4, '0'); }
  return '<' + hex.toUpperCase() + '>';
}
function buildPdf(images, title) {
  const enc = new TextEncoder(), parts = [], offs = []; let pos = 0;
  const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; };
  const obj = (n, body) => { offs[n] = pos; put(`${n} 0 obj\n`); for (const b of [].concat(body)) put(b); put('\nendobj\n'); };
  const PW = 595.28, PH = 841.89, n = images.length;
  put('%PDF-1.4\n'); put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  const kids = images.map((_, i) => `${4 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  const d = new Date(), pd = `D:${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
  obj(3, `<< /Title ${pdfText(title)} /Creator ${pdfText('Dealline · mert.win/deal')} /Producer ${pdfText('Dealline')} /CreationDate (${pd}) >>`);
  images.forEach((img, i) => {
    const p = 4 + i * 3, im = p + 1, ct = p + 2;
    obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
    obj(im, [`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`, img.bytes, '\nendstream']);
    const cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(ct, `<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
  });
  const xref = pos, size = 4 + n * 3;
  let x = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let i = 1; i < size; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  put(x); put(`trailer\n<< /Size ${size} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(pos); let o = 0;
  for (const b of parts) { out.set(b, o); o += b.length; }
  return out;
}
async function makePdf(d) {
  const pages = renderDoc(d, { scale: 2.2, mode: 'pages' });
  const images = [];
  for (const cv of pages) images.push({ w: cv.width, h: cv.height, bytes: await canvasBytes(cv, 'image/jpeg', 0.9) });
  return { bytes: buildPdf(images, d.title.trim() || tr(d.lang, 'd_untitled')), pages: pages.length };
}
async function makePng(d) {
  const [cv] = renderDoc(d, { scale: 2, mode: 'long' });
  return { bytes: await canvasBytes(cv, 'image/png'), width: cv.width, height: cv.height };
}

/* ============================================================ Vorlagen */
function templates(L) {
  const de = L === 'de';
  const M = (role, tasks) => ({ role, tasks });
  const R = (text, who, penalty = '') => ({ text, who, penalty });
  return [
    { id: 'bet', name: tr(L, 'tpl_bet'), make: () => ({
      title: de ? 'Wette um das Spiel am Samstag' : 'Bet on Saturday’s match',
      about: de ? 'Wir wetten darauf, wie das Spiel am Samstag ausgeht. Wer falsch liegt, löst den Einsatz ein.' : 'We bet on how Saturday’s match ends. Whoever is wrong pays the stake.',
      stake: de ? 'Wer verliert, gibt eine Pizza aus.' : 'The loser buys a pizza.',
      end: addDays(7), deadlines: [{ date: addDays(7), label: de ? 'Einsatz einlösen' : 'Pay the stake' }],
      members: [M(de ? 'tippt auf Heimsieg' : 'bets on a home win', [de ? 'Tipp: Heimsieg' : 'Bet: home win']),
                M(de ? 'tippt dagegen' : 'bets against', [de ? 'Tipp: Unentschieden oder Auswärtssieg' : 'Bet: draw or away win'])],
      rules: [R(de ? 'Es zählt das offizielle Endergebnis nach 90 Minuten.' : 'The official result after 90 minutes counts.', 'all'),
              R(de ? 'Die Wette gilt erst, wenn beide unterschrieben haben.' : 'The bet only counts once both have signed.', 'all'),
              R(de ? 'Der Einsatz wird innerhalb einer Woche eingelöst.' : 'The stake is paid within one week.', 'all', de ? 'Der Einsatz verdoppelt sich.' : 'The stake doubles.')]
    }) },
    { id: 'project', name: tr(L, 'tpl_project'), make: () => ({
      title: de ? 'Gruppenprojekt: Referat' : 'Group project: presentation',
      about: de ? 'Wir erarbeiten zusammen ein Referat und teilen die Arbeit fair auf.' : 'We prepare a presentation together and share the work fairly.',
      end: addDays(14),
      deadlines: [{ date: addDays(7), label: de ? 'Zwischenstand im Gruppenchat' : 'Progress update in the group chat' }, { date: addDays(14), label: de ? 'Abgabe' : 'Submission' }],
      members: [M(de ? 'Koordination' : 'Coordination', de ? ['Stimmt Termine ab', 'Fügt alles zu einer Datei zusammen'] : ['Schedules meetings', 'Merges everything into one file']),
                M(de ? 'Recherche' : 'Research', de ? ['Sammelt Quellen', 'Schreibt die Zusammenfassung'] : ['Collects sources', 'Writes the summary']),
                M(de ? 'Präsentation' : 'Slides', de ? ['Gestaltet die Folien', 'Probt den Vortrag mit allen'] : ['Designs the slides', 'Rehearses the talk with everyone'])],
      rules: [R(de ? 'Jeder hält seine Frist ein – oder sagt mindestens zwei Tage vorher Bescheid.' : 'Everyone meets their deadline – or says so at least two days ahead.', 'all', de ? 'Übernimmt eine Zusatzaufgabe.' : 'Takes on an extra task.'),
              R(de ? 'Entscheidungen treffen wir gemeinsam per Abstimmung.' : 'We make decisions together by vote.', 'all'),
              R(de ? 'Schickt die fertige Datei spätestens einen Tag vor der Abgabe an alle.' : 'Sends the final file to everyone at least one day before submission.', [0])]
    }) },
    { id: 'flat', name: tr(L, 'tpl_flat'), make: () => ({
      title: de ? 'WG-Regeln' : 'Flat rules',
      about: de ? 'Damit das Zusammenwohnen entspannt bleibt, gelten bei uns diese Regeln.' : 'To keep living together relaxed, these are our rules.',
      start: today(),
      members: [M('', [de ? 'Bad putzen (gerade Wochen)' : 'Clean the bathroom (even weeks)']),
                M('', [de ? 'Küche putzen (gerade Wochen)' : 'Clean the kitchen (even weeks)']),
                M('', [de ? 'Flur und Böden (jede Woche)' : 'Hallway and floors (every week)'])],
      rules: [R(de ? 'Ruhezeit ist von 22 bis 7 Uhr.' : 'Quiet hours are from 10 pm to 7 am.', 'all'),
              R(de ? 'Geschirr wird am selben Tag gespült.' : 'Dishes are washed the same day.', 'all', de ? 'Übernimmt einmal extra den Küchendienst.' : 'Does kitchen duty one extra time.'),
              R(de ? 'Gemeinsame Einkäufe kommen auf die Liste und werden geteilt.' : 'Shared groceries go on the list and are split.', 'all'),
              R(de ? 'Bringen montags und donnerstags den Müll raus.' : 'Take out the trash on Mondays and Thursdays.', [0, 1]),
              R(de ? 'Kümmert sich um die Pflanzen im Wohnzimmer.' : 'Looks after the plants in the living room.', [2])]
    }) },
    { id: 'game', name: tr(L, 'tpl_game'), make: () => ({
      title: de ? 'Turnier: Spieleabend' : 'Tournament: game night',
      about: de ? 'Wir spielen jeder gegen jeden. Wer am Ende die meisten Punkte hat, gewinnt.' : 'Everyone plays everyone. Whoever has the most points at the end wins.',
      stake: de ? 'Wer gewinnt, sucht das nächste Spiel aus.' : 'The winner picks the next game.',
      members: [M(de ? 'Spielleitung' : 'Game master', de ? ['Führt die Punkteliste', 'Entscheidet bei Streit'] : ['Keeps the score sheet', 'Settles disputes']),
                M(de ? 'Spieler' : 'Player', []), M(de ? 'Spieler' : 'Player', []), M(de ? 'Spieler' : 'Player', [])],
      rules: [R(de ? 'Sieg 3 Punkte, Unentschieden 1 Punkt, Niederlage 0 Punkte.' : 'Win 3 points, draw 1 point, loss 0 points.', 'all'),
              R(de ? 'Bei Punktgleichheit entscheidet der direkte Vergleich.' : 'On equal points, head-to-head decides.', 'all'),
              R(de ? 'Fair bleiben: kein Schummeln, keine Absprachen.' : 'Play fair: no cheating, no fixing.', 'all', de ? 'Das Spiel zählt als verloren.' : 'The game counts as lost.'),
              R(de ? 'Spielt mit, entscheidet aber nicht bei eigenen Spielen.' : 'Plays too, but does not rule on their own games.', [0])]
    }) },
    { id: 'lend', name: tr(L, 'tpl_lend'), make: () => ({
      title: de ? 'Verleih einer Kamera' : 'Lending a camera',
      about: de ? 'Ein Gegenstand wird ausgeliehen und bis zum vereinbarten Tag zurückgegeben.' : 'An item is lent and returned by the agreed day.',
      stake: de ? 'Pfand: 50 €, zurück bei Rückgabe.' : 'Deposit: €50, returned on return.',
      start: today(), end: addDays(14), deadlines: [{ date: addDays(14), label: de ? 'Rückgabe' : 'Return' }],
      members: [M(de ? 'verleiht' : 'lender', de ? ['Übergibt den Gegenstand vollständig und funktionsfähig', 'Gibt das Pfand bei Rückgabe zurück'] : ['Hands over the item complete and working', 'Returns the deposit on return']),
                M(de ? 'leiht aus' : 'borrower', de ? ['Gibt den Gegenstand pünktlich und sauber zurück'] : ['Returns the item on time and clean'])],
      rules: [R(de ? 'Behandelt den Gegenstand pfleglich und verleiht ihn nicht weiter.' : 'Treats the item with care and does not lend it on.', [1], de ? 'Ersetzt Schäden oder zahlt die Reparatur.' : 'Pays for damage or repair.'),
              R(de ? 'Schäden werden sofort gemeldet.' : 'Damage is reported right away.', 'all'),
              R(de ? 'Verlängern geht nur, wenn beide zustimmen.' : 'An extension needs both to agree.', 'all')]
    }) },
    { id: 'blank', name: tr(L, 'tpl_blank'), make: () => ({}) }
  ];
}
function dealFromTemplate(tpl, L) {
  const d = newDeal(L), x = tpl.make();
  if (x.members) d.members = x.members.map((mm, i) => newMember(i, { role: mm.role, tasks: mm.tasks.slice() }));
  Object.assign(d, { title: x.title || '', about: x.about || '', stake: x.stake || '', start: x.start || '', end: x.end || '', deadlines: x.deadlines || [] });
  d.rules = (x.rules || []).map(r => ({ id: uid(6), text: r.text, penalty: r.penalty, who: r.who === 'all' ? 'all' : r.who.map(i => d.members[i].id) }));
  return d;
}
const isEmptyDeal = d => !d.title.trim() && !d.about.trim() && !d.stake.trim() && !d.rules.length && !d.deadlines.length &&
  d.members.every(m => !m.name.trim() && !m.role.trim() && !m.tasks.length) && !Object.keys(d.sigs).length;

/* ============================================================ Speicher */
const KEY = 'dealline.deals', CUR = 'dealline.current';
let deals = {};
try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const v of Object.values(raw)) { const d = normalize(v); if (d) deals[d.id] = d; } } catch {}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(deals)); localStorage.setItem(CUR, deal ? deal.id : ''); return true; } catch { return false; }
}

/* ============================================================ Oberfläche */
let deal = null;
let previewTimer = 0, saveTimer = 0;

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.setAttribute('style', v);
    else if (k in e && typeof v !== 'string') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k);
  return e;
}
const ICON = {
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  up: '<svg class="i" viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg>',
  down: '<svg class="i" viewBox="0 0 24 24"><path d="m6 10 6 6 6-6"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  warn: '<svg class="i" viewBox="0 0 24 24"><path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17v.5"/></svg>'
};
const ib = (icon, title, onclick, cls = '') => { const b = el('button', { type: 'button', class: 'ib ' + cls, title, 'aria-label': title, onclick }); b.innerHTML = ICON[icon]; return b; };

let toastTimer = 0;
function toast(msg) {
  const tEl = $('#toast'); tEl.textContent = msg; tEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => tEl.classList.remove('show'), 2600);
}
function ask(text) {
  const dlg = $('#ask-dlg'); $('#ask-text').textContent = text;
  return new Promise(res => {
    dlg.returnValue = '';
    dlg.addEventListener('close', () => res(dlg.returnValue === 'yes'), { once: true });
    dlg.showModal(); $('#ask-yes').focus();
  });
}

/* --- Änderungen --- */
function changed({ structure = false } = {}) {
  deal.updated = Date.now();
  deals[deal.id] = deal;
  if (structure) renderLists();
  renderSigs();
  clearTimeout(saveTimer); saveTimer = setTimeout(save, 250);
  clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 160);
  $('#saved').textContent = '';
}
function save() {
  clearTimeout(saveTimer);
  const ok = persist();
  $('#saved').textContent = ok ? t('saved') : t('notSaved');
}

/* --- Sprache --- */
function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
  $$('[data-i-ph]').forEach(e => { e.placeholder = t(e.dataset.iPh); });
  $$('[data-i-title]').forEach(e => { e.title = t(e.dataset.iTitle); e.setAttribute('aria-label', t(e.dataset.iTitle)); });
  $('#lang').textContent = t('langBtn');
  renderTemplates();
  if (deal) renderAll();
  renderList();
}

/* --- Ansichten --- */
function setView(v) {
  document.body.dataset.view = v;
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === v)));
  $('#make').hidden = v === 'list';
  $('#list').hidden = v !== 'list';
  if (v === 'list') renderList();
  if (v === 'doc') renderPreview();
  window.scrollTo({ top: 0 });
}

/* --- Editor --- */
function renderTemplates() {
  const box = $('#tpls'); box.textContent = '';
  for (const tp of templates(lang)) {
    box.append(el('button', { type: 'button', class: 'chip', 'data-tpl': tp.id, text: tp.name, onclick: () => useTemplate(tp) }));
  }
}
function useTemplate(tp) {
  const fresh = dealFromTemplate(tp, lang);
  if (deal && isEmptyDeal(deal)) { fresh.id = deal.id; fresh.created = deal.created; }
  else toast(t('fromTpl'));
  openDeal(fresh, { save: true });
  $('#tpl-box').open = false;
}

function renderAll() {
  $$('[data-f]').forEach(e => { e.value = deal[e.dataset.f] || ''; });
  $$('#doc-lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === deal.lang)));
  renderLists();
  renderSigs();
  renderPreview();
}
function renderLists() { renderDeadlines(); renderMembers(); renderRules(); }

function renderDeadlines() {
  const ul = $('#deadlines'); ul.textContent = '';
  deal.deadlines.forEach((x, i) => {
    ul.append(el('li', { class: 'deadline' },
      el('input', { type: 'date', value: x.date, 'aria-label': t('fDate'), oninput: e => { x.date = e.target.value; changed(); } }),
      el('input', { type: 'text', value: x.label, maxlength: 300, placeholder: t('phDeadline'), oninput: e => { x.label = e.target.value; changed(); } }),
      ib('x', t('remove'), () => { deal.deadlines.splice(i, 1); changed({ structure: true }); })));
  });
}

function renderMembers() {
  const box = $('#members'); box.textContent = '';
  deal.members.forEach((m, i) => {
    const av = el('button', { type: 'button', class: 'av', title: t('colorLbl'), 'aria-expanded': 'false', style: `--c:${m.color}`, text: initials(m, i, deal.lang) });
    const opts = el('div', { class: 'm-opts', hidden: true },
      el('div', { class: 'swatches' }, PALETTE.map(col => el('button', { type: 'button', class: 'sw', style: `--c:${col}`, 'aria-pressed': String(col === m.color), title: col,
        onclick: () => { m.color = col; changed({ structure: true }); } }))),
      el('label', { class: 'field inline' }, el('span', { text: t('avatarLbl') }),
        el('input', { type: 'text', value: m.avatar, maxlength: 4, class: 'short', oninput: e => { m.avatar = e.target.value.trim(); av.textContent = initials(m, i, deal.lang); changed(); } })));
    av.addEventListener('click', () => { opts.hidden = !opts.hidden; av.setAttribute('aria-expanded', String(!opts.hidden)); });
    const tasks = el('ul', { class: 'tasks' });
    const renderTasks = () => {
      tasks.textContent = '';
      m.tasks.forEach((task, ti) => tasks.append(el('li', {},
        el('input', { type: 'text', value: task, maxlength: 500, placeholder: t('phTask'), oninput: e => { m.tasks[ti] = e.target.value; changed(); },
          onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); m.tasks.splice(ti + 1, 0, ''); renderTasks(); changed(); tasks.children[ti + 1].querySelector('input').focus(); } } }),
        ib('x', t('remove'), () => { m.tasks.splice(ti, 1); renderTasks(); changed(); }))));
    };
    renderTasks();
    const addTask = el('button', { type: 'button', class: 'btn small ghost', onclick: () => { m.tasks.push(''); renderTasks(); changed(); tasks.lastChild.querySelector('input').focus(); } });
    addTask.innerHTML = ICON.plus; addTask.append(t('addTask'));
    box.append(el('div', { class: 'member', 'data-mid': m.id, style: `--c:${m.color}` },
      el('div', { class: 'm-head' }, av,
        el('input', { type: 'text', class: 'm-name', value: m.name, maxlength: 80, placeholder: t('phName'), 'aria-label': t('phName'),
          oninput: e => { m.name = e.target.value; if (!m.avatar) av.textContent = initials(m, i, deal.lang); renderRules(); changed(); } }),
        el('input', { type: 'text', class: 'm-role', value: m.role, maxlength: 80, placeholder: t('phRole'), 'aria-label': t('phRole'), oninput: e => { m.role = e.target.value; changed(); } }),
        ib('x', t('removeMember'), () => removeMember(m.id), 'm-del')),
      opts,
      el('span', { class: 'lab', text: t('tasks') }), tasks, addTask));
  });
}
function removeMember(id) {
  deal.members = deal.members.filter(m => m.id !== id);
  for (const r of deal.rules) if (Array.isArray(r.who)) r.who = r.who.filter(x => x !== id);
  delete deal.sigs[id];
  changed({ structure: true });
}

function renderRules() {
  const box = $('#rules');
  const a = document.activeElement;
  // beim Tippen in einer Regel nicht neu aufbauen (sonst springt der Cursor raus)
  if (a && box.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && box.children.length === deal.rules.length) { updateRuleWho(); return; }
  box.textContent = '';
  $('#rules-empty').hidden = deal.rules.length > 0;
  deal.rules.forEach((r, i) => {
    const who = el('div', { class: 'who chips' });
    const seg = el('div', { class: 'seg two' },
      el('button', { type: 'button', 'data-v': 'all', text: t('forAll'), 'aria-pressed': String(r.who === 'all'), onclick: () => { r.who = 'all'; changed({ structure: true }); } }),
      el('button', { type: 'button', 'data-v': 'some', text: t('forSome'), 'aria-pressed': String(r.who !== 'all'), onclick: () => { if (r.who === 'all') { r.who = []; changed({ structure: true }); } } }));
    const ta = el('textarea', { rows: 2, maxlength: 2000, placeholder: t('phRule'), 'aria-label': t('phRule'), oninput: e => { r.text = e.target.value; changed(); } });
    ta.value = r.text;
    box.append(el('div', { class: 'rule', 'data-rid': r.id },
      el('div', { class: 'r-head' }, el('span', { class: 'num', text: i + 1 + '.' }), ta,
        el('div', { class: 'r-tools' },
          ib('up', t('up'), () => moveRule(i, -1), i === 0 ? 'off' : ''),
          ib('down', t('down'), () => moveRule(i, 1), i === deal.rules.length - 1 ? 'off' : ''),
          ib('x', t('removeRule'), () => { deal.rules.splice(i, 1); changed({ structure: true }); }))),
      seg, who,
      el('input', { type: 'text', class: 'penalty', value: r.penalty, maxlength: 500, placeholder: t('phPenalty'), 'aria-label': t('phPenalty'), oninput: e => { r.penalty = e.target.value; changed(); } })));
  });
  updateRuleWho();
}
function updateRuleWho() {
  deal.rules.forEach(r => {
    const node = $(`.rule[data-rid="${r.id}"] .who`);
    if (!node) return;
    $$(`.rule[data-rid="${r.id}"] .seg button`).forEach(b => b.setAttribute('aria-pressed', String((b.dataset.v === 'all') === (r.who === 'all'))));
    node.textContent = '';
    node.hidden = r.who === 'all';
    if (r.who === 'all') return;
    deal.members.forEach((m, i) => {
      const on = r.who.includes(m.id);
      node.append(el('button', { type: 'button', class: 'chip m-chip', style: `--c:${m.color}`, 'aria-pressed': String(on), 'data-mid': m.id,
        onclick: () => { r.who = on ? r.who.filter(x => x !== m.id) : deal.members.filter(mm => mm.id === m.id || r.who.includes(mm.id)).map(mm => mm.id); changed(); updateRuleWho(); } },
        el('span', { class: 'dot' }), memberName(m, i, deal.lang)));
    });
    if (!r.who.length) node.append(el('span', { class: 'hint warn', text: t('pickMembers') }));
  });
}
function moveRule(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= deal.rules.length) return;
  [deal.rules[i], deal.rules[j]] = [deal.rules[j], deal.rules[i]];
  changed({ structure: true });
}

/* --- Unterschriften --- */
function renderSigs() {
  const ul = $('#sigs'); ul.textContent = '';
  const hash = contentHash(deal);
  deal.members.forEach((m, i) => {
    const st = sigState(deal, m, hash), sg = deal.sigs[m.id];
    const status = st === 'open' ? t('notSigned') : t('signedAt', { d: fmtDateTime(sg.at, lang) });
    const li = el('li', { class: 'sig ' + st, 'data-mid': m.id },
      el('span', { class: 'av small', style: `--c:${m.color}`, text: initials(m, i, deal.lang) }),
      el('span', { class: 'sig-t' }, el('b', { text: memberName(m, i, lang) }), el('small', { text: status }),
        st === 'stale' ? el('small', { class: 'warn', text: t('staleSig') }) : null),
      el('span', { class: 'sig-act' },
        el('button', { type: 'button', class: 'btn small' + (st === 'ok' ? '' : ' pri'), text: st === 'open' ? t('sign') : t('signAgain'), onclick: () => openSign(m.id) }),
        sg ? ib('x', t('remove'), () => { delete deal.sigs[m.id]; changed(); }) : null));
    if (st === 'ok') li.querySelector('.av').innerHTML = ICON.check;
    ul.append(li);
  });
  $('#sign-box').hidden = !deal.members.length;
}

/* Unterschrift-Dialog */
const sign = { mid: null, mode: 'draw', strokes: [], cur: null };
function openSign(mid) {
  const i = deal.members.findIndex(m => m.id === mid), m = deal.members[i];
  if (!m) return;
  sign.mid = mid; sign.strokes = []; sign.cur = null;
  $('#sign-title').textContent = t('signTitle', { n: memberName(m, i, lang) });
  $('#sig-text').value = m.name.trim();
  $('#sign-note').textContent = t('signNote', { d: fmtDate(today(), lang) });
  setSignMode(sign.mode);
  $('#sign-dlg').showModal();
  drawPad();
}
function setSignMode(mode) {
  sign.mode = mode;
  $$('#sign-mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === mode)));
  $('#pad-wrap').hidden = mode !== 'draw';
  $('#type-wrap').hidden = mode !== 'type';
  if (mode === 'type') { updateTyped(); setTimeout(() => $('#sig-text').focus(), 0); }
}
function updateTyped() { const v = $('#sig-text').value.trim(); const ty = $('#typed'); ty.textContent = v; ty.style.fontFamily = CURSIVE; }
function drawPad() {
  const cv = $('#pad'), dpr = Math.min(3, window.devicePixelRatio || 1);
  if (cv.width !== PAD_W * dpr) { cv.width = PAD_W * dpr; cv.height = PAD_H * dpr; }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, PAD_W, PAD_H);
  const all = sign.strokes.concat(sign.cur ? [sign.cur] : []);
  c.strokeStyle = getComputedStyle(cv).color || '#1a2b5c'; c.fillStyle = c.strokeStyle;
  c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const st of all) {
    c.beginPath();
    if (st.length === 1) { c.arc(st[0][0], st[0][1], 1.5, 0, Math.PI * 2); c.fill(); continue; }
    c.moveTo(st[0][0], st[0][1]);
    for (let i = 1; i < st.length - 1; i++) c.quadraticCurveTo(st[i][0], st[i][1], (st[i][0] + st[i + 1][0]) / 2, (st[i][1] + st[i + 1][1]) / 2);
    c.lineTo(st[st.length - 1][0], st[st.length - 1][1]); c.stroke();
  }
  $('#pad-hint').hidden = all.length > 0;
}
function padPoint(e) {
  const r = $('#pad').getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * PAD_W, (e.clientY - r.top) / r.height * PAD_H];
}
function initPad() {
  const cv = $('#pad');
  cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); sign.cur = [padPoint(e)]; drawPad(); });
  cv.addEventListener('pointermove', e => {
    if (!sign.cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) sign.cur.push(padPoint(ev));
    drawPad();
  });
  const end = () => { if (sign.cur) { sign.strokes.push(sign.cur); sign.cur = null; drawPad(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);
  $('#pad-clear').addEventListener('click', () => { sign.strokes = []; sign.cur = null; drawPad(); });
  $$('#sign-mode button').forEach(b => b.addEventListener('click', () => setSignMode(b.dataset.v)));
  $('#sig-text').addEventListener('input', updateTyped);
  $('#sign-cancel').addEventListener('click', () => $('#sign-dlg').close());
  $('#sign-ok').addEventListener('click', () => {
    let sig;
    if (sign.mode === 'draw') {
      if (!sign.strokes.length) return toast(t('padEmpty'));
      sig = { type: 'draw', s: encStrokes(sign.strokes) };
    } else {
      const v = $('#sig-text').value.trim();
      if (!v) return toast(t('typeEmpty'));
      sig = { type: 'type', text: v.slice(0, 60) };
    }
    applySignature(sign.mid, sig);
    $('#sign-dlg').close();
  });
}
function applySignature(mid, sig) {
  deal.sigs[mid] = { ...sig, at: Date.now(), h: contentHash(deal) };
  changed();
  save();
}

/* --- Vorschau --- */
function renderPreview() {
  clearTimeout(previewTimer);
  if (!deal) return;
  const box = $('#pages');
  if (box.offsetParent === null && document.body.dataset.view !== 'doc' && matchMedia('(max-width: 899px)').matches) return; // unsichtbar
  const w = box.clientWidth || 400, dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const pages = renderDoc(deal, { scale: Math.max(0.6, (w / DOC.W) * dpr), mode: 'pages' });
  box.textContent = '';
  pages.forEach((cv, i) => { cv.className = 'page'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', tr(deal.lang, 'd_page', { a: i + 1, b: pages.length })); box.append(cv); });
  $('#doc-info').textContent = (pages.length === 1 ? t('pages1') : t('pagesN', { n: pages.length })) + ' · ' + t('nSigned', { a: signedCount(deal), b: deal.members.length }) + ' · ' + checkCode(contentHash(deal));
}

/* --- Export --- */
function download(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function busy(btn, fn) {
  const label = btn.querySelector('span') || btn, old = label.textContent;
  btn.disabled = true; label.textContent = t('making');
  try { await fn(); } catch (e) { console.error(e); toast(t('failed')); }
  finally { btn.disabled = false; label.textContent = old; }
}
const fileBase = d => 'dealline-' + slug(d.title);
async function exportPdf() { const { bytes } = await makePdf(deal); download(bytes, fileBase(deal) + '.pdf', 'application/pdf'); }
async function exportPng() { const { bytes } = await makePng(deal); download(bytes, fileBase(deal) + '.png', 'image/png'); }
function exportJson(list = [deal], name = fileBase(deal) + '.json') {
  const data = list.length === 1 ? { app: 'dealline', v: 1, deal: list[0] } : { app: 'dealline', v: 1, deals: list };
  download(new TextEncoder().encode(JSON.stringify(data, null, 2)), name, 'application/json');
}
function printDoc() {
  const box = $('#print-pages'); box.textContent = '';
  for (const cv of renderDoc(deal, { scale: 2, mode: 'pages' })) box.append(el('img', { src: cv.toDataURL('image/png'), alt: '' }));
  setTimeout(() => window.print(), 50);
}
async function openShare() {
  save();
  const link = await dealLink(deal);
  $('#share-link').value = link;
  const warn = $('#share-warn');
  warn.hidden = link.length < 6000; warn.textContent = t('linkLong', { n: link.length });
  $('#share-sys').hidden = !navigator.share;
  $('#share-dlg').showModal();
  $('#share-link').select();
}
async function copyLink() {
  const v = $('#share-link').value;
  try { await navigator.clipboard.writeText(v); } catch { $('#share-link').select(); document.execCommand && document.execCommand('copy'); }
  toast(t('copied'));
}

/* --- Meine Deals --- */
function renderList() {
  const ul = $('#deals'); if (!ul) return; ul.textContent = '';
  const list = Object.values(deals).sort((a, b) => b.updated - a.updated);
  $('#list-empty').hidden = list.length > 0;
  for (const d of list) {
    const signed = signedCount(d);
    const li = el('li', { class: 'deal-item' + (deal && d.id === deal.id ? ' current' : ''), 'data-id': d.id },
      el('button', { type: 'button', class: 'deal-open', onclick: () => { openDeal(d); setView('edit'); } },
        el('span', { class: 'avs' }, d.members.slice(0, matchMedia('(max-width: 560px)').matches ? 2 : 4).map((m, i) => el('span', { class: 'av small', style: `--c:${m.color}`, text: initials(m, i, d.lang) }))),
        el('span', { class: 'deal-t' }, el('b', { text: d.title.trim() || t('untitled') }),
          el('small', { text: [t('nMembers', { n: d.members.length }), t('nSigned', { a: signed, b: d.members.length }), t('changed', { d: fmtDateTime(d.updated, lang) })].join(' · ') }))),
      el('span', { class: 'deal-act' },
        ib('x', t('del'), async () => { if (await ask(t('confirmDel', { t: d.title.trim() || t('untitled') }))) deleteDeal(d.id); })));
    ul.append(li);
  }
}
function deleteDeal(id) {
  delete deals[id];
  if (deal && deal.id === id) { const rest = Object.values(deals).sort((a, b) => b.updated - a.updated); deal = rest[0] || newDeal(); deals[deal.id] = deal; renderAll(); }
  persist(); renderList();
}
function openDeal(d, { save: doSave = false } = {}) {
  // ein leerer, unberührter Deal soll nicht als Leiche in „Meine Deals“ liegen bleiben
  if (deal && deal.id !== d.id && isEmptyDeal(deal)) delete deals[deal.id];
  deal = d; deals[d.id] = d;
  $('#recv').hidden = true;
  if (doSave) persist(); else try { localStorage.setItem(CUR, d.id); } catch {}
  $('#tpl-box').open = isEmptyDeal(d);
  renderAll();
}
async function importFiles(files) {
  let n = 0;
  for (const f of files) {
    try {
      const o = JSON.parse(await f.text());
      const list = Array.isArray(o) ? o : o && Array.isArray(o.deals) ? o.deals : [o && o.deal ? o.deal : o];
      for (const raw of list) { const d = normalize(raw); if (!d) continue; deals[d.id] = mergeDeals(deals[d.id], d).deal; n++; }
    } catch {}
  }
  if (!n) return toast(t('badFile'));
  persist(); renderList(); toast(t('imported', { n }));
}

/* --- Link öffnen --- */
async function handleHash() {
  const m = location.hash.match(/^#d=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  try {
    const inc = await decodeDeal(m[1]);
    const had = !!deals[inc.id];
    const { deal: merged, added } = mergeDeals(deals[inc.id], inc);
    openDeal(merged, { save: true });
    $('#recv').hidden = false;
    $('#recv-text').textContent = had && added ? t('recvMerged', { n: added }) : t('recvText');
    history.replaceState(null, '', location.href.split('#')[0]);
    if (matchMedia('(max-width: 899px)').matches) setView('doc');
    return true;
  } catch (e) {
    console.warn(e); toast(t('badLink'));
    history.replaceState(null, '', location.href.split('#')[0]);
    return false;
  }
}

/* ============================================================ Start */
function init() {
  // Eingabefelder des Deals
  $$('[data-f]').forEach(e => e.addEventListener('input', () => { deal[e.dataset.f] = e.value; changed(); }));
  $('#add-deadline').addEventListener('click', () => { deal.deadlines.push({ date: '', label: '' }); changed({ structure: true }); $('#deadlines').lastChild.querySelector('input').focus(); });
  $('#add-member').addEventListener('click', () => { deal.members.push(newMember(deal.members.length)); changed({ structure: true }); $('#members').lastChild.querySelector('.m-name').focus(); });
  $('#add-rule').addEventListener('click', () => { deal.rules.push({ id: uid(6), text: '', who: 'all', penalty: '' }); changed({ structure: true }); $('#rules').lastChild.querySelector('textarea').focus(); });
  $$('#doc-lang button').forEach(b => b.addEventListener('click', () => { deal.lang = b.dataset.v; changed(); renderAll(); }));
  $('#dup').addEventListener('click', () => {
    const c = JSON.parse(JSON.stringify(deal)); c.id = uid(10); c.sigs = {}; c.created = c.updated = Date.now();
    c.title = c.title ? c.title + (lang === 'de' ? ' (Kopie)' : ' (copy)') : c.title;
    openDeal(c, { save: true }); toast(t('dupDone'));
  });
  $('#clear-sigs').addEventListener('click', async () => { if (Object.keys(deal.sigs).length && await ask(t('confirmClear'))) { deal.sigs = {}; changed(); } });
  $('#del').addEventListener('click', async () => { if (await ask(t('confirmDel', { t: deal.title.trim() || t('untitled') }))) deleteDeal(deal.id); });
  $('#to-sign').addEventListener('click', () => { if (matchMedia('(max-width: 899px)').matches) setView('doc'); $('#sign-box').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  // Export
  $('#dl-pdf').addEventListener('click', e => busy(e.currentTarget, exportPdf));
  $('#dl-png').addEventListener('click', e => busy(e.currentTarget, exportPng));
  $('#dl-json').addEventListener('click', () => exportJson());
  $('#print').addEventListener('click', printDoc);
  $('#share').addEventListener('click', e => busy(e.currentTarget, openShare));
  $('#share-copy').addEventListener('click', copyLink);
  $('#share-close').addEventListener('click', () => $('#share-dlg').close());
  $('#share-sys').addEventListener('click', () => navigator.share({ title: deal.title || 'Dealline', url: $('#share-link').value }).catch(() => {}));

  // Liste
  $('#new-deal').addEventListener('click', () => { openDeal(newDeal(), { save: true }); setView('edit'); });
  $('#open-file').addEventListener('change', e => { importFiles([...e.target.files]); e.target.value = ''; });
  $('#export-all').addEventListener('click', () => { const l = Object.values(deals); if (l.length) exportJson(l, 'dealline-alle.json'); });

  // Kopf
  $$('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => setView(b.dataset.tab)));
  $('#lang').addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; try { localStorage.setItem('dealline.lang', lang); } catch {} applyLang(); });
  initPad();

  // Fenster
  let rw = 0;
  addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { if (document.body.dataset.view === 'doc' && !matchMedia('(max-width: 899px)').matches) setView('edit'); renderPreview(); }, 200); });
  addEventListener('hashchange', handleHash);
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  // Ersten Deal wählen
  let cur = null; try { cur = localStorage.getItem(CUR); } catch {}
  deal = deals[cur] || Object.values(deals).sort((a, b) => b.updated - a.updated)[0] || newDeal();
  deals[deal.id] = deal;
  $('#tpl-box').open = isEmptyDeal(deal);
  applyLang();
  handleHash();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw\b/.test(location.search)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Für Tests und W Hub
window.Dealline = {
  get deal() { return deal; }, get deals() { return deals; },
  newDeal, normalize, encodeDeal, decodeDeal, dealLink, mergeDeals, contentHash, checkCode, sigState,
  encStrokes, decStrokes, renderDoc, makePdf, makePng, buildPdf, templates, dealFromTemplate,
  openDeal: d => openDeal(normalize(d) || d, { save: true }), applySignature, setView, handleHash
};
init();
})();
