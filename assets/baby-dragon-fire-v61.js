/* Wizardry 0.61 — single mouth-anchored fireball and delayed branched splash.
   The new 16-frame dragon atlas contains NO painted projectile.
   Main fireball, split fireballs and impact blooms are independently drawn
   and depth-sorted alongside fighters. */
(function(root){
"use strict";
const PI=Math.PI,TAU=PI*2,C=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t)};
const rand=n=>{const x=Math.sin(n*89.77+12.3)*45718.12;return x-Math.floor(x)};
const img=new Image();img.decoding="async";const callbacks=[];
img.onload=()=>callbacks.splice(0).forEach(fn=>{try{fn()}catch(e){}});
img.src="./assets/baby-dragon-fire-v61.webp?v=0.61.0";
function ready(){return img.complete&&img.naturalWidth===1024&&img.naturalHeight===1024}
function onReady(fn){if(typeof fn==="function"){if(ready())fn();else callbacks.push(fn)}}
const HOME={x:500,groundY:425,size:226};
function sprite(c,index,x,y,size=HOME.size,alpha=1,direction=1){
 if(!ready()||alpha<=0)return false;
 c.save();c.globalAlpha*=C(alpha);c.translate(x,y);c.scale(direction<0?-1:1,1);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(img,(index%4)*256,Math.floor(index/4)*256,256,256,-size/2,-size/2,size,size);
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
 if(o.stage==="dragon-charge")return p<.13?6:8;
 if(o.stage==="dragon-shot")return p<.34?8:9;
 if(o.stage==="dragon-splash")return p<.60?9:10;
 if(o.stage==="dragon-impact")return 10;
 if(o.stage==="dragon-exit")return 12+Math.min(3,Math.floor(p*4));
 return 4;
}
function position(o){
 const p=C(o.progress||0),base=HOME.groundY-HOME.size*.49;
 if(o.stage==="dragon-drop")return{x:500,y:L(-180,base,E(p))};
 if(o.stage==="dragon-exit")return{x:500+dir(o)*82*E(p),y:base-345*E(p)};
 return{x:500,y:base+Math.sin((o.time||0)*.004)*1.5};
}
// Atlas frame 8 has the OPEN mouth at local pixel ~ (176,125),
// i.e. +42/-3 from sprite center at the 226px in-game size.
// Use the same position function as the body to keep alignment precise.
function mouthAt(o){const p=position(o);return{x:p.x+dir(o)*42,y:p.y-3};}
function fireballAt(o){
 const start=mouthAt({...o,stage:"dragon-shot"}),target=o.target||{x:760,y:385};
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
 for(let i=8;i>0;i--){
   const t=C(p-i*.025);
   if(t===0)continue;
   const prev=fireballAt({...o,progress:t});
   circle(c,prev.x,prev.y,4+((8-i)*.6),i%2?"#ffb431bc":"#ff6c2699");
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
   const alpha=s==="dragon-exit"?1-E((p-.79)/.21):1;
   if(!sprite(c,pose(o),at.x,at.y,HOME.size,alpha,dir(o)))
     circle(c,at.x,at.y,47,"#d66b2c");
 }
 if(layer==="projectile"||layer==="all"){
   if(s==="dragon-charge")drawCharge(c,o);
   if(s==="dragon-shot")drawShot(c,o);
   if(s==="dragon-splash"&&o.target)
     burst(c,o.target.x,o.target.y-100,C(p/.68),1);
   if(s==="dragon-impact"&&o.target)
     burst(c,o.target.x,o.target.y-100,.67+p*.33,.65);
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
 depthFor,actorPose:pose,actorPosition:position,home:HOME,frameCount:16
};
})(window);