// Corsia – palvelimen tila (GET /api/status). Kertoo vain, onko avain asetettu – ei koskaan avainta itseään.
const has = name => Boolean((process.env[name] || "").trim());

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    serverKey: has("GEMINI_API_KEY"), // yhteensopivuus: vanha kenttä tarkoittaa Geminiä
    providers: { gemini: has("GEMINI_API_KEY"), groq: has("GROQ_API_KEY"), openrouter: has("OPENROUTER_API_KEY") }
  });
};
