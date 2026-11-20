(() => {
  const atlas = new Image();
  atlas.src = "./assets/perfect-defense-dome.webp";
  const cell = 192;
  const width = 206;
  const height = 249;
  const top = -height+8;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => {const t=clamp(n);return t*t*(3-2*t);};
  const scaleFor = target => .60+.30*clamp((target.y-288)/235);
  const sand = ["#a86a27","#c68531","#daa349","#eec16d","#ffdb8b"];
  const finalFrame = 12;

  function polygon(ctx,points){
    for(const [i,[x,y]] of points.entries()){
      if(i===0)ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.closePath();
  }

  function sprite(ctx,frame,x,y,w,h){
    ctx.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,x,y,w,h);
  }

  function shell(ctx,frame,eyeX,eyeY,layer){
    const slit=[
      [eyeX-34,eyeY-4],[eyeX-9,eyeY-9],[eyeX+29,eyeY-8],[eyeX+44,eyeY-3],
      [eyeX+40,eyeY+8],[eyeX-13,eyeY+9],[eyeX-34,eyeY+5]
    ];
    const hasSlit=frame>=9;
    ctx.save();
    if(layer==="back"){
      if(hasSlit){
        ctx.beginPath();
        polygon(ctx,slit);
        ctx.fillStyle="#4b2a14";
        ctx.fill();
      }
    }else{
      if(hasSlit){
        ctx.beginPath();
        ctx.rect(-width/2,top,width,height);
        polygon(ctx,slit);
        ctx.clip("evenodd");
      }
      sprite(ctx,frame,-width/2,top,width,height);
      if(hasSlit){
        ctx.beginPath();
        polygon(ctx,slit);
        ctx.lineWidth=3.6;
        ctx.strokeStyle="#6d411f";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function flowingGrains(ctx,time,growth,eyeY){
    const strength=growth<1?.72:.38;
    const lift=249*growth;
    for(let i=0;i<35;i++){
      const t=(time*(.00055+i%4*.00012)+i*.173)%1;
      const band=i%3;
      const x=lerp(-92+band*8,86-band*5,t);
      const y=-Math.min(lift-6,28+band*47+t*54)+Math.sin(t*Math.PI+i)*4;
      if(y>-8||Math.abs(y-eyeY)<14)continue;
      const size=1.1+i%4*.63;
      ctx.globalAlpha=strength*Math.sin(t*Math.PI);
      ctx.fillStyle=sand[(i+2)%sand.length];
      ctx.beginPath();
      polygon(ctx,[[x-size*2.8,y+size],[x+size,y-size],[x+size*1.4,y],[x,y+size]]);
      ctx.fill();
    }
  }

  function dome(ctx,target,growth,layer,time=0){
    if(growth<=0||!atlas.naturalWidth)return;
    const cycle=[12,13,14,15,14,13];
    const frame=growth>=1?cycle[Math.floor(time/155)%cycle.length]:
      Math.min(finalFrame,Math.floor(growth*(finalFrame+1)));
    const scale=scaleFor(target),side=target.team?-1:1;
    const isWood=target.dummy&&!target.wizardDummy;
    const spriteWizard=target.hat==="pointed"&&target.robe==="classic";
    ctx.save();
    ctx.translate(target.x,target.y);
    ctx.scale(side*scale,scale);
    const eyeY=isWood?-174:spriteWizard?-123:-140;
    shell(ctx,frame,isWood?0:spriteWizard?17:14,eyeY,layer);
    if(layer==="front")flowingGrains(ctx,time,growth,eyeY);
    ctx.restore();
  }

  function travel(ctx,target,progress){
    if(progress<=0||progress>=.75)return;
    // Stop at the Kinetic Sand landing, before its attack-specific fist.
    const phase=.665*clamp(progress/.61);
    const opacity=1-ease((progress-.54)/.21);
    window.WIZARDRY_KINETIC_SAND_V112?.draw(ctx,{progress:phase,target,opacity});
  }

  function shatter(ctx,target,{age,popped}){
    const t=age/.62;
    if(t>=1||!atlas.naturalWidth)return;
    const scale=scaleFor(target);
    ctx.save();ctx.translate(target.x,target.y);ctx.scale(scale,scale);
    const count=popped?34:12;
    for(let i=0;i<count;i++){
      const angle=i*2.39996;
      const radius=(popped?83:32)*t;
      const x=Math.cos(angle)*(65+radius);
      const y=-119+Math.sin(angle)*(75+radius*.5)+94*t*t;
      const size=(popped?5:2)+i%6;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle+t*(i%2?6:-6));
      ctx.globalAlpha*=(1-t)**1.35;
      ctx.beginPath();
      polygon(ctx,[[-size,-size*.3],[-size*.3,-size],[size*.86,-size*.52],[size,size*.67],[-size*.4,size]]);
      ctx.clip();
      ctx.fillStyle=sand[i%sand.length];
      ctx.fillRect(-size,-size,size*2,size*2);
      const sourceX=62+i%6*12;
      ctx.drawImage(atlas,sourceX,Math.floor(finalFrame/4)*cell+95+i%5*9,25,23,-size,-size,size*2,size*2);
      ctx.restore();
    }
    ctx.restore();
  }

  window.PerfectDefense={dome,travel,shatter,onReady(fn){
    if(atlas.naturalWidth)fn();
    else atlas.addEventListener("load",fn,{once:true});
  },portrait(ctx,w,h){
    if(!atlas.naturalWidth)return;
    const scale=Math.min(w/210,h/252);
    ctx.save();ctx.translate(w/2,h*.96);ctx.scale(scale,scale);
    shell(ctx,finalFrame,14,-138,"back");
    shell(ctx,finalFrame,14,-138,"front");
    ctx.restore();
  }};
})();
