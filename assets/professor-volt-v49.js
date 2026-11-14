/* Wizardry v0.49.1 — Professor Volt, low-poly lightning summon.
   Eight transparent frames from the actual spell animation, 4x2 WebP.
   Beam is rendered independently so it reaches the enemy's real position. */
(function(root){
"use strict";
const TWO=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=n=>{const s=Math.sin(n*67.39+3.74)*16913.23;return s-Math.floor(s)};
const atlas=new Image();atlas.decoding="async";
const readyListeners=[];
atlas.onload=()=>{for(const cb of readyListeners)try{cb();}catch{}};
atlas.src="./assets/professor-sparkwhisk-v49.webp?v=0.49.0";
function imageReady(){return atlas.complete&&atlas.naturalWidth===1024&&atlas.naturalHeight===512;}
function onReady(callback){
  if(typeof callback!=="function")return;
  if(imageReady())callback();else readyListeners.push(callback);
}
function frameFor(p){
  if(p<.12)return 0;   // electric arrival
  if(p<.22)return 1;   // both rods lowered, steps forward
  if(p<.36)return 2;   // throws both antennas overhead to charge
  if(p<.51)return 3;   // points antennas together at the target
  if(p<.68)return 4;   // concentrated electrical burst
  if(p<.79)return 5;   // full linked beam
  if(p<.90)return 6;   // crackling aftermath
  return 7;            // lightning swirl and magical departure
}
function drawFrame(ctx,index,x,y,width,height){
  if(!imageReady())return false;
  const sx=(index%4)*256,sy=Math.floor(index/4)*256;
  ctx.drawImage(atlas,sx,sy,256,256,x,y,width,height);
  return true;
}
function trace(ctx,pts,color,width){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k][0],pts[k][1]);
  ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle=color;ctx.stroke();
}
function glowRing(ctx,x,y,rx,ry,color,width){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TWO);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function electricBeam(ctx,x1,y1,x2,y2,progress,time){
  const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1;
  const nx=-dy/L,ny=dx/L;
  const step=Math.floor(time/60);
  const polygon=[];
  const points=17;
  for(let i=0;i<=points;i++){
    const t=i/points;
    const jitter=(i===0||i===points)?0:(rand(i*19+step*31)-.5)*25;
    polygon.push([lerp(x1,x2,t)+nx*jitter,lerp(y1,y2,t)+ny*jitter]);
  }
  ctx.save();
  ctx.shadowColor="#46e9ff";ctx.shadowBlur=25;ctx.globalAlpha=.72;
  trace(ctx,polygon,"#087ebae1",22);
  ctx.shadowBlur=16;ctx.globalAlpha=1;
  trace(ctx,polygon,"#22baff",11);
  ctx.shadowBlur=8;trace(ctx,polygon,"#d2fcff",4);
  ctx.shadowBlur=0;trace(ctx,polygon,"#ffffff",1.6);
  // Two antenna channels run toward the same concentrated beam core.
  const head=lerp(1,.8,progress),antenna=21;
  for(const sign of [-1,1]){
    trace(ctx,[[x1-25,y1+sign*antenna],[x1+14,y1+sign*8],
      [x1+52,y1]],sign<0?"#7ceeff":"#bdeaff",2.8);
  }
  // Branching forks peel away from the central beam at uneven points.
  for(let i=0;i<12;i++){
    const t=(i+.4)/12;
    const x=lerp(x1,x2,t),y=lerp(y1,y2,t);
    const sign=i%2?1:-1;
    const reach=12+rand(i*7+5)*32;
    const fork=[[x,y],[x+nx*sign*reach*.55+dx*.025,y+ny*sign*reach*.55+dy*.025],
      [x+nx*sign*reach+dx*.06,y+ny*sign*reach+dy*.06]];
    ctx.globalAlpha=.5+.45*rand(step+i*19);
    trace(ctx,fork,i%3===0?"#ffffff":"#6be9ff",1.4);
  }
  ctx.restore();
}
function draw(ctx,options){
  if(!ctx||!options)return false;
  const p=clamp(options.progress||0),time=Number(options.time)||0;
  const target=options.target;
  const tx=target?.x??760,ty=(target?.y??390)-100;
  const direction=tx>=500?1:-1;
  const cy=469,cx=500;
  ctx.save();
  // The summoning disk/boots exist on the SAME floor as existing wizards.
  ctx.beginPath();ctx.ellipse(cx,cy+5,94,23,0,0,TWO);
  ctx.fillStyle="#061a2eb2";ctx.fill();
  if(p<.27||p>.88){
    const strength=p<.27?ease(p/.27):1-ease((p-.88)/.12);
    ctx.globalAlpha=.40+.5*strength;
    ctx.shadowColor="#47e7ff";ctx.shadowBlur=22;
    glowRing(ctx,cx,cy+3,72,19,"#6af8ff",4);
    glowRing(ctx,cx,cy+3,58,14,"#d2ffff",1.5);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  const alpha=p<.14?ease(p/.14):p>.91?1-ease((p-.91)/.09):1;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.translate(cx,0);ctx.scale(direction,1);
  const idx=frameFor(p);
  // The approved transparent sprite frames have different empty margins
  // BELOW the boots. Align each source frame's feet (or lightning portal)
  // against the same world ground line to prevent floating/jumping.
  const footY=[244,213,233,233,234,235,235,246][idx];
  const frameHeight=293,drawY=cy-footY*frameHeight/256;
  if(!drawFrame(ctx,idx,-163,drawY,326,frameHeight)){
    // Low-poly silhouette fallback if the downloaded art isn't ready.
    ctx.fillStyle="#4d4266";ctx.beginPath();
    ctx.moveTo(-58,430);ctx.lineTo(-51,308);ctx.lineTo(0,272);
    ctx.lineTo(52,307);ctx.lineTo(59,430);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#6ef6ff";ctx.lineWidth=6;
    trace(ctx,[[-29,322],[-4,298],[10,326]],"#baf8ff",4);
  }
  ctx.restore();
  // Rod convergence occurs BEFORE damage. Only beam connects to the
  // target once both antennas are pointed together in frames 3–5.
  if(p>.49&&p<.81){
    const charge=clamp((p-.49)/.09);
    const end=clamp((.81-p)/.08);
    const bright=ease(charge)*ease(end);
    const startX=cx+direction*112,startY=348;
    const toX=lerp(startX,tx,ease(clamp((p-.51)/.11)));
    const toY=lerp(startY,ty,ease(clamp((p-.51)/.11)));
    ctx.globalAlpha=bright;
    electricBeam(ctx,startX,startY,toX,toY,p,time);
    if(target&&p>.60){
      ctx.save();ctx.shadowColor="#6cf5ff";ctx.shadowBlur=20;
      for(let i=0;i<4;i++){
        const a=time*.012+i*TWO/4,r=26+(p-.6)*40+i*6;
        ctx.strokeStyle=i%2?"#cfffff":"#49caff";
        ctx.lineWidth=2.2;ctx.beginPath();
        ctx.arc(tx,ty,Math.max(4,r),a,a+1.4);ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
  return true;
}
function drawCardArt(ctx,width,height){
  if(!imageReady()||!ctx)return false;
  ctx.save();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  // Two antennas are visible in the approved airborne charge frame.
  ctx.drawImage(atlas,512,0,256,256,-10,-21,width+20,height+36);
  ctx.restore();return true;
}
root.WIZARDRY_PROFESSOR_V49={
  draw,drawCardArt,imageReady,onReady,
  frameFor,asset:"assets/professor-sparkwhisk-v49.webp"
};
})(window);
