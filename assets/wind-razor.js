(()=>{
  const art=new Image(),wind=new Image();
  art.src="./assets/wind-razor-frames.webp?v=0.285.0";
  wind.src="./assets/wind-blast-frames.webp?v=0.284.10";

  const CENTER=500, GROUND=411, SIZE=230, RELEASE=.64;
  const clamp=n=>Math.min(1,Math.max(0,n));
  function frame(g,sheet,index,x,y,width,height,dir){
    if(!sheet.complete||!sheet.naturalWidth)return;
    g.save();
    g.translate(x,y);g.scale(dir,1);
    g.drawImage(sheet,index%4*192,Math.floor(index/4)*192,192,192,-width/2,-height/2,width,height);
    g.restore();
  }
  function caster(g,p,dir){
    const pose=p<RELEASE?Math.min(9,Math.floor(p/RELEASE*10)):
      Math.min(14,10+Math.floor((p-RELEASE)/(1-RELEASE)*7));
    g.save();
    g.globalAlpha*=Math.min(clamp(p/.055),clamp((1-p)/.14));
    frame(g,art,pose,CENTER,GROUND-SIZE/2,SIZE,SIZE,dir);
    g.restore();
  }
  function ring(g,front,rotation){
    g.save();g.rotate(rotation);
    for(let i=front?0:12;i<(front?12:24);i++){
      const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
      g.beginPath();
      g.moveTo(Math.cos(a)*49,Math.sin(a)*13);
      g.lineTo(Math.cos(b)*49,Math.sin(b)*13);
      g.lineTo(Math.cos(b)*43,Math.sin(b)*9);
      g.lineTo(Math.cos(a)*43,Math.sin(a)*9);
      g.closePath();
      g.fillStyle=front?(i%2?"#d6fff1":"#f1fffa"):(i%2?"#76b9aa":"#acdfcb");
      g.fill();
    }
    g.restore();
  }
  function projectile(g,p,dir,target,hit){
    if(p<RELEASE)return;
    const tx=target.x,ty=target.y-62;
    if(p>=hit){
      const age=clamp((p-hit)/(1-hit));
      frame(g,wind,Math.min(15,12+Math.floor(age*4)),tx,ty,168,168,dir);
      return;
    }
    const travel=clamp((p-RELEASE)/(hit-RELEASE));
    const t=travel**1.5;
    const x=CENTER+93*dir+(tx-CENTER-93*dir)*t;
    const y=248+(ty-248)*t-12*Math.sin(Math.PI*t);
    g.save();g.translate(x,y);g.scale(dir,1);
    const tilt=-.29+Math.sin(travel*Math.PI)*.12;
    ring(g,false,tilt);
    frame(g,wind,8+Math.min(3,Math.floor(travel*4)),0,0,83,83,1);
    ring(g,true,tilt);
    g.restore();
  }
  function portrait(g,width,height){
    const size=Math.min(width,height)*.93;
    frame(g,art,7,width/2,height/2,size,size,1);
  }
  window.WindRazor={caster,projectile,portrait};
  art.addEventListener("load",()=>window.WIZARDRY_ARENA_TEST?.drawCardArts());
})();
