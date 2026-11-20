(() => {
  const atlas = new Image();
  atlas.src = "./assets/drowzy-flowers.webp";
  const clamp = n => Math.min(1, Math.max(0, n));
  const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };
  const tau = Math.PI * 2;
  function sprite(ctx, frame, width, height) {
    if (!atlas.naturalWidth) return;
    ctx.drawImage(atlas, frame%4*256, Math.floor(frame/4)*256, 256, 256,
      -width/2, -height, width, height);
  }
  function field(ctx, progress, direction) {
    ctx.save();
    ctx.translate(500-direction*28,510);
    ctx.scale(direction,1);
    ctx.globalAlpha *= 1-smooth((progress-.86)/.14);
    for (const [x,y,size,delay] of [[-74,-15,102,.05],[75,-12,110,.09],[0,0,155,0]]) {
      const t=clamp((progress-delay)/(1-delay));
      const rise=smooth(t/.19);
      if (!rise) continue;
      const frame=t<.5 ? clamp(t/.5)*8 : 8+clamp((t-.5)/.46)*7;
      ctx.save();
      ctx.translate(x,y);
      ctx.fillStyle='rgba(29,48,45,.22)';
      ctx.beginPath();ctx.ellipse(0,-3,size*.44*rise,size*.075*rise,0,0,tau);ctx.fill();
      ctx.scale(.64+.36*rise,rise);
      const base=Math.floor(frame);
      sprite(ctx,base,size,size*.88);
      if(base<15){
        ctx.globalAlpha*=smooth(frame-base);
        sprite(ctx,base+1,size,size*.88);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  const palette=['#fff6ae','#e4da82','#d6eea5','#f0c4ff','#bba2ee'];
  function gust(ctx,progress,direction,target) {
    // Stepped drawings keep the particle flight in time with the bending flower frames.
    const p=Math.floor(progress*96)/96;
    if(p<.47 || p>=.99)return;
    const scale=.6+.3*clamp((target.y-288)/235);
    const destX=target.x, destY=target.y-145*scale;
    const startX=500-direction*28, startY=459;
    function point(t,lane,phase,spread) {
      const lift=Math.sin(Math.PI*t);
      const angle=t*tau*1.45+phase;
      return [startX+(destX-startX)*t+direction*(1-t)*lane+Math.cos(angle)*spread*lift,
        startY+(destY-startY)*t-47*lift+Math.sin(angle)*spread];
    }
    ctx.save();
    for(let i=0;i<4;i++){
      const head=clamp((p-.48-i*.021)/.29),tail=clamp((p-.55-i*.021)/.29);
      if(head<=tail)continue;
      ctx.beginPath();
      for(let j=0;j<=14;j++){
        const [x,y]=point(tail+(head-tail)*j/14,i*13-21,i*1.5,9);
        if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=i%2?'rgba(222,255,204,.48)':'rgba(233,215,255,.55)';
      ctx.lineWidth=1.8+i*.25;ctx.lineCap='round';ctx.stroke();
    }
    for(let i=0;i<82;i++){
      const phase=i*2.39996;
      const launch=.48+((i*37)%83)/83*.16;
      const t=(p-launch)/.29;
      if(t<0||t>1.38)continue;
      const drift=clamp((t-1)/.38);
      const [cx,cy]=point(Math.min(1,t),Math.sin(phase)*76,phase,5+i%13);
      const x=cx+Math.cos(phase)*(5+30*drift),y=cy+Math.sin(phase)*14-22*drift;
      const r=(1.2+i%4*.65)*(1+.25*Math.sin(t*8+phase));
      ctx.globalAlpha=clamp(t*10)*(1-drift);
      ctx.fillStyle=palette[i%5];ctx.beginPath();ctx.moveTo(x-r*1.5,y);
      ctx.lineTo(x,y-r);ctx.lineTo(x+r*1.5,y);ctx.lineTo(x,y+r);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fffbd7';ctx.beginPath();ctx.moveTo(x-r*1.5,y);
      ctx.lineTo(x,y-r);ctx.lineTo(x+r*.34,y);ctx.fill();
    }
    ctx.restore();
  }
  function letters(ctx,target,time){
    const scale=.6+.3*clamp((target.y-288)/235);
    const direction=target.team?-1:1;
    const phase=(time%1680)/1680;
    ctx.save();ctx.translate(target.x,target.y);
    ctx.scale(scale,scale);ctx.textAlign='center';ctx.lineJoin='round';
    for(let i=0;i<3;i++){
      const age=phase-i*.17;
      if(age<=0)continue;
      const pop=smooth(age/.095)*(1+.17*Math.sin(clamp(age/.19)*Math.PI));
      const x=direction*(27+i*14+phase*5), y=-150-i*22-phase*12;
      ctx.save();ctx.translate(x,y);ctx.rotate(direction*(-.13+i*.07));ctx.scale(pop,pop);
      ctx.globalAlpha*=1-smooth((phase-.80)/.20);
      ctx.font='bold '+(15+i*7)+'px Georgia, serif';
      ctx.strokeStyle='#463255';ctx.lineWidth=3;ctx.strokeText('Z',0,0);
      ctx.fillStyle=['#ede6ff','#e2ceff','#cfb2ff'][i];ctx.fillText('Z',0,0);ctx.restore();
    }
    ctx.restore();
  }
  window.DrowzyFlowers={
    field,gust,letters,
    onReady(fn){if(atlas.complete && atlas.naturalWidth)fn();else atlas.addEventListener('load',fn,{once:true});},
    portrait(ctx,w,h){
      const width=Math.min(w,h*1.65);
      ctx.save();ctx.translate(w/2,h*.99);sprite(ctx,10,width,width*.95);ctx.restore();
    }
  };
})();
