(() => {
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;

  // Each pose traces the same body from tail to snout.
  const poses = [
    [[-96,-8],[-76,-21],[-47,-11],[-14,-7],[22,-29],[52,-34],[78,-22]],
    [[-79,-32],[-79,-13],[-53,-8],[-22,-25],[-31,-53],[-7,-70],[21,-56]],
    [[-85,-11],[-63,-27],[-35,-45],[-4,-61],[27,-69],[55,-75],[83,-80]],
    [[65,-39],[53,-66],[2,-61],[-60,-80],[-58,-115],[12,-134],[66,-108]],
    [[42,-32],[68,-59],[28,-75],[-62,-87],[-53,-121],[14,-136],[67,-111]]
  ];

  function pointAt(pose, t){
    const index = Math.min(pose.length - 2, Math.floor(t));
    const u = t - index;
    const a = pose[Math.max(0, index - 1)];
    const b = pose[index];
    const c = pose[index + 1];
    const d = pose[Math.min(pose.length - 1, index + 2)];
    return b.map((value, axis) => (
      2 * value + (c[axis] - a[axis]) * u +
      (2 * a[axis] - 5 * value + 4 * c[axis] - d[axis]) * u * u +
      (3 * value - a[axis] - 3 * c[axis] + d[axis]) * u * u * u
    ) / 2);
  }

  function triangle(ctx, color, a, b, c){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.closePath();
    ctx.fill();
  }

  const facets = [
    ["#ffd653", "#ffe585"], ["#df9c1c", "#f6ba29"], ["#8d5313", "#aa681a"]
  ];

  function makeFrame(from, to, amount){
    const pose = poses[from].map((point, i) => point.map((value, axis) =>
      mix(value, poses[to][i][axis], amount)
    ));
    return Array.from({length: 31}, (_, i) => {
      const t = i / 5;
      const [x, y] = pointAt(pose, t);
      const [ax, ay] = pointAt(pose, Math.max(0, t - .04));
      const [bx, by] = pointAt(pose, Math.min(6, t + .04));
      const length = Math.hypot(bx - ax, by - ay) || 1;
      const nx = (ay - by) / length, ny = (bx - ax) / length;
      const width = i === 30 ? 5 : Math.min(12, 11 * (i / 20) ** .72) + (i === 29 ? 2 : 0);
      return [-1, -.42, .48, 1].map(offset => [x + nx * width * offset, y + ny * width * offset]);
    });
  }

  const sequence = (from, to, count) => Array.from({length: count}, (_, frame) =>
    makeFrame(from, to, frame / (count - 1))
  );
  const recoilFrames = sequence(0, 1, 10);
  const launchFrames = sequence(1, 2, 8);
  const wrapFrames = sequence(2, 3, 11);
  const holdFrames = sequence(3, 4, 9);

  function drawBody(ctx, frame, first, end){
    for(let i = first; i < end; i++){
      for(let face = 0; face < facets.length; face++){
        const [light, shade] = facets[face];
        const a = frame[i][face], b = frame[i + 1][face];
        const c = frame[i + 1][face + 1], d = frame[i][face + 1];
        triangle(ctx, (i + face) % 3 ? light : shade, a, b, c);
        triangle(ctx, (i + face) % 3 ? shade : light, a, c, d);
      }
    }
    if(end !== frame.length - 1)return;
    const jaw = frame[end - 2][2];
    const snout = frame[end][2];
    ctx.strokeStyle = "#75430f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(...jaw);
    ctx.lineTo(...snout);
    ctx.stroke();
    const eye = frame[end - 2][1];
    ctx.fillStyle = "#39220b";
    ctx.beginPath();
    ctx.ellipse(eye[0], eye[1], 3.1, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff4a2";
    ctx.fillRect(eye[0] + .3, eye[1] - 1.4, 1.4, 1.4);
  }

  function scene(target,p,hit,connected){
    const dir = target.x >= 500 ? 1 : -1;
    const coil = clamp(p / .43);
    const spring = clamp((p - .45) / .135);
    const start = target.x - dir * 205;
    const recoil = start - dir * 27 * coil * coil;
    const x = mix(recoil, target.x, spring * spring);
    const y = mix(510, target.y, spring) - Math.sin(spring * Math.PI) * 25;
    const wrapping = p >= .585;
    const wrap = clamp((p - .585) / Math.max(.03, hit - .585));
    const pulse = (1 - Math.cos((p - hit) * 25)) / 2;
    const frames = p < .45 ? recoilFrames : !wrapping ? launchFrames : p < hit ? wrapFrames : holdFrames;
    const step = p < .45 ? coil : !wrapping ? spring : p < hit ? wrap : pulse;
    const frame = frames[Math.round(step * (frames.length - 1))];
    const split = wrapping ? Math.round(mix(30, 15, wrap)) : 30;
    return {x,y,dir,p,hit,frame,split,connected};
  }

  function sparks(ctx,p,shocking){
    const opacity=ctx.globalAlpha;
    const count=shocking?9:2;
    for(let i=0;i<count;i++){
      const clock=p*(shocking?33:13)+i*.618;
      const age=clock%1;
      if(!shocking&&age>.36)continue;
      const seed=Math.floor(clock)*2.4+i*2.4;
      const pulse=Math.sin(Math.PI*(shocking?age:age/.36));
      const x=Math.cos(seed)*(shocking?62:79);
      const y=(shocking?-96:-28)+Math.sin(seed)*(shocking?43:10);
      const reach=(shocking?31:16)+Math.sin(seed*3)*8;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(seed+Math.sin(age*6)*.19);
      ctx.globalAlpha=opacity*pulse;
      ctx.beginPath();
      ctx.moveTo(0,0);ctx.lineTo(reach*.24,-6);
      ctx.lineTo(reach*.39,2+Math.sin(age*14)*4);ctx.lineTo(reach*.67,-3);
      ctx.lineTo(reach,.8);
      ctx.lineWidth=shocking?5:3;ctx.strokeStyle="#efaa16";ctx.stroke();
      ctx.lineWidth=shocking?2:1.4;ctx.strokeStyle="#ffed61";ctx.stroke();
      ctx.restore();
    }
  }

  window.ElectricEel = {
    onReady(fn){ fn(); },
    portrait(ctx,w,h){
      const scale = Math.min(w / 184, h / 145) * .94;
      ctx.save();
      ctx.translate(w / 2, h / 2 + 84 * scale);
      ctx.scale(scale, scale);
      drawBody(ctx, holdFrames[0], 0, 30);
      ctx.restore();
    },
    scene,
    draw(ctx,{x,y,dir,p,hit,frame,split,connected},layer){
      if(layer === "back" && split === 30)return;
      ctx.save();
      ctx.translate(x,y);
      ctx.scale(dir,1);
      ctx.globalAlpha *= Math.min(1,p * 18,(1 - p) * 12);
      if(!connected && p >= hit)ctx.globalAlpha *= clamp(1 - (p - hit) * 10);
      if(layer === "back")drawBody(ctx,frame,split,30);
      else {
        drawBody(ctx,frame,0,split);
        if(p < hit || connected)sparks(ctx,p,split < 30 && p >= hit);
      }
      ctx.restore();
    }
  };
})();
