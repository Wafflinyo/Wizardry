/* Shatterpoint — independent low-poly warhammer pose and fracture layers.
   Thirty-two indexed poses, rendered as clean vector facets at native resolution. */
(()=>{
"use strict";
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t);},TAU=Math.PI*2;
const noise=i=>{const r=Math.sin(i*127.1+43.7)*43758.5453;return r-Math.floor(r);};
function poly(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function hammer(g){
 // Long crystal-bound shaft, bevelled rectangular striking faces,
 // opaque blue core and asymmetric sharp crown. No baked effect.
 poly(g,[[-12,-183],[10,-183],[13,1],[-10,1]],"#3a789c");
 poly(g,[[-12,-183],[-4,-177],[-3,1],[-10,1]],"#b2e4f6");
 poly(g,[[-4,-177],[10,-183],[13,1],[-3,1]],"#6db0d1");
 for(let i=0;i<6;i++){const y=-151+i*21;poly(g,[[-12,y],[-3,y+5],[12,y-3],[12,y+4],[-3,y+12],[-12,y+7]],"#225b80");}
 poly(g,[[-14,-191],[1,-207],[15,-190],[10,-177],[-10,-177]],"#95cee9");
 poly(g,[[-93,-43],[-76,-65],[63,-65],[94,-38],[90,19],[68,40],[-77,40],[-97,20]],"#508bb0");
 poly(g,[[-93,-43],[-76,-65],[63,-65],[94,-38],[58,-19],[-63,-20]],"#d1effb");
 poly(g,[[-93,-43],[-63,-20],[-63,23],[-77,40],[-97,20]],"#9cd6f0");
 poly(g,[[-63,-20],[58,-19],[65,25],[-63,23]],"#65afd4");
 poly(g,[[58,-19],[94,-38],[90,19],[68,40],[65,25]],"#2e6d98");
 poly(g,[[-77,40],[-63,23],[65,25],[68,40]],"#34779f");
 poly(g,[[-63,-20],[-26,-27],[-13,4],[-63,23]],"#96d2ec");
 poly(g,[[-26,-27],[24,-32],[51,-2],[-13,4]],"#b8e4f4");
 poly(g,[[-13,4],[51,-2],[65,25],[-63,23]],"#4794bf");
 poly(g,[[-63,-20],[-55,-39],[-26,-27]],"#ecfaff");
 poly(g,[[24,-32],[63,-65],[94,-38],[58,-19]],"#94cce7");
 poly(g,[[-98,-39],[-112,-24],[-109,23],[-88,35],[-77,40],[-97,20]],"#c8eafa");
 poly(g,[[94,-38],[109,-28],[111,14],[90,30],[68,40],[90,19]],"#83c2e1");
 poly(g,[[-12,-61],[0,-81],[13,-61],[0,-43]],"#e1f6ff");
 poly(g,[[0,-81],[13,-61],[0,-43]],"#5aabd4");
}
function scene(source,target,p,hit=.64,factor=1){
 p=C(p);const dir=source.team===0?1:-1,k=Math.max(.85,Math.min(2,factor)),frame=Math.min(31,Math.floor(p*32));
 const f=frame/31,wind=E((f-.22)/.22),fall=C((p-.44)/(hit-.44));
 const drop=fall*fall,form=E(f/.25),q=C((p-hit)/(1-hit));
 return {p,hit,q,frame,dir,k,x:target.x,y:target.y,headX:target.x-dir*(36*wind)*(1-drop)*k,headY:target.y-(290+38*wind)*(1-drop)*k-30*k,angle:dir*(-.82*wind)*(1-drop),form,drop};
}
function actor(g,s){
 if(s.p>=s.hit)return;
 g.save();g.translate(s.headX,s.headY);g.scale(s.dir*s.k*1.05,s.k*1.05);g.rotate(s.angle*s.dir);g.globalAlpha*=s.form;g.scale(.22+.78*s.form,.22+.78*s.form);hammer(g);g.restore();
}
function shard(g,x,y,size,a,alpha,seed){
 g.save();g.translate(x,y);g.rotate(a);g.globalAlpha*=alpha;
 const r=size,v=[[-r*.8,r*.28],[-r*.31,-r*.82],[r*.45,-r*.52],[r*.92,r*.15],[r*.12,r*.67]];
 poly(g,v,"#4f98c1");poly(g,[v[0],v[1],v[2],[0,0]],"#d2effb");poly(g,[[0,0],v[2],v[3],v[4]],"#3679a6");poly(g,[v[0],[0,0],v[4]],"#8acbe7");g.restore();
}
function summon(g,s){
 if(s.p>=.44)return;const strength=E(s.p/.12)*(1-E((s.p-.25)/.19));
 for(let i=0;i<26;i++){
  const a=i*2.399+s.p*6,r=(36+noise(i)*95)*(1-s.form*.65)*s.k;
  shard(g,s.headX+Math.cos(a)*r,s.headY-45*s.k+Math.sin(a)*r*.8,(3+noise(i+50)*9)*s.k,a,strength*.85,i);
 }
}
function impact(g,s){
 if(s.p<s.hit||s.p>=1)return;const q=s.q,k=s.k,fade=1-E((q-.20)/.80),floor=s.y;
 g.save();
 // The hammer itself fragments from the striking face; pieces travel
 // independently in ballistic arcs and settle at the victim's feet.
 for(let i=0;i<44;i++){
  const a=i*2.399,r=q*(55+noise(i+90)*175)*k,x=s.x+Math.cos(a)*r+s.dir*q*20*k;
  const y=floor-32*k+Math.sin(a)*r*.27-4*q*(1-q)*(32+noise(i+120)*130)*k;
  shard(g,x,y,(6+noise(i+170)*17)*k*(1-q*.45),a+q*(3+noise(i+200)*5),fade,i);
 }
 for(let i=0;i<65;i++){
  const a=i*2.399,r=q*(30+noise(i+500)*170)*k,x=s.x+Math.cos(a)*r,y=floor-18*k+Math.sin(a)*r*.30-4*q*(1-q)*(18+noise(i+600)*70)*k;
  const z=(1.4+noise(i+700)*3.3)*k;g.globalAlpha=fade*.74;poly(g,[[x-z,y],[x,y-z*1.4],[x+z,y],[x,y+z]],"#d9f4ff");
 }
 if(q<.20){const r=(24+q*280)*k;g.globalAlpha=(1-q/.20)*.8;poly(g,Array.from({length:18},(_,i)=>{const a=i*TAU/18,d=i%2?r*.28:r;return[s.x+Math.cos(a)*d,floor-30*k+Math.sin(a)*d*.65];}),"#e4f8ff");}
 g.globalAlpha=fade*.8;g.strokeStyle="#a6dbed";g.lineWidth=3*k*(1-q)+.5;
 g.beginPath();g.ellipse(s.x,floor+3*k,(18+q*144)*k,(6+q*35)*k,0,0,TAU);g.stroke();
 g.restore();
}
function portrait(g,w,h){g.save();const k=Math.min(w/260,h/275);g.translate(w*.5,h*.77);g.scale(k,k);g.rotate(-.35);hammer(g);g.restore();}
window.Shatterpoint={ensure:()=>Promise.resolve(true),ready:()=>true,scene,actor,summon,impact,portrait,frameCount:32,hit:.64};
})();
