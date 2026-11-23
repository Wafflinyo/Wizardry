(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/blood-debt-frames.webp?v=0.308.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>{const t=clamp(p);return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;

  function sprite(ctx,frame,x,y,size){
    ctx.drawImage(atlas,frame%4*tile,Math.floor(frame/4)*tile,tile,tile,
      x-size/2,y-size/2,size,size);
  }

  function shard(ctx,x,y,size,color,lean){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x-lean,y-size);
    ctx.lineTo(x+size*.7,y);
    ctx.lineTo(x+lean,y+size);
    ctx.lineTo(x-size*.7,y);
    ctx.closePath();ctx.fill();
  }

  function drawMark(ctx,target,p,blocked){
    if(!ready())return;
    const build=ease((p-.04)/.24);
    const land=ease((p-.34)/.34);
    const reveal=blocked&&p>=.68?7:p<.18?0:p<.31?1:p<.49?2:p<.66?3:p<.77?4:p<.90?5:7;
    const x=target.x,y=target.y-lerp(176,80,land);
    ctx.save();
    ctx.globalAlpha*=build*(1-ease((p-.79)/.21));
    sprite(ctx,reveal,x,y,108+build*66);
    ctx.restore();
  }

  function siphon(ctx,from,to,p){
    if(!ready()||p>=1)return;
    const start={x:from.x,y:from.y-76};
    const end={x:to.x,y:to.y-78};
    const travel=ease((p-.12)/.65);
    const x=lerp(start.x,end.x,travel);
    const y=lerp(start.y,end.y,travel)-Math.sin(travel*Math.PI)*65;
    ctx.save();
    ctx.globalAlpha*=1-ease((p-.72)/.28);
    if(p<.20)sprite(ctx,5,start.x,start.y,106+p*130);
    for(let i=0;i<15;i++){
      const t=clamp(travel-i*.031);
      if(t<=0)continue;
      const trailX=lerp(start.x,end.x,t);
      const trailY=lerp(start.y,end.y,t)-Math.sin(t*Math.PI)*(62+Math.sin(p*34+i)*14);
      shard(ctx,trailX,trailY,2+i%4,["#7d1635","#e23460","#ffc4ca"][i%3],i%3);
    }
    if(p>=.12)sprite(ctx,6,x,y,72);
    if(p>=.77)sprite(ctx,7,end.x,end.y,140+40*(p-.77));
    ctx.restore();
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,3,w/2,h/2,Math.min(w*1.24,h*1.2));
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.BloodDebt={drawMark,siphon,portrait,onReady};
})();
