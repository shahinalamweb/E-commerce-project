// ========== js/data.js ==========
// Product catalog
const productDatabase = [
  { id: 1, name: "Organic Cotton Tee", category: "clothing", price: 34.99, image: "images/tshirt.jpg"   },
  { id: 2, name: "Slim Fit Chinos", category: "clothing", price: 59.99, image: "images/paint.jpg", description: "Classic stretch comfort." },
  { id: 3, name: "Weekender Backpack", category: "accessories", price: 79.99, image:"images/bag.jpg", description: "Water-resistant & spacious." },
  { id: 4, name: "Leather Card Holder", category: "accessories", price: 29.99, image:"images/card holder.jpg", description: "Minimalist genuine leather." },
  { id: 5, name: "Urban Runners", category: "shoes", price: 89.99, image:"images/shoe.jpg", description: "Lightweight cushioned sole." },
  { id: 6, name: "Chelsea Boots", category: "shoes", price: 119.99, image:"images/boot.jpg", description: "Classic silhouette, durable grip." },
  { id: 7, name: "Merino Wool Sweater", category: "clothing", price: 84.99, image:"images/sweater.jpg", description: "Warm & moisture-wicking." },
  { id: 8, name: "Smart Watch Strap", category: "accessories", price: 24.99, image:"images/watch.jpg", description: "Silicone, quick release." }
];

// Currency settings
let currentCurrency = 'USD';
const exchangeRates = {
  USD: 1,
  BDT: 120 // Approximate exchange rate: 1 USD = 120 BDT
};

function getCurrencySymbol(currency) {
  return currency === 'BDT' ? '৳' : '$';
}

function convertPrice(price, fromCurrency = 'USD', toCurrency = currentCurrency) {
  const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
  return price * rate;
}

function formatPrice(price) {
  const converted = convertPrice(price);
  const symbol = getCurrencySymbol(currentCurrency);
  return `${symbol}${converted.toFixed(2)}`;
}

// Load currency from localStorage
function loadCurrency() {
  const stored = localStorage.getItem("urbanCurrency");
  if (stored && (stored === 'USD' || stored === 'BDT')) {
    currentCurrency = stored;
  }
}

// Save currency to localStorage
function persistCurrency() {
  localStorage.setItem("urbanCurrency", currentCurrency);
}

// Helper to get all products
function getAllProducts() {
  return [...productDatabase];
}

// ========== js/cart.js ==========
// Cart state management (Singleton pattern)
let cartItems = []; // each item: { id, name, price, quantity, emoji }

// Load cart from localStorage
function loadCartFromStorage() {
  const stored = localStorage.getItem("urbanCart");
  if (stored) {
    try {
      cartItems = JSON.parse(stored);
    } catch(e) { cartItems = []; }
  } else {
    cartItems = [];
  }
}

// Save cart to localStorage
function persistCart() {
  localStorage.setItem("urbanCart", JSON.stringify(cartItems));
}

// Add product to cart
function addToCart(productId, productName, productPrice, productEmoji = "📦") {
  const existing = cartItems.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({
      id: productId,
      name: productName,
      price: productPrice,
      quantity: 1,
      emoji: productEmoji
    });
  }
  persistCart();
  updateCartUI();
  showToast(`➕ ${productName} added to cart`);
}

// Remove item entirely
function removeCartItem(productId) {
  const item = cartItems.find(i => i.id === productId);
  if (item) {
    showToast(`❌ Removed ${item.name}`);
  }
  cartItems = cartItems.filter(item => item.id !== productId);
  persistCart();
  updateCartUI();
}

// Update quantity (+1 / -1)
function updateQuantity(productId, delta) {
  const index = cartItems.findIndex(item => item.id === productId);
  if (index !== -1) {
    const newQty = cartItems[index].quantity + delta;
    if (newQty <= 0) {
      cartItems.splice(index, 1);
    } else {
      cartItems[index].quantity = newQty;
    }
    persistCart();
    updateCartUI();
  }
}

