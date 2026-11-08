'use strict';
/* =========================================================
   KRANSEN – quiz med 10 svar pr. kort, der går på tværs af temaerne.
   Kort ligger i kort/*.js som window.KRANS.push({...}).
   Kortformat:
     { set:'geografi', q:'Ligger byen i Jylland?', type:'yn'|'open', items:[{t:'Aarhus', a:true}, ...10] }
     – yn:   svaret er ja/nej; spilleren vælger Ja eller Nej, appen dømmer.
     – open: spilleren siger svaret højt; appen viser det rigtige svar, og bordet dømmer ✓/✗.
     – et item kan have shape:'DNK' (landesilhuet fra kort/lande-former.js) eller img:'billeder/x.jpg'.
   ========================================================= */
window.KRANS = window.KRANS || [];
const K_KR = 'kr_game', K_KRSEEN = 'kr_seen', K_KRSET = 'kr_settings';
let KR = null, krUndo = [];

const KR_SETS = () => {
  const base = [{ id: 'alm', name: 'Almen viden' }]
    .concat((window.THEMES || []).map(t => ({ id: t.id, name: t.name })))
    .concat([{ id: 'lande', name: 'Billeder: landes form' }, { id: 'billeder', name: 'Billeder: steder & ting' }]);
  return base.map(s => ({ ...s, n: window.KRANS.filter(c => c.set === s.id).length })).filter(s => s.n > 0);
};
const krCardId = c => 'k' + hash(c.set + c.q + c.items.map(i => i.t || i.shape || i.img).join('|'));
const krSave = () => store.set(K_KR, KR);
const krSnap = () => { krUndo.push(JSON.stringify(KR)); if (krUndo.length > 80) krUndo.shift(); };

/* ---------- opsætning ---------- */
function krSetup() {
  const sets = KR_SETS();
  const st = Object.assign({ sets: sets.map(s => s.id), target: 30 }, store.get(K_KRSET, {}));
  st.sets = st.sets.filter(id => sets.some(s => s.id === id));
  if (!st.sets.length) st.sets = sets.map(s => s.id);
  const draw = () => {
    const total = window.KRANS.filter(c => st.sets.includes(c.set)).length;
    openModal(`<div class="qbody">
      <div class="mtitle">◎ Kransen</div>
      <div class="mtext">Hvert kort har ét spørgsmål og 10 svarmuligheder i en krans. På skift vælger I et svar – eller siger pas.
        Rigtigt = 1 point. Forkert = I mister kortets point og er ude af kortet. Siger I <b>pas</b>, beholder I kortets point. Første til 30 point vinder (standard).</div>
      <h3>Hvilke kort skal med?</h3>
      <div class="krsets">${sets.map(s => `<button class="krset ${st.sets.includes(s.id) ? 'on' : ''}" data-id="${s.id}">${esc(s.name)} <small>${s.n}</small></button>`).join('')}</div>
      <div class="row"><button class="btn" id="krAll">Vælg alle</button><button class="btn" id="krNone">Fravælg alle</button></div>
      <h3>Spil til</h3>
      <div class="seg" id="krTarget">${[15, 20, 30].map(n => `<button data-n="${n}" class="${st.target === n ? 'on' : ''}">${n} point</button>`).join('')}</div>
      <p class="hint" style="color:#6b6250">${total} kort valgt · spillerne fra forsiden: ${settings.names.map(n => esc(n.trim() || '?')).join(', ')}</p>
      <div class="row center"><button class="btn primary big" id="krGo" ${total ? '' : 'disabled'}>Start Kransen</button>
        <button class="btn big" id="krBack">Tilbage</button></div>
    </div>`);
    document.querySelectorAll('.krset').forEach(b => b.onclick = () => {
      const id = b.dataset.id; st.sets = st.sets.includes(id) ? st.sets.filter(x => x !== id) : st.sets.concat(id); draw();
    });
    document.querySelectorAll('#krTarget button').forEach(b => b.onclick = () => { st.target = +b.dataset.n; draw(); });
    $('#krAll').onclick = () => { st.sets = sets.map(s => s.id); draw(); };
    $('#krNone').onclick = () => { st.sets = []; draw(); };
    $('#krBack').onclick = closeModal;
    $('#krGo').onclick = () => { store.set(K_KRSET, st); closeModal(); krStart(st); };
  };
  draw();
}

