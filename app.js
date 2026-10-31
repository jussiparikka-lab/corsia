// Corsia – sovelluslogiikka. Näkymät ovat tiedostossa views.js, tuotekatalogi tiedostossa catalog.js.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQYWVqRwWc1DfQIr-rDrrt0-7XY2I9ReI",
  authDomain: "corsia-perhe.firebaseapp.com",
  projectId: "corsia-perhe",
  storageBucket: "corsia-perhe.firebasestorage.app",
  messagingSenderId: "365392158959",
  appId: "1:365392158959:web:a4581cabe2d2eb5a25fb1a"
};

// Kaikki tekoälykutsut kulkevat Corsian omien palvelinreittien kautta (kansio api/).
// Selain ei kutsu Geminiä suoraan, joten CORS- ja avainongelmia ei ole.

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
const WEEK_DAYS = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
const WEEK_DAY_NAMES = { Ma: "Maanantai", Ti: "Tiistai", Ke: "Keskiviikko", To: "Torstai", Pe: "Perjantai", La: "Lauantai", Su: "Sunnuntai" };
function emptyWeekPlan() {
  return Object.fromEntries(WEEK_DAYS.map(d => [d, null]));
}

let appState = {
  items: DEFAULT_CATALOG.map(i => ({ ...i, active: false, done: false, qty: null })),
  deals: [...DAILY_DEALS],
  dealsUpdatedAt: "Oletustärpit",
  favorites: [],              // tallennetut suosikkireseptit (synkronoidaan Firebaseen)
  weekPlan: emptyWeekPlan()   // viikon ruokalista: päivä -> resepti tai null
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

// Kutsuu Corsian palvelinreittiä (esim. "/api/parse-products"). Palvelin käyttää ympäristömuuttujaa
// GEMINI_API_KEY; siirtymäaikana selaimeen aiemmin tallennettu avain lähetetään varalle otsakkeessa.
async function postApi(path, body) {
  const headers = { "Content-Type": "application/json" };
  const legacyKey = getEffectiveGeminiKey();
  if (legacyKey) headers["x-gemini-key"] = legacyKey;

  let res;
  try {
    res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(navigator.onLine ? "Palvelimeen ei saatu yhteyttä" : "Ei verkkoyhteyttä");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || (res.status === 413 ? "Kuva on liian suuri" : `Palvelinvirhe ${res.status}`);
    try { localStorage.setItem("corsia_last_ai_error", `${new Date().toLocaleString("fi-FI")} – ${res.status}: ${msg}`.substring(0, 400)); } catch (e) {}
    throw new Error(msg);
  }
  if (!data) throw new Error("Palvelimen vastaus oli virheellinen");
  return data;
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

// Tunnistaa tuotteet tekstistä ({ text }) tai kuvasta ({ image }) palvelimella.
// Katalogi lähetetään mukaan, jotta tekoäly käyttää samoja nimiä ja kategorioita kuin sovellus.
async function aiParseProducts(input) {
  const data = await postApi("/api/parse-products", {
    ...input,
    categories: Object.keys(CATEGORY_THEMES),
    catalog: DEFAULT_CATALOG.map(i => [i.name, i.cat])
  });
  return Array.isArray(data.products) ? data.products : [];
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
    dealsUpdatedAt: appState.dealsUpdatedAt,
    favorites: appState.favorites,
    weekPlan: appState.weekPlan
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
  if (Array.isArray(data.favorites)) appState.favorites = data.favorites;
  if (data.weekPlan && typeof data.weekPlan === "object") appState.weekPlan = { ...emptyWeekPlan(), ...data.weekPlan };
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
  if (btn) { btn.innerText = "⏳ Haetaan tuoreita..."; btn.disabled = true; }

  try {
    const data = await postApi("/api/refresh-deals", { categories: Object.keys(CATEGORY_THEMES) });
    const deals = (Array.isArray(data.deals) ? data.deals : []).filter(d => d && d.name);
    if (deals.length === 0) throw new Error("Tarjouksia ei löytynyt – yritä myöhemmin uudelleen");
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
    await pushToCloud();
    render();
    showToast("✓ Päivän tärpit päivitetty!", "success");
  } catch (e) {
    console.warn("Tarjoushaku epäonnistui:", e);
    render();
    showToast(`⚠️ ${e?.message || "Tarjousten haku epäonnistui"}`, "error");
  }
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
  showUndoBar(`${icon} Tunnistetaan tuotteita...`);
  try {
    const products = await aiParseProducts({ text: rawText });
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
  const fileInp = document.getElementById("camera-file-input");
  if (fileInp) {
    fileInp.value = "";
    fileInp.click();
  }
};

// Pienentää kuvan (pisin sivu max 1024 px) ja pakkaa JPEG-muotoon (laatu 0,7) ennen lähetystä.
function compressImageForVision(file, maxDimension = 1024, quality = 0.7) {
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

  try {
    showUndoBar("📷 Tiivistetään kuvaa...");
    const compressed = await compressImageForVision(file, 1024, 0.7);
    showUndoBar("📷 Tunnistetaan tuotteita...");
    const products = await aiParseProducts({ image: compressed });

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
    showToast(`⚠️ ${err?.message || "Kuvan käsittely epäonnistui"}`, "error");
  } finally {
    input.value = ""; // sama kuva voidaan valita uudelleen
  }
};

// ---------- Ruokasuunnittelu ----------
// Kuvataan jääkaapin/kaapin sisältö, palvelin (/api/generate-recipes) tunnistaa raaka-aineet ja
// hakee reseptejä Geminillä. Selain ei kutsu Geminiä suoraan. Puuttuvat ainekset voi lisätä
// suoraan kauppalapulle (appState + Firebase pushToCloud).
const RECIPE_API_URL = "/api/generate-recipes";
const FOODPLAN_STAGES = {
  compress: "Tiivistetään kuvaa...",
  identify: "Tunnistetaan raaka-aineita...",
  recipes: "Haetaan reseptejä..."
};
// Viikon automaattiehdotuksen vaiheet (kuvavaiheet vain, jos kuva on otettu)
const WEEK_STAGES = {
  compress: "Tiivistetään kuvaa...",
  identify: "Tunnistetaan raaka-aineita...",
  week: "Suunnitellaan viikon ruokalistaa..."
};

let foodPlan = {
  image: null,          // { file, previewUrl } – pakataan vasta haun yhteydessä
  diners: 4,
  cookTwice: false,
  cuisines: ["Aasialainen"],
  recipes: [],
  detected: [],         // tunnistetut raaka-aineet
  loading: false,
  stage: null,          // "compress" | "identify" | "recipes"
  error: null,
  addedRecipes: {},     // reseptin indeksi -> true kun ainekset lisätty listalle
  tab: "search",        // "search" | "week" | "favorites"
  loadingKind: null,    // "search" | "week" – kumpi haku on käynnissä
  weekError: null,      // viikon automaattiehdotuksen virhe
  weekAdded: false      // viikon ainekset lisätty kauppalapulle
};

// Ilmoitus ilman PERU-painiketta (virheet ja onnistumiset).
window.showToast = function(text, type = "info") {
  const el = document.getElementById("app-toast");
  if (!el) { showUndoBar(text); return; }
  el.textContent = text;
  el.className = `app-toast app-toast-${type}`;
  el.style.display = "block";
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { el.style.display = "none"; }, type === "error" ? 6000 : 3500);
};

window.triggerFoodPlanCamera = function() {
  const inp = document.getElementById("foodplan-file-input");
  if (inp) {
    inp.value = "";
    inp.click();
  }
};

window.handleFoodPlanImage = function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!/^image\//.test(file.type || "image/")) {
    showToast("⚠️ Valitse kuvatiedosto", "error");
    input.value = "";
    return;
  }
  if (foodPlan.image?.previewUrl) URL.revokeObjectURL(foodPlan.image.previewUrl);
  foodPlan.image = { file, previewUrl: URL.createObjectURL(file) };
  foodPlan.recipes = [];
  foodPlan.detected = [];
  foodPlan.error = null;
  foodPlan.addedRecipes = {};
  input.value = ""; // sama kuva voidaan valita uudelleen
  render();
};

