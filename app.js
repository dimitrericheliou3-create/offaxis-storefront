(() => {
  "use strict";

  const WHATSAPP_NUMBER = "17587268533";
  const products = Array.isArray(window.OFFAXIS_PRODUCTS) ? window.OFFAXIS_PRODUCTS : [];
  const STORAGE_KEY = "offaxis-cart-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const productGrid = $("#productGrid");
  const cartDrawer = $("#cartDrawer");
  const checkoutModal = $("#checkoutModal");
  const overlay = $("#overlay");
  const cartItems = $("#cartItems");
  const cartEmpty = $("#cartEmpty");
  const drawerBottom = $("#drawerBottom");
  const toast = $("#toast");
  let activeFilter = "all";
  let searchTerm = "";
  let toastTimer;
  let lastWhatsappUrl = "";
  let cart = loadCart();

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(item => item && products.some(p => p.id === item.id) &&
        typeof item.size === "string" && typeof item.colorName === "string" &&
        Number.isFinite(item.qty) && item.qty > 0)
        .map(item => ({ ...item, qty: Math.min(99, Math.floor(item.qty)) }));
    } catch (_) { return []; }
  }

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (_) { /* Storage is optional. */ }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function money(value) { return "EC$" + Number(value || 0).toFixed(2); }
  function quantity() { return cart.reduce((sum, item) => sum + item.qty, 0); }
  function subtotal() {
    return cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function readableInk(hex) {
    const clean = String(hex || "#d8d2c4").replace("#", "");
    if (clean.length !== 6) return "#20231d";
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 135 ? "#f0efe8" : "#20231d";
  }

  function productArtwork(product, color) {
    const fill = (color || product.colors[0]).hex;
    const ink = readableInk(fill);
    const hoodie = product.category === "hoodie";
    const body = hoodie
      ? "M147 100 L105 117 L51 188 L95 222 L126 183 L126 383 Q200 406 274 383 L274 183 L305 222 L349 188 L295 117 L253 100 Q244 132 200 132 Q156 132 147 100Z"
      : "M145 96 L101 113 L48 186 L96 222 L127 183 L124 383 Q200 403 276 383 L273 183 L304 222 L352 186 L299 113 L255 96 Q242 130 200 130 Q158 130 145 96Z";
    let print = '<text x="200" y="226" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="800" letter-spacing="3" fill="' + ink + '">OFFAXIS</text><path d="M154 240 H246" stroke="' + ink + '" stroke-width="2"/><text x="200" y="261" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="2" fill="' + ink + '">BORN TO SHIFT</text><path d="M200 284 L214 298 L200 312 L186 298Z" fill="#d7ff43" stroke="' + ink + '" stroke-width="1.5"/>';
    if (product.art === "kweyol") {
      print = '<text x="200" y="220" text-anchor="middle" font-size="24" font-weight="800" fill="' + ink + '">BONNE</text><text x="200" y="246" text-anchor="middle" font-size="24" font-weight="800" fill="' + ink + '">KWEYÒL</text><path d="M160 261 H240" stroke="' + ink + '" stroke-width="2"/><text x="200" y="280" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="2" fill="' + ink + '">758 · SAINT LUCIA</text>';
    } else if (product.art === "minimal") {
      print = '<circle cx="200" cy="230" r="19" fill="none" stroke="' + ink + '" stroke-width="2"/><path d="M207 211 L193 249" stroke="#9ab922" stroke-width="4"/><text x="200" y="278" text-anchor="middle" font-size="12" font-weight="800" letter-spacing="4" fill="' + ink + '">OFFAXIS</text>';
    } else if (product.art === "hoodie") {
      print = '<text x="200" y="222" text-anchor="middle" font-size="27" font-weight="800" fill="' + ink + '">O/</text><text x="200" y="250" text-anchor="middle" font-family="monospace" font-size="9" letter-spacing="2" fill="' + ink + '">HEAVY ON PERSPECTIVE</text>';
    } else if (product.art === "core") {
      print = '<text x="200" y="220" text-anchor="middle" font-size="20" font-weight="800" letter-spacing="2" fill="' + ink + '">OFF AXIS</text><path d="M152 235 H248" stroke="#d7ff43" stroke-width="3"/><text x="200" y="256" text-anchor="middle" font-family="monospace" font-size="8" fill="' + ink + '">MAKE YOUR OWN WAY</text>';
    } else if (product.art === "afterhours") {
      print = '<text x="200" y="221" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="2" fill="' + ink + '">AFTER</text><text x="200" y="248" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="2" fill="' + ink + '">HOURS</text><text x="200" y="279" text-anchor="middle" font-family="monospace" font-size="8" fill="' + ink + '">758 / 001</text>';
    }
    const neckline = hoodie
      ? '<path d="M154 100 Q153 48 200 42 Q247 48 246 100 L228 121 L172 121Z" fill="' + fill + '" stroke="' + ink + '" stroke-opacity=".3" stroke-width="2"/><path d="M174 87 Q180 60 200 58 Q220 60 226 87" fill="none" stroke="' + ink + '" stroke-opacity=".4" stroke-width="3"/>'
      : '<path d="M169 98 Q176 134 200 134 Q224 134 231 98" fill="none" stroke="' + ink + '" stroke-opacity=".36" stroke-width="9" stroke-linecap="round"/><path d="M170 98 Q178 126 200 126 Q222 126 230 98" fill="none" stroke="' + fill + '" stroke-width="4"/>';
    return '<svg class="product-art" viewBox="0 0 400 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of ' + escapeHTML(product.name) + ' in ' + escapeHTML((color || product.colors[0]).name) + '"><defs><filter id="shadow-' + product.id + '" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="9" flood-color="#32352a" flood-opacity=".18"/></filter><linearGradient id="fabric-' + product.id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".13"/></linearGradient></defs><g filter="url(#shadow-' + product.id + ')"><path d="' + body + '" fill="' + fill + '" stroke="' + ink + '" stroke-opacity=".2" stroke-width="1.5"/><path d="' + body + '" fill="url(#fabric-' + product.id + ')"/>' + neckline + print + '</g><text x="200" y="424" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="3" fill="#34372e" opacity=".62">OFFAXIS / 758</text></svg>';
  }

  function updateFilters() {
    $$(".filter-button").forEach(button => button.classList.toggle("active", button.dataset.filter === activeFilter));
  }

  function renderProducts() {
    const filtered = products.filter(product => {
      const matchesFilter = activeFilter === "all" || product.category === activeFilter;
      const haystack = [product.name, product.label, product.description, product.category].join(" ").toLowerCase();
      return matchesFilter && haystack.includes(searchTerm.trim().toLowerCase());
    });
    if (!filtered.length) {
      productGrid.innerHTML = '<div class="no-results"><h3>NO MATCHES IN THIS ROTATION.</h3><p>Try another search or explore all pieces.</p><button class="button button-dark" id="resetSearch">SHOW ALL PIECES ↗</button></div>';
      $("#resetSearch", productGrid).addEventListener("click", () => {
        activeFilter = "all"; searchTerm = ""; $("#productSearch").value = ""; updateFilters(); renderProducts();
      });
      return;
    }

    productGrid.innerHTML = filtered.map(product => {
      const scene = product.category === "hoodie" ? "#d8dacf" :
        ({ shift: "#dcdcd1", kweyol: "#e4ded0", minimal: "#d3d8cc", afterhours: "#cfd1c8" }[product.art] || "#dfded5");
      return '<article class="product-card" data-product-id="' + escapeHTML(product.id) + '">' +
        '<div class="product-art-wrap" style="background:' + scene + '">' +
        '<span class="product-label">' + escapeHTML(product.label) + '</span>' +
        (product.isNew ? '<span class="new-tag">NEW</span>' : '') +
        '<div class="art-slot">' + productArtwork(product, product.colors[0]) + '</div>' +
        '<button class="quick-add" type="button" data-add="' + escapeHTML(product.id) + '">ADD TO BAG <span>↗</span></button>' +
        '</div><div class="product-meta"><div class="product-name-row"><h3 class="product-name">' + escapeHTML(product.name) + '</h3><span class="product-price">' + money(product.price) + '</span></div>' +
        '<p class="product-description">' + escapeHTML(product.description) + '</p>' +
        '<div class="product-options"><div class="color-options" role="group" aria-label="Colour for ' + escapeHTML(product.name) + '">' +
        product.colors.map((color, index) => '<button type="button" class="color-choice" data-color-index="' + index + '" aria-label="' + escapeHTML(color.name) + '" aria-pressed="' + (index === 0) + '" title="' + escapeHTML(color.name) + '" style="--swatch:' + color.hex + '"></button>').join("") +
        '</div><label class="size-field"><span class="sr-only">Size for ' + escapeHTML(product.name) + '</span><select class="size-select" aria-label="Size for ' + escapeHTML(product.name) + '"><option value="">SELECT SIZE</option>' +
        product.sizes.map(size => '<option value="' + escapeHTML(size) + '">' + escapeHTML(size) + '</option>').join("") +
        '</select></label></div></div></article>';
    }).join("");

    $$(".product-card", productGrid).forEach(card => {
      const product = products.find(item => item.id === card.dataset.productId);
      let chosenColor = product.colors[0];
      const sizeSelect = $(".size-select", card);
      $$(".color-choice", card).forEach(button => button.addEventListener("click", () => {
        chosenColor = product.colors[Number(button.dataset.colorIndex)] || product.colors[0];
        $$(".color-choice", card).forEach(swatch => swatch.setAttribute("aria-pressed", String(swatch === button)));
        $(".art-slot", card).innerHTML = productArtwork(product, chosenColor);
      }));
      $$("[data-add]", card).forEach(button => button.addEventListener("click", () => {
        if (!sizeSelect.value) {
          sizeSelect.focus();
          showToast("Choose a size before adding this piece to your bag.");
          return;
        }
        const key = [product.id, chosenColor.name, sizeSelect.value].join("|");
        const existing = cart.find(item => item.key === key);
        if (existing) existing.qty = Math.min(99, existing.qty + 1);
        else cart.push({ key, id: product.id, colorName: chosenColor.name, colorHex: chosenColor.hex, size: sizeSelect.value, qty: 1 });
        saveCart(); renderCart(); showToast(product.name + " · " + sizeSelect.value + " added to your bag.");
      }));
    });
  }

  function renderCart() {
    const count = quantity();
    $("#bagCount").textContent = count;
    $("#drawerCount").textContent = "(" + count + ")";
    $("#cartSubtotal").textContent = money(subtotal());
    $("#checkoutSubtotal").textContent = money(subtotal());
    const empty = cart.length === 0;
    cartEmpty.classList.toggle("show", empty);
    cartEmpty.setAttribute("aria-hidden", String(!empty));
    cartItems.hidden = empty;
    drawerBottom.hidden = empty;
    if (empty) { cartItems.innerHTML = ""; return; }
    cartItems.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return "";
      return '<div class="cart-line" data-cart-key="' + escapeHTML(item.key) + '"><div class="cart-line-art">' +
        productArtwork(product, { name: item.colorName, hex: item.colorHex || product.colors[0].hex }) +
        '</div><div class="cart-line-main"><div class="cart-line-top"><h3 class="cart-line-name">' + escapeHTML(product.name) +
        '</h3><span class="cart-line-price">' + money(product.price * item.qty) + '</span></div><p class="cart-line-variant">' +
        escapeHTML(item.colorName) + ' / SIZE ' + escapeHTML(item.size) + '</p><div class="cart-line-controls"><div class="quantity-control">' +
        '<button type="button" data-qty="-1" aria-label="Decrease quantity">−</button><span>' + item.qty +
        '</span><button type="button" data-qty="1" aria-label="Increase quantity">+</button></div><button type="button" class="remove-item" data-remove>REMOVE</button></div></div></div>';
    }).join("");
    $$(".cart-line", cartItems).forEach(line => {
      const key = line.dataset.cartKey;
      $$(".cart-line [data-qty]", line).forEach(button => button.addEventListener("click", () => {
        const item = cart.find(row => row.key === key);
        if (!item) return;
        const next = item.qty + Number(button.dataset.qty);
        if (next < 1) cart = cart.filter(row => row.key !== key);
        else item.qty = Math.min(99, next);
        saveCart(); renderCart();
      }));
      $("[data-remove]", line).addEventListener("click", () => {
        cart = cart.filter(row => row.key !== key); saveCart(); renderCart();
      });
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function updateOverlay() {
    const open = cartDrawer.classList.contains("open") || checkoutModal.classList.contains("open");
    overlay.hidden = !open;
    requestAnimationFrame(() => overlay.classList.toggle("visible", open));
    document.body.classList.toggle("locked", open);
  }

  function openCart() {
    checkoutModal.classList.remove("open");
    checkoutModal.setAttribute("aria-hidden", "true");
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    updateOverlay();
    $("#closeCart").focus({ preventScroll: true });
  }
  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    updateOverlay();
  }
  function openCheckout() {
    if (!cart.length) { showToast("Your bag is empty — pick a piece first."); return; }
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    checkoutModal.classList.add("open");
    checkoutModal.setAttribute("aria-hidden", "false");
    $("#whatsappFallback").hidden = true;
    updateOverlay();
    $("input[name='customerName']").focus({ preventScroll: true });
  }
  function closeCheckout() {
    checkoutModal.classList.remove("open");
    checkoutModal.setAttribute("aria-hidden", "true");
    updateOverlay();
  }

  function buildOrderMessage(formData) {
    const lines = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return product ? "• " + product.name + " — " + item.colorName + ", size " + item.size + " × " + item.qty + " — " + money(product.price * item.qty) : "";
    }).filter(Boolean);
    const note = String(formData.get("notes") || "").trim();
    return [
      "Hello OffAxis! I'd like to place an order:", "", ...lines, "",
      "Items subtotal: " + money(subtotal()), "Delivery/collection fee: to be confirmed", "",
      "Name: " + String(formData.get("customerName") || "").trim(),
      "WhatsApp: " + String(formData.get("customerPhone") || "").trim(),
      "Area/town: " + String(formData.get("customerArea") || "").trim(),
      "Preference: " + String(formData.get("fulfilment") || ""),
      ...(note ? ["Note: " + note] : []), "",
      "Please confirm product availability, final total and payment details. Thanks!"
    ].join("\n");
  }

  $$(".filter-button").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter; updateFilters(); renderProducts();
  }));
  $("#productSearch").addEventListener("input", event => { searchTerm = event.target.value; renderProducts(); });
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#continueShopping").addEventListener("click", () => { closeCart(); $("#shop").scrollIntoView({ behavior: "smooth" }); });
  $("#checkoutButton").addEventListener("click", openCheckout);
  $("#closeCheckout").addEventListener("click", closeCheckout);
  overlay.addEventListener("click", () => { closeCart(); closeCheckout(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCart(); closeCheckout(); } });

  $("#checkoutForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!cart.length) { closeCheckout(); showToast("Your bag is empty — pick a piece first."); return; }
    lastWhatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildOrderMessage(new FormData(event.currentTarget)));
    $("#whatsappFallback").hidden = false;
    $("#openWhatsappFallback").href = lastWhatsappUrl;
    window.open(lastWhatsappUrl, "_blank", "noopener,noreferrer");
    showToast("WhatsApp order prepared. Send the message in WhatsApp to finish.");
  });

  const menuToggle = $("#menuToggle");
  const mobileNav = document.createElement("nav");
  mobileNav.className = "mobile-nav";
  mobileNav.setAttribute("aria-label", "Mobile navigation");
  mobileNav.hidden = true;
  mobileNav.innerHTML = '<a href="#shop">SHOP ↘</a><a href="#about">THE OFFAXIS MINDSET ↘</a><a href="#help">HELP / INFO ↘</a><a href="https://www.instagram.com/offaxis.758/" target="_blank" rel="noreferrer">INSTAGRAM ↗</a>';
  $(".site-header").appendChild(mobileNav);
  menuToggle.addEventListener("click", () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
  });
  $$("a", mobileNav).forEach(link => link.addEventListener("click", () => {
    mobileNav.hidden = true; menuToggle.setAttribute("aria-expanded", "false"); menuToggle.setAttribute("aria-label", "Open navigation");
  }));

  $("#year").textContent = new Date().getFullYear();
  renderProducts();
  renderCart();
})();