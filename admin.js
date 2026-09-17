/* =========================================================
   DH SHOP & DELIVERY — ADMIN
   Version 10
   ========================================================= */

const SUPABASE_URL =
  "https://ocmvthymdjkrhmdyieim.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

let accessToken = "";
let editingProductId = null;


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
  return Number(value || 0).toLocaleString("fr-FR") + " FCFA";
}


function showMessage(element, message, error = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = error ? "#b00020" : "#087f23";
}


/* =========================================================
   SUPABASE REST
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
   CONNEXION
   ========================================================= */

async function login() {

  const emailInput =
    document.getElementById("email");

  const passwordInput =
    document.getElementById("password");

  const email =
    emailInput ? emailInput.value.trim() : "";

  const password =
    passwordInput ? passwordInput.value : "";

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
    "Connexion à Supabase..."
  );

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
        data?.error_description ||
        data?.msg ||
        data?.message ||
        "Email ou mot de passe incorrect."
      );
    }

    if (!data.access_token) {

      throw new Error(
        "Supabase n'a pas envoyé de session."
      );
    }

    accessToken = data.access_token;

    /*
      Vérification de la session.
      On ne montre jamais le token.
    */

    showMessage(
      loginMessage,
      "Connexion réussie. Vérification du compte..."
    );

    /*
      Vérifie que le compte est bien administrateur.
    */

    let adminResult = false;

    try {

      adminResult =
        await api(
          "rpc/is_admin",
          {
            method: "POST",
            body: "{}"
          }
        );

    } catch (rpcError) {

      console.log(
        "Vérification is_admin :",
        rpcError.message
      );
    }


    /*
      Si la fonction retourne false, on teste quand même
      l'accès aux produits.
    */

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    showMessage(
      loginMessage,
      adminResult === true
        ? "Connexion administrateur réussie ✅"
        : "Session Supabase active ✅"
    );

    await loadDashboard();

  } catch (error) {

    accessToken = "";

    showMessage(
      loginMessage,
      "Erreur : " + error.message,
      true
    );

    console.error(error);

  } finally {

    loginBtn.disabled = false;
    loginBtn.textContent = "Connexion";
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

}


/* =========================================================
   TABLEAU DE BORD
   ========================================================= */

async function loadDashboard() {

  try {

    const products = await api(
      "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
    );

    console.log(
      "DH SHOP — PRODUITS :",
      products
    );

    const safeProducts =
      Array.isArray(products)
        ? products
        : [];

    /*
      Compteurs
    */

    const productCount =
      document.getElementById("productCount");

    const availableCount =
      document.getElementById("availableCount");

    const outCount =
      document.getElementById("outCount");

    const orderCount =
      document.getElementById("orderCount");


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


    /*
      Affichage des produits
    */

    renderProducts(safeProducts);


    /*
      Commandes
    */

    await loadOrders();

  } catch (error) {

    console.error(error);

    if (productsList) {

      productsList.innerHTML =
        `<p class="error">
          Impossible de charger les produits.<br><br>
          ${escapeHtml(error.message)}
        </p>`;
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
      <div style="
        padding:20px;
        border:1px solid #ddd;
        border-radius:12px;
        text-align:center;
      ">
        <strong>Aucun produit trouvé.</strong>
        <p>
          La connexion fonctionne, mais Supabase
          ne renvoie aucun produit.
        </p>
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
        <div class="admin-product-card"
          style="
            border:1px solid #ddd;
            border-radius:14px;
            padding:16px;
            margin-bottom:14px;
            background:#fff;
          "
        >

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
              overflow:hidden;
              display:flex;
              align-items:center;
              justify-content:center;
            ">

              ${
                product.image_url
                ?
                `<img
                  src="${escapeHtml(product.image_url)}"
                  alt="${escapeHtml(product.name)}"
                  style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                  "
                >`
                :
                `<span>📦</span>`
              }

            </div>


            <div style="flex:1">

              <h3 style="margin:0 0 5px">
                ${escapeHtml(product.name)}
              </h3>

              <div>
                ${formatPrice(product.price)}
              </div>

              <small>
                Stock :
                ${Number(product.stock || 0)}
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
            margin-top:14px;
            flex-wrap:wrap;
          ">

            <button
              type="button"
              onclick="editProduct(${product.id})"
            >
              Modifier
            </button>


            <button
              type="button"
              onclick="toggleProduct(${product.id}, ${available})"
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
   AJOUTER PRODUIT
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

    const result = await api(
      "products?id=eq." +
      encodeURIComponent(id) +
      "&select=*"
    );

    if (!result || !result.length) {

      alert("Produit introuvable.");

      return;
    }

    const product = result[0];

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
      "Impossible de charger le produit : " +
      error.message
    );
  }
}