window.setFoodPlanDiners = function(delta) {
  foodPlan.diners = Math.min(12, Math.max(1, foodPlan.diners + delta));
  render();
};

window.toggleCookTwice = function() {
  foodPlan.cookTwice = !foodPlan.cookTwice;
  render();
};

window.toggleFoodPlanCuisine = function(c) {
  const i = foodPlan.cuisines.indexOf(c);
  if (i >= 0) foodPlan.cuisines.splice(i, 1);
  else foodPlan.cuisines.push(c);
  render();
};

function setFoodPlanStage(stage) {
  foodPlan.stage = stage;
  render();
}

window.searchFoodPlanRecipes = async function() {
  if (foodPlan.loading) return;
  if (!foodPlan.image) {
    showToast("📷 Ota ensin kuva raaka-aineista", "info");
    return;
  }

  foodPlan.loading = true;
  foodPlan.loadingKind = "search";
  foodPlan.recipes = [];
  foodPlan.detected = [];
  foodPlan.error = null;
  foodPlan.addedRecipes = {};

  try {
    // 1) Pakkaus selaimessa: max 1024 px, JPEG 0,7
    setFoodPlanStage("compress");
    const compressed = await compressImageForVision(foodPlan.image.file, 1024, 0.7)
      .catch(() => { throw new Error("Kuvan tiivistäminen epäonnistui – kokeile toista kuvaa"); });

    // 2) Raaka-aineiden tunnistus (palvelin)
    setFoodPlanStage("identify");
    const idRes = await postApi(RECIPE_API_URL, { step: "identify", image: compressed });
    foodPlan.detected = Array.isArray(idRes.ingredients) ? idRes.ingredients : [];

    // 3) Reseptien haku ja skaalaus (palvelin, ei kuvaa -> pieni pyyntö)
    setFoodPlanStage("recipes");
    const recRes = await postApi(RECIPE_API_URL, {
      step: "recipes",
      ingredients: foodPlan.detected,
      diners: foodPlan.diners,
      cook_twice: foodPlan.cookTwice,
      cuisines: foodPlan.cuisines,
      categories: Object.keys(CATEGORY_THEMES),
      deals: dealNamesForPrompt()
    });
    const recipes = (Array.isArray(recRes.recipes) ? recRes.recipes : []).filter(r => r && r.recipe_title);
    if (recipes.length === 0) throw new Error("Reseptejä ei saatu – kokeile toista kuvaa");

    foodPlan.recipes = recipes;
    showToast(`🍳 Löytyi ${recipes.length} reseptiä!`, "success");
  } catch (e) {
    console.warn("Reseptihaku epäonnistui:", e);
    foodPlan.error = e?.message || "Reseptien haku epäonnistui";
    showToast(`⚠️ ${foodPlan.error}`, "error");
  } finally {
    foodPlan.loading = false;
    foodPlan.stage = null;
    render();
  }
};

