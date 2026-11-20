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

  // Bake a full revolution of granular slip faces onto the stationary shell.
  const surfaceFrames=[];
  function shiftingShell(ctx,frame,time){
    const index=Math.floor(time/75)%48;
    if(!surfaceFrames[index]){
      const tile=document.createElement("canvas");
      tile.width=tile.height=cell;
      const c=tile.getContext("2d");
      const turn=index*Math.PI*2/48;
      sprite(c,finalFrame,0,0,cell,cell);
      c.globalCompositeOperation="source-atop";
      for(let belt=0;belt<23;belt++){
        const v=(belt+.5)/23;
        const radius=90*Math.sqrt(v*(2-v));
        for(let grain=0;grain<44;grain++){
          const longitude=grain*Math.PI*2/44+turn+1.7*Math.sin(belt*.43)+belt*.21;
          const facing=Math.cos(longitude);
          if(facing<=0)continue;
          const x=96+radius*Math.sin(longitude);
          const y=9+v*158+facing*(8+6*v)+5*Math.sin(longitude*3+belt*.42);
          const w=(4+2*Math.sin(grain*3.7+belt))*facing;
          const h=2+1.5*Math.sin(grain*1.71+belt);
          c.globalAlpha=.52*facing;
          c.fillStyle=sand[(grain*7+belt*3)%5];
          c.beginPath();
          polygon(c,[[x-w,y],[x-w*.4,y-h],[x+w,y-h*.5],[x+w*.6,y+1],[x,y+h]]);
          c.fill();
        }
      }
      surfaceFrames[index]=tile;
    }
    ctx.drawImage(surfaceFrames[index],-width/2,top,width,height);
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
    const length=Math.hypot(dx,dy)||1;
    const piles=[];
    // Each crest has its own footprint and arrival time. Only the ground
    // anchors follow the route, so crests stay upright even on steep paths.
    for(let row=0;row<5;row++){
      for(let lane=-1;lane<=1;lane++){
        const delay=row*.036+Math.abs(lane)*.016;
        const advance=ease((p-delay)/.47);
        const size=ease((p-delay)/.085)*(1-ease((p-.49-delay)/.14));
        if(size<=0)continue;
        const spread=(17+10*Math.sin(advance*Math.PI))*lane;
        const x=500+dx*advance-dy/length*spread;
        const y=510+dy*advance+dx/length*spread*.48;
        const depth=scaleFor({y});
        piles.push({x,y,w:(123+23*(1-Math.abs(lane)))*depth*size,
          h:(72+31*(1-Math.abs(lane)))*depth*size,tick:p*66+row*3+lane+2});
      }
    }
    piles.sort((a,b)=>a.y-b.y);
    for(const pile of piles){
      ctx.save();
      ctx.translate(pile.x,pile.y);
      ctx.scale(dx<0?-1:1,1);
      rollingCurrent(ctx,pile.tick,-pile.w/2,-pile.h*.82,pile.w,pile.h);
      ctx.restore();
    }
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
