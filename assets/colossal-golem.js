/* Colossal Golem — 80 high-resolution, transparent low-poly pose frames.
   The amber-eyed boulder design is redrawn with individually articulated
   stone parts. No upscaled 64px sprite or baked matte. */
(()=>{
"use strict";
const COUNT=80,HIT=59/80,C=p=>Math.max(0,Math.min(1,p)),L=(a,b,t)=>a+(b-a)*t;
const E=p=>{p=C(p);return p*p*(3-2*p);},TAU=Math.PI*2,P=(x,y)=>({x,y});
const palette=["#292722","#3d3831","#504941","#62584b","#776b5a","#92816c","#aa9981","#c5b397","#decbb0"];
const tint=(i,offset=0)=>palette[Math.max(0,Math.min(palette.length-1,i+offset))];
function poly(g,pts,color){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fillStyle=color;g.fill();}
function line(g,pts,color,w){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.strokeStyle=color;g.lineWidth=w;g.lineJoin="bevel";g.lineCap="round";g.stroke();}
const rand=i=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n);};
function stone(g,x,y,rx,ry,angle,seed,shade=0){
 g.save();g.translate(x,y);g.rotate(angle);g.scale(rx,ry);
 const outer=[],rim=[];
 for(let i=0;i<9;i++){const a=-Math.PI*.83+i*TAU/9,r=.90+rand(seed+i*3)*.16,k=.55+rand(seed+i*8+70)*.19;outer.push([Math.cos(a)*r,Math.sin(a)*r]);rim.push([Math.cos(a)*r*k-.13,Math.sin(a)*r*k-.14]);}
 poly(g,outer,tint(2,shade));
 for(let i=0;i<9;i++){const j=(i+1)%9,ny=(outer[i][1]+outer[j][1])/2,nx=(outer[i][0]+outer[j][0])/2,lit=Math.round(4-ny*1.8-nx*.9+rand(seed+i*17)*1.15);poly(g,[outer[i],outer[j],rim[j],rim[i]],tint(lit,shade));poly(g,[rim[i],rim[j],[-.17,-.20]],tint(lit+1+(i%3===0?1:0),shade));}
 g.restore();
}
function link(g,a,b,width,seed,shade=0){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;stone(g,(a.x+b.x)/2,(a.y+b.y)/2,width,len*.65,Math.atan2(dy,dx)-Math.PI/2,seed,shade);}
const mix=(a,b,t)=>P(L(a.x,b.x,t),L(a.y,b.y,t));
function frameAt(p){return Math.min(COUNT-1,Math.floor(C(p)*COUNT));}
function footPose(f,offset,amplitude){
 const w=C((f-20)/24),ph=(w*2+offset)%1,blend=E(Math.min(w*8,(1-w)*8));
 return {x:(ph<.5?L(amplitude,-amplitude,ph*2):L(-amplitude,amplitude,(ph-.5)*2))*blend,
  lift:ph<.5?0:Math.sin((ph-.5)*2*Math.PI)*20*blend,planted:ph<.5};
}
function poseAt(f,amplitude=22){
 const i=Math.max(0,Math.min(COUNT-1,f|0)),rise=E((i-3)/13),handsRise=E(i/7);
 const walk=C((i-20)/24),walking=i>=20&&i<44,wind=E((i-43)/12),strike=E((i-55)/4),release=E((i-60)/8),collapse=E((i-68)/10);
 return {frame:i,rise,handsRise,walk,walking,near:footPose(i,0,amplitude),far:footPose(i,.5,amplitude),gait:walking?Math.sin(walk*4*Math.PI):0,bob:walking?-4*Math.abs(Math.sin(walk*4*Math.PI)):0,wind,strike,release,collapse,reach:wind*(1-release),clamp:strike*(1-release),opacity:1-E((i-77)/2)};
}
function scene(source,target,p,factor=1){
 p=C(p);const dir=source.team===0?1:-1,f=frameAt(p),k=Math.max(1.20,Math.min(2.10,1.28+.36*(factor-1)));
 const depthScale=.60+.30*C((target.y-288)/235),contactY=target.y-106*depthScale*factor,contactLocal=(contactY-(target.y+4))/k,reachX=104;
 const endX=target.x-dir*reachX*k,endY=target.y+4,startX=500-dir*42,startY=510;
 // Match world translation to the discrete footfall frame so a planted
 // foot does not drift between pose samples.
 const progress=C((f-20)/24),x=L(startX,endX,progress),y=L(startY,endY,progress);
 const amp=Math.max(8,Math.min(34,Math.hypot(endX-startX,endY-startY)/(8*k))),pose=poseAt(f,amp);
 return {x,y,dir,k,size:272*k,p,frame:f,pose,opacity:pose.opacity,contactX:target.x,contactY,contactLocal,reachX,targetY:target.y,
  backDepth:progress>=1?target.y-.22:y-.08,frontDepth:progress>=1?target.y+.04:y+.07};
}
function leg(g,hip,foot,near,seed){
 const dx=foot.x-hip.x,dy=foot.y-hip.y,knee=P(hip.x+dx*.54+(near?-8:8),hip.y+dy*.46);
 link(g,hip,knee,near?23:19,seed,near?0:-1);stone(g,knee.x,knee.y,near?22:18,22,-.20,seed+11,near?0:-1);link(g,knee,P(foot.x,foot.y-16),near?20:17,seed+21,near?0:-1);
 g.save();g.translate(foot.x,foot.y);
 const f=[[-26,-14],[-17,-30],[8,-31],[29,-19],[37,-6],[29,0],[-24,0],[-30,-5]],sh=near?0:-1;
 poly(g,f,tint(3,sh));poly(g,[f[0],f[1],f[2],[12,-15],[-12,-9]],tint(6,sh));poly(g,[f[2],f[3],f[4],[12,-15]],tint(5,sh));poly(g,[[12,-15],f[4],f[5],[-12,-9]],tint(4,sh));poly(g,[f[0],[-12,-9],f[5],f[6]],tint(2,sh));g.restore();
}
function torso(g,bob,lean){
 g.save();g.translate(lean,bob);stone(g,0,-91,36,36,-.08,31);
 const o=[[-57,-183],[-29,-210],[29,-207],[56,-183],[49,-139],[24,-105],[-11,-102],[-42,-123]];
 poly(g,o,"#39332b");poly(g,[o[0],o[1],[-4,-190],[-20,-153],[-49,-143]],"#8f7f69");poly(g,[o[1],o[2],o[3],[32,-175],[-4,-190]],"#b3a087");poly(g,[[-4,-190],[32,-175],[43,-142],[17,-132],[-20,-153]],"#82735f");poly(g,[o[3],o[4],o[5],[17,-132],[43,-142]],"#625849");poly(g,[[-49,-143],[-20,-153],[17,-132],[2,-111],o[6],o[7]],"#5c5245");poly(g,[[-20,-153],[17,-132],[2,-111],[-7,-136]],"#746654");poly(g,[[17,-132],o[5],o[6],[2,-111]],"#a08d74");
 const crack=[[-35,-167],[-21,-153],[-6,-146],[16,-149],[34,-161]];
 line(g,crack,"#513c24",4.8);line(g,crack,"#ce9238",2.2);line(g,[[-6,-146],[-9,-132],[-4,-121]],"#e1a440",2);line(g,[[16,-149],[24,-139],[21,-130]],"#af752b",1.7);
 stone(g,12,-202,27,13,-.10,45,-1);
 g.translate(19,-224);const h=[[-28,-13],[-16,-30],[8,-34],[29,-20],[34,-4],[24,15],[1,20],[-23,10]];
 poly(g,h,"#3b342c");poly(g,[h[0],h[1],h[2],h[3],[7,-15],[-11,-13]],"#ad9b82");poly(g,[h[0],[-11,-13],[-4,2],h[7]],"#6c5e4e");poly(g,[[7,-15],h[3],h[4],[13,-3],[-4,2],[-11,-13]],"#51483a");poly(g,[[13,-3],h[4],h[5],[6,8]],"#80715c");poly(g,[[-4,2],[13,-3],[6,8],h[5],h[6],h[7]],"#71624f");
 poly(g,[[-3,-10],[9,-8],[8,-3],[-2,-4]],"#ffd16a");poly(g,[[18,-10],[29,-12],[28,-6],[19,-5]],"#ffba3c");line(g,[[5,8],[18,7],[24,4]],"#332d26",2.4);g.restore();
}
function hand(g,p,angle,open,near,seed){
 g.save();g.translate(p.x,p.y);g.rotate(angle);const s=near?1.12:.96;g.scale(s,s);stone(g,-3,0,29,30,.1,seed,near?0:-1);
 for(let i=0;i<4;i++){const y=-20+i*13,len=(i===0||i===3?18:24),root=P(12,y),mid=P(17+open*len*.57,y+(i-1.5)*open*3.2),tip=P(15+open*len,y+(i-1.5)*open*6.2+(1-open)*4);link(g,root,mid,7.5,seed+30+i*8,near?1:0);stone(g,tip.x,tip.y,11,7.5,open*(i-1.5)*.16,seed+61+i*5,near?1:0);}
 const thumb=P(2+open*8,23+open*9);link(g,P(-11,13),thumb,10,seed+93,near?0:-1);stone(g,thumb.x,thumb.y,13,8,-.62,seed+99,near?1:0);g.restore();
}
function arm(g,near,p,s){
 const reach=p.reach,clamp=p.clamp,open=reach*(1-clamp),bob=p.bob,lean=p.reach*7,collapse=p.collapse,spread=near?-1:1;
 const shoulder=P((near?-45:47)+lean+spread*collapse*23,-174+bob+collapse*48),gait=p.gait*(near?-1:1);
 const idleElbow=P((near?-67:66)+gait*13,-121+bob),idleHand=P((near?-53:73)+gait*21,-84+bob);
 const goal=P(s.reachX+spread*L(50,22,clamp),s.contactLocal+spread*L(21,3,clamp)),elbowGoal=P(near?6:82,s.contactLocal-37+(near?8:-14));
 let elbow=mix(idleElbow,elbowGoal,reach),palm=mix(idleHand,goal,reach);
 elbow.x+=spread*collapse*28;elbow.y+=collapse*77;palm.x+=spread*collapse*44;palm.y+=collapse*110;
 if(p.frame<16){const lift=(1-p.handsRise)*130;shoulder.y+=(1-p.rise)*225;elbow.y+=lift;palm.y+=lift;palm.y-=Math.sin(p.handsRise*Math.PI)*36;}
 stone(g,shoulder.x,shoulder.y,near?37:29,near?35:29,near?-.31:.30,near?81:91,near?1:-1);link(g,shoulder,elbow,near?24:19,near?110:120,near?0:-1);stone(g,elbow.x,elbow.y,near?25:20,23,near?-.20:.20,near?131:141,near?0:-1);link(g,elbow,palm,near?29:24,near?151:161,near?0:-1);
 hand(g,palm,L(near?.74:.22,near?0:Math.PI,reach),p.frame<10?p.handsRise:open,near,near?171:191);
}
function model(g,s,layer){
 const p=s.pose,i=s.frame;if(p.opacity<=0)return;
 g.save();g.translate(s.x,s.y);g.scale(s.dir*s.k,s.k);g.globalAlpha*=p.opacity;
 if(i<16||i>=68){g.beginPath();g.rect(-260,-320,520,324);g.clip();}
 const drop=(1-p.rise)*225+p.collapse*160;
 if(layer==="back"){
  arm(g,false,p,s);g.save();g.translate(0,drop);const lean=p.reach*7;
  leg(g,P(20+lean,-91+p.bob),P(32+p.far.x,-p.far.lift),false,211);leg(g,P(-19+lean,-89+p.bob),P(-27+p.near.x,-p.near.lift),true,231);torso(g,p.bob,lean);g.restore();
 }else arm(g,true,p,s);
 g.restore();
}
function debris(g,s,layer){
 const p=s.pose,i=s.frame,foot=i>=20&&i<44&&((i-20)%6)<=2;let progress=0,power=0,impact=false;
 if(i<16){progress=i/16;power=Math.sin(Math.PI*progress)*.82;}else if(foot){progress=((i-20)%6)/3;power=.31;}else if(i>=59&&i<68){progress=(i-59)/9;power=1-progress;impact=true;}else if(i>=68){progress=(i-68)/12;power=1-progress;}
 if(power<=0)return;g.save();g.translate(impact?s.contactX:s.x,impact?s.contactY:s.y);g.globalAlpha*=power*.88;
 const k=s.k,front=layer==="front";
 for(let n=0;n<12;n++){if((n%2===0)!==front)continue;const r=rand(n+72),angle=n*2.399+1.6,spread=(15+progress*(impact?104:86))*k,x=Math.cos(angle)*spread*(.65+r*.35),y=impact?Math.sin(angle)*spread*.55:-Math.sin(progress*Math.PI)*k*(8+r*58);stone(g,x,y,(4+r*10)*k,(3+r*7)*k,angle+progress*3,n+500,front?0:-1);}
 if(!impact){g.globalAlpha*=.34;for(let n=0;n<8;n++){const x=(n-3.5)*18*k*(.6+progress*.8),y=-5*k-progress*(n%3)*7*k;stone(g,x,y,(12+rand(n+8)*12)*k,(5+progress*7)*k,n*.5,n+600,2);}}g.restore();
}
function draw(g,s,layer="all"){if(layer==="all"){model(g,s,"back");model(g,s,"front");return;}model(g,s,layer);}
function shake(p,hit=HIT){const q=(p-hit)/.065;if(q<0||q>=1)return{x:0,y:0};const a=(1-q)**2;return{x:Math.sin(q*43)*10*a,y:Math.cos(q*33)*7*a};}
function portrait(g,w,h){const k=Math.min(w/220,h/265)*.95,pose=poseAt(18);draw(g,{x:w*.48,y:h*.97,k,dir:1,pose,frame:18,contactLocal:-90,reachX:104});}
window.ColossalGolem={frameCount:COUNT,hit:HIT,frameAt,poseAt,scene,draw,debris,shake,portrait,ensure:()=>Promise.resolve(true),ready:()=>true,error:()=>""};
})();