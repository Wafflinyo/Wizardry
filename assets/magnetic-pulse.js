/* Magnetic Pulse: 24 transparent authored low-poly spell frames. */
(()=>{
"use strict";
const C=256,R=256,atlas=new Image(),clamp=n=>Math.max(0,Math.min(1,n));
let pending=null,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===1536&&atlas.naturalHeight===1024;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=new Promise(resolve=>{
   const timer=setTimeout(()=>{lastError="Magnetic Pulse artwork timed out";resolve(false);},12000);
   atlas.onload=()=>{clearTimeout(timer);lastError=ready()?"":"Unexpected Magnetic Pulse atlas dimensions";resolve(ready());if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
   atlas.onerror=()=>{clearTimeout(timer);lastError="Unable to load Magnetic Pulse artwork";resolve(false);};
   atlas.src="./assets/magnetic-pulse-frames.webp?v=1";
 }).finally(()=>pending=null);
 return pending;
}
function tile(g,n,x,y,w,h){
 if(ready())g.drawImage(atlas,n%6*C,Math.floor(n/6)*R,C,R,x,y,w,h);
}
function scene(source,target,p){
 const dir=target.x>=500?1:-1;
 const size=280;
 // Ring materializes immediately in front of the enemy. The authored
 // rightward pulse is mirrored for the opposite team. The rune-shatter
 // in frame 16 is aligned with the enemy's torso.
 const hit={x:target.x,y:target.y-100};
 return {x:hit.x-dir*size*.255,y:hit.y,dir,size,p,frame:Math.min(23,Math.floor(clamp(p)*24))};
}
function draw(g,s){
 if(!ready())return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);
 g.globalAlpha*=Math.min(1,s.p/.065,(1-s.p)/.065);
 tile(g,s.frame,-s.size/2,-s.size/2,s.size,s.size);g.restore();
}
function portrait(g,w,h){
 const size=Math.min(w*.96,h*.99);
 tile(g,11,(w-size)/2,(h-size)/2,size,size);
}
window.MagneticPulse={ensure,ready,error:()=>lastError,scene,draw,portrait};ensure();
})();
