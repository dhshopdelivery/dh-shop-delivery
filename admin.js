const SUPABASE_URL = "https://ocmvthymdjkrhmdyieim.supabase.co";
const SUPABASE_KEY = "sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");

let accessToken = null;

loginBtn.addEventListener("click", async () => {
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
        body: JSON.stringify({
          email: email,
          password: password
        })
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
});

logoutBtn.addEventListener("click", () => {
  accessToken = null;
  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");
  document.getElementById("password").value = "";
  loginMessage.textContent = "";
});

async function loadDashboard() {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${accessToken}`
  };

  const productsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,available`,
    { headers }
  );

  const products = await productsResponse.json();

  document.getElementById("productCount").textContent = products.length;
  document.getElementById("availableCount").textContent =
    products.filter(p => p.available).length;
  document.getElementById("outCount").textContent =
    products.filter(p => !p.available).length;

  const ordersResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=id`,
    { headers }
  );

  const orders = await ordersResponse.json();

  document.getElementById("orderCount").textContent = orders.length;
}
