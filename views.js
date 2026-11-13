// Corsia – näkymät. Käyttää app.js:n tilaa (appState) ja apufunktioita (esc, CATEGORY_THEMES, STORE_LAYOUTS...).

function renderStoreLogo(key) {
  if (key === "prisma_jumbo") {
    return `
      <div style="background: #ffffff; width:100%; height:100%; display:flex; align-items:center; justify-content:center; border: 1px solid #e0e0e0; border-radius: 4px; box-sizing: border-box;">
        <svg width="60" height="20" viewBox="0 0 170 38" xmlns="http://www.w3.org/2000/svg">
          <polygon points="19,4 6,28 32,28" fill="#e0006c"/>
          <polygon points="6,28 0,36 12,36" fill="#f37021"/>
          <polygon points="32,28 20,36 43,36" fill="#ffc20e"/>
          <text x="47" y="29" font-family="-apple-system, BlinkMacSystemFont, Arial Black, sans-serif" font-weight="900" font-size="28" fill="#007934" letter-spacing="-0.5">PRISMA</text>
        </svg>
      </div>
    `;
  }
  if (key === "cm_jumbo" || key === "cm_tammisto") {
    return `<div style="background: #ff5500; color: white; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; border-radius: 4px; font-weight: 900; font-family: Arial, sans-serif;"><span style="font-size: 1.1rem; margin-right: 2px;">K</span><span style="font-size: 0.5rem; line-height: 1;">CITYMARKET</span></div>`;
  }
  if (key === "ikea") {
    return `<div style="background:#0051ba; width:100%; height:100%; display:flex; align-items:center; justify-content:center; border-radius:4px;">
      <div style="background:#ffda1a; border-radius:50%; width:90%; height:80%; display:flex; align-items:center; justify-content:center;">
         <span style="color:#0051ba; font-family:Arial, Helvetica, sans-serif; font-weight:900; font-size:0.8rem; letter-spacing:0.5px;">IKEA</span>
      </div>
    </div>`;
  }
  if (key === "rautakauppa") return `<span style="font-size:1.3rem;">🔧</span>`;
  if (key === "apteekki") return `<span style="font-size:1.3rem;">💊</span>`;
  return `<span style="font-size:1.1rem;">🛒</span>`;
}

function renderHome() {
  const activeItems = appState.items.filter(i => i.active && !i.done);
  const totalActive = activeItems.length;

  let html = `
    <div class="hero-banner">
      <div class="hero-top-row">
        <div class="brand-logo-wrap" onclick="navigate('home')">
          <div class="brand-c-icon">
            <svg class="brand-c-svg" viewBox="0 0 100 100">
              <path d="M 68 25 C 38 25 28 42 28 50 C 28 58 38 75 68 75" fill="none" stroke="#16a34a" stroke-width="14" stroke-linecap="round"/>
              <circle cx="65" cy="25" r="7" fill="#16a34a"/>
            </svg>
          </div>
          <span class="brand-text">orsia</span>
        </div>
        <div class="status-badges-group">
          <div class="status-pill" onclick="openDiagnostics()">
            <div class="status-dot"></div>
            <span>PERHE PILVI</span>
          </div>
          <div class="status-pill" onclick="openDiagnostics()">
            <span>⚙️ AI OK</span>
          </div>
        </div>
      </div>
      <div class="hero-headline">Ostoslista</div>
      <div class="hero-counter-tag">
        <span>Ostettavaa listalla:</span>
        <span class="hero-counter-val">${totalActive} kpl</span>
        <button class="hero-foodplan-btn" onclick="navigate('foodplan')">🍳 Ruokasuunnittelu</button>
      </div>
    </div>

    <div class="main-content">
      <div class="soffa-hero-card" onclick="navigate('soffa')">
        <div class="soffa-icon-box">🛋️</div>
        <div class="soffa-text-info">
          <div class="soffa-title">Kotisohva (Muokkaa listaa)</div>
          <div class="soffa-desc">Valitse tuotteet, syötä määrät tai sanele puheella</div>
        </div>
        <div class="soffa-arrow-btn">›</div>
      </div>

      <div class="subtle-actions-group">
        <div class="wa-subtle-btn" onclick="openWaModal()">
          <span>💬 Tuo WhatsAppista</span>
        </div>
        <div class="camera-subtle-btn" onclick="triggerCameraInput()" title="Kuvaa kuitti tai kauppalappu">
          📷
        </div>
        <div class="camera-subtle-btn" onclick="startVoiceRecognition()" title="Puhesanelu">
          🎙️
        </div>
      </div>

      <div class="section-headline">Kauppareitit (Optimoitu hyllyjärjestys)</div>
      <div class="store-list-wrap">
  `;

  const stores = [
    { key: "prisma_jumbo", name: "Prisma Jumbo", sub: "Vantaa Jumbo • Optimoitu kierto" },
    { key: "cm_tammisto", name: "K-Citymarket Tammisto", sub: "Tammiston kauppakeskus" },
    { key: "cm_jumbo", name: "K-Citymarket Jumbo", sub: "Jumbo kauppakeskus" },
    { key: "ikea", name: "IKEA Vantaa", sub: "Huonekalut & sisustus" },
    { key: "rautakauppa", name: "Rautakauppa (K-Rauta / Bauhaus)", sub: "Työkalut & rakentaminen" },
    { key: "apteekki", name: "Apteekki", sub: "Lääkkeet & terveys" }
  ];

  stores.forEach(s => {
    const layout = STORE_LAYOUTS[s.key] || [];
    const inThisStore = activeItems.filter(i => layout.includes(i.cat)).length;
    html += `
      <div class="store-card" onclick="navigate('store', '${s.key}')">
        <div class="store-logo-box">
          ${renderStoreLogo(s.key)}
        </div>
        <div class="store-card-info">
          <div class="store-card-name">${s.name}</div>
          <div class="store-card-sub">${inThisStore > 0 ? `<strong>${inThisStore} tuotetta</strong> listalta` : s.sub}</div>
        </div>
        <div class="store-card-chevron">›</div>
      </div>
    `;
  });

  html += `
      </div>

      <div class="deals-bottom-card" onclick="navigate('deals')">
        <div class="deals-flame-icon">🔥</div>
        <div class="deals-info-box">
          <div class="deals-headline">Päivän Tärpit (Tammisto & Jumbo)</div>
          <div class="deals-subline">${esc(appState.dealsUpdatedAt)} • Norjan lohi, lihat & autopesu</div>
        </div>
        <div class="soffa-arrow-btn" style="color: #ea580c;">›</div>
      </div>
    </div>
  `;

  return html;
}

