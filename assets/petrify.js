/* Petrify: separated plates extracted from the approved low-poly artwork.
   The live character pose remains the source of truth, never a replacement wizard. */
(()=>{
"use strict";
const atlas=new Image();let pending;
const C=x=>Math.max(0,Math.min(1,x)),E=x=>{x=C(x);return x*x*(3-2*x);},TAU=Math.PI*2;
const ready=()=>atlas.complete&&atlas.naturalWidth===256&&atlas.naturalHeight===64;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{atlas.onload=()=>resolve(ready());atlas.onerror=()=>resolve(false);atlas.src="./assets/petrify-plates.webp?v=1";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function piece(g,i,x,y,w,h,p=1,angle=0){
 if(p<=0||!ready())return;
 const v=E(p);
 g.save();g.translate(x+(1-v)*14,y+(1-v)*27);g.rotate(angle+(1-v)*.5);g.globalAlpha*=C(p*2);
 g.drawImage(atlas,i*64,0,64,64,-w/2,-h/2,w,h);g.restore();
}
const cache=new WeakMap();
function stonePixels(data,w,h){
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const j=(y*w+x)*4;if(!data[j+3])continue;
  const lum=data[j]*.299+data[j+1]*.587+data[j+2]*.114;
  const grain=Math.sin(x*1.71+y*2.37)*Math.sin(x*.83-y*1.37)*7;
  const mineral=Math.sin(x*.18+y*.11+Math.sin(y*.19)*1.7)*4;
  const v=34+lum*.78+grain+mineral;
  data[j]=C((v+11)/255)*255;data[j+1]=C((v+5)/255)*255;data[j+2]=C((v-5)/255)*255;
 }
 return data;
}
function statue(g,u,p,paint,rect){
 if(p<=0)return paint(g);
 const {x,y,w,h}=rect,W=Math.ceil(w),H=Math.ceil(h);
 let entry=cache.get(u);
 // Full stasis uses a stable idle pose; cache only when fully stone.
 const key=[x,y,W,H,u.hat,u.robe,u.skinColor,u.robeColor,u.hatColor,u.hair,u.beard].join("|");
 if(p<1||!entry||entry.key!==key){
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  ctx.translate(-x,-y);paint(ctx);
  const image=ctx.getImageData(0,0,W,H);
  stonePixels(image.data,W,H);ctx.putImageData(image,0,0);
  entry={canvas,key};if(p>=1)cache.set(u,entry);else cache.delete(u);
 }
 if(p<1){paint(g);g.save();g.globalAlpha*=E(p);g.drawImage(entry.canvas,x,y,w,h);g.restore();}
 else g.drawImage(entry.canvas,x,y,w,h);
 return true;
}
function cast(g,u,p,f,layer){
 if(p<=0||p>.9)return;
 const q=Math.floor(p*32)/32,fade=1-E((q-.62)/.28);
 g.save();g.translate(u.x,u.y);g.scale(f,f);g.globalAlpha*=fade;
 for(let i=0;i<16;i++){
  const angle=i*2.399+q*TAU*2,front=Math.sin(angle)>0;
  if(front!==(layer==="front"))continue;
  const v=C(q*1.65-i*.018),r=72*(1-v*.64),x=Math.cos(angle)*r,y=-Math.sin(v*Math.PI*.68)*145+Math.sin(angle)*r*.22;
  piece(g,i%4,x,y,14+i%4*4,14+i%4*4,C(q*8),angle);
 }
 g.restore();
}
function chips(g,u,age,f,expired=false){
 const p=age/(expired?.85:.55);if(p<0||p>=1)return;
 g.save();g.translate(u.x,u.y);g.scale(f,f);g.globalAlpha*=1-p;
 for(let i=0;i<(expired?15:8);i++){
  const a=i*2.399,x=Math.cos(a)*(20+p*70),y=-95+i%4*20-4*p*(1-p)*35+p*55;
  piece(g,i%4,x,y,9+i%4*3,10+i%3*3,1,a+p*7);
 }
 g.restore();
}
// Card-only illustration: the actual approved wizard silhouette, turned
// entirely to stone, with mineral fissures and fallen rubble at its feet.
let portraitStone=null,portraitSource=null;
function portrait(g,w,h,wizard){
 if(!wizard||wizard.naturalWidth!==512||wizard.naturalHeight!==896)return;
 if(!portraitStone||portraitSource!==wizard){
  const c=document.createElement("canvas");c.width=128;c.height=128;
  const ctx=c.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(wizard,0,0,128,128,0,0,128,128);
  const pixels=ctx.getImageData(0,0,128,128);
  stonePixels(pixels.data,128,128);ctx.putImageData(pixels,0,0);
  // Dark fractured veins with narrow lit edges, clipped to the statue.
  ctx.globalCompositeOperation="source-atop";
  const cracks=[[[49,14],[54,22],[50,27],[58,34]],[[48,56],[43,65],[51,73],[47,80],[55,89]],[[43,65],[37,68],[34,75]],[[65,86],[62,96],[68,101],[66,113]],[[92,44],[98,48],[94,54]]];
  for(const points of cracks){
   ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));
   ctx.strokeStyle="#4a4038";ctx.lineWidth=1.25;ctx.stroke();
   ctx.save();ctx.translate(.8,.65);ctx.strokeStyle="#c1ac93";ctx.lineWidth=.65;ctx.stroke();ctx.restore();
  }
  portraitStone=c;portraitSource=wizard;
 }
 const k=Math.min(w/128,h/128);
 g.save();g.translate(w/2-64*k,h/2-64*k);g.scale(k,k);
 // A broken stone plinth and loose chips reinforce the stasis concept.
 g.fillStyle="#55463e";g.beginPath();g.ellipse(64,116,45,7,0,0,TAU);g.fill();
 const rubble=[[24,112,12,9],[35,118,11,8],[85,117,12,8],[99,112,10,10],[109,119,9,6]];
 for(const [x,y,r,z] of rubble){
  g.fillStyle="#79685a";g.beginPath();g.moveTo(x-r/2,y);g.lineTo(x-r*.3,y-z);g.lineTo(x+r*.3,y-z*.8);g.lineTo(x+r*.55,y);g.closePath();g.fill();
  g.fillStyle="#b09a80";g.beginPath();g.moveTo(x-r/2,y);g.lineTo(x-r*.3,y-z);g.lineTo(x+r*.3,y-z*.8);g.lineTo(x,y-z*.35);g.closePath();g.fill();
 }
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(portraitStone,0,0,128,128);
 g.restore();
}
window.Petrify={ensure,ready,statue,stonePixels,cast,chips,portrait};ensure();
})();