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
2. Jos tuote vastaa alla olevan KATALOGIN tuotetta, käytä "name"-kentässä TÄSMÄLLEEN katalogin nimeä (myös etuliite, esim. "MAITO: Laktoositon kevyt (sininen)") ja sen kategoriaa.
3. Jos tuotetta ei ole katalogissa, anna lyhyt suomenkielinen perusmuotoinen nimi (esim. "maitoa" -> "Maito") ja valitse kategoria saman tyyppisten katalogituotteiden mukaan. Tässä kaupassa:
   - oluet, siiderit, lonkerot, mehut, öljyt, kastikkeet, säilykkeet = Kuivat (mutta märät)
   - kananmunat, jogurtit, rahkat, kylmät maito- ja proteiinijuomat = Maitotuotteet
   - kala ja kana = Liha; makkarat, kinkut ja leivänpäälliset = Leikkeleet
   - vihannekset, salaatit ja tuoreet yrtit = Hevi; perunat ja juurekset = Juurekset
   - pasta, riisi, mausteet, kahvi, tee, murot = Kuivat; jauhot, sokeri, pähkinät = Jauhot
   - karkit, sipsit, keksit, suklaa = Herkut; lääkkeet, vitamiinit, proteiinijauhe = Apteekki
   - pesuaineet, paperit, hammastahna, roskapussit = Hygienia
4. "qty" on kappalemäärä kokonaislukuna (oletus 1). Älä keksi tuotteita, joita ei mainita.
5. Jos tuotteita ei löydy, palauta [].

KATALOGI (nimi = kategoria):
${catalogLines}`;
}

module.exports = createHandler(async (key, body) => {
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
      { text: buildProductPrompt("Tunnista kuvasta kaikki ostettavat tuotteet ja niiden määrät. Kuvassa voi olla fyysinen tuote tai pakkaus (esim. oluttölkki, maitopurkki, leipäpussi), käsin kirjoitettu kauppalappu tai kuitti.", categories, catalog) },
      { inlineData: image }
    ];
  } else if (text) {
    parts = [{ text: buildProductPrompt(`Poimi tästä suomenkielisestä ostoslistasta (puhuttu tai kirjoitettu) kaikki tuotteet ja määrät. Muuta taivutetut muodot perusmuotoon (esim. "kaksi maitoa" -> Maito, qty 2).\n\nTEKSTI: "${text.replace(/"/g, "'")}"`, categories, catalog) }];
  } else {
    throw new ApiError(400, "Teksti tai kuva puuttuu");
  }

  const { data } = await callGemini(key, {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  const parsed = parseJson(extractText(data), "[", "]");
  const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
  return {
    products: list
      .filter(p => p && p.name)
      .slice(0, 80)
      .map(p => ({ name: String(p.name).trim(), cat: p.cat ? String(p.cat) : null, qty: parseInt(p.qty, 10) || 1 }))
  };
});
