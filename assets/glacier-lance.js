(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224,origin={x:500,y:395};
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/glacier-lance-frames.webp?v=0.310.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const n=clamp(p);return n*n*(3-2*n);};
  const lerp=(a,b,p)=>a+(b-a)*p;

  function scene(target,p,hit,frostbite,blocked){
    const release=hit-.145;
    const contact={x:target.x,y:target.y-71};
    const angle=Math.atan2(contact.y-origin.y,contact.x-origin.x);
    const ux=Math.cos(angle),uy=Math.sin(angle);
    const length=Math.hypot(contact.x-origin.x,contact.y-origin.y);
    const leading=Math.min(94,length*.42);
    const travel=p<release?0:p<hit?(length-leading)*clamp((p-release)/(hit-release))**1.55:
      length-leading+(blocked?0:155*smooth((p-hit)/.15));
    const impact=clamp((p-hit)/.23);
    const frame=p<release?(p<.12?0:p<.26?1:p<.43?2:3):
      p<hit?4:5;
    return {x:origin.x+ux*travel,y:origin.y+uy*travel,angle,contact,ux,uy,p,hit,release,impact,frame,frostbite,blocked,
      size:leading/.48, depthY:lerp(462,target.y,clamp(travel/Math.max(1,length-leading)))+.12};
  }

  function sprite(ctx,frame,x,y,size,angle){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.drawImage(atlas,frame%4*tile,Math.floor(frame/4)*tile,tile,tile,-size/2,-size/2,size,size);
    ctx.restore();
  }

  function triangle(ctx,x,y,scale,color,angle){
    ctx.save();
    ctx.translate(x,y);ctx.rotate(angle);
    ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(-scale*.7,scale*.48);ctx.lineTo(scale,0);ctx.lineTo(-scale*.32,-scale*.59);
    ctx.closePath();ctx.fill();
    ctx.restore();
  }

  function drawTrail(ctx,s){
    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.rotate(s.angle);
    const energy=smooth((s.p-s.release)/.06)*(1-smooth(s.impact/.63));
    ctx.globalAlpha*=energy;
    for(let i=0;i<9;i++){
      const y=(i-4)*3.6;
      const span=42+i%3*16+s.impact*65;
      ctx.fillStyle=["#8aeaff","#3ca8df","#e3fcff"][i%3];
      ctx.beginPath();
      ctx.moveTo(-span-s.size*.37,y+(i-4)*2);
      ctx.lineTo(-s.size*.18,y);
      ctx.lineTo(-span*.53-s.size*.37,y+1.9);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function drawImpact(ctx,s){
    const p=s.impact;
    if(p>=1)return;
    ctx.save();
    ctx.globalAlpha*=1-smooth((p-.36)/.64);
    const size=(s.frostbite?172:142)+64*p;
    if(!s.blocked){
      sprite(ctx,p<.50?6:7,s.contact.x,s.contact.y,size,s.angle);
      const count=s.frostbite?31:17;
      for(let i=0;i<count;i++){
        const fan=(i%13-6)*.16;
        const angle=s.angle+fan+(i%6===0?Math.PI:0);
        const radius=6+p*(39+i%7*11);
        const x=s.contact.x+Math.cos(angle)*radius,y=s.contact.y+Math.sin(angle)*radius;
        triangle(ctx,x,y,(3+i%4)*(1-p*.54),["#6cd5fa","#bedfff","#f3fdff"][i%3],angle);
      }
    }else{
      sprite(ctx,7,s.contact.x,s.contact.y,105+35*p,s.angle);
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready())return;
    if(s.p>=s.release&&!s.blocked)drawTrail(ctx,s);
    if(s.p<s.hit||(!s.blocked&&s.impact<.57)){
      ctx.save();
      ctx.globalAlpha*=smooth(s.p/.12)*(1-smooth((s.impact-.12)/.45));
      sprite(ctx,s.frame,s.x,s.y,s.size,s.angle);
      ctx.restore();
    }
    if(s.p>=s.hit)drawImpact(ctx,s);
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,3,w/2,h*.50,Math.min(w*1.3,h*1.68),-.32);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.GlacierLance={scene,draw,portrait,onReady};
})();
