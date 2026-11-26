/* Crystal Cavern: the existing arena, transformed in place. 32 transparent
   crystal frames are used as individual formations, not a replacement backdrop. */
(()=>{
"use strict";
const atlas=new Image(),C=v=>Math.max(0,Math.min(1,v)),TAU=Math.PI*2;
let pending,material=null,materialSource=null;
const ready=()=>atlas.complete&&atlas.naturalWidth===1536&&atlas.naturalHeight===768;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/crystal-cavern-frames.webp?v=1";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function invalidate(){material=null;materialSource=null;}
function stoneArena(source){
 if(!source)return null;if(material&&materialSource===source)return material;
 const c=document.createElement("canvas");c.width=source.width;c.height=source.height;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(source,0,0);
 const img=ctx.getImageData(0,0,c.width,c.height),d=img.data;
 // Convert blue/teal stone and existing cyan crystals to warm sandstone
 // and amber. Original geometry, shadows, tile divisions and banners stay.
 for(let j=0;j<d.length;j+=4){const r=d[j],g=d[j+1],b=d[j+2],lum=.299*r+.587*g+.114*b;
  const cold=C((Math.max(g,b)-r)/65);
  const hot=C((g-r-10)/65)*C((g+b-100)/180);
  const warm=[lum*1.16+18+hot*55,lum*.91+8+hot*26,lum*.66+7-hot*15];
  const k=.32+.68*cold;
  for(let n=0;n<3;n++)d[j+n]=Math.max(0,Math.min(255,d[j+n]*(1-k)+warm[n]*k));
 }
 ctx.putImageData(img,0,0);material=c;materialSource=source;return c;
}
const clusters=[
 [.025,.323,.15,0], [.14,.421,.12,.11],[.29,.432,.13,.18],[.40,.463,.075,.28],
 [.61,.462,.08,.18],[.72,.424,.13,.1],[.86,.422,.12,.25],[.98,.325,.15,.15],
 [.235,.12,.12,.24],[.775,.12,.12,.32],
 [.018,.925,.18,.29],[.16,.975,.13,.32],[.84,.975,.13,.35],[.982,.925,.18,.22]
];
const fissures=[
 [[.09,.58],[.17,.59],[.20,.625],[.29,.63],[.33,.66]],
 [[.27,.49],[.32,.53],[.38,.54],[.40,.58]],
 [[.72,.49],[.66,.52],[.63,.57],[.60,.59]],
 [[.91,.58],[.84,.61],[.80,.66],[.70,.67]],
 [[.07,.76],[.16,.76],[.20,.80],[.30,.81],[.34,.85]],
 [[.93,.77],[.85,.76],[.79,.81],[.72,.82],[.67,.86]],
 [[.32,.9],[.40,.88],[.43,.85]],[[.68,.9],[.59,.88],[.56,.86]]
];
function frame(g,n,x,y,w,h){if(ready())g.drawImage(atlas,n%8*192,Math.floor(n/8)*192,192,192,x,y,w,h);}
function trace(g,points,p){const end=C(p)*(points.length-1);g.beginPath();g.moveTo(...points[0]);for(let j=0;j<end;j++){const a=points[j],b=points[j+1],t=C(end-j);g.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);}}
function landscape(g,{x,y,width,height,time,strength,exit=null,background=null,exitOnly=false}){
 const s=C(strength);if(!s&&exit===null)return;
 g.save();g.translate(x,y);g.scale(width/1000,height/620);
 if(!exitOnly){
  const m=stoneArena(background);if(m){g.save();g.globalAlpha*=s;g.drawImage(m,0,0,1000,620);g.restore();}
  // Local mineral veins follow the floor surface, not an opaque ground overlay.
  for(const [idx,pts] of fissures.entries()){
   const points=pts.map(([u,v])=>[u*1000,v*620]);
   const grow=exit!==null?1:C((s-idx*.035)/.65);
   g.save();g.globalAlpha*=s;trace(g,points,grow);g.lineCap="round";g.lineJoin="round";
   g.strokeStyle="#3d2926";g.lineWidth=5;g.stroke();
   g.strokeStyle="rgba(255,170,61,.28)";g.lineWidth=8;g.stroke();
   g.strokeStyle="#e4a54b";g.lineWidth=2.3;g.stroke();g.strokeStyle="#ffe2a0";g.lineWidth=.9;g.stroke();g.restore();
  }
 }
 for(const [idx,[u,v,size,delay]] of clusters.entries()){
  const progress=C((s-delay)/(1-delay));
  if(progress<=0&&exit===null)continue;
  const n=exit!==null?24+Math.min(7,Math.floor(exit*8)):s<1?Math.min(15,Math.floor(progress*16)):16+(Math.floor(time/150+idx*2)%8);
  const w=size*1000,h=w*.95;
  const ax=u*1000,ay=v*620;
  // Plant the same frame at staggered arena anchors, varying depth and size.
  g.save();g.translate(ax,ay);if(idx%2)g.scale(-1,1);
  frame(g,n,-w/2,-h*.92,w,h);
  g.restore();
 }
 if(!exitOnly){
  // Soft drifting mineral sparks stay small and do not hide the fighters.
  for(let n=0;n<38;n++){const x=((n*137.61+Math.sin(time*.0005+n)*18)%1000+1000)%1000,y=45+((n*71.3-time*.018+4000)%440+440)%440,r=1+n%3*.55;
   g.save();g.globalAlpha*=s*(.18+.42*(.5+.5*Math.sin(time*.002+n)));
   g.fillStyle="#ffcb70";g.beginPath();g.moveTo(x,y-r*1.5);g.lineTo(x+r,y);g.lineTo(x,y+r*1.5);g.lineTo(x-r,y);g.closePath();g.fill();g.restore();
  }
 }
 g.restore();
}
function shake(p){const a=C(p/.08)*(1-C((p-.65)/.30));return{x:a*(Math.sin(p*87)*4+Math.sin(p*47)*2),y:a*Math.cos(p*119)*5};}
function portrait(g,w,h,background){g.save();const m=stoneArena(background);if(m)g.drawImage(m,0,0,1000,620,0,0,w,h);else{g.fillStyle="#624833";g.fillRect(0,0,w,h);}
 const size=Math.min(w,h);frame(g,19,w*.5-size*.50,h*.95-size*.96,size,size);frame(g,17,w*.03,h*.97-size*.52,size*.52,size*.52);frame(g,20,w*.66,h*.97-size*.52,size*.52,size*.52);g.restore();}
window.CrystalCavern={ready,ensure,invalidate,landscape,shake,portrait};ensure();
})();
