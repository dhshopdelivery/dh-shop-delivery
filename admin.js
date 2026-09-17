/* =========================================================
   DH SHOP & DELIVERY — ADMIN
   Gestion produits + commandes
   ========================================================= */

const SUPABASE_URL =
  "https://ocmvthymdjkrhmdyieim.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

let accessToken = "";
let editingProductId = null;
let allOrders = [];


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");

const productsList =
  document.getElementById("productsList");

const addProductBtn =
  document.getElementById("addProductBtn");

const productFormCard =
  document.getElementById("productFormCard");

const productFormTitle =
  document.getElementById("productFormTitle");

const productName =
  document.getElementById("productName");

const productCategory =
  document.getElementById("productCategory");

const productPrice =
  document.getElementById("productPrice");

const productStock =
  document.getElementById("productStock");

const productImage =
  document.getElementById("productImage");

const productBadge =
  document.getElementById("productBadge");

const productDescription =
  document.getElementById("productDescription");

const productAvailable =
  document.getElementById("productAvailable");

const saveProductBtn =
  document.getElementById("saveProductBtn");

const cancelProductBtn =
  document.getElementById("cancelProductBtn");

const productMessage =
  document.getElementById("productMessage");

const refreshOrdersBtn =
  document.getElementById("refreshOrdersBtn");

const orderStatusFilter =
  document.getElementById("orderStatusFilter");

const ordersList =
  document.getElementById("ordersList");


/* =========================================================
   OUTILS
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatPrice(value) {
  return Number(value || 0)
    .toLocaleString("fr-FR") + " FCFA";
}


function showMessage(element, text, error = false) {

  if (!element) return;

  element.textContent = text;

  element.style.color =
    error ? "#b00020" : "#16803c";
}


/* =========================================================
   API SUPABASE
   ========================================================= */

async function api(endpoint, options = {}) {

  const headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    ...options.headers
  };

  if (accessToken) {
    headers["Authorization"] =
      "Bearer " + accessToken;
  }

  const response = await fetch(
    SUPABASE_URL +
    "/rest/v1/" +
    endpoint,
    {
      ...options,
      headers
    }
  );

  const text =
    await response.text();

  if (!response.ok) {

    throw new Error(
      text ||
      "Erreur Supabase HTTP " +
      response.status
    );
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


/* =========================================================
   CONNEXION
   ========================================================= */

async function login() {

  const emailInput =
    document.getElementById("email");

  const passwordInput =
    document.getElementById("password");

  const email =
    emailInput
      ? emailInput.value.trim()
      : "";

  const password =
    passwordInput
      ? passwordInput.value
      : "";


  if (!email || !password) {

    showMessage(
      loginMessage,
      "Entre ton email et ton mot de passe.",
      true
    );

    return;
  }


  loginBtn.disabled = true;
  loginBtn.textContent = "Connexion...";


  showMessage(
    loginMessage,
    "Connexion en cours..."
  );


  try {

    const response =
      await fetch(
        SUPABASE_URL +
        "/auth/v1/token?grant_type=password",
        {
          method: "POST",

          headers: {
            "apikey": SUPABASE_KEY,
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email: email,
            password: password
          })
        }
      );


    const text =
      await response.text();


    let data = {};

    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }


    if (!response.ok) {

      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        data.error ||
        "Email ou mot de passe incorrect."
      );
    }


    if (!data.access_token) {

      throw new Error(
        "Supabase n'a pas envoyé de session."
      );
    }


    accessToken =
      data.access_token;


    showMessage(
      loginMessage,
      "Connexion réussie..."
    );


    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");


    await loadDashboard();


  } catch (error) {

    accessToken = "";

    console.error(
      "Erreur connexion :",
      error
    );


    showMessage(
      loginMessage,
      "Erreur : " +
      error.message,
      true
    );


  } finally {

    loginBtn.disabled = false;
    loginBtn.textContent =
      "Se connecter";
  }
}


/* =========================================================
   DECONNEXION
   ========================================================= */

function logout() {

  accessToken = "";
  editingProductId = null;

  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");

  if (productFormCard) {
    productFormCard.classList.add("hidden");
  }

  if (loginMessage) {
    loginMessage.textContent = "";
  }

  const password =
    document.getElementById("password");

  if (password) {
    password.value = "";
  }
}


/* =========================================================
   TABLEAU DE BORD
   ========================================================= */

