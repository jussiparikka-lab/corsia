// Corsia – sovelluslogiikka. Näkymät ovat tiedostossa views.js, tuotekatalogi tiedostossa catalog.js.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQYWVqRwWc1DfQIr-rDrrt0-7XY2I9ReI",
  authDomain: "corsia-perhe.firebaseapp.com",
  projectId: "corsia-perhe",
  storageBucket: "corsia-perhe.firebasestorage.app",
  messagingSenderId: "365392158959",
  appId: "1:365392158959:web:a4581cabe2d2eb5a25fb1a"
};

// Gemini-mallit kokeillaan järjestyksessä. Vanha gemini-2.5-flash antaa uusille avaimille 404-virheen,
// joten uudemmat mallit ovat ensin. Jos mikään ei toimi, sovellus hakee avaimelle sallitut mallit itse.
const GEMINI_MODEL_CANDIDATES = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash"
];
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const STORE_LAYOUTS = {
  "prisma_jumbo": [
    "Muut", "Hevi", "Juurekset", "Hedelmät", "Liha", "Leikkeleet", "Einekset", "Vegaaniset",
    "Maitotuotteet", "Juustot", "Kuivat", "Kuivat (mutta märät)", "Jauhot",
    "Aasia / Texmex", "Pakasteet", "Leivät", "Herkut", "Hygienia"
  ],
  "cm_jumbo": [
    "Hygienia", "Muut", "Herkut", "Maitotuotteet", "Juustot",
    "Leikkeleet", "Einekset", "Vegaaniset", "Liha", "Aasia / Texmex", "Kuivat",
    "Kuivat (mutta märät)", "Jauhot", "Leivät", "Hevi", "Juurekset", "Hedelmät", "Pakasteet"
  ],
  "cm_tammisto": [
    "Hevi", "Juurekset", "Hedelmät", "Maitotuotteet", "Juustot", "Liha",
    "Leikkeleet", "Einekset", "Vegaaniset", "Leivät", "Aasia / Texmex", "Kuivat",
    "Kuivat (mutta märät)", "Jauhot", "Pakasteet", "Hygienia", "Muut", "Herkut"
  ],
  "ikea": ["IKEA"],
  "rautakauppa": ["Rautakauppa"],
  "apteekki": ["Apteekki"]
};

const STORE_NAMES = {
  "prisma_jumbo": "Prisma Jumbo",
  "cm_tammisto": "K-Citymarket Tammisto",
  "cm_jumbo": "K-Citymarket Jumbo",
  "ikea": "IKEA",
  "rautakauppa": "Rautakauppa",
  "apteekki": "Apteekki"
};

const DAILY_DEALS = [
  { id: "d1", cat: "🎉 Avajaistarjoukset (Vantaa)", name: "Uusi Pesula: Harjaton Tehopesu + Vaha", price: "14,90 € (-50%)", store: "Neste K Tammisto", mainCat: "Muut" },
  { id: "d2", cat: "🎉 Avajaistarjoukset (Vantaa)", name: "Naudan ulkofileepala", price: "9,90 €/kg", store: "K-Citymarket Tammisto", mainCat: "Liha" },
  { id: "d3", cat: "🐟 Kala & Merenelävät", name: "Norjan lohifilee (tuore C-leikkuu)", price: "12,90 €/kg (norm. 18,90€)", store: "K-Citymarket Tammisto", mainCat: "Liha" },
  { id: "d4", cat: "🐟 Kala & Merenelävät", name: "Lämminsavustettu kirjolohipala", price: "16,90 €/kg", store: "Prisma Jumbo", mainCat: "Liha" },
  { id: "d5", cat: "🥩 Liha & Siipikarja", name: "Naudan sisäpaisti (A-luokka)", price: "11,90 €/kg (-35%)", store: "K-Citymarket Tammisto", mainCat: "Liha" },
  { id: "d6", cat: "🥩 Liha & Siipikarja", name: "Kariniemen Kananpojan fileesuikaleet 400g", price: "2,99 €/pkt (norm. 4,29€)", store: "Prisma Jumbo", mainCat: "Liha" },
  { id: "d7", cat: "🛒 K-Citymarket Jumbo - Päivän Tärppi", name: "Fiskars Hard Face -paistokasari 28cm", price: "39,90 € Plussalla (norm. 79,90€)", store: "K-Citymarket Jumbo", mainCat: "Muut" },
  { id: "d8", cat: "🍕 Lidlin Teemaviikko", name: "Vitasia Sushilajitelma 400g", price: "4,99 €", store: "Lidl Tammisto", mainCat: "Einekset" },
  { id: "d9", cat: "🚗 Autopesutarjoukset", name: "Tehopesu automaatista PESU24", price: "14,90 € (norm. 29,90€)", store: "Neste K Tammisto", mainCat: "Muut" }
];

