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

/* ---------- language: English / 中文 (labels only; your own project text stays as you write it) ---------- */
var I18N={
 en:{consultant:"Your consultant",tel:"Tel",email:"Email",copy:"Copy",card:"Download name card",vcard:"Save contact",enquire:"Enquire on WhatsApp",
  priceFrom:"Price from",tenure:"Tenure",builtUp:"Built-up",completion:"Completion",ptype:"Property type",developer:"Developer",totalUnits:"Total units",maint:"Maintenance",
  residence:"The residence",overview:"Overview",why:"Why it matters",highlights:"Highlights",photos:"{n} photographs",gallery:"Gallery",
  layouts:"Layouts & pricing",unitTypes:"Unit types",type:"Type",bedrooms:"Bedrooms",lifestyle:"Lifestyle",facilities:"Facilities",address:"Address",location:"Location",surroundEy:"The neighbourhood",surroundH:"Surroundings",plansH:"Floor plans",
  maps:"Open in Maps",video:"Watch video tour",brochure:"View brochure (PDF)",prepared:"Prepared exclusively for you by {n}.",consultantFallback:"your consultant",
  disclaimer:"All information, images and prices are subject to change and to the developer’s official confirmation. Artist impressions only.",
  mobileCta:"WhatsApp me about this project",waMsg:"Hi, I would like to know more about {p}.",
  planEy:"Plan your purchase",planH:"Financing & viewing",
  portH:"Project Portfolio",askEy:"Ask me anything",askH:"WhatsApp me",askP:"Ask about a project. Your message opens in WhatsApp, ready to send.",askProj:"Project",askGeneral:"General enquiry",
  askMsg:"Your question (optional)",askPh:"e.g. Which units are still available?",askText:"Hi {a}, I'm {n}. I would like to ask about {p}.",askTextGen:"Hi {a}, I'm {n}. I have a property enquiry.",cardH:"My name card",
  loanH:"Loan calculator",lPrice:"Property price (RM)",lDown:"Down payment",lRate:"Interest rate (% a year)",lYears:"Loan tenure (years)",lMonthly:"Estimated monthly instalment",perMonth:"/ month",
  lLoan:"Loan amount",lDownAmt:"Down payment",lInterest:"Total interest",lNote:"Estimate only. Actual rates and approval depend on the bank.",
  bookH:"Book a viewing",bookP:"Pick a time that suits you. Your request opens in WhatsApp, ready to send.",bName:"Your name",bDate:"Preferred date",bTime:"Preferred time",
  times:["Morning (10am – 12pm)","Afternoon (2pm – 5pm)","Evening (6pm – 8pm)"],bUnit:"Unit type",bAny:"Any / not sure",bBudget:"Budget",
  budgets:["Below RM 800K","RM 800K – 1.2M","RM 1.2M – 2M","Above RM 2M"],bPurpose:"Purpose",purposes:["Own stay","Investment","Both"],bNote:"Message (optional)",
  bSend:"Send on WhatsApp",bNeed:"Please enter your name.",bNoWa:"WhatsApp is not set up yet. Please call the number below.",
  bMsg:"Hi {a}, I would like to book a viewing for {p}.",
  agency:"Agency",mobile:"Mobile",talk:"Talk to me on WhatsApp",about:"About",aboutH:"Your consultant in the city",help:"How I can help",services:"Services",
  selected:"Selected projects",featured:"Featured residences",from:"From",view:"View →",pv:"Private viewings",findH:"Let’s find your next home",
  findP:"Tell me what you are looking for. I will send you a private presentation of the projects that fit.",waLanding:"Hi {n}, I found your website and would like to know more.",
  defHeadline:"Luxury and investment property in Kuala Lumpur, presented privately.",
  defAbout:"I help buyers and investors find the right property in Kuala Lumpur, from new launches in the Golden Triangle to established neighbourhoods. Every recommendation comes with clear numbers, honest advice and a private presentation made for you.",
  defServices:"New launch projects\nSubsale & resale homes\nRental & tenancy\nInvestment planning & financing guidance",
  title:"Property Consultant",city:"Kuala Lumpur",privEy:"Private presentation",privH:"Projects are shared by invitation",privP:"Please open the full link your consultant sent you to view your project presentation.",
  status:{"New Launch":"New Launch","Selling Now":"Selling Now","Final Units":"Final Units","Completed":"Completed","Sold Out":"Sold Out"}},
 zh:{consultant:"您的顾问",tel:"电话",email:"电邮",copy:"复制",card:"下载名片",vcard:"保存联系人",enquire:"WhatsApp 咨询",
  priceFrom:"起价",tenure:"地契",builtUp:"建筑面积",completion:"完工",ptype:"产业类型",developer:"发展商",totalUnits:"总单位",maint:"管理费",
  residence:"项目介绍",overview:"概览",why:"为什么选择",highlights:"项目亮点",photos:"{n} 张照片",gallery:"图库",
  layouts:"户型与价格",unitTypes:"户型",type:"户型",bedrooms:"房间",lifestyle:"生活",facilities:"设施",address:"地址",location:"位置",surroundEy:"地段",surroundH:"周边环境",plansH:"户型图",
  maps:"打开地图",video:"观看视频",brochure:"查看手册 (PDF)",prepared:"由 {n} 专为您准备。",consultantFallback:"您的顾问",
  disclaimer:"所有资料、图片与价格如有变动，以发展商正式确认为准。图片仅为艺术效果图。",
  mobileCta:"WhatsApp 咨询此项目",waMsg:"您好，我想了解 {p} 的详情。",
  planEy:"置业规划",planH:"贷款与看房",
  portH:"项目组合",askEy:"欢迎咨询",askH:"WhatsApp 联系我",askP:"询问项目详情，提交后会打开 WhatsApp，信息已为您写好。",askProj:"项目",askGeneral:"一般咨询",
  askMsg:"您的问题（可选）",askPh:"例如：还有哪些单位可选？",askText:"您好 {a}，我是 {n}，想咨询 {p}。",askTextGen:"您好 {a}，我是 {n}，想咨询房产。",cardH:"我的名片",
  loanH:"房贷计算器",lPrice:"房价 (RM)",lDown:"首付",lRate:"年利率 (%)",lYears:"贷款年限",lMonthly:"预计每月供款",perMonth:"/ 月",
  lLoan:"贷款额",lDownAmt:"首付金额",lInterest:"总利息",lNote:"仅供参考，实际利率与批核以银行为准。",
  bookH:"预约看房",bookP:"选择方便的时间，提交后会打开 WhatsApp，信息已为您写好。",bName:"您的姓名",bDate:"希望日期",bTime:"希望时段",
  times:["上午 (10am – 12pm)","下午 (2pm – 5pm)","晚上 (6pm – 8pm)"],bUnit:"感兴趣户型",bAny:"任何 / 未确定",bBudget:"预算",
  budgets:["RM 800K 以下","RM 800K – 1.2M","RM 1.2M – 2M","RM 2M 以上"],bPurpose:"购买目的",purposes:["自住","投资","自住兼投资"],bNote:"留言（可选）",
  bSend:"通过 WhatsApp 发送",bNeed:"请输入您的姓名。",bNoWa:"尚未设置 WhatsApp，请拨打下方电话。",
  bMsg:"您好 {a}，我想预约参观 {p}。",
  agency:"公司",mobile:"手机",talk:"WhatsApp 联系我",about:"关于我",aboutH:"您在城中的置业顾问",help:"我能为您做什么",services:"服务",
  selected:"精选项目",featured:"精选住宅",from:"起价",view:"查看 →",pv:"私人看房",findH:"一起找到您的理想家园",
  findP:"告诉我您的需求，我会为您准备合适项目的专属介绍。",waLanding:"您好 {n}，我在您的网站看到资讯，想了解更多。",
  defHeadline:"吉隆坡豪华与投资房产，专属为您呈现。",
  defAbout:"我帮助买家与投资者在吉隆坡找到合适的房产，从金三角的新盘到成熟社区。每一个推荐都附上清楚的数字、坦诚的建议，以及为您量身准备的专属介绍。",
  defServices:"新盘项目\n二手房买卖\n租赁\n投资规划与贷款咨询",
  title:"房产顾问",city:"吉隆坡",privEy:"私人介绍",privH:"项目仅限受邀观看",privP:"请打开顾问发给您的完整链接，查看项目介绍。",
  status:{"New Launch":"新盘推出","Selling Now":"热卖中","Final Units":"最后单位","Completed":"已完工","Sold Out":"已售罄"}}
};
var LANG=(function(){try{var v=localStorage.getItem("lang");if(v==="en"||v==="zh")return v}catch(e){}return /^zh/i.test(navigator.language||"")?"zh":"en"})();
function T(k,vars){var v=(I18N[LANG]&&I18N[LANG][k]!=null)?I18N[LANG][k]:I18N.en[k];if(typeof v==="string"&&vars)Object.keys(vars).forEach(function(x){v=v.split("{"+x+"}").join(vars[x])});return v}
function TS(st){return (I18N[LANG].status||{})[st]||st}
function setLang(l){LANG=l;try{localStorage.setItem("lang",l)}catch(e){}document.documentElement.lang=l==="zh"?"zh-Hans":"en";render()}
document.documentElement.lang=LANG==="zh"?"zh-Hans":"en";
function langSwitch(){return '<div class="lang" role="group" aria-label="Language"><button data-act="lang" data-lang="en" class="'+(LANG==="en"?"on":"")+'">EN</button><button data-act="lang" data-lang="zh" class="'+(LANG==="zh"?"on":"")+'">中文</button></div>'}
// default text you never changed is shown in the visitor's language; your own text stays as written
function deflt(val,key){return (!val||val===I18N.en[key])?T(key):val}

