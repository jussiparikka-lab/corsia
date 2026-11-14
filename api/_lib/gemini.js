// Corsia – yhteiset tekoäly-apufunktiot palvelinreiteille. Vain ILMAISIA tekoälypalveluita:
//   Gemini (Google AI Studio, ilmainen taso), Groq (ilmainen, ei luottokorttia), OpenRouter (:free-mallit).
//
// Kaikki reitit puhuvat Geminin kutsumuotoa (contents/parts, inlineData, tools: google_search, generationConfig).
// Groq ja OpenRouter ovat OpenAI-yhteensopivia: pyyntö muunnetaan niille ja vastaus palautetaan Geminin muodossa,
// joten reittien koodi (extractText, parseJson, ...) toimii sellaisenaan kaikilla.
// Avaimet: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY (ympäristömuuttujat) tai selaimen vara-avaimet otsakkeissa.
// Järjestys: ensisijainen tekoäly (otsake x-ai-provider / AI_PROVIDER) ensin, sitten muut, joilla on avain.
// Verkkohaku (tarjoukset, reseptilinkit) toimii vain Geminillä.

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
// Ilmaisen tason rajat ovat mallikohtaisia. Lähteiden mukaan Flash-Lite-malleilla päiväraja on moninkertainen
// tavallisiin Flash-malleihin verrattuna (n. 500 vs. n. 20 pyyntöä/pv), joten kevyet mallit kokeillaan ensin.
// Tarkat rajat: aistudio.google.com/rate-limit.
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash"
].filter(Boolean);

// Groq: ilmainen, ei luottokorttia. Llama 4 -mallit ymmärtävät myös kuvia.
// Verkkohakua (Google Search grounding) vaativissa kutsuissa EI käytetä Lite-malleja: ne eivät tue hakua luotettavasti.
// Ensisijainen on gemini-2.5-flash; jos se on poistunut (404, Google rajoittaa 2.5-malleja vain aiemmin käyttäneille),
// kokeillaan vain tavallisia Flash-malleja. Mallin voi pakottaa muuttujalla GEMINI_SEARCH_MODEL.
const GEMINI_SEARCH_MODELS = [process.env.GEMINI_SEARCH_MODEL, "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.6-flash"].filter(Boolean);

// REST API:ssa työkalu annetaan camelCase-muodossa: "tools": [{ "googleSearch": {} }]
const SEARCH_TOOLS = () => [{ googleSearch: {} }];
const hasSearchTool = payload => Array.isArray(payload?.tools) && payload.tools.some(t => t && (t.googleSearch || t.google_search));

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  process.env.GROQ_MODEL ? { id: process.env.GROQ_MODEL, vision: true } : null,
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", vision: true },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", vision: true },
  { id: "llama-3.3-70b-versatile", vision: false },
  { id: "openai/gpt-oss-120b", vision: false }
].filter(Boolean);

const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

// OpenRouter: haetaan ilmaiset (:free) mallit ajon aikana, koska ne vaihtuvat usein.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

const LABELS = { gemini: "Gemini", groq: "Groq", openrouter: "OpenRouter" };
const PROVIDER_IDS = ["gemini", "groq", "openrouter"];
const RETRYABLE = [404, 413, 429, 500, 502, 503, 504, 529];
const MAX_IMAGE_BASE64 = 3 * 1024 * 1024; // ~2,2 Mt kuva; asiakas pakkaa n. 150–300 kt:hen
const MAX_OUT_TOKENS = 8000;

const workingModel = { gemini: null, groq: null, openrouter: null }; // muistetaan toimiva malli lämpimän instanssin ajan

class ApiError extends Error {
  constructor(status, message, fromAI = false) {
    super(message);
    this.status = status;
    this.fromGemini = fromAI;   // nimi säilytetty yhteensopivuuden vuoksi: virhe tuli tekoälypalvelulta
  }
}

