const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

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

// Récupération dynamique des éléments Tailles et Couleurs (si présent dans le HTML)
const productSizes = document.getElementById("productSizes");
const productColors = document.getElementById("productColors");

const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productMessage = document.getElementById("productMessage");

let accessToken = null;
let editingProductId = null;


/* =========================
   OUTILS SUPABASE
========================= */

async function api(endpoint, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Erreur HTTP ${response.status}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


/* =========================
   CONNEXION
========================= */

if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    loginMessage.textContent = "Veuillez remplir les deux champs.";
    return;
  }

  loginMessage.textContent = "Connexion...";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error_description || data.msg || data.message || "Connexion impossible."
      );
    }

    accessToken = data.access_token;

    if (!accessToken) {
      throw new Error("Aucun token de connexion reçu.");
    }

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      loginMessage.textContent = "Session active — rôle : " + payload.role;
    } catch {
      loginMessage.textContent = "Connexion réussie — session active ✅";
    }

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await loadDashboard();

  } catch (error) {
    loginMessage.textContent = "Erreur : " + error.message;
  }
}


/* =========================
   DECONNEXION
========================= */

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

function logout() {
  accessToken = null;
  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");
  document.getElementById("password").value = "";
  loginMessage.textContent = "";
}


/* =========================
   TABLEAU DE BORD
========================= */

async function loadDashboard() {
  try {
    const products = await api(
      "products?select=id,name,category,price,description,image_url,stock,available,badge,sizes,colors&order=id.asc"
    );

    const productCountEl = document.getElementById("productCount");
    if (productCountEl) productCountEl.textContent = products.length;

    const availableProducts = products.filter(
      product => product.available === true && Number(product.stock) > 0
    );

    const outProducts = products.filter(
      product => product.available === false || Number(product.stock) <= 0
    );

    const availableCountEl = document.getElementById("availableCount");
    if (availableCountEl) availableCountEl.textContent = availableProducts.length;

    const outCountEl = document.getElementById("outCount");
    if (outCountEl) outCountEl.textContent = outProducts.length;

    renderProducts(products);

    try {
      const orders = await api("orders?select=id");
      const orderCountEl = document.getElementById("orderCount");
      if (orderCountEl) orderCountEl.textContent = orders.length;
    } catch (error) {
      const orderCountEl = document.getElementById("orderCount");
      if (orderCountEl) orderCountEl.textContent = "0";
    }

  } catch (error) {
    console.error("ERREUR PRODUITS :", error);
    if (productsList) {
      productsList.innerHTML = `<p class="error">Erreur lors du chargement des produits : ${escapeHtml(error.message)}</p>`;
    }
  }
}


/* =========================
   AFFICHAGE PRODUITS
========================= */

