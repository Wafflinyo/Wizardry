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
    const height=Math.max(24,groundY-stoneY);
    const envelope=clamp((1-rise)*4);
    for(let lane=0;lane<7;lane++){
      const flow=(age/125+lane/7)%1;
      const tail=groundY-flow*height;
      const head=Math.max(stoneY+6,tail-24-flow*31);
      const side=(lane-3)*10;
      ctx.globalAlpha=alpha*Math.sin(flow*Math.PI)*envelope*.88;
      ctx.lineWidth=lane%2?2.4:4.2;
      ctx.beginPath();
      ctx.moveTo(x+side,tail);
      ctx.quadraticCurveTo(x+side+Math.sin(flow*6+lane)*24,tail-20,x+side*.39,head);
      ctx.stroke();
    }
    ctx.globalAlpha=alpha*envelope*.35;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.ellipse(x,groundY-2,19+rise*21,5+rise*5,0,Math.PI*.13,Math.PI*1.79);
    ctx.stroke();
    ctx.restore();
  }

  function clash(ctx,x,y,dir,age){
    const life=1-clamp(age/105);
    if(life<=0)return;
    const alpha=ctx.globalAlpha;
    const reach=27+(1-life)*24;
    ctx.save();
    ctx.globalAlpha=alpha*life;
    ctx.fillStyle="#f4fff2";
    ctx.beginPath();
    for(let i=0;i<16;i++){
      const angle=i*Math.PI/8;
      const radius=i%2?7:reach*(i%4===0?1:.57);
      const px=x+Math.cos(angle)*radius;
      const py=y+Math.sin(angle)*radius*.74;
      if(i===0)ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle="#ffda86";
    ctx.lineWidth=2.5;
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3+.32;
      const dx=Math.cos(angle)*dir,dy=Math.sin(angle);
      const distance=reach*.54+(1-life)*19;
      ctx.beginPath();
      ctx.moveTo(x+dx*distance,y+dy*distance);
      ctx.lineTo(x+dx*(distance+13*life),y+dy*(distance+13*life));
      ctx.stroke();
    }
    ctx.restore();
  }

  function flightWind(ctx,x,y,dx,dy,age){
    const length=Math.hypot(dx,dy)||1;
    const ux=dx/length,uy=dy/length;
    const alpha=ctx.globalAlpha;
    ctx.save();
    ctx.lineCap="round";
    for(let i=0;i<9;i++){
      const flow=(age/72+i*.37)%1;
      const rear=6+flow*65;
      const side=(i%2?1:-1)*(8+i%4*5)*(.6+flow*.6);
      const tx=x-ux*rear-uy*side,ty=y-uy*rear+ux*side;
      const trail=15+flow*47;
      ctx.globalAlpha=alpha*(.75-flow*.49);
      ctx.strokeStyle=i%3?"#d2f8ef":"#fbfff3";
      ctx.lineWidth=i%3?2:4;
      ctx.beginPath();
      ctx.moveTo(tx,ty);
      ctx.quadraticCurveTo(tx-ux*trail*.35-uy*side*.25,ty-uy*trail*.35+ux*side*.25,
        tx-ux*trail,ty-uy*trail);
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
      const launchAge=elapsed-entry.swingAt;
      flightWind(ctx,px,py,entry.x-contactX,
        entry.y-67-contactY-Math.PI*23*Math.cos(Math.PI*flight),launchAge);
      clash(ctx,contactX,contactY,dir,launchAge);
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
