/* Reef Rush: floor-clipped fin, circular swim, leap/chomp and splash dive. */
(function(root){
'use strict';
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/reef-rush-v77.webp';
function pose(o){
 const p=C(o.progress),t=o.target||{x:750,y:370},dir=t.x>=500?1:-1;
 const end={x:t.x-dir*68,y:t.y-161},floor=t.y+8;
 let x=500,y=425,groundY=425,frame=0,alpha=1,angle=0;
 if(o.stage==='shark-fin'){frame=3;y=425+(1-p)*80;}
 if(o.stage==='shark-swim'){const a=p*TAU;x=500+82*Math.sin(a);groundY=403+22*Math.cos(a);y=groundY;frame=3;}
 if(o.stage==='shark-submerge'){frame=3;y=425+p*80;alpha=1-p*.5;}
 if(o.stage==='shark-rise'){x=500;groundY=425;y=L(457,125,1-(1-p)*(1-p));frame=8+Math.min(1,Math.floor(p*2));}
 if(o.stage==='shark-flop'){x=500+Math.sin(p*TAU)*7;y=125-Math.sin(p*Math.PI)*9;groundY=425;frame=10;angle=Math.sin(p*TAU)*.22;}
 if(o.stage==='shark-arch'){x=L(500,end.x,p);groundY=L(425,floor,p);y=L(125,end.y,p*p);frame=10;angle=1.4*p;}

 if(o.stage==='shark-chomp'){x=end.x;y=end.y;groundY=floor;frame=11;angle=.8;}
 if(o.stage==='shark-dive'){x=L(end.x,t.x,p);groundY=floor;y=L(end.y,floor+125,p);frame=p<.68?12+Math.min(1,Math.floor(p*2)):14;}
 if(o.stage==='shark-splash'){x=t.x;y=floor;groundY=floor;frame=15;alpha=0;}
 return {x,y,groundY,frame,alpha,angle,dir};
}
function sprite(c,b,fin=false){
 if(!image.complete||!image.naturalWidth)return;
 const size=238,w=image.naturalWidth/4,h=image.naturalHeight/4;
 c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir,1);c.rotate(b.angle);
 c.drawImage(image,(b.frame%4)*w,Math.floor(b.frame/4)*h,w,h,-size/2,fin?-size*.71:-size/2,size,size);c.restore();
}
function ripple(c,x,y,r,alpha){
 c.save();c.globalAlpha*=alpha;c.strokeStyle='#8aeeec';c.lineWidth=2.5;
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y,r+i*13,(r+i*13)*.26,0,0,TAU);c.stroke();}c.restore();
}
function draw(c,o){
 const b=pose(o),p=C(o.progress),layer=o.layer;
 if(layer==='water'){
  if(o.stage==='shark-fin')ripple(c,500,425,12+18*p,.25+.55*p);
  if(o.stage==='shark-swim'){
   ripple(c,b.x,b.groundY,27,.7);
   c.save();c.strokeStyle='#6cdad9aa';c.lineWidth=3;c.beginPath();
   for(let i=0;i<18;i++){const a=p*TAU-i*.035,x=500+82*Math.sin(a),y=403+22*Math.cos(a);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
  }
  if(o.stage==='shark-submerge')ripple(c,500,425,28+24*p,1-p);
  if(o.stage==='shark-rise')ripple(c,500,425,35+48*p,1-p);
 }
 if(layer==='actor'&&b.alpha>0){
  c.save();
  if(['shark-fin','shark-swim','shark-submerge','shark-rise','shark-dive'].includes(o.stage)){
   c.beginPath();c.rect(0,0,1000,b.groundY);c.clip();
  }
  sprite(c,b,o.stage==='shark-fin'||o.stage==='shark-swim'||o.stage==='shark-submerge');c.restore();
 }
 if(layer==='splash'&&['shark-dive','shark-splash'].includes(o.stage)){
  const t=o.target||{x:750,y:370};
  const q=o.stage==='shark-dive'?C((p-.35)/.65):p;
  const strength=o.stage==='shark-dive'?q:1-p;
  ripple(c,t.x,t.y+8,28+q*65,strength);
  c.save();c.globalAlpha*=strength;
  for(let i=0;i<28;i++){const a=i*2.399,r=20+q*78;
   const x=t.x+Math.cos(a)*r,y=t.y+8-Math.abs(Math.sin(a))*80*Math.sin(q*Math.PI*.8)+q*q*22;
   c.fillStyle=i%3?'#66daee':'#dbffff';c.beginPath();c.ellipse(x,y,4,7+i%3,a,0,TAU);c.fill();
  }c.restore();
 }
}
root.WIZARDRY_REEF_RUSH_V77={draw,pose,depthFor:(o,layer)=>layer==='water'?pose(o).groundY-2:pose(o).groundY-8};
})(window);
