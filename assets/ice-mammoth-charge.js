/* Mammoth Ice Shard: 32 illustrated charge poses; grounded faceted snow wake and crystalline collision. */
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
// The ice wake uses faceted snow volumes, not a stack of luminous fog circles.
// All emitted particles use the charge's historical floor positions.
const TAU=Math.PI*2;
function noise(i){const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function driftSnow(g,x,y,rx,ry,seed,alpha){
 const pts=[[-.98,.17],[-.87,-.23],[-.48,-.52],[-.23,-.88],[.20,-.73],[.53,-.45],[.90,-.20],[1,.13],[.51,.43],[-.42,.46]].map(([a,b],i)=>[x+a*rx,y+b*ry*(.82+noise(seed+i)*.30)]);
 const hub=[x-rx*.13,y-ry*.10];
 g.globalAlpha=alpha;
 poly(g,pts,"#80b6d0");
 poly(g,[pts[0],pts[1],pts[2],pts[3],hub,pts[8],pts[9]],"#c4e4ed");
 poly(g,[pts[3],pts[4],pts[5],hub], "#e7f5f7");
 poly(g,[hub,pts[5],pts[6],pts[7],pts[8]],"#a1cbdc");
 poly(g,[pts[2],pts[3],hub], "#f3fcff");
}
function iceSpike(g,x,y,height,width,lean,alpha){
 const baseL=[x-width,y],baseR=[x+width,y],peak=[x+lean,y-height],ridge=[x+width*.19,y-height*.32];
 g.globalAlpha=alpha;
 poly(g,[baseL,peak,ridge,baseR],"#589bbd");
 poly(g,[baseL,peak,ridge],"#c9f0fa");
 poly(g,[peak,baseR,ridge],"#78c6e4");
 poly(g,[baseL,ridge,baseR,[x+width*.16,y+width*.28]],"#3e799b");
}
function trail(g,s,front=false){
 if(s.p<.015||s.p>s.hit+.25)return;
 const fade=C((s.hit+.25-s.p)/.16),rise=E((s.p-.015)/.085),moving=E((s.p-s.dash)/.06),k=s.scale/1.48,opacity=fade*rise;
 g.save();
 // Contact shadow and frozen scuff are flat on the floor, not in the air.
 if(!front){
  g.globalAlpha=opacity*.25;g.fillStyle="#193e57";
  g.beginPath();g.ellipse(s.x,s.y+13*k,139*k,24*k,0,0,TAU);g.fill();
  for(let i=0;i<7;i++){
   const age=i*.023,o=footAt(s,Math.max(.015,Math.min(s.hit,s.p-age)));
   const w=(114-i*8)*k,y=o.y+13*k;
   g.globalAlpha=opacity*(1-i/8)*.52;
   poly(g,[[o.x-s.dir*w,y],[o.x-s.dir*w*.42,y-13*k],[o.x+s.dir*w*.9,y-5*k],[o.x+s.dir*w*.67,y+11*k],[o.x-s.dir*w*.73,y+19*k]],"#86c3d9");
  }
 }
 // Separate rolling snow puffs expand behind each footfall. Larger
 // clumps stay near the ground; smaller fragments rise and drift back.
 const count=front?15:22;
 for(let i=0;i<count;i++){
  const q=(s.p*(5.2+noise(i)*2)+noise(i+80))%1;
  const o=footAt(s,Math.max(.015,Math.min(s.hit,s.p-q*.21)));
  const x=o.x+((noise(i+30)-.5)*224-s.dir*q*(38+110*moving))*k;
  const y=o.y+(front?12:-12)*k-q*(front?18:38)*k;
  const r=(23+noise(i+70)*24)*(1+q*.46)*k;
  driftSnow(g,x,y,r*1.38,r*.67,i,opacity*(1-q)* (front?.85:.56));
 }
 if(front){
  // One continuous jagged crest covers the entire foot span. Shape
  // ripples along the ground rather than billowing over the creature.
  const N=16,left=s.x-156*k,step=312*k/N,ground=s.y+26*k;
  const top=Array.from({length:N+1},(_,i)=>{
   const edge=Math.sin(Math.PI*i/N),wave=Math.sin(i*1.37-s.p*36)*.5+.5;
   return[left+i*step,ground-(12+edge*(66+wave*17))*k];
  });
  const bottom=top.map(([x],i)=>[x,ground+Math.sin(i*1.29+s.p*18)*4*k]);
  g.globalAlpha=opacity*.94;poly(g,[...top,...bottom.slice().reverse()],"#a4cbd9");
  for(let i=0;i<N;i++){
   const a=top[i],b=top[i+1],c=bottom[i],d=bottom[i+1];
   const mid=[(a[0]+b[0])/2,(a[1]+b[1])*.5+14*k];
   g.globalAlpha=opacity*.91;
   poly(g,[a,b,mid,c],i%3===0?"#f2fbfc":i%3===1?"#dceef2":"#c3e2ec");
   poly(g,[mid,b,d,c],i%2?"#9bc7d9":"#b3d5e2");
  }
  // Small overlapping clumps break up the edge and retain hoof coverage.
  for(let i=0;i<8;i++){
   const q=(s.p*7.8+i*.137)%1;
   const x=s.x+(i-3.5)*36*k-s.dir*q*15*k;
   driftSnow(g,x,s.y-24*k-q*12*k,(28+q*13)*k,(23+q*10)*k,44+i,opacity*(.90-q*.25));
  }
 }
 // Directional ice spray, emitted from the ground rather than the belly.
 for(let i=0;i<(front?34:42);i++){
  const q=(s.p*(8+noise(i+140)*4)+noise(i+181))%1;
  const o=footAt(s,Math.max(.015,Math.min(s.hit,s.p-q*.17)));
  const x=o.x+((noise(i+200)-.5)*240-s.dir*q*(46+110*moving))*k;
  const y=o.y+10*k-4*q*(1-q)*(25+noise(i+250)*75)*k;
  g.globalAlpha=opacity*(1-q)*.94;
  shard(g,x,y,(3+noise(i+290)*10)*k*(1-q*.38),-s.dir*(.35+noise(i+320)*1.6)+q*2.2);
 }
 if(moving>0.05&&!front){
  for(let i=0;i<9;i++){
   const q=(s.p*9+i*.137)%1,o=footAt(s,Math.max(s.dash,s.p-q*.12));
   const x=o.x-s.dir*(35+q*105)*k,y=o.y-(14+i%4*13)*k,len=(30+q*65)*k;
   g.globalAlpha=opacity*moving*(1-q)*.60;
   poly(g,[[x-s.dir*len,y+3*k],[x,y-4*k],[x+s.dir*19*k,y]],"#b5e4f1");
  }
 }
 g.restore();
}
function impact(g,s){
 const q=(s.p-s.hit)/.28;if(q<0||q>=1)return;
 const k=Math.max(.8,s.factor),fade=1-E((q-.27)/.73),floor=s.target.y+8*k;
 g.save();
 // A brief spreading ground fracture and a staggered ice crown mark
 // actual collision; shards then arc outward and fall back to the floor.
 const spread=E(q/.32);
 for(let i=0;i<12;i++){
  const a=i*TAU/12+.12,r=(15+spread*108)*k;
  const x=s.target.x+Math.cos(a)*r,y=floor+Math.sin(a)*r*.25;
  g.globalAlpha=fade*.84;
  poly(g,[[s.target.x,floor],[x-5*k,y],[x,y+2*k],[x+5*k,y]],"#bdeaf5");
  const life=C((q-i%3*.035)/.14),height=(28+noise(i+410)*78)*k*E(life)*(1-E((q-.47)/.53));
  if(height>1)iceSpike(g,x,y,height,(9+noise(i+450)*12)*k,Math.cos(a)*height*.45,fade*.93);
 }
 for(let i=0;i<17;i++){
  const a=i*2.399,r=(16+q*(85+noise(i+480)*52))*k;
  driftSnow(g,s.target.x+Math.cos(a)*r,floor+Math.sin(a)*r*.21-4*q*(1-q)*25*k,(27+q*24)*k,(14+q*12)*k,70+i,fade*(1-q)*.78);
 }
 for(let i=0;i<38;i++){
  const a=i*2.399,r=(14+q*(95+noise(i+540)*100))*k;
  const x=s.target.x+Math.cos(a)*r,y=floor+Math.sin(a)*r*.30-4*q*(1-q)*(45+noise(i+580)*130)*k-35*k*(1-q);
  g.globalAlpha=fade*.95;
  shard(g,x,y,(6+noise(i+620)*13)*k*(1-q*.52),a+q*2);
 }
 if(q<.16){
  const alpha=(1-q/.16)*.90;
  g.globalAlpha=alpha;
  const points=Array.from({length:14},(_,i)=>{const a=i*TAU/14,r=(i%2?16:76)*k*(.8+q*3);return[s.target.x+Math.cos(a)*r,floor-55*k+Math.sin(a)*r*.84];});
  poly(g,points,"#e2faff");
 }
 g.restore();
}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/H)*1.1;tile(g,4,(w-W*k)/2,(h-H*k)/2,W*k,H*k);}
window.IceMammoth={ensure,ready,scene,draw,trail,impact,portrait,frameCount:32,hit:.72};ensure();
})();
