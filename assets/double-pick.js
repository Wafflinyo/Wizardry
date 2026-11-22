(()=>{
  const art=new Image();
  art.src="./assets/double-pick-frames.webp?v=0.290.7";
  const CELL=256, CENTER=500, GROUND=510, DURATION=5560;
  const RELEASES=[2730,4380];
  const POSE_TIMES=[
    0,270,590,990,1480,1700,1870,2070,2320,2550,
    2730,2820,2940,3070,3200,3330,
    3460,3580,3690,3800,3920,4030,4150,4290,
    4380,4490,4610,4730,4880,5030,5170,5310
  ];
  // Each fist has a grip only until its corresponding pick launches.
  const RIGHT_GRIPS=[[94, 175], [65, 154], [59, 153], [55, 151], [75, 130], [62, 126], [44, 120], [78, 26], [85, 26], [117, 20]];
  const LEFT_GRIPS=[[210, 175], [202, 157], [208, 155], [212, 155], [201, 154], [205, 154], [204, 154], [207, 154], [201, 153], [199, 154], [182, 150], [208, 156], [202, 158], [205, 158], [205, 162], [207, 164], [207, 177], [211, 129], [204, 89], [184, 42], [201, 50], [89, 22], [113, 19], [204, 98]];
  const RELEASE_ORIGINS=[[91, 142], [109, 161]];
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

  function actorFrame(g,pose,x,y,size,dir,lean=0){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(dir*size/CELL,size/CELL);
    g.rotate(lean);
    const left=pose%4*CELL,top=Math.floor(pose/4)*CELL;
    const offsetX=-CELL/2,offsetY=-CELL*.90;
    g.drawImage(art,left,top,CELL,CELL,offsetX,offsetY,CELL,CELL);
    const grips=[LEFT_GRIPS[pose],RIGHT_GRIPS[pose]].filter(Boolean);
    for(const [gx,gy] of grips)heldPick(g,gx+offsetX,gy+offsetY);
    // Repaint the fists over the handles so the fingers close around each grip.
    for(const [gx,gy] of grips){
      g.save();
      g.beginPath();
      g.ellipse(gx+offsetX,gy+offsetY,12,10,-.22,0,Math.PI*2);
      g.clip();
      g.drawImage(art,left,top,CELL,CELL,offsetX,offsetY,CELL,CELL);
      g.restore();
    }
    g.restore();
  }

  function throwLean(elapsed,index){
    const release=RELEASES[index];
    const load=clamp((elapsed-(release-670))/670);
    const follow=clamp((elapsed-release)/330);
    return elapsed<release?-.065*Math.sin(load*Math.PI/2):
      (-.065*Math.cos(follow*Math.PI)+.026*Math.sin(follow*Math.PI))*(1-follow);
  }

  function caster(g,elapsed,dir,hasSecondTarget){
    const pose=Math.max(0,POSE_TIMES.findLastIndex(ms=>elapsed>=ms));
    g.save();
    g.globalAlpha*=Math.min(clamp(elapsed/220),clamp((DURATION-elapsed)/420));
    g.beginPath();
    g.ellipse(CENTER,GROUND,38,8,0,0,Math.PI*2);
    g.fillStyle="rgba(8, 31, 50, .34)";
    g.fill();
    const lean=elapsed<3120?throwLean(elapsed,0):hasSecondTarget?throwLean(elapsed,1):0;
    actorFrame(g,hasSecondTarget?pose:Math.min(pose,15),CENTER,GROUND,ACTOR_SIZE,dir,lean);
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
      frame(g,age<.45?33:34,tx,ty,138+age*53,dir);
      g.restore();
      return;
    }
    const t=clamp((elapsed-release)/(hit-release));
    const [handX,handY]=RELEASE_ORIGINS[index];
    const lean=throwLean(release,index);
    const sx=CENTER+dir*(handX*Math.cos(lean)+handY*Math.sin(lean));
    const sy=GROUND+handX*Math.sin(lean)-handY*Math.cos(lean);
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
    frame(g,32,0,0,199);
    g.restore();
  }

  function portrait(g,width,height){
    const size=Math.min(width,height);
    actorFrame(g,3,width/2,height*.95,size*1.02,1);
  }
  window.DoublePick={caster,projectile,portrait,ground:GROUND};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
