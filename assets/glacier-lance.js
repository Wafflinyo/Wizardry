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
    const release=hit-.068,plant=hit+.095;
    const contact={x:target.x,y:target.y-93};
    const aim=Math.atan2(contact.y-origin.y,contact.x-origin.x);
    const length=Math.hypot(contact.x-origin.x,contact.y-origin.y);
    const leading=Math.min(133,length*.49);
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
    return {x,y,angle,contact,ground,aim,p,hit,release,plant,blocked,frostbite,
      impact:clamp((p-hit)/.19),frame:p<release?Math.min(9,Math.floor(p/release*10)):9,
      size:leading/.48,depthY:lerp(462,target.y,clamp((p-release)/(hit-release)))+.12};
  }

  function sprite(ctx,frame,x,y,size,angle,image=atlas){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.drawImage(image,frame%4*tile,Math.floor(frame/4)*tile,tile,tile,-size/2,-size/2,size,size);
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
    const energy=smooth((s.p-s.release)/.023)*(1-smooth((s.p-s.plant+.018)/.018));
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

  function draw(ctx,s){
    if(!ready())return;
    if(s.p>=s.release&&s.p<s.plant&&!s.blocked)drawTrail(ctx,s);
    if(s.p>=s.hit&&!s.blocked&&s.p>=s.plant)drawGround(ctx,s);
    if(s.p<s.hit||!s.blocked){
      ctx.save();
      ctx.globalAlpha*=smooth(s.p/.12)*(1-smooth((s.p-.94)/.06));
      sprite(ctx,s.frame,s.x,s.y,s.size,s.angle);
      ctx.restore();
    }
    if(s.p>=s.hit)drawImpact(ctx,s);
  }

  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,8,w/2,h*.50,Math.min(w*1.3,h*1.68),-.32);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.GlacierLance={scene,draw,portrait,onReady};
})();
