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
    // Use truthful placeholders until official product-photo URLs are supplied or indexed.
    // The homepage uses an embedded reel from the brand's public Instagram account.
    const chosenColor = color || product.colors[0];
    return '<div class="actual-photo-pending" role="img" aria-label="Official photo of ' + escapeHTML(product.name) + ' not yet available">' +
      '<span class="actual-photo-kicker">OFFAXIS / 758</span>' +
      '<strong>REAL<br>PIECES.<br>REAL PEOPLE.</strong>' +
      '<small>OFFICIAL PHOTOS NOT VERIFIED</small>' +
      '<a href="https://www.instagram.com/offaxis.758/" target="_blank" rel="noreferrer" aria-label="View real OffAxis products on Instagram">VIEW INSTAGRAM ↗</a>' +
      '</div>';
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