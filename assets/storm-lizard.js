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
    const reach=mix(205,strikeTip.x*size,turn)+retreat*38;
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
    const baseAlpha=ctx.globalAlpha;
    ctx.lineJoin="bevel";
    ctx.lineCap="round";
    ctx.beginPath();
    points.forEach(([x,y],index)=>index===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
    for(const [color,scale,opacity] of [
      ["#ff932e",2.2,.16],["#ffb52d",1.4,.45],["#ffe268",1,.96],["#fff5bc",.59,1],["#fffef6",.27,1]
    ]){
      ctx.globalAlpha=baseAlpha*energy*opacity;
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

  // Each fork leaves the tail contact and climbs or drops along the silhouette.
  const impactForks={
    front:[
      {delay:0,width:7,points:[[-66,-105],[-44,-116],[-25,-138],[-9,-130],[8,-165],[29,-177],[39,-205]]},
      {delay:.07,width:4,points:[[-25,-138],[-38,-158],[-30,-178],[-51,-199]]},
      {delay:.18,width:3,points:[[8,-165],[21,-146],[39,-150],[54,-164]]},
      {delay:.04,width:6,points:[[-66,-105],[-39,-93],[-31,-66],[-10,-70],[8,-38],[30,-28],[41,-2]]},
      {delay:.20,width:3,points:[[-31,-66],[-54,-45],[-49,-28],[-73,-14]]},
      {delay:.22,width:3,points:[[8,-38],[32,-49],[51,-41],[59,-23]]}
    ],
    back:[
      {delay:.04,width:5,points:[[-66,-105],[-52,-141],[-62,-162],[-42,-193],[-17,-200],[3,-225]]},
      {delay:.12,width:4,points:[[-66,-105],[-30,-114],[3,-101],[24,-126],[50,-116],[72,-150]]},
      {delay:.21,width:3,points:[[50,-116],[62,-92],[78,-72],[73,-45]]}
    ]
  };

  function impact(ctx,scene,target,layer){
    const age=(scene.p-scene.hit)/.20;
    if(age<0||age>=1)return;
    const scale=.60+.30*clamp((target.y-288)/235);
    const beat=Math.floor(age*16);
    const decay=1-ease((age-.34)/.66);
    ctx.save();
    ctx.translate(target.x,target.y);
    ctx.scale(scale*scene.direction,scale);

    for(const [index,{delay,width,points}] of impactForks[layer].entries()){
      const growth=clamp((age-delay)*11);
      if(!growth)continue;
      const last=growth*(points.length-1);
      const path=points.slice(0,Math.floor(last)+1);
      if(last%1){
        const [x,y]=path.at(-1),[nextX,nextY]=points[path.length];
        path.push([mix(x,nextX,last%1),mix(y,nextY,last%1)]);
      }
      const flicker=.52+.48*Math.cos(beat*1.9+index*2.7)**2;
      traceStrike(ctx,path,width,decay*flicker*(layer==="front"?1:.68));
    }
    if(layer==="front"){
      const pulse=1-ease(age/.31);
      if(pulse>0){
        const bloom=ctx.createRadialGradient(-62,-105,0,-62,-105,53);
        bloom.addColorStop(0,"#fffde9");
        bloom.addColorStop(.32,"#ffdc4ca0");
        bloom.addColorStop(1,"#ffaf2400");
        ctx.save();
        ctx.globalAlpha*=pulse;
        ctx.fillStyle=bloom;
        ctx.fillRect(-115,-158,106,106);
        ctx.restore();
      }
      sparks(ctx,-62,-105,age,24,115);
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
