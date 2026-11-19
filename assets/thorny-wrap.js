(() => {
  "use strict";

  const atlas = new Image();
  atlas.src = "./assets/thorny-wrap.webp";
  const cell = 256;
  const wrapped = 15;

  function drawFrame(ctx, frame, x, floor, size) {
    if (!atlas.naturalWidth) return;
    ctx.drawImage(atlas, (frame%4)*cell, Math.floor(frame/4)*cell,
      cell, cell, x-size/2, floor-size*.88, size, size);
  }

  window.ThornyWrap = {
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    draw(ctx, target, progress) {
      if (progress <= 0) return;
      const scale = .6+.3*Math.max(0,Math.min(1,(target.y-288)/235));
      const frame = Math.min(wrapped,Math.floor(progress*16));
      drawFrame(ctx,frame,target.x,target.y+3,218*scale);
    },
    portrait(ctx, width, height) {
      const size = Math.min(width,height);
      drawFrame(ctx,wrapped,width/2,(height-size)/2+size*.88,size);
    },
  };
})();
