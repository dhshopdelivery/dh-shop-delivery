/* =========================================================
   DH SHOP & DELIVERY — ADMIN
   ========================================================= */

const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

/* =========================================================
   ELEMENTS
   ========================================================= */

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginMessage = document.getElementById("loginMessage");

const productsList = document.getElementById("productsList");
const addProductBtn = document.getElementById("addProductBtn");

const productFormCard = document.getElementById("productFormCard");
const productFormTitle = document.getElementById("productFormTitle");

const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productBadge = document.getElementById("productBadge");
const productDescription = document.getElementById("productDescription");
const productAvailable = document.getElementById("productAvailable");

const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productMessage = document.getElementById("productMessage");

let accessToken = null;
let editingProductId = null;
let allProducts = [];
let allOrders = [];


/* =========================================================
   API SUPABASE
   ========================================================= */

async function api(endpoint, options = {}) {

  const headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
  };

  if (accessToken) {
    headers["Authorization"] = "Bearer " + accessToken;
  }

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + endpoint,
    {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      text || "Erreur HTTP " + response.status
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

loginBtn.addEventListener("click", login);

async function login() {

  const emailElement = document.getElementById("email");
  const passwordElement = document.getElementById("password");

  const email = emailElement.value.trim();
  const password = passwordElement.value;

  if (!email || !password) {

    loginMessage.textContent =
      "Veuillez remplir les deux champs.";

    return;
  }

  loginMessage.textContent = "Connexion...";

  try {

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

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        "Email ou mot de passe incorrect."
      );
    }

    accessToken = data.access_token;

    if (!accessToken) {

      throw new Error(
        "Aucun jeton de connexion reçu."
      );
    }

    /* =====================================================
       VERIFICATION ADMIN
       ===================================================== */

    loginMessage.textContent =
      "Vérification administrateur...";

    const adminCheck = await api(
      "rpc/is_admin",
      {
        method: "POST",
        body: "{}"
      }
    );

    if (adminCheck !== true) {

      accessToken = null;

      throw new Error(
        "Ce compte n'est pas autorisé comme administrateur."
      );
    }

    /* =====================================================
       CONNEXION REUSSIE
       ===================================================== */

    loginMessage.textContent =
      "Connexion administrateur réussie ✅";

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await loadDashboard();

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "Erreur : " + error.message;
  }
}


/* =========================================================
   DECONNEXION
   ========================================================= */

logoutBtn.addEventListener("click", logout);

function logout() {

  accessToken = null;
  editingProductId = null;
  allProducts = [];
  allOrders = [];

  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");

  loginMessage.textContent = "";

  document.getElementById("password").value = "";
}


/* =========================================================
   TABLEAU DE BORD
   ========================================================= */

async function loadDashboard() {

  try {

    /* -----------------------------------------------------
       PRODUITS
       ----------------------------------------------------- */

    const products = await api(
      "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
    );

    allProducts = products || [];

    document.getElementById("productCount").textContent =
      allProducts.length;

    const availableProducts =
      allProducts.filter(product =>
        product.available === true &&
        Number(product.stock) > 0
      );

    const outProducts =
      allProducts.filter(product =>
        product.available === false ||
        Number(product.stock) <= 0
      );

    document.getElementById("availableCount").textContent =
      availableProducts.length;

    document.getElementById("outCount").textContent =
      outProducts.length;

    renderProducts(allProducts);


    /* -----------------------------------------------------
       COMMANDES
       ----------------------------------------------------- */

    await loadOrders();


    /* -----------------------------------------------------
       PARAMETRES
       ----------------------------------------------------- */

    await loadSettings();

  } catch (error) {

    console.error(error);

    productsList.innerHTML =
      '<p class="error">Erreur : ' +
      escapeHtml(error.message) +
      "</p>";
  }
}


/* =========================================================
   AFFICHAGE PRODUITS
   ========================================================= */

function renderProducts(products) {

  if (!products || products.length === 0) {

    productsList.innerHTML =
      "<p>Aucun produit trouvé.</p>";

    return;
  }

  productsList.innerHTML = "";

  products.forEach(product => {

    const card = document.createElement("div");

    card.className = "admin-product-card";

    const image =
      product.image_url ||
      "https://via.placeholder.com/300x300?text=DH+Shop";

    const stock =
      Number(product.stock) || 0;

    const status =
      product.available && stock > 0
        ? "Disponible"
        : "Épuisé";

    card.innerHTML = `

      <div class="admin-product-image">
        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
        >
      </div>

      <div class="admin-product-info">

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        <p>
          Catégorie :
          ${escapeHtml(product.category || "-")}
        </p>

        <p>
          Prix :
          <strong>
            ${formatPrice(product.price)}
          </strong>
        </p>

        <p>
          Stock :
          <strong>${stock}</strong>
        </p>

        <p>
          État :
          <strong>${status}</strong>
        </p>

        ${
          product.badge
            ? `<span class="badge">
                 ${escapeHtml(product.badge)}
               </span>`
            : ""
        }

      </div>

      <div class="admin-product-actions">

        <button
          type="button"
          onclick="editProduct(${product.id})"
        >
          Modifier
        </button>

        <button
          type="button"
          onclick="toggleProduct(${product.id})"
        >
          ${
            product.available
              ? "Désactiver"
              : "Activer"
          }
        </button>

        <button
          type="button"
          onclick="deleteProduct(${product.id})"
        >
          Supprimer
        </button>

      </div>

    `;

    productsList.appendChild(card);
  });
}


