/* Zeus's Might: upper-half low-poly Zeus, fast golden thunderbolt, chained lightning. */
(function(root){"use strict";
 const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=x=>{x=C(x);return x*x*(3-2*x);};
 const image=new Image(),listeners=[],times=root.WIZARDRY_ZEUS_TIMES_V119;
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());image.src=root.WIZARDRY_ZEUS_ATLAS_V119;
 const release=.53,impact=.565,duration=4000,size=250;
 const poseTimes=[0,.04,.15,.21,.27,.33,.38,.43,.47,.50,.53,.57,.63,.71,.80,.90];
 function frameAt(p){let i=0;while(i<15&&p>=poseTimes[i+1])i++;return i*6;}
 function actorPose(p,target){
   const d=target.x>=500?1:-1;
   return {x:500,y:L(-200,390,E(p/.18))+Math.sin(p*24)*2-E((p-.82)/.175)*650,dir:d,alpha:1};
 }
 function actor(c,p,target){
   if(!image.complete||!image.naturalWidth)return;
   const i=frameAt(p),cw=image.naturalWidth/10,ch=image.naturalHeight/10,pos=actorPose(p,target);
   // Use one original painted pose per frame, as Poseidon does. No optical
   // in-betweens or overlapping translucent images of the character.
   c.save();c.translate(pos.x,pos.y);c.scale(pos.dir,1);c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
   c.drawImage(image,i%10*cw,Math.floor(i/10)*ch,cw,ch,-size/2,-size*.97,size,size);
   c.restore();
 }
 function goldenBolt(c,x,y,angle,length=104,alpha=1){
   c.save();c.translate(x,y);c.rotate(angle);c.scale(length/100,length/100);c.globalAlpha*=alpha;
   const shape=[[-50,8],[-9,-12],[-7,-4],[50,-11],[8,13],[5,5],[-39,17]];
   c.shadowColor="#ffcc52";c.shadowBlur=10;c.fillStyle="#f6bf36";c.beginPath();shape.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fill();c.shadowBlur=0;
   c.fillStyle="#fff2aa";c.beginPath();c.moveTo(-50,8);c.lineTo(-9,-12);c.lineTo(-7,-4);c.lineTo(50,-11);c.lineTo(8,3);c.lineTo(-7,1);c.closePath();c.fill();
   c.strokeStyle="#fffce1";c.lineWidth=2;c.beginPath();c.moveTo(-44,9);c.lineTo(-7,-1);c.lineTo(8,1);c.lineTo(43,-9);c.stroke();c.restore();
 }
 function projectile(c,p,target){
   if(p<release||p>=impact)return;
   const dir=target.x>=500?1:-1,from={x:500+dir*112.5,y:245},to={x:target.x,y:target.y-85};
   const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy)||1,ux=dx/distance,uy=dy/distance;
   const length=Math.min(104,distance*.70),q=C((p-release)/(impact-release)),travel=L(length*.5,distance-length*.5,q);
   const angle=Math.atan2(dy,dx),x=from.x+ux*travel,y=from.y+uy*travel;
   for(const [lag,alpha] of [[38,.12],[19,.25],[0,1]])goldenBolt(c,x-ux*lag,y-uy*lag,angle,length,alpha);
 }
 function hitBurst(c,p,target){
   const q=C((p-impact)/.085);if(p<impact||q>=1)return;
   const x=target.x,y=target.y-85;
   c.save();c.globalAlpha=1-q;
   for(let n=0;n<18;n++){
     const a=n*Math.PI/9,r=14+q*66,len=8+(n%3)*7;
     c.fillStyle=n%3?"#fff3b7":"#f5b93a";c.beginPath();c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(x+Math.cos(a)*(r+len),y+Math.sin(a)*(r+len));c.lineTo(x+Math.cos(a+.09)*(r+4),y+Math.sin(a+.09)*(r+4));c.closePath();c.fill();
   }
   c.globalAlpha=(1-q)*.7;root.WIZARDRY_ROD_BOLT_V118?.draw(c,{x,y:y-48},{x:x+5,y:y+52},q,1);c.restore();
 }
 function chain(c,p,target,neighbor){
   if(!neighbor||p<.59||p>neighbor.hitAt+.10)return;
   const q=C((p-.59)/(neighbor.hitAt-.59)),from={x:target.x,y:target.y-85},to={x:neighbor.x,y:neighbor.y-85};
   const end={x:L(from.x,to.x,q),y:L(from.y,to.y,q)};
   root.WIZARDRY_ROD_BOLT_V118?.draw(c,from,end,C((p-.59)/.16),1-C((p-neighbor.hitAt)/.10));
   if(p>=neighbor.hitAt)hitBurst(c,impact+(p-neighbor.hitAt),neighbor);
 }
 function draw(c,{progress:p,target,layer="actor",neighbor}){
   if(!target||p<0||p>=1)return;
   if(layer==="actor")actor(c,p,target);
   if(layer==="projectile")projectile(c,p,target);
   if(layer==="impact")hitBurst(c,p,target);
   if(layer==="chain")chain(c,p,target,neighbor);
 }
 function portrait(c,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const i=42,cw=image.naturalWidth/10,ch=image.naturalHeight/10,size=Math.min(w,h)*1.04;
   c.drawImage(image,i%10*cw,Math.floor(i/10)*ch,cw,ch,(w-size)/2,h-size,size,size);
 }
 function shake(p){const f=p>=impact?1-C((p-impact)/.065):0;return {x:Math.sin(p*1400)*5*f,y:Math.cos(p*1250)*3*f};}
 root.WIZARDRY_ZEUS_V119={draw,portrait,frameAt,actorPose,release,impact,duration,size,shake,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
