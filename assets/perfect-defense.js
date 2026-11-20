(() => {
  const atlas = new Image();
  atlas.src = "./assets/perfect-defense-dome.webp";
  const currentAtlas = new Image();
  currentAtlas.src = "./assets/perfect-defense-current.webp";
  const cell = 192;
  const currentRowHeight = 72;
  const domeCycle = [12,13,14,15,14,13];
  const width = 224;
  const height = 257;
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

  function shiftingShell(ctx,frame,time){
    const phase=time/850;
    const step=time/165;
    const next=domeCycle[(Math.floor(step)+1)%domeCycle.length];
    const strips=24;
    for(let i=0;i<strips;i++){
      const t=(i+.5)/strips;
      const drift=Math.sin(t*Math.PI)*(
        Math.sin(phase*2*Math.PI-t*9)*4.5+Math.sin(phase*4.36-t*16)*2);
      const sy=i*cell/strips;
      const y=top+i*height/strips;
      const x=-width/2+drift;
      const sh=cell/strips,dh=height/strips+.12;
      ctx.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell+sy,cell,sh,x,y,width,dh);
      ctx.save();
      ctx.globalAlpha*=ease(step%1)*.85;
      ctx.drawImage(atlas,next%4*cell,Math.floor(next/4)*cell+sy,cell,sh,x,y,width,dh);
      ctx.restore();
    }
  }

  function shell(ctx,frame,eyeX,eyeY,layer,growth=1,time){
    const slit=[
      [eyeX-34,eyeY-4],[eyeX-9,eyeY-9],[eyeX+29,eyeY-8],[eyeX+44,eyeY-3],
      [eyeX+40,eyeY+8],[eyeX-13,eyeY+9],[eyeX-34,eyeY+5]
    ];
    const rim=8-height*ease(growth);
    const hasSlit=frame>=9&&rim<=eyeY-10;
    ctx.save();
    if(layer==="back"){
      if(hasSlit){
        ctx.beginPath();
        polygon(ctx,slit);
        ctx.fillStyle="#4b2a14";
        ctx.fill();
      }
    }else{
      ctx.beginPath();
      ctx.rect(-width/2,rim,width,height);
      ctx.clip();
      if(hasSlit){
        ctx.beginPath();
        ctx.rect(-width/2,top,width,height);
        polygon(ctx,slit);
        ctx.clip("evenodd");
      }
      if(growth>=1&&time!==undefined)shiftingShell(ctx,frame,time);
      else sprite(ctx,frame,-width/2,top,width,height);
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
    const lift=height*ease(growth);
    for(let i=0;i<35;i++){
      const t=(time*(.00055+i%4*.00012)+i*.173)%1;
      const band=i%3;
      const x=-92+band*8+(178-band*13)*t;
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
    const frame=growth>=1?domeCycle[Math.floor(time/165)%domeCycle.length]:
      Math.min(finalFrame,Math.floor(growth*(finalFrame+1)));
    const scale=scaleFor(target),side=target.team?-1:1;
    const isWood=target.dummy&&!target.wizardDummy;
    const spriteWizard=target.hat==="pointed"&&target.robe==="classic";
    ctx.save();
    ctx.translate(target.x,target.y);
    ctx.scale(side*scale,scale);
    const eyeY=isWood?-174:spriteWizard?-123:-140;
    shell(ctx,frame,isWood?0:spriteWizard?17:14,eyeY,layer,growth,time);
    if(layer==="front")flowingGrains(ctx,time,growth,eyeY);
    ctx.restore();
  }

  function currentFrame(ctx,index,x,y,w,h){
    ctx.drawImage(currentAtlas,index%4*cell,Math.floor(index/4)*currentRowHeight,
      cell,currentRowHeight,x,y,w,h);
  }

  function rollingCurrent(ctx,tick,x,y,w,h){
    const frame=Math.floor(tick)%16;
    currentFrame(ctx,frame,x,y,w,h);
    ctx.save();
    ctx.globalAlpha*=ease(tick%1);
    currentFrame(ctx,(frame+1)%16,x,y,w,h);
    ctx.restore();
  }

  function travel(ctx,target,p){
    if(p<=0||p>=.74||!currentAtlas.naturalWidth)return;
    const dx=target.x-500,dy=target.y-510;
    const distance=Math.hypot(dx,dy);
    const angle=Math.atan2(dy,dx);
    const scale=scaleFor(target);
    const head=ease(p/.49)*distance;
    const tail=ease((p-.10)/.46)*distance;
    const span=head-tail;
    const tick=p*58;
    ctx.save();
    if(span>0.5){
      ctx.save();
      ctx.translate(500,510);
      if(dx<0){
        ctx.scale(-1,1);
        ctx.rotate(Math.atan2(dy,-dx));
      }else ctx.rotate(angle);
      const breadth=(.7+ease(p/.36)*.3)*scale;
      ctx.globalAlpha*=ease(p/.09)*(1-ease((p-.50)/.065));
      rollingCurrent(ctx,tick,tail-8,-41*breadth,span+16,64*breadth);
      ctx.restore();
    }
    const pool=ease((p-.40)/.12)*(1-ease((p-.60)/.14));
    if(pool>0){
      ctx.globalAlpha*=pool;
      ctx.translate(target.x,target.y);
      ctx.scale(dx<0?-scale:scale,scale);
      const width=100+100*ease((p-.40)/.18);
      rollingCurrent(ctx,tick+5,-width/2,-32,width,54);
    }
    ctx.restore();
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
    const scale=Math.min(w/228,h/260);
    ctx.save();ctx.translate(w/2,h*.96);ctx.scale(scale,scale);
    shell(ctx,finalFrame,14,-138,"back");
    shell(ctx,finalFrame,14,-138,"front");
    ctx.restore();
  }};
})();
