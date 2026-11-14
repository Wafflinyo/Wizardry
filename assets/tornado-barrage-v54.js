/* Wizardry v0.55.0 — Faster approved tornado, direct high-velocity rocks.
   Source artwork: user's approved generated twelve-frame GIF, extracted as
   a transparent 4x3 WebP atlas for the existing Wizardry battlefield.
   Each enemy receives its own launched stones and timed rock impact. */
(function(root){
"use strict";
const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const rnd=n=>{const x=Math.sin(n*79.73+5.7)*37412.371;return x-Math.floor(x)};
const atlas=new Image();atlas.decoding="async";
const listeners=[];
atlas.onload=()=>{for(const f of listeners)try{f()}catch(e){}};
atlas.src="./assets/tornado-approved-v54.webp?v=0.54.0";
function imageReady(){return atlas.complete&&atlas.naturalWidth===1156&&atlas.naturalHeight===1029}
function onReady(fn){if(typeof fn!=="function")return;if(imageReady())fn();else listeners.push(fn)}
function ellipse(c,x,y,rx,ry,fill,stroke,strokeWidth){
 c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
 if(fill){c.fillStyle=fill;c.fill()}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=strokeWidth||2;c.stroke()}
}
function path(c,coords,fill,stroke){
 c.beginPath();c.moveTo(coords[0][0],coords[0][1]);
 for(let k=1;k<coords.length;k++)c.lineTo(coords[k][0],coords[k][1]);
 c.closePath();if(fill){c.fillStyle=fill;c.fill()}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke()}
}
function rock(c,x,y,r,rot,seed){
 c.save();c.translate(x,y);c.rotate(rot);
 const hi=seed%2?"#e5d6b5":"#bdccca";
 const base=seed%3?"#7c8787":"#9c9886";
 path(c,[[-r,-r*.2],[-r*.48,-r*.9],[r*.26,-r*.82],
 [r*.93,-r*.18],[r*.80,r*.64],[r*.06,r],[-r*.8,r*.62]],
 base,"#465c63");
 path(c,[[-r,-r*.2],[-r*.48,-r*.9],[r*.26,-r*.82],
 [r*.06,r*.14]],hi);
 path(c,[[-r,-r*.2],[r*.06,r*.14],[r*.06,r],[-r*.8,r*.62]],
 "#596d70");
 c.restore();
}
// One user-approved wind frame is displayed at a time, without its
// original colosseum backdrop. The stage determines the frame timing.
// The atlas includes the source animation's dense turquoise wind bands.
// Play approved wind poses at a real frame-clock rate rather than tying
// one 10-frame revolution to the whole 2-second attack. The funnel keeps
// cycling rapidly while stones leave it and during the impact aftermath.
const SPIN_FRAME_MS=55; // ~18 fps, more than 3x the former attack speed.
function frameFor(stage,p,time){
 if(stage==="wind-summon")return p<.22?0:p<.52?1:2;
 if(stage==="wind-volley"||stage==="wind-impact")
   return 2+(Math.floor(Math.max(0,time)/SPIN_FRAME_MS)%10);
 if(stage==="wind-dissolve")return 2+(Math.floor(Math.max(0,time)/SPIN_FRAME_MS)%10);
 return 2;
}
function fallbackFunnel(c,cx,base,p,time){
 c.save();c.globalAlpha=smooth(p/.15);
 for(let z=0;z<18;z++){
   const height=z/17,cy=base-height*310;
   const width=(22+height*133),phase=time*.012+z*.8;
   const dx=Math.sin(phase)*7;
   path(c,[[cx+dx-width,cy],[cx+dx-width*.28,cy-25],
    [cx+dx+width*.68,cy-19],[cx+dx+width,cy+9],
    [cx+dx+width*.19,cy+20],[cx+dx-width*.7,cy+15]],
   z%2?"#65c9c4b7":"#a5e9d5c5","#d8fff0a1");
 }
 c.restore();
}
function funnel(c,stage,p,time,targets){
 const cx=500,base=468;
 const fade=stage==="wind-dissolve"?1-smooth(p):stage==="wind-summon"?smooth(p/.2):1;
 const scale=stage==="wind-summon"?.56+.44*smooth(p/.66):1;
 // Flip the right-facing artwork only for a left-side opposing team.
 const avg=targets.length?targets.reduce((sum,t)=>sum+t.x,0)/targets.length:750;
 const mirror=avg<cx?-1:1;
 c.save();c.translate(cx,base);c.scale(mirror*scale,scale);
 c.globalAlpha=fade;
 if(imageReady()){
   const frame=frameFor(stage,p,time);
   const sx=frame%4*289,sy=Math.floor(frame/4)*343;
   const w=305,h=360;
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
   // The transparent source atlas keeps the wind and its dust base.
   c.drawImage(atlas,sx,sy,289,343,-w/2,-h,w,h);
 }else fallbackFunnel(c,0,0,p,time);
 c.restore();
}
function hitAt(i,count){
 // Evenly stagger contacts to avoid simultaneous damage to every enemy.
 if(count<=1)return .48;
 return .34+i*(.48/(count-1));
}
const ROCK_FLIGHT_WINDOW=.10; // 152ms at the new 1520ms volley duration.
const ROCK_FAN_INTERVAL=.011; // a tight, rapid burst of additional stones.
function launchAt(i,count){
 return Math.max(.02,hitAt(i,count)-ROCK_FLIGHT_WINDOW);
}
// Independent rock projectiles fire DIRECTLY out of the funnel in
// high-speed straight trajectories toward the actual enemy hitbox.
// No parabola, vertical bounce, sin-wave height, or cubic ease-in.
function rockPosition(start,end,t){
 const progress=clamp(t);
 return {x:lerp(start.x,end.x,progress),
         y:lerp(start.y,end.y,progress)};
}
function rockTrajectory(i,k,target,count,progress){
 const begin=launchAt(i,count)+k*ROCK_FAN_INTERVAL;
 const finish=hitAt(i,count)+k*ROCK_FAN_INTERVAL;
 const t=clamp((progress-begin)/(finish-begin));
 const dir=target.x>=500?1:-1;
 const start={x:500+dir*(35+k*7),y:468-168-(i%3)*13-k*7};
 const end={x:target.x+(k-1.5)*8,
            y:target.y-82+(k%3-1)*11};
 return {t,start,end,point:rockPosition(start,end,t),
   trail:rockPosition(start,end,Math.max(0,t-.18))};
}
function volley(c,targets,p,time){
 const count=targets.length;
 for(let i=0;i<count;i++){
  const target=targets[i];
  // All fragments accelerate out of the CYCLONE, not upward. The first
  // is the gameplay hit; other stones follow within ~50 milliseconds.
  for(let k=0;k<4;k++){
   const shot=rockTrajectory(i,k,target,count,p);
   if(shot.t<=0||shot.t>=1)continue;
   const {point,trail,t}=shot;
   c.save();c.lineCap="round";
   // The bright tapered wind streak visually sells direct high velocity.
   c.strokeStyle="#64d7e6a9";c.lineWidth=k===0?8:5;
   c.beginPath();c.moveTo(trail.x,trail.y);c.lineTo(point.x,point.y);c.stroke();
   c.strokeStyle="#d8fefacc";c.lineWidth=k===0?2.8:1.7;
   c.beginPath();c.moveTo(trail.x,trail.y);c.lineTo(point.x,point.y);c.stroke();
   c.restore();
   rock(c,point.x,point.y,(k===0?13:7)+rnd(i*71+k*7)*4,
     time*.016+k*.9,i*10+k);
  }
  // Each target's own stone impact remains synchronized with damage.
  const local=(p-hitAt(i,count))/.15;
  if(local>=0&&local<1)impactBurst(c,target,local,time,false);
 }
}
function impactBurst(c,target,p,time,front){
 const x=target.x,y=target.y-83,fade=1-smooth(p);
 const radius=18+58*smooth(p);
 c.save();c.globalAlpha=fade;
 if(!front){
  c.shadowColor="#b4dfd7";c.shadowBlur=17;
  ellipse(c,x,y,radius,radius*.65,null,"#c8d4c1",Math.max(1,3.2*(1-p)));
  c.shadowBlur=0;
  for(let j=0;j<8;j++){
   const a=j*TAU/8+j*.2;
   const distance=radius*(.68+.22*rnd(j*11));
   rock(c,x+Math.cos(a)*distance,y+Math.sin(a)*distance*.7,
     4+5*(1-p),a+time*.0006,j);
  }
 }else{
  for(let j=0;j<7;j++){
   const a=j*TAU/7+time*.0003,rr=radius*.9;
   const qx=x+Math.cos(a)*rr,qy=y+Math.sin(a)*rr*.66;
   c.strokeStyle=j%2?"#d7e9d5":"#b8c8b0";c.lineWidth=1.8;
   c.beginPath();c.moveTo(qx-5,qy);c.lineTo(qx+5,qy);c.stroke();
  }
 }
 c.restore();
}
function draw(c,opts){
 if(!c||!opts)return false;
 const stage=opts.stage||"wind-summon",p=clamp(Number(opts.progress)||0),time=Number(opts.time)||0;
 const targets=Array.isArray(opts.targets)?opts.targets:[];
 if(!["wind-summon","wind-volley","wind-impact","wind-dissolve"].includes(stage))return false;
 c.save();funnel(c,stage,p,time,targets);
 if(stage==="wind-volley")volley(c,targets,p,time);
 if(stage==="wind-impact"){
   // The rocks already hit one by one during wind-volley. Do not
   // replay a false simultaneous blast after the final target.
   c.globalAlpha=.25*(1-p);
   ellipse(c,500,468,82+p*56,23+p*16,null,"#b0dfd1",3);
 }
 c.restore();return true;
}
function drawForeground(c,opts){
 if(!c||opts?.stage!=="wind-volley")return false;
 const p=clamp(Number(opts.progress)||0);
 const targets=Array.isArray(opts.targets)?opts.targets:[];
 for(let i=0;i<targets.length;i++){
  const local=(p-hitAt(i,targets.length))/.15;
  if(local>=0&&local<1)impactBurst(c,targets[i],local,Number(opts.time)||0,true);
 }
 return true;
}
function drawCardArt(c,w,h){
 if(!c)return false;
 c.save();c.translate(w/2,h*.99);c.scale(.54,.52);
 c.translate(-500,-468);
 funnel(c,"wind-volley",.17,900,[{x:750,y:352}]);
 c.restore();return true;
}
root.WIZARDRY_TORNADO_V54={draw,drawForeground,drawCardArt,onReady,imageReady,
  frameFor,hitAt,launchAt,rockTrajectory,rockPosition,
  atlas:"assets/tornado-approved-v54.webp",frameCount:12,spinFrameMs:SPIN_FRAME_MS};
})(window);