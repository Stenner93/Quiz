'use strict';
/* =========================================================
   Stjernejagt – quiz-brætspil
   ========================================================= */

const CATS = [
  { name: 'Geografi',            color: '#2f7fe0', word: 'blå' },
  { name: 'Underholdning',       color: '#e0407f', word: 'pink' },
  { name: 'Historie',            color: '#f2c230', word: 'gul' },
  { name: 'Kunst & litteratur',  color: '#8b46b0', word: 'lilla' },
  { name: 'Naturvidenskab',      color: '#2fa35a', word: 'grøn' },
  { name: 'Sport & fritid',      color: '#f0882e', word: 'orange' },
];
const PCOL = ['#ffffff', '#222a38', '#e5484d', '#19b5a5', '#9a6a2f', '#9aa6b8'];
const MAXP = 6;

/* ---------- Brættet: en ring med 48 felter ---------- */
const N = 48;
const STAR_AT = { 4: 0, 12: 1, 20: 2, 28: 3, 36: 4, 44: 5 }; // stjernefelter
const AGAIN = [8, 16, 24, 32, 40];                          // slå igen
const PERM = [0, 3, 1, 4, 2, 5];
const FIELDS = (() => {
  const f = []; let k = 0;
  for (let i = 0; i < N; i++) {
    if (i === 0) f.push({ type: 'crown' });
    else if (i in STAR_AT) f.push({ type: 'star', cat: STAR_AT[i] });
    else if (AGAIN.includes(i)) f.push({ type: 'again' });
    else { f.push({ type: 'cat', cat: PERM[k % 6] }); k++; }
  }
  return f;
})();

/* ---------- Lager ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const K_GAME = 'sj_game', K_SET = 'sj_settings', K_SEEN = 'sj_seen', K_IMP = 'sj_imported';

let settings = store.get(K_SET, { source: 'app', names: ['Spiller 1', 'Spiller 2'] });
let S = null;          // spiltilstand
let undoStack = [];
let busy = false;

/* ---------- Spørgsmål ---------- */
function allQuestions() {
  const b = (window.BUILTIN_QUESTIONS || []).map((q, i) => ({ id: 'b' + i, c: q[0], q: q[1], a: q[2] }));
  const imp = store.get(K_IMP, []).map((q, i) => ({ id: 'i' + i + '_' + hash(q.q), c: q.c, q: q.q, a: q.a }));
  return b.concat(imp);
}
function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return (h >>> 0).toString(36); }
function pickQuestion(cat) {
  const pool = allQuestions().filter(q => q.c === cat);
  if (!pool.length) return null;
  const seen = store.get(K_SEEN, {});
  let fresh = pool.filter(q => !seen[q.id]);
  if (!fresh.length) { // alle brugt – start forfra i denne kategori
    pool.forEach(q => delete seen[q.id]);
    fresh = pool;
  }
  const q = fresh[Math.floor(Math.random() * fresh.length)];
  seen[q.id] = 1; store.set(K_SEEN, seen);
  return q;
}

/* ---------- Hjælpere ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cur = () => S.players[S.current];
const hasAll = p => p.stars.every(Boolean);
const catSw = c => `<span class="sw" style="background:${CATS[c].color}"></span>`;

function save() { if (S) store.set(K_GAME, S); }
function snapshot() { undoStack.push(JSON.stringify(S)); if (undoStack.length > 60) undoStack.shift(); }
function undo() {
  if (busy || !undoStack.length) return;
  S = JSON.parse(undoStack.pop());
  save(); closeModal(); render(); showPhaseModal();
}

/* =========================================================
   OPSÆTNING
   ========================================================= */