// ---------- Viikon automaattiehdotus ----------
// Täyttää viikon TYHJÄT päivät tekoälyllä: jääkaappikuva (jos otettu), makumaailma, ruokailijat ja tarjoukset.
window.autoFillWeek = async function() {
  if (foodPlan.loading) return;
  const days = WEEK_DAYS.filter(d => !appState.weekPlan[d]);
  if (days.length === 0) {
    showToast("Viikko on jo täynnä – poista päivä, jonka haluat ehdottaa uudelleen", "info");
    return;
  }

  foodPlan.loading = true;
  foodPlan.loadingKind = "week";
  foodPlan.weekError = null;
  try {
    // Kuva on valinnainen; jos raaka-aineet on jo tunnistettu, niitä ei tunnisteta uudelleen.
    if (foodPlan.image && foodPlan.detected.length === 0) {
      setFoodPlanStage("compress");
      const compressed = await compressImageForVision(foodPlan.image.file, 1024, 0.7)
        .catch(() => { throw new Error("Kuvan tiivistäminen epäonnistui – kokeile toista kuvaa"); });
      setFoodPlanStage("identify");
      const idRes = await postApi(RECIPE_API_URL, { step: "identify", image: compressed });
      foodPlan.detected = Array.isArray(idRes.ingredients) ? idRes.ingredients : [];
    }

    setFoodPlanStage("week");
    const res = await postApi(RECIPE_API_URL, {
      step: "week",
      days,
      ingredients: foodPlan.detected,
      diners: foodPlan.diners,
      cook_twice: foodPlan.cookTwice,
      cuisines: foodPlan.cuisines,
      categories: Object.keys(CATEGORY_THEMES),
      deals: dealNamesForPrompt(),
      avoid: WEEK_DAYS.map(d => appState.weekPlan[d]?.recipe_title).filter(Boolean)
    });
    const recipes = (Array.isArray(res.recipes) ? res.recipes : []).filter(r => r && r.recipe_title);
    if (recipes.length === 0) throw new Error("Ruokalistaa ei saatu – yritä uudelleen");
    const resDays = Array.isArray(res.days) ? res.days : days;
    recipes.forEach((r, i) => {
      const d = resDays[i] || days[i];
      if (d && !appState.weekPlan[d]) appState.weekPlan[d] = r;
    });
    foodPlan.weekAdded = false;
    await pushToCloud();
    showToast(`✨ Viikolle lisätty ${recipes.length} reseptiä`, "success");
  } catch (e) {
    console.warn("Viikon ehdotus epäonnistui:", e);
    foodPlan.weekError = e?.message || "Viikon ehdotus epäonnistui";
    showToast(`⚠️ ${foodPlan.weekError}`, "error");
  } finally {
    foodPlan.loading = false;
    foodPlan.stage = null;
    render();
  }
};

