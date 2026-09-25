(()=>{"use strict";
const URL="https://ocmvthymdjkrhmdyieim.supabase.co",KEY="sb_publishable_OnchBsvLE3RVA-EualXSSA_pfVvFpTW";
const S={products:[],filtered:[],cart:JSON.parse(localStorage.getItem("dhCart")||"[]"),cat:"all",q:"",sort:"newest",wa:"22792617092"};
const $=x=>document.getElementById(x),money=n=>Number(n||0).toLocaleString("fr-FR")+" FCFA";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&#039;","'":"&#039;"}[c]));
async function api(path,opt={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const r=await fetch(URL+"/rest/v1/"+path,{...opt,signal:c.signal,headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json",...(opt.headers||{})}}),txt=await r.text();let d=null;try{d=txt?JSON.parse(txt):null}catch{}if(!r.ok)throw Error(d?.message||d?.hint||txt||"Erreur HTTP "+r.status);return d}finally{clearTimeout(t)}}
function save(){localStorage.setItem("dhCart",JSON.stringify(S.cart))}
function total(){return S.cart.reduce((a,i)=>a+i.price*i.qty,0)}
function badge(){$("cartCount").textContent=S.cart.reduce((a,i)=>a+i.qty,0);$("cartTotal").textContent=money(total());$("checkoutTotal").textContent=money(total())}
async function settings(){try{const r=await api("shop_settings?select=whatsapp_number&id=eq.1");if(r?.[0]?.whatsapp_number)S.wa=String(r[0].whatsapp_number).replace(/\D/g,"")}catch(e){console.warn(e)}}
async function products(){const r=await api("products?select=*&order=created_at.desc");S.products=(r||[]).filter(p=>p.available!==false&&Number(p.stock??1)>0);categories();filter()}
function categories(){const g=$("categoryGrid"),cs=[...new Set(S.products.map(p=>String(p.category||"Autres").trim()).filter(Boolean))];g.innerHTML=`<button class="cat ${S.cat==="all"?"active":""}" data-cat="all"><span>✦</span><strong>Tous les produits</strong><small>${S.products.length} produit(s)</small></button>`+cs.map(c=>`<button class="cat ${S.cat===c?"active":""}" data-cat="${esc(c)}"><span>◈</span><strong>${esc(c)}</strong><small>${S.products.filter(p=>String(p.category||"Autres").trim()===c).length} produit(s)</small></button>`).join("");g.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{S.cat=b.dataset.cat;categories();filter();document.querySelector("#boutique").scrollIntoView({behavior:"smooth"})})}
function filter(){let a=[...S.products];if(S.cat!=="all")a=a.filter(p=>String(p.category||"Autres").trim()===S.cat);if(S.q)a=a.filter(p=>`${p.name} ${p.description||""} ${p.category||""}`.toLowerCase().includes(S.q.toLowerCase()));if(S.sort==="price-asc")a.sort((x,y)=>x.price-y.price);if(S.sort==="price-desc")a.sort((x,y)=>y.price-x.price);if(S.sort==="name")a.sort((x,y)=>String(x.name).localeCompare(String(y.name),"fr"));S.filtered=a;render()}
function img(p){return p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" onerror="this.style.display='none'">`:`<span class="placeholder">✦</span>`}
function render(){const g=$("productGrid");if(!S.filtered.length){g.innerHTML='<div class="empty">Aucun produit ne correspond à votre recherche.</div>';return}g.innerHTML=S.filtered.map(p=>`<article class="card">${p.badge?`<span class="badge">${esc(p.badge)}</span>`:""}<div class="pic" data-view="${p.id}">${img(p)}</div><div class="info"><h3>${esc(p.name)}</h3><p>${esc(p.description||"Produit DH Shop & Delivery.")}</p><div class="price">${money(p.price)}</div><div class="cardBtns"><button class="view" data-view="${p.id}">Voir</button><button class="add" data-add="${p.id}">Ajouter</button></div></div></article>`).join("");g.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>view(b.dataset.add));g.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>view(b.dataset.view))}
function find(id){return S.products.find(p=>String(p.id)===String(id))}
function variantList(v){if(Array.isArray(v))return v.map(x=>String(x)).filter(Boolean);if(typeof v==="string"){try{const a=JSON.parse(v);if(Array.isArray(a))return a}catch{}return v.split(",").map(x=>x.trim()).filter(Boolean)}return[]}
function variantOptions(p){const sizes=variantList(p.sizes),colors=variantList(p.colors);let h="";if(sizes.length)h+=`<label class="variant-label">Taille<select id="modalSize"><option value="">Choisir</option>${sizes.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label>`;if(colors.length)h+=`<label class="variant-label">Couleur<select id="modalColor"><option value="">Choisir</option>${colors.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label>`;return h}
function add(id,size="",color=""){const p=find(id);if(!p)return;const key=`${p.id}|${size}|${color}`,i=S.cart.find(x=>x.key===key);if(i)i.qty++;else S.cart.push({key,id:p.id,name:p.name,price:Number(p.price),image_url:p.image_url||"",qty:1,size,color});save();cart();openCart()}
function cart(){const b=$("cartItems");if(!S.cart.length)b.innerHTML='<div class="empty">Votre panier est vide.</div>';else b.innerHTML=S.cart.map(i=>`<div class="row"><div class="thumb">${i.image_url?`<img src="${esc(i.image_url)}">`:"✦"}</div><div><h4>${esc(i.name)}</h4><small>${money(i.price)}${i.size?`<br>Taille : ${esc(i.size)}`:""}${i.color?`<br>Couleur : ${esc(i.color)}`:""}</small><div class="qty"><button data-m="${esc(i.key)}">−</button><b>${i.qty}</b><button data-p="${esc(i.key)}">+</button></div></div><button class="remove" data-r="${esc(i.key)}">Supprimer</button></div>`).join("");b.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>qty(x.dataset.m,-1));b.querySelectorAll("[data-p]").forEach(x=>x.onclick=()=>qty(x.dataset.p,1));b.querySelectorAll("[data-r]").forEach(x=>x.onclick=()=>remove(x.dataset.r));badge()}
function qty(key,d){const i=S.cart.find(x=>x.key===key);if(i)i.qty+=d;if(i?.qty<=0)remove(key);else{save();cart()}}
function remove(key){S.cart=S.cart.filter(x=>x.key!==key);save();cart()}
function openCart(){$("cartDrawer").classList.add("open");$("overlay").classList.add("open")}
function closeCart(){$("cartDrawer").classList.remove("open");$("overlay").classList.remove("open")}
function view(id){const p=find(id);if(!p)return;$("modalContent").innerHTML=`<div class="modalProduct"><div>${img(p)}</div><div><em>${esc(p.category||"PRODUIT")}</em><h2>${esc(p.name)}</h2><p>${esc(p.description||"Produit DH Shop & Delivery.")}</p><h3>${money(p.price)}</h3>${variantOptions(p)}<button class="btn gold full" id="modalAdd">Ajouter au panier</button></div></div>`;$("modalAdd").onclick=()=>{const size=$("modalSize")?.value||"",color=$("modalColor")?.value||"";if($("modalSize")&&!size)return alert("Veuillez choisir une taille.");if($("modalColor")&&!color)return alert("Veuillez choisir une couleur.");$("productModal").classList.remove("open");add(id,size,color)};$("productModal").classList.add("open")}

let dhInstallPrompt=null;
function dhIsInstalled(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
function dhInstallButton(){
  if(document.getElementById("dhInstallBtn") || dhIsInstalled())return;
  const b=document.createElement("button");
  b.id="dhInstallBtn";
  b.type="button";
  b.textContent="📱 Installer l’application";
  b.setAttribute("aria-label","Installer DH Shop & Delivery");
  b.style.cssText="position:fixed;right:16px;bottom:18px;z-index:99999;border:0;border-radius:999px;padding:13px 18px;background:#e5b93f;color:#080808;font-weight:800;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.28);cursor:pointer";
  b.onclick=async()=>{
    if(!dhInstallPrompt){
      alert("Chrome n’a pas encore proposé l’installation pour cette page. Ouvrez le menu ⋮ de Chrome et choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil » si cette option apparaît.");
      return;
    }
    try{
      dhInstallPrompt.prompt();
      const choice=await dhInstallPrompt.userChoice;
      console.log("DH Shop — résultat installation :",choice.outcome);
    }catch(err){
      console.error("DH Shop — installation :",err);
    }finally{
      dhInstallPrompt=null;
      b.remove();
    }
  };
  document.body.appendChild(b);
}

// Chrome/Chromium : conserver l'événement officiel avant de proposer l'installation.
if("BeforeInstallPromptEvent" in window){
  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();
    dhInstallPrompt=e;
    dhInstallButton();
  });
}

window.addEventListener("appinstalled",()=>{
  dhInstallPrompt=null;
  document.getElementById("dhInstallBtn")?.remove();
});

function makeRef(){return"DH-"+Date.now().toString().slice(-8)}
async function order(e){e.preventDefault();if(!S.cart.length)return alert("Votre panier est vide.");const m=$("checkoutMessage"),btn=e.submitter;btn.disabled=true;m.textContent="Enregistrement…";const ref=makeRef(),o={customer_name:$("customerName").value.trim(),phone:$("customerPhone").value.trim(),address:$("customerAddress").value.trim(),items:S.cart,total:total(),payment_method:$("paymentMethod").value,status:"Nouvelle",reference:ref};try{await api("orders",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(o)});const lines=S.cart.map(i=>`• ${i.name}${i.size?` — Taille ${i.size}`:""}${i.color?` — ${i.color}`:""} x${i.qty} — ${money(i.price*i.qty)}`).join("\n"),text=`🛍️ *NOUVELLE COMMANDE — DH SHOP & DELIVERY*\n\nRéférence : *${ref}*\nNom : ${o.customer_name}\nTéléphone : ${o.phone}\nAdresse : ${o.address}\nPaiement : ${o.payment_method}\n\n${lines}\n\n*TOTAL : ${money(o.total)}*`,wa=`https://wa.me/${S.wa}?text=${encodeURIComponent(text)}`;S.cart=[];save();cart();$("checkoutForm").reset();m.innerHTML=`✅ Commande enregistrée : <b>${ref}</b><br><small>Conservez cette référence pour suivre votre commande.</small><br><a class="btn gold" target="_blank" href="${wa}">Continuer sur WhatsApp</a>`}catch(x){m.textContent="❌ "+(x.message||"Erreur")}finally{btn.disabled=false}}
async function track(e){e.preventDefault();const v=$("trackingInput").value.trim().toUpperCase(),r=$("trackingResult");r.textContent="Recherche…";if(!/^DH-[A-Z0-9]+$/.test(v))return void(r.textContent="Entrez une référence comme DH-07048624.");try{const a=await api(`orders?reference=eq.${encodeURIComponent(v)}&select=reference,status,created_at`);r.innerHTML=a?.length?`<strong>Commande ${esc(a[0].reference)}</strong><br>Statut : <b>${esc(a[0].status||"En traitement")}</b><br><small>${new Date(a[0].created_at).toLocaleString("fr-FR")}</small>`:"Commande introuvable."; }catch(x){r.textContent="Impossible de vérifier la commande."}}
async function init(){dhInstallButton();$("year").textContent=new Date().getFullYear();$("cartBtn").onclick=openCart;$("closeCart").onclick=closeCart;$("continueBtn").onclick=closeCart;$("overlay").onclick=closeCart;$("closeProductModal").onclick=()=>$("productModal").classList.remove("open");$("closeCheckoutModal").onclick=()=>$("checkoutModal").classList.remove("open");$("checkoutBtn").onclick=()=>{if(!S.cart.length)return alert("Votre panier est vide.");closeCart();$("checkoutModal").classList.add("open")};$("checkoutForm").onsubmit=order;$("trackingForm").onsubmit=track;$("searchInput").oninput=e=>{S.q=e.target.value;filter()};$("sortSelect").onchange=e=>{S.sort=e.target.value;filter()};$("searchBtn").onclick=()=>{document.querySelector("#boutique").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("searchInput").focus(),300)};$("menuBtn").onclick=()=>$("mobileNav").classList.toggle("open");document.querySelectorAll("#mobileNav a").forEach(a=>a.onclick=()=>$("mobileNav").classList.remove("open"));$("footerWhatsapp").onclick=e=>{e.preventDefault();open(`https://wa.me/${S.wa}`,"_blank")};cart();try{await settings();await products();$("productStatus").textContent=S.products.length?`${S.products.length} produit(s) disponibles`:"Aucun produit disponible pour le moment."}catch(e){console.error(e);$("productStatus").className="status error";$("productStatus").innerHTML=`<b>Impossible de charger les produits.</b><br><small>${esc(e.message)}</small><br><button class="btn gold" id="retry">Réessayer</button>`;$("retry").onclick=init}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();