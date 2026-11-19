(() => {
  const atlas = new Image();
  atlas.src = "./assets/quick-sand.webp";
  const cell = 256;

  function sprite(ctx,x,y,width,height,frame) {
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,(frame%4)*cell,Math.floor(frame/4)*cell,cell,cell,
      x-width/2,y-height/2,width,height);
  }

  window.QuickSand = {
    onReady(fn) {
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h) {
      const width=Math.min(w,h*1.55);
      sprite(ctx,w/2,h/2,width,width*.65,7);
    },
    draw(ctx,x,y,scale,time,opacity) {
      ctx.save();
      ctx.globalAlpha*=opacity;
      const lastFrame = 15;
      const phase = Math.floor(time/80)%(lastFrame*2);
      const frame = lastFrame-Math.abs(lastFrame-phase);
      sprite(ctx,x,y,198*scale,108*scale,frame);
      for(let i=0;i<18;i++){
        const age=(time/1240+i*.618)%1;
        const angle=i*2.4+age*5.4;
        const radius=(74-age*54)*scale;
        const px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius*.32;
        const size=(1.4+i%3*.65)*scale;
        ctx.fillStyle=i%2?"#efc68d":"#9a5e34";
        ctx.beginPath();
        ctx.moveTo(px-size,py);
        ctx.lineTo(px+size,py-size*.55);
        ctx.lineTo(px+size*.45,py+size*.55);
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
    },
  };
})();
