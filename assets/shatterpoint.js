/* Shatterpoint: isolated illustrated hammer + centered ice effects.
 * Every effect cell has transparent padding on all sides; render around its center.
 * The hammer rises from the floor, winds up, then swings once onto the head. */
(()=>{
"use strict";
const W=224,H=224,body=new Image(),fx=new Image(),C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=x=>{x=C(x);return x*x*(3-2*x);};
let pending=null,bodyPending=null;
const redraw=()=>window.WIZARDRY_ARENA_TEST?.drawCardArts?.();
const loaded=(im,rows)=>im.complete&&im.naturalWidth===1792&&im.naturalHeight===rows*H;
const ready=()=>loaded(body,4)&&loaded(fx,4);
function load(im,path,rows){if(loaded(im,rows))return Promise.resolve(true);return new Promise(resolve=>{im.onload=()=>resolve(loaded(im,rows));im.onerror=()=>resolve(false);im.src=path;});}
function ensureBody(){if(loaded(body,4))return Promise.resolve(true);if(bodyPending)return bodyPending;
 bodyPending=load(body,"./assets/shatterpoint-hammer-v33.webp?v=0.355.35",4).then(ok=>{if(ok)redraw();return ok;}).finally(()=>bodyPending=null);return bodyPending;
}
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=Promise.all([ensureBody(),load(fx,"./assets/shatterpoint-centered-fx-v34.webp?v=0.355.34",4)]).then(v=>v.every(Boolean)).finally(()=>pending=null);return pending;
}
function tile(g,im,n,x,y,w,h){g.drawImage(im,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor)),q=C((p-hit)/(1-hit));
 const liftEnd=hit*.52,windEnd=hit*.79;
 const rise=E(p/liftEnd),wind=E((p-liftEnd)/(windEnd-liftEnd)),swing=C((p-windEnd)/(hit-windEnd)),drop=swing*swing;
 const floorX=target.x-dir*112*k,floorY=target.y+8*k;
 const highX=target.x-dir*32*k,highY=target.y-245*k;
 const windX=highX-dir*45*k,windY=highY-20*k;
 const headX=target.x,headY=target.y-118*k;
 const x=p<liftEnd?L(floorX,highX,rise):p<windEnd?L(highX,windX,wind):L(windX,headX,drop);
 // Head pivot sits above the handle. Keep the handle at floor level
 // at summon, and the lower striking face at head height on contact.
 const y=p<liftEnd?L(floorY-136*k,highY,rise):p<windEnd?L(highY,windY,wind):L(windY,headY-34*k,drop);
 const frame=p<liftEnd?Math.min(13,Math.floor(p/liftEnd*14)):p<windEnd?14+Math.min(9,Math.floor((p-liftEnd)/(windEnd-liftEnd)*10)):24+Math.min(7,Math.floor(swing*8));
 return{p,hit,q,frame,effectFrame:8+Math.min(23,Math.floor(q*24)),dir,k,x,y,floorX,floorY,headX,headY,rise,liftEnd,windEnd,targetX:target.x,targetY:target.y};
}
function actor(g,s){
 if(!ready()||s.p>=s.hit)return;
 const k=s.k*1.60;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=E(s.p/.075);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,body,s.frame,-112*k,-112*k,W*k,H*k);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=s.liftEnd)return;
 const u=C(s.p/s.liftEnd),n=Math.min(7,Math.floor(u*8)),k=s.k*1.26;
 g.save();g.translate(s.floorX,s.floorY-34*s.k);g.scale(s.dir,1);g.globalAlpha*=E(u/.13)*(1-E((u-.55)/.45));
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,fx,n,-W*k/2,-H*k/2,W*k,H*k);g.restore();
}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const n=s.effectFrame,k=s.k*1.68,settle=E((s.q-.20)/.80);
 g.save();g.translate(s.headX,L(s.headY,s.targetY-40*s.k,settle));g.scale(s.dir,1);
 g.globalAlpha*=1-E((s.q-.76)/.24);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,fx,n,-W*k/2,-H*k/2,W*k,H*k);g.restore();
}
function portrait(g,w,h){
 // The card needs only the illustrated hammer, not the battle FX atlas.
 // Repaint when the hammer loads, even if the effects are still loading.
 if(!loaded(body,4)){if(!bodyPending)ensureBody();return;}
 const k=Math.min(w/W,h/H)*.96;
 tile(g,18,(w-W*k)/2,(h-H*k)/2,W*k,H*k);
}
window.Shatterpoint={ensure,ready,scene,actor,summon,impact,portrait,frameCount:32,effectFrameCount:32,hit:.64};ensure();
})();
