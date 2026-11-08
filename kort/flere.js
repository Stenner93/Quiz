/* Kransen: flere kort (runde 4) – alm og temaer. Årti/århundrede-kort har kind 'Årti'. */
(() => {
const Y = window.KY, O = window.KO;
const R = (set, q, names) => { O(set, q, names.map((n, i) => [n, String(i + 1)])); window.KRANS[window.KRANS.length - 1].kind = 'Rækkefølge'; };
const A = (set, q, items) => { O(set, q, items); window.KRANS[window.KRANS.length - 1].kind = 'Årti'; };
const F = (set, q, items) => { O(set, q, items); window.KRANS[window.KRANS.length - 1].kind = 'Farve'; };

// ---------- ALMENE ----------
Y('alm', 'Ligger landet i Afrika?', [['Egypten',1],['Kenya',1],['Marokko',1],['Ghana',1],['Madagaskar',1],['Etiopien',1],['Oman',0],['Jordan',0],['Sri Lanka',0],['Haiti',0]]);
Y('alm', 'Grænser landet op til Tyskland?', [['Danmark',1],['Polen',1],['Tjekkiet',1],['Østrig',1],['Schweiz',1],['Frankrig',1],['Luxembourg',1],['Italien',0],['Ungarn',0],['Slovakiet',0]]);
Y('alm', 'Er dyret en fugl?', [['Pingvin',1],['Struds',1],['Kiwi',1],['Kolibri',1],['Emu',1],['Svale',1],['Flagermus',0],['Flyvefisk',0],['Flyveegern',0],['Sommerfugl',0]]);
Y('alm', 'Vokser den spiselige del under jorden?', [['Gulerod',1],['Kartoffel',1],['Rødbede',1],['Radise',1],['Pastinak',1],['Ingefær',1],['Agurk',0],['Tomat',0],['Broccoli',0],['Ært',0]]);
O('alm', 'Hvad hedder ungen?', [['Ko','Kalv'],['Hest','Føl'],['Får','Lam'],['Gris','Pattegris (smågris)'],['Hund','Hvalp'],['Kat','Killing'],['Ged','Kid'],['Frø','Haletudse'],['Høne','Kylling'],['Sommerfugl','Larve']]);
O('alm', 'I hvilket land ligger byen?', [['Barcelona','Spanien'],['Milano','Italien'],['Marseille','Frankrig'],['Kraków','Polen'],['Porto','Portugal'],['Göteborg','Sverige'],['Bergen','Norge'],['Antwerpen','Belgien'],['Salzburg','Østrig'],['Edinburgh','Storbritannien (Skotland)']]);
O('alm', 'Hvad er hovedingrediensen?', [['Guacamole','Avocado'],['Hummus','Kikærter'],['Pesto','Basilikum'],['Tofu','Sojabønner'],['Popcorn','Majs'],['Marcipan','Mandler'],['Surkål','Hvidkål'],['Ketchup','Tomater'],['Chokolade','Kakao'],['Tzatziki','Yoghurt']]);
F('alm', 'Hvilken farve har det?', [['Smølferne','Blå'],['Frøen Kermit','Grøn'],['Pikachu','Gul'],['Den lyserøde panter','Lyserød'],['Shrek','Grøn'],['Smaragd','Grøn'],['Safir','Blå'],['Rubin','Rød'],['Ametyst','Lilla'],['Danske postkasser','Rød']]);
R('alm', 'Placer himmellegemerne efter afstand fra Solen (1 = nærmest)', ['Merkur','Venus','Jorden','Mars','Ceres (i asteroidebæltet)','Jupiter','Saturn','Uranus','Neptun','Pluto']);
R('alm', 'Placer landene efter areal (1 = størst)', ['Rusland','Canada','USA','Brasilien','Australien','Indien','Argentina','Kasakhstan','Algeriet','DR Congo']);
A('alm', 'I hvilket årti skete det?', [['Titanic synker','1910’erne'],['Første verdenskrig slutter','1910’erne'],['Første menneske på Månen','1960’erne'],['Margrethe 2. bliver dronning','1970’erne'],['Danmark går med i EF','1970’erne'],['Berlinmuren falder','1980’erne'],['Danmark vinder EM i fodbold','1990’erne'],['Storebæltsbroen åbner for biler','1990’erne'],['Den første iPhone','2000’erne'],['Frederik 10. bliver konge','2020’erne']]);

// ---------- CYKELSPORT ----------
Y('cykel', 'Har rytteren vundet Paris-Roubaix?', [['Tom Boonen',1],['Fabian Cancellara',1],['Mathieu van der Poel',1],['Peter Sagan',1],['Philippe Gilbert',1],['Roger De Vlaeminck',1],['Eddy Merckx',1],['Bjarne Riis',0],['Chris Froome',0],['Alberto Contador',0]]);
O('cykel', 'Hvad er rytterens kælenavn?', [['Eddy Merckx','Kannibalen'],['Bernard Hinault','Grævlingen'],['Marco Pantani','Piraten'],['Mario Cipollini','Løvekongen'],['Fausto Coppi','Il Campionissimo'],['Fabian Cancellara','Spartacus'],['Peter Sagan','Tourminator'],['Alejandro Valverde','El Bala (kuglen)'],['Bjarne Riis','Ørnen fra Herning'],['Laurent Jalabert','Jaja']]);
A('cykel', 'I hvilket årti skete det?', [['Det første Tour de France','1900’erne'],['Det første Giro d’Italia','1900’erne'],['Ole Ritter sætter timerekord i Mexico City','1960’erne'],['Knud Enemark Jensen dør ved OL i Rom','1960’erne'],['Eddy Merckx vinder sin første Tour','1960’erne'],['Bjarne Riis vinder Touren','1990’erne'],['Rolf Sørensen vinder Flandern Rundt','1990’erne'],['Mads Pedersen bliver verdensmester','2010’erne'],['Touren starter i København','2020’erne'],['Jonas Vingegaard vinder sin første Tour','2020’erne']]);

// ---------- BESÆTTELSEN ----------
Y('besaettelsen', 'Blev landet besat af Tyskland under 2. verdenskrig?', [['Danmark',1],['Norge',1],['Holland',1],['Belgien',1],['Frankrig',1],['Polen',1],['Grækenland',1],['Sverige',0],['Schweiz',0],['Spanien',0]]);
O('besaettelsen', 'Hvor lå lejren?', [['Frøslevlejren','Ved Padborg i Sønderjylland'],['Horserødlejren','Ved Helsingør'],['Oksbøllejren','Ved Oksbøl i Vestjylland'],['Theresienstadt','I Böhmen (nu Tjekkiet)'],['Neuengamme','Ved Hamborg'],['Sachsenhausen','Ved Berlin'],['Auschwitz','I Polen'],['Stutthof','Ved Danzig (Gdańsk)'],['Buchenwald','Ved Weimar'],['Dachau','Ved München']]);
O('besaettelsen', 'I hvilken måned skete det?', [['Tyskerne besætter Danmark (1940)','April'],['Stauning dør (1942)','Maj'],['Rigsdagsvalget (1943)','Marts'],['Samarbejdspolitikken bryder sammen (1943)','August'],['Aktionen mod de danske jøder (1943)','Oktober'],['Kaj Munk bliver myrdet (1944)','Januar'],['Det danske politi deporteres (1944)','September'],['Gestapo i Aarhus Universitet bombes (1944)','Oktober'],['Shellhuset bombes (1945)','Marts'],['Befrielsesbudskabet lyder (1945)','Maj']]);

// ---------- POLITIK ----------
Y('politik', 'Har personen været landsformand for Venstre?', [['Anders Fogh Rasmussen',1],['Lars Løkke Rasmussen',1],['Uffe Ellemann-Jensen',1],['Henning Christophersen',1],['Jakob Ellemann-Jensen',1],['Troels Lund Poulsen',1],['Kristian Jensen',0],['Søren Pape Poulsen',0],['Pia Kjærsgaard',0],['Morten Messerschmidt',0]]);
A('politik', 'I hvilket årti skete det?', [['Danmarks første grundlov','1840’erne'],['Kvinder får valgret til Rigsdagen','1910’erne'],['Danmark går med i NATO','1940’erne'],['Landstinget afskaffes','1950’erne'],['Jordskredsvalget','1970’erne'],['Danmark går med i EF','1970’erne'],['Nej til Maastricht-traktaten','1990’erne'],['Nej til euroen','2000’erne'],['Kommunalreformen med 98 kommuner','2000’erne'],['Første kvindelige statsminister','2010’erne']]);

// ---------- KOLD KRIG ----------
Y('koldkrig', 'Har personen været leder af Sovjetunionen?', [['Lenin',1],['Stalin',1],['Khrusjtjov',1],['Bresjnev',1],['Andropov',1],['Tjernenko',1],['Gorbatjov',1],['Tito',0],['Ceaușescu',0],['Honecker',0]]);
A('koldkrig', 'I hvilket årti skete det?', [['Berlinblokaden','1940’erne'],['Koreakrigen begynder','1950’erne'],['Sputnik opsendes','1950’erne'],['Cubakrisen','1960’erne'],['Thule-ulykken','1960’erne'],['Helsinki-slutakten','1970’erne'],['Vietnamkrigen slutter','1970’erne'],['Tjernobyl-ulykken','1980’erne'],['Berlinmuren falder','1980’erne'],['Sovjetunionen opløses','1990’erne']]);

// ---------- ODENSE ----------
A('odense', 'I hvilket århundrede skete det?', [['Odense nævnes første gang','900-tallet'],['Knud den Hellige dræbes i Sankt Albani Kirke','1000-tallet'],['Danmarks første trykte bog trykkes i Odense','1400-tallet'],['Thomas Kingo bliver biskop i Odense','1600-tallet'],['Odense Kanal åbner','1800-tallet'],['H.C. Andersen fødes','1800-tallet'],['Carl Nielsen fødes','1800-tallet'],['Odense Zoo åbner','1900-tallet'],['Odinstårnet bygges','1900-tallet'],['Letbanen åbner','2000-tallet']]);

// ---------- GEOGRAFI ----------
Y('geografi', 'Ligger byen ved en fjord?', [['Vejle',1],['Kolding',1],['Horsens',1],['Randers',1],['Roskilde',1],['Holbæk',1],['Haderslev',1],['Herning',0],['Silkeborg',0],['Hillerød',0]]);
O('geografi', 'Hvilken å løber gennem byen?', [['Randers','Gudenåen'],['Holstebro','Storå'],['Varde','Varde Å'],['Næstved','Suså'],['Vejle','Vejle Å'],['Odense','Odense Å'],['Aarhus','Aarhus Å'],['Ribe','Ribe Å'],['Køge','Køge Å'],['Skive','Karup Å']]);
R('geografi', 'Placer byerne efter indbyggertal (1 = flest)', ['København','Aarhus','Odense','Aalborg','Esbjerg','Roskilde','Næstved','Svendborg','Skagen','Ærøskøbing']);

// ---------- KLASSISK ----------
Y('klassisk', 'Har Beethoven skrevet det?', [['Måneskinssonaten',1],['Für Elise',1],['Skæbnesymfonien',1],['Fidelio',1],['Ode til glæden',1],['Kejserkoncerten',1],['Pastoralesymfonien',1],['Boléro',0],['Brudekoret fra Lohengrin',0],['De fire årstider',0]]);
Y('klassisk', 'Har Verdi skrevet operaen?', [['Aida',1],['La Traviata',1],['Rigoletto',1],['Nabucco',1],['Otello',1],['Il Trovatore',1],['Tosca',0],['Carmen',0],['Madama Butterfly',0],['Figaros bryllup',0]]);
A('klassisk', 'I hvilket århundrede blev værket skrevet?', [['Monteverdis Orfeo','1600-tallet'],['Vivaldis De fire årstider','1700-tallet'],['Händels Messias','1700-tallet'],['Mozarts Tryllefløjten','1700-tallet'],['Beethovens 9. symfoni','1800-tallet'],['Bizets Carmen','1800-tallet'],['Tjajkovskijs Svanesøen','1800-tallet'],['Carl Nielsens Maskarade','1900-tallet'],['Stravinskijs Sacre du printemps','1900-tallet'],['Ravels Boléro','1900-tallet']]);

// ---------- IT ----------
Y('it', 'Er virksomheden amerikansk?', [['Apple',1],['Microsoft',1],['Google',1],['Amazon',1],['Nvidia',1],['Intel',1],['Samsung',0],['Sony',0],['Nokia',0],['Spotify',0]]);
A('it', 'I hvilket årti kom det?', [['Transistoren','1940’erne'],['Den første e-mail','1970’erne'],['Spillet Pong','1970’erne'],['Commodore 64','1980’erne'],['World Wide Web','1990’erne'],['Windows 95','1990’erne'],['Facebook','2000’erne'],['Den første iPhone','2000’erne'],['Bitcoin','2000’erne'],['ChatGPT','2020’erne']]);

// ---------- RUNDE 5 ----------
Y('alm', 'Ligger landet i Sydamerika?', [['Brasilien',1],['Argentina',1],['Chile',1],['Peru',1],['Colombia',1],['Ecuador',1],['Uruguay',1],['Mexico',0],['Panama',0],['Cuba',0]]);
O('alm', 'Hvilket sprog er landets hovedsprog?', [['Brasilien','Portugisisk'],['Mexico','Spansk'],['Østrig','Tysk'],['Egypten','Arabisk'],['Iran','Persisk'],['Island','Islandsk'],['Holland','Nederlandsk (hollandsk)'],['Grønland','Grønlandsk'],['Angola','Portugisisk'],['Israel','Hebraisk']]);
O('alm', 'Hvad måler instrumentet?', [['Termometer','Temperatur'],['Barometer','Lufttryk'],['Speedometer','Hastighed'],['Seismograf','Jordskælv (rystelser)'],['Hygrometer','Luftfugtighed'],['Anemometer','Vindhastighed'],['Kronometer','Tid'],['Kilometertæller','Kørt distance'],['Voltmeter','Elektrisk spænding'],['Decibelmeter','Lydstyrke']]);
R('alm', 'Placer opfindelserne i tidsorden (1 = tidligst)', ['Gutenbergs bogtryk','James Watts dampmaskine','Telefonen','Edisons glødepære','Benz’ bil','Marconis radio','Brødrene Wrights flyvemaskine','Fjernsynet','Penicillinen','Mobiltelefonen']);
A('alm', 'I hvilket århundrede skete det?', [['Jellingstenen rejses','900-tallet'],['Kalmarunionen dannes','1300-tallet'],['Københavns Universitet grundlægges','1400-tallet'],['Columbus når Amerika','1400-tallet'],['Reformationen i Danmark','1500-tallet'],['Rundetårn bygges','1600-tallet'],['Den Franske Revolution','1700-tallet'],['Slaget på Reden','1800-tallet'],['Danmarks første grundlov','1800-tallet'],['Første menneske på Månen','1900-tallet']]);
Y('geografi', 'Ligger byen på Sjælland?', [['Roskilde',1],['Køge',1],['Næstved',1],['Holbæk',1],['Kalundborg',1],['Slagelse',1],['Hillerød',1],['Nykøbing Falster',0],['Stege',0],['Rønne',0]]);
Y('besaettelsen', 'Var det en modstandsgruppe eller illegal organisation?', [['Holger Danske',1],['BOPA',1],['Hvidstengruppen',1],['Churchill-klubben',1],['Frit Danmark',1],['Studenternes Efterretningstjeneste',1],['Ringen',1],['Schalburgkorpset',0],['Hipo-korpset',0],['Frikorps Danmark',0]]);
Y('politik', 'Har landet en monark som statsoverhoved?', [['Danmark',1],['Norge',1],['Sverige',1],['Storbritannien',1],['Spanien',1],['Holland',1],['Belgien',1],['Frankrig',0],['Tyskland',0],['Finland',0]]);
Y('koldkrig', 'Var landet alliancefrit under den kolde krig?', [['Sverige',1],['Finland',1],['Schweiz',1],['Østrig',1],['Irland',1],['Jugoslavien',1],['Norge',0],['Danmark',0],['Polen',0],['Tyrkiet',0]]);
Y('klassisk', 'Har Puccini skrevet operaen?', [['Tosca',1],['La Bohème',1],['Madama Butterfly',1],['Turandot',1],['Gianni Schicchi',1],['Manon Lescaut',1],['Aida',0],['Carmen',0],['Rigoletto',0],['Fidelio',0]]);
Y('it', 'Er det et styresystem?', [['Windows',1],['macOS',1],['Linux',1],['Android',1],['iOS',1],['ChromeOS',1],['Google Chrome',0],['Microsoft Office',0],['Java',0],['Python',0]]);
Y('cykel', 'Har rytteren vundet alle tre Grand Tours?', [['Jacques Anquetil',1],['Felice Gimondi',1],['Eddy Merckx',1],['Bernard Hinault',1],['Alberto Contador',1],['Vincenzo Nibali',1],['Chris Froome',1],['Miguel Induráin',0],['Greg LeMond',0],['Bjarne Riis',0]]);
})();
