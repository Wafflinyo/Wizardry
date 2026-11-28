/* Sky Serpent: 32 authored low-poly poses; independent wind impact atlas. */
(()=>{
"use strict";
const CELL=192,COUNT=32,DIVE_START=.40,HIT=.59,EXIT=.76,body=new Image(),fx=new Image();
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
 if(p<DIVE_START)return Math.min(15,Math.floor(p/DIVE_START*16));
 if(p<hit)return Math.min(24,16+Math.floor((p-DIVE_START)/(hit-DIVE_START)*9));
 return Math.min(31,25+Math.floor(C((p-hit)/(EXIT-hit))*8));
}
function scene(source,target,p,hit=HIT,k=1){
 p=C(p);const dir=source.team===0?1:-1,tx=target.x,ty=target.y-88*k;
 const w=335,contactX=tx-dir*w*.30,contactY=ty-w*.08;
 const sx=500-dir*36,sy=Math.min(205,ty-100),angle=Math.atan2(contactY-sy,Math.abs(contactX-sx));
 let x,y;
 if(p<DIVE_START){
   const t=E(p/DIVE_START);x=L(500-dir*100,500-dir*36,t)+Math.sin(t*Math.PI*2)*33;y=L(-115,Math.min(205,ty-100),t)-Math.sin(t*Math.PI)*30;
 }else if(p<hit){
   const q=C((p-DIVE_START)/(hit-DIVE_START)),t=.30*q+.70*q*q;x=L(sx,contactX,t);y=L(sy,contactY,t);
 }else{
   const t=C((p-hit)/(EXIT-hit));x=L(contactX,tx+dir*180,t);y=L(contactY,ty+25,t);
 }
 return {p,hit,k,dir,x,y,tx,ty,w,angle,frame:frame(p,hit)};
}
function tile(g,im,index,cols,x,y,w,h){g.drawImage(im,index%cols*CELL,Math.floor(index/cols)*CELL,CELL,CELL,x,y,w,h);}
function actor(g,s){
 if(!bodyOk())return;
 const alpha=E(s.p/.08)*(1-E((s.p-.69)/.07));
 if(alpha<=0)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.globalAlpha*=alpha;
 tile(g,body,s.frame,8,-s.w/2,-s.w/2,s.w,s.w);g.restore();
}
// The original wind impact frames also form a traveling corkscrew around
// the body. Alternate front and back passes keep the serpent inside the gust.
function drill(g,s,layer){
 if(!fxOk()||s.p<DIVE_START||s.p>=EXIT)return;
 const q=C((s.p-DIVE_START)/(s.hit-DIVE_START));
 const strength=E((s.p-DIVE_START)/.025)*(1-E((s.p-s.hit)/.11));
 if(strength<=0)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir,1);g.rotate(s.angle);
 for(let j=0;j<6;j++){
  const phase=(s.p-DIVE_START)*Math.PI*24+j*Math.PI*.68;
  const front=Math.sin(phase)>=0;
  if((layer==="front")!==front)continue;
  const axial=(j-2.5)*s.w*.125;
  const radius=(.24-j*.016)*s.w;
  const side=Math.cos(phase)*radius;
  const size=s.w*(.34-j*.026);
  g.save();g.translate(axial,side);g.rotate(phase+.5);
  g.globalAlpha*=strength*(front?.76:.52)*(.82+.18*q);
  tile(g,fx,12+Math.floor((s.p*48+j)%4),4,-size*.70,-size*.33,size*1.40,size*.66);
  g.restore();
 }
 g.restore();
}
function impact(g,s){
 const q=(s.p-s.hit)/.23;if(q<0||q>=1||!fxOk())return;
 const i=12+Math.min(3,Math.floor(q*4)),w=(230+80*q)*s.k;
 g.save();g.translate(s.tx,s.ty);g.scale(s.dir,1);g.globalAlpha*=1-E((q-.6)/.4);
 tile(g,fx,i,4,-w/2,-w/2,w,w);g.restore();
}
function portrait(g,w,h){if(!bodyOk()){ensureBody();return;}const size=Math.min(w,h)*1.04;tile(g,body,10,8,(w-size)/2,(h-size)/2,size,size);}
window.SkySerpent={frameCount:COUNT,ready:()=>bodyOk()&&fxOk(),ensure,ensureBody,onReady,error:()=>error,scene,actor,drill,impact,portrait};
})();
