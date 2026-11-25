/* Actual 32-frame imported sprite atlases; no procedural replacement models. */
(()=>{"use strict";
const ids=["hellhound","ringoffire","backdraft","furnace","infernaltitan"],frames=32,cell=216;
let images={},loaded=false;const status=message=>{const node=document.getElementById("testerFirePackStatus");if(node)node.textContent=message};
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
  next[id]=img;
 })).then(()=>{
  images=next;loaded=true;status("All 160 Fire frames ready.");
  const api=window.WIZARDRY_ARENA_TEST;
  if(api?.getState()?.mode==="tester"){api.refreshUI();api.drawCardArts();}
  return true;
 }).catch(e=>{status(e.message+". Tap Retry Fire animations.");return false;}).finally(()=>{pending=null;});
 return pending;
}
function frame(ctx,id,i,x,y,size,dir=1,layer){
 const img=images[id];if(!img)return;const n=Math.max(0,Math.min(31,i|0));
 ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const top=-size*.86;
 if(layer){ctx.beginPath();if(layer==="back")ctx.rect(-size/2,top,size,size*.83);else ctx.rect(-size/2,top+size*.83,size,size*.17);ctx.clip();}
 ctx.drawImage(img,n%4*cell,Math.floor(n/4)*cell,cell,cell,-size/2,top,size,size);ctx.restore();
}
function portrait(ctx,id,w,h){if(!loaded){ctx.save();ctx.fillStyle="#ffc89d";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillText("LOADING FIRE ART",w/2,h/2,w-10);ctx.restore();return;}
 frame(ctx,id,id==="backdraft"?18: id==="infernaltitan"?10:14,w/2,h*.87,Math.min(w,h)*.99);}
window.WizardryFireTestArt={ready:()=>loaded,ensure,frame,portrait};
const button=document.getElementById("testerFirePack");
if(button)button.onclick=()=>ensure();
})();