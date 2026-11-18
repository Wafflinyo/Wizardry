(()=>{
  const atlas=new Image(),reveal=new Image(),listeners=[];
  reveal.onload=()=>listeners.splice(0).forEach(fn=>fn());
  reveal.src='./assets/electro-disc-reveal.webp?v=0.192.0';
  atlas.src='./assets/electro-disc.webp?v=0.190.0';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const mix=(a,b,p)=>a+(b-a)*p;
  const tau=Math.PI*2;
  const size=157;
  const revealTimes=[0,.062,.112,.165,.215,.268,.367,.409];
  const flipTimes=[.43,.46,.49,.54,.60,.67,.73,.79,.83,.88,.94];
  const releaseOffsets=[[60,34],[66,-38],[56,26]];
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
      y:mix(start.y+oy,target.y-71,q)-Math.sin(Math.PI*q)*(13+index*5),
      depth:mix(510,target.y,q)+.25
    };
  }
  function projectile(g,opts,index){
    const {progress:p,releases,hits}=opts;
    if(p<releases[index]||p>hits[index]+.10)return;
    const {x,y}=trajectory(opts,index);
    g.save();
    if(p<hits[index]){
      for(let i=4;i>0;i--){
        const trail=trajectory({...opts,progress:p-i*.006},index);
        g.globalAlpha=(5-i)*.10;
        disk(g,trail.x,trail.y,12-i*.9,p*92-i*.6);
      }
      g.globalAlpha=1;
      disk(g,x,y,15,p*92);
    }else{
      const q=clamp((p-hits[index])/.10);
      g.globalAlpha=1-q;
      disk(g,x,y,13+40*q,q*8);
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
