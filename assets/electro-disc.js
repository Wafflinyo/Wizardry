(()=>{
  const atlas=new Image(),reveal=new Image(),listeners=[];
  reveal.onload=()=>listeners.splice(0).forEach(fn=>fn());
  reveal.src='./assets/electro-disc-reveal.webp?v=0.192.0';
  atlas.src='./assets/electro-disc.webp?v=0.190.0';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const mix=(a,b,p)=>a+(b-a)*p;
  const tau=Math.PI*2;
  const size=169;
  const revealTimes=[0,.062,.112,.165,.215,.268,.367,.409];
  const flipTimes=[.43,.46,.49,.54,.60,.67,.73,.79,.83,.88,.94];
  const releaseOffsets=[[60,34],[66,-38],[56,26]].map(pair=>pair.map(value=>value*size/157));
  function frame(g,sheet,index,x,y,width){
    if(!sheet.naturalWidth)return;
    const tile=sheet.naturalWidth/4;
    g.drawImage(sheet,index%4*tile,Math.floor(index/4)*tile,tile,tile,x,y,width,width);
  }
  function position(p,dir){
    const jump=clamp((p-.46)/.42);
    return {x:500+dir*mix(-33,53,jump),y:510-size*.48-146*Math.sin(Math.PI*jump)};
  }
  function disk(g,x,y,r,phase){
    g.save();
    g.translate(x,y);
    g.rotate(Math.sin(phase)*.35);
    g.scale(1,.38+.44*Math.abs(Math.cos(phase)));
    g.shadowColor='#20e7ff';
    g.shadowBlur=13;
    g.fillStyle='#073a5277';
    g.strokeStyle='#34eaff';
    g.lineWidth=3;
    g.beginPath();g.arc(0,0,r,0,tau);g.fill();g.stroke();
    g.shadowBlur=0;
    g.strokeStyle='#e4ffff';g.lineWidth=1.5;
    g.beginPath();g.arc(0,0,r*.77,phase,phase+Math.PI*1.43);g.stroke();
    g.restore();
  }
  function actor(g,{progress:p,target}){
    const dir=target.x>=500?1:-1;
    const {x,y}=position(p,dir);
    const revealing=p<flipTimes[0];
    const pose=revealing?revealTimes.findLastIndex(time=>p>=time):5+flipTimes.findLastIndex(time=>p>=time);
    g.save();
    g.translate(x,y);
    g.scale(dir,1);
    g.globalAlpha=Math.min(clamp(p/.055),clamp((1-p)/.055));
    frame(g,revealing?reveal:atlas,pose,-size/2,-size/2,size);
    g.restore();
  }
  function trajectory({progress:p,target,releases,hits},index){
    const dir=target.x>=500?1:-1;
    const start=position(releases[index],dir);
    const [ox,oy]=releaseOffsets[index];
    const q=clamp((p-releases[index])/(hits[index]-releases[index]));
    return {
      x:mix(start.x+dir*ox,target.x,q),
      y:mix(start.y+oy,target.y-71,q),
      depth:mix(510,target.y,q)+.25
    };
  }
  function lightningTrail(g,opts,index,x,y){
    const elapsed=opts.progress-opts.releases[index];
    const tail=trajectory({...opts,progress:opts.progress-Math.min(elapsed,.035)},index);
    const dx=x-tail.x,dy=y-tail.y,length=Math.hypot(dx,dy);
    if(length<2)return;
    const nx=-dy/length,ny=dx/length;
    const phase=opts.progress*630;
    const points=Array.from({length:10},(_,i)=>{
      const t=i/9;
      const offset=Math.sin(i*9.7+phase)*Math.sin(Math.PI*t)*Math.min(11,length*.25);
      return [x-dx*t+nx*offset,y-dy*t+ny*offset];
    });
    const glow=g.createLinearGradient(x,y,tail.x,tail.y);
    glow.addColorStop(0,'#1bdcff');
    glow.addColorStop(.58,'#0779ffb0');
    glow.addColorStop(1,'#0779ff00');
    g.beginPath();
    g.moveTo(x,y);
    for(const [px,py] of points.slice(1))g.lineTo(px,py);
    g.strokeStyle=glow;g.lineWidth=7;g.stroke();
    const core=g.createLinearGradient(x,y,tail.x,tail.y);
    core.addColorStop(0,'#edffff');
    core.addColorStop(.52,'#9cfaff');
    core.addColorStop(1,'#3ecaff00');
    g.strokeStyle=core;g.lineWidth=1.8;g.stroke();
    for(const i of [2,4,6]){
      const [px,py]=points[i];
      const fork=10*Math.sin(phase*1.3+i);
      g.globalAlpha=.48;
      g.beginPath();g.moveTo(px,py);
      g.lineTo(px-dx*.10+nx*fork,py-dy*.10+ny*fork);
      g.lineTo(px-dx*.21+nx*fork*.7,py-dy*.21+ny*fork*.7);
      g.stroke();
    }
    // Sparks peel away from the bolt and race back along its wake.
    for(let i=0;i<7;i++){
      const t=(elapsed*65+i/7)%1;
      const offset=(i%2===0?1:-1)*t*(6+i*1.8);
      const px=x-dx*t+nx*offset,py=y-dy*t+ny*offset;
      g.globalAlpha=(1-t)*.82;
      g.strokeStyle=i%2===0?'#e4ffff':'#49bfff';
      g.lineWidth=1.2;
      g.beginPath();
      g.moveTo(px,py);
      g.lineTo(px-dx*(.05+t*.08)+nx*offset*.36,py-dy*(.05+t*.08)+ny*offset*.36);
      g.stroke();
    }
    g.globalAlpha=1;
  }
  function projectile(g,opts,index){
    const {progress:p,releases,hits}=opts;
    if(p<releases[index]||p>hits[index]+.10)return;
    const {x,y}=trajectory(opts,index);
    g.save();
    if(p<hits[index]){
      lightningTrail(g,opts,index,x,y);
      disk(g,x,y,17,p*92);
    }else{
      const q=clamp((p-hits[index])/.10);
      g.globalAlpha=1-q;
      g.strokeStyle='#8efaff';g.lineWidth=2.3*(1-q);
      for(let i=0;i<8;i++){
        const angle=i*tau/8+index*.5,dx=Math.cos(angle),dy=Math.sin(angle);
        const radius=6+q*(23+(i%3)*9);
        g.beginPath();
        g.moveTo(x+dx*radius*.50,y+dy*radius*.50);
        g.lineTo(x+dx*radius*.75-dy*6,y+dy*radius*.75+dx*6);
        g.lineTo(x+dx*radius,y+dy*radius);
        g.stroke();
      }
    }
    g.restore();
  }
  window.ElectroDisc={
    actor,projectile,depth:(opts,index)=>trajectory(opts,index).depth,
    onReady(fn){if(reveal.naturalWidth)fn();else listeners.push(fn);},
    portrait(g,w,h){
      const width=Math.min(w,h)*1.17;
      frame(g,reveal,5,(w-width)/2,(h-width)/2,width);
    }
  };
})();