function renderProducts(products) {
  if (!productsList) return;

  if (!products || products.length === 0) {
    productsList.innerHTML = "<p>Aucun produit trouvé.</p>";
    return;
  }

  productsList.innerHTML = products.map(product => {
    const availability = product.available && Number(product.stock) > 0 ? "Disponible" : "Indisponible";

    const image = product.image_url
      ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`
      : "";

    return `
      <div class="admin-product">
        ${image}
        <div class="admin-product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <p>Prix : <strong>${Number(product.price).toLocaleString("fr-FR")} FCFA</strong></p>
          <p>Stock : <strong>${product.stock ?? 0}</strong></p>
          <p>Statut : <strong>${availability}</strong></p>
          ${product.sizes ? `<p>Tailles : <strong>${escapeHtml(product.sizes)}</strong></p>` : ""}
          ${product.colors ? `<p>Couleurs : <strong>${escapeHtml(product.colors)}</strong></p>` : ""}
          ${product.badge ? `<p>Badge : ${escapeHtml(product.badge)}</p>` : ""}
        </div>

        <div class="admin-product-actions">
          <button type="button" onclick="editProduct(${product.id})">Modifier</button>
          <button type="button" onclick="deleteProduct(${product.id})">Supprimer</button>
        </div>
      </div>
    `;
  }).join("");
}


/* =========================
   AJOUT PRODUIT
========================= */

if (addProductBtn) {
  addProductBtn.addEventListener("click", openAddForm);
}

function openAddForm() {
  editingProductId = null;
  productFormTitle.textContent = "Ajouter un produit";
  clearForm();
  productFormCard.classList.remove("hidden");
  productMessage.textContent = "";
}


/* =========================
   MODIFICATION PRODUIT
========================= */

async function editProduct(id) {
  try {
    const products = await api(`products?id=eq.${id}&select=*`);

    if (!products || products.length === 0) {
      alert("Produit introuvable.");
      return;
    }

    const product = products[0];
    editingProductId = id;

    productFormTitle.textContent = "Modifier le produit";

    if (productName) productName.value = product.name || "";
    if (productCategory) productCategory.value = product.category || "";
    if (productPrice) productPrice.value = product.price || "";
    if (productStock) productStock.value = product.stock || "";
    if (productImage) productImage.value = product.image_url || "";
    if (productBadge) productBadge.value = product.badge || "";
    if (productDescription) productDescription.value = product.description || "";
    if (productAvailable) productAvailable.value = product.available ? "true" : "false";

    const sizesInput = document.getElementById("productSizes");
    if (sizesInput) sizesInput.value = product.sizes || "";

    const colorsInput = document.getElementById("productColors");
    if (colorsInput) colorsInput.value = product.colors || "";

    productFormCard.classList.remove("hidden");
    productMessage.textContent = "";

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}


/* =========================
   ENREGISTREMENT PRODUIT
========================= */

if (saveProductBtn) {
  saveProductBtn.addEventListener("click", saveProduct);
}

async function saveProduct() {
  const sizesInput = document.getElementById("productSizes");
  const colorsInput = document.getElementById("productColors");

  const body = {
    name: productName ? productName.value.trim() : "",
    category: productCategory ? productCategory.value.trim() : "",
    price: productPrice ? Number(productPrice.value) : 0,
    stock: productStock ? Number(productStock.value) : 0,
    image_url: productImage ? productImage.value.trim() : "",
    badge: productBadge ? productBadge.value.trim() : "",
    description: productDescription ? productDescription.value.trim() : "",
    available: productAvailable ? productAvailable.value === "true" : true,
    sizes: sizesInput ? sizesInput.value.trim() : "",
    colors: colorsInput ? colorsInput.value.trim() : ""
  };

  if (!body.name) {
    productMessage.textContent = "Veuillez entrer le nom du produit.";
    return;
  }

  if (!body.price || body.price < 0) {
    productMessage.textContent = "Veuillez entrer un prix valide.";
    return;
  }

  if (body.stock < 0 || Number.isNaN(body.stock)) {
    productMessage.textContent = "Veuillez entrer un stock valide.";
    return;
  }

  saveProductBtn.disabled = true;

  try {
    if (editingProductId) {
      await api(`products?id=eq.${editingProductId}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify(body)
      });
      productMessage.textContent = "Produit modifié avec succès ✅";
    } else {
      await api("products", {
        method: "POST",
        headers: { "Prefer": "return=minimal" },
        body: JSON.stringify(body)
      });
      productMessage.textContent = "Produit ajouté avec succès ✅";
    }

    await loadDashboard();

    setTimeout(() => {
      closeProductForm();
    }, 800);

  } catch (error) {
    productMessage.textContent = "Erreur : " + error.message;
  } finally {
    saveProductBtn.disabled = false;
  }
}


/* =========================
   SUPPRESSION PRODUIT
========================= */

async function deleteProduct(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

  try {
    await api(`products?id=eq.${id}`, { method: "DELETE" });
    await loadDashboard();
  } catch (error) {
    alert("Erreur : " + error.message);
  }
}


/* =========================
   FERMER ET VIDER FORMULAIRE
========================= */

if (cancelProductBtn) {
  cancelProductBtn.addEventListener("click", closeProductForm);
}

function closeProductForm() {
  productFormCard.classList.add("hidden");
  productMessage.textContent = "";
  editingProductId = null;
  clearForm();
}

function clearForm() {
  if (productName) productName.value = "";
  if (productCategory) productCategory.value = "";
  if (productPrice) productPrice.value = "";
  if (productStock) productStock.value = "";
  if (productImage) productImage.value = "";
  if (productBadge) productBadge.value = "";
  if (productDescription) productDescription.value = "";
  if (productAvailable) productAvailable.value = "true";

  const sizesInput = document.getElementById("productSizes");
  if (sizesInput) sizesInput.value = "";

  const colorsInput = document.getElementById("productColors");
  if (colorsInput) colorsInput.value = "";
}


/* =========================
   SECURITE AFFICHAGE
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   UPLOAD PHOTO PRODUIT
========================= */

