/* Tidal Exchange v0.355.14: illustrated 32-frame manta behind target, foreground water swirl. */
(()=>{
"use strict";
const W=200,H=240,C=p=>Math.max(0,Math.min(1,p)),image=new Image();
let pending=null;
const ready=()=>image.complete&&image.naturalWidth===1600&&image.naturalHeight===960;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{image.onload=()=>resolve(ready());image.onerror=()=>resolve(false);image.src="./assets/tidal-exchange-32.webp?v=0.355.14";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(target,p,factor=1){p=C(p);return{x:target.x,y:target.y+8,p,n:Math.min(31,Math.floor(p*32)),k:Math.max(.75,Math.min(2.4,factor))*1.14,alpha:Math.min(1,p/.03,(1-p)/.08)};}
function drawFrame(g,n,sx,sy,sw,sh,dx,dy,dw,dh){g.drawImage(image,n%8*W+sx,Math.floor(n/8)*H+sy,sw,sh,dx,dy,dw,dh);}
function back(g,s){if(!ready()||s.alpha<=0)return;
 const dw=W*s.k,dh=H*s.k*.92,dx=s.x-dw/2,dy=s.y-dh*.86;
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 drawFrame(g,s.n,0,0,W,150,dx,dy,dw,dh*150/H);g.restore();}
function front(g,s){if(!ready()||s.alpha<=0)return;
 const dw=W*s.k,dh=H*s.k*.92,dx=s.x-dw/2,dy=s.y-dh*.86;
 g.save();g.globalAlpha*=Math.min(1,s.alpha*1.08);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 drawFrame(g,s.n,0,118,W,122,dx,dy+dh*118/H,dw,dh*122/H);g.restore();}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/185);drawFrame(g,18,0,0,W,H,(w-W*k)/2,h-214*k,W*k,H*k);}
window.TidalExchange={ensure,ready,scene,back,front,portrait,hit:.72,frameCount:32};ensure();
})();
