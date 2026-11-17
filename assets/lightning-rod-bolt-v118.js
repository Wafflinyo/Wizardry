/* Lightning Rod v118: generated low-poly branching lightning frames. */
(function(root){"use strict";
 const clamp=x=>Math.max(0,Math.min(1,x));
 const image=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());
 image.src=root.WIZARDRY_ROD_BOLT_ATLAS_V118;
 function frameAt(p){return Math.min(15,Math.floor(clamp(p)*16));}
 function draw(c,a,b,progress,alpha=1){
   if(!image.complete||!image.naturalWidth||alpha<=0)return;
   const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
   if(length<4)return;
   const i=frameAt(progress),cw=image.naturalWidth/4,ch=image.naturalHeight/4;
   const width=Math.max(58,Math.min(155,46+length*.24));
   // Artwork endpoints at 2% and 98% attach exactly to each world endpoint.
   // Perpendicular width is independent of length, so long transfers stay sharp.
   c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx)-Math.PI/2);
   c.globalAlpha*=clamp(alpha);c.imageSmoothingEnabled=true;
   c.drawImage(image,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,-width/2,-length*.02/.96,width,length/.96);
   c.restore();
 }
 root.WIZARDRY_ROD_BOLT_V118={draw,frameAt,ready:()=>image.complete&&image.naturalWidth>0,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
