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
    field(ctx, progress, caster, targets) {
      const age = (progress-.37)/.62;
      if (age <= 0 || age >= 1) return;
      const dir = caster.x < 500 ? 1 : -1;
      const growth = clamp(age*4.2);
      const opacity = growth * clamp((1-age)*4);
      const centerY = targets.reduce((sum,target)=>sum+target.y,0)/targets.length;
      const width = 390+growth*300;
      const height = 210+growth*150;
      ctx.save();
      ctx.translate(500+dir*(178+45*age),centerY-102);
      ctx.scale(dir,1);
      for (const [dx,dy,phase,scale,alpha] of [
        [-34,-86,.10,.89,.67], [28,70,.02,.91,.68], [-17,-12,0,1,.91],
        [90,13,.17,.75,.54], [-61,53,-.05,.70,.57],
      ]) {
        const step = clamp(age+phase);
        const frame = Math.min(15,Math.floor(5+step*11));
        ctx.globalAlpha = opacity*alpha;
        drawFrame(ctx,frame,dx+age*64,dy,width*scale,height*scale);
      }
      ctx.restore();
    },
    portrait(ctx, width, height) {
      const size = Math.min(width,height);
      drawFrame(ctx,peak,width/2,height/2,size,size);
    },
  };
})();
