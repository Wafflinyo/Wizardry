/* Fountain of Youth: extracted original illustrated sprites, with labels
 * and wizard silhouettes excluded. Separate water transfer and heal assets. */
(()=>{
"use strict";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p;
const fountain=new Image(),fx=new Image();
let crispFountain=null;
const valid=(im,w,h)=>im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const ready=()=>valid(fountain,784,864)&&valid(fx,432,336);
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
 pending=Promise.all([load(fountain,784,864,"./assets/fountain-youth.webp?v=0.354.89"),load(fx,432,336,"./assets/fountain-youth-effects.webp?v=0.354.89")]).then(r=>{const ok=r.every(Boolean);if(ok){crispFountain=sharpen(fountain);window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}return ok;}).finally(()=>pending=null);
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
function transfer(g,s){
 if(!ready()||s.p<.33||s.p>.75)return;
 const q=C((s.p-.33)/.37),sx=s.x,sy=placement(s).y+49*SIZE,tx=s.u.x,ty=s.u.y-70*s.k;
 for(let j=0;j<7;j++){
  const t=q*1.35-j*.055;if(t<0||t>1)continue;
  const x=L(sx,tx,t),y=L(sy,ty,t)+Math.sin(t*12+j*.9)*13;
  const w=65,h=50;
  tile(g,fx,j%2,3,144,112,x-w/2,y-h/2,w,h,Math.min(1,t*9,(1-t)*10));
 }
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
window.FountainYouth={ensure,ready,scene,frame,placement,fountain:drawFountain,transfer,activate,receive,portrait};ensure();
})();