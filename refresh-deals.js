// Corsia – päivän tärppien haku Google-haulla (POST /api/refresh-deals).
// Runko: { categories: [...] }   Vastaus: { deals: [{ cat, name, price, store, mainCat }] }
const { ApiError, callWithSearchFallback, extractText, strList, createHandler } = require("./_lib/gemini");

// Poimii tarjoukset vastauksesta, vaikka mukana olisi selitystekstiä tai lähdeviitteitä.
function parseDeals(data) {
  const text = extractText(data);
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  let arr = [];
  if (start >= 0 && end > start) {
    try { arr = JSON.parse(text.slice(start, end + 1)); } catch (e) { arr = []; }
  }
  if (!Array.isArray(arr) || arr.length === 0) {
    arr = [];
    (text.match(/\{[^{}]*\}/g) || []).forEach(s => { try { arr.push(JSON.parse(s)); } catch (e) {} });
  }
  return arr
    .filter(d => d && d.name)
    .slice(0, 12)
    .map(d => ({
      cat: String(d.cat || "🔥 Tärppi"),
      name: String(d.name),
      price: String(d.price || ""),
      store: String(d.store || ""),
      mainCat: d.mainCat ? String(d.mainCat) : null
    }));
}

module.exports = createHandler(async (key, body) => {
  const cats = strList(body.categories, 40).join(", ");
  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Helsinki"
  });
  const prompt = `Tänään on ${today}. Etsi Google-haulla tämän viikon voimassa olevia ruokatarjouksia Tammiston seudun kaupoista Vantaalla: K-Citymarket Tammisto, Lidl Tammisto, Prisma Jumbo ja K-Citymarket Jumbo. Hyviä lähteitä: k-ruoka.fi/kauppa/k-citymarket-vantaa-tammisto/tarjoukset, k-ruoka.fi/kauppa/k-citymarket-vantaa-jumbo/tarjoukset, s-kaupat.fi/myymala/prisma-jumbo, lidl.fi viikkomainos, sekä kauppojen viikkomainokset. Jos juuri näiden myymälöiden tarjouksia ei löydy, käytä kyseisten ketjujen valtakunnallisia viikkotarjouksia.

Anna 2-3 KOVINTA tarjousta PER KAUPPA (yhteensä 8-12 tarjousta). Painota erityisesti kala- ja lihatarjouksia (lohi, kirjolohi, naudanliha, broileri, jauheliha) – vähintään puolet tarjouksista olkoon kalaa tai lihaa.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä eikä lähdeviitteitä. Jokaisella alkiolla kentät:
"cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price" (esim. "12,90 €/kg"), "store" (kaupan nimi), "mainCat" (yksi näistä: ${cats}).`;

  const deals = await callWithSearchFallback(key, [{ role: "user", parts: [{ text: prompt }] }], parseDeals, 0.3);
  if (deals.length === 0) throw new ApiError(502, "Tarjouksia ei löytynyt – yritä myöhemmin uudelleen");
  return { deals };
});
