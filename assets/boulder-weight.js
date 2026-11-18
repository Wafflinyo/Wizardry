(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/boulder-weight.webp';
  function piece(g,i,x,y,w,h){
    if(atlas.naturalWidth)g.drawImage(atlas,i*256,0,256,256,x-w/2,y-h/2,w,h);
  }
  function draw(g,u,p,time){
    const scale=.60+.30*Math.max(0,Math.min(1,(u.y-288)/235));
    g.save();g.translate(u.x,u.y);g.scale(u.team?-scale:scale,scale);
    for(const side of [-1,1]){
      const q=Math.min(1,Math.max(0,(p-(side>0?.12:0))/.88)),slide=(1-q)**2;
      g.save();g.globalAlpha*=Math.min(1,q*4);
      const raise=u.dummy?0:(u.armRaise||0);
      g.translate(side*(24+58*slide),-126-65*slide+(u.dummy?13:0));
      g.rotate(side*(slide*.8+(side>0?-raise*.95:.09)));
      piece(g,2,side*7,24,31,48);
      piece(g,side<0?0:1,0,0,48,43);
      g.restore();
    }
    g.restore();
  }
  window.BoulderWeight={draw,portrait:(g,w,h)=>piece(g,3,w/2,h/2,Math.min(w,h),Math.min(w,h)),onReady:fn=>atlas.naturalWidth?fn():listeners.push(fn)};
})();
