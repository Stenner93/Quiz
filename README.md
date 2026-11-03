# Stjernejagt

Et quiz-brætspil på dansk til 2–6 spillere eller hold, lavet til Android-tablets (virker også på telefon og computer).
Alle spiller på den samme tablet og sender den rundt.

**Kategorierne og farverne er de seks klassiske**, så I kan bruge jeres egne fysiske spørgsmålskort:

| Farve | Kategori |
|---|---|
| 🔵 Blå | Geografi |
| 🩷 Pink | Underholdning |
| 🟡 Gul | Historie |
| 🟣 Lilla | Kunst & litteratur |
| 🟢 Grøn | Naturvidenskab |
| 🟠 Orange | Sport & fritid |

## Sådan spiller man
- Alle starter på kronefeltet ♛. Slå med terningen, og ryk med eller mod uret.
- Svar rigtigt, og du slår igen. Svar forkert, og turen går videre.
- Svar rigtigt på et **★ stjernefelt** for at få kategoriens stjerne.
- **↻** betyder "slå igen". På **♛** vælger du selv kategori.
- Har du alle seks stjerner, går du tilbage til ♛ og tager et **finalekort**: 6 spørgsmål i fast rækkefølge (blå, pink, gul, lilla, grøn, orange).
- Du skal have **x rigtige ud af 6** (standard 4, kan ændres i Menu mellem finalekort). Kortet stopper, når du har nok, eller når det ikke kan nås længere – så går turen videre, og du prøver igen næste tur.
- Klarer du finalen, spilles runden færdig. Klarer en anden også finalen i samme runde, er der omspil mellem jer.

## Spørgsmål
- **Spørgsmål i appen:** Der følger ca. 2.400 spørgsmål med: ca. 200 skrevet på dansk (`questions.js`) og ca. 2.200 oversat og tilpasset fra [Open Trivia Database](https://opentdb.com) (`questions_opentdb.js`, licens [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). Appen husker, hvilke der er brugt.
- **Fysiske kort:** Appen viser kun farve og kategori, og I læser op fra kortet.
- Du kan skifte mellem de to ved hvert eneste spørgsmål.
- **Importér egne spørgsmål** fra en CSV-fil (fx fra Excel/Google Sheets) med kolonnerne `kategori;spørgsmål;svar`.
  Kategori kan skrives som navn (`historie`), farve (`gul`) eller tal 1–6. Se `eksempel-spoergsmaal.csv`.

## Andet
- Spillet gemmes automatisk og kan fortsættes, hvis appen lukkes.
- **↶ Fortryd** hvis nogen trykkede forkert.
- Har du slået med en rigtig terning, så tryk på tallet i stedet for at slå i appen.

## Installér på tablet
1. Åbn spillets adresse i Chrome på tabletten (GitHub Pages: `https://<brugernavn>.github.io/<repo>/`).
2. Chrome-menuen ⋮ → **Føj til startskærm** / **Installér app**.
3. Spillet ligger nu som en app, kører i fuld skærm og virker uden internet.

## Teknik
Ren HTML/CSS/JavaScript uden byggetrin: `index.html`, `style.css`, `app.js`, `questions.js` (de indbyggede spørgsmål), `sw.js` (offline) og `manifest.webmanifest`.
Når du ændrer filer, så hæv `CACHE`-versionen i `sw.js`.
