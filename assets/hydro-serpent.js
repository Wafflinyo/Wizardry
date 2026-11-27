/* Hydro Serpent: all 64 newly illustrated frames, played as one continuous
   sequence. Never splice, warp, rotate, or replace the dive with another asset. */
(()=>{
"use strict";
const W=224,H=256,CENTER=112,GROUND=240,LAUNCH=.45,HIT=.67,END=.995;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const sheet=new Image();
const ready=()=>sheet.complete&&sheet.naturalWidth===1792&&sheet.naturalHeight===2048;
let pending=null;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{sheet.onload=()=>{const ok=ready();if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();resolve(ok);};sheet.onerror=()=>resolve(false);sheet.src="./assets/hydro-serpent-v7.webp?v=0.355.2";}).finally(()=>pending=null);return pending;}
function frameAt(p){
 if(p<LAUNCH)return Math.min(26,Math.floor(27*p/LAUNCH));
 if(p<=HIT)return 27+Math.min(6,Math.floor(7*(p-LAUNCH)/(HIT-LAUNCH)));
 return 34+Math.min(29,Math.floor(30*(p-HIT)/(END-HIT)));
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const end={x:target.x,y:target.y-83*k},scale=1.55;
 // Frame 33's downward snout is near (178,225) in its original cell.
 // Translate the whole illustrated pose smoothly; do not alter its proportions.
 const strike={x:end.x-dir*66*scale,y:end.y+15*scale};
 const u=E((p-LAUNCH)/(HIT-LAUNCH)),follow=E((p-HIT)/.065);
 const splashGround={x:end.x,y:end.y+30*scale};
 const drawX=p<=HIT?L(x,strike.x,u):L(strike.x,splashGround.x,follow);
 const drawY=p<=HIT?L(y,strike.y,u)-Math.sin(Math.PI*u)*22:L(strike.y,splashGround.y,follow);
 const n=frameAt(p),alpha=C(p/.025)*(blocked?C((HIT+.10-p)/.10):C((END-p)/.055));
 return{x,y,dir,p,k,end,drawX,drawY,scale,n,alpha,blocked};
}
function pool(){}
function actor(){}
function impact(){}
function travel(g,s){if(!ready()||s.p>=END||s.alpha<=0)return;
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.drawX,s.drawY);g.scale(s.dir*s.scale,s.scale);
 g.drawImage(sheet,s.n%8*W,Math.floor(s.n/8)*H,W,H,-CENTER,-GROUND,W,H);g.restore();
}
function portrait(g,w,h){if(!ready())return;const n=19,scale=Math.min(w/160,h/215)*1.03;g.drawImage(sheet,n%8*W,Math.floor(n/8)*H,W,H,(w-W*scale)/2,h-GROUND*scale,W*scale,H*scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:64,bodyFrameCount:64,effectFrameCount:0};ensure();
})();
