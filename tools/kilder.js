// Genererer KILDER-OG-LICENSER.md ud fra tools/billedkilder.json.  Kør: node tools/kilder.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const imgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'billedkilder.json'), 'utf8'));
const row = x => `| ${x.fil.replace('billeder/', '')} | ${x.titel.replace(/\|/g, '/')} | ${x.ophav.replace(/\|/g, '/')} | ${x.licens} | ${x.kilde ? `[link](${x.kilde})` : ''} |`;
const photos = imgs.filter(x => !x.fil.includes('/mal_')), paintings = imgs.filter(x => x.fil.includes('/mal_'));
const md = `# Kilder og licenser

Quiz app (Stjernejagt, Quizisk Roulette og Tidslinje) bygger på følgende kilder. Denne fil er genereret af \`tools/kilder.js\`.

## Spørgsmål og kort

| Indhold | Kilde | Licens |
|---|---|---|
| Egne spørgsmål, temaer, roulettekort og tidslinjekort | Skrevet til appen. Fakta er efterprøvet i bl.a. [lex.dk](https://lex.dk), [Trap Danmark](https://trap.lex.dk), Wikipedia og [Wikidata](https://www.wikidata.org) | Appens eget indhold |
| \`questions_opentdb.js\` (almen quiz) | Oversat og tilpasset fra [Open Trivia Database](https://opentdb.com) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) – filen deles under samme licens |
| Kort bygget af grupper af spørgsmål fra den almene quiz (\`kort/almquiz.js\`) | Delvist Open Trivia Database | CC BY-SA 4.0 |
| Data fra Wikidata (udvalgte årstal og billedvalg) | [Wikidata](https://www.wikidata.org) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Landesilhuetter (\`kort/lande-former.js\`) | [Natural Earth](https://www.naturalearthdata.com) via datasets/geo-countries | Public domain |

Fakta i sig selv er ikke beskyttet af ophavsret; teksterne på lex.dk og Trap Danmark er ikke kopieret, men brugt som kilde til at efterprøve spørgsmålene.

## Fotos (${photos.length})

Fotos fra Flickr, fundet via [Openverse](https://openverse.org). Fotograf og licens vises også i appen ved hvert billede.

| Fil | Titel | Fotograf | Licens | Kilde |
|---|---|---|---|---|
${photos.map(row).join('\n')}

## Malerier (${paintings.length})

Alle malerier er i public domain (kunstneren døde for mere end 70 år siden). Gengivelserne er fra Wikimedia Commons (valgt via Wikidata) og Statens Museum for Kunst (SMK Open, CC0).

| Fil | Titel | Maler | Licens | Kilde |
|---|---|---|---|---|
${paintings.map(row).join('\n')}

## Ikon og kode

Ikonet og appens kode er lavet til appen. Der er ikke valgt en åben licens for koden.
`;
fs.writeFileSync(path.join(root, 'KILDER-OG-LICENSER.md'), md);
console.log('KILDER-OG-LICENSER.md:', photos.length, 'fotos,', paintings.length, 'malerier');
