/* Card-only portraits. Fit visible atlas pixels; never change battle sprites. */
(function(root){
'use strict';
const portraits={},listeners=[];
const SPECS={
 frosty:{source:()=> './assets/frosty-v85.webp',rect:im=>[0,0,im.naturalWidth/4,im.naturalHeight/3]},
 bender:{source:()=> './assets/stone-bender-v83.webp?v=0.83.1',rect:im=>[im.naturalWidth*3/4,0,im.naturalWidth/4,im.naturalHeight/3]},
 reaper:{source:()=> './assets/reaper-v82.webp',rect:im=>[im.naturalWidth*3/4,0,im.naturalWidth/4,im.naturalHeight/3]},
 thunder:{source:()=> './assets/thunderclap-v79.webp',rect:im=>[im.naturalWidth/4,im.naturalHeight/3,im.naturalWidth/4,im.naturalHeight/3]},
 shark:{source:()=> './assets/reef-rush-v77.webp',rect:im=>[im.naturalWidth/2,im.naturalHeight/2,im.naturalWidth/4,im.naturalHeight/4]},
 poseidon:{source:()=>root.WIZARDRY_POSEIDON_V22_ROWS?.[1],rect:()=>[940,0,314,313]},
 golem:{source:()=>root.WIZARDRY_GOLEM_V23_ROWS?.[2],rect:()=>[627,0,313,313]},
 volt:{source:()=> './assets/professor-volt-small-v50.webp',rect:()=>[512,0,256,256]},
 estel:{source:()=> './assets/lady-estel-v51.webp',rect:()=>[768,0,256,256]},
 wind:{source:()=> './assets/tornado-approved-v54.webp',rect:()=>[578,0,289,343]},
 vampire:{source:()=> './assets/vampire-siphon-v58.webp',rect:()=>[0,768,256,256]},
 // Ignore the known stray strip above the dragon's approved charge pose.
 dragon:{source:()=> './assets/baby-dragon-fire-v62.webp',rect:()=>[0,596,256,172]},
 bear:{source:()=> './assets/polar-bear-v67.webp',rect:im=>[im.naturalWidth/2,im.naturalHeight/4,im.naturalWidth/4,im.naturalHeight/4]}
};
function contain(bounds,w,h,pad=6){
 const inset=Math.max(pad,Math.min(w,h)*.065);
 const scale=Math.min(Math.max(1,w-2*inset)/bounds.w,Math.max(1,h-2*inset)/bounds.h);
 const width=bounds.w*scale,height=bounds.h*scale;
 return{x:(w-width)/2,y:(h-height)/2,w:width,h:height};
}
function prepare(id){
 if(portraits[id])return portraits[id];
 const spec=SPECS[id],source=spec?.source();if(!source)return null;
 const entry=portraits[id]={image:new Image(),bounds:null};
 entry.image.onload=()=>{
  const [sx,sy,sw,sh]=spec.rect(entry.image);
  const sample=document.createElement('canvas');sample.width=Math.round(sw);sample.height=Math.round(sh);
  const c=sample.getContext('2d',{willReadFrequently:true});
  c.drawImage(entry.image,sx,sy,sw,sh,0,0,sample.width,sample.height);
  const pixels=c.getImageData(0,0,sample.width,sample.height).data;
  let left=sample.width,top=sample.height,right=-1,bottom=-1;
  for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
   if(pixels[(y*sample.width+x)*4+3]<20)continue;
   left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left){left=0;top=0;right=sample.width-1;bottom=sample.height-1;}
  // Include a small transparent margin around all visible fur, wings,
  // weapons and spell orbs. No aspect stretching or hidden lower half.
  left=Math.max(0,left-2);top=Math.max(0,top-2);
  right=Math.min(sample.width-1,right+2);bottom=Math.min(sample.height-1,bottom+2);
  entry.bounds={x:left,y:top,w:right-left+1,h:bottom-top+1};
  entry.sample=sample;
  for(const callback of listeners)callback();
 };
 entry.image.src=source;return entry;
}
function draw(id,c,w,h){
 if(id==='static'&&root.WIZARDRY_STATIC_SHOCK_V88){root.WIZARDRY_STATIC_SHOCK_V88.emblem(c,w/2,h/2,Math.min(w*.78,h*.78));return true;}
 if(id==='calming'&&root.WIZARDRY_CALMING_WATERS_V87){root.WIZARDRY_CALMING_WATERS_V87.emblem(c,w/2,h/2,Math.min(w*.78,h*.78));return true;}
 if(id==='solidity'&&root.WIZARDRY_SOLIDITY_V86){root.WIZARDRY_SOLIDITY_V86.emblem(c,w/2,h/2,Math.min(w*.78,h*.78));return true;}
 const entry=prepare(id);if(!entry?.bounds||!c||w<=0||h<=0)return false;
 const b=entry.bounds,d=contain(b,w,h);
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(entry.sample,b.x,b.y,b.w,b.h,d.x,d.y,d.w,d.h);c.restore();return true;
}
root.WIZARDRY_CARD_ART_V70={draw,contain,onReady:fn=>listeners.push(fn),
 info:id=>{const e=portraits[id];return e?.bounds?{bounds:e.bounds,ready:true}:null;}};
})(window);
