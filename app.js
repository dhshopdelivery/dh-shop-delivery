/* =========================================================
   DH SHOP & DELIVERY
   APP.JS
   ========================================================= */

const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

const CONFIG = {
  shopName: "DH Shop & Delivery",
  currency: "FCFA"
};


/* =========================================================
   ÉTAT DE LA BOUTIQUE
   ========================================================= */

let products = [];
let cart = [];

let shopSettings = {
  whatsapp_number: "22792617092",
  shop_name: "DH Shop & Delivery",
  currency: "FCFA"
};


/* =========================================================
   RÉCUPÉRATION DU PANIER
   ========================================================= */

try {
  cart = JSON.parse(localStorage.getItem("dhCart") || "[]");

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

const categoryCards =
  document.getElementById("categoryCards");

const cartBtn =
  document.getElementById("cartBtn");

const cartCount =
  document.getElementById("cartCount");

const drawer =
  document.getElementById("drawer");

const drawerBack =
  document.getElementById("drawerBack");

const closeCart =
  document.getElementById("closeCart");

const cartItems =
  document.getElementById("cartItems");

const cartTotal =
  document.getElementById("cartTotal");

const checkout =
  document.getElementById("checkout");

const modal =
  document.getElementById("modal");

const modalContent =
  document.getElementById("modalContent");

const year =
  document.getElementById("year");

const searchBtn =
  document.getElementById("searchBtn");

const searchPanel =
  document.getElementById("searchPanel");

const closeSearch =
  document.getElementById("closeSearch");

const trackingWhatsapp =
  document.getElementById("trackingWhatsapp");

const footerWhatsapp =
  document.getElementById("footerWhatsapp");

const emptyProducts =
  document.getElementById("emptyProducts");


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

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {

    let message = "Erreur Supabase";

    try {
      const data = await response.json();

      message =
        data.message ||
        data.error_description ||
        data.hint ||
        data.error ||
        message;

    } catch (error) {}

    throw new Error(message);
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}


/* =========================================================
   CHARGEMENT INITIAL
   ========================================================= */

async function init() {

  try {

    await loadSettings();

    await loadProducts();

    renderCategories();

    renderProducts();

    updateCart();

    setupWhatsApp();

  } catch (error) {

    console.error(error);

    if (grid) {

      grid.innerHTML = `
        <div class="loading">
          Impossible de charger les produits.
          <br><br>
          Vérifiez votre connexion puis actualisez la page.
        </div>
      `;
    }
  }
}


/* =========================================================
   PARAMÈTRES DE LA BOUTIQUE
   ========================================================= */

async function loadSettings() {

  try {

    const data = await api(
      "shop_settings?id=eq.1&select=*"
    );

    if (Array.isArray(data) && data.length) {

      shopSettings = {
        ...shopSettings,
        ...data[0]
      };
    }

  } catch (error) {

    console.warn(
      "Impossible de charger les paramètres :",
      error
    );
  }
}


/* =========================================================
   PRODUITS
   ========================================================= */

async function loadProducts() {

  const data = await api(
    "products?select=*&order=created_at.desc"
  );

  products = Array.isArray(data)
    ? data
    : [];

  products = products.filter(product => {

    if (product.available === false) {
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
}


/* =========================================================
   CATÉGORIES
   ========================================================= */

function renderCategories() {

  if (!categoryCards || !category) {
    return;
  }

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  /* -------------------------
     SELECT
     ------------------------- */

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


  /* -------------------------
     CARTES CATÉGORIES
     ------------------------- */

  categoryCards.innerHTML = "";


  const allCard =
    document.createElement("button");

  allCard.className = "category-card";

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

  allCard.addEventListener("click", () => {

    category.value = "all";

    renderProducts();

    document
      .getElementById("boutique")
      ?.scrollIntoView({
        behavior: "smooth"
      });
  });

  categoryCards.appendChild(allCard);


  /* -------------------------
     CATÉGORIES RÉELLES
     ------------------------- */

  categories.forEach(cat => {

    const card =
      document.createElement("button");

    card.className =
      "category-card";

    card.type = "button";

    const product =
      products.find(
        p => p.category === cat
      );

    const image =
      getProductImage(product);

    card.innerHTML = `
      <div class="category-image">

        ${
          image
            ? `<img
                 src="${escapeAttribute(image)}"
                 alt="${escapeAttribute(formatCategory(cat))}"
                 style="width:100%;height:100%;object-fit:cover;"
               >`
            : `<span>${escapeHtml(
                getCategoryInitial(cat)
              )}</span>`
        }

      </div>

      <strong>
        ${escapeHtml(formatCategory(cat))}
      </strong>

      <small>
        Découvrir →
      </small>
    `;


    card.addEventListener("click", () => {

      category.value = cat;

      renderProducts();

      document
        .getElementById("boutique")
        ?.scrollIntoView({
          behavior: "smooth"
        });
    });


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


      const text =
        `
          ${product.name || ""}
          ${product.description || ""}
          ${product.category || ""}
        `.toLowerCase();


      const searchMatch =
        !searchTerm ||
        text.includes(searchTerm);


      return categoryMatch &&
             searchMatch;
    });


  if (!filtered.length) {

    grid.innerHTML = "";

    if (emptyProducts) {
      emptyProducts.classList.remove("hidden");
    }

    return;
  }


  if (emptyProducts) {
    emptyProducts.classList.add("hidden");
  }


  grid.innerHTML =
    filtered
      .map(product => createProductCard(product))
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
      data-id="${product.id}">

      <div class="product-image">

        ${badge}

        ${
          image
            ? `
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(product.name || "Produit DH")}"
                loading="lazy"
              >
            `
            : `
              <div
                style="
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
            data-id="${product.id}">
            Détails
          </button>


          <button
            type="button"
            class="add-btn"
            data-id="${product.id}">
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

          const id =
            button.dataset.id;

          addToCart(id);
        }
      );
    });


  document
    .querySelectorAll(".details-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          openProduct(id);
        }
      );
    });
}


/* =========================================================
   RECHERCHE
   ========================================================= */

function getSearchTerm() {

  const mobileValue =
    search?.value?.trim().toLowerCase() || "";

  const desktopValue =
    desktopSearch?.value?.trim().toLowerCase() || "";

  return desktopValue || mobileValue;
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

      searchPanel.style.display =
        searchPanel.style.display === "block"
          ? "none"
          : "block";


      if (
        searchPanel.style.display === "block" &&
        search
      ) {
        setTimeout(() => {
          search.focus();
        }, 100);
      }
    }
  );
}


if (closeSearch) {

  closeSearch.addEventListener(
    "click",
    () => {

      if (searchPanel) {
        searchPanel.style.display = "none";
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
      p => String(p.id) === String(id)
    );


  if (!product) {
    return;
  }


  const existing =
    cart.find(
      item => String(item.id) === String(id)
    );


  if (existing) {

    const maxStock =
      Number(product.stock);

    if (
      maxStock > 0 &&
      existing.qty >= maxStock
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
      product =>
        String(product.id) === String(id)
    );


  if (!item) {
    return;
  }


  const product =
    products.find(
      p => String(p.id) === String(id)
    );


  item.qty += change;


  if (
    product &&
    Number(product.stock) > 0 &&
    item.qty > Number(product.stock)
  ) {
    item.qty = Number(product.stock);
  }


  if (item.qty <= 0) {

    cart =
      cart.filter(
        product =>
          String(product.id) !== String(id)
      );
  }


  saveCart();

  updateCart();
}


function removeItem(id) {

  cart =
    cart.filter(
      item =>
        String(item.id) !== String(id)
    );

  saveCart();

  updateCart();
}


function updateCart() {

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total + Number(item.qty || 0),
      0
    );


  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }


  if (!cartItems) {
    return;
  }


  if (!cart.length) {

    cartItems.innerHTML = `
      <div
        style="
          padding:50px 10px;
          text-align:center;
          color:#888;
        ">

        <div style="font-size:45px;">
          🛍️
        </div>

        <h3>
          Votre panier est vide
        </h3>

        <p>
          Ajoutez des produits pour commencer.
        </p>

      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent =
        "0 FCFA";
    }

    return;
  }


  let total = 0;


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
          price * Number(item.qty);


        total += subtotal;


        const image =
          getProductImage(product);


        return `
          <div
            style="
              display:flex;
              gap:12px;
              padding:13px 0;
              border-bottom:1px solid #eee;
            ">

            <div
              style="
                width:70px;
                height:70px;
                flex-shrink:0;
                border-radius:10px;
                overflow:hidden;
                background:#f2f2f2;
              ">

              ${
                image
                  ? `
                    <img
                      src="${escapeAttribute(image)}"
                      alt=""
                      style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                      "
                    >
                  `
                  : `
                    <div
                      style="
                        height:100%;
                        display:grid;
                        place-items:center;
                        background:#111;
                        color:#d4af37;
                        font-weight:900;
                      ">
                      DH
                    </div>
                  `
              }

            </div>


            <div style="flex:1;">

              <strong>
                ${escapeHtml(product.name)}
              </strong>

              <div
                style="
                  margin-top:4px;
                  color:#777;
                  font-size:12px;
                ">
                ${formatPrice(price)}
              </div>


              <div
                style="
                  margin-top:9px;
                  display:flex;
                  align-items:center;
                  gap:8px;
                ">

                <button
                  type="button"
                  onclick="changeQty('${product.id}',-1)"
                  style="
                    width:30px;
                    height:30px;
                    border:1px solid #ddd;
                    background:#fff;
                    border-radius:5px;
                  ">
                  −
                </button>


                <b>
                  ${item.qty}
                </b>


                <button
                  type="button"
                  onclick="changeQty('${product.id}',1)"
                  style="
                    width:30px;
                    height:30px;
                    border:1px solid #ddd;
                    background:#fff;
                    border-radius:5px;
                  ">
                  +
                </button>


                <button
                  type="button"
                  onclick="removeItem('${product.id}')"
                  style="
                    margin-left:auto;
                    border:0;
                    background:transparent;
                    color:#c33;
                    font-size:12px;
                  ">
                  Supprimer
                </button>

              </div>

            </div>

          </div>
        `;
      })
      .join("");


  if (cartTotal) {

    cartTotal.textContent =
      formatPrice(total);
  }
}


/* =========================================================
   OUVERTURE PANIER
   ========================================================= */

function openCart() {

  if (drawer) {
    drawer.classList.add("open");
  }

  if (drawerBack) {
    drawerBack.classList.remove("hidden");
  }

  document.body.style.overflow =
    "hidden";
}


function closeCartDrawer() {

  if (d
init();
