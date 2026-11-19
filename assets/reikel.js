(() => {
  const atlas = new Image();
  atlas.src = "./assets/reikel.webp";
  const flourish = new Image();
  flourish.src = "./assets/reikel-planted-spins.webp";
  const tile = 256;
  const spinStart=.10, spinEnd=.53;
  const spinFrames=36, spinColumns=4, spinTile=256;
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
    const contact=clamp((p-dashStart)/(hit-dashStart));
    const follow=clamp((p-hit)/.12);
    const exit=through?target.x+dir*83:contactX-dir*22;
    const x=p<hit?mix(stanceX,contactX,contact):mix(contactX,exit,1-(1-follow)**2);
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

  const spearTips = [
    [148, 20, 148, 226],
    [201, 30, 64, 192],
    [232, 121, 35, 124],
    [218, 201, 45, 92],
    [225, 39, 33, 39],
    [200, 83, 51, 20],
    [29, 49, 202, 49],
    [39, 87, 221, 23],
    [213, 21, 58, 158],
    [225, 65, 39, 142],
    [233, 161, 37, 101],
    [181, 223, 73, 44],
  ];

  function spinPose(ctx,index,time){
    const section=Math.floor(index/12);
    const pose=section*4+index%4;
    const [ax,ay,bx,by]=spearTips[pose];
    const rate=size/spinTile;
    const x=(ax+bx)/2*rate-size/2,y=(ay+by)/2*rate-size*.88;
    const dx=(ax-bx)*rate/2,dy=(ay-by)*rate/2;
    const squash=section===1?.26:.87;
    const crossX=-dy*squash,crossY=dx*squash;
    ctx.drawImage(flourish,(pose%spinColumns)*spinTile,Math.floor(pose/spinColumns)*spinTile,
      spinTile,spinTile,-size/2,-size*.88,size,size);
    ctx.save();
    ctx.lineCap="round";
    const opacity=ctx.globalAlpha;
    for(const [width,color,alpha] of [[15,"#ed4b17",.56],[8,"#ff9326",.94],[3,"#ffe495",.99]]){
      ctx.strokeStyle=color;
      for(let tip=0;tip<2;tip++){
        for(let part=0;part<22;part++){
          const a=tip*Math.PI-part*.139,b=a-.158;
          const flicker=Math.sin(time*210+part*2.7)*.14;
          ctx.globalAlpha=opacity*alpha*(1-part/24)*(.88+flicker);
          ctx.lineWidth=width*(1-part/31);
          ctx.beginPath();
          ctx.moveTo(x+dx*Math.cos(a)+crossX*Math.sin(a),y+dy*Math.cos(a)+crossY*Math.sin(a));
          ctx.lineTo(x+dx*Math.cos(b)+crossX*Math.sin(b),y+dy*Math.cos(b)+crossY*Math.sin(b));
          ctx.stroke();
        }
      }
    }
    for(const [tx,ty] of [[ax,ay],[bx,by]]){
      ctx.globalAlpha=opacity;
      streak(ctx,tx*rate-size/2,ty*rate-size*.88,1,13+Math.sin(time*212)*4,8,.9);
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
      for(let i=0;i<11;i++){
        const flutter=Math.sin(p*105+i*2);
        const trailX=x-dir*i*19;
        streak(ctx,trailX,y-4-flutter*4,dir,50+i*9,16+flutter*6,dash*(1-i/12)*.90);
        streak(ctx,trailX+dir*96,y-92+flutter*6,dir,53+i*8,17+flutter*6,dash*(1-i/12)*.90);
      }
      ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
      if(p>=spinStart&&p<spinEnd&&flourish.naturalWidth){
        const progress=(p-spinStart)/(spinEnd-spinStart);
        const index=Math.min(spinFrames-1,Math.floor(progress*spinFrames));
        spinPose(ctx,index,p);
      }else sprite(ctx,frame,0,0,size);
      ctx.restore();
      const impact=(p-hit)/.13;
      if(impact>=0&&impact<1){
        ctx.save();
        ctx.translate(target.x,target.y-85);
        const flare=1-impact;
        ctx.globalAlpha=flare*.75;
        ctx.strokeStyle="#ffad52";
        ctx.lineWidth=7*flare;
        ctx.beginPath();ctx.ellipse(0,0,19+impact*83,12+impact*52,0,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<22;i++){
          const angle=i*Math.PI*2/22+(i%3)*.05;
          ctx.save();ctx.rotate(angle);
          streak(ctx,13+impact*(65+i%5*13),0,1,46*flare,8*flare,flare);
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  };
})();
