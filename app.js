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

// ---------- Kauppakohtainen kävelyreitti (muokattava kategorioiden järjestys) ----------
// Oletusjärjestys tulee STORE_LAYOUTS-taulukosta. Käyttäjän muokkaama järjestys tallennetaan tähän laitteeseen
// (localStorage, avain corsia_store_layout_{storeKey}). Muokkaus koskee vain kategorioiden järjestystä:
// ostoslistan tuotteet (myös ruksatut ja aktiiviset) pysyvät appState.items-taulukossa koskemattomina.
const STORE_LAYOUT_PREFIX = "corsia_store_layout_";

// Palauttaa kaupan kategoriajärjestyksen: tallennettu (siivottuna) tai oletus.
function getStoreLayout(storeKey) {
  const defaults = STORE_LAYOUTS[storeKey] || [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_LAYOUT_PREFIX + storeKey) || "null");
    if (Array.isArray(saved)) {
      const known = [...new Set(saved.filter(c => defaults.includes(c)))]; // vain tunnetut, ei kaksoiskappaleita
      return [...known, ...defaults.filter(c => !known.includes(c))];      // uudet oletuskategoriat loppuun
    }
  } catch (e) {}
  return [...defaults];
}

function hasCustomLayout(storeKey) {
  try { return localStorage.getItem(STORE_LAYOUT_PREFIX + storeKey) !== null; } catch (e) { return false; }
}

function sameOrder(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }

// Tallentaa järjestyksen; jos se on sama kuin oletus, poistetaan tallennus (oletus pysyy ajan tasalla).
function saveStoreLayout(storeKey, order) {
  const defaults = STORE_LAYOUTS[storeKey] || [];
  const known = [...new Set(order.filter(c => defaults.includes(c)))];
  const full = [...known, ...defaults.filter(c => !known.includes(c))];
  try {
    if (sameOrder(full, defaults)) localStorage.removeItem(STORE_LAYOUT_PREFIX + storeKey);
    else localStorage.setItem(STORE_LAYOUT_PREFIX + storeKey, JSON.stringify(full));
  } catch (e) { console.warn("Reitin tallennus epäonnistui:", e); }
}

let routeEdit = null;           // { storeKey, order: [...] } kun reittiä muokataan, muuten null
let routeDrag = null;           // käynnissä oleva raahaus
let routeRenderPending = false; // render() lykätään raahauksen ajaksi

const routeList = () => document.getElementById("route-list");

window.startRouteEdit = function(storeKey) {
  if (!(STORE_LAYOUTS[storeKey] || []).length) return;
  routeEdit = { storeKey, order: getStoreLayout(storeKey) };
  window.scrollTo(0, 0);
  render();
};

window.cancelRouteEdit = function() {
  routeEdit = null;
  render();
};

window.saveRouteEdit = function() {
  if (!routeEdit) return;
  syncRouteOrderFromDom();
  saveStoreLayout(routeEdit.storeKey, routeEdit.order);
  routeEdit = null;
  render(); // kauppanäkymä piirtyy heti uuden järjestyksen mukaan
  showToast("✓ Reitti tallennettu", "success");
};

// ↺ Palauttaa kovakoodatun oletusreitin yhdellä klikkauksella
window.resetStoreRoute = function() {
  if (!routeEdit) return;
  const key = routeEdit.storeKey;
  const wasDefault = !hasCustomLayout(key) && sameOrder(routeEdit.order, STORE_LAYOUTS[key] || []);
  try { localStorage.removeItem(STORE_LAYOUT_PREFIX + key); } catch (e) {}
  routeEdit = null;
  render();
  showToast(wasDefault ? "Käytössä on jo oletusreitti" : "↺ Oletusreitti palautettu", wasDefault ? "info" : "success");
};

// Lukee kategorioiden järjestyksen DOM:sta ja päivittää numerot
function syncRouteOrderFromDom() {
  const list = routeList();
  if (!list || !routeEdit) return;
  const cards = [...list.querySelectorAll(".route-card")];
  routeEdit.order = cards.map(c => c.dataset.cat);
  cards.forEach((c, i) => { const n = c.querySelector(".route-num"); if (n) n.textContent = String(i + 1); });
}

