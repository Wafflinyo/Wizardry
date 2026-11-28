/* Shatterpoint: illustrated hammer cells and separate illustrated impact
 * cells. No procedural polygon artwork. 32 playback cells per layer. */
(()=>{
"use strict";
const W=160,H=160,atlas=new Image(),C=x=>Math.max(0,Math.min(1,x)),E=x=>{x=C(x);return x*x*(3-2*x);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1280&&atlas.naturalHeight===1280;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/shatterpoint-illustrated-v29.webp?v=0.355.29";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor));
 const fall=C((p-.44)/(hit-.44)),drop=fall*fall,wind=E((p-.15)/.29),q=C((p-hit)/(1-hit));
 const frame=Math.min(31,Math.floor(C(p/hit)*32));
 return {p,hit,q,frame,dir,k,x:target.x,y:target.y,headX:target.x-dir*wind*32*(1-drop)*k,headY:target.y-(215+wind*36)*(1-drop)*k-48*k,form:E(p/.16),drop};
}
function actor(g,s){
 if(!ready()||s.p>=s.hit||s.form<=0)return;
 const k=s.k*1.45*(.74+.26*s.form);
 g.save();g.translate(s.headX,s.headY);g.scale(s.dir,1);g.globalAlpha*=s.form;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,s.frame,-W*k/2,-H*k*.65,W*k,H*k);g.restore();
}
function summon(g,s){/* Summoning is the illustrated hammer's fade-in. */}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const n=32+Math.min(31,Math.floor(s.q*32)),k=s.k*1.85;
 g.save();g.translate(s.x,s.y+9);g.scale(s.dir,1);g.globalAlpha*=1-E((s.q-.82)/.18);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,n,-W*k/2,-(H-7)*k,W*k,H*k);g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.08;tile(g,12,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.Shatterpoint={ensure,ready,scene,actor,summon,impact,portrait,frameCount:32,effectFrameCount:32,hit:.64};ensure();
})();
