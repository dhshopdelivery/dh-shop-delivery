const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

/* =========================
   ELEMENTS
========================= */

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginMessage = document.getElementById("loginMessage");

const productsList = document.getElementById("productsList");
const addProductBtn = document.getElementById("addProductBtn");

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

const ordersList =
  document.getElementById("ordersList");

const refreshOrdersBtn =
  document.getElementById("refreshOrdersBtn");

const orderFilter =
  document.getElementById("orderFilter");


/* =========================
   VARIABLES
========================= */

let accessToken = null;

let editingProductId = null;

let allOrders = [];


/* =========================
   API SUPABASE
========================= */

async function api(endpoint, options = {}) {

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...options.headers
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,
      headers
    }
  );

  const text = await response.text();

  if (!response.ok) {

    throw new Error(
      text || `Erreur HTTP ${response.status}`
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


/* =========================
   CONNEXION
========================= */

loginBtn.addEventListener(
  "click",
  login
);


async function login() {

  const email =
    document.getElementById("email")
      .value
      .trim();

  const password =
    document.getElementById("password")
      .value;

  if (!email || !password) {

    loginMessage.textContent =
      "Veuillez remplir les deux champs.";

    return;
  }

  loginMessage.textContent =
    "Connexion...";


  try {

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          password
        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        "Connexion impossible."
      );

    }


    accessToken =
      data.access_token;


    if (!accessToken) {

      throw new Error(
        "Aucun jeton de connexion reçu."
      );

    }


    loginBox.classList.add("hidden");

    dashboard.classList.remove("hidden");

    loginMessage.textContent = "";


    await loadDashboard();


  } catch (error) {

    loginMessage.textContent =
      "Erreur : " + error.message;

  }

}


/* =========================
   DECONNEXION
========================= */

logoutBtn.addEventListener(
  "click",
  logout
);


function logout() {

  accessToken = null;

  allOrders = [];

  dashboard.classList.add("hidden");

  loginBox.classList.remove("hidden");

  document.getElementById("password").value = "";

}


/* =========================
   TABLEAU DE BORD
========================= */

async function loadDashboard() {

  try {

    /* PRODUITS */

    const products = await api(
      "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
    );


    document.getElementById(
      "productCount"
    ).textContent =
      products.length;


    const availableProducts =
      products.filter(
        product =>
          product.available === true &&
          Number(product.stock) > 0
      );


    const outProducts =
      products.filter(
        product =>
          product.available === false ||
          Number(product.stock) <= 0
      );


    document.getElementById(
      "availableCount"
    ).textContent =
      availableProducts.length;


    document.getElementById(
      "outCount"
    ).textContent =
      outProducts.length;


    renderProducts(products);


    /* COMMANDES */

    await loadOrders();


  } catch (error) {

    productsList.innerHTML =
      `<p class="error">
        Erreur : ${escapeHtml(error.message)}
      </p>`;

  }

}


/* =========================
   PRODUITS
========================= */

function renderProducts(products) {

  if (!products || products.length === 0) {

    productsList.innerHTML =
      "<p>Aucun produit trouvé.</p>";

    return;
  }


  productsList.innerHTML =
    products.map(product => {

      const availability =
        product.available &&
        Number(product.stock) > 0
          ? "Disponible"
          : "Indisponible";


      const statusClass =
        product.available &&
        Number(product.stock) > 0
          ? "available"
          : "unavailable";


      const image =
        product.image_url
          ? `
            <img
              src="${escapeHtml(product.image_url)}"
              alt="${escapeHtml(product.name)}"
              class="product-image"
            >
          `
          : "";


      const badge =
        product.badge
          ? `
            <span class="badge">
              ${escapeHtml(product.badge)}
            </span>
          `
          : "";


      return `

        <div class="product">

          ${image}

          <div class="product-top">

            <div>

              <h3>
                ${escapeHtml(product.name)}
              </h3>

              ${badge}

            </div>

          </div>


          <p>
            Prix :
            <strong>
              ${Number(product.price)
                .toLocaleString("fr-FR")}
              FCFA
            </strong>
          </p>


          <p>
            Stock :
            <strong>
              ${product.stock ?? 0}
            </strong>
          </p>


          <p>
            Statut :
            <strong class="${statusClass}">
              ${availability}
            </strong>
          </p>


          <div>

            <button
              type="button"
              class="secondary"
              onclick="editProduct(${product.id})"
            >
              Modifier
            </button>


            <button
              type="button"
              class="danger"
              onclick="deleteProduct(${product.id})"
            >
              Supprimer
            </button>

          </div>

        </div>

      `;

    }).join("");

}


