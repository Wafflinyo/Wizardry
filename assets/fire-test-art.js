/* Frame-only test spell effects. No baked characters. */
(()=>{
"use strict";
const C=240,R=160,clamp=p=>Math.max(0,Math.min(1,p));
function make(name,count,peak){
 const atlas=new Image();let pending=null,error="";
 const ready=()=>atlas.complete&&atlas.naturalWidth===1920&&atlas.naturalHeight===Math.ceil(count/8)*160;
 function ensure(){if(ready())return Promise.resolve(true);if(pending)return pending;pending=new Promise(resolve=>{
 atlas.onload=()=>{error=ready()?"":"Unexpected atlas dimensions";resolve(ready());try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){}};
 atlas.onerror=()=>{error="Unable to load "+name+" frames";resolve(false);};
 atlas.src="./assets/fire-"+name+"-v1.webp?v=1";
 }).finally(()=>{pending=null;});return pending;}
 function tile(g,n,x,y,w,h){if(!ready())return;n=Math.max(0,Math.min(count-1,Math.floor(n)));g.drawImage(atlas,n%8*C,Math.floor(n/8)*R,C,R,x,y,w,h);}
 function draw(g,u,p,factor=1){const w=(name==="backdraft"?320:285)*factor,h=w*R/C;g.save();g.globalAlpha*=Math.min(1,clamp((1-p)/.08));tile(g,Math.floor(clamp(p)*count),u.x-w/2,u.y-h*.79,w,h);g.restore();}
 function idle(g,u,time,factor=1){const w=260*factor,h=w*R/C;g.save();g.globalAlpha*=.85;tile(g,5+Math.floor(time/130)%8,u.x-w/2,u.y-h*.80,w,h);g.restore();}
 function portrait(g,w,h){const width=Math.min(w*.98,h*1.5),height=width*R/C;tile(g,peak,(w-width)/2,(h-height)/2,width,height);}
 function field(g,time,progress){const n=progress==null?8+Math.floor(time/110)%16:Math.floor(clamp(progress)*32);g.save();g.globalAlpha*=.92;tile(g,n,155,240,690,460);g.restore();}
 ensure();return {ensure,ready,error:()=>error,draw,idle,portrait,field};
}
window.FireTestArt={ringoffire:make("ring",40,20),backdraft:make("backdraft",48,20),furnace:make("furnace",32,20)};
})();