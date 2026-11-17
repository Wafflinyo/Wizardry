/* Kinetic Sand v113: 85 low-poly frames, including motion-warped in-betweens. */
(function(root){"use strict";
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
 const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 const image=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());
 image.src=root.WIZARDRY_SAND_ATLAS_V113;
 const times=root.WIZARDRY_SAND_TIMES_V113;
 const duration=6400,hit=.79;
 function frameAt(p){let i=0;while(i<times.length-1&&p>=times[i+1])i++;return i;}
 function position(p,target){
   // Height is already animated in the artwork. The floor anchor travels
   // forward without a second vertical jump or a sudden scale reduction.
   const flight=ease((p-.40)/.27),scale=.60+.30*clamp((target.y-288)/235);
   return {x:mix(500,target.x,flight),y:mix(425,target.y,flight),size:300*scale,mirror:target.x<500?-1:1};
 }
 function sprite(c,i,pos,alpha=1){
   if(!image.complete||!image.naturalWidth)return;
   const cw=image.naturalWidth/10,ch=image.naturalHeight/9;
   c.save();c.translate(pos.x,pos.y);c.scale(pos.mirror,1);c.globalAlpha*=alpha;
   c.drawImage(image,(i%10)*cw,Math.floor(i/10)*ch,cw,ch,-pos.size/2,-pos.size*(184/192),pos.size,pos.size);
   c.restore();
 }
 function draw(c,{progress:p,target,layer="front"}){
   if(layer!=="front"||!target||p<=0||p>=1)return;
   const i=frameAt(p),pos=position(p,target),fade=Math.min(1,p/.035,(1-p)/.04);
   const next=Math.min(i+1,times.length-1),blend=next===i?0:clamp((p-times[i])/(times[next]-times[i]));
   c.save();c.globalAlpha=clamp(fade);
   // Continuous sampling between actual dense in-between frames.
   sprite(c,i,pos,1-blend);if(next!==i)sprite(c,next,pos,blend);
   c.restore();
 }
 function portrait(c,w,h){sprite(c,72,{x:w*.5,y:h*.94,size:Math.min(w*1.15,h*1.14),mirror:1});}
 function shake(p){const kick=p>=hit?clamp(1-(p-hit)/.07):0;return {x:Math.sin(p*1500)*7*kick,y:Math.cos(p*1200)*4*kick};}
 root.WIZARDRY_KINETIC_SAND_V112={draw,portrait,shake,duration,hit,frameAt,position,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