async function loadDashboard() {

  try {

    const products =
      await api(
        "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
      );


    const safeProducts =
      Array.isArray(products)
        ? products
        : [];


    const productCount =
      document.getElementById(
        "productCount"
      );

    const availableCount =
      document.getElementById(
        "availableCount"
      );

    const outCount =
      document.getElementById(
        "outCount"
      );


    if (productCount) {
      productCount.textContent =
        safeProducts.length;
    }


    const availableProducts =
      safeProducts.filter(
        product =>
          product.available === true &&
          Number(product.stock) > 0
      );


    const outProducts =
      safeProducts.filter(
        product =>
          product.available === false ||
          Number(product.stock) <= 0
      );


    if (availableCount) {
      availableCount.textContent =
        availableProducts.length;
    }


    if (outCount) {
      outCount.textContent =
        outProducts.length;
    }


    renderProducts(
      safeProducts
    );


    await loadOrders();

  } catch (error) {

    console.error(
      "Erreur dashboard :",
      error
    );


    if (productsList) {

      productsList.innerHTML = `
        <p class="error">
          Impossible de charger les produits.
          <br><br>
          ${escapeHtml(error.message)}
        </p>
      `;
    }
  }
}


/* =========================================================
   PRODUITS
   ========================================================= */

function renderProducts(products) {

  if (!productsList) return;


  if (!products.length) {

    productsList.innerHTML = `
      <div class="empty">
        Aucun produit.
      </div>
    `;

    return;
  }


  productsList.innerHTML =
    products.map(product => {

      const available =
        product.available === true &&
        Number(product.stock) > 0;


      return `
        <div class="product">

          <div class="product-top">

            <div>

              <h3>
                ${escapeHtml(product.name)}
              </h3>

              ${
                product.badge
                ?
                `
                  <span class="badge">
                    ${escapeHtml(product.badge)}
                  </span>
                `
                :
                ""
              }

              <p>
                <strong>
                  ${formatPrice(product.price)}
                </strong>
              </p>

              <p>
                Catégorie :
                ${escapeHtml(
                  product.category ||
                  "Non définie"
                )}
              </p>

              <p>
                Stock :
                ${Number(product.stock || 0)}
              </p>

              <p class="${
                available
                  ? "available"
                  : "unavailable"
              }">

                ${
                  available
                    ? "🟢 Disponible"
                    : "🔴 Rupture de stock"
                }

              </p>

            </div>

          </div>


          <div>

            <button
              class="primary"
              type="button"
              onclick="editProduct(${product.id})"
            >
              ✏️ Modifier
            </button>


            <button
              class="secondary"
              type="button"
              onclick="toggleProduct(
                ${product.id},
                ${available}
              )"
            >

              ${
                available
                  ? "Mettre en rupture"
                  : "Rendre disponible"
              }

            </button>


            <button
              class="danger"
              type="button"
              onclick="deleteProduct(${product.id})"
            >
              🗑️ Supprimer
            </button>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   AJOUTER PRODUIT
   ========================================================= */

function openAddProductForm() {

  editingProductId = null;

  productFormTitle.textContent =
    "Ajouter un produit";

  clearProductForm();

  productFormCard.classList.remove(
    "hidden"
  );

  window.scrollTo({
    top: productFormCard.offsetTop - 20,
    behavior: "smooth"
  });
}


/* =========================================================
   MODIFIER PRODUIT
   ========================================================= */

async function editProduct(id) {

  try {

    const result =
      await api(
        "products?id=eq." +
        encodeURIComponent(id) +
        "&select=*"
      );


    if (!result || !result.length) {

      alert(
        "Produit introuvable."
      );

      return;
    }


    const product =
      result[0];


    editingProductId =
      product.id;


    productFormTitle.textContent =
      "Modifier le produit";


    productName.value =
      product.name || "";


    productCategory.value =
      product.category || "";


    productPrice.value =
      product.price || "";


    productStock.value =
      product.stock || 0;


    productImage.value =
      product.image_url || "";


    productBadge.value =
      product.badge || "";


    productDescription.value =
      product.description || "";


    /*
      IMPORTANT :
      productAvailable est un SELECT
      dans ton HTML.
    */

    productAvailable.value =
      product.available === true
        ? "true"
        : "false";


    productFormCard.classList.remove(
      "hidden"
    );


    window.scrollTo({
     
