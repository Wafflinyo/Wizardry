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
function draw(c,{progress:p,target}){
 if(!target||p<0||p>=1)return;
 const scale=.60+.30*C((target.y-288)/235),frame=Math.min(35,Math.floor(p*36));
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
 sprite(c,frame,target.x,target.y+4,250*scale);c.restore();
}
function portrait(c,w,h){sprite(c,22,w*.5,h*.99,Math.min(w*.96,h*1.02));}
root.WIZARDRY_FLOW_STATE_V121={draw,portrait,emblem,frameAt:p=>Math.min(35,Math.floor(C(p)*36)),onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);