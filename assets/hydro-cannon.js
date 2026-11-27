/* Hydro Cannon — original generated 32 turtle and 24 water raster frames.
 * Independent water atlas, stationary summon, grounded impact. */
(()=>{
"use strict";
const CW=222,CH=222,FW=256,FH=256,HIT=.70,FIRE=.58;
const turtle=new Image(),water=new Image();
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,t)=>a+(b-a)*t;
const good=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>good(turtle,1776,888)&&good(water,1536,1024);
let pending=null,lastError="";
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 const load=(im,w,h,path)=>good(im,w,h)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(good(im,w,h));im.onerror=()=>resolve(false);im.src=path;
 });
 pending=Promise.all([
  load(turtle,1776,888,"./assets/hydro-turtle.webp?v=0.354.80"),
  load(water,1536,1024,"./assets/hydro-water.webp?v=0.354.80")
 ]).then(r=>{const ok=r.every(Boolean);lastError=ok?"":"Hydro Cannon artwork failed to load";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);
 return pending;
}
function poseAt(p){
 p=C(p);
 let frame,alpha=1;
 if(p<.22)frame=Math.min(7,Math.floor(p/.22*8));
 else if(p<FIRE)frame=8+Math.min(11,Math.floor((p-.22)/(FIRE-.22)*12));
 else if(p<.77)frame=20+Math.min(7,Math.floor((p-FIRE)/(.77-FIRE)*8));
 else if(p<.88)frame=28+Math.min(3,Math.floor((p-.77)/.11*4));
 else{frame=Math.max(0,7-Math.floor((p-.88)/.12*8));alpha=C((1-p)/.045);}
 const beam=p<FIRE||p>.80?-1:p<HIT?Math.min(11,Math.floor((p-FIRE)/(HIT-FIRE)*12)):10+Math.min(3,Math.floor((p-HIT)/.10*4));
 const impact=p<HIT?-1:15+Math.min(8,Math.floor((p-HIT)/(1-HIT)*9));
 return {frame,alpha,beam,impact};
}
function scene(source,target,p,factor=1){
 const dir=target.x>=500?1:-1,x=500-dir*96,y=493,k=1.18;
 const targetK=(.60+.30*C((target.y-288)/235))*Math.max(1,factor);
 // The image's cannons are high above its shell and face right.
 return {x,y,k,dir,p:C(p),pose:poseAt(p),mx:x+dir*46*k,my:y-139*k,tx:target.x,ty:target.y,contactY:target.y-83*targetK,targetK};
}
function tile(g,im,n,cols,w,h,dx,dy,dw,dh){g.drawImage(im,n%cols*w,Math.floor(n/cols)*h,w,h,dx,dy,dw,dh);}
function actor(g,s){
 if(!ready()||s.pose.alpha<=0)return;
 const n=s.pose.frame,base=[211,208,212,218][Math.floor(n/8)];
 g.save();g.globalAlpha*=s.pose.alpha;g.translate(s.x,s.y);g.scale(s.dir*s.k,s.k);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 tile(g,turtle,n,8,CW,CH,-CW/2,-base,CW,CH);g.restore();
}
function beam(g,s){
 const n=s.pose.beam;if(!ready()||n<0)return;
 const dx=s.tx-s.mx,dy=s.contactY-s.my,len=Math.hypot(dx,dy),q=C((s.p-FIRE)/(HIT-FIRE));
 // Align the raster stream's longitudinal axis to the actual target,
 // extend from muzzle to target, never rotate the turtle or fake its poses.
 const length=Math.max(8,len*q),height=86*Math.max(.85,s.targetK*.65);
 g.save();g.translate(s.mx,s.my);g.rotate(Math.atan2(dy,dx));
 g.globalAlpha*=s.p>.77?C((.80-s.p)/.03):1;
 tile(g,water,n,6,FW,FH,0,-height*1.32,length,height*2.64);g.restore();
}
function impact(g,s){
 const n=s.pose.impact;if(!ready()||n<0)return;
 const w=205*s.targetK,h=205*s.targetK;
 // The burst begins at the contact point and settles to the foot anchor.
 const q=C((n-15)/4),y=L(s.contactY+40*s.targetK,s.ty,q);
 g.save();g.globalAlpha*=s.p>.96?C((1-s.p)/.04):1;
 tile(g,water,n,6,FW,FH,s.tx-w/2,y-h*.86,w,h);g.restore();
}
function portrait(g,w,h){
 if(!ready())return;const k=Math.min(w/222,h/222)*.96;
 g.save();g.translate(w/2,h*.97);g.scale(k,k);
 tile(g,turtle,15,8,CW,CH,-CW/2,-208,CW,CH);g.restore();
}
window.HydroCannon={frameCount:32,effectFrameCount:24,hit:HIT,ensure,ready,error:()=>lastError,poseAt,scene,actor,beam,impact,portrait};
ensure();
})();