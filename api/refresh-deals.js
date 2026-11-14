// Corsia – päivän tärppien haku (POST /api/refresh-deals).
// Runko: { categories: [...] }   Vastaus: { deals: [{ cat, name, price, store, mainCat }] }
//
// Järjestys:
//  1) Geminin Google-haku (maadoitus, gemini-2.5-flash, ei Lite-malleja; tools: [{ googleSearch: {} }]).
//  2) Jos se antaa virheen (400, 429, aikakatkaisu ym.): Tavily-haku (ilmainen, ei korttia) -> haettu teksti
//     annetaan Geminille tavallisena kehotteena ILMAN tools-kenttää. Tekoäly poimii tarjoukset VAIN siitä tekstistä,
//     ja jokaisen hinnan on löydyttävä haetusta tekstistä (muuten tarjous hylätään) – hintoja ei keksitä.
const { ApiError, callGemini, callWithSearchFallback, extractText, strList, createHandler, isSearchBlocked } = require("./_lib/gemini");

const TAVILY_URL = "https://api.tavily.com/search";
const COMBINED_QUERY = "K-Citymarket Tammisto Prisma Jumbo ruokatarjoukset viikko";
const SEARCH_DOMAINS = ["k-ruoka.fi", "s-kaupat.fi", "prisma.fi", "lidl.fi"];
// K-ruoan tarjouslehtisivuilla hinnat ovat tekstinä; luetaan ne suoraan (Tavily Extract) hakutulosten lisäksi.
const LEAFLETS = {
  "K-Citymarket Tammisto": "https://www.k-ruoka.fi/tarjouslehdet/kauppa/k-citymarket-vantaa-tammisto",
  "K-Citymarket Jumbo": "https://www.k-ruoka.fi/tarjouslehdet/kauppa/k-citymarket-vantaa-jumbo"
};
const LEAFLET_CHARS = 16000;  // yhdestä lehtisivusta
const SEARCH_CHARS = 3000;    // yhdestä hakutuloksesta
const TOTAL_CHARS = 45000;    // koko tekoälylle annettava aineisto
const clean = t => String(t || "").replace(/\s+/g, " ").trim();

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
    .slice(0, 80)
    .map(d => ({
      cat: String(d.cat || "🔥 Tärppi"),
      name: String(d.name),
      price: String(d.price || ""),
      store: String(d.store || ""),
      mainCat: d.mainCat ? String(d.mainCat) : null
    }));
}

// Tarjousten määrä: enintään 10 per kauppa (yhteensä enintään 40), kala- ja lihatarjoukset kunkin kaupan alussa
const MAX_PER_STORE = 10;
const MAX_DEALS = 40;
const MEAT_FISH = /(kala|lohi|siika|silakka|kuha|ahven|taimen|katkarap|rapu|äyriäi|liha|nauta|naudan|possu|porsa|sian|broileri|kana|kanan|kalkkuna|pihvi|filee|fileepihvi|paisti|ribsi|kylki|makkara|nakki|kinkku|pekoni|poro|riista|hirvi|lammas|ulkofile|sisäfile|flank|lihapulla)/i;
const isMeatFish = d => d.mainCat === "Liha" || MEAT_FISH.test(`${d.name} ${d.cat}`);

function finalizeDeals(deals) {
  const seen = new Set();
  const groups = new Map();                       // kauppa -> tarjoukset, kauppojen järjestys säilyy
  deals.forEach(d => {
    const key = `${d.store}|${d.name}|${d.price}`.toLowerCase();
    if (seen.has(key)) return;                    // sama tarjous kahdesti pois
    seen.add(key);
    const store = d.store || "";
    if (!groups.has(store)) groups.set(store, []);
    groups.get(store).push(d);
  });
  const out = [];
  groups.forEach(list => {
    const meat = list.filter(isMeatFish), rest = list.filter(d => !isMeatFish(d));
    out.push(...[...meat, ...rest].slice(0, MAX_PER_STORE));   // kala ja liha ensin, enintään 10 / kauppa
  });
  return out.slice(0, MAX_DEALS);
}

async function tavilySearch(apiKey, query, domains) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query, search_depth: "basic", max_results: 10, include_raw_content: true,
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

