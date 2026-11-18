/* Octo Whip: individually rendered overhead slam poses, never deformed or stretched. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
const image=new Image(),slam=new Image(),listeners=[];let ready=false,slamReady=false;const feet=[235,269,289,291,285,284,285,285,281,281,282,285,287,285,286,286];
image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/octo-whip-v96.webp';
slam.onload=()=>{slamReady=true;listeners.forEach(fn=>fn());};slam.src='./assets/octo-slam-v97.webp';
const slamFeet=[298, 298, 299, 300, 274, 274, 270, 270],SLAM_SCALE=300/420;
function pose(p,target){
 const dir=target.x>=500?1:-1,land=C(p/.20),exit=C((p-.87)/.11),reach=C((p-.40)/.10)*(1-C((p-.82)/.06)),floor=L(480,target.y,reach);
 const frame=p<.20?Math.min(3,Math.floor(p/.20*4)):p<.45?4+Math.min(3,Math.floor((p-.20)/.25*4)):15;
 const slamFrame=p<.50?0:p<.57?1:p<.64?2:p<.70?3:p<.74?4:p<.79?5:p<.84?6:7;
 return {dir,frame,slamFrame,exit,x:L(500,target.x-dir*300,reach),y:floor-470*(1-land)*(1-land),groundY:floor,alpha:1,tip:{x:target.x,y:target.y},attack:p>=.45&&p<.87};
}
function sprite(c,frame,x,y,size=280){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4;c.drawImage(image,frame%4*w,Math.floor(frame/4)*h,w,h,x-size/2,y-feet[frame]*size/w,size,size*h/w);}
function polygon(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(color){c.fillStyle=color;c.fill();}}
function splash(c,x,y,q,size=1){if(q<0||q>1)return;c.save();c.globalAlpha*=Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q*.6);c.strokeStyle='#a4edff';c.lineWidth=5*(1-q)+1;
 for(let j=0;j<3;j++){c.beginPath();c.ellipse(x,y,Math.max(1,(25+q*130+j*15)*size),Math.max(1,(6+q*25+j*4)*size),0,0,T);c.stroke();}
 // Wide crown of water shards plus distinct arcing droplets.
 for(let i=0;i<42;i++){const a=i*2.399,r=(25+q*(80+i%6*13))*size,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.21-Math.sin(q*Math.PI)*(30+i%7*13)*size,s=(3+i%4)*(1-q*.65)*size;
 polygon(c,[[xx-s,yy+s],[xx-s*.7,yy-s*2.3],[xx,yy-s*3.5],[xx+s,yy]],i%3?'#56b9e8':'#d1faff');}
 c.restore();}
function slamSprite(c,b){if(!slamReady)return;const w=slam.naturalWidth/2,h=slam.naturalHeight/4,f=b.slamFrame;
 // Fixed, equal X/Y scale for every frame. The arm motion is baked into the art.
 c.save();c.translate(b.x,b.y);c.scale(b.dir,1);
 c.drawImage(slam,f%2*w,Math.floor(f/2)*h,w,h,-170*SLAM_SCALE,-slamFeet[f]*SLAM_SCALE,w*SLAM_SCALE,h*SLAM_SCALE);c.restore();
}
function draw(c,{progress:p,target,layer='body'}){if(!target)return;const b=pose(p,target);
 if(layer==='ground'){
 c.save();c.globalAlpha=.24*C(p/.20)*(1-b.exit);c.fillStyle='#0b2236';c.beginPath();c.ellipse(b.x,b.groundY+3,100,22,0,0,T);c.fill();c.restore();
 if(p>=.82){const open=C((p-.82)/.06),fade=1-C((p-.97)/.03);c.save();c.globalAlpha=open*fade;c.fillStyle='#063b65';c.beginPath();c.ellipse(b.x,b.groundY+5,120,32,0,0,T);c.fill();c.strokeStyle='#70d8ff';c.lineWidth=4;c.stroke();c.fillStyle='#0b719b';c.beginPath();c.ellipse(b.x,b.groundY+5,95,21,0,0,T);c.fill();c.restore();}
 return;}
 if(layer==='whip'){
 if(b.attack)slamSprite(c,b);splash(c,target.x,target.y-8,(p-.70)/.16,1.05);
 return;}
 if(b.attack)return;
 c.save();if(b.exit>0){c.beginPath();c.rect(0,-1000,1000,1000+b.groundY+6);c.clip();}
 c.translate(b.x+b.dir*30,b.y+b.exit*310);c.scale(b.dir,1);c.rotate(b.exit*.22);sprite(c,b.frame,0,0);c.restore();
 splash(c,b.x,b.groundY+5,(p-.19)/.20,1.25);
 splash(c,b.x,b.groundY+5,(p-.88)/.12,1.15);
}
function portrait(c,w,h){c.save();const k=Math.min(w/280,h/280);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,5,0,0);c.restore();}
root.WIZARDRY_OCTO_V95={draw,portrait,pose,onReady:fn=>listeners.push(fn)};
})(window);