const CATEGORY_THEMES = {
  "Hevi": { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: "🥬" },
  "Juurekset": { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", icon: "🥕" },
  "Hedelmät": { bg: "#fff1f2", border: "#fecdd3", text: "#9f1239", icon: "🍎" },
  "Liha": { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "🥩" },
  "Leikkeleet": { bg: "#fff7ed", border: "#ffedd5", text: "#c2410c", icon: "🥓" },
  "Einekset": { bg: "#fefce8", border: "#fef08a", text: "#854d0e", icon: "🍱" },
  "Vegaaniset": { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", icon: "🌱" },
  "Maitotuotteet": { bg: "#f0f9ff", border: "#bae6fd", text: "#075985", icon: "🥛" },
  "Juustot": { bg: "#fefce8", border: "#fde047", text: "#a16207", icon: "🧀" },
  "Kuivat": { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", icon: "🌾" },
  "Kuivat (mutta märät)": { bg: "#f8fafc", border: "#cbd5e1", text: "#1e293b", icon: "🥫" },
  "Jauhot": { bg: "#fafaf9", border: "#e7e5e4", text: "#44403c", icon: "🥣" },
  "Aasia / Texmex": { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "🌮" },
  "Pakasteet": { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "🧊" },
  "Leivät": { bg: "#fffbeb", border: "#fef3c7", text: "#78350f", icon: "🍞" },
  "Herkut": { bg: "#fdf4ff", border: "#f5d0fe", text: "#86198f", icon: "🍫" },
  "Hygienia": { bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", icon: "🧼" },
  "Apteekki": { bg: "#f0fdf4", border: "#86efac", text: "#14532d", icon: "💊" },
  "IKEA": { bg: "#eff6ff", border: "#93c5fd", text: "#1e3a8a", icon: "🛋️" },
  "Rautakauppa": { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", icon: "🔧" },
  "Muut": { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155", icon: "📦" }
};

// ---------- Tila ----------
let appState = {
  items: DEFAULT_CATALOG.map(i => ({ ...i, active: false, done: false, qty: null })),
  deals: [...DAILY_DEALS],
  dealsUpdatedAt: "Oletustärpit"
};

let currentView = "home";
let activeStoreKey = "";
let openCategories = {};
let undoItem = null;
let undoTimer = null;
let dbInstance = null;
let cloudSynced = false;
let wakeLock = null;

// ---------- Apufunktiot ----------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function getEffectiveGeminiKey() {
  return (localStorage.getItem("corsia_gemini_api_key") || "").trim();
}

// Hakee avaimelle sallitut Flash-mallit (uusin ensin).
async function discoverGeminiModels(key) {
  try {
    const r = await fetch(`${GEMINI_BASE_URL}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => String(m.name || "").replace(/^models\//, ""))
      .filter(n => /flash/i.test(n) && !/(tts|image|live|audio|embed|thinking-exp)/i.test(n))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  } catch (e) {
    return [];
  }
}

// Avain lähetetään aina x-goog-api-key -otsakkeessa (pakollinen uusille AQ.-avaimille, toimii myös AIza-avaimilla).
// Jos malli antaa 404 (ei käytössä) tai 429/503 (ruuhka), kokeillaan seuraavaa mallia.
async function callGemini(payload) {
  const key = getEffectiveGeminiKey();
  const saved = localStorage.getItem("corsia_gemini_model");
  const queue = [...new Set([saved, ...GEMINI_MODEL_CANDIDATES].filter(Boolean))];
  const tried = new Set();
  let discovered = false;
  let lastRes = null;

  while (queue.length > 0 || !discovered) {
    if (queue.length === 0) {
      discovered = true;
      (await discoverGeminiModels(key)).forEach(m => { if (!tried.has(m)) queue.push(m); });
      if (queue.length === 0) break;
    }
    const model = queue.shift();
    if (tried.has(model)) continue;
    tried.add(model);

    let res;
    try {
      res = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      throw e; // verkkovirhe – ei kannata kokeilla muita malleja
    }

    if (res.ok) {
      localStorage.setItem("corsia_gemini_model", model);
      return res;
    }
    lastRes = res;
    if (![404, 429, 500, 503].includes(res.status)) break; // esim. väärä avain – muut mallit eivät auta
    if (saved === model) localStorage.removeItem("corsia_gemini_model");
  }
  return lastRes;
}

// Selkokielinen virheilmoitus Geminin vastauksesta.
async function describeGeminiError(res) {
  if (!res) return "Tekoälyyn ei saatu yhteyttä";
  const err = await res.json().catch(() => ({}));
  const msg = String(err?.error?.message || res.statusText || "");
  if (res.status === 400 && /api key|API_KEY/i.test(msg)) return "API-avain ei kelpaa – tarkista avain";
  if (res.status === 401 || res.status === 403) return "API-avaimella ei ole oikeutta Gemini API:in";
  if (res.status === 404) return "Gemini-mallia ei löytynyt tälle avaimelle";
  if (res.status === 429) return "Tekoälyn käyttöraja täynnä – yritä hetken päästä";
  return `Virhe ${res.status}: ${msg.substring(0, 40)}`;
}

// Täsmäosuma ensin, sitten "MAITO: " -etuliitteen jälkeinen nimi, viimeisenä yksiselitteinen osittainen osuma.
function findProduct(name) {
  const n = String(name).trim().toLowerCase();
  const items = appState.items;
  let idx = items.findIndex(i => i.name.toLowerCase() === n);
  if (idx >= 0) return idx;
  idx = items.findIndex(i => i.name.toLowerCase().split(": ").pop() === n);
  if (idx >= 0) return idx;
  const hits = [];
  items.forEach((i, k) => { if (i.name.toLowerCase().includes(n)) hits.push(k); });
  return hits.length === 1 ? hits[0] : -1;
}

// Muuttaa tekoälyn antaman kategorian sovelluksen omaksi kategoriaksi (kirjainkoko, välilyönnit, synonyymit).
const CATEGORY_ALIASES = [
  [/vihann|hevi|salaat|yrtt/, "Hevi"],
  [/juure/, "Juurekset"],
  [/hedelm|marja/, "Hedelmät"],
  [/leikkel|makkar/, "Leikkeleet"],
  [/liha|kala|siipikarj|merenel/, "Liha"],
  [/eines|valmisruo/, "Einekset"],
  [/vegaan|kasvipro/, "Vegaaniset"],
  [/maito|meijer|jogurt|muna/, "Maitotuotteet"],
  [/juust/, "Juustot"],
  [/märät|marat|säilyk|juoma|mehu|olut|siider|öljy|kastike/, "Kuivat (mutta märät)"],
  [/jauho|leivont/, "Jauhot"],
  [/aasia|texmex|tex-mex|meksik/, "Aasia / Texmex"],
  [/pakaste|jääte/, "Pakasteet"],
  [/leip|leivä/, "Leivät"],
  [/herkku|herkut|makeis|karkk|snack|sipsi/, "Herkut"],
  [/hygien|puhdist|pesuaine|kodinhoito|paperi/, "Hygienia"],
  [/apteek|lääk|vitamiin/, "Apteekki"],
  [/ikea|sisustus/, "IKEA"],
  [/rauta|työkalu/, "Rautakauppa"],
  [/kuiva|pasta|riisi|mauste|kahvi|tee|muro/, "Kuivat"]
];

function normalizeCategory(cat) {
  if (!cat) return null;
  const c = String(cat).trim();
  if (CATEGORY_THEMES[c]) return c;
  const lc = c.toLowerCase();
  const exact = Object.keys(CATEGORY_THEMES).find(k => k.toLowerCase() === lc);
  if (exact) return exact;
  if (lc === "muut" || lc === "muu") return "Muut";
  const alias = CATEGORY_ALIASES.find(([re]) => re.test(lc));
  return alias ? alias[1] : null;
}

// Kevyt suomen taivutusten poisto: "maitoa" -> "maito", "banaaneja" -> "banaane"
function stemFi(word) {
  return word.replace(/(eita|eitä|ita|itä|ja|jä|ta|tä|a|ä|t)$/, "");
}

// Etsii katalogista samantapaisen tuotteen ja palauttaa sen kategorian.
function catalogCategoryFor(rawName) {
  const n = String(rawName || "").trim().toLowerCase();
  if (n.length < 3) return null;
  const stem = stemFi(n);
  let best = null;
  let bestScore = 0;
  DEFAULT_CATALOG.forEach(item => {
    const full = item.name.toLowerCase();
    const base = full.split(": ").pop();
    let score = 0;
    if (full === n || base === n) score = 100;
    else if (base.split(/[\s(/,-]+/).some(w => w && (w === n || w === stem))) score = 60;
    else if (stem.length >= 4 && base.includes(stem)) score = 40;
    else if (base.length >= 4 && n.includes(base)) score = 30;
    if (score > bestScore) { bestScore = score; best = item.cat; }
  });
  return best;
}

function categorizeProductName(rawName) {
  const fromCatalog = catalogCategoryFor(rawName);
  if (fromCatalog) return fromCatalog;
  const n = (rawName || "").toLowerCase();
  const has = (...words) => words.some(w => n.includes(w));
  if (has("kananmun", "munat")) return "Maitotuotteet";
  if (has("olut", "kalja", "koff", "karhu", "siideri", "lonkero", "mehu", "öljy", "säilyke", "purkki", "limu", "vissy")) return "Kuivat (mutta märät)";
  if (has("sips", "suklaa", "karkki", "keksi", "naks")) return "Herkut";
  if (has("juusto", "oltermanni")) return "Juustot";
  if (has("maito", "kerma", "voi", "jogurtti", "rahka", "viili", "piimä")) return "Maitotuotteet";
  if (has("pakaste", "jäätelö")) return "Pakasteet";
  if (has("kinkku", "salami", "makkara", "pekoni", "leike")) return "Leikkeleet";
  if (has("kurkku", "tomaatti", "salaatti", "sipuli", "paprika", "chili", "sieni", "kaali")) return "Hevi";
  if (has("peruna", "porkkana", "juures", "punajuuri", "lanttu")) return "Juurekset";
  if (has("banaani", "omena", "appelsiini", "avokado", "päärynä", "sitruuna", "meloni", "marja")) return "Hedelmät";
  if (has("jauheliha", "kana", "lohi", "kala", "pihvi", "liha", "possu", "nauta")) return "Liha";
  if (has("leipä", "ruis", "paahto", "sämpylä", "patonki")) return "Leivät";
  if (has("jauho", "sokeri", "hiiva")) return "Jauhot";
  if (has("pasta", "riisi", "kahvi", "tee", "mauste", "muro", "puuro")) return "Kuivat";
  if (has("wc", "paperi", "pesu", "shampoo", "saippua", "hammas", "roskapussi")) return "Hygienia";
  if (has("burana", "panadol", "pamol", "vitamiini", "laastari", "lääke")) return "Apteekki";
  return "Muut";
}

// Lisää tekoälyn tai tekstin tunnistamat tuotteet listalle oikeaan kategoriaan.
function addParsedProducts(list) {
  const catalogNames = new Set(DEFAULT_CATALOG.map(i => i.name));
  const addedNames = [];
  (list || []).forEach(p => {
    if (!p || !p.name) return;
    let name = String(p.name).trim();
    if (!name) return;
    const qtyNum = parseInt(p.qty, 10);
    const qty = !isNaN(qtyNum) && qtyNum > 1 ? qtyNum : null;
    const aiCat = normalizeCategory(p.cat);

    const idx = findProduct(name);
    if (idx >= 0) {
      const it = appState.items[idx];
      it.active = true;
      it.done = false;
      if (qty) it.qty = qty;
      // Korjataan aiemmin väärään kategoriaan menneet omat tuotteet (katalogin tuotteiden kategoria pysyy)
      if (!catalogNames.has(it.name) && aiCat && it.cat !== aiCat) it.cat = aiCat;
      addedNames.push(it.name);
    } else {
      name = name.charAt(0).toUpperCase() + name.slice(1);
      appState.items.push({
        name,
        cat: aiCat || categorizeProductName(name),
        active: true,
        done: false,
        qty
      });
      addedNames.push(name);
    }
  });
  return addedNames;
}

// Tekoälylle annettava ohje: kategoriat, kaupan oma luokittelu ja katalogin tarkat nimet.
function buildProductPrompt(sourceDescription) {
  const cats = Object.keys(CATEGORY_THEMES).join(", ");
  const catalogLines = DEFAULT_CATALOG.map(i => `${i.name} = ${i.cat}`).join("\n");
  return `Olet tarkka suomalainen kauppa-apuri. ${sourceDescription}

Palauta JSON-lista: [{"name": "Tuotenimi", "cat": "Kategoria", "qty": 1}]

SÄÄNNÖT:
1. "cat" on AINA täsmälleen yksi näistä: ${cats}.
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

// Kutsuu Geminiä ja palauttaa tunnistetut tuotteet. Heittää virheen selkokielisellä viestillä.
async function aiParseProducts(parts) {
  const res = await callGemini({
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  if (!res || !res.ok) throw new Error(await describeGeminiError(res));
  const data = await res.json();
  let raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const m = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(m ? m[0] : raw);
  return Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
}

// ---------- Tallennus: vain muutokset koodin katalogiin nähden ----------
function serializeState() {
  const base = new Set(DEFAULT_CATALOG.map(i => i.name));
  const present = new Set(appState.items.map(i => i.name));
  return {
    active: appState.items.filter(i => i.active).map(i => ({
      name: i.name, cat: i.cat, done: !!i.done, qty: i.qty ?? null
    })),
    custom: appState.items.filter(i => !base.has(i.name)).map(i => ({ name: i.name, cat: i.cat })),
    removed: DEFAULT_CATALOG.filter(i => !present.has(i.name)).map(i => i.name),
    deals: appState.deals,
    dealsUpdatedAt: appState.dealsUpdatedAt
  };
}

function hydrateState(data) {
  const base = new Set(DEFAULT_CATALOG.map(i => i.name));
  if (data.items) {
    // Vanha tallennusmuoto (koko lista). Mukaan otetaan aktiiviset tuotteet;
    // passiiviset katalogin ulkopuoliset ovat yleensä vanhan katalogin nimiä, joten ne jätetään pois.
    data = {
      active: data.items.filter(i => i.active),
      custom: data.items.filter(i => i.active && !base.has(i.name)),
      removed: [],
      deals: data.deals,
      dealsUpdatedAt: data.dealsUpdatedAt
    };
  }
  const removed = new Set(data.removed || []);
  const items = DEFAULT_CATALOG
    .filter(i => !removed.has(i.name))
    .map(i => ({ ...i, active: false, done: false, qty: null }));

  (data.custom || []).forEach(c => {
    if (!items.some(i => i.name === c.name)) {
      items.push({ name: c.name, cat: c.cat, active: false, done: false, qty: null });
    }
  });
  (data.active || []).forEach(a => {
    const it = items.find(i => i.name === a.name);
    if (it) { it.active = true; it.done = !!a.done; it.qty = a.qty ?? null; }
    else items.push({ name: a.name, cat: a.cat, active: true, done: !!a.done, qty: a.qty ?? null });
  });

  appState.items = items;
  if (data.deals) appState.deals = data.deals;
  if (data.dealsUpdatedAt) appState.dealsUpdatedAt = data.dealsUpdatedAt;
}

window.loadLocalState = function() {
  try {
    const saved = localStorage.getItem("corsia_app_state");
    if (saved) hydrateState(JSON.parse(saved));
  } catch (e) {
    console.warn("Paikallisen tilan lataus epäonnistui", e);
  }
};

window.pushToCloud = async function() {
  const data = serializeState();
  try {
    localStorage.setItem("corsia_app_state", JSON.stringify(data));
    if (dbInstance && window.FirebaseModule) {
      const { doc, setDoc } = window.FirebaseModule;
      await setDoc(doc(dbInstance, "corsia_data", "main_list"), data);
    }
  } catch (e) {
    console.warn("Pilvisynkronointi epäonnistui", e);
  }
};

window.initFirebase = function() {
  try {
    if (!window.FirebaseModule) return;
    const { initializeApp, getFirestore, doc, onSnapshot } = window.FirebaseModule;
    const app = initializeApp(FIREBASE_CONFIG);
    dbInstance = getFirestore(app);

    onSnapshot(doc(dbInstance, "corsia_data", "main_list"), (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return; // oma kirjoitus, ei ylikirjoiteta
      if (snapshot.exists()) {
        hydrateState(snapshot.data());
        cloudSynced = true;
        render();
      }
    }, (error) => {
      console.warn("Firebase yhteysvirhe:", error);
    });
  } catch (e) {
    console.warn("Firebase ohitettu:", e);
  }
};

// ---------- Navigointi ----------
window.navigate = async function(view, storeKey = "") {
  currentView = view;
  activeStoreKey = storeKey;

  if (view === "home" || view === "soffa") {
    let needsSave = false;
    appState.items.forEach(i => {
      if (i.active && i.done) {
        i.active = false;
        i.done = false;
        i.qty = null;
        needsSave = true;
      }
    });
    if (needsSave) pushToCloud();
  }

  window.scrollTo(0, 0);
  render();

  if (view === "store") {
    try {
      if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
    } catch (err) { console.warn("Wake lock puuttuu tai estetty:", err); }
  } else if (wakeLock !== null) {
    wakeLock.release().then(() => { wakeLock = null; });
  }
};

document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible" && currentView === "store") {
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {}
  }
});

// ---------- Kotisohva ----------
window.toggleFolder = function(cat) {
  openCategories[cat] = !openCategories[cat];
  const tray = document.getElementById(`tray-${cat}`);
  const chevron = document.getElementById(`chevron-${cat}`);
  if (tray && chevron) {
    tray.style.display = openCategories[cat] ? "flex" : "none";
    chevron.classList.toggle("open", !!openCategories[cat]);
  } else {
    render();
  }
};

window.filterSoffaItems = function(query) {
  const q = query.toLowerCase();
  document.querySelectorAll(".cat-folder-card").forEach(folder => {
    let hasVisible = false;
    const tray = folder.querySelector(".cat-items-tray");
    const chevron = folder.querySelector(".cat-chevron-btn");
    const catId = folder.getAttribute("data-cat");

    folder.querySelectorAll(".product-row-item").forEach(item => {
      const match = item.getAttribute("data-name").toLowerCase().includes(q);
      item.style.display = match ? "flex" : "none";
      if (match) hasVisible = true;
    });

    if (q.length > 0) {
      folder.style.display = hasVisible ? "block" : "none";
      if (hasVisible) {
        if (tray) tray.style.display = "flex";
        if (chevron) chevron.classList.add("open");
      }
    } else {
      folder.style.display = "block";
      const isOpen = !!openCategories[catId];
      if (tray) tray.style.display = isOpen ? "flex" : "none";
      if (chevron) chevron.classList.toggle("open", isOpen);
    }
  });
};

window.toggleItem = function(index) {
  const item = appState.items[index];
  if (!item) return;
  item.active = !item.active;
  if (item.active) item.done = false;
  pushToCloud();
  render();
};

window.promptChangeQty = function(index) {
  const item = appState.items[index];
  if (!item) return;
  const current = item.qty || 1;
  item.qty = current >= 10 ? 1 : current + 1;
  pushToCloud();
  render();
};

window.removeItem = function(index) {
  if (!appState.items[index]) return;
  appState.items.splice(index, 1);
  pushToCloud();
  render();
};

window.markItemDone = function(index) {
  const item = appState.items[index];
  if (!item) return;
  undoItem = { index, previousDone: item.done };
  item.done = true;
  pushToCloud();
  render();
  showUndoBar(`Kerätty: ${item.name}`);
};

window.showUndoBar = function(text) {
  const bar = document.getElementById("undo-bar");
  const label = document.getElementById("undo-label-text");
  if (!bar || !label) return;
  label.innerText = text;
  bar.style.display = "flex";
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { bar.style.display = "none"; }, 4000);
};

window.executeUndo = function() {
  if (undoItem && appState.items[undoItem.index]) {
    appState.items[undoItem.index].done = undoItem.previousDone;
    pushToCloud();
    render();
  }
  const bar = document.getElementById("undo-bar");
  if (bar) bar.style.display = "none";
};

window.addNewProductFromInput = function() {
  const nameInput = document.getElementById("soffa-add-name");
  const qtyInput = document.getElementById("soffa-add-qty");
  const catSelect = document.getElementById("soffa-add-cat");
  if (!nameInput || !nameInput.value.trim()) return;

  const name = nameInput.value.trim();
  const cat = catSelect ? catSelect.value : "Muut";
  const qtyNum = parseInt(qtyInput ? qtyInput.value.trim() : "", 10);
  const qty = (!isNaN(qtyNum) && qtyNum > 0) ? qtyNum : null;

  const existingIdx = appState.items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
  if (existingIdx >= 0) {
    appState.items[existingIdx].active = true;
    appState.items[existingIdx].done = false;
    if (qty) appState.items[existingIdx].qty = qty;
  } else {
    appState.items.push({ name, cat, active: true, done: false, qty });
  }

  nameInput.value = "";
  if (qtyInput) qtyInput.value = "";
  pushToCloud();
  render();
};

// ---------- Tarjoukset ----------
window.toggleDealPicked = function(dealId) {
  const deal = appState.deals.find(d => d.id === dealId);
  if (!deal) return;

  const existingIdx = appState.items.findIndex(i => i.name.toLowerCase() === deal.name.toLowerCase());
  if (existingIdx >= 0) {
    appState.items[existingIdx].active = !appState.items[existingIdx].active;
    appState.items[existingIdx].done = false;
  } else {
    appState.items.push({ name: deal.name, cat: deal.mainCat || "Muut", active: true, done: false, qty: 1 });
  }
  pushToCloud();
  render();
};

window.refreshDealsWithGemini = async function() {
  const btn = document.getElementById("btn-refresh-deals");
  if (btn) btn.innerText = "⏳ Haetaan tuoreita...";

  if (!getEffectiveGeminiKey()) {
    showUndoBar("⚠️ Aseta API-avain asetuksista");
    openDiagnostics();
    if (btn) btn.innerText = "🔄 Hae tuoreet";
    return;
  }

  const cats = Object.keys(CATEGORY_THEMES).join(", ");
  const today = new Date().toLocaleDateString("fi-FI", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });
  const prompt = `Tänään on ${today}. Etsi Google-haulla tämän viikon voimassa olevia ruoka- ja päivittäistavaratarjouksia näistä kaupoista: K-Citymarket Tammisto (Vantaa), Prisma Jumbo (Vantaa), K-Citymarket Jumbo (Vantaa). Hyviä lähteitä: k-ruoka.fi/kauppa/k-citymarket-vantaa-tammisto/tarjoukset, k-ruoka.fi/kauppa/k-citymarket-vantaa-jumbo/tarjoukset, s-kaupat.fi/myymala/prisma-jumbo, sekä kauppojen viikkomainokset. Jos juuri näiden kauppojen tarjouksia ei löydy, käytä K-Citymarketin ja Prisman valtakunnallisia viikkotarjouksia. Painota kala- ja lihatarjouksia. Anna 6-10 tarjousta.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä eikä lähdeviitteitä. Jokaisella alkiolla kentät:
"cat" (lyhyt otsikko emojilla, esim. "🐟 Kala"), "name" (tuote), "price" (esim. "12,90 €/kg"), "store" (kaupan nimi), "mainCat" (yksi näistä: ${cats}).`;

  // Poimii tarjoukset vastauksesta, vaikka mukana olisi selitystekstiä tai lähdeviitteitä.
  const parseDeals = (data) => {
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .filter(p => !p.thought)
      .map(p => p.text || "").join("")
      .replace(/```json/gi, "").replace(/```/g, "");
    const start = text.indexOf("["), end = text.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        const arr = JSON.parse(text.slice(start, end + 1));
        if (Array.isArray(arr)) return arr;
      } catch (e) { /* jatketaan alla */ }
    }
    // Varalla: yksittäiset {...}-objektit
    const objs = [];
    (text.match(/\{[^{}]*\}/g) || []).forEach(s => { try { objs.push(JSON.parse(s)); } catch (e) {} });
    return objs;
  };

  let status = "";
  let deals = [];
  let lastError = "";
  // 1) Google-haulla (tuoreet tarjoukset), 2) ilman hakua, jos haku ei ole avaimella käytössä tai ei löytänyt mitään
  const attempts = [
    { tools: [{ googleSearch: {} }] },
    { generationConfig: { responseMimeType: "application/json", temperature: 0.3 } }
  ];
  for (const extra of attempts) {
    try {
      const response = await callGemini({ contents: [{ role: "user", parts: [{ text: prompt }] }], ...extra });
      if (!response || !response.ok) {
        lastError = await describeGeminiError(response);
        continue;
      }
      deals = parseDeals(await response.json()).filter(d => d && d.name);
      if (deals.length > 0) break;
    } catch (e) {
      console.warn("Deals search error:", e);
      lastError = "Haku epäonnistui – tarkista verkkoyhteys";
    }
  }

  if (deals.length > 0) {
    appState.deals = deals.slice(0, 12).map((d, i) => ({
      id: "ai" + Date.now() + i,
      cat: d.cat || "🔥 Tärppi",
      name: String(d.name),
      price: String(d.price || ""),
      store: String(d.store || ""),
      mainCat: normalizeCategory(d.mainCat) || categorizeProductName(d.name)
    }));
    appState.dealsUpdatedAt = new Date().toLocaleDateString("fi-FI") + " klo " +
      new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
    status = "✓ Päivän tärpit päivitetty!";
  } else {
    status = "⚠️ " + (lastError || "Tarjouksia ei löytynyt – yritä myöhemmin uudelleen");
  }

  await pushToCloud();
  render();
  showUndoBar(status);
};

// ---------- Puhesanelu ja WhatsApp-tuonti ----------
// Korjaus: jokainen sanelu on oma "istuntonsa". Vanhan tunnistimen myöhässä tulevat tapahtumat
// ohitetaan, ja uusi sanelu odottaa että edellinen on oikeasti sulkenut mikrofonin.
// Aiemmin vanha tunnistin jäi auki / sulki uuden sanelun, jolloin toinen äänitys ei toiminut.
let voiceRecognition = null;
let voiceSessionId = 0;
let voiceText = "";
let voiceSilenceTimer = null;
let voiceStarting = false;
let voicePrevEnded = Promise.resolve();

function stopVoiceEngine() {
  const rec = voiceRecognition;
  voiceRecognition = null;
  if (voiceSilenceTimer) { clearTimeout(voiceSilenceTimer); voiceSilenceTimer = null; }
  if (!rec) return;
  voicePrevEnded = new Promise(resolve => {
    const t = setTimeout(resolve, 1200);
    rec.addEventListener("end", () => { clearTimeout(t); resolve(); }, { once: true });
  });
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
  try { rec.abort(); } catch (e) {
    try { rec.stop(); } catch (e2) {}
  }
}

function hideVoiceModal() {
  const modal = document.getElementById("voice-modal");
  if (modal) modal.style.display = "none";
}

window.startVoiceRecognition = async function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showUndoBar("⚠️ Selaimesi ei tue puhesanelua");
    return;
  }
  if (voiceStarting) return;
  voiceStarting = true;

  const mySession = ++voiceSessionId;
  stopVoiceEngine(); // varmistetaan ettei vanha tunnistin ole enää päällä
  voiceText = "";

  const modal = document.getElementById("voice-modal");
  const transcriptBox = document.getElementById("voice-transcript-text");
  if (modal) modal.style.display = "flex";
  if (transcriptBox) transcriptBox.innerText = "Kuunnellaan...";

  await voicePrevEnded;
  if (mySession !== voiceSessionId) { voiceStarting = false; return; }

  const rec = new SpeechRecognition();
  rec.lang = "fi-FI";
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    if (mySession !== voiceSessionId) return;
    // Android Chrome toistaa välillä aiemmat tulokset – yhdistetään päällekkäiset pätkät
    const pieces = [];
    for (let i = 0; i < event.results.length; i++) {
      const t = String(event.results[i][0].transcript || "").trim();
      if (!t) continue;
      const last = pieces[pieces.length - 1];
      if (last && t.toLowerCase().startsWith(last.toLowerCase())) pieces[pieces.length - 1] = t;
      else if (!last || !last.toLowerCase().endsWith(t.toLowerCase())) pieces.push(t);
    }
    voiceText = pieces.join(", ");
    if (transcriptBox) transcriptBox.innerText = voiceText || "Kuunnellaan...";

    if (voiceSilenceTimer) clearTimeout(voiceSilenceTimer);
    voiceSilenceTimer = setTimeout(() => {
      if (mySession === voiceSessionId) finishVoiceRecognition();
    }, 3500);
  };

  rec.onerror = (ev) => {
    if (mySession !== voiceSessionId) return;
    const code = ev?.error;
    console.warn("Speech error:", code);
    if (code === "aborted") return;
    if (code === "no-speech") {
      if (transcriptBox && !voiceText) transcriptBox.innerText = "En kuullut puhetta – yritä uudelleen.";
      return; // onend hoitaa sulkemisen
    }
    if (code === "not-allowed" || code === "service-not-allowed") {
      cancelVoiceRecognition();
      showUndoBar("⚠️ Mikrofonin käyttö on estetty selaimen asetuksista");
      return;
    }
    if (code === "network") {
      cancelVoiceRecognition();
      showUndoBar("⚠️ Puheentunnistus vaatii verkkoyhteyden");
    }
  };

  // Selain voi lopettaa kuuntelun itse (esim. hiljaisuus iPhonella). Silloin tuodaan se mitä kuultiin.
  rec.onend = () => {
    if (mySession !== voiceSessionId) return;
    voiceRecognition = null;
    voicePrevEnded = Promise.resolve();
    if (voiceText.trim()) {
      finishVoiceRecognition();
    } else {
      voiceSessionId++;
      if (voiceSilenceTimer) { clearTimeout(voiceSilenceTimer); voiceSilenceTimer = null; }
      hideVoiceModal();
      showUndoBar("🎙️ Puhetta ei kuultu – kokeile uudelleen");
    }
  };

  voiceRecognition = rec;
  try {
    rec.start();
  } catch (err) {
    console.warn("Speech init error:", err);
    voiceSessionId++;
    voiceRecognition = null;
    hideVoiceModal();
    showUndoBar("⚠️ Sanelun käynnistys epäonnistui – yritä uudelleen");
  }
  voiceStarting = false;
};