/* =========================================================
   AJOUT PRODUIT
   ========================================================= */

addProductBtn.addEventListener(
  "click",
  showAddProductForm
);

function showAddProductForm() {

  editingProductId = null;

  productFormTitle.textContent =
    "Ajouter un produit";

  productName.value = "";
  productCategory.value = "";
  productPrice.value = "";
  productStock.value = "0";
  productImage.value = "";
  productBadge.value = "";
  productDescription.value = "";
  productAvailable.checked = true;

  productMessage.textContent = "";

  productFormCard.classList.remove("hidden");

  productFormCard.scrollIntoView({
    behavior: "smooth"
  });
}


/* =========================================================
   MODIFIER PRODUIT
   ========================================================= */

window.editProduct = function(id) {

  const product =
    allProducts.find(
      item => Number(item.id) === Number(id)
    );

  if (!product) {
    return;
  }

  editingProductId = product.id;

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

  productAvailable.checked =
    product.available === true;

  productMessage.textContent = "";

  productFormCard.classList.remove("hidden");

  productFormCard.scrollIntoView({
    behavior: "smooth"
  });
};


/* =========================================================
   ANNULER FORMULAIRE
   ========================================================= */

cancelProductBtn.addEventListener(
  "click",
  cancelProductForm
);

function cancelProductForm() {

  editingProductId = null;

  productFormCard.classList.add("hidden");

  productMessage.textContent = "";
}


/* =========================================================
   ENREGISTRER PRODUIT
   ========================================================= */

saveProductBtn.addEventListener(
  "click",
  saveProduct
);

async function saveProduct() {

  const name =
    productName.value.trim();

  const category =
    productCategory.value.trim();

  const price =
    Number(productPrice.value);

  const stock =
    Number(productStock.value);

  const image =
    productImage.value.trim();

  const badge =
    productBadge.value.trim();

  const description =
    productDescription.value.trim();

  const available =
    productAvailable.checked;


  if (!name) {

    productMessage.textContent =
      "Veuillez entrer le nom du produit.";

    return;
  }

  if (!category) {

    productMessage.textContent =
      "Veuillez entrer la catégorie.";

    return;
  }

  if (isNaN(price) || price < 0) {

    productMessage.textContent =
      "Prix incorrect.";

    return;
  }

  if (isNaN(stock) || stock < 0) {

    productMessage.textContent =
      "Stock incorrect.";

    return;
  }

  productMessage.textContent =
    "Enregistrement...";


  const productData = {

    name: name,

    category: category,

    price: price,

    stock: stock,

    image_url: image,

    badge: badge,

    description: description,

    available: available
  };


  try {

    if (editingProductId === null) {

      await api(
        "products",
        {
          method: "POST",

          headers: {
            "Prefer": "return=minimal"
          },

          body: JSON.stringify(
            productData
          )
        }
      );

      productMessage.textContent =
        "Produit ajouté avec succès ✅";

    } else {

      await api(
        "products?id=eq." +
        encodeURIComponent(
          editingProductId
        ),
        {
          method: "PATCH",

          headers: {
            "Prefer": "return=minimal"
          },

          body: JSON.stringify(
            productData
          )
        }
      );

      productMessage.textContent =
        "Produit modifié avec succès ✅";
    }


    editingProductId = null;

    await loadDashboard();

    setTimeout(() => {

      productFormCard.classList.add(
        "hidden"
      );

      productMessage.textContent = "";

    }, 1000);

  } catch (error) {

    console.error(error);

    productMessage.textContent =
      "Erreur : " +
      error.message;
  }
}


/* =========================================================
   ACTIVER / DESACTIVER
   ========================================================= */

window.toggleProduct = async function(id) {

  const product =
    allProducts.find(
      item => Number(item.id) === Number(id)
    );

  if (!product) {
    return;
  }

  try {

    await api(
      "products?id=eq." +
      encodeURIComponent(id),
      {
        method: "PATCH",

        headers: {
          "Prefer": "return=minimal"
        },

        body: JSON.stringify({
          available:
            !product.available
        })
      }
    );

    await loadDashboard();

  } catch (error) {

    alert(
      "Erreur : " +
      error.message
    );
  }
};


