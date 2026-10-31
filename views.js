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

function renderFoodPlan() {
  const fp = foodPlan;
  const effective = fp.diners * (fp.cookTwice ? 2 : 1);
  const cuisineOptions = ["Aasialainen", "Pasta", "Wok", "Nopea", "Klassikko"];

  const chipsHtml = cuisineOptions.map(c => {
    const on = fp.cuisines.includes(c);
    return `<button onclick="toggleFoodPlanCuisine('${c}')" style="padding: 7px 12px; border-radius: 999px; border: 1.5px solid ${on ? "#16a34a" : "#cbd5e1"}; background: ${on ? "#f0fdf4" : "#ffffff"}; color: ${on ? "#15803d" : "#475569"}; font-weight: 700; font-size: 0.78rem; cursor: pointer;">${on ? "✓ " : ""}${c}</button>`;
  }).join("");

  let recipesHtml = "";
  if (fp.loading) {
    recipesHtml = `
      <div style="text-align: center; padding: 34px 10px; color: #64748b;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">👨‍🍳</div>
        <div style="font-weight: 800; color: #1e293b; font-size: 0.92rem;">Tekoäly suunnittelee reseptejä...</div>
        <div style="font-size: 0.76rem; margin-top: 4px;">Tunnistetaan raaka-aineita ja skaalataan määriä ${effective} hengelle</div>
      </div>
    `;
  } else if (fp.recipes.length > 0) {
    recipesHtml = fp.recipes.map((r, idx) => {
      const ings = Array.isArray(r.ingredients) ? r.ingredients.filter(i => i && i.name) : [];
      const missing = ings.filter(i => !i.in_fridge);
      const added = !!fp.addedRecipes[idx];
      const ingRows = ings.map(i => {
        const inFridge = !!i.in_fridge;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px; background: ${inFridge ? "#f0fdf4" : "#fff7ed"}; border: 1px solid ${inFridge ? "#bbf7d0" : "#fed7aa"}; margin-bottom: 4px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">${inFridge ? "✓" : "🛒"} ${esc(i.name)}</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: ${inFridge ? "#15803d" : "#c2410c"}; white-space: nowrap;">${esc(i.amount || "")}${inFridge ? " · jääkaapissa" : ""}</span>
          </div>
        `;
      }).join("");
      return `
        <div class="recipe-card">
          <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a;">${esc(r.recipe_title)}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; align-items: center;">
            <span style="background: #ffedd5; color: #9a3412; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">${esc(r.cuisine || "Resepti")}</span>
            <span style="font-size: 0.7rem; color: #64748b; font-weight: 700;">🍽️ ${esc(String(r.target_servings || effective))} annosta</span>
            ${r.source_url ? `<a href="${esc(r.source_url)}" target="_blank" rel="noopener" style="font-size: 0.7rem; color: #0284c7; font-weight: 700;">🔗 Reseptin lähde</a>` : ""}
          </div>
          ${r.instructions_brief ? `<div style="font-size: 0.76rem; color: #475569; margin: 8px 0 2px; line-height: 1.45;">${esc(r.instructions_brief)}</div>` : ""}
          <div style="margin-top: 8px;">${ingRows}</div>
          <button onclick="addRecipeToShoppingList(${idx})" ${added || missing.length === 0 ? "disabled" : ""} style="width: 100%; margin-top: 10px; padding: 10px; border-radius: 10px; border: none; font-weight: 800; font-size: 0.84rem; cursor: ${added || missing.length === 0 ? "default" : "pointer"}; background: ${added ? "#bbf7d0" : missing.length === 0 ? "#e2e8f0" : "#16a34a"}; color: ${added || missing.length === 0 ? "#166534" : "#ffffff"};">
            ${added ? "✓ Lisätty kauppalapulle" : missing.length === 0 ? "✓ Kaikki ainekset jo jääkaapissa" : `🛒 Lisää puuttuvat aineet kauppalapulle (${missing.length} kpl)`}
          </button>
        </div>
      `;
    }).join("");
  }

  return `
    <div class="main-content" style="padding-top: 14px;">
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
          ${fp.loading ? "⏳ Haetaan reseptejä..." : "🔍 Etsi reseptejä"}
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
