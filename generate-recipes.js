// Corsia – reseptigeneraattori (POST /api/generate-recipes).
// Kaksi vaihetta (body.step):
//   "identify" -> { image: { base64, mimeType } }                          => { ingredients: [...] }
//   "recipes"  -> { ingredients, diners, cook_twice, cuisines, categories } => { effective_diners, recipes: [...] }
//   "week"     -> { ..., days: ["Ma", ...] }                                 => { effective_diners, days, recipes }
//   "detail"   -> { recipe_title, ingredients: ["Aines (määrä)", ...], target_servings }
//                                                                            => { prep_time, cook_time, equipment_needed, steps, pro_tips }
const { ApiError, callGemini, callWithSearchFallback, extractText, parseJson, validateImage, strList, createHandler } = require("./_lib/gemini");

async function identifyIngredients(key, body) {
  const image = validateImage(body.image);
  const prompt = `Olet tarkka suomalainen keittiöapuri. Kuvassa on jääkaapin, pakastimen tai ruokakaapin sisältöä.
Tunnista KAIKKI selvästi näkyvät ruoka-aineet ja raaka-aineet. Älä keksi asioita, joita ei näy.
Palauta PELKKÄ JSON-objekti: {"ingredients": ["Kananmunat", "Maito", "Paprika", ...]}
Nimet suomeksi perusmuodossa, ilman määriä. Jos mitään ei tunnisteta, palauta {"ingredients": []}.`;

  const { data } = await callGemini(key, {
    contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: image }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
  });
  const parsed = parseJson(extractText(data), "{", "}");
  const list = Array.isArray(parsed) ? parsed : parsed?.ingredients;
  return {
    ingredients: (Array.isArray(list) ? list : [])
      .map(x => String(typeof x === "string" ? x : x?.name || "").trim())
      .filter(Boolean)
      .slice(0, 60)
  };
}

function buildRecipePrompt({ ingredients, diners, cookTwice, effective, cuisines, categories, count = 3, days = [], avoid = [], deals = [] }) {
  const cuisineStr = cuisines.length > 0 ? cuisines.join(", ") : "vapaavalintainen";
  const catLine = categories.length > 0 ? `TÄSMÄLLEEN yksi näistä: ${categories.join(", ")}` : "kaupan osasto suomeksi";
  const weekTask = days.length > 0
    ? `1. Laadi viikon ruokalista: ${count} ERI reseptiä, yksi kullekin päivälle tässä järjestyksessä: ${days.join(", ")}. Vaihtele pääraaka-ainetta (kana, kala, liha, kasvis) ja keittiötyyliä; arkipäiville nopeampia (alle 40 min), viikonlopulle saa olla työläämpi. Käytä jääkaapin ainekset ensimmäisinä päivinä.`
    : `1. Hae/valitse ${count} aitoa, laadukasta reseptiä, jotka vastaavat toivottuja keittiötyylejä ja hyödyntävät käyttäjän aineksia mahdollisimman paljon.`;
  return `Olet suomalainen keittiöapuri ja reseptiasiantuntija.

KÄYTTÄJÄLLÄ ON JO (tunnistettu jääkaappikuvasta): ${ingredients.length > 0 ? ingredients.join(", ") : "ei tunnistettuja aineksia"}.
TOIVOTUT KEITTIÖTYYLIT: ${cuisineStr}.
RUOKAILIJAT: ${diners}${cookTwice ? " (ruoka syödään kahdesti)" : ""} => skaalaa TÄSMÄLLEEN ${effective} annokselle.${deals.length > 0 ? `\nTÄMÄN VIIKON TARJOUKSET (suosi, jos sopivat): ${deals.join("; ")}.` : ""}${avoid.length > 0 ? `\nÄLÄ EHDOTA NÄITÄ (jo suunniteltu): ${avoid.join(", ")}.` : ""}

TEHTÄVÄT:
${weekTask}
   Käytä sekä kotimaisia lähteitä (esim. K-Ruoka, Valio, Kotikokki, Yhteishyvä, Soppa365) että kansainvälisiä (esim. BBC Good Food, Serious Eats, Allrecipes, Just One Cookbook, RecipeTin Eats).
2. Kerro reseptin alkuperäinen annosmäärä (original_servings) ja skaalaa ainesmäärät suhteessa ${effective} / original_servings.
3. Käytä metrisiä yksiköitä (g, kg, dl, l, rkl, tl, kpl) ja pyöristä järkeviin kaupan pakkauskokoihin.
4. in_fridge = true, jos aines (tai selvä vastine) on käyttäjän listalla, muuten false.
5. to_shopping_list = kauppalapulle kirjoitettava rivi muodossa "Aines (määrä)", esim. "Kookosmaito (4 dl)". Jos in_fridge on true, to_shopping_list = "".
6. Perusmausteita (suola, pippuri, vesi) ei tarvitse ostaa: merkitse ne in_fridge=true.

Vastaa PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä:
[{
  "recipe_title": "reseptin nimi suomeksi",
  "cuisine": "esim. Aasialainen",
  "source_url": "todellinen reseptin URL tai null",
  "original_servings": 4,
  "target_servings": ${effective},
  "ingredients": [{"name": "aines perusmuodossa suomeksi", "amount_needed": "esim. 400 g", "in_fridge": false, "to_shopping_list": "Aines (400 g)", "cat": ${JSON.stringify(catLine)}}],
  "instructions_brief": "2-3 lausetta suomeksi"
}]`;
}

