/* Tidal Exchange: 32 illustrated transparent manta ray frames. */
(()=>{
"use strict";
const W=200,H=240,C=p=>Math.max(0,Math.min(1,p)),image=new Image();
let pending=null;
const ready=()=>image.complete&&image.naturalWidth===1600&&image.naturalHeight===960;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{image.onload=()=>resolve(ready());image.onerror=()=>resolve(false);image.src="./assets/tidal-exchange-32.webp?v=0.355.13";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(target,p,factor=1){p=C(p);return{x:target.x,y:target.y+8,p,n:Math.min(31,Math.floor(p*32)),k:Math.max(.85,Math.min(2.5,factor))*1.45,alpha:Math.min(1,p/.025,(1-p)/.06)};}
function tile(g,n,x,y,w,h){g.drawImage(image,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){if(!ready()||s.alpha<=0)return;g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,s.n,s.x-W*s.k/2,s.y-222*s.k,W*s.k,H*s.k);g.restore();}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/210);tile(g,19,(w-W*k)/2,h-224*k,W*k,H*k);}
window.TidalExchange={ensure,ready,scene,draw,portrait,hit:.72,frameCount:32};ensure();
})();