function krStart(st) {
  const names = settings.names.map((n, i) => n.trim() || `Spiller ${i + 1}`);
  KR = {
    players: names.map((name, i) => ({ name, color: PCOL[i], score: 0, round: 0, status: 'in' })),
    sets: st.sets, target: st.target, starter: 0, turn: 0, card: null, res: {}, phase: 'play', winner: null, n: 0,
  };
  krUndo = []; krNextCard(true); krShow();
}

function krPickCard() {
  const pool = window.KRANS.filter(c => KR.sets.includes(c.set));
  const hidden = store.get(K_HIDE, {});
  const ok = pool.filter(c => !hidden[krCardId(c)]);
  const seen = store.get(K_KRSEEN, {});
  let fresh = ok.filter(c => !seen[krCardId(c)]);
  if (!fresh.length) { ok.forEach(c => delete seen[krCardId(c)]); store.set(K_KRSEEN, seen); fresh = ok; }
  const c = fresh[Math.floor(Math.random() * fresh.length)];
  if (!c) return null;
  seen[krCardId(c)] = 1; store.set(K_KRSEEN, seen);
  // bland svarene, så de ikke altid står samme sted
  const order = c.items.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { id: krCardId(c), set: c.set, q: c.q, type: c.type, kind: krKind(c), items: order.map(i => c.items[i]) };
}

function krNextCard(first) {
  if (!first) KR.starter = (KR.starter + 1) % KR.players.length;
  KR.players.forEach(p => { p.round = 0; p.status = 'in'; });
  KR.card = krPickCard(); KR.res = {}; KR.turn = KR.starter; KR.phase = 'play'; KR.n++;
  krSave();
}

/* ---------- spillogik ---------- */
const krActive = () => KR.players.filter(p => p.status === 'in');
function krAdvance() {
  const done = Object.keys(KR.res).length >= KR.card.items.length;
  if (done) KR.players.forEach(p => { if (p.status === 'in') { p.score += p.round; p.round = 0; p.status = 'pass'; } });
  if (!krActive().length) return krEndCard();
  for (let k = 1; k <= KR.players.length; k++) {
    const i = (KR.turn + k) % KR.players.length;
    if (KR.players[i].status === 'in') { KR.turn = i; break; }
  }
}
function krEndCard() {
  KR.phase = 'cardend';
  const top = Math.max(...KR.players.map(p => p.score));
  if (top >= KR.target) {
    const leaders = KR.players.filter(p => p.score === top);
    if (leaders.length === 1) { KR.phase = 'over'; KR.winner = KR.players.indexOf(leaders[0]); }
  }
}
function krJudge(i, correct, said) {
  krSnap();
  const p = KR.players[KR.turn];
  KR.res[i] = { ok: correct, by: KR.turn, said };
  if (correct) p.round += 1; else { p.round = 0; p.status = 'out'; }
  krAdvance(); krSave(); closeModal(); krRender();
  if (KR.phase !== 'play') krShowEnd();
}
function krPass() {
  if (KR.phase !== 'play') return;
  krSnap();
  const p = KR.players[KR.turn];
  p.score += p.round; p.round = 0; p.status = 'pass';
  krAdvance(); krSave(); krRender();
  if (KR.phase !== 'play') krShowEnd();
}

/* ---------- visning ---------- */
function krItemFace(it, big) {
  if (it.shape && window.SHAPES && SHAPES[it.shape]) {
    const s = SHAPES[it.shape];
    return `<svg class="shape" viewBox="0 0 ${s.w} ${s.h}"><path d="${s.d}"/></svg>`;
  }
  if (it.img) return `<img class="kimg" src="${esc(it.img)}" alt="">`;
  return `<span class="kt">${esc(it.t)}</span>`;
}
const krAnsText = (card, it) => card.type === 'yn' ? (it.a ? '✓' : '✗') : String(it.a);
// Kategori som i reglerne: Sandt/falsk, Nummer, Rækkefølge, Århundrede/årti, Farve eller Diverse
const krKind = c => c.kind || (c.type === 'yn' ? 'Sandt/falsk'
  : c.items.every(it => /^[\d.,\s–-]+$/.test(String(it.a))) ? 'Nummer' : 'Diverse');

