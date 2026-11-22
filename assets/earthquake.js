(() => {
  "use strict";

  // The main fault runs through both sides. Shorter faults tear toward the back and front rows.
  const faults = [
    [[500,510],[452,499],[420,531],[351,512],[303,540],[228,532],[190,562],[83,547],[10,570]],
    [[500,510],[552,477],[587,491],[641,458],[707,474],[744,431],[823,449],[879,423],[982,455]],
    [[420,531],[438,560],[398,581],[418,607]],
    [[552,477],[513,450],[538,422],[503,399]],
    [[303,540],[265,511],[292,478],[213,452],[168,416]],
    [[707,474],[747,502],[701,532],[778,551],[816,596]],
    [[190,562],[155,583],[108,588]],
    [[823,449],[846,480],[915,498],[967,541]]
  ];
  const delay = [0,0,3,4,5,5,8,8];
  const opening = [0,0,0,1,3,5,8,11,13,12,15,17,16,18,19,17,19,18,17,16,15,13,12,11,9,8,7,6,4,2,1,0];
  const dustColors = ["#af825a","#745844","#d9aa74","#8d684d"];

  function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fill();
  }

  function draw(ctx, progress) {
    const frame = Math.min(31, Math.floor(progress * 32));
    const width = opening[frame];
    if (!width) return;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, (32 - frame) / 8);
    faults.forEach((fault, ray) => {
      const traveled = Math.min(fault.length - 1, (frame - 2 - delay[ray]) * .97);
      for (let index = 0; index < traveled; index++) {
        const [x,y] = fault[index], [nextX,nextY] = fault[index + 1];
        const length = Math.hypot(nextX - x, nextY - y);
        const nx = (y - nextY) / length, ny = (nextX - x) / length;
        const reveal = Math.min(1, traveled - index);
        const tipX = x + (nextX - x) * reveal, tipY = y + (nextY - y) * reveal;
        const gap = width * (ray < 2 ? 1 : .59) * (1 - index / (fault.length * 1.3));
        const edge = [x + nx * gap, y + ny * gap];
        const lip = [x + nx * (gap + 8), y + ny * (gap + 8) - 4];
        const end = [tipX, tipY];
        polygon(ctx, [[x - nx * gap,y - ny * gap],edge,end], "#181313");
        polygon(ctx, [edge,lip,end], "#a47c52");
        polygon(ctx, [[x - nx * gap,y - ny * gap],[x - nx * (gap + 5),y - ny * (gap + 5) + 4],end], "#4e392e");

        const age = frame - 5 - delay[ray] - index;
        if (age < 0 || age > 17 || (index + ray) % 2) continue;
        const spread = age * (ray % 2 ? 1.4 : -1.4);
        const lift = age * (34 - age) * .22;
        ctx.save();
        ctx.globalAlpha *= (1 - age / 18) * .7;
        for (let shard = 0; shard < 4; shard++) {
          const sx = x + spread * (1 + shard * .38) + shard * 10;
          const sy = y - lift * (1 + shard * .44);
          const size = 4 + ((ray + shard + index) % 4) * 3;
          polygon(ctx, [[sx-size,sy],[sx+size*.25,sy-size],[sx+size,sy+2],[sx,sy+size*.45]], dustColors[shard]);
        }
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function shake(progress) {
    const frame = Math.min(31, Math.floor(progress * 32));
    const force = opening[frame] * .83;
    return {x: Math.sin(progress * 127) * force, y: Math.sin(progress * 189) * force * .57};
  }

  function portrait(ctx, width, height) {
    polygon(ctx, [[0,0],[width,0],[width,height],[0,height]], "#432d26");
    ctx.save();
    ctx.scale(width / 720, height / 225);
    ctx.translate(-140, -392);
    draw(ctx, .48);
    ctx.restore();
  }

  window.Earthquake = {draw, shake, portrait};
})();