// Avaimet: ensisijaisesti ympäristömuuttuja, varalla selaimeen tallennettu avain (otsakkeet).
function resolveKeys(req) {
  const h = req.headers || {};
  const pick = (env, header) => (process.env[env] || "").trim() || String(h[header] || "").trim() || null;
  const keys = {
    gemini: pick("GEMINI_API_KEY", "x-gemini-key"),
    groq: pick("GROQ_API_KEY", "x-groq-key"),
    openrouter: pick("OPENROUTER_API_KEY", "x-openrouter-key")
  };
  keys.tavily = pick("TAVILY_API_KEY", "x-tavily-key"); // verkkohaku tarjouksille (ei tekoäly, joten ei providerOrderissa)
  const pref = String(h["x-ai-provider"] || process.env.AI_PROVIDER || "auto").toLowerCase();
  keys.preferred = PROVIDER_IDS.includes(pref) ? pref : "auto";
  return keys;
}

function providerOrder(creds) {
  const all = PROVIDER_IDS.filter(p => creds[p]);
  if (creds.preferred && creds.preferred !== "auto" && all.includes(creds.preferred)) {
    return [creds.preferred, ...all.filter(p => p !== creds.preferred)];
  }
  return all;
}

// ---------- Virheiden luokittelu ----------

// Lukee 429-vastauksesta, onko täynnä minuutti-, päivä- vai laskutusraja.
function classifyQuota(err, msg, headers) {
  const details = Array.isArray(err?.error?.details) ? err.error.details : [];
  let kind = null, retry = null, metric = null;
  for (const d of details) {
    const type = String(d?.["@type"] || "");
    if (/QuotaFailure/i.test(type)) {
      for (const v of (Array.isArray(d.violations) ? d.violations : [])) {
        const id = `${v?.quotaId || ""} ${v?.quotaMetric || ""}`;
        if (!metric && v?.quotaId) metric = String(v.quotaId).slice(0, 80);
        if (/PerDay/i.test(id)) kind = "day";
        else if (/PerMinute/i.test(id) && kind !== "day") kind = "minute";
      }
    }
    if (/RetryInfo/i.test(type)) {
      const n = parseFloat(String(d.retryDelay || ""));
      if (Number.isFinite(n)) retry = Math.ceil(n);
    }
  }
  if (kind === null && /per[ -]day|\bRPD\b|\bTPD\b/i.test(String(msg || ""))) kind = "day";
  const ra = parseFloat(headers?.get?.("retry-after"));
  if (retry === null && Number.isFinite(ra)) retry = Math.ceil(ra);
  if (retry === null) {
    const m = /(?:retry|try again) in ([\d.]+)\s*s/i.exec(String(msg || ""));
    if (m) retry = Math.ceil(parseFloat(m[1]));
  }
  if (kind === null && retry !== null) kind = "minute"; // Groq/OpenRouter: retry-after = hetkellinen rajoitus
  return { kind, retry, metric };
}

// Yhdistää usean mallin 429-luokitukset: jos jokin malli vapautuu pian, se ratkaisee.
function summarizeQuotas(quotas) {
  const metric = (quotas.find(q => q.metric) || {}).metric || null;
  const minute = quotas.filter(q => q.kind === "minute");
  if (minute.length > 0) {
    const waits = minute.map(q => q.retry).filter(Number.isFinite);
    return { kind: "minute", retry: waits.length ? Math.min(...waits) : null, metric };
  }
  if (quotas.some(q => q.kind === "day")) return { kind: "day", retry: null, metric };
  return { kind: null, retry: null, metric };
}

const formatWait = s => (s <= 90 ? `${s} s` : `${Math.ceil(s / 60)} min`);

function describeError(status, msg, quota, provider = "gemini") {
  const m = String(msg || "");
  if (status === 400 && /api key|API_KEY/i.test(m)) return "API-avain ei kelpaa – tarkista avain";
  if (status === 401) return "API-avain ei kelpaa – tarkista avain";
  if (status === 403) return "API-avaimella ei ole oikeutta tähän tekoälyyn";
  if (status === 404) return "Mallia ei löytynyt tälle avaimelle";
  if (status === 429) {
    if (quota?.kind === "minute") return `Minuuttiraja täynnä – yritä uudelleen ${quota.retry ? `noin ${formatWait(quota.retry)} kuluttua` : "minuutin kuluttua"}`;
    if (quota?.kind === "day") return provider === "gemini"
      ? "Päiväkiintiö täynnä – ilmaiskiintiö nollautuu yleensä noin klo 10 Suomen aikaa"
      : "Päiväkiintiö täynnä";
    return "Käyttöraja täynnä – yritä hetken päästä";
  }
  if (status === 413) return "Pyyntö on liian suuri tälle tekoälylle";
  if (status === 504) return "Tekoäly vastasi liian hitaasti – yritä uudelleen";
  if ([500, 502, 503, 529].includes(status)) return "Palvelu on ruuhkautunut – yritä hetken päästä";
  return `Tekoälyvirhe ${status}: ${m.substring(0, 80)}`;
}

