/* Reef Rush v78.1: original approved shark art, continuous breach, faceted water. */
(function(root){
'use strict';
const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,S=p=>p*p*(3-2*p),TAU=Math.PI*2;
const image=new Image();image.src='./assets/reef-rush-v77.webp';
let registered;
function prepare(){
 if(registered||!image.complete||!image.naturalWidth)return;
 registered=[];const w=320,h=320,sw=image.naturalWidth/4,sh=image.naturalHeight/4;
 for(const [frame,angle] of [[4,0],[8,.29],[9,.43],[10,.63],[11,.28]]){
  const tile=document.createElement('canvas');tile.width=w;tile.height=h;const tc=tile.getContext('2d');
  tc.drawImage(image,(frame%4)*sw,Math.floor(frame/4)*sh,sw,sh,0,0,w,h);
  const data=tc.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const out=document.createElement('canvas');out.width=400;out.height=400;const c=out.getContext('2d');
  c.translate(200,200);c.rotate(angle);c.drawImage(tile,x0,y0,x1-x0+1,y1-y0+1,-(x1-x0+1)/2,-(y1-y0+1)/2,x1-x0+1,y1-y0+1);registered.push(out);
 }
}
function pose(o){
 const p=C(o.progress),target=o.target||{x:800,y:450},dir=target.x>=500?1:-1;
 const end={x:target.x-dir*70,y:target.y-157},floor=target.y+8;
 let x=500,y=416,groundY=416,angle=0,flex=0,phase=0,theta=Math.PI/2,height=1;
 const stage=o.stage;
 if(stage==='shark-fin')height=S(p);
 if(stage==='shark-swim')theta+=dir*3*Math.PI*p;
 if(stage==='shark-submerge'){theta+=dir*3*Math.PI;height=1-S(C(p/.72));}
 if(['shark-fin','shark-swim','shark-submerge'].includes(stage)){x=500+94*Math.cos(theta);y=416+28*Math.sin(theta);groundY=y;}
 if(['shark-rise','shark-flop','shark-arch'].includes(stage)){
  const elapsed=stage==='shark-rise'?650*p:stage==='shark-flop'?650+500*p:1150+550*p,t=elapsed/1700;
  x=L(500,end.x,t);y=L(448,end.y,t)-875*t*(1-t);groundY=L(388,floor,t);
  angle=t<.4?L(-1.30,-.85,S(t/.4)):L(-.85,1,S((t-.4)/.6));
  if(stage==='shark-flop')angle+=Math.sin(p*TAU)*.16;
  flex=Math.sin(t*TAU*2.5)*17;phase=t*13;
 }
 if(stage==='shark-chomp'){x=end.x;y=end.y;groundY=floor;angle=1;flex=4*Math.sin(p*Math.PI);phase=p*3;}
 if(stage==='shark-dive'){x=L(end.x,target.x+dir*6,p);y=L(end.y,floor+138,p);groundY=floor;angle=L(1,1.42,S(p));flex=Math.sin(p*TAU)*9;phase=p*5;}
 if(stage==='shark-splash'){x=target.x;y=floor;groundY=floor;}
 return{x,y,groundY,angle,flex,phase,theta,height,dir,stage,p,alpha:stage==='shark-splash'?0:1};
}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function rings(c,x,y,r,alpha){c.save();c.globalAlpha*=C(alpha);c.strokeStyle='#98eff0';c.lineWidth=2;
 for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y,r+i*10,(r+i*10)*.28,0,0,TAU);c.stroke();}c.restore();}
function fin(c,b){
 const f={x:-Math.sin(b.theta)*b.dir,y:Math.cos(b.theta)*b.dir},side={x:-f.y,y:f.x};
 const project=(along,across,z)=>[b.x+f.x*along+side.x*across,b.y+(f.y*along+side.y*across)*.3-z*b.height];
 const front=project(25,0,0),a=project(-7,-3,52),d=project(-7,3,52),rearA=project(-25,-3,0),rearB=project(-25,3,0);
 poly(c,[front,a,rearA],f.x>=0?'#536f8a':'#7c9bb5');poly(c,[front,d,rearB],f.x>=0?'#91a8b8':'#3c566e');poly(c,[a,d,rearB,rearA],'#45657b');
}
function pool(c,x,y,r,alpha){c.save();c.globalAlpha*=C(alpha);const points=[];for(let i=0;i<14;i++){const a=i/14*TAU;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r*.28]);}poly(c,points,'#116e9d75');
 for(let i=0;i<7;i++){const a=i*TAU/7;poly(c,[[x,y],[x+Math.cos(a)*r,y+Math.sin(a)*r*.28],[x+Math.cos(a+.6)*r,y+Math.sin(a+.6)*r*.28]],i%2?'#50cad92b':'#8cf5ef25');}c.restore();}
