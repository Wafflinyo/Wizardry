/* Faceted scorpion sprite poses: compact roll, unfold, brace, sting, burrow. */
(function(root){'use strict';const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2,SIZE=232;
const listeners=[],image=new Image();image.onload=()=>listeners.forEach(fn=>fn());image.src='./assets/scorpion-sting-v95.webp';
function timeline(p){const ms=C(p)*4700;return ms<3696?ms/4200:ms<4196?.879999:(ms-500)/4200;}
function pose(p,target={x:800,y:450}){const dir=target.x>=500?1:-1,drop=C(p/.17),reach=C((p-.68)/.06)*(1-C((p-.81)/.07));let frame=4;
 if(p<.17)frame=p<.085?0:1;else if(p<.25)frame=p<.21?2:3;
 else if(p<.42)frame=p<.34?4:5;else if(p<.68)frame=6+Math.min(2,Math.floor((p-.42)/.26*3));
 else if(p<.74)frame=p<.71?9:10;else if(p<.81)frame=11;else if(p<.88)frame=12;
 else if(p<.93)frame=13;else if(p<.97)frame=14;else frame=15;
 return {dir,frame,x:L(500,target.x-dir*84,reach)-dir*(1-drop)*(1-drop)*320,y:L(510,target.y,reach)-(1-drop)*(1-drop)*460,roll:p<.17?-(1-drop)*T*1.7:0,wind:C((p-.42)/.26),reach,alpha:p>.998?0:Math.min(1,p/.025),burrow:C((p-.88)/.12),tip:{x:L(35-C((p-.42)/.26)*75,(target.x-500)*dir,reach),y:L(-128,target.y-510-95,reach)}};}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
let bounds;
function prepare(){if(bounds||!image.complete||!image.naturalWidth)return bounds;const w=image.naturalWidth/4,h=image.naturalHeight/4;bounds=[];for(let f=0;f<16;f++){const tile=document.createElement('canvas');tile.width=w;tile.height=h;const g=tile.getContext('2d');g.drawImage(image,f%4*w,Math.floor(f/4)*h,w,h,0,0,w,h);const data=g.getImageData(0,0,w,h).data;let bottom=0;for(let y=0;y<tile.height;y++){let count=0;for(let x=0;x<tile.width;x++)if(data[(y*tile.width+x)*4+3]>160)count++;if(count>=Math.max(4,tile.width*.02))bottom=y;}bounds.push(bottom);}return bounds;}
function actor(c,p,target){const b=pose(p,target),bb=prepare();if(!bb)return;const w=image.naturalWidth/4,h=image.naturalHeight/4,k=SIZE/w;
 c.save();c.globalAlpha*=b.alpha;if(b.burrow>0){c.beginPath();c.rect(0,-800,1000,800+b.y+2);c.clip();}
 // Coiled-ball sprites rotate about their own center, not around the floor.
 const land=b.y,bottom=bb[b.frame<14?b.frame:13];c.translate(b.x,land+b.burrow*270);c.scale(b.dir,1);
 if(p<.17){c.translate(0,-58);c.rotate(b.roll);c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-SIZE/2,-SIZE/2,SIZE,h*k);}
 else{c.drawImage(image,b.frame%4*w,Math.floor(b.frame/4)*h,w,h,-SIZE/2,-bottom*k,SIZE,h*k);}
 c.restore();}
function draw(c,{progress:p,target}){if(!target)return;p=timeline(p);const b=pose(p,target);c.save();c.globalAlpha=.28*Math.min(1,p/.17)*(1-b.burrow);c.fillStyle='#201b15';c.beginPath();c.ellipse(b.x,L(510,target.y+2,b.reach),80,19,0,0,T);c.fill();c.restore();
 if(p>.88){c.save();c.fillStyle='#352c22';c.beginPath();c.ellipse(500,510,(58+b.burrow*36)*(1-C((b.burrow-.82)/.18)),(12+b.burrow*8)*(1-C((b.burrow-.82)/.18)),0,0,T);c.fill();c.restore();}
 actor(c,p,target);
 const landing=p>.15&&p<.30,burrow=p>.88; if(landing||burrow){const q=landing?C((p-.15)/.15):b.burrow;c.save();c.globalAlpha=landing?1-q:Math.sin(q*Math.PI)*.9;for(let i=0;i<36;i++){const a=i*2.399+q,r=30+q*(30+i%5*12),x=500+Math.cos(a)*r,y=b.y+Math.sin(a)*r*.22-Math.sin(q*Math.PI)*(i%4)*9,s=3+i%5;poly(c,[[x-s,y],[x,y-s],[x+s,y-1],[x+s*.4,y+s]],i%2?'#b79868':'#806746');}c.restore();}
 if(p>=.70&&p<.84){const q=C((p-.70)/.04);c.save();c.globalAlpha=p>.78?( .84-p)/.06:1;c.strokeStyle='#eeb568';c.lineWidth=3;if(p>=.74){c.strokeStyle='#e9d69d';c.beginPath();c.arc(target.x,target.y-95,10+(p-.74)*170,0,T);c.stroke();}c.restore();}}
function depthFor(o){const p=timeline(o.progress),b=pose(p,o.target);return p>=.68&&p<.88?L(510,o.target?.y||510,b.reach)+.1:510;}
function portrait(c,w,h){if(!prepare())return;c.save();const sw=image.naturalWidth/4,sh=image.naturalHeight/4,k=Math.min(w/sw,h/sh)*.95;c.drawImage(image,0,sh,sw,sh,(w-sw*k)/2,(h-sh*k)/2,sw*k,sh*k);c.restore();}
root.WIZARDRY_SCORPION_V94={draw,pose,timeline,depthFor,portrait,onReady:fn=>listeners.push(fn)};})(window);
