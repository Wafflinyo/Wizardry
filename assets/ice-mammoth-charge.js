/* Mammoth Ice Shard: new 32-frame illustrated charge and collision sequence. */
(()=>{
"use strict";
const W=264,H=176,GROUND_DROP=22,atlas=new Image(),C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===2112&&atlas.naturalHeight===704;
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/ice-mammoth-charge-v22.webp?v=0.355.22";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function scene(source,target,p,hit=.72,factor=1){
 p=C(p);const dir=source.team===0?1:-1,scale=1.38,origin={x:500-dir*120,y:510+GROUND_DROP},contact={x:target.x-dir*(125+26*factor),y:target.y+6+GROUND_DROP},dash=.28;
 const u=C((p-dash)/(hit-dash)),run=u*u*(2-u);
 const frame=p<dash?Math.min(7,Math.floor(p/dash*8)):p<hit?8+Math.min(11,Math.floor(u*12)):20+Math.min(11,Math.floor((p-hit)/(1-hit)*12));
 return{x:L(origin.x,contact.x,run),y:L(origin.y,contact.y,E(u)),dir,scale,origin,contact,target:{x:target.x,y:target.y},factor,frame,p,hit,dash};
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){
 if(!ready()||s.p>=s.hit)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,s.frame,-W*s.scale/2,-H*s.scale*.95,W*s.scale,H*s.scale);g.restore();
}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const q=C((s.p-s.hit)/(1-s.hit)),k=s.scale*Math.max(.85,Math.min(2,s.factor));
 g.save();g.translate(s.target.x,s.target.y+12);g.scale(s.dir,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.globalAlpha*=1-E((q-.85)/.15);
 tile(g,s.frame,-W*k/2,-H*k*.94,W*k,H*k);g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.08;tile(g,4,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,impact,portrait,frameCount:32,hit:.72};ensure();
})();