/* =========================
   AJOUT PRODUIT
========================= */

addProductBtn.addEventListener(
  "click",
  openAddForm
);


function openAddForm() {

  editingProductId = null;

  productFormTitle.textContent =
    "Ajouter un produit";

  clearForm();

  productFormCard.classList.remove(
    "hidden"
  );

  productMessage.textContent = "";

}


/* =========================
   MODIFIER PRODUIT
========================= */

async function editProduct(id) {

  try {

    const products =
      await api(
        `products?id=eq.${id}&select=*`
      );


    if (
      !products ||
      products.length === 0
    ) {

      alert(
        "Produit introuvable."
      );

      return;
    }


    const product =
      products[0];


    editingProductId =
      id;


    productFormTitle.textContent =
      "Modifier le produit";


    productName.value =
      product.name || "";


    productCategory.value =
      product.category || "";


    productPrice.value =
      product.price || "";


    productStock.value =
      product.stock ?? "";


    productImage.value =
      product.image_url || "";


    productBadge.value =
      product.badge || "";


    productDescription.value =
      product.description || "";


    productAvailable.value =
      product.available
        ? "true"
        : "false";


    productFormCard.classList.remove(
      "hidden"
    );

    productMessage.textContent = "";


  } catch (error) {

    alert(
      "Erreur : " + error.message
    );

  }

}


/* =========================
   ENREGISTRER PRODUIT
========================= */

saveProductBtn.addEventListener(
  "click",
  saveProduct
);


async function saveProduct() {

  const body = {

    name:
      productName.value.trim(),

    category:
      productCategory.value.trim(),

    price:
      Number(productPrice.value),

    stock:
      Number(productStock.value),

    image_url:
      productImage.value.trim(),

    badge:
      productBadge.value.trim(),

    description:
      productDescription.value.trim(),

    available:
      productAvailable.value === "true"

  };


  if (!body.name) {

    productMessage.textContent =
      "Veuillez entrer le nom du produit.";

    return;
  }


  if (
    !Number.isFinite(body.price) ||
    body.price < 0
  ) {

    productMessage.textContent =
      "Veuillez entrer un prix valide.";

    return;
  }


  if (
    !Number.isFinite(body.stock) ||
    body.stock < 0
  ) {

    productMessage.textContent =
      "Veuillez entrer un stock valide.";

    return;
  }


  saveProductBtn.disabled = true;


  try {

    if (editingProductId) {

      await api(
        `products?id=eq.${editingProductId}`,
        {
          method: "PATCH",

          headers: {
            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify(body)
        }
      );


      productMessage.textContent =
        "Produit modifié avec succès ✅";


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
            JSON.stringify(body)
        }
      );


      productMessage.textContent =
        "Produit ajouté avec succès ✅";

    }


    await loadDashboard();


    setTimeout(
      closeProductForm,
      800
    );


  } catch (error) {

    productMessage.textContent =
      "Erreur : " + error.message;


  } finally {

    saveProductBtn.disabled =
      false;

  }

}


/* =========================
   SUPPRIMER PRODUIT
========================= */

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
      `products?id=eq.${id}`,
      {
        method: "DELETE"
      }
    );


    await loadDashboard();


  } catch (error) {

    alert(
      "Erreur : " + error.message
    );

  }

}


