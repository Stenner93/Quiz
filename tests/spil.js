// Browsertest af alle tre spil (Playwright).  Kør:  node tests/spil.js
// Starter sin egen lille webserver, åbner appen på telefon- og tabletstørrelse og spiller hvert spil igennem.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let fails = 0;
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails++; };

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  for (const [w, h, name] of [[412, 915, 'telefon'], [1280, 800, 'tablet']]) {
    console.log(`— ${name} (${w}×${h})`);
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
    check(await p.isVisible('#home'), 'forsiden vises');

    // Stjernejagt: opsætning, start, slå, tilbage
    await p.click('#sjGo'); await p.click('#plist [data-add]');
    check(await p.evaluate(() => settings.names.length) === 3, 'spiller tilføjet i den fælles liste');
    await p.click('#startBtn'); await p.waitForTimeout(300);
    check(await p.isVisible('#game'), 'Stjernejagt starter');
    await p.evaluate(() => roll(3)); await p.waitForTimeout(200);
    check(await p.evaluate(() => S.phase === 'move'), 'Stjernejagt: slag giver valg af felt');
    await p.evaluate(() => goHome());
    check(await p.isVisible('#sjResume'), 'forsiden viser "Fortsæt" for Stjernejagt');

    // Quizisk Roulette: spil et kort færdigt med pas og gratis gæt
    await p.click('#krGoBtn'); await p.click('#krGo'); await p.waitForTimeout(300);
    check(await p.isVisible('#kransen'), 'rouletten starter');
    while (await p.evaluate(() => KR.phase === 'play')) { await p.click('#krPass'); await p.waitForTimeout(50); }
    await p.waitForTimeout(500);
    const free = await p.$('#krFree');
    if (free) { await free.click(); const i = await p.evaluate(() => KR.card.items.findIndex((_, i) => !KR.res[i])); await p.click(`.kitem[data-i="${i}"]`); await p.click('#krFRev'); await p.click('#krFOk'); }
    check(await p.evaluate(() => KR.players.every(x => x.score === 0)), 'rouletten: pas og gratis gæt giver ingen point');
    // tekst må ikke klippes i boblerne (alle kort)
    const clipped = await p.evaluate(() => {
      let bad = 0; const keep = KR.card;
      for (const c of window.KRANS.filter(c => c.items.every(i => i.t))) {
        KR.card = { ...c, id: 'x', kind: krKind(c), items: c.items }; KR.phase = 'play'; KR.res = {}; krRender();
        document.querySelectorAll('#krRing .kt').forEach(el => { if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) bad++; });
      }
      KR.card = keep; return bad;
    });
    check(clipped === 0, `rouletten: ingen klippet tekst i boblerne (${clipped})`);
    await p.evaluate(() => goHome());

    // Tidslinje: 2 runder, spiller 1 placerer rigtigt, spiller 2 forkert
    await p.click('#tlGoBtn'); await p.click('#tlRoundSeg button[data-n="2"]'); await p.click('#tlGo'); await p.waitForTimeout(300);
    check(await p.evaluate(() => TLG.line.length === 4), 'Tidslinje starter med 4 kort');
    let turns = 0;
    while (await p.evaluate(() => TLG.phase === 'play') && turns < 60) {
      const r0 = await p.evaluate(() => TLG.round);
      if (await p.evaluate(() => TLG.sel === null)) await p.click('#tlHand .tlcard >> nth=0');
      const s = await p.evaluate(() => TLG.turn === 0 ? tlCorrectSlot(tlById(TLG.players[0].hand[TLG.sel])) : 0);
      await p.click(`.tlslot[data-s="${s}"]`); await p.click('#tlOk'); turns++;
      if (await p.evaluate(() => TLG.round) !== r0) { await p.waitForTimeout(1400); check(await p.evaluate(() => TLG.line.length === 4), 'Tidslinje: udtyndet til 4 kort efter runden'); await p.evaluate(() => closeModal()); }
    }
    check(await p.evaluate(() => TLG.phase === 'over' && TLG.winners[0] === 0), 'Tidslinje: rigtig vinder efter sidste runde');
    check(await p.evaluate(() => TLG.line.map(tlById).every((c, i, a) => !i || tlCmp(a[i - 1], c) <= 0)), 'Tidslinje: tidslinjen er sorteret');
    check(await p.evaluate(() => new Set(TLG.line.concat(TLG.deck, TLG.discard, ...TLG.players.map(x => x.hand)).map(id => tlKeyText(tlById(id)))).size
      === TLG.line.concat(TLG.deck, TLG.discard, ...TLG.players.map(x => x.hand)).length), 'Tidslinje: ingen dubletter i spillet');
    await p.evaluate(() => closeModal());
    const f1 = await p.textContent('#tlFlipBtn'); await p.click('#tlFlipBtn');
    check(f1 !== await p.textContent('#tlFlipBtn'), 'vend skærm kan slås til/fra undervejs');
    check(!errs.length, 'ingen JavaScript-fejl' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await p.close();
  }
  await browser.close(); server.close();
  console.log(fails ? `${fails} test(s) fejlede` : 'Alle tests bestod');
  process.exit(fails ? 1 : 0);
})();
