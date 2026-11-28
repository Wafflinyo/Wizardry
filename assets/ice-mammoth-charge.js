/* Mammoth Ice Shard: 32 illustrated charge poses; independent ground trail and icy collision. */
(()=>{
"use strict";
const W=220,H=220,atlas=new Image(),C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1760&&atlas.naturalHeight===880;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/ice-mammoth-charge-32.webp?v=0.355.17";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(source,target,p,hit=.72,factor=1){
 p=C(p);const dir=source.team===0?1:-1,scale=1.48,origin={x:500-dir*120,y:510},contact={x:target.x-dir*(125+26*factor),y:target.y+6},dash=.34;
 const u=C((p-dash)/(hit-dash)),run=u*u*(2-u);
 let frame=p<.23?Math.min(7,Math.floor(p/.23*8)):p<dash?8+Math.min(3,Math.floor((p-.23)/(dash-.23)*4)):p<hit?12+Math.min(11,Math.floor(u*12)):24+Math.min(7,Math.floor((p-hit)/(1-hit)*8));
 return{x:L(origin.x,contact.x,run),y:L(origin.y,contact.y,E(u)),dir,scale,origin,contact,target:{x:target.x,y:target.y},factor,frame,p,hit,dash,alpha:1-E((p-hit-.04)/.20)};
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){if(!ready()||s.alpha<=0)return;g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,s.frame,-W*s.scale/2,-H*s.scale*.91,W*s.scale,H*s.scale);g.restore();}
function poly(g,pts,fill){g.fillStyle=fill;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function shard(g,x,y,r,a){g.save();g.translate(x,y);g.rotate(a);poly(g,[[-r,0],[-r*.2,-r*.48],[r,0],[-r*.2,r*.48]],"#58b9e8");poly(g,[[-r,0],[-r*.2,-r*.48],[r,0]],"#d8f6ff");poly(g,[[-r,0],[r,0],[-r*.2,r*.48]],"#3483bb");g.restore();}
function trail(g,s){if(s.p<s.dash||s.p>s.hit+.15)return;g.save();for(let i=0;i<28;i++){const q=((s.p-s.dash)*7+i*.173)%1,birth=Math.max(s.dash,Math.min(s.hit,s.p-q*.13)),u=C((birth-s.dash)/(s.hit-s.dash)),x=L(s.origin.x,s.contact.x,u*u*(2-u))-s.dir*(20+q*78)+Math.sin(i*2.4)*17,y=L(s.origin.y,s.contact.y,E(u))-q*38;g.globalAlpha=(1-q)*C((s.hit+.15-s.p)/.15)*.72;shard(g,x,y,4+i%5*2,i*2.4+q*3);}g.restore();}
function impact(g,s){const q=(s.p-s.hit)/.28;if(q<0||q>=1)return;const k=Math.max(.8,s.factor);g.save();g.translate(s.target.x,s.target.y-48*k);g.globalAlpha=(1-q)*.88;for(let i=0;i<26;i++){const a=i*2.399,r=(12+q*(70+i%6*15))*k;shard(g,Math.cos(a)*r,Math.sin(a)*r*.7,(9+i%5*3)*k*(1-q*.6),a);}if(q<.20){g.globalAlpha=(1-q/.20)*.8;poly(g,Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,r=(i%2?17:85)*k;return[Math.cos(a)*r,Math.sin(a)*r];}),"#d5faff");}g.restore();}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.1;tile(g,4,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,trail,impact,portrait,frameCount:32,hit:.72};ensure();
})();