function renderSetup() {
  const pl = $('#plist'); pl.innerHTML = '';
  settings.names.forEach((n, i) => {
    const row = document.createElement('div'); row.className = 'prow';
    row.innerHTML = `<span class="dot" style="background:${PCOL[i]}"></span>
      <input value="${esc(n)}" maxlength="24" placeholder="Navn på spiller/hold ${i + 1}">
      <button class="x" title="Fjern" ${settings.names.length <= 2 ? 'disabled' : ''}>✕</button>`;
    row.querySelector('input').addEventListener('input', e => { settings.names[i] = e.target.value; store.set(K_SET, settings); });
    row.querySelector('.x').addEventListener('click', () => { settings.names.splice(i, 1); store.set(K_SET, settings); renderSetup(); });
    pl.appendChild(row);
  });
  $('#addP').disabled = settings.names.length >= MAXP;
  document.querySelectorAll('#srcSeg button').forEach(b => b.classList.toggle('on', b.dataset.src === settings.source));
  $('#srcHint').textContent = settings.source === 'app'
    ? 'Appen viser spørgsmål og svar. Du kan altid skifte til et fysisk kort undervejs.'
    : 'Appen viser kun kategori og farve – I læser spørgsmålet op fra jeres egne kort. Du kan altid skifte til app-spørgsmål undervejs.';
  const all = allQuestions(), imp = store.get(K_IMP, []).length;
  const counts = CATS.map((c, i) => `${c.name}: ${all.filter(q => q.c === i).length}`).join(' · ');
  $('#qinfo').textContent = `${all.length} spørgsmål i appen (${imp} importerede). ${counts}`;
  const saved = store.get(K_GAME, null);
  $('#resumeBox').classList.toggle('hidden', !(saved && saved.phase !== 'over'));
}

function startGame() {
  const names = settings.names.map((n, i) => n.trim() || `Spiller ${i + 1}`);
  S = {
    players: names.map((name, i) => ({ name, color: PCOL[i], pos: 0, stars: [false, false, false, false, false, false] })),
    current: 0, phase: 'roll', roll: null, targets: [], q: null, pickFor: null,
    msg: `Velkommen! ${names[0]} starter.`, winner: null,
  };
  undoStack = []; save(); showGame();
}

function showGame() {
  $('#setup').classList.add('hidden'); $('#game').classList.remove('hidden');
  buildBoard(); render(); keepAwake();
  if (S.phase === 'question' || S.phase === 'pick' || S.phase === 'over') showPhaseModal();
  if (S.phase === 'moving') { S.phase = 'roll'; render(); }
}
function showSetup() {
  closeModal(); $('#game').classList.add('hidden'); $('#setup').classList.remove('hidden'); renderSetup();
}

/* =========================================================
   BRÆT
   ========================================================= */
