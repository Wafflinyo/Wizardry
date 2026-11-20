(() => {
  const atlas = new Image();
  atlas.src = "./assets/frozen-touch.webp";

  function sprite(ctx, frame, x, y, size) {
    if (!atlas.naturalWidth) return;
    const cell = atlas.naturalWidth / 4;
    ctx.drawImage(atlas, frame % 4 * cell, Math.floor(frame / 4) * cell, cell, cell,
      x - size / 2, y - size / 2, size, size);
  }

  function draw(ctx, target, progress, suppressed) {
    if (progress < 0 || progress >= 1) return;
    const scale = .60 + .30 * Math.max(0, Math.min(1, (target.y - 288) / 235));
    const frame = Math.floor(suppressed ? 10 + progress * 6 : progress * 16);
    const drift = suppressed ? 0 : 120 * Math.max(0, 1 - progress / .57) ** 2;
    ctx.save();
    ctx.translate(target.x, target.y - 104 * scale);
    ctx.scale(target.team ? scale : -scale, scale);
    ctx.globalAlpha *= Math.min(1, progress * 14, (1 - progress) * 8);
    sprite(ctx, frame, -drift, 0, suppressed ? 200 : 278);
    ctx.restore();
  }

  window.FrozenTouch = {
    draw,
    portrait(ctx, w, h) {
      sprite(ctx, 7, w / 2, h / 2, Math.min(w, h));
    },
    onReady(fn) {
      if (atlas.naturalWidth) fn();
      else atlas.addEventListener("load", fn, {once: true});
    }
  };
})();
