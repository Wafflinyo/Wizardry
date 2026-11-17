/* Kinetic Sand v115: 91 artwork frames on a fixed scene; no drawn stream. */
(function(root){"use strict";
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const times=root.WIZARDRY_SAND_TIMES_V115;
 const image=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());
 image.src=root.WIZARDRY_SAND_ATLAS_V115;
 const duration=6400,hit=.79;
 function frameAt(p){let i=0;while(i<times.length-1&&p>=times[i+1])i++;return i;}
 function sprite(c,i,target,alpha=1){
   if(!image.complete||!image.naturalWidth)return;
   const cw=image.naturalWidth/10,ch=image.naturalHeight/10;
   // Map the artwork's fixed source and target floor anchors to the arena.
   // All rise, curling arc, trailing flow and compression are actual frames.
   const sx=(target.x-500)/(.52*cw),skew=(target.y-425)/(.52*cw);
   c.save();c.translate(500,425);c.transform(sx,skew,0,420/ch,0,0);c.globalAlpha*=alpha;
   c.drawImage(image,(i%10)*cw,Math.floor(i/10)*ch,cw,ch,-cw*.28,-ch*.88,cw,ch);
   c.restore();
 }
 function draw(c,{progress:p,target,layer="front"}){
   if(layer!=="front"||!target||p<=0||p>=1)return;
   const i=frameAt(p),next=Math.min(i+1,times.length-1);
   const blend=next===i?0:clamp((p-times[i])/(times[next]-times[i]));
   c.save();c.globalAlpha=clamp(Math.min(1,p/.035,(1-p)/.04));
   sprite(c,i,target,1-blend);if(next!==i)sprite(c,next,target,blend);
   c.restore();
 }
 function portrait(c,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const cw=image.naturalWidth/10,ch=image.naturalHeight/10,i=72;
   c.drawImage(image,(i%10)*cw+cw*.63,Math.floor(i/10)*ch+ch*.15,cw*.35,ch*.77,w*.19,h*.03,w*.62,h*.94);
 }
 function shake(p){const kick=p>=hit?clamp(1-(p-hit)/.07):0;return {x:Math.sin(p*1500)*7*kick,y:Math.cos(p*1200)*4*kick};}
 root.WIZARDRY_KINETIC_SAND_V112={draw,portrait,shake,duration,hit,frameAt,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
