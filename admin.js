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
                  "false"
              },

              body: file
            }
          );


        const text =
          await response.text();


        if (!response.ok) {

          throw new Error(
            text ||
            `Erreur HTTP ${response.status}`
          );
        }


        /* URL publique */

        const imageUrl =
          `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;


        /*
          On remplit automatiquement
          le champ existant
          "Lien de l'image du produit".
        */

        productImage.value =
          imageUrl;


        status.textContent =
          "✅ Photo envoyée avec succès";


      } catch (error) {

        console.error(
          "ERREUR UPLOAD PHOTO :",
          error
        );

        status.textContent =
          "❌ Erreur : " +
          error.message;

      } finally {

        chooseBtn.disabled =
          false;

      }

    }
  );

})();
/* =========================
   TAILLE DES PHOTOS PRODUITS
========================= */

const productImageStyle = document.createElement("style");

productImageStyle.textContent = `
  #productsList .admin-product {
    overflow: hidden;
  }

  #productsList .admin-product img {
    width: 100px !important;
    height: 100px !important;
    max-width: 100px !important;
    max-height: 100px !important;
    object-fit: cover !important;
    display: block;
    flex-shrink: 0;
    border-radius: 12px;
  }

  @media (max-width: 700px) {
    #productsList .admin-product img {
      width: 120px !important;
      height: 120px !important;
      max-width: 120px !important;
      max-height: 120px !important;
    }
  }
`;

document.head.appendChild(productImageStyle);
/* =========================
   NUMÉRO WHATSAPP
========================= */

const whatsappNumberInput =
  document.getElementById("whatsappNumber");

const saveWhatsappBtn =
  document.getElementById("saveWhatsappBtn");

const whatsappMessage =
  document.getElementById("whatsappMessage");


if (
  whatsappNumberInput &&
  saveWhatsappBtn
) {

  saveWhatsappBtn.addEventListener(
    "click",
    saveWhatsappNumber
  );

}


async function saveWhatsappNumber() {

  const number =
    whatsappNumberInput.value
      .trim()
      .replace(/\s+/g, "");


  if (!number) {

    whatsappMessage.textContent =
      "❌ Veuillez entrer un numéro.";

    return;
  }


  if (!/^[0-9]{8,15}$/.test(number)) {

    whatsappMessage.textContent =
      "❌ Numéro invalide. Exemple : 22792617092";

    return;
  }


  saveWhatsappBtn.disabled = true;

  whatsappMessage.textContent =
    "⏳ Enregistrement...";


  try {

    await api(
      "shop_settings?id=eq.1",
      {
        method: "PATCH",

        headers: {
          "Prefer": "return=minimal"
        },

        body: JSON.stringify({
          whatsapp_number: number
        })
      }
    );


    whatsappMessage.textContent =
      "✅ Numéro WhatsApp enregistré avec succès.";

  } catch (error) {

    console.error(
      "ERREUR WHATSAPP :",
      error
    );

    whatsappMessage.textContent =
      "❌ Erreur : " +
      error.message;

  } finally {

    saveWhatsappBtn.disabled = false;

  }

   }
/* =========================
   GESTION DES COMMANDES
========================= */

async function loadOrders() {

  const loadingElement = findOrdersLoadingElement();

  if (!loadingElement) {
    console.error("Zone des commandes introuvable.");
    return;
  }

  loadingElement.textContent = "⏳ Chargement des commandes...";

  try {

    const orders = await api(
      "orders?select=id,customer_name,phone,address,items,total,payment_method,status,created_at&order=created_at.desc"
    );

    console.log("COMMANDES RECUES :", orders);

    const orderCount =
      document.getElementById("orderCount");

    if (orderCount) {
      orderCount.textContent = orders.length;
    }

    renderOrders(orders);

  } catch (error) {

    console.error("ERREUR COMMANDES :", error);

    loadingElement.innerHTML = `
      <p class="error">
        ❌ Impossible de charger les commandes.<br>
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}


