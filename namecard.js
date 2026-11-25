/* Name card: draws a black & gold business card (front + back) on a canvas,
   and builds a contact file (.vcf) clients can save to their phone. */
(function(){
"use strict";
var W=1050,H=600; // 3.5 x 2 inch at 300 dpi
var C={ink:"#0A0907",panel:"#17140F",gold:"#C8A564",hi:"#EBD7A6",lo:"#8C6F3D",text:"#EDE6D6",muted:"#A39A86"};
var DISPLAY='"Cormorant Garamond", Garamond, Georgia, serif', BODY='Manrope, "Segoe UI", sans-serif';

function initials(s){var w=String(s||"").trim().split(/\s+/).filter(Boolean);return ((w[0]||"P")[0]+((w[1]||"")[0]||"")).toUpperCase()}
function digits(s){return String(s||"").replace(/[^0-9]/g,"")}
// WhatsApp needs the country code: a Malaysian local number "012..." becomes "6012..."
function waNum(s){var d=digits(s);return /^0/.test(d)?"6"+d:d}
function fontsReady(){
  if(!document.fonts||!document.fonts.load)return Promise.resolve();
  return Promise.all([document.fonts.load('500 64px "Cormorant Garamond"'),document.fonts.load('500 24px Manrope'),document.fonts.load('600 20px Manrope')]).catch(function(){});
}
function goldGrad(x,c,w){var g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,C.lo);g.addColorStop(.4,C.hi);g.addColorStop(.65,C.gold);g.addColorStop(1,C.hi);return g}
function spaced(c,text,x,y,spacing,align){
  var chars=String(text).split(""),w=0;chars.forEach(function(ch){w+=c.measureText(ch).width+spacing});w-=spacing;
  var sx=align==="center"?x-w/2:align==="right"?x-w:x;
  chars.forEach(function(ch){c.fillText(ch,sx,y);sx+=c.measureText(ch).width+spacing});return w;
}
function fit(c,text,font,size,maxW){do{c.font=font.replace("{s}",size);size-=2}while(c.measureText(text).width>maxW&&size>18)}
function base(c,ox,oy){
  var g=c.createRadialGradient(ox+W*.85,oy,20,ox+W*.85,oy,W);g.addColorStop(0,"#241D13");g.addColorStop(.55,C.panel);g.addColorStop(1,C.ink);
  c.fillStyle=g;c.fillRect(ox,oy,W,H);
  c.strokeStyle="rgba(200,165,100,.55)";c.lineWidth=2;c.strokeRect(ox+26,oy+26,W-52,H-52);
  c.strokeStyle="rgba(200,165,100,.18)";c.lineWidth=1;c.strokeRect(ox+36,oy+36,W-72,H-72);
  [[26,26],[W-26,26],[26,H-26],[W-26,H-26]].forEach(function(p){c.save();c.translate(ox+p[0],oy+p[1]);c.rotate(Math.PI/4);c.fillStyle=C.gold;c.fillRect(-6,-6,12,12);c.restore()});
}
function mono(c,x,y,size,s){
  c.strokeStyle=C.gold;c.lineWidth=2;c.strokeRect(x,y,size,size);
  c.strokeStyle="rgba(200,165,100,.35)";c.lineWidth=1;c.strokeRect(x+7,y+7,size-14,size-14);
  c.font="400 "+Math.round(size*.42)+"px "+DISPLAY;c.fillStyle=goldGrad(x,c,size);c.textAlign="center";c.textBaseline="middle";
  c.fillText(initials(s.agentName||"P P"),x+size/2,y+size/2+3);c.textAlign="left";c.textBaseline="alphabetic";
}
function front(c,ox,oy,s){
  base(c,ox,oy);
  mono(c,ox+84,oy+170,170,s);
  var x=ox+300,maxW=W-300-90,name=s.agentName||"Your Name";
  c.fillStyle=C.gold;c.font="600 17px "+BODY;spaced(c,(s.agentTitle||"Property Consultant").toUpperCase(),x,oy+200,5);
  fit(c,name,"400 {s}px "+DISPLAY,64,maxW);c.fillStyle=goldGrad(x,c,maxW);c.fillText(name,x,oy+280);
  c.strokeStyle="rgba(200,165,100,.5)";c.lineWidth=1.5;c.beginPath();c.moveTo(x,oy+315);c.lineTo(x+maxW*.7,oy+315);c.stroke();
  c.fillStyle=C.text;fit(c,s.agency||"",'500 {s}px '+BODY,24,maxW);if(s.agency)c.fillText(s.agency,x,oy+360);
  if(s.renNo){c.fillStyle=C.muted;c.font="500 19px "+BODY;spaced(c,String(s.renNo).toUpperCase(),x,oy+398,3)}
  c.fillStyle="rgba(200,165,100,.7)";c.font="600 13px "+BODY;spaced(c,"PRIVATE PROPERTY CONSULTANCY",ox+W/2,oy+H-62,7,"center");
}
function back(c,ox,oy,s){
  base(c,ox,oy);
  var same=digits(s.phone)&&waNum(s.phone)===waNum(s.whatsapp);
  var rows=[[same?"MOBILE · WHATSAPP":"MOBILE",s.phone],["WHATSAPP",!same&&waNum(s.whatsapp)?"+"+waNum(s.whatsapp):""],["EMAIL",s.email],["WEBSITE",(s.baseUrl||"").replace(/^https?:\/\//,"").replace(/\/+$/,"")]].filter(function(r){return r[1]});
  if(!rows.length)rows=[["MOBILE","+60 1X-XXX XXXX"]];
  var x=ox+110,y=oy+(H-rows.length*86)/2+40;
  rows.forEach(function(r){
    c.fillStyle=C.gold;c.font="600 15px "+BODY;spaced(c,r[0],x,y-30,6);
    c.fillStyle=C.text;fit(c,r[1],"500 {s}px "+BODY,34,W-x+ox-260);c.fillText(r[1],x,y+8);
    y+=86;
  });
  c.strokeStyle="rgba(200,165,100,.35)";c.lineWidth=1;c.beginPath();c.moveTo(ox+W-250,oy+110);c.lineTo(ox+W-250,oy+H-110);c.stroke();
  mono(c,ox+W-190,oy+H/2-65,130,s);
}
function draw(s){
  return fontsReady().then(function(){
    var gap=40,cv=document.createElement("canvas");cv.width=W;cv.height=H*2+gap;
    var c=cv.getContext("2d");c.fillStyle="#1E1A15";c.fillRect(0,0,cv.width,cv.height);
    front(c,0,0,s);back(c,0,H+gap,s);return cv;
  });
}
function fileName(s,ext){return ((s.agentName||"Name Card").replace(/[^\w\- ]+/g,"").trim()||"Name Card")+" - Name Card."+ext}
function save(blob,name){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
function download(s){
  if(s.cardImage&&/^[a-z0-9-]+\.(jpg|png|webp|pdf)$/i.test(s.cardImage)){
    return fetch("/uploads/"+s.cardImage).then(function(r){return r.blob()}).then(function(b){save(b,fileName(s,s.cardImage.split(".").pop()))});
  }
  return draw(s).then(function(cv){return new Promise(function(r){cv.toBlob(function(b){save(b,fileName(s,"png"));r()},"image/png")})});
}
function vesc(v){return String(v||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/([,;])/g,"\\$1")}
function vcard(s){
  var name=s.agentName||"Property Consultant",parts=name.trim().split(/\s+/);
  var L=["BEGIN:VCARD","VERSION:3.0","N:"+vesc(parts.length>1?parts.slice(-1)[0]:"")+";"+vesc(parts.length>1?parts.slice(0,-1).join(" "):name)+";;;","FN:"+vesc(name)];
  if(s.agency)L.push("ORG:"+vesc(s.agency));
  L.push("TITLE:"+vesc(s.agentTitle||"Property Consultant"));
  if(s.phone)L.push("TEL;TYPE=CELL:+"+waNum(s.phone));
  if(waNum(s.whatsapp)&&waNum(s.whatsapp)!==waNum(s.phone))L.push("TEL;TYPE=WORK:+"+waNum(s.whatsapp));
  if(s.email)L.push("EMAIL;TYPE=INTERNET:"+vesc(s.email));
  if(s.baseUrl)L.push("URL:"+vesc(s.baseUrl));
  if(s.renNo)L.push("NOTE:"+vesc(s.renNo));
  L.push("END:VCARD");
  save(new Blob([L.join("\r\n")+"\r\n"],{type:"text/vcard"}),((s.agentName||"Contact").replace(/[^\w\- ]+/g,"").trim()||"Contact")+".vcf");
}
window.NameCard={draw:draw,download:download,vcard:vcard};
})();