const CX = 500, CY = 500, STEP = 360 / N;
const ang = i => (-90 + i * STEP) * Math.PI / 180;
const pt = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
function sector(r1, r2, a1, a2) {
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  const f = n => n.toFixed(1);
  return `M${f(x1)},${f(y1)}A${r2},${r2} 0 0 1 ${f(x2)},${f(y2)}L${f(x3)},${f(y3)}A${r1},${r1} 0 0 0 ${f(x4)},${f(y4)}Z`;
}
function fieldColor(f) {
  if (f.type === 'crown') return 'url(#gold)';
  if (f.type === 'again') return '#d8d2c0';
  return CATS[f.cat].color;
}
function buildBoard() {
  const svg = $('#board');
  const half = STEP / 2 * Math.PI / 180;
  let h = `<defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1d3366"/><stop offset="1" stop-color="#101d3b"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc93"/><stop offset="1" stop-color="#b98d35"/></linearGradient>
  </defs>
  <circle cx="500" cy="500" r="498" fill="#0b1328"/>
  <circle cx="500" cy="500" r="345" fill="url(#bgGrad)" stroke="#e8c06a" stroke-width="3"/>
  <circle cx="500" cy="500" r="335" fill="none" stroke="#e8c06a" stroke-width="1" opacity=".5"/>`;
  for (let i = 0; i < N; i++) {
    const f = FIELDS[i], a = ang(i);
    const big = f.type === 'star' || f.type === 'crown';
    const r1 = big ? 350 : 362, r2 = big ? 496 : 482;
    const g = big ? 0.004 : 0.012;
    h += `<path class="cell" data-i="${i}" d="${sector(r1, r2, a - half + g, a + half - g)}" fill="${fieldColor(f)}"/>`;
    const [lx, ly] = pt((r1 + r2) / 2, a);
    if (f.type === 'star') h += `<text class="cell-lbl" x="${lx}" y="${ly}" font-size="44" fill="#fff" stroke="#0b1328" stroke-width="2">★</text>`;
    if (f.type === 'crown') h += `<text class="cell-lbl" x="${lx}" y="${ly}" font-size="44" fill="#3a2a05">♛</text>`;
    if (f.type === 'again') h += `<text class="cell-lbl" x="${lx}" y="${ly}" font-size="34" fill="#4a4535">↻</text>`;
  }
  h += `<g id="tokens"></g>`;
  svg.innerHTML = h;
  svg.querySelectorAll('.cell').forEach(c => c.addEventListener('click', () => chooseTarget(+c.dataset.i)));
}
function tokenSVG(p, extra = '') {
  let w = '';
  for (let c = 0; c < 6; c++) {
    const a1 = (-90 + c * 60) * Math.PI / 180, a2 = (-90 + (c + 1) * 60) * Math.PI / 180;
    const [x1, y1] = [15 * Math.cos(a1), 15 * Math.sin(a1)], [x2, y2] = [15 * Math.cos(a2), 15 * Math.sin(a2)];
    w += `<path d="M0,0L${x1.toFixed(2)},${y1.toFixed(2)}A15,15 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}Z" fill="${p.stars[c] ? CATS[c].color : 'rgba(0,0,0,.28)'}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
  }
  return `${extra}<circle r="23" fill="${p.color}" stroke="#000" stroke-width="2.5"/>${w}`;
}
function renderTokens() {
  const g = $('#tokens'); if (!g) return;
  const byPos = {};
  S.players.forEach((p, i) => (byPos[p.pos] = byPos[p.pos] || []).push(i));
  let h = '';
  // aktuel spiller tegnes sidst (øverst)
  const order = S.players.map((_, i) => i).filter(i => i !== S.current).concat([S.current]);
  for (const i of order) {
    const p = S.players[i], grp = byPos[p.pos], n = grp.length, j = grp.indexOf(i);
    let [x, y] = pt(423, ang(p.pos));
    if (n > 1) { const a = 2 * Math.PI * j / n - Math.PI / 2; x += 25 * Math.cos(a); y += 25 * Math.sin(a); }
    const isCur = i === S.current;
    h += `<g class="token${isCur ? ' cur' : ''}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      ${tokenSVG(p, isCur ? '<circle class="halo" r="31" fill="none" stroke="#fff" stroke-width="5"/>' : '')}</g>`;
  }
  g.innerHTML = h;
}

/* =========================================================
   VISNING
   ========================================================= */
function dieHTML(n, cls = '') {
  const on = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n] || [];
  const pips = on.map(k => `<circle cx="${25 + (k % 3) * 25}" cy="${25 + Math.floor(k / 3) * 25}" r="8.5" fill="#1b1b1b"/>`).join('');
  return `<div class="die ${cls}" id="die" role="button" aria-label="Terning ${n}"><svg viewBox="0 0 100 100">${pips}</svg></div>`;
}
function render() {
  if (!S) return;
  const p = cur();
  // felter der kan vælges
  document.querySelectorAll('#board .cell').forEach(c => c.classList.toggle('target', S.phase === 'move' && S.targets.some(t => t.pos === +c.dataset.i)));
  renderTokens();
  // midten
  let mid = `<div class="who"><span class="dot" style="background:${p.color}"></span><span class="nm">${esc(p.name)}</span></div>`;
  if (S.phase === 'roll') {
    mid += dieHTML(S.roll || 6, S.roll ? '' : '') + `<button class="btn primary" id="rollBtn">Slå terning</button>`;
  } else if (S.phase === 'move') {
    mid += dieHTML(S.roll, 'idle') + `<div class="hint2">Tryk på et lysende felt</div>`;
  } else {
    mid += dieHTML(S.roll || 6, 'idle');
  }
  mid += `<div class="msg">${esc(S.msg || '')}</div>`;
  $('#center').innerHTML = mid;
  const rb = $('#rollBtn'); if (rb) rb.onclick = () => roll();
  const die = $('#die'); if (die && S.phase === 'roll') die.onclick = () => roll();
  // spillerliste
  $('#players').innerHTML = S.players.map((pl, i) => `
    <div class="pcard${i === S.current ? ' cur' : ''}">
      <svg class="tok" viewBox="-26 -26 52 52">${tokenSVG(pl)}</svg>
      <div style="flex:1;min-width:0"><div class="nm">${esc(pl.name)}</div>
      <div class="stars">${CATS.map((c, k) => `<span class="${pl.stars[k] ? 'got' : ''}" style="--c:${c.color}" title="${c.name}">★</span>`).join('')}</div></div>
    </div>`).join('');
  $('#undoBtn').disabled = busy || !undoStack.length;
  document.querySelectorAll('#manualBtns button').forEach(b => b.disabled = busy || S.phase !== 'roll');
}

