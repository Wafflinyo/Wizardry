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
function charge(g,s){
 if(s.p<.07||s.p>=.60)return;
 const t=ease((s.p-.07)/.34),fade=1-ease((s.p-.49)/.11);
 const f=s.frame;
 g.save();g.translate(s.x,s.y);
 // Restrict the charging energy to the open center of the metal ring.
 arc(g,24+10*t,14+8*t,f*.62,f*.62+Math.PI*1.55,f,1.8+t,fade*t);
 arc(g,35,23,-f*.49,-f*.49+Math.PI*1.25,f+4,1.5,fade*t*.78);
 g.beginPath();
 for(let i=0;i<=8;i++){
   const x=-37+74*i/8,y=JITTER[(i+f)%12]*1.5;
   if(i===0)g.moveTo(x,y);else g.lineTo(x,y);
 }
 g.globalAlpha*=fade*t;g.lineJoin="round";g.lineCap="round";
 g.strokeStyle="#24baff";g.lineWidth=5;g.stroke();
 g.strokeStyle="#e7ffff";g.lineWidth=1.8;g.stroke();g.restore();
}
function pulse(g,s){
 const start=.46,arrival=16/24;
 if(s.p<start||s.p>arrival+.11)return;
 // The leading edge grows out of the ring, then travels across the
 // visible gap; the trailing fronts follow independently.
 const u=clamp((s.p-start)/(arrival-start));
 const originX=s.x+s.dir*52,originY=s.y;
 const fade=1-ease((s.p-arrival)/.11);
 for(let k=2;k>=0;k--){
   const q=u-k*.21;
   if(q<0)continue;
   const v=clamp(q),x=originX+(s.hit.x-originX)*v,y=originY+(s.hit.y-originY)*v;
   const size=12+v*29,alpha=fade*(k===0?1:k===1?.60:.32)*ease(v/.12);
   g.save();g.translate(x,y);g.scale(s.dir,1);
   arc(g,size*.38,size,-Math.PI*.70,Math.PI*.70,s.frame+k*3,3.0-k*.55,alpha);
   arc(g,size*.22,size*.79,-Math.PI*.66,Math.PI*.66,s.frame+k*3+5,1.35,alpha*.7);
   g.restore();
 }
}
function impact(g,s){
 const arrival=16/24,t=(s.p-arrival)/.145;
 if(t<0||t>=1)return;
 const a=1-ease(t),r=12+48*ease(t);
 g.save();g.translate(s.hit.x,s.hit.y);g.globalAlpha*=a;
 arc(g,r*.8,r,0,Math.PI*2,s.frame,2.3,a);
 for(let i=0;i<8;i++){
   const angle=i*Math.PI/4+(i%2)*.12,rr=r*(.70+(i%3)*.12);
   g.fillStyle=i%2?"#55d1ff":"#dcfbff";
   g.beginPath();g.moveTo(Math.cos(angle)*rr*.22,Math.sin(angle)*rr*.22);
   g.lineTo(Math.cos(angle-.085)*rr*.55,Math.sin(angle-.085)*rr*.55);
   g.lineTo(Math.cos(angle)*rr,Math.sin(angle)*rr);
   g.lineTo(Math.cos(angle+.085)*rr*.50,Math.sin(angle+.085)*rr*.50);
   g.closePath();g.fill();
 }
 g.restore();
}
function portrait(g,w,h){
 if(!ready())return;
 const size=Math.min(w*.98,h*.98);
 metal(g,{x:w/2,y:h/2,dir:1,size},1,1,0);
}
window.MagneticPulse={ensure,ready,error:()=>lastError,scene,draw,charge,pulse,impact,portrait};ensure();
})();
