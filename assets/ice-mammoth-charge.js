/* Mammoth Ice Shard: independent illustrated 32-frame body and 32-frame FX atlases. */
(()=>{
"use strict";
const W=220,H=220,GROUND_DROP=22,body=new Image(),fx=new Image(),C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
// Measured opaque foot baseline for each authored body cell. Correct the
// large vertical jumps in the source gallop while retaining slight weight shifts.
const FEET=[196,196,196,196,196,196,197,196,194,193,193,182,175,167,160,160,163,164,176,178,183,181,183,182,184,187,192,194,196,196,196,197];
const FX_FEET=[197,197,198,198,198,198,198,198,196,196,196,196,196,196,196,196,198,198,198,198,198,198,198,198,198,198,198,198,198,198,197,196];
let pending=null;
const loaded=im=>im.complete&&im.naturalWidth===1760&&im.naturalHeight===880;
const ready=()=>loaded(body)&&loaded(fx);
function load(im,path){if(loaded(im))return Promise.resolve(true);return new Promise(resolve=>{im.onload=()=>resolve(loaded(im));im.onerror=()=>resolve(false);im.src=path;});}
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=Promise.all([load(body,"./assets/ice-mammoth-body-v23.webp?v=0.355.23"),load(fx,"./assets/ice-mammoth-fx-v23.webp?v=0.355.23")]).then(v=>{const ok=v.every(Boolean);if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;
}
function scene(source,target,p,hit=.72,factor=1){
 p=C(p);const dir=source.team===0?1:-1,scale=1.48,origin={x:500-dir*120,y:510+GROUND_DROP},contact={x:target.x-dir*(125+26*factor),y:target.y+6+GROUND_DROP},dash=.28;
 const u=C((p-dash)/(hit-dash)),run=u*u*(2-u),q=C((p-hit)/(1-hit));
 const frame=p<dash?Math.min(7,Math.floor(p/dash*8)):p<hit?8+Math.min(19,Math.floor(u*20)):28+Math.min(3,Math.floor(q*12));
 return{x:L(origin.x,contact.x,run),y:L(origin.y,contact.y,E(u)),dir,scale,origin,contact,target:{x:target.x,y:target.y},factor,frame,p,hit,dash,u,q,alpha:E(p/.12)*(1-E(q/.40))};
}
function tile(g,img,n,x,y,w,h){g.drawImage(img,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){
 if(!ready()||s.alpha<=0)return;
 const k=s.scale,bob=s.p>=s.dash&&s.p<s.hit?Math.max(0,196-FEET[s.frame])*.14*k:0;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,body,s.frame,-W*k/2,-FEET[s.frame]*k-bob,W*k,H*k);g.restore();
}
function trail(g,s,front=false){
 if(!ready()||s.p<.025||s.q>.5)return;
 const k=s.scale,alpha=E((s.p-.025)/.15)*(1-E(s.q/.5));
 const n=s.p<s.dash?Math.min(5,Math.floor(s.p/s.dash*6)):s.p<s.hit?6+Math.min(9,Math.floor(s.u*10)):12+Math.min(3,Math.floor(s.q*8));
 // Sprite artwork points right; reverse it relative to the moving mammoth
 // so the illustrated shards and snow kick backward. Both layers share
 // the measured ground baseline and keep the head and tusks uncovered.
 const sx=k*(front?1.10:1.25),sy=k*(front?.55:.63);
 g.save();g.translate(s.x-s.dir*(front?8:45),s.y+(front?10:-5));g.scale(-s.dir,1);g.globalAlpha*=alpha*(front?.96:.76);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,fx,n,-W*sx/2,-FX_FEET[n]*sy,W*sx,H*sy);g.restore();
}
function impact(g,s){
 if(!ready()||s.p<s.hit||s.p>=1)return;
 const n=16+Math.min(15,Math.floor(s.q*16)),k=s.scale*Math.max(.85,Math.min(2,s.factor))*1.12;
 g.save();g.translate(s.target.x,s.target.y+12);g.scale(s.dir,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.globalAlpha*=1-E((s.q-.85)/.15);
 tile(g,fx,n,-W*k/2,-FX_FEET[n]*k,W*k,H*k);g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.08;tile(g,body,0,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,trail,impact,portrait,frameCount:32,effectFrameCount:32,hit:.72};ensure();
})();