/* =========================================================
   SPILLETS GANG
   ========================================================= */
async function roll(value) {
  if (busy || S.phase !== 'roll') return;
  snapshot(); busy = true;
  const final = value || 1 + Math.floor(Math.random() * 6);
  if (!value) {
    for (let k = 0; k < 8; k++) {
      $('#die').outerHTML = dieHTML(1 + Math.floor(Math.random() * 6), 'rolling');
      await sleep(70);
    }
  }
  busy = false;
  S.roll = final;
  computeTargets();
  S.phase = 'move';
  S.msg = hasAll(cur()) ? `Du slog ${final}. Kronen kan nås, hvis du slår mindst afstanden.` : `Du slog ${final}.`;
  save(); render();
}
function computeTargets() {
  const p = cur(), r = S.roll, all = hasAll(p), t = [];
  for (const dir of [1, -1]) {
    let steps = r;
    if (all) {
      const d = dir === 1 ? (N - p.pos) % N : p.pos;
      if (d > 0 && d <= r) steps = d;      // med alle stjerner kan man stoppe på kronen
    }
    const pos = ((p.pos + dir * steps) % N + N) % N;
    if (!t.some(x => x.pos === pos)) t.push({ pos, dir, steps });
  }
  S.targets = t;
}
async function chooseTarget(i) {
  if (busy || !S || S.phase !== 'move') return;
  const t = S.targets.find(x => x.pos === i); if (!t) return;
  snapshot(); busy = true; S.phase = 'moving'; S.targets = []; S.msg = ''; render();
  for (let s = 0; s < t.steps; s++) {
    cur().pos = (cur().pos + t.dir + N) % N;
    renderTokens(); await sleep(150);
  }
  busy = false;
  land();
}
function land() {
  const p = cur(), f = FIELDS[p.pos];
  if (f.type === 'again') { S.phase = 'roll'; S.msg = 'Slå igen!'; }
  else if (f.type === 'crown') {
    S.phase = 'pick';
    S.pickFor = hasAll(p) ? 'final' : 'joker';
  }
  else if (f.type === 'star') ask(f.cat, p.stars[f.cat] ? 'normal' : 'star');
  else ask(f.cat, 'normal');
  save(); render(); showPhaseModal();
}
function ask(cat, kind) {
  S.q = { cat, kind, source: settings.source, revealed: false, item: null, note: '' };
  if (S.q.source === 'app') loadAppQuestion();
  S.phase = 'question';
}
function loadAppQuestion() {
  const q = pickQuestion(S.q.cat);
  if (q) { S.q.source = 'app'; S.q.item = { q: q.q, a: q.a }; S.q.revealed = false; S.q.note = ''; }
  else { S.q.source = 'card'; S.q.note = 'Der er ingen app-spørgsmål i denne kategori – brug et kort.'; }
}
function answer(correct) {
  if (!S.q) return;
  snapshot();
  const p = cur(), q = S.q; S.q = null;
  if (correct) {
    if (q.kind === 'final') {
      S.winner = S.current; S.phase = 'over'; S.msg = `${p.name} har vundet!`;
      save(); render(); showPhaseModal(); return;
    }
    if (q.kind === 'star') {
      p.stars[q.cat] = true;
      S.msg = hasAll(p) ? `★ Alle seks stjerner! Gå mod kronen ♛ for at vinde.` : `Rigtigt! ★ ${CATS[q.cat].name}-stjernen er i hus. Slå igen.`;
    } else S.msg = 'Rigtigt! Slå igen.';
    S.phase = 'roll';
  } else {
    S.current = (S.current + 1) % S.players.length;
    S.phase = 'roll';
    S.msg = `Forkert. Turen går til ${cur().name}.`;
  }
  S.roll = null; save(); closeModal(); render();
}

