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
 if(s==='thunder-bolt')frame=p<.3?7:8;
 if(s==='thunder-impact')frame=p<.65?8:9;
 if(s==='thunder-dissolve'){frame=p<.55?10:11;alpha=1-p;}
 const thrust=s==='thunder-clap'?9*C((p-.5)/.5):s==='thunder-bolt'?9*(1-p):0;
 return{x:500+dir*thrust,y:425,dir,frame,alpha,source:{x:500+dir*(35+thrust),y:279},end:{x:t.x,y:t.y-105}};
}
function path(o,t){const b=pose(o),s=b.source,e=b.end,dx=e.x-s.x;
 return{x:L(s.x,e.x,t),y:L(s.y,e.y,t)-Math.sin(Math.PI*t)*Math.min(100,Math.abs(dx)*.25+28)};
}
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
 const head=impact?1:p,tail=impact?C(p*.9):Math.max(0,p-.42),phase=Math.floor(p*14),pts=[];
 for(let i=0;i<=26;i++){const t=L(tail,head,i/26),point=path(o,t);if(i>0&&i<26){point.x+=Math.sin(i*19.7+phase*4.1)*7;point.y+=Math.cos(i*12.3+phase)*11;}pts.push(point);}
 const fade=impact?1-p:1;
 stroke(c,pts,'#267bff',15,.23*fade);stroke(c,pts,'#40c4ff',6,.85*fade);stroke(c,pts,'#edffff',2.2,fade);
 for(let i=5;i<24;i+=6){const point=pts[i],d=i%2?1:-1;stroke(c,[point,{x:point.x-14,y:point.y+d*15},{x:point.x-24,y:point.y+d*10},{x:point.x-36,y:point.y+d*26}],'#80dfff',1.6,.8*fade);}
 const tip=path(o,head);burst(c,tip.x,tip.y,impact?p:.2,impact?90:23);
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
  const bob=['thunder-form','thunder-dissolve'].includes(s)?0:Math.sin(p*Math.PI)*3;
  c.drawImage(image,(b.frame%4)*w,Math.floor(b.frame/4)*h,w,h,-145,-288-bob,290,290);c.restore();
  if(s==='thunder-clap'&&p>.65)burst(c,b.source.x,b.source.y,(p-.65)/.35*.2,90);
 }
 if(o.layer==='bolt'){
  const age=s==='thunder-clap'&&p>.65?(p-.65)*140:s==='thunder-bolt'?49+p*320:-1;
  if(age>=0&&age<240){const q=age/240;
   burst(c,b.source.x,b.source.y,q,110);
   c.save();c.globalAlpha*=(1-q)*.7;c.strokeStyle='#c8f8ff';c.lineWidth=3*(1-q)+1;
   c.beginPath();c.ellipse(b.source.x,b.source.y,10+q*115,7+q*65,0,0,TAU);c.stroke();c.restore();
  }
  if(s==='thunder-bolt'||s==='thunder-impact')bolt(c,o);
 }
}
root.WIZARDRY_THUNDERCLAP_V79={draw,pose,path,depthFor:(o,layer)=>layer==='bolt'?(o.target?.y||450)+.1:425-8};
})(window);
