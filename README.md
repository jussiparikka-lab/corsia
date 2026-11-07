# Corsia

Kaikki tekoälykutsut (Gemini) tehdään palvelimella kansiossa `api/` – selain ei kutsu Googlea suoraan.

## Palvelinreitit (Vercel Serverless Functions)
| Reitti | Tehtävä |
|---|---|
| `POST /api/generate-recipes` | Ruokasuunnittelu: `step: "identify"` (kuva tai puhuttu lista → raaka-aineet) ja `step: "recipes"` (reseptit + skaalaus) |
| `POST /api/parse-products` | Kauppalapun tunnistus tekstistä (puhe, WhatsApp) tai kuvasta |
| `POST /api/refresh-deals` | Päivän tärpit Google-haulla |
| `GET /api/status` | Kertoo, mille tekoälyille avain on asetettu (ei paljasta avaimia) |
| `api/_lib/gemini.js` | Yhteinen koodi (mallien valinta, virheet, CORS) – ei oma reitti |

## Tekoälyt ja avaimet (kaikki ilmaisia)
Palvelin käyttää vain ilmaisia tekoälypalveluita. Vähintään yksi avain riittää; useampi antaa varavaihtoehtoja, jos yhden kiintiö täyttyy.

| Palvelu | Ympäristömuuttuja | Ilmaisen avaimen saa | Verkkohaku (tarjoukset) |
|---|---|---|---|
| Gemini (Google AI Studio) | `GEMINI_API_KEY` | aistudio.google.com → Get API key | kyllä |
| Groq | `GROQ_API_KEY` | console.groq.com → API Keys (ei korttia) | ei |
| OpenRouter | `OPENROUTER_API_KEY` | openrouter.ai → Keys (käytetään vain `:free`-malleja) | ei |
| Tavily (vain tarjoushaku) | `TAVILY_API_KEY` | tavily.com → API key (1000 hakua/kk, ei korttia) | kyllä |

1. Paikallisesti: kirjoita avaimet tiedostoon `.env.local` (esim. `GEMINI_API_KEY=...`). Tiedosto on `.gitignore`:ssa.
2. Tuotannossa: Vercel → Project → Settings → Environment Variables, sitten Redeploy.
3. Järjestys: sovelluksen ⚙️-ikkunan "Tekoäly"-valinta (tai `AI_PROVIDER=gemini|groq|openrouter`) määrää ensisijaisen. Jos sen kiintiö on täynnä tai se ei vastaa, kokeillaan seuraavaa, jolla on avain.
4. Mallit voi pakottaa muuttujilla `GEMINI_MODEL`, `GROQ_MODEL`, `OPENROUTER_MODEL`.
5. Selaimeen tallennetut avaimet (⚙️-ikkuna) ovat vara-avaimia: niitä käytetään vain, jos palvelimella ei ole vastaavaa muuttujaa.
6. Tarjoukset (tärpit) tarvitsevat verkkohaun. Googlen ilmaisella avaimella uusille Gemini-malleille ei yleensä ole Google-hakua, joten suositus on ilmainen Tavily-avain: haku lukee kauppojen tarjoussivuja, tekoäly poimii tarjoukset vain haetusta tekstistä ja jokaisen hinnan pitää löytyä tekstistä. Yksi päivitys kuluttaa 4 Tavily-hakua.
7. Gemini-mallit kokeillaan kevyistä (Flash-Lite, suurempi ilmainen päiväraja) raskaampiin. Tarkat rajasi näet osoitteessa aistudio.google.com/rate-limit.
8. Groqilla ja OpenRouterilla tehdyissä resepteissä ei ole lähdelinkkejä.

## Paikallinen ajo
- `vercel dev` (lukee `.env.local`:n), tai
- `node dev-server.js` → http://localhost:3000 (lukee myös `.env.local`:n; `MOCK_GEMINI=1` = testivastaukset ilman avainta)

## Ruokasuunnittelu
- Haku: kuva pakataan (max 1024 px, JPEG 0,7) → raaka-aineet → 3 reseptiä skaalattuna `diners × (2 jos syödään kahdesti)`.
- ⭐ Suosikit ja 📅 viikon ruokalista tallentuvat Firebaseen (näkyvät koko perheelle).
- 📤 Jaa: avaa puhelimen jakovalikon tai WhatsAppin reseptillä ja ostettavilla.
