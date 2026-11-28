/* Sky Serpent: 32 authored low-poly poses; independent wind impact atlas. */
(()=>{
"use strict";
const CELL=192,COUNT=32,body=new Image(),fx=new Image();
const C=t=>Math.max(0,Math.min(1,t)),E=t=>{t=C(t);return t*t*(3-2*t);},L=(a,b,t)=>a+(b-a)*t;
const bodyOk=()=>body.complete&&body.naturalWidth===1536&&body.naturalHeight===768;
const fxOk=()=>fx.complete&&fx.naturalWidth>=768&&fx.naturalHeight>=768;
let pending=null,bodyPending=null,fxPending=null,error="",listeners=[];
function load(im,path,ok){
 if(ok())return Promise.resolve(true);
 return new Promise(resolve=>{
  let timer;const done=v=>{clearTimeout(timer);im.onload=im.onerror=null;resolve(v);};
  timer=setTimeout(()=>done(false),12000);
  im.onload=()=>done(ok());im.onerror=()=>done(false);im.src=path;
 });
}
function ensureBody(){
 if(bodyOk())return Promise.resolve(true);
 if(!bodyPending)bodyPending=load(body,"./assets/sky-serpent-body.webp?v=1",bodyOk).then(v=>{if(v)for(const fn of listeners)try{fn();}catch(_){}return v;}).finally(()=>bodyPending=null);
 return bodyPending;
}
function ensureFX(){
 if(fxOk())return Promise.resolve(true);
 if(!fxPending)fxPending=load(fx,"./assets/wind-blast-frames.webp?v=0.284.10",fxOk).finally(()=>fxPending=null);
 return fxPending;
}
function ensure(){if(!pending)pending=Promise.all([ensureBody(),ensureFX()]).then(([b,f])=>{error=b&&f?"":"Sky Serpent artwork failed to load";return b&&f;}).finally(()=>pending=null);return pending;}
function onReady(fn){if(typeof fn!=="function")return;if(bodyOk())fn();else{listeners.push(fn);ensureBody();}}
function frame(p,hit){
 if(p<.40)return Math.min(15,Math.floor(p/.40*16));
 if(p<hit)return Math.min(24,16+Math.floor((p-.40)/(hit-.40)*9));
 return Math.min(31,25+Math.floor(C((p-hit)/(1-hit))*7));
}
function scene(source,target,p,hit=.73,k=1){
 p=C(p);const dir=source.team===0?1:-1,tx=target.x,ty=target.y-88*k;
 const w=335,contactX=tx-dir*w*.30,contactY=ty-w*.08;
 let x,y;
 if(p<.40){
   const t=E(p/.40);x=L(500-dir*100,500-dir*36,t)+Math.sin(t*Math.PI*2)*33;y=L(-115,Math.min(205,ty-100),t)-Math.sin(t*Math.PI)*30;
 }else if(p<hit){
   const t=E((p-.40)/(hit-.40));x=L(500-dir*36,contactX,t);y=L(Math.min(205,ty-100),contactY,t);
 }else{
   const t=C((p-hit)/(1-hit));x=L(contactX,tx+dir*180,t);y=L(contactY,ty+25,t);
 }
 return {p,hit,k,dir,x,y,tx,ty,w,frame:frame(p,hit)};
}
function tile(g,im,index,cols,x,y,w,h){g.drawImage(im,index%cols*CELL,Math.floor(index/cols)*CELL,CELL,CELL,x,y,w,h);}
function actor(g,s){
 if(!bodyOk())return;
 const alpha=E(s.p/.08)*(1-E((s.p-.89)/.11));
 if(alpha<=0)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=alpha;
 tile(g,body,s.frame,8,-s.w/2,-s.w/2,s.w,s.w);g.restore();
}
function impact(g,s){
 const q=(s.p-s.hit)/.24;if(q<0||q>=1||!fxOk())return;
 const i=12+Math.min(3,Math.floor(q*4)),w=(230+80*q)*s.k;
 g.save();g.translate(s.tx,s.ty);g.scale(s.dir,1);g.globalAlpha*=1-E((q-.6)/.4);
 tile(g,fx,i,4,-w/2,-w/2,w,w);g.restore();
}
function portrait(g,w,h){if(!bodyOk()){ensureBody();return;}const size=Math.min(w,h)*1.04;tile(g,body,10,8,(w-size)/2,(h-size)/2,size,size);}
window.SkySerpent={frameCount:COUNT,ready:()=>bodyOk()&&fxOk(),ensure,ensureBody,onReady,error:()=>error,scene,actor,impact,portrait};
})();