function krShow() {
  $('#setup').classList.add('hidden'); $('#game').classList.add('hidden'); $('#kransen').classList.remove('hidden');
  keepAwake(); krRender();
  if (KR.phase !== 'play') krShowEnd();
}
function krRender() {
  const c = KR.card;
  const setName = (KR_SETS().find(s => s.id === c.set) || { name: c.set }).name;
  const p = KR.players[KR.turn];
  const n = c.items.length;
  $('#krRing').innerHTML = c.items.map((it, i) => {
    const a = (-90 + i * 360 / n) * Math.PI / 180;
    const x = 50 + 37.5 * Math.cos(a), y = 50 + 37.5 * Math.sin(a);
    const r = KR.res[i];
    const showAns = r || KR.phase !== 'play';
    const cls = r ? (r.ok ? 'ok' : 'bad') : (KR.phase !== 'play' ? 'rest' : '');
    return `<button class="kitem ${cls} ${it.shape || it.img ? 'pic' : ''}" data-i="${i}" style="left:${x}%;top:${y}%" ${r || KR.phase !== 'play' ? 'disabled' : ''}>
      ${krItemFace(it)}${showAns ? `<span class="ka">${esc(krAnsText(c, it))}</span>` : ''}</button>`;
  }).join('');
  $('#krCenter').innerHTML = `<div class="kset">${esc(setName)} · kort ${KR.n}</div><div class="kkind k-${(c.kind || krKind(c)).replace(/[^a-zA-Z]/g, '')}">${esc(c.kind || krKind(c))}</div>
    <div class="kq">${esc(c.q.replace(/\s\(\d\)$/, ''))}</div>
    ${KR.phase === 'play' ? `<div class="kwho"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}s tur</div>
      <div class="khint">${c.type === 'yn' ? 'Vælg et svar, du mener er sandt – eller sig pas' : 'Vælg et felt og sig svaret højt – eller sig pas'}</div>` : ''}`;
  $('#krPlayers').innerHTML = KR.players.map((pl, i) => `<div class="pcard ${i === KR.turn && KR.phase === 'play' ? 'cur' : ''} st-${pl.status}">
      <span class="dot" style="background:${pl.color}"></span><span class="nm">${esc(pl.name)}</span>
      <span class="kround">${pl.round ? '+' + pl.round : ''}</span>
      <span class="kstat">${pl.status === 'out' ? 'ude' : pl.status === 'pass' ? 'passet' : ''}</span>
      <b class="kscore">${pl.score}</b></div>`).join('') + `<p class="hint">Spil til ${KR.target} point</p>`;
  $('#krPass').disabled = KR.phase !== 'play';
  $('#krPass').textContent = KR.phase === 'play' ? `Pas – ${p.name} gemmer ${p.round} point` : 'Pas';
  document.querySelectorAll('.kitem').forEach(b => b.onclick = () => krAsk(+b.dataset.i));
  krFit();
}
// formindsk teksten i hver boble, til den passer uden at ord bliver klippet
function krFit() {
  document.querySelectorAll('#krRing .kt').forEach(el => {
    let f = parseFloat(getComputedStyle(el.parentNode).fontSize); el.style.fontSize = f + 'px';
    for (let k = 0; k < 30 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && f > 8; k++) { f *= 0.92; el.style.fontSize = f + 'px'; }
  });
}
window.addEventListener('resize', () => { if (KR && !$('#kransen').classList.contains('hidden')) krRender(); });

