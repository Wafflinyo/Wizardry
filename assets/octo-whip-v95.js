/* Rendered low-poly octopus with a planted body, extended textured arm and water exit. */
(function(root){'use strict';
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,p)=>a+(b-a)*p,T=Math.PI*2;
const image=new Image(),listeners=[];let ready=false;const feet=[235,269,289,291,285,284,285,285,281,281,282,285,287,285,286,286];
image.onload=()=>{ready=true;listeners.forEach(fn=>fn());};image.src='./assets/octo-whip-v96.webp';
function pose(p,target){
 const dir=target.x>=500?1:-1,land=C(p/.20),reach=C((p-.60)/.10)*(1-C((p-.76)/.10)),exit=C((p-.87)/.11);
 const frame=p<.20?Math.min(3,Math.floor(p/.20*4)):p<.48?4+Math.min(3,Math.floor((p-.20)/.28*4)):p<.60?8+Math.min(1,Math.floor((p-.48)/.12*2)):p<.86?9:15;
 return {dir,frame,reach,exit,x:500+dir*Math.sin(reach*Math.PI)*7,y:425-470*(1-land)*(1-land),alpha:1,tip:{x:L(500+dir*65,target.x,reach),y:L(230,target.y-75,reach)}};
}
function sprite(c,frame,x,y,size=280){if(!ready)return;const w=image.naturalWidth/4,h=image.naturalHeight/4;c.drawImage(image,frame%4*w,Math.floor(frame/4)*h,w,h,x-size/2,y-feet[frame]*size/w,size,size*h/w);}
function polygon(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(color){c.fillStyle=color;c.fill();}}
function splash(c,x,y,q,size=1){if(q<0||q>1)return;c.save();c.globalAlpha*=Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q*.6);c.strokeStyle='#a4edff';c.lineWidth=5*(1-q)+1;
 for(let j=0;j<3;j++){c.beginPath();c.ellipse(x,y,Math.max(1,(25+q*130+j*15)*size),Math.max(1,(6+q*25+j*4)*size),0,0,T);c.stroke();}
 // Wide crown of water shards plus distinct arcing droplets.
 for(let i=0;i<42;i++){const a=i*2.399,r=(25+q*(80+i%6*13))*size,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.21-Math.sin(q*Math.PI)*(30+i%7*13)*size,s=(3+i%4)*(1-q*.65)*size;
 polygon(c,[[xx-s,yy+s],[xx-s*.7,yy-s*2.3],[xx,yy-s*3.5],[xx+s,yy]],i%3?'#56b9e8':'#d1faff');}
 c.restore();}
function arm(c,b,target,p){if(!ready||p<.48||p>.87)return;
 const rise=C((p-.48)/.12),reach=b.reach,start={x:b.x+b.dir*30,y:370},end=b.tip;
 const control={x:L(b.x+b.dir*90,(start.x+target.x)/2,reach),y:L(285-rise*155,Math.min(start.y,target.y-75)-95,reach)};
 c.save();c.globalAlpha*=1-C((p-.84)/.03);
 for(let i=0;i<26;i++){const t=i/26,u=(i+1)/26,point=k=>({x:(1-k)*(1-k)*start.x+2*(1-k)*k*control.x+k*k*end.x,y:(1-k)*(1-k)*start.y+2*(1-k)*k*control.y+k*k*end.y}),a=point(t),z=point(u),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy),width=20*(1-t)+3;
 c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));
 // Reuse actual rendered blue facets from the octopus mantle as the arm surface.
 c.drawImage(image,88+(i%3)*15,48+(i%2)*15,34,34,-1,-width,len+3,width*2);
 polygon(c,[[-1,-width],[len+2,-width*.96],[len+2,-width*.45],[-1,-width*.45]],'#80d8ff44');
 polygon(c,[[-1,width*.35],[len+2,width*.35],[len+2,width],[-1,width]],'#062d7099');
 if(i%2===0){c.fillStyle='#69c8e9';c.beginPath();c.ellipse(len*.4,width*.58,width*.48,width*.25,0,0,T);c.fill();c.strokeStyle='#2779b6';c.lineWidth=2;c.stroke();}c.restore();}
 c.restore();}
function draw(c,{progress:p,target,layer='body'}){if(!target)return;const b=pose(p,target);
 if(layer==='ground'){
 c.save();c.globalAlpha=.24*C(p/.20)*(1-b.exit);c.fillStyle='#0b2236';c.beginPath();c.ellipse(b.x,428,100,22,0,0,T);c.fill();c.restore();
 if(p>=.82){const open=C((p-.82)/.06),fade=1-C((p-.97)/.03);c.save();c.globalAlpha=open*fade;c.fillStyle='#063b65';c.beginPath();c.ellipse(500,430,120,32,0,0,T);c.fill();c.strokeStyle='#70d8ff';c.lineWidth=4;c.stroke();c.fillStyle='#0b719b';c.beginPath();c.ellipse(500,430,95,21,0,0,T);c.fill();c.restore();}
 return;}
 if(layer==='whip'){
 arm(c,b,target,p);splash(c,target.x,target.y-8,(p-.70)/.16,1.05);
 return;}
 c.save();if(b.exit>0){c.beginPath();c.rect(0,-1000,1000,1431);c.clip();}
 c.translate(b.x,b.y+b.exit*310);c.scale(b.dir,1);c.rotate(b.exit*.22);sprite(c,b.frame,0,0);c.restore();
 splash(c,500,430,(p-.19)/.20,1.25);
 splash(c,500,430,(p-.88)/.12,1.15);
}
function portrait(c,w,h){c.save();const k=Math.min(w/280,h/280);c.translate(w/2,h*.98);c.scale(k,k);sprite(c,5,0,0);c.restore();}
root.WIZARDRY_OCTO_V95={draw,portrait,pose,onReady:fn=>listeners.push(fn)};
})(window);
