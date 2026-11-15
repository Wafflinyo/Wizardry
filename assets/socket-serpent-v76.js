/* Socket Serpent: center summon, anchored outlet/cable, prong-fang arc. */
(function(root){
'use strict';
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const image=new Image();image.src='./assets/socket-serpent-v76.webp';
function pose(o){
 const p=C(o.progress),t=o.target||{x:750,y:370},dir=t.x>=500?1:-1;
 const end={x:t.x-dir*96,y:t.y+8};let x=500,y=425,frame=3,alpha=1;
 if(o.stage==='cobra-rise'){frame=Math.min(3,Math.floor(p*4));alpha=Math.min(1,p*3);}
 if(o.stage==='cobra-charge')frame=4+Math.min(3,Math.floor(p*4));
 if(o.stage==='cobra-strike'){const q=1-(1-p)*(1-p);x=L(500,end.x,q);y=L(425,end.y,q);frame=8+Math.min(3,Math.floor(p*4));}
 if(o.stage==='cobra-impact'){x=end.x;y=end.y;frame=11;}
 if(o.stage==='cobra-return'){x=L(end.x,500,p);y=L(end.y,425,p);frame=12+Math.min(2,Math.floor(p*3));}
 if(o.stage==='cobra-vanish'){frame=15;alpha=1-p;}
 return {x,y,dir,frame,alpha};
}
function sprite(c,b,size=230){
 if(!image.complete||!image.naturalWidth)return;
 const w=image.naturalWidth/4,h=image.naturalHeight/4;
 c.save();c.globalAlpha*=b.alpha;c.translate(b.x,b.y);c.scale(b.dir,1);
 c.drawImage(image,(b.frame%4)*w,Math.floor(b.frame/4)*h,w,h,-size/2,-size*.88,size,size);c.restore();
}
function outlet(c,x,y,alpha=1){
 c.save();c.globalAlpha*=alpha;c.fillStyle='#2a4657';c.fillRect(x-21,y-48,42,49);
 c.fillStyle='#b4c8bd';c.beginPath();c.moveTo(x-18,y-47);c.lineTo(x+17,y-47);c.lineTo(x+21,y-40);c.lineTo(x+21,y);c.lineTo(x-18,y);c.closePath();c.fill();
 c.fillStyle='#50697a';c.fillRect(x-10,y-36,20,26);c.fillStyle='#102331';c.fillRect(x-5,y-30,3,11);c.fillRect(x+3,y-30,3,11);
 c.fillStyle='#ebd883';c.fillRect(x-1,y-43,3,3);c.fillRect(x-1,y-6,3,3);c.restore();
}
function draw(c,o){
 const b=pose(o),p=C(o.progress),ox=500-b.dir*112,layer=o.layer;
 if(layer==='outlet'){
  outlet(c,ox,425,b.alpha);
  c.save();c.globalAlpha*=b.alpha;c.strokeStyle='#091c29';c.lineWidth=12;c.lineCap='round';
  c.beginPath();c.moveTo(ox+3,400);c.bezierCurveTo(ox,462,b.x-b.dir*112,b.y+23,b.x-b.dir*100,b.y-20);c.stroke();
  c.strokeStyle='#48a8b6';c.lineWidth=3;c.stroke();
  c.fillStyle='#203e50';c.fillRect(ox-4,394,14,18);c.restore();return;
 }
 if(layer==='actor'){
  sprite(c,b);
  if(o.stage==='cobra-charge'){
   // Current pulses between the two metal prong fangs as charge builds.
   c.save();c.translate(b.x,b.y);c.scale(b.dir,1);c.globalAlpha=.6+.4*p;
   c.strokeStyle='#78eaff';c.shadowColor='#3abfff';c.shadowBlur=17;c.lineWidth=4;
   const tips=[[48,60,-122],[50,64,-120],[55,69,-128],[70,82,-110]][b.frame-4];
   const phase=(o.elapsed||0)*.08;c.beginPath();c.moveTo(tips[0],tips[2]);
   for(let i=1;i<7;i++)c.lineTo(L(tips[0],tips[1],i/7),tips[2]+Math.sin(phase+i*2.2)*4);
   c.lineTo(tips[1],tips[2]);c.stroke();c.shadowBlur=0;c.strokeStyle='#f0ffff';c.lineWidth=1.4;c.stroke();c.restore();
  }
 }
 if(layer==='impact'&&o.stage==='cobra-impact'&&o.target){
  const t=o.target;c.save();c.globalAlpha=1-p;c.strokeStyle='#b1f4ff';c.shadowColor='#65bcff';c.shadowBlur=18;c.lineWidth=4;
  c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=(i%2?20:44)*(1+p);const x=t.x+Math.cos(a)*r,y=t.y-85+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();c.restore();
 }
}
root.WIZARDRY_SOCKET_SERPENT_V76={draw,pose,depthFor:(o,layer)=>layer==='outlet'?424:layer==='impact'?(o.target?.y||425)+.1:pose(o).y-8};
})(window);