function wake(c,b){
 pool(c,500,416,114,.65);
 for(let lane=0;lane<3;lane++){
  c.save();c.strokeStyle=lane===0?'#d8ffffba':'#49cceba8';c.lineWidth=lane===0?3:5;c.beginPath();
  for(let n=0;n<38;n++){const a=b.theta-b.dir*n*.025,r=94+(lane-1)*11,x=500+r*Math.cos(a),y=416+r*.30*Math.sin(a);n?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
 }
 for(let i=0;i<18;i++){const age=((b.p*4+i/18)%1),a=b.theta-b.dir*age*.95,r=94+Math.sin(i*2.4)*15;
  c.save();c.globalAlpha*=1-age;const x=500+r*Math.cos(a),y=416+r*.3*Math.sin(a)-Math.sin(age*Math.PI)*(4+i%4);poly(c,[[x-3,y],[x,y-3],[x+4,y],[x,y+2]],i%3?'#93ecf6':'#f1ffff');c.restore();
 }rings(c,b.x,b.y,22,.65);
}
function splash(c,x,y,q,strength=1,big=1){
 if(q<0||q>1)return;const alpha=(1-q)*strength;
 pool(c,x,y,(36+90*q)*big,alpha*.8);rings(c,x,y,(20+110*q)*big,alpha);
 // Broad faceted sheets spread, fall and collapse into the floor.
 for(let i=0;i<9;i++){const a=i*TAU/9,spread=(16+65*q)*big,px=x+Math.cos(a)*spread,py=y+Math.sin(a)*spread*.27;
  const height=Math.sin(Math.PI*Math.min(1,q*1.25))*(40+i%3*15)*big;
  c.save();c.globalAlpha*=alpha*.8;poly(c,[[px-13,py],[px-8,py-height*.65],[px+Math.cos(a)*12,py-height],[px+13,py-height*.35],[px+19,py]],i%2?'#51c9e2':'#a1ecf5');poly(c,[[px-8,py-height*.65],[px+Math.cos(a)*12,py-height],[px+6,py-height*.5]],'#e2ffff');c.restore();
 }
 for(let i=0;i<48;i++){const a=i*2.399,velocity=(35+i%7*13)*big,flight=q*1.25,dx=Math.cos(a)*velocity*flight;
  const dy=Math.sin(a)*velocity*.24*flight-(65+i%5*15)*big*flight+115*big*flight*flight;
  const px=x+dx,py=y+dy;if(py>y+18)continue;
  c.save();c.globalAlpha*=alpha;c.translate(px,py);c.rotate(Math.atan2(dy,dx));const sz=(2+i%3)*big;poly(c,[[-sz*1.7,0],[0,-sz*.65],[sz*1.8,0],[0,sz*.65]],i%3?'#70deef':'#edffff');c.restore();
 }
}
function actor(c,b){
 if(['shark-fin','shark-swim','shark-submerge'].includes(b.stage)){fin(c,b);return;}
 if(b.stage==='shark-splash')return;prepare();if(!registered)return;
 c.save();if(b.stage==='shark-rise'||b.stage==='shark-dive'){c.beginPath();c.rect(0,0,1000,b.groundY);c.clip();}
 c.translate(b.x,b.y);c.scale(b.dir,1);c.rotate(b.angle);
 const index=b.stage==='shark-chomp'?(b.p<.55?3:4):b.stage==='shark-dive'?4:b.stage==='shark-arch'?3:b.stage==='shark-flop'?2:1,size=310;
 for(let px=0;px<400;px+=3){const sw=Math.min(3,400-px),u=px/400,tail=Math.max(0,(.58-u)/.58),offset=Math.sin(u*5+b.phase)*tail*b.flex;c.drawImage(registered[index],px,0,sw,400,-size/2+px*size/400,-size/2+offset,sw*size/400+.6,size);}c.restore();
}
function draw(c,o){
 const b=pose(o),p=b.p,s=b.stage,t=o.target||{x:800,y:450};
 if(o.layer==='water'){
  if(s==='shark-fin'){pool(c,500,416,36+30*p,.5*p);rings(c,b.x,b.y,12+18*p,.3+.5*p);}
  if(s==='shark-swim')wake(c,b);
  if(s==='shark-submerge'){pool(c,500,416,100,1-p);rings(c,b.x,b.y,28+35*p,1-p);}
  if(s==='shark-rise')splash(c,500,388,C(p*.9),1,1.05);
  if(s==='shark-flop')splash(c,500,388,.9+.1*p,.6,1.05);
 }
 if(o.layer==='actor')actor(c,b);
 if(o.layer==='splash'){
  if(s==='shark-rise'&&p>.15){const q=(p-.15)/.85;c.save();c.globalAlpha*=.65*(1-q);for(let i=0;i<12;i++){const x=b.x+Math.sin(i*2.4)*32,y=b.y+40+q*95+i%4*9;poly(c,[[x-2,y],[x,y-7],[x+3,y],[x,y+5]],'#b0f5ff');}c.restore();}
  // One uninterrupted impact clock spans dive and splash stages.
  if(s==='shark-dive'&&p>=.25)splash(c,t.x,t.y+8,(p-.25)*520/(.75*520+450),1,1.4);
  if(s==='shark-splash')splash(c,t.x,t.y+8,(.75*520+p*450)/(.75*520+450),1,1.4);
 }
}
root.WIZARDRY_REEF_RUSH_V77={draw,pose,depthFor:(o,layer)=>{const b=pose(o);return layer==='water'?b.groundY-2:layer==='splash'?((o.target?.y||450)+.1):b.groundY-8;}};
})(window);