/* =========================
   COMMANDES
========================= */

async function loadOrders() {

  try {

    const orders =
      await api(
        "orders?select=*&order=created_at.desc"
      );


    allOrders =
      Array.isArray(orders)
        ? orders
        : [];


    document.getElementById(
      "orderCount"
    ).textContent =
      allOrders.length;


    renderOrders();


  } catch (error) {

    document.getElementById(
      "orderCount"
    ).textContent = "0";


    ordersList.innerHTML =
      `
        <p class="error">
          Impossible de charger les commandes.
        </p>

        <p class="muted">
          ${escapeHtml(error.message)}
        </p>
      `;

  }

}


/* =========================
   AFFICHER COMMANDES
========================= */

function renderOrders() {

  if (!allOrders.length) {

    ordersList.innerHTML =
      `
        <p>
          Aucune commande pour le moment.
        </p>
      `;

    return;
  }


  const filter =
    orderFilter.value;


  let orders =
    allOrders;


  if (filter !== "all") {

    orders =
      allOrders.filter(
        order =>
          normalizeStatus(order.status) ===
          filter
      );

  }


  if (!orders.length) {

    ordersList.innerHTML =
      `
        <p>
          Aucune commande dans cette catégorie.
        </p>
      `;

    return;
  }


  ordersList.innerHTML =
    orders.map(
      order => renderOrder(order)
    ).join("");

}


/* =========================
   UNE COMMANDE
========================= */

function renderOrder(order) {

  const status =
    normalizeStatus(order.status);


  const statusLabel =
    getStatusLabel(status);


  const date =
    formatDate(order.created_at);


  const itemsHtml =
    renderOrderItems(order.items);


  return `

    <div class="order">

      <div class="order-header">

        <div>

          <div class="order-number">
            🛒 Commande #${order.id}
          </div>

          <div class="order-date">
            ${date}
          </div>

        </div>

        <strong
          class="${getStatusClass(status)}"
        >
          ${statusLabel}
        </strong>

      </div>


      <div class="order-info">

        <p>
          👤
          <strong>Client :</strong>
          ${escapeHtml(
            order.customer_name || "Non renseigné"
          )}
        </p>


        <p>
          📞
          <strong>Téléphone :</strong>
          ${escapeHtml(
            order.phone || "Non renseigné"
          )}
        </p>


        <p>
          📍
          <strong>Adresse :</strong>
          ${escapeHtml(
            order.address || "Non renseignée"
          )}
        </p>


        <p>
          💳
          <strong>Paiement :</strong>
          ${escapeHtml(
            order.payment_method ||
            "À la livraison"
          )}
        </p>

      </div>


      <div class="order-items">

        <strong>
          📦 Produits commandés
        </strong>

        ${itemsHtml}

      </div>


      <div class="order-total">

        Total :
        ${Number(order.total || 0)
          .toLocaleString("fr-FR")}
        FCFA

      </div>


      <div class="status-row">

        <label>
          <strong>
            Statut :
          </strong>
        </label>


        <select
          class="status-select"
          onchange="changeOrderStatus(${order.id}, this.value)"
        >

          <option
            value="nouvelle"
            ${status === "nouvelle" ? "selected" : ""}
          >
            🟠 Nouvelle
          </option>

          <option
            value="preparation"
            ${status === "preparation" ? "selected" : ""}
          >
            🟡 En préparation
          </option>

          <option
            value="livraison"
            ${status === "livraison" ? "selected" : ""}
          >
            🔵 En livraison
          </option>

          <option
            value="livree"
            ${status === "livree" ? "selected" : ""}
          >
            🟢 Livrée
          </option>

          <option
            value="annulee"
            ${status === "annulee" ? "selected" : ""}
          >
            🔴 Annulée
          </option>

        </select>

      </div>

    </div>

  `;

}


