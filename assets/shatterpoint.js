/* Shatterpoint: authored 32-cell transparent animation. The rise and swing
 * are already illustrated in the cells. Anchor in front of the enemy,
 * converge on head height at contact, then let the illustrated debris settle. */
(()=>{
"use strict";
const W=240,H=160,atlas=new Image(),C=x=>Math.max(0,Math.min(1,x)),E=x=>{x=C(x);return x*x*(3-2*x);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1920&&atlas.naturalHeight===640;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/shatterpoint-v30.webp?v=0.355.30";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor)),q=C((p-hit)/(1-hit));
 const windup=hit*.68;
 const frame=p<windup?Math.min(7,Math.floor(p/windup*8)):p<hit?8+Math.min(6,Math.floor((p-windup)/(hit-windup)*7)):15+Math.min(16,Math.floor(q*17));
 // Mirror the forward offset for both teams. Keep the existing authored
 // swing; only shift its anchor toward the head during the strike.
 const approach=E((p-windup)/(hit-windup));
 const frontOffset=88*(1-approach)+28*approach;
 const headLift=102*k;
 const settle=E((q-.24)/.76);
 const anchorX=p<hit?target.x-dir*frontOffset*k:target.x-dir*28*k*(1-settle);
 const anchorY=target.y+12*k-headLift*(1-settle);
 return{p,hit,q,frame,dir,k,x:target.x,y:target.y,anchorX,anchorY};
}
function paint(g,s,alpha){
 const k=s.k*1.65;
 g.save();g.translate(s.anchorX,s.anchorY);g.scale(s.dir,1);g.globalAlpha*=alpha;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,s.frame,-W*k/2,-H*k*.93,W*k,H*k);g.restore();
}
function summon(g,s){if(ready()&&s.p<s.hit&&s.frame<3)paint(g,s,1);}
function actor(g,s){if(ready()&&s.p<s.hit&&s.frame>=3)paint(g,s,1);}
function impact(g,s){if(ready()&&s.p>=s.hit&&s.p<1)paint(g,s,1-E((s.q-.86)/.14));}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.08;tile(g,6,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.Shatterpoint={ensure,ready,scene,actor,summon,impact,portrait,frameCount:32,hit:.64};ensure();
})();
