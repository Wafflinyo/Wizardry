/* Hydro Serpent v6: original illustrated summon, rebuilt raster arc and trailing body. */
(()=>{
"use strict";
const W=512,H=384,COLS=7,ROOT={x:110,y:309},CONTACT={x:420,y:216};
const LAUNCH=.47,HIT=.67,END=.99;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const sheet=new Image(),burst=new Image();
let cleanBurst=null;
const ready=()=>sheet.complete&&sheet.naturalWidth===3584&&sheet.naturalHeight===3456;
let pending=null;
function loadBurst(){
 if(burst.complete&&burst.naturalWidth===1200&&burst.naturalHeight===480)return;
 burst.onload=()=>{
  // Clean the original illustrated splash cells independently: remove old
  // neutral matte pixels and soften the outer cell margin, never the silhouette.
  if(typeof document==="undefined")return;
  try{
   const c=document.createElement("canvas");c.width=1200;c.height=480;
   const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(burst,0,0);
   const pixels=ctx.getImageData(0,0,1200,480),d=pixels.data;
   for(let y=0;y<480;y++)for(let x=0;x<1200;x++){
    const i=(y*1200+x)*4,r=d[i],g=d[i+1],b=d[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);
    const matte=(hi-lo<14&&hi<210)||(b-r<8&&hi<180);
    const u=x%240,v=y%240,edge=Math.min(u,v,239-u,239-v);
    d[i+3]=matte?0:Math.round(d[i+3]*C(edge/9));
   }
   ctx.putImageData(pixels,0,0);cleanBurst=c;
  }catch(e){cleanBurst=null;}
 };
 burst.src="./assets/hydro-serpent-impact.webp?v=0.355.1";
}
function ensure(){loadBurst();if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{sheet.onload=()=>{const ok=ready();if(ok)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();resolve(ok);};sheet.onerror=()=>resolve(false);sheet.src="./assets/hydro-serpent-v6.webp?v=0.355.1";}).finally(()=>pending=null);return pending;}
function frameAt(p){
 if(p<LAUNCH)return Math.min(20,Math.floor(21*p/LAUNCH));
 if(p<=HIT)return 21+Math.min(19,Math.floor(20*(p-LAUNCH)/(HIT-LAUNCH)));
 return 41+Math.min(21,Math.floor(22*(p-HIT)/(END-HIT)));
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1;
 const k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const end={x:target.x,y:target.y-83*k};
 const dx=Math.abs(end.x-x),dy=end.y-y;
 // Affine mapping fixes both the whirlpool origin and the actual impact location.
 // The artwork has substantial padding so every frame uses the same canvas.
 const sx=dx/(CONTACT.x-ROOT.x),sy=Math.max(1.12,Math.min(1.40,Math.abs(dy)/185+0.42));
 const drawSX=sx;
 const shear=(dy-(CONTACT.y-ROOT.y)*sy)/(CONTACT.x-ROOT.x);
 const project=(u,v)=>({x:x+dir*drawSX*(u-ROOT.x),y:y+shear*(u-ROOT.x)+sy*(v-ROOT.y)});
 const n=frameAt(p),start=project(200,191),q=C((p-LAUNCH)/(HIT-LAUNCH));
 const head=p>=HIT?{...end}:p>=LAUNCH?{x:L(start.x,end.x,q),y:L(start.y,end.y,q)-Math.sin(Math.PI*q)*12}:start;
 const alpha=C(p/.018)*(blocked?C((HIT+.18-p)/.18):C((END-p)/.025));
 return{x,y,dir,p,k,end,start,head,n,sx,drawSX,sy,shear,alpha,blocked};
}
function pool(){}
function actor(){}
function impact(){} // Draw the foreground impact after the body in travel().
function splash(g,s,frame,w,h,offsetX,offsetY,alpha,flip=1){
 if(alpha<=0||!cleanBurst)return;
 g.save();g.globalAlpha*=alpha;g.translate(s.end.x+offsetX,s.end.y+offsetY);g.scale(flip,1);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.drawImage(cleanBurst,frame%5*240,Math.floor(frame/5)*240,240,240,-w/2,-h*.70,w,h);
 g.restore();
}
function foreground(g,s){
 if(s.blocked||s.p<HIT||s.p>=.999||!cleanBurst)return;
 const t=C((s.p-HIT)/(.999-HIT)),k=Math.min(1.45,Math.max(.85,s.k));
 // A heavy first strike, then a staggered second surge as the tail
 // reaches the target. Both remain in front of the dissolving body.
 const n=t<.30?Math.min(4,Math.floor(t/.30*5)):Math.min(8,5+Math.floor((t-.30)/.70*4));
 const grow=1+.18*E(t/.20),fade=C((1-t)/.19);
 splash(g,s,n,330*k*grow,315*k*grow,0,12*k,fade,s.dir);
 const q=C((t-.12)/.82),n2=q<.23?Math.min(4,Math.floor(q/.23*5)):Math.min(8,5+Math.floor((q-.23)/.77*4));
 const second=C((t-.12)/.07)*C((1-t)/.12);
 splash(g,s,n2,260*k*(1+.26*q),250*k,-s.dir*24*k,22*k,second*.94,-s.dir);
}
function travel(g,s){
 if(!ready())return;
 if(s.p<END&&s.alpha>0&&s.drawSX>0){
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.x,s.y);g.transform(s.dir*s.drawSX,s.shear,0,s.sy,0,0);
 g.drawImage(sheet,s.n%COLS*W,Math.floor(s.n/COLS)*H,W,H,-ROOT.x,-ROOT.y,W,H);
 g.restore();
 }
 foreground(g,s);
}
function portrait(g,w,h){if(!ready())return;const n=13,scale=Math.min(w/198,h/198)*1.04;g.drawImage(sheet,n%COLS*W+11,Math.floor(n/COLS)*H+129,198,198,(w-198*scale)/2,h-198*scale,198*scale,198*scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:63,bodyFrameCount:63,effectFrameCount:9};ensure();
})();
