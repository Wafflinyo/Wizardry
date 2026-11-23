(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=256;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/briar-remedy-frames.webp?v=0.306.0";
  const palette={
    burn:["#a62915","#ff7c29","#ffd58a"],
    poison:["#52277b","#b664ed","#efd1ff"],
    frostbite:["#237eae","#7ce0ff","#e4fcff"],
    heal:["#317749","#8bdf45","#e4ff9b"]
  };
  const staffTips=[[0.681,0.373],[0.708,0.371],[0.85,0.377],[0.763,0.339],[0.623,0.313],[0.693,0.362],[0.907,0.381],[0.706,0.345]];
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const n=clamp(p);return n*n*(3-2*n);};
  const lerp=(a,b,t)=>a+(b-a)*t;

  function scene(target,p,card,effects,canHeal){
    const inward=target.team===0?1:-1;
    const x=target.x+inward*155,y=target.y+14;
    const size=216+clamp((target.y-390)/235)*26;
    const lift=26*(1-smooth(p/.18));
    const frame=p<.12?0:p<.23?1:p<.33?2:p<.45?3:
      p<card.hit?4:p<.69?5:p<.88?6:7;
    const [tipX,tipY]=staffTips[frame];
    const staff={x:x-inward*(tipX-.5)*size,y:y+lift+(tipY-.93)*size};
    return {target,x,y,lift,size,frame,staff,p,effects,canHeal,inward,
      hit:card.hit,healAt:card.healAt,alpha:smooth(p/.16)*(1-smooth((p-.90)/.10))};
  }

  function sprite(ctx,frame,size){
    ctx.drawImage(atlas,frame%4*tile,Math.floor(frame/4)*tile,tile,tile,-size/2,-size*.93,size,size);
  }

  function shard(ctx,x,y,size,color,tilt){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x-tilt,y-size);
    ctx.lineTo(x+size*.64,y);
    ctx.lineTo(x+tilt,y+size);
    ctx.lineTo(x-size*.71,y+size*.14);
    ctx.closePath();
    ctx.fill();
  }

  function stream(ctx,from,to,colors,progress,p,branch){
    if(progress<=0||progress>=1)return;
    const glow=Math.sin(Math.PI*progress)**.5;
    const height=23+branch*20;
    ctx.save();
    const wave=Math.sin(p*43+branch)*13;
    for(let i=0;i<3;i++){
      ctx.globalAlpha=glow*[.28,.70,.83][i];
      ctx.strokeStyle=colors[i];
      ctx.lineWidth=[13,5,1.5][i];
      ctx.beginPath();
      ctx.moveTo(from.x,from.y);
      ctx.bezierCurveTo(lerp(from.x,to.x,.28),from.y-height+wave+i*4,
        lerp(from.x,to.x,.74),to.y-height-wave-i*4,to.x,to.y);
      ctx.stroke();
    }
    for(let i=0;i<12;i++){
      const t=(p*8+i/12+branch*.16)%1;
      ctx.globalAlpha=glow*Math.sin(t*Math.PI);
      const x=lerp(from.x,to.x,t),y=lerp(from.y,to.y,t)-Math.sin(t*Math.PI)*(height+7*Math.sin(t*9+p*30));
      shard(ctx,x,y,2+i%3*1.6,colors[i%3],1+i%3);
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready()||s.alpha<=0)return;
    ctx.save();
    ctx.globalAlpha*=s.alpha;
    ctx.translate(s.x,s.y+s.lift);
    ctx.scale(-s.inward,1);
    sprite(ctx,s.frame,s.size);
    ctx.restore();
    const chest={x:s.target.x,y:s.target.y-77};
    for(const [i,effect] of s.effects.entries()){
      const start=.26+i*.037;
      stream(ctx,chest,s.staff,palette[effect],(s.p-start)/(s.hit+.045-start),s.p,i);
    }
    if(!s.canHeal||!s.effects.length)return;
    stream(ctx,s.staff,chest,palette.heal,(s.p-.665)/(s.healAt+.055-.665),s.p,0);
    const bloom=clamp((s.p-s.healAt)/.17);
    if(s.p<s.healAt||bloom>=1)return;
    ctx.save();
    ctx.globalAlpha*=1-bloom;
    ctx.strokeStyle=palette.heal[1];
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.ellipse(s.target.x,s.target.y+1,14+bloom*66,5+bloom*20,0,0,Math.PI*2);
    ctx.stroke();
    for(let i=0;i<23;i++){
      const angle=i*2.39996,radius=(10+bloom*45)*(1+i%4*.13);
      shard(ctx,chest.x+Math.cos(angle)*radius,chest.y+Math.sin(angle)*radius-bloom*37,
        2+i%4,palette.heal[i%3],i%3);
    }
    ctx.restore();
  }

  function portrait(ctx,width,height){
    if(!ready())return;
    ctx.save();
    ctx.translate(width/2,height*.95);
    sprite(ctx,2,Math.min(width*1.24,height*1.25));
    ctx.restore();
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.BriarRemedy={scene,draw,portrait,onReady};
})();
