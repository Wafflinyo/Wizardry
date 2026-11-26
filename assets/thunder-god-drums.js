/* Thunder God Drums: 25 transparent authored poses and 24 separate expanding shockwave frames.
   Each drum strike is a single same-side motion. No simultaneous/cross-body strikes. */
(()=>{
"use strict";
const C=256,R=192,P=320,atlas=new Image(),fx=new Image();
const clamp=(n)=>Math.max(0,Math.min(1,n));
let pending=null,lastError="";
const ready=()=>atlas.complete&&atlas.naturalWidth===1280&&atlas.naturalHeight===960&&fx.complete&&fx.naturalWidth===1920&&fx.naturalHeight===1280;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=Promise.all([[atlas,"./assets/thunder-god-drums-frames.webp?v=1"],[fx,"./assets/thunder-god-drums-pulses.webp?v=1"]].map(([im,url])=>new Promise(resolve=>{
   if(im.complete&&im.naturalWidth){resolve(true);return;}
   const timer=setTimeout(()=>resolve(false),12000);
   im.onload=()=>{clearTimeout(timer);resolve(true);};
   im.onerror=()=>{clearTimeout(timer);resolve(false);};
   im.src=url;
 }))).then(()=>{lastError=ready()?"":"Thunder God Drums artwork failed to load";if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ready();}).finally(()=>pending=null);
 return pending;
}
function tile(g,n,x,y,w,h){if(atlas.complete&&atlas.naturalWidth)g.drawImage(atlas,n%5*C,Math.floor(n/5)*R,C,R,x,y,w,h);}
const LEFT=[3,4,5,6,7,8,9,10];
const RIGHT=[11,12,13,14,15,17,18,18];
const LEFT_AGAIN=[18,19,20,21,7,16,9,10];
// Contact occurs at the fourth frame in each sequence (index 3).
// The artwork remains front-facing, rather than flipping the whole character.
const STEP=100, LEAD=STEP*3;
function scene(ms,duration,targets){
 // Ground the summon on the arena's central diamond (world y=510).
 const x=500,y=510,w=370,h=w*R/C,top=y-h;
 let frame=3,alpha=1;
 if(ms<800){frame=Math.min(3,Math.floor(ms/200));alpha=clamp(ms/160);}
 const last=targets.at(-1);
 for(const [i,t] of targets.entries()){
   const dt=ms-(t.strikeAt-LEAD);
   if(dt>=0){const sequence=t.arm?RIGHT:i===2?LEFT_AGAIN:LEFT;
     frame=sequence[Math.min(sequence.length-1,Math.floor(dt/STEP))];
   }
 }
 // Let the final blow land and the god finish his recovery before fading.
 if(last&&ms>=last.hitAt+700){
   const fadeAt=last.hitAt+700;
   const end=clamp((ms-fadeAt)/Math.max(1,duration-fadeAt));
   frame=end<.33?22:end<.66?23:24;alpha=1-end;
 }
 const pulses=targets.filter(t=>ms>=t.strikeAt&&ms<t.hitAt+180).map(t=>{
   const ox=x+w*(t.arm?.165:-.165),oy=top+h*.69;
   const tx=t.x,ty=t.y-90;
   const elapsed=ms-t.strikeAt,travel=t.hitAt-t.strikeAt;
   const f=elapsed<travel?Math.min(16,Math.floor(elapsed/travel*17)):Math.min(23,17+Math.floor((elapsed-travel)/180*7));
   return {x:tx,y:t.y,ox,oy,tx,ty,frame:f,elapsed,travel};
 });
 return {x,y,w,h,top,frame,alpha,pulses};
}
function draw(g,s){if(!ready())return;g.save();g.globalAlpha*=s.alpha;tile(g,s.frame,s.x-s.w/2,s.top,s.w,s.h);g.restore();}
function pulse(g,s,p){
 if(!ready())return;
 // A fixed source on the struck drum membrane. The sprite depicts an
 // outward-growing arc, not a moving projectile; all 24 frames share origin.
 const dy=(p.ty-p.oy)/.63,dx=p.tx-p.ox;
 const radius=Math.max(30,Math.hypot(dx,dy)),angle=Math.atan2(dy,dx),size=radius/.435;
 g.save();g.translate(p.ox,p.oy);g.scale(1,.63);g.rotate(angle);
 g.drawImage(fx,p.frame%6*P,Math.floor(p.frame/6)*P,P,P,-size/2,-size/2,size,size);
 g.restore();
 // Short contact flash on the actual drumhead, and a separate impact
 // centered on the assigned victim when the leading ring arrives.
 if(p.elapsed<160){
   const a=1-p.elapsed/160;g.save();g.globalAlpha*=a;g.translate(p.ox,p.oy);g.scale(1,.53);
   const radius=34+18*(1-a),glow=g.createRadialGradient(0,0,0,0,0,radius);
   glow.addColorStop(0,"rgba(239,255,255,.95)");glow.addColorStop(.35,"rgba(93,210,255,.85)");glow.addColorStop(1,"rgba(30,130,255,0)");
   g.fillStyle=glow;g.fillRect(-radius,-radius,radius*2,radius*2);g.restore();
 }
 if(p.elapsed>=p.travel){
   const t=clamp((p.elapsed-p.travel)/180);g.save();g.globalAlpha*=1-t;
   const r=36+42*t;g.translate(p.tx,p.ty);g.rotate(-.2+t*.3);
   for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=r*(i%2?.67:1);
     g.fillStyle=i%2?"#63ccff":"#d9fbff";g.beginPath();g.moveTo(0,0);
     g.lineTo(Math.cos(a-.09)*rr*.32,Math.sin(a-.09)*rr*.32);
     g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
     g.lineTo(Math.cos(a+.09)*rr*.33,Math.sin(a+.09)*rr*.33);g.closePath();g.fill();}
   g.restore();
 }
}
function shake(ms,targets){
 for(const t of targets){
   const dt=ms-t.strikeAt;
   if(dt>=0&&dt<150){const a=(1-dt/150)**1.5;return {x:Math.sin(dt*.135)*8*a,y:Math.cos(dt*.17)*5*a};}
 }
 return {x:0,y:0};
}
function portrait(g,w,h){const width=Math.min(w*.99,h*C/R);tile(g,5,(w-width)/2,(h-width*R/C)/2,width,width*R/C);}
window.ThunderGodDrums={ensure,ready,error:()=>lastError,scene,draw,pulse,shake,portrait};ensure();
})();
