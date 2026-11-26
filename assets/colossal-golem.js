/* Colossal Golem: 48 actual raster frames cut from the approved six-by-eight
   source sheet. Each row is separately loaded and all rows must be ready.
   No procedural replacement poses or unrelated creature art. */
(()=>{
"use strict";
const COUNT=48,CELL=64,ROWS=8,COLS=6,rows=Array.from({length:ROWS},()=>new Image());
const full=new Image();let fullReady=false,pending=null,lastError="";
const C=p=>Math.max(0,Math.min(1,p)),L=(a,b,t)=>a+(b-a)*t;
const smooth=p=>{p=C(p);return p*p*(3-2*p);};
const rowReady=im=>im.complete&&im.naturalWidth===CELL*COLS&&im.naturalHeight===CELL;
const ready=()=>fullReady||rows.every(rowReady);
function ensure(){
 if(ready())return Promise.resolve(true);if(pending)return pending;
 const load=rows.map((im,i)=>rowReady(im)?Promise.resolve(true):new Promise(resolve=>{
  im.onload=()=>resolve(rowReady(im));im.onerror=()=>resolve(false);im.src="./assets/colossal-golem-row"+i+".webp?v=1";
 }));
 pending=Promise.all(load).then(ok=>{const success=ok.every(Boolean)||fullReady;lastError=success?"":"Colossal Golem artwork unavailable";if(success)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();return success;}).finally(()=>pending=null);
 return pending;
}
// Prefer the full-resolution source if supplied, otherwise use the eight
// compressed rows. Both formats use the same 48 real source poses.
full.onload=()=>{fullReady=full.naturalWidth===1152&&full.naturalHeight===1536;if(fullReady)window.WIZARDRY_ARENA_TEST?.drawCardArts?.();};
full.onerror=()=>{};
function loadFull(){full.src="./assets/colossal-golem-frames.webp?v=1";}
function frameAt(p){return Math.min(COUNT-1,Math.floor(C(p)*COUNT));}
function scene(source,target,p,factor=1){
 p=C(p);const dir=source.team===0?1:-1,frame=frameAt(p);
 const size=Math.min(465,Math.max(320,320+86*(factor-1)));
 // The source image's first palm contact is at (.54,.57) of its tile.
 // Feet sit near .94. Place the palm contact on the target torso.
 const contactX=.54,contactY=.57,footY=.94;
 const depthScale=.60+.30*C((target.y-288)/235);
 const torsoY=target.y-106*depthScale*factor;
 const endX=target.x-dir*(contactX-.5)*size;
 const endY=torsoY+(footY-contactY)*size;
 const travel=smooth((p-18/48)/(12/48));
 const x=L(500,endX,travel),y=L(510,endY,travel);
 const opacity=1-smooth((p-46/48)/(2/48));
 return {x,y,dir,frame,size,p,opacity,contactX:target.x,contactY:torsoY};
}
function tile(g,n,x,y,w,h){
 const i=Math.max(0,Math.min(COUNT-1,n|0));
 if(fullReady){g.drawImage(full,(i%6)*192,Math.floor(i/6)*192,192,192,x,y,w,h);return;}
 const im=rows[Math.floor(i/6)];if(rowReady(im))g.drawImage(im,(i%6)*CELL,0,CELL,CELL,x,y,w,h);
}
function draw(g,s){
 if(s.opacity<=0)return;g.save();g.translate(s.x,s.y);g.scale(s.dir,1);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.globalAlpha*=s.opacity;
 tile(g,s.frame,-s.size*.5,-s.size*.94,s.size,s.size);g.restore();
}
function shake(p,hit=31/48){
 const q=(p-hit)/.08;if(q<0||q>=1)return{x:0,y:0};
 const a=(1-q)**2;return{x:Math.sin(q*43)*10*a,y:Math.cos(q*33)*7*a};
}
function portrait(g,w,h){const s=Math.min(w*1.13,h*1.08);g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";tile(g,15,(w-s)/2,h-s*.97,s,s);g.restore();}
window.ColossalGolem={frameCount:COUNT,frameAt,scene,draw,shake,portrait,ensure,ready,error:()=>lastError,loadFull};ensure();
})();