/* =========================================================
   MODALER
   ========================================================= */
function openModal(html) { $('#mbox').innerHTML = html; $('#modal').classList.remove('hidden'); $('#mbox').scrollTop = 0; }
function closeModal() { $('#modal').classList.add('hidden'); $('#mbox').innerHTML = ''; }

function showPhaseModal() {
  if (S.phase === 'pick') return showPick();
  if (S.phase === 'question') return showQuestion();
  if (S.phase === 'over') return showWin();
}
function showPick() {
  const p = cur(), fin = S.pickFor === 'final';
  openModal(`<div class="qbody">
    <div class="mtitle">${fin ? '♛ Finalen!' : '♛ Kronefeltet'}</div>
    <div class="mtext">${fin
      ? `<b>${esc(p.name)}</b> har alle seks stjerner. <b>Modspillerne</b> vælger kategorien til det afgørende spørgsmål.`
      : `<b>${esc(p.name)}</b> må selv vælge kategori.`}</div>
    <div class="catgrid">${CATS.map((c, i) => `<button data-c="${i}" style="background:${c.color}">${c.name}</button>`).join('')}</div>
  </div>`);
  document.querySelectorAll('.catgrid button').forEach(b => b.onclick = () => {
    snapshot(); ask(+b.dataset.c, fin ? 'final' : 'normal'); save(); render(); showQuestion();
  });
}
function showQuestion() {
  const q = S.q, c = CATS[q.cat], p = cur();
  const tag = q.kind === 'final' ? '♛ Finalespørgsmål' : q.kind === 'star' ? '★ Stjernespørgsmål' : '';
  let body;
  if (q.source === 'app') {
    body = `<div class="qtext">${esc(q.item.q)}</div>
      ${q.revealed
        ? `<div class="qans"><b>Svar</b>${esc(q.item.a)}</div>
           <div class="qbtns"><button class="btn bad" id="noBtn">✗ Forkert</button><button class="btn ok" id="yesBtn">✓ Rigtigt</button></div>`
        : `<button class="btn primary big" id="revBtn">Vis svar</button>`}
      <div class="row center"><button class="btn link" id="swBtn">Brug et fysisk kort i stedet</button>
      ${q.revealed ? '' : '<button class="btn link" id="skipBtn">Nyt spørgsmål</button>'}</div>`;
  } else {
    body = `${q.note ? `<div class="mtext">${esc(q.note)}</div>` : ''}
      <div class="qcard">Tag et kort og læs <b>${catSw(q.cat)}${c.name}</b>-spørgsmålet (${c.word}) op for <b>${esc(p.name)}</b>.</div>
      <div class="qbtns"><button class="btn bad" id="noBtn">✗ Forkert</button><button class="btn ok" id="yesBtn">✓ Rigtigt</button></div>
      <div class="row center"><button class="btn link" id="swBtn">Brug app-spørgsmål i stedet</button></div>`;
  }
  openModal(`<div class="qhead" style="background:${c.color}">${c.name}<span class="tag">${esc(p.name)}${tag ? ' · ' + tag : ''}</span></div>
    <div class="qbody">${body}</div>`);
  const on = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  on('revBtn', () => { S.q.revealed = true; save(); showQuestion(); });
  on('yesBtn', () => answer(true));
  on('noBtn', () => answer(false));
  on('skipBtn', () => { loadAppQuestion(); save(); showQuestion(); });
  on('swBtn', () => {
    if (S.q.source === 'app') { S.q.source = 'card'; S.q.note = ''; } else loadAppQuestion();
    save(); showQuestion();
  });
}
function showWin() {
  const p = S.players[S.winner];
  openModal(`<div class="win">
    <div class="big-star">★</div>
    <div class="mtitle">${esc(p.name)} har vundet!</div>
    <p class="mtext" style="margin:10px 0 24px">Alle seks stjerner og det rigtige svar på finalespørgsmålet.</p>
    <div class="row center"><button class="btn primary big" id="againBtn">Nyt spil, samme spillere</button><button class="btn big" id="toMenu">Til menu</button></div>
  </div>`);
  $('#againBtn').onclick = () => { closeModal(); startGame(); };
  $('#toMenu').onclick = () => { store.del(K_GAME); showSetup(); };
}
function showMenu() {
  openModal(`<div class="qbody">
    <div class="mtitle">Menu</div>
    <div class="mtext">Spørgsmålskilde for resten af spillet:</div>
    <div class="row"><button class="btn ${settings.source === 'app' ? 'primary' : ''}" data-src="app">Spørgsmål i appen</button>
    <button class="btn ${settings.source === 'card' ? 'primary' : ''}" data-src="card">Fysiske kort</button></div>
    <div class="row"><button class="btn" id="mFs">Fuld skærm</button><button class="btn" id="mSetup">Afslut til startskærm (spillet gemmes)</button></div>
    <div class="row"><button class="btn primary big" id="mClose">Tilbage til spillet</button></div>
  </div>`);
  document.querySelectorAll('#mbox [data-src]').forEach(b => b.onclick = () => { settings.source = b.dataset.src; store.set(K_SET, settings); showMenu(); });
  $('#mFs').onclick = goFullscreen;
  $('#mSetup').onclick = showSetup;
  $('#mClose').onclick = () => { closeModal(); if (S.phase !== 'roll' && S.phase !== 'move') showPhaseModal(); };
}
function showRules() {
  openModal(`<div class="qbody rules">
    <div class="mtitle">Regler</div>
    <h3>Mål</h3>
    <p>Saml en stjerne i hver af de seks kategorier, kom tilbage til kronefeltet ♛ og svar rigtigt på finalespørgsmålet.</p>
    <h3>Kategorier</h3>
    <ul>${CATS.map((c, i) => `<li>${catSw(i)}<b>${c.name}</b> (${c.word})</li>`).join('')}</ul>
    <h3>En tur</h3>
    <ul>
      <li>Alle starter på kronefeltet ♛ øverst.</li>
      <li>Slå med terningen (i appen, eller med en rigtig terning og tryk på tallet). Ryk præcis det antal felter – med eller mod uret. Tryk på det lysende felt.</li>
      <li>Du får et spørgsmål i feltets farve. Svarer du <b>rigtigt</b>, slår du igen. Svarer du <b>forkert</b>, går turen videre.</li>
      <li><b>★ Stjernefelter</b> (de store felter): svar rigtigt og få kategoriens stjerne.</li>
      <li><b>↻ Slå igen</b>: slå en gang til.</li>
      <li><b>♛ Kronefeltet</b>: vælg selv kategori.</li>
    </ul>
    <h3>Finalen</h3>
    <ul>
      <li>Når du har alle seks stjerner, går du mod kronen. Du må stoppe på kronen, hvis dit slag er mindst lige så stort som afstanden.</li>
      <li>Modspillerne vælger kategorien. Rigtigt svar = sejr. Forkert svar = turen går videre, og du må prøve at komme tilbage.</li>
    </ul>
    <h3>Spørgsmål</h3>
    <ul>
      <li>Vælg mellem spørgsmål i appen og jeres egne fysiske kort. Du kan skifte ved hvert spørgsmål.</li>
      <li>Trykkede du forkert? Brug <b>↶ Fortryd</b>.</li>
    </ul>
    <div class="row center" style="margin-top:10px"><button class="btn primary big" id="rClose">Luk</button></div>
  </div>`);
  $('#rClose').onclick = () => { closeModal(); if (S && !$('#game').classList.contains('hidden') && ['pick', 'question', 'over'].includes(S.phase)) showPhaseModal(); };
}

