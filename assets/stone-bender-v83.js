/* Stone Bender: forward-foot stomp, rising rectangular wall, shattering punch. */
(function(root){
'use strict';const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,TAU=Math.PI*2;
const image=new Image();image.src='./assets/stone-bender-v83.webp?v=0.83.1';
const HIT_MS=90;
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function pose(o){const p=C(o.progress),s=o.stage,t=o.target||{x:800,y:450};let frame=0,alpha=1,wall=0,burst=-1;
 if(s==='bender-appear')alpha=C(p*2);
 if(s==='bender-stance')frame=p<.4?2:3;
 if(s==='bender-stomp'){frame=3;wall=C((p-.6)/.4)*.25;}
 if(s==='bender-wall'){frame=3;wall=L(.25,1,p);}
 if(s==='bender-punch'){frame=p<.45?6:7;wall=1;if(p>=.62){wall=0;burst=p*250-155;}}
 if(s==='bender-barrage'){frame=p<.45?8:9;burst=95+p*550;}
 if(s==='bender-exit'){frame=p<.5?10:11;alpha=1-p;}
 return{x:500,y:425,dir:t.x>=500?1:-1,frame,alpha,wall,burst};}
// Move only the existing forward leg; the support foot and torso keep their stance.
function frontLegAngle(o){if(o.stage!=='bender-stomp')return 0;const p=C(o.progress);return p<.42?-.8*Math.sin(p/.42*Math.PI/2):p<.5?-.8:p<.6?-.8*(1-((p-.5)/.1)**2):0;}
function legPath(c){const points=[[.60,.58],[.78,.60],[.91,.70],[.85,.85],[.96,.91],[.98,.99],[.74,.99],[.68,.86],[.62,.77],[.55,.70]];c.moveTo(-85+points[0][0]*170,-163+points[0][1]*170);for(let i=1;i<points.length;i++)c.lineTo(-85+points[i][0]*170,-163+points[i][1]*170);c.closePath();}
function actor(c,o,b,w,h){
 const draw=()=>c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-85,-163,170,170);
 if(o.stage!=='bender-stomp'){draw();return;}
 c.save();c.beginPath();c.rect(-200,-260,400,300);legPath(c);c.clip('evenodd');draw();c.restore();
 c.save();const hip={x:20,y:-61};c.translate(hip.x,hip.y);c.rotate(frontLegAngle(o));c.translate(-hip.x,-hip.y);c.beginPath();legPath(c);c.clip();draw();c.restore();
}
const noise=n=>{const x=Math.sin(n*127.1+41.7)*43758.5453;return x-Math.floor(x);};
function stoneWall(c,b){
 const h=b.wall*205;c.save();c.beginPath();c.rect(0,0,1000,425);c.clip();c.translate(500,425+205-h);c.scale(b.dir,1);
 const face=[[50,0],[140,0],[143,-42],[138,-76],[141,-119],[138,-171],[134,-202],[120,-206],[109,-201],[84,-205],[63,-201],[50,-194],[48,-146],[52,-109],[49,-64]];
 poly(c,[[140,0],[158,-12],[157,-56],[155,-92],[160,-143],[153,-207],[134,-202],[138,-171],[141,-119],[138,-76],[143,-42]],'#4e574f');
 poly(c,[[50,-194],[63,-201],[84,-205],[109,-201],[120,-206],[134,-202],[153,-207],[133,-217],[112,-214],[99,-217],[71,-213]],'#a6aa9c');
 poly(c,face,'#878c7d');c.save();c.beginPath();face.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 const palette=['#939787','#818879','#a0a393','#777f72','#8a8f7d','#969a89'];
 for(let row=0;row<9;row++)for(let col=0;col<5;col++){
  const id=row*5+col,x=48+col*19,y=-216+row*27,shift=(noise(id+3)-.5)*9;
  poly(c,[[x,y],[x+20,y-3],[x+19+shift,y+25]],palette[Math.floor(noise(id+20)*palette.length)]);
  poly(c,[[x,y],[x+19+shift,y+25],[x-3,y+28]],palette[Math.floor(noise(id+80)*palette.length)]);
 }
 // Dense mineral grain, pitted pockets and chipped light-catching edges.
 for(let i=0;i<270;i++){
  const x=50+noise(i*3)*90,y=-205+noise(i*3+1)*205,r=.45+noise(i*3+2)*1.5;
  c.fillStyle=i%5===0?'#c0c2ac':i%3===0?'#5b6659':'#727c69';c.globalAlpha=i%5===0?.65:.55;c.fillRect(x,y,r,r*.65);
  if(i%19===0){c.globalAlpha=.55;poly(c,[[x-2,y],[x+3,y-1],[x+1,y+4],[x-2,y+3]],'#4d594c');c.fillStyle='#b1b6a1';c.fillRect(x-2,y+3,3,.8);}
 }c.globalAlpha=1;
 const cracks=[[[110,-207],[102,-183],[108,-162],[94,-143],[100,-125],[88,-102],[98,-83],[93,-56],[104,-35],[99,-5]],[[94,-143],[75,-150],[66,-141],[51,-143]],[[98,-83],[120,-77],[138,-88]],[[102,-183],[125,-172],[138,-176]]];
 for(const pts of cracks){c.strokeStyle='#3e4b40';c.lineWidth=2.7;c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.strokeStyle='#b0b49e';c.lineWidth=.8;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x+1.7,y+1):c.moveTo(x+1.7,y+1));c.stroke();}
 c.strokeStyle='#c1c1a8';c.globalAlpha=.35;c.lineWidth=.8;for(let i=0;i<4;i++){const y=-40-i*43;c.beginPath();c.moveTo(54,y);c.lineTo(73,y-8);c.lineTo(91,y-4);c.stroke();}c.globalAlpha=1;c.restore();
 poly(c,[[50,-194],[63,-201],[70,-193],[58,-187]],'#b3b5a2');poly(c,[[134,-202],[153,-207],[148,-194],[138,-187]],'#697562');poly(c,[[143,-42],[158,-53],[156,-40],[140,-30]],'#65725e');
 c.strokeStyle='#384a3c';c.lineWidth=1;c.beginPath();c.moveTo(151,-177);c.lineTo(145,-143);c.lineTo(155,-120);c.moveTo(151,-85);c.lineTo(145,-67);c.stroke();c.restore();
}
function dust(c,x,y,p,strength=1){if(p<0||p>1)return;c.save();c.globalAlpha*=strength*(1-p);c.strokeStyle='#c7b895a0';c.lineWidth=3;c.beginPath();c.ellipse(x,y,12+130*p,4+32*p,0,0,TAU);c.stroke();
 for(let i=0;i<18;i++){const a=i*2.399,px=x+Math.cos(a)*(17+105*p),py=y+Math.sin(a)*15-24*Math.sin(p*Math.PI),r=6+13*p;const haze=c.createRadialGradient(px,py,0,px,py,r);haze.addColorStop(0,'#c1aa7f95');haze.addColorStop(1,'#ae987000');c.fillStyle=haze;c.beginPath();c.ellipse(px,py,r,r*.65,a,0,TAU);c.fill();}c.restore();}
