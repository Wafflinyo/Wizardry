(() => {
  const atlas = new Image();
  atlas.src = "./assets/reikel.webp";
  const flourish = new Image();
  flourish.src = "./assets/reikel-side-spins.webp";
  const tile = 256;
  const spinStart=.10, spinEnd=.53;
  const spinFrames=36, spinColumns=6, spinTile=192;
  const size = 242;
  const dashStart = .71;
  const clamp = n => Math.max(0,Math.min(1,n));
  const mix = (a,b,t) => a+(b-a)*t;
  const cues = [0,.055,.11,.17,.23,.29,.35,.41,.47,.53,.61,.71,.745,.80,.87,.94];

  function sprite(ctx,frame,x,y,side) {
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,
      x-side/2,y-side*.88,side,side);
  }

  function scene(target,p,hit,through) {
    const dir=target.x>=500?1:-1;
    const contactX=target.x-dir*96;
    const stanceX=dir===1?Math.min(509,contactX-44):Math.max(491,contactX+44);
    const startX=stanceX-dir*96;
    const walk=clamp((p-spinStart)/(spinEnd-spinStart));
    const plantedX=mix(startX,stanceX,walk);
    const contact=clamp((p-dashStart)/(hit-dashStart));
    const follow=clamp((p-hit)/.12);
    const exit=through?target.x+dir*83:contactX-dir*22;
    const x=p<hit?mix(plantedX,contactX,contact):mix(contactX,exit,1-(1-follow)**2);
    const y=mix(500,target.y,clamp((p-dashStart)/(hit-dashStart)));
    const frame=cues.findLastIndex(cue=>p>=cue);
    return {x,y,dir,frame,p,hit,target};
  }

  function streak(ctx,x,y,dir,width,height,opacity) {
    ctx.save();
    ctx.globalAlpha*=opacity;
    for(const [dy,scale,color] of [[0,1,"#e85824"],[-2,.67,"#ff992f"],[-3,.36,"#ffe29e"]]){
      ctx.fillStyle=color;
      ctx.beginPath();
      ctx.moveTo(x,y+dy);
      ctx.lineTo(x-dir*width*scale,y+height*scale);
      ctx.lineTo(x-dir*width*scale*.48,y-height*scale);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  window.Reikel={
    onReady(fn){
      if(atlas.naturalWidth)fn();
      else atlas.addEventListener("load",fn,{once:true});
    },
    portrait(ctx,w,h){
      const side=Math.min(w,h);
      sprite(ctx,9,w/2,(h-side)/2+side*.88,side);
    },
    scene,
    draw(ctx,{x,y,dir,frame,p,hit,target}){
      ctx.save();
      ctx.globalAlpha*=Math.min(clamp(p/.09),clamp((1-p)/.07));
      const dash=clamp((p-dashStart)/.045)*clamp((.96-p)/.09);
      for(let i=0;i<7;i++){
        const flutter=Math.sin(p*105+i*2);
        const trailX=x-dir*i*19;
        streak(ctx,trailX,y-4-flutter*4,dir,50+i*9,9+flutter*3,dash*(1-i/8)*.72);
        streak(ctx,trailX+dir*96,y-92+flutter*6,dir,53+i*8,10+flutter*3,dash*(1-i/8)*.72);
      }
      ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
      if(p>=spinStart&&p<spinEnd&&flourish.naturalWidth){
        const progress=(p-spinStart)/(spinEnd-spinStart);
        const index=Math.min(spinFrames-1,Math.floor(progress*spinFrames));
        ctx.drawImage(flourish,(index%spinColumns)*spinTile,Math.floor(index/spinColumns)*spinTile,
          spinTile,spinTile,-size/2,-size*.88,size,size);
      }else sprite(ctx,frame,0,0,size);
      ctx.restore();
      const impact=(p-hit)/.13;
      if(impact>=0&&impact<1){
        for(let i=0;i<8;i++){
          const angle=i*Math.PI/4;
          const dx=Math.cos(angle)*(12+66*impact);
          const dy=Math.sin(angle)*(8+40*impact);
          streak(ctx,target.x+dx,target.y-85+dy,dir,28*(1-impact),4,1-impact);
        }
      }
      ctx.restore();
    }
  };
})();
