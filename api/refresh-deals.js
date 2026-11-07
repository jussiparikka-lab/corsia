// Corsia – päivän tärppien haku (POST /api/refresh-deals).
// Runko: { categories: [...] }   Vastaus: { deals: [{ cat, name, price, store, mainCat }] }
//
// Kaksi tapaa, molemmat ilman keksittyjä hintoja:
//  1) Tavily-haku (ilmainen, 1000 hakua/kk, ei korttia): haetaan kauppojen tarjoussivujen tekstiä, tekoäly poimii
//     tarjoukset VAIN siitä tekstistä, ja jokaisen hinnan on löydyttävä haetusta tekstistä (muuten tarjous hylätään).
//  2) Geminin Google-haku (maadoitus): toimii, jos avaimella on verkkohakukiintiötä (Googlen ilmaisella avaimella uusille
//     malleille ei yleensä ole).
const { ApiError, callGemini, callWithSearchFallback, extractText, strList, createHandler } = require("./_lib/gemini");

const TAVILY_URL = "https://api.tavily.com/search";
const STORES = [
  { store: "K-Citymarket Tammisto", query: "K-Citymarket Vantaa Tammisto tarjoukset tämän viikon", domains: ["k-ruoka.fi"] },
  { store: "K-Citymarket Jumbo", query: "K-Citymarket Vantaa Jumbo tarjoukset tämän viikon", domains: ["k-ruoka.fi"] },
  { store: "Prisma Jumbo", query: "Prisma Jumbo Vantaa tarjoukset tämän viikon", domains: ["s-kaupat.fi", "prisma.fi"] },
  { store: "Lidl Tammisto", query: "Lidl Vantaa Tammisto viikkotarjoukset", domains: ["lidl.fi"] }
];
const PER_STORE_CHARS = 3500;

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

async function tavilySearch(apiKey, query, domains) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query, search_depth: "basic", max_results: 4, include_raw_content: true,
        ...(domains && domains.length ? { include_domains: domains } : {})
      }),
      signal: ac.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = String(err?.detail?.error || err?.error || res.statusText || "");
      const e = new ApiError(res.status, msg);
      e.tavily = true;
      throw e;
    }
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const err = new ApiError(502, e?.name === "AbortError" ? "haku vastasi liian hitaasti" : "yhteyttä ei saatu");
    err.tavily = true;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const describeTavily = e => {
  if (e.status === 401 || e.status === 403) return "Tavily-avain ei kelpaa";
  if (e.status === 429 || e.status === 432 || e.status === 433) return "Tavilyn kuukausikiintiö on täynnä";
  return `Tavily-haku epäonnistui (${e.status}: ${e.message})`.slice(0, 140);
};

// Hinta (esim. "9,90 €/kg") hyväksytään vain, jos sen numero esiintyy haetussa tekstissä;
// tuotteen nimestä vähintään yhden pitkän sanan pitää löytyä.
function supportedByText(deal, hay) {
  const text = hay.toLowerCase();
  const num = (String(deal.price).match(/\d+(?:[.,]\d+)?/) || [])[0];
  if (!num) return false;
  const variants = [num, num.replace(",", "."), num.replace(".", ",")];
  if (!variants.some(v => text.includes(v))) return false;
  const words = String(deal.name).toLowerCase().split(/[^a-zäöå0-9]+/).filter(w => w.length >= 4);
  return words.length === 0 ? false : words.some(w => text.includes(w.slice(0, Math.max(4, w.length - 2))));
}

