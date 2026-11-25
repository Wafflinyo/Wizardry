/* Individually cut 24 actor poses + 30 separate flame poses, served from the game. */
(()=>{
"use strict";
const W=320,H=256,COLS=6,clamp=x=>Math.max(0,Math.min(1,x));
// Direct Image atlas rendering, matching the other Fire spell modules.
const atlas=new Image(),listeners=[];
let pending=null,lastError="",loaded=false;
const status=msg=>{const el=document.getElementById("hellhoundStatus");if(el)el.textContent=msg;};
const ready=()=>loaded&&atlas.naturalWidth===W*COLS&&atlas.naturalHeight===H*9;
function ensure(){
 if(ready())return Promise.resolve(true);
 if(pending)return pending;
 status("Loading Hellhound artwork…");
 pending=new Promise(resolve=>{
  const finish=ok=>{clearTimeout(timer);resolve(ok);};
  const timer=setTimeout(()=>{lastError="Artwork load timed out";status(lastError);finish(false);},12000);
  atlas.onload=()=>{
   loaded=atlas.naturalWidth===W*COLS&&atlas.naturalHeight===H*9;
   if(!loaded){lastError="Unexpected atlas dimensions: "+atlas.naturalWidth+" × "+atlas.naturalHeight;status(lastError);finish(false);return;}
   lastError="";status("Hellhound artwork ready");finish(true);
   for(const fn of listeners.splice(0)){try{fn();}catch(e){console.warn(e);}}
   try{window.WIZARDRY_ARENA_TEST?.drawCardArts();}catch(e){console.warn("Hellhound portrait refresh",e);}
  };
  atlas.onerror=()=>{loaded=false;lastError="Could not load Hellhound sprite atlas";status(lastError);finish(false);};
  atlas.src="./assets/hellhound-frames.webp?v=0.352.3";
 }).finally(()=>{pending=null;});
 return pending;
}
function tile(g,n,x,y,w,h){
 if(!ready())return;
 g.drawImage(atlas,(n%COLS)*W,Math.floor(n/COLS)*H,W,H,x,y,w,h);
}
function actor(g,n,x,y,scale,dir){
 if(!ready())return;
 g.save();g.translate(x,y);g.scale(dir*scale,scale);g.imageSmoothingEnabled=true;
 tile(g,n,-160,-227,W,H);g.restore();
}
// Mouth positions measured from individual 320×256 rendered poses.
// Order: main (middle), far/upper adjacent, near/lower adjacent.
const mouths={
 13:[[203,120],[280,139],[106,137]],
 14:[[190,103],[271,124],[99,130]],
 15:[[195,108],[270,128],[101,121]]
};
function scene(source,target,entries,p){
 const dir=target.x>=source.x?1:-1,scale=1.28,x=500,y=510;
 let n;
 if(p<.42)n=Math.min(12,Math.floor(p/.42*13));
 else if(p<.70)n=[13,14,15,14][Math.min(3,Math.floor((p-.42)/.28*4))];
 else if(p<.83)n=16+Math.min(3,Math.floor((p-.70)/.13*4));
 else n=20+Math.min(3,Math.floor((p-.83)/.17*4));
 const streams=[];
 if(p>=.42&&p<.70){
  const q=clamp((p-.42)/.28),f=Math.min(29,Math.floor(q*30));
  const positions=mouths[n]||mouths[14];
  for(const e of entries){
   const [mx,my]=positions[e.head];
   streams.push({sx:x+dir*(mx-160)*scale,sy:y+(my-227)*scale,x:e.x,y:e.y,ty:e.y-72,q,f});
  }
 }
 return {dir,scale,x,y,n,p,streams};
}
function draw(g,s){g.save();
 g.globalAlpha*=Math.min(clamp(s.p/.04),clamp((1-s.p)/.02));
 actor(g,s.n,s.x,s.y,s.scale,s.dir);g.restore();}
function flame(g,s){
 if(!ready())return;
 const dx=s.x-s.sx,dy=s.ty-s.sy,len=Math.hypot(dx,dy);if(len<1)return;
 // Each stream is independently aimed from its own mouth at its assigned target.
 // Atlas flame starts on the left, with growth already rendered into its 30 frames.
 g.save();g.translate(s.sx,s.sy);g.rotate(Math.atan2(dy,dx));g.imageSmoothingEnabled=true;
 const width=len/0.90,height=Math.min(168,Math.max(81,len*.57));
 tile(g,24+s.f,-width*.05,-height*.52,width,height);g.restore();
}
function portrait(g,w,h){
 if(!ready()){ensure();g.save();g.fillStyle="#ffba81";g.font="bold 10px system-ui";g.textAlign="center";g.fillText("Loading…",w/2,h/2);g.restore();return;}
 const scale=Math.min(w/295,h/210);actor(g,8,w/2,h*.97,scale,1);
}
window.HellhoundArt={ensure,ready,error:()=>lastError,scene,draw,flame,portrait,onReady:fn=>{if(ready())fn();else listeners.push(fn);}};
ensure();
})();