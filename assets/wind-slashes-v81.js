/* Wind Slashes: falling ronin, deliberate iaijutsu, three quick wind cuts. */
(function(root){
'use strict';
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.onload=()=>root.WIZARDRY_ARENA_TEST?.drawCardArts?.();image.src='./assets/wind-slashes-v81.webp';
const ACTOR_SCALE=.60; // Match a wizard standing at the arena center depth.
const launchAt=i=>i*135,hitAt=i=>launchAt(i)+260;
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=3,y=425,alpha=1;
 if(s==='ronin-drop'){frame=0;y=L(-170,425+54*ACTOR_SCALE,p*p);}
 if(s==='ronin-land')frame=p<.65?1:2;
 if(s==='ronin-reach')frame=p<.3?3:p<.75?4:5;
 if(s==='ronin-draw')frame=p<.55?5:6;
 if(s==='ronin-volley'){const ms=p*760;frame=ms<135?7:ms<270?8:ms<530?9:10;}
 if(s==='ronin-finish')frame=p<.7?10:11;
 if(s==='ronin-exit'){frame=11;alpha=1-p;}
 return{x:500,y,frame,alpha,dir:t.x>=500?1:-1};}
function dust(c,p,alpha=1){c.save();c.translate(500,427);c.scale(ACTOR_SCALE,ACTOR_SCALE);c.translate(-500,-427);c.globalAlpha*=alpha*(1-p);c.strokeStyle='#bad3ce';c.lineWidth=2;c.beginPath();c.ellipse(500,427,20+90*p,5+21*p,0,0,TAU);c.stroke();for(let i=0;i<13;i++){const a=i*2.399,x=500+Math.cos(a)*(20+85*p),y=425+Math.sin(a)*13-18*Math.sin(p*Math.PI);c.fillStyle=i%2?'#9aabb56b':'#c7d0c573';c.beginPath();c.ellipse(x,y,10+10*p,5+5*p,a*.1,0,0,TAU);c.fill();}c.restore();}
function draw(c,o){const b=pose(o),s=o.stage,p=C(o.progress);
 if(o.layer==='ground'){c.save();c.globalAlpha*=b.alpha*.45;c.fillStyle='#0a1c2a';c.beginPath();c.ellipse(500,427,(s==='ronin-drop'?18+25*p:45)*ACTOR_SCALE,11*ACTOR_SCALE,0,0,TAU);c.fill();c.restore();if(s==='ronin-land')dust(c,p);}
 if(o.layer==='actor'&&image.complete&&image.naturalWidth){const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir*ACTOR_SCALE,ACTOR_SCALE);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-145,-280,290,290);c.restore();}
}
function items(o){if(o.stage!=='ronin-volley')return[];const elapsed=C(o.progress)*760,b=pose(o),target=o.target||{x:800,y:450},end={x:target.x,y:target.y-100};const out=[];
 for(let i=0;i<3;i++){const age=elapsed-launchAt(i);if(age>=0&&age<=260){const p=age/260;out.push({type:'slash',i,p,dir:b.dir,x:L(500+b.dir*58*ACTOR_SCALE,end.x,p),y:L(425+(292-425)*ACTOR_SCALE,end.y,p),depthY:target.y-1});}if(age>=260&&age<470)out.push({type:'impact',i,p:(age-260)/210,dir:b.dir,x:end.x,y:end.y,depthY:target.y+.1});}return out;}
function drawItem(c,a){c.save();c.translate(a.x,a.y);c.rotate([-.5,.45,0][a.i]);const scale=a.type==='impact'?1+a.p*.6:.65+a.p*.35;c.scale(a.dir*scale,scale);c.globalAlpha*=a.type==='impact'?1-a.p:1;
 for(let layer=3;layer>=0;layer--){c.strokeStyle=['#f0fff1','#b8eee0','#85d6ce','#6aaebb'][layer];c.lineWidth=[2,5,10,17][layer];c.globalAlpha*=layer===3?.35:1;c.beginPath();for(let k=0;k<=24;k++){const u=k/24,x=Math.sin(u*Math.PI)*21,y=-52+104*u;k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();if(layer===3)c.globalAlpha/=.35;}
 for(let j=0;j<5;j++){const y=-36+j*18;c.strokeStyle='#b6e8d1a0';c.lineWidth=1.5;c.beginPath();c.moveTo(-7,y);c.quadraticCurveTo(-34,y+Math.sin(a.p*20+j)*7,-57-j*3,y+9);c.stroke();}c.restore();}
function drawPortrait(c,w,h){if(!image.complete||!image.naturalWidth)return;const sw=image.naturalWidth/4,sh=image.naturalHeight/3,scale=Math.min((w-16)/sw,(h-16)/sh);c.drawImage(image,sw,sh,sw,sh,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);}
root.WIZARDRY_WIND_SLASHES_V81={pose,draw,items,drawItem,drawPortrait,launchAt,hitAt};
})(window);
