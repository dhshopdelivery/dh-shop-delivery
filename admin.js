/* =========================================================
   DH SHOP & DELIVERY — ADMIN
   VERSION 20
   ========================================================= */

const SUPABASE_URL =
  "https://ocmvthymdjkrhmdyieim.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

let accessToken = "";
let editingProductId = null;


/* =========================================================
   OUTILS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("fr-FR") + " FCFA";
}

function message(element, text, error = false) {
  if (!element) return;

  element.textContent = text;
  element.style.color = error ? "#b00020" : "#087f23";
}


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginBox = $("loginBox");
const dashboard = $("dashboard");

const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");

const loginMessage = $("loginMessage");

const productsList = $("productsList");
const addProductBtn = $("addProductBtn");

const productFormCard = $("productFormCard");
const productFormTitle = $("productFormTitle");

const productName = $("productName");
const productCategory = $("productCategory");
const productPrice = $("productPrice");
const productStock = $("productStock");
const productImage = $("productImage");
const productBadge = $("productBadge");
const productDescription = $("productDescription");
const productAvailable = $("productAvailable");

const saveProductBtn = $("saveProductBtn");
const cancelProductBtn = $("cancelProductBtn");
const productMessage = $("productMessage");


/* =========================================================
   SUPABASE API
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
    SUPABASE_URL + "/rest/v1/" + endpoint,
    {
      ...options,
      headers
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text || "Erreur Supabase HTTP " + response.status
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
   CONNEXION ADMINISTRATEUR
   ========================================================= */

