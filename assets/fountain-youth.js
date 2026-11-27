/* Fountain of Youth: extracted original illustrated sprites, with labels
 * and wizard silhouettes excluded. Separate water transfer and heal assets. */
(()=>{
"use strict";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const fountain=new Image(),fx=new Image(),ribbon=new Image();
let crispFountain=null;
const valid=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>valid(fountain,784,864)&&valid(fx,432,336)&&valid(ribbon,1446,1084);
let pending=null;
// Sharpen opaque color detail only, without changing the transparent
// silhouette or inventing any new frames. Prepared once, not every draw.
function sharpen(im){
 if(typeof document==="undefined")return im;
 try{
  const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;
  const g=c.getContext("2d",{willReadFrequently:true});
  g.drawImage(im,0,0);
  const pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data,src=new Uint8ClampedArray(d),w=c.width;
  for(let y=1;y<c.height-1;y++)for(let x=1;x<w-1;x++){
   if(x%112===0||x%112===111||y%144===0||y%144===143)continue;
   const at=(y*w+x)*4,neighbors=[at-4,at+4,at-4*w,at+4*w];
   if(src[at+3]<220||neighbors.some(j=>src[j+3]<220))continue;
   for(let ch=0;ch<3;ch++){
    const v=src[at+ch],avg=neighbors.reduce((s,j)=>s+src[j+ch],0)/4;
    d[at+ch]=v+.48*(v-avg);
   }
  }
  g.putImageData(pixels,0,0);return c;
 }catch(_){return im;}
}
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 function load(im,w,h,src){return valid(im,w,h)?Promise.resolve(true):new Promise(resolve=>{im.onload=()=>resolve(valid(im,w,h));im.onerror=()=>resolve(false);im.src=src;});}
 pending=Promise.all([load(fountain,784,864,"./assets/fountain-youth.webp?v=0.354.89"),load(fx,432,336,"./assets/fountain-youth-effects.webp?v=0.354.89"),load(ribbon,1446,1084,"./assets/fountain-transfer-v91.webp?v=0.354.91")]).then(r=>{const ok=r.every(Boolean);if(ok){crispFountain=sharpen(fountain);window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}return ok;}).finally(()=>pending=null);
 return pending;
}
function tile(g,im,n,cols,cw,ch,x,y,w,h,alpha=1){
 if(alpha<=0)return;
 g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(im,n%cols*cw,Math.floor(n/cols)*ch,cw,ch,x,y,w,h);g.restore();
}
function scene(u,p,factor=1){return {u,p:C(p),x:500,y:510,k:(.65+.25*C((u.y-288)/235))*Math.max(1,factor)};}
function frame(p){
 if(p<.28)return Math.min(13,Math.floor(p/.28*14));
 if(p<.76)return 14+Math.floor((p-.28)*4800/83)%14;
 return 28+Math.min(13,Math.floor((p-.76)/.24*14));
}
// Measured basin centers and ground-plane anchors in each native frame.
const baseX=[59.5,59,60,60.5,59,59.5,61,59,59,59.5,58,57,55.5,55.5,61.5,60,60.5,60.5,60,60.5,60,59.5,58.5,58.5,57,57,56,56,54.5,53.5,52.5,53.5,56.5,58.5,59.5,59,58.5,59,59,56.5,55.5,56];
const baseY=[130,130,130,130,127,127,127,126,126,126,125,126,126,126,127,127,126,126,126,127,127,127,126,126,126,127,127,127,126,126,126,127,126,126,126,126,126,125,125,128,129,129];
const SIZE=1.55;
function placement(s){
 const n=frame(s.p);
 return {n,x:s.x-baseX[n]*SIZE,y:s.y-baseY[n]*SIZE,w:112*SIZE,h:144*SIZE};
}
function drawFountain(g,s){
 if(!ready())return;
 const d=placement(s);
 tile(g,crispFountain||fountain,d.n,7,112,144,d.x,d.y,d.w,d.h,C((1-s.p)/.055));
}
// Tight source bounds of each illustrated ribbon frame. Keeping the
// original native pixels avoids stretching transparent cell margins.
const ribbonBounds=[[16,158,125,203],[17,144,147,203],[12,130,210,221],[16,122,208,222],[16,111,210,221],[4,102,224,220],[9,99,228,222],[6,94,231,221],[4,86,231,224],[6,85,235,227],[0,78,241,229],[0,69,236,229],[2,69,241,231],[0,72,241,228],[0,77,241,218],[0,83,241,204],[0,92,241,199],[0,106,232,196],[3,111,232,198],[3,114,230,192],[3,117,220,189],[1,125,214,183],[10,131,206,176],[10,128,192,168]];
function ribbonPath(s){
 if(s.p<.33||s.p>=.76)return null;
 const q=C((s.p-.33)/.37),drain=C((s.p-.70)/.06);
 const d=placement(s),sx=s.x,sy=d.y+49*SIZE,tx=s.u.x,ty=s.u.y-70*s.k;
 const arc=Math.min(58,Math.abs(tx-sx)*.20+12);
 const point=t=>({x:L(sx,tx,t),y:L(sy,ty,t)-Math.sin(Math.PI*t)*arc});
 // A single advancing ribbon, not repeated disconnected particle
 // tiles. Its leading edge reaches the ally exactly at spell impact.
 const tail=Math.min(q,Math.max(0,q-.64)+.64*drain);
 const from=point(tail),to=point(q),dx=to.x-from.x,dy=to.y-from.y;
 const length=Math.hypot(dx,dy);
 const n=Math.min(23,Math.floor(C((s.p-.33)/.43)*24));
 return {from,to,length,angle:Math.atan2(dy,dx),n,alpha:Math.min(1,q*10,(1-drain)*5),height:Math.min(74,Math.max(18,length*.55)),source:point(0),target:point(1)};
}
function transfer(g,s){
 if(!ready())return;
 const r=ribbonPath(s);
 if(!r||r.length<1||r.alpha<=0)return;
 const [x0,y0,x1,y1]=ribbonBounds[r.n];
 const sx=Math.max(0,x0-3),sy=Math.max(0,y0-3),ex=Math.min(241,x1+3),ey=Math.min(271,y1+3);
 g.save();g.globalAlpha*=r.alpha;g.translate(r.from.x,r.from.y);g.rotate(r.angle);
 // Preserve the curling crest on the upper side when traveling left.
 if(r.to.x<r.from.x)g.scale(1,-1);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(ribbon,r.n%6*241+sx,Math.floor(r.n/6)*271+sy,ex-sx,ey-sy,0,-r.height*.52,r.length,r.height);
 g.restore();
}
function activate(g,u,p,factor=1){
 if(!ready())return;p=C(p);const k=Math.max(.65,factor*.86),alpha=Math.min(1,p*9,(1-p)*5);
 const w=180*k,h=130*k;
 tile(g,fx,3,3,144,112,u.x-w/2,u.y-h*.55,w,h,alpha);
 tile(g,fx,2,3,144,112,u.x-w*.4,u.y-h*.80,w*.8,h,alpha*.85);
 for(let j=0;j<3;j++){
  const t=p*1.5-j*.16;if(t<0||t>1)continue;
  const sz=70*k;
  tile(g,fx,5+j%2,3,144,112,u.x-sz/2+Math.sin(j*2.4+t*5)*30*k,u.y-35*k-t*110*k,sz,sz,alpha*(1-t));
 }
}
function receive(g,s){if(s.p>=.60&&s.p<=.94)activate(g,s.u,(s.p-.60)/.34,s.k);}
function portrait(g,w,h){if(!ready())return;const k=Math.min(w/112,h/144);tile(g,crispFountain||fountain,20,7,112,144,(w-112*k)/2,h-144*k,112*k,144*k);}
window.FountainYouth={ensure,ready,scene,frame,placement,ribbonPath,fountain:drawFountain,transfer,activate,receive,portrait};ensure();
})();