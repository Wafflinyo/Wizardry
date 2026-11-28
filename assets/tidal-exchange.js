/* Tidal Exchange v0.355.15: full rear manta, independent depth-sorted water helix. */
(()=>{
"use strict";
const W=200,H=240,C=p=>Math.max(0,Math.min(1,p)),image=new Image();
let pending=null;
const ready=()=>image.complete&&image.naturalWidth===1600&&image.naturalHeight===960;
function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;
 pending=new Promise(resolve=>{image.onload=()=>resolve(ready());image.onerror=()=>resolve(false);image.src="./assets/tidal-exchange-32.webp?v=0.355.14";}).then(ok=>{if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return ok;}).finally(()=>pending=null);return pending;}
function scene(target,p,factor=1){
 p=C(p);const size=Math.max(.75,Math.min(2.5,factor)),depth=.60+.30*C((target.y-288)/235);
 return{x:target.x,y:target.y+8,p,n:Math.min(31,Math.floor(p*32)),k:size*1.48,unitScale:size*depth,alpha:Math.min(1,p/.03,(1-p)/.08)};
}
function drawFrame(g,n,sx,sy,sw,sh,dx,dy,dw,dh){g.drawImage(image,n%8*W+sx,Math.floor(n/8)*H+sy,sw,sh,dx,dy,dw,dh);}
function ray(g,s){
 // Never composite any portion of the ray in the foreground. All 32
 // illustrated frames stay intact, with the pool planted on the floor.
 const dw=W*s.k,dh=H*s.k;
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 drawFrame(g,s.n,0,0,W,H,s.x-dw/2,s.y-222*s.k,dw,dh);g.restore();
}
function ribbonSegments(s){
 const p=s.p,age=C((p-.32)/.60);
 const opacity=C((p-.32)/.10)*C((.96-p)/.11);
 if(opacity<=0)return [];
 const out=[],n=80,turns=2.05;
 // Each point is projected from a helix around the unit's actual footprint.
 // sin(theta)>0 is the near half, not an arbitrary horizontal sprite crop.
 const point=t=>{
   const theta=(t*turns-age*1.65)*Math.PI*2;
   const z=Math.sin(theta),radius=(68-16*t)*s.unitScale;
   return{x:s.x+Math.cos(theta)*radius,y:s.y-8*s.unitScale-t*156*s.unitScale+z*22*s.unitScale,z,t};
 };
 const head=C((p-.32)/.24),tail=C((p-.77)/.19);
 for(let i=0;i<n;i++){
   const lo=i/n,hi=(i+1)/n;if(lo>head||hi<tail)continue;
   const a=point(Math.max(lo,tail)),b=point(Math.min(hi,head));if(b.t<=a.t)continue;
   // Split exactly at each front/back crossing to avoid a seam or a ribbon
   // segment accidentally passing through the wizard.
   const add=(a,b)=>out.push({a,b,front:(a.z+b.z)>0,alpha:opacity});
   if(a.z*b.z<0){const k=Math.abs(a.z)/(Math.abs(a.z)+Math.abs(b.z)),m={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,z:0,t:a.t+(b.t-a.t)*k};add(a,m);add(m,b);}
   else add(a,b);
 }
 return out;
}
function swirl(g,s,front){
 const segs=ribbonSegments(s).filter(v=>v.front===front);
 if(!segs.length)return;
 g.save();
 for(const seg of segs){
  const {a,b}=seg,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  const width=(5.4+2.5*(1-a.t))*s.unitScale,px=-dy/len*width,py=dx/len*width;
  const quad=(offset,fill)=>{
   g.fillStyle=fill;g.beginPath();g.moveTo(a.x-px*offset,a.y-py*offset);g.lineTo(b.x-px*offset,b.y-py*offset);g.lineTo(b.x+px*offset,b.y+py*offset);g.lineTo(a.x+px*offset,a.y+py*offset);g.closePath();g.fill();
  };
  g.globalAlpha=seg.alpha*(front?.48:.28);quad(1.35,"#137fbd");
  g.globalAlpha=seg.alpha*(front?.93:.65);quad(.92,front?"#44c9ed":"#258fc8");
  g.globalAlpha=seg.alpha*(front?.94:.6);quad(.34,"#bcefff");
 }
 g.restore();
}
function back(g,s){if(!ready()||s.alpha<=0)return;ray(g,s);swirl(g,s,false);}
function front(g,s){if(!ready()||s.alpha<=0)return;swirl(g,s,true);}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/W,h/210);drawFrame(g,18,0,0,W,H,(w-W*k)/2,h-224*k,W*k,H*k);}
window.TidalExchange={ensure,ready,scene,back,front,portrait,ribbonSegments,hit:.72,frameCount:32};ensure();
})();