function draw(c,o){const p=C(o.progress),s=o.stage,b=pose(o);
 if(o.layer==='ground'){
  c.save();c.globalAlpha*=b.alpha*.3;c.fillStyle='#12212a';c.beginPath();c.ellipse(500,427,30,8,0,0,TAU);c.fill();c.restore();
  if(s==='bender-stomp'&&p>=.6)dust(c,500+b.dir*48,425,(p-.6)/.4*.3,1);
  if(s==='bender-wall')dust(c,500+b.dir*38,425,.3+p*.7,1);
  if(s==='bender-punch'&&p>=.62)dust(c,500+b.dir*95,425,(p-.62)*.7,.8);
  if(s==='bender-barrage'&&p<.5)dust(c,500+b.dir*95,425,.27+p*1.4,.7);
 }
 if(o.layer==='actor'&&image.complete&&image.naturalWidth){const w=image.naturalWidth/4,h=image.naturalHeight/3;c.save();c.globalAlpha*=b.alpha;c.translate(500,425);c.scale(b.dir,1);
  actor(c,o,b,w,h);c.restore();
 }
 if(o.layer==='wall'&&b.wall>0)stoneWall(c,b);
}
function items(o){const b=pose(o),target=o.target||{x:800,y:450},out=[];if(b.burst<0)return out;
 // Thick blocks burst almost simultaneously and cross the arena in about 0.2 seconds.
 for(let i=0;i<24;i++){
  const col=i%4,row=Math.floor(i/4),delay=(i%4)*7,flight=185+(i%3)*12,age=b.burst-delay;
  const start={x:500+b.dir*(50+(col+.5)*22.5),y:425-(row+.5)*34},end={x:target.x+Math.sin(i*7.1)*22,y:target.y-95+Math.cos(i*3.7)*26};
  const q=C(age/flight),dx=end.x-start.x,dy=end.y-start.y,len=Math.max(1,Math.hypot(dx,dy));
  if(age<=flight)out.push({type:'rock',x:L(start.x,end.x,q),y:L(start.y,end.y,q),size:L(18,13,q),angle:q*(i%2?.55:-.55),seed:i,vx:dx/len,vy:dy/len,depthY:L(425,target.y,q)-.1});
  if(age>flight&&age<flight+240)out.push({type:'impact',x:end.x,y:end.y,p:(age-flight)/240,seed:i,depthY:target.y+.1});
 }return out;}