(function () {
  if (!productImage) return;
  if (document.getElementById("productPhotoFile")) return;

  const photoBox = document.createElement("div");
  photoBox.id = "productPhotoBox";
  photoBox.style.margin = "10px 0 15px";
  photoBox.style.padding = "15px";
  photoBox.style.border = "2px dashed #ddd";
  photoBox.style.borderRadius = "12px";
  photoBox.style.textAlign = "center";

  photoBox.innerHTML = `
    <strong style="display:block; margin-bottom:10px; font-size:16px;">📷 Photo du produit</strong>
    <button type="button" id="chooseProductPhotoBtn" style="background:#111; color:white; border:none; padding:12px 18px; border-radius:10px; font-weight:bold; font-size:15px;">
      📷 Choisir une photo
    </button>
    <input type="file" id="productPhotoFile" accept="image/*" style="display:none;">
    <div id="productPhotoStatus" style="margin-top:10px; font-size:14px;"></div>
    <img id="productPhotoPreview" style="display:none; width:150px; height:150px; object-fit:cover; border-radius:12px; margin:12px auto 0;">
  `;

  productImage.parentNode.insertBefore(photoBox, productImage);

  const chooseBtn = document.getElementById("chooseProductPhotoBtn");
  const fileInput = document.getElementById("productPhotoFile");
  const status = document.getElementById("productPhotoStatus");
  const preview = document.getElementById("productPhotoPreview");

  chooseBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      status.textContent = "❌ Veuillez choisir une image.";
      this.value = "";
      return;
    }

    if (!accessToken) {
      status.textContent = "❌ Connecte-toi d'abord à l'administration.";
      this.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);

    status.textContent = "⏳ Envoi de la photo...";
    chooseBtn.disabled = true;

    try {
      let extension = "jpg";
      if (file.type === "image/png") extension = "png";
      if (file.type === "image/webp") extension = "webp";
      if (file.type === "image/gif") extension = "gif";

      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`,
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": file.type,
            "x-upsert": "false"
          },
          body: file
        }
      );

      const text = await response.text();
      if (!response.ok) throw new Error(text || `Erreur HTTP ${response.status}`);

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
      productImage.value = imageUrl;
      status.textContent = "✅ Photo envoyée avec succès";

    } catch (error) {
      console.error("ERREUR UPLOAD PHOTO :", error);
      status.textContent = "❌ Erreur : " + error.message;
    } finally {
      chooseBtn.disabled = false;
    }
  });
})();


/* =========================
   STYLE IMAGES PRODUITS
========================= */

const productImageStyle = document.createElement("style");
productImageStyle.textContent = `
  #productsList .admin-product { overflow: hidden; }
  #productsList .admin-product img {
    width: 100px !important; height: 100px !important;
    max-width: 100px !important; max-height: 100px !important;
    object-fit: cover !important; display: block; flex-shrink: 0; border-radius: 12px;
  }
  @media (max-width: 700px) {
    #productsList .admin-product img {
      width: 120px !important; height: 120px !important;
      max-width: 120px !important; max-height: 120px !important;
    }
  }
`;
document.head.appendChild(productImageStyle);


/* =========================
   NUMÉRO WHATSAPP
========================= */

const whatsappNumberInput = document.getElementById("whatsappNumber");
const saveWhatsappBtn = document.getElementById("saveWhatsappBtn");
const whatsappMessage = document.getElementById("whatsappMessage");

if (whatsappNumberInput && saveWhatsappBtn) {
  saveWhatsappBtn.addEventListener("click", saveWhatsappNumber);
}

async function saveWhatsappNumber() {
  const number = whatsappNumberInput.value.trim().replace(/\s+/g, "");

  if (!number || !/^[0-9]{8,15}$/.test(number)) {
    whatsappMessage.textContent = "❌ Numéro invalide. Exemple : 22792617092";
    return;
  }

  saveWhatsappBtn.disabled = true;
  whatsappMessage.textContent = "⏳ Enregistrement...";

  try {
    await api("shop_settings?id=eq.1", {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ whatsapp_number: number })
    });
    whatsappMessage.textContent = "✅ Numéro WhatsApp enregistré avec succès.";
  } catch (error) {
    console.error("ERREUR WHATSAPP :", error);
    whatsappMessage.textContent = "❌ Erreur : " + error.message;
  } finally {
    saveWhatsappBtn.disabled = false;
  }
}


/* =========================
   GESTION DES COMMANDES & SUIVI
========================= */

async function loadOrders() {
  const loadingElement = findOrdersLoadingElement();
  if (!loadingElement) return;

  loadingElement.textContent = "⏳ Chargement des commandes...";

  try {
    const orders = await api(
      "orders?select=id,customer_name,phone,address,items,total,payment_method,status,created_at&order=created_at.desc"
    );

    const orderCountEl = document.getElementById("orderCount");
    if (orderCountEl) orderCountEl.textContent = orders.length;

    renderOrders(orders);

  } catch (error) {
    console.error("ERREUR COMMANDES :", error);
    loadingElement.innerHTML = `<p class="error">❌ Impossible de charger les commandes.<br>${escapeHtml(error.message)}</p>`;
  }
}

function findOrdersLoadingElement() {
  const knownIds = ["ordersList", "orderList", "ordersContainer", "orders", "commandesList", "commandesContainer"];
  for (const id of knownIds) {
    const el = document.getElementById(id);
    if (el) return el;
  }

  const elements = document.querySelectorAll("*");
  for (const el of elements) {
    if (el.children.length === 0 && el.textContent.trim() === "Chargement des commandes...") {
      return el;
    }
  }
  return null;
}

function renderOrders(orders) {
  const container = findOrdersLoadingElement();
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:#666;">📦 Aucune commande pour le moment.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => {
    let itemsText = "";

    try {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

      if (Array.isArray(items)) {
        itemsText = items.map(item => `
          <div>
            ${escapeHtml(item.name || item.product_name || "Produit")}
            ${item.size ? `(Taille: ${escapeHtml(i
