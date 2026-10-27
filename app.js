// Corsia – sovelluslogiikka. Näkymät ovat tiedostossa views.js, tuotekatalogi tiedostossa catalog.js.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQYWVqRwWc1DfQIr-rDrrt0-7XY2I9ReI",
  authDomain: "corsia-perhe.firebaseapp.com",
  projectId: "corsia-perhe",
  storageBucket: "corsia-perhe.firebasestorage.app",
  messagingSenderId: "365392158959",
  appId: "1:365392158959:web:a4581cabe2d2eb5a25fb1a"
};

// Vaihda tähän, jos malli poistuu käytöstä
const GEMINI_MODEL = "gemini-2.5-flash";

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

function callGemini(payload) {
  const key = getEffectiveGeminiKey();
  const isAQ = key.startsWith("AQ.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
    + (isAQ ? "" : `?key=${encodeURIComponent(key)}`);
  const headers = { "Content-Type": "application/json" };
  if (isAQ) headers["x-goog-api-key"] = key;
  return fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
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

function categorizeProductName(rawName) {
  const n = (rawName || "").toLowerCase();
  if (n.includes("olut") || n.includes("kalja") || n.includes("koff") || n.includes("karhu") || n.includes("siideri") || n.includes("lonkero") || n.includes("sips") || n.includes("suklaa")) return "Herkut";
  if (n.includes("maito") || n.includes("kerma") || n.includes("voi") || n.includes("jogurtti") || n.includes("rahka")) return "Maitotuotteet";
  if (n.includes("kurkku") || n.includes("tomaatti") || n.includes("salaatti") || n.includes("sipuli") || n.includes("paprika") || n.includes("chili")) return "Hevi";
  if (n.includes("peruna") || n.includes("porkkana") || n.includes("juures")) return "Juurekset";
  if (n.includes("banaani") || n.includes("omena") || n.includes("appelsiini") || n.includes("avokado")) return "Hedelmät";
  if (n.includes("jauheliha") || n.includes("kana") || n.includes("lohi") || n.includes("kala") || n.includes("pihvi")) return "Liha";
  if (n.includes("leipä") || n.includes("ruis") || n.includes("paahto")) return "Leivät";
  if (n.includes("juusto") || n.includes("oltermanni")) return "Juustot";
  if (n.includes("pasta") || n.includes("riisi") || n.includes("kahvi") || n.includes("jauho")) return "Kuivat";
  if (n.includes("wc") || n.includes("paperi") || n.includes("pesu") || n.includes("shampoo")) return "Hygienia";
  return "Muut";
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
  const prompt = `Hae ajankohtaiset päivittäistavaratarjoukset ja ruokatarjoukset Vantaan alueelta (K-Citymarket Tammisto, Prisma Jumbo, K-Citymarket Jumbo ja Neste K Tammisto autopesu). Keskity erityisesti kalatarjouksiin (esim. lohi, siika) ja muihin todella hyviin ruokatarjouksiin Tammiston alueella. Hae 6-10 aitoa tarjousta.

Palauta VAIN JSON-taulukko ilman markdownia tai muuta tekstiä. Jokaisella alkiolla kentät:
"cat" (lyhyt otsikko emojilla, esim. "🐟 Kalaruoka"), "name" (tuote), "price" (esim. "12,90 €/kg"), "store" (kaupan nimi), "mainCat" (yksi näistä: ${cats}).`;

  let status = "";
  try {
    // googleSearch ei toimi yhdessä JSON-vastausmuodon kanssa, joten JSON pyydetään promptissa
    const response = await callGemini({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }]
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      status = `Virhe ${response.status}: ${(err?.error?.message || response.statusText).substring(0, 40)}`;
    } else {
      const data = await response.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
      const match = text.replace(/```json/gi, "").replace(/```/g, "").match(/\[[\s\S]*\]/);
      const parsed = match ? JSON.parse(match[0]) : [];

      if (Array.isArray(parsed) && parsed.length > 0) {
        appState.deals = parsed.filter(d => d && d.name).map((d, i) => ({
          id: "ai" + i,
          cat: d.cat || "🔥 Tärppi",
          name: String(d.name),
          price: String(d.price || ""),
          store: String(d.store || ""),
          mainCat: CATEGORY_THEMES[d.mainCat] ? d.mainCat : "Muut"
        }));
        appState.dealsUpdatedAt = new Date().toLocaleDateString("fi-FI") + " klo " +
          new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
        status = "✓ Päivän tärpit päivitetty!";
      } else {
        status = "⚠️ Tarjouksia ei löytynyt";
      }
    }
  } catch (e) {
    console.warn("Deals search error:", e);
    status = "⚠️ Haku epäonnistui";
  }

  await pushToCloud();
  render();
  showUndoBar(status);
};

// ---------- Puhesanelu ja WhatsApp-tuonti ----------
let voiceRecognition = null;
let accumulatedVoiceText = "";
let voiceSilenceTimer = null;

window.startVoiceRecognition = function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showUndoBar("⚠️ Selaimesi ei tue puhesanelua");
    return;
  }

  accumulatedVoiceText = "";
  const modal = document.getElementById("voice-modal");
  const transcriptBox = document.getElementById("voice-transcript-text");
  if (modal) modal.style.display = "flex";
  if (transcriptBox) transcriptBox.innerText = "Kuunnellaan...";

  try {
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.lang = "fi-FI";
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = true;

    voiceRecognition.onresult = (event) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + " ";
      }
      accumulatedVoiceText = current.trim();
      if (transcriptBox) transcriptBox.innerText = accumulatedVoiceText;

      if (voiceSilenceTimer) clearTimeout(voiceSilenceTimer);
      voiceSilenceTimer = setTimeout(() => finishVoiceRecognition(), 3500);
    };
    voiceRecognition.onerror = (err) => console.warn("Speech error:", err);
    voiceRecognition.start();
  } catch (err) {
    console.warn("Speech init error:", err);
  }
};

