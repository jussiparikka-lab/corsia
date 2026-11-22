// Corsia – ostoslistan tunnistus tekstistä tai kuvasta (POST /api/parse-products).
// Runko: { text?: string, image?: { base64, mimeType }, catalog: [[nimi, kategoria], ...], categories: [...] }
// Vastaus: { products: [{ name, cat, qty }] }
const { ApiError, callGemini, extractText, parseJson, validateImage, strList, createHandler } = require("./_lib/gemini");

function buildProductPrompt(sourceDescription, categories, catalog) {
  const catalogLines = catalog.map(([n, c]) => `${n} = ${c}`).join("\n");
  return `Olet tarkka suomalainen kauppa-apuri. ${sourceDescription}

Palauta JSON-lista: [{"name": "Tuotenimi", "cat": "Kategoria", "qty": 1}]

SÄÄNNÖT:
1. "cat" on AINA täsmälleen yksi näistä: ${categories.join(", ")}.
2. TUOTEMERKKI JA TARKKA NIMIKE SÄILYVÄT (tärkein sääntö). Jos mainitaan tai pakkauksessa näkyy tuotemerkki (esim. Coop, Pirkka, Valio, Arla, Atria, HK, Fazer, Oatly, Apetit, Saarioinen, Elovena, X-tra, Rainbow, Eldorado) tai tarkka tuotenimi tai tarkenne (esim. "rypsiöljyvalmiste", "laktoositon kevytmaito", "grillimaustettu"), kirjoita "name" muotoon [tuotemerkki] + tuote täsmälleen kuten se sanottiin tai pakkauksessa lukee. ÄLÄ pelkistä yleisnimeksi, älä poista tuotemerkkiä äläkä vaihda sitä katalogin yleisnimeen. Esimerkit:
   - "Coop rypsiöljyvalmiste" -> {"name": "Coop rypsiöljyvalmiste", "cat": "Kuivat (mutta märät)", "qty": 1}   (EI "Rypsiöljy")
   - "kaksi Valio laktoositonta kevytmaitoa" -> {"name": "Valio laktoositon kevytmaito", "cat": "Maitotuotteet", "qty": 2}
   - "Pirkka kauramaito" -> {"name": "Pirkka kauramaito", "cat": "Maitotuotteet", "qty": 1}
3. Käytä katalogin nimeä TÄSMÄLLEEN (myös etuliite, esim. "MAITO: Laktoositon kevyt (sininen)") VAIN, kun tuote on yleisnimi ilman tuotemerkkiä ja ilman erityistä tarkennetta ja vastaa suoraan katalogin tuotetta (esim. "kaksi maitoa" -> katalogin maito, qty 2). Brändätylle tai tarkasti nimetylle tuotteelle ota katalogista vain kategoria samankaltaisen tuotteen mukaan.
4. Jos tuotetta ei ole katalogissa: anna suomenkielinen nimi, jossa taivutus on perusmuodossa (esim. "maitoa" -> "Maito") mutta tuotemerkki ja tarkenteet säilyvät, ja valitse kategoria saman tyyppisten katalogituotteiden mukaan. Tässä kaupassa:
   - oluet, siiderit, lonkerot, mehut, öljyt, kastikkeet, säilykkeet = Kuivat (mutta märät)
   - kananmunat, jogurtit, rahkat, kylmät maito- ja proteiinijuomat = Maitotuotteet
   - kala ja kana = Liha; makkarat, kinkut ja leivänpäälliset = Leikkeleet
   - vihannekset, salaatit ja tuoreet yrtit = Hevi; perunat ja juurekset = Juurekset
   - pasta, riisi, mausteet, kahvi, tee, murot = Kuivat; jauhot, sokeri, pähkinät = Jauhot
   - karkit, sipsit, keksit, suklaa = Herkut; lääkkeet, vitamiinit, proteiinijauhe = Apteekki
   - pesuaineet, paperit, hammastahna, roskapussit = Hygienia
5. "qty" on kappalemäärä kokonaislukuna (oletus 1); pakkauskoko (esim. "1 litra") ei ole kappalemäärä. Älä keksi tuotteita, joita ei mainita.
6. Jos tuotteita ei löydy, palauta [].

KATALOGI (nimi = kategoria):
${catalogLines}`;
}

// Yleisimmät tuotemerkit. Jos tekoäly pudottaa tällaisen merkin puhutusta/kirjoitetusta nimikkeestä, se palautetaan.
const BRANDS = ["Pirkka Parhaat", "Pirkka Luomu", "Coop", "Pirkka", "Valio", "Arla", "Atria", "HK", "Fazer", "Oatly", "Apetit", "Saarioinen", "Elovena", "Kotimaista",
  "Rainbow", "X-tra", "K-Menu", "Eldorado", "Heinz", "Barilla", "Findus", "Mutti", "Paulig", "Santa Maria", "Old El Paso", "Dolmio", "Alpro", "Planti", "Gefilus",
  "Hartwall", "Olvi", "Sinebrychoff", "Milbona", "Ingman", "Via Verde", "Vitasia"];
