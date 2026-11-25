/* Magnetic Pulse: isolated low-poly metal artwork; independent 24-frame
   electrical charge, directional pulse and impact layers. */
(()=>{
"use strict";
const C=256,R=256,atlas=new Image(),clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
let pending=null,lastError="",pieces=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1536&&atlas.naturalHeight===1024;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 pending=new Promise(resolve=>{
   const timer=setTimeout(()=>{lastError="Magnetic Pulse artwork timed out";resolve(false);},12000);
   atlas.onload=()=>{clearTimeout(timer);lastError=ready()?"":"Unexpected Magnetic Pulse atlas dimensions";resolve(ready());if(ready())try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
   atlas.onerror=()=>{clearTimeout(timer);lastError="Unable to load Magnetic Pulse artwork";resolve(false);};
   atlas.src="./assets/magnetic-pulse-frames.webp?v=1";
 }).finally(()=>pending=null);
 return pending;
}
// Trace only the four metal parts of the clean assembly pose (frame 5).
// Exclude the surrounding mist, lightning and open center from every piece.
const outlines=[
 [[56,108],[61,95],[69,82],[81,69],[95,60],[112,54],[130,51],[147,54],[165,60],[180,71],[192,84],[201,97],[203,108],[183,112],[178,99],[169,90],[156,85],[143,82],[130,81],[117,82],[101,85],[88,91],[78,101],[72,112]],
 [[58,163],[78,158],[82,171],[94,181],[107,188],[121,193],[138,193],[151,189],[164,181],[176,171],[181,159],[202,164],[195,178],[185,191],[172,201],[157,209],[142,216],[126,217],[111,214],[96,209],[81,199],[69,185],[61,172]],
 [[39,118],[46,113],[71,113],[88,118],[96,124],[96,128],[71,128],[66,131],[66,146],[94,147],[94,153],[77,160],[48,161],[39,156]],
 [[163,121],[173,116],[199,113],[214,113],[220,119],[221,153],[215,160],[185,160],[164,153],[164,147],[195,147],[195,130],[163,128]]
];
function initPieces(){
 if(pieces||!ready())return;
 pieces=outlines.map(poly=>{
   const layer=document.createElement("canvas");layer.width=C;layer.height=R;
   const ctx=layer.getContext("2d");ctx.beginPath();
   poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
   ctx.closePath();ctx.clip();
   ctx.drawImage(atlas,5*C,0,C,R,0,0,C,R);
   return layer;
 });
}
// Twenty-four frame-indexed states keep the ring anchored while its
// individual facets assemble, hover, recoil and dissolve.
const offsets=[[0,-1],[0,1],[-1,0],[1,0]];
function scene(source,target,p){
 p=clamp(p);
 const dir=target.x>=source.x?1:-1,size=180;
 const hit={x:target.x,y:target.y-100};
 const x=hit.x-dir*210,y=hit.y-4;
 return {x,y,hit,dir,size,p,frame:Math.min(23,Math.floor(p*24))};
}
function metal(g,s,assembly,opacity,recoil){
 initPieces();if(!pieces)return;
 g.save();g.translate(s.x-s.dir*recoil,s.y);g.scale(s.dir*s.size/C,s.size/R);
 g.globalAlpha*=opacity;
 for(let i=0;i<4;i++){
   const [dx,dy]=offsets[i];
   g.drawImage(pieces[i],-128+dx*(1-assembly)*47,-134+dy*(1-assembly)*47);
 }
 g.restore();
}
function draw(g,s){
 if(!ready())return;
 const f=s.frame,p=s.p;
 const assembly=ease((f-1)/5),opacity=ease((p-.035)/.17)*(1-ease((p-.82)/.18));
 const recoil=9*Math.sin(Math.PI*clamp((p-.46)/.20));
 metal(g,s,assembly,opacity,recoil);
}
// Charge, wave and hit use their own discrete electrical frame cycle.
// Polygonal strokes create faceted cyan lightning without a rectangular haze.
const JITTER=[0,5,-3,8,-5,3,-8,2,6,-4,1,-6];
function arc(g,rx,ry,start,end,phase,width,alpha){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.lineJoin="round";g.lineCap="round";
 g.beginPath();
 const segments=18;
 for(let i=0;i<=segments;i++){
   const a=start+(end-start)*i/segments;
   const n=JITTER[(i+phase)%JITTER.length]*.44;
   const x=(rx+n)*Math.cos(a),y=(ry+n*.65)*Math.sin(a);
   if(i===0)g.moveTo(x,y);else g.lineTo(x,y);
 }
 g.strokeStyle="rgba(23,115,255,.30)";g.lineWidth=width*3.5;g.stroke();
 g.strokeStyle="#48caff";g.lineWidth=width*1.8;g.stroke();
 g.strokeStyle="#d6faff";g.lineWidth=width*.68;g.stroke();g.restore();
}
// Independent electric filaments, pulses, body impact and rune destruction.
function bolt(g,x1,y1,x2,y2,phase,width=3,alpha=1,spread=10,branch=true){
 if(alpha<=0)return;
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);
 if(len<1)return;
 const nx=-dy/len,ny=dx/len,n=Math.max(4,Math.ceil(len/14)),points=[];
 for(let i=0;i<=n;i++){
   const t=i/n,j=i===0||i===n?0:JITTER[(i*5+phase)%12]*spread/8;
   points.push([x1+dx*t+nx*j,y1+dy*t+ny*j]);
 }
 g.save();g.globalAlpha*=alpha;g.lineCap="round";g.lineJoin="round";
 g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
 g.strokeStyle="rgba(24,112,255,.34)";g.lineWidth=width*5;g.stroke();
 g.strokeStyle="#28bfff";g.lineWidth=width*2.5;g.stroke();
 g.strokeStyle="#8eeeff";g.lineWidth=width*1.2;g.stroke();
 g.strokeStyle="#f2ffff";g.lineWidth=width*.55;g.stroke();
 if(branch)for(let i=1;i<n-1;i+=3){
   const [x,y]=points[i],sign=(i+phase)%2?1:-1;
   const bx=x+nx*sign*(12+spread*.65)+dx/len*9,by=y+ny*sign*(12+spread*.65)+dy/len*9;
   g.beginPath();g.moveTo(x,y);g.lineTo((x+bx)/2+nx*sign*3,(y+by)/2+ny*sign*3);g.lineTo(bx,by);
   g.strokeStyle="#52cfff";g.lineWidth=width*.8;g.stroke();
 }
 g.restore();
}
function spark(g,x,y,angle,len,alpha,width=3){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.translate(x,y);g.rotate(angle);
 g.fillStyle="#35baff";g.beginPath();g.moveTo(-len*.62,0);g.lineTo(0,-width*1.8);g.lineTo(len*.38,0);g.lineTo(0,width*1.8);g.closePath();g.fill();
 g.fillStyle="#e7ffff";g.beginPath();g.moveTo(-len*.46,0);g.lineTo(0,-width*.58);g.lineTo(len*.29,0);g.lineTo(0,width*.58);g.closePath();g.fill();g.restore();
}
function glow(g,x,y,r,a){
 if(a<=0)return;
 g.save();g.globalAlpha*=a;
 const gr=g.createRadialGradient(x,y,0,x,y,r);
 gr.addColorStop(0,"rgba(248,255,255,.98)");gr.addColorStop(.25,"rgba(137,238,255,.86)");gr.addColorStop(.6,"rgba(26,146,255,.38)");gr.addColorStop(1,"rgba(22,87,255,0)");
 g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore();
}
function charge(g,s){
 if(s.p<.065||s.p>=.65)return;
 const t=ease((s.p-.065)/.34),fade=1-ease((s.p-.52)/.13),a=t*fade,f=Math.floor(s.p*100);
 g.save();g.translate(s.x,s.y);
 for(let k=0;k<3;k++){
   const ang=f*(k%2?-.23:.31)+k*2.09;
   arc(g,48+k*8,37+k*8,ang,ang+Math.PI*(.9+k*.13),f+k*5,2.4+t*1.5,a*(1-k*.19));
 }
 for(let k=0;k<3;k++)bolt(g,-42,-5+k*6,42,3-k*5,f+k*3,2.6+k*.3,a*(1-k*.19),9+k*3);
 glow(g,0,0,(8+14*t+3*Math.sin(f*.9))*2.3,a);
 for(let k=0;k<13;k++){
   const ang=k*2.39996+f*.24,rr=36+((k*17+f*4)%30);
   spark(g,Math.cos(ang)*rr,Math.sin(ang)*rr*.78,ang+Math.PI/2,9+(k%4)*3,a*.8,1.5);
 }
 g.restore();
}
function pulse(g,s){
 const start=.46,arrival=16/24;
 if(s.p<start||s.p>arrival+.11)return;
 const u=clamp((s.p-start)/(arrival-start)),f=Math.floor(s.p*110);
 const ox=s.x+s.dir*52,oy=s.y,fade=1-ease((s.p-arrival)/.11);
 for(let k=3;k>=0;k--){
   const q=u-k*.16;if(q<0)continue;
   const v=clamp(q),x=ox+(s.hit.x-ox)*v,y=oy+(s.hit.y-oy)*v;
   const size=19+v*36,alpha=fade*(1-k*.19)*ease(v/.08);
   g.save();g.translate(x,y);g.scale(s.dir,1);
   arc(g,size*.45,size,-Math.PI*.75,Math.PI*.75,f+k*3,4.6-k*.65,alpha);
   arc(g,size*.27,size*.83,-Math.PI*.69,Math.PI*.69,f+k*3+5,2.3,alpha*.84);
   for(let n=0;n<5;n++){
     const ang=-1.4+n*.70,r=size*(.85+(n%2)*.16);
     const bx=Math.cos(ang)*r*.42,by=Math.sin(ang)*r;
     bolt(g,bx,by,bx-16-(n%3)*4,by+(n%2?9:-9),f+n+k,1.9,alpha*.8,5,false);
   }
   g.restore();
 }
}
function impact(g,s){
 const t=(s.p-16/24)/.22;if(t<0||t>=1)return;
 const f=Math.floor(s.p*120),a=(1-t)**.8,r=16+65*ease(t);
 g.save();g.translate(s.hit.x,s.hit.y);
 glow(g,0,0,(29+30*ease(t/.3))*1.6,1-ease(t/.24));
 arc(g,r*.72,r,0,Math.PI*2,f,4.8,a);
 arc(g,r*.92,r*.55,f*.24,f*.24+Math.PI*1.75,f+5,3.3,a*.78);
 for(let k=0;k<9;k++){
   const ang=k*2.39996+f*.037,rr=(31+ease(t)*66)*(.72+(k%4)*.11);
   bolt(g,Math.cos(ang)*9,Math.sin(ang)*9,Math.cos(ang)*rr*.85,Math.sin(ang)*rr,f+k*4,3.4-(k%3)*.45,a,11,true);
 }
 for(let k=0;k<18;k++){
   const ang=k*2.39996,rr=12+ease(t)*(52+(k%5)*9);
   spark(g,Math.cos(ang)*rr,Math.sin(ang)*rr*.9,ang,15+(k%4)*4,a,2.2);
 }
 g.restore();
}
function runeShock(g,from,icon,ms,travel,destroyed,color){
 if(ms<0||ms>travel+510)return;
 const f=Math.floor(ms/28),x=icon.x,y=icon.y;
 if(ms<travel){
   const u=clamp(ms/travel),ex=from.x+(x-from.x)*u,ey=from.y+(y-from.y)*u;
   bolt(g,from.x,from.y,ex,ey,f,4.5,1,13,true);
   bolt(g,from.x,from.y,ex,ey,f+5,2.1,.74,18,false);
   g.save();g.translate(x,y);
   arc(g,23,23,f*.7,f*.7+Math.PI*1.65,f,2.8,.55+.4*u);g.restore();
   return;
 }
 if(!destroyed)return;
 const t=clamp((ms-travel)/510),a=1-t;if(a<=0)return;
 g.save();g.translate(x,y);
 if(t<.35)bolt(g,from.x-x,from.y-y,0,0,f,3.9,1-t/.35,12,true);
 glow(g,0,0,30+12*t,1-ease(t/.28));
 arc(g,17+39*ease(t),17+39*ease(t),0,Math.PI*2,f,3.6,a);
 for(let k=0;k<11;k++){
   const ang=k*2.39996,rr=12+ease(t)*(26+(k%4)*9),sz=(3+k%4)*(1-t*.65);
   g.save();g.globalAlpha*=a;g.translate(Math.cos(ang)*rr,Math.sin(ang)*rr+10*t*t);g.rotate(ang+t*(k%2?3:-3));
   g.fillStyle=k%3===0?color||"#8eeaff":k%3===1?"#86949f":"#394952";
   g.beginPath();g.moveTo(sz*1.65,0);g.lineTo(-sz,-sz*.75);g.lineTo(-sz*.62,sz);g.closePath();g.fill();g.restore();
   spark(g,Math.cos(ang)*rr,Math.sin(ang)*rr,ang,10,a,1.4);
 }
 g.restore();
}
function portrait(g,w,h){
 if(!ready())return;
 const size=Math.min(w*.98,h*.98);
 metal(g,{x:w/2,y:h/2,dir:1,size},1,1,0);
}
window.MagneticPulse={ensure,ready,error:()=>lastError,scene,draw,charge,pulse,impact,runeShock,portrait};ensure();
})();
