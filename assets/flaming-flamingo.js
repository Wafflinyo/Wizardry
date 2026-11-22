(() => {
  "use strict";

  const atlas = new Image();
  atlas.src = "./assets/flaming-flamingo-frames.webp?v=0.294.0";
  const size = 192, center = 500, ground = 478, scale = 1.14;
  const prepFrames = [0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 7];
  const mouth = [[185, 62], [183, 62], [181, 62], [184, 62]];
  const ready = () => atlas.complete && atlas.naturalWidth > 0;
  const clamp = value => Math.max(0, Math.min(1, value));

  function drawFrame(ctx, index, x, y, width, height) {
    ctx.drawImage(atlas, index % 4 * size, Math.floor(index / 4) * size,
      size, size, x, y, width, height);
  }

  function releaseFrame(progress) {
    return Math.floor((progress - .55) * 28) % 4;
  }

  function bird(ctx, progress, dir) {
    if (!ready()) return;
    const frame = progress < .55
      ? prepFrames[Math.min(prepFrames.length - 1, Math.floor(progress / .55 * prepFrames.length))]
      : progress < .91 ? 8 + releaseFrame(progress) : 4;
    ctx.save();
    ctx.translate(center, ground);
    ctx.scale(dir * scale, scale);
    ctx.globalAlpha *= clamp((1 - progress) / .085);
    drawFrame(ctx, frame, -83, -178, size, size);
    ctx.restore();
  }

  function breath(ctx, progress, dir, targets) {
    if (!ready() || progress < .55 || progress >= .91 || !targets.length) return;
    const amount = clamp((progress - .55) / .10);
    const [mx, my] = mouth[releaseFrame(progress)];
    const originX = center + (mx - 83) * scale * dir;
    const originY = ground + (my - 178) * scale;
    const rays = targets.map(unit => {
      const dx = Math.max(18, (unit.x - originX) * dir);
      const dy = unit.y - 60 - originY;
      return { angle: Math.atan2(dy, dx), length: Math.hypot(dx, dy) };
    }).sort((a, b) => a.angle - b.angle);
    const fade = clamp((.91 - progress) / .08);
    const frame = progress >= .83 ? 15 : amount < .45 ? 12 : amount < .8 ? 13 : 13 + releaseFrame(progress) % 2;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(dir, 1);
    for (const ray of rays) {
      ctx.save();
      ctx.rotate(ray.angle);
      ctx.globalAlpha *= fade * (rays.length > 1 ? .83 : 1);
      const length = (ray.length + 48) * (.18 + amount * .82);
      const height = 33 + amount * 72;
      drawFrame(ctx, frame, -9, -height / 2, length, height);
      ctx.restore();
    }
    ctx.restore();
  }

  function portrait(ctx, width, height) {
    if (!ready()) return;
    const length = Math.min(width, height) * 1.18;
    drawFrame(ctx, 4, (width - length) / 2, (height - length) / 2, length, length);
  }

  window.FlamingFlamingo = { ground, bird, breath, portrait };
})();
