/* Killer Bees: three independently authored transparent low-poly sprite atlases.
   12 swarm poses (6 x 2), 16 summoning frames and 16 sting/poison effect
   frames (8 x 2 each). No arena, wizard, target, or VFX baked into the bees. */
(()=>{
"use strict";
const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>{p=clamp(p);return p*p*(3-2*p);},mix=(a,b,p)=>a+(b-a)*p;
const atlases=[
 {name:"swarm",cols:6,w:256,h:256,img:new Image()},
 {name:"summon",cols:8,w:192,h:256,img:new Image()},
 {name:"impact",cols:8,w:192,h:256,img:new Image()}
];
const valid=a=>a.img.complete&&a.img.naturalWidth===a.cols*a.w&&a.img.naturalHeight===2*a.h;
const ready=()=>atlases.every(valid);
let pending=null,lastError="";
function load(a){
 if(valid(a))return Promise.resolve(true);
 return new Promise(resolve=>{
  const timer=setTimeout(()=>{lastError="Killer Bees "+a.name+" artwork timed out";resolve(false);},12000);
  a.img.onload=()=>{clearTimeout(timer);if(!valid(a))lastError="Unexpected Killer Bees "+a.name+" atlas size";resolve(valid(a));};
  a.img.onerror=()=>{clearTimeout(timer);lastError="Unable to load Killer Bees "+a.name+" artwork";resolve(false);};
  a.img.src="./assets/killer-bees-"+a.name+".webp?v=1";
 });
}
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 lastError="";
 pending=Promise.all(atlases.map(load)).then(results=>{
  const ok=results.every(Boolean);if(ok){lastError="";try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}}
  return ok;
 }).finally(()=>pending=null);
 return pending;
}
function tile(g,a,n,x,y,w,h,dir=1,alpha=1){
 if(!valid(a)||alpha<=0)return;
 n=Math.max(0,Math.min(a.cols*2-1,Math.floor(n)));
 g.save();g.translate(x,y);g.scale(dir,1);g.globalAlpha*=alpha;
 g.drawImage(a.img,(n%a.cols)*a.w,Math.floor(n/a.cols)*a.h,a.w,a.h,-w/2,-h/2,w,h);g.restore();
}
const frame=(p,n)=>Math.min(n-1,Math.floor(clamp(p)*n));
function scene(source,target,p,factor=1){
 p=clamp(p);const dir=target.x>=500?1:-1;
 // Account for perspective and the larger tower guardians/boss.
 const depthScale=mix(.60,.90,clamp((target.y-288)/235));
 const sizeFactor=Math.max(.67,Math.min(2.1,depthScale*factor/.75));
 const origin={x:500,y:Math.max(325,Math.min(430,(source.y+target.y)/2+10))};
 const hit={x:target.x,y:target.y-80*sizeFactor};
 const travel=ease((p-.35)/.29),scatter=ease((p-.77)/.23);
 const flightY=origin.y-103,hover=1-travel;
 const x=mix(origin.x,hit.x,travel)+scatter*dir*45;
 const y=mix(flightY,hit.y,travel)-Math.sin(travel*Math.PI)*32-48*scatter;
 const wobble=hover*Math.sin(p*37)*9;
 const gather=frame((p-.08)/.30,6);
 const rushing=6+frame((p-.38)/.39,4);
 const disperse=10+frame((p-.77)/.23,2);
 const pose=p<.38?gather:p<.77?rushing:disperse;
 const alpha=Math.min(ease((p-.06)/.08),1-ease((p-.88)/.12));
 return {p,dir,origin,hit,x:x+wobble,y,depth:mix(origin.y,target.y,travel)+.1,pose,
   size:mix(200,Math.max(200,218*sizeFactor),travel),sizeFactor,alpha};
}
function summon(g,s){
 if(s.p>=.48)return;
 const t=clamp(s.p/.48),h=210,w=h*.75;
 tile(g,atlases[1],frame(t,16),s.origin.x,s.origin.y-h*.44,w,h,1,Math.min(1,(1-t)*8));
}
function draw(g,s){
 if(s.p<.06||s.p>=1)return;
 tile(g,atlases[0],s.pose,s.x,s.y,s.size,s.size,s.dir,s.alpha);
}
function impact(g,s){
 if(s.p<.64||s.p>=1)return;
 const t=clamp((s.p-.64)/.36),h=185*s.sizeFactor;
 tile(g,atlases[2],frame(t,16),s.hit.x,s.hit.y,h*.75,h,1,1-ease((t-.8)/.2));
}
function portrait(g,w,h){
 const size=Math.min(w*.96,h*1.1);
 tile(g,atlases[0],7,w*.5,h*.51,size,size,1,1);
}
window.KillerBees={ensure,ready,error:()=>lastError,scene,summon,draw,impact,portrait};
ensure();
})();
