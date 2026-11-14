/* Wizardry v0.52.0 — Lady Estel, original Nature winged-healer summon.
   Transparent eight-frame atlas, 4 columns × 2 rows, each 256² pixels.
   Summon/impact visual effects never alter game outcomes or accuracy. */
(function(root){
"use strict";
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
const jitter=n=>{const f=Math.sin(n*78.233+9.173)*43758.547;return f-Math.floor(f)};
const atlas=new Image();atlas.decoding="async";
const listeners=[];
atlas.onload=()=>{for(const fn of listeners)try{fn()}catch(e){};};
atlas.src="./assets/lady-estel-v51.webp?v=0.51.0";
function imageReady(){return atlas.complete&&atlas.naturalWidth===1024&&atlas.naturalHeight===512;}
function onReady(fn){if(typeof fn!=="function")return;if(imageReady())fn();else listeners.push(fn);}
function frameFor(p){
  if(p<.13)return 0; // rising from Nature glyph
  if(p<.24)return 1; // wings opening
  if(p<.38)return 2; // rises to spread wings
  if(p<.51)return 3; // gathers green-gold blessing
  if(p<.66)return 4; // extends blessing toward ally
  if(p<.75)return 5; // restorative stream
  if(p<.88)return 6; // begins flying away
  return 7;          // upward departure
}
function stroke(c,points,color,width){
  c.beginPath();c.moveTo(...points[0]);
  for(let k=1;k<points.length;k++)c.lineTo(...points[k]);
  c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
}
function disk(c,x,y,rx,ry,color,edge,width=1){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
  if(color){c.fillStyle=color;c.fill();}
  if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function drawFrame(c,frame,x,y,size){
  if(!imageReady())return false;
  c.drawImage(atlas,(frame%4)*256,Math.floor(frame/4)*256,256,256,x,y,size,size);
  return true;
}
function leaf(c,x,y,scale,rotation,alpha){
  c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha=alpha;
  c.beginPath();c.moveTo(0,-8*scale);
  c.quadraticCurveTo(9*scale,0,0,10*scale);
  c.quadraticCurveTo(-8*scale,1,0,-8*scale);
  c.fillStyle="#9af09f";c.fill();c.strokeStyle="#f3f8bd";
  c.lineWidth=.85;c.stroke();
  c.beginPath();c.moveTo(0,-6*scale);c.lineTo(0,8*scale);
  c.strokeStyle="#458960";c.stroke();c.restore();
}
// Lady Estel has four independent cinematic phases. The green orb is a
// moving PROJECTILE, not a beam or painted ribbon connecting two people.
// The gameplay state machine applies 750 HP exactly when travel completes.
const PHASES=["estel-summon","estel-travel","estel-impact","estel-exit"];
function orbPosition(start,end,progress){
  const t=smooth(progress);
  const cx=mix(start.x,end.x,.50);
  const cy=Math.min(start.y,end.y)-72;
  return {
    x:(1-t)*(1-t)*start.x+2*(1-t)*t*cx+t*t*end.x,
    y:(1-t)*(1-t)*start.y+2*(1-t)*t*cy+t*t*end.y
  };
}
function drawOrb(ctx,x,y,opacity,time,radius=15){
  if(opacity<=0)return;
  ctx.save();ctx.globalAlpha=clamp(opacity);
  const h=ctx.createRadialGradient(x-3,y-4,2,x,y,radius*2.5);
  h.addColorStop(0,"#ffffeaff");
  h.addColorStop(.22,"#dcff9eef");
  h.addColorStop(.48,"#6fe697cb");
  h.addColorStop(1,"#57e99700");
  ctx.fillStyle=h;ctx.beginPath();ctx.arc(x,y,radius*2.5,0,TAU);ctx.fill();
  ctx.shadowBlur=17;ctx.shadowColor="#96ff9f";
  ctx.beginPath();ctx.arc(x,y,radius,0,TAU);
  ctx.fillStyle="#8df1a6";ctx.fill();
  ctx.shadowBlur=5;
  ctx.beginPath();ctx.arc(x-2,y-3,radius*.49,0,TAU);
  ctx.fillStyle="#f8ffca";ctx.fill();ctx.shadowBlur=0;
  // Faceted orbiting pollen, with no connecting ray to Estel.
  for(let i=0;i<8;i++){
    const a=time*.0034+i*TAU/8;
    const r=radius*(1.3+(i%3)*.22);
    const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.75;
    ctx.fillStyle=i%2?"#f8f5b6":"#8affab";
    ctx.beginPath();
    ctx.moveTo(px,py-2.4);ctx.lineTo(px+2.5,py);
    ctx.lineTo(px,py+2.6);ctx.lineTo(px-2.5,py);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function drawOrbTravel(ctx,start,end,p,time){
  const at=orbPosition(start,end,p);
  // Little light motes and freely drifting leaves float behind the orb.
  // They are not rendered as a straight or continuous beam.
  for(let i=11;i>=1;i--){
    const t=clamp(p-i*.024);
    if(p<=i*.024)continue;
    const q=orbPosition(start,end,t);
    ctx.save();ctx.globalAlpha=.055+(11-i)*.024;
    ctx.beginPath();ctx.arc(q.x,q.y,2+(11-i)*.42,0,TAU);
    ctx.fillStyle=i%3?"#a6ffac":"#fcecb0";ctx.fill();
    ctx.restore();
    if(i%3===0)leaf(ctx,q.x+Math.sin(time*.005+i)*7,
      q.y+Math.cos(time*.004+i)*6,.26,i*.8+time*.0025,
      Math.min(.62,p*.72));
  }
  drawOrb(ctx,at.x,at.y,.98,time,16);
}
function drawHealImpact(ctx,end,p,time,foreground=false){
  const cx=end.x,cy=end.y;
  ctx.save();
  const fade=1-smooth((p-.69)/.31);
  const intro=smooth(p/.12);
  const power=fade*intro;
  if(!foreground){
    // Impact begins as the orb arrives; green-gold light expands around
    // the TARGET, and the surrounding floor blooms with restorative magic.
    const outer=22+91*smooth(p);
    const bloom=ctx.createRadialGradient(cx,cy,2,cx,cy,outer);
    bloom.addColorStop(0,"#f3ffd1a9");
    bloom.addColorStop(.27,"#a5f5a66b");
    bloom.addColorStop(1,"#91f59a00");
    ctx.globalAlpha=fade;
    ctx.fillStyle=bloom;ctx.beginPath();ctx.arc(cx,cy,outer,0,TAU);ctx.fill();
    ctx.shadowColor="#a6ff99";ctx.shadowBlur=18;
    disk(ctx,cx,cy,outer*.74,outer*.70,null,"#cbffac",Math.max(1,4.5*(1-p)));
    ctx.shadowBlur=0;
    disk(ctx,cx,cy+79,40+34*p,12+12*p,null,"#bcf9a9",2.4*power);
  }else{
    // Small foreground glints overlay robes at impact, but never HP bars.
    const r=19+66*smooth(p);
    ctx.globalAlpha=power*.88;
    for(let i=0;i<12;i++){
      const a=i*TAU/12+time*.0009;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.75;
      const side=5+4*(1-p);
      ctx.strokeStyle=i%2?"#dcffb2":"#fff5c3";
      ctx.lineWidth=1.3+1.2*(1-p);ctx.beginPath();
      ctx.moveTo(x-side,y);ctx.lineTo(x+side,y);
      ctx.moveTo(x,y-side);ctx.lineTo(x,y+side);ctx.stroke();
    }
  }
  for(let i=0;i<22;i++){
    const a=i*2.39996+time*.0004;
    const spread=22+jitter(i*43)*67*smooth(p);
    const x=cx+Math.cos(a)*spread;
    const y=cy+Math.sin(a)*spread*.72-p*(18+jitter(i*7)*35);
    if(i%3===0)leaf(ctx,x,y,.30+(i%3)*.1,a+p*3,power*.9);
    else{
      ctx.globalAlpha=power*.84;ctx.fillStyle=i%2?"#fff5c6":"#b3ffb5";
      ctx.beginPath();ctx.arc(x,y,1.6+jitter(i*19)*2.2,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
}
function draw(ctx,options){
  if(!ctx||!options)return false;
  const stage=options.stage||"estel-summon";
  if(!PHASES.includes(stage))return false;
  const p=clamp(options.progress||0),time=Number(options.time)||0,target=options.target;
  const cx=500,groundY=469;
  const dir=(target?.x??320)>=cx?1:-1;
  const source=options.start||{x:cx+dir*88,y:204};
  const destination=options.end||{x:target?.x??320,y:(target?.y??400)-82};
  const rise=stage==="estel-summon"?110*smooth(p/.83):110;
  const ascent=stage==="estel-exit"?195*smooth(p):0;
  const hover=Math.sin(time*.0031)*3;
  const footY=groundY-rise-ascent+hover;
  const size=265;
  let frame=3;
  if(stage==="estel-summon"){
    frame=p<.25?0:p<.49?1:p<.75?2:3;
  }else if(stage==="estel-impact"){frame=6;}
  else if(stage==="estel-exit"){frame=p<.48?6:7;}
  const alpha=stage==="estel-summon"?smooth(p/.15):
    stage==="estel-exit"?1-smooth((p-.77)/.23):1;
  ctx.save();
  // Small ring is the source of the summon, not a beam.
  if(stage==="estel-summon"||stage==="estel-exit"){
    const glow=stage==="estel-summon"?1-smooth(p):smooth(p);
    ctx.globalAlpha=.55*glow;ctx.shadowColor="#b3f5a6";ctx.shadowBlur=14;
    disk(ctx,cx,groundY+4,70,18,null,"#b9f1a4",2.6);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  ctx.save();ctx.globalAlpha=alpha;
  ctx.translate(cx,0);ctx.scale(dir,1);
  if(!drawFrame(ctx,frame,-size*.5,footY-size+16,size)){
    // Fallback if the approved asset has not downloaded yet.
    ctx.beginPath();ctx.moveTo(-44,footY-82);
    ctx.quadraticCurveTo(-105,footY-152,-56,footY-175);
    ctx.lineTo(-19,footY-144);ctx.lineTo(0,footY-213);
    ctx.lineTo(21,footY-144);ctx.lineTo(61,footY-176);
    ctx.quadraticCurveTo(117,footY-151,44,footY-82);
    ctx.lineTo(18,footY);ctx.lineTo(-20,footY);
    ctx.fillStyle="#f6f5df";ctx.fill();
  }
  ctx.restore();
  if(stage==="estel-summon"){
    if(p>.56){
      const focus=smooth((p-.56)/.44);
      drawOrb(ctx,source.x,source.y,focus,time,8+focus*8);
    }
  }else if(stage==="estel-travel"){
    drawOrbTravel(ctx,source,destination,p,time);
  }else if(stage==="estel-impact"){
    drawHealImpact(ctx,destination,p,time,false);
  }else if(stage==="estel-exit"){
    // Final floating leaf particles follow Estel up as she departs.
    for(let i=0;i<11;i++){
      const a=i*2.399+time*.0009,r=23+jitter(i*13)*76;
      leaf(ctx,cx+Math.cos(a)*r,footY-65+Math.sin(a)*36,
        .24+(i%3)*.1,a+p*3,(1-p)*.65);
    }
  }
  ctx.restore();return true;
}
function drawForeground(ctx,options){
  if(!ctx||options?.stage!=="estel-impact")return false;
  const target=options.target;if(!target)return false;
  const end=options.end||{x:target.x,y:target.y-82};
  drawHealImpact(ctx,end,clamp(options.progress||0),Number(options.time)||0,true);
  return true;
}
function drawCardArt(ctx,width,height){
  if(!imageReady()||!ctx)return false;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  // Actual wing-spread blessing frame, carefully centered on the card.
  ctx.drawImage(atlas,3*256,0,256,256,-1,-18,width+2,height+34);
  ctx.restore();return true;
}
root.WIZARDRY_LADY_ESTEL_V51={draw,drawForeground,orbPosition,drawCardArt,onReady,imageReady,frameFor,asset:"assets/lady-estel-v51.webp"};
})(window);
