(()=>{
  const art=new Image();
  art.src="./assets/groveland-frames.webp?v=0.292.0";
  const SWAY=[4,5,6,7,6,5];
  const BANDS=[
    {y:.53,scale:.17,count:8},
    {y:.74,scale:.24,count:6},
    {y:.97,scale:.32,count:5}
  ];

  function frame(g,index,x,y,width,height){
    if(!art.complete||!art.naturalWidth)return;
    g.drawImage(art,index%4*288,Math.floor(index/4)*224,288,224,x,y,width,height);
  }

  function draw(g,{width,height,time,strength=1}){
    g.save();
    g.globalAlpha*=strength;
    const tint=g.createLinearGradient(0,0,0,height);
    tint.addColorStop(0,"#12361983");
    tint.addColorStop(.46,"#21542780");
    tint.addColorStop(1,"#234e20b6");
    g.fillStyle=tint;
    g.fillRect(0,0,width,height);

    const beat=Math.floor(time/160);
    for(const [row,band] of BANDS.entries()){
      for(let i=0;i<band.count;i++){
        const index=strength<1?Math.min(3,Math.floor(strength*4)):SWAY[(beat+i+row*2)%SWAY.length];
        const w=width*band.scale*(.78+.1*((i+2*row)%4));
        const h=height*band.scale*(.73+.11*((i+row)%3));
        const x=width*(i+.12+(row%2)*.34)/band.count-w*.4;
        frame(g,index,x,height*band.y-h*.83,w,h);
      }
    }
    g.restore();
  }
  window.Groveland={draw,portrait(g,width,height){
    g.fillStyle="#183a21";
    g.fillRect(0,0,width,height);
    frame(g,4,-width*.09,-height*.18,width*1.18,height*1.35);
  }};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
