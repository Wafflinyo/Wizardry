(() => {
  "use strict";

  const clamp = t => Math.min(1, Math.max(0, t));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  const hit = .78;
  const size = 192;
  const atlas = new Image();
  const listeners=[];
  const ready=()=>atlas.complete&&atlas.naturalWidth>0;
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src="./assets/thorny-hug-frames.webp?v=0.299.1";

  function poly(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for(const point of points.slice(1))ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle=color;
    ctx.fill();
  }

  function pose(target, progress, team) {
    const dir=team===0?1:-1;
    const run=clamp((progress-.48)/(.72-.48));
    const travel=1-(1-run)**1.32;
    const reach=smooth((progress-.72)/(hit-.72));
    const x=mix(500-dir*36,target.x-dir*(56-26*reach),travel);
    const y=mix(510,target.y,travel);
    return {x,y,dir,run,progress};
  }

  function artFrame(ctx,frame,x,y,w,h){
    ctx.drawImage(atlas,frame%4*size,Math.floor(frame/4)*size,size,size,x,y,w,h);
  }

  function draw(ctx,{x,y,dir,run,progress:p}) {
    if(!ready())return;
    const growth=smooth(p/.22);
    const fade=1-smooth((p-.92)/.08);
    const frame=p<.085?0:p<.155?1:p<.22?2:p<.345?3:p<.394?4:p<.44?5:
      p<.48?6:p<.72?7+Math.floor(run*15)%5:p<hit?12:p<.82?13:p<.9?14:15;
    const scale=.87+.10*clamp((y-400)/200);
    ctx.save();
    ctx.translate(x,y);
    ctx.globalAlpha*=fade;
    ctx.fillStyle="#14241961";
    ctx.beginPath();ctx.ellipse(0,1,17+growth*28,5+growth*5,0,0,Math.PI*2);ctx.fill();
    if(p<.23){
      ctx.save();ctx.globalAlpha*=Math.sin(Math.PI*growth);
      for(let i=0;i<9;i++){
        const side=i%2?1:-1, dx=side*(7+growth*(17+i*3)),dy=-Math.sin(growth*Math.PI)*(6+i*5);
        poly(ctx,[[dx-5,dy],[dx+1,dy-7],[dx+6,dy+1],[dx,dy+4]],i%2?"#a87d55":"#d4ac78");
      }
      ctx.restore();
    }
    ctx.scale(dir*scale,scale);
    artFrame(ctx,frame,-96,-174,size,size);
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
    if(!ready())return;
    const scale=Math.min(w/150,h/152);
    artFrame(ctx,6,w/2-96*scale,h/2-99*scale,size*scale,size*scale);
  }

  function onReady(fn){
    if(ready())fn();
    else listeners.push(fn);
  }
  window.ThornyHug={pose,draw,burst,portrait,onReady};
})();
