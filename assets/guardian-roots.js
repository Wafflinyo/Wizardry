/* Guardian Roots: revised hand-illustrated low-poly root atlas.
   64 timeline slots (32 cast, 32 retaliation), in 8x8 padded cells.
   Source poses share a stable baseline and transparent backgrounds.
   No characters, arena background, or dummy are baked into any frame. */
(()=>{
"use strict";
const C=192,N=32,clamp=p=>Math.max(0,Math.min(1,p));
const img=new Image();let pending=null,lastError="";
const ready=()=>img.complete&&img.naturalWidth===C*8&&img.naturalHeight===C*8;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 lastError="";
 pending=new Promise(resolve=>{
 const timer=setTimeout(()=>{lastError="Guardian Roots artwork timed out";resolve(false);},12000);
 img.onload=()=>{clearTimeout(timer);if(!ready())lastError="Guardian Roots atlas dimensions invalid";resolve(ready());};
 img.onerror=()=>{clearTimeout(timer);lastError="Guardian Roots artwork failed to load";resolve(false);};
 img.src="./assets/guardian-roots-atlas.webp?v=2";
 }).then(ok=>{if(ok)try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ok;}).finally(()=>pending=null);
 return pending;
}
function tile(g,n,x,y,w,h,layer){
 if(!ready())return;
 n=Math.max(0,Math.min(63,n));
 g.save();
 // Split the cast art around the wizard: upper roots behind, ground and
 // lower foreground in front. Preserve the original illustrated pixels.
 if(layer){g.beginPath();if(layer==="back")g.rect(x-w/2,y-h,w,h*.73);else g.rect(x-w/2,y-h*.27,w,h*.27);g.clip();}
 g.drawImage(img,n%8*C,Math.floor(n/8)*C,C,C,x-w/2,y-h,w,h);
 g.restore();
}
function cast(g,u,p,factor=1,layer){
 const k=Math.max(.7,Math.min(2.3,factor));
 tile(g,Math.round(clamp(p)*31),u.x,u.y+16*k,260*k,260*k,layer);
}
function strike(g,u,p,factor=1){
 const k=Math.max(.7,Math.min(2.3,factor));
 tile(g,N+Math.round(clamp(p)*31),u.x,u.y+12*k,245*k,245*k);
}
function portrait(g,w,h){const size=Math.min(w*1.06,h*1.05);tile(g,16,w*.5,h*.98,size,size);}
window.GuardianRoots={ensure,ready,error:()=>lastError,cast,strike,portrait};ensure();
})();