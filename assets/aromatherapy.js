(()=>{
  const art=new Image();
  art.src="./assets/aromatherapy-frames.webp?v=0.293.1";
  function frame(g,index,x,y,width,height){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.drawImage(art,index%4*288,Math.floor(index/4)*224,288,224,-width/2,-height/2,width,height);
    g.restore();
  }
  function draw(g,allies,progress){
    if(!allies.length)return;
    const xs=allies.map(u=>u.x),ys=allies.map(u=>u.y);
    const left=Math.min(...xs),right=Math.max(...xs);
    const front=Math.max(...ys),back=Math.min(...ys);
    const x=(left+right)/2;
    const start=front+35,end=back-190;
    const y=start+(end-start)*progress;
    const index=Math.min(7,Math.floor(progress*8));
    g.save();
    g.globalAlpha*=Math.min(1,progress*9,(1-progress)*7);
    frame(g,index,x,y,Math.max(240,right-left+180),165);
    g.restore();
  }
  window.Aromatherapy={draw,portrait(g,w,h){frame(g,3,w/2,h*.46,w,h);}};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
