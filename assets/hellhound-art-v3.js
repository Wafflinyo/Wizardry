/* Individually cut 24 actor poses + 30 separate flame poses, served from the game. */
(()=>{
"use strict";
const W=320,H=256,COLS=6,clamp=x=>Math.max(0,Math.min(1,x));
let tiles=[],pending=null;
const status=msg=>{const el=document.getElementById("hellhoundStatus");if(el)el.textContent=msg;};
async function decode(src){
 const img=new Image();
 await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Invalid artwork file"));img.src=src;});
 if(img.naturalWidth!==1920||img.naturalHeight!==2304)throw Error("Hellhound artwork has invalid dimensions.");
 const next=Array.from({length:54},(_,n)=>{
  const tile=document.createElement("canvas");tile.width=W;tile.height=H;
  const g=tile.getContext("2d");g.drawImage(img,(n%COLS)*W,Math.floor(n/COLS)*H,W,H,0,0,W,H);return tile;
 });
 tiles=next;status("Hellhound artwork ready · 24 character / 30 flame frames");window.WIZARDRY_ARENA_TEST?.drawCardArts();return true;
}
function ensure(){
 if(tiles.length===54)return Promise.resolve(true);
 if(pending)return pending;
 status("Loading Hellhound artwork…");
 pending=decode("./assets/hellhound-test-art-v3.webp?v=1").catch(e=>{status(e.message);return false;}).finally(()=>{pending=null;});
 return pending;
}
function actor(g,n,x,y,scale,dir){
 const tile=tiles[n];if(!tile)return;
 g.save();g.translate(x,y);g.scale(dir*scale,scale);g.imageSmoothingEnabled=true;
 g.drawImage(tile,-160,-227);g.restore();
}
// Mouth positions measured from individual 320×256 rendered poses.
// Order: main (middle), far/upper adjacent, near/lower adjacent.
const mouths={
 13:[[203,120],[280,139],[106,137]],
 14:[[190,103],[271,124],[99,130]],
 15:[[195,108],[270,128],[101,121]]
};
function scene(source,target,entries,p){
 const dir=target.x>=source.x?1:-1,scale=.92,x=500,y=510;
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
 const tile=tiles[24+s.f];if(!tile)return;
 const dx=s.x-s.sx,dy=s.ty-s.sy,len=Math.hypot(dx,dy);if(len<1)return;
 // Each stream is independently aimed from its own mouth at its assigned target.
 // Atlas flame starts on the left, with growth already rendered into its 30 frames.
 g.save();g.translate(s.sx,s.sy);g.rotate(Math.atan2(dy,dx));g.imageSmoothingEnabled=true;
 const width=len/0.90,height=Math.min(112,Math.max(54,len*.38));
 g.drawImage(tile,-width*.05,-height*.52,width,height);g.restore();
}
function portrait(g,w,h){
 if(tiles.length!==54){ensure();g.save();g.fillStyle="#ffba81";g.font="bold 10px system-ui";g.textAlign="center";g.fillText("Loading…",w/2,h/2);g.restore();return;}
 const scale=Math.min(w/295,h/210);actor(g,8,w/2,h*.97,scale,1);
}
window.HellhoundArt={ensure,ready:()=>tiles.length===54,scene,draw,flame,portrait};
})();