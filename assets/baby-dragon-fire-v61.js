/* Wizardry 0.65 — single mouth-anchored fireball and delayed branched splash.
   The new 16-frame dragon atlas contains NO painted projectile.
   Main fireball, split fireballs and impact blooms are independently drawn
   and depth-sorted alongside fighters. */
(function(root){
"use strict";
const PI=Math.PI,TAU=PI*2,C=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t)};
const rand=n=>{const x=Math.sin(n*89.77+12.3)*45718.12;return x-Math.floor(x)};
const img=new Image();img.decoding="async";const callbacks=[];
// Approved fiery impact artwork: 8 frames (4 columns × 2 rows), 32px
// cells. Pixel detail is supplemented with crisp vector flashes and embers
// when expanded over the target in the battle camera.
const explosion=new Image();explosion.decoding="async";
explosion.src="./assets/dragonfire-explosion-v63.webp?v=0.63.0";
const explosionReady=()=>explosion.complete&&explosion.naturalWidth===128&&explosion.naturalHeight===64;
const EXPLOSION_FRAMES=8;
function explosionFrameAt(progress){
  return Math.min(EXPLOSION_FRAMES-1,Math.floor(C(progress)*EXPLOSION_FRAMES));
}

img.onload=()=>callbacks.splice(0).forEach(fn=>{try{fn()}catch(e){}});
img.src="./assets/baby-dragon-fire-v62.webp?v=0.62.0";
function ready(){return img.complete&&img.naturalWidth===1024&&img.naturalHeight===1024}
function onReady(fn){if(typeof fn==="function"){if(ready())fn();else callbacks.push(fn)}}
const HOME={x:500,groundY:480,size:226};
function sprite(c,index,x,y,size=HOME.size,alpha=1,direction=1){
 if(!ready()||alpha<=0)return false;
 c.save();c.globalAlpha*=C(alpha);c.translate(x,y);c.scale(direction<0?-1:1,1);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 // The source atlas has stray ground-strip pixels from neighboring frames
 // across the TOP of frames 7–11 (local y≈36–47). Those pixels look like
 // a second dragon frame floating above the actual dragon in battle.
 // Crop ONLY the transparent/stray upper 84px, retaining the actual
 // dragon body, which starts at least 98px down in these five cells.
 // Preserve destination scaling and foot placement (don't stretch art).
 const trimTop=index>=7&&index<=11?84:0;
 const sourceX=(index%4)*256,sourceY=Math.floor(index/4)*256+trimTop;
 const visibleH=256-trimTop;
 c.drawImage(img,sourceX,sourceY,256,visibleH,
   -size/2,-size/2+size*trimTop/256,size,size*visibleH/256);
 c.restore();return true;
}
function circle(c,x,y,r,fill){
 c.beginPath();c.arc(x,y,Math.max(.2,r),0,TAU);c.fillStyle=fill;c.fill();
}
function ellipse(c,x,y,rx,ry,fill){
 c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
 c.fillStyle=fill;c.fill();
}
const dir=o=>(o.target?.x??760)>=HOME.x?1:-1;
function pose(o){
 const p=C(o.progress||0);
 if(o.stage==="dragon-drop")return p<.28?0:p<.61?1:2;
 if(o.stage==="dragon-land")return p<.54?3:4;
 if(o.stage==="dragon-charge")return p<.12?7:8;
 if(o.stage==="dragon-shot")return p<.34?8:9;
 if(o.stage==="dragon-splash")return p<.60?9:10;
 if(o.stage==="dragon-impact")return 10;
 // Frames 12–13 contain a PAINTED-ON floor-dust cloud: those frames
 // were being carried upward with the actor. Use the actual approved
 // dust-free flight frames (14,15), and render floor dust separately.
 if(o.stage==="dragon-exit")return p<.42?14:15;
 return 4;
}
function position(o){
 const p=C(o.progress||0),base=HOME.groundY-HOME.size*.49;
 if(o.stage==="dragon-drop")return{x:500,y:L(-180,base,E(p))};
 if(o.stage==="dragon-exit"){
   // Flight frame 14 has feet ~65px higher inside its cell than the
   // grounded pose. Set its INITIAL feet on the same 480px arena floor;
   // then actually lift the entire body away from that anchor.
   const groundedCorrection=63*(1-E(p/.21));
   return{x:500+dir(o)*82*E(p),y:base+groundedCorrection-345*E(p)};
 }
 // The grounded frames all have a consistent foot line at atlas y=248.
 // Do not bob the dragon in place while charging or firing.
 return{x:500,y:base};
}
// Measured open-mouth location on the NEW right-profile atlas.
// The model and fireball share the identical size, translation and mirror.
const MOUTH={7:[231,143],8:[229,141],9:[227,142],10:[225,145]};
function mouthAt(o){
 const pos=position(o),frame=pose(o);
 const [mx,my]=MOUTH[frame]||MOUTH[8];
 return {x:pos.x+dir(o)*(mx-128)*HOME.size/256,
         y:pos.y+(my-128)*HOME.size/256};
}
function fireballAt(o){
 // Start the shot where the FULLY-CHARGED mouth was, rather than
 // remapping its origin to a different animation frame.
 const start=mouthAt({...o,stage:"dragon-charge",progress:1}),
   target=o.target||{x:760,y:385};
 const t=C(o.progress||0),end={x:target.x,y:target.y-100};
 return{x:L(start.x,end.x,t),y:L(start.y,end.y,t)-9*Math.sin(PI*t),start,end,t};
}
function splashHitAt(i,n){return n<=1?.62:i===0?.57:.73}
function splashLaunchAt(i,n){return n<=1?.11:i===0?.09:.21}
function miniAt(o,target,index,count){
 const p=C(o.progress||0),begin=splashLaunchAt(index,count),end=splashHitAt(index,count);
 const t=C((p-begin)/(end-begin)),main=o.target||{x:760,y:390};
 const start={x:main.x,y:main.y-100},dest={x:target.x,y:target.y-100};
 return {x:L(start.x,dest.x,t),y:L(start.y,dest.y,t)-12*Math.sin(PI*t),
   start,end:dest,t,launch:begin,hit:end};
}
function shadow(c,opacity){
 c.save();c.globalAlpha*=C(opacity);
 const g=c.createRadialGradient(HOME.x,HOME.groundY,3,HOME.x,HOME.groundY,88);
 g.addColorStop(0,"#26121ebc");g.addColorStop(1,"#26121e00");
 ellipse(c,HOME.x,HOME.groundY,84,21,g);c.restore();
}
function smoke(c,p){
 const fade=1-E((p-.10)/.9);c.save();c.globalAlpha*=fade*.85;
 for(let i=0;i<21;i++){
   const a=i*2.39996,r=(12+rand(i*8)*78)*E(p),size=11+i%4*5+15*E(p);
   circle(c,500+Math.cos(a)*r,417+Math.sin(a)*r*.24-18*E(p),size,
     i%3===0?"#b3aaa0a8":i%2?"#7d706fba":"#8b8181b0");
 }
 c.restore();
}
// A distinct puff on the ARENA FLOOR. The atlas's flight frames 14/15
// contain no ground smoke; all the particles below stay at x=500,
// y=480 regardless of the dragon's moving actor position.
function takeoffGroundDust(c,p){
 const time=C(p),fade=(1-E(time/.72))*.75;
 if(fade<=.001)return;
 c.save();c.globalAlpha*=fade;
 for(let i=0;i<22;i++){
   const ang=i*2.39996,spread=(10+rand(i*9)*68)*E(time/.78);
   const x=HOME.x+Math.cos(ang)*spread;
   const y=HOME.groundY-5+Math.sin(ang)*spread*.16-
     (2+rand(i*13)*13)*E(time/.7);
   const radius=7+i%4*3+11*E(time/.4);
   circle(c,x,y,radius,i%3===0?"#bdb0aaab":
     i%2?"#786e72bf":"#9e9290c6");
 }
 c.restore();
}
function fire(c,x,y,r,time,alpha=1){
 if(r<=.3||alpha<=0)return;
 c.save();c.globalAlpha*=C(alpha);
 const grd=c.createRadialGradient(x-r*.15,y-r*.17,1,x,y,r*2.5);
 grd.addColorStop(0,"#fffce2");grd.addColorStop(.24,"#ffed7fe9");
 grd.addColorStop(.54,"#ff9026ce");grd.addColorStop(1,"#e42d1800");
 circle(c,x,y,r*2.5,grd);
 c.shadowColor="#ff7e19";c.shadowBlur=11;
 circle(c,x,y,r,"#ff7819");circle(c,x-r*.21,y-r*.18,r*.51,"#fff3b5");
 c.shadowBlur=0;
 for(let i=0;i<9;i++){
   const a=i*2.41+time*.004,rr=r*(1.1+rand(i*43)*.62);
   circle(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.75,
     Math.max(1,r*.1+i%3),i%2?"#fff5a1":"#ff9b32");
 }
 c.restore();
}
function drawCharge(c,o){
 const p=C(o.progress||0),mouth=mouthAt(o);
 const growth=E((p-.13)/.87);
 fire(c,mouth.x,mouth.y,4+25*growth,o.time||0,growth);
 // Tiny sparks gather INTO the same growing ball; never a second projectile.
 c.save();c.globalAlpha*=growth;
 for(let i=0;i<9;i++){
   const angle=i*TAU/9+(o.time||0)*.002;
   const r=33+19*(1-growth)+Math.sin(angle*2)*4;
   circle(c,mouth.x+Math.cos(angle)*r,mouth.y+Math.sin(angle)*r*.76,
     2.1,i%2?"#ffed9c":"#ff8e3d");
 }
 c.restore();
}
function drawShot(c,o){
 const at=fireballAt(o),p=C(o.progress||0),time=o.time||0;
 // Fast 110ms straight blast: a high-energy streak points back toward the
 // SAME dragon mouth coordinate used in the charge stage.
 const dx=at.x-at.start.x,dy=at.y-at.start.y;
 const dist=Math.hypot(dx,dy),length=Math.min(116,dist*.93);
 if(dist>1){
   const ox=at.x-dx/dist*length,oy=at.y-dy/dist*length;
   c.save();c.lineCap="round";
   c.shadowColor="#ff6819";c.shadowBlur=15;
   c.strokeStyle="#ff6715bf";c.lineWidth=21;
   c.beginPath();c.moveTo(ox,oy);c.lineTo(at.x,at.y);c.stroke();
   c.shadowBlur=0;
   c.strokeStyle="#ffc145e7";c.lineWidth=9;
   c.beginPath();c.moveTo(ox,oy);c.lineTo(at.x,at.y);c.stroke();
   c.strokeStyle="#fff0b6";c.lineWidth=3.5;
   c.beginPath();c.moveTo(at.x-dx/dist*length*.7,at.y-dy/dist*length*.7);
   c.lineTo(at.x,at.y);c.stroke();
   c.restore();
 }
 for(let i=8;i>0;i--){
   const t=C(p-i*.036);
   if(t===0)continue;
   const prev=fireballAt({...o,progress:t});
   circle(c,prev.x,prev.y,3+((8-i)*.55),i%2?"#ffb431bc":"#ff6c2699");
 }
 fire(c,at.x,at.y,27,time);
}
function burst(c,x,y,p,size=1){
 const fade=1-E((p-.56)/.44),spread=E(p/.66);
 if(fade<=0)return;
 const radius=(18+86*spread)*size;
 c.save();c.globalAlpha*=fade;
 const glow=c.createRadialGradient(x,y,2,x,y,radius);
 glow.addColorStop(0,"#fff8b6ad");glow.addColorStop(.31,"#ff9a2b87");
 glow.addColorStop(1,"#ee331400");
 circle(c,x,y,radius,glow);
 c.beginPath();c.ellipse(x,y,radius*.78,radius*.60,0,0,TAU);
 c.strokeStyle="#ffdc85";c.lineWidth=Math.max(1,4*(1-p));c.stroke();
 for(let i=0;i<15;i++){
  const a=i*2.399,rr=radius*(.48+rand(i*23)*.49);
  circle(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.74-13*spread,
    2+rand(i*17)*4,i%3?"#ff8738":"#fff1a2");
 }
 c.restore();
}

