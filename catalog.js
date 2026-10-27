// Corsia – tuotekatalogi (yhdistetty vanha katalogi + Shopping.pdf, duplikaatit poistettu, kirjoitusvirheet korjattu)
// Korvaa tällä koko vanha `const DEFAULT_CATALOG = [ ... ];` -lohko.
// Tuotteet järjestetään aakkosjärjestykseen automaattisesti (fi), ja saman nimen duplikaatit suodatetaan pois.

const CATALOG_BY_CATEGORY = {
  "Muut": [
    "Ihmesekoituspussi", "Kukkamulta", "Renkaanpaikkausaine CRC", "Sateenvarjo", "Sukkahousut", "Tarmo avainpiilo"
  ],
  "Hevi": [
    "Chili (iso)", "Chili (pieni)", "Herkkusieni", "Idut", "Inkivääri", "Jäävuorisalaatti", "Kaali", "Keltasipuli",
    "Kevätsipuli", "Kiinankaali", "Kirsikkatomaatti", "Kukkakaali", "Kurkku", "Lehtikaali", "Maissi", "Miniluumutomaatti",
    "Parsakaali", "Pavut", "Punainen paprika", "Punasipuli", "Rucola", "Salaattisekoitus", "Salottisipuli", "Sitruunaruoho",
    "Sokeriherne", "Suippopaprika", "Tomaatti", "Valkosipuli",
    "YRTTI: Basilika (tuore)", "YRTTI: Korianteri", "YRTTI: Persilja", "YRTTI: Salvia", "YRTTI: Tuoreet yrtit"
  ],
  "Juurekset": [
    "Keittojuurekset (setti)", "Peruna (keitto)", "Peruna (yleis / uusi)", "Perunamuusiaines", "Porkkana"
  ],
  "Hedelmät": [
    "Ananas (tuore)", "Appelsiini (Tarocco)", "Avokado", "Banaani", "Cantaloupe-meloni", "Hunajameloni", "Kiwi", "Lime",
    "Mandariini", "Mango (tuore)", "Persikka (lättänä)", "Punaiset omenat", "Rypäleet", "Satsuma", "Tuoreet mansikat",
    "Tuoreet mustikat", "Tuoreet vadelmat", "Vesimeloni", "Vihreät omenat"
  ],
  "Liha": [
    "Chicken wings", "Grillitassu", "Jauheliha", "Kala", "Kanafile", "Kanakoipi", "Kanasuikaleet", "Kuve (Flank steak)",
    "Lohi (tuore)", "Naudan minuuttiliha", "Possun ulkofile", "Ribsit", "Siika", "Valkolihainen kala"
  ],
  "Leikkeleet": [
    "HK herkkumaksamakkara", "Jupe (leivänpäällinen)", "Kallen mätitahna", "Kylmäsavuporo", "Ohuenohut kalkkunaleike",
    "Pekoni", "Pippurimetvursti", "Prosciutto", "Tulinen salami"
  ],
  "Einekset": [
    "Einarisalaatti kanacaesar", "Einarisalaatti kanataco", "Lettuja", "Nakki"
  ],
  "Vegaaniset": [
    "Hunajasuikaleet (vege)", "Muu jauheliha (vege)", "Muu jauhelihamuru", "Tofu (kiinteä, ei vihreä pahvipaketti)",
    "Tofu (luomu / No1 in Sweden)", "Tofu (silken)"
  ],
  "Maitotuotteet": [
    "MAITO: Laktoositon kevyt (sininen)", "MAITO: Laktoositon rasvaton", "MAITO: Laktoositon täys (punainen)",
    "MAITO: Barista kauramaito", "MAITO: Kauramaito (no sugars)", "MAITO: Mantelimaito", "MAITO: Piimä",
    "MAITO: Kookosmaito (Alpro)",
    "VOI: Voi", "VOI: Voimariini", "VOI: Eleplant",
    "KERMA: Kuohukerma", "KERMA: Vispikerma", "KERMA: Kermaviili", "KERMA: Crème fraîche", "KERMA: Oatly ruokakerma",
    "KERMA: Vege vispikerma",
    "JOGURTTI: Kreikkalainen jogurtti", "JOGURTTI: Turkkilainen jogurtti", "JOGURTTI: Luonnonjogurtti (täyteläinen, maustamaton)",
    "JOGURTTI: Oatly kaurajogurtti", "JOGURTTI: Danonino Mansikka", "JOGURTTI: Danonino Vanilja Dino",
    "JOGURTTI: Yogo mansikka", "JOGURTTI: Viilis",
    "RAHKA: Maitorahka pehmeä", "RAHKA: Proteiinirahka", "RAHKA: Raejuusto",
    "MUNA: Kananmunat",
    "JUOMA: Frezza double trouble kylmäkahvi", "JUOMA: Jungle Juice Bar smoothie", "JUOMA: Froosh smoothie",
    "JUOMA: Alpro suklaajuoma", "JUOMA: Alpro plant protein", "JUOMA: Profeel proteiinijuoma",
    "JUOMA: Profeel proteiinimousse", "JUOMA: Oatly matchajuoma", "JUOMA: Benecol juomia"
  ],
  "Juustot": [
    "Emmental (pala)", "Emmental (viipale)", "Emmental (raaste)", "Eränkävijä", "Fetajuusto laktoositon", "Halloumi",
    "Keisarinna (kiteinen Gouda)", "Kermajuusto", "Manchego", "Mascarpone", "Tuorejuusto", "Mozzarellapallo",
    "Mozzarellaraaste", "Oltermanni", "Parmesan (pala)", "Pecorino", "Savuporotuorejuusto"
  ],
  "Kuivat": [
    "RIISI: Basmati", "RIISI: Jasmin", "RIISI: Risotto", "RIISI: Sushiriisi", "RIISI: Valkoinen riisi",
    "MAUSTE: Basilika", "MAUSTE: Cayennepippuri", "MAUSTE: Hieno merisuola", "MAUSTE: Kanaliemikuutiot",
    "MAUSTE: Kanelitanko", "MAUSTE: Karkea merisuola", "MAUSTE: Kasvisliemikuutiot", "MAUSTE: Laakerinlehti",
    "MAUSTE: Lihaliemikuutiot", "MAUSTE: Mustapippuri", "MAUSTE: Oregano", "MAUSTE: Paprikajauhe", "MAUSTE: Rakuuna",
    "MAUSTE: Ribs rub", "MAUSTE: Sipulijauhe", "MAUSTE: Valkosipulijauhe", "MAUSTE: Valkopippuri (jauhettu)",
    "MAUSTE: Valkopippuri (kokonainen)",
    "PASTA: Cannelloni", "PASTA: Farfalle", "PASTA: Fusilli", "PASTA: Gluteeniton lasagne", "PASTA: Gluteeniton pasta",
    "PASTA: Lasagnelevyt", "PASTA: Makaroni", "PASTA: Penne", "PASTA: Spagetti",
    "KAHVI: Caramel latte jauhepussit", "KAHVI: Dolce Gusto cappuccino-kapselit", "KAHVI: Dolce Gusto espresso-kapselit",
    "KAHVI: Espressopavut", "KAHVI: Iced latte jauhepussit", "KAHVI: Nespresso kapselit", "KAHVI: Pikakahvi / Jauhekahvi",
    "KAHVI: Presidentti Sapphire", "KAHVI: Vanilla latte jauhepussit",
    "TEE: Maustettu tee", "TEE: Mellow organic rooibos & mustikka",
    "HIUTALE: Kauraleseet", "HIUTALE: Puurohiutaleet",
    "MURO: Cheerios", "MURO: Elovena proteiinigranola", "MURO: Granola", "MURO: Kellogg's sininen (suklaa)",
    "MURO: Mysli", "MURO: Nesquik", "MURO: Pähkinämysli", "MURO: Rice Krispies", "MURO: Tyynymuro",
    "LEIVONTA: Oboy", "LEIVONTA: Tumma leivontakaakao",
    "TARVIKE: Suodatinpussit"
  ],
  "Kuivat (mutta märät)": [
    "Ananassäilyke", "Barbielonkero", "Chicken broth", "Dijon-sinappi", "Ella's vauvanruokasose", "Happy Joe -siideri",
    "Hernekeitto", "HP-kastike", "Hunaja", "Ketsuppi", "Lihapullapurkki", "Limemehutiiviste", "Majoneesi", "Mango-jäätee",
    "Mustaherukkamehu", "Mutti tomaattimurska", "Mutti tomaattipyree", "MUMs vauvanruokasose", "Oliiviöljy", "Omenamehu",
    "Omenaviinietikka", "Pöytäöljy", "Puolukkahillo", "Punaviini", "Ribsien marinointikastike", "Rypsiöljy", "Sekamehu",
    "Sitruunamehutiiviste", "Sushimajoneesi", "Tonnikala vedessä", "Tumma olut", "Vaahterasiirappi",
    "Vaalea olut", "Vissy"
  ],
  "Jauhot": [
    "JAUHO: Durumvehnäjauho", "JAUHO: Gluteeniton jauhoseos (Sunnuntai)", "JAUHO: Gluteeniton pizzajauho",
    "JAUHO: Korppujauho", "JAUHO: Pankojauho", "JAUHO: Perunajauho", "JAUHO: Pizzajauho",
    "JAUHO: Puolikarkea vehnäjauho", "JAUHO: Tipo 00 -jauho",
    "LEIVONTA: Fariinisokeri", "LEIVONTA: Kuivahiiva", "LEIVONTA: Leivinjauhe", "LEIVONTA: Maizena",
    "LEIVONTA: Palasokeri", "LEIVONTA: Sokeri", "LEIVONTA: Vaniljasokeri",
    "PÄHKINÄ / SIEMEN: Cashewpähkinät", "PÄHKINÄ / SIEMEN: Chia-siemenet", "PÄHKINÄ / SIEMEN: Lidlin pähkinäsekoitus",
    "PÄHKINÄ / SIEMEN: Mantelit", "PÄHKINÄ / SIEMEN: Musta seesaminsiemen",
    "PÄHKINÄ / SIEMEN: Para-/macadamiapähkinät", "PÄHKINÄ / SIEMEN: Pekaanipähkinät",
    "PÄHKINÄ / SIEMEN: Pellavansiemenrouhe", "PÄHKINÄ / SIEMEN: Pinjansiemenet", "PÄHKINÄ / SIEMEN: Saksanpähkinät",
    "Ranskalainen sipulikeitto -pussi"
  ],
  "Aasia / Texmex": [
    "Chiliöljy", "Dark soy sauce", "Garam masala", "Kalakastike", "Kananuudelit", "Kiukkutahna (chilitahna)",
    "Kookosmaito", "Korean chicken powder mix", "Kuppinuudelit", "Leveät riisinuudelit", "Osterikastike",
    "Paahdettu seesamiöljy", "Panang curry -tahna", "Ponzu (soija-sitrus)", "Ramen-nuudelit", "Riisinuudelit",
    "Riisiviinietikka", "Shaoxing-viini", "Soijakastike", "Sriracha", "Sriracha mayo", "Sweet chili -kastike",
    "Teriyaki-kastike", "TEXMEX nachot", "TEXMEX tortillat"
  ],
  "Pakasteet": [
    "Edamamepavut", "Hatsapuri / Prata", "Jäätelöpuikot / -tuutit", "Kalapuikot", "Kananugetit",
    "Karjalanpiirakka (Moilanen)", "Kuningatarmarjat (pakaste)", "Lankkuperunat", "Lohkoperunat", "Mozzarellatikut",
    "Mutakakku (Pirkka)", "Mämmi", "Pakastebanaani (smoothie)", "Pakasteherneet", "Pakastemango", "Pakastemansikat",
    "Pakastemustikat", "Pakastepizza", "Pakastesmoothie-hedelmät", "Pakastevadelmat", "Ranskalaiset (Oolannin)",
    "Thai Cube", "Torttutaikina", "Vaniljajäätelö"
  ],
  "Leivät": [
    "Crackerit", "Esipaistettu patonki", "Gluteeniton paahtoleipä", "Hapankorppu", "Juustosämpylä",
    "Jälkiuunikauraleipä pala", "Kauraleipä (Puikula / Vaasan)", "Paahtoleipä (kaura / vehnä)",
    "Reissumies tosi ohut kaura", "Ruisleipä", "Sitkas ruis", "Vaalea leipä"
  ],
  "Herkut": [
    "Corny-välipalapatukat", "Daim-rakeet", "Dippijauhe", "Elovena patukka", "Elovena välipalakeksit", "Geisha",
    "Haribo-karkit", "Irtokarkit / Karkkipussi", "Juustonaksut", "Keksit juustoille", "Leivontasuklaa",
    "Maissikakut", "Mynthon", "Nutella", "Oreo-keksit", "Pelivälipaloja", "Prinsessakeksit", "Purukumi",
    "Purukumi: Extra vesimeloni", "Purukumi: Fruit mix", "Purukumi: Jenkki Fresh berrymix", "Sipsit", "Suolakeksit",
    "Tuc Bake Rolls", "Tuc-keksit", "Tumma suklaa"
  ],
  "Hygienia": [
    "Aussie hoitoaine (Volume)", "Aussie shampoo (Volume)", "Biojätepussit", "Bliw käsisaippua keittiö (refill)",
    "Bliw käsisaippua sensitive (refill)", "Braun pesuneste", "Cocktail-tikut", "Colgate Total (monipakkaus)",
    "Dödö spray", "Dödö stick", "Dödö: Ella (Dove spray)", "Dödö: Ella (vanilja)", "Dödö: Jussi (Nivea)",
    "Dödö: Pihla (granaattiomena)", "Eko-shampoo (vihreä, Maui)", "Folio", "Garnier ananas -shampoo", "Hammaslanka",
    "Hammasharjat", "Hammastahna", "Hammastikut", "Hiuslakka (Osis Session)", "Hoitoaine", "Jordan-hammasharja 6–9 v",
    "Jussin pesuaine", "Konetiskiaine", "Kynsilakanpoistoaine", "Käsitiskiaine", "Lautasliinat / Servetit",
    "Leivinpaperi", "Lumene micellar-vesi", "Lumene puhdistusvaahto", "Muotoilusuihke", "Niiskuneiti-suihke",
    "Osis kuivashampoo", "Paistopussit", "Paristot / Patterit", "Puuteri",
    "Pyykinpesuaine (Miniriski sensitive colour)", "Roskapussit", "Shampoo", "Suihkusaippua Dove",
    "Sähköhammasharjan vaihtopäät", "Talouspaperi", "Tarraharjan rullat", "Tiskiharjan vaihtopäät", "Tiskisienet",
    "Tolu / Yleispuhdistusaine", "Tolu keittiö", "Tolu kylpyhuone", "Topz-puikot", "Tulitikut", "Tuorekelmu",
    "Vanish tahranpoisto", "Vanulaput", "Väkiviinaetikka", "WC-paperi", "WC-pönttöaine"
  ],
  "Apteekki": [
    "ACO Face Day -voide", "Allergianenäsumute", "Avène Hydrance UV Rich SPF30", "Bafucin (nenävoide)", "Berocca",
    "Burana (punainen)", "Burana / Ibuxin", "Burana 100 mg (pureskeltava)", "Desinfiointiaine", "Devisole",
    "Dexal elektrolyytit", "Flu Acute -kurkkusuihke", "Flu Zink", "Herneproteiinijauhe (mauton)", "Imodium",
    "Lactrase GO", "Lasten Otrivin", "Magnesium", "Melarest tripla", "Melatoniini", "Monivitamiini / D-vitamiini",
    "Movex kylmä-kuumageeli", "Nenäsumute (Otrivin)", "Pamol F 250 mg", "Proteiinijauhe (vege)", "Proteiinipatukat",
    "Puhdas+ hyaluronihappo + kollageeni", "Puhdistamo ilta-magnesium", "Puhdistamo tripla magnesium",
    "Puhdistamo vege-proteiinijauhe (mansikka)", "Puhdistamo vege-proteiinijauhe (suklaa)", "Rautalisä",
    "Strepsils", "Unilääke", "Vita-nalle-vitamiinit (päärynä-omena)"
  ],
  "IKEA": [
    "Kruunukynttilät", "Lämpökynttilät (tuikut)", "Lautasliinat / Servetit IKEA", "Paristot IKEA", "Säilytyslaatikot & purnukat"
  ],
  "Rautakauppa": [
    "Hiomapaperi", "Ilmastointiteippi", "Kiinnikkeet", "Maalarinteippi", "Ruuvit ja proput", "Silikoni / Asennusliima"
  ]
};

const _catalogSeen = new Set();
const DEFAULT_CATALOG = Object.entries(CATALOG_BY_CATEGORY)
  .flatMap(([cat, names]) =>
    [...names]
      .sort((a, b) => a.localeCompare(b, "fi"))
      .map(name => ({ name, cat })))
  .filter(item => {
    const key = item.name.toLowerCase();
    if (_catalogSeen.has(key)) return false;
    _catalogSeen.add(key);
    return true;
  });
