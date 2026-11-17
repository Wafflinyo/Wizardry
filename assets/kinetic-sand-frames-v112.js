/* Kinetic Sand v112: generated low-poly animation frames, no procedural substitute. */
(function(root){"use strict";
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 const mix=(a,b,t)=>a+(b-a)*t;
 const image=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());
 image.src=root.WIZARDRY_KINETIC_SAND_ATLAS_V112;
 // Each cell has its own measured visible bounds; all share one pixel scale.
 const bounds=root.WIZARDRY_KINETIC_SAND_BOUNDS_V112;
 const columns=4,rows=4;
 const frames=[0,.055,.11,.17,.24,.32,.40,.47,.55,.60,.65,.70,.75,.79,.85,.93];
 const duration=6400,hit=.79;
 function frameAt(p){let i=0;while(i<15&&p>=frames[i+1])i++;return i;}
 function position(p,target){
   const flight=ease((p-.40)/.15),scale=.60+.30*clamp((target.y-288)/235);
   const center={x:500,y:425};
   let x=mix(center.x,target.x,flight),y=mix(center.y,target.y,flight)-Math.sin(flight*Math.PI)*130;
   const size=mix(365,270*scale,flight);
   return {x,y,size,mirror:target.x<500?-1:1};
 }
 function sprite(c,i,pos,alpha=1){
   if(!image.complete||!image.naturalWidth||!bounds?.[i])return;
   const b=bounds[i],cw=image.naturalWidth/columns,ch=image.naturalHeight/rows;
   const factor=pos.size/Math.max(cw,ch);
   c.save();c.translate(pos.x,pos.y);c.scale(pos.mirror,1);c.globalAlpha*=alpha;
   c.drawImage(image,(i%4)*cw+b[0],Math.floor(i/4)*ch+b[1],b[2],b[3],-b[2]*factor/2,-b[3]*factor,b[2]*factor,b[3]*factor);
   c.restore();
 }
 function draw(c,{progress:p,target,layer="front"}){
   if(layer!=="front"||!target||p<=0||p>=1)return;
   const i=frameAt(p),pos=position(p,target);
   const fade=Math.min(1,p/.045,(1-p)/.04);
   c.save();c.globalAlpha=clamp(fade);
   // Short optical transition keeps the distinct sculpted poses moving fluidly.
   const blend=i>0?clamp((p-frames[i])/.012):1;
   if(i>0&&blend<1)sprite(c,i-1,pos,1-blend);
   sprite(c,i,pos,blend);
   c.restore();
 }
 function portrait(c,w,h){
   const pos={x:w*.5,y:h*.94,size:Math.min(w*1.42,h*1.7),mirror:1};
   sprite(c,12,pos);
 }
 function shake(p){const kick=p>=hit?clamp(1-(p-hit)/.07):0;return {x:Math.sin(p*1500)*7*kick,y:Math.cos(p*1200)*4*kick};}
 root.WIZARDRY_KINETIC_SAND_V112={draw,portrait,shake,duration,hit,frameAt,position,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