/* =========================
   TROUVER LA ZONE COMMANDES
========================= */

function findOrdersLoadingElement() {

  const knownIds = [
    "ordersList",
    "orderList",
    "ordersContainer",
    "orders",
    "commandesList",
    "commandesContainer"
  ];

  for (const id of knownIds) {

    const element =
      document.getElementById(id);

    if (element) {
      return element;
    }
  }


  /* Recherche du texte actuel */

  const elements =
    document.querySelectorAll("*");

  for (const element of elements) {

    if (
      element.children.length === 0 &&
      element.textContent.trim() ===
      "Chargement des commandes..."
    ) {

      return element;
    }
  }

  return null;
}


/* =========================
   AFFICHER LES COMMANDES
========================= */

function renderOrders(orders) {

  const container =
    findOrdersLoadingElement();

  if (!container) {
    return;
  }


  if (
    !orders ||
    orders.length === 0
  ) {

    container.innerHTML = `
      <div style="
        padding:20px;
        text-align:center;
        color:#666;
      ">
        📦 Aucune commande pour le moment.
      </div>
    `;

    return;
  }


  container.innerHTML =
    orders.map(order => {

      let itemsText = "";

      try {

        const items =
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items;

        if (Array.isArray(items)) {

          itemsText =
            items.map(item => `
              <div>
                ${escapeHtml(
                  item.name ||
                  item.product_name ||
                  "Produit"
                )}
                × ${Number(
                  item.quantity || 1
                )}
              </div>
            `).join("");

        } else if (items) {

          itemsText =
            escapeHtml(
              JSON.stringify(items)
            );
        }

      } catch {

        itemsText =
          escapeHtml(
            String(order.items || "")
          );
      }


      const date =
        order.created_at
          ? new Date(
              order.created_at
            ).toLocaleString(
              "fr-FR",
              {
                dateStyle: "short",
                timeStyle: "short"
              }
            )
          : "";


      const status =
        order.status ||
        "nouvelle";


      return `
        <div class="admin-order" style="
          background:#fff;
          border-radius:14px;
          padding:18px;
          margin:12px 0;
          box-shadow:0 3px 12px rgba(0,0,0,.08);
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
            margin-bottom:12px;
          ">

            <strong>
              🧾 Commande #${escapeHtml(
                String(order.id)
              )}
            </strong>

            <span>
              ${escapeHtml(status)}
            </span>

          </div>


          <p>
            👤 <strong>
              ${escapeHtml(
                order.customer_name || ""
              )}
            </strong>
          </p>


          <p>
            📞 ${escapeHtml(
              order.phone || ""
            )}
          </p>


          <p>
            📍 ${escapeHtml(
              order.address || ""
            )}
          </p>


          <p>
            💳 ${escapeHtml(
              order.payment_method ||
              "À la livraison"
            )}
          </p>


          <div style="
            background:#f7f7f7;
            border-radius:10px;
            padding:10px;
            margin:10px 0;
          ">

            <strong>🛍 Produits :</strong>

            <div style="margin-top:6px;">
              ${itemsText}
            </div>

          </div>


          <p>
            💰 <strong>
              ${Number(
                order.total || 0
              ).toLocaleString("fr-FR")}
              FCFA
            </strong>
          </p>


          <small style="color:#777;">
            ${escapeHtml(date)}
          </small>

        </div>
      `;

    }).join("");
}


/* =========================
   CHARGER LES COMMANDES
   APRÈS LA CONNEXION
========================= */

const ancienLoadDashboard =
  loadDashboard;

loadDashboard =
  async function () {

    await ancienLoadDashboard();

    await loadOrders();

  };


/* =========================
   BOUTON ACTUALISER
========================= */

document
  .querySelectorAll("button")
  .forEach(button => {

    if (
      button.textContent
        .toLowerCase()
        .includes("actualiser")
    ) {

      button.addEventListener(
        "click",
        loadOrders
      );

    }

  });
