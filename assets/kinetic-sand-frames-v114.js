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

 // The head and every trailing section sample the same spatial path at
 // delayed times. The tail cannot cut across or teleport past the crest.
 function arcPoint(u,target){
   const d=target.x>=500?1:-1,peak={x:mix(500,target.x,.40),y:88};
   const cubic=(a,b,c,d,t)=>{const q=1-t;return {x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,y:q*q*q*a.y+3*q*q*t*b.y+3*q*t*t*c.y+t*t*t*d.y};};
   if(u<=.5)return cubic({x:500,y:425},{x:500-d*95,y:355},{x:peak.x-d*120,y:88},peak,u*2);
   return cubic(peak,{x:peak.x+d*110,y:88},{x:target.x+d*34,y:target.y-185},{x:target.x,y:target.y-62},(u-.5)*2);
 }
 function streamPoint(p,s,target){
   const u=ease((p-.15-s*.18)/.42);
   return {...arcPoint(u,target),u};
 }
 function strip(c,points,width,p,opacity=1){
   const palette=["#d7aa62","#e5bc79","#c49149","#efd095"];
   for(let j=points.length-2;j>=0;j--){
     const a=points[j],b=points[j+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
     if(len<.3)continue;
     const nx=-dy/len,ny=dx/len,t=j/(points.length-1);
     const wa=width*(.72+.15*Math.sin(j*.8-p*18)),wb=width*(.72+.15*Math.sin((j+1)*.8-p*18));
     const q=[{x:a.x+nx*wa,y:a.y+ny*wa},{x:b.x+nx*wb,y:b.y+ny*wb},{x:b.x-nx*wb,y:b.y-ny*wb},{x:a.x-nx*wa,y:a.y-ny*wa}];
     c.save();c.globalAlpha*=opacity;c.fillStyle=palette[j%4];
     c.beginPath();q.forEach((v,k)=>k?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fill();c.clip();
     if(image.complete&&image.naturalWidth){
       // Sample the generated low-poly sand material from the dense coffin.
       const cw=image.naturalWidth/10,ch=image.naturalHeight/9;
       c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));
       c.drawImage(image,2*cw+cw*.40,7*ch+ch*.38,cw*.18,ch*.31,-5,-wa,len+10,wa*2);
     }
     c.restore();
     c.save();c.globalAlpha*=opacity*.28;c.fillStyle=palette[(j+2)%4];
     c.beginPath();c.moveTo(q[0].x,q[0].y);c.lineTo(q[1].x,q[1].y);c.lineTo((a.x+b.x)*.5,(a.y+b.y)*.5);c.closePath();c.fill();c.restore();
   }
 }
 function drawFlow(c,p,target){
   const feedFade=clamp((.48-p)/.16),grow=ease(p/.12);
   if(feedFade>0){
     // Three abundant, broad banks of sand swirl around the arena center.
     for(let band=0;band<3;band++){
       const pts=[];
       for(let j=0;j<=56;j++){
         const t=j/56,angle=t*Math.PI*4.5-p*17+band*.7,r=35+t*123;
         pts.push({x:500+Math.cos(angle)*r,y:425+Math.sin(angle)*r*.27-band*9});
       }
       strip(c,pts,(16+band*3)*grow,p,feedFade*(.72+band*.08));
     }
   }
   if(p<.15||p>.76)return;
   const fade=clamp((.76-p)/.025),pts=[];
   for(let j=0;j<=44;j++)pts.push(streamPoint(p,j/44,target));
   // A wide central sand body plus two braided side flows make the torrent
   // volumetric, while retaining a clearly leading head.
   strip(c,pts,43,p,fade);
   for(let band=0;band<2;band++){
     const braid=pts.map((v,j)=>({x:v.x+Math.cos(j*.30-p*15+band*Math.PI)*15,y:v.y+Math.sin(j*.30-p*15+band*Math.PI)*11}));
     strip(c,braid,15,p,fade*.8);
   }
   const head=pts[0];
   if(head.u<.995){
     c.save();c.globalAlpha*=fade;c.fillStyle="#ddb16c";c.beginPath();c.ellipse(head.x,head.y,39,31,0,0,Math.PI*2);c.fill();c.restore();
   }
 }
 function draw(c,{progress:p,target,layer="front"}){
   if(layer!=="front"||!target||p<=0||p>=1)return;
   c.save();c.globalAlpha=clamp(Math.min(1,p/.035,(1-p)/.04));
   drawFlow(c,p,target);
   if(p>=.565){
     // Sand continues pouring from the crest as the growing shell closes.
     const shellP=p<.70?mix(.60,.70,ease((p-.565)/.135)):p;
     const i=frameAt(shellP),next=Math.min(i+1,times.length-1);
     const blend=next===i?0:clamp((shellP-times[i])/(times[next]-times[i]));
     const scale=.60+.30*clamp((target.y-288)/235),pos={x:target.x,y:target.y,size:330*scale,mirror:target.x<500?-1:1};
     c.globalAlpha*=ease((p-.565)/.06);
     sprite(c,i,pos,1-blend);if(next!==i)sprite(c,next,pos,blend);
   }
   c.restore();
 }
 function portrait(c,w,h){sprite(c,72,{x:w*.5,y:h*.94,size:Math.min(w*1.15,h*1.14),mirror:1});}
 function shake(p){const kick=p>=hit?clamp(1-(p-hit)/.07):0;return {x:Math.sin(p*1500)*7*kick,y:Math.cos(p*1200)*4*kick};}
 root.WIZARDRY_KINETIC_SAND_V112={draw,portrait,shake,duration,hit,frameAt,position,arcPoint,streamPoint,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
