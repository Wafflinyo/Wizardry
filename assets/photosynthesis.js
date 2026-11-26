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
function scene(u,p,factor=1,top=-120){
 const k=Math.max(.7,Math.min(2.1,factor)),dir=u.x<500?1:-1;
 return {u,p:clamp(p),x:u.x+dir*100*k,y:u.y+4*k,k,dir,top};
}
function drawFlower(g,s){
 tile(g,"flower",s.p,s.x,s.y+7*s.k,252*s.k,168*s.k,s.dir);
}
// Start every shaft beyond the actual camera's upper edge, not a fixed
// distance above a unit. The illustrated ray texture remains separate.
function shaft(g,x,y,k,dir,top,t,strength=1){
 if(t<=0||t>=1||y<=top)return;
 const a=Math.min(1,t*7,(1-t)*6)*strength,h=y-top;
 const drift=dir*Math.min(105*k,h*.14),sx=x+drift;
 g.save();
 // Narrow layered rays with no disc, visible emitter or hard upper cap.
 for(let j=0;j<5;j++){
   const offset=(j-2)*19*k,wide=(18+(j%3)*10)*k;
   const grad=g.createLinearGradient(0,top,0,y);
   grad.addColorStop(0,"rgba(231,183,65,"+(.12*a)+")");
   grad.addColorStop(.68,"rgba(248,211,99,"+(.19*a)+")");
   grad.addColorStop(1,"rgba(238,196,66,0)");
   g.fillStyle=grad;g.beginPath();
   g.moveTo(sx+offset-wide,top);g.lineTo(sx+offset+wide,top);
   g.lineTo(x+offset*.42+wide*.30,y);g.lineTo(x+offset*.42-wide*.30,y);
   g.closePath();g.fill();
 }
 // Extend the authored ray frames over the same full height. Their bottom
 // is anchored at the recipient, never scaled with a screen-space offset.
 tile(g,"sun",t,x,y,220*k,h,dir,.38*a);
 for(let j=0;j<13;j++){
   const q=t*1.8-j*.055;if(q<=0||q>=1)continue;
   const px=mix(sx,x,q)+Math.sin(j*7.2+q*4)*34*k;
   const py=mix(top,y,q),r=(1.8+j%3)*k;
   g.globalAlpha=a*Math.min(1,q*8,(1-q)*8)*.78;
   g.fillStyle=j%2?"#efd078":"#dbb348";
   g.beginPath();g.moveTo(px,py-r*2);g.lineTo(px+r,py);g.lineTo(px,py+r*2);g.lineTo(px-r,py);g.closePath();g.fill();
 }
 g.restore();
}
function drawSun(g,s){
 if(s.p<.23||s.p>.76)return;
 shaft(g,s.x,s.y-88*s.k,s.k,s.dir,s.top,(s.p-.23)/.53);
}
function drawReceiveSun(g,s){
 if(s.p<.47||s.p>.95)return;
 shaft(g,s.u.x,s.u.y-34*s.k,s.k,s.dir,s.top,(s.p-.47)/.48,.82);
}
function drawTransfer(g,s){
 if(s.p<.47||s.p>.96||!valid(sheets.heal))return;
 const t=(s.p-.47)/.49;
 // Falling illustrated leaf fragments originate above the visible screen.
 // Their endpoint is the selected wizard, not a mid-air point.
 for(let i=0;i<11;i++){
   const q=t*1.55-i*.047;
   if(q<=0||q>=1)continue;
   const x=s.u.x+s.dir*52*s.k*(1-q)+Math.sin(q*14+i*2.4)*30*s.k*(1-.5*q);
   const y=mix(s.top,s.u.y-26*s.k,q);
   tile(g,"heal",.035,x,y+12*s.k,(38+i%3*7)*s.k,(25+i%3*5)*s.k,s.dir,Math.min(1,q*8,(1-q)*5)*.85);
 }
}
function drawActivationSun(g,u,p,factor=1,top=-120){
 const k=Math.max(.7,Math.min(2.1,factor)),dir=u.x<500?1:-1;
 shaft(g,u.x,u.y-24*k,k,dir,top,clamp(p),.9);
}
function drawActivation(g,u,p,factor=1){
 const k=Math.max(.7,Math.min(2.1,factor));
 // The lower healing illustration stays local to the feet. Draw only the
 // lower portion so its short light column cannot create a second emitter.
 p=clamp(p);
 if(!valid(sheets.heal))return;
 const n=Math.min(N-1,Math.round(p*(N-1))),cut=Math.floor(R*.54),w=235*k,h=225*k;
 g.save();g.globalAlpha*=Math.min(1,(1-p)*7);
 g.drawImage(sheets.heal,n%8*C,Math.floor(n/8)*R+cut,C,R-cut,u.x-w/2,u.y+13*k-h*(R-cut)/R,w,h*(R-cut)/R);
 g.restore();
}
function portrait(g,w,h){
 const size=Math.min(w*1.08,h*1.5);
 tile(g,"flower",.48,w*.5,h*.98,size,size*R/C);
}
window.Photosynthesis={ensure,ready,error:()=>lastError,scene,flower:drawFlower,sun:drawSun,receiveSun:drawReceiveSun,transfer:drawTransfer,activateSun:drawActivationSun,activate:drawActivation,portrait};ensure();
})();