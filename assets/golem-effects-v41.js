/* Wizardry 0.41 — independent, frame-based Stone Golem effects.
   Three separate animations: published slam sprites, a baked looping
   traveling rock-head sheet, and a baked impact sheet. This file uses
   *existing approved rock art*; there are no Canvas-drawn fake fissures. */
(function(root){
"use strict";
const SCENE={x:500,y:470};
const SLAM_FRAMES=12,TRAVEL_FRAMES=8,IMPACT_FRAMES=8;
const slam=new Image();
slam.decoding="async";
slam.src="./assets/stone-golem-groundslam.webp";
let travelAtlas=null,impactAtlas=null,sourceKey=null;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
function srcFragment(ctx,image,rect,x,y,w,h,mirror=false,alpha=1){
  if(!image||!image.complete||!image.naturalWidth)return;
  ctx.save();ctx.globalAlpha*=alpha;
  const sx=rect[0]*image.naturalWidth/1254,
        sy=rect[1]*image.naturalHeight/314,
        sw=rect[2]*image.naturalWidth/1254,
        sh=rect[3]*image.naturalHeight/314;
  if(mirror){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(image,sx,sy,sw,sh,0,y,w,h);}
  else ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);
  ctx.restore();
}
function makeAtlas(w,h,count,paint){
  const canvas=document.createElement("canvas");
  canvas.width=w*4;canvas.height=h*Math.ceil(count/4);
  const ctx=canvas.getContext("2d");if(!ctx)return null;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  for(let i=0;i<count;i++){
    ctx.save();ctx.translate(i%4*w,Math.floor(i/4)*h);
    paint(ctx,i,w,h);
    ctx.restore();
  }
  return canvas;
}
function build(rowImages){
  const r2=rowImages?.[2],r3=rowImages?.[3];
  if(!r2?.complete||!r2.naturalWidth||!r3?.complete||!r3.naturalWidth)return false;
  if(sourceKey===r2&&travelAtlas&&impactAtlas)return true;
  // These cutouts are from the rock fissure alone, to the RIGHT of
  // the Golem's body. All animation frames are committed as isolated
  // reusable textures, not painted per-frame from paths/ellipses.
  const ridgeA=[1157,177,97,137]; // large jagged stone crest
  const ridgeB=[1183,204,71,110]; // thin glimmering shard
  const ridgeC=[222,188,92,126];  // secondary rock fragments in row 3
  travelAtlas=makeAtlas(224,144,TRAVEL_FRAMES,(c,i)=>{
    const phase=i*Math.PI*2/TRAVEL_FRAMES;
    const bob=Math.sin(phase)*5;
    const sway=Math.sin(phase)*4;
    srcFragment(c,r2,ridgeB,4+sway,56+bob,99,82,false,.86);
    srcFragment(c,r3,ridgeC,131-sway,48-bob*.5,89,96,false,.85);
    srcFragment(c,r2,ridgeA,50+sway*.4,17+bob,133,127,false,1);
  });
  impactAtlas=makeAtlas(256,180,IMPACT_FRAMES,(c,i)=>{
    const pulse=[.25,.43,.68,.91,1,.90,.55,.22][i];
    const spread=[.45,.59,.78,.92,1,1.06,1.12,1.2][i];
    const op=[.42,.65,.88,1,1,.78,.52,.26][i];
    srcFragment(c,r3,ridgeC,128-66*spread,180-106*pulse,96*spread,106*pulse,false,op);
    srcFragment(c,r2,ridgeA,128-80*spread,180-137*pulse,160*spread,137*pulse,false,op);
    srcFragment(c,r2,ridgeB,128+12*spread,180-122*pulse,93*spread,122*pulse,true,op*.92);
    srcFragment(c,r2,ridgeB,128-104*spread,180-111*pulse,89*spread,111*pulse,false,op*.88);
  });
  sourceKey=r2;
  return !!travelAtlas&&!!impactAtlas;
}
function frame(ctx,atlas,idx,cw,ch,x,y,w,h,alpha=1){
 if(!atlas)return false;
 ctx.save();ctx.globalAlpha*=alpha;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(atlas,(idx%4)*cw,Math.floor(idx/4)*ch,cw,ch,x,y,w,h);
 ctx.restore();return true;
}
function drawSlam(ctx,elapsed,duration){
 if(!slam.complete||!slam.naturalWidth)return false;
 const progress=clamp(elapsed/duration);
 // 4×3 approved pose sheet with a separate local ground contact.
 const idx=Math.min(SLAM_FRAMES-1,Math.floor(progress*SLAM_FRAMES));
 const sw=slam.naturalWidth/4,sh=slam.naturalHeight/3;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 ctx.drawImage(slam,(idx%4)*sw,Math.floor(idx/4)*sh,sw,sh,SCENE.x-155,SCENE.y-310,310,310);
 ctx.restore();return true;
}
function anchor(anim,p){
 const from=anim.travelStart||{x:SCENE.x,y:SCENE.y-7};
 const to=anim.travelEnd||from;
 return {x:lerp(from.x,to.x,p),y:lerp(from.y,to.y,p)};
}
function drawTravel(ctx,anim,sourceRows){
 if(!build(sourceRows))return false;
 const p=clamp(anim.elapsed/anim.duration),now=anchor(anim,p);
 const idx=Math.floor(anim.elapsed/92)%TRAVEL_FRAMES;
 // Sprite-stamp trail follows the actual animated head; no line or
 // synthetic triangles. Trailing stones fade and settle at old positions.
 for(let i=4;i>=1;i--){
   const t=Math.max(0,p-i*.072);
   const q=anchor(anim,t);
   if(t<=0)continue;
   frame(ctx,travelAtlas,(idx-i+TRAVEL_FRAMES*3)%TRAVEL_FRAMES,
     224,144,q.x-64,q.y-66,128,67,.17+(4-i)*.075);
 }
 frame(ctx,travelAtlas,idx,224,144,now.x-94,now.y-95,188,96,1);
 return true;
}
function drawImpact(ctx,anim,sourceRows){
 if(!build(sourceRows))return false;
 const target=anim.travelEnd||{x:500,y:430};
 const i=Math.min(IMPACT_FRAMES-1,Math.floor(clamp(anim.elapsed/anim.duration)*IMPACT_FRAMES));
 return frame(ctx,impactAtlas,i,256,180,target.x-116,target.y-164,232,164,1);
}
root.WIZARDRY_GOLEM_EFFECTS_V41={
 build,drawSlam,drawTravel,drawImpact,anchor,
 ready:()=>slam.complete&&slam.naturalWidth>0,
 getAtlasInfo:()=>({slamFrames:SLAM_FRAMES,travelFrames:TRAVEL_FRAMES,impactFrames:IMPACT_FRAMES,
    travelReady:!!travelAtlas,impactReady:!!impactAtlas})
};
})(window);