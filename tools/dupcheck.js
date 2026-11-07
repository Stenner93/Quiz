// Finder næsten-dubletter i og på tværs af temaer og de almene spørgsmål.
// Brug: node tools/dupcheck.js [tema-id ...]   (uden argumenter: alle)
const fs = require('fs'), path = require('path');
global.window = {};
const root = path.join(__dirname, '..');
for (const f of fs.readdirSync(path.join(root, 'themes'))) require(path.join(root, 'themes', f));
const STOP = new Set('hvad hvilken hvilket hvilke hvem hvor hvornår hvordan hvorfor er var blev har den det de en et i på af til med som om og for fra ved der at kaldes hed hedder står ca mest første år dansk danske danmarks'.split(' '));
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
const items = [];
for (const t of window.THEMES) t.questions.forEach(q => items.push({ th: t.id, q: q[1], a: q[2], tok: new Set(norm(q[1] + ' ' + q[2])), qt: new Set(norm(q[1])) }));
try { require(path.join(root, 'questions.js')); } catch (e) {}
const only = process.argv.slice(2);
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const out = [];
for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
  const A = items[i], B = items[j];
  if (only.length && !only.includes(A.th) && !only.includes(B.th)) continue;
  const s = Math.max(jac(A.tok, B.tok), jac(A.qt, B.qt) * 0.95);
  const sameAns = A.a.toLowerCase().slice(0, 25) === B.a.toLowerCase().slice(0, 25);
  if (s >= 0.6 || (sameAns && s >= 0.4)) out.push([s.toFixed(2), A.th === B.th ? 'SAMME' : 'TVÆRS', A.th + ': ' + A.q + ' => ' + A.a, B.th + ': ' + B.q + ' => ' + B.a]);
}
out.sort((a, b) => b[0] - a[0]);
for (const o of out) console.log(o[0], o[1], '\n   ' + o[2] + '\n   ' + o[3]);
console.error(out.length + ' mulige dubletter');
