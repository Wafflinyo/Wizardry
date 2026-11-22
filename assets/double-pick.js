(()=>{
  const art=new Image();
  art.src="./assets/double-pick-frames.webp?v=0.290.4";
  const CELL=256, CENTER=500, GROUND=510, DURATION=5560;
  const RELEASES=[2730,4380];
  const POSE_TIMES=[0,360,900,1250,1740,2040,2370,2730,2990,3520,3930,4380,4670];
  // Coordinates marked on the right and left fists, in atlas pixels.
  const RIGHT_GRIPS=[[93,153],[79,176],[69,151],[73,151],[71,140],[48,52],[86,53]];
  const LEFT_GRIPS=[[198,157],[202,185],[182,152],[200,152],[196,146],[196,141],
    [179,141],[165,148],[196,145],[189,145],[179,55]];
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
      ["#243449",[[-13,13],[-6,18],[33,-22],[39,-29],[31,-36],[24,-28]]],
      ["#50647a",[[-10,12],[-6,12],[34,-29],[31,-33]]],
      ["#2c81b1",[[23,-35],[38,-45],[59,-43],[77,-29],[82,-8],[79,16],[69,-4],[61,-16],[49,-22],[31,-22]]],
      ["#a9ecff",[[23,-35],[38,-45],[59,-43],[71,-34],[55,-32],[43,-35],[31,-24]]],
      ["#69cef7",[[55,-32],[71,-34],[77,-29],[82,-8],[79,16],[74,-5],[64,-19]]],
      ["#daf7ff",[[38,-45],[59,-43],[53,-38],[40,-39]]],
      ["#4aa9d7",[[31,-24],[43,-35],[55,-32],[64,-19],[49,-22],[31,-22]]]
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
    const step=Math.max(0,POSE_TIMES.findLastIndex(ms=>elapsed>=ms));
    const pose=step===12?13:step;
    g.save();
    g.globalAlpha*=Math.min(clamp(elapsed/220),clamp((DURATION-elapsed)/420));
    g.beginPath();
    g.ellipse(CENTER,GROUND,38,8,0,0,Math.PI*2);
    g.fillStyle="rgba(8, 31, 50, .34)";
    g.fill();
    actorFrame(g,hasSecondTarget?pose:Math.min(pose,8),CENTER,GROUND,ACTOR_SIZE,dir);
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
    const sx=CENTER+dir*(index===0?98:99),sy=GROUND-(index===0?116:140);
    const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t-30*Math.sin(t*Math.PI);
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    // A short wake follows the flight path while the pick tumbles around its center.
    for(let i=0;i<3;i++){
      const length=38+i*17;
      g.fillStyle=["#7bdbff70","#b9efff8c","#56c7f55c"][i];
      g.beginPath();
      g.moveTo(-25,i*12-13);
      g.lineTo(-25-length,i*9-17);
      g.lineTo(-15,i*12-8);
      g.closePath();
      g.fill();
    }
    g.rotate(t*Math.PI*7);
    frame(g,12,0,0,199);
    g.restore();
  }

  function portrait(g,width,height){
    const size=Math.min(width,height);
    actorFrame(g,3,width/2,height*.95,size*1.02,1);
  }
  window.DoublePick={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
