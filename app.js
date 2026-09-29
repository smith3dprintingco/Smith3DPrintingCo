let catalog = window.SMITH_CATALOG;
let cart = JSON.parse(localStorage.getItem("s3d-cart") || "[]");
const API_BASE = "https://smith3dprintingco-backend.onrender.com";
const $ = s => document.querySelector(s);
const money = cents => `$${(cents/100).toFixed(2)}`;
let selectedShipping = null;
let shippingAddress = null;

const states = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
};

document.addEventListener("DOMContentLoaded", init);

function fillSelect(id, values){
  const el=$(id); if(!el) return;
  el.innerHTML=values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function init(){
  fillSelect("#caliber",catalog.cartridges);
  fillSelect("#bulletColor",catalog.colors);
  fillSelect("#caseColor",catalog.colors);
  fillSelect("#gauge",catalog.products.shotgunShell.gauges);
  fillSelect("#shellHeadColor",catalog.colors);
  fillSelect("#shellCaseColor",catalog.colors);
  fillSelect("#shipState",Object.entries(states).map(([abbr,name])=>abbr));
  $("#shipState").innerHTML=Object.entries(states).map(([abbr,name])=>`<option value="${abbr}">${name}</option>`).join("");
  $("#year").textContent=new Date().getFullYear();
  updateCartridgePrice(); updateShellPrice(); renderCart(); resetShipping();

  $("#openCart").onclick=openCart; $("#closeCart").onclick=closeCart; $("#overlay").onclick=closeCart;
  $("#cartText").oninput=()=>{$("#charCount").textContent=$("#cartText").value.length;updateCartridgePrice();};
  $("#shellText").oninput=()=>{$("#shellCharCount").textContent=$("#shellText").value.length;updateShellPrice();};
  ["#caliber","#bulletColor","#caseColor","#cartQty"].forEach(s=>$(s).addEventListener("change",updateCartridgePrice));
  ["#gauge","#shellHeadColor","#shellCaseColor","#shellQty"].forEach(s=>$(s).addEventListener("change",updateShellPrice));
  document.querySelectorAll(".qty button").forEach(b=>b.onclick=()=>{const input=$("#"+b.dataset.q);input.value=Math.max(1,+input.value+(+b.dataset.d));input.dispatchEvent(new Event("change"));});
  $("#addCartridge").onclick=()=>addItem(currentCartridge());
  $("#addShell").onclick=()=>addItem(currentShell());
  document.querySelectorAll(".thumbs button").forEach(b=>b.onclick=()=>{$("#cartridgeImage").src=b.dataset.img;document.querySelectorAll(".thumbs button").forEach(x=>x.style.borderColor="transparent");b.style.borderColor="var(--accent)";});
  $("#getShipping").onclick=calculateShipping;
  $("#checkout").onclick=checkout;
}
function currentCartridge(){const text=$("#cartText").value.trim();return {type:"cartridge",name:catalog.products.cartridge.name,caliber:$("#caliber").value,bulletColor:$("#bulletColor").value,caseColor:$("#caseColor").value,customText:text,qty:Math.max(1,+$("#cartQty").value||1)};}
function currentShell(){const text=$("#shellText").value.trim();return {type:"shotgunShell",name:catalog.products.shotgunShell.name,gauge:$("#gauge").value,headColor:$("#shellHeadColor").value,caseColor:$("#shellCaseColor").value,customText:text,qty:Math.max(1,+$("#shellQty").value||1)};}
function unitPrice(item){const p=catalog.products[item.type];return p.basePriceCents + (item.customText ? p.customTextFeeCents : 0);}
function updateCartridgePrice(){const i=currentCartridge();$("#cartPrice").innerHTML=`${money(unitPrice(i))} <small>each</small>`;}
function updateShellPrice(){const i=currentShell();$("#shellPrice").textContent=money(unitPrice(i))+" each";}
function save(){localStorage.setItem("s3d-cart",JSON.stringify(cart));renderCart();}
function addItem(item){const key=JSON.stringify({...item,qty:undefined});const existing=cart.find(x=>x.key===key);if(existing)existing.qty+=item.qty;else cart.push({...item,key});save();resetShipping();openCart();}
function renderCart(){
  $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  if(!cart.length){$("#cartItems").innerHTML="<p class='fine'>Your cart is empty.</p>";$("#cartTotal").textContent="$0.00";$("#shippingTotal").textContent="Select a rate";$("#checkout").disabled=true;return;}
  $("#cartItems").innerHTML=cart.map((x,i)=>`<div class="cart-item"><strong>${escapeHtml(x.name)}</strong><small>${x.type==="cartridge"?`Caliber: ${escapeHtml(x.caliber)}<br>Bullet: ${escapeHtml(x.bulletColor)}<br>Casing: ${escapeHtml(x.caseColor)}`:`Gauge: ${escapeHtml(x.gauge)}<br>Head: ${escapeHtml(x.headColor)}<br>Case: ${escapeHtml(x.caseColor)}`}<br>Custom text: ${escapeHtml(x.customText||"None")}</small><div class="cart-row"><div class="mini-qty"><button onclick="changeQty(${i},-1)">−</button>${x.qty}<button onclick="changeQty(${i},1)">+</button></div><strong>${money(unitPrice(x)*x.qty)}</strong></div></div>`).join("");
  $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+unitPrice(x)*x.qty,0));
}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);save();resetShipping();}
function openCart(){$("#cartDrawer").classList.add("open");$("#overlay").classList.add("open");}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#overlay").classList.remove("open");}
function resetShipping(){
  selectedShipping=null; shippingAddress=null;
  const rateBox=$("#shippingRates"), status=$("#shippingStatus");
  if(rateBox) rateBox.innerHTML="";
  if(status) status.textContent="";
  if($("#shippingTotal")) $("#shippingTotal").textContent="Select a rate";
  if($("#checkout")) $("#checkout").disabled=true;
}
function getShippingAddress(){
  const first=$("#shipFirstName").value.trim(), last=$("#shipLastName").value.trim();
  const address={name:`${first} ${last}`.trim(),street1:$("#shipStreet").value.trim(),street2:$("#shipStreet2").value.trim(),city:$("#shipCity").value.trim(),state:$("#shipState").value,zip:$("#shipZip").value.trim(),country:"US"};
  if(!address.name || !address.street1 || !address.city || !address.state || !address.zip) throw new Error("Please complete your name, street address, city, state, and ZIP code.");
  if(!/^\d{5}(-\d{4})?$/.test(address.zip)) throw new Error("Please enter a valid U.S. ZIP code.");
  return address;
}
async function calculateShipping(){
  if(!cart.length){alert("Your cart is empty.");return;}
  const button=$("#getShipping"), status=$("#shippingStatus"), ratesBox=$("#shippingRates");
  button.disabled=true; button.textContent="Calculating…"; status.textContent="Contacting USPS rates through EasyPost…"; ratesBox.innerHTML=""; selectedShipping=null; $("#shippingTotal").textContent="Select a rate"; $("#checkout").disabled=true;
  try{
    const address=getShippingAddress();
    const r=await fetch(`${API_BASE}/api/shipping-rates`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||`Shipping request failed (${r.status}).`);
    if(!Array.isArray(data.rates)||!data.rates.length) throw new Error("No USPS shipping options were returned for this address.");
    shippingAddress=address;
    ratesBox.innerHTML=data.rates.map((rate,i)=>{
      const id=`ship-rate-${i}`;
      const eta=rate.deliveryDays ? `Estimated ${rate.deliveryDays} business day${rate.deliveryDays===1?"":"s"}` : "Delivery estimate unavailable";
      return `<label class="shipping-rate" for="${id}"><input type="radio" id="${id}" name="shippingRate" value="${escapeHtml(rate.service)}"><span><strong>${escapeHtml(rate.carrier)} ${escapeHtml(rate.service)}</strong><small>${eta}</small></span><b>${money(Math.round(rate.rate*100))}</b></label>`;
    }).join("");
    ratesBox.querySelectorAll('input[name="shippingRate"]').forEach(input=>input.addEventListener("change",()=>{
      const rate=data.rates.find(x=>x.service===input.value); selectedShipping=rate; $("#shippingTotal").textContent=money(Math.round(rate.rate*100)); $("#checkout").disabled=false;
    }));
    status.textContent="Shipping rates calculated. Choose a shipping method below.";
  }catch(e){status.textContent=e.message||"Unable to calculate shipping.";}
  finally{button.disabled=false;button.textContent="Calculate shipping";}
}
async function checkout(){
  if(!cart.length)return;
  if(!shippingAddress||!selectedShipping){alert("Please enter your shipping address and select a shipping method first.");return;}
  const button=$("#checkout"); button.disabled=true; button.textContent="Opening Stripe…";
  try{
    const r=await fetch(`${API_BASE}/api/create-checkout-session`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:cart,shippingAddress,shippingService:selectedShipping.service})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||`Checkout request failed (${r.status}).`);
    if(!data.url)throw new Error("No Stripe Checkout URL returned.");
    location.href=data.url;
  }catch(e){alert(`Stripe checkout could not be started. ${e.message}`);button.disabled=false;button.textContent="Secure checkout";}
}
window.changeQty=changeQty;
