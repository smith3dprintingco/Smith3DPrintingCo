let catalog;
let cart = JSON.parse(localStorage.getItem("s3d-cart") || "[]");
const $ = s => document.querySelector(s);
const money = cents => `$${(cents/100).toFixed(2)}`;

fetch("catalog.json").then(r=>r.json()).then(data=>{
  catalog=data; init();
}).catch(()=>alert("Catalog could not be loaded."));

function fillSelect(id, values){
  const el=$(id); el.innerHTML=values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function init(){
  fillSelect("#caliber",catalog.cartridges);
  fillSelect("#bulletColor",catalog.colors);
  fillSelect("#caseColor",catalog.colors);
  fillSelect("#gauge",catalog.products.shotgunShell.gauges);
  fillSelect("#shellHeadColor",catalog.colors);
  fillSelect("#shellCaseColor",catalog.colors);
  $("#year").textContent=new Date().getFullYear();
  updateCartridgePrice(); updateShellPrice(); renderCart();
}
function currentCartridge(){
  const text=$("#cartText").value.trim();
  return {type:"cartridge",name:catalog.products.cartridge.name,caliber:$("#caliber").value,bulletColor:$("#bulletColor").value,caseColor:$("#caseColor").value,customText:text,qty:Math.max(1,+$("#cartQty").value||1)};
}
function currentShell(){
  const text=$("#shellText").value.trim();
  return {type:"shotgunShell",name:catalog.products.shotgunShell.name,gauge:$("#gauge").value,headColor:$("#shellHeadColor").value,caseColor:$("#shellCaseColor").value,customText:text,qty:Math.max(1,+$("#shellQty").value||1)};
}
function unitPrice(item){
  const p=catalog.products[item.type];
  return p.basePriceCents==null ? null : p.basePriceCents + (item.customText ? p.customTextFeeCents : 0);
}
function updateCartridgePrice(){const i=currentCartridge();$("#cartPrice").innerHTML=`${money(unitPrice(i))} <small>each</small>`}
function updateShellPrice(){const i=currentShell(); const p=unitPrice(i); $("#shellPrice").textContent=p==null?"Price coming soon":money(p)+" each";}
function save(){localStorage.setItem("s3d-cart",JSON.stringify(cart));renderCart()}
function addItem(item){
  if(unitPrice(item)==null)return;
  const key=JSON.stringify({...item,qty:undefined});
  const existing=cart.find(x=>x.key===key);
  if(existing)existing.qty+=item.qty;else cart.push({...item,key});
  save();openCart();
}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  if(!cart.length){$("#cartItems").innerHTML="<p class='fine'>Your cart is empty.</p>";$("#cartTotal").textContent="$0.00";return}
  $("#cartItems").innerHTML=cart.map((x,i)=>`<div class="cart-item"><strong>${escapeHtml(x.name)}</strong><small>${x.type==="cartridge"?`Caliber: ${escapeHtml(x.caliber)}<br>Bullet: ${escapeHtml(x.bulletColor)}<br>Casing: ${escapeHtml(x.caseColor)}`:`Gauge: ${escapeHtml(x.gauge)}<br>Head: ${escapeHtml(x.headColor)}<br>Case: ${escapeHtml(x.caseColor)}`}<br>Custom text: ${escapeHtml(x.customText||"None")}</small><div class="cart-row"><div class="mini-qty"><button onclick="changeQty(${i},-1)">−</button>${x.qty}<button onclick="changeQty(${i},1)">+</button></div><strong>${money(unitPrice(x)*x.qty)}</strong></div></div>`).join("");
  $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+unitPrice(x)*x.qty,0));
}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);save()}
function openCart(){$("#cartDrawer").classList.add("open");$("#overlay").classList.add("open")}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("open")}
$("#openCart").onclick=openCart;$("#closeCart").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#cartText").oninput=()=>{$("#charCount").textContent=$("#cartText").value.length;updateCartridgePrice()};
$("#shellText").oninput=()=>{$("#shellCharCount").textContent=$("#shellText").value.length;updateShellPrice()};
["#caliber","#bulletColor","#caseColor","#cartQty"].forEach(s=>$(s).addEventListener("change",updateCartridgePrice));
["#gauge","#shellHeadColor","#shellCaseColor","#shellQty"].forEach(s=>$(s).addEventListener("change",updateShellPrice));
document.querySelectorAll(".qty button").forEach(b=>b.onclick=()=>{const input=$("#"+b.dataset.q);input.value=Math.max(1,+input.value+(+b.dataset.d));input.dispatchEvent(new Event("change"))});
$("#addCartridge").onclick=()=>addItem(currentCartridge());
$("#addShell").onclick=()=>addItem(currentShell());
document.querySelectorAll(".thumbs button").forEach(b=>b.onclick=()=>{$("#cartridgeImage").src=b.dataset.img;document.querySelectorAll(".thumbs button").forEach(x=>x.style.borderColor="transparent");b.style.borderColor="var(--accent)"});
$("#checkout").onclick=async()=>{
  if(!cart.length)return;
  try{
    const r=await fetch("/api/create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart})});
    if(!r.ok)throw new Error("Checkout is not connected yet.");
    const data=await r.json(); if(data.url)location.href=data.url; else throw new Error("No checkout URL returned.");
  }catch(e){alert("Stripe checkout is not connected yet. Once the live site is linked to your Stripe account, this button will open secure Stripe Checkout.")}
};


document.querySelectorAll('[data-shell-img]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('shellImage').src=b.dataset.shellImg;}));
