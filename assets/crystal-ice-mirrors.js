(() => {
  const atlas = new Image();
  atlas.src = "./assets/crystal-ice-mirrors.webp";
  const tile = 256;
  const clamp = n => Math.max(0,Math.min(1,n));

  function sprite(ctx,frame,x,y,size){
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,
      x-size/2,y-size*.88,size,size);
  }

  window.CrystalIceMirrors={
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h){
      const size=Math.min(w,h);
      sprite(ctx,9,w/2,(h-size)/2+size*.88,size);
    },
    draw(ctx,unit,p,reflected){
      if(p>=1||p<0)return;
      const size=275*(.60+.30*clamp((unit.y-288)/235));
      const frame=Math.min(15,Math.floor(reflected?8+p*8:p*16));
      ctx.save();
      ctx.globalAlpha*=Math.min(1,p*15+.18,(1-p)*7);
      sprite(ctx,frame,unit.x,unit.y+7,size);
      if(reflected&&p<.72){
        const spread=18+p*85;
        ctx.globalAlpha*=(1-p)*.75;
        ctx.strokeStyle="#c5f5ff";
        ctx.lineWidth=5*(1-p);
        ctx.beginPath();
        ctx.ellipse(unit.x,unit.y-88,spread,spread*.7,0,0,Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
})();