function normalizeRecipes(parsed, effective, max = 5) {
  const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.recipes) ? parsed.recipes : []);
  return arr
    .filter(r => r && r.recipe_title)
    .slice(0, max)
    .map(r => ({
      recipe_title: String(r.recipe_title),
      cuisine: String(r.cuisine || "Resepti"),
      source_url: typeof r.source_url === "string" && /^https?:\/\//i.test(r.source_url) ? r.source_url : null,
      original_servings: Number(r.original_servings) || null,
      target_servings: effective,
      ingredients: (Array.isArray(r.ingredients) ? r.ingredients : [])
        .filter(i => i && i.name)
        .map(i => {
          const name = String(i.name).trim();
          const amount = String(i.amount_needed ?? i.amount ?? "").trim();
          const inFridge = i.in_fridge === true || i.in_fridge === "true";
          let toList = inFridge ? "" : String(i.to_shopping_list || "").trim();
          if (!inFridge && !toList) toList = amount ? `${name} (${amount})` : name;
          return { name, amount_needed: amount, in_fridge: inFridge, to_shopping_list: toList, cat: i.cat ? String(i.cat) : null };
        }),
      instructions_brief: String(r.instructions_brief || "")
    }));
}

const VALID_DAYS = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

// mode "recipes" = 3 ehdotusta, "week" = yksi resepti per pyydetty päivä (body.days).
async function generateRecipes(key, body, mode) {
  const diners = Math.min(12, Math.max(1, parseInt(body.diners, 10) || 1));
  const cookTwice = body.cook_twice === true;
  const effective = diners * (cookTwice ? 2 : 1);
  const days = mode === "week" ? strList(body.days, 7).filter(d => VALID_DAYS.includes(d)) : [];
  if (mode === "week" && days.length === 0) throw new ApiError(400, "Viikolla ei ole tyhjiä päiviä");
  const count = mode === "week" ? days.length : 3;
  const prompt = buildRecipePrompt({
    ingredients: strList(body.ingredients, 60),
    diners, cookTwice, effective, count, days,
    cuisines: strList(body.cuisines, 10),
    categories: strList(body.categories, 40),
    avoid: strList(body.avoid, 30).map(s => s.slice(0, 80)),
    deals: strList(body.deals, 15).map(s => s.slice(0, 80))
  });
  const recipes = await callWithSearchFallback(
    key,
    [{ role: "user", parts: [{ text: prompt }] }],
    data => normalizeRecipes(parseJson(extractText(data), "[", "]"), effective, count)
  );
  if (recipes.length === 0) throw new ApiError(502, "Reseptejä ei saatu – yritä uudelleen");
  return mode === "week"
    ? { effective_diners: effective, days: days.slice(0, recipes.length), recipes }
    : { effective_diners: effective, recipes };
}

// ---------- Kokkaustila: tarkka vaiheittainen ohje ----------
const toText = (v, max) => String(v ?? "").trim().slice(0, max);

// Ajastin vain järkevälle välille (5 s – 4 h), muuten null.
function toTimerSeconds(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 5 && n <= 14400 ? n : null;
}

