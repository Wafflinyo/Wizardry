/* Kinetic Sand v115: 241 artwork frames on a fixed scene; no drawn stream. */
(function(root){"use strict";
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const times=root.WIZARDRY_SAND_TIMES_V117;
 const image=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());
 image.src=root.WIZARDRY_SAND_ATLAS_V117;
 const blendCanvas=document.createElement("canvas"),blendCtx=blendCanvas.getContext("2d");
 blendCanvas.width=1000;blendCanvas.height=620;
 const duration=4800,hit=.79;
 const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 function frameAt(p){let i=0;while(i<times.length-1&&p>=times[i+1])i++;return i;}
 function sprite(c,i,target,alpha=1,p=.8){
   if(!image.complete||!image.naturalWidth)return;
   const cw=image.naturalWidth/16,ch=image.naturalHeight/16;
   // Map the artwork's fixed source and target floor anchors to the arena.
   // All rise, curling arc, trailing flow and compression are actual frames.
   const sx=(target.x-500)/(.52*cw),skew=(target.y-510)/(.52*cw);
   const opening=.78+.22*smooth((p-.17)/.18),closing=1-.28*smooth((p-.55)/.20);
   const width=opening*closing,anchor=p<.55?500:target.x;
   c.save();c.translate(anchor,0);c.scale(width,1);c.translate(-anchor,0);
   c.translate(500,510);c.transform(sx,skew,0,300/ch,0,0);c.globalAlpha*=alpha;
   c.drawImage(image,(i%16)*cw,Math.floor(i/16)*ch,cw,ch,-cw*.28,-ch*.88,cw,ch);
   c.restore();
 }
 function draw(c,{progress:p,target,layer="front",opacity=1}){
   if(layer!=="front"||!target||p<=0||p>=1)return;
   const i=frameAt(p),next=Math.min(i+1,times.length-1);
   const blend=next===i?0:clamp((p-times[i])/(times[next]-times[i]));
   c.save();c.globalAlpha*=opacity*clamp(Math.min(1,p/.035,(1-p)/.04));
   blendCtx.clearRect(0,0,1000,620);
   blendCtx.globalCompositeOperation="source-over";blendCtx.globalAlpha=1;
   sprite(blendCtx,i,target,1-blend,p);
   if(next!==i){blendCtx.globalCompositeOperation="lighter";sprite(blendCtx,next,target,blend,p);}
   blendCtx.globalCompositeOperation="source-over";blendCtx.globalAlpha=1;
   c.drawImage(blendCanvas,0,0);
   c.restore();
 }
 function portrait(c,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const cw=image.naturalWidth/16,ch=image.naturalHeight/16,i=192;
   c.drawImage(image,(i%16)*cw+cw*.63,Math.floor(i/16)*ch+ch*.15,cw*.35,ch*.77,w*.19,h*.03,w*.62,h*.94);
 }
 function shake(p){const kick=p>=hit?clamp(1-(p-hit)/.07):0;return {x:Math.sin(p*1500)*7*kick,y:Math.cos(p*1200)*4*kick};}
 root.WIZARDRY_KINETIC_SAND_V112={draw,portrait,shake,duration,hit,frameAt,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
