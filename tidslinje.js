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
let TLG = null, tlUndo = [], tlGhost = null;   // tlGhost: forkert kort, der kort vises på sin rigtige plads
const TL_MON = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];

// kortene bygges én gang; opslag sker via et register (hurtigt, også med mange kort)
let TL_CACHE = null, TL_MAP = null;
const tlCards = () => {
  if (!TL_CACHE) {
    TL_CACHE = (window.TL || []).map(([set, t, w, img]) => ({ id: 't' + hash(set + '|' + t + '|' + w), set, t, w, img }));
    TL_MAP = new Map(TL_CACHE.map(c => [c.id, c]));
  }
  return TL_CACHE;
};
const tlById = id => { tlCards(); return TL_MAP.get(id); };
// samme begivenhed kan ligge i flere emner – i et spil må den kun være med én gang
const tlKeyText = c => c.t.toLowerCase().replace(/[^a-zæøå0-9]/g, '');
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
  const st = Object.assign({ sets: ['alm'], hand: 4, rounds: 3, flip: true }, store.get(K_TLSET, {}));
  st.sets = st.sets.filter(id => sets.some(s => s.id === id));
  if (!st.sets.length) st.sets = ['alm'];
  const draw = () => {
    const hidden = store.get(K_HIDE, {});
    const pn = () => settings.names.map((n, i) => n.trim() || `Spiller ${i + 1}`);
    const total = new Set(tlCards().filter(c => st.sets.includes(c.set) && !hidden[c.id]).map(tlKeyText)).size;
    const need = pn().length * st.hand + 16;
    $('#tlSetupBody').innerHTML = `
      <div class="card"><p class="intro">Hver spiller får ${st.hand} begivenheder. På skift lægger I en af dem ind i tidslinjen – før, efter eller mellem de kort, der ligger der.
        Rigtigt: kortet bliver liggende. Forkert: kortet smides væk, og du trækker et nyt. Den, der først tømmer hånden, vinder runden.
        Efter hver runde tyndes tidslinjen ud – hvert andet kort fjernes, til der kun er 4 tilbage – og alle får ${st.hand} nye kort.</p></div>
      <div class="card"><h2>Spillere / hold</h2><div id="tlPl"></div></div>
      ${setupSets(sets, st)}
        <p class="hint">${total} kort valgt${total < need ? ` – vælg flere emner (mindst ${need} kort til ${pn().length} spillere)` : ''}</p></div>
      <div class="card"><h2>Antal runder</h2>
        <div class="seg" id="tlRoundSeg">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" class="${st.rounds === n ? 'on' : ''}">${n}</button>`).join('')}</div>
        <p class="hint">Vinderen af hver runde får 1 point. Flest point efter sidste runde vinder.</p></div>
      <div class="card"><h2>Kort på hånden</h2>
        <div class="seg" id="tlHandSeg">${[3, 4, 5, 6].map(n => `<button data-n="${n}" class="${st.hand === n ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      ${setupFlip(st)}
      <div class="row center"><button class="btn primary big" id="tlGo" ${total >= need ? '' : 'disabled'}>Start Tidslinje</button>
        <button class="btn big" id="tlRules0">Regler</button></div>`;
    renderPlayers($('#tlPl'), draw);
    bindSetup($('#tlSetupBody'), sets, st, draw);
    document.querySelectorAll('#tlHandSeg button').forEach(b => b.onclick = () => { st.hand = +b.dataset.n; draw(); });
    document.querySelectorAll('#tlRoundSeg button').forEach(b => b.onclick = () => { st.rounds = +b.dataset.n; draw(); });
    $('#tlRules0').onclick = tlRules;
    $('#tlGo').onclick = async () => {
      const saved = store.get(K_TL, null);
      if (saved && saved.phase !== 'over' && !(await uiConfirm('Starte et nyt spil Tidslinje? Det gemte spil overskrives.', 'Start nyt'))) return;
      store.set(K_TLSET, st); tlStart(st, pn());
    };
  };
  showScreen('#tlSetup');
  draw();
}

