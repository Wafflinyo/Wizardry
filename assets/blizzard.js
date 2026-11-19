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
    draw(ctx, progress, caster, targets, fullStrengthAt) {
      const start = .06;
      if (progress <= start || progress >= 1 || !targets.length) return;
      const direction = caster.x < 500 ? 1 : -1;
      const centerX = targets.reduce((sum,target)=>sum+target.x,0)/targets.length;
      const centerY = targets.reduce((sum,target)=>sum+target.y,0)/targets.length;
      const travel = (progress-start)/(fullStrengthAt-start);
      const approach = clamp(travel);
      const exit = clamp((progress-fullStrengthAt)/(1-fullStrengthAt));
      const growth = approach*approach*(3-2*approach);
      const width = (116+growth*574)*(1-.21*exit);
      const height = (70+growth*290)*(1-.18*exit);
      const opacity = clamp(approach*6)*clamp((1-exit)*3.5);
      const x = caster.x+(centerX-caster.x)*travel+direction*88*exit*exit;
      const y = caster.y+(centerY-caster.y)*approach-86;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(direction,1);
      for (const [dx,dy,scale,alpha,delay] of [
        [-.08,-.24,.89,.70,.08], [.03,.21,.91,.68,.04], [0,0,1,.96,0],
        [.14,.04,.75,.56,.12], [-.11,.14,.70,.60,.04],
      ]) {
        const intro = clamp((approach-delay)/(1-delay));
        const life = clamp((exit-delay)/(1-delay));
        const frame = Math.min(15,Math.floor(intro*peak+life*5+.00001));
        ctx.globalAlpha = opacity*alpha;
        drawFrame(ctx,frame,dx*width,dy*height,width*scale,height*scale);
      }
      ctx.restore();
    },
    portrait(ctx, width, height) {
      const size = Math.min(width,height);
      drawFrame(ctx,peak,width/2,height/2,size,size);
    },
  };
})();
