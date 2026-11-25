/* Actual 32-frame imported sprite atlases; no procedural replacement models. */
(()=>{"use strict";
const ids=["hellhound","ringoffire","backdraft","furnace","infernaltitan"],frames=32,cell=216;
let images={},loaded=false;const status=message=>{const node=document.getElementById("testerFirePackStatus");if(node)node.textContent=message};
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open("WizardryFireTestArt",1);req.onupgradeneeded=()=>req.result.createObjectStore("packs");req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function readPack(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction("packs","readonly"),r=tx.objectStore("packs").get("fire-v1");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function savePack(pack){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction("packs","readwrite");tx.objectStore("packs").put(pack,"fire-v1");tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};});}
async function load(pack){
 if(pack?.version!==1||pack.frames!==frames||pack.cell!==cell||!pack.sprites)throw Error("Invalid Fire Test Pack.");
 const next={};await Promise.all(ids.map(async id=>{
  const src=pack.sprites[id];if(typeof src!=="string"||!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(src)||src.length>1500000)throw Error("Missing or invalid atlas: "+id);
  const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Cannot decode "+id));img.src=src;});
  if(img.naturalWidth!==4*cell||img.naturalHeight!==8*cell)throw Error("Invalid frame dimensions for "+id);
  next[id]=img;
 }));
 images=next;loaded=true;const api=window.WIZARDRY_ARENA_TEST;if(api?.getState()?.mode==="tester"){api.refreshUI();api.drawCardArts();}
}
function frame(ctx,id,i,x,y,size,dir=1,layer){
 const img=images[id];if(!img)return;const n=Math.max(0,Math.min(31,i|0));
 ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 const top=-size*.86;
 if(layer){ctx.beginPath();if(layer==="back")ctx.rect(-size/2,top,size,size*.83);else ctx.rect(-size/2,top+size*.83,size,size*.17);ctx.clip();}
 ctx.drawImage(img,n%4*cell,Math.floor(n/4)*cell,cell,cell,-size/2,top,size,size);ctx.restore();
}
function portrait(ctx,id,w,h){if(!loaded){ctx.save();ctx.fillStyle="#ffc89d";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.fillText("IMPORT FIRE TEST PACK",w/2,h/2,w-10);ctx.restore();return;}
 frame(ctx,id,id==="backdraft"?18: id==="infernaltitan"?10:14,w/2,h*.87,Math.min(w,h)*.99);}
window.WizardryFireTestArt={ready:()=>loaded,frame,portrait};
const button=document.getElementById("testerFirePack"),input=document.getElementById("testerFirePackInput");
if(button&&input){button.onclick=()=>input.click();input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{status("Loading the 160 animation frames…");if(file.size>6000000)throw Error("Pack is too large.");const pack=JSON.parse(await file.text());await load(pack);try{await savePack(pack);status("Fire Test Pack ready · saved on this device.");}catch{status("Fire Test Pack ready for this session. Storage is unavailable.");}}catch(e){status(e.message);}finally{input.value="";}};}
readPack().then(pack=>pack&&load(pack).then(()=>status("Fire Test Pack ready · saved on this device."))).catch(()=>{});
})();