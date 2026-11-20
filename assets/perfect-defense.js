(() => {
  const atlas = new Image();
  atlas.src = "./assets/perfect-defense-dome.webp";
  const cell = 192;
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

  function shell(ctx,frame,eyeX,eyeY,layer,growth=1){
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
    shell(ctx,frame,isWood?0:spriteWizard?17:14,eyeY,layer,growth);
    if(layer==="front")flowingGrains(ctx,time,growth,eyeY);
    ctx.restore();
  }

  function sandTexture(ctx,points,x,y,w,h,offset){
    ctx.save();
    ctx.beginPath();
    polygon(ctx,points);
    ctx.clip();
    ctx.fillStyle="#b47b33";
    ctx.fillRect(x,y,w,h);
    if(atlas.naturalWidth){
      // Sample the dome's golden sand bands for the floor ribbon's surface.
      ctx.drawImage(atlas,38+offset,576+82,115,67,x,y,w,h);
    }
    ctx.restore();
  }

  function travel(ctx,target,progress){
    if(progress<=0||progress>=.75)return;
    const dx=target.x-500,dy=target.y-510;
    const length=Math.hypot(dx,dy);
    const head=ease(progress/.49)*length;
    const tail=ease((progress-.15)/.43)*length;
    const span=head-tail;
    const pool=ease((progress-.40)/.13)*(1-ease((progress-.61)/.14));
    const size=scaleFor(target);
    ctx.save();
    if(span>1){
      ctx.save();
      ctx.translate(500,510);
      ctx.rotate(Math.atan2(dy,dx));
      const left=[],right=[],ridge=[];
      for(let i=0;i<=20;i++){
        const t=i/20,x=tail+span*t;
        const taper=Math.sin(Math.PI*t)**.53;
        const wave=Math.sin(x*.045-progress*38)*6*taper;
        const spread=(16+10*t)*size*taper;
        left.push([x,wave-spread]);
        right.push([x,wave+spread]);
        ridge.push([x,wave-spread*.23]);
      }
      const outline=[...left,...right.reverse()];
      const x=tail-2,y=-27*size-8;
      ctx.globalAlpha*=ease(progress/.065)*(1-ease((progress-.48)/.14));
      sandTexture(ctx,outline,x,y,span+4,-2*y,Math.floor(progress*33)%18);
      ctx.beginPath();
      polygon(ctx,[...ridge,...left.reverse()]);
      ctx.fillStyle="#ffcf763e";
      ctx.fill();
      for(let i=0;i<40;i++){
        const t=(i*.618+progress*5)%1;
        const x=tail+span*t;
        const taper=Math.sin(Math.PI*t);
        const y=Math.sin(x*.045-progress*38)*6*taper+Math.sin(i*4.6)*(10+i%5*2)*size*taper;
        const grain=1+i%3;
        ctx.beginPath();
        polygon(ctx,[[x-grain*3,y],[x+grain,y-grain],[x+grain*2,y],[x,y+grain]]);
        ctx.fillStyle=sand[i%sand.length];
        ctx.fill();
      }
      ctx.restore();
    }
    if(pool>0){
      ctx.translate(target.x,target.y);
      ctx.scale(size,size);
      ctx.globalAlpha*=pool;
      const rim=Array.from({length:20},(_,i)=>{
        const angle=i*Math.PI/10;
        const radius=1+Math.sin(i*3.1+progress*31)*.11;
        return [Math.cos(angle)*100*radius,Math.sin(angle)*22*radius+5];
      });
      sandTexture(ctx,rim,-114,-25,228,58,Math.floor(progress*30)%18);
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