/* =========================
   PRODUITS D'UNE COMMANDE
========================= */

function renderOrderItems(items) {

  if (!items) {

    return `
      <p>
        Aucun détail disponible.
      </p>
    `;

  }


  let list = [];


  if (Array.isArray(items)) {

    list = items;

  } else if (
    typeof items === "string"
  ) {

    try {

      const parsed =
        JSON.parse(items);

      if (Array.isArray(parsed)) {
        list = parsed;
      }

    } catch {

      list = [];

    }

  }


  if (!list.length) {

    return `
      <p>
        Détails des produits indisponibles.
      </p>
    `;

  }


  return list.map(item => {

    const name =
      item.name ||
      item.product_name ||
      "Produit";


    const quantity =
      Number(
        item.quantity ||
        item.qty ||
        1
      );


    const price =
      Number(
        item.price ||
        item.unit_price ||
        0
      );


    return `

      <div class="order-item">

        <strong>
          ${escapeHtml(name)}
        </strong>

        <br>

        Quantité :
        ${quantity}

        ×

        ${price.toLocaleString("fr-FR")}
        FCFA

      </div>

    `;

  }).join("");

}


/* =========================
   CHANGER STATUT COMMANDE
========================= */

async function changeOrderStatus(
  id,
  newStatus
) {

  try {

    await api(
      `orders?id=eq.${id}`,
      {
        method: "PATCH",

        headers: {
          "Prefer":
            "return=minimal"
        },

        body:
          JSON.stringify({
            status: newStatus
          })
      }
    );


    const order =
      allOrders.find(
        item =>
          Number(item.id) === Number(id)
      );


    if (order) {

      order.status =
        newStatus;

    }


    renderOrders();


  } catch (error) {

    alert(
      "Impossible de modifier le statut : " +
      error.message
    );

    renderOrders();

  }

}


/* =========================
   FILTRE COMMANDES
========================= */

orderFilter.addEventListener(
  "change",
  renderOrders
);


/* =========================
   ACTUALISER COMMANDES
========================= */

refreshOrdersBtn.addEventListener(
  "click",
  async () => {

    refreshOrdersBtn.disabled =
      true;

    refreshOrdersBtn.textContent =
      "⏳ Chargement...";


    try {

      await loadOrders();

    } finally {

      refreshOrdersBtn.disabled =
        false;

      refreshOrdersBtn.textContent =
        "🔄 Actualiser";

    }

  }
);


/* =========================
   FORMULAIRE
========================= */

cancelProductBtn.addEventListener(
  "click",
  closeProductForm
);


function closeProductForm() {

  productFormCard.classList.add(
    "hidden"
  );

  productMessage.textContent = "";

  editingProductId = null;

  clearForm();

}


function clearForm() {

  productName.value = "";

  productCategory.value = "";

  productPrice.value = "";

  productStock.value = "";

  productImage.value = "";

  productBadge.value = "";

  productDescription.value = "";

  productAvailable.value =
    "true";

}


/* =========================
   STATUTS
========================= */

function normalizeStatus(status) {

  const value =
    String(status || "")
      .toLowerCase()
      .trim();


  if (
    value === "en préparation" ||
    value === "en_preparation" ||
    value === "en-preparation" ||
    value === "preparation"
  ) {
    return "preparation";
  }


  if (
    value === "en livraison" ||
    value === "en_livraison" ||
    value === "en-livraison" ||
    value === "livraison"
  ) {
    return "livraison";
  }


  if (
    value === "livrée" ||
    value === "livree"
  ) {
    return "livree";
  }


  if (
    value === "annulée" ||
    value === "annulee"
  ) {
    return "annulee";
  }


  return "nouvelle";

}


