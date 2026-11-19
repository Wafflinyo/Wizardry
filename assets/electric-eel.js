(() => {
  const atlas = new Image();
  atlas.src = "./assets/electric-eel-painted.webp";
  const tile = 256;
  const wrapSeam = 132;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;

  function sprite(ctx,frame,x,y,size){
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,
      x-size/2,y-size*.88,size,size);
  }

  function scene(target,p,hit,connected){
    const dir=target.x>=500?1:-1;
    const recoil=clamp(p/.38);
    const spring=clamp((p-.43)/.15);
    const wrap=clamp((p-.58)/(hit-.58));
    const release=clamp((p-.95)/.05);
    const start=target.x-dir*210;
    const x=mix(start-dir*32*recoil*recoil,target.x,spring*spring)+dir*47*release;
    const y=mix(510,target.y,spring)-Math.sin(spring*Math.PI)*21;
    const hold=[12,13,14,13];
    const frame=p<.43?Math.min(3,Math.floor(recoil*4)):
      p<.58?4+Math.min(3,Math.floor(spring*4)):
      p<hit?8+Math.min(3,Math.floor(wrap*4)):
      release>0?15:hold[Math.floor((p-hit)*18)%hold.length];
    return {x,y,dir,p,hit,frame,connected};
  }

  function sparks(ctx,p,shocking){
    const opacity=ctx.globalAlpha;
    const count=shocking?9:2;
    for(let i=0;i<count;i++){
      const clock=p*(shocking?33:13)+i*.618;
      const age=clock%1;
      if(!shocking&&age>.36)continue;
      const seed=Math.floor(clock)*2.4+i*2.4;
      const pulse=Math.sin(Math.PI*(shocking?age:age/.36));
      const x=Math.cos(seed)*(shocking?62:79);
      const y=(shocking?-94:-28)+Math.sin(seed)*(shocking?66:10);
      const reach=(shocking?31:16)+Math.sin(seed*3)*8;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(seed+Math.sin(age*6)*.19);
      ctx.globalAlpha=opacity*pulse;
      ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(reach*.24,-6);
      ctx.lineTo(reach*.39,2+Math.sin(age*14)*4);ctx.lineTo(reach*.67,-3);
      ctx.lineTo(reach,.8);
      ctx.lineWidth=shocking?5:3;ctx.strokeStyle="#efaa16";ctx.stroke();
      ctx.lineWidth=shocking?2:1.4;ctx.strokeStyle="#ffed61";ctx.stroke();
      ctx.restore();
    }
  }

  // Divide the wrap pose at the gap between its rear and near arcs.
  // Both layers sample the same registered frame and share the same edge.
  function clipWrap(ctx,size,layer){
    const seam=wrapSeam*size/tile-size*.88;
    const top=-size*.88;
    ctx.beginPath();
    if(layer==="back")ctx.rect(-size/2,top,size,seam-top);
    else ctx.rect(-size/2,seam,size,top+size-seam);
    ctx.clip();
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
      const wrapped=frame>=9&&frame<=14;
      if(!wrapped&&layer==="back")return;
      const size=wrapped?210:220;
      ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
      ctx.globalAlpha*=Math.min(1,p*18,(1-p)*12);
      if(!connected&&p>=hit)ctx.globalAlpha*=clamp(1-(p-hit)*10);
      ctx.save();
      if(wrapped)clipWrap(ctx,size,layer);
      sprite(ctx,frame,0,0,size);
      ctx.restore();
      if(layer==="front"&&(p<hit||connected))sparks(ctx,p,p>=hit&&frame!==15);
      ctx.restore();
    }
  };
})();