function buildDetailPrompt(title, servings, ingredients) {
  return `Olet kokenut suomalainen kokki, joka kirjoittaa TARKKA KOKKAUSOHJE -vaiheistuksen kotikokille.

RESEPTI: ${title}
ANNOKSIA: ${servings}
AINEKSET (määrät jo skaalattu ${servings} annokselle):
${ingredients.length > 0 ? ingredients.map(i => "- " + i).join("\n") : "- (ei annettu; päättele tavalliset ainekset reseptin nimestä)"}

TEHTÄVÄ: Kirjoita tästä reseptistä selkeä, vaiheittainen ohje, jota voi seurata keittiössä puhelimen näytöltä.

SÄÄNNÖT:
1. 4-10 vaihetta, jokainen yksi selkeä tekeminen. Kirjoita "instruction" käskymuodossa suomeksi ja mainitse ainekset määrineen siinä vaiheessa, jossa niitä käytetään (esim. "Kuumenna pannulla 1 rkl öljyä ja paista 400 g kanaa 6-8 min").
2. "timer_seconds" = kokonaisluku sekunteina vain, jos vaiheessa on yksi selvä odotus- tai kypsennysaika (esim. 4 min = 240). Muuten null. Jos aika on vaihteluväli, käytä keskiarvoa tai turvallista alarajaa. Älä aseta ajastinta pelkälle pilkkomiselle tai sekoittamiselle.
3. "prep_time" ja "cook_time" lyhyinä tekstinä, esim. "15 min", "1 h 10 min".
4. "equipment_needed" = välineet suomeksi, esim. "Wokkipannu", "Kattila", "Leikkuulauta".
5. "pro_tips" = yksi tai kaksi lausetta: vinkki lisämausteeseen tai muunnelmaan.
6. Käytä metrisiä yksiköitä (g, kg, dl, l, rkl, tl, kpl) ja uunin lämpötilat Celsius-asteina. Älä keksi uusia pääraaka-aineita, jotka eivät ole listalla (perusmausteet ja öljy ovat sallittuja).

Vastaa PELKÄLLÄ JSON-objektilla, ei muuta tekstiä:
{
  "prep_time": "15 min",
  "cook_time": "20 min",
  "equipment_needed": ["Wokkipannu"],
  "steps": [{"step_number": 1, "title": "lyhyt otsikko", "instruction": "tarkka ohje", "timer_seconds": 240}],
  "pro_tips": "lyhyt vinkki"
}`;
}

async function recipeDetail(key, body) {
  const title = toText(body.recipe_title, 150);
  if (!title) throw new ApiError(400, "Reseptin nimi puuttuu");
  const servings = Math.min(24, Math.max(1, parseInt(body.target_servings, 10) || 4));
  const ingredients = strList(body.ingredients, 60).map(s => s.slice(0, 120));

  const { data } = await callGemini(key, {
    contents: [{ role: "user", parts: [{ text: buildDetailPrompt(title, servings, ingredients) }] }],
    generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
  });
  const parsed = parseJson(extractText(data), "{", "}");

  const steps = (Array.isArray(parsed?.steps) ? parsed.steps : [])
    .filter(s => s && toText(s.instruction, 800))
    .slice(0, 15)
    .map((s, i) => ({
      step_number: i + 1,
      title: toText(s.title, 80) || `Vaihe ${i + 1}`,
      instruction: toText(s.instruction, 800),
      timer_seconds: toTimerSeconds(s.timer_seconds)
    }));
  if (steps.length === 0) throw new ApiError(502, "Tarkkaa ohjetta ei saatu – yritä uudelleen");

  return {
    prep_time: toText(parsed.prep_time, 40),
    cook_time: toText(parsed.cook_time, 40),
    equipment_needed: strList(parsed.equipment_needed, 15).map(s => s.trim().slice(0, 60)).filter(Boolean),
    steps,
    pro_tips: toText(parsed.pro_tips, 400)
  };
}

module.exports = createHandler(async (key, body) => {
  if (body.step === "identify") return identifyIngredients(key, body);
  if (body.step === "recipes") return generateRecipes(key, body, "recipes");
  if (body.step === "week") return generateRecipes(key, body, "week");
  if (body.step === "detail") return recipeDetail(key, body);
  throw new ApiError(400, "Tuntematon vaihe (step)");
});
