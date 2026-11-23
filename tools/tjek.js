// Datakontrol for hele appen + genbygning af sw.js og KILDER-OG-LICENSER.md.
// Kør:  node tools/tjek.js      (stopper med fejlkode, hvis noget er galt)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
// indlæs alle datafiler i en sandkasse, ligesom browseren gør
const ctx = { window: {}, console };
vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dataScripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])
  .filter(s => /^(themes|kort)\//.test(s) || /^(questions|questions_opentdb|tidsmaerker)\.js$/.test(s));
for (const s of dataScripts) {
  if (!fs.existsSync(path.join(root, s))) { err(`index.html henviser til ${s}, som ikke findes`); continue; }
  try { vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }); } catch (e) { err(`${s}: ${e.message}`); }
}
const W = ctx.window;

// 1) Stjernejagt-temaer
const allQ = new Set();
for (const t of W.THEMES || []) {
  if (!t.id || !t.name || !Array.isArray(t.cats) || t.cats.length !== 6) err(`tema ${t.id}: mangler id/navn eller 6 kategorier`);
  const seen = new Set();
  t.questions.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 3) return err(`tema ${t.id} #${i}: forkert format`);
    if (!(q[0] >= 0 && q[0] <= 5)) err(`tema ${t.id} #${i}: kategori ${q[0]}`);
    if (!String(q[1]).trim() || !String(q[2]).trim()) err(`tema ${t.id} #${i}: tomt spørgsmål eller svar`);
    if (seen.has(q[1])) err(`tema ${t.id}: samme spørgsmål to gange: "${q[1]}"`);
    seen.add(q[1]); allQ.add(q[1]);
  });
}
for (const [name, list] of [['questions.js', W.BUILTIN_QUESTIONS], ['questions_opentdb.js', W.OPENTDB_QUESTIONS]]) {
  (list || []).forEach((q, i) => { if (!(q[0] >= 0 && q[0] <= 5) || !q[1] || !q[2]) err(`${name} #${i}: forkert format`); allQ.add(q[1]); });
}
// 2) tidsmærkater skal pege på eksisterende spørgsmål
Object.entries(W.ASOF || {}).forEach(([y, list]) => list.forEach(q => { if (!allQ.has(q)) warn(`tidsmaerker.js (${y}): spørgsmålet findes ikke længere: "${q}"`); }));

// 3) Quizisk Roulette
const exists = f => fs.existsSync(path.join(root, f));
(W.KRANS || []).forEach(c => {
  const id = `${c.set}: ${c.q}`;
  if (!c.items || c.items.length !== 10) err(`roulette ${id}: ${c.items && c.items.length} svar (skal være 10)`);
  if (c.type === 'yn') { const t = c.items.filter(i => i.a).length; if (t < 4 || t > 9) err(`roulette ${id}: ${t} sande (skal være 4–9)`); }
  else if (c.type === 'open') c.items.forEach(i => { if (i.a === undefined || String(i.a).trim() === '') err(`roulette ${id}: tomt svar`); });
  else err(`roulette ${id}: ukendt type ${c.type}`);
  c.items.forEach(i => {
    if (i.img && !exists(i.img)) err(`roulette ${id}: billedet ${i.img} findes ikke`);
    if (i.shape && !(W.SHAPES || {})[i.shape]) err(`roulette ${id}: ukendt landeform ${i.shape}`);
    if (!i.t && !i.img && !i.shape) err(`roulette ${id}: et felt uden tekst eller billede`);
  });
});

// 4) Tidslinje
const tlText = new Map();
(W.TL || []).forEach(([set, t, w, img], i) => {
  if (!t) err(`tidslinje #${i}: tom tekst`);
  if (typeof w === 'string' && /^ca\. -?\d{1,4}$/.test(w)) { /* omtrentligt årstal */ }
  else if (typeof w === 'string') { if (!/^-?\d{1,4}-\d{2}-\d{2}$/.test(w) || isNaN(Date.parse(w.replace(/^-/, '')))) err(`tidslinje "${t}": ugyldig dato ${w}`); }
  else if (!Number.isInteger(w)) err(`tidslinje "${t}": ugyldigt årstal ${w}`);
  if (img && !exists(img)) err(`tidslinje "${t}": billedet ${img} findes ikke`);
  const k = String(t).toLowerCase().replace(/[^a-zæøå0-9]/g, ''), y = typeof w === 'string' ? w.replace(/^(?:ca\. )?(-?\d+).*/, '$1') : String(w);
  if (tlText.has(k) && tlText.get(k) !== y) err(`tidslinje "${t}": samme begivenhed med forskellige årstal (${tlText.get(k)} / ${y})`);
  tlText.set(k, y);
});

// 5) billeder: alle filer skal have kreditering i tools/billedkilder.json
const credits = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'billedkilder.json'), 'utf8')).map(x => x.fil));
fs.readdirSync(path.join(root, 'billeder')).forEach(f => { if (!credits.has('billeder/' + f)) err(`billeder/${f}: mangler kreditering i tools/billedkilder.json`); });

// 6) genbyg afledte filer
require('./byg-sw.js');
require('./kilder.js');

const n = x => (x || []).length;
console.log(`Temaer: ${n(W.THEMES)} · roulettekort: ${n(W.KRANS)} · tidslinjekort: ${n(W.TL)} · tidsmærkater: ${Object.values(W.ASOF || {}).flat().length}`);
warns.forEach(w => console.log('ADVARSEL', w));
errors.forEach(e => console.log('FEJL', e));
console.log(errors.length ? `${errors.length} fejl` : 'Ingen fejl');
process.exit(errors.length ? 1 : 0);
