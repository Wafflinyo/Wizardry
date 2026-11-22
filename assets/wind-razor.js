(()=>{
  const art=new Image();
  art.src="./assets/wind-razor-frames.webp?v=0.285.3";

  const CENTER=500, GROUND=510, CELL=256, FOOT=235;
  const BODY_SCALE=.88, ORB_SCALE=.63;
  const DURATION=3960, CHARGE_START=480, WINDUP_START=2580, RELEASE=2930;
  const clamp=n=>Math.min(1,Math.max(0,n));
  const between=(elapsed,start,end)=>clamp((elapsed-start)/(end-start));

  function frame(g,index,x,y,scale,dir,anchorY=CELL/2){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir*scale,scale);
    g.drawImage(art,index%6*CELL,Math.floor(index/6)*CELL,CELL,CELL,-CELL/2,-anchorY,CELL,CELL);
    g.restore();
  }

  function caster(g,p,dir){
    const elapsed=p*DURATION;
    let pose;
    if(elapsed<CHARGE_START){
      pose=Math.floor(between(elapsed,0,CHARGE_START)*5);
    }else if(elapsed<WINDUP_START){
      pose=5+Math.floor(between(elapsed,CHARGE_START,WINDUP_START)*9);
    }else if(elapsed<RELEASE){
      const windup=[14,15,18,19];
      pose=windup[Math.floor(between(elapsed,WINDUP_START,RELEASE)*windup.length)];
    }else{
      pose=Math.min(23,20+Math.floor((elapsed-RELEASE)/130));
    }

    g.save();
    const opacity=Math.min(clamp(elapsed/230),clamp((DURATION-elapsed)/290));
    g.globalAlpha*=opacity;
    g.beginPath();
    g.ellipse(CENTER,GROUND,38,8,0,0,Math.PI*2);
    g.fillStyle="rgba(10, 29, 28, .36)";
    g.fill();
    frame(g,pose,CENTER,GROUND,BODY_SCALE,dir,FOOT);
    g.restore();
  }

  function projectile(g,p,dir,target,hit){
    const elapsed=p*DURATION;
    if(elapsed<RELEASE)return;
    const tx=target.x,ty=target.y-62;
    if(p>=hit){
      const age=between(p,hit,1);
      frame(g,30+Math.min(5,Math.floor(age*6)),tx,ty,.92,dir);
      return;
    }

    const travel=between(elapsed,RELEASE,hit*DURATION);
    const t=travel**1.25;
    const releaseX=CENTER+78*dir,releaseY=GROUND-133;
    const x=releaseX+(tx-releaseX)*t;
    const y=releaseY+(ty-releaseY)*t-15*Math.sin(Math.PI*t);
    frame(g,24+Math.min(5,Math.floor(travel*6)),x,y,ORB_SCALE,dir);
  }

  function portrait(g,width,height){
    frame(g,11,width/2,height/2,Math.min(width,height)/CELL,1);
  }

  window.WindRazor={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
