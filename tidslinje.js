'use strict';
/* =========================================================
   TIDSLINJE – placer begivenheder i den rigtige rækkefølge.
   Kort ligger i kort/tidslinje.js som window.TL = [[sæt, begivenhed, tidspunkt], ...]
   tidspunkt: årstal (negativt = f.Kr.) eller dato 'ÅÅÅÅ-MM-DD'.
   Regler: hver spiller har en hånd af kort. På sin tur lægger man et kort ind i tidslinjen.
   Rigtigt = kortet bliver liggende. Forkert = kortet smides væk, og man trækker et nyt.
   Først til at tømme hånden vinder (runden spilles færdig; står flere lige, går de videre i omspil).
   ========================================================= */
const K_TL = 'tl_game', K_TLSET = 'tl_settings';
let TLG = null, tlUndo = [];
const TL_MON = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];

const tlCards = () => (window.TL || []).map(([set, t, w]) => ({ id: 't' + hash(set + '|' + t + '|' + w), set, t, w }));
const tlById = id => tlCards().find(c => c.id === id);
const TL_SETS = () => {
  const all = tlCards();
  const base = [{ id: 'alm', name: 'Almen viden' }].concat((window.THEMES || []).map(t => ({ id: t.id, name: t.name })));
  return base.map(s => ({ ...s, n: all.filter(c => c.set === s.id).length })).filter(s => s.n > 0);
};
// tidspunkt -> [år, måned, dag]  (måned/dag = 0, når kun året kendes)
const tlKey = w => typeof w === 'string' ? w.split('-').map(Number) : [w, 0, 0];
function tlCmp(a, b) {
  const x = tlKey(a.w), y = tlKey(b.w);
  if (x[0] !== y[0]) return x[0] - y[0];
  if (!x[1] || !y[1]) return 0;                       // samme år og mindst ét kort uden dato: tæller som samtidigt
  return x[1] !== y[1] ? x[1] - y[1] : x[2] - y[2];
}
function tlFmt(w) {
  if (typeof w === 'string') { const [y, m, d] = tlKey(w); return `${d}. ${TL_MON[m - 1]} ${y}`; }
  return w < 0 ? `${-w} f.Kr.` : String(w);
}
const tlSave = () => store.set(K_TL, TLG);
const tlSnap = () => { tlUndo.push(JSON.stringify(TLG)); if (tlUndo.length > 60) tlUndo.shift(); };