// ---------- Tarjoukset resepteihin ----------
// Tunnistaa, onko aines päivän tärpeissä. Verrataan aineksen merkitseviä sanoja (stemmattuna) tarjouksen nimeen.
const DEAL_STOPWORDS = new Set(["tuore", "tuoreet", "kotimainen", "suomalainen", "pakaste", "luomu", "kevyt", "rasvaton"]);
function dealForIngredient(name) {
  const words = String(name || "").toLowerCase().split(/[\s(),/-]+/)
    .filter(w => w.length >= 4 && !DEAL_STOPWORDS.has(w))
    .map(w => stemFi(w))
    .filter(w => w.length >= 4);
  if (words.length === 0) return null;
  return (appState.deals || []).find(d => {
    const dn = String(d.name || "").toLowerCase();
    return words.some(w => dn.includes(w));
  }) || null;
}
window.dealForIngredient = dealForIngredient;

function dealNamesForPrompt() {
  return (appState.deals || []).slice(0, 12).map(d => `${d.name} ${d.price || ""} (${d.store || ""})`.trim());
}

// ---------- Suosikin annosmäärän muutos ----------
// Skaalaa määrämerkkijonon ensimmäisen luvun ("400 g", "1,5 dl", "1/2 tl", "2-3 kpl").
function formatAmountNumber(n, unit) {
  const u = String(unit || "").toLowerCase();
  let v;
  if (/^(g|ml)\b/.test(u)) v = n >= 100 ? Math.round(n / 10) * 10 : Math.max(5, Math.round(n / 5) * 5);
  else if (/^(kpl|prk|pkt|tlk|rs|pss|nippu|kynt)/.test(u)) v = Math.max(0.5, Math.round(n * 2) / 2);
  else v = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(v).replace(".", ",");
}
function scaleAmount(amount, factor) {
  const s = String(amount || "");
  if (!s || factor === 1) return s;
  return s.replace(/(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?(?:\s*-\s*(\d+(?:[.,]\d+)?))?(\s*[a-zA-ZäöåÄÖÅ]*)/, (m, a, den, hi, unit) => {
    const toNum = x => parseFloat(String(x).replace(",", "."));
    const base = den ? toNum(a) / toNum(den) : toNum(a);
    const lo = formatAmountNumber(base * factor, unit.trim());
    const range = hi ? `-${formatAmountNumber(toNum(hi) * factor, unit.trim())}` : "";
    return `${lo}${range}${unit}`;
  });
}

window.setFavoriteServings = function(idx, delta) {
  const f = appState.favorites[idx];
  if (!f) return;
  // Alkuperäiset ainekset talteen ensimmäisellä kerralla, jotta toistuva skaalaus ei kerrytä pyöristysvirhettä.
  if (!Array.isArray(f.base_ingredients)) {
    f.base_ingredients = JSON.parse(JSON.stringify(f.ingredients || []));
    f.base_servings = Number(f.target_servings) || 4;
  }
  const next = Math.min(24, Math.max(1, (Number(f.target_servings) || f.base_servings) + delta));
  if (next === Number(f.target_servings)) return;
  const factor = next / f.base_servings;
  f.target_servings = next;
  f.ingredients = f.base_ingredients.map(i => {
    const amount = scaleAmount(i.amount_needed, factor);
    return {
      ...i,
      amount_needed: amount,
      to_shopping_list: i.in_fridge ? "" : (amount ? `${i.name} (${amount})` : i.name)
    };
  });
  pushToCloud();
  render();
};

// ---------- Viikkolistan jako ----------
async function shareText(title, text) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; }
    catch (e) { if (e?.name === "AbortError") return; }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

window.shareWeekPlan = function() {
  const planned = WEEK_DAYS.filter(d => appState.weekPlan[d]);
  if (planned.length === 0) {
    showToast("Viikon ruokalista on tyhjä", "info");
    return;
  }
  const menu = planned.map(d => {
    const r = appState.weekPlan[d];
    return `${WEEK_DAY_NAMES[d]}: ${r.recipe_title}${r.source_url ? `\n   🔗 ${r.source_url}` : ""}`;
  }).join("\n");
  const shopping = combinedWeekIngredients().map(i => {
    const deal = dealForIngredient(i.name);
    return `• ${i.to_shopping_list}${deal ? ` 🔥 ${deal.price} ${deal.store}` : ""}`;
  }).join("\n");
  const text = `📅 Viikon ruokalista\n\n${menu}${shopping ? `\n\n🛒 Kauppalappu:\n${shopping}` : ""}\n\n– Corsia`;
  shareText("Viikon ruokalista", text);
};

// ---------- Reseptien apufunktiot (haku, suosikit, viikko) ----------
// source: "result" = hakutulos, "fav" = suosikki
function getRecipe(source, idx) {
  return source === "fav" ? appState.favorites[idx] : foodPlan.recipes[idx];
}

function missingIngredients(r) {
  return (Array.isArray(r?.ingredients) ? r.ingredients : [])
    .filter(i => i && !i.in_fridge && String(i.to_shopping_list || i.name || "").trim());
}