function krAsk(i) {
  const c = KR.card, it = c.items[i], p = KR.players[KR.turn];
  const face = `<div class="kbig">${krItemFace(it, true)}</div>${it.credit ? `<div class="kcredit">Foto: ${esc(it.credit)}</div>` : ''}`;
  const flag = `<button class="btn link" id="krFlag">⚑ Markér kortet</button>`;
  if (c.type === 'yn') {
    openModal(`<div class="qbody"><div class="mtext"><b>${esc(p.name)}</b> · ${esc(c.q)}</div>${face}
      <div class="mtext">Vælger ${esc(p.name)} dette som et <b>sandt</b> svar?</div>
      <div class="qbtns"><button class="btn" id="krCancel2">Nej, fortryd</button><button class="btn ok" id="krYes">Ja, vælg det</button></div>
      <div class="row center">${flag}</div></div>`);
    $('#krCancel2').onclick = closeModal;
    $('#krYes').onclick = () => {
      const correct = !!it.a;
      openModal(`<div class="qbody"><div class="mtext"><b>${esc(p.name)}</b> · ${esc(c.q)}</div>${face}
        <div class="qans ${correct ? 'good' : 'wrong'}"><b>Svar</b>${correct ? '✓ Sandt' : '✗ Falsk'}${it.note ? ` – ${esc(it.note)}` : ''}</div>
        <div class="mtitle">${correct ? '✓ Rigtigt! +1 point' : `✗ Forkert – ${esc(p.name)} mister kortets point og er ude`}</div>
        <div class="row center"><button class="btn primary big" id="krOk">Videre</button></div></div>`);
      $('#krOk').onclick = () => krJudge(i, correct);
    };
  } else {
    openModal(`<div class="qbody"><div class="mtext"><b>${esc(p.name)}</b> · ${esc(c.q)}</div>${face}
      <div class="mtext">Sig svaret højt – og tryk så "Vis svar".</div>
      <div class="row center"><button class="btn primary big" id="krRev">Vis svar</button></div>
      <div class="row center"><button class="btn link" id="krCancel">Fortryd valget</button>${flag}</div></div>`);
    $('#krRev').onclick = () => {
      openModal(`<div class="qbody"><div class="mtext"><b>${esc(p.name)}</b> · ${esc(c.q)}</div>${face}
        <div class="qans"><b>Svar</b>${esc(String(it.a))}${it.note ? `<small> – ${esc(it.note)}</small>` : ''}</div>
        <div class="qbtns"><button class="btn bad" id="krNo">✗ Forkert</button><button class="btn ok" id="krYes">✓ Rigtigt</button></div></div>`);
      $('#krYes').onclick = () => krJudge(i, true); $('#krNo').onclick = () => krJudge(i, false);
    };
  }
  const cancel = document.getElementById('krCancel'); if (cancel) cancel.onclick = closeModal;
  const fl = document.getElementById('krFlag'); if (fl) fl.onclick = () => krFlag();
}

function krFlag() {
  const c = KR.card;
  const flags = store.get(K_FLAGS, []);
  const note = prompt('Hvad er galt med kortet? (fx et forkert svar)');
  if (note === null) return;
  const setName = (KR_SETS().find(s => s.id === c.set) || { name: c.set }).name;
  flags.push({ id: c.id, theme: 'Kransen', cat: setName, q: c.q, a: c.items.map(it => `${it.t || it.shape || it.img}=${krAnsText(c, it)}`).join('; '),
    reason: 'wrong', note, ts: new Date().toISOString().slice(0, 16), sent: false });
  store.set(K_FLAGS, flags);
  const hidden = store.get(K_HIDE, {}); hidden[c.id] = 1; store.set(K_HIDE, hidden);
  alert('Tak! Kortet er markeret og kommer ikke igen. Send rapporten under ⚑ Rapporter, når der er net.');
}

