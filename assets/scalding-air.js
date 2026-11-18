(()=>{
  const art=new Image(),ready=[];
  art.onload=()=>ready.splice(0).forEach(fn=>fn());
  art.src='./assets/scalding-air.webp?v=0.197.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  function ribbon(g,x,y,length,width,phase,color){
    g.fillStyle=color;
    g.beginPath();
    g.moveTo(x,y);
    g.bezierCurveTo(x-length*.24,y-width*1.6,x-length*.59,y+phase,x-length,y+phase*.6);
    g.bezierCurveTo(x-length*.66,y+phase*.92+width,x-length*.23,y+width*.82,x,y);
    g.fill();
  }
  function draw(g,{caster,target,progress:p,hit}){
    const travel=clamp((p-.40)/.29);
    const contact=(hit-.40)/.29;
    const dir=target.x>=caster.x?1:-1;
    const distance=Math.min(265,Math.max(148,Math.abs(target.x-caster.x)*.67));
    const head=(travel/contact-1)*distance;
    const height=target.y-72;
    g.save();
    g.translate(target.x,height);
    g.scale(dir,1);
    if(p>=.40&&p<.79){
      g.globalAlpha=clamp((p-.40)/.035)*clamp((.79-p)/.12);
      for(let i=0;i<9;i++){
        const phase=p*143+i*1.7;
        const y=(i-4)*6+Math.sin(phase)*5;
        const x=head-i%3*18;
        const length=108+(i%4)*28;
        ribbon(g,x,y,length,4+(i%3)*2,Math.sin(phase)*10,i%2?'#ff6d22c4':'#f73d22a0');
        ribbon(g,x-10,y,length*.74,2.3,Math.sin(phase)*7,i%2?'#ffce68':'#ff923b');
      }
      for(let i=0;i<11;i++){
        const drift=(i*.618+p*7)%1;
        const x=head-27-drift*206;
        const y=(i%5-2)*10-drift*19+Math.sin(p*110+i)*4;
        ribbon(g,x,y,24+drift*53,2.5+drift*4,-8-drift*12,'#ffe3c899');
      }
    }
    if(p>=hit){
      const age=clamp((p-hit)/(1-hit));
      for(let i=0;i<15;i++){
        const spread=1-(1-age)**2;
        const x=(17+i%6*17)*spread;
        const y=(i%7-3)*13*spread-33*age;
        g.globalAlpha=(1-age)**2;
        ribbon(g,x,y,15+(i%3)*8,2+i%4,(i%5-2)*7,i%3?'#ffad49':'#fff1d8');
      }
    }
    g.restore();
  }
  window.ScaldingAir={
    draw,
    onReady(fn){if(art.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){
      if(!art.naturalWidth)return;
      const scale=Math.min(w/art.naturalWidth,h/art.naturalHeight);
      const width=art.naturalWidth*scale,height=art.naturalHeight*scale;
      g.drawImage(art,(w-width)/2,(h-height)/2,width,height);
    }
  };
})();
