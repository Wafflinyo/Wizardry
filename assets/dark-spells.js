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

  function orb(ctx, radius, core = "#fff3ff") {
    const halo = ctx.createRadialGradient(0,0,0,0,0,radius*1.9);
    halo.addColorStop(0,core);
    halo.addColorStop(.32,"#f6d4ff");
    halo.addColorStop(.55,"#b877f1bb");
    halo.addColorStop(1,"#a65adb00");
    ctx.fillStyle=halo;
    ctx.beginPath();
    ctx.arc(0,0,radius*1.9,0,Math.PI*2);
    ctx.fill();
  }

  // Four obsidian pylons rise in separate poses, focus on a dark prism,
  // then collapse into angular fragments once the curse has attached.
  const scourgeFrames = [
    [0, 70, 0, .15], [11, 70, 0, .50], [22, 70, 0, .80], [35, 68, 0, 1],
    [49, 65, 0, 1], [58, 62, 0, 1], [65, 60, 5, 1], [69, 57, 10, 1],
    [72, 54, 16, 1], [72, 53, 21, 1], [73, 51, 25, 1], [74, 50, 29, 1],
    [75, 49, 31, 1], [76, 48, 34, 1], [67, 51, 23, .95], [49, 57, 14, .75],
    [34, 63, 7, .52], [17, 70, 3, .26], [3, 76, 0, .10],
  ];

  function pylon(ctx, x, foot, h) {
    const tip=[x-5,foot-h], seam=[x+3,foot-h*.44];
    polygon(ctx, [tip,[x+12,foot-h*.35],[x+8,foot],[x-9,foot+2],[x-13,foot-h*.25]],
      "#23122e","#a969de",1.3);
    polygon(ctx,[tip,seam,[x-9,foot+2],[x-13,foot-h*.25]],"#4e285f");
    polygon(ctx,[tip,seam,[x+12,foot-h*.35]],"#9360af");
    polygon(ctx,[seam,[x+12,foot-h*.35],[x+1,foot-h*.22]],"#e6bbfa");
    return seam;
  }

  function scourge(ctx, frame, layer) {
    const [height, spread, core, opacity] = scourgeFrames[frame];
    ctx.globalAlpha *= opacity;
    const pylons=[[-spread*.78,4,height*.91],[spread*.78,4,height*.98],[-spread,26,height*.73],[spread,26,height*.84]];
    const focus=[0,-44];
    for(const [i,[x,y,h]] of pylons.entries()){
      if(layer==="back"&&i>=2||layer==="front"&&i<2)continue;
      const tip=pylon(ctx,x,y,h);
      if(core>0){
        const kink=[tip[0]*.55,focus[1]-8+i*5];
        polygon(ctx,[tip,kink,[focus[0]+3,focus[1]+2],[kink[0],kink[1]+3]],"#d599fcbd");
      }
    }
    if(layer==="back"||!core)return;
    const [x,y]=focus;
    polygon(ctx,[[x,y-core],[x+core*.51,y-4],[x+core*.22,y+core*.54],[x,y+core],[x-core*.51,y+4]],"#120e1a","#d490ff",2);
    polygon(ctx,[[x,y-core],[x+core*.51,y-4],[x,y+core*.12]],"#683782");
    polygon(ctx,[[x-core*.51,y+4],[x,y+core*.12],[x,y+core]],"#472455");
    for(let i=0;i<4;i++){
      const sweep=clamp((frame-6+i*1.7)/12);
      const dx=(i%2?1:-1)*spread*(1-sweep);
      const dy=y-38*(1-sweep)+(i%3-1)*10;
      polygon(ctx,[[dx,dy-5],[dx+5,dy],[dx,dy+7],[dx-4,dy]],i%2?"#f3cbff":"#9e74e9");
    }
  }

  function drawScourge(ctx, target, progress, layer) {
    const frame = Math.min(scourgeFrames.length - 1, Math.floor(progress * scourgeFrames.length));
    const scale = scaleFor(target);
    ctx.save();
    ctx.translate(target.x, target.y - 61*scale);
    ctx.scale(scale*1.14, scale*1.14);
    scourge(ctx, frame, layer);
    ctx.restore();
  }

  // Each cue selects a separately drawn, grounded pose. Hand sockets share
  // those frames so the chain and captured soul track the two hands.
  const hookContact = .56;
  const soulRelease = .70;
  const lanternCatch = .90;
  const poseTimes = [0,.09,.18,.29,.35,.41,.47,.53,.63,soulRelease,.84,.93];
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
    const scale = scaleFor({y}) * 1.08;
    const frame = poseTimes.findLastIndex(time => progress >= time);
    const point = ([dx,dy]) => ({x:x+direction*dx*scale,y:y+dy*scale});
    const [hand, lantern] = sockets[frame].map(point);
    const contact = {x:target.x,y:target.y-96*scaleFor(target)};
    const retractAt = hooked ? soulRelease : .61;
    const extension = progress < hookContact
      ? clamp((progress-.425)/(hookContact-.425))
      : 1-smooth((progress-retractAt)/.145);
    const blade = curve(hand, contact, extension, -35);
    const chainDepth = Math.max(y,mix(y,target.y,extension))+.13;
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
    if (progress < .28 || progress > .89) return;
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
    } else if (hooked && p>=hookContact) {
      if (p<.69) {
        const burst=clamp((p-hookContact)/(.69-hookContact));
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
      if (p>=soulRelease && p<lanternCatch) {
        const t=smooth((p-soulRelease)/(lanternCatch-soulRelease));
        for(let i=5;i>=0;i--){
          const particle=curve(contact,lantern,clamp(t-i*.032*(1-t)),-66);
          ctx.save();
          ctx.globalAlpha *= 1-i*.14;
          ctx.translate(particle.x,particle.y);
          orb(ctx,(15-i*1.9)*(1-.48*t));
          ctx.restore();
        }
      } else if (p>=lanternCatch && p<.99) {
        ctx.globalAlpha *= 1-smooth((p-.94)/.05);
        ctx.translate(lantern.x,lantern.y);
        orb(ctx,12+2*Math.sin(p*80));
      }
    }
    ctx.restore();
  }

  function portrait(ctx,w,h,id) {
    ctx.save();
    ctx.translate(w*.5,h*.53);
    if(id==="manascourge"){
      ctx.translate(0,42);
      ctx.scale(1.62,1.62);
      scourge(ctx,13);
    }else{
      actor(ctx,10,0,h*.36,h/249,1);
      sickle(ctx,53,-69,-.65,1.2);
    }
    ctx.restore();
  }

  window.DarkSpells={onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn),portrait,drawScourge,harvestScene,drawHarvest};
})();
