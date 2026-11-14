/* Wizardry 0.32: one original staff removed from body, one skeletal staff. */
(function(global){
'use strict';
const W=443,H=443;
const src=new Image();src.decoding='async';src.src='./assets/wizard-top-idle-v30.png';
let cleanBody=null,previous={stage:'idle',pose:null},lowerOrigin=null;
const sh={x:247,y:237},rest={x:291,y:265,angle:-1.19},extended={x:339,y:228,angle:-.81};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const mix=(a,b,t)=>a+(b-a)*t;
const lerpPose=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),angle:mix(a.angle,b.angle,t)});
function polygon(c,p,fill,stroke='',sw=1){
 c.beginPath();c.moveTo(p[0][0],p[0][1]);
 for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);
 c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}
}
function prepare(){
 if(cleanBody)return true;
 if(!src.complete||!src.naturalWidth)return false;
 const under=document.createElement('canvas');under.width=W;under.height=H;
 const u=under.getContext('2d');
 // Paint the hidden right-side robe panels where the original staff/hand was.
 const panels=[
  [[[226,202],[254,211],[276,240],[287,271],[285,308],[304,341],[285,354],[246,359],[215,326],[225,263]],'#332279'],
  [[[233,207],[251,212],[266,231],[259,295],[254,343],[235,350],[221,315]],'#49359b'],
  [[[262,230],[283,255],[285,312],[297,339],[277,339],[270,301]],'#251966'],
  [[[266,326],[288,336],[299,345],[282,354],[248,361]],'#b7782e'],
  [[[271,319],[292,328],[288,339],[270,336]],'#58409a'],
  [[[228,213],[245,209],[258,223],[252,236],[228,235]],'#2f2078']
 ];
 for(const [pts,col] of panels)polygon(u,pts,col);
 const art=document.createElement('canvas');art.width=W;art.height=H;
 const a=art.getContext('2d');a.imageSmoothingEnabled=true;a.imageSmoothingQuality='high';
 // Existing sprite is an optimized 128x192 crop of the original 443 art.
 a.drawImage(src,81,1,285,426);
 a.save();a.globalCompositeOperation='destination-out';
 const excisions=[
  [[318,111],[350,118],[376,158],[373,196],[344,211],[297,203],[291,182],[291,143]],
  [[298,190],[323,202],[273,352],[264,400],[238,399],[235,380],[276,249]],
  [[236,220],[266,212],[289,225],[309,234],[318,264],[304,284],[278,292],[260,280],[237,273],[216,242]],
  [[293,180],[321,194],[319,237],[297,248],[283,231]]
 ];
 for(const points of excisions)polygon(a,points,'#000');
 a.restore();u.drawImage(art,0,0);cleanBody=under;return true;
}
function segment(c,p1,p2,r1,r2,dark,lit){
 const dx=p2.x-p1.x,dy=p2.y-p1.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 polygon(c,[[p1.x+nx*r1,p1.y+ny*r1],[p2.x+nx*r2,p2.y+ny*r2],[p2.x-nx*r2,p2.y-ny*r2],[p1.x-nx*r1,p1.y-ny*r1]],dark,'#30226a',1.5);
 polygon(c,[[p1.x+nx*r1*.65,p1.y+ny*r1*.65],[p2.x+nx*r2*.54,p2.y+ny*r2*.54],[p2.x,p2.y],[p1.x,p1.y]],lit);
}
function elbowFor(hand){
 const dx=hand.x-sh.x,dy=hand.y-sh.y,L=Math.hypot(dx,dy)||1;
 const a=47,b=77,d=clamp(L,Math.abs(a-b)+.01,a+b-.01);
 const ux=dx/L,uy=dy/L,along=(a*a-b*b+d*d)/(2*d),rise=Math.sqrt(Math.max(0,a*a-along*along));
 return {x:sh.x+ux*along-uy*rise,y:sh.y+uy*along+ux*rise};
}
function drawArm(c,h){
 const e=elbowFor(h);
 c.beginPath();c.ellipse(sh.x,sh.y,19,17,-.2,0,Math.PI*2);c.fillStyle='#46318e';c.fill();
 segment(c,sh,e,22,20,'#493298','#6144c2');
 const dx=h.x-e.x,dy=h.y-e.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
 const sleeve={x:e.x+ux*29,y:e.y+uy*29};
 segment(c,e,sleeve,20,18,'#4e31a1','#7453cf');
 const cuff={x:sleeve.x+ux*17,y:sleeve.y+uy*17};
 segment(c,sleeve,cuff,20,17,'#db922d','#ffbc50');
 segment(c,cuff,h,13,11,'#cb8a61','#f8be87');
}
function drawStaff(c,h){
 // Exactly one rigid prop; one shared transform for all shaft/crystal vertices.
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 polygon(c,[[-138,-7],[99,-9],[111,-5],[111,7],[98,10],[-138,7]],'#985523','#5c311d',2.5);
 polygon(c,[[-136,-5],[99,-6],[100,0],[-133,0]],'#c88544');
 polygon(c,[[88,-19],[106,-31],[135,-31],[155,-15],[160,6],[136,31],[104,28],[87,15]],'#a9622a','#633819',3);
 polygon(c,[[89,-18],[108,-30],[135,-29],[151,-13],[126,-9],[101,-6]],'#f4b13c');
 polygon(c,[[103,-1],[114,-22],[140,-18],[147,0],[135,20],[112,18]],'#1aadd0','#edb949',3);
 polygon(c,[[103,-1],[114,-22],[135,-14],[122,4]],'#8cf5f6');
 polygon(c,[[122,4],[135,-14],[147,0],[135,20]],'#33d9ee');
 c.restore();
}
function grip(c,h){
 c.save();c.translate(h.x,h.y);c.rotate(h.angle+Math.PI*.48);
 polygon(c,[[-14,-9],[7,-12],[16,-5],[16,9],[2,15],[-14,10]],'#dc9968','#9d5b3c',2);
 polygon(c,[[-11,-8],[7,-11],[13,-5],[1,0],[-11,-1]],'#f8c48d');
 c.restore();
}
function wave(ms){
 const phi=Math.PI*2*(ms/780);
 return {x:extended.x+10*Math.sin(phi),y:extended.y+13*Math.sin(2*phi),angle:extended.angle+.28*Math.sin(phi)};
}
function compute(stage,p,traceMs){
 if(stage==='raising')return lerpPose(rest,extended,ease(p));
 if(stage==='tracing-auto'||stage==='summon'||stage==='fizzle')return wave(traceMs);
 if(stage==='lowering')return lerpPose(lowerOrigin||extended,rest,ease(p));
 return rest;
}
function draw(c,{stage='idle',progress=0,traceMs=0,time=0}={}){
 if(!prepare())return false;
 if(!stage)stage='idle';
 if(stage==='lowering'&&previous.stage!=='lowering')lowerOrigin=previous.pose||extended;
 const p=compute(stage,progress,traceMs);
 previous={stage,pose:p};
 const bob=2.6*(1-Math.cos(time*Math.PI*2/1540))*.5;
 c.save();c.translate(-74,-220);c.scale(148/W,220/H);c.translate(0,-bob);
 c.drawImage(cleanBody,0,0);
 drawArm(c,p);drawStaff(c,p);grip(c,p);
 c.restore();return true;
}
global.WizardryRig={draw,ready:prepare,pose:compute,wave,staffLength:298,armLength:[47,77],sourceHasBakedStaff:false};
})(window);
