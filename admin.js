const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const productsList = document.getElementById("productsList");

let accessToken = null;


/* =========================
   CONNEXION
========================= */

loginBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    loginMessage.textContent = "Entre ton email et ton mot de passe.";
    return;
  }

  loginBtn.disabled = true;
  loginMessage.textContent = "Connexion en cours...";

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        "Connexion refusée."
      );
    }

    accessToken = data.access_token;

    if (!accessToken) {
      throw new Error("Aucun jeton de connexion reçu.");
    }

    loginMessage.textContent = "Connexion réussie. Vérification administrateur...";

    /* Vérification ADMIN */
    const adminResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/is_admin`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: "{}"
      }
    );

    const adminText = await adminResponse.text();

    if (!adminResponse.ok) {
      throw new Error(
        "La connexion fonctionne, mais la vérification administrateur a échoué : " +
        adminText
      );
    }

    const isAdmin = JSON.parse(adminText);

    if (isAdmin !== true) {
      throw new Error(
        "Compte connecté, mais ce compte n'est pas reconnu comme administrateur."
      );
    }

    loginMessage.textContent = "Administrateur reconnu ✅";

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await loadProducts();

  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "❌ " + error.message;

  } finally {

    loginBtn.disabled = false;

  }

});


/* =========================
   CHARGER LES PRODUITS
========================= */

async function loadProducts() {

  productsList.innerHTML =
    "<p>Chargement des produits...</p>";

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=id.asc`,
      {
        method: "GET",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Impossible de charger les produits.");
    }

    const products = JSON.parse(text);

    console.log("PRODUITS :", products);

    if (!Array.isArray(products)) {
      throw new Error("Réponse Supabase incorrecte.");
    }

    if (products.length === 0) {

      productsList.innerHTML =
        "<p>⚠️ Aucun produit trouvé dans la base.</p>";

      return;
    }

    productsList.innerHTML = "";

    products.forEach(product => {

      const div = document.createElement("div");

      div.style.border = "1px solid #ddd";
      div.style.padding = "15px";
      div.style.marginBottom = "10px";
      div.style.borderRadius = "10px";

      div.innerHTML = `
        <h3>${escapeHtml(product.name || "")}</h3>

        <p>
          Prix :
          <strong>${Number(product.price || 0).toLocaleString()} FCFA</strong>
        </p>

        <p>
          Stock :
          <strong>${product.stock ?? 0}</strong>
        </p>

        <p>
          Disponible :
          <strong>
            ${product.available ? "Oui ✅" : "Non ❌"}
          </strong>
        </p>
      `;

      productsList.appendChild(div);

    });

  } catch (error) {

    console.error(error);

    productsList.innerHTML =
      `<p style="color:red;">
        ❌ Erreur : ${escapeHtml(error.message)}
      </p>`;

  }

}


/* =========================
   DÉCONNEXION
========================= */

if (logoutBtn) {

  logoutBtn.addEventListener("click", () => {

    accessToken = null;

    dashboard.classList.add("hidden");
    loginBox.classList.remove("hidden");

    document.getElementById("password").value = "";

    loginMessage.textContent = "";

  });

}


/* =========================
   PROTECTION HTML
========================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

     }
