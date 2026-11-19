(() => {
  const atlas = new Image();
  atlas.src = "./assets/sirens-melody.webp";
  const cell = 256;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;

  const featheredFrames = [];

  function sprite(ctx, frame, x, floor, size) {
    if (!atlas.naturalWidth) return;
    if (!featheredFrames[frame]) {
      const tile = document.createElement("canvas");
      tile.width = tile.height = cell;
      const mask = tile.getContext("2d");
      mask.drawImage(atlas,(frame%4)*cell,Math.floor(frame/4)*cell,cell,cell,0,0,cell,cell);
      mask.globalCompositeOperation = "destination-in";
      for (const [dx,dy,fade] of [[cell,0,.10],[0,cell,.07]]) {
        const gradient = mask.createLinearGradient(0,0,dx,dy);
        gradient.addColorStop(0,"transparent");
        gradient.addColorStop(fade,"white");
        gradient.addColorStop(1-fade,"white");
        gradient.addColorStop(1,"transparent");
        mask.fillStyle = gradient;
        mask.fillRect(0,0,cell,cell);
      }
      featheredFrames[frame] = tile;
    }
    ctx.drawImage(featheredFrames[frame],x-size/2,floor-size*.88,size,size);
  }

  function driftingMist(ctx,p,x,floor) {
    ctx.save();
    for (let i=0;i<5;i++) {
      const age = (p-i*.045)/.78;
      if (age<=0||age>=1) continue;
      const dx = x+(i-2)*(25+age*27)+Math.sin(age*4+i)*15;
      const dy = floor-27-age*(100+i*8);
      const radius = 35+age*38;
      const plume = ctx.createRadialGradient(dx,dy,0,dx,dy,radius);
      plume.addColorStop(0,"#b4f5f3");
      plume.addColorStop(.45,"#97e9ec80");
      plume.addColorStop(1,"#97e9ec00");
      ctx.globalAlpha = Math.sin(age*Math.PI)*.20;
      ctx.fillStyle = plume;
      ctx.fillRect(dx-radius,dy-radius,radius*2,radius*2);
    }
    ctx.restore();
  }

  window.SirensMelody = {
    onReady(fn) {
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h) {
      const size=Math.min(w,h);
      sprite(ctx,9,w/2,(h-size)/2+size*.88,size);
    },
    draw(ctx,p,caster,allies,hit) {
      const x=500, floor=500, facing=caster.x<500?1:-1;
      driftingMist(ctx,p,x,floor);
      ctx.save();
      ctx.translate(x,floor);
      ctx.scale(facing,1);
      sprite(ctx,Math.min(15,Math.floor(p*16)),0,0,264);
      ctx.restore();
      for(const ally of allies){
        for(let i=0;i<3;i++){
          const q=clamp((p-hit+.21-i*.032)/.21);
          if(q<=0||q>=1)continue;
          const dx=mix(x,ally.x,q),dy=mix(floor-142,ally.y-84,q)-Math.sin(q*Math.PI)*(29+i*13);
          ctx.save();
          ctx.translate(dx,dy);
          ctx.globalAlpha=Math.sin(q*Math.PI)*.84;
          ctx.strokeStyle=i%2?"#9bfff4":"#d8fffc";
          ctx.lineWidth=2;
          ctx.beginPath();ctx.ellipse(0,0,5+q*8,12+q*20,0,0,Math.PI*2);ctx.stroke();
          ctx.restore();
        }
        const pulse=clamp((p-hit)/.2);
        if(pulse<=0||pulse>=1)continue;
        ctx.save();
        ctx.globalAlpha=(1-pulse)*.72;
        ctx.strokeStyle="#9bfff4";
        ctx.lineWidth=3;
        ctx.beginPath();ctx.ellipse(ally.x,ally.y-8-pulse*79,24+pulse*13,8,0,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
    },
  };
})();
