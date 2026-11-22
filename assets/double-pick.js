(()=>{
  const art=new Image();
  art.src="./assets/double-pick-frames.webp?v=0.290.0";
  const CELL=256, CENTER=500, GROUND=510, DURATION=4230;
  const RELEASES=[2290,3180];
  const POSE_TIMES=[0,360,900,1250,1790,2000,2290,2460,2740,2960,3180,3390];
  const clamp=n=>Math.max(0,Math.min(1,n));

  function frame(g,pose,x,y,size,dir=1,anchor=.5){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    g.drawImage(art,pose%4*CELL,Math.floor(pose/4)*CELL,CELL,CELL,-size/2,-size*anchor,size,size);
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
    frame(g,hasSecondTarget?pose:Math.min(pose,7),CENTER,GROUND,239,dir,.90);
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
    const sx=CENTER+dir*105,sy=GROUND-(index===0?153:151);
    const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t-30*Math.sin(t*Math.PI);
    frame(g,12+Math.floor((elapsed-release)/70)%2,x,y,119,dir);
  }

  function portrait(g,width,height){
    const size=Math.min(width,height);
    frame(g,3,width/2,height*.95,size*1.14,1,.90);
  }
  window.DoublePick={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
