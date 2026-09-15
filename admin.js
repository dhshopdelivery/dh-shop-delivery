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

const saveProductBtn = document.getElementById("saveProductBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productMessage = document.getElementById("productMessage");

let accessToken = null;
let editingProductId = null;

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
addProductBtn.addEventListener("click", openAddForm);
cancelProductBtn.addEventListener("click", closeProductForm);
saveProductBtn.addEventListener("click", saveProduct);

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
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY
        },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || "Connexion impossible");
    }

    accessToken = data.access_token;

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await loadDashboard();

  } catch (error) {
    loginMessage.textContent = "Erreur : " + error.message;
  }
}

function logout() {
  accessToken = null;
  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");
  document.getElementById("password").value = "";
}

async function api(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${accessToken}`,
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Erreur Supabase");
  }

  return text ? JSON.parse(text) : null;
}

async function loadDashboard() {
  try {
    const products = await api(
      "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
    );

    const orders = await api("orders?select=id");

    document.getElementById("productCount").textContent = products.length;
    document.getElementById("orderCount").textContent = orders.length;

    document.getElementById("availableCount").textContent =
      products.filter(p => p.available).length;

    document.getElementById("outCount").textContent =
      products.filter(p => !p.available).length;

    renderProducts(products);

  } catch (error) {
    productsList.innerHTML =
      `<p>Erreur : ${escapeHtml(error.message)}</p>`;
  }
}

function renderProducts(products) {
  if (!products.length) {
    productsList.innerHTML = "<p>Aucun produit.</p>";
    return;
  }

  productsList.innerHTML = products.map(product => `
    <div class="product">

      <div class="product-top">

        <div>
          <h3>${escapeHtml(product.name)}</h3>

          <p>
            <strong>${Number(product.price).toLocaleString("fr-FR")} FCFA</strong>
          </p>

          <p>Stock : ${product.stock}</p>

          ${
            product.available
            ? '<span class="available">● Disponible</span>'
            : '<span class="unavailable">● Rupture de stock</span>'
          }

          ${
            product.badge
            ? `<p><span class="badge">${escapeHtml(product.badge)}</span></p>`
            : ""
          }
        </div>

        <div>
          <button class="secondary"
            onclick="editProduct(${product.id})">
            ✏️ Modifier
          </button>

          <button class="danger"
            onclick="deleteProduct(${product.id})">
            🗑️ Supprimer
          </button>
        </div>

      </div>

    </div>
  `).join("");
}

function openAddForm() {
  editingProductId = null;
  productFormTitle.textContent = "Ajouter un produit";

  clearForm();

  productFormCard.classList.remove("hidden");
  window.scrollTo({
    top: productFormCard.offsetTop,
    behavior: "smooth"
  });
}

async function editProduct(id) {
  try {
    const products = await api(
      `products?id=eq.${id}&select=*`
    );

    if (!products.length) return;

    const p = products[0];

    editingProductId = id;
    productFormTitle.textContent = "Modifier le produit";

    productName.value = p.name || "";
    productCategory.value = p.category || "";
    productPrice.value = p.price || "";
    productStock.value = p.stock || "";
    productImage.value = p.image_url || "";
    productBadge.value = p.badge || "";
    productDescription.value = p.description || "";
    productAvailable.value = String(p.available);

    productFormCard.classList.remove("hidden");

    window.scrollTo({
      top: productFormCard.offsetTop,
      behavior: "smooth"
    });

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}

async function saveProduct() {
  const name = productName.value.trim();
  const category = productCategory.value.trim();
  const price = Number(productPrice.value);
  const stock = Number(productStock.value);
  const image_url = productImage.value.trim();
  const badge = productBadge.value.trim();
  const description = productDescription.value.trim();
  const available = productAvailable.value === "true";

  if (!name || !category || !price) {
    productMessage.textContent =
      "Nom, catégorie et prix sont obligatoires.";
    return;
  }

  saveProductBtn.disabled = true;
  productMessage.textContent = "Enregistrement...";

  try {
    const body = {
      name,
      category,
      price,
      stock,
      image_url,
      badge,
      description,
      available
    };

    if (editingProductId) {
      await api(
        `products?id=eq.${editingProductId}`,
        {
          method: "PATCH",
          headers: {
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(body)
        }
      );

      productMessage.textContent = "Produit modifié avec succès ✅";

    } else {
      await api(
        "products",
        {
          method: "POST",
          headers: {
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(body)
        }
      );

      productMessage.textContent = "Produit ajouté avec succès ✅";
    }

    await loadDashboard();

    setTimeout(() => {
      closeProductForm();
    }, 800);

  } catch (error) {
    productMessage.textContent =
      "Erreur : " + error.message;

  } finally {
    saveProductBtn.disabled = false;
  }
}

async function deleteProduct(id) {
  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) {
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
    alert("Erreur : " + error.message);
  }
}

function closeProductForm() {
  productFormCard.classList.add("hidden");
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
  productAvailable.value = "true";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  }
