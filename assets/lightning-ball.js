(()=>{
  const atlas=new Image(),listeners=[];
  atlas.onload=()=>listeners.splice(0).forEach(fn=>fn());
  atlas.src='./assets/lightning-ball.webp?v=0.212.0';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const launch=.24;
  function sprite(g,index,x,y,size){
    if(!atlas.naturalWidth)return;
    const tile=atlas.naturalWidth/4;
    g.drawImage(atlas,index%4*tile,Math.floor(index/4)*tile,tile,tile,x-size/2,y-size/2,size,size);
  }
  function orb(g,x,y,frame,size){
    g.save();
    g.globalCompositeOperation='lighter';
    const glow=g.createRadialGradient(x,y,0,x,y,size*.47);
    glow.addColorStop(0,'#fff3a46b');glow.addColorStop(1,'#ffbe0000');
    g.fillStyle=glow;g.fillRect(x-size/2,y-size/2,size,size);
    g.restore();
    sprite(g,frame,x,y,size);
  }
  function draw(g,{target,chain,progress:p,hit}){
    const origin={x:500,y:346,at:launch};
    const points=chain?.length?chain:[{x:target.x,y:target.y,at:hit}];
    g.save();
    if(p<launch){
      const q=clamp(p/launch);
      g.globalAlpha=clamp(q*3);
      orb(g,origin.x,origin.y,Math.min(3,Math.floor(q*4)),64+q*105);
    }
    for(const [i,to] of points.entries()){
      const prior=points[i-1],from=prior?{x:prior.x,y:prior.y-73,at:prior.at+.017}:origin;
      const ty=to.y-73;
      if(p>=from.at&&p<to.at){
        const q=clamp((p-from.at)/(to.at-from.at));
        const t=q*(.76+.24*q),x=mix(from.x,to.x,t),y=mix(from.y,ty,t)-Math.sin(Math.PI*t)*(i?26:9);
        g.globalAlpha=1;
        g.strokeStyle='#e3b947';g.lineWidth=4;g.beginPath();g.moveTo(x,y);
        for(let j=1;j<=6;j++){
          const back=clamp(t-j*.025);
          g.lineTo(mix(from.x,to.x,back),mix(from.y,ty,back)-Math.sin(Math.PI*back)*(i?26:9)+Math.sin(p*650+j*2)*j*1.8);
        }
        g.stroke();
        orb(g,x,y,2+Math.floor(p*47)%2,Math.max(99,156-i*12));
      }
      const age=(p-to.at)/.14;
      if(age>=0&&age<1&&to.done){
        g.globalAlpha=(1-age)**1.1;
        sprite(g,4+Math.min(3,Math.floor(age*4)),to.x,ty,112+age*124);
      }
    }
    g.restore();
  }
  window.LightningBall={
    draw,depth({target,chain,progress}){
      const active=chain?.find(entry=>entry.at>progress)??chain?.at(-1)??target;
      return active.y+.16;
    },
    onReady(fn){if(atlas.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){sprite(g,2,w/2,h/2,Math.min(w,h)*1.06);}
  };
})();