async function login() {

  const emailElement = $("email");
  const passwordElement = $("password");

  const email =
    emailElement
      ? emailElement.value.trim()
      : "";

  const password =
    passwordElement
      ? passwordElement.value
      : "";


  if (!email) {

    message(
      loginMessage,
      "Entre ton adresse email.",
      true
    );

    return;
  }


  if (!password) {

    message(
      loginMessage,
      "Entre ton mot de passe.",
      true
    );

    return;
  }


  if (loginBtn) {

    loginBtn.disabled = true;
    loginBtn.textContent = "Connexion...";
  }


  message(
    loginMessage,
    "Connexion en cours..."
  );


  try {

    /*
      Connexion directe à Supabase Auth
    */

    const response = await fetch(
      SUPABASE_URL +
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
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


    /*
      Si Supabase refuse la connexion,
      on affiche exactement son message.
    */

    if (!response.ok) {

      const errorMessage =
        data.error_description ||
        data.msg ||
        data.message ||
        data.error ||
        "Connexion refusée par Supabase.";

      throw new Error(errorMessage);
    }


    /*
      Récupération du token
    */

    if (!data.access_token) {

      throw new Error(
        "Connexion reçue mais aucun token de session n'a été envoyé."
      );
    }


    accessToken =
      data.access_token;


    /*
      Vérification de l'accès à la table products.
      Si cela fonctionne, le compte peut accéder
      au tableau de bord.
    */

    message(
      loginMessage,
      "Connexion réussie. Chargement du tableau de bord..."
    );


    try {

      await api(
        "products?select=id&limit=1"
      );

    } catch (error) {

      /*
        Ici on ne bloque pas immédiatement la connexion.
        On affiche l'erreur réelle dans le tableau.
      */

      console.log(
        "Vérification produits :",
        error.message
      );
    }


    /*
      Afficher le tableau de bord
    */

    if (loginBox) {
      loginBox.classList.add("hidden");
    }

    if (dashboard) {
      dashboard.classList.remove("hidden");
    }


    /*
      Charger les données
    */

    await loadDashboard();


  } catch (error) {

    accessToken = "";

    console.error(
      "ERREUR CONNEXION :",
      error
    );


    message(
      loginMessage,
      "Erreur : " + error.message,
      true
    );


  } finally {

    if (loginBtn) {

      loginBtn.disabled = false;
      loginBtn.textContent = "Connexion";
    }
  }
}


/* =========================================================
   DECONNEXION
   ========================================================= */

function logout() {

  accessToken = "";
  editingProductId = null;

  if (dashboard) {
    dashboard.classList.add("hidden");
  }

  if (loginBox) {
    loginBox.classList.remove("hidden");
  }

  if (productFormCard) {
    productFormCard.classList.add("hidden");
  }

  if (loginMessage) {
    loginMessage.textContent = "";
  }

  const password = $("password");

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
      $("productCount");

    const availableCount =
      $("availableCount");

    const outCount =
      $("outCount");


    if (productCount) {
      productCount.textContent =
        safeProducts.length;
    }


    const availableProducts =
      safeProducts.filter(
        p =>
          p.available === true &&
          Number(p.stock) > 0
      );


    const outProducts =
      safeProducts.filter(
        p =>
          p.available === false ||
          Number(p.stock) <= 0
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
        <div style="
          padding:20px;
          border:1px solid #ddd;
          border-radius:12px;
        ">
          <strong>Erreur de chargement</strong>
          <br><br>
          ${escapeHtml(error.message)}
        </div>
      `;
    }
  }
}


/* =========================================================
   AFFICHER PRODUITS
   ========================================================= */

function renderProducts(products) {

  if (!productsList) {
    return;
  }


  if (!products.length) {

    productsList.innerHTML = `
      <div style="
        padding:20px;
        border:1px solid #ddd;
        border-radius:12px;
        text-align:center;
      ">
        <strong>Aucun produit.</strong>
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
        <div style="
          border:1px solid #ddd;
          border-radius:14px;
          padding:16px;
          margin-bottom:14px;
          background:white;
        ">

          <div style="
            display:flex;
            gap:15px;
            align-items:center;
          ">

            <div style="
              width:80px;
              height:80px;
              border-radius:10px;
              background:#f2f2f2;
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              flex-shrink:0;
            ">

              ${
                product.image_url
                ?
                `
                  <img
                    src="${escapeHtml(product.image_url)}"
                    alt="${escapeHtml(product.name)}"
                    style="
                      width:100%;
                      height:100%;
                      object-fit:cover;
                    "
                  >
                `
                :
                `<span style="font-size:30px">📦</span>`
              }

            </div>


            <div style="flex:1">

              <h3 style="
                margin:0 0 6px;
              ">
                ${escapeHtml(product.name)}
              </h3>

              <strong>
                ${formatPrice(product.price)}
              </strong>

              <br>

              <small>
                Stock : ${Number(product.stock || 0)}
              </small>

              <br>

              <small>
                ${
                  available
                  ? "🟢 Disponible"
                  : "🔴 Épuisé"
                }
              </small>

            </div>

          </div>


          <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:14px;
          ">

            <button
              type="button"
              onclick="editProduct(${product.id})"
            >
              Modifier
            </button>


            <button
              type="button"
              onclick="toggleProduct(
                ${product.id},
                ${available}
              )"
            >
              ${
                available
                ? "Mettre épuisé"
                : "Rendre disponible"
              }
            </button>


            <button
              type="button"
              onclick="deleteProduct(${product.id})"
            >
              Supprimer
            </button>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   AJOUT PRODUIT
   ========================================================= */

function openAddProductForm() {

  editingProductId = null;

  if (productFormTitle) {
    productFormTitle.textContent =
      "Ajouter un produit";
  }

  clearProductForm();

  if (productFormCard) {
    productFormCard.classList.remove("hidden");
  }

  if (productName) {
    productName.focus();
  }
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


    if (productFormTitle) {
      productFormTitle.textContent =
        "Modifier le produit";
    }


    if (productName) {
      productName.value =
        product.name || "";
    }


    if (productCategory) {
      productCategory.value =
        product.category || "";
    }


    if (productPrice) {
      productPrice.value =
        product.price || "";
    }


    if (productStock) {
      productStock.value =
        product.stock || 0;
    }


    if (productImage) {
      productImage.value =
        product.image_url || "";
    }


    if (productBadge) {
      productBadge.value =
        product.badge || "";
    }


    if (productDescription) {
      productDescription.value =
        product.description || "";
    }


    if (productAvailable) {
      productAvailable.checked =
        product.available === true;
    }


    if (productFormCard) {
      productFormCard.classList.remove(
        "hidden"
      );
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (error) {

    alert(
      "Impossible de charger le produit :\n\n" +
      error.message
    );
  }
}


/* =========================================================
   ENREGISTRER PRODUIT
   ========================================================= */

async function saveProduct() {

  const name =
    productName?.value.trim();

  const category =
    productCategory?.value.trim();

  const price =
    Number(productPrice?.value || 0);

  const stock =
    Number(productStock?.value || 0);

  const image =
    productImage?.value.trim();

  const badge =
    productBadge?.value.trim();

  const description =
    productDescription?.value.trim();

  const available =
    productAvailable
      ? productAvailable.checked
      : true;


  if (!name) {

    message(
      productMessage,
      "Le nom du produit est obligatoire.",
      true
    );

    return;
  }


  if (price < 0) {

    message(
      productMessage,
      "Prix invalide.",
      true
    );

    return;
  }


  if (stock < 0) {

    message(
      productMessage,
      "Stock invalide.",
      true
    );

    return;
  }


  const product = {

    name: name,

    category:
      category || "accessoires",

    price: price,

    description:
      description || "",

    image_url:
      image || "",

    stock: stock,

    available:
      available && stock > 0,

    badge:
      badge || null
  };


  if (saveProductBtn) {
    saveProductBtn.disabled = true;
  }


  message(
    productMessage,
    "Enregistrement..."
  );


  try {

    if (editingProductId) {

      await api(
        "products?id=eq." +
        encodeURIComponent(
          editingProductId
        ),
        {
          method: "PATCH",

          headers: {
            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify(product)
        }
      );

    } else {

      await api(
        "products",
        {
          method: "POST",

          headers: {
            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify(product)
        }
      );
    }


    message(
      productMessage,
      "Produit enregistré avec succès ✅"
    );


    editingProductId = null;

    clearProductForm();


    if (productFormCard) {
      productFormCard.classList.add(
        "hidden"
      );
    }


    await loadDashboard();


  } catch (error) {

    message(
      productMessage,
      "Erreur : " +
      error.message,
      true
    );


  } finally {

    if (saveProductBtn) {
      saveProductBtn.disabled = false;
    }
  }
}


/* =========================================================
   SUPPRIMER
   ========================================================= */

async function deleteProduct(id) {

  if (
    !confirm(
      "Voulez-vous vraiment supprimer ce produit ?"
    )
  ) {
    return;
  }


  try {

    await api(
      "products?id=eq." +
      encodeURIComponent(id),
      {
        method: "DELETE"
      }
    );


    alert(
      "Produit supprimé avec succès ✅"
    );


    await loadDashboard();


  } catch (error) {

    alert(
      "Impossible de supprimer :\n\n" +
      error.message
    );
  }
}


/* =========================================================
   DISPONIBILITE
   ========================================================= */

async function toggleProduct(
  id,
  currentlyAvailable
) {

  try {

    await api(
      "products?id=eq." +
      encodeURIComponent(id),
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=minimal"
        },

        body: JSON.stringify({
          available:
            !currentlyAvailable
        })
      }
    );


    await loadDashboard();


  } catch (error) {

    alert(
      "Impossible de modifier :\n\n" +
      error.message
    );
  }
}


/* =========================================================
   ANNULER
   ========================================================= */

function cancelProductForm() {

  editingProductId = null;

  clearProductForm();

  if (productFormCard) {
    productFormCard.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   VIDER FORMULAIRE
   ========================================================= */

function clearProductForm() {

  if (productName)
    productName.value = "";

  if (productCategory)
    productCategory.value =
      "accessoires";

  if (productPrice)
    productPrice.value = "";

  if (productStock)
    productStock.value = "0";

  if (productImage)
    productImage.value = "";

  if (productBadge)
    productBadge.value = "";

  if (productDescription)
    productDescription.value = "";

  if (productAvailable)
    productAvailable.checked = true;

  if (productMessage)
    productMessage.textContent = "";
}


/* =========================================================
   COMMANDES
   ========================================================= */

async function loadOrders() {

  const ordersList =
    $("ordersList");


  if (!ordersList) {
    return;
  }


  try {

    const orders =
      await api(
        "orders?select=*&order=created_at.desc"
      );


    const safeOrders =
      Array.isArray(orders)
        ? orders
        : [];


    const orderCount =
      $("orderCount");


    if (orderCount) {
      orderCount.textContent =
        safeOrders.length;
    }


    if (!safeOrders.length) {

      ordersList.innerHTML =
        "<p>Aucune commande pour le moment.</p>";

      return;
    }


    ordersList.innerHTML =
      safeOrders.map(order => {

        let items =
          order.items;


        if (typeof items === "string") {

          try {
            items =
              JSON.parse(items);
          } catch {
            items = [];
          }
        }


        if (!Array.isArray(items)) {
          items = [];
        }


        const itemsHtml =
          items.map(item => {

            return `
              <li>
                ${escapeHtml(
                  item.name ||
                  "Produit"
                )}
                ×
                ${Number(
                  item.quantity || 1
                )}
              </li>
            `;

          }).join("");


        return `
          <div style="
            border:1px solid #ddd;
            border-radius:14px;
            padding:16px;
            margin-bottom:14px;
            background:white;
          ">

            <strong>
              Commande #${escapeHtml(order.id)}
            </strong>

            <p>
              👤
      
