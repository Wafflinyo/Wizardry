/* Winter's Embrace: 32 authored transparent effect frames, no wizard or arena. */
(()=>{
"use strict";
const CELL=192,COUNT=32,im=new Image();
let pending=null,message="",listeners=[];
const clamp=p=>Math.max(0,Math.min(1,p));
function ready(){return im.complete&&im.naturalWidth===1536&&im.naturalHeight===768;}
function ensure(){
 if(ready())return Promise.resolve(true);
 if(!pending)pending=new Promise(resolve=>{
   let timer;
   const done=ok=>{clearTimeout(timer);im.onload=im.onerror=null;message=ok?"":"Winter’s Embrace artwork failed to load";resolve(ok);};
   timer=setTimeout(()=>done(false),12000);
   im.onload=()=>done(ready());im.onerror=()=>done(false);im.src="./assets/winters-embrace.webp?v=1";
 }).then(ok=>{if(ok)for(const fn of listeners)try{fn();}catch(_){}return ok;}).finally(()=>pending=null);
 return pending;
}
function onReady(fn){if(typeof fn!=="function")return;if(ready())fn();else{listeners.push(fn);ensure();}}
function tile(g,i,x,y,w,h=w){if(ready())g.drawImage(im,i%8*CELL,Math.floor(i/8)*CELL,CELL,CELL,x,y,w,h);}
function frame(p){return Math.min(31,Math.floor(clamp(p)*32));}
function cast(g,u,p,k=1,layer="front"){
 if(!ready())return;
 const i=frame(p),w=232*k,x=u.x-w/2,y=u.y-143*k-w/2;
 const split=y+w*.52;
 g.save();
 g.globalAlpha*=Math.min(1,p/.06)*Math.min(1,(1-p)/.08)*(layer==="back"?.74:.9);
 g.beginPath();
 if(layer==="back")g.rect(x,y,w,split-y);else g.rect(x,split,w,y+w-split);
 g.clip();tile(g,i,x,y,w);g.restore();
}
function portrait(g,w,h){
 if(!ready()){ensure();return;}
 const size=Math.min(w,h)*.96;tile(g,15,(w-size)/2,(h-size)/2,size);
}
window.WintersEmbrace={frameCount:COUNT,ready,ensure,onReady,error:()=>message,frame,cast,portrait};
})();
