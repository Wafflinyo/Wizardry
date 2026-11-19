(() => {
  const atlas = new Image();
  atlas.src = "./assets/electric-eel-painted.webp";
  const finishAtlas = new Image();
  finishAtlas.src = "./assets/electric-eel-double-wrap.webp";
  const tile = 256;
  const wrapSeam = 132;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;

  function sprite(ctx,frame,x,y,size){
    const source=frame<16?atlas:finishAtlas;
    const row=frame<16?Math.floor(frame/4):0;
    if(!source.naturalWidth)return;
    ctx.drawImage(source,(frame%4)*tile,row*tile,tile,tile,
      x-size/2,y-size*.88,size,size);
  }

  function scene(target,p,hit,connected){
    const dir=target.x>=500?1:-1;
    const recoil=clamp(p/.38);
    const spring=clamp((p-.43)/.12);
    const wrap=clamp((p-.55)/(hit-.55));
    const release=clamp((p-.95)/.05);
    const start=target.x-dir*210;
    const x=mix(start-dir*32*recoil*recoil,target.x,spring*spring)+dir*47*release;
    const y=mix(510,target.y,spring)-Math.sin(spring*Math.PI)*21;
    const wrapFrames=[8,9,10,11,16,17];
    const hold=[17,18,19,18];
    const frame=p<.43?Math.min(3,Math.floor(recoil*4)):
      p<.55?4+Math.min(3,Math.floor(spring*4)):
      p<hit?wrapFrames[Math.min(5,Math.floor(wrap*6))]:
      release>0?15:hold[Math.floor((p-hit)*18)%hold.length];
    return {x,y,dir,p,hit,frame,connected};
  }

  function approachSparks(ctx,p){
    const opacity=ctx.globalAlpha;
    for(let i=0;i<2;i++){
      const clock=p*13+i*.618;
      const age=clock%1;
      if(age>.36)continue;
      const seed=Math.floor(clock)*2.4+i*2.4;
      const x=Math.cos(seed)*79,y=-28+Math.sin(seed)*10;
      const reach=16+Math.sin(seed*3)*8;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(seed+Math.sin(age*6)*.19);
      ctx.globalAlpha=opacity*Math.sin(Math.PI*age/.36);
      ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(reach*.24,-6);
      ctx.lineTo(reach*.39,2+Math.sin(age*14)*4);ctx.lineTo(reach*.67,-3);
      ctx.lineTo(reach,.8);
      ctx.lineWidth=3;ctx.strokeStyle="#efaa16";ctx.stroke();
      ctx.lineWidth=1.4;ctx.strokeStyle="#ffed61";ctx.stroke();
      ctx.restore();
    }
  }

  // The original cast's lightning and bloom, isolated from its eel sprite.
  function electrocute(ctx,p,hit){
    if(!finishAtlas.naturalWidth)return;
    const pulse=[0,1,2,1,3];
    const beat=Math.floor((p-hit)*38)%pulse.length;
    ctx.save();
    ctx.globalCompositeOperation="screen";
    ctx.drawImage(finishAtlas,pulse[beat]*tile,tile,tile,tile,-113,-210,226,226);
    ctx.restore();
  }

  // The near arcs cross the shoulders and hips. The complementary
  // cutout lets the same continuous sprite pass behind the wizard twice.
  const nearArcs = [
    [[0,76],[85,77],[162,77],[256,86],[256,134],[195,133],[110,124],[0,123]],
    [[0,157],[76,162],[166,177],[256,177],[256,256],[0,256]]
  ];
  function clipWrap(ctx,size,frame,layer){
    const scale=size/tile, left=-size/2, top=-size*.88;
    ctx.beginPath();
    if(layer==="back")ctx.rect(left,top,size,size);
    if(frame<16){
      ctx.rect(left,top+wrapSeam*scale,size,(tile-wrapSeam)*scale);
    }else{
      for(const arc of nearArcs){
        arc.forEach(([x,y],i)=>{
          if(i===0)ctx.moveTo(left+x*scale,top+y*scale);
          else ctx.lineTo(left+x*scale,top+y*scale);
        });
        ctx.closePath();
      }
    }
    ctx.clip("evenodd");
  }

  window.ElectricEel={
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h){
      const size=Math.min(w,h);
      sprite(ctx,13,w/2,(h-size)/2+size*1.01,size);
    },
    scene,
    draw(ctx,{x,y,dir,p,hit,frame,connected},layer){
      const wrapped=(frame>=9&&frame<=14)||frame>=16;
      if(!wrapped&&layer==="back")return;
      const size=wrapped?210:220;
      ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
      ctx.globalAlpha*=Math.min(1,p*18,(1-p)*12);
      if(!connected&&p>=hit)ctx.globalAlpha*=clamp(1-(p-hit)*10);
      ctx.save();
      if(wrapped)clipWrap(ctx,size,frame,layer);
      sprite(ctx,frame,0,0,size);
      ctx.restore();
      if(layer==="front"){
        if(p<hit)approachSparks(ctx,p);
        else if(connected&&wrapped)electrocute(ctx,p,hit);
      }
      ctx.restore();
    }
  };
})();