// Get total items count
function getTotalCartItems() {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

// Calculate total price
function getCartTotal() {
  return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Render cart sidebar content
function renderCartSidebar() {
  const container = document.getElementById("cartItemsList");
  const totalSpan = document.getElementById("cartTotalPrice");
  if (!container) return;
  
  if (cartItems.length === 0) {
    container.innerHTML = '<div class="empty-cart-msg">Your cart is empty.<br>✨ Add some style!</div>';
    if (totalSpan) totalSpan.innerText = `${getCurrencySymbol(currentCurrency)}0.00`;
    return;
  }
  
  let html = "";
  cartItems.forEach(item => {
    html += `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.emoji || "📦"} ${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1">-</button>
          <span class="cart-item-qty">${item.quantity}</span>
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="1">+</button>
          <button class="remove-item" data-id="${item.id}" title="Remove">🗑️</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
  if (totalSpan) totalSpan.innerText = formatPrice(getCartTotal());
  
  // attach event listeners to dynamic buttons
  document.querySelectorAll(".cart-qty-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const delta = parseInt(btn.dataset.delta);
      updateQuantity(id, delta);
    });
  });
  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      removeCartItem(id);
    });
  });
}

// Update cart count badge & sidebar total & product grid dynamic buttons (if needed)
function updateCartUI() {
  const countSpan = document.getElementById("cartCount");
  if (countSpan) countSpan.innerText = getTotalCartItems();
  renderCartSidebar();
  // also refresh any product-grid to reflect "Added" style? We'll just sync.
  refreshProductGridButtons(); // optional but improves UX
}

// Helper: reflect cart quantities on "Add to cart" buttons (text)
function refreshProductGridButtons() {
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    const prodId = parseInt(btn.getAttribute("data-id"));
    const inCart = cartItems.some(item => item.id === prodId);
    if (inCart) {
      btn.textContent = "✓ In Cart";
      btn.style.background = "#e2e8e4";
    } else {
      btn.textContent = "Add to Cart";
      btn.style.background = "";
    }
  });
}

// Toast
function showToast(message, duration = 2000) {
  const toast = document.getElementById("toastMsg");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// checkout simulation
function checkout() {
  if (cartItems.length === 0) {
    showToast("Your cart is empty. Add items first!");
    return;
  }
  showToast(`🎉 Order placed! Total ${formatPrice(getCartTotal())}. Thank you!`);
  cartItems = [];
  persistCart();
  updateCartUI();
  closeCartSidebar();
}

// Cart Sidebar DOM controls
function openCartSidebar() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("active");
}

function closeCartSidebar() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
}

// ========== js/main.js ==========
// Global variables
let currentFilter = "all";

// Helper render products based on filter (for shop)
function renderShopProducts(filter = currentFilter) {
  const shopGrid = document.getElementById("shop-product-grid");
  if (!shopGrid) return;
  let products = getAllProducts();
  if (filter !== "all") {
    products = products.filter(p => p.category === filter);
  }
  shopGrid.innerHTML = generateProductCards(products);
  attachProductCardEvents();
  refreshProductGridButtons();
}

function generateProductCards(products) {
  return products.map(prod => `
    <div class="product-card" data-id="${prod.id}">
      <div class="product-img">${prod.image ? `<img src="${prod.image}" alt="${prod.name}">` : prod.emoji}</div>
      <div class="product-info">
        <div class="product-title">${prod.name}</div>
        <div class="product-category">${prod.category}</div>
        <div class="product-price">${formatPrice(prod.price)}</div>
        <button class="add-to-cart" data-id="${prod.id}" data-name="${prod.name}" data-price="${prod.price}" data-emoji="${prod.emoji}">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

function attachProductCardEvents() {
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.removeEventListener("click", handleAddToCart);
    btn.addEventListener("click", handleAddToCart);
  });
}

function handleAddToCart(e) {
  const btn = e.currentTarget;
  const id = parseInt(btn.getAttribute("data-id"));
  const name = btn.getAttribute("data-name");
  const price = parseFloat(btn.getAttribute("data-price"));
  const emoji = btn.getAttribute("data-emoji") || "🛍️";
  addToCart(id, name, price, emoji);
}

// Render home preview (first 4 products)
function renderHomePreview() {
  const homePreviewGrid = document.getElementById("home-preview-grid");
  if (!homePreviewGrid) return;
  const previewProducts = getAllProducts().slice(0, 4);
  homePreviewGrid.innerHTML = generateProductCards(previewProducts);
  attachProductCardEvents();
  refreshProductGridButtons();
}

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  // Initialize modules
  loadCartFromStorage();
  loadCurrency();
  updateCartUI();
  
  // Set currency selector
  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.value = currentCurrency;
    currencySelector.addEventListener("change", (e) => {
      currentCurrency = e.target.value;
      persistCurrency();
      // Re-render all price displays
      renderHomePreview();
      renderShopProducts(currentFilter);
      updateCartUI();
    });
  }
  
  // DOM Elements
  const homeSection = document.getElementById("home-section");
  const shopSection = document.getElementById("shop-section");
  const aboutSection = document.getElementById("about-section");
  const navLinks = document.querySelectorAll(".nav-link");
  const filterBtns = document.querySelectorAll(".filter-btn");
  
  // Navigation logic
  function setActiveSection(sectionId) {
    homeSection.classList.remove("active-section");
    shopSection.classList.remove("active-section");
    aboutSection.classList.remove("active-section");
    if (sectionId === "home") homeSection.classList.add("active-section");
    if (sectionId === "shop") shopSection.classList.add("active-section");
    if (sectionId === "about") aboutSection.classList.add("active-section");
    
    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === sectionId) {
        link.classList.add("active");
      }
    });
    // extra: if shop section active, re-render products to sync filter
    if (sectionId === "shop") {
      renderShopProducts(currentFilter);
    }
    if (sectionId === "home") {
      renderHomePreview(); // ensure preview fresh
    }
  }
  
  // Event listeners for nav
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      if (section === "home") setActiveSection("home");
      else if (section === "shop") setActiveSection("shop");
      else if (section === "about") setActiveSection("about");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  
  // shop now hero button
  const shopHeroBtn = document.querySelector(".shop-now-hero");
  if (shopHeroBtn) {
    shopHeroBtn.addEventListener("click", () => {
      setActiveSection("shop");
    });
  }
  
  // filter logic
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active-filter"));
      btn.classList.add("active-filter");
      currentFilter = btn.getAttribute("data-filter");
      renderShopProducts(currentFilter);
    });
  });
  
  // Cart sidebar triggers
  const cartToggle = document.getElementById("cartToggleBtn");
  const closeCart = document.getElementById("closeCartBtn");
  const overlay = document.getElementById("cartOverlay");
  const checkoutBtn = document.getElementById("checkoutBtn");
  
  if (cartToggle) cartToggle.addEventListener("click", openCartSidebar);
  if (closeCart) closeCart.addEventListener("click", closeCartSidebar);
  if (overlay) overlay.addEventListener("click", closeCartSidebar);
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => { checkout(); closeCartSidebar(); });
  
  // also manual refresh if needed, and load initial
  renderHomePreview();
  renderShopProducts("all");
  setActiveSection("home");
  
  // ensure cart sidebar buttons re-render after any cart modification (already in updateCartUI)
  window.updateCartUIExternal = updateCartUI;
});