/* ---------- client presentation ---------- */
function agentBlock(){
  var s=DATA.settings, name=s.agentName||T("consultant");
  var wa=digits(s.whatsapp);
  var meta=[deflt(s.agentTitle,"title"),s.agency,s.renNo].filter(Boolean).map(function(x){return "<span>"+esc(x)+"</span>"}).join("");
  var phone=s.phone?'<div class="contact-line"><span class="eyebrow" style="letter-spacing:.22em">'+T("tel")+'</span><a class="num" style="text-decoration:none" href="tel:'+esc(s.phone.replace(/[^0-9+]/g,""))+'">'+esc(s.phone)+'</a><button class="btn btn-sm btn-ghost" data-act="copytext" data-text="'+esc(s.phone)+'">'+T("copy")+'</button></div>':"";
  var email=s.email?'<div class="contact-line"><span class="eyebrow" style="letter-spacing:.22em">'+T("email")+'</span><a class="num" style="font-size:15px;text-decoration:none" href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></div>':"";
  return '<div class="agent"><div class="mono">'+esc(initials(name))+'</div><div style="min-width:0"><div class="eyebrow">'+T("consultant")+'</div><h3 style="margin-top:6px">'+esc(name)+'</h3><div class="meta">'+meta+'</div>'+phone+email+'</div><div class="actions">'+(wa?'<a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'')+
    '<button class="btn" data-act="card">'+T("card")+'</button>'+(s.phone||wa||s.email?'<button class="btn btn-ghost" data-act="vcard">'+T("vcard")+'</button>':'')+'</div></div>';
}
function waLink(p){var wa=digits(DATA.settings.whatsapp);return wa?"https://wa.me/"+wa+"?text="+encodeURIComponent(T("waMsg",{p:p.name})):""}

function topbar(right){
  var s=DATA.settings,name=s.agentName||"Private Presentation";
  var client=S.mode==="view"&&!(S.isAdmin&&!S.preview&&!S.landing&&!currentSlug());
  return '<header class="topbar"><div class="wrap"><div class="brand"><div class="mono">'+esc(initials(s.agentName||"P P"))+'</div><div style="min-width:0"><div class="brand-name">'+esc(name)+'</div><div class="brand-sub">'+esc(s.agency||"Private Property Presentation")+'</div></div></div><div class="top-right">'+(client?langSwitch():'')+(right||"")+'</div></div></header>';
}

/* turn "RM 1 Million+", "RM 1.38 mil", "RM 977K", "RM 800,000" into a number */
function parsePrice(s){
  var t=String(s||"").toLowerCase().replace(/,/g,""),m=t.match(/([0-9]+(?:\.[0-9]+)?)\s*(million|mil|m\b|k\b)?/);
  if(!m)return 0;var n=parseFloat(m[1]),u=m[2]||"";
  if(/^m/.test(u))n*=1e6;else if(u==="k")n*=1e3;else if(n<10000)n*=1e6;
  return Math.round(n);
}
function rm(n){return "RM "+Math.round(n).toLocaleString("en-MY")}
function loanCalc(){
  var g=function(id){var el=document.getElementById(id);return el?parseFloat(String(el.value).replace(/[^0-9.]/g,""))||0:0};
  var price=g("ln-price"),down=g("ln-down")/100,rate=g("ln-rate")/100/12,n=Math.round(g("ln-years")*12);
  var loan=price*(1-down),m=n>0?(rate>0?loan*rate/(1-Math.pow(1+rate,-n)):loan/n):0;
  var set=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v};
  set("ln-monthly",price&&n?rm(m):"—");set("ln-loan",rm(loan));set("ln-downamt",rm(price*down));set("ln-interest",price&&n?rm(m*n-loan):"—");
}
function planSection(p){
  var units=(p.units||[]).filter(function(u){return u&&u.type});
  var price=parsePrice(p.priceFrom)||1000000;
  var today=new Date();today.setDate(today.getDate()+1);var min=today.toISOString().slice(0,10);
  var opt=function(arr){return arr.map(function(x){return '<option>'+esc(x)+'</option>'}).join("")};
  var loan='<div class="panel"><h3>'+T("loanH")+'</h3><div class="fields" style="margin-top:18px">'+
    '<div class="fld full"><label for="ln-price">'+T("lPrice")+'</label><input id="ln-price" data-loan inputmode="numeric" value="'+price.toLocaleString("en-MY")+'"></div>'+
    '<div class="fld"><label for="ln-down">'+T("lDown")+'</label><select id="ln-down" data-loan><option value="10" selected>10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option></select></div>'+
    '<div class="fld"><label for="ln-rate">'+T("lRate")+'</label><input id="ln-rate" data-loan inputmode="decimal" value="4.2"></div>'+
    '<div class="fld full"><label for="ln-years">'+T("lYears")+'</label><input id="ln-years" data-loan type="range" min="5" max="35" step="1" value="35"><span class="range-val"><span id="ln-years-v">35</span></span></div></div>'+
    '<div class="loan-out"><div class="k">'+T("lMonthly")+'</div><div class="big"><span id="ln-monthly">—</span> <small>'+T("perMonth")+'</small></div>'+
    '<div class="loan-grid"><div><div class="k">'+T("lLoan")+'</div><div id="ln-loan"></div></div><div><div class="k">'+T("lDownAmt")+'</div><div id="ln-downamt"></div></div><div><div class="k">'+T("lInterest")+'</div><div id="ln-interest"></div></div></div></div>'+
    '<p class="muted" style="font-size:12px;margin:12px 0 0">'+T("lNote")+'</p></div>';
  var book='<form class="panel" id="book-form" data-slug="'+esc(p.slug)+'" novalidate><p class="muted" style="margin:0;font-size:14px">'+T("bookP")+'</p><div class="fields" style="margin-top:18px">'+
    '<div class="fld full"><label for="bk-name">'+T("bName")+'</label><input id="bk-name" autocomplete="name" required></div>'+
    '<div class="fld"><label for="bk-date">'+T("bDate")+'</label><input id="bk-date" type="date" min="'+min+'"></div>'+
    '<div class="fld"><label for="bk-time">'+T("bTime")+'</label><select id="bk-time">'+opt(T("times"))+'</select></div>'+
    (units.length?'<div class="fld'+(units.length?"":" full")+'"><label for="bk-unit">'+T("bUnit")+'</label><select id="bk-unit"><option>'+T("bAny")+'</option>'+opt(units.map(function(u){return u.type+(u.size?" · "+u.size:"")}))+'</select></div>':'')+
    '<div class="fld"><label for="bk-budget">'+T("bBudget")+'</label><select id="bk-budget">'+opt(T("budgets"))+'</select></div>'+
    '<div class="fld full"><label for="bk-purpose">'+T("bPurpose")+'</label><select id="bk-purpose">'+opt(T("purposes"))+'</select></div>'+
    '<div class="fld full"><label for="bk-note">'+T("bNote")+'</label><textarea id="bk-note" style="min-height:80px"></textarea></div></div>'+
    '<button class="btn btn-solid" type="submit" style="margin-top:16px;width:100%">'+T("bSend")+'</button></form>';
  // booking form on the left, consultant card on the right (loan calculator removed)
  return '<section class="block" style="padding-top:0" id="plan"><div class="wrap"><div class="rule" style="margin-bottom:40px"><span class="diamond"></span></div><div class="sec-head"><span class="eyebrow">'+T("pv")+'</span><h2>'+T("bookH")+'</h2></div><div class="plan-grid">'+book+'<div class="agent-side">'+agentBlock()+'</div></div></div></section>';
}
function sendBooking(form){
  var p=findP(form.getAttribute("data-slug"));if(!p)return;
  var v=function(id){var el=document.getElementById(id);return el?el.value.trim():""};
  if(!v("bk-name")){toast(T("bNeed"));document.getElementById("bk-name").focus();return}
  var wa=digits(DATA.settings.whatsapp);if(!wa){toast(T("bNoWa"));return}
  var L=[T("bMsg",{a:DATA.settings.agentName||"",p:p.name}).replace("  "," "),"",
    (LANG==="zh"?"姓名":"Name")+": "+v("bk-name"),T("bDate")+": "+(v("bk-date")||"-"),T("bTime")+": "+v("bk-time")];
  if(document.getElementById("bk-unit"))L.push(T("bUnit")+": "+v("bk-unit"));
  L.push(T("bBudget")+": "+v("bk-budget"),T("bPurpose")+": "+v("bk-purpose"));
  if(v("bk-note"))L.push(T("bNote").replace(/\s*[(（].*$/,"")+": "+v("bk-note"));
  window.open("https://wa.me/"+wa+"?text="+encodeURIComponent(L.join("\n")),"_blank","noopener");
}

/* ---------- surroundings: panorama + nearby places ---------- */
var ZH_PLACE={"Shopping":"购物","Dining":"美食","Landmarks":"地标","Transit":"交通","Healthcare":"医疗","Parks":"公园与绿地",
  "Walking distance":"步行可达","Short drive":"短程车程","Direct access":"直达","Nearby":"附近",
  "Shopping within reach":"购物就在身边","A culinary capital":"美食之都","Green escapes":"城中绿意","Also nearby":"其他周边"};
function TP(x){return LANG==="zh"&&ZH_PLACE[x]?ZH_PLACE[x]:x}
function distTag(d){return d?'<span class="dist'+(d==="Walking distance"||d==="Direct access"?' walk':'')+'">'+esc(TP(d))+'</span>':''}
function panoHtml(p){
  var pn=p.panorama;if(!pn||!okId(pn.img))return "";
  var hub=pn.hub||{x:50,y:30},t=(pn.title||"").split("|");
  var lines=(pn.labels||[]).map(function(l){return '<line x1="'+hub.x+'" y1="'+hub.y+'" x2="'+l.x+'" y2="'+l.y+'"/>'}).join("")+(pn.tower?'<line x1="'+hub.x+'" y1="'+hub.y+'" x2="'+pn.tower.x+'" y2="'+pn.tower.y+'"/>':'');
  return '<figure class="pano"><img loading="lazy" src="'+blob(pn.img)+'" alt="">'+
    '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+lines+'</svg>'+
    '<span class="pano-hub" style="left:'+hub.x+'%;top:'+hub.y+'%">'+esc((p.name||"").split(" ").slice(0,2).join(" "))+'</span>'+
    (pn.labels||[]).map(function(l){var sh=l.name.replace(/ Twin Towers.*$/,"").replace(/^The Exchange 106 @ TRX$/,"TRX 106");return '<span class="pano-lbl" style="left:'+l.x+'%;top:'+l.y+'%"><b class="ln">'+esc(l.name)+'</b><b class="sn">'+esc(sh)+'</b></span>'}).join("")+
    (t[0]?'<figcaption><span>'+esc(t[0])+'</span>'+(t[1]?'<em>'+esc(t[1])+'</em>':'')+'</figcaption>':'')+'</figure>';
}
function placesHtml(p){
  var pl=p.places||[];if(!pl.length)return "";
  var by=function(c){return pl.filter(function(x){return x.cat===c})};
  var card=function(x,cls){return '<article class="place '+(cls||"")+'">'+(okId(x.img)?'<div class="ph"><img loading="lazy" src="'+blob(x.img)+'" alt="'+esc(x.name)+'"></div>':'')+'<div class="pt"><h4>'+esc(x.name)+'</h4>'+distTag(x.dist)+'</div></article>'};
  var block=function(title,cat,cls){var a=by(cat);if(!a.length)return "";return '<div class="place-block"><h3 class="sub-h">'+esc(TP(title))+'<small>'+esc(TP(cat))+'</small></h3><div class="place-grid '+cls+'">'+a.map(function(x){return card(x,cls)}).join("")+'</div></div>'};
  var h=block("Shopping within reach","Shopping","g3")+block("A culinary capital","Dining","g4 tall")+block("Green escapes","Parks","g4");
  var rest=["Landmarks","Transit","Healthcare"].filter(function(c){return by(c).length});
  if(rest.length)h+='<div class="place-block"><h3 class="sub-h">'+esc(TP("Also nearby"))+'</h3><div class="near-cols">'+rest.map(function(c){return '<div><div class="eyebrow">'+esc(TP(c))+'</div><ul>'+by(c).map(function(x){return '<li><span>'+esc(x.name)+'</span>'+distTag(x.dist)+'</li>'}).join("")+'</ul></div>'}).join("")+'</div></div>';
  return h;
}

function renderProject(p){
  // floor plans and the surroundings map get their own sections; the rest form the gallery
  var all=(p.images||[]).filter(okId), plans=(p.plans||[]).filter(okId), sur=okId(p.surroundImage)?p.surroundImage:"";
  var imgs=all.filter(function(f){return plans.indexOf(f)<0&&f!==sur}), cover=imgs[0]||all[0];
  var sets={g:imgs,plans:plans,map:sur?[sur]:[]};
  var wa=waLink(p);
  var facts=[[T("priceFrom"),p.priceFrom],[T("tenure"),p.tenure],[T("builtUp"),p.builtUp],[T("completion"),p.completion],[T("ptype"),p.propertyType],[T("developer"),p.developer],[T("totalUnits"),p.totalUnits],[T("maint"),p.maintenance]].filter(function(f){return f[1]});
  var h='';
  h+=topbar(wa?'<a class="btn btn-sm btn-solid hide-sm" target="_blank" rel="noopener" href="'+esc(wa)+'">'+T("enquire")+'</a>':'');
  h+='<section class="hero">'+(cover?'<img class="cover" src="'+blob(cover)+'" alt="'+esc(p.name)+'">':'<div class="ghost-mark" aria-hidden="true">'+esc(initials(p.name))+'</div>')+
     '<div class="hero-inner"><div class="wrap reveal">'+
     '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><span class="eyebrow">'+esc(p.area||"")+'</span>'+(p.status&&p.status!=="Draft"?'<span class="status-chip">'+esc(TS(p.status))+'</span>':'')+'</div>'+
     '<h1 class="gold-text">'+esc(p.name)+'</h1>'+(p.tagline?'<p class="tagline" style="margin:0">'+esc(p.tagline)+'</p>':'')+
     (facts.length?'<div class="facts">'+facts.slice(0,4).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v">'+esc(f[1])+'</div></div>'}).join("")+'</div>':'')+
     (p.priceNote?'<p class="muted" style="font-size:12px;margin:12px 0 0">'+esc(p.priceNote)+'</p>':'')+
     '</div></div></section>';

  var hl=lines(p.highlights);
  if(p.description||hl.length||facts.length>4){
    h+='<section class="block"><div class="wrap"><div class="two-col"><div><div class="sec-head"><span class="eyebrow">'+T("residence")+'</span><h2>'+T("overview")+'</h2></div><div class="prose">'+esc(p.description||"")+'</div>'+
       (facts.length>4?'<div class="facts" style="margin-top:34px">'+facts.slice(4).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v" style="font-size:19px">'+esc(f[1])+'</div></div>'}).join("")+'</div>':'')+
       '</div>'+(hl.length?'<div><div class="sec-head"><span class="eyebrow">'+T("why")+'</span><h2>'+T("highlights")+'</h2></div><ul class="highlights">'+hl.map(function(x){return '<li><span class="diamond"></span><span>'+esc(x)+'</span></li>'}).join("")+'</ul></div>':'')+'</div></div></section>';
  }
  // 1. surroundings map
  if(sur||(p.places&&p.places.length)||p.panorama){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">'+T("surroundEy")+'</span><h2>'+T("surroundH")+'</h2></div>'+
       (sur?'<button class="map-frame" data-act="lb" data-set="map" data-i="0" aria-label="Open map"><img loading="lazy" src="'+blob(sur)+'" alt="'+esc(T("surroundH"))+'"></button>':'')+
       panoHtml(p)+placesHtml(p)+'</div></section>';
  }
  // 2. layouts: floor plans first, then the unit types table
  var units=(p.units||[]).filter(function(u){return u&&(u.type||u.size||u.price)});
  if(plans.length||units.length){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">'+esc(T("layouts"))+'</span><h2>'+T("plansH")+'</h2></div>'+
       (plans.length?'<div class="plans">'+plans.map(function(id,i){return '<button data-act="lb" data-set="plans" data-i="'+i+'" aria-label="Open floor plan '+(i+1)+'"><img loading="lazy" src="'+blob(id)+'" alt=""></button>'}).join("")+'</div>':'')+
       (units.length?'<h3 class="sub-h">'+T("unitTypes")+'</h3><div class="table-wrap"><table><thead><tr><th>'+T("type")+'</th><th>'+T("builtUp")+'</th><th>'+T("bedrooms")+'</th>'+(units.some(function(u){return u.price})?'<th>'+T("priceFrom")+'</th>':'')+'</tr></thead><tbody>'+
       units.map(function(u){return '<tr><td class="u-name">'+esc(u.type)+'</td><td>'+esc(u.size)+'</td><td>'+esc(u.beds)+'</td>'+(units.some(function(x){return x.price})?'<td class="u-price">'+esc(u.price)+'</td>':'')+'</tr>'}).join("")+'</tbody></table></div>':'')+'</div></section>';
  }
  // 3. gallery
  if(imgs.length>1){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="sec-head"><span class="eyebrow">'+T("photos",{n:imgs.length})+'</span><h2>'+T("gallery")+'</h2></div><div class="gallery">'+imgs.map(function(id,i){return '<button data-act="lb" data-set="g" data-i="'+i+'" aria-label="Open photo '+(i+1)+'"><img loading="lazy" src="'+blob(id)+'" alt=""></button>'}).join("")+'</div></div></section>';
  }
  var fac=lines(p.facilities), map=httpsUrl(p.mapUrl), vid=httpsUrl(p.videoUrl), bro=okId(p.brochure)?p.brochure:"";
  if(fac.length||p.address||map||vid||bro){
    h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="two-col">'+
      (fac.length?'<div><div class="sec-head"><span class="eyebrow">'+T("lifestyle")+'</span><h2>'+T("facilities")+'</h2></div><div class="facilities">'+fac.map(function(x){return '<span>'+esc(x)+'</span>'}).join("")+'</div></div>':'<div></div>')+
      '<div><div class="sec-head"><span class="eyebrow">'+T("address")+'</span><h2>'+T("location")+'</h2></div><p class="prose" style="margin:0">'+esc(p.address||p.area||"")+'</p>'+
      '<div class="links-row">'+(map?'<a class="btn" target="_blank" rel="noopener" href="'+esc(map)+'">'+T("maps")+'</a>':'')+(vid?'<a class="btn" target="_blank" rel="noopener" href="'+esc(vid)+'">'+T("video")+'</a>':'')+(bro?'<a class="btn" target="_blank" rel="noopener" href="'+blob(bro)+'">'+T("brochure")+'</a>':'')+'</div></div>'+
      '</div></div></section>';
  }
  h+=planSection(p);
  h+='<footer class="foot"><div class="wrap"><span>'+esc(T("prepared",{n:DATA.settings.agentName||T("consultantFallback")}))+(DATA.settings.renNo?" · "+esc(DATA.settings.renNo):"")+'</span><span>'+T("disclaimer")+'</span>'+bgCredit()+'</div></footer>';
  if(wa)h+='<div class="mobile-cta"><a class="btn btn-solid" target="_blank" rel="noopener" href="'+esc(wa)+'">'+T("mobileCta")+'</a></div>';
  if(S.isAdmin&&!S.preview){
    h+='<div class="admin-bar"><button class="btn btn-sm" data-act="home">← Portfolio</button><button class="btn btn-sm" data-act="copy" data-slug="'+esc(p.slug)+'">Copy link</button><button class="btn btn-sm btn-solid" data-act="edit" data-slug="'+esc(p.slug)+'">Edit</button><a class="btn btn-sm" data-act="pdf" href="/api/brochure.pdf?p='+encodeURIComponent(p.slug)+'">Download brochure</a><button class="btn btn-sm btn-ghost" data-act="preview">Client view</button></div>';
  }else if(S.isAdmin&&S.preview){
    h+='<div class="admin-bar"><span class="muted" style="font-size:12px;padding:8px 10px">Showing what your client sees</span><button class="btn btn-sm" data-act="preview">Exit client view</button></div>';
  }
  var lbs=sets[S.lbSet||"g"]||imgs;
  if(S.lb!=null&&lbs.length){
    var i=((S.lb%lbs.length)+lbs.length)%lbs.length;
    h+='<div class="lightbox'+(S.lbSet&&S.lbSet!=="g"?" light":"")+'" role="dialog" aria-label="Photo viewer"><img src="'+blob(lbs[i])+'" alt=""><button class="lb-btn lb-close" data-act="lbclose" aria-label="Close">✕</button><button class="lb-btn lb-prev" data-act="lbprev" aria-label="Previous">‹</button><button class="lb-btn lb-next" data-act="lbnext" aria-label="Next">›</button><div class="lb-count">'+(i+1)+' / '+lbs.length+'</div></div>';
  }
  return h;
}

function renderPrivate(){
  return topbar("")+'<div class="private"><div class="wrap"><div class="box"><div class="rule" style="width:180px"><span class="diamond"></span></div><span class="eyebrow">'+T("privEy")+'</span><h1 class="gold-text">'+(S.ready?T("privH"):"Loading…")+'</h1>'+(S.ready?'<p class="muted" style="max-width:46ch">'+T("privP")+'</p>':'')+'</div><div style="margin-top:56px;text-align:left">'+(S.ready?agentBlock():"")+'</div></div></div>';
}

/* ---------- landing page (main page of the website) ---------- */
var DEFAULT_SERVICES=I18N.en.defServices;
/* public home page: every published (non-Draft) project, "Featured" ones first */
function landingProjects(){var live=DATA.projects.filter(function(p){return p.status!=="Draft"});return live.filter(function(p){return p.featured==="Yes"}).concat(live.filter(function(p){return p.featured!=="Yes"}))}
function homeTools(feat){
  var s=DATA.settings,name=s.agentName||T("consultant"),wa=digits(s.whatsapp);
  var price=(feat[0]&&parsePrice(feat[0].priceFrom))||1000000;
  var loan='<div class="panel tool"><span class="eyebrow">'+T("planEy")+'</span><h3>'+T("loanH")+'</h3><div class="fields" style="margin-top:14px">'+
    '<div class="fld full"><label for="ln-price">'+T("lPrice")+'</label><input id="ln-price" data-loan inputmode="numeric" value="'+price.toLocaleString("en-MY")+'"></div>'+
    '<div class="fld"><label for="ln-down">'+T("lDown")+'</label><select id="ln-down" data-loan><option value="10" selected>10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option></select></div>'+
    '<div class="fld"><label for="ln-rate">'+T("lRate")+'</label><input id="ln-rate" data-loan inputmode="decimal" value="4.2"></div>'+
    '<div class="fld full"><label for="ln-years">'+T("lYears")+': <span id="ln-years-v">35</span></label><input id="ln-years" data-loan type="range" min="5" max="35" step="1" value="35"></div></div>'+
    '<div class="loan-out"><div class="k">'+T("lMonthly")+'</div><div class="big"><span id="ln-monthly">—</span> <small>'+T("perMonth")+'</small></div>'+
    '<div class="loan-grid"><div><div class="k">'+T("lLoan")+'</div><div id="ln-loan"></div></div><div><div class="k">'+T("lDownAmt")+'</div><div id="ln-downamt"></div></div><div><div class="k">'+T("lInterest")+'</div><div id="ln-interest"></div></div></div></div>'+
    '<p class="muted" style="font-size:12px;margin:12px 0 0">'+T("lNote")+'</p></div>';
  var ask='<form class="panel tool" id="ask-form" novalidate><span class="eyebrow">'+T("askEy")+'</span><h3>'+T("askH")+'</h3><p class="muted" style="margin:2px 0 0;font-size:14px">'+T("askP")+'</p><div class="fields" style="margin-top:14px">'+
    '<div class="fld full"><label for="ask-name">'+T("bName")+'</label><input id="ask-name" autocomplete="name"></div>'+
    '<div class="fld full"><label for="ask-proj">'+T("askProj")+'</label><select id="ask-proj">'+feat.map(function(p){return '<option value="'+esc(p.slug)+'">'+esc(p.name)+'</option>'}).join("")+'<option value="">'+T("askGeneral")+'</option></select></div>'+
    '<div class="fld full"><label for="ask-msg">'+T("askMsg")+'</label><textarea id="ask-msg" style="min-height:96px" placeholder="'+esc(T("askPh"))+'"></textarea></div></div>'+
    '<div class="tool-acts"><button class="btn btn-solid" type="submit" style="width:100%">'+T("bSend")+'</button></div></form>';
  var phone=s.phone?'<div class="pf-row"><span class="k">'+T("tel")+'</span><a href="tel:'+esc(s.phone.replace(/[^0-9+]/g,""))+'">'+esc(s.phone)+'</a></div>':'';
  var email=s.email?'<div class="pf-row"><span class="k">'+T("email")+'</span><a href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></div>':'';
  /* landscape name card: front and back side by side, details and buttons underneath */
  var card='<div class="panel tool namecard-wide"><span class="eyebrow">'+T("consultant")+'</span><h3>'+T("cardH")+'</h3>'+
    '<div class="card-faces" id="lp-card" data-split="1">'+(okId(s.cardImage)&&!/\.pdf$/i.test(s.cardImage)?'<img class="one" src="'+blob(s.cardImage)+'" alt="'+esc(name)+'">':'')+'</div>'+
    '<div class="nc-bottom"><div class="pf-rows nc-rows">'+(s.agency?'<div class="pf-row"><span class="k">'+T("agency")+'</span><span>'+esc(s.agency)+'</span></div>':'')+(s.renNo?'<div class="pf-row"><span class="k">REN</span><span>'+esc(s.renNo)+'</span></div>':'')+phone+email+'</div>'+
    '<div class="tool-acts">'+(wa?'<a class="btn btn-sm btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'')+'<button class="btn btn-sm" data-act="card">'+T("card")+'</button>'+(s.phone||wa||s.email?'<button class="btn btn-sm btn-ghost" data-act="vcard">'+T("vcard")+'</button>':'')+'</div></div></div>';
  return '<section class="block" style="padding-top:0"><div class="wrap"><div class="rule" style="margin-bottom:44px"><span class="diamond"></span></div><div class="dash-tools two">'+loan+ask+'</div>'+
    '<div class="rule" style="margin:56px 0 40px"><span class="diamond"></span></div>'+card+'</div></section>';
}
function sendAsk(form){
  var s=DATA.settings,wa=digits(s.whatsapp);if(!wa){toast(T("bNoWa"));return}
  var n=form.querySelector("#ask-name").value.trim();if(!n){toast(T("bNeed"));form.querySelector("#ask-name").focus();return}
  var p=findP(form.querySelector("#ask-proj").value),m=form.querySelector("#ask-msg").value.trim(),a=s.agentName||"";
  var txt=(p?T("askText",{a:a,n:n,p:p.name}):T("askTextGen",{a:a,n:n}))+(m?"\n\n"+m:"")+(p?"\n"+shareUrl(p):"");
  window.open("https://wa.me/"+wa+"?text="+encodeURIComponent(txt),"_blank","noopener");
}
function renderLanding(){
  var s=DATA.settings,name=s.agentName||T("title"),wa=digits(s.whatsapp);
  var feat=landingProjects(),photo=s.photo&&okId(s.photo)?s.photo:"";
  /* with a site background photo set, the banner is see-through so the page has one even tone (same as the dashboard) */
  var useSiteBg=okId(s.bgImage)&&s.bgStrength!=="Off";
  var bg=useSiteBg?"":((feat[0]&&(feat[0].images||[]).filter(okId)[0])||"");
  var services=lines(deflt(s.services,"defServices"));
  var h=topbar(wa?'<a class="btn btn-sm btn-solid hide-sm" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'');
  h+='<section class="hero landing-hero'+(useSiteBg?' no-cover':'')+'">'+(bg?'<img class="cover" src="'+blob(bg)+'" alt="">':'<div class="ghost-mark" aria-hidden="true">'+esc(initials(name))+'</div>')+
    '<div class="hero-inner"><div class="wrap reveal landing-grid"><div style="min-width:0">'+
    '<span class="eyebrow">'+esc([deflt(s.agentTitle,"title"),deflt(s.city,"city")].join(" · "))+'</span>'+
    '<h1 class="gold-text">'+esc(name)+'</h1>'+
    '<p class="tagline" style="margin:0 0 28px">'+esc(deflt(s.headline,"defHeadline"))+'</p>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap">'+(wa?'<a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'?text='+encodeURIComponent(T("waLanding",{n:name}))+'">'+T("talk")+'</a>':'')+
    '<button class="btn" data-act="card">'+T("card")+'</button></div>'+
    '<div class="facts" style="margin-top:34px">'+[[T("agency"),s.agency],["REN",s.renNo],[T("mobile"),s.phone]].filter(function(f){return f[1]}).map(function(f){return '<div class="fact"><div class="k">'+esc(f[0])+'</div><div class="v" style="font-size:19px">'+esc(f[1])+'</div></div>'}).join("")+'</div>'+
    '</div>'+(photo?'<div class="portrait"><img src="'+blob(photo)+'" alt="'+esc(name)+'"></div>':'')+'</div></div></section>';
  if(feat.length){
    h+='<section class="block"><div class="wrap"><div class="sec-head"><span class="eyebrow">'+T("selected")+'</span><h2>'+T("portH")+'</h2></div><div class="cards" style="padding-bottom:0">'+feat.map(function(p){
      var cover=(p.images||[]).filter(okId)[0];
      return '<a class="pcard lcard" href="/p/'+esc(p.slug)+'" data-act="open" data-slug="'+esc(p.slug)+'"><div class="thumb">'+(cover?'<img loading="lazy" src="'+blob(cover)+'" alt="">':'<span class="ini">'+esc(initials(p.name))+'</span>')+(p.status?'<span class="status-chip">'+esc(TS(p.status))+'</span>':'')+'</div>'+
        '<div class="body"><span class="eyebrow">'+esc(p.area||"")+'</span><h3>'+esc(p.name)+'</h3>'+(p.tagline?'<span class="muted" style="font-size:14px">'+esc(p.tagline)+'</span>':'')+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px"><span style="color:var(--gold-hi);font-family:var(--display);font-size:19px">'+(p.priceFrom?T("from")+" "+esc(p.priceFrom):"")+'</span><span class="eyebrow">'+T("view")+'</span></div></div></a>';
    }).join("")+'</div></div></section>';
  }
  h+=homeTools(feat);
  h+='<section class="block" style="padding-top:0"><div class="wrap"><div class="rule" style="margin-bottom:44px"><span class="diamond"></span></div><div class="two-col"><div><div class="sec-head"><span class="eyebrow">'+T("about")+'</span><h2>'+T("aboutH")+'</h2></div><div class="prose">'+esc(deflt(s.about,"defAbout"))+'</div></div>'+
    '<div><div class="sec-head"><span class="eyebrow">'+T("help")+'</span><h2>'+T("services")+'</h2></div><ul class="highlights">'+services.map(function(x){return '<li><span class="diamond"></span><span>'+esc(x)+'</span></li>'}).join("")+'</ul></div></div></div></section>';
  h+='<footer class="foot"><div class="wrap"><span>© '+new Date().getFullYear()+' '+esc(name)+(s.agency?" · "+esc(s.agency):"")+(s.renNo?" · "+esc(s.renNo):"")+'</span>'+bgCredit()+'</div></footer>';
  if(wa)h+='<div class="mobile-cta"><a class="btn btn-solid" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">'+T("talk")+'</a></div>';
  if(S.isAdmin)h+='<div class="admin-bar"><span class="muted" style="font-size:12px;padding:8px 10px">Your public home page, as clients see it</span><button class="btn btn-sm" data-act="landingoff">← Portfolio</button><button class="btn btn-sm btn-solid" data-act="settings">Edit landing page</button></div>';
  return h;
}

/* ---------- admin dashboard ---------- */
/* Owner tools above the project list: quick loan calculator, WhatsApp share box, profile card. */
function waMessage(p){
  var s=DATA.settings,bits=[p.area,p.priceFrom?"from "+p.priceFrom:""].filter(Boolean).join(", ");
  return "Hi, here are the details for "+p.name+(bits?" ("+bits+")":"")+".\n\n"+shareUrl(p)+"\n\nPhotos, floor plans, prices and a loan calculator are all on the page. Let me know if you would like to arrange a viewing."+(s.agentName?"\n\n"+s.agentName+(s.phone?" · "+s.phone:""):"");
}
function dashTools(){
  var s=DATA.settings,ps=DATA.projects;
  var first=ps[0],price=first?(parsePrice(first.priceFrom)||1000000):1000000;
  var loan='<div class="panel tool"><span class="eyebrow">Quick calculator</span><h3>Loan instalment</h3><div class="fields" style="margin-top:14px">'+
    '<div class="fld full"><label for="ln-price">Property price (RM)</label><input id="ln-price" data-loan inputmode="numeric" value="'+price.toLocaleString("en-MY")+'"></div>'+
    '<div class="fld"><label for="ln-down">Down payment</label><select id="ln-down" data-loan><option value="10" selected>10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option></select></div>'+
    '<div class="fld"><label for="ln-rate">Rate (% a year)</label><input id="ln-rate" data-loan inputmode="decimal" value="4.2"></div>'+
    '<div class="fld full"><label for="ln-years">Tenure: <span id="ln-years-v">35</span> years</label><input id="ln-years" data-loan type="range" min="5" max="35" step="1" value="35"></div></div>'+
    '<div class="loan-out"><div class="k">Monthly instalment</div><div class="big"><span id="ln-monthly">—</span> <small>/ month</small></div>'+
    '<div class="loan-grid"><div><div class="k">Loan</div><div id="ln-loan"></div></div><div><div class="k">Down</div><div id="ln-downamt"></div></div><div><div class="k">Interest</div><div id="ln-interest"></div></div></div></div></div>';
  var cur=findP(S.waSlug)||first,wa;
  if(cur){
    var msg=S.waMsg!=null&&S.waSlug===cur.slug?S.waMsg:waMessage(cur);
    wa='<div class="panel tool"><span class="eyebrow">Share with a client</span><h3>WhatsApp message</h3><div class="fields" style="margin-top:14px">'+
      '<div class="fld full"><label for="wa-proj">Project</label><select id="wa-proj">'+ps.map(function(p){return '<option value="'+esc(p.slug)+'"'+(p.slug===cur.slug?" selected":"")+'>'+esc(p.name)+'</option>'}).join("")+'</select></div>'+
      '<div class="fld full"><label for="wa-msg">Message (you can edit it)</label><textarea id="wa-msg" style="min-height:190px">'+esc(msg)+'</textarea></div></div>'+
      '<div class="tool-acts"><button class="btn btn-sm btn-solid" data-act="wacopy">Copy message</button><button class="btn btn-sm" data-act="waopen">Open WhatsApp</button><button class="btn btn-sm btn-ghost" data-act="wareset">Reset</button></div></div>';
  }else wa='<div class="panel tool"><span class="eyebrow">Share with a client</span><h3>WhatsApp message</h3><p class="muted">Add a project first.</p></div>';
  var contact=function(k,v){return v?'<div class="pf-row"><span class="k">'+k+'</span><span>'+esc(v)+'</span></div>':''};
  var prof='<div class="panel tool profile profile-wide"><div class="pf-head" style="margin-top:0"><div class="mono">'+esc(initials(s.agentName||"Your Name"))+'</div><div><h3>'+esc(s.agentName||"Your name")+'</h3><div class="muted" style="font-size:14px">'+esc(s.agentTitle||"Property Consultant")+'</div></div></div>'+
    '<div class="pf-rows">'+contact("Agency",s.agency)+contact("REN",s.renNo)+contact("Phone",s.phone)+contact("WhatsApp",s.whatsapp&&s.whatsapp!==s.phone?s.whatsapp:"")+contact("Email",s.email)+contact("Website",(s.baseUrl||"").replace(/^https?:\/\//,""))+'</div>'+
    (!s.renNo?'<p class="muted" style="font-size:13px;margin:12px 0 0">Tip: add your REN number so it shows on client pages.</p>':'')+
    '<div class="tool-acts"><button class="btn btn-sm btn-solid" data-act="settings">Edit profile</button>'+(s.baseUrl?'<button class="btn btn-sm" data-act="copytext" data-text="'+esc(s.baseUrl)+'">Copy site link</button>':'')+'</div></div>';
  return '<section class="tools-sec"><div class="rule"><span class="diamond"></span></div>'+
    '<div class="sec-head"><span class="tools-label">For Client Use</span></div>'+
    '<div class="dash-tools two">'+loan+wa+'</div>'+
    '<div class="rule" style="margin:56px 0 40px"><span class="diamond"></span></div>'+prof+'</section>';
}
function renderDash(){
  var s=DATA.settings,h=topbar('<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" data-act="landing">Landing page</button><button class="btn btn-sm" data-act="settings">Profile &amp; settings</button><button class="btn btn-sm" data-act="publish"'+(S.saving?" disabled":"")+'>Publish website</button><button class="btn btn-sm btn-solid" data-act="new">+ New project</button></div>');
  if(S.exported){var x=S.exported;h+='<div class="wrap" style="padding-top:24px"><div class="notice" style="flex-direction:column;align-items:flex-start"><strong class="gold-text" style="font-family:var(--display);font-size:22px;font-weight:400">Website ready to upload</strong>'+
    '<span>Published: '+(x.published.length?esc(x.published.join(", ")):"no projects (all are Draft)")+'.</span>'+
    (x.skippedDrafts.length?'<span class="muted">Not published because status is Draft: '+esc(x.skippedDrafts.join(", "))+'.</span>':'')+
    (x.hasBaseUrl?'':'<span class="muted">Tip: add your online address in Profile &amp; settings, then publish again, so WhatsApp shows the cover photo in link previews.</span>')+
    '<span>Next: in your GitHub repository click <strong>Add file → Upload files</strong> and drag in everything inside this folder:</span><span class="linkbox" style="width:100%"><span>'+esc(x.folder)+'</span></span>'+
    '<button class="btn btn-sm btn-ghost" data-act="dismissexport">Close</button></div></div>'}
  h+='<div class="wrap"><div class="dash-head"><div><span class="eyebrow">Owner view · only this computer sees this page</span><h1>Project Portfolio</h1><p class="muted" style="margin:8px 0 0">'+DATA.projects.length+' project'+(DATA.projects.length===1?"":"s")+'. Published projects appear on your public home page; Draft projects stay hidden.</p></div></div>';
  if(!s.agentName)h+='<div class="notice"><span>Add your name, REN number and WhatsApp so they appear on every client presentation.</span><button class="btn btn-sm btn-solid" data-act="settings">Complete profile</button></div>';
  if(!DATA.projects.length){h+='<div class="empty"><p>No projects yet.</p><button class="btn btn-solid" data-act="new">Add your first project</button></div>'}
  h+='<div class="cards">'+DATA.projects.map(function(p){
    var cover=(p.images||[]).filter(okId)[0],url=shareUrl(p);
    return '<article class="pcard"><div class="thumb">'+(cover?'<img loading="lazy" src="'+blob(cover)+'" alt="">':'<span class="ini">'+esc(initials(p.name))+'</span>')+'<span class="status-chip">'+esc(p.status||"Draft")+'</span></div>'+
      '<div class="body"><span class="eyebrow">'+esc(p.area||" ")+'</span><h3>'+esc(p.name)+'</h3>'+(p.priceFrom?'<span class="muted" style="font-size:13px">From '+esc(p.priceFrom)+'</span>':'')+
      '<div class="linkbox"><span>'+esc(url)+'</span></div>'+
      (S.confirmDel===p.slug?'<div class="confirm"><span>Delete this project? Its client link will stop working.</span><button class="btn btn-sm btn-danger" data-act="delyes" data-slug="'+esc(p.slug)+'">Delete</button><button class="btn btn-sm btn-ghost" data-act="delno">Keep</button></div>':'')+
      '<div class="acts"><button class="btn btn-sm btn-solid" data-act="copy" data-slug="'+esc(p.slug)+'">Copy link</button><button class="btn btn-sm" data-act="open" data-slug="'+esc(p.slug)+'">View</button><button class="btn btn-sm" data-act="edit" data-slug="'+esc(p.slug)+'">Edit</button><a class="btn btn-sm" data-act="pdf" href="/api/brochure.pdf?p='+encodeURIComponent(p.slug)+'">Brochure PDF</a><button class="btn btn-sm btn-ghost" data-act="del" data-slug="'+esc(p.slug)+'">Delete</button></div></div></article>';
  }).join("")+'</div>'+dashTools()+'</div>';
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
  h+=group("Photos","Show your best exterior or view as the cover.",up+'<div class="thumbs">'+imgs.map(function(id,i){return okId(id)?'<figure>'+(i===0?'<span class="cover-tag">Cover</span>':'')+(d.brochureCover===id?'<span class="cover-tag">Brochure cover</span>':'')+'<img src="'+blob(id)+'" alt="">'+'<div class="tb">'+(i>0?'<button data-act="imgcover" data-i="'+i+'">Make cover</button><button data-act="imgleft" data-i="'+i+'" aria-label="Move earlier">‹</button>':'')+(i<imgs.length-1?'<button data-act="imgright" data-i="'+i+'" aria-label="Move later">›</button>':'')+(d.brochureCover===id?'':'<button data-act="brocover" data-i="'+i+'">Brochure cover</button>')+'<button data-act="imgdel" data-i="'+i+'">Remove</button></div></figure>':''}).join("")+'</div>');
  var pl=(d.plans||[]);
  h+=group("Floor plans","Shown under Layouts, before the unit types table. Upload in the order you want them shown.",
    '<div class="upload-zone"><label class="btn btn-sm btn-solid" for="f-plans">Upload floor plans</label><input id="f-plans" type="file" accept="image/*" multiple hidden><span class="muted" style="font-size:13px">PNG or JPG. Kept sharp (not compressed).</span></div>'+
    '<div class="thumbs">'+pl.map(function(id,i){return okId(id)?'<figure><img src="'+blob(id)+'" alt="" style="object-fit:contain;background:#F7F1E6"><div class="tb">'+(i>0?'<button data-act="planleft" data-i="'+i+'" aria-label="Move earlier">‹</button>':'')+(i<pl.length-1?'<button data-act="planright" data-i="'+i+'" aria-label="Move later">›</button>':'')+'<button data-act="plandel" data-i="'+i+'">Remove</button></div></figure>':''}).join("")+'</div>');
  h+=group("Surroundings map","One image showing the project and nearby landmarks. Shown after the Overview.",
    '<div class="upload-zone">'+(okId(d.surroundImage)?'<img src="'+blob(d.surroundImage)+'" alt="" style="height:70px;border:1px solid var(--line)">':'')+
    '<label class="btn btn-sm" for="f-map">'+(d.surroundImage?"Replace map":"Upload map")+'</label><input id="f-map" type="file" accept="image/*" hidden>'+(d.surroundImage?'<button class="btn btn-sm btn-ghost" data-act="mapdel">Remove</button>':'')+'</div>');
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
  var pool=[];DATA.projects.forEach(function(p){(p.images||[]).forEach(function(f){if(okId(f)&&!/\.png$/i.test(f)&&pool.indexOf(f)<0)pool.push(f)})});
  if(okId(d.bgImage)&&pool.indexOf(d.bgImage)<0)pool.unshift(d.bgImage);
  h+=group("Website background","A see-through property photo behind your landing page. Project pages use their own cover photo.",
    '<div class="fields"><div class="fld">'+'<label for="f-bgStrength">Strength</label><select id="f-bgStrength" data-k="bgStrength">'+["Off","Subtle","Medium","Strong"].map(function(o){return '<option'+((d.bgStrength||"Medium")===o?" selected":"")+'>'+o+'</option>'}).join("")+'</select></div></div>'+
    '<div class="bg-pick">'+pool.slice(0,24).map(function(f){return '<button type="button" class="'+(d.bgImage===f?"on":"")+'" data-act="bgpick" data-f="'+esc(f)+'" aria-label="Use this photo"><img loading="lazy" src="'+blob(f)+'" alt=""></button>'}).join("")+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-sm" data-act="bgup">Upload a photo</button>'+(d.bgImage?'<button class="btn btn-sm btn-ghost" data-act="bgclear">Use featured project photo</button>':'')+
    '<input id="f-bgfile" type="file" accept="image/jpeg,image/png,image/webp" hidden></div>');
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
  var lpc=document.getElementById("lp-card");if(lpc&&!lpc.firstChild&&window.NameCard)NameCard.draw(DATA.settings).then(function(cv){
    if(!lpc.isConnected)return;lpc.innerHTML="";
    /* the drawn card is front above back (40px gap); show the two faces side by side */
    var h=(cv.height-40)/2;[0,h+40].forEach(function(y){var f=document.createElement("canvas");f.width=cv.width;f.height=h;f.getContext("2d").drawImage(cv,0,y,cv.width,h,0,0,cv.width,h);lpc.appendChild(f)});
  }).catch(function(){});
  var up=document.getElementById("f-upload");if(up)up.addEventListener("change",onPhotos);
  var fp=document.getElementById("f-plans");if(fp)fp.addEventListener("change",function(ev){
    readFields(S.draft);var files=[].slice.call(ev.target.files||[]),n=0;S.draft.plans=S.draft.plans||[];
    (function next(){if(n>=files.length){S.uploading="";render();return}S.uploading="Uploading floor plan "+(n+1)+" of "+files.length+"…";render();var f=files[n++];
      upload(f,f.type||"image/png").then(function(r){S.draft.plans.push(r.id);next()}).catch(function(e){toast(e.message);next()})})();
  });
  var fm=document.getElementById("f-map");if(fm)fm.addEventListener("change",function(ev){
    readFields(S.draft);var f=(ev.target.files||[])[0];if(!f)return;S.uploading="Uploading map…";render();
    upload(f,f.type||"image/jpeg").then(function(r){S.draft.surroundImage=r.id;S.uploading="";render()}).catch(function(e){S.uploading="";render();toast(e.message)});
  });
  var br=document.getElementById("f-brochure");if(br)br.addEventListener("change",onBrochure);
  var cf=document.getElementById("f-cardfile");if(cf)cf.addEventListener("change",onCardFile);
  var bf=document.getElementById("f-bgfile");if(bf)bf.addEventListener("change",function(ev){
    readFields(S.settingsDraft);var f=(ev.target.files||[])[0];if(!f)return;toast("Uploading background photo…");
    compress(f).then(function(b){return upload(b)}).then(function(r){S.settingsDraft.bgImage=r.id;render();toast("Uploaded. Click Save to keep it.")}).catch(function(e){toast(e.message)});
  });
  var bs=document.getElementById("f-bgStrength");if(bs)bs.addEventListener("change",function(){readFields(S.settingsDraft);pageBg()});
  var pf=document.getElementById("f-photo");if(pf)pf.addEventListener("change",function(ev){
    readFields(S.settingsDraft);var f=(ev.target.files||[])[0];if(!f)return;toast("Uploading your photo…");
    compress(f).then(function(b){return upload(b)}).then(function(r){S.settingsDraft.photo=r.id;render();toast("Photo uploaded. Click Save to use it.")}).catch(function(e){toast(e.message)});
  });
  if(S.mode==="settings")drawCardPreview();
  if(document.getElementById("ln-price"))loanCalc();
  pageBg();
}
/* choose the background photo: the project's own cover on a project page, otherwise your chosen photo */
var BG_OP={Subtle:.16,Medium:.28,Strong:.4};
function bgCredit(){
  var s=DATA.settings;if(!s.bgCredit||s.bgStrength==="Off")return "";
  var u=httpsUrl(s.bgCreditUrl);
  return '<span class="bg-credit">'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(s.bgCredit)+'</a>':esc(s.bgCredit))+'</span>';
}
function pageBg(){
  var el=document.getElementById("page-bg");
  if(!el){el=document.createElement("div");el.id="page-bg";el.className="page-bg";el.setAttribute("aria-hidden","true");document.body.insertBefore(el,document.body.firstChild)}
  var s=(S.mode==="settings"&&S.settingsDraft)?S.settingsDraft:DATA.settings,p=findP(currentSlug()),img="";
  /* project pages use the project's own cover photo; the site background photo (Profile & settings) is for the main page */
  if(p&&S.mode==="view")img=(p.images||[]).filter(function(f){return okId(f)&&(p.plans||[]).indexOf(f)<0&&f!==p.surroundImage})[0]||"";
  if(!img&&okId(s.bgImage))img=s.bgImage;
  if(!img){var f=DATA.projects.filter(function(x){return x.featured==="Yes"&&(x.images||[]).length})[0]||DATA.projects.filter(function(x){return (x.images||[]).length})[0];if(f)img=(f.images||[]).filter(okId)[0]||""}
  if(s.bgStrength==="Off")img="";
  el.style.backgroundImage=img?'url("'+blob(img)+'")':"none";
  /* very wide panoramas (e.g. a city skyline) are shown full width along the bottom so nothing is cropped off the sides */
  if(img&&el.getAttribute("data-img")!==img){el.setAttribute("data-img",img);el.classList.remove("wide");var probe=new Image();probe.onload=function(){if(el.getAttribute("data-img")===img)el.classList.toggle("wide",probe.naturalWidth/probe.naturalHeight>2)};probe.src=blob(img)}
  document.body.classList.toggle("has-bg",!!img);
  el.style.setProperty("--bg-op",BG_OP[s.bgStrength]||BG_OP.Medium);
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

function copy(text,done){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast(done||"Link copied: "+text)},function(){fallbackCopy(text,done)});
  }else fallbackCopy(text,done);
}
function fallbackCopy(text,done){
  var t=document.createElement("textarea");t.value=text;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
  var ok=false;try{ok=document.execCommand("copy")}catch(e){}t.remove();
  toast(ok?(done||"Link copied: "+text):"Could not copy. Please select the text and copy it.");
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
    case "wacopy":{var wm=document.getElementById("wa-msg");if(wm)copy(wm.value,"Message copied. Paste it into WhatsApp.");break}
    case "waopen":{var wm2=document.getElementById("wa-msg");if(wm2)window.open("https://wa.me/?text="+encodeURIComponent(wm2.value),"_blank","noopener");break}
    case "wareset":S.waMsg=null;render();break;
    case "preview":S.preview=!S.preview;render();refresh();break;
    case "new":S.draft={_orig:"",name:"",slug:"",status:"New Launch",units:[],images:[]};S.mode="edit";render();window.scrollTo(0,0);break;
    case "edit":{var q=findP(slug);if(q){S.draft=clone(q);S.draft._orig=q.slug;S.draft.units=S.draft.units||[];S.draft.images=S.draft.images||[];S.mode="edit";render();window.scrollTo(0,0)}break}
    case "settings":S.settingsDraft=clone(DATA.settings);S.mode="settings";render();window.scrollTo(0,0);break;
    case "cancel":S.mode="view";S.draft=null;S.settingsDraft=null;render();window.scrollTo(0,0);break;
    case "save":saveProject();break;
    case "savesettings":{readFields(S.settingsDraft);var n=clone(DATA);n.settings=clone(S.settingsDraft);saveData(n,location.pathname);break}
    case "card":if(window.NameCard)NameCard.download(S.mode==="settings"&&S.settingsDraft?(readFields(S.settingsDraft),S.settingsDraft):DATA.settings).then(function(){toast("Name card downloaded.")}).catch(function(){toast("Could not create the name card.")});break;
    case "vcard":if(window.NameCard){NameCard.vcard(DATA.settings);toast("Contact file downloaded. Open it to add to your contacts.")}break;
    case "lang":setLang(b.getAttribute("data-lang"));break;
    case "bgpick":readFields(S.settingsDraft);S.settingsDraft.bgImage=b.getAttribute("data-f");render();toast("Background chosen. Click Save to keep it.");break;
    case "bgclear":readFields(S.settingsDraft);S.settingsDraft.bgImage="";render();break;
    case "bgup":document.getElementById("f-bgfile").click();break;
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
    case "brocover":readFields(d);d.brochureCover=d.images[i];render();toast("Set as brochure cover. Click Save project to keep it.");break;
    case "planleft":readFields(d);d.plans.splice(i-1,0,d.plans.splice(i,1)[0]);render();break;
    case "planright":readFields(d);d.plans.splice(i+1,0,d.plans.splice(i,1)[0]);render();break;
    case "plandel":readFields(d);d.plans.splice(i,1);render();break;
    case "mapdel":readFields(d);d.surroundImage="";render();break;
    case "brodel":readFields(d);d.brochure="";render();break;
    case "lb":S.lb=i;S.lbSet=b.getAttribute("data-set")||"g";render();break;
    case "lbclose":S.lb=null;render();break;
    case "lbprev":S.lb--;render();break;
    case "lbnext":S.lb++;render();break;
  }
});
app.addEventListener("input",function(e){
  if(e.target.hasAttribute&&e.target.hasAttribute("data-loan")){var yv=document.getElementById("ln-years-v");if(yv)yv.textContent=document.getElementById("ln-years").value;loanCalc()}
  if(e.target.id==="wa-msg"){var ws=document.getElementById("wa-proj");S.waSlug=ws?ws.value:S.waSlug;S.waMsg=e.target.value}
});
app.addEventListener("change",function(e){
  if(e.target.hasAttribute&&e.target.hasAttribute("data-loan"))loanCalc();
  if(e.target.id==="wa-proj"){S.waSlug=e.target.value;S.waMsg=null;var m=document.getElementById("wa-msg"),p=findP(S.waSlug);if(m&&p)m.value=waMessage(p)}
});
app.addEventListener("submit",function(e){if(e.target.id==="book-form"){e.preventDefault();sendBooking(e.target)}if(e.target.id==="ask-form"){e.preventDefault();sendAsk(e.target)}});
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
