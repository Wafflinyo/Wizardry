/* Undertow: original 32-frame transparent low-poly water hands. */
(()=>{
"use strict";
const W=208,H=240,C=p=>Math.max(0,Math.min(1,p)),image=new Image();
let pending=null;
const ready=()=>image.complete&&image.naturalWidth===1664&&image.naturalHeight===960;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{image.onload=()=>resolve(ready());image.onerror=()=>resolve(false);image.src="./assets/undertow-32.webp?v=0.355.10";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(target,p,factor=1){p=C(p);const n=Math.min(31,Math.floor(p*32));return{x:target.x,y:target.y+30,p,n,k:Math.max(.75,Math.min(2.5,factor))*1.18,alpha:Math.min(1,p/.025,(1-p)/.07)};}
function tile(g,n,x,y,w,h){g.drawImage(image,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){if(!ready()||s.alpha<=0)return;g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,s.n,s.x-W*s.k/2,s.y-228*s.k*.84,W*s.k,H*s.k*.84);g.restore();}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/180);tile(g,17,(w-W*k)/2,h-226*k*.84,W*k,H*k*.84);}
window.Undertow={ensure,ready,scene,draw,portrait,hit:.625,frameCount:32};ensure();
})();