const TL_START = 4;   // kort i tidslinjen ved start og efter hver udtynding
function tlShuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function tlStart(st, names) {
  const hidden = store.get(K_HIDE, {});
  const seenEv = new Set();
  const deck = tlShuffle(tlCards().filter(c => st.sets.includes(c.set) && !hidden[c.id])
    .filter(c => { const k = tlKeyText(c); if (seenEv.has(k)) return false; seenEv.add(k); return true; }).map(c => c.id));
  TLG = {
    players: names.map((name, i) => ({ name, color: PCOL[i], hand: [], side: sideOf(i), pts: 0, ok: 0 })),
    sets: st.sets, flip: !!st.flip, flipX: false, deck, discard: [], line: [], turn: 0, starter: 0, sel: null, phase: 'play',
    winners: [], n: 0, hand: st.hand, rounds: st.rounds || 3, round: 1,
  };
  for (let k = 0; k < TL_START; k++) TLG.line.push(deck.pop());
  TLG.line.sort((a, b) => tlCmp(tlById(a), tlById(b)));
  TLG.players.forEach(p => { for (let k = 0; k < st.hand; k++) p.hand.push(deck.pop()); });
  tlUndo = []; tlSave(); tlShow();
}
function tlDraw() {
  if (!TLG.deck.length && TLG.discard.length) { TLG.deck = tlShuffle(TLG.discard); TLG.discard = []; }
  return TLG.deck.pop() || null;
}

