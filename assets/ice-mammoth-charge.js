/* Mammoth Ice Shard: 32 illustrated charge poses; layered foot-height blizzard and amplified icy collision. */
(()=>{
"use strict";
const W=220,H=220,GROUND_DROP=22,atlas=new Image(),C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>{p=C(p);return p*p*(3-2*p);};
let pending=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1760&&atlas.naturalHeight===880;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/ice-mammoth-charge-32.webp?v=0.355.17";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(source,target,p,hit=.72,factor=1){
 p=C(p);const dir=source.team===0?1:-1,scale=1.48,origin={x:500-dir*120,y:510+GROUND_DROP},contact={x:target.x-dir*(125+26*factor),y:target.y+6+GROUND_DROP},dash=.34;
 const u=C((p-dash)/(hit-dash)),run=u*u*(2-u);
 let frame=p<.23?Math.min(7,Math.floor(p/.23*8)):p<dash?8+Math.min(3,Math.floor((p-.23)/(dash-.23)*4)):p<hit?12+Math.min(11,Math.floor(u*12)):24+Math.min(7,Math.floor((p-hit)/(1-hit)*8));
 return{x:L(origin.x,contact.x,run),y:L(origin.y,contact.y,E(u)),dir,scale,origin,contact,target:{x:target.x,y:target.y},factor,frame,p,hit,dash,alpha:1-E((p-hit-.04)/.20)};
}
function tile(g,n,x,y,w,h){g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function draw(g,s){if(!ready()||s.alpha<=0)return;g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,s.frame,-W*s.scale/2,-H*s.scale*.91,W*s.scale,H*s.scale);g.restore();}
function poly(g,pts,fill){g.fillStyle=fill;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function shard(g,x,y,r,a){g.save();g.translate(x,y);g.rotate(a);poly(g,[[-r,0],[-r*.2,-r*.48],[r,0],[-r*.2,r*.48]],"#58b9e8");poly(g,[[-r,0],[-r*.2,-r*.48],[r,0]],"#d8f6ff");poly(g,[[-r,0],[r,0],[-r*.2,r*.48]],"#3483bb");g.restore();}
function footAt(s,p){
 const u=C((p-s.dash)/(s.hit-s.dash));return{x:L(s.origin.x,s.contact.x,u*u*(2-u)),y:L(s.origin.y,s.contact.y,E(u))};
}
function snow(g,x,y,rx,ry,alpha){
 g.save();g.translate(x,y);g.scale(rx,ry);g.globalAlpha=alpha;
 const glow=g.createRadialGradient(0,0,0,0,0,1);
 glow.addColorStop(0,"rgba(222,248,255,.99)");glow.addColorStop(.43,"rgba(169,222,247,.87)");glow.addColorStop(.72,"rgba(105,179,222,.48)");glow.addColorStop(1,"rgba(121,199,235,0)");
 g.fillStyle=glow;g.beginPath();g.ellipse(0,0,1,1,0,0,Math.PI*2);g.fill();g.restore();
}
function trail(g,s,front=false){
 if(s.p<.015||s.p>s.hit+.25)return;
 const fade=C((s.hit+.25-s.p)/.16),rise=E((s.p-.015)/.085),moving=E((s.p-s.dash)/.06),k=s.scale/1.48;
 g.save();
 // Floor-hugging rear frost stays in world space; foreground mist
 // overlaps the lower legs instead of being hidden by the body.
 if(front){
  for(let i=0;i<13;i++){
   const phase=(s.p*15+i*.237)%1;
   const off=(i-6)*22*k;
   snow(g,s.x+off-s.dir*phase*18*k,s.y-38*k-phase*22*k,66*k,59*k+phase*15*k,fade*rise*(.88+.10*moving));
   snow(g,s.x+off,s.y-5*k,55*k,25*k,fade*rise*.93);
  }
 }
 const count=front?42:46;
 for(let i=0;i<count;i++){
  const q=(s.p*(9+(i%4)*1.1)+i*.173)%1;
  const birth=Math.max(.035,Math.min(s.hit,s.p-q*.18));
  const o=footAt(s,birth),drift=(12+q*(moving?130:45))*k;
  const x=o.x-s.dir*drift+Math.sin(i*2.399)*78*k;
  const y=o.y-8*k-q*(front?95:84)*k+Math.cos(i*2.399)*11*k;
  const r=(29+i%6*6)*k*(.75+q*.65);
  snow(g,x,y,r*1.48,r*.61,fade*rise*(1-q)* (front?.81:.76));
 }
 // Ice chips and sharp crystalline snow spray are drawn independently
 // of the soft mist so the low-poly texture remains legible.
 for(let i=0;i<(front?48:44);i++){
  const q=(s.p*13+i*.173)%1;
  const o=footAt(s,Math.max(.035,Math.min(s.hit,s.p-q*.15)));
  const x=o.x-s.dir*(12+q*(90+moving*62))*k+Math.sin(i*2.399)*90*k;
  const y=o.y-5*k-4*q*(1-q)*(37+i%6*11)*k;
  g.globalAlpha=fade*rise*(1-q)*.92;
  shard(g,x,y,(5+i%6*2.5)*k*(1-q*.45),i*2.399+q*4);
 }
 g.restore();
}
function impact(g,s){
 const q=(s.p-s.hit)/.28;if(q<0||q>=1)return;
 const k=Math.max(.8,s.factor),fade=1-E((q-.28)/.72);
 g.save();g.translate(s.target.x,s.target.y-52*k);
 for(let i=0;i<10;i++){
  const a=i*2.399,r=(20+q*95)*k;
  snow(g,Math.cos(a)*r,Math.sin(a)*r*.60, (48+q*38)*k,(34+q*28)*k,fade*.68);
 }
 for(let i=0;i<54;i++){
  const a=i*2.399,r=(14+q*(100+i%7*18))*k;
  g.globalAlpha=fade*.94;
  shard(g,Math.cos(a)*r,Math.sin(a)*r*.78,(11+i%6*3.5)*k*(1-q*.6),a+q*1.5);
 }
 for(let j=0;j<2;j++){
  const u=(q-j*.10)/.85;if(u<0||u>=1)continue;
  g.globalAlpha=(1-u)*.78;g.strokeStyle=j?"#92d9fa":"#e2faff";g.lineWidth=(4+5*(1-u))*k;
  g.beginPath();g.ellipse(0,48*k,(24+u*145)*k,(8+u*37)*k,0,0,Math.PI*2);g.stroke();
 }
 if(q<.24){
  g.globalAlpha=(1-q/.24)*.93;
  poly(g,Array.from({length:20},(_,i)=>{const a=i*Math.PI/10,r=(i%2?22:125)*k;return[Math.cos(a)*r,Math.sin(a)*r];}),"#d5faff");
 }
 g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.1;tile(g,4,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,trail,impact,portrait,frameCount:32,hit:.72};ensure();
})();