/* =========================================================
   IMPORT AF SPØRGSMÅL
   ========================================================= */
function catFromText(t) {
  const s = String(t || '').trim().toLowerCase();
  if (/^[1-6]$/.test(s)) return +s - 1;
  const map = [
    ['geo', 'blå', 'blaa', 'blue'],
    ['under', 'pink', 'lyserød', 'rosa', 'entertain'],
    ['hist', 'gul', 'yellow'],
    ['kunst', 'litt', 'lilla', 'purple', 'violet', 'brun', 'art'],
    ['natur', 'viden', 'grøn', 'groen', 'green', 'science'],
    ['sport', 'fritid', 'orange'],
  ];
  for (let i = 0; i < 6; i++) if (map[i].some(k => s.startsWith(k) || s.includes(k))) return i;
  return -1;
}
function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || '';
  const sep = first.includes('\t') ? '\t' : (first.split(';').length >= first.split(',').length ? ';' : ',');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function importText(text, filename) {
  let items = [];
  if (/\.json$/i.test(filename) || /^\s*[\[{]/.test(text)) {
    let d = JSON.parse(text); if (!Array.isArray(d)) d = d.questions || [];
    items = d.map(o => Array.isArray(o) ? { c: catFromText(o[0]), q: o[1], a: o[2] }
      : { c: catFromText(o.kategori ?? o.category ?? o.farve ?? o.c), q: o.spørgsmål ?? o.spoergsmaal ?? o.question ?? o.q, a: o.svar ?? o.answer ?? o.a });
  } else {
    items = parseCSV(text).filter(r => r.length >= 3).map(r => ({ c: catFromText(r[0]), q: r[1], a: r[2] }));
  }
  const ok = items.filter(x => x.c >= 0 && x.q && x.a && String(x.q).trim()).map(x => ({ c: x.c, q: String(x.q).trim(), a: String(x.a).trim() }));
  const skipped = items.length - ok.length;
  store.set(K_IMP, store.get(K_IMP, []).concat(ok));
  alert(`${ok.length} spørgsmål importeret.` + (skipped ? ` ${skipped} linjer blev sprunget over (fx overskrift eller ukendt kategori).` : ''));
  renderSetup();
}

/* =========================================================
   DIVERSE
   ========================================================= */
function goFullscreen() {
  const d = document.documentElement;
  if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {});
}
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); } } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S && !$('#game').classList.contains('hidden')) keepAwake(); });

