(() => {
  "use strict";

  const clamp = p => Math.min(1, Math.max(0, p));
  const palette = ["#241532", "#563776", "#a875cf", "#efd2ff"];
  const link = [[-15,-3],[-8,-9],[8,-9],[15,-3],[15,3],[8,9],[-8,9],[-15,3]];

  function facet(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function chainLink(ctx, x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    for (let i = 0; i < link.length; i++) {
      const a = link[i], b = link[(i + 1) % link.length];
      facet(ctx, [a,b,[b[0]*.65,b[1]*.48],[a[0]*.65,a[1]*.48]], palette[i<2?2:i<5?1:0]);
    }
    facet(ctx, [[-8,-9],[8,-9],[4,-7],[-7,-6]], palette[3]);
    ctx.restore();
  }

  // Two spirals wrap in world depth so the rune reads as a chain around the wizard.
  function bind(ctx, unit, progress, time, front) {
    const forming = progress !== null;
    const p = forming ? clamp(progress) : 1;
    const frame = Math.floor((forming ? p * 30 : time * 13));
    const turn = forming ? frame * .15 : frame * .055;
    const count = Math.floor(clamp((p + .06) / .66) * 20);
    const flare = forming ? clamp(1 - Math.abs(p - .66) * 5) : 0;
    ctx.save();
    ctx.globalAlpha *= forming ? .84*clamp(p/.13) : .44;
    for (let i = 0; i < count; i++) {
      const angle = turn + i * .62;
      const z = Math.sin(angle);
      if ((z >= 0) !== front) continue;
      const radius = 51 + (1-p)*23 + flare*10;
      const x = unit.x + Math.cos(angle)*radius;
      const y = unit.y - 18 - i*5.5 + z*17;
      chainLink(ctx,x,y,Math.atan2(-5.5+Math.cos(angle)*10,-Math.sin(angle)*radius*.62),.74+z*.18);
    }
    ctx.restore();
  }

  function rebound(ctx, from, to, age) {
    if (age >= .85) return;
    const frame = Math.floor(age*28);
    const p = frame/28;
    const dx=to.x-from.x, dy=to.y-from.y;
    const length=Math.hypot(dx,dy)||1;
    const nx=-dy/length, ny=dx/length;
    const reach=clamp((p+.04)/.22);
    const alpha=clamp((.85-p)/.52);
    ctx.save();
    ctx.globalAlpha *= alpha;
    const nodes = 18;
    const count = Math.floor(reach*nodes);
    for (let i = 0; i <= count; i++) {
      const t=i/nodes;
      const offset=Math.sin(t*Math.PI)*Math.sin(i*.82-frame*.55)*29;
      const x=from.x+dx*t+nx*offset;
      const y=from.y+dy*t+ny*offset;
      chainLink(ctx,x,y,Math.atan2(dy,dx)+(i%2?.42:-.42),.59+(1-t)*.34);
    }
    if(reach===1){
      const burst=clamp((p-.18)/.64);
      for(let i=0;i<12;i++){
        const angle=i*2.39996;
        const x=Math.cos(angle),y=Math.sin(angle);
        const radius=9+burst*(22+i%4*12);
        const px=to.x+x*radius,py=to.y+y*radius;
        facet(ctx,[[px-y*3,py+x*3],[px+x*12,py+y*12],[px+y*3,py-x*3]],palette[1+i%3]);
      }
    }
    ctx.restore();
  }

  function portrait(ctx,width,height) {
    const scale=Math.min(width/170,height/170);
    ctx.save();
    ctx.translate(width/2,height*.92);
    ctx.scale(scale,scale);
    facet(ctx,[[0,-135],[28,-105],[20,-53],[0,-37],[-20,-53],[-28,-105]],palette[1]);
    facet(ctx,[[0,-135],[28,-105],[0,-90],[-28,-105]],palette[2]);
    facet(ctx,[[0,-90],[20,-53],[0,-37],[-20,-53]],palette[0]);
    bind(ctx,{x:0,y:0},.81,0,false);
    bind(ctx,{x:0,y:0},.81,0,true);
    ctx.restore();
  }

  window.CursedHold = {bind,rebound,portrait};
})();
