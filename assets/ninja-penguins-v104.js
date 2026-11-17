/* Ninja Penguins v104: original 36-pose throw, axial spin, return and clap atlas. */
(function(root){"use strict";
const C=x=>Math.max(0,Math.min(1,x)),L=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const HIT=[.62,.665,.71],FLIGHT=.025,atlas=new Image(),listeners=[];let ready=false;
atlas.onload=()=>{ready=true;listeners.forEach(fn=>fn());};
atlas.src="./assets/ninja-penguins-v103.png?v=0.104.1";
function frameAt(p){
 p=C(p);
 // Repeated front/side/back artwork creates rapid axial spins.
 if(p>=.57&&p<.73)return 12+Math.floor((p-.57)/.16*18)%6;
 const phases=[[0,.28,0,5],[.28,.57,6,11],[.57,.73,12,17],[.73,.81,18,23],[.81,.90,24,29],[.90,1,30,35]];
 for(const [a,b,first,last] of phases)if(p<b)return Math.min(last,first+Math.floor(C((p-a)/(b-a))*(last-first+1)));
 return 35;
}
function pose(p,index,target){
 const dir=target.x>=500?1:-1;
 return {x:500,y:432,dir,alpha:1,ground:432,depth:432,frame:frameAt(p)};
}
function cell(c,frame,x,y,width,dir=1){
 if(!ready)return;
 const sw=atlas.naturalWidth/6,sh=atlas.naturalHeight/6;
 c.save();c.translate(x,y);c.scale(dir,1);
 c.drawImage(atlas,frame%6*sw,Math.floor(frame/6)*sh,sw,sh,-width/2,-width*sh/sw,width,width*sh/sw);c.restore();
}
function shot(p,index,target){
 const dir=target.x>=500?1:-1,release=HIT[index]-FLIGHT;
 const origin={x:500+dir*96,y:260},end={x:target.x,y:target.y-65},q=C((p-release)/FLIGHT);
 return {x:L(origin.x,end.x,q),y:L(origin.y,end.y,q),origin,end,q,release,angle:Math.atan2(end.y-origin.y,end.x-origin.x)};
}
function depthFor({target},layer){return layer==="ground"?200:layer==="impact"||layer==="kunai"?target.y+.2:432;}
function draw(c,{progress:p,target,layer}){
 if(!target)return;
 const dir=target.x>=500?1:-1;
 if(layer==="actor0"){cell(c,frameAt(p),500,444,350,dir);return;}
 if(layer.startsWith("actor")||layer==="ground")return;
 for(let i=0;i<3;i++){
  const s=shot(p,i,target);
  if(layer==="kunai"&&p>=s.release&&p<HIT[i]){
   c.save();c.strokeStyle="#b9f6ff";c.shadowColor="#70dcff";c.shadowBlur=8;c.lineWidth=3;
   c.beginPath();c.moveTo(L(s.origin.x,s.x,.60),L(s.origin.y,s.y,.60));c.lineTo(s.x,s.y);c.stroke();
   c.translate(s.x,s.y);c.rotate(s.angle);c.fillStyle="#a9efff";c.beginPath();c.moveTo(23,0);c.lineTo(0,-7);c.lineTo(-10,0);c.lineTo(0,7);c.closePath();c.fill();c.restore();
  }
  const q=(p-HIT[i])/.045;
  if(layer==="impact"&&q>=0&&q<1){
   c.save();c.translate(s.end.x,s.end.y);c.globalAlpha*=1-q;c.strokeStyle="#c0f5ff";c.lineWidth=3;
   c.beginPath();c.arc(0,0,6+q*34,0,TAU);c.stroke();
   for(let j=0;j<9;j++){const a=j*TAU/9+i,r=8+q*45;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+14),Math.sin(a)*(r+14));c.stroke();}c.restore();
  }
 }
}
function portrait(c,w,h){cell(c,0,w/2,h*.96,Math.min(w,h*1.5)*.95);}
root.WIZARDRY_PENGUINS_V103={draw,pose,frameAt,shot,depthFor,portrait,timing:{hits:HIT,flight:FLIGHT},onReady:fn=>{listeners.push(fn);if(ready)fn();}};
})(window);
