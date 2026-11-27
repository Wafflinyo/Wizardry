/* Hydro Serpent v5: 63 raster frames built from the original illustrated art.
   The dive and follow-through are baked in one pool-to-target coordinate space.
   The body never translates as a compact projectile: the tail emerges last,
   follows the same path, and is consumed at the contact point. */
(()=>{
"use strict";
const W=512,H=320,COLS=7,ROOT={x:110,y:260},CONTACT={x:420,y:170};
const LAUNCH=.47,HIT=.67,END=.99;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const sheet=new Image();
const ready=()=>sheet.complete&&sheet.naturalWidth===3584&&sheet.naturalHeight===2880;
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{sheet.onload=()=>{const ok=ready();if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();resolve(ok);};sheet.onerror=()=>resolve(false);sheet.src="./assets/hydro-serpent-v5.webp?v=0.354.99";}).finally(()=>pending=null);return pending;}
function frameAt(p){
 if(p<LAUNCH)return Math.min(20,Math.floor(21*p/LAUNCH));
 if(p<=HIT)return 21+Math.min(17,Math.floor(18*(p-LAUNCH)/(HIT-LAUNCH)));
 return 39+Math.min(23,Math.floor(24*(p-HIT)/(END-HIT)));
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1;
 const k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const end={x:target.x,y:target.y-83*k};
 const dx=Math.abs(end.x-x),dy=end.y-y;
 // Affine mapping fixes both the whirlpool origin and the actual impact location.
 // The artwork has substantial padding so every frame uses the same canvas.
 const sx=dx/(CONTACT.x-ROOT.x),sy=Math.max(1.08,Math.min(1.55,Math.abs(dy)/180));
 const shear=(dy-(CONTACT.y-ROOT.y)*sy)/(CONTACT.x-ROOT.x);
 const project=(u,v)=>({x:x+dir*sx*(u-ROOT.x),y:y+shear*(u-ROOT.x)+sy*(v-ROOT.y)});
 const n=frameAt(p),start=project(204,130),q=C((p-LAUNCH)/(HIT-LAUNCH));
 const head=p>=HIT?{...end}:p>=LAUNCH?{x:L(start.x,end.x,q),y:L(start.y,end.y,q)-Math.sin(Math.PI*q)*12}:start;
 const alpha=C(p/.018)*(blocked?C((HIT+.18-p)/.18):C((END-p)/.025));
 return{x,y,dir,p,k,end,start,head,n,sx,sy,shear,alpha,blocked};
}
function pool(){}
function actor(){}
function impact(){}
function travel(g,s){
 if(!ready()||s.p>=END||s.alpha<=0||s.sx<=0)return;
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.x,s.y);g.transform(s.dir*s.sx,s.shear,0,s.sy,0,0);
 g.drawImage(sheet,s.n%COLS*W,Math.floor(s.n/COLS)*H,W,H,-ROOT.x,-ROOT.y,W,H);
 g.restore();
}
function portrait(g,w,h){if(!ready())return;const n=13,scale=Math.min(w/198,h/198)*1.04;g.drawImage(sheet,n%COLS*W+11,Math.floor(n/COLS)*H+80,198,198,(w-198*scale)/2,h-198*scale,198*scale,198*scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:63,bodyFrameCount:63,effectFrameCount:0};ensure();
})();
