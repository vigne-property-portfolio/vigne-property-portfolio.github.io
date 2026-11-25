(function(){
"use strict";
var DATA={settings:{},projects:[]};
var STATUSES=["Draft","New Launch","Selling Now","Final Units","Completed","Sold Out"];
var app=document.getElementById("app");
var S={isAdmin:false,preview:false,mode:"view",draft:null,settingsDraft:null,confirmDel:null,saving:false,uploading:"",lb:null,ready:false};

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function okId(id){return typeof id==="string"&&/^[a-z0-9-]+\.(jpg|png|webp|gif|pdf)$/i.test(id)}
function blob(id){return "/uploads/"+id}
function httpsUrl(u){return typeof u==="string"&&/^https:\/\//i.test(u.trim())?u.trim():""}
function slugify(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70)||"project"}
function initials(s){var w=String(s||"").trim().split(/\s+/).filter(Boolean);return ((w[0]||"P")[0]+((w[1]||"")[0]||"")).toUpperCase()}
function lines(s){return String(s||"").split(/\n+/).map(function(x){return x.replace(/^[\s•\-*]+/,"").trim()}).filter(Boolean)}
function digits(s){var d=String(s||"").replace(/[^0-9]/g,"");return /^0/.test(d)?"6"+d:d} /* adds Malaysia's 60 to local numbers for WhatsApp */
function currentSlug(){var m=location.pathname.match(/^\/p\/([^\/]+)\/?$/);try{return m?decodeURIComponent(m[1]):""}catch(e){return ""}}
function findP(slug){for(var i=0;i<DATA.projects.length;i++)if(DATA.projects[i].slug===slug)return DATA.projects[i];return null}
function shareUrl(p){var b=(DATA.settings.baseUrl||"").trim().replace(/\/+$/,"")||location.origin;return b+"/p/"+p.slug}
function clone(o){return JSON.parse(JSON.stringify(o))}
function toast(msg){var t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},3200)}
function nav(path){if(location.pathname!==path)history.pushState(null,"",path);S.lb=null;render();window.scrollTo(0,0);refresh()}
/* Re-load the latest projects from the server so an old tab never shows stale details. */
function refresh(){
  if(window.STATIC_SITE||S.mode!=="view")return;
  fetch("/api/data?p="+encodeURIComponent(currentSlug())).then(function(r){return r.json()}).then(function(d){
    if(!d||S.mode!=="view")return;var a=JSON.stringify(d);if(a===JSON.stringify(DATA))return;
    DATA=d;DATA.settings=DATA.settings||{};DATA.projects=DATA.projects||[];render();
  }).catch(function(){});
}
window.addEventListener("focus",refresh);
document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh()});

