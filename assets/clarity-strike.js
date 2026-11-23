(() => {
  "use strict";

  const cloud = new Image();
  const listeners = [];
  const cloudPath = "./assets/lightning-rod-v98.webp";
  const rise = 234;
  const clamp = p => Math.max(0, Math.min(1, p));
  const ready = () => cloud.complete && cloud.naturalWidth > 0;
  cloud.onload = () => listeners.splice(0).forEach(listener => listener());
  cloud.src = cloudPath;

  function drawCloud(ctx, x, y, width, frame, alpha) {
    if (!ready() || alpha <= 0) return;
    const tile = cloud.naturalWidth / 4;
    const cropHeight = tile * .45;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(cloud, frame % 4 * tile, Math.floor(frame / 4) * tile, tile, cropHeight,
      x - width / 2, y - width * .24, width, width * .45);
    ctx.restore();
  }

  function impact(ctx, point, age) {
    const spread = 12 + 70 * age;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha *= (1 - age) ** 1.5;
    ctx.lineWidth = 2 * (1 - age);
    ctx.strokeStyle = "#a4e4ff";
    ctx.beginPath();
    ctx.ellipse(0, 0, spread * .82, spread * .54, -.14, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.39996;
      const x = Math.cos(angle), y = Math.sin(angle);
      const distance = spread * (.53 + (i % 5) * .09);
      const length = (i % 4 + 4) * (2 - age);
      ctx.fillStyle = i % 3 ? "#c9f4ff" : "#688dfd";
      ctx.beginPath();
      ctx.moveTo(x * distance - y * 2, y * distance + x * 2);
      ctx.lineTo(x * (distance + length), y * (distance + length));
      ctx.lineTo(x * distance + y * 2, y * distance - x * 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx, target, rune, progress, hit) {
    const gathering = clamp(progress / .23);
    const after = progress - hit;
    const x = target.x;
    const y = target.y - rise + 12 * (1 - gathering) ** 2;
    const fade = clamp((1 - progress) / .27);
    const cloudFrame = progress < .10 ? 2 : progress < .22 ? 3 : progress < hit - .20 ? 4
      : after < -.015 ? (Math.floor(progress * 24) % 4 === 0 ? 6 : 5)
      : after < .045 ? 6 : after < .17 ? 7 : 4;
    const width = 214 * (.58 + .42 * gathering);
    const origin = {x, y: y + width * .10};
    const end = rune || {x:target.x, y:target.y - 90};
    const bolts = window.WIZARDRY_ROD_BOLT_V118;

    // The leader reaches the rune on the same frame that combat resolves the cleanse.
    if (after >= -.055 && after < .18) {
      const reach = clamp((after + .055) / .055);
      const tip = {x:origin.x + (end.x - origin.x) * reach, y:origin.y + (end.y - origin.y) * reach};
      const intensity = after < 0 ? .30 + .55 * reach
        : after < .04 ? 1 : after < .065 ? .22 : after < .095 ? .78 : clamp((.18 - after) / .085) * .40;
      bolts?.draw(ctx, origin, tip, clamp((after + .055) / .235), intensity);
    }
    drawCloud(ctx, x, y, width, cloudFrame, fade * clamp(progress / .10));
    if (after >= 0 && after < .25) impact(ctx, end, after / .25);
  }

  function portrait(ctx, width, height) {
    const center = {x:width / 2, y:height * .31};
    const end = {x:width * .54, y:height * .83};
    window.WIZARDRY_ROD_BOLT_V118?.draw(ctx, {x:center.x,y:height * .42}, end, .25);
    drawCloud(ctx, center.x, center.y, Math.min(width * .9, height * 1.62), 6, 1);
    impact(ctx, end, .23);
  }

  function onReady(callback) {
    if (ready()) callback();
    else listeners.push(callback);
    const bolt = window.WIZARDRY_ROD_BOLT_V118;
    if (bolt && !bolt.ready()) bolt.onReady(callback);
  }

  window.ClarityStrike = {draw, portrait, onReady};
})();
