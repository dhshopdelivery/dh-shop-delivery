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

/* =========================
   TAILLES ET COULEURS
========================= */

function ensureVariantFields() {
  if (!productFormCard || document.getElementById("dhVariantFields")) return;

  const box = document.createElement("div");
  box.id = "dhVariantFields";
  box.style.cssText =
    "margin:15px 0;padding:15px;border:1px solid #ddd;border-radius:12px;background:#fafafa;";

  box.innerHTML = `
    <div style="font-weight:bold;margin-bottom:12px;">🛍️ Tailles et couleurs</div>

    <label style="display:block;margin-bottom:6px;font-weight:bold;">
      Tailles
    </label>
    <input
      id="productSizes"
      type="text"
      placeholder="Ex : M, L, XL, XXL ou 32, 34, 36, 38"
      style="width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;margin-bottom:6px;"
    >
    <small style="display:block;margin-bottom:14px;color:#666;">
      Sépare les tailles par des virgules. Aucune taille fixe imposée.
    </small>

    <label style="display:block;margin-bottom:6px;font-weight:bold;">
      Couleurs
    </label>
    <input
      id="productColors"
      type="text"
      placeholder="Ex : Noir, Blanc, Rouge, Bleu"
      style="width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;"
    >
    <small style="display:block;margin-top:6px;color:#666;">
      Laisse vide si le produit n'a pas de couleur.
    </small>
  `;

  if (productDescription && productDescription.parentNode) {
    productDescription.parentNode.insertBefore(box, productDescription);
  } else if (productFormCard) {
    productFormCard.appendChild(box);
  }
}

function readVariantInput(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  return el.value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function setVariantInput(id, values) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = Array.isArray(values) ? values.join(", ") : "";
}

ensureVariantFields();


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
        "products?select=id,name,category,price,description,image_url,stock,available,badge,sizes,colors&order=id.asc"
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

    setVariantInput("productSizes", product.sizes);
    setVariantInput("productColors", product.colors);


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
      productAvailable.value === "true",

    sizes:
      readVariantInput("productSizes"),

    colors:
      readVariantInput("productColors")
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

  setVariantInput("productSizes", []);
  setVariantInput("productColors", []);
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
/* =========================
   UPLOAD PHOTO PRODUIT
   ========================= */

(function () {

  if (!productImage) {
    console.error("Champ productImage introuvable.");
    return;
  }

  /* Éviter de créer le bouton deux fois */

  if (document.getElementById("productPhotoFile")) {
    return;
  }

  /* Conteneur */

  const photoBox = document.createElement("div");

  photoBox.id = "productPhotoBox";

  photoBox.style.margin = "10px 0 15px";
  photoBox.style.padding = "15px";
  photoBox.style.border = "2px dashed #ddd";
  photoBox.style.borderRadius = "12px";
  photoBox.style.textAlign = "center";

  photoBox.innerHTML = `

    <strong style="
      display:block;
      margin-bottom:10px;
      font-size:16px;
    ">
      📷 Photo du produit
    </strong>

    <button
      type="button"
      id="chooseProductPhotoBtn"
      style="
        background:#111;
        color:white;
        border:none;
        padding:12px 18px;
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
      style="display:none;"
    >

    <div
      id="productPhotoStatus"
      style="
        margin-top:10px;
        font-size:14px;
      "
    ></div>

    <img
      id="productPhotoPreview"
      style="
        display:none;
        width:150px;
        height:150px;
        object-fit:cover;
        border-radius:12px;
        margin:12px auto 0;
      "
    >

  `;

  /* Placer le nouveau bloc juste avant le champ URL */

  productImage.parentNode.insertBefore(
    photoBox,
    productImage
  );


  const chooseBtn =
    document.getElementById(
      "chooseProductPhotoBtn"
    );

  const fileInput =
    document.getElementById(
      "productPhotoFile"
    );

  const status =
    document.getElementById(
      "productPhotoStatus"
    );

  const preview =
    document.getElementById(
      "productPhotoPreview"
    );


  /* =========================
     OUVRIR LA GALERIE
  ========================= */

  chooseBtn.addEventListener(
    "click",
    function () {

      fileInput.click();

    }
  );


  /* =========================
     SÉLECTION PHOTO
  ========================= */

  fileInput.addEventListener(
    "change",
    async function () {

      const file =
        this.files[0];

      if (!file) {
        return;
      }


      if (!file.type.startsWith("image/")) {

        status.textContent =
          "❌ Veuillez choisir une image.";

        this.value = "";

        return;
      }


      if (!accessToken) {

        status.textContent =
          "❌ Connecte-toi d'abord à l'administration.";

        this.value = "";

        return;
      }


      /* Aperçu immédiat */

      const reader =
        new FileReader();

      reader.onload =
        function (event) {

          preview.src =
            event.target.result;

          preview.style.display =
            "block";
        };

      reader.readAsDataURL(file);


      status.textContent =
        "⏳ Envoi de la photo...";

      chooseBtn.disabled =
        true;


      try {

        /* Extension */

        let extension =
          "jpg";

        if (file.type === "image/png") {
          extension = "png";
        }

        if (file.type === "image/webp") {
          extension = "webp";
        }

        if (file.type === "image/gif") {
          extension = "gif";
        }


        /* Nom unique */

        const fileName =
          `product-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`;


        /* Upload Supabase */

        const response =
          await fetch(
            `${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`,
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
             
