/* Wind Dome: faceted, rapidly rotating wind enclosing the caster. No audio. */
(function(root){'use strict';
const T=Math.PI*2,C=x=>Math.max(0,Math.min(1,x));
function scaleAt(y){return .60+.30*C((y-288)/235);}
function envelope(p){const q=C(p);return q<.18?q/.18:q<.40?1+(q-.18)/.22*.18:q>.74?1.18-(q-.74)/.26*.18:1.18;}
function point(theta,phi,r,h){return{x:Math.cos(phi)*r*Math.sin(theta),y:-Math.cos(theta)*h+Math.sin(phi)*r*Math.sin(theta)*.27,z:Math.sin(phi)};}
function path(c,points,front){let pen=false;for(const p of points){if((p.z>=0)!==front){pen=false;continue;}if(pen)c.lineTo(p.x,p.y);else{c.moveTo(p.x,p.y);pen=true;}}}
function emblem(c,x,y,size,alpha=1,time=0){c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha*=alpha;c.strokeStyle='#c9fff2';c.shadowColor='#71dbc8';c.shadowBlur=4;c.lineWidth=2;
 c.beginPath();c.arc(0,0,47,0,T);c.stroke();for(let j=0;j<3;j++){c.beginPath();for(let i=0;i<=30;i++){const u=i/30,a=u*T*1.05+j*T/3+time,r=5+u*31;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}c.restore();}
function draw(c,{target,time=0,progress=1,mode='active',layer='front',age=0}){if(!target)return;
 const front=layer==='front',s=scaleAt(target.y),p=C(progress),block=mode==='block',cast=mode==='cast';
 const q=block?C(age/.62):0,expand=block?1+q*.62:cast?envelope(p):1,alpha=block?(1-q)**1.2:cast?Math.min(1,p/.10):.32;
 if(alpha<=0)return;const r=145*expand,h=198*expand,phase=time*.026+(block?q*8:0);
 c.save();c.translate(target.x,target.y+3*s);c.scale(s,s);c.globalAlpha*=alpha;
 // Flat translucent facets leave the protected wizard visible inside the dome.
 for(let row=0;row<6;row++)for(let j=0;j<20;j++){const a=j*T/20+phase*.045,b=a+T/20,t0=row*Math.PI/12,t1=(row+1)*Math.PI/12,mid=point((t0+t1)/2,(a+b)/2,r,h);if((mid.z>=0)!==front)continue;
  const pts=[point(t0,a,r,h),point(t1,a,r,h),point(t1,b,r,h),point(t0,b,r,h)];c.fillStyle=(row+j)%3?'#9ff5e509':'#d7fff411';c.beginPath();pts.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();}
 // Broad helical ribbons rotate across the hemisphere, split behind/in front.
 for(let j=0;j<4;j++){const pts=[];for(let i=0;i<=78;i++){const u=i/78,theta=.04+u*(Math.PI/2-.04),phi=phase+j*T/4+u*T*.85;pts.push(point(theta,phi,r,h));}
  c.lineJoin='bevel';c.lineCap='butt';c.strokeStyle=j%3?'#c9fff0':'#f4fff9';c.lineWidth=(block?6:cast?6:2.2)*(j%3===0?1.3:1);c.beginPath();path(c,pts,front);c.stroke();
  if(mode!=='active'){c.strokeStyle='#73d9c0';c.lineWidth=1;c.beginPath();path(c,pts,front);c.stroke();}}
 // Fast, broken latitude currents give the dome a sharp spinning silhouette.
 for(let row=1;row<=7;row++){const pts=[],theta=row*Math.PI/14;
  // Tapered bands of compressed air, rather than a rigid wire cage.
  for(let i=0;i<48;i++){const u=i/48,v=(i+1)/48,a=phase*1.3+row*.7+u*T*.80,b=phase*1.3+row*.7+v*T*.80,half=(.042+row*.004)*Math.sin((u+v)/2*Math.PI)**.7;
   if((point(theta,(a+b)/2,r,h).z>=0)!==front)continue;
   const strip=[point(Math.max(0,theta-half),a,r,h),point(Math.min(Math.PI/2,theta+half),a,r,h),point(Math.min(Math.PI/2,theta+half),b,r,h),point(Math.max(0,theta-half),b,r,h)];
   c.fillStyle=row%2?'#d3fff2a0':'#a2ebd879';c.beginPath();strip.forEach((pt,k)=>k?c.lineTo(pt.x,pt.y):c.moveTo(pt.x,pt.y));c.closePath();c.fill();}
for(let i=0;i<=65;i++){const phi=phase*1.3+row*.7+i/65*T*.80;pts.push(point(theta,phi,r*1.015,h));}c.lineWidth=row===7?3:1.3;c.strokeStyle=row%2?'#a0e8d5':'#f0fff6';c.beginPath();path(c,pts,front);c.stroke();}
 if(front){
  c.strokeStyle='#d7fff0';c.lineWidth=2;c.beginPath();c.ellipse(0,0,r,30*expand,0,0,Math.PI);c.stroke();
  if(cast||block){const shock=cast?C((p-.18)/.35):q;c.globalAlpha*=1-shock*.7;c.strokeStyle='#c3f5dc';c.lineWidth=3;c.beginPath();c.ellipse(0,2,36+shock*155,10+shock*40,0,0,T);c.stroke();
   for(let i=0;i<22;i++){const a=i*2.399+phase*.12,rr=50+shock*140,x=Math.cos(a)*rr,y=Math.sin(a)*rr*.26-12*Math.sin(shock*Math.PI);c.fillStyle=i%3?'#b5d5b4':'#eaffda';c.beginPath();c.moveTo(x-3,y);c.lineTo(x+6,y-2);c.lineTo(x+3,y+3);c.closePath();c.fill();}}
 }
 c.restore();}
function portrait(c,w,h){c.save();c.translate(w*.5,h*.95);const k=Math.min(w/360,h/260);c.scale(k,k);c.save();c.scale(1/.6,1/.6);draw(c,{target:{x:0,y:0},mode:'cast',progress:.55,time:780,layer:'back'});draw(c,{target:{x:0,y:0},mode:'cast',progress:.55,time:780,layer:'front'});c.restore();emblem(c,0,-50,42);c.restore();}
root.WIZARDRY_WIND_DOME_V101={draw,emblem,portrait,point,envelope,scaleAt};
})(window);
