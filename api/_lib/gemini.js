// Corsia – yhteiset Gemini-apufunktiot palvelinreiteille.
// Kansio alkaa alaviivalla, joten Vercel ei julkaise tätä omana reittinään.

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash"
].filter(Boolean);
const RETRYABLE = [404, 429, 500, 503];
const MAX_IMAGE_BASE64 = 3 * 1024 * 1024; // ~2,2 Mt kuva; asiakas pakkaa n. 150–300 kt:hen

let workingModel = null; // muistetaan toimiva malli lämpimän instanssin ajan

class ApiError extends Error {
  constructor(status, message, fromGemini = false) {
    super(message);
    this.status = status;
    this.fromGemini = fromGemini;
  }
}

// Avain: ensisijaisesti ympäristömuuttuja, varalla selaimeen aiemmin tallennettu avain (x-gemini-key).
function resolveKey(req) {
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  if (envKey) return envKey;
  return String(req.headers["x-gemini-key"] || "").trim() || null;
}

async function discoverModels(key) {
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

function describeError(status, msg) {
  if (status === 400 && /api key|API_KEY/i.test(msg)) return "API-avain ei kelpaa – tarkista avain";
  if (status === 401 || status === 403) return "API-avaimella ei ole oikeutta Gemini API:in";
  if (status === 404) return "Gemini-mallia ei löytynyt tälle avaimelle";
  if (status === 429) return "Tekoälyn käyttöraja täynnä – yritä hetken päästä";
  return `Tekoälyvirhe ${status}: ${String(msg).substring(0, 80)}`;
}

// Kokeilee malleja järjestyksessä; 404/429/5xx -> seuraava malli.
async function callGemini(key, payload) {
  const queue = [...new Set([workingModel, ...GEMINI_MODEL_CANDIDATES].filter(Boolean))];
  const tried = new Set();
  let discovered = false;
  let last = { status: 502, msg: "Tekoälyyn ei saatu yhteyttä" };
  let firstOther = null;   // ensimmäinen muu virhe kuin 404 (esim. 429 kiintiö) – se on kertovampi kuin viimeisen mallin 404
  const attempts = [];

  while (queue.length > 0 || !discovered) {
    if (queue.length === 0) {
      discovered = true;
      (await discoverModels(key)).forEach(m => { if (!tried.has(m)) queue.push(m); });
      if (queue.length === 0) break;
    }
    const model = queue.shift();
    if (tried.has(model)) continue;
    tried.add(model);

    const res = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      workingModel = model;
      return { data: await res.json(), model };
    }
    const err = await res.json().catch(() => ({}));
    last = { status: res.status, msg: String(err?.error?.message || res.statusText || "") };
    attempts.push(`${model} ${res.status}`);
    if (res.status !== 404 && !firstOther) firstOther = last;
    if (!RETRYABLE.includes(res.status)) break; // esim. väärä avain tai ei-tuettu työkalu
    if (workingModel === model) workingModel = null;
  }
  const pick = firstOther || last;
  const error = new ApiError(pick.status, pick.msg, true);
  error.attempts = attempts.join(", ").slice(0, 160);
  throw error;
}

// Ensin Google-haulla maadoitettu kutsu, sitten puhdas JSON-tila. parse(data) palauttaa listan.
async function callWithSearchFallback(key, contents, parse, temperature = 0.4) {
  let result = [];
  try {
    const { data } = await callGemini(key, { contents, tools: [{ google_search: {} }], generationConfig: { temperature } });
    try { result = parse(data); } catch (e) { result = []; }
  } catch (e) {
    // 400 = hakutyökalu ei käytössä tälle mallille/avaimelle -> kokeillaan ilman. Väärä avain heitetään eteenpäin.
    if (!(e instanceof ApiError) || e.status !== 400 || /api key|API_KEY/i.test(e.message)) throw e;
  }
  if (result.length > 0) return result;
  const { data } = await callGemini(key, { contents, generationConfig: { temperature, responseMimeType: "application/json" } });
  return parse(data);
}

function extractText(data) {
  return (data?.candidates?.[0]?.content?.parts || [])
    .filter(p => !p.thought)
    .map(p => p.text || "")
    .join("")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseJson(raw, open, close) {
  try { return JSON.parse(raw); } catch (e) { /* jatketaan */ }
  const s = raw.indexOf(open), e = raw.lastIndexOf(close);
  if (s >= 0 && e > s) return JSON.parse(raw.slice(s, e + 1));
  throw new ApiError(502, "Tekoälyn vastaus ei ollut kelvollista JSONia");
}

function validateImage(img) {
  const base64 = String(img?.base64 || "");
  const mimeType = /^image\/(jpeg|png|webp|heic|heif)$/.test(img?.mimeType) ? img.mimeType : "image/jpeg";
  if (!base64) throw new ApiError(400, "Kuva puuttuu");
  if (base64.length > MAX_IMAGE_BASE64) throw new ApiError(413, "Kuva on liian suuri – kokeile uudelleen");
  return { mimeType, data: base64 };
}

const strList = (v, max) => (Array.isArray(v) ? v : []).map(x => String(x)).filter(Boolean).slice(0, max);

// Yhteinen POST-käsittelijän kääre: CORS, avain, JSON-runko ja virheiden muotoilu.
function createHandler(work) {
  const handler = async function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-key");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Vain POST sallittu" });

    const key = resolveKey(req);
    if (!key) return res.status(500).json({ error: "Gemini API -avain puuttuu palvelimelta (GEMINI_API_KEY)", code: "NO_KEY" });

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
    if (!body || typeof body !== "object") return res.status(400).json({ error: "Virheellinen pyyntö" });

    try {
      return res.status(200).json(await work(key, body));
    } catch (e) {
      const status = e instanceof ApiError && e.status >= 400 && e.status < 600 ? e.status : 500;
      let message = e instanceof ApiError && e.fromGemini ? describeError(status, e.message) : (e?.message || "Palvelinvirhe");
      if (e?.attempts) message += ` (kokeiltu: ${e.attempts})`;
      console.error(req.url, status, e?.message);
      return res.status(status).json({ error: message });
    }
  };
  // Vercel: JSON-rungon raja (pakattu kuva on ~0,3 Mt)
  handler.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
  return handler;
}

module.exports = {
  ApiError, callGemini, callWithSearchFallback, extractText, parseJson, validateImage, strList, createHandler
};
