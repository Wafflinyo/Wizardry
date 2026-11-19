(() => {
  "use strict";

  const atlas = new Image();
  atlas.src = "./assets/thorny-wrap-v233.webp";
  const cell = 256;
  const wrapped = 23;

  function drawFrame(ctx, frame, x, floor, size, layer) {
    if (!atlas.naturalWidth) return;
    ctx.drawImage(atlas, (frame%4+(layer==="front"?4:0))*cell, Math.floor(frame/4)*cell,
      cell, cell, x-size/2, floor-size*.88, size, size);
  }

  window.ThornyWrap = {
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    draw(ctx, target, progress, layer) {
      if (progress <= 0) return;
      const scale = .6+.3*Math.max(0,Math.min(1,(target.y-288)/235));
      const frame = Math.min(wrapped,Math.floor(progress*(wrapped+1)));
      drawFrame(ctx,frame,target.x,target.y+3,218*scale,layer);
    },
    portrait(ctx, width, height) {
      const size = Math.min(width,height);
      const floor = (height-size)/2+size*.88;
      drawFrame(ctx,wrapped,width/2,floor,size,"back");
      drawFrame(ctx,wrapped,width/2,floor,size,"front");
    },
  };
})();
