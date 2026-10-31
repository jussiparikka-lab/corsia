# Corsia

Kaikki tekoälykutsut (Gemini) tehdään palvelimella kansiossa `api/` – selain ei kutsu Googlea suoraan.

## Palvelinreitit (Vercel Serverless Functions)
| Reitti | Tehtävä |
|---|---|
| `POST /api/generate-recipes` | Ruokasuunnittelu: `step: "identify"` (kuva → raaka-aineet) ja `step: "recipes"` (reseptit + skaalaus) |
| `POST /api/parse-products` | Kauppalapun tunnistus tekstistä (puhe, WhatsApp) tai kuvasta |
| `POST /api/refresh-deals` | Päivän tärpit Google-haulla |
| `GET /api/status` | Kertoo onko `GEMINI_API_KEY` asetettu (ei paljasta avainta) |
| `api/_lib/gemini.js` | Yhteinen koodi (mallien valinta, virheet, CORS) – ei oma reitti |

## Avain
1. Paikallisesti: kirjoita avain tiedostoon `.env.local` (`GEMINI_API_KEY=...`). Tiedosto on `.gitignore`:ssa.
2. Tuotannossa: Vercel → Project → Settings → Environment Variables → `GEMINI_API_KEY`, sitten Redeploy.
3. Jos muuttujaa ei ole asetettu, palvelin käyttää selaimen asetuksiin aiemmin tallennettua avainta (vara-avain).

## Paikallinen ajo
- `vercel dev` (lukee `.env.local`:n), tai
- `node dev-server.js` → http://localhost:3000 (lukee myös `.env.local`:n; `MOCK_GEMINI=1` = testivastaukset ilman avainta)

## Ruokasuunnittelu
- Haku: kuva pakataan (max 1024 px, JPEG 0,7) → raaka-aineet → 3 reseptiä skaalattuna `diners × (2 jos syödään kahdesti)`.
- ⭐ Suosikit ja 📅 viikon ruokalista tallentuvat Firebaseen (näkyvät koko perheelle).
- 📤 Jaa: avaa puhelimen jakovalikon tai WhatsAppin reseptillä ja ostettavilla.
