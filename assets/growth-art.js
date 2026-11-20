(() => {
  const atlas = new Image();
  atlas.src = "./assets/growth-sapling.webp";
  const clamp = value => Math.max(0, Math.min(1, value));
  const cell = 192;

  function paint(ctx, frame, x, rootY, size, mirror) {
    if (!atlas.naturalWidth) return;
    ctx.save();
    ctx.translate(x, rootY);
    ctx.scale(mirror ? -1 : 1, 1);
    ctx.drawImage(atlas, frame % 4 * cell, Math.floor(frame / 4) * cell, cell, cell,
      -size / 2, -size * 0.96, size, size);
    ctx.restore();
  }

  function draw(ctx, target, progress, hit) {
    const depthScale = 0.60 + 0.30 * clamp((target.y - 288) / 235);
    const side = target.team ? -1 : 1;
    const saplings = [[-48, -15, 128, 0], [34, -20, 84, .12], [54, 7, 94, .10]];
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.scale(depthScale, depthScale);
    for (const [x, y, size, delay] of saplings) {
      const age = (progress - delay) / (1 - delay);
      if (age <= 0) continue;
      const frame = Math.min(15, Math.floor(age * 21));
      ctx.save();
      ctx.globalAlpha *= clamp(age / .08) * clamp((1 - progress) / .20);
      paint(ctx, frame, x * side, y, size, side < 0);
      ctx.restore();
    }
    // The crown releases a short trail of seedlight into the wizard at buff contact.
    for(let i=0;i<11;i++){
      const arrival = hit + i * .015;
      const t = (progress - arrival + .23) / .23;
      if(t<=0 || t>=1)continue;
      const x = side * (-48 * (1-t) + Math.sin(i*2.4+t*6)*19*Math.sin(t*Math.PI));
      const y = -106 + 37*t + Math.cos(i*2.4)*18*Math.sin(t*Math.PI);
      const size = (2+i%3)*Math.sin(t*Math.PI);
      ctx.globalAlpha = .9*Math.sin(t*Math.PI);
      ctx.fillStyle = i%2 ? "#c9ff83" : "#f3ffbe";
      ctx.beginPath();
      ctx.moveTo(x,y-size*1.5);
      ctx.lineTo(x+size,y);
      ctx.lineTo(x,y+size*1.5);
      ctx.lineTo(x-size,y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  window.GrowthArt = {
    draw,
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load", fn, {once: true});
    },
    portrait(ctx, width, height) {
      paint(ctx, 11, width / 2, height * .88, Math.min(width, height) * .99, false);
    }
  };
})();
