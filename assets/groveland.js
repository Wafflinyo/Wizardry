(()=>{
  const art=new Image(),meadow=new Image();
  art.src="./assets/groveland-frames.webp?v=0.292.0";
  meadow.src="./assets/groveland-arena.webp?v=0.292.2";
  const SWAY=[4,5,6,7,6,5];
  // Positions are anchored to the painted arena surface, with varied depth and spacing.
  const FERNS=[
    [.16,.55,.088],[.29,.53,.048],[.68,.52,.052],[.85,.57,.087],
    [.095,.70,.12],[.27,.70,.053],[.64,.65,.046],[.91,.73,.095],
    [.20,.83,.105],[.39,.79,.057],[.62,.86,.069],[.79,.85,.11],[.47,.92,.12]
  ];

  function frame(g,index,x,y,width,height){
    if(!art.complete||!art.naturalWidth)return;
    g.drawImage(art,index%4*288,Math.floor(index/4)*224,288,224,x,y,width,height);
  }

  function landscape(g,{x,y,width,height,time,strength}){
    g.save();
    g.globalAlpha*=strength;
    if(meadow.complete&&meadow.naturalWidth)g.drawImage(meadow,x,y,width,height);
    const beat=Math.floor(time/160);
    for(const [i,[u,v,size]] of FERNS.entries()){
      const index=strength<1?Math.min(3,Math.floor(strength*4)):SWAY[(beat+i*2)%SWAY.length];
      const w=width*size,h=w*224/288;
      frame(g,index,x+u*width-w*.5,y+v*height-h*.82,w,h);
    }
    g.restore();
  }
  window.Groveland={landscape,portrait(g,width,height){
    if(meadow.complete&&meadow.naturalWidth){
      g.drawImage(meadow,178,276,644,344,0,0,width,height);
    }else{
      g.fillStyle="#183a21";
      g.fillRect(0,0,width,height);
      frame(g,4,-width*.09,-height*.18,width*1.18,height*1.35);
    }
  }};
  meadow.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