window.cancelVoiceRecognition = function() {
  voiceSessionId++;
  stopVoiceEngine();
  voiceText = "";
  hideVoiceModal();
};

window.finishVoiceRecognition = function() {
  const text = voiceText.trim();
  voiceSessionId++;
  stopVoiceEngine();
  voiceText = "";
  hideVoiceModal();
  if (text) processShoppingText(text, "🎙️");
};

// Käsittelee puhutun tai liitetyn tekstin: tekoäly ensin (oikeat kategoriat), muuten paikallinen jäsennys.
async function processShoppingText(rawText, icon = "🎙️") {
  if (getEffectiveGeminiKey()) {
    showUndoBar(`${icon} Tunnistetaan tuotteita...`);
    try {
      const products = await aiParseProducts([{
        text: buildProductPrompt(`Poimi tästä suomenkielisestä ostoslistasta (puhuttu tai kirjoitettu) kaikki tuotteet ja määrät. Muuta taivutetut muodot perusmuotoon (esim. "kaksi maitoa" -> Maito, qty 2).\n\nTEKSTI: "${rawText.replace(/"/g, "'")}"`)
      }]);
      if (products.length > 0) {
        const added = addParsedProducts(products);
        await pushToCloud();
        render();
        showUndoBar(`${icon} Lisätty ${added.length} kpl: ${added.slice(0, 2).join(", ")}${added.length > 2 ? "…" : ""}`);
        return;
      }
    } catch (e) {
      console.warn("AI-jäsennys epäonnistui, käytetään paikallista:", e);
    }
  }
  processFinnishVoiceText(rawText, icon);
}