function renderSoffa() {
  const activeCount = appState.items.filter(i => i.active && !i.done).length;
  const categories = Object.keys(CATEGORY_THEMES);
  const catOptionsHtml = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

  let html = `
    <div class="main-content" style="padding-top: 14px;">

      <div style="padding: 0 0 14px;">
        <input type="text" id="soffa-search-input" placeholder="🔍 Hae tuotteita..." style="width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); font-size: 0.9rem; font-family: inherit; outline: none; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);" oninput="filterSoffaItems(this.value)">
      </div>

      <div class="add-widget-card">
        <div class="add-widget-header">
          <span class="add-widget-title">Lisää uusi tuote ostoslistaan</span>
          <span class="badge-quickadd">Pikalisäys</span>
        </div>
        <div class="soffa-input-row">
          <input type="text" id="soffa-add-name" class="soffa-input-name" placeholder="Tuotteen nimi (esim. Kauramaito)">
          <input type="number" id="soffa-add-qty" class="soffa-input-qty" placeholder="1 kpl">
          <button class="soffa-icon-btn" onclick="startVoiceRecognition()" title="Sanele puheella">🎙️</button>
          <button class="soffa-icon-btn" onclick="triggerCameraInput()" title="Kuvaa tuote tai lappu">📷</button>
        </div>
        <select id="soffa-add-cat" class="soffa-category-select">
          ${catOptionsHtml}
        </select>
        <button class="btn-submit-add" onclick="addNewProductFromInput()">+ Lisää kauppalappuun</button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin: 0 4px 8px;">
        <div class="section-headline" style="margin: 0;">TUOTERYHMÄT & OSASTOT</div>
        <div style="font-size: 0.72rem; font-weight: 700; color: #16a34a;">${activeCount} valittu listalle</div>
      </div>
      <div style="display: flex; flex-direction: column;">
  `;

  categories.forEach(cat => {
    const theme = CATEGORY_THEMES[cat] || { bg: "#f8fafc", border: "#e2e8f0", text: "#334155", icon: "📦" };
    const itemsInCat = appState.items.filter(i => i.cat === cat);
    const activeInCat = itemsInCat.filter(i => i.active && !i.done).length;
    const isOpen = !!openCategories[cat];
    const safeCat = cat.replace(/'/g, "\\'");

    // Tuotteet aakkosjärjestykseen (suomalaiset aakkoset)
    const sortedItems = [...itemsInCat].sort((a, b) => a.name.localeCompare(b.name, "fi"));

    let itemsTrayHtml = "";
    if (sortedItems.length === 0) {
      itemsTrayHtml = `<div style="font-size: 0.78rem; color: #94a3b8; padding: 6px 4px;">Ei vakiotuotteita tässä osastossa</div>`;
    } else {
      itemsTrayHtml = sortedItems.map(item => {
        const originalIdx = appState.items.indexOf(item);
        const isChecked = item.active && !item.done;
        return `
          <div class="product-row-item ${isChecked ? "is-active" : ""}" data-name="${esc(item.name)}" onclick="toggleItem(${originalIdx})">
            <div class="row-item-left">
              <span class="item-symbol-tag">${isChecked ? "🟢" : "⚪"}</span>
              <span class="item-name-text" style="${isChecked ? "font-weight: 800; color: #166534;" : ""}">${esc(item.name)}</span>
            </div>
            <div class="row-item-actions" onclick="event.stopPropagation()">
              ${isChecked ? `
                <button class="qty-bubble-btn" onclick="promptChangeQty(${originalIdx})">${item.qty ? item.qty + " kpl" : "1 kpl"}</button>
              ` : ""}
              <button class="btn-trash-item" onclick="removeItem(${originalIdx})" title="Poista listalta">🗑️</button>
              <div class="checkbox-pill ${isChecked ? "checked" : ""}" onclick="toggleItem(${originalIdx})">
                ${isChecked ? "✓" : ""}
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    html += `
      <div class="cat-folder-card" data-cat="${esc(cat)}" style="background: ${theme.bg}; border-color: ${theme.border}; display: block;">
        <div class="cat-folder-header" onclick="toggleFolder('${safeCat}')">
          <div class="cat-header-left">
            <div class="cat-icon-badge">${theme.icon}</div>
            <div class="cat-header-title" style="color: ${theme.text};">${esc(cat.toUpperCase())}</div>
          </div>
          <div class="cat-header-right">
            <div class="badge-cat-count" style="color: ${activeInCat > 0 ? "#15803d" : "#64748b"};">
              ${activeInCat > 0 ? `<strong>${activeInCat} VALITTU</strong>` : "0 VALITTU"}
            </div>
            <div id="chevron-${esc(cat)}" class="cat-chevron-btn ${isOpen ? "open" : ""}">›</div>
          </div>
        </div>
        <div id="tray-${esc(cat)}" class="cat-items-tray" style="display: ${isOpen ? "flex" : "none"};">
          ${itemsTrayHtml}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

// Reitin muokkaustila: kategoriakortit raahattavina (kahva ≡) tai ▲▼-painikkeilla. Tuotteisiin ei kosketa.
function renderRouteEditor(storeKey, storeName) {
  const order = routeEdit.order;
  const cards = order.map((dept, i) => {
    const theme = CATEGORY_THEMES[dept] || { bg: "#f8fafc", border: "#cbd5e1", text: "#334155", icon: "📦" };
    const active = appState.items.filter(it => it.active && !it.done && it.cat === dept).length;
    const done = appState.items.filter(it => it.active && it.done && it.cat === dept).length;
    const info = active || done ? `${active} kerättävää${done ? ` · ${done} kerätty` : ""}` : "ei tuotteita listalla";
    return `
      <div class="route-card" data-cat="${esc(dept)}" style="background: ${theme.bg || "#ffffff"}; border-color: ${theme.border || "#cbd5e1"};">
        <button class="route-handle" aria-label="Siirrä kategoria ${esc(dept)} (nuoli ylös tai alas)" title="Raahaa tai käytä nuolinäppäimiä" onkeydown="routeHandleKey(event)">≡</button>
        <span class="route-num">${i + 1}</span>
        <span class="route-icon">${theme.icon || "📦"}</span>
        <div class="route-info">
          <div class="route-name" style="color: ${theme.text || "#166534"};">${esc(dept)}</div>
          <div class="route-count ${active ? "route-count-on" : ""}">${info}</div>
        </div>
        <div class="route-arrows">
          <button aria-label="Ylös" onclick="moveRouteCat(this, -1)">▲</button>
          <button aria-label="Alas" onclick="moveRouteCat(this, 1)">▼</button>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="main-content" style="padding-top: 0;">
      <div class="route-edit-bar">
        <div class="route-edit-title">⚙️ Muokkaa reittiä · ${esc(storeName)}</div>
        <div class="route-edit-hint">Vedä kategoriaa kahvasta ≡ uuteen kohtaan tai käytä ▲▼. Ylin kategoria käydään ensin.</div>
        <div class="route-edit-actions">
          <button class="route-btn route-btn-cancel" onclick="cancelRouteEdit()">Peruuta</button>
          <button class="route-btn route-btn-save" onclick="saveRouteEdit()">✓ Valmis</button>
        </div>
      </div>
      <div id="route-list" class="route-list">${cards}</div>
      <button class="route-reset-btn" onclick="resetStoreRoute()">↺ Palauta oletusreitti</button>
    </div>`;
}

function renderStore(storeKey) {
  const storeName = STORE_NAMES[storeKey] || "Kauppareitti";
  if (routeEdit && routeEdit.storeKey === storeKey) return renderRouteEditor(storeKey, storeName);
  const layout = getStoreLayout(storeKey);   // tallennettu oma reitti tai STORE_LAYOUTS-oletus
  const audioTop = audioMode && audioMode.storeKey === storeKey ? audioQueue(storeKey)[0] : null;   // Ääniohjauksen "seuraava"

  const activeInStore = appState.items.filter(i => i.active && !i.done && layout.includes(i.cat));
  const doneInStore = appState.items.filter(i => i.active && i.done && layout.includes(i.cat));
  const activeOutStore = appState.items.filter(i => i.active && !i.done && !layout.includes(i.cat));
  const doneOutStore = appState.items.filter(i => i.active && i.done && !layout.includes(i.cat));

  let itemsHtml = "";

  if (activeInStore.length + doneInStore.length + activeOutStore.length + doneOutStore.length === 0) {
    itemsHtml = `
      <div style="text-align: center; padding: 40px 16px; color: #64748b;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🛒</div>
        <div style="font-size: 0.94rem; font-weight: 800; color: #1e293b;">Ostoskori on tyhjä tälle kaupalle</div>
        <div style="font-size: 0.78rem; margin-top: 4px;">Valitse tuotteita Kotisohvalta tai sanele puheella!</div>
        <button onclick="navigate('soffa')" style="margin-top: 14px; padding: 8px 16px; border-radius: 9px; background: #16a34a; color: white; border: none; font-weight: 800; font-size: 0.82rem; cursor: pointer;">Siirry Kotisohvalle ›</button>
      </div>
    `;
  } else {
    layout.forEach(dept => {
      const deptActive = activeInStore.filter(i => i.cat === dept);
      if (deptActive.length === 0) return;
      const theme = CATEGORY_THEMES[dept] || { text: "#166534", icon: "📦" };
      itemsHtml += `
        <div style="margin: 12px 0 6px 4px; font-size: 0.76rem; font-weight: 800; color: ${theme.text}; display: flex; align-items: center; gap: 6px;">
          <span>${theme.icon}</span>
          <span>${esc(dept.toUpperCase())}</span>
        </div>
      `;
      deptActive.forEach(item => {
        const originalIdx = appState.items.indexOf(item);
        itemsHtml += `
          <div class="store-collect-item ${audioTop === item ? "audio-top-item" : ""}" onclick="markItemDone(${originalIdx})">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">${esc(item.name)}${audioItemTag(item)}</div>
              <div style="font-size: 0.74rem; color: #64748b;">Määrä: <strong>${item.qty ? item.qty + " kpl" : "1 kpl"}</strong></div>
            </div>
            <button class="btn-mark-done">Ruksaa valmiiksi ✓</button>
          </div>
        `;
      });
    });

    if (activeOutStore.length > 0) {
      itemsHtml += `
        <div style="margin: 16px 0 6px 4px; font-size: 0.76rem; font-weight: 800; color: #b45309; display: flex; align-items: center; gap: 6px;">
          <span>⚠️</span>
          <span>MUUT OSASTOT</span>
        </div>
      `;
      activeOutStore.forEach(item => {
        const originalIdx = appState.items.indexOf(item);
        itemsHtml += `
          <div class="store-collect-item" style="border-color: #fcd34d;" onclick="markItemDone(${originalIdx})">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">${esc(item.name)}${audioItemTag(item)}</div>
              <div style="font-size: 0.74rem; color: #64748b;">Osasto: ${esc(item.cat)} • <strong>${item.qty ? item.qty + " kpl" : "1 kpl"}</strong></div>
            </div>
            <button class="btn-mark-done">Ruksaa valmiiksi ✓</button>
          </div>
        `;
      });
    }

    const totalDone = doneInStore.length + doneOutStore.length;
    if (totalDone > 0) {
      itemsHtml += `
        <div style="margin: 22px 0 8px 4px; font-size: 0.74rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
          KERÄTYT TUOTTEET (${totalDone} kpl)
        </div>
      `;
      [...doneInStore, ...doneOutStore].forEach(item => {
        const originalIdx = appState.items.indexOf(item);
        itemsHtml += `
          <div class="store-collect-item" style="opacity: 0.55; background: #f8fafc;" onclick="toggleItem(${originalIdx})">
            <div style="flex: 1; min-width: 0; text-decoration: line-through; color: #64748b; font-size: 0.88rem; font-weight: 600;">
              ${esc(item.name)}
            </div>
            <span style="font-size: 0.72rem; color: #16a34a; font-weight: 800;">✓ Kerätty</span>
          </div>
        `;
      });
    }
  }

  return `
    <div class="main-content" style="padding-top: 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 10px 12px;">
        <div>
          <div style="font-size: 0.96rem; font-weight: 800; color: #166534;">${esc(storeName)}</div>
          <div style="font-size: 0.72rem; color: #15803d;">Kerättävää jäljellä: <strong>${activeInStore.length + activeOutStore.length} tuotetta</strong></div>
          <div class="store-tools">
            ${layout.length > 1 ? `<button class="route-edit-btn" onclick="startRouteEdit('${storeKey}')">⚙️ Muokkaa reittiä${hasCustomLayout(storeKey) ? " · oma" : ""}</button>` : ""}
            ${renderAudioButton(storeKey)}
          </div>
        </div>
        <div style="width: 70px; height: 28px;">${renderStoreLogo(storeKey)}</div>
      </div>
      ${audioMode && audioMode.storeKey === storeKey ? renderAudioPanel(storeKey) : ""}
      <div>${itemsHtml}</div>
    </div>
  `;
}

function renderDeals() {
  // Ryhmitellään tarjoukset kaupoittain, kauppojen alkuperäinen järjestys säilyy.
  const groups = {};
  const storeOrder = [];
  appState.deals.forEach(d => {
    const store = d.store || "Muut tarjoukset";
    if (!groups[store]) { groups[store] = []; storeOrder.push(store); }
    groups[store].push(d);
  });

  let dealsListHtml = "";
  storeOrder.forEach(store => {
    dealsListHtml += `<div class="deals-store-header">🏪 ${esc(store)}</div>`;
    dealsListHtml += groups[store].map(deal => {
      const isPicked = appState.items.some(i => i.name.toLowerCase() === deal.name.toLowerCase() && i.active && !i.done);
      return `
        <div class="live-deal-card">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b; margin: 1px 0;">${esc(deal.name)}</div>
            <div style="font-size: 0.78rem; font-weight: 700; color: #16a34a;">${esc(deal.price)}</div>
          </div>
          <button class="btn-pick-deal ${isPicked ? "picked" : ""}" onclick="toggleDealPicked('${esc(deal.id)}')">
            ${isPicked ? "✓ Listalla" : "+ Ota listalle"}
          </button>
        </div>
      `;
    }).join("");
  });

  return `
    <div class="main-content" style="padding-top: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #c2410c;">🔥 Päivän Tärpit</div>
          <div style="font-size: 0.72rem; color: #64748b;">${esc(appState.dealsUpdatedAt)}</div>
        </div>
        <button id="btn-refresh-deals" onclick="refreshDealsWithGemini()" style="padding: 7px 12px; border-radius: 9px; background: #ea580c; color: white; border: none; font-size: 0.78rem; font-weight: 800; cursor: pointer;">
          🔄 Hae tuoreet
        </button>
      </div>
      <div>${dealsListHtml}</div>
    </div>
  `;
}

// Välilehdet: Reseptihaku | Viikko | Suosikit
function renderFoodPlanTabs() {
  const plannedDays = WEEK_DAYS.filter(d => appState.weekPlan[d]).length;
  const tabs = [
    ["search", "🔍 Haku", ""],
    ["week", "📅 Viikko", plannedDays ? ` (${plannedDays})` : ""],
    ["favorites", "⭐ Suosikit", appState.favorites.length ? ` (${appState.favorites.length})` : ""]
  ];
  return `<div class="fp-tabs" role="tablist">${tabs.map(([k, label, n]) =>
    `<button id="fp-tab-${k}" role="tab" aria-selected="${foodPlan.tab === k}" class="fp-tab ${foodPlan.tab === k ? "fp-tab-on" : ""}" onclick="setFoodPlanTab('${k}')">${label}${n}</button>`
  ).join("")}</div>`;
}

// Yksi reseptikortti. source: "result" (hakutulos) tai "fav" (suosikki).
function renderRecipeCard(r, idx, source, effective) {
  const ings = recipeIngredients(r);
  const buyCount = missingIngredients(r).length;                    // "Lisää kauppalapulle" -tilassa olevat
  const key = `${source}-${idx}`;
  const confirmed = !!foodPlan.addConfirm[key];
  const fav = isFavoriteRecipe(r);
  // Aineskohtainen kytkin: päällä = ostetaan (🛒), pois = löytyy kotoa (🟢). Pohjana tekoälyn in_fridge-arvio.
  const ingRows = ings.map((i, n) => {
    const buy = !effectiveInFridge(r, i);
    const deal = buy ? dealForIngredient(i.name) : null;
    const amount = esc(i.amount_needed || i.amount || "");
    const id = `ing-${source}-${idx}-${n}`;
    return `
      <label class="fp-ing ${buy ? "fp-ing-buy" : "fp-ing-have"}" for="${id}">
        <input type="checkbox" class="fp-ing-input" id="${id}" ${buy ? "checked" : ""} onchange="toggleIngredientBuy('${source}', ${idx}, ${n})">
        <span class="fp-switch" aria-hidden="true"></span>
        <span class="fp-ing-main">
          <span class="fp-ing-name">${esc(i.name)}</span>
          <span class="fp-ing-state">${buy ? "🛒 Lisää kauppalapulle" : "🟢 Löytyy jo kotoa"}${amount ? ` · ${amount}` : ""}</span>
        </span>
      </label>
      ${deal ? `<div class="fp-deal-badge" style="margin: -2px 0 6px 4px;">🔥 Tarjous: ${esc(deal.name)} – ${esc(deal.price)}${deal.store ? ` · ${esc(deal.store)}` : ""}</div>` : ""}`;
  }).join("");
  const ingHeader = ings.length ? `
      <div class="fp-ing-head">
        <span>RAAKA-AINEET · kytkin = ostetaan</span>
        <span class="fp-ing-bulk">
          <button onclick="setAllIngredients('${source}', ${idx}, false)">🟢 Kaikki kotona</button>
          <button onclick="setAllIngredients('${source}', ${idx}, true)">🛒 Kaikki ostoon</button>
        </span>
      </div>` : "";
  const servingsHtml = source === "fav" ? `
      <div class="fp-servings" id="fav-servings-${idx}">
        <span style="font-size: 0.76rem; font-weight: 800; color: #1e293b;">🍽️ Annoksia</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="fp-icon-btn" aria-label="Vähennä annoksia" onclick="setFavoriteServings(${idx}, -1)">−</button>
          <span id="fav-servings-value-${idx}" style="font-weight: 800; min-width: 22px; text-align: center; color: #0f172a;">${esc(String(r.target_servings || ""))}</span>
          <button class="fp-icon-btn" aria-label="Lisää annoksia" onclick="setFavoriteServings(${idx}, 1)">+</button>
        </div>
      </div>` : "";
  const dayChips = WEEK_DAYS.map(d => {
    const on = sameRecipe(appState.weekPlan[d], r);
    return `<button class="fp-day ${on ? "fp-day-on" : ""}" title="${WEEK_DAY_NAMES[d]}" onclick="assignRecipeToDay('${source}', ${idx}, '${d}')">${d}</button>`;
  }).join("");
  return `
    <div class="recipe-card" id="recipe-${source}-${idx}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">${esc(r.recipe_title)}</div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="fp-icon-btn" aria-label="Jaa resepti" onclick="shareRecipe('${source}', ${idx})">📤</button>
          <button class="fp-icon-btn ${fav ? "fp-icon-on" : ""}" aria-label="${fav ? "Poista suosikeista" : "Tallenna suosikiksi"}" onclick="toggleFavoriteRecipe('${source}', ${idx})">${fav ? "⭐" : "☆"}</button>
        </div>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; align-items: center;">
        <span style="background: #ffedd5; color: #9a3412; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${esc(r.cuisine || "Resepti")}</span>
        ${r.is_vegetarian ? `<span class="fp-vege-badge">🥦 Kasvis</span>` : ""}
        ${r.total_time_minutes ? `<span class="fp-time-badge">⏱️ ${r.total_time_minutes} min</span>` : ""}
        <span style="font-size: 0.7rem; color: #64748b; font-weight: 700;">🍽️ ${esc(String(r.target_servings || effective))} annosta${r.original_servings ? ` (alkup. ${esc(String(r.original_servings))})` : ""}</span>
        ${r.source_url ? `<a href="${esc(r.source_url)}" target="_blank" rel="noopener" style="font-size: 0.7rem; color: #0284c7; font-weight: 700;">🔗 Reseptin lähde</a>` : ""}
      </div>
      ${r.instructions_brief ? `<div style="font-size: 0.76rem; color: #475569; margin: 8px 0 2px; line-height: 1.45;">${esc(r.instructions_brief)}</div>` : ""}
      ${r.vege_note ? `<div class="fp-vege-note">🥦 <strong>Kasvissyöjälle:</strong> ${esc(r.vege_note)}</div>` : ""}
      ${servingsHtml}
      ${ingHeader}
      <div class="fp-ing-list">${ingRows}</div>
      ${renderSideDishes(r, idx, source)}
      <div style="margin-top: 8px; font-size: 0.7rem; font-weight: 800; color: #64748b;">📅 LISÄÄ VIIKOLLE ${weekNumberOf(activeWeekKey())} (${formatWeekRange(activeWeekKey())})</div>
      <div class="fp-days">${dayChips}</div>
      <button class="fp-add-btn ${confirmed ? "fp-add-btn-done" : buyCount === 0 ? "fp-add-btn-off" : ""}" id="add-btn-${source}-${idx}" onclick="addSelectedToShoppingList('${source}', ${idx})" ${confirmed || buyCount === 0 ? "disabled" : ""}>
        ${confirmed ? "✓ Lisätty ostoslistalle!" : buyCount === 0 ? "✓ Kaikki ainekset löytyvät kotoa" : `🛒 Lisää tarvittavat ostoslistalle (${buyCount} kpl)`}
      </button>
      <button class="fp-cook-btn" onclick="openCookingMode('${source}', ${idx})">📖 Katso tarkka ohje</button>
    </div>
  `;
}

// ---------- Kokkaustila (koko ruudun näkymä) ----------
function formatCookDuration(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const pad = n => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

// "4 min", "1 min 30 s", "45 s", "1 h 10 min"
function formatCookDurationWords(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s} s`;
  if (s < 3600) return s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)} min ${s % 60} s`;
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Ajastinpainikkeen teksti ja luokka tilan mukaan (päivitetään tikissä ilman koko näkymän piirtoa).
function cookTimerState(c, stepNo, seconds) {
  const t = c.timers[stepNo];
  if (!t) return { cls: "", label: `⏱️ Käynnistä ajastin ${formatCookDurationWords(seconds)}` };
  if (t.done) return { cls: "cook-timer-done", label: "✅ Aika täynnä! (Nollaa)" };
  const left = Math.ceil((t.endAt - Date.now()) / 1000);
  return { cls: "cook-timer-run", label: `⏳ ${formatCookDuration(left)} · Pysäytä` };
}

function cookSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}
const cookDoneLabel = done => done ? "✅ Tehty" : "☐ Tehty";
const cookSpeakLabel = speaking => speaking ? "⏹️ Pysäytä" : "🔊 Lue ääneen";

// Edistymispalkki: id on aina mukana, jotta app.js voi päivittää sen kesken kokkaamisen.
function renderCookProgress(c) {
  const steps = c.data?.steps || [];
  if (steps.length === 0) return `<div id="cook-progress"></div>`;
  const n = steps.filter(st => c.done[st.step_number]).length;
  const all = n === steps.length;
  return `<div id="cook-progress" class="cook-progress ${all ? "cook-progress-all" : ""}">
    <div class="cook-progress-row">
      <div class="cook-progress-text">${all ? "🎉 Kaikki vaiheet tehty!" : `${n} / ${steps.length} vaihetta tehty`}</div>
      ${n > 0 ? `<button class="cook-reset-btn" onclick="resetCookProgress()">↺ Nollaa</button>` : ""}
    </div>
    <div class="cook-progress-bar"><div class="cook-progress-fill" style="width:${Math.round(n / steps.length * 100)}%"></div></div>
  </div>`;
}

function renderCookWakeBadge(c) {
  if (c.wakeActive) return `<span id="cook-wake-badge" class="cook-badge cook-badge-on">💡 Näyttö pidetään päällä</span>`;
  const msg = c.wakeSupported ? "⚠️ Näyttöä ei voitu pitää päällä" : "⚠️ Selain ei tue näytön pitämistä päällä";
  return `<span id="cook-wake-badge" class="cook-badge cook-badge-off">${msg}</span>`;
}

function renderCookingMode(c) {
  const r = c.recipe, d = c.data;
  const ings = (Array.isArray(r.ingredients) ? r.ingredients : []).filter(i => i && i.name);
  let body = "";

  if (c.loading) {
    body = `<div class="cook-state"><div class="fp-spinner" style="width:26px;height:26px;border-width:3px;"></div>
      <div style="font-weight:800; margin-top:12px;">👨‍🍳 Kirjoitetaan tarkkaa ohjetta...</div>
      <div style="font-size:0.78rem; color:#64748b; margin-top:4px;">Näyttö pysyy päällä.</div></div>`;
  } else if (c.error) {
    body = `<div class="cook-state"><div style="font-weight:800; color:#b91c1c; margin-bottom:10px;">⚠️ ${esc(c.error)}</div>
      <button class="cook-retry-btn" onclick="retryCookingDetail()">↻ Yritä uudelleen</button></div>`;
  } else if (d) {
    const meta = [
      d.prep_time ? `<span class="cook-chip">🔪 Valmistus ${esc(d.prep_time)}</span>` : "",
      d.cook_time ? `<span class="cook-chip">🔥 Kypsennys ${esc(d.cook_time)}</span>` : ""
    ].join("");
    const equip = (d.equipment_needed || []).map(e => `<span class="cook-chip cook-chip-equip">🍳 ${esc(e)}</span>`).join("");
    const ingRows = ings.map(i => `<div class="cook-ing-row"><span>${esc(i.name)}</span><span>${esc(i.amount_needed || i.amount || "")}</span></div>`).join("");
    const steps = (d.steps || []).map(st => {
      const timer = st.timer_seconds ? (() => {
        const ts = cookTimerState(c, st.step_number, st.timer_seconds);
        return `<button class="cook-timer-btn ${ts.cls}" id="cook-timer-${st.step_number}" onclick="event.stopPropagation(); toggleCookTimer(${st.step_number})">${ts.label}</button>`;
      })() : "";
      const done = !!c.done[st.step_number];
      const speakBtn = cookSpeechSupported() ? `<button class="cook-act-btn" id="cook-speak-${st.step_number}" onclick="speakCookStep(${st.step_number})">${cookSpeakLabel(c.speakingStep === st.step_number)}</button>` : "";
      return `
        <div class="cook-step ${done ? "cook-step-checked" : ""}" id="cook-step-${st.step_number}">
          <div class="cook-step-head"><div class="cook-step-num">${done ? "✓" : st.step_number}</div><div class="cook-step-title">${esc(st.title)}</div></div>
          <div class="cook-step-text">${esc(st.instruction)}</div>
          ${timer}
          <div class="cook-actions">
            <button class="cook-act-btn ${done ? "cook-act-done" : ""}" id="cook-check-${st.step_number}" aria-pressed="${done}" onclick="toggleCookStepDone(${st.step_number})">${cookDoneLabel(done)}</button>
            ${speakBtn}
          </div>
        </div>`;
    }).join("");
    body = `
      <div class="cook-meta">${meta}</div>
      ${r.vege_note ? `<div class="fp-vege-note" style="margin: 0 0 10px;">🥦 <strong>Kasvissyöjälle:</strong> ${esc(r.vege_note)}</div>` : ""}
      ${equip ? `<div class="cook-section-label">VÄLINEET</div><div class="cook-meta">${equip}</div>` : ""}
      ${ingRows ? `<details class="cook-ings"><summary>🧺 Ainekset (${ings.length} kpl)</summary>${ingRows}</details>` : ""}
      <div class="cook-section-label">VAIHEET</div>
      ${steps}
      ${d.pro_tips ? `<div class="cook-tip"><div style="font-weight:800; margin-bottom:3px;">💡 Vinkki</div>${esc(d.pro_tips)}</div>` : ""}`;
  }

  return `
    <div class="cook-top">
      ${renderCookWakeBadge(c)}
      <div class="cook-title">${esc(r.recipe_title)}</div>
      <div class="cook-sub">🍽️ ${esc(String(r.target_servings || ""))} annosta</div>
      ${renderCookProgress(c)}
    </div>
    <div class="cook-scroll">${body}</div>
    <div class="cook-footer"><button class="cook-done-btn" onclick="closeCookingMode()">✓ Sulje / Valmis</button></div>
  `;
}

// Viikon ruokalista: päivät, poisto ja koko viikon yhdistetty ostoslista.
// Viikkolistan rivin merkintä: ✓ Tehty tai "n/m vaihetta" (tieto tulee tämän laitteen tallennuksesta)
function weekCookBadge(r) {
  const p = typeof cookProgressFor === "function" ? cookProgressFor(r) : null;
  if (!p) return "";
  return p.n === p.total
    ? ` · <span class="fp-cook-done">✓ Tehty</span>`
    : ` · <span class="fp-cook-prog">🍳 ${p.n}/${p.total} vaihetta</span>`;
}

// Viikkovalitsin: nuolet, viikkonumero + päivämäärät ja pikavalinta kuluvalle + 5 seuraavalle viikolle
// ---------- Reseptikohtainen raaka-ainetarkistus: kytkimet ja valikoiva lisäys ostoslistalle ----------
// Piirtää vain yhden reseptikortin uudelleen (vierityspaikka ja muut kortit säilyvät).
function refreshRecipeCard(source, idx, focusId) {
  const r = getRecipe(source, idx);
  const el = document.getElementById(`recipe-${source}-${idx}`);
  if (!r || !el) { render(); return; }
  const tmp = document.createElement("div");
  tmp.innerHTML = renderRecipeCard(r, idx, source, r.target_servings);
  const fresh = tmp.firstElementChild;
  if (!fresh) { render(); return; }
  el.replaceWith(fresh);
  if (focusId) { const f = document.getElementById(focusId); if (f && f.focus) f.focus({ preventScroll: true }); }
}

// Yhden aineksen tila: ostetaan <-> löytyy kotoa (vain tämä valinta; tekoälyn alkuperäinen arvio säilyy reseptissä)
window.toggleIngredientBuy = function(source, idx, n) {
  const r = getRecipe(source, idx);
  const ing = r && recipeIngredients(r)[n];
  if (!ing) return;
  foodPlan.ingChoice[ingChoiceKey(r, ing)] = !effectiveInFridge(r, ing);   // arvo = "löytyy kotoa"; käännetään nykyinen tila
  delete foodPlan.addConfirm[`${source}-${idx}`];                                         // uusi valinta -> vahvistus pois
  refreshRecipeCard(source, idx, `ing-${source}-${idx}-${n}`);
};

// Kaikki ainekset kerralla: buy = true -> ostetaan, false -> kotona
window.setAllIngredients = function(source, idx, buy) {
  const r = getRecipe(source, idx);
  if (!r) return;
  recipeIngredients(r).forEach(i => { foodPlan.ingChoice[ingChoiceKey(r, i)] = !buy; });
  selectedSideDishes(r).forEach(sd => sideIngredients(sd).forEach(i => { foodPlan.ingChoice[sideIngKey(r, sd, i)] = !buy; }));
  delete foodPlan.addConfirm[`${source}-${idx}`];
  refreshRecipeCard(source, idx);
};

// 🛒 Lisää vain ostettaviksi valitut ainekset ostoslistalle (kategorioittain, ilman tuplia, synkronoituu pilveen)
window.addSelectedToShoppingList = async function(source, idx) {
  const r = getRecipe(source, idx);
  if (!r) return;
  const key = `${source}-${idx}`;
  if (foodPlan.addConfirm[key]) return;                  // vahvistus näkyy: tuplapainallus ei tee mitään
  const selected = missingIngredients(r);
  if (selected.length === 0) { showToast("Valitse ainakin yksi aines kauppalapulle", "info"); return; }
  const btn = document.getElementById(`add-btn-${source}-${idx}`);
  if (btn) btn.disabled = true;                           // estää kaksoisnapautuksen kesken tallennuksen
  const res = await addIngredientsToListDetailed(selected);
  foodPlan.addConfirm[key] = true;
  refreshRecipeCard(source, idx);                         // nappi: "✓ Lisätty ostoslistalle!"
  setTimeout(() => { delete foodPlan.addConfirm[key]; refreshRecipeCard(source, idx); }, 2500);
  return res;
};

// 🥗 Ehdotetut lisukkeet: valittavat chipit; valitun lisukkeen ainekset tulevat aineslistaan samoilla kytkimillä
function renderSideDishes(r, idx, source) {
  const sides = recipeSideDishes(r);
  if (sides.length === 0) return "";
  const chips = sides.map((sd, sn) => {
    const on = isSideSelected(r, sd);
    return `<button class="fp-side-chip ${on ? "fp-side-on" : ""}" aria-pressed="${on}" onclick="toggleSideDish('${source}', ${idx}, ${sn})">
      <span class="fp-side-mark">${on ? "✓" : "+"}</span>
      <span class="fp-side-name">${esc(sd.title)}</span>
      <span class="fp-side-count">${sideIngredients(sd).length} ainesta</span>
    </button>`;
  }).join("");
  const groups = sides.map((sd, sn) => {
    if (!isSideSelected(r, sd)) return "";
    const rows = sideIngredients(sd).map((i, n) => {
      const buy = !effectiveSideInFridge(r, sd, i);
      const deal = buy ? dealForIngredient(i.name) : null;
      const amount = esc(i.amount_needed || i.amount || "");
      const id = `ing-${source}-${idx}-s${sn}-${n}`;
      return `
        <label class="fp-ing ${buy ? "fp-ing-buy" : "fp-ing-have"}" for="${id}">
          <input type="checkbox" class="fp-ing-input" id="${id}" ${buy ? "checked" : ""} onchange="toggleSideIngredientBuy('${source}', ${idx}, ${sn}, ${n})">
          <span class="fp-switch" aria-hidden="true"></span>
          <span class="fp-ing-main">
            <span class="fp-ing-name">${esc(i.name)}</span>
            <span class="fp-ing-state">${buy ? "🛒 Lisää kauppalapulle" : "🟢 Löytyy jo kotoa"}${amount ? ` · ${amount}` : ""}</span>
          </span>
        </label>
        ${deal ? `<div class="fp-deal-badge" style="margin: -2px 0 6px 4px;">🔥 Tarjous: ${esc(deal.name)} – ${esc(deal.price)}${deal.store ? ` · ${esc(deal.store)}` : ""}</div>` : ""}`;
    }).join("");
    return `<div class="fp-side-group"><div class="fp-side-title">🥗 ${esc(sd.title)}</div>${rows}</div>`;
  }).join("");
  return `
    <div class="fp-sides" id="sides-${source}-${idx}">
      <div class="fp-sides-head">🥗 Ehdotetut lisukkeet <span>· napauta valitaksesi</span></div>
      <div class="fp-side-chips">${chips}</div>
      ${groups}
    </div>`;
}

window.toggleSideDish = function(source, idx, sn) {
  const r = getRecipe(source, idx);
  const sd = r && recipeSideDishes(r)[sn];
  if (!sd) return;
  const key = sideKeyOf(r, sd);
  if (foodPlan.sideChoice[key]) delete foodPlan.sideChoice[key]; else foodPlan.sideChoice[key] = true;
  delete foodPlan.addConfirm[`${source}-${idx}`];
  refreshRecipeCard(source, idx);
};

window.toggleSideIngredientBuy = function(source, idx, sn, n) {
  const r = getRecipe(source, idx);
  const sd = r && recipeSideDishes(r)[sn];
  const ing = sd && sideIngredients(sd)[n];
  if (!ing) return;
  foodPlan.ingChoice[sideIngKey(r, sd, ing)] = !effectiveSideInFridge(r, sd, ing);   // arvo = "löytyy kotoa"
  delete foodPlan.addConfirm[`${source}-${idx}`];
  refreshRecipeCard(source, idx, `ing-${source}-${idx}-s${sn}-${n}`);
};

// ⏱️ Tavoitevalmistusaika: yksi chip kerrallaan, uusi napautus poistaa valinnan (sama hakunäkymässä ja viikkonäkymässä)
function renderPrepTimeSelector() {
  const chips = PREP_TIME_OPTIONS.map(o => {
    const on = foodPlan.prepTime === o.v;
    return `<button class="fp-time-chip ${on ? "fp-time-on" : ""}" aria-pressed="${on}" onclick="setPrepTime('${o.v}')">${o.label}</button>`;
  }).join("");
  const hint = foodPlan.prepTime
    ? (foodPlan.prepTime === "over60min" ? "Reseptit saavat kestää yli tunnin (rauhallinen, työläämpi ruoka)." : "Reseptien kokonaisaika (valmistelu + kypsennys) pysyy tavoitteessa.")
    : "Ei rajaa: aikaa ei ole valittu.";
  return `
    <div class="fp-time" id="fp-time-${foodPlan.tab}">
      <div class="fp-time-label">⏱️ TAVOITEVALMISTUSAIKA</div>
      <div class="fp-time-chips" role="group" aria-label="Tavoitevalmistusaika">${chips}</div>
      <div class="fp-time-hint">${hint}</div>
    </div>`;
}

// Ruokavalinta (sama hakunäkymässä ja viikkonäkymässä): kaikki / vain kasvis / yksi kasvissyöjä
function renderDietSelector() {
  const opts = [["all", "🍖 Kaikki ruoat"], ["vege", "🥦 Vain kasvisruokaa"], ["mixed", "👥 Yksi kasvissyöjä"]];
  const hint = {
    all: "Tavalliset reseptit.",
    vege: "Kaikki reseptit ovat kasvisruokaa (ei lihaa eikä kalaa; kananmuna ja maitotuotteet sallittu), myös valituista keittiöistä.",
    mixed: "Reseptit voivat olla tavallisia, ja jokaisessa on vinkki kasvissyöjän annoksen tekoon. Osa ruoista on sellaisenaan kasvisruokaa."
  }[foodPlan.diet] || "";
  return `
    <div class="fp-diet" id="fp-diet-${foodPlan.tab}">
      <div class="fp-diet-label">RUOKAVALIO</div>
      <div class="fp-diet-chips">${opts.map(([v, l]) => `<button class="fp-diet-chip ${foodPlan.diet === v ? "fp-diet-on" : ""}" onclick="setFoodPlanDiet('${v}')">${l}</button>`).join("")}</div>
      <div class="fp-diet-hint">${hint}</div>
    </div>`;
}

function renderWeekNav() {
  const key = activeWeekKey(), cur = currentWeekKey();
  const keys = [...new Set([...Array.from({ length: 6 }, (_, i) => shiftWeekKey(cur, i)), key])].sort();
  const planned = k => { const p = appState.weekPlans[k]; return !!p && WEEK_DAYS.some(d => p[d]); };
  const chips = keys.map(k => `<button class="fp-wk ${k === key ? "fp-wk-on" : ""}" onclick="selectWeek('${k}')">Vko ${weekNumberOf(k)}${planned(k) ? " ●" : ""}${k === cur ? "<small>nyt</small>" : ""}</button>`).join("");
  return `
    <div class="recipe-card fp-weeknav" id="week-nav">
      <div class="fp-weeknav-head">
        <button class="fp-icon-btn" aria-label="Edellinen viikko" onclick="shiftWeek(-1)">‹</button>
        <div style="text-align: center;">
          <div class="fp-weeknav-title">Viikko ${weekNumberOf(key)}</div>
          <div class="fp-weeknav-range">${esc(formatWeekRange(key))}${key === cur ? " · tämä viikko" : ""}</div>
        </div>
        <button class="fp-icon-btn" aria-label="Seuraava viikko" onclick="shiftWeek(1)">›</button>
      </div>
      <div class="fp-wk-chips">${chips}</div>
      ${key !== cur ? `<button class="fp-wk-today" onclick="goToCurrentWeek()">↩ Takaisin tähän viikkoon</button>` : ""}
    </div>`;
}

function renderWeekPlan() {
  const combined = combinedWeekIngredients();
  const wkKey = activeWeekKey();
  const dates = weekDates(wkKey);
  const now = new Date();
  const isToday = dt => dt.getUTCFullYear() === now.getFullYear() && dt.getUTCMonth() === now.getMonth() && dt.getUTCDate() === now.getDate();
  const rows = WEEK_DAYS.map((d, di) => {
    const r = appState.weekPlan[d];
    const dt = dates[di];
    return `
      <div class="fp-week-row ${isToday(dt) ? "fp-week-today-row" : ""}" id="week-day-${d}">
        <div class="fp-week-day">${d}<small>${dt.getUTCDate()}.${dt.getUTCMonth() + 1}.</small></div>
        <div style="flex: 1; min-width: 0;">
          ${r ? `<div style="font-size: 0.86rem; font-weight: 800; color: #0f172a;">${esc(r.recipe_title)}</div>
                 <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">${esc(r.cuisine || "")} · ${missingIngredients(r).length} ostettavaa${r.is_vegetarian ? " · 🥦 Kasvis" : ""}${r.total_time_minutes ? ` · ⏱️ ${r.total_time_minutes} min` : ""}${weekCookBadge(r)}</div>
                 ${r.vege_note && !r.is_vegetarian ? `<div class="fp-vege-note fp-vege-note-sm">🥦 ${esc(r.vege_note)}</div>` : ""}`
              : `<div style="font-size: 0.8rem; color: #94a3b8; font-weight: 700;">Ei suunniteltu</div>`}
        </div>
        ${r ? `<button class="fp-icon-btn" aria-label="Kokkaustila ${WEEK_DAY_NAMES[d]}" onclick="openCookingMode('week', '${d}')">📖</button>
               <button class="fp-icon-btn" aria-label="Poista ${WEEK_DAY_NAMES[d]}" onclick="clearWeekDay('${d}')">✕</button>` : ""}
      </div>`;
  }).join("");
  const anyPlanned = WEEK_DAYS.some(d => appState.weekPlan[d]);
  const emptyDays = WEEK_DAYS.filter(d => !appState.weekPlan[d]).length;
  const weekLoading = foodPlan.loading && foodPlan.loadingKind === "week";
  const stageKeys = Object.keys(WEEK_STAGES).filter(k => k === "week" || foodPlan.image);
  const curStage = stageKeys.indexOf(foodPlan.stage);
  const loadingHtml = weekLoading ? `
    <div class="recipe-card" id="week-loading" style="padding: 14px;">
      <div style="font-weight: 800; color: #1e293b; font-size: 0.9rem; margin-bottom: 8px;">✨ Tekoäly suunnittelee ${emptyDays} päivää (${foodPlan.diners * (foodPlan.cookTwice ? 2 : 1)} annosta)</div>
      ${stageKeys.map((k, i) => {
        const st = i < curStage ? "done" : i === curStage ? "active" : "todo";
        const icon = st === "done" ? "✓" : st === "active" ? `<span class="fp-spinner"></span>` : `${i + 1}`;
        return `<div class="fp-step fp-step-${st}" id="week-step-${k}"><span class="fp-step-icon">${icon}</span><span>${WEEK_STAGES[k]}</span></div>`;
      }).join("")}
    </div>` : "";
  const settingsLine = `${foodPlan.diners} ruokailijaa${foodPlan.cookTwice ? " × 2" : ""} · ${foodPlan.cuisines.length ? esc(foodPlan.cuisines.join(", ")) : "kaikki keittiöt"}${foodPlan.prepTime ? ` · ⏱️ ${esc((PREP_TIME_OPTIONS.find(o => o.v === foodPlan.prepTime) || {}).label || "")}` : ""}${foodPlan.image ? " · jääkaappikuva mukana" : ""}${foodPlan.diet === "vege" ? " · 🥦 kasvisruoka" : foodPlan.diet === "mixed" ? " · 👥 vege-vinkit" : ""}`;
  return `
    ${renderWeekNav()}
    <div class="recipe-card" style="background: #fffbeb; border-color: #fde68a;">
      <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">✨ Viikon ${weekNumberOf(wkKey)} automaattiehdotus</div>
      <div style="font-size: 0.74rem; color: #78350f; margin: 4px 0 8px;">${settingsLine}. Muuta muita asetuksia Haku-välilehdellä. Täyttää vain tyhjät päivät.</div>
      ${renderDietSelector()}
      ${renderPrepTimeSelector()}
      ${foodPlan.weekError && !weekLoading ? `<div id="week-error" style="font-size: 0.76rem; color: #991b1b; font-weight: 700; margin-bottom: 8px;">⚠️ ${esc(foodPlan.weekError)}</div>` : ""}
      <button id="btn-autofill-week" onclick="autoFillWeek()" ${weekLoading || emptyDays === 0 ? "disabled" : ""} style="width: 100%; padding: 11px; border-radius: 10px; border: none; background: ${emptyDays === 0 ? "#e2e8f0" : "#ea580c"}; color: ${emptyDays === 0 ? "#64748b" : "#ffffff"}; font-weight: 800; font-size: 0.86rem; cursor: ${weekLoading || emptyDays === 0 ? "default" : "pointer"};">
        ${weekLoading ? `⏳ ${WEEK_STAGES[foodPlan.stage] || "Suunnitellaan..."}` : emptyDays === 0 ? "✓ Viikko on täynnä" : `✨ Täytä ${emptyDays} tyhjää päivää tekoälyllä`}
      </button>
      <div class="fp-week-actions">
        <button id="btn-mix-week" onclick="mixWeekCuisines()" ${weekLoading ? "disabled" : ""}>🌍 Sekoita keittiöt</button>
        <button id="btn-regen-week" onclick="regenerateWeek()" ${weekLoading ? "disabled" : ""}>🔄 Uusi ehdotus</button>
        <button id="btn-clear-week" onclick="clearWeekAndFields()" ${weekLoading ? "disabled" : ""}>🧹 Tyhjennä</button>
      </div>
      <div style="font-size: 0.7rem; color: #78350f; margin-top: 6px;">🌍 antaa jokaiselle päivälle eri keittiön (Haku-välilehdellä valitut keittiöt, tai maailman keittiöt, jos valittuna alle kaksi). 🔄 korvaa viikon uusilla ehdotuksilla. 🧹 tyhjentää viikon sekä kuvan, puhutut raaka-aineet ja makumaailmat.</div>
    </div>
    ${loadingHtml}
    <div class="recipe-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">📅 Viikon ${weekNumberOf(wkKey)} ruokalista</div>
        ${anyPlanned ? `<button id="btn-share-week" class="fp-share-btn" onclick="shareWeekPlan()">📤 Jaa viikko</button>` : ""}
      </div>
      ${rows}
      ${!anyPlanned ? `<div style="font-size: 0.76rem; color: #64748b; margin-top: 8px;">Valitse reseptikortista päivä (Ma–Su) tai anna tekoälyn täyttää viikko.</div>` : ""}
    </div>
    ${combined.length > 0 ? `
      <div class="recipe-card">
        <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">🛒 Koko viikon ostettavat (${combined.length} kpl)</div>
        ${combined.map(i => {
          const deal = dealForIngredient(i.name);
          return `<div style="font-size: 0.8rem; color: #334155; font-weight: 700; padding: 3px 0;">• ${esc(i.to_shopping_list)}${deal ? ` <span class="fp-deal-inline">🔥 ${esc(deal.price)} ${esc(deal.store)}</span>` : ""}</div>`;
        }).join("")}
        <button id="btn-add-week" onclick="addWeekToShoppingList()" ${foodPlan.weekAdded ? "disabled" : ""} style="width: 100%; margin-top: 10px; padding: 10px; border-radius: 10px; border: none; font-weight: 800; font-size: 0.84rem; cursor: ${foodPlan.weekAdded ? "default" : "pointer"}; background: ${foodPlan.weekAdded ? "#bbf7d0" : "#16a34a"}; color: ${foodPlan.weekAdded ? "#166534" : "#ffffff"};">
          ${foodPlan.weekAdded ? "✓ Viikon ainekset lisätty kauppalapulle" : "🛒 Lisää koko viikon ainekset kauppalapulle"}
        </button>
      </div>` : ""}
  `;
}

function renderFavorites() {
  if (appState.favorites.length === 0) {
    return `<div class="recipe-card" style="text-align: center; padding: 26px 12px;">
      <div style="font-size: 1.8rem;">☆</div>
      <div style="font-weight: 800; color: #1e293b; font-size: 0.9rem; margin-top: 6px;">Ei vielä suosikkeja</div>
      <div style="font-size: 0.76rem; color: #64748b; margin-top: 4px;">Napauta reseptikortin tähteä, niin resepti tallentuu koko perheelle.</div>
    </div>`;
  }
  return appState.favorites.map((r, idx) => renderRecipeCard(r, idx, "fav", r.target_servings)).join("");
}

function renderFoodPlan() {
  const fp = foodPlan;
  const effective = fp.diners * (fp.cookTwice ? 2 : 1);
  const worldOptions = WORLD_CUISINES;

  const chip = c => {
    const on = fp.cuisines.includes(c);
    return `<button onclick="toggleFoodPlanCuisine('${c}')" style="padding: 7px 12px; border-radius: 999px; border: 1.5px solid ${on ? "#16a34a" : "#cbd5e1"}; background: ${on ? "#f0fdf4" : "#ffffff"}; color: ${on ? "#15803d" : "#475569"}; font-weight: 700; font-size: 0.78rem; cursor: pointer;">${on ? "✓ " : ""}${c}</button>`;
  };
  const worldChipsHtml = worldOptions.map(chip).join("");

  // Puhutut raaka-aineet (poistettavissa yksitellen)
  const spokenHtml = (fp.spoken.length > 0 || fp.voiceLoading) ? `
    <div id="fp-spoken" style="margin-top: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 0.72rem; font-weight: 800; color: #64748b;">🎙️ KERROTUT RAAKA-AINEET</span>
        ${fp.spoken.length > 0 ? `<button onclick="clearSpokenIngredients()" style="border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.74rem; cursor: pointer;">Tyhjennä</button>` : ""}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${fp.spoken.map((x, i) => `<button onclick="removeSpokenIngredient(${i})" aria-label="Poista ${esc(x)}" style="padding: 5px 10px; border-radius: 999px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; font-weight: 700; font-size: 0.78rem; cursor: pointer;">${esc(x)} ✕</button>`).join("")}
        ${fp.voiceLoading ? `<span style="font-size: 0.78rem; font-weight: 700; color: #64748b;"><span class="fp-spinner"></span> Tunnistetaan puhetta...</span>` : ""}
      </div>
    </div>` : "";

  let recipesHtml = "";
  if (fp.loading && fp.loadingKind === "search") {
    const order = Object.keys(FOODPLAN_STAGES).filter(k => k === "recipes" || fp.image); // ilman kuvaa vain reseptihaku
    const cur = order.indexOf(fp.stage);
    const stepsHtml = order.map((k, i) => {
      const state = i < cur ? "done" : i === cur ? "active" : "todo";
      const icon = state === "done" ? "✓" : state === "active" ? `<span class="fp-spinner"></span>` : `${i + 1}`;
      return `<div class="fp-step fp-step-${state}" id="fp-step-${k}"><span class="fp-step-icon">${icon}</span><span>${FOODPLAN_STAGES[k]}</span></div>`;
    }).join("");
    recipesHtml = `
      <div class="recipe-card" id="foodplan-loading" style="padding: 16px;">
        <div style="font-weight: 800; color: #1e293b; font-size: 0.92rem; margin-bottom: 10px;">👨‍🍳 Tekoäly suunnittelee reseptejä ${effective} hengelle</div>
        ${stepsHtml}
        ${(fp.detected.length > 0 || fp.spoken.length > 0) ? `<div style="font-size: 0.74rem; color: #475569; margin-top: 10px;"><strong>Raaka-aineet:</strong> ${esc(allIngredients().join(", "))}</div>` : ""}
      </div>
    `;
  } else if (fp.error) {
    recipesHtml = `
      <div class="recipe-card" id="foodplan-error" style="border-color: #fecaca; background: #fef2f2;">
        <div style="font-weight: 800; color: #991b1b; font-size: 0.88rem;">⚠️ Reseptien haku epäonnistui</div>
        <div style="font-size: 0.78rem; color: #7f1d1d; margin: 4px 0 10px;">${esc(fp.error)}</div>
        <button onclick="searchFoodPlanRecipes()" style="width: 100%; padding: 9px; border-radius: 9px; border: none; background: #dc2626; color: #ffffff; font-weight: 800; font-size: 0.82rem; cursor: pointer;">↻ Yritä uudelleen</button>
      </div>
    `;
  } else if (fp.recipes.length > 0) {
    recipesHtml = fp.recipes.map((r, idx) => renderRecipeCard(r, idx, "result", effective)).join("");
  }

  if (fp.tab === "week") return `<div class="main-content" style="padding-top: 14px;">${renderFoodPlanTabs()}${renderWeekPlan()}</div>`;
  if (fp.tab === "favorites") return `<div class="main-content" style="padding-top: 14px;">${renderFoodPlanTabs()}${renderFavorites()}</div>`;

  return `
    <div class="main-content" style="padding-top: 14px;">
      ${renderFoodPlanTabs()}
      <div class="add-widget-card">
        <div class="add-widget-header">
          <span class="add-widget-title">Mitä jääkaapista löytyy?</span>
          <span class="badge-quickadd">Tekoäly</span>
        </div>
        ${fp.image ? `<div style="margin-bottom: 10px;"><img src="${fp.image.previewUrl}" alt="Raaka-aineet" style="width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0;"></div>` : ""}
        <div style="display: flex; gap: 8px;">
          <button onclick="triggerFoodPlanCamera()" style="flex: 1; padding: 12px 6px; border-radius: 10px; border: 1.5px dashed #94a3b8; background: #f8fafc; font-weight: 800; font-size: 0.86rem; color: #1e293b; cursor: pointer;">
            📷 ${fp.image ? "Uusi kuva" : "Ota kuva"}
          </button>
          <button id="btn-voice-ingredients" onclick="startVoiceRecognition('ingredients')" ${fp.voiceLoading ? "disabled" : ""} style="flex: 1; padding: 12px 6px; border-radius: 10px; border: 1.5px dashed #94a3b8; background: #f8fafc; font-weight: 800; font-size: 0.86rem; color: #1e293b; cursor: pointer;">
            🎙️ Kerro puheella
          </button>
        </div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 6px;">Käytä kuvaa, puhetta tai molempia – raaka-aineet yhdistetään.</div>
        ${spokenHtml}

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
          <span style="font-size: 0.82rem; font-weight: 800; color: #1e293b;">Ruokailijoiden määrä</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button onclick="setFoodPlanDiners(-1)" style="width: 32px; height: 32px; border-radius: 9px; border: 1.5px solid #cbd5e1; background: #ffffff; font-weight: 800; font-size: 1rem; cursor: pointer; color: #334155;">−</button>
            <span style="font-weight: 800; min-width: 22px; text-align: center; font-size: 1rem; color: #0f172a;">${fp.diners}</span>
            <button onclick="setFoodPlanDiners(1)" style="width: 32px; height: 32px; border-radius: 9px; border: 1.5px solid #cbd5e1; background: #ffffff; font-weight: 800; font-size: 1rem; cursor: pointer; color: #334155;">+</button>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
          <span style="font-size: 0.82rem; font-weight: 800; color: #1e293b;">Syödään kahdesti (2x)</span>
          <button onclick="toggleCookTwice()" style="padding: 7px 14px; border-radius: 999px; border: 1.5px solid ${fp.cookTwice ? "#ea580c" : "#cbd5e1"}; background: ${fp.cookTwice ? "#fff7ed" : "#ffffff"}; color: ${fp.cookTwice ? "#c2410c" : "#475569"}; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
            ${fp.cookTwice ? "✓ Päällä" : "Pois"}
          </button>
        </div>
        ${fp.cookTwice ? `<div style="margin-top: 8px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 9px; padding: 7px 10px; font-size: 0.76rem; font-weight: 800; color: #c2410c;">🍽️ Skaalataan ${effective} hengelle</div>` : ""}

        ${renderDietSelector()}
        ${renderPrepTimeSelector()}
        <div style="margin-top: 14px; font-size: 0.76rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Keittiöt maailmalta (valinnainen)</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">${worldChipsHtml}</div>

        <button id="btn-find-recipes" onclick="searchFoodPlanRecipes()" ${fp.loading ? "disabled" : ""} style="width: 100%; margin-top: 14px; padding: 12px; border-radius: 10px; border: none; background: #ea580c; color: #ffffff; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
          ${fp.loading ? `⏳ ${FOODPLAN_STAGES[fp.stage] || "Haetaan reseptejä..."}` : "🔍 Etsi reseptejä"}
        </button>
      </div>

      ${fp.recipes.length > 0 && !fp.loading ? `<div class="section-headline" style="margin: 14px 4px 8px;">RESEPTIEHDOTUKSET (${fp.recipes.length} kpl)</div>` : ""}
      ${recipesHtml}
    </div>
  `;
}

function render() {
  const root = document.getElementById("app-root");
  const navHeader = document.getElementById("subpage-nav-header");
  const titleSlot = document.getElementById("subpage-title-slot");
  if (!root) return;
  if (routeDrag) { routeRenderPending = true; return; }   // ei piirretä uudelleen kesken raahauksen

  if (currentView === "home") {
    if (navHeader) navHeader.style.display = "none";
    root.innerHTML = renderHome();
    return;
  }

  if (navHeader) navHeader.style.display = "flex";

  if (currentView === "soffa") {
    if (titleSlot) titleSlot.innerHTML = `<span>🛋️ Kotisohva</span>`;
    root.innerHTML = renderSoffa();
  } else if (currentView === "store") {
    if (titleSlot) titleSlot.innerHTML = `<span>🛒 ${esc(STORE_NAMES[activeStoreKey] || "Kauppareitti")}</span>`;
    root.innerHTML = renderStore(activeStoreKey);
  } else if (currentView === "deals") {
    if (titleSlot) titleSlot.innerHTML = `<span>🔥 Päivän Tärpit</span>`;
    root.innerHTML = renderDeals();
  } else if (currentView === "foodplan") {
    if (titleSlot) titleSlot.innerHTML = `<span>🍳 Ruokasuunnittelija</span>`;
    root.innerHTML = renderFoodPlan();
  }
}

// =====================================================================================================
// 🎧 Ääniohjaus (Audio Companion) kauppanäkymässä
// - Lukee reitin mukaiset seuraavat 3 tuotetta ääneen (Web Speech, fi-FI).
// - Kuulokkeiden painike (Media Session: play/pause) tai 🎤-painike käynnistää lyhyen puheentunnistuksen:
//     "otettu" | "kärryssä" | "valmis" | "ok"  -> reitin päällimmäinen tuote kerätyksi + piippaus + seuraavat 3 ääneen
//     "loppu" | "ei löydy" | "ohita"            -> tuote siirtyy jonon hännille + seuraavat 3 ääneen
// - Tunnistus sulkeutuu heti vastauksen jälkeen (ei jää päälle). Virheen (no-speech, audio-capture, ...) jälkeen
//   seuraava painallus lukee vain seuraavat tuotteet.
// Media Session toimii vain, kun sivulla soi ääntä: siksi taustalla pyörii äänetön silmukka (käynnistetään napautuksesta).
// =====================================================================================================
let audioMode = null;  // { storeKey, listening, rec, recTimer, skipped: [avain], fallbackNext, recUnavailable, status, el, wavUrl }
const AUDIO_DONE_WORDS = ["otettu", "kärryssä", "valmis", "ok", "okei"];
const AUDIO_SKIP_PHRASES = ["loppu", "ei löydy", "ohita"];
const AUDIO_LISTEN_MS = 7000;   // kuuntelun enimmäisaika
const AUDIO_READ_COUNT = 3;     // montako tuotetta luetaan kerralla
let audioLastPress = 0;

const audioItemKey = it => `${it.cat}|${it.name}`;

// Keräysjono reitin järjestyksessä: kategoriat getStoreLayout()-järjestyksessä, sitten muut osastot;
// ohitetut tuotteet ovat jonon hännillä (ohitusjärjestyksessä). Ruksatut eivät ole mukana.
function audioQueue(storeKey) {
  const layout = getStoreLayout(storeKey);
  const active = appState.items.filter(i => i.active && !i.done);
  const ordered = [...layout.flatMap(dept => active.filter(i => i.cat === dept)), ...active.filter(i => !layout.includes(i.cat))];
  const skipped = audioMode ? audioMode.skipped : [];
  const rest = ordered.filter(i => !skipped.includes(audioItemKey(i)));
  const tail = skipped.map(k => ordered.find(i => audioItemKey(i) === k)).filter(Boolean);
  return [...rest, ...tail];
}

// "MAITO: Laktoositon kevyt (sininen)" -> "MAITO, Laktoositon kevyt sininen"; määrä mukaan, jos > 1
function audioItemSpeech(item) {
  const name = String(item.name).replace(/:\s*/, ", ").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  return item.qty > 1 ? `${name}, ${item.qty} kappaletta` : name;
}

function audioSpeak(text) {
  if (!cookSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fi-FI";
    const { voice } = pickFinnishVoice();
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch (e) { console.warn("Ääniohjaus: puhe epäonnistui", e); }
}

// Lyhyt äänimerkki (WebAudio); AudioContext avataan napautuksella (unlockCookAudio)
function audioBeep(kind) {
  try {
    unlockCookAudio();
    const ctx = cookAudioCtx;
    if (!ctx) return;
    const seq = kind === "ok" ? [[880, 0, 0.09], [1175, 0.1, 0.13]]
      : kind === "skip" ? [[523, 0, 0.1], [392, 0.12, 0.13]]
      : [[220, 0, 0.22]];
    seq.forEach(([freq, at, dur]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), t0 = ctx.currentTime + at;
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    });
  } catch (e) {}
}

function audioSetStatus(text) {
  if (!audioMode) return;
  audioMode.status = text;
  const el = document.getElementById("audio-status");
  if (el) el.textContent = text;
}

// Lukee reitin seuraavat 3 tuotetta
function audioAnnounce(lead) {
  if (!audioMode) return;
  const next = audioQueue(audioMode.storeKey).slice(0, AUDIO_READ_COUNT);
  if (next.length === 0) {
    audioSpeak(`${lead || ""}Kaikki tuotteet on kerätty.`);
    audioSetStatus("✅ Kaikki tuotteet kerätty");
    return;
  }
  audioSpeak(`${lead || ""}Seuraavaksi: ${next.map(audioItemSpeech).join(". ")}.`);
  audioSetStatus(`🔊 ${next.map(i => i.name).join(" · ")}`);
}
window.audioReadNext = function() { if (audioMode) { audioStopListening(); audioAnnounce(""); } };

// ----- Puheen luokittelu -----
function audioHasPhrase(text, phrase) {            // \b ei toimi ä/ö-kirjaimilla, joten käytetään välilyöntirajoja
  return (" " + text + " ").includes(" " + phrase + " ");
}
function audioClassify(alternatives) {
  const norm = alternatives.map(t => String(t).toLowerCase().replace(/[.,!?;:"']/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (norm.some(t => AUDIO_SKIP_PHRASES.some(p => audioHasPhrase(t, p)))) return "skip";   // ohitus ensin ("ei löydy" ennen "ok")
  if (norm.some(t => AUDIO_DONE_WORDS.some(w => audioHasPhrase(t, w)))) return "done";
  return null;
}

function audioDone() {
  const m = audioMode;
  const item = audioQueue(m.storeKey)[0];
  if (!item) { audioBeep("error"); audioAnnounce(""); return; }
  audioBeep("ok");
  markItemDone(appState.items.indexOf(item));   // sama kuin napautus: tallennus, kumoa-palkki ja uudelleenpiirto
  audioSetStatus(`✓ Kerätty: ${item.name}`);
  setTimeout(() => audioAnnounce(""), 280);     // piippaus ehtii soida ennen puhetta
}

function audioSkip() {
  const m = audioMode;
  const item = audioQueue(m.storeKey)[0];
  if (!item) { audioBeep("error"); audioAnnounce(""); return; }
  const key = audioItemKey(item);
  m.skipped = m.skipped.filter(k => k !== key);
  m.skipped.push(key);                           // jonon hännille
  audioBeep("skip");
  audioSetStatus(`⏭ Ohitettu: ${item.name}`);
  if (currentView === "store") render();         // päivittää ohitusmerkinnän ja "seuraava"-korostuksen
  setTimeout(() => audioAnnounce(""), 280);
}

function audioHandleHeard(alternatives) {
  const kind = audioClassify(alternatives);
  if (kind === "done") audioDone();
  else if (kind === "skip") audioSkip();
  else {
    audioBeep("error");
    audioSetStatus(`❓ Kuulin: "${alternatives[0] || ""}"`);
    audioSpeak("En ymmärtänyt.");
  }
}

// ----- Puheentunnistus (fi-FI), lyhyt ja itsestään sulkeutuva -----
function audioStopListening() {
  const m = audioMode;
  if (!m) return;
  if (m.recTimer) { clearTimeout(m.recTimer); m.recTimer = null; }
  const rec = m.rec;
  m.rec = null;
  m.listening = false;
  if (rec) {
    rec.onresult = rec.onerror = rec.onend = null;
    try { rec.abort(); } catch (e) { try { rec.stop(); } catch (e2) {} }
  }
}

// Virhe: seuraava painallus lukee vain seuraavat tuotteet (pysyvän virheen jälkeen aina)
function audioRecFailed(code) {
  const m = audioMode;
  if (!m) return;
  if (code === "aborted") { audioSetStatus("🎧 Valmiina"); return; }
  const fatal = ["not-allowed", "service-not-allowed", "language-not-supported"].includes(code);
  if (fatal) m.recUnavailable = true; else m.fallbackNext = true;
  audioBeep("error");
  audioSetStatus(fatal ? "⚠️ Mikrofoni ei käytössä – painallus lukee seuraavat tuotteet"
    : code === "no-speech" ? "🔇 En kuullut mitään – seuraava painallus lukee seuraavat tuotteet"
    : "⚠️ Tunnistus epäonnistui – seuraava painallus lukee seuraavat tuotteet");
}

function audioStartListening(SR) {
  const m = audioMode;
  let rec;
  try { rec = new SR(); } catch (e) { audioRecFailed("start-failed"); return; }
  rec.lang = "fi-FI";
  rec.continuous = false;        // yksi lausahdus
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  m.rec = rec;
  m.listening = true;
  audioSetStatus("🎤 Kuuntelen… sano “otettu” tai “ohita”");
  let settled = false;
  const settle = () => {         // sulkee tunnistuksen heti (mikrofoni vapautuu, akku säästyy)
    if (settled) return false;
    settled = true;
    audioStopListening();
    return true;
  };
  rec.onresult = e => {
    const alts = [];
    try { for (const res of e.results) for (let i = 0; i < res.length; i++) alts.push(res[i].transcript); } catch (err) {}
    if (settle()) audioHandleHeard(alts);
  };
  rec.onerror = e => { if (settle()) audioRecFailed(e && e.error); };
  rec.onend = () => { if (settle()) audioRecFailed("no-speech"); };
  m.recTimer = setTimeout(() => { if (settle()) audioRecFailed("no-speech"); }, AUDIO_LISTEN_MS);
  try { rec.start(); } catch (e) { if (settle()) audioRecFailed("start-failed"); }
}

// 🎤 / kuulokkeiden painallus
window.audioMicPress = function() {
  const m = audioMode;
  if (!m) return;
  unlockCookAudio();
  if (m.listening) { audioStopListening(); audioSetStatus("🎧 Valmiina"); return; }   // toinen painallus keskeyttää
  try { window.speechSynthesis.cancel(); } catch (e) {}                                // puhe ei saa kuulua mikrofoniin
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || m.recUnavailable) { audioAnnounce(""); return; }
  if (m.fallbackNext) { m.fallbackNext = false; audioAnnounce(""); return; }          // edellinen tunnistus epäonnistui
  audioStartListening(SR);
};

// ----- Media Session (kuulokkeiden painikkeet) -----
function audioMakeSilentWavUrl(seconds = 6, rate = 8000) {   // Chrome vaatii vähintään ~5 s mediatiedoston
  const n = seconds * rate, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) buf[o + i] = str.charCodeAt(i); };
  w(0, "RIFF"); dv.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  w(36, "data"); dv.setUint32(40, n, true);
  buf.fill(128, 44);                                          // 8-bittinen hiljaisuus
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

function audioKeepAlive() {   // kuulokkeen "pause" pysäyttäisi äänen -> jatketaan, jotta painikkeet pysyvät aktiivisina
  const m = audioMode;
  if (!m) return;
  if (m.el && m.el.paused) { const p = m.el.play(); if (p && p.catch) p.catch(() => {}); }
  try { if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing"; } catch (e) {}
}

function audioHeadsetPress() {
  if (!audioMode) return;
  const now = Date.now();
  if (now - audioLastPress < 700) return;                      // jotkin kuulokkeet lähettävät play+pause peräkkäin
  audioLastPress = now;
  audioKeepAlive();
  audioMicPress();
}

function audioSetupMediaSession(storeKey) {
  if (!("mediaSession" in navigator)) return;
  try {
    if (typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Ääniohjaus – kauppareitti", artist: STORE_NAMES[storeKey] || "Corsia", album: "Corsia",
        artwork: [{ src: "corsia-icon-192.png", sizes: "192x192", type: "image/png" }, { src: "corsia-icon-512.png", sizes: "512x512", type: "image/png" }]
      });
    }
    navigator.mediaSession.playbackState = "playing";
    const set = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) {} };
    set("play", audioHeadsetPress);
    set("pause", audioHeadsetPress);
    set("nexttrack", () => { audioKeepAlive(); window.audioReadNext(); });
    set("previoustrack", () => { audioKeepAlive(); window.audioReadNext(); });
    set("stop", () => window.stopAudioMode());
  } catch (e) { console.warn("Media Session ei käytössä:", e); }
}

function audioTeardownMediaSession() {
  if (!("mediaSession" in navigator)) return;
  ["play", "pause", "nexttrack", "previoustrack", "stop"].forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch (e) {} });
  try { navigator.mediaSession.playbackState = "none"; navigator.mediaSession.metadata = null; } catch (e) {}
}

window.startAudioMode = function(storeKey) {
  if (audioMode) { window.stopAudioMode(); return; }            // painike toimii päälle/pois-kytkimenä
  audioMode = { storeKey, listening: false, rec: null, recTimer: null, skipped: [], fallbackNext: false, recUnavailable: false, status: "🎧 Valmiina", el: null, wavUrl: null };
  unlockCookAudio();
  try {                                                         // äänetön silmukka pitää Media Sessionin hengissä
    audioMode.wavUrl = audioMakeSilentWavUrl();
    const el = new Audio(audioMode.wavUrl);
    el.loop = true;
    audioMode.el = el;
    const p = el.play();
    if (p && p.catch) p.catch(() => audioSetStatus("⚠️ Kuulokkeen painike ei välttämättä toimi – käytä 🎤-painiketta"));
  } catch (e) { console.warn("Ääniohjaus: taustaääni ei käynnisty", e); }
  audioSetupMediaSession(storeKey);
  render();
  setTimeout(() => audioAnnounce("Ääniohjaus päällä. "), 150);
};

window.stopAudioMode = function(silent) {
  const m = audioMode;
  if (!m) return;
  audioStopListening();
  try { window.speechSynthesis.cancel(); } catch (e) {}
  if (m.el) { try { m.el.pause(); } catch (e) {} m.el.src = ""; }
  if (m.wavUrl) { try { URL.revokeObjectURL(m.wavUrl); } catch (e) {} }
  audioTeardownMediaSession();
  audioMode = null;
  if (silent !== true && currentView === "store") render();
};

// Taustalle siirryttäessä mikrofoni suljetaan heti
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && audioMode && audioMode.listening) { audioStopListening(); audioSetStatus("🎧 Valmiina"); }
});

// ----- Näkymäpalat -----
function renderAudioButton(storeKey) {
  const on = audioMode && audioMode.storeKey === storeKey;
  return `<button class="route-edit-btn ${on ? "audio-btn-on" : ""}" onclick="startAudioMode('${storeKey}')">${on ? "🎧 Ääniohjaus: päällä" : "🎧 Ääniohjaus"}</button>`;
}

function renderAudioPanel(storeKey) {
  const next = audioQueue(storeKey).slice(0, AUDIO_READ_COUNT);
  return `
    <div class="audio-panel" id="audio-panel">
      <div class="audio-title">🎧 Ääniohjaus päällä</div>
      <div class="audio-status" id="audio-status" role="status" aria-live="polite">${esc(audioMode.status)}</div>
      <div class="audio-next">${next.length ? "Seuraavaksi: " + next.map(i => esc(i.name)).join(" · ") : "Ei kerättäviä tuotteita"}</div>
      <div class="audio-hint">Paina kuulokkeen painiketta (tai 🎤) ja sano “otettu”, “kärryssä”, “valmis” tai “ok”. Sano “loppu”, “ei löydy” tai “ohita” siirtääksesi tuotteen jonon hännille.</div>
      <div class="audio-actions">
        <button onclick="audioMicPress()">🎤 Kuittaa</button>
        <button onclick="audioReadNext()">🔊 Lue seuraavat</button>
        <button onclick="stopAudioMode()">Lopeta</button>
      </div>
    </div>`;
}

function audioItemTag(item) {   // ⏭-merkintä ohitetuille tuotteille
  return audioMode && audioMode.skipped.includes(audioItemKey(item)) ? ` <span class="audio-skip-tag">⏭ ohitettu</span>` : "";
}
