/* A thin metal rod falls, stormclouds gather high above, and lightning transfers a rune. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=380,ROD_SIZE=240,ROD_LENGTH=166*ROD_SIZE/SIZE;
const image=new Image(),listeners=[];let ready=false;image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/lightning-rod-v98.webp';
const feet=[313, 313, 313, 313, 313, 313, 313, 313];
function pose(p,caster={x:175}){const drop=C(p/.08),side=caster.x<500?-1:1,angle=side*(.26+Math.min(.18,Math.abs(caster.x-500)/1200)),flight=(1-drop)*(1-drop),frame=p<.12?0:p<.22?1:p<.32?2:p<.42?3:p<.51?4:p<.62?5:p<.72?6:7,x=500+side*500*flight,y=480-900*flight,tip={x:500+Math.sin(angle)*ROD_LENGTH,y:480-Math.cos(angle)*ROD_LENGTH};return{frame,x,y,angle,alpha:1-C((p-.88)/.12),tip,cloud:{x:tip.x,y:197}};}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function lightningPath(a,b,seed=0){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,amplitude=Math.min(29,length*.16),steps=[0,.13,.29,.37,.55,.70,.84,1],zig=[0,.62,-.83,.73,-.68,.81,-.42,0];
 return steps.map((q,i)=>{const jitter=i===0||i===7?0:Math.sin(seed*3.71+i*12.87)*.22,offset=(zig[i]+jitter)*amplitude;return{x:L(a.x,b.x,q)+nx*offset,y:L(a.y,b.y,q)+ny*offset};});
}
function cloudStrikeAlpha(p){if(p<.62||p>=.70)return 0;const q=(p-.62)/.08;if(q<0||q>=1)return 0;if(q<.22)return 1-q*.7;if(q>=.36&&q<.49)return .9;if(q>=.66&&q<.76)return .75;return .035*(1-q);}
function bolt(c,a,b,progress,alpha=1){root.WIZARDRY_ROD_BOLT_V118?.draw(c,a,b,progress,alpha);}
function emblem(c,x,y,size,alpha=1){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.strokeStyle='#8ddaff';c.shadowColor='#3d95f7';c.shadowBlur=8;c.lineWidth=3;c.beginPath();c.arc(0,0,44,0,T);c.stroke();poly(c,[[9,-36],[-22,5],[-3,5],[-12,36],[25,-9],[6,-9]],'#d6f4ff');for(const side of [-1,1]){c.beginPath();c.moveTo(side*31,-22);c.lineTo(side*38,-14);c.moveTo(side*34,18);c.lineTo(side*26,26);c.stroke();}c.restore();}
function sprite(c,frame,size=SIZE,part='all'){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/2,cut=h*.45,sy=part==='rod'?cut:0,sh=part==='rod'?h-cut:part==='cloud'?cut:h,k=size/w;c.drawImage(image,frame%4*w,Math.floor(frame/4)*h+sy,w,sh,-size/2,(-feet[frame]+sy)*k,size,sh*k);}
function draw(c,{progress:p,caster,layer='rod'}){if(!caster)return;const b=pose(p,caster);
 if(layer==='rod'){
 c.save();c.globalAlpha*=b.alpha;c.beginPath();c.rect(0,-1000,1000,1431);c.clip();c.translate(b.x,b.y);c.rotate(b.angle);sprite(c,b.frame,ROD_SIZE,'rod');c.restore();
 if(p>=.22){c.save();c.globalAlpha*=b.alpha;c.translate(b.tip.x,480);sprite(c,b.frame,SIZE,'cloud');c.restore();}
 if(p<.08){c.save();c.globalAlpha=.7;c.strokeStyle='#a5deff';c.lineWidth=3;c.translate(b.x,b.y);c.rotate(b.angle);for(let i=0;i<5;i++){c.beginPath();c.moveTo(-7+i*3,-190-i*9);c.lineTo(-7+i*3,-105);c.stroke();}c.restore();}
 if(p>=.08&&p<.22){const q=(p-.08)/.14;c.save();c.globalAlpha=1-q;for(let i=0;i<24;i++){const a=i*2.399,r=20+q*(20+i%5*12),x=500+Math.cos(a)*r,y=429+Math.sin(a)*r*.2-Math.sin(q*Math.PI)*(i%4*9);poly(c,[[x-3,y],[x,y-5],[x+5,y+1],[x,y+3]],i%2?'#9aa3ad':'#535e6a');}c.restore();}
 if(p>=.62&&p<.70){const q=(p-.62)/.08,flash=cloudStrikeAlpha(p);bolt(c,b.cloud,b.tip,C((p-.62)/.08),flash);
 c.save();c.globalAlpha=flash*.8;c.strokeStyle='#e4f8ff';c.lineWidth=1.8;
 for(let i=0;i<6;i++){const a=i*T/6,r=5+flash*12;c.beginPath();c.moveTo(b.tip.x+Math.cos(a)*3,b.tip.y+Math.sin(a)*3);c.lineTo(b.tip.x+Math.cos(a)*r,b.tip.y+Math.sin(a)*r);c.stroke();}
 c.globalAlpha=flash*.13;c.fillStyle='#a2dfff';c.beginPath();c.ellipse(b.cloud.x,b.cloud.y-55,108,49,0,0,T);c.fill();c.restore();}return;}
 if(layer==='arc'&&p>=.69){const q=C((p-.69)/.09),to={x:caster.x,y:caster.y-85},end={x:L(b.tip.x,to.x,q),y:L(b.tip.y,to.y,q)-Math.sin(q*Math.PI)*55},fade=1-C((p-.84)/.12);
 if(p<.86)bolt(c,b.tip,end,C((p-.69)/.17),fade);
 if(p>=.75)emblem(c,to.x,to.y,65,C((p-.75)/.04)*fade);
 }
}
function discharge(c,event,target){const q=C(event.age/.85);if(q>=1)return;const from={x:event.source.x,y:event.source.y-85},to={x:target.x,y:target.y-85};bolt(c,from,to,q,Math.pow(1-q,1.4));c.save();c.globalAlpha=1-q;c.strokeStyle='#b9efff';c.lineWidth=4*(1-q)+1;c.beginPath();c.arc(to.x,to.y,10+q*50,0,T);c.stroke();for(let i=0;i<12;i++){const a=i*T/12,r=12+q*52;poly(c,[[to.x+Math.cos(a)*r,to.y+Math.sin(a)*r],[to.x+Math.cos(a)*(r+14),to.y+Math.sin(a)*(r+14)],[to.x+Math.cos(a+.1)*(r+4),to.y+Math.sin(a+.1)*(r+4)]],'#b6eaff');}c.restore();}
function portrait(c,w,h){c.save();const k=Math.min(w/390,h/390);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,6,ROD_SIZE,'rod');sprite(c,6,SIZE,'cloud');c.restore();}
root.WIZARDRY_ROD_V98={draw,pose,lightningPath,cloudStrikeAlpha,emblem,discharge,portrait,onReady:fn=>{if(ready)fn();else listeners.push(fn);}};
})(window);
