(() => {
  "use strict";

  const atlas = new Image();
  const listeners = [];
  atlas.onload = () => listeners.splice(0).forEach(fn => fn());
  atlas.src = "./assets/soul-harvest.webp";
  const violet = "#ba7afa";
  const bright = "#f6e2ff";
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const scaleFor = target => .6 + .3 * clamp((target.y - 288) / 235);

  function polygon(ctx, points, fill, stroke, thickness = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = thickness; ctx.stroke(); }
  }

  function crystal(ctx, size, core = bright) {
    polygon(ctx, [[0,-size], [size*.56,0], [0,size], [-size*.56,0]], "#512963", violet);
    polygon(ctx, [[0,-size], [size*.56,0], [0,size*.23]], "#a65adb");
    polygon(ctx, [[0,-size], [0,size*.23], [-size*.56,0]], core);
    polygon(ctx, [[0,size*.23], [size*.56,0], [0,size]], "#7d409c");
  }

  // Discrete seal frames form three jaws, lock around the mana crystal,
  // fracture the light and leave short-lived shards around the target.
  const sealFrames = [
    [69, 11, 0, .1], [61, 15, .10, .30], [52, 20, .14, .58],
    [46, 25, .21, .85], [42, 29, .26, 1], [38, 29, .31, 1],
    [35, 31, .34, 1], [33, 33, .37, 1], [31, 35, .39, 1],
    [29, 35, .42, 1], [25, 35, .44, 1], [22, 37, .46, 1],
    [19, 39, .48, 1], [18, 41, .50, 1], [43, 24, .51, .9],
    [56, 18, .55, .7], [67, 12, .59, .5], [79, 8, .63, .24],
  ];
  function seal(ctx, frame, layer) {
    const [radius, jaw, angle, opacity] = sealFrames[frame];
    ctx.globalAlpha *= opacity;
    for (let i = 0; i < 6; i++) {
      const rotation = angle + i * Math.PI / 3;
      if (layer === "back" && Math.sin(rotation) >= 0) continue;
      if (layer === "front" && Math.sin(rotation) < 0) continue;
      ctx.save();
      ctx.rotate(rotation);
      ctx.translate(radius, 0);
      polygon(ctx, [[-jaw*.65,0],[4,-jaw*.51],[jaw*.62,-jaw*.26],[jaw*.29,jaw*.48],[0,jaw*.2]],
        "#2b1439", "#7c4aac", 1.5);
      polygon(ctx, [[-jaw*.65,0],[4,-jaw*.51],[jaw*.62,-jaw*.26],[0,-jaw*.12]], "#8f56bb");
      polygon(ctx, [[-jaw*.65,0],[0,-jaw*.12],[0,jaw*.2]], "#d9a3ff");
      ctx.restore();
    }
    if (layer !== "back" && frame < 16) {
      ctx.save();
      if (frame >= 13) ctx.globalAlpha *= .45;
      crystal(ctx, frame >= 13 ? 14 : 24, frame >= 10 ? "#e4adff" : "#bdf7ff");
      ctx.restore();
    }
    if (layer !== "back" && frame >= 13) {
      for (let i = 0; i < 7; i++) {
        const theta = i * 2.4;
        const distance = (frame - 12) * (5 + i % 3);
        ctx.save();
        ctx.translate(Math.cos(theta)*distance, Math.sin(theta)*distance*.75);
        ctx.rotate(theta);
        crystal(ctx, 4 + i % 4);
        ctx.restore();
      }
    }
  }

  function drawScourge(ctx, target, progress, layer) {
    const frame = Math.min(sealFrames.length - 1, Math.floor(progress * sealFrames.length));
    const scale = scaleFor(target);
    ctx.save();
    ctx.translate(target.x, target.y - 110*scale);
    ctx.scale(scale*1.35, scale*1.1);
    seal(ctx, frame, layer);
    ctx.restore();
  }

  // Each cue selects a separately drawn, grounded pose. Hand sockets share
  // those frames so the chain and captured soul track the two hands.
  const poseTimes = [0,.09,.18,.29,.35,.41,.47,.53,.61,.69,.80,.90];
  const sockets = [
    [[-12, -5], [43, -23]],
    [[-13, -46], [52, -45]],
    [[-29, -71], [54, -63]],
    [[-54, -109], [57, -58]],
    [[-38, -156], [71, -59]],
    [[-1, -123], [64, -54]],
    [[87, -138], [43, -53]],
    [[85, -138], [41, -51]],
    [[-23, -111], [56, -60]],
    [[-7, -118], [57, -113]],
    [[-21, -84], [51, -129]],
    [[13, -110], [14, -130]],
  ];

  function curve(a, b, t, bend) {
    return {x:mix(a.x,b.x,t), y:mix(a.y,b.y,t)+Math.sin(t*Math.PI)*bend};
  }

  function harvestScene(target, progress, hooked) {
    const direction = target.x >= 500 ? 1 : -1;
    const x = target.x - direction * Math.min(255, Math.max(156, Math.abs(target.x-500)+75));
    const y = Math.min(536, Math.max(421, target.y+18));
    const scale = scaleFor({y}) * .94;
    const frame = poseTimes.findLastIndex(time => progress >= time);
    const point = ([dx,dy]) => ({x:x+direction*dx*scale,y:y+dy*scale});
    const [hand, lantern] = sockets[frame].map(point);
    const contact = {x:target.x,y:target.y-96*scaleFor(target)};
    const extension = progress < .56
      ? clamp((progress-.425)/.135)
      : 1-smooth((progress-.61)/.155);
    const blade = curve(hand, contact, extension, -35);
    const chainDepth = mix(y,target.y,extension)+.13;
    return {target, progress, hooked, x, y, scale, direction, frame, hand, lantern, blade, contact, extension, chainDepth};
  }

  function actor(ctx, frame, x, y, scale, direction, alpha = 1) {
    if (!atlas.naturalWidth) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x,y);
    ctx.scale(direction*scale,scale);
    const column = frame % 4, row = Math.floor(frame/4);
    ctx.drawImage(atlas,column*256,row*256,256,256,-128,-232,256,256);
    ctx.restore();
  }

  function sickle(ctx, x, y, angle, size) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.scale(size,size);
    polygon(ctx,[[-20,-3],[8,-3],[19,-19],[38,-21],[49,-13],[54,2],[46,14],[35,17],[44,6],[40,-4],[30,-8],[20,0],[16,7],[-20,7]],
      "#775380","#28202e",1.5);
    polygon(ctx,[[8,-3],[19,-19],[38,-21],[49,-13],[54,2],[46,14],[46,0],[37,-12],[26,-12],[16,3]],
      "#f3d7ff");
    polygon(ctx,[[-20,-3],[8,-3],[16,7],[-20,7]],"#b28259","#30222e",1);
    ctx.restore();
  }

  function drawChain(ctx, scene) {
    const {hand, blade, extension, scale, direction, progress} = scene;
    if (progress < .28 || progress > .86) return;
    const distance = Math.hypot(blade.x-hand.x,blade.y-hand.y);
    const links = Math.max(1,Math.ceil(distance/7));
    for (let i=0; i<links; i++) {
      const t=(i+.5)/links;
      const point=curve(hand,blade,t,14*extension);
      ctx.save();
      ctx.translate(point.x,point.y);
      ctx.rotate(Math.atan2(blade.y-hand.y+Math.cos(t*Math.PI)*44*extension,blade.x-hand.x));
      const width = i%2 ? 1.8 : 3.7;
      polygon(ctx,[[-5,0],[-3,-width],[3,-width],[5,0],[3,width],[-3,width]],null,"#ad91bd",1.5);
      ctx.restore();
    }
    const angle=extension>.01?Math.atan2(blade.y-hand.y,blade.x-hand.x):(direction===1?-.7:Math.PI+.7);
    const reach=extension>.01?mix(18,42,extension)*scale:0;
    sickle(ctx,blade.x-Math.cos(angle)*reach,blade.y-Math.sin(angle)*reach,angle,scale);
  }

  function drawHarvest(ctx, scene, layer) {
    const {progress:p, x,y, frame, scale, direction, lantern, contact, hooked} = scene;
    ctx.save();
    if (layer === "portal") {
      ctx.globalAlpha *= smooth(p/.09) * (1-smooth((p-.89)/.11));
      ctx.translate(x,y);
      ctx.scale(scale,scale*.36);
      const ring = Array.from({length:12},(_,i)=>[Math.cos(i*Math.PI/6)*84,Math.sin(i*Math.PI/6)*84]);
      polygon(ctx,ring,"#240f36a0","#8a4bb9",5);
      polygon(ctx,ring.map(([dx,dy])=>[dx*.72,dy*.72]),"#3c195ab0","#d59bff",2);
    } else if (layer === "actor") {
      actor(ctx,frame,x,y+(1-smooth(p/.16))*48+(smooth((p-.91)/.09))*22,scale,direction,
        smooth(p/.07)*(1-smooth((p-.91)/.09)));
    } else if (layer === "chain") {
      drawChain(ctx,scene);
    } else if (hooked && p>=.56) {
      if (p<.69) {
        const burst=clamp((p-.56)/.13);
        ctx.save();
        ctx.globalAlpha *= 1-burst;
        ctx.translate(contact.x,contact.y);
        for(let i=0;i<9;i++){
          ctx.save();
          ctx.rotate(i*Math.PI*2/9);
          ctx.translate(9+burst*(24+i%3*8),0);
          polygon(ctx,[[0,0],[17,2],[26,0],[15,-4]],i%2?violet:bright);
          ctx.restore();
        }
        ctx.restore();
      }
      if (p>=.59 && p<.85) {
        const t=smooth((p-.59)/.26);
        for(let i=5;i>=0;i--){
          const particle=curve(contact,lantern,clamp(t-i*.032),-66);
          ctx.save();
          ctx.globalAlpha *= 1-i*.14;
          ctx.translate(particle.x,particle.y);
          crystal(ctx,(16-i*2)*(1-.55*t));
          ctx.restore();
        }
      } else if (p>=.85 && p<.99) {
        ctx.globalAlpha *= 1-smooth((p-.89)/.10);
        ctx.translate(lantern.x,lantern.y);
        crystal(ctx,13+3*Math.sin(p*80));
      }
    }
    ctx.restore();
  }

  function portrait(ctx,w,h,id) {
    ctx.save();
    ctx.translate(w*.5,h*.53);
    if(id==="manascourge"){
      ctx.scale(1.48,1.48);
      seal(ctx,10);
      polygon(ctx,[[-13,-46],[13,-46],[40,0],[13,46],[-13,46],[-40,0]],null,"#c58ff4",2);
    }else{
      actor(ctx,10,0,h*.36,h/249,1);
      sickle(ctx,53,-69,-.65,1.2);
    }
    ctx.restore();
  }

  window.DarkSpells={onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn),portrait,drawScourge,harvestScene,drawHarvest};
})();