/* ---------- opsætning ---------- */
function tlSetup() {
  document.body.classList.remove('tlflip');
  const sets = TL_SETS();
  const st = Object.assign({ sets: ['alm'], hand: 4, flip: true, sides: [] }, store.get(K_TLSET, {}));
  st.sets = st.sets.filter(id => sets.some(s => s.id === id));
  if (!st.sets.length) st.sets = ['alm'];
  const side = i => st.sides[i] || (i % 2 ? 'up' : 'down');
  const draw = () => {
    const hidden = store.get(K_HIDE, {});
    const pn = () => settings.names.map((n, i) => n.trim() || `Spiller ${i + 1}`);
    const total = tlCards().filter(c => st.sets.includes(c.set) && !hidden[c.id]).length;
    const need = pn().length * st.hand + 12;
    $('#tlSetupBody').innerHTML = `
      <div class="card"><p class="intro">Hver spiller får ${st.hand} begivenheder. På skift lægger I en af dem ind i tidslinjen – før, efter eller mellem de kort, der ligger der.
        Rigtigt: kortet bliver liggende. Forkert: kortet smides væk, og du trækker et nyt. Først til at tømme hånden vinder.</p></div>
      <div class="card"><h2>Spillere / hold</h2><div id="tlPl"></div></div>
      <div class="card"><h2>Hvilke kort skal med?</h2>
        <div class="krsets">${sets.map(s => `<button class="krset ${st.sets.includes(s.id) ? 'on' : ''}" data-id="${s.id}">${esc(s.name)} <small>${s.n}</small></button>`).join('')}</div>
        <div class="row"><button class="btn" id="tlAll">Vælg alle</button><button class="btn" id="tlNone">Fravælg alle</button></div>
        <p class="hint">${total} kort valgt${total < need ? ` – vælg flere emner (mindst ${need} kort til ${pn().length} spillere)` : ''}</p></div>
      <div class="card"><h2>Kort på hånden</h2>
        <div class="seg" id="tlHandSeg">${[3, 4, 5, 6].map(n => `<button data-n="${n}" class="${st.hand === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="card"><h2>Vend skærmen mod den, der har tur</h2>
        <div class="seg" id="tlFlipSeg"><button data-f="1" class="${st.flip ? 'on' : ''}">Til</button><button data-f="0" class="${st.flip ? '' : 'on'}">Fra</button></div>
        ${st.flip ? `<p class="hint">Hvor sidder spillerne? ⬇ = den side, hvor skærmen vender rigtigt nu · ⬆ = overfor. Tryk for at skifte.</p>
        <div class="krsides">${pn().map((n, i) => `<button class="krside" data-i="${i}"><span class="dot" style="background:${PCOL[i]}"></span>${esc(n)} <b>${side(i) === 'up' ? '⬆ overfor' : '⬇ her'}</b></button>`).join('')}</div>` : ''}</div>
      <div class="row center"><button class="btn primary big" id="tlGo" ${total >= need ? '' : 'disabled'}>Start Tidslinje</button>
        <button class="btn big" id="tlRules0">Regler</button></div>`;
    renderPlayers($('#tlPl'), draw);
    document.querySelectorAll('#tlSetupBody .krset').forEach(b => b.onclick = () => {
      const id = b.dataset.id; st.sets = st.sets.includes(id) ? st.sets.filter(x => x !== id) : st.sets.concat(id); draw();
    });
    document.querySelectorAll('#tlHandSeg button').forEach(b => b.onclick = () => { st.hand = +b.dataset.n; draw(); });
    document.querySelectorAll('#tlFlipSeg button').forEach(b => b.onclick = () => { st.flip = b.dataset.f === '1'; draw(); });
    document.querySelectorAll('#tlSetupBody .krside').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; st.sides = pn().map((_, k) => side(k)); st.sides[i] = side(i) === 'up' ? 'down' : 'up'; draw();
    });
    $('#tlAll').onclick = () => { st.sets = sets.map(s => s.id); draw(); };
    $('#tlNone').onclick = () => { st.sets = []; draw(); };
    $('#tlRules0').onclick = tlRules;
    $('#tlGo').onclick = () => {
      const saved = store.get(K_TL, null);
      if (saved && saved.phase !== 'over' && !confirm('Starte et nyt spil? Det gemte spil Tidslinje overskrives.')) return;
      st.sides = pn().map((_, k) => side(k)); store.set(K_TLSET, st); tlStart(st, pn());
    };
  };
  showScreen('#tlSetup');
  draw();
}

function tlShuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function tlStart(st, names) {
  const hidden = store.get(K_HIDE, {});
  const deck = tlShuffle(tlCards().filter(c => st.sets.includes(c.set) && !hidden[c.id]).map(c => c.id));
  TLG = {
    players: names.map((name, i) => ({ name, color: PCOL[i], hand: [], side: st.sides[i] || (i % 2 ? 'up' : 'down'), out: false, ok: 0 })),
    sets: st.sets, flip: !!st.flip, flipX: false, deck, discard: [], line: [], turn: 0, sel: null, phase: 'play', winner: null, sudden: false, n: 0,
  };
  TLG.line.push(deck.pop());
  TLG.players.forEach(p => { for (let k = 0; k < st.hand; k++) p.hand.push(deck.pop()); });
  tlUndo = []; tlSave(); tlShow();
}
function tlDraw() {
  if (!TLG.deck.length && TLG.discard.length) { TLG.deck = tlShuffle(TLG.discard); TLG.discard = []; }
  return TLG.deck.pop() || null;
}

/* ---------- spillogik ---------- */
const tlActive = () => TLG.players.filter(p => !p.out);
function tlCorrectSlot(card) {               // første hul, hvor kortet passer
  const L = TLG.line.map(tlById);
  for (let i = 0; i <= L.length; i++) {
    const prev = L[i - 1], next = L[i];
    if ((!prev || tlCmp(prev, card) <= 0) && (!next || tlCmp(card, next) <= 0)) return i;
  }
  return L.length;
}
function tlPlace(slot) {
  const p = TLG.players[TLG.turn];
  if (TLG.phase !== 'play' || TLG.sel === null) return;
  tlSnap();
  const id = p.hand[TLG.sel], card = tlById(id);
  const L = TLG.line.map(tlById), prev = L[slot - 1], next = L[slot];
  const ok = (!prev || tlCmp(prev, card) <= 0) && (!next || tlCmp(card, next) <= 0);
  p.hand.splice(TLG.sel, 1); TLG.sel = null; TLG.n++;
  let drew = null;
  if (ok) { TLG.line.splice(slot, 0, id); p.ok++; }
  else { TLG.discard.push(id); drew = tlDraw(); if (drew) p.hand.push(drew); }
  TLG.last = { id, ok, slot: ok ? slot : tlCorrectSlot(card), by: TLG.turn };
  tlSave(); tlRender();
  const wrongTxt = (() => {
    if (ok) return '';
    const i = tlCorrectSlot(card), a = TLG.line[i - 1] && tlById(TLG.line[i - 1]), b = TLG.line[i] && tlById(TLG.line[i]);
    return a && b ? `Den hører til mellem "${esc(a.t)}" og "${esc(b.t)}".` : a ? `Den hører til efter "${esc(a.t)}".` : `Den hører til før "${esc(b.t)}".`;
  })();
  openModal(`<div class="qbody"><div class="mtext"><b>${esc(p.name)}</b> · ${esc(card.t)}</div>
    <div class="qans ${ok ? 'good' : 'wrong'}"><b>Årstal</b>${esc(tlFmt(card.w))}</div>
    <div class="mtitle">${ok ? '✓ Rigtigt – kortet bliver liggende' : '✗ Forkert – kortet smides væk'}</div>
    ${ok ? '' : `<div class="mtext">${wrongTxt}${drew ? ` ${esc(p.name)} trækker et nyt kort.` : ''}</div>`}
    <div class="row center"><button class="btn primary big" id="tlOk">Videre</button></div>
    <div class="row center"><button class="btn link" id="tlFlag">⚑ Markér kortet</button></div></div>`);
  $('#tlOk').onclick = () => { closeModal(); tlAdvance(); };
  $('#tlFlag').onclick = () => tlFlag(card);
}
function tlAdvance() {
  const act = tlActive();
  const order = TLG.players.map((_, i) => i).filter(i => !TLG.players[i].out);
  const pos = order.indexOf(TLG.turn);
  const roundEnd = pos === order.length - 1;            // alle aktive har haft lige mange ture
  if (roundEnd) {
    const empty = act.filter(p => !p.hand.length);
    if (empty.length === 1) { TLG.phase = 'over'; TLG.winner = TLG.players.indexOf(empty[0]); tlSave(); tlRender(); return tlShowEnd(); }
    if (empty.length > 1) {                              // omspil mellem dem, der står lige
      TLG.players.forEach(p => { if (!empty.includes(p)) p.out = true; });
      empty.forEach(p => { const c = tlDraw(); if (c) p.hand.push(c); });
      TLG.sudden = true;
      if (empty.every(p => !p.hand.length)) { TLG.phase = 'over'; TLG.winner = TLG.players.indexOf(empty[0]); tlSave(); tlRender(); return tlShowEnd(); }
      TLG.turn = TLG.players.indexOf(empty[0]); tlSave(); tlRender();
      return openModal(`<div class="qbody"><div class="mtitle">Omspil!</div><div class="mtext">${empty.map(p => esc(p.name)).join(' og ')} tømte hånden i samme runde. De trækker ét kort hver og spiller videre, til kun én tømmer hånden i en runde.</div>
        <div class="row center"><button class="btn primary big" onclick="closeModal()">OK</button></div></div>`);
    }
    if (!TLG.deck.length && !TLG.discard.length) {     // ingen kort tilbage: færrest kort vinder
      const min = Math.min(...act.map(p => p.hand.length));
      TLG.phase = 'over'; TLG.winner = TLG.players.indexOf(act.find(p => p.hand.length === min)); tlSave(); tlRender(); return tlShowEnd();
    }
  }
  TLG.turn = order[(pos + 1) % order.length]; TLG.sel = null;
  tlSave(); tlRender();
}

/* ---------- visning ---------- */
function tlShow() {
  showScreen('#tidslinje');
  keepAwake(); tlRender();
  if (TLG.phase === 'over') tlShowEnd();
}
function tlOrient() {
  const p = TLG.players[TLG.turn];
  document.body.classList.toggle('tlflip', (!!TLG.flip && !!p && p.side === 'up') !== !!TLG.flipX);
}
function tlRender() {
  const p = TLG.players[TLG.turn], play = TLG.phase === 'play', sel = TLG.sel !== null && play;
  const slot = i => `<button class="tlslot ${sel ? 'on' : ''}" data-s="${i}" ${sel ? '' : 'disabled'} aria-label="Placer her">${sel ? '＋' : ''}</button>`;
  const L = TLG.line.map(tlById);
  $('#tlLine').innerHTML = slot(0) + L.map((c, i) => `<div class="tlcard ${TLG.last && TLG.last.ok && TLG.last.id === c.id ? 'new' : ''}">
      <div class="tly">${esc(tlFmt(c.w))}</div><div class="tlt">${esc(c.t)}</div></div>${slot(i + 1)}`).join('');
  $('#tlInfo').innerHTML = play
    ? `<span class="dot" style="background:${p.color}"></span><b>${esc(p.name)}s tur</b> · ${sel ? 'tryk på ＋ der, hvor kortet hører til' : 'vælg et af dine kort'}${TLG.sudden ? ' · <b>omspil</b>' : ''}`
    : 'Spillet er slut';
  $('#tlHand').innerHTML = play ? p.hand.map((id, i) => { const c = tlById(id); return `<button class="tlcard hand ${TLG.sel === i ? 'sel' : ''}" data-i="${i}"><div class="tly">?</div><div class="tlt">${esc(c.t)}</div></button>`; }).join('') : '';
  $('#tlPlayers').innerHTML = TLG.players.map((pl, i) => `<div class="pcard ${i === TLG.turn && play ? 'cur' : ''} ${pl.out ? 'st-out' : ''}">
      <span class="dot" style="background:${pl.color}"></span><span class="nm">${esc(pl.name)}</span>
      <span class="kstat">${pl.out ? 'ude' : pl.hand.length === 1 ? '1 kort' : pl.hand.length + ' kort'}</span><b class="kscore">${pl.ok}</b></div>`).join('')
    + `<p class="hint">Tal = rigtigt placerede kort · ${TLG.deck.length} kort i bunken</p>`;
  document.querySelectorAll('#tlHand .tlcard').forEach(b => b.onclick = () => { TLG.sel = TLG.sel === +b.dataset.i ? null : +b.dataset.i; tlSave(); tlRender(); });
  document.querySelectorAll('.tlslot').forEach(b => b.onclick = () => tlPlace(+b.dataset.s));
  tlOrient();
  const nw = document.querySelector('#tlLine .tlcard.new');
  if (nw) nw.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function tlShowEnd() {
  const w = TLG.players[TLG.winner];
  openModal(`<div class="win"><div class="big-star">⟷</div><div class="mtitle">${esc(w.name)} vinder Tidslinje!</div>
    <div class="mtext">${TLG.players.slice().sort((a, b) => a.hand.length - b.hand.length || b.ok - a.ok).map(p => `${esc(p.name)}: ${p.hand.length} kort tilbage, ${p.ok} rigtige`).join(' · ')}</div>
    <div class="row center" style="margin-top:20px"><button class="btn primary big" id="tlNew">Nyt spil</button><button class="btn big" id="tlHome">Forsiden</button>
      <button class="btn big" id="tlSee">Se tidslinjen</button></div></div>`);
  $('#tlNew').onclick = () => { closeModal(); tlSetup(); };
  $('#tlHome').onclick = tlHome;
  $('#tlSee').onclick = closeModal;
}
function tlFlag(card) {
  const note = prompt('Hvad er galt med kortet? (fx et forkert årstal)');
  if (note === null) return;
  const flags = store.get(K_FLAGS, []);
  const setName = (TL_SETS().find(s => s.id === card.set) || { name: card.set }).name;
  flags.push({ id: card.id, theme: 'Tidslinje', cat: setName, q: card.t, a: tlFmt(card.w), reason: 'wrong', note, ts: new Date().toISOString().slice(0, 16), sent: false });
  store.set(K_FLAGS, flags);
  const hidden = store.get(K_HIDE, {}); hidden[card.id] = 1; store.set(K_HIDE, hidden);
  alert('Tak! Kortet er markeret og kommer ikke med i nye spil. Send rapporten under ⚑ Rapporter, når der er net.');
}
function tlHome() { goHome(); }
function tlRules() {
  openModal(`<div class="qbody rules"><div class="mtitle">Regler for Tidslinje</div>
    <ul>
      <li>Hver spiller får nogle kort med en begivenhed – men uden årstal. Midt på bordet ligger én begivenhed med årstal: starten på tidslinjen.</li>
      <li>På sin tur vælger man et af sine kort og lægger det ind i tidslinjen: før, efter eller mellem de kort, der ligger der.</li>
      <li><b>Rigtigt:</b> kortet vendes og bliver liggende – tidslinjen bliver længere og sværere.</li>
      <li><b>Forkert:</b> kortet smides væk, man ser det rigtige årstal og trækker et nyt kort.</li>
      <li>Har to begivenheder samme årstal, er begge placeringer rigtige. Står der en dato på begge kort, gælder datoen.</li>
      <li>Den første, der tømmer sin hånd, vinder – men runden spilles færdig, så alle får lige mange ture. Tømmer flere hånden i samme runde, trækker de ét kort hver og spiller omspil.</li>
    </ul>
    <div class="row center"><button class="btn primary" onclick="closeModal()">OK</button></div></div>`);
}
function tlMenu() {
  openModal(`<div class="qbody"><div class="mtitle">Menu</div>
    <div class="row center"><button class="btn" id="tlM1">Fortsæt</button><button class="btn" id="tlM2">Regler</button>
      <button class="btn" id="tlM5">⟲ Vend skærmen</button><button class="btn" id="tlM4">Forsiden</button></div></div>`);
  $('#tlM1').onclick = closeModal; $('#tlM2').onclick = tlRules; $('#tlM4').onclick = tlHome;
  $('#tlM5').onclick = () => { TLG.flipX = !TLG.flipX; tlSave(); closeModal(); tlRender(); };
}
function tlInit() {
  $('#tlUndo').onclick = () => { if (!tlUndo.length) return; TLG = JSON.parse(tlUndo.pop()); tlSave(); closeModal(); tlRender(); };
  $('#tlMenu').onclick = tlMenu;
  $('#tlRulesBtn').onclick = tlRules;
}
tlInit();
