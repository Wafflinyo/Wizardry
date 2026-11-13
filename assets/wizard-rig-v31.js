/* Wizardry 0.31: articulated 2D skeletal wizard, no frame swapping. */
(function(global){
"use strict";
const source=new Image();source.decoding="async";source.src="./assets/wizard-top-idle-v30.png";
let body=null;
const W=443,H=443,SH={x:245,y:227},HOME={x:286,y:260,a:-1.155},CAST={x:350,y:222,a:-.58};
const L1=48,L2=64,TAIL=-138,TIP=145;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
function poly(c,pts,fill,stroke=null,w=1.5){
 c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
 c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function makeBody(){
 if(body)return true;if(!source.complete||!source.naturalWidth)return false;
 const cv=document.createElement("canvas");cv.width=W;cv.height=H;
 const c=cv.getContext("2d");c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 c.drawImage(source,0,0,W,H);
 c.save();c.globalCompositeOperation="destination-out";
 const masks=[
 [[290,149],[306,135],[328,124],[347,120],[369,158],[357,194],[332,209],[296,210],[288,183]],
 [[297,187],[322,198],[258,397],[233,397]],
 [[237,215],[272,205],[284,229],[311,227],[323,241],[323,272],[294,290],[275,303],[248,298],[226,265]]
 ];
 for(const m of masks){poly(c,m,"#000","#000",7);}
 c.fillRect(304,207,40,32);c.restore();
 // Replace only the occluded sleeve/robe area, behind surviving original art.
 c.save();c.globalCompositeOperation="destination-over";
 const facets=[
 [[[234,210],[263,210],[281,231],[284,285],[275,321],[253,345],[239,327],[226,289]],"#39287e"],
 [[[239,213],[259,207],[271,219],[268,278],[248,291],[235,277]],"#4a38aa"],
 [[[268,225],[284,237],[287,287],[273,314],[266,302]],"#2d2174"],
 [[[240,285],[265,286],[259,325],[249,340],[237,316]],"#4937a2"],
 [[[262,317],[275,306],[274,330],[257,347],[247,345]],"#b97d2d"],
 [[[228,223],[251,219],[265,228],[259,236],[240,239]],"#2b2068"]
 ];
 for(const [p,color] of facets)poly(c,p,color);
 c.restore();body=cv;return true;
}
function pose(stage,p=0){
 let reach=0,turn=0;
 if(stage==="raising")reach=ease(p);
 else if(stage==="lowering")reach=1-ease(p);
 else if(stage && stage!=="idle")reach=1;
 const hand={x:mix(HOME.x,CAST.x,reach),y:mix(HOME.y,CAST.y,reach)};
 let wiggle=0;
 if(stage==="tracing-auto"){
  // Two full arcs per second; a true figure-eight movement of the wrist.
  turn=clamp(p)*Math.PI*2*1.75;
  hand.x+=Math.sin(turn)*9;hand.y+=Math.sin(turn*2)*14;
  wiggle=.19*Math.cos(turn)+.22*Math.sin(turn);
 }
 // Joint limits: the hand cannot extend beyond the two rigid arm bones.
 let dx=hand.x-SH.x,dy=hand.y-SH.y,dist=Math.hypot(dx,dy)||1;
 if(dist>L1+L2-1){const k=(L1+L2-1)/dist;hand.x=SH.x+dx*k;hand.y=SH.y+dy*k;}
 dx=hand.x-SH.x;dy=hand.y-SH.y;dist=Math.hypot(dx,dy)||1;
 const vx=dx/dist,vy=dy/dist;
 const a=(L1*L1-L2*L2+dist*dist)/(2*dist);
 const h=Math.sqrt(Math.max(0,L1*L1-a*a));
 const elbow={x:SH.x+vx*a-vy*h,y:SH.y+vy*a+vx*h};
 return {hand,elbow,angle:mix(HOME.a,CAST.a,reach)+wiggle,staffLength:TIP-TAIL};
}
function segment(c,a,b,r1,r2,fill,lit){
 const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
 poly(c,[[a.x+nx*r1,a.y+ny*r1],[b.x+nx*r2,b.y+ny*r2],[b.x-nx*r2,b.y-ny*r2],[a.x-nx*r1,a.y-ny*r1]],fill,"#302271",2);
 poly(c,[[a.x+nx*r1*.47,a.y+ny*r1*.47],[b.x+nx*r2*.5,b.y+ny*r2*.5],[b.x+nx*2,b.y+ny*2],[a.x+nx*2,a.y+ny*2]],lit);
}
function staff(c,h,angle){
 // A single RIGID prop with a stable crystal; one rotation transform per pose.
 c.save();c.translate(h.x,h.y);c.rotate(angle);
 poly(c,[[TAIL,-6],[82,-8],[98,-4],[98,6],[82,10],[TAIL,6]],"#985522","#663518",2);
 poly(c,[[TAIL+5,-4],[84,-6],[84,0],[TAIL+8,0]],"#c5813d");
 poly(c,[[TAIL+9,2],[84,4],[84,8],[TAIL+4,5]],"#713c1c");
 poly(c,[[76,-16],[96,-31],[122,-35],[143,-15],[TIP,14],[122,33],[93,29],[75,13]],"#9a5525","#6a401b",3);
 poly(c,[[80,-16],[97,-30],[123,-31],[141,-13],[119,-6],[92,-7]],"#f7b441");
 poly(c,[[92,4],[116,22],[142,14],[123,33],[96,28],[76,13]],"#b86e2d");
 poly(c,[[101,-19],[123,-23],[135,-5],[130,13],[104,21],[91,3]],"#1d98ba","#f2c46b",3);
 poly(c,[[101,-19],[123,-23],[111,-2],[91,3]],"#8cf6f5");
 poly(c,[[111,-2],[123,-23],[135,-5],[130,13]],"#26d3ed");
 poly(c,[[91,3],[111,-2],[104,21]],"#2acbe6");
 c.restore();
}
function arm(c,p){
 const e=p.elbow,h=p.hand;
 segment(c,SH,e,21,20,"#3c2c91","#6045c5");
 const dx=h.x-e.x,dy=h.y-e.y,l=Math.hypot(dx,dy)||1,vx=dx/l,vy=dy/l,nx=-vy,ny=vx;
 const d=Math.min(L2*.58,l*.62),s={x:e.x+vx*d,y:e.y+vy*d};
 segment(c,e,s,19,15,"#5234a9","#6d51cd");
 poly(c,[[s.x+nx*18,s.y+ny*18],[s.x+vx*15+nx*15,s.y+vy*15+ny*15],
  [s.x+vx*15-nx*15,s.y+vy*15-ny*15],[s.x-nx*18,s.y-ny*18]],"#eaa535","#a46a2d",2);
 const f={x:s.x+vx*15,y:s.y+vy*15};
 segment(c,f,h,11,12,"#e0a06d","#f1bd88");
 c.save();c.translate(h.x,h.y);c.rotate(Math.atan2(dy,dx));
 poly(c,[[-11,-12],[7,-13],[17,-6],[18,9],[3,16],[-12,11]],"#efb483","#b9744e",2);
 poly(c,[[-9,-9],[6,-11],[15,-4],[1,0]],"#ffcd94");
 c.restore();
}
function draw(c,o={}){
 if(!makeBody())return false;
 const p=pose(o.stage||null,o.progress||0);
 c.save();c.translate(-74,-220);c.scale(148/W,220/H);
 const breathing=(1-Math.cos((o.time||0)/1480*Math.PI*2))*.5;
 c.save();c.translate(0,-breathing*2);c.drawImage(body,0,0,W,H);c.restore();
 staff(c,p.hand,p.angle);arm(c,p);
 c.restore();return true;
}
global.WizardryRig={draw,ready:()=>!!body||(source.complete&&source.naturalWidth>0),pose,
 segments:{upper:L1,forearm:L2,staffLength:TIP-TAIL}};
})(window);