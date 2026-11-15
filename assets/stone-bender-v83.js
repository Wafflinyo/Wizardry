/* Stone Bender: back-foot stomp, rising rectangular wall, shattering punch. */
(function(root){
'use strict';const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/stone-bender-v83.webp';
const HIT_MS=325;
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=0,alpha=1,wall=0,burst=-1;
 if(s==='bender-appear')alpha=C(p*2);
 if(s==='bender-stance')frame=p<.4?2:3;
 if(s==='bender-stomp'){frame=p<.6?4:5;wall=C((p-.6)/.4)*.25;}
 if(s==='bender-wall'){frame=5;wall=L(.25,1,p);}
 if(s==='bender-punch'){frame=p<.45?6:7;wall=1;if(p>=.62){wall=0;burst=p*250-155;}}
 if(s==='bender-barrage'){frame=p<.45?8:9;burst=95+p*900;}
 if(s==='bender-exit'){frame=p<.5?10:11;alpha=1-p;}
 return{x:500,y:425,dir:t.x>=500?1:-1,frame,alpha,wall,burst};}
function dust(c,x,y,p,strength=1){if(p<0||p>1)return;c.save();c.globalAlpha*=strength*(1-p);c.strokeStyle='#c7b895a0';c.lineWidth=3;c.beginPath();c.ellipse(x,y,12+130*p,4+32*p,0,0,TAU);c.stroke();
 for(let i=0;i<18;i++){const a=i*2.399,px=x+Math.cos(a)*(17+105*p),py=y+Math.sin(a)*15-24*Math.sin(p*Math.PI),r=6+13*p;const haze=c.createRadialGradient(px,py,0,px,py,r);haze.addColorStop(0,'#c1aa7f95');haze.addColorStop(1,'#ae987000');c.fillStyle=haze;c.beginPath();c.ellipse(px,py,r,r*.65,a,0,TAU);c.fill();}c.restore();}
function draw(c,o){const p=C(o.progress),s=o.stage,b=pose(o);
 if(o.layer==='ground'){
  c.save();c.globalAlpha*=b.alpha*.3;c.fillStyle='#12212a';c.beginPath();c.ellipse(500,427,30,8,0,0,TAU);c.fill();c.restore();
  if(s==='bender-stomp'&&p>=.6)dust(c,500+b.dir*22,425,(p-.6)/.4*.3,1);
  if(s==='bender-wall')dust(c,500+b.dir*38,425,.3+p*.7,1);
  if(s==='bender-punch'&&p>=.62)dust(c,500+b.dir*95,425,(p-.62)*.7,.8);
  if(s==='bender-barrage'&&p<.5)dust(c,500+b.dir*95,425,.27+p*1.4,.7);
 }
 if(o.layer==='actor'&&image.complete&&image.naturalWidth){const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(500,425);c.scale(b.dir,1);
  if(s==='bender-stomp'&&p>.6){const jolt=Math.sin(C((p-.6)/.4)*Math.PI);c.scale(1+jolt*.035,1-jolt*.035);}
  c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-85,-163,170,170);c.restore();
 }
 if(o.layer==='wall'&&b.wall>0){const h=b.wall*205;c.save();c.translate(500,425);c.scale(b.dir,1);
  poly(c,[[50,0],[140,0],[140,-h],[50,-h]],'#817b67');poly(c,[[140,0],[157,-11],[157,-h-11],[140,-h]],'#4f554c');poly(c,[[50,-h],[140,-h],[157,-h-11],[67,-h-11]],'#b4aa8f');
  poly(c,[[50,0],[50,-h],[89,-h],[72,-h*.48],[94,0]],'#96917a');poly(c,[[94,0],[72,-h*.48],[140,-h*.62],[140,0]],'#736f60');
  c.strokeStyle='#454e44';c.lineWidth=2;c.beginPath();c.moveTo(103,-h);c.lineTo(95,-h*.73);c.lineTo(114,-h*.48);c.lineTo(103,-h*.27);c.moveTo(95,-h*.73);c.lineTo(64,-h*.6);c.stroke();c.restore();
 }
}
function items(o){const b=pose(o),target=o.target||{x:800,y:450},out=[];if(b.burst<0)return out;
 for(let i=0;i<36;i++){
  const col=i%6,row=Math.floor(i/6),delay=i*5,flight=420+(i%5)*28,age=b.burst-delay;if(age<0){out.push({type:'rock',x:500+b.dir*(50+(col+.5)*15),y:425-(row+.5)*34,size:14,angle:0,seed:i,depthY:425});continue;}
  const q=age/flight;if(q<=1){const start={x:500+b.dir*(50+(col+.5)*15),y:425-(row+.5)*34},end={x:target.x+Math.sin(i*7.1)*29,y:target.y-100+Math.cos(i*3.7)*35};out.push({type:'rock',x:L(start.x,end.x,q),y:L(start.y,end.y,q)-Math.sin(q*Math.PI)*(14+i%4*9),size:L(14,8+i%3*2,q),angle:q*(i%2?4:-4),seed:i,depthY:L(425,target.y,q)-.1});}
  if(q>1&&age<flight+220)out.push({type:'impact',x:target.x+Math.sin(i*7.1)*29,y:target.y-100+Math.cos(i*3.7)*35,p:(age-flight)/220,seed:i,depthY:target.y+.1});
 }return out;}
function drawItem(c,a){c.save();c.translate(a.x,a.y);
 if(a.type==='rock'){c.rotate(a.angle);const r=a.size;poly(c,[[-r*.8,-r*.7],[r*.45,-r],[r,-r*.1],[r*.65,r*.8],[-r*.5,r]],a.seed%2?'#817d69':'#a49a80');poly(c,[[-r*.8,-r*.7],[r*.45,-r],[r*.1,r*.1],[-r*.5,r]],'#b9ae91');poly(c,[[r*.1,r*.1],[r,-r*.1],[r*.65,r*.8],[-r*.5,r]],'#5f6658');}
 else{c.globalAlpha*=1-a.p;for(let i=0;i<3;i++){const angle=i*2.399+a.seed,r=4+a.p*17,x=Math.cos(angle)*r,y=Math.sin(angle)*r;poly(c,[[x-2,y-2],[x+3,y],[x,y+3]],'#b8a98c');}}c.restore();}
root.WIZARDRY_STONE_BENDER_V83={pose,draw,items,drawItem,hitAt:()=>HIT_MS};
})(window);
