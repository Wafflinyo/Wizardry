/* Shatterpoint: separate, transparent illustrated hammer and ice impact atlases.
 * Floor-anchored summoning, one rise and one overhead strike. */
(()=>{
"use strict";
const W=192,H=192,body=new Image(),fx=new Image(),C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=x=>{x=C(x);return x*x*(3-2*x);};
let pending=null;
const loaded=im=>im.complete&&im.naturalWidth===1536&&im.naturalHeight===768;
const ready=()=>loaded(body)&&loaded(fx);
function load(im,path){if(loaded(im))return Promise.resolve(true);return new Promise(resolve=>{im.onload=()=>resolve(loaded(im));im.onerror=()=>resolve(false);im.src=path;});}
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=Promise.all([load(body,"./assets/shatterpoint-hammer-v32.webp?v=0.355.32"),load(fx,"./assets/shatterpoint-impact-v32.webp?v=0.355.32")]).then(v=>{const ok=v.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function tile(g,im,n,x,y,w,h){g.drawImage(im,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor)),q=C((p-hit)/(1-hit));
 const liftEnd=hit*.48,windEnd=hit*.73;
 const rise=E(p/liftEnd),wind=E((p-liftEnd)/(windEnd-liftEnd)),swing=C((p-windEnd)/(hit-windEnd)),drop=swing*swing;
 const floorX=target.x-dir*112*k,floorY=target.y+8*k;
 const highX=target.x-dir*82*k,highY=target.y-220*k;
 const headX=target.x-dir*8*k,headY=target.y-116*k;
 const x=p<liftEnd?L(floorX,highX,rise):p<windEnd?L(highX,highX-dir*22*k,wind):L(highX-dir*22*k,headX,drop);
 const y=p<liftEnd?L(floorY,highY,rise):p<windEnd?L(highY,highY-18*k,wind):L(highY-18*k,headY,drop);
 const frame=p<liftEnd?Math.min(9,Math.floor(p/liftEnd*10)):p<windEnd?10+Math.min(9,Math.floor((p-liftEnd)/(windEnd-liftEnd)*10)):20+Math.min(11,Math.floor(swing*12));
 const effectFrame=Math.min(31,Math.floor(q*32));
 return{p,hit,q,frame,effectFrame,dir,k,x,y,floorX,floorY,headX,headY,rise,liftEnd,windEnd,targetX:target.x,targetY:target.y};
}
function actor(g,s){
 if(!ready()||s.p>=s.hit)return;
 const k=s.k*1.48;
 g.save();
 // The first part of the rise is revealed from the real floor; no
 // floating slab or ice effect is attached to the moving hammer.
 if(s.p<s.liftEnd){g.beginPath();g.rect(s.floorX-420*s.k,s.floorY-800*s.k,840*s.k,800*s.k);g.clip();}
 g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=E(s.p/.07);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,body,s.frame,-96*k,-76*k,W*k,H*k);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=s.liftEnd)return;
 const u=C(s.p/s.liftEnd),n=Math.min(5,Math.floor(u*6)),k=s.k*1.12;
 g.save();g.translate(s.floorX,s.floorY);g.scale(s.dir,1);g.globalAlpha*=E(u/.22)*(1-E((u-.45)/.55));
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,fx,n,-W*k/2,-(H-4)*k,W*k,H*k);g.restore();
}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const n=s.effectFrame,k=s.k*1.85,settle=E((s.q-.20)/.80);
 g.save();g.translate(L(s.headX,s.targetX,settle),L(s.headY,s.targetY+8*s.k,settle));g.scale(s.dir,1);
 g.globalAlpha*=1-E((s.q-.82)/.18);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,fx,n,-W*k/2,-(H-4)*k,W*k,H*k);g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.1;tile(g,15,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.Shatterpoint={ensure,ready,scene,actor,summon,impact,portrait,frameCount:32,effectFrameCount:32,hit:.64};ensure();
})();
