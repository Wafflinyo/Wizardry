(()=>{
  const fract=value=>value-Math.floor(value);
  const noise=seed=>fract(Math.sin(seed*127.1+311.7)*43758.5453);
  const clouds=Array.from({length:30},(_,i)=>({
    x:noise(i+1),y:noise(i+41),depth:noise(i+83),width:noise(i+125)
  }));

  function bolt(g,x,y,dx,dy,seed){
    g.save();
    g.lineJoin="round";
    g.beginPath();
    g.moveTo(x,y);
    for(let i=1;i<7;i++){
      const t=i/7,offset=(noise(seed+i)-.5)*.24;
      g.lineTo(x+dx*t+dy*offset,y+dy*t-dx*offset);
    }
    g.lineTo(x+dx,y+dy);
    g.strokeStyle="#9b5dff";
    g.lineWidth=5;
    g.stroke();
    g.strokeStyle="#f3daff";
    g.lineWidth=1.5;
    g.stroke();
    g.restore();
  }

  function draw(g,{x=0,y=0,width,height,time,strength=1}){
    if(strength<=0)return;
    g.save();
    g.translate(x,y);
    g.globalAlpha*=strength;
    const sky=g.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,"#210c43ed");
    sky.addColorStop(.55,"#422170a6");
    sky.addColorStop(1,"#6d348f65");
    g.fillStyle=sky;
    g.fillRect(0,0,width,height);

    for(const [i,cloud] of clouds.entries()){
      const cx=(fract(cloud.x+time*(.000018+cloud.depth*.000019))*1.4-.2)*width;
      const cy=(.03+cloud.y*.62)*height;
      const rx=(.10+cloud.width*.16)*width,ry=(.035+cloud.depth*.04)*height;
      g.fillStyle=["#37234f87","#48306370","#2b173d83","#8253a344"][i%4];
      g.beginPath();
      g.moveTo(cx-rx,cy);
      g.lineTo(cx-rx*.68,cy-ry*.66);
      g.lineTo(cx-rx*.08,cy-ry);
      g.lineTo(cx+rx*.45,cy-ry*.76);
      g.lineTo(cx+rx,cy+ry*.13);
      g.lineTo(cx+rx*.42,cy+ry*.83);
      g.lineTo(cx-rx*.32,cy+ry*.7);
      g.closePath();
      g.fill();
    }

    for(let i=0;i<15;i++){
      const step=time*(.0015+i*.00009)+i*.619;
      const age=fract(step);
      if(age>.24)continue;
      const seed=i*173+Math.floor(step)*39;
      const sx=width*(.04+noise(seed)*.9),sy=height*(.14+noise(seed+7)*.8);
      g.save();
      g.globalAlpha*=Math.sin(Math.PI*age/.24)*.82;
      bolt(g,sx,sy,(noise(seed+11)-.5)*width*.17,height*(.04+noise(seed+19)*.10),seed);
      g.restore();
    }
    g.restore();
  }

  function shock(g,target,time){
    const seed=Math.floor(time/95)*17;
    g.save();
    g.globalAlpha*=.86;
    for(let i=0;i<4;i++)bolt(g,target.x-56+i*34,target.y-160+(i%2)*25,33-i*22,118,seed+i*31);
    g.restore();
  }

  window.LightningField={draw,shock,portrait(g,width,height){
    draw(g,{width,height,time:940});
    bolt(g,width*.64,height*.07,-width*.24,height*.77,21);
    bolt(g,width*.21,height*.22,width*.12,height*.55,83);
  }};
})();
