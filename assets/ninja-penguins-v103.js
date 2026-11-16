/* Ninja Penguins: 24 illustrated low-poly poses; no rigid sprite rotation. */
(function(root){"use strict";
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,E=t=>t*t*(3-2*t),TAU=Math.PI*2;
const HIT=[.62,.665,.71],FLIGHT=.032,WIDTH=106;
const atlas=new Image(),listeners=[];let ready=false;
atlas.onload=()=>{ready=true;listeners.forEach(fn=>fn());};
atlas.src="./assets/ninja-penguins-v103.png";
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function frameAt(p,index){
 const start=index*.045,t=C((p-start)/.21);
 if(p<.30)return t>=1?5:[0,1,2,3,4,5][Math.min(5,Math.floor(t*6))];
 if(p>=.84)return [1,2,3,4,5][Math.min(4,Math.floor(C((p-.84)/.16)*5))];
 if(index!==0){
  if(p<.36)return 6;
  if(p<.44)return 7;
  if(p<.49)return 8;
  if(p<.54)return 9;
  if(p<.60)return 10;
  return 11;
 }
 if(p<.44)return 0;
 if(p<.56)return [1,2,3,4][Math.min(3,Math.floor((p-.44)/.12*4))];
 // The body turns through front, profile and back views between throws.
 for(let i=0;i<3;i++){const release=HIT[i]-FLIGHT;
  if(p>=release-.008&&p<release+.012)return 19+i*2;
  if(p>=release-.022&&p<release-.008)return 18+i*2;
 }
 if(p<.73)return 12+Math.floor((p-.56)*300)%6;
 return 23;
}
function pose(p,index,target){
 const dir=target.x>=500?1:-1,bx=500+dir*(index===0?0:index===1?-34:34),ground=432+(index===1?8:index===2?-8:0);
 let x=bx,y=ground,alpha=1,depth=ground;
 if(p<.30){
  const t=C((p-index*.045)/.21),travel=E(t);
  x=bx-dir*(1-travel)*380;
  // Two successive vaults, with the second jump passing above a teammate.
  const jump=t<.55?Math.sin(t/.55*Math.PI)*104:Math.sin((t-.55)/.45*Math.PI)*72;
  y=ground-jump;alpha=C(t*9);
 }else if(index===0&&p>=.44&&p<.84){
  const up=E(C((p-.44)/.12)),down=E(C((p-.74)/.10));
  const peakX=target.x-dir*48,peakY=target.y-205;
  x=L(bx,peakX,up);y=L(ground,peakY,up)-Math.sin(C((p-.44)/.12)*Math.PI)*32;
  x=L(x,bx,down);y=L(y,ground,down);
  depth=L(ground,target.y+.2,up)*(1-down)+ground*down;
 }else if(index!==0&&p>=.36&&p<.56){
  y=ground+Math.sin(C((p-.36)/.20)*Math.PI)*8;
 }else if(p>=.84){
  const t=C((p-.84)/.16);x=bx+dir*E(t)*420;y=ground-Math.sin(t*Math.PI)*96;alpha=1-t;
 }
 return{x,y,dir,alpha,ground,depth,frame:frameAt(p,index)};
}
function sprite(c,frame,x,y,width,dir=1,alpha=1){
 if(!ready||alpha<=0)return;
 const sw=atlas.naturalWidth/6,sh=atlas.naturalHeight/4,row=Math.floor(frame/6),anchor=[242,242,232,232][row]/256*sh,k=width/sw;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(dir,1);
 c.drawImage(atlas,(frame%6)*sw,row*sh,sw,sh,-width/2,-anchor*k,width,sh*k);c.restore();
}
function shot(p,index,target){
 const release=HIT[index]-FLIGHT,b=pose(release,0,target),origin={x:b.x+b.dir*WIDTH*.30,y:b.y-WIDTH*.35};
 const end={x:target.x,y:target.y-65},q=C((p-release)/FLIGHT);
 return{x:L(origin.x,end.x,q),y:L(origin.y,end.y,q),origin,end,q,release,angle:Math.atan2(end.y-origin.y,end.x-origin.x)};
}
function kunai(c,x,y,a){
 c.save();c.translate(x,y);c.rotate(a);
 poly(c,[[-26,-2],[-11,-3],[-10,3],[-26,2]],"#455d83");
 poly(c,[[-12,0],[4,-7],[26,0],[4,7]],"#8ce6ff");
 poly(c,[[-12,0],[4,-7],[26,0],[2,0]],"#f1ffff");
 c.restore();
}
function depthFor({progress:p,target},layer){
 if(layer==="ground")return 200;
 if(layer.startsWith("actor"))return pose(p,Number(layer.slice(-1)),target).depth;
 if(layer==="kunai"){
  for(let i=0;i<3;i++){const s=shot(p,i,target);if(p>=s.release&&p<HIT[i])return L(pose(s.release,0,target).depth,target.y+.2,s.q);}
 }
 return target.y+.2;
}
function draw(c,{progress:p,target,layer}){
 if(!target)return;
 if(layer==="ground"){
  for(let i=0;i<3;i++){const b=pose(p,i,target),height=Math.max(0,b.ground-b.y);
   c.save();c.globalAlpha*=.20*b.alpha/(1+height/130);c.fillStyle="#071421";c.beginPath();c.ellipse(b.x,b.ground,24/(1+height/300),6,0,0,TAU);c.fill();c.restore();
  }return;
 }
 if(layer.startsWith("actor")){
  const b=pose(p,Number(layer.slice(-1)),target);sprite(c,b.frame,b.x,b.y,WIDTH,b.dir,b.alpha);return;
 }
 for(let i=0;i<3;i++){
  const s=shot(p,i,target);
  if(layer==="kunai"&&p>=s.release&&p<HIT[i]){
   c.save();c.strokeStyle="#b9f6ff";c.shadowColor="#70dcff";c.shadowBlur=7;c.lineWidth=3;
   c.beginPath();c.moveTo(s.x-(s.end.x-s.origin.x)*.24,s.y-(s.end.y-s.origin.y)*.24);c.lineTo(s.x,s.y);c.stroke();c.shadowBlur=0;
   kunai(c,s.x,s.y,s.angle);c.restore();
  }
  const q=(p-HIT[i])/.065;
  if(layer==="impact"&&q>=0&&q<1){
   c.save();c.translate(s.end.x,s.end.y);c.globalAlpha*=1-q;
   c.fillStyle="#edffff";c.beginPath();c.arc(0,0,5+q*17,0,TAU);c.fill();
   for(let j=0;j<10;j++){const a=j*TAU/10+i*.7,r=7+q*48;c.save();c.rotate(a);poly(c,[[r,-3],[r+18*(1-q),0],[r,4],[r-5,0]],j%2?"#d5fbff":"#78d9f7");c.restore();}
   c.strokeStyle="#c0f5ff";c.lineWidth=2;c.beginPath();c.arc(0,0,9+q*32,0,TAU);c.stroke();c.restore();
  }
 }
}
function portrait(c,w,h){
 const k=Math.min(w/250,h/190);c.save();c.translate(w/2,h*.96);c.scale(k,k);
 sprite(c,0,-67,0,105,1);sprite(c,11,67,0,105,-1);sprite(c,18,0,-57,115,1);c.restore();
}
root.WIZARDRY_PENGUINS_V103={draw,pose,frameAt,shot,depthFor,portrait,timing:{hits:HIT,flight:FLIGHT},onReady:fn=>{listeners.push(fn);if(ready)fn();}};
})(window);