window.cancelVoiceRecognition = function() {
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch (e) {}
    voiceRecognition = null;
  }
  if (voiceSilenceTimer) clearTimeout(voiceSilenceTimer);
  document.getElementById("voice-modal").style.display = "none";
};

window.finishVoiceRecognition = function() {
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch (e) {}
    voiceRecognition = null;
  }
  if (voiceSilenceTimer) clearTimeout(voiceSilenceTimer);
  document.getElementById("voice-modal").style.display = "none";
  if (accumulatedVoiceText.trim()) processFinnishVoiceText(accumulatedVoiceText);
};

function processFinnishVoiceText(rawText) {
  const numberMap = {
    "yksi": 1, "kaksi": 2, "kolme": 3, "neljä": 4, "viisi": 5,
    "kuusi": 6, "seitsemän": 7, "kahdeksan": 8, "yhdeksän": 9, "kymmenen": 10
  };

  const phrases = rawText
    .split(/[,;\.\n]|\s+ja\s+|\s+sekä\s+/i)
    .map(p => p.trim())
    .filter(p => p.length > 1);

  let addedCount = 0;

  phrases.forEach(phrase => {
    let clean = phrase.toLowerCase();
    let qty = 1;

    const words = clean.split(/\s+/);
    if (words.length > 1) {
      if (numberMap[words[0]]) {
        qty = numberMap[words[0]];
        words.shift();
        clean = words.join(" ");
      } else if (!isNaN(parseInt(words[0], 10))) {
        qty = parseInt(words[0], 10);
        words.shift();
        clean = words.join(" ");
      }
    }

    let baseName = clean
      .replace(/banaaneja/g, "banaani")
      .replace(/omenoita/g, "omenat")
      .replace(/kurkkuja/g, "kurkku")
      .replace(/tomaatteja/g, "tomaatti")
      .replace(/maitoa/g, "maito")
      .replace(/lohta/g, "lohi")
      .replace(/leipää/g, "ruisleipä")
      .replace(/perunoita/g, "peruna");

    baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    const existingIdx = findProduct(baseName);
    if (existingIdx >= 0) {
      appState.items[existingIdx].active = true;
      appState.items[existingIdx].done = false;
      if (qty > 1) appState.items[existingIdx].qty = qty;
    } else {
      appState.items.push({
        name: baseName,
        cat: categorizeProductName(baseName),
        active: true,
        done: false,
        qty: qty > 1 ? qty : null
      });
    }
    addedCount++;
  });

  pushToCloud();
  render();
  showUndoBar(`🎙️ Tunnistettu ${addedCount} tuotetta!`);
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
  processFinnishVoiceText(raw);
  closeWaModal();
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
  showUndoBar("📷 Tunnistetaan kuvaa Gemini Visionilla...");

  if (!getEffectiveGeminiKey()) {
    showUndoBar("⚠️ Aseta API-avain yläpalkin ⚙️-valikosta");
    openDiagnostics();
    return;
  }

  try {
    const compressed = await compressImageForVision(file, 1000, 0.75);

    const promptText = `Olet tarkka kauppa-apuri. Tunnista tästä kuvasta kaikki tuotteet ja niiden määrät.
Kuvassa voi olla joko:
1. Fyysinen tuote tai pakkaus (esim. olut, kaljatölkki, maitopurkki, leipäpussi).
2. Käsinkirjoitettu kauppalappu tai kuitti.

Kategoriat: Hevi, Juurekset, Hedelmät, Liha, Leikkeleet, Einekset, Vegaaniset, Maitotuotteet, Juustot, Kuivat, Kuivat (mutta märät), Jauhot, Aasia / Texmex, Pakasteet, Leivät, Herkut, Hygienia, Apteekki, IKEA, Rautakauppa, Muut.

Palauta VAIN JSON-lista ilman mitään markdownia tai ylimääräistä tekstiä:
[{"name": "Tuotenimi", "cat": "Kategoria", "qty": 1}]`;

    const res = await callGemini({
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          { inlineData: { mimeType: compressed.mimeType, data: compressed.base64 } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || res.statusText;
      showUndoBar(`Virhe ${res.status}: ${errMsg.substring(0, 35)}`);
      return;
    }

    const data = await res.json();
    let raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = raw.match(/\[[\s\S]*\]/);
    const parsedProducts = JSON.parse(m ? m[0] : raw);

    if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      showUndoBar("⚠️ Kuvasta ei tunnistettu tuotteita");
      return;
    }

    let addedCount = 0;
    parsedProducts.forEach(item => {
      if (!item || !item.name) return;
      const cleanName = String(item.name).trim();
      const targetCat = CATEGORY_THEMES[item.cat] ? item.cat : categorizeProductName(cleanName);
      const qty = item.qty ? Number(item.qty) : 1;

      const matchIdx = findProduct(cleanName);
      if (matchIdx >= 0) {
        appState.items[matchIdx].active = true;
        appState.items[matchIdx].done = false;
        if (qty) appState.items[matchIdx].qty = qty;
      } else {
        appState.items.push({ name: cleanName, cat: targetCat, active: true, done: false, qty });
      }
      addedCount++;
    });

    await pushToCloud();
    render();
    showUndoBar(`📷 Lisätty: ${parsedProducts[0]?.name || "Tuote"} (${addedCount} kpl)`);
  } catch (err) {
    console.warn("Kuvanlukuvirhe:", err);
    showUndoBar("⚠️ Kuvan käsittely epäonnistui");
  }
};

// ---------- Asetukset ----------
window.saveApiKeyFromModal = function() {
  const inp = document.getElementById("diag-api-key-input");
  if (!inp) return;
  const val = inp.value.trim();
  if (val) {
    localStorage.setItem("corsia_gemini_api_key", val);
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
      <div><strong>Tekoälymoottori:</strong> 🟢 Gemini Multimodal Vision</div>
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
