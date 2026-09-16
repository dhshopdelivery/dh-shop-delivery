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
    throw new Error(
      text || `Erreur HTTP ${response.status}`
    );
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

loginBtn.addEventListener(
  "click",
  login
);

async function login() {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

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
          email: email,
          password: password
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
        "Aucun token de connexion reçu."
      );
    }

    /*
      TEST SESSION
      On vérifie le rôle présent
      dans le token sans afficher
      le token lui-même.
    */

    try {

      const payload =
        JSON.parse(
          atob(
            accessToken.split(".")[1]
          )
        );

      console.log(
        "SESSION SUPABASE :",
        payload
      );

      loginMessage.textContent =
        "Session active — rôle : " +
        payload.role;

    } catch {

      loginMessage.textContent =
        "Connexion réussie — session active ✅";
    }

    loginBox.classList.add(
      "hidden"
    );

    dashboard.classList.remove(
      "hidden"
    );

    await loadDashboard();

  } catch (error) {

    loginMessage.textContent =
      "Erreur : " +
      error.message;
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

  dashboard.classList.add(
    "hidden"
  );

  loginBox.classList.remove(
    "hidden"
  );

  document.getElementById(
    "password"
  ).value = "";

  loginMessage.textContent = "";
}


/* =========================
   TABLEAU DE BORD
========================= */

async function loadDashboard() {

  try {

    const products =
      await api(
        "products?select=id,name,category,price,description,image_url,stock,available,badge&order=id.asc"
      );

    console.log(
      "PRODUITS RECUS :",
      products
    );

    console.log(
      "NOMBRE DE PRODUITS :",
      products.length
    );


    /* =====================
       STATISTIQUES
    ===================== */

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


    /* =====================
       AFFICHER LES PRODUITS
    ===================== */

    renderProducts(products);


    /* =====================
       COMMANDES
    ===================== */

    try {

      const orders =
        await api(
          "orders?select=id"
        );

      document.getElementById(
        "orderCount"
      ).textContent =
        orders.length;

    } catch (error) {

      document.getElementById(
        "orderCount"
      ).textContent =
        "0";

      console.log(
        "Commandes non disponibles :",
        error.message
      );
    }

  } catch (error) {

    console.error(
      "ERREUR PRODUITS :",
      error
    );

    productsList.innerHTML =
      `<p class="error">
        Erreur lors du chargement des produits :
        ${escapeHtml(error.message)}
      </p>`;
  }
}


/* =========================
   AFFICHAGE PRODUITS
========================= */

function renderProducts(products) {

  if (
    !products ||
    products.length === 0
  ) {

    productsList.innerHTML =
      "<p>Aucun produit trouvé.</p>";

    return;
  }


  productsList.innerHTML =
    products.map(
      product => {

        const availability =
          product.available &&
          Number(product.stock) > 0
            ? "Disponible"
            : "Indisponible";


        const image =
          product.image_url
            ? `
              <img
                src="${escapeHtml(product.image_url)}"
                alt="${escapeHtml(product.name)}"
              >
            `
            : "";


        return `
          <div class="admin-product">

            ${image}

            <div class="admin-product-info">

              <h3>
                ${escapeHtml(product.name)}
              </h3>

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
                <strong>
                  ${availability}
                </strong>
              </p>

              ${
                product.badge
                  ? `
                    <p>
                      Badge :
                      ${escapeHtml(product.badge)}
                    </p>
                  `
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
                onclick="deleteProduct(${product.id})"
              >
                Supprimer
              </button>

            </div>

          </div>
        `;
      }
    ).join("");
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
   MODIFICATION PRODUIT
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
      product.stock || "";


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
      "Erreur : " +
      error.message
    );
  }
}


/* =========================
   ENREGISTREMENT
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
    !body.price ||
    body.price < 0
  ) {

    productMessage.textContent =
      "Veuillez entrer un prix valide.";

    return;
  }


  if (
    body.stock < 0 ||
    Number.isNaN(body.stock)
  ) {

    productMessage.textContent =
      "Veuillez entrer un stock valide.";

    return;
  }


  saveProductBtn.disabled =
    true;


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
      () => {
        closeProductForm();
      },
      800
    );

  } catch (error) {

    productMessage.textContent =
      "Erreur : " +
      error.message;

  } finally {

    saveProductBtn.disabled =
      false;
  }
}


/* =========================
   SUPPRESSION
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
      "Erreur : " +
      error.message
    );
  }
}


/* =========================
   FERMER FORMULAIRE
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


/* =========================
   VIDER FORMULAIRE
========================= */

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
   SECURITE AFFICHAGE
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
   }                    