const sameRecipe = (a, b) => String(a?.recipe_title || "").toLowerCase() === String(b?.recipe_title || "").toLowerCase();

window.isFavoriteRecipe = function(r) {
  return appState.favorites.some(f => sameRecipe(f, r));
};

window.setFoodPlanTab = function(tab) {
  foodPlan.tab = tab;
  render();
};

// Lisää reseptin kaikki to_shopping_list-rivit pääkauppalapulle oikeisiin kategorioihin.
window.addRecipeToShoppingList = async function(idx) {
  const r = foodPlan.recipes[idx];
  if (!r || foodPlan.addedRecipes[idx]) return;
  const count = await addIngredientsToList(missingIngredients(r));
  if (count > 0) {
    foodPlan.addedRecipes[idx] = true;
    render();
  }
};

window.addFavoriteToShoppingList = function(idx) {
  const r = appState.favorites[idx];
  if (r) addIngredientsToList(missingIngredients(r));
};

// Suosikki päälle/pois. Tallentuu Firebaseen, joten näkyy koko perheelle.
window.toggleFavoriteRecipe = function(source, idx) {
  const r = getRecipe(source, idx);
  if (!r) return;
  const at = appState.favorites.findIndex(f => sameRecipe(f, r));
  if (at >= 0) {
    appState.favorites.splice(at, 1);
    showToast("Poistettu suosikeista", "info");
  } else {
    appState.favorites.unshift({ ...r, saved_at: new Date().toISOString() });
    showToast("⭐ Tallennettu suosikkeihin", "success");
  }
  pushToCloud();
  render();
};

// Liittää reseptin viikon ruokalistan päivälle (korvaa päivän aiemman reseptin).
window.assignRecipeToDay = function(source, idx, day) {
  const r = getRecipe(source, idx);
  if (!r || !WEEK_DAYS.includes(day)) return;
  appState.weekPlan[day] = { ...r };
  foodPlan.weekAdded = false;
  pushToCloud();
  render();
  showToast(`📅 ${r.recipe_title} → ${WEEK_DAY_NAMES[day]}`, "success");
};

window.clearWeekDay = function(day) {
  if (!appState.weekPlan[day]) return;
  appState.weekPlan[day] = null;
  foodPlan.weekAdded = false;
  pushToCloud();
  render();
};

// Yhdistää koko viikon puuttuvat ainekset: sama aines eri päiviltä = yksi rivi, määrät yhdessä.
function combinedWeekIngredients() {
  const byName = new Map();
  WEEK_DAYS.forEach(d => {
    missingIngredients(appState.weekPlan[d]).forEach(ing => {
      const name = String(ing.name || ing.to_shopping_list).trim();
      const k = name.toLowerCase();
      const amount = String(ing.amount_needed || "").trim();
      if (!byName.has(k)) byName.set(k, { name, cat: ing.cat, amounts: [], line: ing.to_shopping_list });
      const e = byName.get(k);
      if (amount) e.amounts.push(amount);
      e.count = (e.count || 0) + 1;
    });
  });
  return [...byName.values()].map(e => {
    const total = sumAmounts(e.amounts);
    return {
      name: e.name,
      cat: e.cat,
      in_fridge: false,
      amount_needed: total,
      to_shopping_list: e.count === 1 && e.line ? e.line : (total ? `${e.name} (${total})` : e.name)
    };
  });
}

// Laskee saman yksikön määrät yhteen: ["1 dl", "2 dl", "1 kpl"] -> "3 dl + 1 kpl". Muut jätetään sellaisenaan.
function sumAmounts(amounts) {
  const sums = new Map();
  const other = [];
  amounts.forEach(a => {
    const m = String(a).trim().match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZäöåÄÖÅ]*)$/);
    if (!m) { other.push(a); return; }
    const unit = m[2].toLowerCase();
    sums.set(unit, (sums.get(unit) || 0) + parseFloat(m[1].replace(",", ".")));
  });
  const parts = [...sums.entries()].map(([u, n]) => `${String(Math.round(n * 10) / 10).replace(".", ",")}${u ? " " + u : ""}`);
  return [...parts, ...other].join(" + ");
}
window.combinedWeekIngredients = combinedWeekIngredients;

window.addWeekToShoppingList = async function() {
  const ings = combinedWeekIngredients();
  if (ings.length === 0) {
    showToast("Viikolla ei ole ostettavia aineksia", "info");
    return;
  }
  const count = await addIngredientsToList(ings);
  if (count > 0) {
    foodPlan.weekAdded = true;
    render();
  }
};

