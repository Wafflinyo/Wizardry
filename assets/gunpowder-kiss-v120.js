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
   c.save();c.translate(500,480);c.scale(dir,1);c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
   c.drawImage(image,i%4*cw,Math.floor(i/4)*ch,cw,ch,-size/2,-size*.97,size,size);c.restore();
 }
 function kissPoint(p,target){
   const dir=target.x>=500?1:-1,q=C((p-release)/(hit-release));
   return {x:L(500+dir*75,target.x,q),y:L(285,target.y-85,q)-Math.sin(q*Math.PI)*22,q};
 }
 // Faceted powder billows expand from the kiss into a full-body smokescreen.
 function puff(c,x,y,rx,ry,seed,alpha){
   c.globalAlpha=alpha;c.fillStyle=["#29292f","#38373d","#45434a","#55515a"][seed%4];
   c.beginPath();
   for(let k=0;k<9;k++){const a=k*T/9,r=.78+R(seed*17+k)*.30;
     const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;
     if(k)c.lineTo(px,py);else c.moveTo(px,py);}
   c.closePath();c.fill();
 }
 function powder(c,p,target){
   if(p<release||p>=1)return;
   const dir=target.x>=500?1:-1,scale=.60+.30*C((target.y-288)/235);
   c.save();
   // A broad, curling plume follows the leading powder instead of a tight pellet.
   if(p<hit+.055){
     const arrival=C((p-release)/(hit-release)),tailFade=1-C((p-hit)/.055);
     for(let n=0;n<72;n++){
       const lag=R(n+13)*.065,point=kissPoint(Math.max(release,p-lag),target);
       const age=C((p-release-lag)/.08),spread=(10+arrival*46)*age;
       const a=n*2.4+arrival*2.1,rad=Math.sqrt(R(n+31))*spread;
       puff(c,point.x+Math.cos(a)*rad-dir*lag*115,point.y+Math.sin(a)*rad*.75,
         (7+R(n+41)*10)*age,(6+R(n+91)*9)*age,n,(.34+R(n+54)*.28)*tailFade*age);
     }
     for(let n=0;n<95;n++){
       const point=kissPoint(Math.max(release,p-R(n+8)*.07),target),spread=12+arrival*58;
       c.globalAlpha=(.60+R(n+41)*.35)*tailFade;
       grain(c,point.x+(R(n+54)-.5)*spread*2,point.y+(R(n+91)-.5)*spread*1.4,
         1.2+R(n+115)*2,n%5===0);
     }
   }
   // On arrival the plume curls around the whole wizard, rises and slowly disperses.
   if(p>=hit-.025){
     const q=C((p-(hit-.025))/(1-hit+.025)),bloom=C(q/.25);
     const fade=1-C((q-.58)/.42),cx=target.x,cy=target.y-91*scale;
     for(let n=0;n<64;n++){
       const a=n*2.4+q*(n%2?1.3:-1.1),r=Math.sqrt(R(n+71));
       const x=cx+Math.cos(a)*r*(55+q*15)*scale*bloom;
       const y=cy+Math.sin(a)*r*100*scale*bloom-q*20*scale;
       puff(c,x,y,(13+R(n+22)*16)*scale*(.5+bloom*.5),
         (14+R(n+94)*20)*scale,n+83,(.38+R(n+49)*.25)*bloom*fade);
     }
     for(let n=0;n<125;n++){
       const a=n*2.4+q*1.8,r=Math.sqrt(R(n+72));
       c.globalAlpha=(.65+R(n+14)*.3)*bloom*fade;
       grain(c,cx+Math.cos(a)*r*(61+q*18)*scale*bloom,
         cy+Math.sin(a)*r*108*scale*bloom-q*24*scale,
         (1+R(n+19)*2.5)*scale,n%6===0);
     }
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
 function depthFor({progress:p,target}){const q=C((p-release)/(hit-release));return L(480,target?.y||480,q)+.1;}
 function draw(c,{progress:p,target,layer="actor"}){if(!target||p<0||p>=1)return;if(layer==="actor")actor(c,p,target);if(layer==="powder")powder(c,p,target);}
 function portrait(c,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const i=9,cw=image.naturalWidth/4,ch=image.naturalHeight/4,size=Math.min(w,h)*1.04;
   c.drawImage(image,i%4*cw,Math.floor(i/4)*ch,cw,ch,(w-size)/2,h-size,size,size);
 }
 root.WIZARDRY_GUNPOWDER_V120={draw,drawCoat,explosion,emblem,depthFor,portrait,frameAt,kissPoint,release,hit,onReady(fn){if(image.complete&&image.naturalWidth)fn();else listeners.push(fn);}};
})(window);
