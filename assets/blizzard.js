(() => {
  "use strict";

  const atlas = new Image();
  atlas.src = "./assets/blizzard.webp";
  const cell = 256;
  const peak = 10;
  const clamp = value => Math.max(0,Math.min(1,value));

  function drawFrame(ctx, frame, x, y, width, height) {
    if (!atlas.naturalWidth) return;
    ctx.drawImage(atlas,(frame%4)*cell,Math.floor(frame/4)*cell,cell,cell,
      x-width/2,y-height/2,width,height);
  }

  window.Blizzard = {
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    draw(ctx, progress, caster, target, impact) {
      const start = impact-.38;
      const end = Math.min(1,impact+.37);
      if (progress < start || progress >= end) return;
      const approaching = progress <= impact;
      const fraction = approaching ? (progress-start)/(impact-start) : (progress-impact)/(end-impact);
      const frame = approaching ? Math.floor(clamp(fraction)*peak) : peak+Math.min(15-peak,Math.floor(fraction*6));
      const direction = target.x >= caster.x ? 1 : -1;
      const distance = Math.abs(target.x-caster.x);
      const x = approaching ? caster.x+direction*(distance*(1-(1-fraction)**1.4)) : target.x+direction*fraction*180;
      const y = (approaching ? caster.y+(target.y-caster.y)*fraction : target.y)-83;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(direction,1);
      const width = 295+Math.min(138,distance*.24);
      drawFrame(ctx,frame,0,0,width,224);
      ctx.restore();
    },
    portrait(ctx, width, height) {
      const size = Math.min(width,height);
      drawFrame(ctx,peak,width/2,height/2,size,size);
    },
  };
})();
