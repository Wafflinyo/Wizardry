(() => {
  const atlas = new Image();
  atlas.src = "./assets/sticks-and-stones.webp";
  const tile = 256;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;

  function sprite(ctx,frame,x,y,size,dir=1,anchor=.5){
    if(!atlas.naturalWidth)return;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(dir,1);
    ctx.drawImage(atlas,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,
      -size/2,-size*anchor,size,size);
    ctx.restore();
  }

  function actor(ctx,{x,y,dir,elapsed,duration,entries}){
    const approach=clamp(elapsed/820);
    const jump=clamp((elapsed-820)/690);
    const leaving=clamp((elapsed-duration+490)/450);
    const slide=(1-approach)**2;
    ctx.save();
    ctx.globalAlpha*=clamp(elapsed/220)*clamp((duration-elapsed)/360);
    if(elapsed<1680){
      const cloudX=x-dir*(40+210*slide)-dir*155*clamp((elapsed-1000)/680);
      const cloudY=y-26+Math.sin(elapsed*.006)*5;
      ctx.save();
      ctx.globalAlpha*=clamp((1680-elapsed)/440);
      sprite(ctx,16,cloudX,cloudY,160,dir);
      ctx.restore();
    }
    let frame=0, px=x-dir*(40*(1-jump)+210*slide), py=y-49*(1-jump)-Math.sin(jump*Math.PI)*53;
    if(elapsed<820)frame=Math.min(2,Math.floor(elapsed/260));
    else if(elapsed<1510)frame=jump<.35?3:jump<.87?4:5;
    else if(elapsed<2070)frame=6+Number(elapsed>=1720);
    else {
      frame=8;
      const swing=entries.find(entry=>elapsed>=entry.swingAt-76&&elapsed<entry.swingAt+94);
      if(swing){
        const age=elapsed-swing.swingAt;
        frame=age<-36?8:age<0?9:age<23?10:age<47?11:age<71?12:13;
      }else if(leaving>0)frame=15;
    }
    sprite(ctx,frame,px-dir*38*leaving,py,245,dir,.88);
    ctx.restore();
  }

  function updraft(ctx,x,groundY,stoneY,age,rise){
    const alpha=ctx.globalAlpha;
    ctx.save();
    ctx.strokeStyle="#d1f3ed";
    ctx.lineCap="round";
    for(let lane=0;lane<4;lane++){
      const flow=(age/160+lane*.25)%1;
      const height=Math.max(18,groundY-stoneY);
      const tail=groundY-flow*height;
      const head=Math.max(stoneY+7,tail-21-flow*19);
      const side=(lane-1.5)*13;
      ctx.globalAlpha=alpha*Math.sin(flow*Math.PI)*clamp((1-rise)*3)*.78;
      ctx.lineWidth=lane%2?2:3;
      ctx.beginPath();
      ctx.moveTo(x+side,tail);
      ctx.quadraticCurveTo(x+side+14,tail-14,x+side*.58,head);
      ctx.stroke();
    }
    ctx.restore();
  }

  function stone(ctx,{x,y,dir,elapsed,entries,entry,index}){
    const liftAt=1720+(entries.length-1-index)*82;
    if(elapsed<liftAt||elapsed>entry.hitAt+415)return;
    const contactX=x+dir*94, contactY=y-106;
    const age=elapsed-entry.hitAt;
    if(age>=0){
      const expand=clamp(age/415);
      ctx.save();
      ctx.globalAlpha*=1-expand;
      sprite(ctx,19,entry.x,entry.y-67,72+81*expand,dir);
      ctx.restore();
      return;
    }
    let px,py;
    if(elapsed<entry.swingAt){
      const lift=clamp((elapsed-liftAt)/300);
      const swingInterval=entries.length>1?entries[1].swingAt-entries[0].swingAt:175;
      const fallTime=185;
      const dropSpeed=62/swingInterval;
      const dropAt=entries[0].swingAt-fallTime;
      const peak=contactY-dropSpeed*(entry.swingAt-dropAt);
      px=contactX;
      py=mix(y-17,peak,lift*lift*(3-2*lift));
      if(lift<1)updraft(ctx,px,y,py,elapsed-liftAt,lift);
      py+=dropSpeed*Math.max(0,elapsed-dropAt);
    }else{
      const flight=clamp((elapsed-entry.swingAt)/(entry.hitAt-entry.swingAt));
      px=mix(contactX,entry.x,flight);
      py=mix(contactY,entry.y-67,flight)-Math.sin(Math.PI*flight)*23;
      ctx.save();
      ctx.globalAlpha*=.43*(1-flight*.4);
      ctx.strokeStyle="#d4eee8";
      ctx.lineWidth=6;
      ctx.lineCap="round";
      ctx.beginPath();
      ctx.moveTo(px-dir*(17+38*flight),py+4);
      ctx.lineTo(px-dir*8,py);
      ctx.stroke();
      ctx.restore();
    }
    sprite(ctx,17+Math.floor(elapsed/92)%2,px,py,46,dir);
  }

  window.SticksAndStones={
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h){
      const size=Math.min(w,h);
      sprite(ctx,16,w*.46,h*.79,size*.85);
      sprite(ctx,7,w*.46,h*.77,size*.87,1,.88);
      sprite(ctx,17,w*.76,h*.38,size*.22);
    },
    actor,stone
  };
})();
