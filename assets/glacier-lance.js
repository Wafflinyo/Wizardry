(() => {
  "use strict";
  const atlas=new Image(),impactAtlas=new Image(),listeners=[];
  const tile=224,origin={x:500,y:323};
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/glacier-lance-long-frames.webp?v=0.310.1";
  impactAtlas.src="./assets/glacier-lance-frames.webp?v=0.310.0";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const n=clamp(p);return n*n*(3-2*n);};
  const lerp=(a,b,p)=>a+(b-a)*p;

  function scene(target,p,hit,frostbite,blocked){
    const release=hit-.034,plant=hit+.058;
    const contact={x:target.x,y:target.y-93};
    const aim=Math.atan2(contact.y-origin.y,contact.x-origin.x);
    const length=Math.hypot(contact.x-origin.x,contact.y-origin.y);
    const leading=Math.min(114,length*.43);
    const direction=target.x<origin.x?-1:1;
    const ground={x:target.x+direction*133,y:target.y+19};
    const control={x:contact.x+Math.cos(aim)*66,y:contact.y+Math.sin(aim)*66};
    let angle=aim,x=origin.x,y=origin.y;
    if(p>=release){
      const launch=clamp((p-release)/(hit-release));
      const plunge=blocked?0:clamp((p-hit)/(plant-hit));
      const t=1-plunge;
      const tip=p<hit?{
        x:origin.x+Math.cos(aim)*lerp(leading,length,launch),
        y:origin.y+Math.sin(aim)*lerp(leading,length,launch)
      }:{
        x:t*t*contact.x+2*t*plunge*control.x+plunge*plunge*ground.x,
        y:t*t*contact.y+2*t*plunge*control.y+plunge*plunge*ground.y
      };
      if(plunge>0)angle=Math.atan2(lerp(control.y-contact.y,ground.y-control.y,plunge),
        lerp(control.x-contact.x,ground.x-control.x,plunge));
      x=tip.x-Math.cos(angle)*leading;
      y=tip.y-Math.sin(angle)*leading;
    }
    const size=leading/.48;
    // Split along the current shaft at the chest plane. The tip crosses first.
    const chestPlane=(contact.x-x)*Math.cos(angle)+(contact.y-y)*Math.sin(angle);
    const split=p<hit?1:p>=plant?0:clamp(.5+chestPlane/size);
    return {x,y,angle,contact,ground,aim,p,hit,release,plant,blocked,frostbite,split,
      impact:clamp((p-hit)/.19),frame:p<release?Math.min(9,Math.floor(p/release*10)):9,
      size,backDepth:target.y-.12,depthY:lerp(462,target.y,clamp((p-release)/(hit-release)))+.12};
  }

  function sprite(ctx,frame,x,y,size,angle,image=atlas,start=0,end=1){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    const fraction=end-start;
    ctx.drawImage(image,(frame%4+start)*tile,Math.floor(frame/4)*tile,fraction*tile,tile,
      (start-.5)*size,-size/2,fraction*size,size);
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
    const launch=smooth((s.p-s.release)/.009);
    const remaining=1-smooth((s.p-s.hit)/.075);
    ctx.globalAlpha*=launch*remaining;
    for(let i=0;i<15;i++){
      const drift=((s.p-s.release)*37+i*.271)%1;
      const y=(i-7)*(3.4+drift*2);
      const head=s.size*(.46-drift*.62),tail=head-(65+i%4*21+drift*103);
      ctx.fillStyle=["#8aeaff","#44b8f4","#f0fdff"][i%3];
      ctx.beginPath();
      ctx.moveTo(tail,y+(i-7)*1.2);
      ctx.lineTo(head,y);
      ctx.lineTo(tail+(head-tail)*.22,y+(i%3+1)*1.3);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function drawImpact(ctx,s){
    const p=s.impact;
    if(p>=1||!impactAtlas.complete||!impactAtlas.naturalWidth)return;
    ctx.save();
    ctx.globalAlpha*=1-smooth((p-.36)/.64);
    const size=(s.frostbite?172:142)+64*p;
    if(!s.blocked){
      sprite(ctx,7,s.contact.x,s.contact.y,size,s.aim,impactAtlas);
      const count=s.frostbite?38:28;
      for(let i=0;i<count;i++){
        const fan=(i%13-6)*.16;
        const angle=s.aim+fan+(i%6===0?Math.PI:0);
        const radius=6+p*(47+i%7*12);
        const x=s.contact.x+Math.cos(angle)*radius,y=s.contact.y+Math.sin(angle)*radius;
        triangle(ctx,x,y,(4+i%5)*(1-p*.54),["#39aadd","#86e7ff","#edfcff"][i%3],angle);
      }
    }else{
      sprite(ctx,7,s.contact.x,s.contact.y,105+35*p,s.angle,impactAtlas);
    }
    ctx.restore();
  }

  function drawGround(ctx,s){
    const p=clamp((s.p-s.plant)/(1-s.plant));
    const {x,y}=s.ground;
    ctx.save();
    ctx.globalAlpha*=1-smooth(p);
    ctx.fillStyle="#a5eeff62";
    ctx.beginPath();ctx.ellipse(x,y,16+62*p,5+15*p,0,0,Math.PI*2);ctx.fill();
    for(let i=0;i<14;i++){
      const angle=i*2.39996;
      const radius=p*(19+i%5*11);
      const lift=Math.sin(p*Math.PI)*(8+i%4*9);
      triangle(ctx,x+Math.cos(angle)*radius,y+Math.sin(angle)*radius*.29-lift,
        (3+i%4)*(1-p*.65),["#64b9eb","#a5e9ff","#f0fdff"][i%3],angle-.7);
    }
    ctx.restore();
  }

  function draw(ctx,s,layer){
    if(!ready())return;
    const front=layer==="front";
    const start=front?0:s.split,end=front?s.split:1;
    if(front&&s.p>=s.release&&s.p<s.hit+.075&&!s.blocked)drawTrail(ctx,s);
    if(!front&&s.p>=s.plant&&!s.blocked)drawGround(ctx,s);
    if(end>start&&(s.p<s.hit||!s.blocked)){
      ctx.save();
      ctx.globalAlpha*=smooth(s.p/.12)*(1-smooth((s.p-.94)/.06));
      sprite(ctx,s.frame,s.x,s.y,s.size,s.angle,atlas,start,end);
      ctx.restore();
    }
    if(front&&s.p>=s.hit)drawImpact(ctx,s);
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,8,w/2,h*.50,Math.min(w*1.3,h*1.68),-.32);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.GlacierLance={scene,draw,portrait,onReady};
})();
