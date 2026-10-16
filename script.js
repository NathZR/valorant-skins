const API = "https://valorant-api.com/v1";
const TIERS = {Select:875, Deluxe:1275, Premium:1775, Exclusive:2175, Ultra:2475};
const MELEE = {Select:1775, Deluxe:2550, Premium:3550, Exclusive:4350, Ultra:4950}; // estimations
const MAIN = ["Vandal","Phantom","Operator","Sheriff","Ghost"];
const EUR = 0.00999, PAGE = 60;
let skins = [], f = {q:"", weapon:"all", tier:"all", sort:"name", shown:PAGE};
const $ = id => document.getElementById(id);

async function init(){
  try{
    const [w, s, t] = await Promise.all([
      fetch(`${API}/weapons?language=fr-FR`).then(r=>r.json()),
      fetch(`${API}/weapons/skins?language=fr-FR`).then(r=>r.json()),
      fetch(`${API}/contenttiers`).then(r=>r.json())
    ]);
    const tierMap = {}; t.data.forEach(x => tierMap[x.uuid] = x.devName);
    const skinWeapon = {};
    w.data.forEach(wp => wp.skins.forEach(sk => skinWeapon[sk.uuid] = wp));
    s.data.forEach(sk => {
      const tier = tierMap[sk.contentTierUuid];
      const wp = skinWeapon[sk.uuid];
      if(!tier || !TIERS[tier] || !wp) return;
      const melee = wp.category.endsWith("Melee");
      const img = sk.displayIcon || (sk.chromas[0] && sk.chromas[0].fullRender) || (sk.levels[0] && sk.levels[0].displayIcon);
      if(!img) return;
      skins.push({name:sk.displayName, img, tier, weapon: melee ? "Mêlée" : wp.displayName,
        group: melee ? "Mêlée" : (MAIN.includes(wp.displayName) ? wp.displayName : "Autres"),
        vp: (melee ? MELEE : TIERS)[tier]});
    });
    $("msg").remove();
    buildFilters(); render();
  }catch(e){ $("msg").textContent = "Impossible de charger les données. Réessaie plus tard."; }
}

function buildFilters(){
  const groups = [...MAIN, "Mêlée", "Autres"];
  $("weapons").innerHTML = btn("weapon","all","Tout",skins.length) +
    groups.map(g => btn("weapon",g,g,skins.filter(s=>s.group===g).length)).join("");
  $("tiers").innerHTML = btn("tier","all","Tous") +
    Object.keys(TIERS).map(t => btn("tier",t,`${t} · ${TIERS[t]} VP`,skins.filter(s=>s.tier===t).length,"t-"+t.toLowerCase())).join("");
  document.querySelectorAll(".btn[data-k]").forEach(b => b.onclick = () => { f[b.dataset.k]=b.dataset.v; f.shown=PAGE; render(); });
}
const btn = (k,v,label,n,cls="") => `<button class="btn ${cls}" data-k="${k}" data-v="${v}">${label}${n!=null?` <small>(${n})</small>`:""}</button>`;

function render(){
  document.querySelectorAll(".btn[data-k]").forEach(b => b.classList.toggle("on", f[b.dataset.k]===b.dataset.v));
  let list = skins.filter(s =>
    (f.weapon==="all" || s.group===f.weapon) && (f.tier==="all" || s.tier===f.tier) &&
    (s.name+" "+s.weapon).toLowerCase().includes(f.q));
  list.sort((a,b) => f.sort==="asc" ? a.vp-b.vp || a.name.localeCompare(b.name)
    : f.sort==="desc" ? b.vp-a.vp || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
  $("count").textContent = `${list.length} RÉSULTATS`;
  $("grid").innerHTML = list.slice(0,f.shown).map(s => `
    <div class="card"><div class="img"><span class="tag t-${s.tier.toLowerCase()}">${s.tier.toUpperCase()}</span>
    <img loading="lazy" src="${s.img}" alt="${s.name}"></div>
    <div class="name">${s.name}</div><div class="sub">${s.weapon}</div>
    <div class="price">${s.vp.toLocaleString("fr-FR")} VP<small>≈ ${(s.vp*EUR).toFixed(2).replace(".",",")} €</small></div></div>`).join("");
  $("more").hidden = list.length <= f.shown;
}
$("q").oninput = e => { f.q = e.target.value.toLowerCase().trim(); f.shown=PAGE; render(); };
$("sort").onchange = e => { f.sort = e.target.value; render(); };
$("more").onclick = () => { f.shown += PAGE; render(); };
init();
