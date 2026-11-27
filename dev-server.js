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

// Vietnamilaisen keittiön testireseptit (Phở, Bún chả, Bánh mì) oikeilla kauppakategorioilla
// Tavoitevalmistusaika kehotteesta ("enintään 30 minuuttia" / "yli 60 minuuttia") -> mock-reseptien kokonaisaika
function mockTotalMinutes(raw) {
  const m = raw.match(/enintään (\d+) minuuttia/);
  if (m) return Math.max(10, Number(m[1]) - 5);
  return /saa olla yli 60 minuuttia/.test(raw) ? 80 : 35;
}

function vietnamMock(minutes = 35) {
  const ing = (name, amount, cat, price = 1.5) => ({ name, amount_needed: amount, in_fridge: false, to_shopping_list: `${name} (${amount})`, cat, price_eur: price });
  const side = (title, items) => ({ title, ingredients: items.map(([n, a, c]) => ({ name: n, amount_needed: a, cat: c, price_eur: 1.2 })), nutrition_per_serving: { energy_kcal: 140, protein_g: 4, carbs_g: 22, fat_g: 3 } });
  const base = { cuisine: "Vietnamilainen", source_url: null, original_servings: 4, target_servings: 4, is_vegetarian: false, vege_note: "", total_time_minutes: minutes,
    nutrition_per_serving: { energy_kcal: 480, protein_g: 32, carbs_g: 52, fat_g: 14, fiber_g: 5 } };
  return [
    { ...base, recipe_title: "Phở bò (testi)", instructions_brief: "Keitä tähtianis-inkiväärilientä, lisää nuudelit ja ohuet naudan siivut. Tarjoile yrttien, itujen ja limetin kanssa.",
      ingredients: [ing("Naudan ulkofile", "300 g", "Liha"), ing("Riisinuudelit", "250 g", "Aasia / Texmex"), ing("Tähtianis", "3 kpl", "Kuivat"), ing("Inkivääri", "1 pala", "Hevi"),
        ing("Korianteri", "1 nippu", "Hevi"), ing("Kevätsipuli", "3 kpl", "Hevi"), ing("Idut", "100 g", "Hevi"), ing("Limetti", "2 kpl", "Hedelmät"), ing("Kalakastike", "2 rkl", "Aasia / Texmex")],
      side_dishes: [side("Tuorekevätrullat (gỏi cuốn)", [["Riisipaperi", "8 kpl", "Aasia / Texmex"], ["Riisivermiselli", "100 g", "Aasia / Texmex"], ["Katkaravut", "200 g", "Liha"], ["Minttu", "1 nippu", "Hevi"]]),
        side("Pikkelöity porkkana ja retiisi", [["Porkkana", "2 kpl", "Juurekset"], ["Retiisi (daikon)", "1 kpl", "Juurekset"], ["Riisiviinietikka", "1 dl", "Aasia / Texmex"]])] },
    { ...base, recipe_title: "Bún chả (testi)", instructions_brief: "Marinoi possunjauheliha kalakastikkeessa ja paista pihveiksi. Tarjoile riisivermisellin, yrttien ja dippikastikkeen kanssa.",
      ingredients: [ing("Possun jauheliha", "500 g", "Liha"), ing("Riisivermiselli", "250 g", "Aasia / Texmex"), ing("Kalakastike", "3 rkl", "Aasia / Texmex"), ing("Valkosipuli", "3 kpl", "Hevi"),
        ing("Minttu", "1 nippu", "Hevi"), ing("Jäävuorisalaatti", "1 kpl", "Hevi"), ing("Kurkku", "1 kpl", "Hevi"), ing("Limetti", "1 kpl", "Hedelmät")],
      side_dishes: [side("Tuorekevätrullat (gỏi cuốn)", [["Riisipaperi", "8 kpl", "Aasia / Texmex"], ["Salaatti", "1 kpl", "Hevi"]])] },
    { ...base, recipe_title: "Bánh mì (testi)", instructions_brief: "Täytä rapea patonki possulla, pikkelöidyillä kasviksilla, korianterilla ja chilillä.",
      ingredients: [ing("Patonki", "4 kpl", "Leivät"), ing("Possun ulkofile", "400 g", "Liha"), ing("Porkkana", "2 kpl", "Juurekset"), ing("Retiisi (daikon)", "1 kpl", "Juurekset"),
        ing("Korianteri", "1 nippu", "Hevi"), ing("Chili (pieni)", "2 kpl", "Hevi"), ing("Majoneesi", "1 dl", "Kuivat (mutta märät)"), ing("Soijakastike", "2 rkl", "Aasia / Texmex")],
      side_dishes: [side("Raikas kurkkusalaatti", [["Kurkku", "1 kpl", "Hevi"], ["Limetti", "1 kpl", "Hedelmät"]])] }
  ];
}

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
      // Päiväkohtaiset keittiöt (🌍 Sekoita keittiöt): "Ma = Thai; Ti = Vietnamilainen"
      const dayCuisine = {};
      for (const m of raw.matchAll(/\b(Ma|Ti|Ke|To|Pe|La|Su) = ([^;."\\]+)/g)) dayCuisine[m[1]] = m[2].trim();
      const vn = vietnamMock(mockTotalMinutes(raw));
      text = JSON.stringify(days.map((d, i) => /vietnam/i.test(dayCuisine[d] || "") ? { ...vn[i % vn.length], recipe_title: vn[i % vn.length].recipe_title + " " + d } : ({
        recipe_title: "Viikkoresepti " + d, cuisine: dayCuisine[d] || "Klassikko", source_url: null, original_servings: 4, target_servings: 4, total_time_minutes: mockTotalMinutes(raw),
        ingredients: [
          { name: "Naudan sisäpaisti", amount_needed: "600 g", in_fridge: false, to_shopping_list: "Naudan sisäpaisti (600 g)", cat: "Liha" },
          { name: "Kerma", amount_needed: "1 dl", in_fridge: false, to_shopping_list: "Kerma (1 dl)", cat: "Maitotuotteet" }
        ],
        instructions_brief: "Testi " + i
      })));
    } else if (raw.includes("PUHUTTU RAAKA-AINELISTA")) {
      text = JSON.stringify({ ingredients: ["Kananmunat", "Riisi", "Paprika"] });
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
      if (raw.includes("Vietnamilainen")) text = JSON.stringify(vietnamMock(mockTotalMinutes(raw)));
      else text = JSON.stringify([{
        recipe_title: t, cuisine: "Aasialainen", total_time_minutes: mockTotalMinutes(raw), source_url: "https://www.k-ruoka.fi/reseptit/" + t.toLowerCase(),
        original_servings: 4, target_servings: 8,
        ingredients: [
          { name: "Kanafile", amount_needed: "600 g", in_fridge: false, to_shopping_list: "Kanafile (600 g)", cat: "Liha", price_eur: 6.9 },
          { name: "Paprika", amount_needed: "2 kpl", in_fridge: true, to_shopping_list: "", cat: "Hevi", price_eur: 1.8 },
          { name: "Kerma", amount_needed: "2 dl", in_fridge: false, to_shopping_list: "Kerma (2 dl)", cat: "Maitotuotteet", price_eur: 0.9 },
          { name: "Riisi", amount_needed: "3 dl", in_fridge: false, to_shopping_list: "Riisi (3 dl)", cat: "Kuivat", price_eur: 0.7 },
          { name: "Rypsiöljy", amount_needed: "2 rkl", in_fridge: true, to_shopping_list: "", cat: "Kuivat (mutta märät)", price_eur: 0.1 },
          { name: "Soijakastike", amount_needed: "3 rkl", in_fridge: false, to_shopping_list: "Soijakastike (3 rkl)", cat: "Aasia / Texmex", price_eur: 0.5 },
          { name: "Suola", amount_needed: "1 tl", in_fridge: true, to_shopping_list: "", cat: "Kuivat", price_eur: 0.01 },
          { name: "Mustapippuri", amount_needed: "1 tl", in_fridge: true, to_shopping_list: "", cat: "Kuivat", price_eur: 0.05 },
          { name: "Testiaines " + t, amount_needed: "100 g", in_fridge: false, to_shopping_list: "Testiaines " + t + " (100 g)", cat: "Muut", price_eur: 0.8 }
        ],
        nutrition_per_serving: { energy_kcal: 540, protein_g: 38, carbs_g: 52, fat_g: 18, fiber_g: 4 },
        side_dishes: [
          { title: "Valkosipuli-kermaperunat", nutrition_per_serving: { energy_kcal: 210, protein_g: 4, carbs_g: 30, fat_g: 8 }, ingredients: [{ name: "Peruna", amount_needed: "800 g", cat: "Juurekset", price_eur: 1.4 }, { name: "Kerma", amount_needed: "2 dl", cat: "Maitotuotteet", price_eur: 0.9 }, { name: "Valkosipuli", amount_needed: "2 kpl", cat: "Hevi", price_eur: 0.3 }, { name: "Voi", amount_needed: "1 rkl", cat: "Maitotuotteet", price_eur: 0.2 }] },
          { title: "Raikas vihreä salaatti", nutrition_per_serving: { energy_kcal: 40, protein_g: 2, carbs_g: 6, fat_g: 1 }, ingredients: [{ name: "Jäävuorisalaatti", amount_needed: "1 kpl", cat: "Hevi", price_eur: 1.5 }, { name: "Kurkku", amount_needed: "1 kpl", cat: "Hevi", price_eur: 1.2 }] },
          { title: "Uunijuurekset", nutrition_per_serving: { energy_kcal: 120, protein_g: 2, carbs_g: 20, fat_g: 4 }, ingredients: [{ name: "Porkkana", amount_needed: "500 g", cat: "Juurekset", price_eur: 0.9 }, { name: "Oliiviöljy", amount_needed: "2 rkl", cat: "Kuivat (mutta märät)", price_eur: 0.4 }] }
        ],
        instructions_brief: "Leikkaa kana kuutioiksi ja suolaa. Kuumenna rypsiöljy pannulla ja paista kana kypsäksi 8–10 minuuttia. Lisää paprika ja kerma, sekoita ja anna hautua 5 minuuttia. Keitä riisi pakkauksen ohjeen mukaan ja tarjoile."
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