// FLIP-animaatio: muut kortit liukuvat uuteen paikkaansa, kun DOM-järjestys muuttuu
function routeFlip(elements, mutate) {
  const before = new Map(elements.map(el => [el, el.getBoundingClientRect().top]));
  mutate();
  elements.forEach(el => {
    const d = before.get(el) - el.getBoundingClientRect().top;
    if (!d) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${d}px)`;
    void el.offsetHeight;
    el.style.transition = "transform 0.16s ease";
    el.style.transform = "";
  });
}

// ▲▼-painikkeet ja näppäimistö (Nuoli ylös/alas kahvassa): siirtää korttia yhden askeleen
window.moveRouteCat = function(el, dir) {
  const card = el.closest(".route-card"), list = routeList();
  if (!card || !list) return;
  const sib = dir < 0 ? card.previousElementSibling : card.nextElementSibling;
  if (!sib) return;
  routeFlip([card, sib], () => { if (dir < 0) list.insertBefore(card, sib); else list.insertBefore(sib, card); });
  syncRouteOrderFromDom();
  if (card.scrollIntoView) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
};

window.routeHandleKey = function(e) {
  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
  e.preventDefault();
  moveRouteCat(e.currentTarget, e.key === "ArrowUp" ? -1 : 1);
};

// ----- Raahaus (Pointer Events: toimii hiirellä ja kosketuksella samalla koodilla) -----
// Raahattu kortti seuraa sormea (translateY); kun sen keskikohta ylittää naapurin keskikohdan, DOM-järjestys vaihtuu.
function routeDragTo(clientY) {
  const d = routeDrag;
  if (!d) return;
  const { card, list } = d;
  let dy = clientY - d.startY;
  card.style.transform = `translateY(${dy}px)`;
  const center = card.offsetTop + dy + card.offsetHeight / 2;   // asettelupaikka (ei sisällä animaatioiden transformeja)
  const others = [...list.querySelectorAll(".route-card")].filter(c => c !== card);
  let target = null;
  for (const o of others) {
    if (center < o.offsetTop + o.offsetHeight / 2) { target = o; break; }
  }
  if (target === card.nextElementSibling) return;               // paikka ei vaihtunut
  const logicalTop = card.offsetTop + dy;
  routeFlip(others, () => {
    list.insertBefore(card, target);                            // target = null -> viimeiseksi
    dy = logicalTop - card.offsetTop;                           // kortti pysyy sormen alla uudessa paikassa
    d.startY = clientY - dy;
    card.style.transform = `translateY(${dy}px)`;
  });
  syncRouteOrderFromDom();
}

function routeAutoScroll() {
  const d = routeDrag;
  if (!d) return;
  if (d.scrollSpeed) {
    const before = window.scrollY;
    window.scrollBy(0, d.scrollSpeed);
    const moved = window.scrollY - before;
    if (moved) { d.startY -= moved; routeDragTo(d.lastY); }     // sivu liikkui, kortti seuraa sormea
  }
  d.raf = requestAnimationFrame(routeAutoScroll);
}

function routePointerDown(e) {
  if (!routeEdit || routeDrag) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const handle = e.target.closest && e.target.closest(".route-handle");
  const list = routeList();
  const card = handle && handle.closest(".route-card");
  if (!card || !list) return;
  e.preventDefault();
  try { handle.setPointerCapture(e.pointerId); } catch (err) {}
  routeDrag = { card, handle, list, id: e.pointerId, startY: e.clientY, lastY: e.clientY, scrollSpeed: 0, raf: 0 };
  card.classList.add("route-dragging");
  document.body.classList.add("route-drag-active");
  routeDrag.raf = requestAnimationFrame(routeAutoScroll);
}

function routePointerMove(e) {
  const d = routeDrag;
  if (!d || e.pointerId !== d.id) return;
  e.preventDefault();
  d.lastY = e.clientY;
  const edge = 80, vh = window.innerHeight;                     // reunan lähellä sivu vierii automaattisesti
  d.scrollSpeed = e.clientY < edge ? -Math.ceil((edge - e.clientY) / 6)
    : e.clientY > vh - edge ? Math.ceil((e.clientY - (vh - edge)) / 6) : 0;
  routeDragTo(e.clientY);
}

function routePointerEnd(e) {
  const d = routeDrag;
  if (!d || e.pointerId !== d.id) return;
  cancelAnimationFrame(d.raf);
  try { d.handle.releasePointerCapture(e.pointerId); } catch (err) {}
  d.card.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";
  d.card.style.transform = "";
  d.card.classList.remove("route-dragging");
  document.body.classList.remove("route-drag-active");
  setTimeout(() => { d.card.style.transition = ""; }, 200);
  routeDrag = null;
  syncRouteOrderFromDom();
  if (routeRenderPending) { routeRenderPending = false; render(); } // kesken jäänyt päivitys (esim. pilvesta) tehdään nyt
}

document.addEventListener("pointerdown", routePointerDown);
document.addEventListener("pointermove", routePointerMove, { passive: false });
document.addEventListener("pointerup", routePointerEnd);
document.addEventListener("pointercancel", routePointerEnd);
document.addEventListener("contextmenu", e => {                 // estää pitkän painalluksen valikon kahvassa
  if (routeEdit && e.target.closest && e.target.closest(".route-handle")) e.preventDefault();
});

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
  weekPlan: emptyWeekPlan(),  // VALITUN viikon ruokalista: päivä -> resepti tai null (osoitin weekPlans-kokoelmaan)
  weekPlans: {}               // kaikki viikot: "2026-W45" -> { Ma: resepti|null, ... }
};

// ---------- Kalenteriviikot (ISO 8601: viikko alkaa maanantaina) ----------
let selectedWeekKey = null; // null = kuluva viikko

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);                       // viikon torstai määrää viikon vuoden
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function currentWeekKey() { return isoWeekKey(new Date()); }
function weekNumberOf(key) { return parseInt(String(key).split("-W")[1], 10); }
function mondayOfWeekKey(key) {                                      // UTC-keskiyö
  const [y, w] = String(key).split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const mon = new Date(jan4);
  mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return mon;
}
function shiftWeekKey(key, delta) {
  const mon = mondayOfWeekKey(key);
  mon.setUTCDate(mon.getUTCDate() + 7 * delta);
  return isoWeekKey(new Date(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate()));
}
function weekDates(key) {                                            // 7 päivämäärää (UTC), Ma..Su
  const mon = mondayOfWeekKey(key);
  return WEEK_DAYS.map((_, i) => { const d = new Date(mon); d.setUTCDate(mon.getUTCDate() + i); return d; });
}
function formatWeekRange(key) {
  const [a, b] = [weekDates(key)[0], weekDates(key)[6]];
  const dm = d => `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${dm(a)}${a.getUTCFullYear()}–${dm(b)}${b.getUTCFullYear()}`;
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()}.–${dm(b)}${b.getUTCFullYear()}`;
  return `${dm(a)}–${dm(b)}${b.getUTCFullYear()}`;
}
function getWeekPlan(key) {
  if (!appState.weekPlans[key]) appState.weekPlans[key] = emptyWeekPlan();
  return appState.weekPlans[key];
}
function activeWeekKey() { return selectedWeekKey || currentWeekKey(); }
function syncWeekPointer() { appState.weekPlan = getWeekPlan(activeWeekKey()); }
syncWeekPointer();

// Tallennukseen vain viikot, joissa on reseptejä, ja enintään 5 viikkoa taaksepäin
function weekPlansForSave() {
  const minKey = shiftWeekKey(currentWeekKey(), -5), out = {};
  Object.keys(appState.weekPlans).forEach(k => {
    const plan = appState.weekPlans[k];
    if (k >= minKey && plan && WEEK_DAYS.some(d => plan[d])) out[k] = plan;
  });
  return out;
}

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
  const groqKey = (localStorage.getItem("corsia_groq_api_key") || "").trim();
  const openrouterKey = (localStorage.getItem("corsia_openrouter_api_key") || "").trim();
  const provider = localStorage.getItem("corsia_ai_provider");
  if (groqKey) headers["x-groq-key"] = groqKey;
  if (openrouterKey) headers["x-openrouter-key"] = openrouterKey;
  const tavilyKey = (localStorage.getItem("corsia_tavily_api_key") || "").trim();
  if (tavilyKey) headers["x-tavily-key"] = tavilyKey;
  if (provider && provider !== "auto") headers["x-ai-provider"] = provider;

  let res;
  try {
    res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(navigator.onLine ? "Palvelimeen ei saatu yhteyttä" : "Ei verkkoyhteyttä");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || (res.status === 413 ? "Kuva on liian suuri" : `Palvelinvirhe ${res.status}`);
    try { localStorage.setItem("corsia_last_ai_error", `${new Date().toLocaleString("fi-FI")} – ${res.status}: ${msg}${data?.detail ? ` (${data.detail})` : ""}`.substring(0, 400)); } catch (e) {}
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
  // Aasialaiset ainekset ensin: "kalakastike" ei ole kalaa, "riisipaperi" ei ole paperia, "nuudeli" ei ole pastaa
  if (has("riisipaperi", "kevätrullalevy", "nuudeli", "vermiselli", "kalakastike", "soijakastike", "hoisin", "osterikastike", "sriracha", "sambal", "riisiviinietikka", "teriyaki", "currytahna", "curry-tahna", "kookosmaito")) return "Aasia / Texmex";
  if (has("tähtianis", "kardemumma", "kaneli", "korianterinsiemen")) return "Kuivat";
  if (has("tofu", "tempeh")) return "Vegaaniset";
  if (has("limetti") || (has("lime") && !has("mehu", "limu"))) return "Hedelmät";
  if (has("daikon", "retiisi")) return "Juurekset";
  if (has("korianteri", "minttu", "basilika", "vihersipuli", "kevätsipuli", "idut", "inkivääri", "sitruunaruoho")) return "Hevi";
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
  if (has("jauheliha", "kana", "lohi", "kala", "pihvi", "liha", "possu", "nauta", "naudan", "broileri", "paisti", "ulkofile", "sisäfile", "katkarap", "katkarav", "ravut", "äyriäi")) return "Liha";
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
    weekPlans: weekPlansForSave(),
    weekPlan: getWeekPlan(currentWeekKey())   // vanha kenttä: vanhemmat laitteet näkevät kuluvan viikon
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
  if (data.weekPlans && typeof data.weekPlans === "object") {
    const wp = {};
    Object.keys(data.weekPlans).forEach(k => {
      if (/^\d{4}-W\d{2}$/.test(k) && data.weekPlans[k]) wp[k] = { ...emptyWeekPlan(), ...data.weekPlans[k] };
    });
    appState.weekPlans = wp;
  } else if (data.weekPlan && typeof data.weekPlan === "object") {
    // Vanha tallennusmuoto (yksi viikko) -> siirretään kuluvalle viikolle
    appState.weekPlans = { [currentWeekKey()]: { ...emptyWeekPlan(), ...data.weekPlan } };
  }
  syncWeekPointer();
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
  routeEdit = null;   // reitin muokkaus päättyy aina näkymää vaihdettaessa
  if (typeof audioMode !== "undefined" && audioMode) stopAudioMode(true);   // Ääniohjaus (views.js) päättyy näkymää vaihdettaessa

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
let voiceMode = "shopping"; // "shopping" = kauppalista, "ingredients" = ruokasuunnittelun raaka-aineet
const VOICE_TEXTS = {
  shopping: { hint: 'Luettele tuotteita rauhassa (esim. "kaksi maitoa, lohi ja kurkku")', finish: "✓ Valmis (Tuo listalle)" },
  ingredients: { hint: 'Kerro mitä kaapista löytyy (esim. "kananmunia, riisiä ja paprikaa")', finish: "✓ Valmis (Lisää raaka-aineiksi)" }
};
function applyVoiceModeTexts() {
  const t = VOICE_TEXTS[voiceMode];
  const hint = document.getElementById("voice-hint"), btn = document.getElementById("voice-finish-btn");
  if (hint) hint.textContent = t.hint;
  if (btn) btn.textContent = t.finish;
}
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

window.startVoiceRecognition = async function(mode) {
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
  voiceMode = mode === "ingredients" ? "ingredients" : "shopping";
  applyVoiceModeTexts();

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
  const mode = voiceMode;
  voiceSessionId++;
  stopVoiceEngine();
  voiceText = "";
  hideVoiceModal();
  if (!text) return;
  if (mode === "ingredients") processSpokenIngredients(text);
  else processShoppingText(text, "🎙️");
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
  cuisines: [],         // valitut keittiöt (valinnainen)
  prepTime: null,       // tavoitevalmistusaika: null | "20min" | "30min" | "45min" | "60min" | "over60min"
  diet: "all",          // ruokavalio: "all" | "vege" (kaikki kasvisruokaa) | "mixed" (yksi kasvissyöjä, vege-vinkit)
  recipes: [],
  detected: [],         // kuvasta tunnistetut raaka-aineet
  spoken: [],           // puheella kerrotut raaka-aineet
  voiceLoading: false,  // puhe käsitellään tekoälyllä
  loading: false,
  stage: null,          // "compress" | "identify" | "recipes"
  error: null,
  addedRecipes: {},     // (vanha) reseptin indeksi -> true kun ainekset lisätty listalle
  ingChoice: {},        // käyttäjän valinnat aineskohtaisesti: "resepti|aines" -> true = löytyy kotoa, false = ostetaan
  addConfirm: {},       // "source-idx" -> true hetken aikaa, kun ainekset on lisätty (napin vahvistusteksti)
  sideChoice: {},       // valitut lisukkeet: "resepti|side|lisuke" -> true
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
  foodPlan.addedRecipes = {}; foodPlan.ingChoice = {}; foodPlan.addConfirm = {}; foodPlan.sideChoice = {};
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

// Kuvasta tunnistetut + puhutut raaka-aineet yhdessä (ilman kaksoiskappaleita)
function allIngredients() {
  const seen = new Set(), out = [];
  [...foodPlan.detected, ...foodPlan.spoken].forEach(x => {
    const k = String(x).trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); out.push(String(x).trim()); }
  });
  return out;
}

function addSpokenIngredients(list) {
  const have = new Set(foodPlan.spoken.map(x => x.toLowerCase()));
  let added = 0;
  list.forEach(x => {
    const name = String(x).trim();
    if (name && !have.has(name.toLowerCase())) { have.add(name.toLowerCase()); foodPlan.spoken.push(name); added++; }
  });
  return added;
}

// Varakeino, jos tekoäly ei vastaa: pilkotaan puhe pilkuista ja "ja"-sanoista
function splitSpokenLocal(text) {
  return text.split(/\s*(?:,|\n|\s+ja\s+|\s+sekä\s+)\s*/i)
    .map(x => x.trim()).filter(Boolean)
    .map(x => x.charAt(0).toUpperCase() + x.slice(1));
}

async function processSpokenIngredients(text) {
  if (foodPlan.voiceLoading) return;
  foodPlan.voiceLoading = true;
  foodPlan.error = null;
  render();
  let added = 0;
  try {
    const res = await postApi(RECIPE_API_URL, { step: "identify", text });
    const list = Array.isArray(res.ingredients) ? res.ingredients : [];
    added = addSpokenIngredients(list);
    if (list.length === 0) showToast("🎙️ Raaka-aineita ei tunnistettu – yritä uudelleen", "info");
    else showToast(`🎙️ Lisätty ${added} raaka-ainetta`, "success");
  } catch (e) {
    console.warn("Puheen jäsennys epäonnistui, käytetään paikallista:", e);
    added = addSpokenIngredients(splitSpokenLocal(text));
    showToast(`⚠️ ${e?.message || "Tekoäly ei vastannut"} – lisättiin puhe sellaisenaan (${added} kpl)`, "error");
  } finally {
    foodPlan.voiceLoading = false;
    if (added > 0) { foodPlan.recipes = []; foodPlan.addedRecipes = {}; foodPlan.ingChoice = {}; foodPlan.addConfirm = {}; foodPlan.sideChoice = {}; }
    render();
  }
}

window.removeSpokenIngredient = function(i) {
  foodPlan.spoken.splice(i, 1);
  render();
};

window.clearSpokenIngredients = function() {
  foodPlan.spoken = [];
  render();
};

// Ruokavalio on pysyvä asetus (perheen kasvissyöjä): muistetaan tällä laitteella
try {
  const savedDiet = localStorage.getItem("corsia_diet");
  if (["all", "vege", "mixed"].includes(savedDiet)) foodPlan.diet = savedDiet;
} catch (e) {}

window.setFoodPlanDiet = function(diet) {
  if (!["all", "vege", "mixed"].includes(diet)) return;
  foodPlan.diet = diet;
  try { localStorage.setItem("corsia_diet", diet); } catch (e) {}
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
  if (!foodPlan.image && foodPlan.spoken.length === 0) {
    showToast("📷 Ota kuva tai 🎙️ kerro raaka-aineet puheella", "info");
    return;
  }

  foodPlan.loading = true;
  foodPlan.loadingKind = "search";
  foodPlan.recipes = [];
  foodPlan.detected = [];
  foodPlan.error = null;
  foodPlan.addedRecipes = {}; foodPlan.ingChoice = {}; foodPlan.addConfirm = {}; foodPlan.sideChoice = {};

  try {
    if (foodPlan.image) {
      // 1) Pakkaus selaimessa: max 1024 px, JPEG 0,7
      setFoodPlanStage("compress");
      const compressed = await compressImageForVision(foodPlan.image.file, 1024, 0.7)
        .catch(() => { throw new Error("Kuvan tiivistäminen epäonnistui – kokeile toista kuvaa"); });

      // 2) Raaka-aineiden tunnistus (palvelin)
      setFoodPlanStage("identify");
      const idRes = await postApi(RECIPE_API_URL, { step: "identify", image: compressed });
      foodPlan.detected = Array.isArray(idRes.ingredients) ? idRes.ingredients : [];
    }

    // 3) Reseptien haku ja skaalaus (palvelin, ei kuvaa -> pieni pyyntö). Mukana myös puhutut raaka-aineet.
    setFoodPlanStage("recipes");
    const recRes = await postApi(RECIPE_API_URL, {
      step: "recipes",
      diet: foodPlan.diet,
      max_prep_time: foodPlan.prepTime || undefined,
      ingredients: allIngredients(),
      diners: foodPlan.diners,
      cook_twice: foodPlan.cookTwice,
      cuisines: foodPlan.cuisines,
      categories: Object.keys(CATEGORY_THEMES),
      deals: dealNamesForPrompt()
    });
    const recipes = (Array.isArray(recRes.recipes) ? recRes.recipes : []).filter(r => r && r.recipe_title);
    if (recipes.length === 0) throw new Error("Reseptejä ei saatu – kokeile uudelleen tai kerro raaka-aineet toisin");

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
// Täyttää valitun viikon TYHJÄT päivät tekoälyllä: jääkaappikuva/puhe (jos annettu), makumaailma, ruokailijat ja tarjoukset.
// opts.mix = true: jokaiselle päivälle eri keittiö (valituista keittiöistä, tai maailman keittiöistä jos valittu alle 2).
// Tavoitevalmistusaika (esivalmistelu + kypsennys); arvo lähetetään palvelimelle kenttänä max_prep_time
const PREP_TIME_OPTIONS = [
  { v: "20min", label: "20 min" }, { v: "30min", label: "30 min" }, { v: "45min", label: "45 min" },
  { v: "60min", label: "60 min" }, { v: "over60min", label: "Yli 60 min" }
];
window.setPrepTime = function(v) {
  foodPlan.prepTime = foodPlan.prepTime === v || !PREP_TIME_OPTIONS.some(o => o.v === v) ? null : v;   // uusi napautus poistaa valinnan
  render();
};
const WORLD_CUISINES = ["Italialainen", "Kreikkalainen", "Thai", "Vietnamilainen", "Intialainen", "Singaporelainen", "Amerikkalainen",
  "Meksikolainen", "Japanilainen", "Kiinalainen", "Korealainen", "Ranskalainen", "Espanjalainen", "Lähi-itä", "Suomalainen"];

function shuffled(arr) {
  const b = [...arr];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// Jakaa päiville eri keittiöt: pussillinen sekoitettuja keittiöitä, peräkkäisille päiville ei samaa.
function pickDayCuisines(days) {
  const base = foodPlan.cuisines.length >= 2 ? foodPlan.cuisines : WORLD_CUISINES;
  const out = {};
  let bag = [], prev = null;
  days.forEach(d => {
    if (bag.length === 0) bag = shuffled(base);
    let i = bag.findIndex(c => c !== prev);
    if (i < 0) i = 0;
    out[d] = bag.splice(i, 1)[0];
    prev = out[d];
  });
  return out;
}

window.autoFillWeek = async function(opts) {
  if (foodPlan.loading) return;
  const mix = !!(opts && opts.mix === true);
  const key = activeWeekKey();                 // viikko lukitaan heti: käyttäjä voi selata viikkoja odottaessa
  const plan = getWeekPlan(key);
  const days = WEEK_DAYS.filter(d => !plan[d]);
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
    // Vältetään samoja reseptejä tällä, edellisellä ja seuraavalla viikolla
    const avoid = [0, -1, 1].flatMap(delta => {
      const p = appState.weekPlans[shiftWeekKey(key, delta)];
      return p ? WEEK_DAYS.map(d => p[d]?.recipe_title) : [];
    }).filter(Boolean);
    const res = await postApi(RECIPE_API_URL, {
      step: "week",
      diet: foodPlan.diet,
      max_prep_time: foodPlan.prepTime || undefined,
      days,
      ingredients: allIngredients(),
      diners: foodPlan.diners,
      cook_twice: foodPlan.cookTwice,
      cuisines: foodPlan.cuisines,
      day_cuisines: mix ? pickDayCuisines(days) : undefined,
      categories: Object.keys(CATEGORY_THEMES),
      deals: dealNamesForPrompt(),
      avoid
    });
    const recipes = (Array.isArray(res.recipes) ? res.recipes : []).filter(r => r && r.recipe_title);
    if (recipes.length === 0) throw new Error("Ruokalistaa ei saatu – yritä uudelleen");
    const resDays = Array.isArray(res.days) ? res.days : days;
    const target = getWeekPlan(key);
    recipes.forEach((r, i) => {
      const d = resDays[i] || days[i];
      if (d && !target[d]) target[d] = r;
    });
    foodPlan.weekAdded = false;
    await pushToCloud();
    showToast(`✨ Viikolle ${weekNumberOf(key)} lisätty ${recipes.length} reseptiä`, "success");
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

// 🌍 Jokaiselle tyhjälle päivälle eri keittiö
window.mixWeekCuisines = function() {
  if (foodPlan.loading) return;
  const plan = getWeekPlan(activeWeekKey());
  if (WEEK_DAYS.every(d => plan[d])) {
    if (!confirm("Korvataanko viikon kaikki reseptit eri keittiöiden resepteillä?")) return;
    WEEK_DAYS.forEach(d => { plan[d] = null; });
    foodPlan.weekAdded = false;
    pushToCloud();
  }
  autoFillWeek({ mix: true });
};

// 🔄 Tyhjentää viikon reseptit ja tekee uuden ehdotuksen (kentät ja asetukset säilyvät)
window.regenerateWeek = function() {
  if (foodPlan.loading) return;
  const plan = getWeekPlan(activeWeekKey());
  if (WEEK_DAYS.some(d => plan[d]) && !confirm("Korvataanko viikon reseptit uusilla ehdotuksilla?")) return;
  WEEK_DAYS.forEach(d => { plan[d] = null; });
  foodPlan.weekAdded = false;
  pushToCloud();
  autoFillWeek();
};

// 🧹 Tyhjentää viikon ja kentät (kuva, puhutut raaka-aineet, makumaailmat), jotta haun voi aloittaa alusta
window.clearWeekAndFields = function() {
  if (foodPlan.loading) return;
  const key = activeWeekKey();
  const plan = getWeekPlan(key);
  if (WEEK_DAYS.some(d => plan[d]) && !confirm(`Tyhjennetäänkö viikon ${weekNumberOf(key)} ruokalista ja kentät?`)) return;
  WEEK_DAYS.forEach(d => { plan[d] = null; });
  if (foodPlan.image?.previewUrl) URL.revokeObjectURL(foodPlan.image.previewUrl);
  foodPlan.image = null;
  foodPlan.detected = [];
  foodPlan.spoken = [];
  foodPlan.recipes = [];
  foodPlan.addedRecipes = {}; foodPlan.ingChoice = {}; foodPlan.addConfirm = {}; foodPlan.sideChoice = {};
  foodPlan.cuisines = [];
  foodPlan.prepTime = null;
  foodPlan.error = null;
  foodPlan.weekError = null;
  foodPlan.weekAdded = false;
  pushToCloud();
  render();
  showToast("🧹 Viikko ja kentät tyhjennetty", "success");
};

// ---------- Viikon valinta ----------
window.selectWeek = function(key) {
  if (foodPlan.loading) return;
  selectedWeekKey = /^\d{4}-W\d{2}$/.test(String(key)) ? key : null;
  syncWeekPointer();
  foodPlan.weekError = null;
  foodPlan.weekAdded = false;
  render();
};
window.shiftWeek = function(delta) { selectWeek(shiftWeekKey(activeWeekKey(), delta)); };
window.goToCurrentWeek = function() { selectWeek(null); };

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
    f.base_side_dishes = JSON.parse(JSON.stringify(f.side_dishes || []));
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
  // Lisukkeiden määrät skaalataan samalla kertoimella
  f.side_dishes = (f.base_side_dishes || []).map(sd => ({
    ...sd,
    ingredients: (sd.ingredients || []).map(i => {
      const amount = scaleAmount(i.amount_needed, factor);
      return { ...i, amount_needed: amount, to_shopping_list: i.in_fridge ? "" : (amount ? `${i.name} (${amount})` : i.name) };
    })
  }));
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
    return `${WEEK_DAY_NAMES[d]}: ${r.recipe_title}${r.is_vegetarian ? " 🥦" : ""}${r.vege_note && !r.is_vegetarian ? `\n   🥦 ${r.vege_note}` : ""}${r.source_url ? `\n   🔗 ${r.source_url}` : ""}`;
  }).join("\n");
  const shopping = combinedWeekIngredients().map(i => {
    const deal = dealForIngredient(i.name);
    return `• ${i.to_shopping_list}${deal ? ` 🔥 ${deal.price} ${deal.store}` : ""}`;
  }).join("\n");
  const wk = activeWeekKey();
  const text = `📅 Viikon ${weekNumberOf(wk)} ruokalista (${formatWeekRange(wk)})\n\n${menu}${shopping ? `\n\n🛒 Kauppalappu:\n${shopping}` : ""}\n\n– Corsia`;
  shareText("Viikon ruokalista", text);
};

// ---------- Reseptien apufunktiot (haku, suosikit, viikko) ----------
// source: "result" = hakutulos, "fav" = suosikki
function getRecipe(source, idx) {
  if (source === "week") return appState.weekPlan[idx];   // idx = päivä ("Ma", "Ti", ...)
  return source === "fav" ? appState.favorites[idx] : foodPlan.recipes[idx];
}

// Reseptin aineslista (vain nimelliset rivit). Indeksi on sama kuin reseptikortin kytkimissä.
function recipeIngredients(r) {
  return (Array.isArray(r?.ingredients) ? r.ingredients : []).filter(i => i && i.name);
}

const ingChoiceKey = (r, ing) => `${String(r?.recipe_title || "").trim().toLowerCase()}|${String(ing?.name || "").trim().toLowerCase()}`;

// Aineksen tila: käyttäjän valinta, ja ellei sitä ole, tekoälyn arvio (in_fridge)
function effectiveInFridge(r, ing) {
  const k = ingChoiceKey(r, ing);
  return Object.prototype.hasOwnProperty.call(foodPlan.ingChoice, k) ? !!foodPlan.ingChoice[k] : !!ing.in_fridge;
}

// ---------- Lisukkeet (side_dishes) ----------
const recipeKeyOf = r => String(r?.recipe_title || "").trim().toLowerCase();
const sideKeyOf = (r, sd) => `${recipeKeyOf(r)}|side|${String(sd?.title || "").trim().toLowerCase()}`;
const sideIngKey = (r, sd, ing) => `${sideKeyOf(r, sd)}|${String(ing?.name || "").trim().toLowerCase()}`;

function recipeSideDishes(r) {
  return (Array.isArray(r?.side_dishes) ? r.side_dishes : [])
    .filter(sd => sd && String(sd.title || "").trim() && Array.isArray(sd.ingredients));
}
const isSideSelected = (r, sd) => !!foodPlan.sideChoice[sideKeyOf(r, sd)];
const selectedSideDishes = r => recipeSideDishes(r).filter(sd => isSideSelected(r, sd));
const sideIngredients = sd => (Array.isArray(sd?.ingredients) ? sd.ingredients : []).filter(i => i && i.name);

// Lisukkeen aineksen tila: käyttäjän valinta, muuten tekoälyn/palvelimen arvio (in_fridge)
function effectiveSideInFridge(r, sd, ing) {
  const k = sideIngKey(r, sd, ing);
  return Object.prototype.hasOwnProperty.call(foodPlan.ingChoice, k) ? !!foodPlan.ingChoice[k] : !!ing.in_fridge;
}

// Ostettavat ainekset: pääruoka + VALITTUJEN lisukkeiden ainekset (käyttäjän valinnat huomioiden)
function missingIngredients(r) {
  const main = recipeIngredients(r).filter(i => !effectiveInFridge(r, i) && String(i.to_shopping_list || i.name || "").trim());
  const sides = selectedSideDishes(r).flatMap(sd =>
    sideIngredients(sd).filter(i => !effectiveSideInFridge(r, sd, i) && String(i.to_shopping_list || i.name || "").trim()));
  return [...main, ...sides];
}

const sameRecipe = (a, b) => String(a?.recipe_title || "").toLowerCase() === String(b?.recipe_title || "").toLowerCase();

window.isFavoriteRecipe = function(r) {
  return appState.favorites.some(f => sameRecipe(f, r));
};

window.setFoodPlanTab = function(tab) {
  foodPlan.tab = tab;
  render();
};

// Vanhat nimet säilytetty: lisäävät reseptin valitut (ostettavat) ainekset kauppalapulle
window.addRecipeToShoppingList = idx => addSelectedToShoppingList("result", idx);
window.addFavoriteToShoppingList = idx => addSelectedToShoppingList("fav", idx);

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
    r.vege_note ? `\n🥦 Kasvissyöjälle: ${r.vege_note}` : "",
    selectedSideDishes(r).length ? `\n🥗 Lisukkeet: ${selectedSideDishes(r).map(sd => sd.title).join(", ")}` : "",
    missing.length ? `\n🛒 Ostettavaa:\n${missing.map(i => `• ${i.to_shopping_list || i.name}`).join("\n")}` : "\n✓ Kaikki ainekset löytyvät kotoa",
    r.source_url ? `\n🔗 ${r.source_url}` : "",
    "\n– Corsia"
  ].filter(Boolean);
  shareText(r.recipe_title, lines.join("\n"));
};

