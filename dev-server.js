// Paikallinen testipalvelin: tarjoilee staattiset tiedostot ja api/-reitit (kuten Vercel).
// Lukee .env.local-tiedoston. MOCK_GEMINI=1 korvaa Googlen API:n testivastauksilla.
// Käyttö: node dev-server.js   (tai: MOCK_GEMINI=1 PORT=3000 node dev-server.js)
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

// .env.local -> process.env (olemassa olevia muuttujia ei ylikirjoiteta)
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] !== "" && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const PORT = process.env.PORT || 3000;
const PREFIX = process.env.STATIC_PREFIX || "";
global.__calls = [];

if (process.env.MOCK_GEMINI === "1") {
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if (!String(url).includes("generativelanguage")) return realFetch(url, opts);
    const body = opts.body ? JSON.parse(opts.body) : {};
    const raw = JSON.stringify(body);
    global.__calls.push({ url: String(url), key: opts.headers?.["x-goog-api-key"], body });
    await new Promise(r => setTimeout(r, 800));
    let text;
    if (raw.includes("kauppa-apuri")) {
      text = JSON.stringify([{ name: "Maito", cat: "Maitotuotteet", qty: 2 }, { name: "Banaani", cat: "Hedelmät", qty: 1 }]);
    } else if (raw.includes("ruokatarjouksia")) {
      text = "Tässä: " + JSON.stringify([{ cat: "🐟 Kala", name: "Testilohi", price: "9,90 €/kg", store: "Prisma Jumbo", mainCat: "Liha" }]);
    } else if (raw.includes("viikon ruokalista")) {
      const days = (raw.match(/päivälle tässä järjestyksessä: ([A-Za-z, ]+)\./) || [, "Ma"])[1].split(", ");
      text = JSON.stringify(days.map((d, i) => ({
        recipe_title: "Viikkoresepti " + d, cuisine: "Klassikko", source_url: null, original_servings: 4, target_servings: 4,
        ingredients: [
          { name: "Naudan sisäpaisti", amount_needed: "600 g", in_fridge: false, to_shopping_list: "Naudan sisäpaisti (600 g)", cat: "Liha" },
          { name: "Kerma", amount_needed: "1 dl", in_fridge: false, to_shopping_list: "Kerma (1 dl)", cat: "Maitotuotteet" }
        ],
        instructions_brief: "Testi " + i
      })));
    } else if (raw.includes("TARKKA KOKKAUSOHJE")) {
      text = JSON.stringify({
        prep_time: "10 min", cook_time: "20 min", equipment_needed: ["Wokkipannu", "Kattila", "Leikkuulauta"],
        steps: [
          { step_number: 1, title: "Valmistele", instruction: "Pilko kasvikset ja mittaa ainekset valmiiksi.", timer_seconds: null },
          { step_number: 2, title: "Kuumenna pannu", instruction: "Kuumenna pannu kuumaksi ja lisää 1 rkl öljyä.", timer_seconds: 30 },
          { step_number: 3, title: "Paista", instruction: "Paista liha kypsäksi välillä käännellen.", timer_seconds: 240 }
        ],
        pro_tips: "Lisää lopuksi pieni ripaus limemehua raikkaudeksi."
      });
    } else if (raw.includes("inlineData")) {
      text = JSON.stringify({ ingredients: ["Kananmunat", "Paprika", "Riisi"] });
    } else {
      const t = raw.includes("Pasta") ? "Pastacarbonara" : "Kanawok";
      text = JSON.stringify([{
        recipe_title: t, cuisine: "Aasialainen", source_url: "https://www.k-ruoka.fi/reseptit/" + t.toLowerCase(),
        original_servings: 4, target_servings: 8,
        ingredients: [
          { name: "Paprika", amount_needed: "2 kpl", in_fridge: true, to_shopping_list: "", cat: "Hevi" },
          { name: "Kerma", amount_needed: "2 dl", in_fridge: false, to_shopping_list: "Kerma (2 dl)", cat: "Maitotuotteet" },
          { name: "Testiaines " + t, amount_needed: "100 g", in_fridge: false, to_shopping_list: "Testiaines " + t + " (100 g)", cat: "Muut" }
        ],
        instructions_brief: "Testiohje."
      }]);
    }
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  res.status = (s) => { res.statusCode = s; return res; };
  res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };

  if (url.pathname === "/api/__calls") return res.json(global.__calls.map(c => ({ url: c.url, key: c.key ? c.key.slice(0, 5) : null })));
  const apiMatch = url.pathname.match(/^\/api\/([a-z-]+)$/);
  if (apiMatch && fs.existsSync(path.join(ROOT, "api", apiMatch[1] + ".js"))) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    req.body = raw ? (() => { try { return JSON.parse(raw); } catch (e) { return raw; } })() : null;
    console.log("API", req.method, url.pathname, raw.length, "bytes");
    return require(path.join(ROOT, "api", apiMatch[1] + ".js"))(req, res);
  }
  let p = PREFIX && url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : url.pathname;
  if (p === "" || p === "/") p = "/index.html";
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, "0.0.0.0", () => console.log("Corsia dev server: http://localhost:" + PORT));
