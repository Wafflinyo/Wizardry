(() => {
  "use strict";

  const clamp = t => Math.min(1, Math.max(0, t));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = t => { t=clamp(t); return t*t*(3-2*t); };
  const hit = .78;
  const stride = [
    [[-4,-38],[-18,-21],[-27,-3],[11,-38],[27,-21],[34,-7]],
    [[-4,-38],[-19,-18],[-32,-11],[11,-38],[22,-17],[24,0]],
    [[-4,-38],[-14,-19],[-25,-20],[11,-38],[13,-18],[12,0]],
    [[-4,-38],[2,-23],[-9,-24],[11,-38],[3,-18],[-2,0]],
    [[-4,-38],[12,-24],[18,-19],[11,-38],[-8,-17],[-16,0]],
    [[-4,-38],[18,-23],[25,-10],[11,-38],[-15,-17],[-28,-3]]
  ];
  const ribs = ["#264a2c","#347444","#499955","#69b75d","#a0d574"];

  function poly(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function stem(ctx,a,b,r,light) {
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    if(len<1)return;
    ctx.save();
    ctx.translate(...a);
    ctx.rotate(Math.atan2(dy,dx));
    poly(ctx,[[-r*.44,-r*.61],[r*.25,-r],[len-r*.28,-r],[len+r*.38,-r*.45],[len+r*.46,r*.38],[len,r*.8],[r*.15,r*.9],[-r*.45,r*.42]],light?ribs[2]:ribs[1]);
    poly(ctx,[[r*.25,-r],[len-r*.28,-r],[len+r*.38,-r*.45],[len,-r*.22],[r*.05,-r*.30]],light?ribs[4]:ribs[2]);
    poly(ctx,[[-r*.45,r*.42],[r*.15,r*.9],[len,r*.8],[len+r*.46,r*.38],[len*.55,r*.24]],ribs[0]);
    if(len>15)poly(ctx,[[len*.48,-r*.8],[len*.68,-r*.83],[len*.47,-r-6]],"#ece1aa");
    ctx.restore();
  }

  function limb(ctx,points,r,front) {
    stem(ctx,points[0],points[1],r,front);
    stem(ctx,points[1],points[2],r*.88,front);
  }

  function torso(ctx,smile) {
    poly(ctx,[[-24,-28],[-31,-54],[-30,-117],[-19,-139],[4,-148],[23,-138],[33,-121],[35,-65],[25,-36],[11,-26]],ribs[1]);
    poly(ctx,[[-30,-117],[-19,-139],[4,-148],[-4,-124],[-11,-84],[-8,-31],[-24,-28],[-31,-54]],ribs[2]);
    poly(ctx,[[-19,-139],[4,-148],[23,-138],[11,-125],[-4,-124]],ribs[4]);
    poly(ctx,[[4,-148],[23,-138],[33,-121],[35,-65],[25,-36],[11,-26],[17,-67],[14,-122]],ribs[0]);
    poly(ctx,[[-4,-124],[14,-122],[17,-67],[11,-26],[-8,-31],[-11,-84]],ribs[3]);
    for(const [x,y,dir] of [[-27,-111,-1],[25,-118,1],[-25,-77,-1],[27,-79,1],[-18,-48,-1],[22,-49,1],[-16,-128,-1]]){
      poly(ctx,[[x-2,y+2],[x+dir*9,y-8],[x+4,y+4]],"#e9dfad");
    }
    if(smile>0){
      ctx.save();
      ctx.globalAlpha*=smile;
      for(const [x,y] of [[-11,-107],[16,-106]]){
        poly(ctx,[[x-5,y],[x-3,y-6],[x+2,y-6],[x+5,y-2],[x+4,y+5],[x-3,y+5]],"#142c23");
        poly(ctx,[[x-2,y-4],[x+1,y-4],[x+1,y-1],[x-2,y-1]],"#fff5df");
      }
      poly(ctx,[[-8,-93],[2,-90],[15,-94],[11,-83],[3,-79],[-5,-84]],"#182d26");
      poly(ctx,[[-2,-84],[5,-87],[10,-84],[3,-81]],"#f48782");
      poly(ctx,[[-21,-93],[-13,-94],[-13,-89],[-19,-88]],"#f4a68a");
      poly(ctx,[[21,-91],[28,-92],[27,-87],[21,-87]],"#f4a68a");
      ctx.restore();
    }
  }

  function pose(target, progress, team) {
    const dir=team===0?1:-1;
    const run=clamp((progress-.44)/(hit-.44));
    const travel=run*run*(3-2*run);
    const x=mix(500-dir*36,target.x-dir*24,travel);
    const y=mix(510,target.y,travel);
    return {x,y,dir,run,progress,target};
  }

  function draw(ctx,{x,y,dir,run,progress:p}) {
    const growth=ease(p/.24),split=ease((p-.30)/.14);
    const squeeze=ease((p-.70)/(hit-.70))*(1-ease((p-.86)/.12));
    const fade=1-ease((p-.89)/.11);
    const running=run>0&&run<1;
    const f=Math.floor(run*24)%12;
    const lengths=stride[f%6], phase=f<6?1:-1;
    const bob=running?Math.sin((f%6)*Math.PI/6)*6:0;
    const gait=running?1-squeeze:0;
    ctx.save();
    ctx.translate(x,y);
    ctx.globalAlpha*=fade;
    ctx.fillStyle="#14332660";
    ctx.beginPath();ctx.ellipse(0,0,29+growth*17,8,0,0,Math.PI*2);ctx.fill();
    ctx.scale(dir*.84,.84);
    if(p<.27)for(let i=0;i<8;i++){
      const side=i%2?1:-1, spread=6+growth*(12+i*3), h=Math.sin(growth*Math.PI)*(6+i*4);
      poly(ctx,[[side*spread-4,-h],[side*spread+1,-h-7],[side*spread+6,-h+1],[side*spread,-h+3]],i%2?"#977047":"#c49660");
    }
    ctx.scale(.55+.45*growth,.03+.97*growth);
    ctx.translate(0,26*(1-split)-bob);
    for(const front of [false,true]){
      const leg=front?1:0,offset=(phase>0?leg:1-leg)*3, rest=front?13:-14;
      const points=lengths.slice(offset,offset+3).map(([lx,ly],i)=>[mix(rest,lx,gait),mix([-38,-19,0][i],ly,gait)]);
      if(split>.01){
        ctx.save();ctx.globalAlpha*=split;limb(ctx,points,front?10:9,front);ctx.restore();
      }
      const swing=(front?1:-1)*Math.sin(f*Math.PI/6)*23*gait;
      const shoulder=[front?-19:19,front?-74:-78];
      const elbow=[mix(front?-40:38,front?-6:45,split)+swing+squeeze*15,-74+squeeze*(front?12:-13)];
      const hand=[mix(front?-42:41,front?-12:50,split)+swing+squeeze*(front?104:42),mix(-108,-64,split)+squeeze*(front?-2:-21)];
      if(front)torso(ctx,ease((p-.23)/.08));
      limb(ctx,[shoulder,elbow,hand],front?10:9,front);
    }
    ctx.restore();
  }

  function burst(ctx,target,p) {
    if(p<hit||p>hit+.16)return;
    const q=(p-hit)/.16;
    ctx.save();ctx.translate(target.x,target.y-63);
    ctx.globalAlpha*=1-q;
    for(let i=0;i<10;i++){
      const angle=i*Math.PI*.2, r=12+q*(42+i%4*9);
      ctx.save();ctx.rotate(angle);
      poly(ctx,[[r,-3],[r+12,0],[r,4]],i%2?"#d8ed9c":"#f7e6b0");ctx.restore();
    }
    ctx.restore();
  }

  function portrait(ctx,w,h){
    ctx.save();ctx.translate(w*.52,h*.93);
    ctx.scale(Math.min(w/125,h/150),Math.min(w/125,h/150));
    limb(ctx,[[10,-75],[42,-78],[51,-104]],11,false);
    torso(ctx,1);
    limb(ctx,[[-15,-70],[-42,-71],[-46,-101]],11,true);
    ctx.restore();
  }

  window.ThornyHug={pose,draw,burst,portrait};
})();
