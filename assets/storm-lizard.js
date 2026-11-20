(() => {
  const atlas = new Image();
  atlas.src = "./assets/storm-lizard-turn.webp";
  const cell = 192;
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = n => {const t=clamp(n);return t*t*(3-2*t);};
  // Hold the roar, then put the widest swipe pose exactly on the damage cue.
  const poses = [
    [.16,0],[.20,1],[.24,2],[.29,3],[.49,4],[.55,5],[.60,6],[.65,7],
    [.69,8],[.73,9],[.755,10],[.78,11],[.83,12],[.87,13],[.91,14],[.95,15]
  ];
  const strikeTip = {x:.471,y:-.315};

  function sprite(ctx,frame,size){
    if(!atlas.naturalWidth)return;
    ctx.drawImage(atlas,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,-size/2,-size*.95,size,size);
  }
  function scene(target,p,hit){
    const direction=target.team?1:-1;
    const size=300+40*clamp((target.y-290)/230);
    const turn=ease((p-.63)/(hit-.63));
    const retreat=ease((p-.84)/.13);
    const reach=mix(187,strikeTip.x*size,turn)+retreat*38;
    return {
      p,hit,size,direction,x:target.x-direction*reach,
      y:target.y+6,
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

  function entranceFlash(progress){
    const peak=.080;
    const width=progress<peak?.009:.027;
    return .72*(1-ease(Math.abs(progress-peak)/width));
  }

  const trunk=[
    [-74,-690],[-46,-525],[-67,-460],[-11,-378],[-40,-320],[21,-227],
    [-12,-180],[35,-111],[-4,-65],[16,-35],[0,-7]
  ];
  const forks=[
    [2,[[-141,-418],[-123,-350],[-185,-288],[-205,-204]]],
    [3,[[58,-334],[40,-285],[103,-238],[96,-168]]],
    [5,[[89,-212],[64,-170],[128,-131],[151,-65]]],
    [7,[[-27,-99],[-54,-48],[-111,-27]]]
  ];

  function traceStrike(ctx,points,width,energy){
    ctx.save();
    ctx.lineJoin="bevel";
    ctx.lineCap="round";
    ctx.beginPath();
    points.forEach(([x,y],index)=>index===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
    for(const [color,scale,opacity] of [
      ["#ff932e",2.2,.16],["#ffb52d",1.4,.45],["#ffe268",1,.96],["#fff5bc",.59,1],["#fffef6",.27,1]
    ]){
      ctx.globalAlpha=energy*opacity;
      ctx.lineWidth=width*scale;
      ctx.strokeStyle=color;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEntrance(ctx,x,y,direction,p){
    if(p<.067||p>=.183)return;
    const energy=ease((p-.067)/.012)*(1-ease((p-.094)/.036));
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(direction,1);
    if(energy>0){
      for(const [branch,points] of forks)traceStrike(ctx,[trunk[branch],...points],8,energy*.83);
      traceStrike(ctx,trunk,25,energy);
    }
    const burst=clamp((p-.077)/.105);
    const glow=ctx.createRadialGradient(0,-8,0,0,-8,115);
    glow.addColorStop(0,"#fffbe4");
    glow.addColorStop(.24,"#ffcf47a0");
    glow.addColorStop(1,"#ffa52a00");
    ctx.save();
    ctx.globalAlpha=(1-burst)*ease((p-.067)/.012);
    ctx.fillStyle=glow;
    ctx.fillRect(-115,-123,230,230);
    ctx.restore();
    sparks(ctx,0,-10,(p-.077)/.105,44,145);
    ctx.restore();
  }

  function draw(ctx,s){
    const {x,y,p,size,direction,frame,hit}=s;
    const tick=Math.floor(p*130);
    drawEntrance(ctx,x,y,direction,p);
    if(p<.13)return;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(direction,1);
    ctx.globalAlpha*=ease((p-.13)/.05)*(1-ease((p-.95)/.05));
    ctx.save();
    ctx.globalAlpha*=.3;
    ctx.fillStyle="#182524";
    ctx.beginPath();
    ctx.ellipse(-size*.02,-4,size*.26,size*.045,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    sprite(ctx,frame,size);
    if(frame>=9 && frame<=11){
      const charge=ease((p-.73)/.035)*(1-ease((p-hit)/.05));
      const tip=frame===9?[.31,-.50]:frame===10?[.39,-.58]:[strikeTip.x,strikeTip.y];
      bolt(ctx,size*.24,-size*.29,tip[0]*size,tip[1]*size,tick,charge,1.55);
      bolt(ctx,size*.28,-size*.31,tip[0]*size,(tip[1]-.07)*size,tick+4,charge*.6,.9);
    }
    ctx.restore();
  }

  function impact(ctx,scene,target,layer){
    const age=(scene.p-scene.hit)/.20;
    if(age<0||age>=1)return;
    const front=layer==="front";
    const beat=Math.floor(age*17);
    const alpha=(1-ease((age-.53)/.47))*(.78+.22*Math.cos(beat*2.2)**2);
    const scale=.60+.30*clamp((target.y-288)/235);
    ctx.save();
    ctx.translate(target.x,target.y);
    ctx.scale(scale,scale);
    ctx.globalAlpha*=alpha;
    // Offset the two halves so the shoulder and hip arcs wrap around the model.
    const side=scene.direction;
    for(const [height,tilt] of [[-155,18],[-80,24]]){
      const turn=front?side:-side;
      bolt(ctx,-75*turn,height+tilt,75*turn,height-tilt,beat+height,front?.87:.62,front?1.65:1.3);
    }
    if(front){
      window.ElectricEel?.electrocute(ctx,scene.p,scene.hit);
      sparks(ctx,0,-103,age,25,112);
    }
    ctx.restore();
  }

  window.StormLizard={
    scene,draw,impact,entranceFlash,
    onReady(fn){if(atlas.naturalWidth)fn();else atlas.addEventListener("load",fn,{once:true});},
    portrait(ctx,w,h){
      ctx.save();
      ctx.translate(w/2,h*.95);
      sprite(ctx,3,Math.min(w*1.04,h*1.35));
      ctx.restore();
    }
  };
})();
