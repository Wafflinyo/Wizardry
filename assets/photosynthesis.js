/* Photosynthesis v2: the actual illustrated low-poly sunflower sprites.
   Source flower-only poses are arranged into a 32-frame timeline with a
   held bloom. Sunlight and healing are independent transparent WebP atlases.
   Nothing is baked onto the target or arena. */
(()=>{
"use strict";
const C=240,R=160,N=32,clamp=p=>Math.max(0,Math.min(1,p)),mix=(a,b,p)=>a+(b-a)*p;
const sheets=Object.fromEntries(["flower","sun","heal"].map(n=>[n,new Image()]));
const valid=img=>img.complete&&img.naturalWidth===C*8&&img.naturalHeight===R*4;
const ready=()=>Object.values(sheets).every(valid);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 lastError="";
 pending=Promise.all(Object.entries(sheets).map(([name,img])=>valid(img)?Promise.resolve(true):new Promise(resolve=>{
  const timeout=setTimeout(()=>{lastError=name+" artwork timed out";resolve(false);},12000);
  img.onload=()=>{clearTimeout(timeout);if(!valid(img))lastError=name+" artwork dimensions invalid";resolve(valid(img));};
  img.onerror=()=>{clearTimeout(timeout);lastError=name+" artwork failed to load";resolve(false);};
  img.src="./assets/photosynthesis-"+name+"-illustrated.webp?v=1";
 }))).then(results=>{const ok=results.every(Boolean);if(ok){lastError="";try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}}return ok;}).finally(()=>pending=null);
 return pending;
}
function tile(g,name,p,x,y,w,h,dir=1,alpha=1){
 if(p<0||p>1||!valid(sheets[name])||alpha<=0)return;
 const n=Math.min(N-1,Math.round(p*(N-1)));
 g.save();g.translate(x,y);g.scale(dir,1);g.globalAlpha*=alpha;
 g.drawImage(sheets[name],n%8*C,Math.floor(n/8)*R,C,R,-w/2,-h,w,h);g.restore();
}
function scene(u,p,factor=1){
 const k=Math.max(.7,Math.min(2.1,factor)),dir=u.x<500?1:-1;
 return {u,p:clamp(p),x:u.x+dir*100*k,y:u.y+4*k,k,dir};
}
function drawFlower(g,s){
 tile(g,"flower",s.p,s.x,s.y+7*s.k,252*s.k,168*s.k,s.dir);
}
function drawSun(g,s){
 if(s.p<.28||s.p>.74)return;
 const t=(s.p-.28)/.46;
 tile(g,"sun",t,s.x,s.y-19*s.k,252*s.k,238*s.k,s.dir,.88);
}
function drawTransfer(g,s){
 if(s.p<.53||s.p>.83||!valid(sheets.heal))return;
 const t=(s.p-.53)/.30;
 // Small illustrated leaf fragments travel toward the recipient. Sample
 // the leaf-only beginning of the healing atlas; no drawn substitute plant.
 for(let i=0;i<7;i++){
  const q=t*1.45-i*.065;
  if(q<=0||q>=1)continue;
  const x=mix(s.x,s.u.x,q),y=mix(s.y-110*s.k,s.u.y-70*s.k,q)-Math.sin(Math.PI*q)*29*s.k+Math.sin(q*11+i)*10*s.k;
  tile(g,"heal",.035,x,y+12*s.k,(38+i%3*7)*s.k,(25+i%3*5)*s.k,s.dir,Math.sin(q*Math.PI)*.9);
 }
}
function drawActivation(g,u,p,factor=1){
 const k=Math.max(.7,Math.min(2.1,factor));
 tile(g,"heal",clamp(p),u.x,u.y+13*k,235*k,225*k,1,Math.min(1,(1-p)*7));
}
function portrait(g,w,h){
 const size=Math.min(w*1.08,h*1.5);
 tile(g,"flower",.48,w*.5,h*.98,size,size*R/C);
}
window.Photosynthesis={ensure,ready,error:()=>lastError,scene,flower:drawFlower,sun:drawSun,transfer:drawTransfer,activate:drawActivation,portrait};ensure();
})();