function drawItem(c,a){c.save();c.translate(a.x,a.y);
 if(a.type==='rock'){
  // Dust streaks point backward along the actual launch velocity.
  for(let j=3;j>0;j--){c.save();c.globalAlpha*=.07+j*.035;c.strokeStyle='#b4aa91';c.lineWidth=3+j*2;c.lineCap='round';c.beginPath();c.moveTo(-a.vx*7,-a.vy*7);c.lineTo(-a.vx*(22+j*9),-a.vy*(22+j*9));c.stroke();c.restore();}
  c.rotate(a.angle);const r=a.size;
  // Solid, bevelled three-dimensional chunks with a dark side face, not flat triangles.
  poly(c,[[-r*.75,-r*.7],[r*.4,-r*.85],[r*.9,-r*.45],[r*.85,r*.65],[-r*.4,r*.85],[-r*.8,r*.3]],a.seed%2?'#8b826d':'#a39a82');
  poly(c,[[r*.4,-r*.85],[r*.9,-r*.45],[r*.85,r*.65],[r*.55,r*.9],[r*.45,r*.05]],'#50564b');
  poly(c,[[-r*.75,-r*.7],[r*.4,-r*.85],[r*.9,-r*.45],[r*.1,-r*.3],[-r*.8,-r*.1]],'#c0b599');
  poly(c,[[-r*.8,-r*.1],[r*.1,-r*.3],[r*.45,r*.05],[-r*.4,r*.85],[-r*.8,r*.3]],'#918a73');
  c.strokeStyle='#656a58';c.lineWidth=1;c.beginPath();c.moveTo(-r*.3,-r*.45);c.lineTo(-r*.1,0);c.lineTo(-r*.35,r*.35);c.stroke();
 }else{
  c.globalAlpha*=1-a.p;const r=7+a.p*23,haze=c.createRadialGradient(0,0,0,0,0,r);haze.addColorStop(0,'#b9a78785');haze.addColorStop(1,'#b9a78700');c.fillStyle=haze;c.beginPath();c.ellipse(0,0,r,r*.8,0,0,TAU);c.fill();
  for(let i=0;i<4;i++){const angle=i*2.399+a.seed,rr=5+a.p*31,x=Math.cos(angle)*rr,y=Math.sin(angle)*rr;poly(c,[[x-3,y-2],[x+4,y],[x+1,y+4],[x-3,y+2]],i%2?'#736e5c':'#b8a98c');}
 }c.restore();}
root.WIZARDRY_STONE_BENDER_V83={pose,draw,items,drawItem,frontLegAngle,hitAt:()=>HIT_MS};
})(window);
