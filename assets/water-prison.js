(()=>{
  const art=new Image();
  art.src="./assets/water-prison.webp?v=0.286.0";
  const CELL=256, LOOP=[4,5,6,7,8,9,10,11,10,9,8,7,6,5];
  const clamp=n=>Math.min(1,Math.max(0,n));

  function frame(g,index,x,y,width,height){
    if(!art.complete||!art.naturalWidth)return;
    g.drawImage(art,index%4*CELL,Math.floor(index/4)*CELL,CELL,CELL,x,y,width,height);
  }

  function draw(g,{target,time,growth=1,release=0,layer}){
    if(release>=1)return;
    const index=release>0?12+Math.min(3,Math.floor(release*4)):
      growth<1?Math.min(3,Math.floor(growth*4)):LOOP[Math.floor(time/105)%LOOP.length];
    const scale=.60+.30*clamp((target.y-288)/235);
    const width=257*scale,height=269*scale;
    // The front sheet is translucent so the target remains visible behind it.
    g.save();
    g.globalAlpha*=(layer==="back"?.82:.38)*(release>0?1-release*.72:1);
    frame(g,index,target.x-width/2,target.y-height*.92,width,height);
    g.restore();
  }

  function portrait(g,width,height){
    const size=Math.min(width,height)*.95;
    frame(g,5,(width-size)/2,(height-size)/2,size,size);
  }
  window.WaterPrison={draw,portrait};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