/* ---------- client presentation ---------- */
function agentBlock(){
  var s=DATA.settings, name=s.agentName||"Your Property Consultant";
  var wa=digits(s.whatsapp);
  var meta=[s.agentTitle,s.agency,s.renNo].filter(Boolean).map(function(x){return "<span>"+esc(x)+"</span>"}).join("");
  var phone=s.phone?'<div class="contact-line"><span class="eyebrow" style="letter-spacing:.22em">Tel</span><a class="num" style="text-decoration:none" href="tel:'+esc(s.phone.replace(/[^0-9+]/g,""))+'">'+esc(s.phone)+'</a><button class="btn btn-sm btn-ghost" data-act="copytext" data-text="'+esc(s.phone)+'">Copy</button></div>':"";
  var email=s.email?'<div class="contact-line"><span class="eyebrow" style="letter-spacing:.22em">Email</span><a class="num" style="font-size:15px;text-decoration:none" href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></div>':"";
  return '<div class="agent"><div class="mono">'+esc(initials(name))+'</div><div style="min-width:0"><div class="eyebrow">Your consultant</div><h3 style="margin-top:6px">'+esc(name)+'</h3><div class="meta">'+meta+'</div>'+phone+email+'</div><div class="actions">'+(wa?'<a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'')+
    '<button class="btn" data-act="card">Download name card</button>'+(s.phone||wa||s.email?'<button class="btn btn-ghost" data-act="vcard">Save contact</button>':'')+'</div></div>';
}
function waLink(p){var wa=digits(DATA.settings.whatsapp);return wa?"https://wa.me/"+wa+"?text="+encodeURIComponent("Hi, I would like to know more about "+p.name+"."):""}

function topbar(right){
  var s=DATA.settings,name=s.agentName||"Private Presentation";
  return '<header class="topbar"><div class="wrap"><div class="brand"><div class="mono">'+esc(initials(s.agentName||"P P"))+'</div><div style="min-width:0"><div class="brand-name">'+esc(name)+'</div><div class="brand-sub">'+esc(s.agency||"Private Property Presentation")+'</div></div></div>'+(right||"")+'</div></header>';
}

function renderProject(p){
  var imgs=(p.images||[]).filter(okId), cover=imgs[0];
  var wa=waLink(p);
  var facts=[["Price from",p.priceFrom],["Tenure",p.tenure],["Built-up",p.builtUp],["Completion",p.completion],["Property type",p.propertyType],["Developer",p.developer],["Total units",p.totalUnits],["Maintenance",p.maintenance]].filter(function(f){return f[1]});
  var h='';
  h+=topbar(wa?'<a class="btn btn-sm btn-solid" target="_blank" rel="noopener" href="'+esc(wa)+'">Enquire on WhatsApp</a>':'');
  h+='<section class="hero">'+(cover?'<img class="cover" src="'+blob(cover)+'" alt="'+esc(p.name)+'">':'<div class="ghost-mark" aria-hidden="true">'+esc(initials(p.name))+'</div>')+
     '<div class="hero-inner"><div class="wrap reveal">'+
     '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><span class="eyebrow">'+esc(p.area||"")+'</span>'+(p.status&&p.status!=="Draft"?'<span class="status-chip">'+esc(p.status)+'</span>':'')+'</div>'+
     '<h1 class="gold-text">'+esc(p.name)+'</h1>'+(p.tagline?'<p class="tagline" style="margin:0">'+esc(p.tagline)+'</p>':'')+
     (facts.length?'<div class="facts">'+facts.slice(0,4).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v">'+esc(f[1])+'</div></div>'}).join("")+'</div>':'')+
     (p.priceNote?'<p class="muted" style="font-size:12px;margin:12px 0 0">'+esc(p.priceNote)+'</p>':'')+
     '</div></div></section>';

  var hl=lines(p.highlights);
  if(p.description||hl.length||facts.length>4){
    h+='<section class="block"><div class="wrap"><div class="two-col"><div><div class="sec-head"><span class="eyebrow">The residence</span><h2>Overview</h2></div><div class="prose">'+esc(p.description||"")+'</div>'+
       (facts.length>4?'<div class="facts" style="margin-top:34px">'+facts.slice(4).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v" style="font-size:19px">'+esc(f[1])+'</div></div>'}).join("")+'</div>':'')+
       '</div>'+(hl.length?'<div><div class="sec-head"><span class="eyebrow">Why it matters</span><h2>Highlights</h2></div><ul class="highlights">'+hl.map(function(x){return '<li><span class="diamond"></span><span>'+esc(x)+'</span></li>'}).join("")+'</ul></div>':'')+'</div></div></section>';
  }
  if(imgs.length>1){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">'+imgs.length+' photographs</span><h2>Gallery</h2></div><div class="gallery">'+imgs.map(function(id,i){return '<button data-act="lb" data-i="'+i+'" aria-label="Open photo '+(i+1)+'"><img loading="lazy" src="'+blob(id)+'" alt=""></button>'}).join("")+'</div></div></section>';
  }
  var units=(p.units||[]).filter(function(u){return u&&(u.type||u.size||u.price)});
  if(units.length){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">Layouts &amp; pricing</span><h2>Unit types</h2></div><div class="table-wrap"><table><thead><tr><th>Type</th><th>Built-up</th><th>Bedrooms</th><th>Price from</th></tr></thead><tbody>'+
       units.map(function(u){return '<tr><td class="u-name">'+esc(u.type)+'</td><td>'+esc(u.size)+'</td><td>'+esc(u.beds)+'</td><td class="u-price">'+esc(u.price)+'</td></tr>'}).join("")+'</tbody></table></div></div></section>';
  }
  var fac=lines(p.facilities), map=httpsUrl(p.mapUrl), vid=httpsUrl(p.videoUrl), bro=okId(p.brochure)?p.brochure:"";
  if(fac.length||p.address||map||vid||bro){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="two-col">'+
      (fac.length?'<div><div class="sec-head"><span class="eyebrow">Lifestyle</span><h2>Facilities</h2></div><div class="facilities">'+fac.map(function(x){return '<span>'+esc(x)+'</span>'}).join("")+'</div></div>':'<div></div>')+
      '<div><div class="sec-head"><span class="eyebrow">Address</span><h2>Location</h2></div><p class="prose" style="margin:0">'+esc(p.address||p.area||"")+'</p>'+
      '<div class="links-row">'+(map?'<a class="btn" target="_blank" rel="noopener" href="'+esc(map)+'">Open in Maps</a>':'')+(vid?'<a class="btn" target="_blank" rel="noopener" href="'+esc(vid)+'">Watch video tour</a>':'')+(bro?'<a class="btn" target="_blank" rel="noopener" href="'+blob(bro)+'">View brochure (PDF)</a>':'')+'</div></div>'+
      '</div></div></section>';
  }
  h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="rule" style="margin-bottom:40px"><span class="diamond"></span></div>'+agentBlock()+'</div></section>';
  h+='<footer class="foot"><div class="wrap"><span>Prepared exclusively for you by '+esc(DATA.settings.agentName||"your consultant")+(DATA.settings.renNo?" · "+esc(DATA.settings.renNo):"")+'.</span><span>All information, images and prices are subject to change and to the developer’s official confirmation. Artist impressions only.</span></div></footer>';
  if(wa)h+='<div class="mobile-cta"><a class="btn btn-solid" target="_blank" rel="noopener" href="'+esc(wa)+'">WhatsApp me about this project</a></div>';
  if(S.isAdmin&&!S.preview){
    h+='<div class="admin-bar"><button class="btn btn-sm" data-act="home">← Portfolio</button><button class="btn btn-sm" data-act="copy" data-slug="'+esc(p.slug)+'">Copy client link</button><button class="btn btn-sm btn-solid" data-act="edit" data-slug="'+esc(p.slug)+'">Edit</button><a class="btn btn-sm" data-act="pdf" href="/api/brochure.pdf?p='+encodeURIComponent(p.slug)+'">Download brochure</a><button class="btn btn-sm btn-ghost" data-act="preview">Client view</button></div>';
  }else if(S.isAdmin&&S.preview){
    h+='<div class="admin-bar"><span class="muted" style="font-size:12px;padding:8px 10px">Showing what your client sees</span><button class="btn btn-sm" data-act="preview">Exit client view</button></div>';
  }
  if(S.lb!=null&&imgs.length){
    var i=((S.lb%imgs.length)+imgs.length)%imgs.length;
    h+='<div class="lightbox" role="dialog" aria-label="Photo viewer"><img src="'+blob(imgs[i])+'" alt=""><button class="lb-btn lb-close" data-act="lbclose" aria-label="Close">✕</button><button class="lb-btn lb-prev" data-act="lbprev" aria-label="Previous">‹</button><button class="lb-btn lb-next" data-act="lbnext" aria-label="Next">›</button><div class="lb-count">'+(i+1)+' / '+imgs.length+'</div></div>';
  }
  return h;
}

function renderPrivate(){
  return topbar("")+'<div class="private"><div class="wrap"><div class="box"><div class="rule" style="width:180px"><span class="diamond"></span></div><span class="eyebrow">Private presentation</span><h1 class="gold-text">'+(S.ready?"Projects are shared by invitation":"Loading…")+'</h1>'+(S.ready?'<p class="muted" style="max-width:46ch">Please open the full link your consultant sent you to view your project presentation.</p>':'')+'</div><div style="margin-top:56px;text-align:left">'+(S.ready?agentBlock():"")+'</div></div></div>';
}

/* ---------- landing page (main page of the website) ---------- */
var DEFAULT_SERVICES="New launch projects\nSubsale & resale homes\nRental & tenancy\nInvestment planning & financing guidance";
function landingProjects(){return DATA.projects.filter(function(p){return p.featured==="Yes"&&p.status!=="Draft"})}
function renderLanding(){
  var s=DATA.settings,name=s.agentName||"Property Consultant",wa=digits(s.whatsapp);
  var feat=landingProjects(),photo=s.photo&&okId(s.photo)?s.photo:"";
  var bg=(feat[0]&&(feat[0].images||[]).filter(okId)[0])||"";
  var services=lines(s.services||DEFAULT_SERVICES);
  var h=topbar(wa?'<a class="btn btn-sm btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp me</a>':'');
  h+='<section class="hero landing-hero">'+(bg?'<img class="cover" src="'+blob(bg)+'" alt="">':'<div class="ghost-mark" aria-hidden="true">'+esc(initials(name))+'</div>')+
    '<div class="hero-inner"><div class="wrap reveal landing-grid"><div style="min-width:0">'+
    '<span class="eyebrow">'+esc([s.agentTitle||"Property Consultant",s.city||"Kuala Lumpur"].join(" · "))+'</span>'+
    '<h1 class="gold-text">'+esc(name)+'</h1>'+
    '<p class="tagline" style="margin:0 0 28px">'+esc(s.headline||"Luxury and investment property in Kuala Lumpur, presented privately.")+'</p>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap">'+(wa?'<a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'?text='+encodeURIComponent("Hi "+name+", I found your website and would like to know more.")+'">Talk to me on WhatsApp</a>':'')+
    '<button class="btn" data-act="card">Download name card</button></div>'+
    '<div class="facts" style="margin-top:34px">'+[["Agency",s.agency],["REN",s.renNo],["Mobile",s.phone]].filter(function(f){return f[1]}).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v" style="font-size:19px">'+esc(f[1])+'</div></div>'}).join("")+'</div>'+
    '</div>'+(photo?'<div class="portrait"><img src="'+blob(photo)+'" alt="'+esc(name)+'"></div>':'')+'</div></div></section>';
  h+='<section class="block"><div class="wrap"><div class="two-col"><div><div class="sec-head"><span class="eyebrow">About</span><h2>Your consultant in the city</h2></div><div class="prose">'+esc(s.about||("I help buyers and investors find the right property in Kuala Lumpur, from new launches in the Golden Triangle to established neighbourhoods. Every recommendation comes with clear numbers, honest advice and a private presentation made for you."))+'</div></div>'+
    '<div><div class="sec-head"><span class="eyebrow">How I can help</span><h2>Services</h2></div><ul class="highlights">'+services.map(function(x){return '<li><span class="diamond"></span><span>'+esc(x)+'</span></li>'}).join("")+'</ul></div></div></div></section>';
  if(feat.length){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">Selected projects</span><h2>Featured residences</h2></div><div class="cards" style="padding-bottom:0">'+feat.map(function(p){
      var cover=(p.images||[]).filter(okId)[0];
      return '<a class="pcard lcard" href="/p/'+esc(p.slug)+'" data-act="open" data-slug="'+esc(p.slug)+'"><div class="thumb">'+(cover?'<img loading="lazy" src="'+blob(cover)+'" alt="">':'<span class="ini">'+esc(initials(p.name))+'</span>')+(p.status?'<span class="status-chip">'+esc(p.status)+'</span>':'')+'</div>'+
        '<div class="body"><span class="eyebrow">'+esc(p.area||"")+'</span><h3>'+esc(p.name)+'</h3>'+(p.tagline?'<span class="muted" style="font-size:14px">'+esc(p.tagline)+'</span>':'')+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px"><span style="color:var(--gold-hi);font-family:var(--display);font-size:19px">'+(p.priceFrom?"From "+esc(p.priceFrom):"")+'</span><span class="eyebrow">View →</span></div></div></a>';
    }).join("")+'</div></div></section>';
  }
  h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head" style="align-items:center;text-align:center"><span class="eyebrow">Private viewings</span><h2>Let’s find your next home</h2><p class="muted" style="margin:0;max-width:52ch">Tell me what you are looking for. I will send you a private presentation of the projects that fit.</p></div>'+agentBlock()+'</div></section>';
  h+='<footer class="foot"><div class="wrap"><span>© '+new Date().getFullYear()+' '+esc(name)+(s.agency?" · "+esc(s.agency):"")+(s.renNo?" · "+esc(s.renNo):"")+'</span></div></footer>';
  if(wa)h+='<div class="mobile-cta"><a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp '+esc(name.split(" ")[0])+'</a></div>';
  if(S.isAdmin)h+='<div class="admin-bar"><span class="muted" style="font-size:12px;padding:8px 10px">Your landing page, as visitors see it</span><button class="btn btn-sm" data-act="landingoff">← Portfolio</button><button class="btn btn-sm btn-solid" data-act="settings">Edit landing page</button></div>';
  return h;
}

/* ---------- admin dashboard ---------- */
function renderDash(){
  var s=DATA.settings,h=topbar('<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" data-act="landing">Landing page</button><button class="btn btn-sm" data-act="settings">Profile &amp; settings</button><button class="btn btn-sm" data-act="publish"'+(S.saving?" disabled":"")+'>Publish website</button><button class="btn btn-sm btn-solid" data-act="new">+ New project</button></div>');
  if(S.exported){var x=S.exported;h+='<div class="wrap" style="padding-top:24px"><div class="notice" style="flex-direction:column;align-items:flex-start"><strong class="gold-text" style="font-family:var(--display);font-size:22px;font-weight:400">Website ready to upload</strong>'+
    '<span>Published: '+(x.published.length?esc(x.published.join(", ")):"no projects (all are Draft)")+'.</span>'+
    (x.skippedDrafts.length?'<span class="muted">Not published because status is Draft: '+esc(x.skippedDrafts.join(", "))+'.</span>':'')+
    (x.hasBaseUrl?'':'<span class="muted">Tip: add your online address in Profile &amp; settings, then publish again, so WhatsApp shows the cover photo in link previews.</span>')+
    '<span>Next: in your GitHub repository click <strong>Add file → Upload files</strong> and drag in everything inside this folder:</span><span class="linkbox" style="width:100%"><span>'+esc(x.folder)+'</span></span>'+
    '<button class="btn btn-sm btn-ghost" data-act="dismissexport">Close</button></div></div>'}
  h+='<div class="wrap"><div class="dash-head"><div><span class="eyebrow">Owner view · only this computer sees this page</span><h1>Project portfolio</h1><p class="muted" style="margin:8px 0 0">'+DATA.projects.length+' project'+(DATA.projects.length===1?"":"s")+'. Each one has its own link. A client who opens it sees that project only.</p></div></div>';
  if(!s.agentName)h+='<div class="notice"><span>Add your name, REN number and WhatsApp so they appear on every client presentation.</span><button class="btn btn-sm btn-solid" data-act="settings">Complete profile</button></div>';
  if(!DATA.projects.length){h+='<div class="empty"><p>No projects yet.</p><button class="btn btn-solid" data-act="new">Add your first project</button></div>'}
  h+='<div class="cards">'+DATA.projects.map(function(p){
    var cover=(p.images||[]).filter(okId)[0],url=shareUrl(p);
    return '<article class="pcard"><div class="thumb">'+(cover?'<img loading="lazy" src="'+blob(cover)+'" alt="">':'<span class="ini">'+esc(initials(p.name))+'</span>')+'<span class="status-chip">'+esc(p.status||"Draft")+'</span></div>'+
      '<div class="body"><span class="eyebrow">'+esc(p.area||" ")+'</span><h3>'+esc(p.name)+'</h3>'+(p.priceFrom?'<span class="muted" style="font-size:13px">From '+esc(p.priceFrom)+'</span>':'')+
      '<div class="linkbox"><span>'+esc(url)+'</span></div>'+
      (S.confirmDel===p.slug?'<div class="confirm"><span>Delete this project? Its client link will stop working.</span><button class="btn btn-sm btn-danger" data-act="delyes" data-slug="'+esc(p.slug)+'">Delete</button><button class="btn btn-sm btn-ghost" data-act="delno">Keep</button></div>':'')+
      '<div class="acts"><button class="btn btn-sm btn-solid" data-act="copy" data-slug="'+esc(p.slug)+'">Copy client link</button><button class="btn btn-sm" data-act="open" data-slug="'+esc(p.slug)+'">View</button><button class="btn btn-sm" data-act="edit" data-slug="'+esc(p.slug)+'">Edit</button><a class="btn btn-sm" data-act="pdf" href="/api/brochure.pdf?p='+encodeURIComponent(p.slug)+'">Brochure PDF</a><button class="btn btn-sm btn-ghost" data-act="del" data-slug="'+esc(p.slug)+'">Delete</button></div></div></article>';
  }).join("")+'</div></div>';
  return h;
}

/* ---------- editors ---------- */
function fld(k,label,val,opt){
  opt=opt||{};var id="f-"+k,cls="fld"+(opt.full?" full":"");
  var ctl;
  if(opt.area)ctl='<textarea id="'+id+'" data-k="'+k+'" placeholder="'+esc(opt.ph||"")+'"'+(opt.rows?' style="min-height:'+opt.rows*26+'px"':'')+'>'+esc(val)+'</textarea>';
  else if(opt.options)ctl='<select id="'+id+'" data-k="'+k+'">'+opt.options.map(function(o){return '<option'+(o===val?" selected":"")+'>'+esc(o)+'</option>'}).join("")+'</select>';
  else ctl='<input id="'+id+'" data-k="'+k+'" value="'+esc(val)+'" placeholder="'+esc(opt.ph||"")+'">';
  return '<div class="'+cls+'"><label for="'+id+'">'+esc(label)+'</label>'+ctl+'</div>';
}
function group(title,hint,body){return '<div class="fgroup"><div><h3>'+title+'</h3>'+(hint?'<p class="hint">'+hint+'</p>':'')+'</div><div>'+body+'</div></div>'}

function renderEditor(){
  var d=S.draft,isNew=!d._orig;
  var h=topbar('<button class="btn btn-sm btn-ghost" data-act="cancel">Cancel</button>');
  h+='<div class="wrap narrow form"><div class="dash-head"><div><span class="eyebrow">'+(isNew?"New project":"Editing")+'</span><h1>'+esc(d.name||"Untitled project")+'</h1></div></div>';
  h+=group("Essentials","The name, link and headline your client sees first.",'<div class="fields">'+
    fld("name","Project name",d.name,{ph:"Armani Hallson Bukit Bintang",full:true})+
    fld("slug","Link name",d.slug,{ph:"armani-hallson-bukit-bintang"})+
    fld("status","Status",d.status,{options:STATUSES})+
    fld("featured","Show on landing page",d.featured||"No",{options:["No","Yes"]})+
    fld("tagline","Tagline",d.tagline,{ph:"Branded residences in the heart of Kuala Lumpur",full:true})+
    fld("area","Area",d.area,{ph:"Bukit Bintang, Kuala Lumpur"})+
    fld("developer","Developer",d.developer)+'</div>');
  h+=group("Key facts","Free text, so write prices the way you quote them (e.g. RM 1.38 mil).",'<div class="fields">'+
    fld("priceFrom","Price from",d.priceFrom,{ph:"RM 1.38 mil"})+fld("tenure","Tenure",d.tenure,{ph:"Freehold"})+
    fld("propertyType","Property type",d.propertyType,{ph:"Serviced residence"})+fld("builtUp","Built-up range",d.builtUp,{ph:"650 – 2,100 sq ft"})+
    fld("completion","Expected completion",d.completion,{ph:"Q4 2029"})+fld("totalUnits","Total units",d.totalUnits)+
    fld("maintenance","Maintenance fee",d.maintenance,{ph:"RM 0.65 psf"})+fld("priceNote","Price note",d.priceNote,{ph:"Prices exclude rebates and are subject to change"})+'</div>');
  h+=group("Story","Highlights and facilities: one per line.",'<div class="fields">'+
    fld("description","Overview",d.description,{area:true,full:true,rows:7})+
    fld("highlights","Highlights",d.highlights,{area:true,full:true,ph:"5-minute walk to Pavilion KL\nFully furnished with designer fittings"})+
    fld("facilities","Facilities",d.facilities,{area:true,full:true,ph:"Infinity pool\nSky lounge\nGymnasium"})+'</div>');
  var units=d.units||[];
  h+=group("Unit types","Each row becomes a line in the pricing table.",units.map(function(u,i){
    function uf(k,l,ph){var id="u-"+i+"-"+k;return '<div class="fld"><label for="'+id+'">'+l+'</label><input id="'+id+'" data-u="'+i+'" data-uk="'+k+'" value="'+esc(u[k])+'" placeholder="'+ph+'"></div>'}
    return '<div class="unit-row">'+uf("type","Type","Type A · 2+1 Bedroom")+uf("size","Built-up","1,050 sq ft")+uf("beds","Bedrooms","2+1")+uf("price","Price from","RM 1.6 mil")+'<button class="btn btn-sm btn-ghost" data-act="unitdel" data-i="'+i+'" aria-label="Remove row">✕</button></div>';
  }).join("")+'<button class="btn btn-sm" data-act="unitadd">+ Add unit type</button>');
  var imgs=d.images||[];
  var up='<div class="upload-zone"><label class="btn btn-sm btn-solid" for="f-upload">Upload photos</label><input id="f-upload" type="file" accept="image/*" multiple hidden><span class="muted" style="font-size:13px">'+(S.uploading?esc(S.uploading):"JPG, PNG or WebP. Large photos are resized automatically. The first photo is the cover.")+'</span></div>';
  h+=group("Photos","Show your best exterior or view as the cover.",up+'<div class="thumbs">'+imgs.map(function(id,i){return okId(id)?'<figure>'+(i===0?'<span class="cover-tag">Cover</span>':'')+'<img src="'+blob(id)+'" alt="">'+'<div class="tb">'+(i>0?'<button data-act="imgcover" data-i="'+i+'">Make cover</button><button data-act="imgleft" data-i="'+i+'" aria-label="Move earlier">‹</button>':'')+(i<imgs.length-1?'<button data-act="imgright" data-i="'+i+'" aria-label="Move later">›</button>':'')+'<button data-act="imgdel" data-i="'+i+'">Remove</button></div></figure>':''}).join("")+'</div>');
  h+=group("Location &amp; media","Links must start with https://",'<div class="fields">'+
    fld("address","Address",d.address,{full:true,area:true,rows:3})+fld("mapUrl","Google Maps link",d.mapUrl,{ph:"https://maps.app.goo.gl/…",full:true})+
    fld("videoUrl","Video tour link",d.videoUrl,{ph:"https://youtu.be/…",full:true})+'</div>'+
    '<div class="upload-zone" style="margin-top:16px"><label class="btn btn-sm" for="f-brochure">'+(d.brochure?"Replace brochure":"Upload brochure PDF")+'</label><input id="f-brochure" type="file" accept="application/pdf" hidden>'+(okId(d.brochure)?'<a target="_blank" rel="noopener" href="'+blob(d.brochure)+'">Current brochure</a><button class="btn btn-sm btn-ghost" data-act="brodel">Remove</button>':'<span class="muted" style="font-size:13px">Optional, up to 25 MB.</span>')+'</div>');
  h+='</div><div class="savebar"><div class="wrap narrow"><span class="muted" style="font-size:13px">'+(S.saving?"Saving…":"Saved to data\\data.json in your website folder.")+'</span><div style="display:flex;gap:8px"><button class="btn btn-sm btn-ghost" data-act="cancel">Cancel</button><button class="btn btn-sm btn-solid" data-act="save"'+(S.saving||S.uploading?" disabled":"")+'>Save project</button></div></div></div>';
  return h;
}

function renderSettings(){
  var d=S.settingsDraft;
  var h=topbar('<button class="btn btn-sm btn-ghost" data-act="cancel">Cancel</button>');
  h+='<div class="wrap narrow form"><div class="dash-head"><div><span class="eyebrow">Profile &amp; settings</span><h1>Your details</h1></div></div>';
  h+=group("Consultant","Shown on every project page.",'<div class="fields">'+
    fld("agentName","Full name",d.agentName,{full:true})+fld("agentTitle","Title",d.agentTitle,{ph:"Property Consultant"})+fld("renNo","REN number",d.renNo,{ph:"REN 12345"})+
    fld("agency","Agency",d.agency,{full:true})+fld("phone","Phone (as displayed)",d.phone,{ph:"+60 12-345 6789"})+fld("whatsapp","WhatsApp number",d.whatsapp,{ph:"60123456789"})+fld("email","Email",d.email,{full:true})+'</div>');
  var ph=d.photo&&okId(d.photo);
  h+=group("Landing page","The main page of your website. Leave a box empty to use the suggested text.",'<div class="fields">'+
    fld("headline","Headline",d.headline,{full:true,ph:"Luxury and investment property in Kuala Lumpur, presented privately."})+
    fld("city","City / area you serve",d.city,{ph:"Kuala Lumpur"})+
    fld("about","About you",d.about,{area:true,full:true,rows:5,ph:"I help buyers and investors find the right property in Kuala Lumpur…"})+
    fld("services","Services (one per line)",d.services,{area:true,full:true,ph:DEFAULT_SERVICES})+'</div>'+
    '<div class="upload-zone" style="margin-top:16px">'+(ph?'<img src="'+blob(d.photo)+'" alt="" style="width:64px;height:80px;object-fit:cover;border:1px solid var(--gold)">':'')+
    '<button class="btn btn-sm" data-act="photoup">'+(ph?"Replace photo":"Upload your photo")+'</button>'+(ph?'<button class="btn btn-sm btn-ghost" data-act="photodel">Remove</button>':'<span class="muted" style="font-size:13px">Optional. A professional portrait works best.</span>')+
    '<input id="f-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden></div>');
  var own=d.cardImage&&okId(d.cardImage);
  h+=group("Name card",own?"Your own card is used. Clients download this file.":"Made from your details above. Upload your own design any time to replace it.",
    '<div id="card-preview" style="max-width:460px;border:1px solid var(--line);background:var(--panel)">'+(own?'<img src="'+blob(d.cardImage)+'" alt="Your name card" style="display:block;width:100%">':'')+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+(own?'':'<button class="btn btn-sm" data-act="cardrefresh">Update preview</button>')+
    '<button class="btn btn-sm" data-act="card">Download</button><button class="btn btn-sm" data-act="cardup">'+(own?"Replace my card":"Upload my own card")+'</button>'+
    (own?'<button class="btn btn-sm btn-ghost" data-act="carddel">Use generated card</button>':'')+
    '<input id="f-cardfile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden></div>');
  h+=group("Website address","Leave empty while working on localhost. When the site is online, enter its address (e.g. https://yourname.com) so copied client links use it.",'<div class="fields">'+fld("baseUrl","Website address",d.baseUrl,{full:true,ph:"https://yourname.com"})+'</div>');
  h+='</div><div class="savebar"><div class="wrap narrow"><span class="muted" style="font-size:13px">'+(S.saving?"Saving…":"")+'</span><div style="display:flex;gap:8px"><button class="btn btn-sm btn-ghost" data-act="cancel">Cancel</button><button class="btn btn-sm btn-solid" data-act="savesettings"'+(S.saving?" disabled":"")+'>Save</button></div></div></div>';
  return h;
}

/* ---------- render ---------- */
function render(){
  var h;
  if(S.isAdmin&&S.mode==="edit"&&S.draft)h=renderEditor();
  else if(S.isAdmin&&S.mode==="settings"&&S.settingsDraft)h=renderSettings();
  else{var p=findP(currentSlug());h=p?renderProject(p):(S.isAdmin&&!S.landing?renderDash():(S.ready?renderLanding():renderPrivate()))}
  var p2=findP(currentSlug());
  document.title=(p2&&S.mode==="view"?p2.name+" · ":"")+(DATA.settings.agentName||"Prestige Property Portfolio");
  app.innerHTML=h;
  var up=document.getElementById("f-upload");if(up)up.addEventListener("change",onPhotos);
  var br=document.getElementById("f-brochure");if(br)br.addEventListener("change",onBrochure);
  var cf=document.getElementById("f-cardfile");if(cf)cf.addEventListener("change",onCardFile);
  var pf=document.getElementById("f-photo");if(pf)pf.addEventListener("change",function(ev){
    readFields(S.settingsDraft);var f=(ev.target.files||[])[0];if(!f)return;toast("Uploading your photo…");
    compress(f).then(function(b){return upload(b)}).then(function(r){S.settingsDraft.photo=r.id;render();toast("Photo uploaded. Click Save to use it.")}).catch(function(e){toast(e.message)});
  });
  if(S.mode==="settings")drawCardPreview();
}
function drawCardPreview(){
  var box=document.getElementById("card-preview");if(!box||!window.NameCard)return;
  var d=S.settingsDraft;if(d.cardImage&&okId(d.cardImage))return;
  NameCard.draw(d).then(function(cv){cv.style.cssText="display:block;width:100%;height:auto";box.innerHTML="";box.appendChild(cv)});
}
function onCardFile(ev){
  readFields(S.settingsDraft);var f=(ev.target.files||[])[0];if(!f)return;
  toast("Uploading your name card…");
  var t=f.type||(/\.pdf$/i.test(f.name)?"application/pdf":"image/jpeg");
  (/^image\//.test(t)?compress(f):Promise.resolve(f)).then(function(b){return upload(b,/^image\//.test(t)?(b.type||t):t)}).then(function(r){S.settingsDraft.cardImage=r.id;render();toast("Card uploaded. Click Save to use it.")}).catch(function(e){toast(e.message)});
}

/* ---------- saving ---------- */
function saveData(next,thenPath){
  S.saving=true;render();
  return fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Save failed");return j})})
    .then(function(){DATA=next;S.saving=false;S.mode="view";S.draft=null;S.settingsDraft=null;S.confirmDel=null;toast("Saved.");nav(thenPath)})
    .catch(function(e){S.saving=false;render();toast("Could not save: "+e.message+". Is the server still running?")});
}

function readFields(target){
  app.querySelectorAll("[data-k]").forEach(function(el){target[el.getAttribute("data-k")]=el.value});
  app.querySelectorAll("[data-u]").forEach(function(el){var i=+el.getAttribute("data-u");if(target.units&&target.units[i])target.units[i][el.getAttribute("data-uk")]=el.value});
}

function saveProject(){
  var d=S.draft;readFields(d);
  d.name=(d.name||"").trim();
  if(!d.name){toast("Add a project name first.");return}
  d.slug=slugify(d.slug||d.name);
  var clash=DATA.projects.some(function(p){return p.slug===d.slug&&p.slug!==d._orig});
  if(clash){toast("Another project already uses the link name “"+d.slug+"”. Change it slightly.");return}
  var next=clone(DATA),rec=clone(d);delete rec._orig;
  rec.units=(rec.units||[]).filter(function(u){return u.type||u.size||u.beds||u.price});
  var idx=-1;next.projects.forEach(function(p,i){if(p.slug===d._orig)idx=i});
  if(idx>=0)next.projects[idx]=rec;else next.projects.unshift(rec);
  saveData(next,"/p/"+rec.slug);
}

function compress(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||!window.createImageBitmap)return Promise.resolve(file);
  return createImageBitmap(file).then(function(bmp){
    var max=2200,s=Math.min(1,max/Math.max(bmp.width,bmp.height));
    if(s===1&&file.size<1.6e6)return file;
    var c=document.createElement("canvas");c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);
    var x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);
    return new Promise(function(r){c.toBlob(function(b){r(b&&b.size<file.size?b:file)},"image/jpeg",0.86)});
  }).catch(function(){return file});
}
function upload(b,type){
  return fetch("/api/upload",{method:"POST",headers:{"Content-Type":type||b.type||"application/octet-stream"},body:b})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Upload failed");return j})});
}
function onPhotos(ev){
  readFields(S.draft);
  var files=Array.prototype.slice.call(ev.target.files||[]);if(!files.length)return;
  var n=0;
  (function next(){
    if(n>=files.length){S.uploading="";render();return}
    S.uploading="Uploading photo "+(n+1)+" of "+files.length+"…";render();
    var f=files[n++];
    compress(f).then(function(b){return upload(b)}).then(function(r){S.draft.images.push(r.id);next()}).catch(function(e){toast(e.message);next()});
  })();
}
function onBrochure(ev){
  readFields(S.draft);var f=(ev.target.files||[])[0];if(!f)return;
  S.uploading="Uploading brochure…";render();
  upload(f,"application/pdf").then(function(r){S.draft.brochure=r.id;S.uploading="";render();toast("Brochure attached.")}).catch(function(e){S.uploading="";render();toast(e.message)});
}