function processFinnishVoiceText(rawText, icon = "🎙️") {
  const numberMap = {
    "yksi": 1, "kaksi": 2, "kolme": 3, "neljä": 4, "viisi": 5,
    "kuusi": 6, "seitsemän": 7, "kahdeksan": 8, "yhdeksän": 9, "kymmenen": 10
  };

  const phrases = rawText
    .split(/[,;\.\n]|\s+ja\s+|\s+sekä\s+/i)
    .map(p => p.trim())
    .filter(p => p.length > 1);

  const products = phrases.map(phrase => {
    let clean = phrase.toLowerCase();
    let qty = 1;
    const words = clean.split(/\s+/);
    if (words.length > 1) {
      if (numberMap[words[0]]) {
        qty = numberMap[words[0]];
        words.shift();
      } else if (!isNaN(parseInt(words[0], 10))) {
        qty = parseInt(words[0], 10);
        words.shift();
      }
      clean = words.join(" ");
    }
    const baseName = clean
      .replace(/banaaneja/g, "banaani")
      .replace(/omenoita/g, "omenat")
      .replace(/kurkkuja/g, "kurkku")
      .replace(/tomaatteja/g, "tomaatti")
      .replace(/maitoa/g, "maito")
      .replace(/lohta/g, "lohi")
      .replace(/leipää/g, "ruisleipä")
      .replace(/perunoita/g, "peruna");
    return { name: baseName, cat: null, qty };
  });

  const added = addParsedProducts(products);
  pushToCloud();
  render();
  showUndoBar(`${icon} Tunnistettu ${added.length} tuotetta!`);
}