function krShowEnd() {
  krRender();
  if (KR.phase === 'over') {
    const w = KR.players[KR.winner];
    openModal(`<div class="win"><div class="big-star">◎</div><div class="mtitle">${esc(w.name)} vinder Kransen!</div>
      <div class="mtext">${KR.players.slice().sort((a, b) => b.score - a.score).map(p => `${esc(p.name)}: ${p.score}`).join(' · ')}</div>
      <div class="row center" style="margin-top:20px"><button class="btn primary big" id="krNew">Nyt spil</button><button class="btn big" id="krHome">Forsiden</button></div></div>`);
    $('#krNew').onclick = () => { closeModal(); krSetup(); };
    $('#krHome').onclick = krHome;
    return;
  }
  const lead = KR.players.slice().sort((a, b) => b.score - a.score);
  setTimeout(() => {
    openModal(`<div class="qbody"><div class="mtitle">Kortet er slut</div>
      <div class="mtext">Se de resterende svar i kransen. Stillingen: ${lead.map(p => `<b>${esc(p.name)}</b> ${p.score}`).join(' · ')}</div>
      <div class="row center"><button class="btn primary big" id="krNext">Næste kort</button><button class="btn big" id="krLook">Se kransen</button></div></div>`);
    $('#krNext').onclick = () => { krSnap(); closeModal(); krNextCard(); krRender(); };
    $('#krLook').onclick = () => { closeModal(); $('#krPass').disabled = false; $('#krPass').textContent = 'Næste kort →'; $('#krPass').onclick = () => { $('#krPass').onclick = krPass; krSnap(); krNextCard(); krRender(); }; };
  }, 350);
}
function krHome() { closeModal(); $('#kransen').classList.add('hidden'); $('#setup').classList.remove('hidden'); renderSetup(); }
function krRules() {
  openModal(`<div class="qbody rules"><div class="mtitle">Regler for Kransen</div>
    <ul>
      <li>Hvert kort har et spørgsmål og 10 svarmuligheder i en krans. Spillerne skiftes til at <b>svare</b> eller sige <b>pas</b>.</li>
      <li><b>Sandt/falsk-kort:</b> Kun nogle af de 10 er sande (mindst 4, og der er altid falske imellem). Man må kun vælge et svar, man mener er <b>sandt</b>. Man ved aldrig, hvor mange sande der er – tror man, der kun er falske tilbage, siger man pas.</li>
      <li><b>Nummer, rækkefølge, årti, farve og diverse:</b> Alle 10 felter har et svar. Man vælger et felt, siger svaret højt, og bordet dømmer, når svaret vises.</li>
      <li>Rigtigt svar: 1 point. Man kan fortsætte, næste gang det bliver ens tur.</li>
      <li>Forkert svar: man mister alle point fra dette kort og kan ikke svare mere på kortet. (Point fra tidligere kort beholder man.)</li>
      <li>Pas: man beholder kortets point, men kan ikke svare mere på kortet.</li>
      <li>Kortet slutter, når alle 10 svar er brugt, eller når alle har sagt pas eller er ude. Så lægges pointene sammen.</li>
      <li>Næste kort startes af spilleren efter den, der startede sidst. Standard er at spille til <b>30 point</b> – eller kortere, fx 15.</li>
    </ul>
    <div class="row center"><button class="btn primary" onclick="closeModal()">OK</button></div></div>`);
}
function krMenu() {
  openModal(`<div class="qbody"><div class="mtitle">Menu</div>
    <div class="row center">
      <button class="btn" id="krM1">Fortsæt</button><button class="btn" id="krM2">Regler</button>
      <button class="btn" id="krM3">Spring kortet over</button><button class="btn" id="krM4">Forsiden</button></div></div>`);
  $('#krM1').onclick = closeModal; $('#krM2').onclick = krRules; $('#krM4').onclick = krHome;
  $('#krM3').onclick = () => { krSnap(); KR.players.forEach(p => { p.round = 0; }); closeModal(); krNextCard(); krRender(); };
}
function krInit() {
  $('#krStartBtn').onclick = () => {
    const saved = store.get(K_KR, null);
    if (saved && saved.phase !== 'over' && confirm('Fortsæt det gemte Kransen-spil? (Annuller = start nyt)')) { KR = saved; krUndo = []; krShow(); return; }
    krSetup();
  };
  $('#krPass').onclick = krPass;
  $('#krUndo').onclick = () => { if (!krUndo.length) return; KR = JSON.parse(krUndo.pop()); krSave(); closeModal(); krRender(); };
  $('#krMenu').onclick = krMenu;
  $('#krRulesBtn').onclick = krRules;
}
krInit();
