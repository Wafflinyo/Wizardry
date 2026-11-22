(()=>{
  const art=new Image();
  art.src="./assets/aromatherapy-frames.webp?v=0.293.0";
  function frame(g,index,x,y,width,height,dir){
    if(!art.complete||!art.naturalWidth)return;
    g.save();
    g.translate(x,y);
    g.scale(-dir,1);
    g.drawImage(art,index%4*288,Math.floor(index/4)*224,288,224,-width/2,-height/2,width,height);
    g.restore();
  }
  function draw(g,allies,progress,dir){
    if(!allies.length)return;
    const xs=allies.map(u=>u.x),ys=allies.map(u=>u.y);
    const min=Math.min(...xs),max=Math.max(...xs);
    const start=dir===1?min-120:max+120,end=dir===1?max+125:min-125;
    const x=start+(end-start)*progress;
    const y=(Math.min(...ys)+Math.max(...ys))/2-90;
    const height=Math.max(165,Math.max(...ys)-Math.min(...ys)+140);
    const index=Math.min(7,Math.floor(progress*8));
    g.save();
    g.globalAlpha*=Math.min(1,progress*9,(1-progress)*7);
    frame(g,index,x,y,Math.max(260,max-min+160),height,dir);
    g.restore();
  }
  window.Aromatherapy={draw,portrait(g,w,h){frame(g,3,w/2,h*.46,w,h,1);}};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