// Jakaa reseptin ja puuttuvat ainekset WhatsAppiin (mobiilissa ensin järjestelmän jakovalikko).
window.shareRecipe = async function(source, idx) {
  const r = getRecipe(source, idx);
  if (!r) return;
  const missing = missingIngredients(r);
  const lines = [
    `🍳 ${r.recipe_title}${r.target_servings ? ` (${r.target_servings} annosta)` : ""}`,
    r.instructions_brief ? `\n${r.instructions_brief}` : "",
    missing.length ? `\n🛒 Ostettavaa:\n${missing.map(i => `• ${i.to_shopping_list || i.name}`).join("\n")}` : "\n✓ Kaikki ainekset löytyvät kotoa",
    r.source_url ? `\n🔗 ${r.source_url}` : "",
    "\n– Corsia"
  ].filter(Boolean);
  shareText(r.recipe_title, lines.join("\n"));
};

// Yhteinen lisäys kauppalapulle. Palauttaa lisättyjen rivien määrän.
async function addIngredientsToList(missing) {
  if (missing.length === 0) {
    showToast("✓ Kaikki ainekset löytyvät jo jääkaapista!", "success");
    return 0;
  }

  const added = [];
  missing.forEach(ing => {
    const name = String(ing.name || "").trim();
    const line = String(ing.to_shopping_list || "").trim() || name;
    const cat = normalizeCategory(ing.cat) || categorizeProductName(name || line);
    // Katalogissa oleva tuote aktivoidaan (säilyttää kaupan järjestyksen), muuten lisätään uusi rivi.
    const existing = name ? findProduct(name) : -1;
    if (existing >= 0) {
      const it = appState.items[existing];
      it.active = true;
      it.done = false;
      added.push(it.name);
    } else {
      const label = line.charAt(0).toUpperCase() + line.slice(1);
      const dup = appState.items.find(i => i.name.toLowerCase() === label.toLowerCase());
      if (dup) { dup.active = true; dup.done = false; }
      else appState.items.push({ name: label, cat, active: true, done: false, qty: null });
      added.push(label);
    }
  });

  render();
  try {
    await pushToCloud();
    showToast(`🛒 Lisätty ${added.length} ainesta kauppalapulle`, "success");
  } catch (e) {
    console.warn("Tallennus epäonnistui:", e);
    showToast("⚠️ Lisätty listalle, mutta pilvitallennus epäonnistui", "error");
  }
  return added.length;
}

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
  const keyStatusStr = currentKey ? `🟢 Tallennettu (${esc(currentKey.substring(0, 5))}...)` : "⚪ Ei tallennettu";

  content.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <div><strong>Verkkoyhteys:</strong> ${onlineStr}</div>
      <div><strong>Pilvitietokanta:</strong> ${cloudStr}</div>
      <div><strong>Puhesanelu:</strong> ${speechStr}</div>
      <div><strong>Viimeisin tekoälyvirhe:</strong> <span style="word-break:break-word;">${esc(localStorage.getItem("corsia_last_ai_error") || "ei virheitä")}</span></div>
      <div><strong>Palvelimen avain (GEMINI_API_KEY):</strong> <span id="diag-server-key">⏳ tarkistetaan...</span></div>
      <div><strong>Selaimen vara-avain:</strong> ${keyStatusStr}</div>
    </div>
  `;
  if (keyInp) keyInp.value = currentKey;
  modal.style.display = "flex";

  fetch("/api/status").then(r => r.json()).then(d => {
    const el = document.getElementById("diag-server-key");
    if (el) el.textContent = d.serverKey ? "🟢 Asetettu" : (currentKey ? "🟡 Ei asetettu – käytetään selaimen vara-avainta" : "🔴 Ei asetettu");
  }).catch(() => {
    const el = document.getElementById("diag-server-key");
    if (el) el.textContent = "🔴 Palvelinta ei tavoitettu";
  });
};

window.closeDiagModal = function() {
  document.getElementById("diag-modal").style.display = "none";
};

// ---------- Kokkaustila (tarkka ohje + näyttö päällä) ----------
// Oma Wake Lock (cookWakeLock), jotta kauppareitin wakeLock ja kokkaustila eivät sotke toisiaan.
// Näkymä piirretään #cooking-overlay-elementtiin, jota render() ei koskaan tyhjennä.
let cooking = null;           // { recipe, data, loading, error, timers, wakeActive, wakeSupported }
let cookWakeLock = null;
let cookTickHandle = null;
let cookAudioCtx = null;
const cookingDetailCache = {}; // "otsikko|annokset" -> ohje (ei haeta uudelleen samalle reseptille)

function renderCooking() {
  let el = document.getElementById("cooking-overlay");
  if (!cooking) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "cooking-overlay";
    el.className = "cook-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Kokkaustila");
    document.body.appendChild(el);
  }
  const prevScroll = el.querySelector(".cook-scroll")?.scrollTop || 0;
  el.innerHTML = renderCookingMode(cooking);
  const sc = el.querySelector(".cook-scroll");
  if (sc && prevScroll) sc.scrollTop = prevScroll;
}

function updateCookWakeBadge() {
  const el = document.getElementById("cook-wake-badge");
  if (el && cooking) el.outerHTML = renderCookWakeBadge(cooking);
}

async function acquireCookWakeLock() {
  const c = cooking;
  if (!c) return;
  if (!("wakeLock" in navigator)) { c.wakeActive = false; updateCookWakeBadge(); return; }
  try {
    const lock = await navigator.wakeLock.request("screen");
    if (cooking !== c) { lock.release().catch(() => {}); return; } // ehdittiin sulkea odottaessa
    cookWakeLock = lock;
    c.wakeActive = true;
    lock.addEventListener("release", () => {
      if (cookWakeLock === lock) cookWakeLock = null;
      if (cooking) { cooking.wakeActive = false; updateCookWakeBadge(); }
    });
  } catch (e) {
    console.warn("Näytön päälläpito estetty:", e);
    c.wakeActive = false;
  }
  updateCookWakeBadge();
}

function releaseCookWakeLock() {
  const lock = cookWakeLock;
  cookWakeLock = null;
  if (lock) lock.release().catch(() => {});
}

// Selain vapauttaa lukon, kun välilehti piilotetaan -> haetaan uudelleen paluussa.
document.addEventListener("visibilitychange", () => {
  if (cooking && document.visibilityState === "visible") {
    if (!cookWakeLock) acquireCookWakeLock();
    tickCookTimers();
  }
});

window.openCookingMode = function(source, idx) {
  const r = getRecipe(source, idx);
  if (!r) return;
  if (cooking) closeCookingMode();
  cooking = { recipe: r, data: null, loading: true, error: null, timers: {}, done: {}, speakingStep: null, speech: null, wakeActive: false, wakeSupported: "wakeLock" in navigator };
  document.body.classList.add("cook-open");
  renderCooking();
  acquireCookWakeLock();   // heti, ennen verkkokutsua (käyttäjän napautuksen aikana)
  cookTickHandle = setInterval(tickCookTimers, 500);
  loadCookingDetail();
};

window.closeCookingMode = function() {
  stopCookSpeech();
  releaseCookWakeLock();
  clearInterval(cookTickHandle);
  cookTickHandle = null;
  cooking = null;
  document.body.classList.remove("cook-open");
  renderCooking();
};

window.retryCookingDetail = function() { loadCookingDetail(); };

async function loadCookingDetail() {
  const c = cooking;
  if (!c) return;
  const r = c.recipe;
  const servings = r.target_servings || foodPlan.diners;
  const cacheKey = `${String(r.recipe_title).toLowerCase()}|${servings}`;
  if (cookingDetailCache[cacheKey]) {
    c.data = cookingDetailCache[cacheKey]; c.loading = false; c.error = null;
    renderCooking();
    return;
  }
  c.loading = true; c.error = null;
  renderCooking();
  try {
    const data = await postApi(RECIPE_API_URL, {
      step: "detail",
      recipe_title: r.recipe_title,
      target_servings: servings,
      ingredients: (Array.isArray(r.ingredients) ? r.ingredients : [])
        .filter(i => i && i.name)
        .map(i => (i.amount_needed || i.amount) ? `${i.name} (${i.amount_needed || i.amount})` : i.name)
    });
    if (cooking !== c) return;
    cookingDetailCache[cacheKey] = data;
    c.data = data;
  } catch (e) {
    if (cooking !== c) return;
    c.error = e?.message || "Tarkan ohjeen haku epäonnistui";
  }
  c.loading = false;
  renderCooking();
}

// ----- Vaiheiden kuittaus (✓ Tehty) -----
function updateCookProgress() {
  const el = document.getElementById("cook-progress");
  if (el && cooking) el.outerHTML = renderCookProgress(cooking);
}

window.toggleCookStepDone = function(n) {
  const c = cooking;
  if (!c || !cookStep(n)) return;
  if (c.done[n]) delete c.done[n]; else c.done[n] = true;
  const done = !!c.done[n];
  const card = document.getElementById(`cook-step-${n}`);
  const btn = document.getElementById(`cook-check-${n}`);
  if (card) {
    card.classList.toggle("cook-step-checked", done);
    const num = card.querySelector(".cook-step-num");
    if (num) num.textContent = done ? "✓" : String(n);
  }
  if (btn) {
    btn.textContent = cookDoneLabel(done);
    btn.classList.toggle("cook-act-done", done);
    btn.setAttribute("aria-pressed", String(done));
  }
  updateCookProgress();
};

// ----- Ääneen luku (Web Speech API, fi-FI) -----
function updateCookSpeakButton(n) {
  const btn = document.getElementById(`cook-speak-${n}`);
  if (btn && cooking) btn.textContent = cookSpeakLabel(cooking.speakingStep === n);
}

// Pysäyttää puheen. Tila nollataan ENSIN, jotta vanhan puheen onend/onerror-kuuntelijat eivät sotke uutta.
function stopCookSpeech() {
  const c = cooking;
  const prev = c ? c.speakingStep : null;
  if (c) { c.speech = null; c.speakingStep = null; }
  if (cookSpeechSupported()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  if (prev !== null) updateCookSpeakButton(prev);
}

function pickFinnishVoice() {
  try {
    const voices = window.speechSynthesis.getVoices() || [];
    return { voices, voice: voices.find(v => /^fi([-_]|$)/i.test(v.lang)) || null };
  } catch (e) { return { voices: [], voice: null }; }
}

window.speakCookStep = function(n) {
  const c = cooking, st = cookStep(n);
  if (!c || !st) return;
  if (!cookSpeechSupported()) { showToast("⚠️ Selain ei tue ääneen lukua", "error"); return; }
  if (c.speakingStep === n) { stopCookSpeech(); return; } // toinen napautus pysäyttää

  stopCookSpeech();
  const u = new SpeechSynthesisUtterance(`Vaihe ${n}. ${st.instruction}`);
  u.lang = "fi-FI";
  u.rate = 0.95;
  const { voices, voice } = pickFinnishVoice();
  if (voice) u.voice = voice;
  else if (voices.length > 0 && !c.voiceWarned) {
    c.voiceWarned = true;
    showToast("ℹ️ Suomenkielistä ääntä ei löytynyt – käytetään laitteen oletusääntä", "info");
  }
  const finish = () => {
    if (cooking && cooking.speech === u) { cooking.speech = null; cooking.speakingStep = null; updateCookSpeakButton(n); }
  };
  u.onend = finish;
  u.onerror = finish;
  c.speech = u;
  c.speakingStep = n;
  updateCookSpeakButton(n);
  try { window.speechSynthesis.speak(u); } catch (e) { finish(); }
};

// ----- Ajastimet: loppuaika (endAt) talletetaan, joten taustalla hidastettu ajastin ei laahaa -----
function cookStep(n) { return cooking?.data?.steps?.find(s => s.step_number === n); }

function updateCookTimerButton(n) {
  const st = cookStep(n), btn = document.getElementById(`cook-timer-${n}`);
  if (!st || !btn || !cooking) return;
  const ts = cookTimerState(cooking, n, st.timer_seconds);
  btn.className = `cook-timer-btn ${ts.cls}`;
  btn.textContent = ts.label;
}

window.toggleCookTimer = function(n) {
  const st = cookStep(n);
  if (!st || !cooking) return;
  unlockCookAudio();
  const t = cooking.timers[n];
  if (t) delete cooking.timers[n]; // käynnissä tai valmis -> nollaa
  else cooking.timers[n] = { endAt: Date.now() + st.timer_seconds * 1000, done: false };
  updateCookTimerButton(n);
};

function tickCookTimers() {
  if (!cooking) return;
  Object.keys(cooking.timers).forEach(k => {
    const n = Number(k), t = cooking.timers[k];
    if (t.done) return;
    if (Date.now() >= t.endAt) {
      t.done = true;
      cookTimerAlarm(n);
    }
    updateCookTimerButton(n);
  });
}

function unlockCookAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!cookAudioCtx) cookAudioCtx = new AC();
    if (cookAudioCtx.state === "suspended") cookAudioCtx.resume();
  } catch (e) {}
}

function cookTimerAlarm(n) {
  const st = cookStep(n);
  showToast(`⏰ Ajastin valmis: ${st ? st.title : "vaihe " + n}`, "success");
  try { if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) {}
  try {
    if (!cookAudioCtx) return;
    [0, 0.45, 0.9].forEach(offset => {
      const osc = cookAudioCtx.createOscillator(), gain = cookAudioCtx.createGain();
      osc.type = "sine"; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, cookAudioCtx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, cookAudioCtx.currentTime + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, cookAudioCtx.currentTime + offset + 0.3);
      osc.connect(gain); gain.connect(cookAudioCtx.destination);
      osc.start(cookAudioCtx.currentTime + offset); osc.stop(cookAudioCtx.currentTime + offset + 0.32);
    });
  } catch (e) {}
}

// ---------- Käynnistys ----------
window.initApp = function() {
  loadLocalState();
  render();
  initFirebase();
};

window.addEventListener("DOMContentLoaded", initApp);
