/* Wind Slashes: falling ronin, deliberate iaijutsu, three quick wind cuts. */
(function(root){
'use strict';
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.onload=()=>root.WIZARDRY_ARENA_TEST?.drawCardArts?.();image.src='./assets/wind-slashes-v81.webp';
const ACTOR_SCALE=.60; // Match a wizard standing at the arena center depth.
const launchAt=i=>i*135,hitAt=i=>launchAt(i)+260;
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=3,y=510,alpha=1;
 if(s==='ronin-drop'){frame=0;y=L(-170,510+54*ACTOR_SCALE,p*p);}
 if(s==='ronin-land')frame=p<.65?1:2;
 if(s==='ronin-reach')frame=p<.3?3:p<.75?4:5;
 if(s==='ronin-draw')frame=p<.55?5:6;
 if(s==='ronin-volley'){const ms=p*760;frame=ms<135?7:ms<270?8:ms<530?9:10;}
 if(s==='ronin-finish')frame=p<.7?10:11;
 if(s==='ronin-exit'){frame=11;alpha=1-p;}
 return{x:500,y,frame,alpha,dir:t.x>=500?1:-1};}
function dust(c,p,alpha=1){c.save();c.translate(500,512);c.scale(ACTOR_SCALE,ACTOR_SCALE);c.translate(-500,-512);c.globalAlpha*=alpha*(1-p);c.strokeStyle='#bad3ce';c.lineWidth=2;c.beginPath();c.ellipse(500,512,20+90*p,5+21*p,0,0,TAU);c.stroke();for(let i=0;i<13;i++){const a=i*2.399,x=500+Math.cos(a)*(20+85*p),y=510+Math.sin(a)*13-18*Math.sin(p*Math.PI);c.fillStyle=i%2?'#9aabb56b':'#c7d0c573';c.beginPath();c.ellipse(x,y,10+10*p,5+5*p,a*.1,0,0,TAU);c.fill();}c.restore();}
function draw(c,o){const b=pose(o),s=o.stage,p=C(o.progress);
 if(o.layer==='ground'){c.save();c.globalAlpha*=b.alpha*.45;c.fillStyle='#0a1c2a';c.beginPath();c.ellipse(500,512,(s==='ronin-drop'?18+25*p:45)*ACTOR_SCALE,11*ACTOR_SCALE,0,0,TAU);c.fill();c.restore();if(s==='ronin-land')dust(c,p);}
 if(o.layer==='actor'&&image.complete&&image.naturalWidth){const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir*ACTOR_SCALE,ACTOR_SCALE);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-145,-280,290,290);c.restore();}
}
function items(o){if(o.stage!=='ronin-volley')return[];const elapsed=C(o.progress)*760,b=pose(o),target=o.target||{x:800,y:450},end={x:target.x,y:target.y-100};const out=[];
 for(let i=0;i<3;i++){const age=elapsed-launchAt(i);if(age>=0&&age<=260){const p=age/260;out.push({type:'slash',i,p,dir:b.dir,x:L(500+b.dir*58*ACTOR_SCALE,end.x,p),y:L(510+(322-510)*ACTOR_SCALE,end.y,p),depthY:target.y-1});}if(age>=260&&age<470)out.push({type:'impact',i,p:(age-260)/210,dir:b.dir,x:end.x,y:end.y,depthY:target.y+.1});}return out;}
function drawItem(c,a){
 c.save();c.translate(a.x,a.y);c.rotate([-.5,.45,0][a.i]);const scale=a.type==='impact'?1+a.p*.6:.65+a.p*.35;c.scale(a.dir*scale,scale);
 const fade=a.type==='impact'?1-a.p:1;c.globalAlpha*=fade;
 // Feathered, broken air currents replace the opaque sword-shaped rim.
 for(let layer=3;layer>=0;layer--){c.save();c.globalAlpha*=[.42,.28,.13,.07][layer];c.strokeStyle=layer===0?'#e3f7ed':'#a9d5ce';c.lineWidth=[1.1,3,7,13][layer];c.lineCap='round';
  if(layer<2){c.setLineDash([12+layer*4,8]);c.lineDashOffset=-a.p*80-a.i*11;}
  c.beginPath();for(let k=0;k<=24;k++){const u=k/24,x=Math.sin(u*Math.PI)*21+Math.sin(u*10+a.p*16)*2,y=-52+104*u;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
 }
 for(let j=0;j<9;j++){
  const y=-43+j*11,phase=a.p*15+j*1.7,x=8+Math.sin(phase)*5;
  c.save();c.globalAlpha*=.20+.15*Math.sin(j+2)**2;c.strokeStyle=j%3?'#c7e9db':'#e6f3ea';c.lineWidth=j%2?.8:1.4;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-20,y-8*Math.sin(phase),x-45,y+12*Math.cos(phase),x-65-j*2,y+Math.sin(phase)*12);c.stroke();c.restore();
  const px=x-20-Math.sin(phase)*15,py=y+Math.cos(phase)*6,r=10+j%3*4,haze=c.createRadialGradient(px,py,0,px,py,r);haze.addColorStop(0,'#b4ded529');haze.addColorStop(1,'#b4ded500');c.fillStyle=haze;c.beginPath();c.ellipse(px,py,r,r*.6,0,0,TAU);c.fill();
 }c.restore();
}
function drawPortrait(c,w,h){if(!image.complete||!image.naturalWidth)return;const sw=image.naturalWidth/4,sh=image.naturalHeight/3,scale=Math.min((w-16)/sw,(h-16)/sh);c.drawImage(image,sw,sh,sw,sh,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);}
root.WIZARDRY_WIND_SLASHES_V81={pose,draw,items,drawItem,drawPortrait,launchAt,hitAt};
})(window);