function init() {
  $('#addP').onclick = () => { if (settings.names.length < MAXP) { settings.names.push(`Spiller ${settings.names.length + 1}`); store.set(K_SET, settings); renderSetup(); } };
  $('#shuffleP').onclick = () => { const a = settings.names; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } store.set(K_SET, settings); renderSetup(); };
  document.querySelectorAll('#srcSeg button').forEach(b => b.onclick = () => { settings.source = b.dataset.src; store.set(K_SET, settings); renderSetup(); });
  $('#startBtn').onclick = () => {
    const saved = store.get(K_GAME, null);
    if (saved && saved.phase !== 'over' && !confirm('Starte et nyt spil? Det gemte spil overskrives.')) return;
    startGame();
  };
  $('#resumeBtn').onclick = () => { S = store.get(K_GAME, null); undoStack = []; if (S) showGame(); };
  $('#rulesBtn').onclick = showRules; $('#rules2Btn').onclick = showRules;
  $('#fsBtn').onclick = goFullscreen;
  $('#menuBtn').onclick = showMenu;
  $('#undoBtn').onclick = undo;
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { importText(r.result, file.name); } catch (err) { alert('Kunne ikke læse filen: ' + err.message); } e.target.value = ''; };
    r.readAsText(file, 'utf-8');
  };
  $('#clearImp').onclick = () => { if (confirm('Slet alle importerede spørgsmål?')) { store.del(K_IMP); renderSetup(); } };
  $('#resetSeen').onclick = () => { store.del(K_SEEN); alert('Alle spørgsmål kan nu komme igen.'); };
  $('#manualBtns').innerHTML = [1, 2, 3, 4, 5, 6].map(n => `<button data-n="${n}">${n}</button>`).join('');
  document.querySelectorAll('#manualBtns button').forEach(b => b.onclick = () => roll(+b.dataset.n));
  renderSetup();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
