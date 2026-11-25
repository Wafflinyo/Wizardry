/* Individually cut 24 actor poses + 30 flame poses; single lossless-alpha atlas.
   A user-imported atlas is persisted locally, never mixed with old Hellhound art. */
(()=>{
"use strict";
const W=320,H=256,COLS=6,KEY="wizardry.hellhound.v3.atlas",clamp=x=>Math.max(0,Math.min(1,x));
let tiles=[],pending=null;
const status=msg=>{const el=document.getElementById("hellhoundStatus");if(el)el.textContent=msg;};
async function decode(src){
 const img=new Image();
 await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Invalid artwork file"));img.src=src;});
 if(img.naturalWidth!==1920||img.naturalHeight!==2304)throw Error("Select the supplied 1920 × 2304 Hellhound-Test-Art.webp");
 const next=Array.from({length:54},(_,n)=>{
  const tile=document.createElement("canvas");tile.width=W;tile.height=H;
  const g=tile.getContext("2d");g.drawImage(img,(n%COLS)*W,Math.floor(n/COLS)*H,W,H,0,0,W,H);return tile;
 });
 tiles=next;status("Hellhound artwork ready · 24 character / 30 flame frames");window.WIZARDRY_ARENA_TEST?.drawCardArts();return true;
}
async function ensure(){
 if(tiles.length===54)return true;if(pending)return pending;
 let saved;try{saved=localStorage.getItem(KEY);}catch{}
 if(!saved){status("Import Hellhound-Test-Art.webp once to enable the spell.");return false;}
 pending=decode(saved).catch(e=>{status(e.message);return false;}).finally(()=>{pending=null;});return pending;
}
const input=document.getElementById("hellhoundFile"),button=document.getElementById("hellhoundImport");
if(button&&input){
 button.onclick=()=>input.click();
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;status("Loading Hellhound frames…");
  try{
   const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   await decode(src);
   try{localStorage.setItem(KEY,src);}catch{status("Artwork ready for this session. Browser storage is unavailable.");}
  }catch(e){status(e.message);}finally{input.value="";}
 };
}
function actor(g,n,x,y,scale,dir){
 const tile=tiles[n];if(!tile)return;
 g.save();g.translate(x,y);g.scale(dir*scale,scale);g.imageSmoothingEnabled=true;
 g.drawImage(tile,-160,-227);g.restore();
}
// Mouth positions measured from individual 320×256 rendered poses.
// Order: main (middle), far/upper adjacent, near/lower adjacent.
const mouths={
 13:[[202,117],[279,134],[109,130]],
 14:[[190,96],[270,117],[96,130]],
 15:[[194,106],[270,122],[99,112]]
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
function draw(g,s){if(s.p<.04||s.p>.98)g.save();else g.save();
 g.globalAlpha*=Math.min(clamp(s.p/.04),clamp((1-s.p)/.02));
 actor(g,s.n,s.x,s.y,s.scale,s.dir);g.restore();}
function flame(g,s){
 const tile=tiles[24+s.f];if(!tile)return;
 const dx=s.x-s.sx,dy=s.ty-s.sy,len=Math.hypot(dx,dy);if(len<1)return;
 // Each stream is independently aimed from its own mouth at its assigned target.
 // Atlas flame starts on the left, with growth already rendered into its 30 frames.
 g.save();g.translate(s.sx,s.sy);g.rotate(Math.atan2(dy,dx));g.imageSmoothingEnabled=true;
 g.drawImage(tile,0,-60,len*1.06,120);g.restore();
}
function portrait(g,w,h){if(tiles.length!==54)return;const scale=Math.min(w/310,h/220);actor(g,8,w/2,h*.96,scale,1);}
window.HellhoundArt={ensure,ready:()=>tiles.length===54,scene,draw,flame,portrait};
})();