/* ---------- spillogik ---------- */
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
  tlGhost = ok ? null : { id, slot: TLG.last.slot };   // vises, når dialogen er lukket
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
  const n = TLG.players.length, next = (TLG.turn + 1) % n;
  if (next === TLG.starter) {                          // runden er slut, når alle har haft lige mange ture
    const empty = TLG.players.filter(p => !p.hand.length);
    if (empty.length) return tlRoundEnd(empty);
    if (!TLG.deck.length && !TLG.discard.length) {     // ingen kort tilbage: færrest kort vinder runden
      const min = Math.min(...TLG.players.map(p => p.hand.length));
      return tlRoundEnd(TLG.players.filter(p => p.hand.length === min));
    }
  }
  TLG.turn = next; TLG.sel = null;
  tlSave(); tlRender();
}
// fjern hvert andet kort fra tidslinjen, til der kun er TL_START tilbage
function tlThin() {
  let i = 1;
  while (TLG.line.length > TL_START) { if (i >= TLG.line.length) i = 1; TLG.discard.push(TLG.line.splice(i, 1)[0]); i++; }
}
function tlRoundEnd(winners) {
  winners.forEach(p => p.pts++);
  const names = winners.map(p => esc(p.name)).join(' og ');
  const last = TLG.round >= TLG.rounds;
  if (last) {
    const top = Math.max(...TLG.players.map(p => p.pts));
    let best = TLG.players.filter(p => p.pts === top);
    if (best.length > 1) { const ok = Math.max(...best.map(p => p.ok)); best = best.filter(p => p.ok === ok); }
    TLG.phase = 'over'; TLG.winners = best.map(p => TLG.players.indexOf(p));
    tlSave(); tlRender(); return tlShowEnd(names);
  }
  const before = TLG.line.length;
  // vis først hvilke kort der fjernes (de tones ud), og tynd så ud
  const keep = TLG.line.slice(); const gone = [];
  { let i = 1; const tmp = keep.slice(); while (tmp.length > TL_START) { if (i >= tmp.length) i = 1; gone.push(tmp.splice(i, 1)[0]); i++; } }
  document.querySelectorAll('#tlLine .tlcard').forEach(el => { if (gone.includes(el.dataset.id)) el.classList.add('leaving'); });
  TLG.players.forEach(p => { TLG.discard.push(...p.hand); p.hand = []; });
  tlThin();
  TLG.round++; TLG.starter = (TLG.starter + 1) % TLG.players.length; TLG.turn = TLG.starter; TLG.sel = null; TLG.last = null;
  TLG.players.forEach(p => { for (let k = 0; k < TLG.hand; k++) { const c = tlDraw(); if (c) p.hand.push(c); } });
  tlSave();
  setTimeout(() => { tlRender(); tlRoundModal(winners, names, before); }, gone.length ? 1100 : 0);
}
function tlRoundModal(winners, names, before) {
  openModal(`<div class="qbody"><div class="mtitle">Runde ${TLG.round - 1} af ${TLG.rounds} er slut</div>
    <div class="mtext"><b>${names}</b> ${winners.length > 1 ? 'tømte hånden og får hver 1 point' : 'vandt runden og får 1 point'}.</div>
    <div class="mtext">Stillingen: ${TLG.players.slice().sort((a, b) => b.pts - a.pts).map(p => `<b>${esc(p.name)}</b> ${p.pts}`).join(' · ')}</div>
    <div class="mtext">Tidslinjen tyndes ud: hvert andet kort fjernes, til der er ${TL_START} tilbage (${before} → ${TLG.line.length}). Alle får ${TLG.hand} nye kort.
      ${esc(TLG.players[TLG.turn].name)} starter runde ${TLG.round}.</div>
    <div class="row center"><button class="btn primary big" onclick="closeModal()">Start runde ${TLG.round}</button></div></div>`);
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
  $('#tlFlipBtn').textContent = flipLabel(!!TLG.flip);
}
function tlRender() {
  const p = TLG.players[TLG.turn], play = TLG.phase === 'play', sel = TLG.sel !== null && play;
  const slot = i => `<button class="tlslot ${sel ? 'on' : ''}" data-s="${i}" ${sel ? '' : 'disabled'} aria-label="Placer her">${sel ? '＋' : ''}</button>`;
  const L = TLG.line.map(tlById);
  const ghost = tlGhost && tlById(tlGhost.id);
  const ghostHTML = ghost ? `<div class="tlcard ghost"><div class="tly">${esc(tlFmt(ghost.w))}</div><div class="tlt">${esc(ghost.t)}</div></div>` : '';
  $('#tlLine').innerHTML = (ghost && tlGhost.slot === 0 ? ghostHTML : '') + slot(0) + L.map((c, i) => `<div class="tlcard ${TLG.last && TLG.last.ok && TLG.last.id === c.id ? 'new' : ''}" data-id="${c.id}">
      ${c.img ? `<img class="tlimg" src="${esc(c.img)}" alt="">` : ''}<div class="tly">${esc(tlFmt(c.w))}</div><div class="tlt">${esc(c.t)}</div></div>${ghost && tlGhost.slot === i + 1 ? ghostHTML : ''}${slot(i + 1)}`).join('');
  tlGhost = null;
  $('#tlInfo').innerHTML = play
    ? `<span class="tlround">Runde ${TLG.round}/${TLG.rounds}</span><span class="dot" style="background:${p.color}"></span><b>${esc(p.name)}s tur</b> · ${sel ? 'tryk på ＋ der, hvor kortet hører til' : 'vælg et af dine kort'}`
    : 'Spillet er slut';
  $('#tlHand').innerHTML = play ? p.hand.map((id, i) => { const c = tlById(id); return `<button class="tlcard hand ${TLG.sel === i ? 'sel' : ''}" data-i="${i}">${c.img ? `<img class="tlimg" src="${esc(c.img)}" alt="">` : ''}<div class="tly">?</div><div class="tlt">${esc(c.t)}</div></button>`; }).join('') : '';
  $('#tlPlayers').innerHTML = TLG.players.map((pl, i) => `<div class="pcard ${i === TLG.turn && play ? 'cur' : ''} ${play && pl.hand.length === 1 ? 'close' : ''}">
      <span class="dot" style="background:${pl.color}"></span><span class="nm">${esc(pl.name)}</span>
      <span class="kstat">${pl.hand.length === 1 ? 'sidste kort!' : pl.hand.length + ' kort'}</span><b class="kscore">${pl.pts}</b></div>`).join('')
    + `<p class="hint">Tal = vundne runder · ${TLG.deck.length} kort i bunken</p>`;
  document.querySelectorAll('#tlHand .tlcard').forEach(b => b.onclick = () => { TLG.sel = TLG.sel === +b.dataset.i ? null : +b.dataset.i; tlSave(); tlRender(); });
  document.querySelectorAll('.tlslot').forEach(b => b.onclick = () => tlPlace(+b.dataset.s));
  tlOrient();
  const nw = document.querySelector('#tlLine .tlcard.new');
  if (nw) nw.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function tlShowEnd(lastNames) {
  const W = (TLG.winners || []).map(i => TLG.players[i]);
  const title = W.length === 1 ? `${esc(W[0].name)} vinder Tidslinje!` : `Uafgjort mellem ${W.map(p => esc(p.name)).join(' og ')}!`;
  openModal(`<div class="win"><div class="big-star">⟷</div><div class="mtitle">${title}</div>
    ${lastNames ? `<div class="mtext">Sidste runde blev vundet af <b>${lastNames}</b>.</div>` : ''}
    <div class="mtext">${TLG.players.slice().sort((a, b) => b.pts - a.pts || b.ok - a.ok).map(p => `${esc(p.name)}: ${p.pts} ${p.pts === 1 ? 'runde' : 'runder'} (${p.ok} rigtige)`).join(' · ')}</div>
    <div class="row center" style="margin-top:20px"><button class="btn primary big" id="tlNew">Nyt spil</button><button class="btn big" id="tlHome">Forsiden</button>
      <button class="btn big" id="tlSee">Se tidslinjen</button></div></div>`);
  $('#tlNew').onclick = () => { closeModal(); tlSetup(); };
  $('#tlHome').onclick = tlHome;
  $('#tlSee').onclick = closeModal;
}
function tlFlag(card) {
  const setName = (TL_SETS().find(s => s.id === card.set) || { name: card.set }).name;
  flagForm({ id: card.id, theme: 'Tidslinje', cat: setName, q: card.t, a: tlFmt(card.w), noun: 'kortet' });
}
function tlHome() { goHome(); }
function tlRules() {
  openModal(`<div class="qbody rules"><div class="mtitle">Regler for Tidslinje</div>
    <ul>
      <li>Hver spiller får nogle kort med en begivenhed – men uden årstal. Tidslinjen starter med 4 begivenheder med årstal.</li>
      <li>På sin tur vælger man et af sine kort og lægger det ind i tidslinjen: før, efter eller mellem de kort, der ligger der.</li>
      <li><b>Rigtigt:</b> kortet vendes og bliver liggende – tidslinjen bliver længere og sværere.</li>
      <li><b>Forkert:</b> kortet smides væk, man ser det rigtige årstal og trækker et nyt kort.</li>
      <li>Har to begivenheder samme årstal, er begge placeringer rigtige. Står der en dato på begge kort, gælder datoen.</li>
      <li>Den første, der tømmer sin hånd, vinder runden og får 1 point – men runden spilles færdig, så alle får lige mange ture. Tømmer flere hånden i samme runde, får de alle 1 point.</li>
      <li>Efter hver runde tyndes tidslinjen ud: hvert andet kort fjernes, til der kun er 4 tilbage. Alle får nye kort, og næste spiller starter den nye runde.</li>
      <li>I vælger antal runder ved start. Flest point efter sidste runde vinder; står det lige, vinder den med flest rigtigt placerede kort.</li>
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
  $('#tlFlipBtn').onclick = () => { if (!TLG) return; TLG.flip = !TLG.flip; tlSave(); tlOrient(); };
  $('#tlRulesBtn').onclick = tlRules;
}
tlInit();
