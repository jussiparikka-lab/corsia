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
  const dealsListHtml = appState.deals.map(deal => {
    const isPicked = appState.items.some(i => i.name.toLowerCase() === deal.name.toLowerCase() && i.active && !i.done);
    return `
      <div class="live-deal-card">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.7rem; font-weight: 800; color: #ea580c; text-transform: uppercase;">${esc(deal.store)}</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b; margin: 1px 0;">${esc(deal.name)}</div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #16a34a;">${esc(deal.price)}</div>
        </div>
        <button class="btn-pick-deal ${isPicked ? "picked" : ""}" onclick="toggleDealPicked('${esc(deal.id)}')">
          ${isPicked ? "✓ Listalla" : "+ Ota listalle"}
        </button>
      </div>
    `;
  }).join("");

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
  }
}