// Aikabudjetti: Vercelin funktiolla on enimmäiskesto (vercel.json: 60 s). Jokaiselle kutsulle annetaan oma aikaraja
// ja koko pyynnölle yhteinen takaraja (ctx.deadline), jotta hidas kutsu ei kaada koko funktiota 504-virheeseen.
async function timedFetch(url, opts, ctx, capMs) {
  const left = ctx?.deadline ? ctx.deadline - Date.now() - 1500 : capMs;
  if (left < 2500) throw new ApiError(504, "Tekoäly vastasi liian hitaasti", true);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), Math.min(capMs, left));
  try {
    return await fetch(url, { ...opts, signal: ac.signal });
  } catch (e) {
    if (e?.name === "AbortError") throw new ApiError(504, "Tekoäly vastasi liian hitaasti", true);
    throw new ApiError(502, "Tekoälyyn ei saatu yhteyttä", true);
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Gemini ----------

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

// Gemini 3 -mallit "ajattelevat" oletuksena pitkään (keskitaso), mikä hidastaa reseptien tuottoa moninkertaisesti.
// Tehtävämme (jäsennys, reseptit) eivät tarvitse syvää päättelyä, joten ajattelu minimoidaan.
// Gemini 3: thinkingLevel, Gemini 2.5: thinkingBudget (eri parametrit; väärä aiheuttaa 400 -> yritetään ilman).
function geminiThinkingConfig(model) {
  if (/^gemini-3/.test(model)) return { thinkingLevel: "low" };
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  return null;
}
function geminiPayloadFor(payload, model, useThinking) {
  const tc = useThinking && !payload.generationConfig?.thinkingConfig ? geminiThinkingConfig(model) : null;
  return tc ? { ...payload, generationConfig: { ...(payload.generationConfig || {}), thinkingConfig: tc } } : payload;
}

// Kokeilee malleja järjestyksessä; 404/429/5xx -> seuraava malli.
async function callGeminiProvider(key, payload, ctx = {}) {
  const wantGround = hasSearchTool(payload);
  const maxAttempts = wantGround ? GEMINI_SEARCH_MODELS.length : Infinity;
  let attemptCount = 0;
  const queue = wantGround
    ? [...new Set(GEMINI_SEARCH_MODELS)]                                         // vain hakua tukevat, ei Lite-malleja
    : [...new Set([workingModel.gemini, ...GEMINI_MODEL_CANDIDATES].filter(Boolean))];
  const tried = new Set();
  let discovered = wantGround;                                                   // hakukutsuissa ei mallilistan hakua
  let last = { status: 502, msg: "Tekoälyyn ei saatu yhteyttä" };
  let firstOther = null;   // ensimmäinen muu virhe kuin 404 – kertovampi kuin viimeisen mallin 404
  const attempts = [];
  const quotas = [];

  while (queue.length > 0 || !discovered) {
    if (ctx.deadline && ctx.deadline - Date.now() < 4000) { last = { status: 504, msg: "Aikabudjetti loppui" }; break; }
    if (attemptCount >= maxAttempts) break;
    if (queue.length === 0) {
      discovered = true;
      if (ctx.deadline && ctx.deadline - Date.now() < 15000) break; // ei aikaa mallilistan hakuun
      (await discoverGeminiModels(key)).forEach(m => { if (!tried.has(m)) queue.push(m); });
      if (queue.length === 0) break;
    }
    const model = queue.shift();
    if (tried.has(model)) continue;
    tried.add(model);
    attemptCount++;

    let res, preErr = null;
    try {
      for (const useThinking of [true, false]) {
        res = await timedFetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(geminiPayloadFor(payload, model, useThinking))
        }, ctx, wantGround ? 24000 : 35000);
        if (!(useThinking && res.status === 400 && geminiThinkingConfig(model))) break;
        preErr = await res.json().catch(() => ({}));
        if (!/think/i.test(String(preErr?.error?.message || ""))) break; // muu 400-virhe: ei yritetä uudelleen
        preErr = null;                                                   // ajatteluparametri hylättiin -> uusi yritys ilman
      }
    } catch (e) {
      // aikakatkaisu tai yhteysvirhe: kirjataan. Aikakatkaisun jälkeen ei kokeilla muita malleja (ne jumittaisivat
      // samoin ja kuluttaisivat koko aikabudjetin), vaan siirrytään seuraavaan tekoälyyn / varakutsuun.
      last = { status: e.status || 502, msg: e.message };
      attempts.push(`${model} ${last.status}`);
      if (!firstOther) firstOther = last;
      if (e.status === 504) break;
      continue;
    }
    if (res.ok) {
      if (!wantGround) workingModel.gemini = model;
      return { data: await res.json(), model };
    }
    const err = preErr || await res.json().catch(() => ({}));
    last = { status: res.status, msg: String(err?.error?.message || res.statusText || "") };
    attempts.push(`${model} ${res.status}`);
    if (res.status === 429) quotas.push(classifyQuota(err, last.msg, res.headers));
    if (res.status !== 404 && !firstOther) firstOther = last;
    if (wantGround && res.status !== 404) break; // hakukiintiö/-tuki on yhteinen mallien kesken: vain puuttuva malli (404) vaihdetaan
    if (!RETRYABLE.includes(res.status)) break; // esim. väärä avain tai ei-tuettu työkalu
    if (workingModel.gemini === model) workingModel.gemini = null;
  }
  const pick = firstOther || last;
  const error = new ApiError(pick.status, pick.msg, true);
  error.attempts = attempts.join(", ").slice(0, 160);
  if (pick.status === 429 && quotas.length > 0) error.quota = summarizeQuotas(quotas);
  throw error;
}

