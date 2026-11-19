/* Flow State v122: 36 original low-poly water poses, no crossfade. */
(function(root){"use strict";const C=x=>Math.max(0,Math.min(1,x));
const image=new Image(),listeners=[];
image.onload=()=>listeners.splice(0).forEach(fn=>fn());
image.src=root.WIZARDRY_FLOW_ATLAS_V122;
 function emblem(c,x,y,size){c.save();c.translate(x,y);c.scale(size/24,size/24);c.fillStyle="#72e6f5";c.beginPath();c.moveTo(0,-11);c.lineTo(-8,1);c.lineTo(-6,8);c.lineTo(0,11);c.lineTo(7,7);c.lineTo(9,1);c.closePath();c.fill();c.fillStyle="#d5ffff";c.beginPath();c.moveTo(0,-7);c.lineTo(-4,2);c.lineTo(0,7);c.lineTo(3,1);c.closePath();c.fill();c.restore();}

function sprite(c,frame,x,y,size){
 if(!image.complete||!image.naturalWidth)return;
 const cell=image.naturalWidth/6;
 c.drawImage(image,frame%6*cell,Math.floor(frame/6)*cell,cell,cell,x-size/2,y-size*.96,size,size);
}
// The atlas includes both halves of the ribbon. Keep the lower crest and
// the rising diagonal on the near side, and put the remaining water behind.
function clipWater(c,frame,x,y,size,layer){
 const left=x-size/2,top=y-size*.96;
 c.beginPath();
 if(layer==="back")c.rect(left,top,size,size);
 const lift=C((frame-3)/11)*C((37-frame)/8);
 c.rect(left,top+size*.89,size,size*.11);
 if(lift>0){
  const crest=[[0,.87],[.16,.77],[.42,.70],[.69,.55],[.93,.40],[1,.47],[.79,.66],[.47,.80],[.19,.88],[0,.88]];
  crest.forEach(([u,v],index)=>{
   const px=left+u*size,py=top+(.888+(v-.888)*lift)*size;
   if(index)c.lineTo(px,py);
   else c.moveTo(px,py);
  });
  c.closePath();
 }
 c.clip("evenodd");
}
function draw(c,{progress:p,target,layer}){
 if(!target||p<0||p>=1)return;
 const scale=.60+.30*C((target.y-288)/235),frame=Math.min(35,Math.floor(p*36));
 const x=target.x,y=target.y+4,size=250*scale;
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 if(layer)clipWater(c,frame,x,y,size,layer);
 sprite(c,frame,x,y,size);c.restore();
}
function portrait(c,w,h){sprite(c,22,w*.5,h*.99,Math.min(w*.96,h*1.02));}
root.WIZARDRY_FLOW_STATE_V121={draw,portrait,emblem,frameAt:p=>Math.min(35,Math.floor(C(p)*36)),onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);