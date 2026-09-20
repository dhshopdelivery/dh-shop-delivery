/* =========================================================
   DH SHOP & DELIVERY
   APP.JS — VERSION STABLE
   ========================================================= */

const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

const CONFIG = {
  shopName: "DH Shop & Delivery",
  currency: "FCFA",
  whatsappNumber: "22792617092"
};


/* =========================================================
   ÉTAT
   ========================================================= */

let products = [];
let cart = [];

let shopSettings = {
  whatsapp_number: CONFIG.whatsappNumber,
  shop_name: CONFIG.shopName,
  currency: CONFIG.currency
};


/* =========================================================
   PANIER LOCAL
   ========================================================= */

try {
  const savedCart = localStorage.getItem("dhCart");
  cart = savedCart ? JSON.parse(savedCart) : [];

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch (error) {
  cart = [];
}


/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const grid = document.getElementById("grid");
const category = document.getElementById("category");
const search = document.getElementById("search");
const desktopSearch = document.getElementById("desktopSearch");

const categoryCards = document.getElementById("categoryCards");

const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");

const drawer = document.getElementById("drawer");
const drawerBack = document.getElementById("drawerBack");
const closeCart = document.getElementById("closeCart");

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const checkout = document.getElementById("checkout");

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

const year = document.getElementById("year");

const searchBtn = document.getElementById("searchBtn");
const searchPanel = document.getElementById("searchPanel");
const closeSearch = document.getElementById("closeSearch");

const trackingWhatsapp = document.getElementById("trackingWhatsapp");
const footerWhatsapp = document.getElementById("footerWhatsapp");

const emptyProducts = document.getElementById("emptyProducts");


/* =========================================================
   ANNÉE
   ========================================================= */

if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================================================
   API SUPABASE
   ========================================================= */

async function api(endpoint, options = {}) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${endpoint}`,
      {
        ...options,

        signal: controller.signal,

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      }
    );

    const text = await response.text();

    if (!response.ok) {

      let message = text;

      try {
        const data = JSON.parse(text);

        message =
          data.message ||
          data.error_description ||
          data.details ||
          data.hint ||
          text;

      } catch (error) {
        // réponse non JSON
      }

      throw new Error(
        `Supabase ${response.status}: ${message}`
      );
    }

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "Supabase ne répond pas. Vérifie la connexion internet."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================================
   CHARGEMENT INITIAL
   ========================================================= */

async function init() {

  console.log("DH Shop : démarrage...");

  /*
   * IMPORTANT :
   * Les produits sont chargés indépendamment
   * des paramètres de la boutique.
   */

  try {

    await loadProducts();

  } catch (error) {

    console.error(
      "Erreur produits :",
      error
    );

    showProductsError(error);

  }


  /*
   * Les paramètres ne doivent jamais empêcher
   * les produits de s'afficher.
   */

  try {

    await loadSettings();

  } catch (error) {

    console.warn(
      "Paramètres non chargés :",
      error
    );

  }


  renderCategories();
  renderProducts();

  updateCart();

  setupWhatsApp();

  setupEvents();

  console.log(
    "DH Shop : initialisation terminée."
  );
}


/* =========================================================
   PARAMÈTRES BOUTIQUE
   ========================================================= */

async function loadSettings() {

  const data = await api(
    "shop_settings?id=eq.1&select=*"
  );

  if (
    Array.isArray(data) &&
    data.length > 0
  ) {

    shopSettings = {
      ...shopSettings,
      ...data[0]
    };

  }

  console.log(
    "Paramètres boutique :",
    shopSettings
  );
}


/* =========================================================
   PRODUITS
   ========================================================= */

async function loadProducts() {

  console.log(
    "DH Shop : chargement des produits..."
  );

  const data = await api(
    "products?select=*&order=created_at.desc"
  );

  if (!Array.isArray(data)) {

    throw new Error(
      "La réponse de Supabase n'est pas une liste de produits."
    );

  }

  products = data.filter(product => {

    if (
      product.available === false
    ) {
      return false;
    }

    if (
      product.stock !== null &&
      product.stock !== undefined &&
      Number(product.stock) <= 0
    ) {
      return false;
    }

    return true;
  });

  console.log(
    "DH Shop : produits reçus :",
    products
  );

  if (products.length === 0) {

    if (grid) {
      grid.innerHTML = `
        <div class="loading" style="
          grid-column:1/-1;
          padding:40px 20px;
          text-align:center;
          color:#777;
        ">
          Aucun produit disponible pour le moment.
        </div>
      `;
    }

  }

}


/* =========================================================
   ERREUR PRODUITS
   ========================================================= */

function showProductsError(error) {

  if (!grid) {
    return;
  }

  grid.innerHTML = `
    <div style="
      grid-column:1/-1;
      padding:30px 20px;
      text-align:center;
      background:#fff;
      border:1px solid #ddd;
      border-radius:12px;
    ">

      <div style="
        font-size:38px;
        margin-bottom:12px;
      ">
        ⚠️
      </div>

      <h3 style="
        margin:0 0 10px;
      ">
        Impossible de charger les produits
      </h3>

      <p style="
        margin:0 0 15px;
        color:#777;
      ">
        ${escapeHtml(error?.message || "Erreur inconnue")}
      </p>

      <button
        type="button"
        onclick="location.reload()"
        style="
          padding:12px 18px;
          border:0;
          border-radius:8px;
          background:#111;
          color:#fff;
          font-weight:700;
        "
      >
        Réessayer
      </button>

    </div>
  `;

}


/* =========================================================
   CATÉGORIES
   ========================================================= */

function renderCategories() {

  if (!category) {
    return;
  }

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];


  category.innerHTML = `
    <option value="all">
      Toutes les catégories
    </option>
  `;


  categories.forEach(cat => {

    const option =
      document.createElement("option");

    option.value = cat;

    option.textContent =
      formatCategory(cat);

    category.appendChild(option);

  });


  if (!categoryCards) {
    return;
  }


  categoryCards.innerHTML = "";


  const allCard =
    document.createElement("button");

  allCard.className =
    "category-card";

  allCard.type = "button";

  allCard.innerHTML = `
    <div class="category-image category-all">
      <span>DH</span>
    </div>

    <strong>
      Tous les produits
    </strong>

    <small>
      Découvrir →
    </small>
  `;

  allCard.addEventListener(
    "click",
    () => {

      if (category) {
        category.value = "all";
      }

      renderProducts();

      document
        .getElementById("boutique")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

  categoryCards.appendChild(allCard);


  categories.forEach(cat => {

    const card =
      document.createElement("button");

    card.className =
      "category-card";

    card.type = "button";


    const product =
      products.find(
        item => item.category === cat
      );


    const image =
      getProductImage(product);


    card.innerHTML = `

      <div class="category-image">

        ${
          image
            ? `
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(formatCategory(cat))}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                "
              >
            `
            : `
              <span>
                ${escapeHtml(
                  getCategoryInitial(cat)
                )}
              </span>
            `
        }

      </div>

      <strong>
        ${escapeHtml(formatCategory(cat))}
      </strong>

      <small>
        Découvrir →
      </small>
    `;


    card.addEventListener(
      "click",
      () => {

        if (category) {
          category.value = cat;
        }

        renderProducts();

        document
          .getElementById("boutique")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );


    categoryCards.appendChild(card);

  });

}


/* =========================================================
   AFFICHAGE PRODUITS
   ========================================================= */

function renderProducts() {

  if (!grid) {
    return;
  }


  const selectedCategory =
    category?.value || "all";


  const searchTerm =
    getSearchTerm();


  const filtered =
    products.filter(product => {

      const categoryMatch =
        selectedCategory === "all" ||
        product.category === selectedCategory;


      const text = `
        ${product.name || ""}
        ${product.description || ""}
        ${product.category || ""}
      `.toLowerCase();


      const searchMatch =
        !searchTerm ||
        text.includes(searchTerm);


      return (
        categoryMatch &&
        searchMatch
      );

    });


  if (filtered.length === 0) {

    grid.innerHTML = "";

    if (emptyProducts) {
      emptyProducts.classList.remove(
        "hidden"
      );
    }

    return;
  }


  if (emptyProducts) {
    emptyProducts.classList.add(
      "hidden"
    );
  }


  grid.innerHTML =
    filtered
      .map(createProductCard)
      .join("");


  attachProductEvents();

}


/* =========================================================
   CARTE PRODUIT
   ========================================================= */

function createProductCard(product) {

  const image =
    getProductImage(product);


  const badge =
    product.badge
      ? `
        <span class="product-badge">
          ${escapeHtml(product.badge)}
        </span>
      `
      : "";


  return `

    <article
      class="product-card"
      data-id="${escapeAttribute(product.id)}"
    >

      <div class="product-image">

        ${badge}

        ${
          image
            ? `
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(
                  product.name || "Produit DH"
                )}"
                loading="lazy"
              >
            `
            : `
              <div style="
                width:100%;
                height:100%;
                display:grid;
                place-items:center;
                background:#111;
                color:#d4af37;
                font-size:42px;
                font-weight:900;
              ">
                DH
              </div>
            `
        }

      </div>


      <div class="product-info">

        <div class="product-category">
          ${escapeHtml(
            formatCategory(product.category)
          )}
        </div>


        <h3>
          ${escapeHtml(
            product.name || "Produit DH"
          )}
        </h3>


        ${
          product.description
            ? `
              <p>
                ${escapeHtml(
                  product.description
                )}
              </p>
            `
            : ""
        }


        <div class="product-price">
          ${formatPrice(product.price)}
        </div>


        <div class="product-actions">

          <button
            type="button"
            class="details-btn"
            data-id="${escapeAttribute(product.id)}"
          >
            Détails
          </button>


          <button
            type="button"
            class="add-btn"
            data-id="${escapeAttribute(product.id)}"
          >
            Ajouter
          </button>

        </div>

      </div>

    </article>

  `;
}


/* =========================================================
   ÉVÉNEMENTS PRODUITS
   ========================================================= */

function attachProductEvents() {

  document
    .querySelectorAll(".add-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          addToCart(
            button.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(".details-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openProduct(
            button.dataset.id
          );

        }
      );

    });

}


/* =========================================================
   RECHERCHE
   ========================================================= */

function getSearchTerm() {

  const mobileValue =
    search?.value
      ?.trim()
      .toLowerCase() || "";


  const desktopValue =
    desktopSearch?.value
      ?.trim()
      .toLowerCase() || "";


  return mobileValue || desktopValue;

}


function syncSearch(value) {

  if (search) {
    search.value = value;
  }

  if (desktopSearch) {
    desktopSearch.value = value;
  }

  renderProducts();

}


if (search) {

  search.addEventListener(
    "input",
    () => {
      syncSearch(search.value);
    }
  );

}


if (desktopSearch) {

  desktopSearch.addEventListener(
    "input",
    () => {
      syncSearch(desktopSearch.value);
    }
  );

}


if (category) {

  category.addEventListener(
    "change",
    renderProducts
  );

}


/* =========================================================
   PANNEAU RECHERCHE
   ========================================================= */

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      if (!searchPanel) {
        return;
      }

      const visible =
        searchPanel.style.display === "block";


      searchPanel.style.display =
        visible ? "none" : "block";


      if (!visible && search) {

        setTimeout(
          () => search.focus(),
          100
        );

      }

    }
  );

}


if (closeSearch) {

  closeSearch.addEventListener(
    "click",
    () => {

      if (searchPanel) {
        searchPanel.style.display =
          "none";
      }

    }
  );

}


/* =========================================================
   PANIER
   ========================================================= */

function saveCart() {

  localStorage.setItem(
    "dhCart",
    JSON.stringify(cart)
  );

}


function addToCart(id) {

  const product =
    products.find(
      p =>
        String(p.id) ===
        String(id)
    );


  if (!product) {
    return;
  }


  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );


  const stock =
    Number(product.stock);


  if (existing) {

    if (
      stock > 0 &&
      existing.qty >= stock
    ) {

      alert(
        "Vous avez atteint la quantité disponible."
      );

      return;
    }

    existing.qty += 1;

  } else {

    cart.push({
      id: product.id,
      qty: 1
    });

  }


  saveCart();
  updateCart();
  openCart();

}


function changeQty(id, change) {

  const item =
    cart.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!item) {
    return;
  }


  const product =
    products.find(
      p =>
        String(p.id) ===
        String(id)
    );


  if (!product) {
    return;
  }


  item.qty += Number(change);


  const stock =
    Number(product.stock);


  if (
    stock > 0 &&
    item.qty > stock
  ) {

    item.qty = stock;

  }


  if (item.qty <= 0) {

    cart =
      cart.filter(
        item =>
          String(item.id) !==
          String(id)
      );

  }


  saveCart();
  updateCart();

}


function removeItem(id) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  saveCart();
  updateCart();

}


/* =========================================================
   MISE À JOUR PANIER
   ========================================================= */

function updateCart() {

  let totalQuantity = 0;
  let total = 0;


  cart.forEach(item => {

    const product =
      products.find(
        p =>
          String(p.id) ===
          String(item.id)
      );


    if (!product) {
      return;
    }


    const qty =
      Number(item.qty) || 0;


    const price =
      Number(product.price) || 0;


    totalQuantity += qty;

    total +=
      price * qty;

  });


  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }


  if (cartTotal) {

    cartTotal.textContent =
      formatPrice(total);

  }


  if (!cartItems) {
    return;
  }


  if (cart.length === 0) {

    cartItems.innerHTML = `
      <div style="
        padding:50px 10px;
        text-align:center;
        color:#888;
      ">

        <div style="
          font-size:45px;
          margin-bottom:12px;
        ">
          🛒
        </div>

        <h3>
          Votre panier est vide
        </h3>

        <p>
          Ajoutez des produits pour commencer.
        </p>

      </div>
    `;

    return;
  }


  cartItems.innerHTML =
    cart
      .map(item => {

        const product =
          products.find(
            p =>
              String(p.id) ===
              String(item.id)
          );


        if (!product) {
          return "";
        }


        const price =
          Number(product.price) || 0;


        const subtotal =
          price *
          Number(item.qty);


        const image =
          getProductImage(product);


        return `

          <div style="
            display:flex;
            gap:12px;
            padding:12px 0;
            border-bottom:1px solid #eee;
          ">

            <div style="
              width:70px;
              height:70px;
              flex-shrink:0;
              overflow:hidden;
              border-radius:10px;
              background:#111;
            ">

              ${
                image
                  ? `
                    <img
                      src="${escapeAttribute(image)}"
                     
