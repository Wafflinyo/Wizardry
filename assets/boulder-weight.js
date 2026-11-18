(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/boulder-weight.webp';
  function piece(g,i,x,y,w,h){
    if(atlas.naturalWidth)g.drawImage(atlas,i*256,0,256,256,x-w/2,y-h/2,w,h);
  }
  // Coordinates on the 128px wizard tiles: shoulder, elbow and wrist.
  const idleY=[0,-1,-1,-3,-4,-3,-1,1,1,1,2,2];
  const cast=[
    [57,65,62,76,71,74],[57,65,62,76,71,74],[57,65,63,76,73,74],[56,65,66,75,82,67],
    [57,66,71,76,85,72],[57,66,72,74,86,66],[57,66,69,69,82,58],[57,65,69,65,79,52],
    [58,65,70,63,81,48],[58,65,70,65,79,53],[57,66,69,70,81,60],[57,66,71,76,85,70],
    [56,66,68,76,80,74],[57,65,63,76,73,74],[57,65,62,76,71,74],[57,65,62,76,71,74]
  ];
  function equip(g,p,sx,sy,ex,ey,wx,wy,size){
    if(p<=0)return;
    const lift=(1-p)**2;
    g.save();g.translate(20*lift,-35*lift);g.globalAlpha*=Math.min(1,p*3);
    g.save();g.translate(ex+(wx-ex)*.46,ey+(wy-ey)*.46);
    g.rotate(Math.atan2(wy-ey,wx-ex)-Math.PI/2+.32);
    piece(g,2,0,0,size*.65,Math.hypot(wx-ex,wy-ey)*.96);g.restore();
    piece(g,0,sx,sy,size,size*.83);g.restore();
  }
  function sprite(g,p,i){
    const y=idleY[i]||0;
    equip(g,p,...(i<12?[66,64+y,73,75+y,84,72+y]:cast[i-12]),21);
  }
  window.BoulderWeight={equip,sprite,portrait:(g,w,h)=>piece(g,3,w/2,h/2,Math.min(w,h),Math.min(w,h)),onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn)};
})();
