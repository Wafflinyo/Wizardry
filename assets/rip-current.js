(() => {
  "use strict";
  const atlas=new Image(),rolling=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/rip-current-frames.webp?v=0.311.0";
  rolling.src="./assets/rip-current-roll-frames.webp?v=0.311.2";
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=p=>{const t=clamp(p);return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;

  function scene(source,target,ally,p,card){
    const impact=card.hit,turn=impact+.10,arrival=card.healAt;
    const strike=p<impact,returning=!!ally&&p>=turn,arriving=returning&&p>=arrival;
    const outDir=target.x<source.x?-1:1;
    const backDir=ally?.x>target.x?1:-1;
    const outbound=smooth((p-.16)/(impact-.16));
    const inbound=smooth((p-turn)/(arrival-turn));
    const x=strike?lerp(500,target.x,outbound):returning?lerp(target.x,ally.x,inbound):target.x;
    const y=strike?lerp(468,target.y,outbound):returning?
      lerp(target.y,ally.y,inbound):target.y;
    const frame=strike?p<.18?0:p<.32?1:2:
      returning?arriving?p<arrival+.08?6:7:5:p<impact+.046?3:ally?4:7;
    const dir=returning?backDir:outDir;
    const alpha=smooth(p/.13)*(ally?1-smooth((p-.92)/.08):1-smooth((p-impact-.07)/.18));
    return {x,y,p,frame,dir,alpha,impact,arrival,returning,arriving,
      moving:strike&&p>.16||returning&&!arriving,flow:returning?inbound:outbound};
  }

  function sprite(ctx,index,x,y,w,h,dir,image=atlas){
    ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
    ctx.drawImage(image,index%4*tile,Math.floor(index/4)*tile,tile,tile,-w/2,-h*.83,w,h);
    ctx.restore();
  }

  function shard(ctx,x,y,w,h,color){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x-w,y+1);
    ctx.lineTo(x+w*.3,y-h);
    ctx.lineTo(x+w,y);
    ctx.lineTo(x-w*.2,y+h);
    ctx.closePath();ctx.fill();
  }

  function wake(ctx,s){
    const dir=s.dir;
    const swell=Math.sin(s.flow*Math.PI);
    ctx.save();
    ctx.globalAlpha*=.64*swell;
    for(let i=0;i<15;i++){
      const drift=(s.p*9+i*.137)%1;
      const x=s.x-dir*(29+drift*(s.returning?89:121));
      const y=s.y+Math.sin(drift*7+i)*13;
      shard(ctx,x,y,6+i%5*3,1+i%3,["#177d9c","#58d7d7","#d6ffff"][i%3]);
    }
    ctx.restore();
  }

  function flowingWave(ctx,s,width,height){
    const phase=s.p*32;
    const edge=u=>{
      const taper=Math.sin(u*Math.PI);
      return height*(-.066+taper*(.032*Math.sin(u*7*Math.PI-phase)
        +.018*Math.sin(u*13*Math.PI-phase*1.45)));
    };
    const hasRolling=rolling.complete&&rolling.naturalWidth>0;
    const image=hasRolling?rolling:atlas;
    const frame=hasRolling?2:s.frame;
    ctx.save();
    ctx.translate(s.x,s.y+5);
    ctx.scale(s.dir,1);

    // Clip the water itself to the swashing edge, rather than drawing lines on the floor.
    ctx.beginPath();
    ctx.moveTo(-width*.53,-height);
    ctx.lineTo(-width*.53,edge(0));
    for(let i=0;i<20;i++){
      const middle=(i+.5)/20,end=(i+1)/20;
      ctx.quadraticCurveTo((middle-.5)*width,edge(middle),(end-.5)*width,edge(end));
    }
    ctx.lineTo(width*.53,edge(1));
    ctx.lineTo(width*.53,-height);
    ctx.closePath();
    ctx.clip();

    // Let facets drift across the crest on a fixed baseline without scaling the wave.
    const strips=16;
    for(let i=0;i<strips;i++){
      const u=i/strips;
      const shift=width*.020*Math.sin(phase-u*11)*Math.sin(u*Math.PI);
      ctx.drawImage(image,(frame%4)*tile,Math.floor(frame/4)*tile+u*tile,
        tile,tile/strips,-width/2+shift,(u-.83)*height,width,height/strips+.32);
    }
    ctx.restore();
  }

  function splash(ctx,s){
    const t=clamp((s.p-(s.arriving?s.arrival:s.impact))/.15);
    ctx.save();
    ctx.globalAlpha*=1-t;
    for(let i=0;i<22;i++){
      const a=i*2.39996;
      const radius=8+t*(27+i%6*11);
      const x=s.x+Math.cos(a)*radius,y=s.y-9+Math.sin(a)*radius*.49-Math.sin(t*Math.PI)*(11+i%5*8);
      shard(ctx,x,y,2+i%4,2+i%3,["#60cde2","#84f4de","#f0ffff"][i%3]);
    }
    if(s.arriving){
      ctx.strokeStyle="#baffed";
      ctx.lineWidth=2.4;
      ctx.beginPath();ctx.ellipse(s.x,s.y+3,21+t*57,5+t*17,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready()||s.alpha<=0)return;
    const width=s.arriving?206:s.returning?201:255;
    const height=s.arriving?169:s.returning?123:151;
    ctx.save();
    ctx.globalAlpha*=s.alpha;
    if(s.moving){
      wake(ctx,s);
      flowingWave(ctx,s,width,height);
    }else sprite(ctx,s.frame,s.x,s.y+5,width,height,s.dir);
    if(s.arriving||s.p>=s.impact&&s.p<s.impact+.15)splash(ctx,s);
    ctx.restore();
  }
  function portrait(ctx,w,h){
    if(!ready())return;
    sprite(ctx,2,w/2,h*.75,Math.min(w*1.40,h*1.63),h*1.1,1);
  }
  function onReady(fn){if(ready())fn();else listeners.push(fn);}
  window.RipCurrent={scene,draw,portrait,onReady};
})();
