/* Quicksilver: 24 authored liquid-metal surge frames and 8 authored impact frames. */
(()=>{
"use strict";
const atlas=new Image(),W=192,H=192,C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
let pending,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===1536&&atlas.naturalHeight===768;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/quicksilver-frames.webp?v=1";}).then(ok=>{lastError=ok?"":"Quicksilver frames unavailable";if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function tile(g,n,x,y,w,h){if(ready())g.drawImage(atlas,n%8*W,Math.floor(n/8)*H,W,H,x,y,w,h);}
function scene(source,target,p,hit=.73,factor=1){
 p=C(p);const dir=source.team===0?1:-1,start=.28;
 const origin={x:500-dir*76,y:510},q=C((p-start)/(hit-start)),travel=q*q*(2-q);
 const endX=target.x-dir*76*factor,endY=target.y+4;
 const frame=p<hit?Math.min(23,Math.floor(p/hit*24)):24+Math.min(7,Math.floor((p-hit)/(1-hit)*8));
 return {p,hit,dir,x:L(origin.x,endX,travel),y:L(origin.y,endY,travel),endX,endY,targetX:target.x,targetY:target.y,frame,factor};
}
function draw(g,s){if(s.p>=s.hit)return;const size=246;g.save();g.translate(s.x,s.y);g.scale(s.dir,1);tile(g,s.frame,-size*.58,-size*.92,size,size);g.restore();}
function impact(g,s){
 if(s.p<s.hit)return;
 const q=C((s.p-s.hit)/(1-s.hit)),size=260*s.factor;
 g.save();g.translate(s.targetX,s.targetY);g.scale(s.dir,1);g.globalAlpha*=1-C((q-.78)/.22);
 tile(g,s.frame,-size*.90,-size*.76,size,size);g.restore();
}
function shake(p,hit=.73){const q=(p-hit)/.085;if(q<0||q>=1)return{x:0,y:0};const f=(1-q)**2;return{x:Math.sin(q*35)*7*f,y:Math.cos(q*31)*4*f};}
function portrait(g,w,h){const size=Math.min(w,h)*1.13;tile(g,21,(w-size)/2,(h-size)/2,size,size);}
window.Quicksilver={ensure,ready,error:()=>lastError,scene,draw,impact,shake,portrait};ensure();
})();