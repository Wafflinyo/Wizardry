/* Gunpowder Kiss: a mistress made entirely of powder, with persistent coat and detonation. */
(function(root){"use strict";
 const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,R=n=>((n*9301+49297)%233280)/233280,T=Math.PI*2;
 const image=new Image(),flames=new Image(),listeners=[];
 image.onload=()=>listeners.splice(0).forEach(fn=>fn());image.src=root.WIZARDRY_GUNPOWDER_ATLAS_V120;
 flames.src="./assets/devil-flame-burst-v98.webp";
 const times=[0,.065,.13,.20,.26,.32,.37,.42,.47,.52,.56,.61,.68,.78,.86,.94],release=.56,hit=.70;
 function frameAt(p){let i=0;while(i<15&&p>=times[i+1])i++;return i;}
 function grain(c,x,y,r,light=false){
   c.fillStyle=light?"#77756f":"#29292c";c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r*.2,y-r);c.lineTo(x+r,y+r*.2);c.lineTo(x-r*.3,y+r);c.closePath();c.fill();
   if(r>2){c.fillStyle=light?"#a19a85":"#56545a";c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r*.2,y-r);c.lineTo(x,y+r*.2);c.closePath();c.fill();}
 }
 function actor(c,p,target){
   if(!image.complete||!image.naturalWidth)return;
   const i=frameAt(p),cw=image.naturalWidth/4,ch=image.naturalHeight/4,dir=target.x>=500?1:-1,size=210;
   c.save();c.translate(500,425);c.scale(dir,1);c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
   c.drawImage(image,i%4*cw,Math.floor(i/4)*ch,cw,ch,-size/2,-size*.97,size,size);c.restore();
 }
 function kissPoint(p,target){
   const dir=target.x>=500?1:-1,q=C((p-release)/(hit-release));
   return {x:L(500+dir*75,target.x,q),y:L(285,target.y-85,q)-Math.sin(q*Math.PI)*22,q};
 }
 function powder(c,p,target){
   if(p<release||p>hit+.10)return;
   c.save();
   if(p<hit){
     const head=kissPoint(p,target),dir=target.x>=500?1:-1;
     for(let n=0;n<76;n++){
       const lag=R(n+13)*.035,point=kissPoint(Math.max(release,p-lag),target),spread=8+R(n+31)*15;
       c.globalAlpha=.55+R(n+41)*.4;grain(c,point.x+(R(n+54)-.5)*spread-dir*lag*100,point.y+(R(n+91)-.5)*spread,1.5+R(n+115)*2,n%5===0);
     }
     // The leading kiss is a heart-shaped cluster of powder, not a pink symbol.
     for(let n=0;n<36;n++){
       const a=n*T/36,x=16*Math.pow(Math.sin(a),3),y=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));
       c.globalAlpha=.9;grain(c,head.x+x*.95,head.y+y*.95,2.4,n%6===0);
     }
   }else{
     const q=C((p-hit)/.10);c.globalAlpha=1-q;
     for(let n=0;n<65;n++){const a=n*2.4,r=(10+R(n+42)*38)*q;grain(c,target.x+Math.cos(a)*r,target.y-85+Math.sin(a)*r*1.3,1.5+R(n+9)*2,n%5===0);}
   }
   c.restore();
 }
 function drawCoat(c,{target,time=0}){
   const scale=.60+.30*C((target.y-288)/235);
   c.save();c.globalAlpha=.92;
   for(let n=0;n<42;n++){
     const y=target.y-(27+R(n+12)*151)*scale,width=(y<target.y-125*scale?18:33)*scale;
     grain(c,target.x+(R(n+44)-.5)*width*2,y,(1.5+R(n+67)*2)*scale,n%7===0);
   }
   c.restore();
 }
 function explosion(c,burst){
   const q=C(burst.age/.78),x=burst.x,y=burst.y;if(q>=1)return;
   c.save();
   if(q<.17){
     const power=1-q/.17;c.globalAlpha=power;
     for(let n=0;n<12;n++){const a=n*T/12,r=8+q*130;c.fillStyle=n%2?"#fff1b2":"#ff9d39";c.beginPath();c.moveTo(x+Math.cos(a)*r,y-85+Math.sin(a)*r);c.lineTo(x+Math.cos(a)*(r+13),y-85+Math.sin(a)*(r+13));c.lineTo(x+Math.cos(a+.16)*(r+3),y-85+Math.sin(a+.16)*(r+3));c.closePath();c.fill();}
   }
   if(flames.complete&&flames.naturalWidth){
     const f=Math.min(7,Math.floor(q*8)),sw=flames.naturalWidth/4,sh=flames.naturalHeight/2,size=165,feet=[298,299,301,301,300,299,299,298];
     c.globalAlpha=1;c.drawImage(flames,f%4*sw,Math.floor(f/4)*sh,sw,sh,x-size/2,y+8-feet[f]*size/sw,size,sh*size/sw);
   }
   c.globalAlpha=1-q;
   for(let n=0;n<25;n++){const a=n*2.4,r=12+q*(30+R(n+16)*48);grain(c,x+Math.cos(a)*r,y-80+Math.sin(a)*r+q*q*24,2+R(n+14)*3,n%3===0);}
   c.restore();
 }
 function emblem(c,x,y,size){
   c.save();c.translate(x,y);c.scale(size/20,size/20);
   for(let n=0;n<14;n++){const a=n*2.4,r=3+R(n+12)*7;grain(c,Math.cos(a)*r,Math.sin(a)*r,2,n%4===0);}
   c.fillStyle="#ffbb62";c.beginPath();c.moveTo(2,-10);c.lineTo(5,-16);c.lineTo(4,-9);c.lineTo(10,-11);c.lineTo(5,-6);c.closePath();c.fill();c.restore();
 }
 function depthFor({progress:p,target}){const q=C((p-release)/(hit-release));return L(425,target?.y||425,q)+.1;}
 function draw(c,{progress:p,target,layer="actor"}){if(!target||p<0||p>=1)return;if(layer==="actor")actor(c,p,target);if(layer==="powder")powder(c,p,target);}
 function portrait(c,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const i=9,cw=image.naturalWidth/4,ch=image.naturalHeight/4,size=Math.min(w,h)*1.04;
   c.drawImage(image,i%4*cw,Math.floor(i/4)*ch,cw,ch,(w-size)/2,h-size,size,size);
 }
 root.WIZARDRY_GUNPOWDER_V120={draw,drawCoat,explosion,emblem,depthFor,portrait,frameAt,kissPoint,release,hit,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
