/* Icefang Rampage: grounded sprite summon, charge and contact-timed claw. */
(function(root){
'use strict';
const img=new Image();img.src='./assets/polar-bear-v67.webp';
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p;
function pose(o){
 const p=clamp(o.progress),t=o.target||{x:700,y:340},dir=t.x>=500?1:-1;
 const end={x:t.x-dir*66,y:t.y+8};
 let x=500,y=425,frame=3,alpha=1;
 if(o.stage==='bear-appear'){frame=Math.min(3,Math.floor(p*4));alpha=p;}
 if(o.stage==='bear-roar')frame=4+Math.min(3,Math.floor(p*4));
 if(o.stage==='bear-ready')frame=8;
 if(o.stage==='bear-charge'){x=mix(500,end.x,p);y=mix(425,end.y,p);frame=9+Math.floor(p*9)%3;}
 if(o.stage==='bear-claw'||o.stage==='bear-disperse'){
  x=end.x;y=end.y;frame=o.stage==='bear-claw'?12+Math.min(2,Math.floor(p*3)):15;
  if(o.stage==='bear-disperse')alpha=1-p;
 }
 return {x,y,dir,frame,alpha};
}
function sprite(c,frame,x,y,size,alpha,dir){
 if(!img.complete||!img.naturalWidth)return;
 const w=img.naturalWidth/4,h=img.naturalHeight/4;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(dir,1);
 c.drawImage(img,(frame%4)*w,Math.floor(frame/4)*h,w,h,-size/2,-size*.88,size,size);c.restore();
}
function draw(c,o){
 const b=pose(o),p=clamp(o.progress);
 c.save();
 c.globalAlpha*=b.alpha*.2;c.fillStyle='#91d9eb';c.beginPath();c.ellipse(b.x,b.y,65,13,0,0,Math.PI*2);c.fill();c.restore();
 sprite(c,b.frame,b.x,b.y,220,b.alpha,b.dir);
 if(o.stage==='bear-appear'||o.stage==='bear-disperse'){
  c.save();c.strokeStyle='#b9f4ff';c.lineWidth=2;
  for(let i=0;i<26;i++){const a=i*2.399,r=(o.stage==='bear-appear'?1-p:p)*100+15;
   const x=b.x+Math.cos(a)*r,y=b.y-55+Math.sin(a)*r*.7;
   c.globalAlpha=Math.sin(Math.PI*p);c.strokeRect(x,y,3,7);
  }c.restore();
 }
 if(o.stage==='bear-claw'&&p>.3&&p<.9){
  const t=o.target;c.save();c.globalAlpha=Math.sin((p-.3)/.6*Math.PI);c.strokeStyle='#d5fcff';c.shadowColor='#53cfff';c.shadowBlur=16;c.lineWidth=5;
  for(let i=0;i<3;i++){c.beginPath();c.moveTo(t.x-32+i*15,t.y-105);c.lineTo(t.x-8+i*15,t.y-42);c.stroke();}c.restore();
 }
}
root.WIZARDRY_POLAR_BEAR_V67={draw,pose,depthFor:o=>pose(o).y-2,
 drawCardArt:(c,w,h)=>sprite(c,6,w*.5,h*.93,Math.min(w,h)*.96,1,1)};
})(window);
