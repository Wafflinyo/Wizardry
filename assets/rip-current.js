(() => {
  "use strict";
  const atlas=new Image(),listeners=[];
  const tile=224;
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  let skimAtlas;
  atlas.onload=()=>{
    skimAtlas=document.createElement("canvas");
    skimAtlas.width=atlas.naturalWidth;
    skimAtlas.height=atlas.naturalHeight;
    const ctx=skimAtlas.getContext("2d");
    ctx.drawImage(atlas,0,0);
    const mask=document.createElement("canvas");
    mask.width=skimAtlas.width;mask.height=skimAtlas.height;
    const maskCtx=mask.getContext("2d");
    for(let row=0;row<2;row++){
      const y=row*tile;
      const feather=maskCtx.createLinearGradient(0,y,0,y+tile);
      feather.addColorStop(0,"#fff");
      feather.addColorStop(.70,"#fff");
      feather.addColorStop(.77,"#ffffff87");
      feather.addColorStop(.82,"#ffffff00");
      feather.addColorStop(1,"#ffffff00");
      maskCtx.fillStyle=feather;
      maskCtx.fillRect(0,y,skimAtlas.width,tile);
    }
    ctx.globalCompositeOperation="destination-in";
    ctx.drawImage(mask,0,0);
    listeners.splice(0).forEach(fn=>fn());
  };
  atlas.src="./assets/rip-current-frames.webp?v=0.311.0";
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
      lerp(target.y,ally.y,inbound)+Math.sin(inbound*Math.PI)*27:target.y;
    const frame=strike?p<.18?0:p<.32?1:2:
      returning?arriving?p<arrival+.08?6:7:5:p<impact+.046?3:ally?4:7;
    const dir=returning?backDir:outDir;
    const alpha=smooth(p/.13)*(ally?1-smooth((p-.92)/.08):1-smooth((p-impact-.07)/.18));
    return {x,y,p,frame,dir,alpha,impact,arrival,returning,arriving,
      moving:strike&&p>.16||returning&&!arriving,flow:returning?inbound:outbound};
  }

  function sprite(ctx,index,x,y,w,h,dir,grounded=false){
    ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
    ctx.drawImage((grounded&&skimAtlas)||atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,-w/2,-h*.83,w,h);
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

  function groundSkim(ctx,s,width){
    ctx.save();
    const dir=s.dir;
    for(let i=0;i<4;i++){
      const spread=width*(.34+i*.031);
      const drift=((s.p*7+i*.23)%1)*24;
      const x=s.x-dir*(11+drift),y=s.y+2+i*3;
      ctx.fillStyle=i%2?"#7de8e543":"#238c9d62";
      ctx.beginPath();
      ctx.moveTo(x-dir*spread,y+3);
      ctx.quadraticCurveTo(x,y-9,x+dir*spread*.72,y);
      ctx.quadraticCurveTo(x,y+6,x-dir*spread,y+3);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx,s){
    if(!ready()||s.alpha<=0)return;
    const width=s.arriving?206:s.returning?201:255;
    const height=s.arriving?169:s.returning?123:151;
    ctx.save();
    ctx.globalAlpha*=s.alpha;
    if(s.moving){groundSkim(ctx,s,width);wake(ctx,s);}
    sprite(ctx,s.frame,s.x,s.y+5,width,height,s.dir,s.moving);
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