/* =========================================================
   SAUVEGARDER PRODUIT
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

    showMessage(
      productMessage,
      "Le nom du produit est obligatoire.",
      true
    );

    return;
  }


  if (price < 0) {

    showMessage(
      productMessage,
      "Le prix est invalide.",
      true
    );

    return;
  }


  if (stock < 0) {

    showMessage(
      productMessage,
      "Le stock est invalide.",
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


  saveProductBtn.disabled = true;

  showMessage(
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
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(product)
        }
      );

    } else {

      await api(
        "products",
        {
          method: "POST",
          headers: {
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(product)
        }
      );
    }


    showMessage(
      productMessage,
      editingProductId
        ? "Produit modifié avec succès ✅"
        : "Produit ajouté avec succès ✅"
    );


    clearProductForm();

    editingProductId = null;


    if (productFormTitle) {

      productFormTitle.textContent =
        "Ajouter un produit";
    }


    await loadDashboard();


  } catch (error) {

    showMessage(
      productMessage,
      "Erreur : " + error.message,
      true
    );

  } finally {

    saveProductBtn.disabled = false;
  }
}


/* =========================================================
   SUPPRIMER PRODUIT
   ========================================================= */

async function deleteProduct(id) {

  const confirmation =
    confirm(
      "Voulez-vous vraiment supprimer ce produit ?"
    );


  if (!confirmation) return;


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

async function toggleProduct(id, currentlyAvailable) {

  try {

    const newAvailable =
      !currentlyAvailable;


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
            newAvailable
        })
      }
    );


    await loadDashboard();

  } catch (error) {

    alert(
      "Impossible de modifier le stock :\n\n" +
      error.message
    );
  }
}


/* =========================================================
   ANNULER FORMULAIRE
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
    productCategory.value = "accessoires";

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

  const ordersContainer =
    document.getElementById("ordersList");

  if (!ordersContainer) return;


  try {

    const orders = await api(
      "orders?select=*&order=created_at.desc"
    );


    const safeOrders =
      Array.isArray(orders)
        ? orders
        : [];


    const orderCount =
      document.getElementById(
        "orderCount"
      );


    if (orderCount) {

      orderCount.textContent =
        safeOrders.length;
    }


    if (!safeOrders.length) {

      ordersContainer.innerHTML =
        "<p>Aucune commande pour le moment.</p>";

      return;
    }


    ordersContainer.innerHTML =
      safeOrders.map(order => {

        let items = order.items;

        if (typeof items === "string") {

          try {
            items = JSON.parse(items);
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
                ${escapeHtml(item.name || "Produit")}
                × ${Number(item.quantity || 1)}
              </li>
            `;

          }).join("");


        return `
          <div style="
            border:1px solid #ddd;
            border-radius:14px;
            padding:16px;
            margin-bottom:14px;
          ">

            <strong>
              Commande #${escapeHtml(order.id)}
            </strong>

            <p>
              👤 ${escapeHtml(order.customer_name)}
            </p>

            <p>
              📞 ${escapeHtml(order.phone)}
 
