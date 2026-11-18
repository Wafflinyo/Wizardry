(()=>{
  const gust=new Image(),ready=[];
  gust.onload=()=>ready.splice(0).forEach(fn=>fn());
  gust.src='./assets/scalding-gust.webp?v=0.198.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const poses=[
    {time:0,tip:.65}, {time:.13,tip:.72}, {time:.26,tip:.86}, {time:.35,tip:.95},
    {time:.53,tip:.96}, {time:.67,tip:.97}, {time:.78,tip:.94}, {time:.90,tip:.95}
  ];
  function drawScorch(g,age){
    const heat=(1-age)**2;
    g.save();
    g.globalCompositeOperation="lighter";
    const flare=g.createRadialGradient(2,0,1,2,0,24+age*18);
    flare.addColorStop(0,"#fff3b5c0");
    flare.addColorStop(.30,"#ff6c30a0");
    flare.addColorStop(1,"#ff2d0800");
    g.globalAlpha=heat;
    g.fillStyle=flare;
    g.fillRect(-43,-43,88,86);
    for(let i=0;i<19;i++){
      const t=clamp((age-i%4*.047)/.85);
      if(t<=0)continue;
      const angle=i*2.39996;
      const range=(28+i%6*12)*(1-(1-t)**2);
      const dx=Math.cos(angle),dy=Math.sin(angle);
      const x=dx*range*.74+t*32,y=dy*range*.8-t*29+t*t*15;
      const length=(5+i%4*3)*(1-t);
      const vx=dx*.72+.38,vy=dy*.82-.37;
      g.globalAlpha=(1-t)**2*(.73+.27*Math.sin(i*2+age*49)**2);
      g.fillStyle=["#fff6bd","#ffb349","#ff5726"][i%3];
      g.beginPath();
      g.moveTo(x+vx*length*.35,y+vy*length*.35);
      g.lineTo(x-vy*1.45,y+vx*1.45);
      g.lineTo(x-vx*length,y-vy*length);
      g.lineTo(x+vy*1.45,y-vx*1.45);
      g.closePath();g.fill();
    }
    g.restore();
  }
  function draw(g,{caster,target,progress:p,hit}){
    const start=hit-.19,end=hit+.34;
    if(p<start||p>=end||!gust.naturalWidth)return;
    const travel=clamp((p-start)/(end-start));
    const frame=poses.findLastIndex(pose=>travel>=pose.time);
    const dir=target.x>=caster.x?1:-1;
    const distance=clamp((Math.abs(target.x-caster.x)-110)/450)*93+153;
    const head=p<hit?(p-hit)/.19*distance:(p-hit)/.34*distance*1.35;
    const fade=clamp((p-start)/.024)*clamp((end-p)/.105);
    const width=250+travel*44,height=146+travel*16;
    const tile=gust.naturalWidth/4;
    g.save();
    g.translate(target.x,target.y-72);
    g.scale(dir,1);
    g.globalAlpha=fade;
    g.drawImage(gust,frame%4*tile,Math.floor(frame/4)*tile,tile,tile,
      head-poses[frame].tip*width,-height*.53,width,height);

    // Follow the white-hot leading edge with local light, peaking on contact.
    const flash=1-clamp(Math.abs(p-hit)/.084);
    const light=g.createRadialGradient(head-21,0,1,head-21,0,44+flash*21);
    light.addColorStop(0,"#fff1b5a0");
    light.addColorStop(.36,"#ff9b3780");
    light.addColorStop(1,"#ff4c0800");
    g.globalCompositeOperation="lighter";
    g.globalAlpha=fade*(.45+flash*.55);
    g.fillStyle=light;
    g.fillRect(head-90,-65,138,130);
    const scorch=(p-hit)/.26;
    if(scorch>=0&&scorch<1)drawScorch(g,scorch);
    g.restore();
  }
  window.ScaldingAir={
    draw,
    onReady(fn){if(gust.naturalWidth)fn();else ready.push(fn);},
    portrait(g,w,h){
      if(!gust.naturalWidth)return;
      const tile=gust.naturalWidth/4;
      const width=Math.min(w,h*1.55);
      const height=width/1.55;
      g.drawImage(gust,3*tile,0,tile,tile,(w-width)/2,(h-height)/2,width,height);
    }
  };
})();
