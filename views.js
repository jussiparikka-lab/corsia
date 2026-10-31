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

function renderStore(storeKey) {
  const storeName = STORE_NAMES[storeKey] || "Kauppareitti";
  const layout = STORE_LAYOUTS[storeKey] || [];

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
          <div class="store-collect-item" onclick="markItemDone(${originalIdx})">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">${esc(item.name)}</div>
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
              <div style="font-size: 0.92rem; font-weight: 800; color: #0f172a;">${esc(item.name)}</div>
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
        </div>
        <div style="width: 70px; height: 28px;">${renderStoreLogo(storeKey)}</div>
      </div>
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
  const ings = Array.isArray(r.ingredients) ? r.ingredients.filter(i => i && i.name) : [];
  const missing = ings.filter(i => !i.in_fridge);
  const added = source === "result" && !!foodPlan.addedRecipes[idx];
  const fav = isFavoriteRecipe(r);
  const addFn = source === "fav" ? `addFavoriteToShoppingList(${idx})` : `addRecipeToShoppingList(${idx})`;
  const ingRows = ings.map(i => {
    const inFridge = !!i.in_fridge;
    const deal = inFridge ? null : dealForIngredient(i.name);
    return `
      <div style="padding: 5px 8px; border-radius: 8px; background: ${inFridge ? "#f0fdf4" : "#fff7ed"}; border: 1px solid ${inFridge ? "#bbf7d0" : "#fed7aa"}; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">${inFridge ? "✓" : "🛒"} ${esc(i.name)}</span>
          <span style="font-size: 0.74rem; font-weight: 700; color: ${inFridge ? "#15803d" : "#c2410c"}; white-space: nowrap;">${esc(i.amount_needed || i.amount || "")}${inFridge ? " · kotona" : ""}</span>
        </div>
        ${deal ? `<div class="fp-deal-badge">🔥 Tarjous: ${esc(deal.name)} – ${esc(deal.price)}${deal.store ? ` · ${esc(deal.store)}` : ""}</div>` : ""}
      </div>
    `;
  }).join("");
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
        <span style="font-size: 0.7rem; color: #64748b; font-weight: 700;">🍽️ ${esc(String(r.target_servings || effective))} annosta${r.original_servings ? ` (alkup. ${esc(String(r.original_servings))})` : ""}</span>
        ${r.source_url ? `<a href="${esc(r.source_url)}" target="_blank" rel="noopener" style="font-size: 0.7rem; color: #0284c7; font-weight: 700;">🔗 Reseptin lähde</a>` : ""}
      </div>
      ${r.instructions_brief ? `<div style="font-size: 0.76rem; color: #475569; margin: 8px 0 2px; line-height: 1.45;">${esc(r.instructions_brief)}</div>` : ""}
      ${servingsHtml}
      <div style="margin-top: 8px;">${ingRows}</div>
      <div style="margin-top: 8px; font-size: 0.7rem; font-weight: 800; color: #64748b;">📅 LISÄÄ VIIKOLLE</div>
      <div class="fp-days">${dayChips}</div>
      <button onclick="${addFn}" ${added || missing.length === 0 ? "disabled" : ""} style="width: 100%; margin-top: 10px; padding: 10px; border-radius: 10px; border: none; font-weight: 800; font-size: 0.84rem; cursor: ${added || missing.length === 0 ? "default" : "pointer"}; background: ${added ? "#bbf7d0" : missing.length === 0 ? "#e2e8f0" : "#16a34a"}; color: ${added || missing.length === 0 ? "#166534" : "#ffffff"};">
        ${added ? "✓ Lisätty kauppalapulle" : missing.length === 0 ? "✓ Kaikki ainekset jo kotona" : `🛒 Lisää puuttuvat aineet kauppalapulle (${missing.length} kpl)`}
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
    <div class="cook-progress-text">${all ? "🎉 Kaikki vaiheet tehty!" : `${n} / ${steps.length} vaihetta tehty`}</div>
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
function renderWeekPlan() {
  const combined = combinedWeekIngredients();
  const rows = WEEK_DAYS.map(d => {
    const r = appState.weekPlan[d];
    return `
      <div class="fp-week-row" id="week-day-${d}">
        <div class="fp-week-day">${d}</div>
        <div style="flex: 1; min-width: 0;">
          ${r ? `<div style="font-size: 0.86rem; font-weight: 800; color: #0f172a;">${esc(r.recipe_title)}</div>
                 <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">${esc(r.cuisine || "")} · ${missingIngredients(r).length} ostettavaa</div>`
              : `<div style="font-size: 0.8rem; color: #94a3b8; font-weight: 700;">Ei suunniteltu</div>`}
        </div>
        ${r ? `<button class="fp-icon-btn" aria-label="Poista ${WEEK_DAY_NAMES[d]}" onclick="clearWeekDay('${d}')">✕</button>` : ""}
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
  const settingsLine = `${foodPlan.diners} ruokailijaa${foodPlan.cookTwice ? " × 2" : ""} · ${foodPlan.cuisines.length ? esc(foodPlan.cuisines.join(", ")) : "kaikki tyylit"}${foodPlan.image ? " · jääkaappikuva mukana" : ""}`;
  return `
    <div class="recipe-card" style="background: #fffbeb; border-color: #fde68a;">
      <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">✨ Viikon automaattiehdotus</div>
      <div style="font-size: 0.74rem; color: #78350f; margin: 4px 0 8px;">${settingsLine}. Muuta asetuksia Haku-välilehdellä. Täyttää vain tyhjät päivät.</div>
      ${foodPlan.weekError && !weekLoading ? `<div id="week-error" style="font-size: 0.76rem; color: #991b1b; font-weight: 700; margin-bottom: 8px;">⚠️ ${esc(foodPlan.weekError)}</div>` : ""}
      <button id="btn-autofill-week" onclick="autoFillWeek()" ${weekLoading || emptyDays === 0 ? "disabled" : ""} style="width: 100%; padding: 11px; border-radius: 10px; border: none; background: ${emptyDays === 0 ? "#e2e8f0" : "#ea580c"}; color: ${emptyDays === 0 ? "#64748b" : "#ffffff"}; font-weight: 800; font-size: 0.86rem; cursor: ${weekLoading || emptyDays === 0 ? "default" : "pointer"};">
        ${weekLoading ? `⏳ ${WEEK_STAGES[foodPlan.stage] || "Suunnitellaan..."}` : emptyDays === 0 ? "✓ Viikko on täynnä" : `✨ Täytä ${emptyDays} tyhjää päivää tekoälyllä`}
      </button>
    </div>
    ${loadingHtml}
    <div class="recipe-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">📅 Viikon ruokalista</div>
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
  const cuisineOptions = ["Aasialainen", "Pasta", "Wok", "Nopea", "Klassikko"];

  const chipsHtml = cuisineOptions.map(c => {
    const on = fp.cuisines.includes(c);
    return `<button onclick="toggleFoodPlanCuisine('${c}')" style="padding: 7px 12px; border-radius: 999px; border: 1.5px solid ${on ? "#16a34a" : "#cbd5e1"}; background: ${on ? "#f0fdf4" : "#ffffff"}; color: ${on ? "#15803d" : "#475569"}; font-weight: 700; font-size: 0.78rem; cursor: pointer;">${on ? "✓ " : ""}${c}</button>`;
  }).join("");

  let recipesHtml = "";
  if (fp.loading && fp.loadingKind === "search") {
    const order = Object.keys(FOODPLAN_STAGES);
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
        ${fp.detected.length > 0 ? `<div style="font-size: 0.74rem; color: #475569; margin-top: 10px;"><strong>Tunnistettu:</strong> ${esc(fp.detected.join(", "))}</div>` : ""}
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
        <button onclick="triggerFoodPlanCamera()" style="width: 100%; padding: 12px; border-radius: 10px; border: 1.5px dashed #94a3b8; background: #f8fafc; font-weight: 800; font-size: 0.86rem; color: #1e293b; cursor: pointer;">
          📷 ${fp.image ? "Ota uusi kuva" : "Ota kuva raaka-aineista"}
        </button>

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

        <div style="margin-top: 14px; font-size: 0.76rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Makumaailma (valinnainen)</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">${chipsHtml}</div>

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
