/* Killer Bees v2. Authored faceted bee geometry rasterized into 96 separate
   direction/wing poses; 32 independent summon and 32 sting VFX frames.
   No luminous white matte, baked target, or full-swarm billboard. */
(()=>{
"use strict";
const TAU=Math.PI*2,clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,p)=>a+(b-a)*p;
const DIRS=12,FLAPS=8,N=32,BEE_COUNT=25,beeFrames=[],summonFrames=[],impactFrames=[];
let initialized=false,lastError="";
function canvas(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
const V=(x,y,z)=>[x,y,z];
function dot(a,b){return a.reduce((sum,x,i)=>sum+x*b[i],0);}
function sub(a,b){return a.map((v,i)=>v-b[i]);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){const n=Math.hypot(...a)||1;return a.map(x=>x/n);}
function shade(c,s){return "rgb("+c.map(x=>Math.round(clamp(x*s/255)*255)).join(",")+")";}
const GOLD=[225,159,33],YELLOW=[248,189,45],DARK=[52,36,25],HEAD=[232,167,37],EYE=[28,27,24],WING=[169,185,172];
function model(phase){
 const faces=[];
 function face(v,c,alpha=1){faces.push({v,c,alpha});}
 // Ring-based, faceted geometry along the longitudinal axis. Segment
 // colors are actual alternating abdominal bands, not painted gradients.
 function shell(rings,colors,cy=0,cz=0,sides=8){
  const rv=rings.map(([x,ry,rz])=>Array.from({length:sides},(_,i)=>{const a=TAU*i/sides;return V(x,cy+ry*Math.cos(a),cz+rz*Math.sin(a));}));
  for(let j=0;j<rv.length-1;j++)for(let k=0;k<sides;k++){
   const q=(k+1)%sides,c=Array.isArray(colors[0])?colors[j]:colors;
   face([rv[j][k],rv[j][q],rv[j+1][q]],c);
   face([rv[j][k],rv[j+1][q],rv[j+1][k]],c);
  }
 }
 shell([[-24,.05,.05],[-19,4,4],[-15,8,8],[-10,10,10],[-5,10,10],[0,8,8],[3,4,4]], [DARK,GOLD,DARK,YELLOW,DARK,GOLD]);
 shell([[-4,.05,.05],[-2,6,7],[3,9,9],[8,7,7],[11,.05,.05]], [DARK,GOLD,GOLD,DARK]);
 shell([[6,.05,.05],[9,6,7],[13,8,8],[18,7,7],[22,3,4],[23,.05,.05]],HEAD);
 shell([[-30,0,0],[-24,2.4,2.4],[-21,0,0]],DARK);
 for(const side of [-1,1]){
  shell([[11,0,0],[13,3.7,4.5],[18,3.5,4.1],[20,0,0]],EYE,side*6.2,2,6);
  // Angular antennae and six tiny legs are separate pieces of the silhouette.
  const a=V(19,side*4,5),b=V(24,side*7,11),c=V(28,side*9,10);
  face([a,b,V(24,side*7.8,10)],DARK);face([b,c,V(27,side*9.4,9)],DARK);
  for(let k=0;k<3;k++){
   const x=-1+k*4;
   face([V(x,side*5,-5),V(x-3,side*13,-13),V(x-1,side*8,-7)],DARK);
  }
  const f=Math.sin(phase*TAU),lift=.27+f*.66;
  function wing(x,span,chord,back){
   const root=V(x,side*4,6),tip=V(x+back,side*(4+span*Math.cos(lift)),6+span*Math.sin(lift));
   const mid=V(x+chord,side*(4+span*.53*Math.cos(lift)),6+span*.53*Math.sin(lift)+1.4);
   const rear=V(x-chord*.75,side*(4+span*.66*Math.cos(lift)),6+span*.66*Math.sin(lift)-1);
   face([root,mid,tip],WING,.86);face([root,tip,rear],[127,153,145],.82);
  }
  wing(5,25,9,-10);wing(0,19,6,-15);
 }
 return faces;
}
function makeBee(dir,flap){
 const c=canvas(100,100),g=c.getContext("2d"),yaw=dir*TAU/DIRS;
 const co=Math.cos(yaw),si=Math.sin(yaw);
 function world(v){return [v[0]*co-v[1]*si,v[0]*si+v[1]*co,v[2]];}
 function project(v){return [50+v[0]*1.4,50+(v[1]*.43-v[2]*.90)*1.4,v[1]*.90+v[2]*.43];}
 const polys=model(flap/FLAPS).map(f=>{
  const v=f.v.map(world),p=v.map(project),n=norm(cross(sub(v[1],v[0]),sub(v[2],v[0])));
  return {p,z:p.reduce((s,a)=>s+a[2],0)/p.length,c:shade(f.c,.76+.28*Math.abs(dot(n,[-.35,-.48,.8]))),alpha:f.alpha};
 }).sort((a,b)=>a.z-b.z);
 for(const f of polys){g.globalAlpha=f.alpha;g.fillStyle=f.c;g.beginPath();g.moveTo(f.p[0][0],f.p[0][1]);for(let i=1;i<f.p.length;i++)g.lineTo(f.p[i][0],f.p[i][1]);g.closePath();g.fill();}
 return c;
}
function poly(g,points,color){g.fillStyle=color;g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.closePath();g.fill();}
function leaf(g,x,y,angle,size){
 g.save();g.translate(x,y);g.rotate(angle);poly(g,[[0,0],[size*.48,-size*.32],[size,0],[size*.45,size*.32]],"#648d35");poly(g,[[0,0],[size*.48,-size*.32],[size,0]],"#a4bf58");g.restore();
}
function makeSummon(n){
 const c=canvas(192,192),g=c.getContext("2d"),t=n/(N-1),alpha=Math.sin(Math.PI*t);
 // Just a few low-poly leaves/pollen from the floor; no halo, glow,
 // white pixels, mist, or bright background.
 g.globalAlpha=alpha*.8;
 for(let i=0;i<13;i++){
  const a=i*2.399+t*6,r=20+((i*17)%42)+t*15;
  const x=96+Math.cos(a)*r,y=150+Math.sin(a)*r*.38-t*(28+i%4*9);
  leaf(g,x,y,a+t*4,6+i%4*2);
 }
 return c;
}
function makeImpact(n){
 const c=canvas(192,192),g=c.getContext("2d"),t=n/(N-1),env=Math.sin(Math.PI*t);
 // Fast angular golden sting streaks and distinct green poison flecks.
 // Nothing is blurred or white; the center stays clear of a big flash.
 for(let i=0;i<9;i++){
  const a=i*TAU/9+t*1.6,rad=17+t*48+(i%3)*5;
  const x=96+Math.cos(a)*rad,y=96+Math.sin(a)*rad*.74;
  const len=16+10*env+(i%3)*3;
  g.save();g.translate(x,y);g.rotate(a+.35);g.globalAlpha=env;
  poly(g,[[-len*.5,-2],[len*.5,0],[-len*.22,3],[-len*.65,1]],"#e9a92d");
  poly(g,[[-len*.4,-1],[len*.48,0],[-len*.12,1]],"#f3d25a");g.restore();
 }
 for(let i=0;i<8;i++){
  const a=i*2.4+t*3,r=29+t*52;
  const x=96+Math.cos(a)*r,y=96+Math.sin(a)*r*.72,k=2+i%3;
  g.globalAlpha=env*.75;poly(g,[[x-k,y],[x,y-k],[x+k,y],[x,y+k]],i%2?"#88a63d":"#5b7c2b");
 }
 return c;
}
function ensure(){
 if(initialized)return Promise.resolve(true);
 try{
  for(let d=0;d<DIRS;d++)for(let f=0;f<FLAPS;f++)beeFrames.push(makeBee(d,f));
  for(let n=0;n<N;n++){summonFrames.push(makeSummon(n));impactFrames.push(makeImpact(n));}
  initialized=true;lastError="";
  Promise.resolve().then(()=>{try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}});
 }catch(e){lastError=String(e);beeFrames.length=summonFrames.length=impactFrames.length=0;}
 return Promise.resolve(initialized);
}
function position(s,i,p){
 const a0=i*2.399963,phase=i*.618,spread=.55+((i*19)%21)/32;
 const gather=ease((p-.02)/.19),travel=ease((p-.24)/.28),leave=ease((p-.88)/.12);
 const a=a0+p*TAU*3.5;
 const b=a0+(p-.50)*TAU*(8.5+(i%4)*.63);
 const sr=(34+spread*46)*gather;
 const startX=s.origin.x+Math.cos(a)*sr+Math.sin(p*63+phase)*7;
 const startY=s.origin.y-86+Math.sin(a)*sr*.64+Math.cos(p*47+phase)*13;
 const rx=(50+spread*47)*s.sizeFactor,ry=(34+spread*28)*s.sizeFactor;
 const ox=s.hit.x+Math.cos(b)*rx+Math.sin(p*92+phase)*9*s.sizeFactor;
 const oy=s.hit.y+Math.sin(b)*ry+Math.sin(p*64+phase)*13*s.sizeFactor;
 const escapeAngle=a0+phase*.3;
 const x=mix(startX,ox,travel)+Math.cos(escapeAngle)*leave*125*s.sizeFactor;
 const y=mix(startY,oy,travel)+Math.sin(escapeAngle)*leave*72*s.sizeFactor-leave*42;
 return {x,y,back:Math.sin(b)<0,travel};
}
function scene(source,target,p,factor=1){
 p=clamp(p);
 const depthScale=mix(.60,.90,clamp((target.y-288)/235)),sizeFactor=Math.max(.67,Math.min(2.1,depthScale*factor/.75));
 const origin={x:500,y:Math.max(325,Math.min(430,(source.y+target.y)/2+10))};
 const hit={x:target.x,y:target.y-80*sizeFactor};
 const s={p,origin,hit,sizeFactor,depth:mix(origin.y,target.y,ease((p-.24)/.28)),bees:[]};
 for(let i=0;i<BEE_COUNT;i++){
  const pos=position(s,i,p),prev=position(s,i,p-.002);
  const angle=Math.atan2((pos.y-prev.y)/.62,pos.x-prev.x);
  const dir=(Math.round(angle/TAU*DIRS)+DIRS)%DIRS;
  const flap=(Math.floor(p*4.4*34)+i*3)%FLAPS;
  const fade=ease((p-.025-i*.0025)/.08)*(1-ease((p-.89-i*.001)/.10));
  const size=(46+(i*13)%19)*mix(1,Math.max(.8,Math.min(1.45,sizeFactor)),pos.travel);
  s.bees.push({...pos,dir,flap,size,alpha:fade,back:p>.50&&pos.back});
 }
 return s;
}
function sprite(g,c,x,y,w,h,alpha=1){
 if(!c||alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.drawImage(c,x-w/2,y-h/2,w,h);g.restore();
}
function summon(g,s){
 if(s.p>=.36)return;
 const n=Math.min(N-1,Math.floor(s.p/.36*N));
 sprite(g,summonFrames[n],s.origin.x,s.origin.y-68,190,190);
}
function draw(g,s,layer="front"){
 if(!initialized)return;
 for(const b of s.bees.filter(b=>layer==="back"?b.back:!b.back).sort((a,b)=>a.y-b.y)){
  sprite(g,beeFrames[b.dir*FLAPS+b.flap],b.x,b.y,b.size,b.size,b.alpha);
 }
}
function impact(g,s){
 if(s.p<.57||s.p>.96)return;
 // Multiple overlapping sting cycles as the bees zip around the enemy.
 for(let i=0;i<3;i++){
  const start=.57+i*.095,t=(s.p-start)/.18;
  if(t<0||t>=1)continue;
  const n=Math.min(N-1,Math.floor(t*N)),a=i*2.4+s.p*TAU*4;
  const x=s.hit.x+Math.cos(a)*24*s.sizeFactor,y=s.hit.y+Math.sin(a)*30*s.sizeFactor;
  const size=150*s.sizeFactor;
  sprite(g,impactFrames[n],x,y,size,size,1);
 }
}
function portrait(g,w,h){
 if(!initialized)return;
 for(let i=0;i<13;i++){
  const a=i*2.4,r=(.12+(i%5)*.045)*Math.min(w,h);
  const size=Math.min(w,h)*(.28+(i%4)*.035);
  sprite(g,beeFrames[((i+1)%DIRS)*FLAPS+(i%FLAPS)],w*.5+Math.cos(a)*r,h*.50+Math.sin(a)*r,size,size);
 }
}
window.KillerBees={ensure,ready:()=>initialized,error:()=>lastError,scene,summon,draw,impact,portrait};
ensure();
})();
