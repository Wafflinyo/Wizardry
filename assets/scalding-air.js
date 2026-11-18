(()=>{
  const art=new Image(),gust=new Image(),ready=[];
  art.onload=()=>ready.splice(0).forEach(fn=>fn());
  art.src='./assets/scalding-air.webp?v=0.197.0';
  gust.src='./assets/scalding-gust.webp?v=0.198.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const poses=[
    {time:0,tip:.65}, {time:.13,tip:.72}, {time:.26,tip:.86}, {time:.35,tip:.95},
    {time:.53,tip:.96}, {time:.67,tip:.97}, {time:.78,tip:.94}, {time:.90,tip:.95}
  ];
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
