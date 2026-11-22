(()=>{
  const art=new Image();
  art.src="./assets/sunfire-frames.webp?v=0.288.0";
  const CELL=256, CENTER=500, GROUND=510, DURATION=4200;
  const DESCENT=1520, WINDUP=2260, RELEASE=2670;
  const HEIGHT=235, ORB=255;
  const HOVER_POSES=[4,5,6,7,6,5];
  const clamp=n=>Math.max(0,Math.min(1,n));

  function frame(g,index,x,y,width,height,dir=1,anchor=.5){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    g.drawImage(art,index%4*CELL,Math.floor(index/4)*CELL,CELL,CELL,-width/2,-height*anchor,width,height);
    g.restore();
  }

  function feet(elapsed){
    const descent=clamp(elapsed/DESCENT);
    return GROUND-32-470*(1-descent)**2+3*Math.sin(elapsed/125);
  }

  function caster(g,p,dir){
    const elapsed=p*DURATION;
    const pose=elapsed<DESCENT?Math.min(7,Math.floor(elapsed/DESCENT*8)):
      elapsed<WINDUP?HOVER_POSES[Math.floor((elapsed-DESCENT)/115)%HOVER_POSES.length]:
      elapsed<RELEASE?8+Math.min(1,Math.floor((elapsed-WINDUP)/205)):
      elapsed<RELEASE+270?10:11;
    g.save();
    g.globalAlpha*=Math.min(clamp(elapsed/200),clamp((DURATION-elapsed)/430));
    const foot=feet(elapsed);
    g.fillStyle="rgba(93, 39, 12, .33)";
    g.beginPath();g.ellipse(CENTER,GROUND,39,8,0,0,Math.PI*2);g.fill();
    frame(g,pose,CENTER,foot,HEIGHT,HEIGHT,dir,.92);
    g.restore();
  }

  function projectile(g,p,dir,target,hit){
    const elapsed=p*DURATION,impact=hit*DURATION;
    const flicker=Math.floor(elapsed/105)%2;
    const tx=target.x,ty=target.y-60;
    if(elapsed>=impact){
      const age=clamp((elapsed-impact)/(DURATION-impact));
      const size=255+90*age;
      g.save();
      g.globalAlpha*=1-age**2;
      frame(g,age<.36?14:15,tx,ty,size,size,dir);
      g.restore();
      return;
    }

    const windup=clamp((elapsed-WINDUP)/(RELEASE-WINDUP));
    const heldX=CENTER+(-26+windup*103)*dir;
    // The core hovers just above the raised fingertip before release.
    const heldY=feet(Math.min(elapsed,RELEASE))-272+windup*61;
    const travel=clamp((elapsed-RELEASE)/(impact-RELEASE));
    const t=travel**1.4;
    const size=ORB*(1+.022*Math.sin(elapsed/77));
    const x=heldX+(tx-heldX)*t,y=heldY+(ty-heldY)*t-25*Math.sin(Math.PI*t);
    frame(g,12+flicker,x,y,size,size);
  }

  function portrait(g,w,h){
    const size=Math.min(w,h);
    frame(g,12,w*.58,h*.33,size*.76,size*.76);
    frame(g,5,w*.43,h*.90,size*.67,size*.67,1,.92);
  }

  window.Sunfire={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