function copy(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast("Link copied: "+text)},function(){fallbackCopy(text)});
  }else fallbackCopy(text);
}
function fallbackCopy(text){
  var t=document.createElement("textarea");t.value=text;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
  var ok=false;try{ok=document.execCommand("copy")}catch(e){}t.remove();
  toast(ok?"Link copied: "+text:"Copy this link: "+text);
}

/* ---------- events ---------- */
app.addEventListener("click",function(ev){
  var b=ev.target.closest("[data-act]");if(!b||b.disabled)return;
  var a=b.getAttribute("data-act"),slug=b.getAttribute("data-slug"),i=+b.getAttribute("data-i");
  if(a==="open"&&b.tagName==="A")ev.preventDefault();
  var d=S.draft;
  switch(a){
    case "home":S.preview=false;S.landing=false;nav("/");break;
    case "open":nav("/p/"+slug);break;
    case "copy":{var p=findP(slug);if(p)copy(shareUrl(p));break}
    case "copytext":copy(b.getAttribute("data-text"));break;
    case "preview":S.preview=!S.preview;render();refresh();break;
    case "new":S.draft={_orig:"",name:"",slug:"",status:"New Launch",units:[],images:[]};S.mode="edit";render();window.scrollTo(0,0);break;
    case "edit":{var q=findP(slug);if(q){S.draft=clone(q);S.draft._orig=q.slug;S.draft.units=S.draft.units||[];S.draft.images=S.draft.images||[];S.mode="edit";render();window.scrollTo(0,0)}break}
    case "settings":S.settingsDraft=clone(DATA.settings);S.mode="settings";render();window.scrollTo(0,0);break;
    case "cancel":S.mode="view";S.draft=null;S.settingsDraft=null;render();window.scrollTo(0,0);break;
    case "save":saveProject();break;
    case "savesettings":{readFields(S.settingsDraft);var n=clone(DATA);n.settings=clone(S.settingsDraft);saveData(n,location.pathname);break}
    case "card":if(window.NameCard)NameCard.download(S.mode==="settings"&&S.settingsDraft?(readFields(S.settingsDraft),S.settingsDraft):DATA.settings).then(function(){toast("Name card downloaded.")}).catch(function(){toast("Could not create the name card.")});break;
    case "vcard":if(window.NameCard){NameCard.vcard(DATA.settings);toast("Contact file downloaded. Open it to add to your contacts.")}break;
    case "landing":S.landing=true;nav("/");break;
    case "landingoff":S.landing=false;nav("/");break;
    case "photoup":document.getElementById("f-photo").click();break;
    case "photodel":readFields(S.settingsDraft);S.settingsDraft.photo="";render();break;
    case "cardup":document.getElementById("f-cardfile").click();break;
    case "carddel":readFields(S.settingsDraft);S.settingsDraft.cardImage="";render();drawCardPreview();break;
    case "cardrefresh":readFields(S.settingsDraft);drawCardPreview();break;
    case "pdf":toast("Creating your brochure PDF. It downloads in about 10–20 seconds.");break;
    case "publish":S.saving=true;render();fetch("/api/export",{method:"POST"}).then(function(r){return r.json()}).then(function(j){S.saving=false;if(!j.ok)throw new Error(j.error||"failed");S.exported=j;render();window.scrollTo(0,0)}).catch(function(e){S.saving=false;render();toast("Could not build the website: "+e.message)});break;
    case "dismissexport":S.exported=null;render();break;
    case "del":S.confirmDel=slug;render();break;
    case "delno":S.confirmDel=null;render();break;
    case "delyes":{var nx=clone(DATA);nx.projects=nx.projects.filter(function(p){return p.slug!==slug});saveData(nx,"/");break}
    case "unitadd":readFields(d);d.units.push({type:"",size:"",beds:"",price:""});render();break;
    case "unitdel":readFields(d);d.units.splice(i,1);render();break;
    case "imgcover":readFields(d);d.images.unshift(d.images.splice(i,1)[0]);render();break;
    case "imgleft":readFields(d);d.images.splice(i-1,0,d.images.splice(i,1)[0]);render();break;
    case "imgright":readFields(d);d.images.splice(i+1,0,d.images.splice(i,1)[0]);render();break;
    case "imgdel":readFields(d);d.images.splice(i,1);render();break;
    case "brodel":readFields(d);d.brochure="";render();break;
    case "lb":S.lb=i;render();break;
    case "lbclose":S.lb=null;render();break;
    case "lbprev":S.lb--;render();break;
    case "lbnext":S.lb++;render();break;
  }
});
document.addEventListener("keydown",function(e){
  if(S.lb==null)return;
  if(e.key==="Escape"){S.lb=null;render()}else if(e.key==="ArrowLeft"){S.lb--;render()}else if(e.key==="ArrowRight"){S.lb++;render()}
});
window.addEventListener("popstate",function(){S.lb=null;if(S.mode==="view"){render();refresh()}});

/* ---------- boot ---------- */
render();
var STATIC=!!window.STATIC_SITE;
function staticData(){
  var slug=currentSlug();
  var url=slug&&/^[a-z0-9-]+$/.test(slug)?"/data/"+slug+".json":"/data/site.json";
  return fetch(url).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return fetch("/data/site.json").then(function(r){return r.json()})});
}
Promise.all([
  STATIC?Promise.resolve({admin:false}):fetch("/api/me").then(function(r){return r.json()}).catch(function(){return {admin:false}}),
  STATIC?staticData():fetch("/api/data?p="+encodeURIComponent(currentSlug())).then(function(r){return r.json()})
]).then(function(r){
  S.isAdmin=!!r[0].admin;DATA=r[1]||DATA;DATA.settings=DATA.settings||{};DATA.projects=DATA.projects||[];
  S.ready=true;render();
}).catch(function(){S.ready=true;render();toast("Could not load projects. Is the server running?")});
})();