// Yhdistää ainekset ostoslistaan (appState.items) ilman tuplia. Palauttaa { fresh, already }:
//  fresh = uusi tai uudelleen aktivoitu rivi, already = sama tuote oli jo aktiivisena listalla (ei muutosta).
// Sama tuote löytyy katalogista nimellä (findProduct) tai aiemmin lisätystä rivistä (sama nimi, isot/pienet kirjaimet ohitetaan).
function mergeIngredientsIntoItems(missing) {
  let fresh = 0, already = 0;
  missing.forEach(ing => {
    const name = String(ing.name || "").trim();
    const amount = String(ing.amount_needed || ing.amount || "").trim();
    const line = String(ing.to_shopping_list || "").trim() || (amount ? `${name} (${amount})` : name);
    const cat = normalizeCategory(ing.cat) || categorizeProductName(name || line);
    // Katalogissa oleva tuote aktivoidaan (säilyttää kaupan järjestyksen), muuten lisätään uusi rivi.
    const existing = name ? findProduct(name) : -1;
    let item = null;
    if (existing >= 0) item = appState.items[existing];
    else {
      const label = line.charAt(0).toUpperCase() + line.slice(1);
      item = appState.items.find(i => i.name.toLowerCase() === label.toLowerCase()) || null;
      if (!item) {
        appState.items.push({ name: label, cat, active: true, done: false, qty: null });
        fresh++;
        return;
      }
    }
    if (item.active && !item.done) already++;
    else { item.active = true; item.done = false; fresh++; }
  });
  return { fresh, already };
}

