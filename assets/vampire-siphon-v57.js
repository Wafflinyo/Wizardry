/* Wizardry v0.59.0 — Centered coffin, 16-frame vampire and shadow-mist flight.
   The approved vampire now leaves the coffin COMPLETELY, siphons the enemy,
   returns to face the caster, then offers a separate blood-red healing orb. */
(function(root){
"use strict";
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const TAU=Math.PI*2;
// Center medallion floor contact: the entire coffin must rise UP through
// groundY instead of fading in above the stage. Sprite center is above the
// ground; anything below groundY is occluded during the rise.
const COFFIN={x:500,y:404,groundY:510,size:207};
const VAMPIRE_SIZE=187; // ~71% of the previous 264px flying vampire.
const art=new Image();
art.decoding="async";
const listeners=[];
art.onload=()=>{for(const fn of listeners)try{fn()}catch(e){}};
art.src="./assets/vampire-siphon-v58.webp?v=0.58.0";
function ready(){return art.complete&&art.naturalWidth===1024&&art.naturalHeight===1024}
function onReady(fn){if(typeof fn!=="function")return;if(ready())fn();else listeners.push(fn)}
function frame(c,n,x,y,size=258,opacity=1,facing=1){
  if(!ready()||opacity<=0)return false;
  c.save();c.globalAlpha*=clamp(opacity);
  c.translate(x,y);c.scale(facing<0?-1:1,1);
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  c.drawImage(art,(n%4)*256,Math.floor(n/4)*256,256,256,
    -size*.5,-size*.5,size,size);
  c.restore();return true;
}
// Extra in-between blending keeps the character's posture fluid while its
// actual X/Y position is interpolated on every requestAnimationFrame.
// The final 16-frame atlas includes a full shadowy lower body for flight.
const STAGE_POSES={
 "vamp-rise":[0,1,2],
 "vamp-open":[3,4,5],
 "vamp-lunge":[6,7,8],
 "vamp-drain":[8,9],
 "vamp-return":[7,8,9,10],
 "vamp-present":[11,12,13],
 "vamp-orb":[14],
 "vamp-vanish":[14,15]
};
function poseAt(stage,p){
 const a=STAGE_POSES[stage]||[14];
 if(a.length===1)return{from:a[0],to:a[0],blend:0};
 const f=clamp(p)*(a.length-1),i=Math.min(a.length-2,Math.floor(f));
 const q=f-i;
 return{from:a[i],to:a[i+1],blend:ease((q-.66)/.34)};
}
function pose(c,stage,p,x,y,size,opacity,dir){
 const a=poseAt(stage,p);
 if(a.blend<=0)return frame(c,a.from,x,y,size,opacity,dir);
 if(a.blend>=1)return frame(c,a.to,x,y,size,opacity,dir);
 const ok1=frame(c,a.from,x,y,size,opacity*(1-a.blend),dir);
 const ok2=frame(c,a.to,x,y,size,opacity*a.blend,dir);
 return ok1||ok2;
}
function oval(c,x,y,rx,ry,fill){
 c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
 c.fillStyle=fill;c.fill();
}
function bloodOrb(c,x,y,r,time,opacity=1){
 c.save();c.globalAlpha*=clamp(opacity);
 const g=c.createRadialGradient(x-4,y-4,1,x,y,r*2.45);
 g.addColorStop(0,"#ffeae1");g.addColorStop(.18,"#ff587b");
 g.addColorStop(.45,"#cc0c42b5");g.addColorStop(1,"#ab0a3200");
 c.fillStyle=g;c.beginPath();c.arc(x,y,r*2.45,0,TAU);c.fill();
 c.shadowBlur=13;c.shadowColor="#ff315c";c.fillStyle="#a60b32";
 c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.shadowBlur=0;
 oval(c,x-r*.30,y-r*.36,r*.27,r*.23,"#ffe4d9");
 for(let i=0;i<7;i++){
  const angle=time*.003+i*TAU/7;
  const q=r*(1.30+(i%3)*.18);
  oval(c,x+Math.cos(angle)*q,y+Math.sin(angle)*q*.8,
    1.7+(i%2),1.7+(i%2),i%2?"#fe7a87":"#f7d2be");
 }
 c.restore();
}
// The approved new flying poses already end in dark violet smoke.
// Extend translucent streamers beneath the robes so even in-between
// frames never read as a torso suddenly cut off at the waist.
function shadowMist(c,x,y,size,time,dir,opacity=1){
 if(opacity<=0)return;
 c.save();c.globalAlpha*=clamp(opacity)*.75;
 c.translate(x,y+size*.12);c.scale(dir,1);
 const breeze=Math.sin(time*.0045),h=size*.36;
 const haze=c.createRadialGradient(-12,28,1,-14,40,size*.56);
 haze.addColorStop(0,"#48274799");haze.addColorStop(.48,"#5a426088");
 haze.addColorStop(1,"#5b437000");
 c.fillStyle=haze;oval(c,-17,25,size*.28,size*.29,haze);
 for(let i=0;i<9;i++){
   const sweep=-1+i/8*2,phase=time*.003+i*.82;
   const sx=sweep*size*.18,sy=size*.06+Math.sin(phase)*4;
   const dx=sweep*size*.19-28+11*breeze;
   const dy=h*(.57+(i%4)*.13);
   c.beginPath();c.moveTo(sx-10,sy);
   c.quadraticCurveTo(sx+dx*.38,sy+dy*.45,sx+dx+Math.sin(phase)*10,sy+dy);
   c.quadraticCurveTo(sx+dx*.73,sy+dy*.74,sx+13,sy+12);
   c.closePath();
   c.fillStyle=i%3===0?"#72557780":i%2?"#3c254eac":"#4a2d6099";
   c.fill();
 }
 c.restore();
}
function anchors(o){
 const foe=o.target||{x:770,y:390};
 const caster=o.caster||{x:190,y:380};
 const d=foe.x>=500?1:-1,b=caster.x>=500?1:-1;
 // The crypt rises ON the middle arena crest, then the vampire flies
 // wholly clear of it toward the victim and back beside its summoner.
 const origin={x:COFFIN.x,y:COFFIN.y-28};
 const victim={x:foe.x-d*71,y:foe.y-110};
 const presenter={x:caster.x-b*116,y:caster.y-120};
 const handDirection=-b; // Left caster: image's unmirrored LEFT-facing offering pose.
 const orbFrom={x:presenter.x-handDirection*51,y:presenter.y+2};
 const orbTo={x:caster.x,y:caster.y-106};
 return{foe,caster,d,b,origin,victim,presenter,handDirection,orbFrom,orbTo};
}
function position(o){
 const a=anchors(o),p=clamp(o.progress||0);
 if(o.stage==="vamp-lunge"){
   return{x:lerp(a.origin.x,a.victim.x,ease(p)),
     y:lerp(a.origin.y,a.victim.y,ease(p))-17*Math.sin(p*Math.PI)};
 }
 if(o.stage==="vamp-drain")return a.victim;
 if(o.stage==="vamp-return"){
   return{x:lerp(a.victim.x,a.presenter.x,ease(p)),
     y:lerp(a.victim.y,a.presenter.y,ease(p))-24*Math.sin(p*Math.PI)};
 }
 return a.presenter;
}
function drain(c,o){
 const a=anchors(o),p=clamp(o.progress||0);
 const bright=ease(p/.27)*(1-ease((p-.81)/.19));
 c.save();c.globalAlpha=bright;
 const dest=position(o);
 for(let i=0;i<21;i++){
   const q=(p*.56+i/21)%1;
   const sx=a.foe.x,sy=a.foe.y-96;
   const ex=dest.x+a.d*56,ey=dest.y+1;
   const px=lerp(sx,ex,q),py=lerp(sy,ey,q)+Math.sin(q*TAU+i)*8;
   oval(c,px,py,2.0+(i%4)*.9,1.9+(i%3),i%3?"#e72e58":"#ffc5c0");
 }
 c.restore();
}
// The coffin begins buried below the circular arena floor, not sitting
// fully formed on top of it. Closed art is translated upward and MASKED
// at the floor plane. One continuous physical rise gives every frame a
// different visible amount, so the object does not pop into existence.
function centerCoffin(c,stage,p,time){
 const cx=COFFIN.x,cy=COFFIN.y,ground=COFFIN.groundY;
 if(stage==="vamp-rise"){
   const lift=ease(p),y=cy+205*(1-lift);
   c.save();
   // A thin ground fissure stays ON the floor and sells the emergence.
   c.globalAlpha=.18+.52*Math.sin(Math.PI*lift);
   oval(c,cx,ground+1,72+11*lift,12+4*lift,"#151020");
   c.restore();
   c.save();
   c.beginPath();
   c.rect(0,0,1000,ground);
   c.clip();
   // Use a whole fully closed coffin sprite with the base concealed
   // underground, NOT frame-by-frame scaling or alpha revealing.
   frame(c,2,cx,y,COFFIN.size,1,1);
   c.restore();
   c.save();c.globalAlpha=.48*(1-lift);
   oval(c,cx,ground-3,79,13,"#4a2b5d");
   c.restore();
 }else if(stage==="vamp-open"){
   // The closed coffin has reached its correct final depth plane.
   // The following poses open the door; no sudden positional snap.
   pose(c,stage,p,cx,cy,COFFIN.size,1,1);
 }else if(stage==="vamp-lunge"&&p<.54){
   frame(c,2,cx,cy,COFFIN.size,.52*(1-ease(p/.54)),1);
 }
}
function orbPosition(o){
 const a=anchors(o),p=ease(clamp(o.progress||0));
 return {x:lerp(a.orbFrom.x,a.orbTo.x,p),
   y:lerp(a.orbFrom.y,a.orbTo.y,p)-25*Math.sin(Math.PI*p)};
}
// A Y depth is the projected floor contact, not the sprite's floating
// screen center. A projectile above the foreground can therefore still
// pass in front of back-row wizards and behind closer wizards.
function depthFor(o,layer="actor"){
 const a=anchors(o),s=o.stage,p=ease(clamp(o.progress||0));
 if(layer==="coffin")return COFFIN.groundY;
 if(layer==="orb"){
   return lerp(a.caster.y+26,a.caster.y+8,p);
 }
 if(s==="vamp-lunge")return lerp(COFFIN.groundY,a.foe.y+19,p);
 if(s==="vamp-drain")return a.foe.y+19;
 if(s==="vamp-return")return lerp(a.foe.y+19,a.caster.y+26,p);
 return a.caster.y+26;
}
function draw(c,o){
 if(!c||!o||!STAGE_POSES[o.stage])return false;
 const p=clamp(o.progress||0),time=Number(o.time)||0;
 const stage=o.stage,a=anchors(o),at=position(o),layer=o.layer||"all";
 const coffin=(layer==="all"||layer==="coffin");
 const actor=(layer==="all"||layer==="actor");
 const orb=(layer==="all"||layer==="orb");
 c.save();
 if(coffin)centerCoffin(c,stage,p,time);
 if(!["vamp-rise","vamp-open"].includes(stage)){
   const outbound=["vamp-lunge","vamp-drain"].includes(stage);
   const returning=stage==="vamp-return";
   // The approved offering frames already face left. Do not flip
   // them for a player on the left; mirror them ONLY for a right caster.
   const face=outbound?a.d:returning?a.b:a.handDirection;
   const vanishAlpha=stage==="vamp-vanish"?1-ease(p):1;
   if(actor){
     shadowMist(c,at.x,at.y,VAMPIRE_SIZE,time,face,vanishAlpha*
       (stage==="vamp-lunge"?ease(p/.13):1));
     pose(c,stage,p,at.x,at.y,VAMPIRE_SIZE,vanishAlpha,face);
     if(stage==="vamp-drain")drain(c,o);
   }
   if(orb){
     if(stage==="vamp-drain"&&p>.35){
       bloodOrb(c,at.x+a.d*40,at.y+6,7+8*ease((p-.35)/.65),
         time,ease((p-.35)/.32)*.8);
     }
     if(stage==="vamp-present"){
       c.save();c.globalAlpha=.27*(.5+.5*Math.sin(time*.009));
       oval(c,a.orbFrom.x,a.orbFrom.y,20,20,"#fc365c");c.restore();
     }
     if(stage==="vamp-orb"){
       const pos=orbPosition(o);
       for(let i=1;i<6;i++){
         const prior={...o,progress:clamp(p-i*.036)};
         const q=orbPosition(prior);
         if(p>i*.036)bloodOrb(c,q.x,q.y,3.7,time,.22*(1-i/7));
       }
       bloodOrb(c,pos.x,pos.y,16,time,1);
     }
   }
 }
 c.restore();return true;
}
function drawForeground(c,o){
 if(!c||o?.stage!=="vamp-orb"||o.progress<=.82)return false;
 const a=anchors(o),p=clamp((o.progress-.82)/.18);
 c.save();c.globalAlpha=1-p;c.strokeStyle="#ffd2ca";c.lineWidth=3;
 c.beginPath();c.arc(a.orbTo.x,a.orbTo.y,17+50*p,0,TAU);c.stroke();
 c.restore();return true;
}
function drawCardArt(c,w,h){
 if(!c)return false;
 c.save();c.translate(w*.5,h*.98);c.scale(.58,.58);
 c.translate(-500,-470);
 const ok=frame(c,12,500,470,310,1,1);
 if(!ok){c.font="bold 80px Georgia";c.fillStyle="#ecb9c8";
 c.textAlign="center";c.fillText("☠",500,470)}
 c.restore();return true;
}
root.WIZARDRY_VAMPIRE_V57={draw,drawForeground,drawCardArt,anchors,
 position,poseAt,orbPosition,depthFor,
 onReady,imageReady:ready,stages:Object.keys(STAGE_POSES),frames:16,
 coffinAnchor:COFFIN,vampireSize:VAMPIRE_SIZE};
})(window);