// Tavily Extract: palauttaa { url: teksti }
async function tavilyExtract(apiKey, urls) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(TAVILY_URL.replace("/search", "/extract"), {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ urls, extract_depth: "advanced", format: "text" }),
      signal: ac.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new ApiError(res.status, String(err?.detail?.error || err?.error || res.statusText || ""));
      e.tavily = true;
      throw e;
    }
    const data = await res.json();
    const out = {};
    (Array.isArray(data?.results) ? data.results : []).forEach(r => { if (r?.url) out[r.url] = clean(r.raw_content || r.content); });
    return out;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const err = new ApiError(502, e?.name === "AbortError" ? "luku vastasi liian hitaasti" : "yhteyttä ei saatu");
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

const authLike = e => e && (e.status === 401 || e.status === 403 || e.status === 429 || e.status === 432 || e.status === 433);

async function dealsViaTavily(keys, cats, today) {
  const diag = [];
  const fail = (status, msg) => { const e = new ApiError(status, msg); e.detail = diag.join("; ").slice(0, 400); return e; };

  // Yksi yhdistetty haku + K-ruoan tarjouslehtisivut suoraan, rinnakkain
  const [extracted, searchResults] = await Promise.all([
    tavilyExtract(keys.tavily, Object.values(LEAFLETS)).catch(e => {
      if (authLike(e)) throw e;
      diag.push(`luku: ${e.status} ${e.message}`);
      return {};
    }),
    (async () => {
      try {
        let r = await tavilySearch(keys.tavily, COMBINED_QUERY, SEARCH_DOMAINS);
        if (r.length === 0) r = await tavilySearch(keys.tavily, COMBINED_QUERY, null);
        return r;
      } catch (e) {
        if (authLike(e)) throw e;
        diag.push(`haku: ${e.status} ${e.message}`);
        return [];
      }
    })()
  ]);

  const sections = [];
  Object.entries(LEAFLETS).forEach(([store, url]) => {
    if (extracted[url]) sections.push(`=== TARJOUSLEHTI: ${store} (${url}) ===\n${extracted[url].slice(0, LEAFLET_CHARS)}`);
  });
  const searchText = searchResults
    .map(x => `LÄHDE: ${x.url}\n${clean(x.raw_content || x.content).slice(0, SEARCH_CHARS)}`)
    .join("\n---\n");
  if (searchText) sections.push(`=== HAKUTULOKSET ===\n${searchText}`);
  diag.push(`lehtisivuja ${Object.keys(extracted).length}, hakutuloksia ${searchResults.length}`);

  const body = sections.join("\n\n").slice(0, TOTAL_CHARS);
  const hay = body.toLowerCase();
  const contentLen = body.split("\n").filter(l => !/^(===|LÄHDE:)/.test(l)).join(" ").trim().length;  // otsikkorivit pois
  if (contentLen < 200) {
    throw fail(502, "Hakutuloksista ei löytynyt tarjoussivujen sisältöä – yritä myöhemmin uudelleen");
  }

  const prompt = `Tänään on ${today}. Alla on hakutuloksista ja kauppojen tarjouslehtisivuilta poimittua tekstiä.
Poimi tekstistä ruokatarjouksia. Säännöt:
1. Käytä VAIN tekstissä näkyviä tarjouksia. Älä keksi tuotteita äläkä arvaa hintoja. Jos hintaa ei näy, jätä tuote pois.
2. Hinta kirjoitetaan täsmälleen niin kuin se tekstissä näkyy (esim. "7,99 €/kg" tai "5,19 €/kpl"); jos tekstissä on vain numero ja yksikkö, käytä niitä.
3. Poimi MAHDOLLISIMMAN MONTA tarjousta: enintään 10 per kauppa (yhteensä enintään 40). Jos kaupasta löytyy vähemmän, anna kaikki löytyneet – älä täytä keksityillä. Painota kala- ja lihatarjouksia (lohi, kirjolohi, siika, naudanliha, possu, broileri, jauheliha, makkarat): niitä vähintään puolet kunkin kaupan tarjouksista, jos niitä on tarjolla, ja ne ensin. Loput ovat muita ruokatarjouksia (maitotuotteet, vihannekset, hedelmät, kuivat tuotteet).
4. "store" on yksi näistä: K-Citymarket Tammisto, K-Citymarket Jumbo, Prisma Jumbo, Lidl Tammisto. Päättele kauppa tarjouslehden otsikosta tai lähteen osoitteesta (k-ruoka.fi = K-Citymarket, prisma.fi tai s-kaupat.fi = Prisma, lidl.fi = Lidl). Jos kauppaa ei voi päätellä, jätä tarjous pois.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä. Kentät: "cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price", "store", "mainCat" (yksi näistä: ${cats}).

${body}`;
  // Tavallinen kutsu ilman tools-kenttää
  const { data } = await callGemini(keys, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  const all = parseDeals(data);
  const kept = finalizeDeals(all.filter(d => supportedByText(d, hay)));
  diag.push(`tekoäly ${all.length}, vahvistui ${kept.length}`);
  if (kept.length === 0) {
    throw fail(502, `Hakutuloksista ei löytynyt varmistettavia tarjouksia (tekoäly ehdotti ${all.length}, vahvistui 0) – yritä myöhemmin uudelleen`);
  }
  return kept;
}

const NO_SEARCH_MSG = "Tarjoushaku tarvitsee verkkohaun, jota Googlen ilmainen avain ei nykyisille malleille tarjoa. Lisää ilmainen Tavily-avain (tavily.com, ei korttia): ⚙️-ikkunaan tai Verceliin nimellä TAVILY_API_KEY";

module.exports = createHandler(async (keys, body) => {
  const cats = strList(body.categories, 40).join(", ");
  const today = new Date().toLocaleDateString("fi-FI", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Helsinki"
  });

  const prompt = `Tänään on ${today}. Etsi Google-haulla tämän viikon voimassa olevia ruokatarjouksia Tammiston seudun kaupoista Vantaalla: K-Citymarket Tammisto, Lidl Tammisto, Prisma Jumbo ja K-Citymarket Jumbo. Hyviä lähteitä: k-ruoka.fi/kauppa/k-citymarket-vantaa-tammisto/tarjoukset, k-ruoka.fi/kauppa/k-citymarket-vantaa-jumbo/tarjoukset, s-kaupat.fi/myymala/prisma-jumbo, lidl.fi viikkomainos, sekä kauppojen viikkomainokset. Jos juuri näiden myymälöiden tarjouksia ei löydy, käytä kyseisten ketjujen valtakunnallisia viikkotarjouksia.

Etsi MAHDOLLISIMMAN MONTA tarjousta: enintään 10 tarjousta PER KAUPPA (yhteensä enintään 40). Jos kaupasta löytyy vähemmän, anna kaikki löytyneet äläkä keksi lisää. Painota erityisesti kala- ja lihatarjouksia (lohi, kirjolohi, siika, naudanliha, possu, broileri, jauheliha, makkarat): vähintään puolet kunkin kaupan tarjouksista olkoon kalaa tai lihaa (jos niitä on tarjolla), ja listaa ne ensin. Loput ovat muita ruokatarjouksia (maitotuotteet, vihannekset, hedelmät, kuivat tuotteet).

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä eikä lähdeviitteitä. Jokaisella alkiolla kentät:
"cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price" (esim. "12,90 €/kg"), "store" (kaupan nimi), "mainCat" (yksi näistä: ${cats}).`;

  // 1) Geminin Google-haku. Jos haku on äskettäin kaatunut (esto), ohitetaan se turhan odotuksen välttämiseksi.
  let groundedErr = null;
  if (keys.gemini) {
    if (isSearchBlocked()) {
      groundedErr = new ApiError(429, "Google-haku ohitettu (äskettäinen virhe)");
    } else {
      try {
        const deals = finalizeDeals(await callWithSearchFallback(keys, [{ role: "user", parts: [{ text: prompt }] }], parseDeals, 0.3, true));
        if (deals.length > 0) return { deals };
        groundedErr = new ApiError(502, "Google-haku ei palauttanut tarjouksia");
      } catch (e) {
        if (!(e instanceof ApiError)) throw e;
        console.error("refresh-deals grounded", e.status, e.message);
        groundedErr = e;
      }
    }
  }

  // 2) Varakeino: Tavily-haku + tavallinen Gemini-kutsu ilman tools-kenttää
  let tavilyErr = null;
  if (keys.tavily) {
    try {
      return { deals: await dealsViaTavily(keys, cats, today) };
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      console.error("refresh-deals tavily", e.status, e.message);
      tavilyErr = e.tavily ? new ApiError(e.status === 429 ? 429 : 502, describeTavily(e)) : e;
    }
  }

  if (tavilyErr) throw tavilyErr;
  const keyProblem = groundedErr && (/api key|API_KEY/i.test(groundedErr.message || "") || groundedErr.status === 401 || groundedErr.status === 403);
  throw keyProblem ? groundedErr : new ApiError(503, NO_SEARCH_MSG);
});
