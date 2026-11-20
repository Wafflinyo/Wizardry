(() => {
  const atlas = new Image();
  atlas.src = "./assets/storm-lizard.webp";
  const cell = 192;
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = n => {const t=clamp(n);return t*t*(3-2*t);};
  // Hold the roar, then put the widest swipe pose exactly on the damage cue.
  const poses = [
    [.19,0],[.23,1],[.27,2],[.31,3],[.40,4],[.44,5],[.49,6],[.56,7],
    [.61,8],[.66,9],[.695,10],[.73,11],[.80,12],[.85,13],[.89,14],[.93,15]
  ];
  const strikeTip = {x:.446,y:-.256};

  function sprite(ctx,frame,size){
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,-size/2,-size*.95,size,size);
  }
  function scene(target,p,hit){
    const direction=target.team?1:-1;
    const size=300+40*clamp((target.y-290)/230);
    const turn=ease((p-.53)/(hit-.53));
    const retreat=ease((p-.79)/.15);
    const reach=mix(187,strikeTip.x*size,turn)+retreat*38;
    return {
      p,hit,size,direction,x:target.x-direction*reach,
      y:target.y+6, contactY:target.y+6+strikeTip.y*size,
      frame:poses.findLast(([at])=>p>=at)?.[1]??0
    };
  }

  function bolt(ctx,x,y,endX,endY,seed,strength,weight){
    if(strength<=0)return;
    ctx.save();
    ctx.globalAlpha*=strength;
    ctx.lineJoin="bevel";
    ctx.beginPath();
    ctx.moveTo(x,y);
    for(let i=1;i<8;i++){
      const t=i/8;
      const flicker=Math.sin(i*17.71+seed*2.4)*Math.sin(t*Math.PI);
      const dx=endX-x,dy=endY-y;
      const length=Math.hypot(dx,dy)||1;
      ctx.lineTo(mix(x,endX,t)-dy/length*flicker*weight*4,mix(y,endY,t)+dx/length*flicker*weight*4);
    }
    ctx.lineTo(endX,endY);
    for(const [color,width] of [["#ffcf35",5],["#ffe86c",2.5],["#ffffe3",.9]]){
      ctx.strokeStyle=color;
      ctx.lineWidth=weight*width;
      ctx.stroke();
    }
    ctx.restore();
  }

  function sparks(ctx,x,y,progress,count,spread){
    if(progress<0||progress>=1)return;
    ctx.save();
    ctx.globalAlpha*=1-progress;
    for(let i=0;i<count;i++){
      const angle=i*2.39996;
      const distance=8+progress*(spread+(i%5)*11);
      const sx=x+Math.cos(angle)*distance;
      const sy=y+Math.sin(angle)*distance*.6+progress*progress*22;
      const size=2+(i%4)*1.1;
      ctx.fillStyle=i%3?"#ffde59":"#ffffd0";
      ctx.beginPath();
      ctx.moveTo(sx,sy-size*1.8);
      ctx.lineTo(sx+size,sy);
      ctx.lineTo(sx,sy+size);
      ctx.lineTo(sx-size,sy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx,s){
    const {x,y,p,size,direction,frame,hit}=s;
    const tick=Math.floor(p*130);
    const entry=clamp((p-.065)/.12);
    if(p>=.065&&p<.235){
      const flash=(1-entry)*(.58+.42*Math.cos(tick*2.7)**2);
      bolt(ctx,x-direction*70,y-410,x,y-9,tick,flash,2.6);
      bolt(ctx,x-direction*48,y-260,x+direction*58,y-116,tick+3,flash*.65,1.1);
      sparks(ctx,x,y-10,(p-.065)/.17,22,83);
    }
    if(p<.14)return;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(direction,1);
    ctx.globalAlpha*=ease((p-.14)/.07)*(1-ease((p-.92)/.08));
    ctx.save();
    ctx.globalAlpha*=.3;
    ctx.fillStyle="#182524";
    ctx.beginPath();
    ctx.ellipse(-size*.02,-4,size*.26,size*.045,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    sprite(ctx,frame,size);
    if(p>=.28&&p<.82){
      const charge=ease((p-.28)/.14)*(1-ease((p-.76)/.06));
      const swing=ease((p-.65)/(hit-.65));
      const tipX=mix(.34,strikeTip.x,swing)*size;
      const tipY=mix(-.43,strikeTip.y,swing)*size;
      bolt(ctx,size*.09,-size*.29,tipX,tipY,tick,charge*(.5+.5*Math.cos(tick*1.8)**2),1);
      if(p>=.67&&p<=hit+.06){
        ctx.beginPath();
        ctx.moveTo(size*.13,-size*.48);
        ctx.quadraticCurveTo(size*.38,-size*.56,tipX,tipY);
        ctx.quadraticCurveTo(size*.32,-size*.48,size*.13,-size*.48);
        ctx.fillStyle="rgba(255,218,64,.37)";
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function impact(ctx,scene,target){
    const age=(scene.p-scene.hit)/.20;
    if(age<0||age>=1)return;
    const tick=Math.floor(age*23);
    const strength=(1-age)*(.5+.5*Math.cos(tick*2.2)**2);
    const y=scene.contactY;
    for(let i=0;i<4;i++){
      const offset=(i-1.5)*23;
      bolt(ctx,target.x+offset,y-83+(i%2)*30,target.x-offset*.5,y+50,tick+i*4,strength,1.12);
    }
    sparks(ctx,target.x,y,age,29,100);
  }

  window.StormLizard={
    scene,draw,impact,
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});},
    portrait(ctx,w,h){
      ctx.save();
      ctx.translate(w/2,h*.95);
      sprite(ctx,3,Math.min(w*1.04,h*1.35));
      ctx.restore();
    }
  };
})();