// Yhteinen lisäys kauppalapulle (viikon ostokset, suosikit ym.). Palauttaa käsiteltyjen rivien määrän.
async function addIngredientsToList(missing) {
  const res = await addIngredientsToListDetailed(missing);
  return res.fresh + res.already;
}

async function addIngredientsToListDetailed(missing) {
  if (missing.length === 0) {
    showToast("Ei lisättäviä aineksia", "info");
    return { fresh: 0, already: 0 };
  }
  const res = mergeIngredientsIntoItems(missing);
  render();
  try {
    await pushToCloud();   // synkronoituu perheen yhteiseen Firebase-tilaan
    showToast(res.fresh === 0
      ? "✓ Kaikki oli jo ostoslistalla"
      : `🛒 Lisätty ${res.fresh} ainesta ostoslistalle${res.already ? ` (${res.already} oli jo listalla)` : ""}`, "success");
  } catch (e) {
    console.warn("Tallennus epäonnistui:", e);
    showToast("⚠️ Lisätty listalle, mutta pilvitallennus epäonnistui", "error");
  }
  return res;
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

window.saveAiSettingsFromModal = function() {
  const prov = document.getElementById("diag-ai-provider")?.value || "auto";
  const groq = (document.getElementById("diag-groq-key")?.value || "").trim();
  const openrouter = (document.getElementById("diag-openrouter-key")?.value || "").trim();
  const tavily = (document.getElementById("diag-tavily-key")?.value || "").trim();
  if (prov === "auto") localStorage.removeItem("corsia_ai_provider"); else localStorage.setItem("corsia_ai_provider", prov);
  if (groq) localStorage.setItem("corsia_groq_api_key", groq); else localStorage.removeItem("corsia_groq_api_key");
  if (openrouter) localStorage.setItem("corsia_openrouter_api_key", openrouter); else localStorage.removeItem("corsia_openrouter_api_key");
  if (tavily) localStorage.setItem("corsia_tavily_api_key", tavily); else localStorage.removeItem("corsia_tavily_api_key");
  showUndoBar("✓ Tekoälyasetukset tallennettu tälle laitteelle");
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
      <div><strong>Tekoälyavaimet:</strong> <span id="diag-server-key">⏳ tarkistetaan...</span></div>
      <div><strong>Selaimen vara-avain:</strong> ${keyStatusStr}</div>
    </div>
  `;
  if (keyInp) keyInp.value = currentKey;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal("diag-ai-provider", localStorage.getItem("corsia_ai_provider") || "auto");
  setVal("diag-groq-key", localStorage.getItem("corsia_groq_api_key") || "");
  setVal("diag-openrouter-key", localStorage.getItem("corsia_openrouter_api_key") || "");
  setVal("diag-tavily-key", localStorage.getItem("corsia_tavily_api_key") || "");
  modal.style.display = "flex";

  fetch("/api/status").then(r => r.json()).then(d => {
    const el = document.getElementById("diag-server-key");
    if (!el) return;
    const srv = d.providers || { gemini: !!d.serverKey };
    const dev = { gemini: !!currentKey, groq: !!localStorage.getItem("corsia_groq_api_key"), openrouter: !!localStorage.getItem("corsia_openrouter_api_key"), tavily: !!localStorage.getItem("corsia_tavily_api_key") };
    const fmt = (name, k) => `${name} ${srv[k] ? "🟢 palvelin" : dev[k] ? "🟡 tämä laite" : "⚪ ei avainta"}`;
    el.textContent = [fmt("Gemini", "gemini"), fmt("Groq", "groq"), fmt("OpenRouter", "openrouter"), fmt("Tarjoushaku (Tavily)", "tavily")].join(" · ");
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
const cookingDetailCache = {}; // "otsikko|annokset" -> ohje (muistivara, jos localStorage ei toimi)

// Ohje ja rastit tallennetaan tähän laitteeseen 24 h:ksi: vahingossa suljettu tai ladattu näkymä jatkuu siitä mihin jäi,
// eikä sama ohje haeta uudelleen Geminiltä (säästää kiintiötä). Viikkolista näyttää edistymisen tämän perusteella.
const COOK_STORE_KEY = "corsia_cook_sessions";
const COOK_TTL_MS = 24 * 60 * 60 * 1000;
const COOK_MAX_ENTRIES = 15;

const cookServings = r => r.target_servings || foodPlan.diners;
const cookKeyFor = r => `${String(r.recipe_title || "").trim().toLowerCase()}|${cookServings(r)}`;

function loadCookStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(COOK_STORE_KEY) || "{}");
    const now = Date.now(), out = {};
    Object.keys(raw || {}).forEach(k => { if (raw[k] && now - (raw[k].ts || 0) < COOK_TTL_MS) out[k] = raw[k]; });
    return out;
  } catch (e) { return {}; }
}

function saveCookStore(store) {
  try {
    const keys = Object.keys(store).sort((a, b) => (store[b].ts || 0) - (store[a].ts || 0)).slice(0, COOK_MAX_ENTRIES);
    const out = {};
    keys.forEach(k => { out[k] = store[k]; });
    localStorage.setItem(COOK_STORE_KEY, JSON.stringify(out));
  } catch (e) {}
}

function persistCook() {
  const c = cooking;
  if (!c || !c.key || !c.data) return;
  cookingDetailCache[c.key] = c.data;
  const store = loadCookStore();
  store[c.key] = { data: c.data, done: c.done, ts: Date.now() };
  saveCookStore(store);
}

// { n, total } jos reseptistä on tehty vähintään yksi vaihe (viikkolistan merkintää varten), muuten null.
function cookProgressFor(r) {
  const e = loadCookStore()[cookKeyFor(r)];
  const steps = e?.data?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const n = steps.filter(st => e.done && e.done[st.step_number]).length;
  return n > 0 ? { n, total: steps.length } : null;
}

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
  const key = cookKeyFor(r);
  cooking = { recipe: r, key, data: null, loading: true, error: null, timers: {}, done: {}, speakingStep: null, speech: null, wakeActive: false, wakeSupported: "wakeLock" in navigator };
  // Palautetaan aiemmin haettu ohje ja rastit, jos niitä on
  const saved = loadCookStore()[key];
  const savedData = saved?.data || cookingDetailCache[key];
  if (savedData?.steps?.length) {
    cooking.data = savedData;
    cooking.loading = false;
    const valid = new Set(savedData.steps.map(st => st.step_number));
    Object.keys(saved?.done || {}).forEach(k => { if (saved.done[k] && valid.has(Number(k))) cooking.done[k] = true; });
  }
  document.body.classList.add("cook-open");
  renderCooking();
  acquireCookWakeLock();   // heti, ennen verkkokutsua (käyttäjän napautuksen aikana)
  cookTickHandle = setInterval(tickCookTimers, 500);
  if (!cooking.data) loadCookingDetail();
};

window.closeCookingMode = function() {
  stopCookSpeech();
  releaseCookWakeLock();
  clearInterval(cookTickHandle);
  cookTickHandle = null;
  cooking = null;
  document.body.classList.remove("cook-open");
  renderCooking();
  if (typeof currentView !== "undefined" && currentView === "foodplan") render(); // päivittää viikkolistan ✓-merkit
};

window.retryCookingDetail = function() { loadCookingDetail(); };

async function loadCookingDetail() {
  const c = cooking;
  if (!c) return;
  const r = c.recipe;
  c.loading = true; c.error = null;
  renderCooking();
  try {
    const data = await postApi(RECIPE_API_URL, {
      step: "detail",
      recipe_title: r.recipe_title,
      target_servings: cookServings(r),
      ingredients: (Array.isArray(r.ingredients) ? r.ingredients : [])
        .filter(i => i && i.name)
        .map(i => (i.amount_needed || i.amount) ? `${i.name} (${i.amount_needed || i.amount})` : i.name)
    });
    if (cooking !== c) return;
    c.data = data;
    persistCook();
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
  persistCook();
};

window.resetCookProgress = function() {
  if (!cooking) return;
  cooking.done = {};
  persistCook();
  renderCooking();
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