/* =========================================================
   SUPPRIMER PRODUIT
   ========================================================= */

window.deleteProduct = async function(id) {

  const product =
    allProducts.find(
      item => Number(item.id) === Number(id)
    );

  if (!product) {
    return;
  }

  const confirmation =
    confirm(
      "Voulez-vous vraiment supprimer « " +
      product.name +
      " » ?"
    );

  if (!confirmation) {
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

    await loadDashboard();

  } catch (error) {

    alert(
      "Erreur : " +
      error.message
    );
  }
};


/* =========================================================
   COMMANDES
   ========================================================= */

async function loadOrders() {

  try {

    const orders = await api(
      "orders?select=*&order=created_at.desc"
    );

    allOrders = orders || [];

    document.getElementById(
      "orderCount"
    ).textContent =
      allOrders.length;


    const ordersList =
      document.getElementById(
        "ordersList"
      );

    if (!ordersList) {
      return;
    }


    if (allOrders.length === 0) {

      ordersList.innerHTML =
        "<p>Aucune commande pour le moment.</p>";

      return;
    }


    ordersList.innerHTML = "";


    allOrders.forEach(order => {

      const card =
        document.createElement("div");

      card.className =
        "admin-order-card";


      let itemsText = "";

      try {

        const items =
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items;

        if (Array.isArray(items)) {

          itemsText =
            items.map(item =>
              `${item.name || "Produit"} × ${item.quantity || 1}`
            ).join(", ");

        } else {

          itemsText =
            JSON.stringify(items);
        }

      } catch {

        itemsText =
          String(order.items || "");
      }


      card.innerHTML = `

        <h3>
          Commande #${escapeHtml(
            String(order.id)
          )}
        </h3>

        <p>
          <strong>Client :</strong>
          ${escapeHtml(
            order.customer_name || "-"
          )}
        </p>

        <p>
          <strong>Téléphone :</strong>
          ${escapeHtml(
            order.phone || "-"
          )}
        </p>

        <p>
          <strong>Adresse :</strong>
          ${escapeHtml(
            order.address || "-"
          )}
        </p>

        <p>
          <strong>Articles :</strong>
          ${escapeHtml(
            itemsText
          )}
        </p>

        <p>
          <strong>Total :</strong>
          ${formatPrice(
            order.total
          )}
        </p>

        <p>
          <strong>Paiement :</strong>
          ${escapeHtml(
            order.payment_method || "-"
          )}
        </p>

        <p>
          <strong>Statut :</strong>
          ${escapeHtml(
            order.status || "-"
          )}
        </p>

        <p>
          <small>
            ${formatDate(
              order.created_at
            )}
          </small>
        </p>

      `;

      ordersList.appendChild(card);
    });

  } catch (error) {

    console.error(error);

    const ordersList =
      document.getElementById(
        "ordersList"
      );

    if (ordersList) {

      ordersList.innerHTML =
        '<p class="error">Erreur commandes : ' +
        escapeHtml(error.message) +
        "</p>";
    }
  }
}


/* =========================================================
   PARAMETRES DE LA BOUTIQUE
   ========================================================= */

async function loadSettings() {

  try {

    const settings =
      await api(
        "shop_settings?select=*&limit=1"
      );

    if (!settings ||
        settings.length === 0) {

      return;
    }

    const data =
      settings[0];


    const shopName =
      document.getElementById(
        "shopName"
      );

    const whatsappNumber =
      document.getElementById(
        "whatsappNumber"
      );

    const currency =
      document.getElementById(
        "currency"
      );

    const deliveryEnabled =
      document.getElementById(
        "deliveryEnabled"
      );


    if (shopName) {

      shopName.value =
        data.shop_name || "";
    }

    if (whatsappNumber) {

      whatsappNumber.value =
        data.whatsapp_number || "";
    }

    if (currency) {

      currency.value =
        data.currency || "FCFA";
    }

    if (deliveryEnabled) {

      deliveryEnabled.checked =
        data.delivery_enabled === true;
    }

  } catch (error) {

    console.error(
      "Erreur paramètres :",
      error
    );
  }
}


/* =========================================================
   SAUVEGARDE PARAMETRES
   ========================================================= */

const saveSettingsBtn =
  document.getElementById(
    "saveSettingsBtn"
  );

if (saveSettingsBtn) {

  saveSettingsBtn.addEventListener(
    "click",
    saveSettings
  );
}


async function saveSettings() {

  const shopName =
    document.getElementById(
      "shopName"
    );

  const whatsappNumber =
    document.getElementById(
      "whatsappNumber"
    );

  const currency =
    document.getElementById(
      "currency"
    );

  const deliveryEnabled =
    document.getElementById(
      "deliveryEnabled"
    );

  const settingsMessage =
    document.getElementById(
      "sett
