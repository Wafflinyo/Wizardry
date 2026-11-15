/* Thunderclap: dark cloud summon, quick palm clap and arcing lightning. */
(function(root){
'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const image=new Image();image.src='./assets/thunderclap-v79.webp';
function pose(o){
 const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450},dir=t.x>=500?1:-1;
 let frame=2,alpha=1;
 if(s==='thunder-form'){frame=Math.min(2,Math.floor(p*3));alpha=C(p*3);}
 if(s==='thunder-spread')frame=3+Math.min(2,Math.floor(p*3));
 if(s==='thunder-clap')frame=p<.25?5:p<.65?6:7;
 if(s==='thunder-bolt')frame=7;
 if(s==='thunder-impact')frame=7;
 if(s==='thunder-dissolve'){frame=p<.55?10:11;alpha=1-p;}
 const thrust=s==='thunder-clap'?9*C((p-.5)/.5):['thunder-bolt','thunder-impact'].includes(s)?9:0;
 return{x:500+dir*thrust,y:425,dir,frame,alpha,source:{x:500+dir*(48+thrust),y:279},end:{x:t.x,y:t.y-105}};
}
function path(o,t){const b=pose(o);return{x:L(b.source.x,b.end.x-b.dir*34,t),y:L(b.source.y,b.end.y,t)};}
function crescent(o,p,u){const b=pose(o),center=path(o,p),scale=Math.min(1,p*5);return{x:center.x+b.dir*34*Math.sin(Math.PI*u)*scale,y:center.y-76*Math.cos(Math.PI*u)*scale};}
function stroke(c,points,color,width,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();}
function burst(c,x,y,p,r=70){
 c.save();c.globalAlpha*=1-p;
 c.strokeStyle='#a3edff';c.lineWidth=3;c.beginPath();c.ellipse(x,y,8+r*p,6+r*p*.5,0,0,TAU);c.stroke();
 for(let i=0;i<13;i++){const a=i*2.399,rr=8+p*r,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.8;
 stroke(c,[{x:px,y:py},{x:px+Math.cos(a)*9,y:py+Math.sin(a)*9},{x:px+Math.cos(a+.5)*17,y:py+Math.sin(a+.5)*17}],i%3?'#73d8ff':'#eaffff',2);}
 c.restore();
}
function bolt(c,o){
 const p=C(o.progress),impact=o.stage==='thunder-impact';if(!impact&&p<=0)return;
 const travel=impact?1:p,fade=impact?Math.max(0,1-p*2.5):1,phase=Math.floor(p*16),pts=[];
 for(let i=0;i<=40;i++){const point=crescent(o,travel,i/40);if(i>0&&i<40){point.x+=Math.sin(i*19.7+phase*4.1)*2;point.y+=Math.cos(i*12.3+phase)*2;}pts.push(point);}
 // The curved electrical wave travels as a whole; no straight beam joins it to the hands.
 for(let ghost=2;ghost>=1;ghost--){const trail=pts.map(pt=>({x:pt.x-pose(o).dir*ghost*10,y:pt.y}));stroke(c,trail,'#42baff',7,.10*fade/ghost);}
 stroke(c,pts,'#237aff',20,.25*fade);stroke(c,pts,'#47c9ff',8,.9*fade);stroke(c,pts,'#efffff',2.7,fade);
 for(const i of [7,17,27,35]){const point=pts[i],d=i%2?1:-1;stroke(c,[point,{x:point.x-d*7,y:point.y-8},{x:point.x+d*4,y:point.y-17}],'#80dfff',1.5,.8*fade);}
 if(impact){const b=pose(o);burst(c,b.end.x,b.end.y,p,90);}
}
function armMist(c,o){
 const p=C(o.progress),s=o.stage,age=s==='thunder-clap'?p:s==='thunder-bolt'?1+p*2:-1;
 if(age<0||age>2.1)return;const b=pose(o),fade=age<=1?1:Math.max(0,1-(age-1)/1.1);
 c.save();c.globalAlpha*=fade;
 for(const side of [-1,1]){
  const startX=500+side*150;
  // Fast curved vapor strokes sweep both arms toward the central clap.
  for(let lane=0;lane<5;lane++){
   const shift=lane*4,phase=(age*2.8+lane*.15)%1;
   c.strokeStyle=lane%2?'#b9e4f3a0':'#7d9eb4a0';c.lineWidth=2+lane%2;c.beginPath();
   const start=phase*.7,end=Math.min(1,start+.25);
   for(let k=0;k<14;k++){const q=L(start,end,k/13),x=L(startX,b.source.x,q),y=279-Math.sin(q*Math.PI)*(28+shift)+shift; k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  }
  for(let i=0;i<19;i++){
   const q=(age*3.2+i/19)%1,x=L(startX,b.source.x,q)+Math.sin(i*7)*5,y=279-Math.sin(q*Math.PI)*(22+i%5*6)+Math.cos(i*5)*9,r=(9+i%4*4)*(1-q*.45);
   const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#9ab6c18f');haze.addColorStop(.6,'#607d995f');haze.addColorStop(1,'#6a8c9900');c.fillStyle=haze;c.beginPath();c.ellipse(x,y,r,r*.55,side*.3,0,0,TAU);c.fill();
  }
 }c.restore();
}
function draw(c,o){
 const b=pose(o),p=C(o.progress),s=o.stage;
 if(o.layer==='ground'){
  c.save();c.globalAlpha*=b.alpha*.6;c.fillStyle='#172837';c.beginPath();c.ellipse(500,425,68,16,0,0,TAU);c.fill();
  c.strokeStyle='#5599b1';c.lineWidth=1.5;c.beginPath();c.ellipse(500,425,52+8*Math.sin(p*TAU),13,0,0,TAU);c.stroke();c.restore();
 }
 if(o.layer==='actor'&&image.complete&&image.naturalWidth){
  const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(b.x,425);c.scale(b.dir,1);
  if(s==='thunder-clap'&&p>.55){const force=Math.sin((p-.55)/.45*Math.PI);c.scale(1+force*.035,1-force*.025);}
  const bob=['thunder-spread'].includes(s)?Math.sin(p*Math.PI)*3:0;
  c.drawImage(image,(b.frame%4)*w,Math.floor(b.frame/4)*h,w,h,-145,-288-bob,290,290);c.restore();
  if(s==='thunder-clap'&&p>.65)burst(c,b.source.x,b.source.y,(p-.65)/.35*.2,90);
 }
 if(o.layer==='bolt'){
  armMist(c,o);
  const age=s==='thunder-clap'&&p>.65?(p-.65)*140:s==='thunder-bolt'?49+p*320:-1;
  if(age>=0&&age<240){const q=age/240;
   burst(c,b.source.x,b.source.y,q,110);
   c.save();c.globalAlpha*=(1-q)*.7;c.strokeStyle='#c8f8ff';c.lineWidth=3*(1-q)+1;
   c.beginPath();c.ellipse(b.source.x,b.source.y,10+q*115,7+q*65,0,0,TAU);c.stroke();c.restore();
  }
  if(s==='thunder-bolt'||s==='thunder-impact')bolt(c,o);
 }
}
root.WIZARDRY_THUNDERCLAP_V79={draw,pose,path,crescent,depthFor:(o,layer)=>layer==='bolt'?(o.target?.y||450)+.1:425-8};
})(window);
