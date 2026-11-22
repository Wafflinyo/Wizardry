(()=>{
  const art=new Image();
  art.src="./assets/land-ray-frames.webp?v=0.289.4";
  const CELL=256, SIZE=330;
  const DURATION=5175, IMPACT=2815;
  const POSE_TIMES=[0,1400,1540,1690,1830,1980,2130,2280,2430,2580,2730,2775,IMPACT,3565,3795,4000,4230,4460,4690];
  const POSES=[0,1,2,3,4,5,6,5,4,5,7,8,9,10,11,12,13,14,15];
  const TAIL_REACH={7:.12,8:.37,9:.73};
  const clamp=n=>Math.max(0,Math.min(1,n));

  function frame(g,pose,x,y,size,dir,anchorY,reach=0){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    if(reach)g.transform(1,0,-reach,1,0,0);
    g.drawImage(art,pose%4*CELL,Math.floor(pose/4)*CELL,CELL,CELL,-size/2,-size*anchorY,size,size);
    g.restore();
  }

  function strike(g,x,y,dir,age){
    if(age<0||age>=310)return;
    const progress=age/310;
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    g.globalAlpha*=1-progress;
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      const reach=12+progress*(38+i%3*11);
      const dx=Math.cos(angle),dy=Math.sin(angle);
      g.fillStyle=i%2?"#f5c278":"#ffe7b5";
      g.beginPath();
      g.moveTo(dx*reach,dy*reach);
      g.lineTo(dx*(reach+13)-dy*3,dy*(reach+13)+dx*3);
      g.lineTo(dx*(reach+24),dy*(reach+24));
      g.lineTo(dx*(reach+9)+dy*3,dy*(reach+9)-dx*3);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  function draw(g,elapsed,dir,target){
    const pose=POSES[Math.max(0,POSE_TIMES.findLastIndex(ms=>elapsed>=ms))];
    const scale=.60+.30*clamp((target.y-288)/235);
    const size=SIZE*scale;
    const x=target.x-dir*size*.62,y=target.y+size*.09;
    g.save();
    g.globalAlpha*=Math.min(clamp(elapsed/170),clamp((DURATION-elapsed)/330));
    frame(g,pose,x,y,size,dir,.90,TAIL_REACH[pose]);
    g.restore();
    strike(g,target.x,target.y-70*scale,dir,elapsed-IMPACT);
  }

  function portrait(g,width,height){
    const size=Math.min(width,height)*1.1;
    frame(g,15,width/2,height/2,size,1,.50);
  }

  window.LandRay={draw,portrait};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