window.openWaModal = function() {
  document.getElementById("wa-modal").style.display = "flex";
};

window.closeWaModal = function() {
  document.getElementById("wa-modal").style.display = "none";
};

window.executeWaImport = function() {
  const area = document.getElementById("wa-text-input");
  const raw = area ? area.value.trim() : "";
  if (!raw) return;
  closeWaModal();
  area.value = "";
  processShoppingText(raw, "💬");
};

// ---------- Kuvanluku ----------
window.triggerCameraInput = function() {
  if (!getEffectiveGeminiKey()) {
    showUndoBar("🔑 Syötä Gemini API -avain kuvanlukua varten");
    openDiagnostics();
    return;
  }
  const fileInp = document.getElementById("camera-file-input");
  if (fileInp) {
    fileInp.value = "";
    fileInp.click();
  }
};

function compressImageForVision(file, maxDimension = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64: compressed.split(",")[1], mimeType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.handleReceiptImage = async function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  if (!getEffectiveGeminiKey()) {
    showUndoBar("⚠️ Aseta API-avain yläpalkin ⚙️-valikosta");
    openDiagnostics();
    return;
  }
  showUndoBar("📷 Tunnistetaan kuvaa tekoälyllä...");

  try {
    const compressed = await compressImageForVision(file, 1200, 0.8);
    const promptText = buildProductPrompt(
      `Tunnista kuvasta kaikki ostettavat tuotteet ja niiden määrät. Kuvassa voi olla fyysinen tuote tai pakkaus (esim. oluttölkki, maitopurkki, leipäpussi), käsin kirjoitettu kauppalappu tai kuitti.`
    );

    const products = await aiParseProducts([
      { text: promptText },
      { inlineData: { mimeType: compressed.mimeType, data: compressed.base64 } }
    ]);

    if (products.length === 0) {
      showUndoBar("⚠️ Kuvasta ei tunnistettu tuotteita");
      return;
    }

    const added = addParsedProducts(products);
    await pushToCloud();
    render();
    showUndoBar(`📷 Lisätty ${added.length} kpl: ${added.slice(0, 2).join(", ")}${added.length > 2 ? "…" : ""}`);
  } catch (err) {
    console.warn("Kuvanlukuvirhe:", err);
    showUndoBar(`⚠️ ${err?.message && !/JSON/.test(err.message) ? err.message : "Kuvan käsittely epäonnistui"}`);
  } finally {
    input.value = ""; // sama kuva voidaan valita uudelleen
  }
};

