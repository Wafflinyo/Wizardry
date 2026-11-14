/* Wizardry v0.51.0 — Lady Estel, original Nature winged-healer summon.
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
function draw(ctx,options){
  if(!ctx||!options)return false;
  const p=clamp(options.progress||0),time=Number(options.time)||0,target=options.target;
  const cx=500,groundY=469,dir=(target?.x??330)>=cx?1:-1;
  const rise=118*smooth((p-.08)/.33);
  const fly=155*smooth((p-.72)/.27);
  const hover=Math.sin(time*.0028)*2.7*(p>.19&&p<.75?1:0);
  const footY=groundY-rise-fly+hover;
  const size=265,frame=frameFor(p);
  const alpha=smooth(p/.12)*(1-smooth((p-.89)/.11));
  ctx.save();
  // Opening ring on the arena floor, with gentle shadow at the center.
  disk(ctx,cx,groundY+4,77,19,"#0d281952","#b3f5a855",1.5);
  const ringAlpha=p<.27?1-smooth(p/.27):p>.84?.65*(1-smooth((p-.84)/.16)):0;
  if(ringAlpha>0){
    ctx.globalAlpha=ringAlpha;ctx.shadowColor="#bcff96";ctx.shadowBlur=13;
    disk(ctx,cx,groundY+3,70,16,null,"#bce9a0",3);
    disk(ctx,cx,groundY+3,55,12,null,"#fff1bd",1.7);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // The same angel sprite rises from the floor then flies up and away.
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx,0);ctx.scale(dir,1);
  const yy=footY-size+16;
  if(!drawFrame(ctx,frame,-size*.5,yy,size)){
    ctx.beginPath();ctx.moveTo(-44,footY-82);
    ctx.quadraticCurveTo(-105,footY-152,-56,footY-175);
    ctx.lineTo(-19,footY-144);ctx.lineTo(0,footY-213);
    ctx.lineTo(21,footY-144);ctx.lineTo(61,footY-176);
    ctx.quadraticCurveTo(117,footY-151,44,footY-82);
    ctx.lineTo(18,footY);ctx.lineTo(-20,footY);
    ctx.fillStyle="#f6f5df";ctx.fill();
  }
  ctx.restore();
  // A curved golden Nature ribbon flows from her hands to the chosen
  // allied wizard. The heal is applied once by arena.js at hit progress.
  if(target&&p>.45&&p<.84){
    const tx=target.x,ty=target.y-78;
    const t=smooth((p-.45)/.18),fade=1-smooth((p-.77)/.07);
    const x1=cx+dir*35,y1=footY-size*.54;
    const x2=mix(x1,tx,t),y2=mix(y1,ty,t);
    ctx.save();ctx.globalAlpha=fade;
    const controlX=mix(x1,tx,.52),controlY=Math.min(y1,ty)-79;
    const ribbon=[];
    for(let i=0;i<=24;i++){
      const f=i/24;
      ribbon.push([mix(mix(x1,controlX,f),mix(controlX,x2,f),f),
        mix(mix(y1,controlY,f),mix(controlY,y2,f),f)+
          Math.sin(f*TAU*2+time*.004)*4*f]);
    }
    ctx.shadowColor="#a5ffad";ctx.shadowBlur=19;
    stroke(ctx,ribbon,"#5fcf85a8",10);
    ctx.shadowBlur=10;stroke(ctx,ribbon,"#e9e5a8",4);
    ctx.shadowBlur=0;stroke(ctx,ribbon,"#fffdf0",1.2);
    for(let i=0;i<14;i++){
      const q=((time*.00040+i/14)%1);
      const index=Math.min(23,Math.floor(q*24));
      const pt=ribbon[index];
      leaf(ctx,pt[0]+Math.sin(i*3+time*.003)*10,
        pt[1]+Math.cos(i*2+time*.002)*8,.35+(i%3)*.1,
        i*2.3+time*.002,.42+.4*fade);
    }
    ctx.restore();
  }
  // The allied target receives a warm green-gold healing bloom and
  // rising petals, anchored to its existing world-space ground lane.
  if(target&&p>.52&&p<.91){
    const u=smooth((p-.52)/.13),fade=1-smooth((p-.81)/.10);
    const tx=target.x,ty=target.y;
    ctx.save();ctx.globalAlpha=u*fade;
    ctx.shadowColor="#b5f69b";ctx.shadowBlur=17;
    disk(ctx,tx,ty+5,48,13,"#74d78318","#b0f5a6",3);
    disk(ctx,tx,ty+4,34,9,null,"#fff3b6",1.5);
    const glow=ctx.createRadialGradient(tx,ty-73,4,tx,ty-73,100);
    glow.addColorStop(0,"#ddffab62");glow.addColorStop(1,"#a5e8b000");
    ctx.fillStyle=glow;ctx.fillRect(tx-105,ty-175,210,210);
    ctx.shadowBlur=0;
    for(let i=0;i<24;i++){
      const a=i*2.399+time*.0009;
      const x=tx+Math.sin(a)*(20+jitter(i*11)*34);
      const up=((time*.026+i*19)%145);
      const y=ty+8-up;
      if(i%3===0)leaf(ctx,x,y,.42,a,.45+.48*fade);
      else{
        ctx.fillStyle=i%4===0?"#fffadd":"#c2fc8f";
        ctx.beginPath();ctx.arc(x,y,1.6+jitter(i*17)*2,0,TAU);ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();return true;
}
function drawCardArt(ctx,width,height){
  if(!imageReady()||!ctx)return false;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  // Actual wing-spread blessing frame, carefully centered on the card.
  ctx.drawImage(atlas,3*256,0,256,256,-1,-18,width+2,height+34);
  ctx.restore();return true;
}
root.WIZARDRY_LADY_ESTEL_V51={draw,drawCardArt,onReady,imageReady,frameFor,asset:"assets/lady-estel-v51.webp"};
})(window);
