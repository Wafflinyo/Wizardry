/* Short Circuit: authored 6x4 automaton atlas and separate 6x4 electrical atlas.
   Neither target nor scenery is part of the sprites. */
(()=>{
"use strict";
const C=256,R=256,body=new Image(),effects=new Image();
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
let pending=null,lastError="";
const ready=()=>[body,effects].every(im=>im.complete&&im.naturalWidth===1536&&im.naturalHeight===1024);
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=Promise.all([[body,"./assets/short-circuit-body.webp?v=1"],[effects,"./assets/short-circuit-fx.webp?v=1"]].map(([im,url])=>new Promise(resolve=>{
   if(im.complete&&im.naturalWidth===1536&&im.naturalHeight===1024){resolve(true);return;}
   const timer=setTimeout(()=>resolve(false),12000);
   im.onload=()=>{clearTimeout(timer);resolve(true);};
   im.onerror=()=>{clearTimeout(timer);resolve(false);};im.src=url;
 }))).then(()=>{lastError=ready()?"":"Short Circuit artwork failed to load";if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}return ready();}).finally(()=>pending=null);
 return pending;
}
function tile(g,img,frame,x,y,w,h){
 if(!ready())return;
 const n=Math.min(23,Math.max(0,Math.floor(frame)));
 g.drawImage(img,n%6*C,Math.floor(n/6)*R,C,R,x,y,w,h);
}
function scene(source,target,p,mana,factor=1,blocked=false){
 p=clamp(p);
 const dir=target.x>=source.x?1:-1,w=235;
 const x=Math.max(190,Math.min(810,target.x-dir*270));
 const y=Math.max(350,Math.min(490,target.y+5)),top=y-w;
 // Reuse the clean authored poses, not the smoke-baked summon poses.
 let frame=5;
 if(p>=.18&&p<.43)frame=6+Math.min(8,Math.floor((p-.18)/.25*9));
 else if(p>=.43&&p<.77)frame=15+Math.min(4,Math.floor((p-.43)/.34*5));
 else if(p>=.77)frame=20+Math.min(3,Math.floor((p-.77)/.23*4));
 const alpha=ease(p/.13)*(1-ease((p-.90)/.10));
 const strength=clamp((Number(mana)||0)/30);
 const targetScale=Math.max(.8,Math.min(1.7,factor||1));
 return {x,y,top,w,dir,p,frame,alpha,strength,blocked,
   hand:{x:x+dir*w*.37,y:top+w*.49},
   core:{x:x+dir*w*.045,y:top+w*.52},
   hit:{x:target.x,y:target.y-95*targetScale},targetScale};
}
function draw(g,s){
 if(!ready())return;
 g.save();g.globalAlpha*=s.alpha;g.translate(s.x,s.top);g.scale(s.dir,1);
 tile(g,body,s.frame,-s.w/2,0,s.w,s.w);g.restore();
}
function fx(g,n,x,y,size,alpha=1,dir=1){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=clamp(alpha);g.translate(x,y);g.scale(dir,1);
 tile(g,effects,n,-size/2,-size/2,size,size);g.restore();
}
// Angular live electrical connectors link the authored discharge frames
// to the exact target position in every formation and casting direction.
function bolt(g,from,to,phase,width,alpha,spread){
 const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
 if(alpha<=0||len<1)return;
 const count=Math.max(5,Math.ceil(len/17)),nx=-dy/len,ny=dx/len;
 g.save();g.globalAlpha*=alpha;g.lineJoin="round";g.lineCap="round";g.beginPath();
 for(let i=0;i<=count;i++){
   const t=i/count,j=i===0||i===count?0:Math.sin(i*3.79+phase*2.4)*spread;
   const x=from.x+dx*t+nx*j,y=from.y+dy*t+ny*j;
   if(i===0)g.moveTo(x,y);else g.lineTo(x,y);
 }
 g.strokeStyle="rgba(30,100,255,.26)";g.lineWidth=width*4;g.stroke();
 g.strokeStyle="#3dc7ff";g.lineWidth=width*2.2;g.stroke();
 g.strokeStyle="#e1ffff";g.lineWidth=width*.8;g.stroke();g.restore();
}
function charge(g,s){
 if(s.p<.04||s.p>=.57)return;
 const u=clamp((s.p-.04)/.40),fade=1-ease((s.p-.47)/.10);
 const n=Math.min(8,Math.floor(u*9));
 fx(g,n,s.core.x,s.core.y,66+u*32,fade*.85);
 if(s.p>.22){
   const f=ease((s.p-.22)/.19);
   fx(g,n,s.hand.x,s.hand.y,74+f*36,fade*f);
   const phase=Math.floor(s.p*90);
   bolt(g,s.core,s.hand,phase,2.5,fade*f*.8,7);
 }
}
function discharge(g,s){
 if(s.p<.45||s.p>.77)return;
 const u=clamp((s.p-.45)/(.68-.45)),fade=1-ease((s.p-.69)/.08);
 const head={x:s.hand.x+(s.hit.x-s.hand.x)*u,y:s.hand.y+(s.hit.y-s.hand.y)*u};
 const n=9+Math.min(3,Math.floor(u*4)),phase=Math.floor(s.p*115);
 fx(g,n,s.hand.x+s.dir*20,s.hand.y,115,fade,s.dir);
 for(let k=0;k<3;k++){
   const origin={x:s.hand.x,y:s.hand.y+(k-1)*8};
   bolt(g,origin,head,phase+k*3,3.7+s.strength*2.5-k*.65,fade*(1-k*.19),12+k*7+s.strength*8);
 }
 fx(g,8,head.x,head.y,55+35*u,fade*.86);
}
function impact(g,s){
 if(s.p<.68||s.p>=.98||s.blocked)return;
 const t=clamp((s.p-.68)/.30),n=13+Math.min(10,Math.floor(t*11));
 const size=(135+65*s.strength)*s.targetScale;
 // The target remains an independent world object; only the energy
 // wraps their body and erupts from the point of contact.
 fx(g,n,s.hit.x,s.hit.y,size,1-ease((t-.77)/.23));
 if(t<.68){
   const a=1-ease(t/.68),phase=Math.floor(s.p*120);
   for(let k=0;k<4;k++){
     const ang=k*Math.PI/2+phase*.17;
     const end={x:s.hit.x+Math.cos(ang)*size*.36,y:s.hit.y+Math.sin(ang)*size*.40};
     bolt(g,s.hit,end,phase+k*5,2.5+s.strength*2,a,9+s.strength*5);
   }
 }
}
function portrait(g,w,h){
 if(!ready())return;
 const size=Math.min(w,h)*1.04;
 tile(g,body,14,(w-size)/2,(h-size)/2,size,size);
}
window.ShortCircuit={ensure,ready,error:()=>lastError,scene,draw,charge,discharge,impact,portrait};ensure();
})();
