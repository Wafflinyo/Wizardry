(()=>{
  const art=new Image();
  art.src="./assets/double-pick-frames.webp?v=0.290.2";
  const CELL=256, CENTER=500, GROUND=510, DURATION=4230;
  const RELEASES=[2290,3180];
  const POSE_TIMES=[0,360,900,1250,1790,2000,2290,2460,2740,2960,3180,3390];
  // Coordinates marked on the right and left fists, in atlas pixels.
  const RIGHT_GRIPS=[[113,208],[73,165],[63,149],[64,149],[52,82],[47,48]];
  const LEFT_GRIPS=[[193,209],[196,169],[180,151],[200,153],[196,148],[193,138],
    [152,141],[158,145],[189,145],[179,55]];
  const ACTOR_SIZE=239;
  const clamp=n=>Math.max(0,Math.min(1,n));

  function frame(g,pose,x,y,size,dir=1,anchor=.5){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    g.drawImage(art,pose%4*CELL,Math.floor(pose/4)*CELL,CELL,CELL,-size/2,-size*anchor,size,size);
    g.restore();
  }

  function heldPick(g,x,y){
    const facets=[
      ["#254b66",[[0,-5],[37,-10],[40,2],[0,6]]],
      ["#b9f0ff",[[30,-13],[45,-31],[69,-35],[94,-25],[70,-22],[54,-10],[43,5]]],
      ["#66d6f8",[[43,5],[54,-10],[70,-22],[94,-25],[80,-10],[61,2],[49,17]]],
      ["#378cc0",[[43,5],[49,17],[61,2],[80,-10],[62,-6]]],
      ["#e0faff",[[45,-31],[69,-35],[94,-25],[67,-29]]]
    ];
    g.save();
    g.translate(x,y);
    for(const [color,points] of facets){
      g.fillStyle=color;
      g.beginPath();
      g.moveTo(...points[0]);
      for(const point of points.slice(1))g.lineTo(...point);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  function actorFrame(g,pose,x,y,size,dir){
    frame(g,pose,x,y,size,dir,.90);
    g.save();
    g.translate(x,y);
    g.scale(dir*size/CELL,size/CELL);
    for(const grip of [LEFT_GRIPS[pose],RIGHT_GRIPS[pose]]){
      if(grip)heldPick(g,grip[0]-CELL/2,grip[1]-CELL*.90);
    }
    g.restore();
  }

  function caster(g,elapsed,dir,hasSecondTarget){
    const pose=Math.max(0,POSE_TIMES.findLastIndex(ms=>elapsed>=ms));
    g.save();
    g.globalAlpha*=Math.min(clamp(elapsed/220),clamp((DURATION-elapsed)/420));
    g.beginPath();
    g.ellipse(CENTER,GROUND,38,8,0,0,Math.PI*2);
    g.fillStyle="rgba(8, 31, 50, .34)";
    g.fill();
    actorFrame(g,hasSecondTarget?pose:Math.min(pose,7),CENTER,GROUND,ACTOR_SIZE,dir);
    g.restore();
  }

  function projectile(g,elapsed,dir,target,index,hit){
    const release=RELEASES[index];
    if(elapsed<release||elapsed>=hit+490)return;
    const tx=target.x,ty=target.y-69;
    if(elapsed>=hit){
      const age=(elapsed-hit)/490;
      g.save();
      g.globalAlpha*=1-age;
      frame(g,age<.45?14:15,tx,ty,138+age*53,dir);
      g.restore();
      return;
    }
    const t=clamp((elapsed-release)/(hit-release));
    const sx=CENTER+dir*(index===0?105:99),sy=GROUND-(index===0?153:140);
    const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t-30*Math.sin(t*Math.PI);
    frame(g,12+Math.floor((elapsed-release)/70)%2,x,y,119,dir);
  }

  function portrait(g,width,height){
    const size=Math.min(width,height);
    actorFrame(g,3,width/2,height*.95,size*1.02,1);
  }
  window.DoublePick={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
