/* Hydro Cannon — separate, original 32-frame dry turtle, 24-frame
 * jet atlas and independent splash atlas. True arena-center summon. */
(()=>{
"use strict";
const CW=222,CH=222,FW=256,FH=256,HIT=.70,FIRE=.58;
const turtle=new Image(),jets=new Image(),water=new Image();
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,t)=>a+(b-a)*t;
const good=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>good(turtle,1776,888)&&good(jets,1024,1536)&&good(water,1536,1024);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 const load=(im,w,h,path)=>good(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(good(im,w,h));im.onerror=()=>resolve(false);im.src=path;
 });
 pending=Promise.all([
  load(turtle,1776,888,"./assets/hydro-turtle-clean.webp?v=0.354.81"),
  load(jets,1024,1536,"./assets/hydro-jets.webp?v=0.354.81"),
  load(water,1536,1024,"./assets/hydro-water.webp?v=0.354.80")
 ]).then(r=>{const ok=r.every(Boolean);lastError=ok?"":"Hydro Cannon artwork failed to load";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);
 return pending;
}
const bases=[185,185,185,185,185,185,185,185,183,182,182,182,182,182,182,182,184,184,184,184,184,184,184,184,184,184,184,184,184,185,185,184];
// Per-pose pixel coordinates of the two actual barrel openings, not a
// single approximate point. Order: large near barrel, small far barrel.
const muzzles=[
 [130,55,158,63],[130,55,158,64],[131,54,158,63],[131,54,159,62],
 [130,54,159,63],[130,55,159,64],[130,55,159,64],[130,57,160,66],
 [130,58,158,66],[130,59,158,67],[130,61,158,69],[130,59,158,67],
 [129,55,157,64],[124,44,151,52],[120,35,148,43],[119,35,147,44],
 [114,35,142,43],[116,39,144,46],[119,42,147,50],[128,53,155,61],
 [131,61,159,68],[131,62,159,70],[130,63,159,71],[130,63,159,71],
 [130,62,158,70],[130,62,158,70],[130,62,158,70],[130,61,158,69],
 [130,61,158,69],[130,60,158,68],[130,60,158,68],[130,60,158,68]
];
function poseAt(p){
 p=C(p);let frame,alpha=1;
 if(p<.20){frame=Math.min(7,Math.floor(p/.20*8));alpha=C(p/.12);}
 else if(p<FIRE)frame=8+Math.min(4,Math.floor((p-.20)/(FIRE-.20)*5));
 else if(p<.74)frame=13+Math.min(6,Math.floor((p-FIRE)/(.74-FIRE)*7));
 else if(p<.87)frame=20+Math.min(3,Math.floor((p-.74)/.13*4));
 else{frame=24+Math.min(7,Math.floor((p-.87)/.13*8));alpha=C((1-p)/.08);}
 const beam=p<FIRE||p>.81?-1:Math.min(11,Math.floor((p-FIRE)/(.81-FIRE)*12));
 const impact=p<HIT?-1:15+Math.min(8,Math.floor((p-HIT)/(1-HIT)*9));
 return {frame,alpha,beam,impact};
}
function scene(source,target,p,factor=1){
 const dir=target.x===500?(source.team===1?-1:1):target.x>500?1:-1,x=500,y=510,k=1.18,pose=poseAt(p);
 const targetK=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 const m=muzzles[pose.frame],base=bases[pose.frame];
 const point=(px,py)=>({x:x+dir*(px-CW/2)*k,y:y+(py-base)*k});
 const near=point(m[0],m[1]),far=point(m[2],m[3]);
 const mx=(near.x+far.x)/2,my=(near.y+far.y)/2,contactY=target.y-83*targetK;
 const merge={x:L(mx,target.x,.34),y:L(my,contactY,.34)};
 return {x,y,k,dir,p:C(p),pose,near,far,merge,mx,my,tx:target.x,ty:target.y,contactY,targetK};
}
function tile(g,im,n,cols,w,h,dx,dy,dw,dh){g.drawImage(im,n%cols*w,Math.floor(n/cols)*h,w,h,dx,dy,dw,dh);}
function actor(g,s){
 if(!ready()||s.pose.alpha<=0)return;
 const n=s.pose.frame;
 g.save();g.globalAlpha*=s.pose.alpha;g.translate(s.x,s.y);g.scale(s.dir*s.k,s.k);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,turtle,n,8,CW,CH,-CW/2,-bases[n],CW,CH);g.restore();
}
function summon(g,s){
 if(!ready()||s.p>=.20)return;
 const q=C(s.p/.20),n=23-Math.min(3,Math.floor(q*4));
 g.save();g.globalAlpha*=Math.sin(Math.PI*q)*.85;
 tile(g,water,n,6,FW,FH,s.x-135,s.y-216,270,250);g.restore();
}
// Only raster water from the separate jet sheet is drawn here. Each
// stream begins at its own barrel and the two meet before the target.
function stream(g,from,to,n,lower,wide,alpha,progress=1){
 if(progress<=0||alpha<=0)return;
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)*progress;
 if(len<.5)return;
 const sx=(n%4)*256,sy=Math.floor(n/4)*256;
 const crop=wide?[0,78,256,142]:lower?[0,156,256,72]:[0,78,256,76];
 const height=wide?42:23;
 g.save();g.globalAlpha*=alpha;g.translate(from.x,from.y);g.rotate(Math.atan2(dy,dx));
 // No full-cell padding stretching: draw only the water region.
 g.drawImage(jets,sx+crop[0],sy+crop[1],crop[2],crop[3],0,-height/2,len,height);g.restore();
}
function beam(g,s){
 if(!ready())return;
 const p=s.p;
 // Small separate water charge, using the same atlas instead of baked-in
 // light or water on the turtle. Charge remains exactly at both nozzles.
 if(p>=.36&&p<FIRE){
  const q=C((p-.36)/(FIRE-.36)),n=Math.min(2,Math.floor(q*3));
  const size=9+13*q;
  for(const m of [s.far,s.near]){
   g.save();g.globalAlpha*=.45+.4*q;
   g.drawImage(jets,n*256,86,65,53,m.x-size*.24,m.y-size/2,size,size);g.restore();
  }
  return;
 }
 if(s.pose.beam<0)return;
 const q=C((p-FIRE)/(HIT-FIRE)),fade=p>.78?C((.81-p)/.03):1;
 const lead=C(q/.34),tail=C((q-.34)/.66);
 const j=Math.min(3,Math.floor((p-FIRE)/.025)%4);
 stream(g,s.far,s.merge,j,true,false,fade,lead);
 stream(g,s.near,s.merge,j,false,false,fade,lead);
 const n=7+Math.min(4,Math.floor((p-FIRE)/.026)%5);
 stream(g,s.merge,{x:s.tx,y:s.contactY},n,false,true,fade,tail);
}
function impact(g,s){
 const n=s.pose.impact;if(!ready()||n<0)return;
 const w=190*s.targetK,h=190*s.targetK;
 const q=C((n-15)/4),y=L(s.contactY+36*s.targetK,s.ty,q);
 g.save();g.globalAlpha*=s.p>.96?C((1-s.p)/.04):1;
 tile(g,water,n,6,FW,FH,s.tx-w/2,y-h*.86,w,h);g.restore();
}
function portrait(g,w,h){
 if(!ready())return;const k=Math.min(w/205,h/170)*.95;
 g.save();g.translate(w/2,h*.95);g.scale(k,k);
 tile(g,turtle,12,8,CW,CH,-CW/2,-bases[12],CW,CH);g.restore();
}
window.HydroCannon={frameCount:32,effectFrameCount:24,hit:HIT,ensure,ready,error:()=>lastError,poseAt,scene,actor,summon,beam,impact,portrait};
ensure();
})();