// The approved impact frames expand from a white-hot starburst to a fiery
// mushroom plume and smoke. This effect is a single main-target explosion;
// adjacent enemies get their OWN smaller fireballs after it detonates.
function drawMainExplosion(c,o,front=false){
 const target=o.target;
 if(!target)return false;
 const x=target.x,y=target.y-100;
 const stage=o.stage,p=C(o.progress||0),time=o.time||0;
 const active=stage==="dragon-splash";
 const t=active?C(p/.80):1;
 const alpha=active?1-E((p-.78)/.22):.47*(1-p);
 if(front){
   // Foreground draws ONLY tiny glints over the target; the whole
   // explosion belongs to the world-depth layer and renders once.
   if(!active)return true;
   const flicker=1-E(t/.48);
   c.save();c.globalAlpha*=flicker*.75;
   for(let i=0;i<9;i++){
     const angle=i*TAU/9+time*.0008,r=33+86*E(t);
     circle(c,x+Math.cos(angle)*r,y+Math.sin(angle)*r*.63,
       2.5+3*(1-t),i%2?"#fff2b2":"#ff9943");
   }
   c.restore();return true;
 }
 c.save();c.globalAlpha*=Math.max(0,alpha);
 if(explosionReady()){
   const frame=explosionFrameAt(t);
   const fw=32,fh=32;
   // A substantial impact but never tall enough to block HP sideplates.
   const size=185*(.78+.24*E(t/.45));
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
   c.drawImage(explosion,(frame%4)*fw,Math.floor(frame/4)*fh,
     fw,fh,x-size/2,y-size*.58,size,size);
 }else{
   // Functional fallback while the sprite file downloads.
   burst(c,x,y,t,1.18);
 }
 if(active){
   // Brilliant first-contact flash, rapidly widening hot shockwave,
   // radial sparks and chunky blazing fragments.
   const heat=1-E(t/.31),ring=26+120*E(t/.72);
   if(heat>.01){
     const glow=c.createRadialGradient(x,y,2,x,y,118);
     glow.addColorStop(0,"#fff9d9");glow.addColorStop(.20,"#ffef8ee6");
     glow.addColorStop(.60,"#ff692d55");glow.addColorStop(1,"#ff4c1200");
     c.save();c.globalAlpha*=heat*.86;
     circle(c,x,y,118,glow);
     c.restore();
   }
   c.save();c.globalAlpha*=1-E((t-.12)/.66);
   c.strokeStyle="#ffe7a5";c.lineWidth=Math.max(1,8*(1-t));
   c.shadowColor="#ff8a2a";c.shadowBlur=16;
   c.beginPath();c.ellipse(x,y,ring,ring*.70,0,0,TAU);c.stroke();
   c.restore();
   c.save();c.globalAlpha*=(1-E((t-.54)/.46))*.95;
   for(let i=0;i<18;i++){
     const ang=i*2.39996+time*.0005;
     const radius=(19+92*E(t/.70))*(.68+rand(i*31)*.35);
     const px=x+Math.cos(ang)*radius;
     const py=y+Math.sin(ang)*radius*.70-28*t;
     const span=(2+rand(i*18)*5)*(1+Math.min(1,t*2));
     c.beginPath();
     c.moveTo(px,py-span*1.8);
     c.lineTo(px+span*.8,py);
     c.lineTo(px,py+span);
     c.lineTo(px-span*.8,py);
     c.closePath();
     c.fillStyle=i%3?"#ffac4c":"#fff2ae";c.fill();
   }
   c.restore();
 }
 c.restore();
 return true;
}
function drawMini(c,o,target,index,count){
 const at=miniAt(o,target,index,count),p=C(o.progress||0);
 if(p>=at.launch&&p<at.hit){
   const time=o.time||0;
   for(let i=1;i<=5;i++){
     const q=miniAt({...o,progress:Math.max(0,p-i*.018)},target,index,count);
     if(q.t<=0)continue;
     circle(c,q.x,q.y,Math.max(2,6-i*.8),i%2?"#ffbe45c3":"#ff803b9a");
   }
   fire(c,at.x,at.y,12,time);
 }else if(p>=at.hit){
   burst(c,target.x,target.y-100,C((p-at.hit)/.27),.58);
 }
}
function draw(c,o){
 if(!c||!o)return false;
 const s=o.stage,layer=o.layer||"all",p=C(o.progress||0);
 if(!["dragon-drop","dragon-land","dragon-charge","dragon-shot",
       "dragon-splash","dragon-impact","dragon-exit"].includes(s))return false;
 c.save();
 if(layer==="actor"||layer==="all"){
   const at=position(o);
   shadow(c,s==="dragon-drop"?E(p):s==="dragon-exit"?1-E(p):1);
   if(s==="dragon-land")smoke(c,p);
   if(s==="dragon-drop"&&p>.70)smoke(c,C((p-.70)/.30)*.5);
   // Dust remains at the fixed arena-ground anchor; it does NOT travel
   // through the actor's translate/scale or follow its ascent.
   if(s==="dragon-exit")takeoffGroundDust(c,p);
   const alpha=s==="dragon-exit"?1-E((p-.79)/.21):1;
   if(!sprite(c,pose(o),at.x,at.y,HOME.size,alpha,dir(o)))
     circle(c,at.x,at.y,47,"#d66b2c");
 }
 if(layer==="projectile"||layer==="all"){
   if(s==="dragon-charge")drawCharge(c,o);
   if(s==="dragon-shot")drawShot(c,o);
   if((s==="dragon-splash"||s==="dragon-impact")&&o.target)
     drawMainExplosion(c,o);
 }
 if((layer==="splash"||layer==="all")&&s==="dragon-splash"){
   const neighbors=Array.isArray(o.splashTargets)?o.splashTargets:[];
   if(o.splashTarget){
     const index=neighbors.findIndex(u=>u.id===o.splashTarget.id);
     if(index>=0)drawMini(c,o,o.splashTarget,index,neighbors.length);
   }else if(layer==="all"){
     for(let i=0;i<neighbors.length;i++)drawMini(c,o,neighbors[i],i,neighbors.length);
   }
 }
 c.restore();return true;
}
function foreground(c,o){
 if(!c||!o||!["dragon-splash","dragon-impact"].includes(o.stage))return false;
 const p=C(o.progress||0),target=o.target;
 if(!target)return false;
 c.save();c.globalAlpha*=o.stage==="dragon-splash"?
   1-E((p-.64)/.36):.24*(1-p);
 for(let i=0;i<11;i++){
   const a=i*TAU/11+(o.time||0)*.0008,rr=22+53*E(p);
   circle(c,target.x+Math.cos(a)*rr,target.y-100+Math.sin(a)*rr*.62,
     i%3?2.1:3.4,i%2?"#ffc77b":"#ff8c4d");
 }
 if(o.stage==="dragon-splash")drawMainExplosion(c,o,true);
 c.restore();return true;
}
function depthFor(o,layer="actor"){
 if(layer==="splash"&&o.splashTarget){
  const list=Array.isArray(o.splashTargets)?o.splashTargets:[];
  const i=Math.max(0,list.findIndex(u=>u.id===o.splashTarget.id));
  return L((o.target?.y??387)+13,o.splashTarget.y+13,miniAt(o,o.splashTarget,i,list.length).t);
 }
 if(layer==="projectile"){
  if(o.stage==="dragon-shot")return L(HOME.groundY,(o.target?.y??387)+13,C(o.progress||0));
  if(["dragon-splash","dragon-impact"].includes(o.stage))return(o.target?.y??387)+13;
 }
 return HOME.groundY;
}
function drawCardArt(c,w,h){
 if(!c)return false;
 c.save();const size=Math.min(w*.92,h*1.2);
 const ok=sprite(c,8,w*.5,h*.53,size,1,1);
 if(!ok){c.font="bold 75px system-ui";c.textAlign="center";
   c.fillStyle="#ffae52";c.fillText("♨",w/2,h*.60);}
 c.restore();return true;
}
root.WIZARDRY_BABY_DRAGON_V61={
 draw,drawForeground:foreground,drawCardArt,imageReady:ready,onReady,
 fireballAt,miniAt,mouthAt,splashHitAt,splashLaunchAt,
 explosionFrameAt,explosionReady,explosionAsset:"assets/dragonfire-explosion-v63.webp",
 depthFor,actorPose:pose,actorPosition:position,home:HOME,frameCount:16,
 groundedFootPixel:248,attackProfile:true,
 cleanFrameTop:index=>index>=7&&index<=11?84:0
};
})(window);