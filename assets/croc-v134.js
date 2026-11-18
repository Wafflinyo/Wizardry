/* Creeping Croc: submerged stalk, explosive lunge, jaw snap and water return. */
(function(root){'use strict';
const C=t=>Math.max(0,Math.min(1,t)),L=(a,b,t)=>a+(b-a)*t,E=t=>{t=C(t);return t*t*(3-2*t);};
const atlas=new Image(),listeners=[];atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());atlas.src='./assets/croc-atlas-v134.webp';
const LUNGE=.56,HIT=.62,VISUAL_HIT=.74,SIZE=270;
// Preserve the submerged approach, then compress the explosive strike.
function timeline(p){return p<.56?p:p<.64?.56+(p-.56)*3:p<.85?.80+(p-.64)*(.20/.21):1;}
function pose(p,target){
 p=timeline(p);
 const dir=target.x>=500?1:-1,creep=E(p/LUNGE),waterY=L(425,target.y,creep),startX=500-dir*120,readyX=target.x-dir*130;
 let x=L(startX,readyX,creep),y=waterY-12,frame=Math.floor(p*12)%4,clip=true;
 if(p>=LUNGE&&p<.70){const q=E((p-LUNGE)/.14);x=L(readyX,target.x-dir*104,q);y=L(target.y-12,target.y-54,q);frame=4+Math.min(3,Math.floor((p-LUNGE)/.14*4));}
 else if(p>=.70&&p<.80){x=target.x-dir*104;y=target.y-54;frame=8+Math.min(3,Math.floor((p-.70)/.065*4));}
 else if(p>=.80){const q=E((p-.80)/.14);x=L(target.x-dir*104,target.x-dir*58,q);y=L(target.y-54,target.y+SIZE*.60,q);frame=12+Math.min(3,Math.floor((p-.80)/.14*4));}
 return{x,y,waterY,dir,frame,size:SIZE,clip,alpha:1-E((p-.94)/.055),poolAlpha:E(p/.08)*(1-E((p-.93)/.07))};
}
function sprite(c,frame,x,y,size,dir=1,alpha=1){if(!atlas.complete||!atlas.naturalWidth)return;const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/4;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(dir,1);c.drawImage(atlas,frame%4*cw,Math.floor(frame/4)*ch,cw,ch,-size/2,-size/2,size,size);c.restore();}
function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function draw(c,{progress:p,target,layer='actor'}){if(!target||p<0||p>=1)return;const b=pose(p,target);p=timeline(p);
 if(layer==='water'){c.save();c.globalAlpha=b.poolAlpha;c.lineWidth=2;
  ellipse(c,b.x,b.waterY+3,137,22,'#127e9e80','#76d2d98c');ellipse(c,b.x,b.waterY+2,111,15,'#0b536f80');
  for(let i=0;i<4;i++){const q=(p*2+i/4)%1;c.globalAlpha=b.poolAlpha*(1-q)*.70;ellipse(c,b.x-b.dir*(30+q*56),b.waterY+4,44+q*49,5+q*8,null,'#9de8e7');}c.restore();
 }else if(layer==='actor'){c.save();c.beginPath();c.rect(0,-200,1000,b.waterY+201);c.clip();sprite(c,b.frame,b.x,b.y,b.size,b.dir,b.alpha);c.restore();}
 else if(layer==='splash'){
  c.save();c.globalAlpha=b.poolAlpha;c.lineWidth=2;
  // Waterline hides the submerged body throughout the quiet approach.
  if(p<LUNGE){ellipse(c,b.x,b.waterY+5,128,7,'#2696ad70');c.strokeStyle='#b9f4eb';c.beginPath();c.moveTo(b.x+b.dir*72,b.waterY-2);c.quadraticCurveTo(b.x+b.dir*96,b.waterY-6,b.x+b.dir*111,b.waterY);c.stroke();}
  let q=-1;if(p>=LUNGE&&p<.76)q=(p-LUNGE)/.20;else if(p>=.80&&p<.98)q=(p-.80)/.18;
  if(q>=0){c.globalAlpha=b.poolAlpha*(1-q);c.fillStyle='#9cfff1';for(let i=0;i<13;i++){const a=i*2.399,r=20+q*78,dx=Math.cos(a)*r,dy=-Math.sin(q*Math.PI)*(25+(i%4)*17);c.beginPath();c.moveTo(b.x+dx-3,b.waterY+dy);c.lineTo(b.x+dx,b.waterY+dy-8);c.lineTo(b.x+dx+3,b.waterY+dy+2);c.closePath();c.fill();}}
  c.restore();
 }else if(layer==='impact'&&p>=VISUAL_HIT&&p<VISUAL_HIT+.075){const q=(p-VISUAL_HIT)/.075;c.save();c.globalAlpha=1-q;c.strokeStyle='#c9fff4';c.lineWidth=4;for(let i=0;i<5;i++){const a=i*Math.PI*.4;c.beginPath();c.moveTo(target.x+Math.cos(a)*12,target.y-104+Math.sin(a)*12);c.lineTo(target.x+Math.cos(a)*(24+q*23),target.y-104+Math.sin(a)*(24+q*23));c.stroke();}c.restore();}
}
function depthFor({progress:p,target},layer){const b=pose(p,target);p=timeline(p);return layer==='water'?b.waterY-.2:layer==='actor'?b.waterY+.05:layer==='splash'?b.waterY+.1:target.y+.2;}
function portrait(c,w,h){c.save();c.fillStyle='#147c9a99';c.beginPath();c.ellipse(w*.50,h*.82,w*.48,h*.12,0,0,Math.PI*2);c.fill();sprite(c,8,w*.45,h*.53,Math.min(w*1.22,h*1.25),1);c.restore();}
root.WIZARDRY_CROC_V134={draw,portrait,pose,depthFor,HIT,LUNGE,onReady(fn){if(atlas.complete&&atlas.naturalWidth)fn();else listeners.push(fn);}};
})(window);