async function dealsViaTavily(keys, cats, today) {
  const results = await Promise.all(STORES.map(async s => {
    let r = await tavilySearch(keys.tavily, s.query, s.domains);
    if (r.length === 0) r = await tavilySearch(keys.tavily, s.query, null); // ei tuloksia verkkotunnuksella -> yleinen haku
    const text = r.map(x => `LÄHDE: ${x.url}\n${String(x.raw_content || x.content || "").replace(/\s+/g, " ").trim()}`).join("\n---\n").slice(0, PER_STORE_CHARS);
    return { store: s.store, text };
  }));
  const hay = results.map(r => r.text).join("\n").toLowerCase();
  if (hay.replace(/lähde:[^\n]*/g, "").trim().length < 200) throw new ApiError(502, "Hakutuloksista ei löytynyt tarjoussivujen sisältöä");

  const material = results.map(r => `=== KAUPPA: ${r.store} ===\n${r.text || "(ei hakutuloksia)"}`).join("\n\n");
  const prompt = `Tänään on ${today}. Alla on hakutuloksista poimittua tekstiä kauppojen tarjoussivuilta.
Poimi tekstistä ruokatarjouksia. Säännöt:
1. Käytä VAIN tekstissä näkyviä tarjouksia. Älä keksi tuotteita äläkä arvaa hintoja. Jos hintaa ei näy, jätä tuote pois.
2. Anna 2-3 KOVINTA tarjousta per kauppa (yhteensä enintään 12). Painota kala- ja lihatarjouksia. Jos kaupasta ei löydy tarjouksia, jätä se pois.
3. "store" on kaupan nimi tekstin KAUPPA-otsikon mukaan.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä. Kentät: "cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price" (esim. "12,90 €/kg", täsmälleen kuten tekstissä), "store", "mainCat" (yksi näistä: ${cats}).

${material}`;
  const { data } = await callGemini(keys, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  const all = parseDeals(data);
  const kept = all.filter(d => supportedByText(d, hay));
  if (kept.length === 0) throw new ApiError(502, "Hakutuloksista ei löytynyt varmistettavia tarjouksia – yritä myöhemmin uudelleen");
  return kept;
}

const NO_SEARCH_MSG = "Tarjoushaku tarvitsee verkkohaun, jota Googlen ilmainen avain ei nykyisille malleille tarjoa. Lisää ilmainen Tavily-avain (tavily.com, ei korttia): ⚙️-ikkunaan tai Verceliin nimellä TAVILY_API_KEY";

module.exports = createHandler(async (keys, body) => {
  const cats = strList(body.categories, 40).join(", ");
  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Helsinki"
  });

  let tavilyError = null;
  if (keys.tavily) {
    try {
      return { deals: await dealsViaTavily(keys, cats, today) };
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      console.error("refresh-deals tavily", e.status, e.message);
      tavilyError = e.tavily ? new ApiError(e.status === 429 ? 429 : 502, describeTavily(e)) : e;
      // jatketaan Geminin Google-hakuun, jos se sattuu toimimaan
    }
  }

  const prompt = `Tänään on ${today}. Etsi Google-haulla tämän viikon voimassa olevia ruokatarjouksia Tammiston seudun kaupoista Vantaalla: K-Citymarket Tammisto, Lidl Tammisto, Prisma Jumbo ja K-Citymarket Jumbo. Hyviä lähteitä: k-ruoka.fi/kauppa/k-citymarket-vantaa-tammisto/tarjoukset, k-ruoka.fi/kauppa/k-citymarket-vantaa-jumbo/tarjoukset, s-kaupat.fi/myymala/prisma-jumbo, lidl.fi viikkomainos, sekä kauppojen viikkomainokset. Jos juuri näiden myymälöiden tarjouksia ei löydy, käytä kyseisten ketjujen valtakunnallisia viikkotarjouksia.

Anna 2-3 KOVINTA tarjousta PER KAUPPA (yhteensä 8-12 tarjousta). Painota erityisesti kala- ja lihatarjouksia (lohi, kirjolohi, naudanliha, broileri, jauheliha) – vähintään puolet tarjouksista olkoon kalaa tai lihaa.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä eikä lähdeviitteitä. Jokaisella alkiolla kentät:
"cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price" (esim. "12,90 €/kg"), "store" (kaupan nimi), "mainCat" (yksi näistä: ${cats}).`;

  let deals;
  try {
    deals = await callWithSearchFallback(keys, [{ role: "user", parts: [{ text: prompt }] }], parseDeals, 0.3, true); // true = vaatii verkkohaun
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    console.error("refresh-deals grounded", e.status, e.message);
    if (tavilyError) throw tavilyError;
    // Verkkohaku ei onnistunut (kiintiö, ei hakutukea tai aikakatkaisu): kerrotaan selvästi, mitä tarvitaan
    const keyProblem = /api key|API_KEY/i.test(e.message || "") || e.status === 401 || e.status === 403;
    throw keyProblem ? e : new ApiError(503, NO_SEARCH_MSG);
  }
  if (deals.length === 0) throw tavilyError || new ApiError(502, "Tarjouksia ei löytynyt – yritä myöhemmin uudelleen");
  return { deals };
});
