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
    for (const [x,y,size,delay] of [[-101,-19,142,.05],[104,-16,152,.09],[0,0,217,0]]) {
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
    if(p<.43 || p>=.99)return;
    const scale=.6+.3*clamp((target.y-288)/235);
    const destX=target.x, destY=target.y-145*scale;
    const startX=500-direction*28, startY=418;
    function point(t,lane,phase,spread) {
      // Negative time extends the same flight path through the upwind edge of the field.
      const lift=Math.sin(Math.PI*clamp(t));
      const angle=t*tau*1.45+phase;
      return [startX+(destX-startX)*clamp(t)+direction*(Math.min(0,t)*260+(1-clamp(t))*lane)+Math.cos(angle)*spread*lift,
        startY+(destY-startY)*clamp(t)-47*lift+Math.sin(angle)*spread];
    }
    ctx.save();
    // Broad translucent ribbons sit behind narrow crests and the airborne pollen.
    for(let i=0;i<5;i++){
      const passage=(p-.48-i*.018)/.29;
      const front=Math.min(.995,passage), back=Math.max(-.49,passage-.44);
      if(front<=back)continue;
      const fade=smooth((p-.43)/.055)*(1-smooth((p-.82)/.14));
      const center=[];
      for(let j=0;j<=18;j++){
        const t=j/18;
        const [x,y]=point(back+(front-back)*t,i*19-39,i*1.28,10+i*2);
        center.push({x,y,width:Math.sin(Math.PI*t)**.72*(i===2?15:9)});
      }
      const first=center[0], last=center.at(-1);
      const gradient=ctx.createLinearGradient(first.x,first.y,last.x,last.y);
      gradient.addColorStop(0,'rgba(137,218,225,0)');
      gradient.addColorStop(.48,i%2?'rgba(150,231,224,.39)':'rgba(178,234,253,.49)');
      gradient.addColorStop(.82,'rgba(232,255,251,.76)');
      gradient.addColorStop(1,'rgba(245,255,255,.14)');
      ctx.globalAlpha=fade;
      ctx.fillStyle=gradient;
      ctx.beginPath();
      ctx.moveTo(first.x,first.y);
      for(const {x,y,width} of center)ctx.lineTo(x,y-width);
      for(const {x,y,width} of [...center].reverse())ctx.lineTo(x,y+width*.52);
      ctx.closePath();ctx.fill();

      ctx.beginPath();
      ctx.moveTo(first.x,first.y);
      for(const {x,y,width} of center)ctx.lineTo(x,y-width*.73);
      ctx.strokeStyle=gradient;ctx.lineWidth=i===2?3.5:2;
      ctx.lineCap='round';ctx.stroke();
    }
    for(let i=0;i<102;i++){
      const phase=i*2.39996;
      const launch=.48+((i*37)%103)/103*.16;
      const t=(p-launch)/.29;
      if(t<0||t>1.38)continue;
      const drift=clamp((t-1)/.38);
      const [cx,cy]=point(Math.min(1,t),Math.sin(phase)*76,phase,5+i%13);
      const x=cx+Math.cos(phase)*(5+30*drift),y=cy+Math.sin(phase)*14-22*drift;
      const r=(1.6+i%4*.72)*(1+.25*Math.sin(t*8+phase));
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