// ---------- Groq ja OpenRouter (OpenAI-yhteensopiva rajapinta) ----------

const geminiShape = (text, ungrounded) => ({ candidates: [{ content: { parts: [{ text }] } }], _ungrounded: !!ungrounded });

function partsToChat(parts) {
  return parts.map(p => {
    if (p.inlineData) return { type: "image_url", image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } };
    return { type: "text", text: String(p.text || "") };
  });
}

async function discoverOpenRouterFree(key, needVision) {
  try {
    const r = await fetch(OPENROUTER_MODELS_URL, { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) return [];
    const d = await r.json();
    return (Array.isArray(d.data) ? d.data : [])
      .filter(m => {
        const price = m.pricing || {};
        const free = /:free$/.test(m.id) || (Number(price.prompt) === 0 && Number(price.completion) === 0);
        const mods = m.architecture?.input_modalities || [];
        return free && mods.includes("text") && (!needVision || mods.includes("image"))
          && !/(guard|embed|safety|moderation|image)/i.test(m.id) && Number(m.context_length || 0) >= 16000;
      })
      .sort((a, b) => Number(b.context_length || 0) - Number(a.context_length || 0))
      .slice(0, 4)
      .map(m => ({ id: m.id, vision: (m.architecture?.input_modalities || []).includes("image") }));
  } catch (e) {
    return [];
  }
}

// Groq: haetaan voimassa olevat mallit (nimet vaihtuvat ja vanhoja poistetaan), järjestetään nopeisiin yleismalleihin päin.
let groqModelCache = { at: 0, list: [] };
async function discoverGroqModels(key, needVision) {
  if (groqModelCache.list.length === 0 || Date.now() - groqModelCache.at > 10 * 60 * 1000) {
    try {
      const r = await fetch(GROQ_MODELS_URL, { headers: { Authorization: `Bearer ${key}` } });
      if (r.ok) {
        const d = await r.json();
        groqModelCache = {
          at: Date.now(),
          list: (Array.isArray(d.data) ? d.data : [])
            .filter(m => m && m.id && m.active !== false && !/(whisper|tts|playai|guard|orpheus|compound|embed|safeguard|distil)/i.test(m.id))
            .map(m => ({ id: m.id, vision: /(llama-4|vision|scout|maverick|-vl)/i.test(m.id), ctx: Number(m.context_window || 0) }))
        };
      }
    } catch (e) { /* käytetään vanhaa välimuistia tai kiinteää listaa */ }
  }
  const prefs = [/llama-4-scout/i, /llama-4-maverick/i, /llama-3\.3-70b/i, /gpt-oss-120b/i, /qwen/i, /llama-3\.1/i];
  const rank = id => { const i = prefs.findIndex(re => re.test(id)); return i < 0 ? 99 : i; };
  return groqModelCache.list
    .filter(m => !needVision || m.vision)
    .sort((a, b) => rank(a.id) - rank(b.id) || b.ctx - a.ctx)
    .slice(0, 4)
    .map(m => ({ id: m.id, vision: m.vision }));
}

// cfg: { name, url, staticModels, discover?, discoverReplaces?, extraHeaders? }
async function callChatProvider(cfg, key, payload, ctx = {}) {
  const parts = payload.contents?.[0]?.parts || [];
  const hasImage = parts.some(p => p.inlineData);
  const wantJson = payload.generationConfig?.responseMimeType === "application/json";
  const messages = [];
  if (wantJson) messages.push({ role: "system", content: "Vastaa pelkällä kelvollisella JSON:lla ilman selitystekstiä tai koodilohkoja." });
  messages.push({ role: "user", content: partsToChat(parts) });

  let models = cfg.staticModels.filter(m => !hasImage || m.vision);
  if (cfg.discover) {
    const found = await cfg.discover(key, hasImage);
    // discoverReplaces: haettu lista on totuus (kiinteät nimet voivat olla poistuneita); tyhjä haku -> kiinteä lista
    models = cfg.discoverReplaces && found.length > 0 ? found : [...models, ...found];
  }
  const ids = [...new Set([workingModel[cfg.name], ...models.map(m => m.id)].filter(Boolean))]
    .filter(id => models.some(m => m.id === id));

  let last = { status: 502, msg: "Tekoälyyn ei saatu yhteyttä" };
  let firstOther = null;
  const attempts = [], quotas = [];
  if (ids.length === 0) last = { status: 404, msg: hasImage ? "Kuvia ymmärtävää mallia ei löytynyt" : "Mallia ei löytynyt" };
  for (const model of ids) {
    if (ctx.deadline && ctx.deadline - Date.now() < 4000) { last = { status: 504, msg: "Aikabudjetti loppui" }; break; }
    const body = { model, messages, max_tokens: MAX_OUT_TOKENS };
    if (Number.isFinite(payload.generationConfig?.temperature)) body.temperature = payload.generationConfig.temperature;
    let res;
    try {
      res = await timedFetch(cfg.url, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${key}`, ...(cfg.extraHeaders || {}) },
        body: JSON.stringify(body)
      }, ctx, 30000);
    } catch (e) {
      last = { status: e.status || 502, msg: e.message };
      attempts.push(`${model} ${last.status}`);
      if (!firstOther) firstOther = last;
      if (e.status === 504) break;
      continue;
    }
    if (res.ok) {
      const data = await res.json();
      workingModel[cfg.name] = model;
      return { data: geminiShape(String(data?.choices?.[0]?.message?.content || ""), true), model };
    }
    const err = await res.json().catch(() => ({}));
    last = { status: res.status, msg: String(err?.error?.message || res.statusText || "") };
    attempts.push(`${model} ${res.status}`);
    if (res.status === 429) quotas.push(classifyQuota(err, last.msg, res.headers));
    if (res.status !== 404 && !firstOther) firstOther = last;
    // 400 voi tarkoittaa, ettei malli tue jotakin parametria -> kokeillaan seuraavaa mallia
    const retryable = RETRYABLE.includes(res.status) || (res.status === 400 && /model|unsupported|parameter/i.test(last.msg));
    if (!retryable) break;
    if (workingModel[cfg.name] === model) workingModel[cfg.name] = null;
  }
  const pick = firstOther || last;
  const error = new ApiError(pick.status, pick.msg, true);
  error.attempts = attempts.join(", ").slice(0, 160);
  if (pick.status === 429 && quotas.length > 0) error.quota = summarizeQuotas(quotas);
  throw error;
}

const callGroqProvider = (key, payload, ctx) => callChatProvider({
  name: "groq", url: GROQ_URL, staticModels: GROQ_MODELS, discover: discoverGroqModels, discoverReplaces: !process.env.GROQ_MODEL
}, key, payload, ctx);
const callOpenRouterProvider = (key, payload, ctx) => callChatProvider({
  name: "openrouter", url: OPENROUTER_URL,
  staticModels: process.env.OPENROUTER_MODEL ? [{ id: process.env.OPENROUTER_MODEL, vision: true }] : [],
  discover: discoverOpenRouterFree,
  extraHeaders: { "X-Title": "Corsia" }
}, key, payload, ctx);

const PROVIDERS = {
  gemini: { call: callGeminiProvider, search: true },
  groq: { call: callGroqProvider, search: false },             // ei hae verkosta
  openrouter: { call: callOpenRouterProvider, search: false }  // ei hae verkosta
};

// ---------- Yhteinen kutsu: kokeilee tekoälyt järjestyksessä ----------

// creds = resolveKeys(req) (tai pelkkä Gemini-avain merkkijonona). Palauttaa { data, model, provider }.
async function callGemini(creds, payload) {
  if (typeof creds === "string") creds = { gemini: creds, preferred: "gemini" };
  const wantSearch = hasSearchTool(payload);
  const failures = [];
  let skippedForSearch = false;

  for (const p of providerOrder(creds)) {
    if (wantSearch && !PROVIDERS[p].search) { skippedForSearch = true; continue; }
    try {
      const out = await PROVIDERS[p].call(creds[p], payload, { deadline: creds.deadline });
      // Ilman verkkohakua tehdyt vastaukset eivät ole maadoitettuja: reseptilinkit voivat olla keksittyjä
      if (!wantSearch && out.data && typeof out.data === "object") out.data._ungrounded = true;
      return { ...out, provider: p };
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      failures.push({ provider: p, error: e });
    }
  }

  if (failures.length === 0) {
    const e = new ApiError(502, "Yksikään käytettävissä oleva tekoäly ei tue verkkohakua");
    e.skippedForSearch = skippedForSearch;
    throw e;
  }
  // Ensisijainen virhe: ensimmäinen muu kuin 404 (kertovampi), muuten ensimmäinen.
  const primary = (failures.find(f => f.error.status !== 404) || failures[0]).error;
  const error = new ApiError(primary.status, primary.message, true);
  error.quota = primary.quota;
  error.skippedForSearch = skippedForSearch;
  error.attempts = failures.map(f => failures.length > 1 ? `${LABELS[f.provider]}: ${f.error.attempts || f.error.status}` : f.error.attempts).join("; ").slice(0, 300);
  const metric = failures.map(f => f.error.quota?.metric).find(Boolean);
  if (metric) error.attempts += ` | kiintiö: ${metric}`;
  error.friendly = failures.length === 1
    ? describeError(primary.status, primary.message, primary.quota, failures[0].provider)
    : failures.map(f => `${LABELS[f.provider]}: ${describeError(f.error.status, f.error.message, f.error.quota, f.provider)}`).join(" · ");
  // Vain yksi tekoäly käytössä ja sen kiintiö täynnä -> neuvo lisäämään ilmainen varavaihtoehto
  if (failures.length === 1 && primary.status === 429 && !creds.groq && !creds.openrouter) {
    error.friendly += ". Lisää ilmainen Groq-avain varavaihtoehdoksi (⚙️-ikkuna)";
  }
  throw error;
}

// Virheet, joiden jälkeen verkkohakua käyttämätön varakutsu kannattaa yrittää (kiintiö, ruuhka, ei hakutukea).
// Verkkohaulla (grounding) on oma, pienempi kiintiönsä, joten sen täyttyminen ei estä tavallista kutsua.
const SEARCH_SOFT_FAIL = [400, 404, 413, 429, 500, 502, 503, 504, 529];
let searchBlockedUntil = 0; // kun haku kaatuu kiintiöön tai aikaan, ohitetaan se 10 min tällä lämpimällä instanssilla

// Ensin verkkohaulla maadoitettu kutsu, sitten puhdas JSON-tila. parse(data) palauttaa listan.
// requireSearch = true (esim. tarjoukset): ilman verkkohakua ei tehdä varakutsua, koska hinnat olisivat keksittyjä.
// useSearch = false: ohitetaan verkkohaku kokonaan (säästää haun kiintiötä; vastaus ei ole maadoitettu).
async function callWithSearchFallback(key, contents, parse, temperature = 0.4, requireSearch = false, useSearch = true) {
  let result = [];
  if (requireSearch || (useSearch && Date.now() >= searchBlockedUntil)) {
    try {
      const { data } = await callGemini(key, { contents, tools: SEARCH_TOOLS(), generationConfig: { temperature } });
      try { result = parse(data); } catch (e) { result = []; }
    } catch (e) {
      const keyProblem = /api key|API_KEY/i.test(e?.message || "") || e?.status === 401 || e?.status === 403;
      const soft = e instanceof ApiError && !keyProblem && (SEARCH_SOFT_FAIL.includes(e.status) || e.skippedForSearch);
      if (soft) searchBlockedUntil = Date.now() + 10 * 60 * 1000;   // haku ei toimi juuri nyt: ohitetaan 10 min
      if (!soft || requireSearch) throw e;
    }
  }
  if (result.length > 0 || requireSearch) return result;
  const { data } = await callGemini(key, { contents, generationConfig: { temperature, responseMimeType: "application/json" } });
  return parse(data);
}

// Yhdistää vastauksen kaikkien osien (parts) tekstikentät. Maadoituksen metatieto (groundingMetadata) on
// parts-taulukon ulkopuolella eikä kuulu tekstiin; "thought"-osat ohitetaan.
function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter(p => p && !p.thought && typeof p.text === "string")
    .map(p => p.text)
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

// Yhteinen POST-käsittelijän kääre: CORS, avaimet, JSON-runko ja virheiden muotoilu.
function createHandler(work) {
  const handler = async function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-key, x-groq-key, x-openrouter-key, x-tavily-key, x-ai-provider");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Vain POST sallittu" });

    const keys = resolveKeys(req);
    keys.deadline = Date.now() + (Number(process.env.AI_TIME_BUDGET_MS) || 50000); // vercel.json maxDuration 60 s
    if (!keys.gemini && !keys.groq && !keys.openrouter) {
      return res.status(500).json({ error: "Tekoälyn API-avain puuttuu palvelimelta (GEMINI_API_KEY, GROQ_API_KEY tai OPENROUTER_API_KEY)", code: "NO_KEY" });
    }

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
    if (!body || typeof body !== "object") return res.status(400).json({ error: "Virheellinen pyyntö" });

    try {
      return res.status(200).json(await work(keys, body));
    } catch (e) {
      const status = e instanceof ApiError && e.status >= 400 && e.status < 600 ? e.status : 500;
      const message = e?.friendly || (e instanceof ApiError && e.fromGemini ? describeError(status, e.message, e.quota) : (e?.message || "Palvelinvirhe"));
      console.error(req.url, status, e?.message);
      return res.status(status).json({ error: message, detail: e?.detail || (e?.attempts ? `kokeiltu: ${e.attempts}` : undefined) });
    }
  };
  // Vercel: JSON-rungon raja (pakattu kuva on ~0,3 Mt)
  handler.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
  return handler;
}

const isSearchBlocked = () => Date.now() < searchBlockedUntil;

module.exports = {
  isSearchBlocked, ApiError, callGemini, callWithSearchFallback, extractText, parseJson, validateImage, strList, createHandler,
  resolveKeys, classifyQuota
};
