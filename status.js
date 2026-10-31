// Corsia – palvelimen tila (GET /api/status). Kertoo vain, onko avain asetettu – ei koskaan avainta itseään.
module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, serverKey: Boolean((process.env.GEMINI_API_KEY || "").trim()) });
};
