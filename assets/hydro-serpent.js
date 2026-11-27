/* Hydro Serpent: all 64 newly illustrated frames, played as one continuous
   sequence. Source water is anchored independently during the dive; the
   moving body uses the same illustrated poses with the source water masked out. */
(()=>{
"use strict";
const W=224,H=256,CENTER=112,GROUND=240,LAUNCH=.45,HIT=.67,END=.995;
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,p)=>a+(b-a)*p,E=p=>C(p)*C(p)*(3-2*C(p));
const sheet=new Image();
let diveMask=null;
// Hand-traced lower body boundary for each original diving pose. Feather
// only where the creature overlaps its source water; retain the head.
const cuts=[[[0,175],[60,182],[95,204],[128,210],[155,198],[180,177],[224,175]],[[0,176],[60,183],[95,205],[128,210],[153,195],[180,177],[224,175]],[[0,177],[60,185],[95,205],[128,208],[150,194],[180,176],[224,175]],[[0,178],[60,182],[90,202],[118,203],[145,190],[166,204],[188,206],[224,195]],[[0,177],[55,180],[85,201],[115,199],[140,191],[156,207],[177,222],[194,220],[224,211]],[[0,175],[55,181],[82,199],[110,195],[135,193],[153,211],[177,224],[194,224],[224,213]],[[0,177],[55,183],[80,200],[111,197],[135,193],[157,210],[177,223],[194,223],[224,210]]];
function prepareDiveMask(){
 if(diveMask)return true;
 if(typeof document==="undefined")return false;
 try{
  const canvas=document.createElement("canvas");canvas.width=W*7;canvas.height=H;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  for(let i=0;i<7;i++){const n=i+27;ctx.drawImage(sheet,n%8*W,Math.floor(n/8)*H,W,H,i*W,0,W,H);}
  const pixels=ctx.getImageData(0,0,canvas.width,H),data=pixels.data;
  for(let i=0;i<7;i++){
   const curve=cuts[i];let j=0;
   for(let x=0;x<W;x++){
    while(j<curve.length-2&&x>curve[j+1][0])j++;
    const a=curve[j],b=curve[j+1],limit=L(a[1],b[1],(x-a[0])/(b[0]-a[0]));
    for(let y=0;y<H;y++){const p=(y*canvas.width+i*W+x)*4+3;data[p]=Math.round(data[p]*C((limit-y)/16));}
   }
  }
  ctx.putImageData(pixels,0,0);diveMask=canvas;return true;
 }catch(e){return false;}
}
const ready=()=>sheet.complete&&sheet.naturalWidth===1792&&sheet.naturalHeight===2048;
let pending=null;
function ensure(){if(ready()){prepareDiveMask();return Promise.resolve(true);}if(pending)return pending;pending=new Promise(resolve=>{sheet.onload=()=>{const ok=ready();if(ok){prepareDiveMask();window.WIZARDRY_ARENA_TEST?.drawCardArts?.();}resolve(ok);};sheet.onerror=()=>resolve(false);sheet.src="./assets/hydro-serpent-v7.webp?v=0.355.3";}).finally(()=>pending=null);return pending;}
function frameAt(p){
 if(p<LAUNCH)return Math.min(26,Math.floor(27*p/LAUNCH));
 if(p<=HIT)return 27+Math.min(6,Math.floor(7*(p-LAUNCH)/(HIT-LAUNCH)));
 return 34+Math.min(29,Math.floor(30*(p-HIT)/(END-HIT)));
}
function scene(source,target,p,factor=1,blocked=false){
 p=C(p);const x=500,y=510,dir=target.x>=x?1:-1,k=(.70+.26*C((target.y-288)/235))*Math.max(1,factor);
 const end={x:target.x,y:target.y-83*k},scale=1.55;
 // Frame 33's downward snout is near (178,225) in its original cell.
 // Translate the whole illustrated pose smoothly; do not alter its proportions.
 const strike={x:end.x-dir*66*scale,y:end.y+15*scale};
 const u=E((p-LAUNCH)/(HIT-LAUNCH)),follow=E((p-HIT)/.065);
 const splashGround={x:end.x,y:end.y+30*scale};
 const drawX=p<=HIT?L(x,strike.x,u):L(strike.x,splashGround.x,follow);
 const drawY=p<=HIT?L(y,strike.y,u)-Math.sin(Math.PI*u)*22:L(strike.y,splashGround.y,follow);
 const n=frameAt(p),alpha=C(p/.025)*(blocked?C((HIT+.10-p)/.10):C((END-p)/.055));
 return{x,y,dir,p,k,end,drawX,drawY,scale,n,alpha,blocked};
}
function pool(g,s){
 if(!ready()||s.p<LAUNCH||s.p>=.88)return;
 // The source whirlpool never follows drawX/drawY. Play the existing
 // illustrated pool poses in a smooth ping-pong, then settle in place.
 const q=C((s.p-.73)/.15),phase=Math.floor((s.p-LAUNCH)*22)%10;
 const n=s.p<.73?5-Math.min(phase,10-phase):Math.max(0,5-Math.floor(q*6));
 const opacity=C((.88-s.p)/.15);
 g.save();g.globalAlpha*=opacity;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.x,s.y);g.scale(s.scale,s.scale);
 g.drawImage(sheet,n*W,0,W,H,-CENTER,-GROUND,W,H);g.restore();
}
function actor(){}
function impact(){}
function travel(g,s){if(!ready()||s.p>=END||s.alpha<=0)return;
 g.save();g.globalAlpha*=s.alpha;g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
 g.translate(s.drawX,s.drawY);g.scale(s.dir*s.scale,s.scale);
 if(s.n>=27&&s.n<=33){
  // Do not render the baked source pool with the traveling serpent.
  if(diveMask)g.drawImage(diveMask,(s.n-27)*W,0,W,H,-CENTER,-GROUND,W,H);
  else g.drawImage(sheet,s.n%8*W,Math.floor(s.n/8)*H,W,175,-CENTER,-GROUND,W,175);
 }else g.drawImage(sheet,s.n%8*W,Math.floor(s.n/8)*H,W,H,-CENTER,-GROUND,W,H);
 g.restore();
}
function portrait(g,w,h){if(!ready())return;const n=19,scale=Math.min(w/160,h/215)*1.03;g.drawImage(sheet,n%8*W,Math.floor(n/8)*H,W,H,(w-W*scale)/2,h-GROUND*scale,W*scale,H*scale);}
window.HydroSerpent={ensure,ready,scene,pool,actor,travel,impact,portrait,hit:HIT,frameCount:64,bodyFrameCount:64,effectFrameCount:0};ensure();
})();