function getStatusLabel(status) {

  switch (status) {

    case "preparation":
      return "🟡 En préparation";

    case "livraison":
      return "🔵 En livraison";

    case "livree":
      return "🟢 Livrée";

    case "
/* =========================
   PHOTO PRODUIT - AJOUT
   ========================= */

(function setupProductPhotoUpload() {

  if (!productImage) {
    console.error("Champ productImage introuvable.");
    return;
  }

  /* Création automatique du bouton */

  const photoContainer = document.createElement("div");

  photoContainer.style.margin = "10px 0 20px";
  photoContainer.style.padding = "15px";
  photoContainer.style.border = "2px dashed #ddd";
  photoContainer.style.borderRadius = "14px";
  photoContainer.style.textAlign = "center";

  photoContainer.innerHTML = `
    <div style="
      font-weight:bold;
      font-size:16px;
      margin-bottom:10px;
    ">
      📷 Photo du produit
    </div>

    <button
      type="button"
      id="chooseProductPhotoBtn"
      style="
        background:#111;
        color:white;
        border:none;
        padding:13px 20px;
        border-radius:10px;
        font-weight:bold;
        font-size:15px;
      "
    >
      📷 Choisir une photo
    </button>

    <input
      type="file"
      id="productPhotoFile"
      accept="image/*"
      style="display:none"
    >

    <div
      id="productPhotoPreviewBox"
      style="margin-top:12px;"
    ></div>
  `;

  productImage.parentNode.insertBefore(
    photoContainer,
    productImage.nextSibling
  );


  const chooseBtn =
    document.getElementById(
      "chooseProductPhotoBtn"
    );

  const photoInput =
    document.getElementById(
      "productPhotoFile"
    );

  const previewBox =
    document.getElementById(
      "productPhotoPreviewBox"
    );


  /* Bouton galerie */

  chooseBtn.addEventListener(
    "click",
    function () {

      photoInput.click();

    }
  );


  /* Sélection photo */

  photoInput.addEventListener(
    "change",
    function () {

      const file =
        this.files[0];

      if (!file) {
        return;
      }


      if (!file.type.startsWith("image/")) {

        alert(
          "Veuillez choisir une image."
        );

        this.value = "";

        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        function (event) {

          previewBox.innerHTML = `
            <img
              src="${event.target.result}"
              alt="Aperçu"
              style="
                width:160px;
                height:160px;
                object-fit:cover;
                border-radius:12px;
                border:1px solid #ddd;
              "
            >
            <div style="
              margin-top:8px;
              font-size:14px;
              color:#555;
            ">
              ${escapeHtml(file.name)}
            </div>
          `;

        };


      reader.readAsDataURL(file);

    }
  );


  /* =========================
     UPLOAD SUPABASE
  ========================= */

  window.uploadSelectedProductPhoto =
    async function () {

      const file =
        photoInput.files[0];

      if (!file) {
        return null;
      }


      if (!accessToken) {

        throw new Error(
          "Session administrateur absente."
        );
      }


      if (!file.type.startsWith("image/")) {

        throw new Error(
          "Le fichier sélectionné n'est pas une image."
        );
      }


      /* Nom unique */

      const extension =
        file.name.includes(".")
          ? file.name
              .split(".")
              .pop()
              .toLowerCase()
          : "jpg";


      const safeName =
        `product-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${extension}`;


      const uploadResponse =
        await fetch(
          `${SUPABASE_URL}/storage/v1/object/product-images/${safeName}`,
          {
            method: "POST",

            headers: {
              "apikey":
                SUPABASE_KEY,

              "Authorization":
                `Bearer ${accessToken}`,

              "Content-Type":
                file.type,

              "x-upsert":
                "false"
            },

            body: file
          }
        );


      const uploadText =
        await uploadResponse.text();


      if (!uploadResponse.ok) {

        throw new Error(
          uploadText ||
          `Erreur upload image : HTTP ${uploadResponse.status}`
        );
      }


      return (
        `${SUPABASE_URL}` +
        `/storage/v1/object/public/` +
        `product-images/${safeName}`
      );
    };