const escapeRe = w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text, word) => new RegExp("(^|[^a-zåäö0-9])" + escapeRe(word) + "(?=$|[^a-zåäö0-9])", "i").test(text);
const stripQty = phrase => phrase.replace(/^\s*(\d+\s*(kpl|x)?|yksi|kaksi|kolme|neljä|viisi|kuusi|seitsemän|kahdeksan|yhdeksän|kymmenen)\s+/i, "").trim();

function restoreBrands(text, products) {
  const phrases = String(text || "").split(/[,;\n]|\.\s|\s+ja\s+|\s+sekä\s+/i).map(x => x.trim()).filter(Boolean);
  const used = new Set();
  return products.map(p => {
    const nameL = String(p.name).toLowerCase();
    for (let i = 0; i < phrases.length; i++) {
      if (used.has(i)) continue;
      const phrase = phrases[i], phraseL = phrase.toLowerCase();
      const brand = BRANDS.find(b => hasWord(phraseL, b.toLowerCase()));
      if (!brand) continue;
      if (hasWord(nameL, brand.toLowerCase())) { used.add(i); break; }          // merkki on jo nimessä
      const words = t => t.split(/[^a-zåäö0-9]+/).filter(w => w.length >= 4);
      const nameWords = words(nameL), phraseWords = words(phraseL).filter(w => w !== brand.toLowerCase());
      const sameProduct = nameWords.some(nw => phraseWords.some(pw =>
        pw.startsWith(nw.slice(0, Math.max(4, nw.length - 2))) || nw.startsWith(pw.slice(0, Math.max(4, pw.length - 2)))));
      if (!sameProduct) continue;
      used.add(i);
      // Puhutun fraasin viimeinen sana perusmuotoon, jos se on selvästi partitiivi ("kevytmaitoa" -> "kevytmaito")
      const restored = stripQty(phrase).replace(/([a-zåäö]{3,}(?:o|u))a$|([a-zåäö]{3,}(?:ö|y))ä$/i, (m, a, b) => a || b);
      return { ...p, name: restored.charAt(0).toUpperCase() + restored.slice(1) };   // tuotemerkki ja tarkka nimike takaisin
    }
    return p;
  });
}

const handler = createHandler(async (key, body) => {
  const categories = strList(body.categories, 40);
  const catalog = (Array.isArray(body.catalog) ? body.catalog : [])
    .filter(p => Array.isArray(p) && p[0])
    .slice(0, 600)
    .map(([n, c]) => [String(n).slice(0, 120), String(c || "").slice(0, 40)]);
  const text = String(body.text || "").trim().slice(0, 4000);

  let parts;
  if (body.image) {
    const image = validateImage(body.image);
    parts = [
      { text: buildProductPrompt("Tunnista kuvasta kaikki ostettavat tuotteet ja niiden määrät. Kuvassa voi olla fyysinen tuote tai pakkaus (esim. oluttölkki, maitopurkki, leipäpussi), käsin kirjoitettu kauppalappu tai kuitti. Lue pakkauksesta TUOTEMERKKI ja tuotteen tarkka nimi ja kirjoita ne name-kenttään (esim. \"Pirkka kauramaito\", \"Coop rypsiöljyvalmiste\"); älä pelkistä niitä yleisnimeksi. Pakkauskokoa ei tarvita.", categories, catalog) },
      { inlineData: image }
    ];
  } else if (text) {
    parts = [{ text: buildProductPrompt(`Poimi tästä suomenkielisestä ostoslistasta (puhuttu tai kirjoitettu) kaikki tuotteet ja määrät. Taivutetut muodot saa muuttaa perusmuotoon (esim. \"kaksi maitoa\" -> Maito, qty 2), mutta tuotemerkki ja tuotteen tarkka nimike säilytetään (esim. \"Coop rypsiöljyvalmiste\" pysyy sellaisenaan).\n\nTEKSTI: "${text.replace(/"/g, "'")}"`, categories, catalog) }];
  } else {
    throw new ApiError(400, "Teksti tai kuva puuttuu");
  }

  const { data } = await callGemini(key, {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  const parsed = parseJson(extractText(data), "[", "]");
  const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
  let products = list
    .filter(p => p && p.name)
    .slice(0, 80)
    .map(p => ({ name: String(p.name).trim(), cat: p.cat ? String(p.cat) : null, qty: parseInt(p.qty, 10) || 1 }));
  if (!body.image && text) products = restoreBrands(text, products);   // tuotemerkki ei saa pudota pois puhutusta nimikkeestä
  return { products };
});

module.exports = handler;
module.exports.restoreBrands = restoreBrands;