// ---------- Asetukset ----------
window.saveApiKeyFromModal = function() {
  const inp = document.getElementById("diag-api-key-input");
  if (!inp) return;
  const val = inp.value.trim();
  if (val) {
    localStorage.setItem("corsia_gemini_api_key", val);
    localStorage.removeItem("corsia_gemini_model"); // uusi avain -> malli valitaan uudelleen
    showUndoBar("✓ API-avain tallennettu tälle laitteelle!");
    inp.value = "";
  } else {
    localStorage.removeItem("corsia_gemini_api_key");
    showUndoBar("API-avain poistettu");
  }
  openDiagnostics();
};

window.openDiagnostics = function() {
  const modal = document.getElementById("diag-modal");
  const content = document.getElementById("diag-content-box");
  const keyInp = document.getElementById("diag-api-key-input");
  if (!modal || !content) return;

  const currentKey = getEffectiveGeminiKey();
  const onlineStr = navigator.onLine ? "🟢 Yhdistetty verkkoon" : "🔴 Ei verkkoyhteyttä";
  const cloudStr = cloudSynced ? "🟢 Firebase Firestore aktiivinen" : "🟡 Yhdistetään pilveen...";
  const speechStr = (window.SpeechRecognition || window.webkitSpeechRecognition) ? "🟢 Tuettu (Web Speech API)" : "🔴 Ei selain-tukea";
  const keyStatusStr = currentKey ? `🟢 Tallennettu (${esc(currentKey.substring(0, 5))}...)` : "🔴 Ei avainta (Syötä alle)";

  content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <div><strong>Verkkoyhteys:</strong> ${onlineStr}</div>
      <div><strong>Pilvitietokanta:</strong> ${cloudStr}</div>
      <div><strong>Puhesanelu:</strong> ${speechStr}</div>
      <div><strong>Tekoälymalli:</strong> ${esc(localStorage.getItem("corsia_gemini_model") || "valitaan automaattisesti")}</div>
      <div><strong>API-avain:</strong> ${keyStatusStr}</div>
    </div>
  `;
  if (keyInp) keyInp.value = currentKey;
  modal.style.display = "flex";
};

window.closeDiagModal = function() {
  document.getElementById("diag-modal").style.display = "none";
};

// ---------- Käynnistys ----------
window.initApp = function() {
  loadLocalState();
  render();
  initFirebase();
};

window.addEventListener("DOMContentLoaded", initApp);
