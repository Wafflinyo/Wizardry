/* Frostbound Colossus: 32 authored low-poly body poses and a separate
   32-cell FX atlas (8 shockwave, 8 spikes, 8 debris, 8 freeze). */
(()=>{
"use strict";
const CELL=224,COUNT=32,SLAM=.62,body=new Image(),fx=new Image();
const C=t=>Math.max(0,Math.min(1,t)),E=t=>{t=C(t);return t*t*(3-2*t);};
const ok=im=>im.complete&&im.naturalWidth===1792&&im.naturalHeight===896;
let bodyPending=null,fxPending=null,error="",listeners=[];
function load(im,path){
 if(ok(im))return Promise.resolve(true);
 return new Promise(resolve=>{
   let timer;
   const done=v=>{clearTimeout(timer);im.onload=im.onerror=null;resolve(v);};
   timer=setTimeout(()=>done(false),12000);
   im.onload=()=>done(ok(im));im.onerror=()=>done(false);im.src=path;
 });
}
function ensureBody(){
 if(ok(body))return Promise.resolve(true);
 if(!bodyPending)bodyPending=load(body,"./assets/frostbound-colossus-body.webp?v=1").then(v=>{
   if(v)for(const fn of listeners)try{fn();}catch(_){}
   return v;
 }).finally(()=>bodyPending=null);
 return bodyPending;
}
function ensureFX(){
 if(ok(fx))return Promise.resolve(true);
 if(!fxPending)fxPending=load(fx,"./assets/frostbound-colossus-effects.webp?v=1").finally(()=>fxPending=null);
 return fxPending;
}
function ensure(){return Promise.all([ensureBody(),ensureFX()]).then(([b,f])=>{error=b&&f?"":"Frostbound Colossus sprite artwork failed to load";return b&&f;});}
function onReady(fn){if(typeof fn==="function")listeners.push(fn);ensureBody().then(v=>{if(v&&ok(body)&&listeners.length===1){/* loading callback handles redraw */}});}
function tile(g,im,index,x,y,w,h=w){
 if(ok(im))g.drawImage(im,index%8*CELL,Math.floor(index/8)*CELL,CELL,CELL,x,y,w,h);
}
function frame(p){return Math.min(31,Math.floor(p<.64?p/.64*24:24+C((p-.64)/.28)*8));}
function scene(source,targets,p){return {x:500,y:510,dir:source.team===0?1:-1,p:C(p),frame:frame(C(p)),targets:targets||[]};}
function actor(g,s){
 if(!ok(body))return;
 const w=310,alpha=E(s.p/.075)*(1-E((s.p-.91)/.09));
 if(alpha<=0)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=alpha;
 tile(g,body,s.frame,-w/2,-w*.94,w);g.restore();
}
function fxAt(g,row,q,x,y,w,anchor=.65,alpha=1,ratio=1){
 if(q<0||q>=1||!ok(fx))return;
 const i=Math.min(7,Math.floor(q*8));g.save();g.globalAlpha*=alpha;
 tile(g,fx,row*8+i,x-w/2,y-w*ratio*anchor,w,w*ratio);g.restore();
}
function summon(g,s){fxAt(g,0,s.p/.24,s.x,s.y,185,.65,.8,.75);}
function shockwave(g,s){fxAt(g,0,(s.p-SLAM)/.20,s.x,s.y,310,.65,1,.70);}
function travel(g,s,t){
 const q=(s.p-SLAM)/(t.hitAt-SLAM);
 if(q<0||q>=1)return;
 const x=s.x+(t.x-s.x)*q,y=s.y+(t.y-s.y)*q;
 fxAt(g,0,q,x,y,170,.65,1,.65);
}
function impact(g,s,t,k=1){
 const q=(s.p-t.hitAt+.055)/.205;
 fxAt(g,1,q,t.x,t.y,208*k,.83,1);
 fxAt(g,2,(s.p-t.hitAt)/.19,t.x,t.y,190*k,.77,.95);
 if(t.frozen)fxAt(g,3,(s.p-t.hitAt)/.17,t.x,t.y-48*k,160*k,.60,1);
}
function shake(p){
 const q=(p-SLAM)/.09;if(q<0||q>=1)return null;
 const strength=(1-q)*9;return {x:Math.cos(q*47)*strength,y:Math.sin(q*63)*strength*.72};
}
function portrait(g,w,h){
 if(!ok(body)){ensureBody();return;}
 const size=Math.min(w,h)*.97;tile(g,body,9,(w-size)/2,(h-size)/2,size);
}
window.FrostboundColossus={frameCount:COUNT,effectFrameCount:COUNT,slam:SLAM,ready:()=>ok(body)&&ok(fx),ensure,ensureBody,onReady,error:()=>error,scene,actor,summon,shockwave,travel,impact,shake,portrait};
})();
