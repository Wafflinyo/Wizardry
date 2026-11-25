/* Actual 32-frame imported sprite atlases; no procedural replacement models. */
(()=>{"use strict";
const ids=["hellhound","ringoffire","backdraft","furnace","infernaltitan"],frames=32,cell=216;
let images={},loaded=false;
// Isolate all source cells before scaling. Never sample adjacent atlas poses.
const padding=8, stride=cell+padding*2;
function isolate(img){
 return Array.from({length:frames},(_,n)=>{
  const tile=document.createElement("canvas");tile.width=tile.height=stride;
  const ctx=tile.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,n%4*cell,Math.floor(n/4)*cell,cell,cell,padding,padding,cell,cell);
  const pixels=ctx.getImageData(0,0,stride,stride),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const a=d[i+3];if(a<=18){d[i]=d[i+1]=d[i+2]=d[i+3]=0;}else if(a<55){d[i+3]=Math.round((a-18)*55/37);}}
  ctx.putImageData(pixels,0,0);return tile;
 });
}const status=message=>{const node=document.getElementById("testerFirePackStatus");if(node)node.textContent=message};
let pending=null;
function ensure(){
 if(loaded)return Promise.resolve(true);
 if(pending)return pending;
 status("Loading all 160 Fire animation frames…");
 const next={};
 pending=Promise.all(ids.map(async id=>{
  const img=new Image();await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error("Timed out loading "+id)),20000);
   img.onload=()=>{clearTimeout(timer);resolve();};
   img.onerror=()=>{clearTimeout(timer);reject(Error("Cannot load "+id));};
   img.src="./assets/fire-test-"+id+"-v1.webp";
  });
  if(img.naturalWidth!==4*cell||img.naturalHeight!==8*cell)throw Error("Invalid frame dimensions for "+id);
  next[id]=isolate(img);
 })).then(()=>{
  images=next;loaded=true;status("All 160 Fire frames ready.");
  const api=window.WIZARDRY_ARENA_TEST;
  if(api?.getState()?.mode==="tester"){api.refreshUI();api.drawCardArts();}
  return true;
 }).catch(e=>{status(e.message+". Tap Retry Fire animations.");return false;}).finally(()=>{pending=null;});
 return pending;
}
function frame(ctx,id,i,x,y,size,dir=1,layer){
 const atlas=images[id];if(!atlas)return;let n=Math.max(0,Math.min(31,i|0));
 // The stationary Furnace cycle plays forward and backward without a last-to-first snap.
 if(id==="furnace"&&layer==="loop"){const step=Math.max(0,i|0)%14;n=24+(step<=7?step:14-step);layer=undefined;}
 const img=atlas[n];
 ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const top=-size*.86;
 if(layer){const split=top+size*.76;ctx.beginPath();if(layer==="back")ctx.rect(-size/2-size*.05,top-size*.05,size*1.1,split-top+size*.05);else ctx.rect(-size/2-size*.05,split,size*1.1,top+size*1.05-split);ctx.clip();}
 const pad=size*padding/cell;
 ctx.drawImage(img,-size/2-pad,top-pad,size+2*pad,size+2*pad);ctx.restore();
}
function portrait(ctx,id,w,h){if(!loaded){ctx.save();ctx.fillStyle="#ffc89d";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillText("LOADING FIRE ART",w/2,h/2,w-10);ctx.restore();return;}
 frame(ctx,id,id==="backdraft"?18: id==="infernaltitan"?10:14,w/2,h*.87,Math.min(w,h)*.99);}
window.WizardryFireTestArt={ready:()=>loaded,ensure,frame,portrait};
const button=document.getElementById("testerFirePack");
if(button)button.onclick=()=>ensure();
})();