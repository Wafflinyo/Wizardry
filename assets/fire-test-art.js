/* 32 illustrated frames per spell. Furnace is aligned with the original arena background, never drawn as a central summon. */
(()=>{
"use strict";
const clamp=p=>Math.max(0,Math.min(1,p));
function make(name,C,R,peak){
 const atlas=new Image();let pending=null,error="";
 const ready=()=>atlas.complete&&atlas.naturalWidth===C*8&&atlas.naturalHeight===R*4;
 function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{
 const timer=setTimeout(()=>{error="Artwork load timed out";resolve(false);},12000);
 atlas.onload=()=>{clearTimeout(timer);error=ready()?"":"Unexpected atlas dimensions";resolve(ready());try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
 atlas.onerror=()=>{clearTimeout(timer);error="Unable to load "+name+" frames";resolve(false);};
 atlas.src="./assets/fire-"+name+"-v2.webp?v=1";
 }).finally(()=>{pending=null;});return pending;}
 function tile(g,n,x,y,w,h){if(!ready())return;n=Math.max(0,Math.min(31,Math.floor(n)));g.drawImage(atlas,n%8*C,Math.floor(n/8)*R,C,R,x,y,w,h);}
 function targetFrame(g,u,n,factor,layer,opacity){
   const w=(name==="backdraft"?300:240)*factor,h=w*R/C;
   const x=u.x-w/2,y=u.y-h*.77;
   g.save();g.globalAlpha*=opacity;
   if(name==="ring"&&layer){
     // The lower arc sits in front of the wizard's feet, the upper flames behind the wizard.
     const seam=y+h*.76;
     g.beginPath();
     if(layer==="back")g.rect(x,y,w,seam-y);else g.rect(x,seam,w,y+h-seam);
     g.clip();
   }
   tile(g,n,x,y,w,h);g.restore();
 }
 function draw(g,u,p,factor=1,layer){
   const n=name==="backdraft"?(p<.45?Math.floor(p/.45*16):16+Math.floor((p-.45)/.55*16)):Math.floor(clamp(p)*32);
   targetFrame(g,u,n,factor,layer,Math.min(1,clamp((1-p)/.07)));
 }
 function idle(g,u,time,factor=1,layer){
   const beat=Math.floor(time/105)%12,n=8+(beat<=6?beat:12-beat);
   targetFrame(g,u,n,factor,layer,.92);
 }
 function portrait(g,w,h){const width=Math.min(w*.99,h*C/R),height=width*R/C;tile(g,peak,(w-width)/2,(h-height)/2,width,height);}
 function landscape(g,{x,y,width,height,time,strength,progress}){
   if(!ready())return;
   const beat=Math.floor(time/115)%18;
   const n=progress==null||progress>=.55?10+(beat<=9?beat:18-beat):Math.floor(clamp(progress/.55)*10);
   // Match the stage-wide painted floor, retaining the original architecture.
   // The atlas contains spread-out vents and molten cracks, with no characters.
   g.save();g.globalAlpha*=Math.min(1,strength+.18);
   tile(g,n,x-width*.015,y+height*.24,width*1.03,height*.76);g.restore();
 }
 ensure();return {ensure,ready,error:()=>error,draw,idle,portrait,landscape};
}
window.FireTestArt={ringoffire:make("ring",224,224,14),backdraft:make("backdraft",224,224,19),furnace:make("furnace",256,160,16)};
})();