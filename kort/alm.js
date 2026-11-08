/* Kransen: almene kort. Format: Y = ja/nej-kort, O = åbne kort (svaret siges højt). */
window.KRANS = window.KRANS || [];
window.KY = (set, q, items) => window.KRANS.push({ set, q, type: 'yn', items: items.map(([t, a]) => ({ t, a: !!a })) });
window.KO = (set, q, items) => window.KRANS.push({ set, q, type: 'open', items: items.map(([t, a]) => ({ t, a })) });
(() => {
const Y = (q, i) => window.KY('alm', q, i), O = (q, i) => window.KO('alm', q, i);
O('Hvad er landets hovedstad?', [['Norge','Oslo'],['Sverige','Stockholm'],['Finland','Helsinki'],['Island','Reykjavik'],['Tyskland','Berlin'],['Polen','Warszawa'],['Spanien','Madrid'],['Portugal','Lissabon'],['Italien','Rom'],['Grækenland','Athen']]);
O('Hvad er landets hovedstad? (svær)', [['Canada','Ottawa'],['Australien','Canberra'],['Brasilien','Brasília'],['Tyrkiet','Ankara'],['Schweiz','Bern'],['Egypten','Kairo'],['Japan','Tokyo'],['Sydkorea','Seoul'],['Argentina','Buenos Aires'],['Kenya','Nairobi']]);
Y('Er dyret et pattedyr?', [['Hval',1],['Flagermus',1],['Delfin',1],['Pingvin',0],['Haj',0],['Næbdyr',1],['Krokodille',0],['Sæl',1],['Struds',0],['Søko',1]]);
O('Hvor mange ben har dyret?', [['Edderkop','8'],['Myre','6'],['Hest','4'],['Struds','2'],['Krabbe','10'],['Slange','0'],['Bænkebider','14'],['Flue','6'],['Skorpion','8'],['Hund','4']]);
Y('Er det et grundstof?', [['Guld',1],['Ilt',1],['Vand',0],['Salt',0],['Jern',1],['Bronze',0],['Helium',1],['Stål',0],['Kulstof',1],['Messing',0]]);
O('Hvad er grundstoffets kemiske tegn?', [['Guld','Au'],['Sølv','Ag'],['Jern','Fe'],['Natrium','Na'],['Kalium','K'],['Bly','Pb'],['Kviksølv','Hg'],['Tin','Sn'],['Ilt','O'],['Kobber','Cu']]);
Y('Er det en planet i vores solsystem?', [['Merkur',1],['Pluto',0],['Månen',0],['Mars',1],['Solen',0],['Saturn',1],['Uranus',1],['Ceres',0],['Neptun',1],['Venus',1]]);
O('Hvor mange spillere har hvert hold på banen?', [['Fodbold','11'],['Håndbold','7'],['Basketball','5'],['Volleyball','6'],['Ishockey','6'],['Rugby (union)','15'],['Vandpolo','7'],['Baseball','9'],['Amerikansk fodbold','11'],['Landhockey','11']]);
Y('Er landet med i det nordiske samarbejde som selvstændig stat?', [['Danmark',1],['Norge',1],['Sverige',1],['Finland',1],['Island',1],['Estland',0],['Holland',0],['Letland',0],['Irland',0],['Polen',0]]);
O('Hvem malede billedet?', [['Mona Lisa','Leonardo da Vinci'],['Skriget','Edvard Munch'],['Stjernenatten','Vincent van Gogh'],['Guernica','Pablo Picasso'],['Pigen med perleøreringen','Johannes Vermeer'],['Nattevagten','Rembrandt'],['Skabelsen af Adam','Michelangelo'],['Venus’ fødsel','Sandro Botticelli'],['Sommeraften på Skagens Sønderstrand','P.S. Krøyer'],['Åkanderne','Claude Monet']]);
O('Hvem skrev værket?', [['Hamlet','William Shakespeare'],['1984','George Orwell'],['Harry Potter','J.K. Rowling'],['Ringenes Herre','J.R.R. Tolkien'],['Pippi Langstrømpe','Astrid Lindgren'],['Den lille prins','Antoine de Saint-Exupéry'],['Don Quijote','Miguel de Cervantes'],['Krig og fred','Lev Tolstoj'],['Matador (tv-serien)','Lise Nørgaard'],['Den lille havfrue','H.C. Andersen']]);
O('Hvilket land kommer retten fra?', [['Paella','Spanien'],['Sushi','Japan'],['Pizza','Italien'],['Tacos','Mexico'],['Moussaka','Grækenland'],['Kimchi','Korea'],['Gullasch','Ungarn'],['Croissant','Frankrig'],['Smørrebrød','Danmark'],['Haggis','Skotland']]);
O('Hvad hedder landets valuta?', [['Sverige','Svensk krone'],['Norge','Norsk krone'],['Storbritannien','Pund'],['USA','Dollar'],['Japan','Yen'],['Kina','Yuan (renminbi)'],['Schweiz','Franc'],['Polen','Złoty'],['Indien','Rupee'],['Tyskland','Euro']]);
Y('Er det et officielt sprog i Schweiz?', [['Tysk',1],['Fransk',1],['Italiensk',1],['Rætoromansk',1],['Engelsk',0],['Hollandsk',0],['Spansk',0],['Portugisisk',0],['Luxembourgsk',0],['Latin',0]]);
O('I hvilken by ligger bygningsværket?', [['Eiffeltårnet','Paris'],['Colosseum','Rom'],['Big Ben','London'],['Frihedsgudinden','New York'],['Taj Mahal','Agra (Indien)'],['Sagrada Família','Barcelona'],['Akropolis','Athen'],['Den Røde Plads','Moskva'],['Den Forbudte By','Beijing'],['Operahuset med sejlene','Sydney']]);
Y('Var sportsgrenen på programmet ved sommer-OL i Paris 2024?', [['Svømning',1],['Badminton',1],['Breaking (breakdance)',1],['Golf',1],['Skydning',1],['Cricket',0],['Curling',0],['Squash',0],['Skiskydning',0],['Karate',0]]);
O('Hvor mange er der?', [['Dage i et skudår','366'],['Minutter i en time','60'],['Sekunder i et døgn','86.400'],['Uger i et år','52'],['Kort i et almindeligt kortspil (uden jokere)','52'],['Felter på et skakbræt','64'],['Grader i en ret vinkel','90'],['Tangenter på et klaver','88'],['Strenge på en almindelig guitar','6'],['Brikker på et skakbræt ved spillets start','32']]);
Y('Er personen dansk?', [['Niels Bohr',1],['Tycho Brahe',1],['Søren Kierkegaard',1],['Ole Rømer',1],['Karen Blixen',1],['Henrik Ibsen',0],['August Strindberg',0],['Edvard Munch',0],['Astrid Lindgren',0],['H.C. Ørsted',1]]);
Y('Er det et pattedyr, der lever i havet?', [['Spækhugger',1],['Hvalhaj',0],['Delfin',1],['Søløve',1],['Rokke',0],['Narhval',1],['Blæksprutte',0],['Hvalros',1],['Havskildpadde',0],['Marsvin',1]]);
O('Hvilken verdensdel ligger landet i?', [['Peru','Sydamerika'],['Kenya','Afrika'],['Vietnam','Asien'],['Ungarn','Europa'],['Canada','Nordamerika'],['New Zealand','Oceanien'],['Marokko','Afrika'],['Mongoliet','Asien'],['Chile','Sydamerika'],['Island','Europa']]);
})();
